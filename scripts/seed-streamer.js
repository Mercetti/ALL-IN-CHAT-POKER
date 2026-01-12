#!/usr/bin/env node

/**
 * Seed streamer/admin data plus cosmetic catalog so post-deploy checks have
 * something real to exercise.
 *
 * Usage examples:
 *   node scripts/seed-streamer.js
 *   STREAMER_LOGIN=yourchannel SEED_STREAMER_PASSWORD=secret node scripts/seed-streamer.js
 *   fly ssh console -a all-in-chat-poker -C "node scripts/seed-streamer.js"
 */

const path = require('path');
const fs = require('fs');

// Ensure relative requires can locate the root .env when running via Fly SSH
process.chdir(path.join(__dirname, '..'));

const config = require('../server/config');
const db = require('../server/db');
const auth = require('../server/auth');
const { COSMETIC_CATALOG } = require('../server/cosmetic-catalog');

const log = (...args) => console.log('[seed]', ...args);

const streamerLogin = (process.env.SEED_STREAMER_LOGIN || config.STREAMER_LOGIN || 'streamer')
  .trim()
  .toLowerCase();
const streamerDisplayName = process.env.SEED_STREAMER_DISPLAY_NAME || streamerLogin;
const streamerEmail = process.env.SEED_STREAMER_EMAIL || `${streamerLogin}@example.com`;
const streamerPassword = process.env.SEED_STREAMER_PASSWORD || '';
const streamerOverlayPath = process.env.SEED_STREAMER_OVERLAY_FILE || '';
const starterCosmetics = (process.env.SEED_STREAMER_COSMETICS
  || 'card-back-black,avatar-basic-1,table-neon-green')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const adminLogin = (process.env.SEED_ADMIN_LOGIN || config.ADMIN_USERNAME || 'mercetti')
  .trim()
  .toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD || '';

function ensureDatabaseReady() {
  if (db.initialized) return;
  db.init();
}

function ensureCosmeticCatalog() {
  log(`Seeding ${COSMETIC_CATALOG.length} cosmetics into SQLite (idempotent)`);
  db.seedCosmetics(COSMETIC_CATALOG);
}

function ensureStreamerProfile() {
  const existing = db.getProfile(streamerLogin);
  const passwordHash = streamerPassword ? auth.hashPassword(streamerPassword) : (existing?.password_hash || null);

  if (!existing) {
    log(`Creating streamer profile ${streamerLogin}`);
    db.createLocalUser({ login: streamerLogin, email: streamerEmail, password_hash: passwordHash });
  }

  const profile = db.upsertProfile({
    login: streamerLogin,
    display_name: streamerDisplayName,
    email: streamerEmail,
    role: 'streamer',
    password_hash: passwordHash,
    settings: existing?.settings || {},
  });

  log('Streamer profile ready:', { login: profile.login, role: profile.role, email: profile.email });
  return profile;
}

function ensureStreamerCosmetics() {
  if (!starterCosmetics.length) return;
  log(`Granting starter cosmetics: ${starterCosmetics.join(', ')}`);
  db.ensureDefaultCosmetics(streamerLogin, starterCosmetics);

  const slots = new Map();
  starterCosmetics.forEach(id => {
    const item = db.getCosmeticById(id);
    if (!item) return;
    if (!slots.has(item.type)) slots.set(item.type, id);
  });

  Array.from(slots.values()).forEach(itemId => {
    db.equipCosmetic(streamerLogin, itemId);
  });

  const inventory = db.getUserInventory(streamerLogin);
  log('Streamer equipped loadout:', inventory.equipped);
}

function ensureOverlayLoadout() {
  let payload = null;
  if (streamerOverlayPath && fs.existsSync(streamerOverlayPath)) {
    payload = JSON.parse(fs.readFileSync(streamerOverlayPath, 'utf-8'));
  } else if (process.env.SEED_STREAMER_OVERLAY_JSON) {
    payload = JSON.parse(process.env.SEED_STREAMER_OVERLAY_JSON);
  } else {
    payload = {
      tableSkin: 'table-neon-green',
      cardBack: starterCosmetics.find(id => id.startsWith('card-back')) || 'card-back-black',
      avatarRing: starterCosmetics.find(id => id.startsWith('avatar')) || 'avatar-basic-1',
    };
  }

  db.saveOverlayLoadout(streamerLogin, payload);
  log('Overlay loadout saved for', streamerLogin);
}

function ensureAdminUser() {
  if (!adminPassword) {
    log('SEED_ADMIN_PASSWORD not set; skipping admin_users table updates');
    return;
  }

  const hash = auth.hashPassword(adminPassword);
  const existing = db.getAdminUser(adminLogin);
  if (!existing) {
    db.createAdminUser({ login: adminLogin, password_hash: hash, display_name: adminLogin, email: `${adminLogin}@example.com` });
    log(`Admin user ${adminLogin} created in admin_users table`);
  } else {
    db.updateAdminUser(adminLogin, { password_hash: hash, status: 'active' });
    log(`Admin user ${adminLogin} password updated`);
  }
}

function main() {
  ensureDatabaseReady();
  ensureCosmeticCatalog();
  ensureStreamerProfile();
  ensureStreamerCosmetics();
  ensureOverlayLoadout();
  ensureAdminUser();
  log('Seeding complete.');
}

main();
