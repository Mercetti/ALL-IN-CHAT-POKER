/**
 * Main Express/Socket.IO server with game logic, auth, and Twitch integration
 */

const express = require('express');
const http = require('http');
const tmi = require('tmi.js');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'data', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const premierHistory = new Map();
const stagedCosmetics = [];
const { createTwoFilesPatch } = require('diff');
const { spawn } = require('child_process');

// Import utilities
const config = require('./server/config');
const Logger = require('./server/logger');
const validation = require('./server/validation');
const auth = require('./server/auth');
const startup = require('./server/startup');
const db = require('./server/db');
const game = require('./server/game');
const blackjack = require('./server/blackjack');
const stateAdapter = require('./server/state-adapter');
const ai = require('./server/ai');
const {
  normalizeChannelName: normalizeChannelNameScoped,
  getDefaultChannel,
} = require('./server/channel-state');
const payoutStore = require('./server/payout-store');
const { buildPayoutIdempotencyKey } = require('./server/payout-utils');
const {
  startBlackjackRound,
  createBlackjackHandlers,
  settleAndEmit: settleAndEmitBlackjack,
} = require('./server/modes/blackjack');
const {
  startPokerRound,
  startPokerPhaseTimer,
  createPokerHandlers,
  settleAndEmit: settleAndEmitPoker,
} = require('./server/modes/poker');
const { applyPatchFile } = require('./server/patch');
const fetch = global.fetch;
const DEFAULT_AVATAR = 'https://all-in-chat-poker.fly.dev/logo.png';
const DEFAULT_AVATAR_COLORS = [
  '#1abc9c',
  '#3498db',
  '#9b59b6',
  '#e67e22',
  '#e74c3c',
  '#f39c12',
  '#16a085',
  '#2ecc71',
  '#2980b9',
  '#8e44ad',
  '#c0392b',
  '#d35400',
];

const logger = new Logger('server');
let currentMode = 'blackjack';
let tmiClient = null;
const DEFAULT_CHANNEL = getDefaultChannel();
const overlaySettingsByChannel = {};
const overlayFxByChannel = {};
let lastOverlayDiagnosis = null;
const AUTO_AI_CHECK_MS = 1000 * 60 * 15; // 15 minutes
let lastAiTestReport = null;
let lastAiTestRunDateCst = null;
const recentErrors = [];
const recentSlowRequests = [];
const recentSocketDisconnects = [];
const syntheticHistory = [];
const assetChecks = [];
let lastSyntheticAlert = null;
let lastDbBackup = null;
let lastVacuum = null;
let lastTmiReconnectAt = null;
let lastSyntheticRun = null;
const criticalAssets = [
  path.join(__dirname, 'public', 'overlay.js'),
  path.join(__dirname, 'public', 'style.css'),
  path.join(__dirname, 'public', 'welcome.html'),
];
const criticalAssetHashes = {};
const tournamentTimers = {};
const AI_BOT_NAMES = [
  'Alani', 'Marina', 'Estevan', 'Keagan', 'Alessandro', 'Betsy', 'Francisco', 'Kelli', 'Jeremiah', 'Rachel',
  'Hillary', 'Robin', 'Natalya', 'Francesco', 'Dallin', 'Mindy', 'Ananda', 'Tavon', 'Hassan', 'Korey',
  'Gerard', 'Abel', 'Franchesca', 'Kody', 'Truman', 'Aditya', 'Daveon', 'Trenten', 'Isaiah', 'Trisha',
  'Darby', 'Giovanni', 'Sasha', 'Esther', 'Cesar', 'Alondra', 'Francesca', 'Jamel', 'Notnamed', 'Deandre',
  'Princess', 'Miya', 'Melanie', 'Mikael', 'Jasper', 'Malcolm', 'Kole', 'Blake', 'Jalisa', 'Itzel', 'Brandy',
  'Kendra', 'Alaina', 'Stefan', 'Damaris', 'Ester', 'Donnell', 'Jacqueline', 'Beatrice', 'Kyndal', 'Averi',
  'Cameron', 'Brant', 'Keyanna', 'Janaya', 'Luiz', 'Killian', 'Emilie', 'Lily', 'Andrea', 'Payton', 'Michele',
  'Alecia', 'Macey', 'Jazmin', 'Quinn', 'Jevon', 'Everett', 'Tanisha', 'Brendon', 'Roberto', 'Randall',
  'Camilla', 'Chandler', 'Yvonne', 'Camron', 'Curtis', 'Uriel', 'Zachary', 'Santos', 'Belinda', 'Valeria',
  'Donnie', 'Brandi', 'Tamara', 'Josie', 'Mykayla', 'Mario', 'Jessie', 'Rashawn',
];
const COIN_PACKS = [
  { id: 'coins-100', coins: 100, amount_cents: 99, name: '100 All-In Chips', bonus: 0 },
  { id: 'coins-500', coins: 500, amount_cents: 499, name: '500 All-In Chips', bonus: 50 },
  { id: 'coins-2000', coins: 2000, amount_cents: 1999, name: '2,000 All-In Chips', bonus: 300 },
  { id: 'coins-5000', coins: 5000, amount_cents: 4999, name: '5,000 All-In Chips', bonus: 1500 },
];
const TOURNAMENT_DEFAULTS = {
  starting_chips: 5000,
  buyin: 0,
  level_seconds: 600,
  rounds: 3,
  advance_config: [12, 6, 0], // per round cutoff (last round 0 => final)
  decks: 6,
  blinds: [
    { level: 1, small: 50, big: 100, seconds: 600 },
    { level: 2, small: 100, big: 200, seconds: 600 },
    { level: 3, small: 200, big: 400, seconds: 600 },
    { level: 4, small: 400, big: 800, seconds: 600 },
  ],
};
const COSMETIC_CATALOG = [
  { id: 'card-default', type: 'cardBack', name: 'Default Emerald', price_cents: 0, rarity: 'common', preview: '/assets/card-back.png', tint: '#0b1b1b' },
  { id: 'card-azure', type: 'cardBack', name: 'Azure Edge', price_cents: 500, rarity: 'rare', preview: '/assets/card-back.png', tint: '#2d9cff' },
  { id: 'card-magenta', type: 'cardBack', name: 'Magenta Bloom', price_cents: 500, rarity: 'rare', preview: '/assets/card-back.png', tint: '#c94cff' },
  { id: 'card-back-black', type: 'cardBack', name: 'Onyx Back', price_cents: 250, rarity: 'common', preview: '/assets/cosmetics/cards/basic/card-back-black.png', image_url: '/assets/cosmetics/cards/basic/card-back-black.png' },
  { id: 'card-back-blue', type: 'cardBack', name: 'Blue Steel Back', price_cents: 400, rarity: 'uncommon', preview: '/assets/cosmetics/cards/basic/card-back-blue.png', image_url: '/assets/cosmetics/cards/basic/card-back-blue.png' },
  { id: 'card-back-green', type: 'cardBack', name: 'Verdant Back', price_cents: 400, rarity: 'uncommon', preview: '/assets/cosmetics/cards/basic/card-back-green.png', image_url: '/assets/cosmetics/cards/basic/card-back-green.png' },
  { id: 'card-back-orange', type: 'cardBack', name: 'Ember Back', price_cents: 500, rarity: 'rare', preview: '/assets/cosmetics/cards/basic/card-back-orange.png', image_url: '/assets/cosmetics/cards/basic/card-back-orange.png' },
  { id: 'card-back-purple', type: 'cardBack', name: 'Amethyst Back', price_cents: 500, rarity: 'rare', preview: '/assets/cosmetics/cards/basic/card-back-purple.png', image_url: '/assets/cosmetics/cards/basic/card-back-purple.png' },
  { id: 'card-back-red', type: 'cardBack', name: 'Crimson Back', price_cents: 1000, rarity: 'epic', preview: '/assets/cosmetics/cards/basic/card-back-red.png', image_url: '/assets/cosmetics/cards/basic/card-back-red.png' },
  { id: 'card-back-drop', type: 'cardBack', name: 'Glitch Drop Back', price_cents: 0, rarity: 'rare', preview: '/assets/cosmetics/cards/drops/card-back-drop.png', image_url: '/assets/cosmetics/cards/drops/card-back-drop.png', unlock_type: 'twitch_drop', unlock_note: 'Earned via Twitch Drops' },
  { id: 'card-back-streamer', type: 'cardBack', name: 'Streamer Neon Back', price_cents: 0, rarity: 'legendary', preview: '/assets/cosmetics/cards/streamer/card-back-streamer.png', image_url: '/assets/cosmetics/cards/streamer/card-back-streamer.png', unlock_type: 'streamer_goal', unlock_value: 60, unlock_note: 'Streamer: unlock after 60 hands or 30 minutes played' },
  { id: 'card-face-classic', type: 'cardFace', name: 'Classic Face Deck', price_cents: 0, rarity: 'common', preview: '/assets/cosmetics/cards/faces/classic/ace_of_spades.png', image_url: '/assets/cosmetics/cards/faces/classic', unlock_type: 'basic', unlock_note: 'Available to all players' },
  // Chip skins (top-view)
  { id: 'chip-1-classic', type: 'chipSkin', name: '$1 Classic Chip', price_cents: 0, rarity: 'common', preview: '/assets/cosmetics/effects/chips/chip-1-top.png', image_url: '/assets/cosmetics/effects/chips/chip-1-top.png', unlock_note: 'Default chip' },
  { id: 'chip-5-classic', type: 'chipSkin', name: '$5 Classic Chip', price_cents: 50, rarity: 'uncommon', preview: '/assets/cosmetics/effects/chips/chip-5-top.png', image_url: '/assets/cosmetics/effects/chips/chip-5-top.png' },
  { id: 'chip-25-classic', type: 'chipSkin', name: '$25 Classic Chip', price_cents: 75, rarity: 'rare', preview: '/assets/cosmetics/effects/chips/chip-25-top.png', image_url: '/assets/cosmetics/effects/chips/chip-25-top.png' },
  { id: 'chip-100-classic', type: 'chipSkin', name: '$100 Classic Chip', price_cents: 0, rarity: 'common', preview: '/assets/cosmetics/effects/chips/chip-100-top.png', image_url: '/assets/cosmetics/effects/chips/chip-100-top.png', unlock_note: 'Included' },
  { id: 'chip-500-classic', type: 'chipSkin', name: '$500 Classic Chip', price_cents: 125, rarity: 'epic', preview: '/assets/cosmetics/effects/chips/chip-500-top.png', image_url: '/assets/cosmetics/effects/chips/chip-500-top.png' },
  { id: 'table-default', type: 'tableSkin', name: 'Default Felt', price_cents: 0, rarity: 'common', preview: '/assets/cosmetics/table/basic/table_streamer_neon_twitch.png', image_url: '/assets/cosmetics/table/basic/table_streamer_neon_twitch.png', tint: '#0c4c3b', color: '#8ef5d0', texture_url: '/assets/table-texture.svg' },
  { id: 'table-night', type: 'tableSkin', name: 'Night Felt', price_cents: 2000, rarity: 'rare', preview: '/assets/cosmetics/table/basic/table_streamer_neon_twitch.png', image_url: '/assets/cosmetics/table/basic/table_streamer_neon_twitch.png', tint: '#0a2c2c', color: '#6fffd3', texture_url: '/assets/table-texture.svg' },
  { id: 'table-neon', type: 'tableSkin', name: 'Neon Felt', price_cents: 3500, rarity: 'rare', preview: '/assets/cosmetics/table/basic/table_streamer_neon_twitch.png', image_url: '/assets/cosmetics/table/basic/table_streamer_neon_twitch.png', tint: '#0f5d4f', color: '#8ef5d0', texture_url: '/assets/table-texture.svg' },
  { id: 'ring-default', type: 'avatarRing', name: 'Emerald Ring', price_cents: 0, rarity: 'common', preview: '/logo.png', color: '#00d4a6' },
  { id: 'ring-gold', type: 'avatarRing', name: 'Gold Ring', price_cents: 500, rarity: 'rare', preview: '/logo.png', color: '#f5a524' },
  { id: 'frame-default', type: 'profileFrame', name: 'Emerald Frame', price_cents: 0, rarity: 'common', preview: '/logo.png', color: '#00d4a6' },
  { id: 'frame-ice', type: 'profileFrame', name: 'Ice Frame', price_cents: 500, rarity: 'rare', preview: '/logo.png', color: '#6dd2ff' },
  // Nameplates
  { id: 'nameplate-default', type: 'nameplate', name: 'Neon Nameplate', price_cents: 0, rarity: 'common', preview: '/logo.png', tint: '#00d4a6', unlock_note: 'Default overlay plate' },
  { id: 'nameplate-glitch', type: 'nameplate', name: 'Glitch Nameplate', price_cents: 150, rarity: 'rare', preview: '/logo.png', tint: '#b14bff' },
  { id: 'bundle-neon-night', type: 'bundle', name: 'Neon Night Bundle', price_cents: 3500, rarity: 'epic', preview: '/assets/table-texture.svg', tint: '#0f5d4f', color: '#8ef5d0', texture_url: '/assets/table-texture.svg' },
  { id: 'ring-basic-extra1', type: 'avatarRing', name: 'Emerald Pulse', price_cents: 250, rarity: 'common', preview: '/assets/cosmetics/avatar/basic-extra1.png', image_url: '/assets/cosmetics/avatar/basic-extra1.png', unlock_type: 'basic', unlock_note: 'Available to all players' },
  { id: 'ring-basic-extra2', type: 'avatarRing', name: 'Carbon Glow', price_cents: 400, rarity: 'uncommon', preview: '/assets/cosmetics/avatar/basic-extra2.png', image_url: '/assets/cosmetics/avatar/basic-extra2.png', unlock_type: 'basic', unlock_note: 'Available to all players' },
  { id: 'ring-streamer-cosmic', type: 'avatarRing', name: 'Streamer Cosmic Ring', price_cents: 1500, rarity: 'legendary', preview: '/assets/cosmetics/avatar/streamer-cosmic.png', image_url: '/assets/cosmetics/avatar/streamer-cosmic.png', unlock_type: 'streamer_goal', unlock_value: 50, unlock_note: 'Streamer: unlock after 50 hands or 30 minutes played' },
  { id: 'ring-streamer-glitch', type: 'avatarRing', name: 'Streamer Glitch Ring', price_cents: 1500, rarity: 'legendary', preview: '/assets/cosmetics/avatar/streamer-glitch.png', image_url: '/assets/cosmetics/avatar/streamer-glitch.png', unlock_type: 'streamer_goal', unlock_value: 75, unlock_note: 'Streamer: unlock after 75 hands' },
  { id: 'ring-streamer-gold', type: 'avatarRing', name: 'Streamer Gold Ring', price_cents: 1500, rarity: 'legendary', preview: '/assets/cosmetics/avatar/streamer-gold.png', image_url: '/assets/cosmetics/avatar/streamer-gold.png', unlock_type: 'streamer_goal', unlock_value: 100, unlock_note: 'Streamer: unlock after 100 hands' },
  { id: 'ring-streamer-neon', type: 'avatarRing', name: 'Streamer Neon Ring', price_cents: 1500, rarity: 'legendary', preview: '/assets/cosmetics/avatar/streamer-neon.png', image_url: '/assets/cosmetics/avatar/streamer-neon.png', unlock_type: 'streamer_goal', unlock_value: 120, unlock_note: 'Streamer: unlock after 120 hands' },
  { id: 'ring-subscriber-purple', type: 'avatarRing', name: 'Subscriber Neon Aura', price_cents: 1000, rarity: 'epic', preview: '/assets/cosmetics/avatar/subscriber-purple-neon.png', image_url: '/assets/cosmetics/avatar/subscriber-purple-neon.png', unlock_type: 'subscriber', unlock_note: 'Subscriber perk (tier/length required)' },
  { id: 'ring-subscriber-sparkle', type: 'avatarRing', name: 'Subscriber Sparkle', price_cents: 1000, rarity: 'epic', preview: '/assets/cosmetics/avatar/subscriber-sparkle.png', image_url: '/assets/cosmetics/avatar/subscriber-sparkle.png', unlock_type: 'subscriber', unlock_note: 'Subscriber perk (tier/length required)' },
  { id: 'ring-subscriber-cosmic', type: 'avatarRing', name: 'Subscriber Cosmic Bloom', price_cents: 1500, rarity: 'legendary', preview: '/assets/cosmetics/avatar/subscriber-cosmic.png', image_url: '/assets/cosmetics/avatar/subscriber-cosmic.png', unlock_type: 'subscriber', unlock_note: 'Subscriber perk (tier/length required)' },
  { id: 'ring-subscriber-frost', type: 'avatarRing', name: 'Subscriber Frost Edge', price_cents: 1000, rarity: 'epic', preview: '/assets/cosmetics/avatar/subscriber-frost.png', image_url: '/assets/cosmetics/avatar/subscriber-frost.png', unlock_type: 'subscriber', unlock_note: 'Subscriber perk (tier/length required)' },
  { id: 'ring-drop-pink-neon', type: 'avatarRing', name: 'Twitch Drop: Pink Neon', price_cents: 500, rarity: 'rare', preview: '/assets/cosmetics/avatar/drop-pink-neon.png', image_url: '/assets/cosmetics/avatar/drop-pink-neon.png', unlock_type: 'twitch_drop', unlock_note: 'Earned via Twitch Drops' },
  { id: 'table-streamer-cosmic-moon', type: 'tableSkin', name: 'Streamer Cosmic Moon', price_cents: 5000, rarity: 'legendary', preview: '/assets/cosmetics/table/streamer/table_streamer_cosmic_moon.png', image_url: '/assets/cosmetics/table/streamer/table_streamer_cosmic_moon.png', unlock_type: 'streamer_goal', unlock_value: 50, unlock_note: 'Streamer: unlock after 50 hands or 30 minutes played' },
  { id: 'table-streamer-gold-crown', type: 'tableSkin', name: 'Streamer Gold Crown', price_cents: 5000, rarity: 'legendary', preview: '/assets/cosmetics/table/streamer/table_streamer_gold_crown.png', image_url: '/assets/cosmetics/table/streamer/table_streamer_gold_crown.png', unlock_type: 'streamer_goal', unlock_value: 75, unlock_note: 'Streamer: unlock after 75 hands' },
  { id: 'table-streamer-gold-star', type: 'tableSkin', name: 'Streamer Gold Star', price_cents: 5000, rarity: 'legendary', preview: '/assets/cosmetics/table/streamer/table_streamer_gold_star.png', image_url: '/assets/cosmetics/table/streamer/table_streamer_gold_star.png', unlock_type: 'streamer_goal', unlock_value: 100, unlock_note: 'Streamer: unlock after 100 hands' },
  { id: 'table-streamer-neon-twitch', type: 'tableSkin', name: 'Streamer Neon Twitch', price_cents: 5000, rarity: 'legendary', preview: '/assets/cosmetics/table/streamer/table_streamer_neon_twitch.png', image_url: '/assets/cosmetics/table/streamer/table_streamer_neon_twitch.png', unlock_type: 'streamer_goal', unlock_value: 120, unlock_note: 'Streamer: unlock after 120 hands' },
  { id: 'table-drop-glitch-twitch', type: 'tableSkin', name: 'Twitch Drop: Glitch Table', price_cents: 5000, rarity: 'epic', preview: '/assets/cosmetics/table/drops/table_streamer_glitch_twitch.png', image_url: '/assets/cosmetics/table/drops/table_streamer_glitch_twitch.png', unlock_type: 'twitch_drop', unlock_note: 'Earned via Twitch Drops' },
];
const DEFAULT_COSMETIC_DEFAULTS = ['card-default', 'table-default', 'ring-default', 'frame-default', 'card-face-classic', 'chip-100-classic', 'nameplate-default'];
const DEFAULT_COSMETIC_SLOTS = {
  cardBack: 'card-default',
  tableSkin: 'table-default',
  avatarRing: 'ring-default',
  profileFrame: 'frame-default',
  cardFace: 'card-face-classic',
  chipSkin: 'chip-100-classic',
  nameplate: 'nameplate-default',
};
const MDN_BASE_URL = 'https://developer.mozilla.org';
const MDN_SEARCH_URL = `${MDN_BASE_URL}/api/v1/search`;
const mdnCache = new Map();
const codeProposalFile = path.join(__dirname, 'data', 'code-proposals.json');
const projectRoot = path.resolve(__dirname);
const knowledgeFile = path.join(__dirname, 'data', 'knowledge.json');
const knowledgeSources = (config.KNOWLEDGE_SOURCES || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const KNOWLEDGE_MAX_BYTES = 512 * 1024; // 512KB guardrail
const KNOWLEDGE_FETCH_TIMEOUT_MS = 7000;
const KNOWLEDGE_REFRESH_MS = 1000 * 60 * 60 * 6; // 6 hours
let knowledgeLastIngestAt = 0;
const TEST_TIMEOUT_MS = 1000 * 60; // 1 minute default
const lintCommands = {
  eslint: 'npm run lint || npx eslint .',
  prettier: 'npm run fmt || npx prettier -c .',
  stylelint: 'npx stylelint "**/*.css"',
  markdownlint: 'npx markdownlint "**/*.md"',
  htmlhint: 'npm run lint:html || npx htmlhint "**/*.html"',
  tsc: 'npx tsc --noEmit',
  pycompile: (file) => `python -m py_compile "${file}"`,
  ruff: 'ruff check .',
  black: 'black --check .',
  flake8: 'flake8 .',
};

function compressWhitespace(text = '') {
  return text.replace(/\s+/g, ' ').trim();
}

function truncateText(text = '', max = 220) {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3))}...`;
}

async function searchMdn(query) {
  const key = (query || '').trim().toLowerCase();
  if (!key) return null;
  if (mdnCache.has(key)) return mdnCache.get(key);

  try {
    const params = new URLSearchParams({
      q: query,
      locale: 'en-US',
      highlight: 'false',
      size: '1',
    });
    const res = await fetch(`${MDN_SEARCH_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`MDN search failed with ${res.status}`);
    const data = await res.json();
    const doc = Array.isArray(data?.documents) && data.documents.length ? data.documents[0] : null;
    if (!doc) {
      mdnCache.set(key, null);
      return null;
    }
    const summary = truncateText(compressWhitespace(doc.summary || ''), 240);
    const result = {
      title: doc.title || 'MDN',
      summary: summary || 'See docs for details.',
      url: `${MDN_BASE_URL}${doc.mdn_url || ''}`,
    };
    mdnCache.set(key, result);
    return result;
  } catch (err) {
    logger.warn('MDN lookup failed', { error: err.message });
    return null;
  }
}

function buildMdnReply(result) {
  if (!result) return null;
  const base = `MDN: ${result.title} — ${result.summary}`;
  const reply = truncateText(base, 420);
  return {
    title: result.title,
    summary: result.summary,
    url: result.url,
    reply: `${reply} ${result.url}`,
  };
}

function stripHtml(html = '') {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const text = withoutScripts.replace(/<[^>]+>/g, ' ');
  return compressWhitespace(text);
}

async function fetchMdnContent(url) {
  if (!url || !url.startsWith(MDN_BASE_URL)) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MDN content fetch failed: ${res.status}`);
    const html = await res.text();
    const text = stripHtml(html);
    return truncateText(text, 1800);
  } catch (err) {
    logger.warn('MDN content fetch failed', { error: err.message });
    return null;
  }
}

function ensureProposalStore() {
  const dir = path.dirname(codeProposalFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(codeProposalFile)) {
    fs.writeFileSync(codeProposalFile, JSON.stringify({ proposals: [] }, null, 2));
  }
}

function loadProposals() {
  ensureProposalStore();
  try {
    const raw = fs.readFileSync(codeProposalFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.proposals) ? parsed.proposals : [];
  } catch (e) {
    logger.warn('Failed to read code proposals', { error: e.message });
    return [];
  }
}

function saveProposals(list) {
  ensureProposalStore();
  fs.writeFileSync(codeProposalFile, JSON.stringify({ proposals: list || [] }, null, 2));
}

function applyStructuredEdit(filePath, startLine, endLine, replacement) {
  const original = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  const lines = original.split(/\r?\n/);
  const startIdx = Math.max(0, startLine - 1);
  const endIdx = Math.max(startIdx, endLine);
  const before = lines.slice(0, startIdx);
  const after = lines.slice(endIdx);
  const replacementLines = typeof replacement === 'string' ? replacement.split(/\r?\n/) : [];
  const updated = [...before, ...replacementLines, ...after].join('\n');
  fs.writeFileSync(filePath, updated, 'utf-8');
  return updated;
}

function createProposalEntry(filePath, content, note) {
  const proposals = loadProposals();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const entry = {
    id,
    filePath,
    note: (note || '').toString().slice(0, 400),
    status: 'pending',
    createdAt,
    content,
  };
  proposals.unshift(entry);
  saveProposals(proposals);
  return entry;
}

function validatePath(targetPath) {
  const resolved = path.resolve(projectRoot, targetPath);
  if (!resolved.startsWith(projectRoot)) return null;
  if (resolved.includes(`${path.sep}node_modules${path.sep}`)) return null;
  return resolved;
}

function backupFile(filePath) {
  const ts = Date.now();
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const backupName = `${base}.bak-${ts}`;
  const backupPath = path.join(dir, backupName);
  try {
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
      return backupPath;
    }
  } catch (e) {
    logger.warn('Failed to backup file', { filePath, error: e.message });
  }
  return null;
}

function generateDiff(proposal, currentContent) {
  const oldLabel = `${proposal.filePath} (current)`;
  const newLabel = `${proposal.filePath} (proposal)`;
  const oldText = currentContent || '';
  const newText = proposal.content || '';
  try {
    return createTwoFilesPatch(oldLabel, newLabel, oldText, newText, '', '');
  } catch (e) {
    logger.warn('Failed to generate diff', { error: e.message });
    return null;
  }
}

function getPackageScripts() {
  try {
    const pkgPath = path.join(projectRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.scripts || {};
  } catch (e) {
    return {};
  }
}

function runCommand(cmd, options = {}) {
  return new Promise((resolve) => {
    const {
      cwd = projectRoot,
      env = process.env,
      timeoutMs = TEST_TIMEOUT_MS,
    } = options;
    const started = Date.now();
    const child = spawn(cmd, {
      shell: true,
      cwd,
      env,
    });
    let output = '';
    let completed = false;
    const timer = setTimeout(() => {
      if (!completed) {
        child.kill();
      }
    }, timeoutMs);

    child.stdout.on('data', (data) => { output += data.toString(); });
    child.stderr.on('data', (data) => { output += data.toString(); });

    child.on('close', (code, signal) => {
      completed = true;
      clearTimeout(timer);
      resolve({ code, signal: signal || null, output, durationMs: Date.now() - started });
    });
  });
}

function getPackageScripts() {
  try {
    const pkgPath = path.join(projectRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.scripts || {};
  } catch (e) {
    return {};
  }
}

function ensureKnowledgeStore() {
  const dir = path.dirname(knowledgeFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(knowledgeFile)) {
    fs.writeFileSync(knowledgeFile, JSON.stringify({ entries: [] }, null, 2));
  }
}

function getCstParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  return parts; // {year, month, day, hour, minute}
}

async function postWebhook(message) {
  if (!config.MONITOR_WEBHOOK_URL) return null;
  try {
    await fetch(config.MONITOR_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  } catch (err) {
    logger.warn('Webhook post failed', { error: err.message });
  }
}

async function runAiTests(kind = 'manual') {
  const scripts = getPackageScripts();
  const available = Object.keys(scripts || {});
  const testCommands = [];
  if (available.includes('test')) testCommands.push('npm test');
  if (available.includes('lint')) testCommands.push('npm run lint');
  if (available.includes('fmt')) testCommands.push('npm run fmt -- --check');
  if (!testCommands.length) testCommands.push('npm test');

  let plan = 'AI not configured';
  if (config.OPENAI_API_KEY) {
    try {
      const planPrompt = `You are an automated QA assistant for All-In Chat Poker. npm scripts available: ${available.join(', ')}. Propose a short test plan (<=4 bullets) prioritizing regression safety and overlays.`;
      const reply = await ai.chat(
        [
          { role: 'system', content: 'You are a concise QA assistant. Respond in <=4 bullets.' },
          { role: 'user', content: planPrompt },
        ],
        { temperature: 0.2 }
      );
      plan = reply;
    } catch (err) {
      logger.warn('AI test plan failed', { error: err.message });
      plan = 'AI plan unavailable';
    }
  }

  const results = [];
  for (const cmd of testCommands) {
    const out = await runCommand(cmd, { timeoutMs: TEST_TIMEOUT_MS * 2 });
    results.push({ cmd, code: out.code, durationMs: out.durationMs, output: out.output });
  }

  let diagnosis = null;
  if (config.OPENAI_API_KEY) {
    try {
      const combined = results
        .map(r => `${r.cmd} (code ${r.code}): ${truncateText(compressWhitespace(r.output || ''), 800)}`)
        .join('\n');
      const diagPrompt = `You are a terse QA debugger. Tests were run:\n${testCommands.join(', ')}\n\nOutputs:\n${combined}\n\nList the top issues and fixes in <=5 bullets. If all passed, say "All checks passed."`;
      diagnosis = await ai.chat(
        [
          { role: 'system', content: 'You are a concise QA debugger. Respond in <=5 bullets.' },
          { role: 'user', content: diagPrompt },
        ],
        { temperature: 0.2 }
      );
    } catch (err) {
      logger.warn('AI diagnosis for tests failed', { error: err.message });
      diagnosis = 'AI diagnosis unavailable';
    }
  }

  const report = {
    plan,
    commands: testCommands,
    results,
    startedAt: Date.now(),
    kind,
    diagnosis,
  };
  lastAiTestReport = report;
  return report;
}

function hashFile(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (err) {
    return null;
  }
}

function getCriticalHashes() {
  const current = {};
  criticalAssets.forEach((p) => {
    current[p] = hashFile(p);
  });
  return { baseline: criticalAssetHashes, current };
}

async function runSyntheticCheck(kind = 'manual') {
  const url = `http://127.0.0.1:${config.PORT}/health`;
  let ok = false;
  let status = 0;
  let error = null;
  try {
    const res = await fetch(url, { timeout: 5000 });
    status = res.status;
    ok = res.ok;
    if (!ok) error = `status ${status}`;
  } catch (e) {
    error = e.message;
  }
  const result = { ok, status, error, at: Date.now(), kind };
  syntheticHistory.push(result);
  if (syntheticHistory.length > 20) syntheticHistory.shift();
  lastSyntheticRun = result;
  if (!ok) {
    lastSyntheticAlert = { at: Date.now(), error: error || `status ${status}` };
    postWebhook(`Synthetic check failed (${kind}): ${error || status}`);
  }
  return result;
}

async function runAssetCheck(kind = 'manual') {
  const assets = ['/logo.png', '/assets/table-texture.svg', '/assets/cosmetics/cards/basic/card-back-green.png'];
  const base = `http://127.0.0.1:${config.PORT}`;
  const results = [];
  for (const asset of assets) {
    try {
      const res = await fetch(`${base}${asset}`, { timeout: 5000 });
      results.push({ asset, status: res.status, ok: res.ok });
    } catch (e) {
      results.push({ asset, status: 0, ok: false, error: e.message });
    }
  }
  const check = { at: Date.now(), kind, results };
  assetChecks.push(check);
  if (assetChecks.length > 10) assetChecks.shift();
  return check;
}

function backupDb() {
  try {
    const src = path.resolve(config.DB_FILE);
    const dir = path.join(path.dirname(src), 'backups');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, `backup-${Date.now()}.db`);
    fs.copyFileSync(src, dest);
    lastDbBackup = { at: Date.now(), path: dest };
    return lastDbBackup;
  } catch (err) {
    logger.error('DB backup failed', { error: err.message });
    throw err;
  }
}

async function vacuumDb() {
  try {
    const res = await runCommand(`sqlite3 "${config.DB_FILE}" "VACUUM;"`, { timeoutMs: 20000 });
    lastVacuum = { at: Date.now(), code: res.code };
    return lastVacuum;
  } catch (err) {
    logger.error('VACUUM failed', { error: err.message });
    throw err;
  }
}

/**
 * Admin: security snapshot + AI review
 */
app.get('/admin/security-snapshot', auth.requireAdmin, (_req, res) => {
  const botChannels = (tmiClient && typeof tmiClient.getChannels === 'function') ? tmiClient.getChannels() : [];
  const botConnected = !!(tmiClient && typeof tmiClient.readyState === 'function' ? tmiClient.readyState() === 'OPEN' : botChannels.length);
  const snapshot = {
    rateLimits: {
      blockedIps: Array.from(blockedIPs?.keys ? blockedIPs.keys() : []),
      loginAttempts: adminLoginAttempts.size,
    },
    errors: recentErrors.slice(-20),
    slow: recentSlowRequests.slice(-20),
    socketDisconnects: recentSocketDisconnects.slice(-20),
    bot: { connected: botConnected, channels: botChannels, lastReconnectAt: lastTmiReconnectAt },
    integrity: getCriticalHashes(),
    headers: {
      csp: false,
      hsts: config.IS_PRODUCTION,
      cors: '*',
    },
  };
  res.json({ snapshot });
});

app.post('/admin/security-diagnose', auth.requireAdmin, async (_req, res) => {
  if (!config.OPENAI_API_KEY) return res.status(400).json({ error: 'ai_not_configured' });
  try {
    const botChannels = (tmiClient && typeof tmiClient.getChannels === 'function') ? tmiClient.getChannels() : [];
    const botConnected = !!(tmiClient && typeof tmiClient.readyState === 'function' ? tmiClient.readyState() === 'OPEN' : botChannels.length);
    const snapRes = {
      rateLimits: {
        blockedIps: Array.from(blockedIPs?.keys ? blockedIPs.keys() : []),
        loginAttempts: adminLoginAttempts.size,
      },
      errors: recentErrors.slice(-20),
      slow: recentSlowRequests.slice(-20),
      socketDisconnects: recentSocketDisconnects.slice(-20),
      bot: { connected: botConnected, channels: botChannels, lastReconnectAt: lastTmiReconnectAt },
      integrity: getCriticalHashes(),
      headers: { csp: false, hsts: config.IS_PRODUCTION, cors: '*' },
    };

    const prompt = `Security snapshot:\n${JSON.stringify(snapRes, null, 2)}\n\nList top security risks and actionable fixes in <=5 bullets (rate limits, auth abuse, bot tamper, missing headers, integrity drift). Be concise.`;
    const reply = await ai.chat(
      [
        { role: 'system', content: 'You are a concise security reviewer. Respond in <=5 bullets.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.2 }
    );
    res.json({ diagnosis: reply, snapshot: snapRes });
  } catch (err) {
    logger.error('security diagnose failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

function loadKnowledge() {
  ensureKnowledgeStore();
  try {
    const raw = fs.readFileSync(knowledgeFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch (e) {
    logger.warn('Failed to read knowledge store', { error: e.message });
    return [];
  }
}

function saveKnowledge(entries) {
  ensureKnowledgeStore();
  fs.writeFileSync(knowledgeFile, JSON.stringify({ entries: entries || [] }, null, 2));
}

function isUrlAllowed(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return knowledgeSources.some(src => {
      try {
        const s = new URL(src);
        return parsed.hostname === s.hostname && parsed.href.startsWith(s.href);
      } catch {
        return false;
      }
    });
  } catch (e) {
    return false;
  }
}

async function fetchAndSummarize(url) {
  if (!isUrlAllowed(url)) {
    throw new Error('url not whitelisted');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), KNOWLEDGE_FETCH_TIMEOUT_MS);
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const lenHeader = res.headers.get('content-length');
  if (lenHeader && Number(lenHeader) > KNOWLEDGE_MAX_BYTES) {
    throw new Error('content too large');
  }
  const html = await res.text();
  const text = stripHtml(html);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? compressWhitespace(titleMatch[1]) : url;
  const summary = truncateText(text, 600);
  const snippet = truncateText(text, 320);
  return { url, title, summary, snippet };
}

function searchKnowledge(query) {
  const list = loadKnowledge();
  const q = (query || '').toLowerCase();
  if (!q) return null;
  let best = null;
  for (const entry of list) {
    const hay = `${entry.title || ''} ${entry.summary || ''}`.toLowerCase();
    if (hay.includes(q)) {
      best = entry;
      break;
    }
  }
  return best;
}

async function ingestAllowedSources(force = false) {
  if (!knowledgeSources.length) return [];
  const now = Date.now();
  const existing = loadKnowledge();
  if (!force && existing.length && now - knowledgeLastIngestAt < KNOWLEDGE_REFRESH_MS) {
    return existing;
  }
  const merged = [...existing];
  for (const src of knowledgeSources) {
    try {
      const summary = await fetchAndSummarize(src);
      const idx = merged.findIndex(e => e.url === summary.url);
      if (idx !== -1) {
        merged[idx] = summary;
      } else {
        merged.push(summary);
      }
    } catch (e) {
      logger.warn('Knowledge ingest failed for source', { source: src, error: e.message });
    }
  }
  saveKnowledge(merged);
  knowledgeLastIngestAt = Date.now();
  return merged;
}

function commandExists(cmd) {
  try {
    const check = process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
    const res = require('child_process').execSync(check, { stdio: 'pipe' });
    return !!res;
  } catch {
    return false;
  }
}

async function runLintSet(filePath) {
  const tasks = [];
  const results = [];
  const ext = path.extname(filePath).toLowerCase();
  const hasLocalBin = (name) => {
    const bin = process.platform === 'win32' ? `${name}.cmd` : name;
    return fs.existsSync(path.join(projectRoot, 'node_modules', '.bin', bin));
  };
  const addTask = (name, cmd) => tasks.push({ name, cmd });

  // JS/TS: eslint/prettier
  if (['.js', '.mjs', '.cjs', '.ts', '.tsx'].includes(ext)) {
    if (hasLocalBin('eslint')) addTask('eslint', `"${path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'eslint.cmd' : 'eslint')}" "${filePath}"`);
    if (hasLocalBin('prettier')) addTask('prettier', `"${path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'prettier.cmd' : 'prettier')}" -c "${filePath}"`);
  }
  // TS: tsc
  if (['.ts', '.tsx'].includes(ext) && fs.existsSync(path.join(projectRoot, 'tsconfig.json')) && hasLocalBin('tsc')) {
    addTask('tsc', `"${path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc')}" --noEmit`);
  }
  // CSS
  if (['.css', '.scss', '.sass'].includes(ext) && hasLocalBin('stylelint')) {
    addTask('stylelint', `"${path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'stylelint.cmd' : 'stylelint')}" "${filePath}"`);
  }
  // HTML
  if (['.html', '.htm'].includes(ext) && hasLocalBin('htmlhint')) {
    addTask('htmlhint', `"${path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'htmlhint.cmd' : 'htmlhint')}" "${filePath}"`);
  }
  // Markdown
  if (['.md', '.markdown'].includes(ext) && hasLocalBin('markdownlint')) {
    addTask('markdownlint', `"${path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'markdownlint.cmd' : 'markdownlint')}" "${filePath}"`);
  }
  // Python
  if (ext === '.py') {
    if (typeof lintCommands.pycompile === 'function') addTask('py_compile', lintCommands.pycompile(filePath));
    if (hasLocalBin('ruff')) addTask('ruff', `"${path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'ruff.cmd' : 'ruff')}" check "${filePath}"`);
    if (hasLocalBin('black')) addTask('black', `"${path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'black.cmd' : 'black')}" --check "${filePath}"`);
    if (hasLocalBin('flake8')) addTask('flake8', `"${path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'flake8.cmd' : 'flake8')}" "${filePath}"`);
  }

  for (const task of tasks) {
    try {
      const res = await runCommand(task.cmd, { timeoutMs: TEST_TIMEOUT_MS });
      results.push({ name: task.name, code: res.code, output: res.output, durationMs: res.durationMs });
    } catch (e) {
      results.push({ name: task.name, code: -1, output: e.message, durationMs: null });
    }
  }

  return results;
}

function isMultiStreamChannel(name = '') {
  return typeof name === 'string' && name.toLowerCase().startsWith('lobby-');
}

function getUserInventory(login = '') {
  db.ensureDefaultCosmetics(login, DEFAULT_COSMETIC_DEFAULTS);
  db.addCoins(login, 0);
  const lower = (login || '').toLowerCase();
  const grantAll = lower === 'mercetti' || lower === 'allinchatpokerbot';
  if (grantAll) {
    const catalog = db.getCatalog();
    catalog.forEach(item => {
      if (item?.id) db.grantCosmetic(login, item.id);
    });
  }
  const inv = db.getUserInventory(login);
  const owned = new Set([...DEFAULT_COSMETIC_DEFAULTS, ...Array.from(inv.owned)]);
  const equipped = { ...DEFAULT_COSMETIC_SLOTS, ...inv.equipped };
  return { owned, equipped };
}

function getCosmeticsForLogin(login = '') {
  const inv = getUserInventory(login);
  const catalog = db.getCatalog();
  const map = {};
  catalog.forEach((item) => { map[item.id] = item; });

  const cardBackItem = map[inv.equipped.cardBack] || map['card-default'];
  const tableItem = map[inv.equipped.tableSkin] || map['table-default'];
  const ringItem = map[inv.equipped.avatarRing] || map['ring-default'];
  const frameItem = map[inv.equipped.profileFrame] || map['frame-default'];
  const faceItem = map[inv.equipped.cardFace] || map['card-face-classic'];

  return {
    cardBackId: cardBackItem?.id || 'card-default',
    cardBackTint: cardBackItem?.tint || null,
    cardBackImage: cardBackItem?.image_url || cardBackItem?.preview || null,
    tableTint: tableItem?.tint || null,
    tableTexture: tableItem?.image_url || tableItem?.texture_url || null,
    tableLogoColor: tableItem?.color || null,
    avatarRingColor: ringItem?.color || null,
    avatarRingImage: ringItem?.image_url || null,
    profileCardBorder: frameItem?.color || null,
    cardFaceBase: faceItem?.image_url || null,
    cardFaceId: faceItem?.id || 'card-face-classic',
  };
}

function mapLoadoutToOverlaySettings(loadout = {}) {
  const catalog = db.getCatalog();
  const map = {};
  catalog.forEach((item) => {
    if (item?.id) map[item.id] = item;
  });

  const cosmetics = loadout.cosmetics || {};
  const pick = (slot, fallback) => map[cosmetics[slot]] || (fallback ? map[fallback] : null);
  const cardBackItem = pick('cardBack', 'card-default');
  const tableItem = pick('tableSkin', 'table-default');
  const ringItem = pick('avatarRing', 'ring-default');
  const frameItem = pick('profileFrame', 'frame-default');
  const faceItem = pick('cardFace', 'card-face-classic');

  const settings = {};
  if (cardBackItem) {
    if (cardBackItem.tint) settings.cardBackTint = cardBackItem.tint;
    if (cardBackItem.image_url || cardBackItem.preview) {
      settings.cardBackImage = cardBackItem.image_url || cardBackItem.preview;
    }
  }
  if (tableItem) {
    if (tableItem.tint) settings.tableTint = tableItem.tint;
    if (tableItem.color) settings.tableLogoColor = tableItem.color;
    if (tableItem.texture_url || tableItem.image_url || tableItem.preview) {
      settings.tableTexture = tableItem.texture_url || tableItem.image_url || tableItem.preview;
    }
  }
  if (ringItem) {
    if (ringItem.color) settings.avatarRingColor = ringItem.color;
    if (ringItem.image_url || ringItem.preview) {
      settings.avatarRingImage = ringItem.image_url || ringItem.preview;
    }
  }
  if (frameItem && frameItem.color) {
    settings.profileCardBorder = frameItem.color;
  }
  if (faceItem && (faceItem.image_url || faceItem.preview)) {
    settings.cardFaceBase = faceItem.image_url || faceItem.preview;
  }

  return settings;
}

function meetsUnlockRequirement(item, stats = {}, profile = {}) {
  const type = (item.unlock_type || '').toLowerCase();
  const val = Number(item.unlock_value) || 0;
  if (!type) return { ok: true };
  if (type === 'basic') return { ok: true };
  if (type === 'hands') return { ok: (stats.handsPlayed || 0) >= val };
  if (type === 'playtime') return { ok: (stats.playSeconds || 0) >= val };
  if (type === 'streamer_goal') {
    const isStreamer = (profile.role || '').toLowerCase() === 'streamer';
    return { ok: isStreamer && ((stats.handsPlayed || 0) >= val || (stats.playSeconds || 0) >= val) };
  }
  // Subscriber, twitch_drop, etc. require external validation
  return { ok: false };
}

async function maybeAutoUnlockCosmetics(login = '', channel = DEFAULT_CHANNEL) {
  if (!login) return [];
  const inv = getUserInventory(login);
  const owned = new Set(inv.owned);
  const stats = db.getStats(login);
  const profile = db.getProfile(login) || {};
  const unlocked = [];
  const catalog = db.getCatalog();
  for (const item of catalog) {
    if (!item) continue;
    if (owned.has(item.id)) continue;
    const type = (item.unlock_type || '').toLowerCase();
    if ((type === 'basic' || !type) && (item.price_cents === 0 || item.price === 0)) {
      db.grantCosmetic(login, item.id);
      unlocked.push(item.id);
      continue;
    }
    if (['hands', 'playtime', 'streamer_goal'].includes(type)) {
      const { ok } = meetsUnlockRequirement(item, stats, profile);
      if (ok) {
        db.grantCosmetic(login, item.id);
        unlocked.push(item.id);
      }
    } else if (type === 'subscriber') {
      const ok = await isUserSubscribedTo(channel, login, channel);
      if (ok) {
        db.grantCosmetic(login, item.id);
        unlocked.push(item.id);
      }
    } else if (type === 'vip') {
      const ok = await isUserVipOf(channel, login, channel);
      if (ok) {
        db.grantCosmetic(login, item.id);
        unlocked.push(item.id);
      }
    } else if (type === 'follower') {
      const ok = await isUserFollowerOf(channel, login, channel);
      if (ok) {
        db.grantCosmetic(login, item.id);
        unlocked.push(item.id);
      }
    }
  }
  return unlocked;
}

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' },
});

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      recentSlowRequests.push({ path: req.path, status: res.statusCode, durationMs: duration, at: Date.now() });
      if (recentSlowRequests.length > 50) recentSlowRequests.shift();
    }
    if (res.statusCode >= 500) {
      recentErrors.push({ path: req.path, status: res.statusCode, at: Date.now() });
      if (recentErrors.length > 50) recentErrors.shift();
    }
  });
  next();
});
// Serve welcome page at root
app.get('/', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});
app.get('/index.html', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.redirect(301, '/welcome.html');
});
// Expose minimal public config for the frontend (no secrets)
app.get('/public-config.json', (req, res) => {
  const forwardedProto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const proto = forwardedProto || req.protocol || 'https';
  const redirectUriRaw =
    config.TWITCH_REDIRECT_URI ||
    `${proto}://${req.get('host')}/login.html`;
  const redirectUri = (redirectUriRaw || '').trim().replace(/\\+$/, '');
  res.json({
    twitchClientId: config.TWITCH_CLIENT_ID || '',
    redirectUri,
    streamerLogin: config.STREAMER_LOGIN || '',
    botAdminLogin: config.BOT_ADMIN_LOGIN || '',
    paypalClientId: config.PAYPAL_CLIENT_ID || '',
    minBet: config.GAME_MIN_BET || 0,
    potGlowMultiplier: config.POT_GLOW_MULTIPLIER || 5,
    defaultChannel: DEFAULT_CHANNEL,
  });
});

// Admin-only bot chat page
app.get('/admin-chat.html', auth.requireAdmin, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-chat.html'));
});

app.get('/admin-chat', auth.requireAdmin, (_req, res) => {
  res.redirect('/admin-chat.html');
});

app.get('/admin-code.html', auth.requireAdmin, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-code.html'));
});

app.get('/admin-code', auth.requireAdmin, (_req, res) => {
  res.redirect('/admin-code.html');
});

/**
 * Admin: begin Twitch subs OAuth (redirect to Twitch)
 * Query: channel (optional)
 */
app.get('/auth/twitch/subs', auth.requireAdmin, (req, res) => {
  try {
    if (!config.TWITCH_CLIENT_ID) {
      return res.status(400).send('Missing TWITCH_CLIENT_ID');
    }
    const channel = (req.query?.channel || DEFAULT_CHANNEL);
    const redirectUri = config.TWITCH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/twitch/subs/callback`;
    const state = encodeURIComponent(`subauth:${channel}`);
    const scopes = [
      'channel:read:subscriptions',
      'channel:read:vips',
      'moderator:read:followers',
    ];
    const scope = encodeURIComponent(scopes.join(' '));
    const authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${config.TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    return res.redirect(authUrl);
  } catch (err) {
    logger.error('twitch sub auth redirect failed', { error: err.message });
    return res.status(500).send('auth_failed');
  }
});

/**
 * OAuth callback for Twitch subs
 * Query: code, state=subauth:<channel>
 */
app.get('/auth/twitch/subs/callback', async (req, res) => {
  const { code, state } = req.query || {};
  try {
    if (!code) return res.status(400).send('Missing code');
    const parsedState = decodeURIComponent(state || '');
    const channel = (parsedState.startsWith('subauth:') ? parsedState.replace('subauth:', '') : DEFAULT_CHANNEL) || DEFAULT_CHANNEL;
    const redirectUri = config.TWITCH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/twitch/subs/callback`;
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.TWITCH_CLIENT_ID,
        client_secret: config.TWITCH_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      logger.warn('twitch token exchange failed', { status: tokenRes.status, text });
      return res.status(400).send('Token exchange failed');
    }
    const tokenData = await tokenRes.json();
    db.setTwitchSubToken(channel, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_in ? (Date.now() / 1000 + tokenData.expires_in) : null,
    });
    return res.send('Twitch subscription access saved. You can close this window.');
  } catch (err) {
    logger.error('twitch sub auth callback failed', { error: err.message });
    return res.status(500).send('auth_failed');
  }
});
app.use('/uploads', express.static(uploadsDir));
app.use(express.static('public'));

// Partner payouts: partner-facing summary (Postgres-only)
app.get('/partner/payouts', async (req, res) => {
  try {
    const partnerId = auth.extractUserLogin(req);
    if (!validation.validateUsername(partnerId || '')) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (!payoutStore || !payoutStore.getPartnerSummary) {
      return res.status(501).json({ error: 'payouts_unavailable' });
    }
    const summary = await payoutStore.getPartnerSummary(partnerId);
    if (!summary) return res.status(404).json({ error: 'not_found' });
    return res.json(summary);
  } catch (err) {
    logger.error('partner payouts fetch failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Public cosmetic catalog (read-only)
app.get('/catalog', (_req, res) => {
  res.json(db.getCatalog());
});

function normalizeChannelName(name) {
  return normalizeChannelNameScoped(name);
}

function savePremierLogo(login, dataUrl) {
  if (!validation.validateUsername(login)) {
    throw new Error('invalid login');
  }
  const match = /^data:(image\/(png|jpeg));base64,(.+)$/i.exec(dataUrl || '');
  if (!match) throw new Error('invalid image data');
  const mime = match[1];
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const buf = Buffer.from(match[3], 'base64');
  if (buf.length > 2 * 1024 * 1024) throw new Error('image too large (max 2MB)');
  const dir = path.join(uploadsDir, login.toLowerCase());
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `logo.${ext}`);
  fs.writeFileSync(filePath, buf);
  const url = `/uploads/${login.toLowerCase()}/logo.${ext}`;
  return { filePath, url };
}

function validatePalette(palette) {
  if (!Array.isArray(palette) || !palette.length) return null;
  const hex = /^#([0-9a-fA-F]{6})$/;
  return palette.filter((c) => typeof c === 'string' && hex.test(c)).slice(0, 5);
}

function validatePremierProposal(proposalRaw) {
  let p = proposalRaw;
  if (typeof p === 'string') {
    try {
      p = JSON.parse(p);
    } catch (e) {
      throw new Error('invalid JSON');
    }
  }
  if (!p || typeof p !== 'object') throw new Error('invalid proposal');
  if (!Array.isArray(p.variants) || !p.variants.length) throw new Error('variants missing');
  const hex = /^#([0-9a-fA-F]{6})$/;
  const checkSlot = (slot) => {
    if (!slot || typeof slot !== 'object') return false;
    if (slot.colors && Array.isArray(slot.colors) && !slot.colors.every((c) => typeof c === 'string' && hex.test(c))) return false;
    return true;
  };
  p.variants.forEach((v) => {
    ['cardBack', 'tableSkin', 'avatarRing', 'nameplate'].forEach((k) => {
      if (!checkSlot(v[k])) throw new Error(`slot ${k} invalid`);
    });
  });
  if (p.palette) {
    const filtered = validatePalette(p.palette);
    if (!filtered) delete p.palette;
    else p.palette = filtered;
  }
  return p;
}

function buildOverlaySnapshot(channelRaw) {
  const channelName = normalizeChannelName(channelRaw || DEFAULT_CHANNEL) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const room = io.sockets?.adapter?.rooms?.get(channelName);
  const sockets = room ? room.size : 0;
  const players = Object.entries(state.playerStates || {}).map(([login, st]) => ({
    login,
    bet: (state.betAmounts && state.betAmounts[login]) || 0,
    balance: db.getBalance(login),
    handCount: Array.isArray(st.hand) ? st.hand.length : 0,
    folded: !!st.folded,
    stood: !!st.stood,
  }));
  return {
    channel: channelName,
    timestamp: Date.now(),
    sockets,
    mode: state.currentMode,
    bettingOpen: state.bettingOpen,
    roundInProgress: state.roundInProgress,
    pokerPhase: state.pokerPhase,
    pot: state.pokerPot,
    currentBet: state.pokerCurrentBet,
    waitingQueue: state.waitingQueue || [],
    communityCards: state.communityCards || [],
    deck: (state.currentDeck || []).length,
    dealerUp: state.dealerState?.hand?.[0] || null,
    overlaySettings: overlaySettingsByChannel[channelName] || null,
    overlayFx: overlayFxByChannel[channelName] || null,
    players,
  };
}

async function runOverlayDiagnosis(channel) {
  if (!config.OPENAI_API_KEY) return null;
  const snapshot = buildOverlaySnapshot(channel);
  const prompt = `You are a concise ops debugger for All-In Chat Poker. Given this overlay/game snapshot JSON, list the top issues and fixes in bullets (<=5), focusing on things that break rounds, overlays, or seating. Keep it short.\nSnapshot:\n${JSON.stringify(snapshot, null, 2)}`;
  const reply = await ai.chat(
    [
      { role: 'system', content: 'You are a terse, action-oriented devops assistant.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.2 }
  );
  lastOverlayDiagnosis = { channel: snapshot.channel, computedAt: Date.now(), reply, snapshot };
  return lastOverlayDiagnosis;
}

function generateLobbyCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = 'lobby-';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code.toLowerCase();
}

function shuffle(array = []) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function parseJsonSafe(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

function generateBracketAssignments(tournamentId, round = 1, roster = [], tableSize = 6) {
  const cleanSize = Math.min(Math.max(Number(tableSize) || 6, 2), 10);
  const shuffled = shuffle(roster);
  db.clearBracket(tournamentId, round);
  const tables = new Set();
  shuffled.forEach((login, idx) => {
    const tableNum = Math.floor(idx / cleanSize) + 1;
    const seatNum = (idx % cleanSize) + 1;
    db.upsertBracketSeat(tournamentId, round, tableNum, login);
    db.updateTournamentSeat(tournamentId, login, seatNum);
    tables.add(tableNum);
  });
  const bracket = db.listBracket(tournamentId, round);
  const tableChannels = Array.from(tables).sort((a, b) => a - b).map(tn => `t-${tournamentId}-r${round}-table-${tn}`);
  return { bracket, tableChannels, tableSize: cleanSize };
}

function getCurrentBlinds(state) {
  const t = state.tournamentId ? db.getTournament(state.tournamentId) : null;
  const levels = t ? parseJsonSafe(t.blind_config || '[]', []) : [];
  const idx = Math.max(0, (t?.current_level || 1) - 1);
  const level = levels[idx] || {};
  return {
    small: level.small || 50,
    big: level.big || 100,
  };
}

function applyTournamentPayouts(state, payoutPayload = {}) {
  if (!state.tournamentId) return [];
  const stacks = state.tournamentStacks || {};
  Object.entries(payoutPayload.payouts || {}).forEach(([login, amt]) => {
    stacks[login] = (stacks[login] || 0) + (amt || 0);
  });
  Object.keys(stacks).forEach(login => {
    db.updateTournamentPlayerChips(state.tournamentId, login, Math.max(0, stacks[login]));
  });
  state.tournamentStacks = stacks;
  return Object.keys(stacks).filter(login => (stacks[login] || 0) <= 0);
}

function bindTournamentTable(tournamentId, round, tableNum, channelName, players = []) {
  const state = getStateForChannel(channelName);
  const t = db.getTournament(tournamentId);
  const gameMode = (t?.game || 'poker').toLowerCase();
  state.tournamentId = tournamentId;
  state.tournamentTable = tableNum;
  state.tournamentRound = round;
  state.currentMode = gameMode === 'blackjack' ? 'blackjack' : 'poker';
  state.readyPlayers = new Set();
  state.roundInProgress = false;
  state.betAmounts = {};
  state.playerStates = {};
  state.waitingQueue = [];
  state.playerTurnOrder = [];
  state.playerTurnIndex = 0;
  state.pokerActed = new Set();
  state.pokerStreetBets = {};
  state.pokerPot = 0;
  state.pokerCurrentBet = 0;
  state.communityCards = [];
  state.tournamentStacks = state.tournamentStacks || {};
  players.forEach((login) => {
    const tp = db.getTournamentPlayer(tournamentId, login);
    const chips = tp?.chips ?? TOURNAMENT_DEFAULTS.starting_chips;
    state.tournamentStacks[login] = chips;
    state.playerStates[login] = {
      hand: [],
      hole: [],
      stood: false,
      busted: false,
      folded: false,
      split: false,
      hands: [],
      activeHand: 0,
      seat: tp?.seat || null,
    };
  });
  return state;
}

// ============ PAYPAL HELPERS ============
const PAYPAL_API_BASE =
  config.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  if (!config.PAYPAL_CLIENT_ID || !config.PAYPAL_CLIENT_SECRET) {
    throw new Error('paypal_not_configured');
  }
  const credentials = Buffer.from(
    `${config.PAYPAL_CLIENT_ID}:${config.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`paypal_token_failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function createPayPalOrder(amount = '5.00', description = 'All-In Chat Poker support') {
  const accessToken = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: amount },
          description,
        },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`paypal_create_failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function capturePayPalOrder(orderId) {
  const accessToken = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`paypal_capture_failed: ${res.status} ${text}`);
  }
  return res.json();
}

function sanitizeColor(color = '') {
  if (typeof color !== 'string') return null;
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

function hashLogin(login = '') {
  let hash = 0;
  for (let i = 0; i < login.length; i += 1) {
    hash = (hash << 5) - hash + login.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getDefaultAvatarForLogin(login = '', colorOverride = null) {
  const base = login || 'player';
  const idx = hashLogin(base) % DEFAULT_AVATAR_COLORS.length;
  const chosen = sanitizeColor(colorOverride) || DEFAULT_AVATAR_COLORS[idx];
  const color = chosen.replace('#', '');
  const letter = encodeURIComponent(base.charAt(0).toUpperCase() || 'P');
  // Simple SVG data URI with solid background and initial
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' fill='%23${color}'/><text x='50%' y='55%' font-size='64' text-anchor='middle' fill='white' font-family='Arial, sans-serif' dominant-baseline='middle'>${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

function sanitizeOverlaySettings(raw = {}) {
  const safe = {};
  const clamp = (val, min, max) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return null;
    return Math.min(max, Math.max(min, num));
  };
  const safeUrl = (val) => {
    if (typeof val !== 'string') return null;
    if (val.length > 512) return null;
    const trimmed = val.trim();
    if (trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.startsWith('data:')) return trimmed;
    return null;
  };
  const safeStr = (val) => (typeof val === 'string' ? val.trim() : null);

  const dealBase = clamp(raw.dealDelayBase, 0, 0.6);
  if (dealBase !== null) safe.dealDelayBase = Number(dealBase.toFixed(3));

  const dealCard = clamp(raw.dealDelayPerCard, 0, 0.3);
  if (dealCard !== null) safe.dealDelayPerCard = Number(dealCard.toFixed(3));

  const chipVol = clamp(raw.chipVolume, 0, 0.6);
  if (chipVol !== null) safe.chipVolume = Number(chipVol.toFixed(3));

  const potGlow = clamp(raw.potGlowMultiplier, 1, 20);
  if (potGlow !== null) safe.potGlowMultiplier = Number(potGlow.toFixed(2));

  if (typeof raw.cardBackVariant === 'string') {
    const variant = raw.cardBackVariant.toLowerCase();
    const allowed = ['default', 'emerald', 'azure', 'magenta', 'gold', 'custom'];
    if (allowed.includes(variant)) safe.cardBackVariant = variant;
  }

  const tint = sanitizeColor(raw.cardBackTint);
  if (tint) safe.cardBackTint = tint;

  const avatarRing = sanitizeColor(raw.avatarRingColor);
  if (avatarRing) safe.avatarRingColor = avatarRing;

  const profileBorder = sanitizeColor(raw.profileCardBorder);
  if (profileBorder) safe.profileCardBorder = profileBorder;

  const tableTint = sanitizeColor(raw.tableTint);
  if (tableTint) safe.tableTint = tableTint;

  const tableLogo = sanitizeColor(raw.tableLogoColor);
  if (tableLogo) safe.tableLogoColor = tableLogo;

  const backImg = safeUrl(raw.cardBackImage);
  if (backImg) safe.cardBackImage = backImg;

  const tableTexture = safeUrl(raw.tableTexture || raw.tableTextureUrl);
  if (tableTexture) safe.tableTexture = tableTexture;

  const cardFaceBase = safeUrl(raw.cardFaceBase) || safeStr(raw.cardFaceBase);
  if (cardFaceBase) safe.cardFaceBase = cardFaceBase;

  const ringImg = safeUrl(raw.avatarRingImage);
  if (ringImg) safe.avatarRingImage = ringImg;

  if (typeof raw.autoFillAi !== 'undefined') {
    safe.autoFillAi = !!raw.autoFillAi;
  }

  return safe;
}

function getChannelFromReq(req) {
  const bodyChannel = req && req.body && req.body.channel;
  const queryChannel = req && req.query && req.query.channel;
  const headerChannel = req && req.headers && (req.headers['x-channel'] || req.headers['x-streamer']);
  const channel =
    bodyChannel ||
    queryChannel ||
    headerChannel ||
    config.TWITCH_CHANNEL ||
    config.STREAMER_LOGIN ||
    DEFAULT_CHANNEL;
  return normalizeChannelName(channel);
}

function getChannelFromSocket(socket) {
  const authChannel = socket?.handshake?.auth?.channel;
  const queryChannel = socket?.handshake?.query?.channel;
  const channel =
    authChannel ||
    queryChannel ||
    config.TWITCH_CHANNEL ||
    config.STREAMER_LOGIN ||
    DEFAULT_CHANNEL;
  return normalizeChannelName(channel);
}

async function joinBotChannel(channelName) {
  const channel = normalizeChannelName(channelName);
  if (!channel) return;
  if (!tmiClient) {
    logger.warn('Cannot join channel; tmi client not ready', { channel });
    return;
  }
  db.addBotChannel(channel);
  try {
    await tmiClient.join(channel);
    logger.info('Bot joined channel', { channel });
  } catch (err) {
    logger.error('Failed to join channel', { channel, error: err.message });
  }
}

// ============ STATE MANAGEMENT ============

let currentDeck = [];
let currentHand = [];
let roundInProgress = false;
let bettingOpen = true;
let betAmounts = {};
let streamerProfile = null;
let playerStates = {};
let dealerState = { hand: [], shoe: [] };
let waitingQueue = [];
let communityCards = [];

const MAX_POKER_PLAYERS = 10;
const MAX_BLACKJACK_PLAYERS = 7;
let blackjackActionTimer = null;
let bettingTimer = null;
let pokerActionTimer = null;
let pokerPhase = 'preflop';
let pokerCurrentBet = 0;
let pokerStreetBets = {};
let pokerPot = 0;
let pokerActed = new Set();
let playerTurnOrder = [];
let playerTurnIndex = 0;
let turnManager = null;
let pokerHandlers = null;
let blackjackHandlers = null;
const playerHeuristics = {};
let roundStartedAt = null;

function getLegacyStateView() {
  return {
    get currentMode() { return currentMode; }, set currentMode(v) { currentMode = v; },
    get currentDeck() { return currentDeck; }, set currentDeck(v) { currentDeck = v; },
    get currentHand() { return currentHand; }, set currentHand(v) { currentHand = v; },
    get roundInProgress() { return roundInProgress; }, set roundInProgress(v) { roundInProgress = v; },
    get bettingOpen() { return bettingOpen; }, set bettingOpen(v) { bettingOpen = v; },
    get betAmounts() { return betAmounts; }, set betAmounts(v) { betAmounts = v; },
    get streamerProfile() { return streamerProfile; }, set streamerProfile(v) { streamerProfile = v; },
    get playerStates() { return playerStates; }, set playerStates(v) { playerStates = v; },
    get dealerState() { return dealerState; }, set dealerState(v) { dealerState = v; },
    get waitingQueue() { return waitingQueue; }, set waitingQueue(v) { waitingQueue = v; },
    get communityCards() { return communityCards; }, set communityCards(v) { communityCards = v; },
    get blackjackActionTimer() { return blackjackActionTimer; }, set blackjackActionTimer(v) { blackjackActionTimer = v; },
    get bettingTimer() { return bettingTimer; }, set bettingTimer(v) { bettingTimer = v; },
    get pokerActionTimer() { return pokerActionTimer; }, set pokerActionTimer(v) { pokerActionTimer = v; },
    get pokerPhase() { return pokerPhase; }, set pokerPhase(v) { pokerPhase = v; },
    get pokerCurrentBet() { return pokerCurrentBet; }, set pokerCurrentBet(v) { pokerCurrentBet = v; },
    get pokerStreetBets() { return pokerStreetBets; }, set pokerStreetBets(v) { pokerStreetBets = v; },
    get pokerPot() { return pokerPot; }, set pokerPot(v) { pokerPot = v; },
    get pokerActed() { return pokerActed; }, set pokerActed(v) { pokerActed = v; },
    get playerTurnOrder() { return playerTurnOrder; }, set playerTurnOrder(v) { playerTurnOrder = v; },
    get playerTurnIndex() { return playerTurnIndex; }, set playerTurnIndex(v) { playerTurnIndex = v; },
    get turnManager() { return turnManager; }, set turnManager(v) { turnManager = v; },
    get pokerHandlers() { return pokerHandlers; }, set pokerHandlers(v) { pokerHandlers = v; },
    get blackjackHandlers() { return blackjackHandlers; }, set blackjackHandlers(v) { blackjackHandlers = v; },
    get playerHeuristics() { return playerHeuristics; }, set playerHeuristics(v) { Object.assign(playerHeuristics, v); },
    get roundStartedAt() { return roundStartedAt; }, set roundStartedAt(v) { roundStartedAt = v; },
  };
}

// Provide a legacy state view for single-tenant mode so we can conditionally
// switch to channel-scoped state when MULTITENANT_ENABLED is true.
function getStateForChannel(channel = DEFAULT_CHANNEL) {
  if (!config.MULTITENANT_ENABLED) return getLegacyStateView();
  return stateAdapter.getState(normalizeChannelName(channel) || DEFAULT_CHANNEL);
}

function ensureHeuristic(login) {
  if (!playerHeuristics[login]) {
    playerHeuristics[login] = { history: [], streak: 0, tilt: 0, lastBetRatio: 0, rounds: 0, timeouts: [] };
  }
  return playerHeuristics[login];
}

function recordBetHeuristic(login, amount, balanceAfter) {
  const h = ensureHeuristic(login);
  const ratio = amount > 0 ? amount / (amount + Math.max(balanceAfter, 0.01)) : 0;
  h.lastBetRatio = ratio;
}

function recordOutcomeHeuristic(login, won) {
  const h = ensureHeuristic(login);
  h.history.push(won ? 1 : -1);
  if (h.history.length > config.STREAK_WINDOW) h.history.shift();
  h.streak = h.history.reduce((a, b) => a + b, 0);
  const tiltDelta = won ? -0.5 * h.lastBetRatio : h.lastBetRatio;
  h.tilt = Math.max(-3, Math.min(3, (h.tilt || 0) + tiltDelta));
  h.rounds = (h.rounds || 0) + 1;
}

function recordTimeoutHeuristic(login) {
  const h = ensureHeuristic(login);
  h.timeouts.push(Date.now());
  if (h.timeouts.length > config.BJ_TIMEOUT_WINDOW) h.timeouts.shift();
}

function isAiPlayer(login = '') {
  if (!login) return false;
  const profile = db.getProfile(login);
  if (profile && profile.role === 'ai') return true;
  return login.toLowerCase().startsWith('ai_bot');
}

function aiBlackjackAction(login, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const pState = getPlayerState(login, channelName);
  if (!pState || pState.stood || pState.busted) return false;
  const dealerUp = (state.dealerState?.hand && state.dealerState.hand[0]) || null;
  const dealerVal = (() => {
    if (!dealerUp) return 10;
    if (dealerUp.rank === 'A') return 11;
    if (['K', 'Q', 'J', '10'].includes(dealerUp.rank)) return 10;
    return parseInt(dealerUp.rank, 10) || 10;
  })();
  const bet = state.betAmounts[login] || config.GAME_MIN_BET;
  const balance = db.getBalance(login);
  const canDouble = balance >= bet;

  const getHand = () => (pState.isSplit && Array.isArray(pState.hands)
    ? (pState.hands[pState.activeHand] || pState.hand)
    : pState.hand);

  const isSoft = (cards) => {
    const val = blackjack.handValue(cards || []);
    const hasAce = (cards || []).some(c => c.rank === 'A');
    return hasAce && val <= 21 && val - 10 <= 11;
  };

  const act = () => {
    const hand = getHand() || [];
    const total = blackjack.handValue(hand);
    const soft = isSoft(hand);

    // Simple basic-strategy-ish rules
    if (hand.length === 2 && hand[0]?.rank === hand[1]?.rank && ['A', '8'].includes(hand[0].rank)) {
      state.blackjackHandlers?.split?.(login, state.betAmounts, db);
      return;
    }
    if (soft) {
      if (total <= 17) return state.blackjackHandlers?.hit?.(login);
      if (total === 18) {
        if (dealerVal >= 9) return state.blackjackHandlers?.hit?.(login);
        if (dealerVal <= 6 && canDouble) return state.blackjackHandlers?.doubleDown?.(login, state.betAmounts, db);
        return state.blackjackHandlers?.stand?.(login);
      }
      return state.blackjackHandlers?.stand?.(login);
    }
    if (total <= 8) return state.blackjackHandlers?.hit?.(login);
    if (total === 9 && dealerVal >= 3 && dealerVal <= 6 && canDouble) return state.blackjackHandlers?.doubleDown?.(login, state.betAmounts, db);
    if (total === 10 && dealerVal <= 9 && canDouble) return state.blackjackHandlers?.doubleDown?.(login, state.betAmounts, db);
    if (total === 11 && canDouble) return state.blackjackHandlers?.doubleDown?.(login, state.betAmounts, db);
    if (total === 12) {
      if (dealerVal >= 4 && dealerVal <= 6) return state.blackjackHandlers?.stand?.(login);
      return state.blackjackHandlers?.hit?.(login);
    }
    if (total >= 13 && total <= 16) {
      if (dealerVal >= 7) return state.blackjackHandlers?.hit?.(login);
      return state.blackjackHandlers?.stand?.(login);
    }
    return state.blackjackHandlers?.stand?.(login);
  };

  // resolve current hand; if split, step through hands
  const hands = pState.isSplit && Array.isArray(pState.hands) ? pState.hands : [pState.hand];
  for (let i = pState.activeHand || 0; i < hands.length; i += 1) {
    pState.activeHand = i;
    let guard = 0;
    while (!pState.stood && !pState.busted && guard < 6) {
      act();
      guard += 1;
    }
  }

  return true;
}

function rankNumber(rank) {
  if (!rank) return 0;
  const raw = typeof rank === 'string' ? rank.toUpperCase() : rank;
  const map = { A: 14, K: 13, Q: 12, J: 11, T: 10 };
  if (map[raw]) return map[raw];
  if (typeof raw === 'number') return raw;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function scorePreflopStrength(hole = []) {
  if (!hole || hole.length < 2) return 0.25;
  const v1 = rankNumber(hole[0].rank);
  const v2 = rankNumber(hole[1].rank);
  const suited = hole[0].suit && hole[1].suit && hole[0].suit === hole[1].suit;
  const isPair = v1 === v2;
  const gap = Math.abs(v1 - v2);
  const connectors = gap === 0 ? 0.18 : gap === 1 ? 0.12 : gap === 2 ? 0.08 : 0;
  const highCards = [v1, v2].filter(v => v >= 11).length;
  const pairBoost = isPair ? (v1 >= 10 ? 0.55 : 0.38) : 0;
  const suitedBoost = suited ? 0.1 : 0;
  const highBoost = highCards * 0.08;
  return Math.min(0.9, 0.25 + highBoost + pairBoost + connectors + suitedBoost);
}

function computeDrawScore(cards = []) {
  if (!Array.isArray(cards) || !cards.length) return 0;
  const suits = cards.reduce((m, c) => {
    const key = c.suit || c;
    m[key] = (m[key] || 0) + 1;
    return m;
  }, {});
  const maxSuit = Math.max(...Object.values(suits), 0);
  const flushDraw = maxSuit >= 5 ? 0.35 : maxSuit === 4 ? 0.18 : maxSuit === 3 ? 0.08 : 0;

  const values = Array.from(new Set(cards.map(c => rankNumber(c.rank || c))));
  values.sort((a, b) => a - b);
  const withWheel = values.includes(14) ? values.concat([1]) : values.slice();
  let bestRun = 1;
  let run = 1;
  for (let i = 1; i < withWheel.length; i += 1) {
    if (withWheel[i] === withWheel[i - 1] + 1) run += 1;
    else run = 1;
    if (run > bestRun) bestRun = run;
  }
  const straightDraw = bestRun >= 5 ? 0.32 : bestRun === 4 ? 0.16 : bestRun === 3 ? 0.08 : 0;

  const counts = cards.reduce((m, c) => {
    const r = c.rank || c;
    m[r] = (m[r] || 0) + 1;
    return m;
  }, {});
  const pairish = Object.values(counts).some(v => v >= 2) ? 0.08 : 0;
  return flushDraw + straightDraw + pairish;
}

function scorePokerStrength(hole = [], community = []) {
  if (!hole || !hole.length) return 0.2;
  if (!community || !community.length) return scorePreflopStrength(hole);
  const known = hole.concat(community);
  const evalScore = typeof game.evaluateBestOfSeven === 'function' ? game.evaluateBestOfSeven(known) : { rank: 0 };
  const madeScore = Math.min(0.95, (evalScore.rank || 0) / 8);
  const drawScore = computeDrawScore(known);
  const preflop = scorePreflopStrength(hole);
  return Math.min(0.98, Math.max(preflop * 0.3, madeScore + drawScore));
}

function aiPokerAction(login, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const pState = getPlayerState(login, channelName);
  if (!pState || pState.folded) return false;

  const streetBet = state.pokerStreetBets[login] || 0;
  const needed = Math.max(0, state.pokerCurrentBet - streetBet);
  const balance = state.tournamentId && state.tournamentStacks ? (state.tournamentStacks[login] || 0) : db.getBalance(login);
  const pot = state.pokerPot || 0;
  const stackRatio = balance > 0 ? needed / balance : 1;
  const community = state.communityCards || [];
  const hole = pState.hole || [];
  const phase = state.pokerPhase || (community.length >= 5 ? 'river' : community.length === 4 ? 'turn' : community.length === 3 ? 'flop' : 'preflop');

  const strength = scorePokerStrength(hole, community);
  const made = typeof game.evaluateBestOfSeven === 'function' ? game.evaluateBestOfSeven(hole.concat(community)) : { rank: 0 };
  const madeRank = made.rank || 0;
  const potOdds = needed > 0 ? needed / Math.max((pot || 0) + needed, 1) : 0;
  const effPot = Math.max(pot + needed, 1);
  const spr = Math.min(10, Math.max(0.1, Math.min(balance, effPot) / Math.max(pot, 1)));
  const aggression = Math.min(1.1, Math.max(0, (strength * 0.85) + (madeRank >= 6 ? 0.2 : 0) - (potOdds * 0.35) - (spr > 5 ? 0.05 : 0)));
  const bluff = potOdds < 0.35 && strength < 0.45 && Math.random() < 0.12;

  if (needed === 0) {
    const raiseDelta = Math.max(config.GAME_MIN_BET, Math.floor(((pot || config.GAME_MIN_BET) * (0.35 + aggression))));
    const raiseTo = Math.min(config.GAME_MAX_BET, Math.min(balance + streetBet, state.pokerCurrentBet + raiseDelta));
    if (strength > 0.62 || madeRank >= 5 || bluff) {
      if (raiseTo > state.pokerCurrentBet) pokerRaiseAction(login, raiseTo, channelName);
      else pokerCheckAction(login, channelName);
    } else {
      pokerCheckAction(login, channelName);
    }
    return true;
  }

  if (balance <= needed) {
    pokerCallAction(login, channelName); // all-in
    return true;
  }

  if (strength < 0.28 && potOdds > 0.6 && phase !== 'flop' && !bluff) {
    pokerFoldAction(login, channelName);
    return true;
  }

  if (strength > 0.82 || (madeRank >= 6 && potOdds <= 0.65)) {
    const raiseSize = Math.max(needed, Math.floor((pot || config.GAME_MIN_BET) * (0.45 + aggression)));
    const raiseTo = Math.min(config.GAME_MAX_BET, Math.min(balance + streetBet, state.pokerCurrentBet + raiseSize));
    if (raiseTo > state.pokerCurrentBet) pokerRaiseAction(login, raiseTo, channelName);
    else pokerCallAction(login, channelName);
    return true;
  }

  const affordable = stackRatio <= 0.45 || needed <= Math.max(config.GAME_MIN_BET, Math.floor(balance * (0.15 + strength * 0.35)));
  if ((strength > 0.55 || potOdds < 0.45) && affordable) {
    if (aggression > 0.6 && balance > needed + config.GAME_MIN_BET) {
      const bump = Math.max(config.GAME_MIN_BET, Math.floor((pot || config.GAME_MIN_BET) * (0.18 + aggression * 0.35)));
      const raiseTo = Math.min(config.GAME_MAX_BET, Math.min(balance + streetBet, state.pokerCurrentBet + bump));
      if (raiseTo > state.pokerCurrentBet) pokerRaiseAction(login, raiseTo, channelName);
      else pokerCallAction(login, channelName);
    } else {
      pokerCallAction(login, channelName);
    }
    return true;
  }

  if (bluff && stackRatio < 0.45 && balance > needed + config.GAME_MIN_BET) {
    const raiseTo = Math.min(config.GAME_MAX_BET, state.pokerCurrentBet + Math.max(config.GAME_MIN_BET, needed));
    pokerRaiseAction(login, Math.min(balance, raiseTo), channelName);
    return true;
  }

  if (strength > 0.38 && stackRatio < 0.3 && potOdds < 0.65) {
    pokerCallAction(login, channelName);
    return true;
  }

  pokerFoldAction(login, channelName);
  return true;
}

function getHeuristics(login) {
  const h = playerHeuristics[login] || { streak: 0, tilt: 0, rounds: 0, timeouts: [] };
  const timeouts = Array.isArray(h.timeouts) ? h.timeouts : [];
  const afk = timeouts.length >= config.BJ_TIMEOUT_THRESHOLD;
  return { streak: h.streak || 0, tilt: h.tilt || 0, rounds: h.rounds || 0, afk };
}

function updateHeuristicsAfterPayout(prevBets = {}, payoutPayload, dbInstance, channel = DEFAULT_CHANNEL) {
  const payoutMap = (payoutPayload && payoutPayload.payouts) || {};
  Object.keys(prevBets || {}).forEach(login => {
    const win = (payoutMap[login] || 0) > 0;
    recordOutcomeHeuristic(login, win);
    const heur = getHeuristics(login);
    const balance = dbInstance ? dbInstance.getBalance(login) : db.getBalance(login);
    io.to(channel || DEFAULT_CHANNEL).emit('playerUpdate', { login, streak: heur.streak, tilt: heur.tilt, balance, bet: 0, afk: heur.afk, channel: channel || DEFAULT_CHANNEL });
  });
}

function getBlackjackTurnDuration(login) {
  const base = config.BJ_ACTION_DURATION_MS;
  const heur = getHeuristics(login);
  let duration = base;
  const timeouts = (playerHeuristics[login]?.timeouts || []).length;
  if (timeouts >= config.BJ_TIMEOUT_THRESHOLD) {
    duration = base * config.BJ_TIMER_MIN_PCT;
  } else if ((heur.rounds || 0) < config.BJ_NEW_PLAYER_ROUNDS || timeouts === 0) {
    duration = base * config.BJ_TIMER_MAX_PCT;
  }
  duration = Math.max(config.BJ_TIMER_MIN_MS, Math.min(config.BJ_TIMER_MAX_MS, Math.floor(duration)));
  return duration;
}

/**
 * Get or init player state
 * @param {string} login
 * @returns {Object}
 */
function getPlayerState(login, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  if (!state.playerStates[login]) {
    state.playerStates[login] = {
      deck: [],
      hand: [],
      held: [],
      stood: false,
      busted: false,
      folded: false,
      avatarUrl: getDefaultAvatarForLogin(login),
    };
  }
  return state.playerStates[login];
}

function updatePlayerAvatar(login, color, channel = DEFAULT_CHANNEL) {
  if (!validation.validateUsername(login || '')) return null;
  const profile = db.getProfile(login);
  const safeColor = sanitizeColor(color);
  let parsed = {};
  try {
    parsed = profile?.settings ? JSON.parse(profile.settings) : {};
  } catch {
    parsed = {};
  }
  parsed.avatarColor = safeColor || parsed.avatarColor;
  parsed.avatarUrl = getDefaultAvatarForLogin(login, parsed.avatarColor);
  db.upsertProfile({
    login,
    display_name: profile?.display_name || login,
    settings: parsed,
    role: profile?.role || 'player',
  });
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const pState = getPlayerState(login, channelName);
  pState.avatarUrl = parsed.avatarUrl;
  io.to(channelName).emit('playerUpdate', { login, avatar: parsed.avatarUrl, channel: channelName });
  return parsed.avatarUrl;
}

// Rate limiting
const adminLoginAttempts = new Map();
const blockedIPs = new Map();

/**
 * Extract actor identifier (admin username) from request for audit logs
 * @param {Object} req
 */
function getActorFromReq(req) {
  try {
    const payload = auth.extractJWT(req);
    if (payload && payload.adminName) return payload.adminName;
  } catch (e) {
    // ignore
  }
  if (req && req.body && req.body.adminUser) return req.body.adminUser;
  return 'admin';
}

/**
 * Check if IP is blocked
 * @param {string} ip
 * @returns {boolean}
 */
function isIPBlocked(ip) {
  const block = blockedIPs.get(ip);
  if (!block) return false;
  if (Date.now() > block.unblockTime) {
    blockedIPs.delete(ip);
    return false;
  }
  return true;
}

/**
 * Block IP with exponential backoff
 * @param {string} ip
 */
function blockIP(ip) {
  const existing = blockedIPs.get(ip) || { attempts: 0 };
  const attempts = existing.attempts + 1;
  const penalty = config.ADMIN_LOGIN_BASE_PENALTY_SECONDS * Math.pow(2, attempts - 1);
  const unblockTime = Date.now() + penalty * 1000;

  blockedIPs.set(ip, {
    attempts,
    unblockTime,
    blockedAt: new Date(),
  });

  logger.warn('IP blocked due to failed login attempts', {
    ip,
    attempts,
    penaltySeconds: penalty,
  });
}

/**
 * Record login attempt
 * @param {string} ip
 * @returns {boolean} - true if still allowed, false if over limit
 */
function recordLoginAttempt(ip) {
  if (isIPBlocked(ip)) return false;

  const now = Date.now();
  const windowStart = now - config.ADMIN_LOGIN_ATTEMPT_WINDOW_SECONDS * 1000;
  const attempts = adminLoginAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(t => t > windowStart);

  if (recentAttempts.length >= config.ADMIN_LOGIN_MAX_ATTEMPTS) {
    blockIP(ip);
    return false;
  }

  recentAttempts.push(now);
  adminLoginAttempts.set(ip, recentAttempts);
  return true;
}

/**
 * Place or adjust a bet for a username, handling balance deductions
 * @param {string} username
 * @param {number} amount
 * @param {string} channel
 * @returns {boolean} success
 */
function placeBet(username, amount, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  if (!state.bettingOpen) {
    logger.debug('Bet rejected; betting closed', { username, channel: channelName });
    return false;
  }

  const maxPlayers = state.currentMode === 'blackjack' ? MAX_BLACKJACK_PLAYERS : MAX_POKER_PLAYERS;
  const isNewPlayer = state.betAmounts[username] === undefined;
  const activeCount = Object.keys(state.betAmounts).length + (isNewPlayer ? 1 : 0);
  if (isNewPlayer && activeCount > maxPlayers) {
    if (!state.waitingQueue.includes(username)) state.waitingQueue.push(username);
    logger.warn('Bet rejected; table full, added to queue', { username, maxPlayers, channel: channelName });
    return false;
  }

  if (!validation.validateUsername(username)) {
    logger.debug('Rejected bet with invalid username', { username, channel: channelName });
    return false;
  }

  if (!Number.isInteger(amount) || amount < config.GAME_MIN_BET || amount > config.GAME_MAX_BET) {
    logger.debug('Rejected bet with invalid amount', { username, amount, channel: channelName });
    return false;
  }

  const existingBet = state.betAmounts[username] || 0;
  const usingTournamentStack = state.tournamentId && state.tournamentStacks && typeof state.tournamentStacks[username] === 'number';
  const currentBalance = usingTournamentStack ? state.tournamentStacks[username] : db.getBalance(username);
  const available = currentBalance + existingBet; // refund previous bet to recalc
  const heur = getHeuristics(username, channelName);
  const tiltClamp = Math.max(config.GAME_MIN_BET, Math.floor(available * config.TILT_BET_CLAMP_RATIO));
  let targetAmount = amount;

  if (state.currentMode === 'blackjack') {
    if (amount > available * config.TILT_BET_WARN_RATIO) {
      logger.warn('Tilt warning: high bet ratio', { username, amount, available });
    }
    if (heur.tilt >= 2 && amount > tiltClamp && tiltClamp >= config.GAME_MIN_BET) {
      logger.warn('Clamping bet due to tilt', { username, requested: amount, clamped: tiltClamp });
      targetAmount = tiltClamp;
    }
  }

  if (targetAmount > available || available <= 0) {
    logger.warn('Bet exceeds available balance', { username, amount: targetAmount, available });
    if (!waitingQueue.includes(username)) waitingQueue.push(username);
    return false;
  }

  // Deduct new bet
  const newBalance = available - targetAmount;
  if (usingTournamentStack) {
    state.tournamentStacks[username] = newBalance;
  } else {
    db.setBalance(username, newBalance);
  }
  state.betAmounts[username] = targetAmount;
  if (state.currentMode === 'poker') {
    state.pokerCurrentBet = Math.max(state.pokerCurrentBet, targetAmount);
  }
  state.waitingQueue = state.waitingQueue.filter(u => u !== username);
  recordBetHeuristic(username, targetAmount, newBalance, channelName);

  // Ensure profile exists
  db.upsertProfile({
    login: username,
    display_name: username,
    settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
    role: 'player',
  });

  // Init state and refresh avatar for overlays (handles chat joiners without a fresh login)
  const playerState = getPlayerState(username, channelName);
  try {
    const profile = db.getProfile(username);
    const settings = profile?.settings ? JSON.parse(profile.settings) : {};
    const avatarUrl = settings?.avatarUrl || getDefaultAvatarForLogin(username, settings?.avatarColor);
    if (avatarUrl) {
      playerState.avatarUrl = avatarUrl;
      io.to(channelName).emit('playerUpdate', { login: username, avatar: avatarUrl, channel: channelName });
    }
  } catch {
    // ignore parse errors and fallback avatar updates
  }

  logger.info('Bet placed', { username, amount, remaining: newBalance });
  const updatedHeur = getHeuristics(username, channelName);
  io.to(channelName).emit('playerUpdate', { login: username, bet: amount, balance: newBalance, streak: updatedHeur.streak, tilt: updatedHeur.tilt, channel: channelName });
  emitQueueUpdate(channelName);
  return true;
}

function startPokerActionTimer(channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const emitter = io.to(channelName);
  if (state.pokerActionTimer) clearTimeout(state.pokerActionTimer);
  state.pokerActionTimer = startPokerPhaseTimer(
    emitter,
    state.pokerPhase,
    state.communityCards,
    config.POKER_ACTION_DURATION_MS,
    () => advancePokerPhase(channelName),
    channelName
  );
}

function advancePokerPhase(channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  if (!state.roundInProgress || state.currentMode === 'blackjack') return;

  // Reset street bets/current bet for new street
  state.pokerStreetBets = {};
  state.pokerCurrentBet = 0;
  state.pokerActed = new Set();
  emitPokerBettingState(channel);

  if (state.pokerPhase === 'preflop') {
    // Deal flop
    state.communityCards = state.communityCards.concat(state.currentDeck.splice(0, 3));
    state.pokerPhase = 'flop';
    startPokerActionTimer(channel);
    return;
  }
  if (state.pokerPhase === 'flop') {
    state.communityCards = state.communityCards.concat(state.currentDeck.splice(0, 1));
    state.pokerPhase = 'turn';
    startPokerActionTimer(channel);
    return;
  }
  if (state.pokerPhase === 'turn') {
    state.communityCards = state.communityCards.concat(state.currentDeck.splice(0, 1));
    state.pokerPhase = 'river';
    startPokerActionTimer(channel);
    return;
  }
  if (state.pokerPhase === 'river') {
    state.pokerPhase = 'showdown';
    if (state.pokerActionTimer) clearTimeout(state.pokerActionTimer);
    settleRound({ channel });
    return;
  }
}

function settleRound(data) {
  const channel = normalizeChannelName(data?.channel || DEFAULT_CHANNEL) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channel);
  const emitter = io.to(channel);
  try {
    const prevBets = { ...state.betAmounts };
    const participants = Object.keys(prevBets || {});
    const elapsedSec = state.roundStartedAt ? Math.max(1, Math.round((Date.now() - state.roundStartedAt) / 1000)) : 0;
    const statsMeta = { playSeconds: elapsedSec, hands: 1 };
    let broke = [];
    if (state.currentMode === 'blackjack') {
      const { broke: brokeBj, nextWaiting, nextBetAmounts, nextPlayerStates, payoutPayload } = settleAndEmitBlackjack(emitter, state.dealerState, state.playerStates, state.betAmounts, state.waitingQueue, db, channel, statsMeta);
      state.waitingQueue = nextWaiting;
      state.betAmounts = nextBetAmounts;
      state.playerStates = nextPlayerStates;
      if (state.tournamentId) {
        broke = applyTournamentPayouts(state, payoutPayload);
      } else {
        updateHeuristicsAfterPayout(prevBets, payoutPayload, db, channel);
        broke = brokeBj;
      }
    } else {
      const { broke: brokePk, nextWaiting, nextBetAmounts, nextPlayerStates, payoutPayload } = settleAndEmitPoker(emitter, state.playerStates, state.communityCards, state.betAmounts, state.waitingQueue, db, channel, statsMeta);
      state.waitingQueue = nextWaiting;
      state.betAmounts = nextBetAmounts;
      state.playerStates = nextPlayerStates;
      if (state.tournamentId) {
        broke = applyTournamentPayouts(state, payoutPayload);
      } else {
        updateHeuristicsAfterPayout(prevBets, payoutPayload, db, channel);
        broke = brokePk;
      }
    }

    broke.forEach(login => {
      if (!state.waitingQueue.includes(login)) state.waitingQueue.push(login);
    });

    if (participants.length) {
      db.addPartnerUsage(channel, participants);
    }

    Object.keys(prevBets).forEach(async (login) => {
      await maybeAutoUnlockCosmetics(login, channel);
    });

    cleanupAfterSettle(channel);
  } catch (err) {
    logger.error('Failed to process round settle', { error: err.message, channel });
  }
}

function cleanupAfterSettle(channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  state.betAmounts = {};
  state.playerStates = {};
  state.pokerCurrentBet = 0;
  state.pokerStreetBets = {};
  state.pokerPot = 0;
  state.pokerActed = new Set();
  state.roundInProgress = false;
  state.bettingOpen = false;
  state.roundStartedAt = null;
  state.readyPlayers = new Set();
  if (state.bettingTimer) clearTimeout(state.bettingTimer);
  if (state.blackjackActionTimer) clearTimeout(state.blackjackActionTimer);
  if (state.pokerActionTimer) clearTimeout(state.pokerActionTimer);
  if (state.turnManager && state.turnManager.stop) state.turnManager.stop();
  emitQueueUpdate(channel);
  emitReadyStatus(channel);
}

function emitReadyStatus(channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const ready = Array.from(state.readyPlayers || []).map(r => r.toLowerCase());
  const round = state.tournamentRound || 1;
  const tableNum = state.tournamentTable || 1;
  let required = [];
  if (state.tournamentId) {
    required = getBracketSeats(state.tournamentId, round, tableNum).map(s => s.toLowerCase());
  }
  const allReady = required.length > 0 && required.every(r => ready.includes(r));
  io.to(channelName).emit('readyStatus', {
    channel: channelName,
    ready,
    required,
    readyCount: ready.length,
    requiredCount: required.length,
    allReady,
  });

  // If everyone at a tournament table is ready and nothing is running, auto-start with blinds/antes.
  if (allReady && state.tournamentId && !state.roundInProgress) {
    autoStartTournamentTable(channelName);
  }
}

function emitQueueUpdate(channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const bets = Object.keys(state.betAmounts).length;
  io.to(channelName).emit('queueUpdate', {
    waiting: state.waitingQueue,
    limits: {
      poker: MAX_POKER_PLAYERS,
      blackjack: MAX_BLACKJACK_PLAYERS,
    },
    activeBets: bets,
    channel: channelName,
  });
}

function openBettingWindow(channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  if (state.roundInProgress) return;

  // Reset round state for new betting window
  state.betAmounts = {};
  state.playerStates = {};
  state.pokerCurrentBet = 0;
  state.pokerStreetBets = {};
  state.pokerPot = 0;
  state.pokerActed = new Set();
  state.dealerState = { hand: [], shoe: [] };
  state.communityCards = [];
  state.pokerPhase = 'preflop';
  state.playerTurnOrder = [];
  state.playerTurnIndex = 0;
  state.roundStartedAt = null;

  state.bettingOpen = true;
  const duration = state.currentMode === 'blackjack' ? config.BJ_BETTING_DURATION_MS : config.BETTING_PHASE_DURATION_MS;
  const endsAt = Date.now() + duration;
  // Auto-seat AI in queue when betting opens
  autoBetAiInQueue(channelName);

  if (state.bettingTimer) clearTimeout(state.bettingTimer);
  state.bettingTimer = setTimeout(() => {
    state.bettingOpen = false;
    startRoundInternal(channelName);
  }, duration);

  io.to(channelName).emit('bettingStarted', { duration, endsAt, mode: state.currentMode, channel: channelName });
}

function startRoundInternal(channel = DEFAULT_CHANNEL, opts = {}) {
  const preserveBets = opts.preserveBets || false;
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const channelEmitter = io.to(channelName);
  try {
    if (state.bettingTimer) clearTimeout(state.bettingTimer);
    state.bettingOpen = false;
    state.roundInProgress = true;
    const preservedBets = preserveBets ? { ...state.betAmounts } : {};
    state.playerStates = {};
    state.pokerCurrentBet = 0;
    state.pokerStreetBets = {};
    state.pokerPot = 0;
    state.pokerActed = new Set();
    state.dealerState = { hand: [], shoe: state.dealerState.shoe || [] };
    state.communityCards = [];
    state.pokerPhase = 'preflop';
    state.playerTurnOrder = [];
    state.playerTurnIndex = 0;

    const maxSeats = state.currentMode === 'blackjack' ? MAX_BLACKJACK_PLAYERS : MAX_POKER_PLAYERS;
    if (preserveBets && Object.keys(preservedBets).length) {
      state.betAmounts = preservedBets;
    } else {
      state.betAmounts = {};
    }

    let bettors = Object.keys(state.betAmounts);
    if (overlaySettingsByChannel[channelName]?.autoFillAi) {
      const needed = Math.max(0, maxSeats - bettors.length);
      if (needed > 0) {
        const prevOpen = state.bettingOpen;
        state.bettingOpen = true;
        addTestBots(channelName, needed, maxSeats);
        state.bettingOpen = prevOpen;
        bettors = Object.keys(state.betAmounts);
      }
    }
    if (bettors.length === 0 && state.currentMode === 'blackjack') {
      // Blackjack only: auto-place min bet for first queued player if available
      const next = state.waitingQueue.shift();
      if (next) {
        const minBet = config.GAME_MIN_BET;
        placeBet(next, minBet, channelName);
        emitQueueUpdate(channelName);
      }
    }

    const activeBettors = Object.keys(state.betAmounts);
    if (activeBettors.length === 0) {
      io.to(channelName).emit('error', 'No bets placed');
      state.roundInProgress = false;
      return;
    }

    if (state.currentMode === 'blackjack') {
      const bj = startBlackjackRound(state.dealerState, state.playerStates, activeBettors, MAX_BLACKJACK_PLAYERS);
      state.currentHand = bj.dealerHand;
      state.currentDeck = bj.dealerShoe;
      state.blackjackHandlers = createBlackjackHandlers(
        channelEmitter,
        state.dealerState,
        state.playerStates,
        () => settleRound({ channel: channelName }),
        () => startPlayerTurnCycle(channelName),
        getBlackjackTurnDuration,
        recordTimeoutHeuristic,
        channelName
      );
      state.pokerHandlers = null;
    } else {
      const { deck, community } = startPokerRound(state.playerStates, activeBettors, MAX_POKER_PLAYERS);
      state.currentDeck = deck;
      state.communityCards = community;
      state.pokerCurrentBet = Math.max(...activeBettors.map(b => state.betAmounts[b] || 0), 0);
      state.pokerStreetBets = {};
      state.pokerPot = 0;
      activeBettors.forEach(login => {
        const amt = state.betAmounts[login] || 0;
        state.pokerStreetBets[login] = amt;
        state.pokerPot += amt;
      });
      state.pokerActed = new Set(activeBettors.filter(login => (state.pokerStreetBets[login] || 0) >= state.pokerCurrentBet));
      emitPokerBettingState(channelName);
      state.pokerHandlers = createPokerHandlers(
        channelEmitter,
        state.playerStates,
        state.communityCards,
        () => settleRound({ channel: channelName }),
        (login) => {
          const streetBet = state.pokerStreetBets[login] || 0;
          return streetBet < state.pokerCurrentBet;
        },
        channelName
      );
      state.blackjackHandlers = null;
    }
    state.playerTurnOrder = activeBettors.slice(0, state.currentMode === 'blackjack' ? MAX_BLACKJACK_PLAYERS : MAX_POKER_PLAYERS);
    state.playerTurnIndex = 0;

    logger.info('New round started', { channel: channelName });
    io.to(channelName).emit('roundStarted', {
      dealerHand: state.currentMode === 'blackjack' ? state.currentHand : null,
      players: Object.entries(state.playerStates).map(([login, pState]) => ({
        login,
        hand: pState.hand || pState.hole || [],
        hands: pState.hands,
        activeHand: pState.activeHand,
        split: pState.isSplit,
        insurance: pState.insurance,
        insurancePlaced: pState.insurancePlaced,
        bet: state.betAmounts[login] || 0,
        streetBet: state.pokerStreetBets[login] || 0,
        avatar: (db.getProfile(login)?.settings && JSON.parse(db.getProfile(login).settings || '{}').avatarUrl) || null,
        cosmetics: getCosmeticsForLogin(login),
      })),
      waiting: state.waitingQueue,
      community: state.communityCards,
      actionEndsAt: state.currentMode === 'blackjack' ? Date.now() + config.BJ_ACTION_DURATION_MS : null,
      mode: state.currentMode,
      pot: state.pokerPot,
      currentBet: state.pokerCurrentBet,
      channel: channelName,
    });

    // Blackjack action timer -> auto settle
    if (state.currentMode === 'blackjack') {
      if (state.blackjackActionTimer) clearTimeout(state.blackjackActionTimer);
      state.blackjackActionTimer = state.blackjackHandlers?.actionTimer?.();
    } else {
      // Poker action timer -> auto advance phase
      startPokerActionTimer(channelName);
    }
    startPlayerTurnCycle(channelName);
  } catch (err) {
    logger.error('Failed to start round', { error: err.message, channel: channelName });
    state.roundInProgress = false;
  }
}

/**
 * QA helper: add AI bots into the betting window for this channel
 * @param {string} channel
 * @param {number} count
 */
function addTestBots(channel = DEFAULT_CHANNEL, count = 3, maxSeats = MAX_BLACKJACK_PLAYERS) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  if (state.roundInProgress) return [];

  const safeCount = Math.max(1, Math.min(count || 3, maxSeats));
  // Ensure betting window is open so bets land
  if (!state.bettingOpen) {
    openBettingWindow(channelName);
  }

  const added = [];
  const used = new Set(Object.keys(state.betAmounts || {}));
  for (let i = 1; i <= safeCount; i += 1) {
    // pick a random name and append a discriminator if needed
    const baseName = AI_BOT_NAMES[Math.floor(Math.random() * AI_BOT_NAMES.length)] || `Bot${i}`;
    let login = baseName.replace(/\s+/g, '').toLowerCase();
    let suffix = 1;
    while (used.has(login)) {
      suffix += 1;
      login = `${baseName.replace(/\s+/g, '').toLowerCase()}${suffix}`;
    }
    used.add(login);

    // Ensure profile/balance exists
    db.upsertProfile({
      login,
      display_name: baseName,
      settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
      role: 'ai',
    });
    const currentBalance = db.getBalance(login);
    if (currentBalance < config.GAME_MIN_BET * 10) {
      db.setBalance(login, config.GAME_STARTING_CHIPS * 5);
    }

    // Force betting window flag in case timer just closed
    state.bettingOpen = true;
    placeBet(login, config.GAME_MIN_BET, channelName);
    added.push(login);
  }
  emitQueueUpdate(channelName);
  // If autoFill is enabled, auto-start once bots are seated
  if (overlaySettingsByChannel[channelName]?.autoFillAi && !state.roundInProgress) {
    setTimeout(() => {
      const freshState = getStateForChannel(channelName);
      const activeBettors = Object.keys(freshState.betAmounts || {}).length;
      if (!freshState.roundInProgress && activeBettors > 0) {
        startRoundInternal(channelName);
      }
    }, 350);
  }
  return added;
}

function autoBetAiInQueue(channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const queue = Array.isArray(state.waitingQueue) ? [...state.waitingQueue] : [];
  queue.forEach((login) => {
    const profile = db.getProfile(login);
    if (profile?.role === 'ai') {
      if (db.getBalance(login) < config.GAME_MIN_BET) {
        db.setBalance(login, Math.max(config.GAME_STARTING_CHIPS, config.GAME_MIN_BET * 10));
      }
      const ok = placeBet(login, config.GAME_MIN_BET, channelName);
      if (ok && Array.isArray(state.waitingQueue)) {
        state.waitingQueue = state.waitingQueue.filter(u => u !== login);
      }
    }
  });
  emitQueueUpdate(channelName);
}

/**
 * Validate Twitch user token and return profile basics
 * @param {string} token
 * @returns {Promise<{login:string, user_id:string, display_name:string, avatarUrl?:string}>}
 */
async function fetchTwitchUser(token) {
  const validateRes = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: {
      Authorization: `OAuth ${token}`,
    },
  });

  if (!validateRes.ok) {
    throw new Error(`Twitch validate failed: ${validateRes.status}`);
  }

  const validateData = await validateRes.json();
  const login = validateData.login;
  const user_id = validateData.user_id;

  let avatarUrl = undefined;
  let display_name = validateData.login;

  if (config.TWITCH_CLIENT_ID) {
    const userRes = await fetch(`https://api.twitch.tv/helix/users?id=${user_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': config.TWITCH_CLIENT_ID,
      },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      if (userData.data && userData.data[0]) {
        avatarUrl = userData.data[0].profile_image_url;
        display_name = userData.data[0].display_name || login;
      }
    }
  }

  return { login, user_id, display_name, avatarUrl };
}

/**
 * Get sanitized Helix token (strip oauth: prefix)
 */
function getHelixToken(channel) {
  if (channel) {
    const saved = db.getTwitchSubToken(channel);
    if (saved && saved.access_token) {
      return saved.access_token;
    }
  }
  const raw = config.TWITCH_OAUTH_TOKEN || '';
  if (!raw) return null;
  return raw.replace(/^oauth:/i, '').trim();
}

/**
 * Fetch Twitch user IDs for logins via Helix
 * @param {string[]} logins
 * @returns {Promise<Object>} map of login -> id
 */
async function fetchTwitchUsersByLogin(logins = [], channel) {
  const token = getHelixToken(channel);
  if (!token || !config.TWITCH_CLIENT_ID) return {};
  const qs = logins.map(l => `login=${encodeURIComponent(l)}`).join('&');
  const res = await fetch(`https://api.twitch.tv/helix/users?${qs}`, {
    headers: {
      'Client-ID': config.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    logger.warn('Helix users failed', { status: res.status });
    return {};
  }
  const data = await res.json();
  const map = {};
  (data.data || []).forEach(u => { map[u.login.toLowerCase()] = u.id; });
  return map;
}

/**
 * Check if user is subscribed to broadcaster using bot token with channel:read:subscriptions
 * @param {string} broadcasterLogin
 * @param {string} userLogin
 * @returns {Promise<boolean>}
 */
async function isUserSubscribedTo(broadcasterLogin, userLogin, channel) {
  if (!broadcasterLogin || !userLogin) return false;
  const token = getHelixToken(channel || broadcasterLogin);
  if (!token || !config.TWITCH_CLIENT_ID) return false;
  const ids = await fetchTwitchUsersByLogin([broadcasterLogin, userLogin], channel || broadcasterLogin);
  const bId = ids[broadcasterLogin.toLowerCase()];
  const uId = ids[userLogin.toLowerCase()];
  if (!bId || !uId) return false;
  const url = `https://api.twitch.tv/helix/subscriptions?broadcaster_id=${bId}&user_id=${uId}`;
  const res = await fetch(url, {
    headers: {
      'Client-ID': config.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    logger.warn('Helix subscription check failed', { status: res.status });
    return false;
  }
  const data = await res.json();
  return Array.isArray(data.data) && data.data.length > 0;
}

/**
 * Grant all subscriber cosmetics to a user
 */
function grantSubscriberCosmetics(login) {
  const catalog = db.getCatalog();
  const granted = [];
  catalog.forEach(item => {
    if ((item.unlock_type || '').toLowerCase() === 'subscriber') {
      db.grantCosmetic(login, item.id);
      granted.push(item.id);
    }
  });
  return granted;
}

/**
 * Grant VIP cosmetics
 */
function grantVipCosmetics(login) {
  const catalog = db.getCatalog();
  const granted = [];
  catalog.forEach(item => {
    if ((item.unlock_type || '').toLowerCase() === 'vip') {
      db.grantCosmetic(login, item.id);
      granted.push(item.id);
    }
  });
  return granted;
}

/**
 * Grant follower cosmetics
 */
function grantFollowerCosmetics(login) {
  const catalog = db.getCatalog();
  const granted = [];
  catalog.forEach(item => {
    if ((item.unlock_type || '').toLowerCase() === 'follower') {
      db.grantCosmetic(login, item.id);
      granted.push(item.id);
    }
  });
  return granted;
}

/**
 * Validate the configured bot token against Twitch /validate
 * @returns {Promise<{ok:boolean, scopes?:Array, client_id?:string, login?:string, status?:number}>}
 */
async function validateBotToken() {
  const token = getHelixToken();
  if (!token) return { ok: false, status: 401 };
  const res = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: { Authorization: `OAuth ${token}` },
  });
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  const data = await res.json();
  return { ok: true, scopes: data.scopes || [], client_id: data.client_id, login: data.login, status: 200 };
}

// ============ HTTP ENDPOINTS ============

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  const health = startup.getHealth();
  res.json(health);
});

/**
 * Admin login endpoint with rate limiting
 */
app.post('/admin/login', (req, res) => {
  try {
    const ip = req.ip;
    const { password } = req.body || {};

    // Validate input
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'password required' });
    }

    // Rate limit check
    if (!recordLoginAttempt(ip)) {
      logger.warn('Login attempt blocked - rate limited', { ip });
      return res.status(429).json({ error: 'too many attempts, try again later' });
    }

    // Check password
    if (password !== config.ADMIN_PASSWORD) {
      logger.warn('Failed login attempt', { ip });
      return res.status(401).json({ error: 'invalid password' });
    }

    // Success
    logger.info('Admin login successful', { ip });
    const jwtData = auth.createAdminJWT();
    const cookieOptions = auth.getAdminCookieOptions();

    res.cookie('admin_jwt', jwtData.token, cookieOptions);
    res.json({
      success: true,
      token: jwtData.token,
      expiresIn: jwtData.expiresIn,
    });
  } catch (err) {
    logger.error('Error in admin login', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Admin logout endpoint
 */
app.post('/admin/logout', (req, res) => {
  res.clearCookie('admin_jwt');
  res.json({ success: true });
});

/**
 * Create ephemeral admin token
 */
app.post('/admin/token', auth.requireAdmin, (req, res) => {
  // Optional TTL override (seconds)
  const ttl = (req.body && Number(req.body.ttl)) || config.EPHEMERAL_TOKEN_TTL_SECONDS;
  if (!Number.isInteger(ttl) || ttl <= 0 || ttl > 60 * 60 * 24) {
    return res.status(400).json({ error: 'invalid ttl' });
  }

  const token = db.createToken('admin_overlay', req.ip, ttl);
  logger.info('Ephemeral token created', { ip: req.ip, ttl });
  res.json({ token, ttl });
});

/**
 * Admin: overlay/game snapshot for a channel
 */
app.get('/admin/overlay-snapshot', auth.requireAdmin, (req, res) => {
  try {
    const channel = req.query.channel || DEFAULT_CHANNEL;
    const snapshot = buildOverlaySnapshot(channel);
    res.json({ snapshot, lastDiagnosis: lastOverlayDiagnosis });
  } catch (err) {
    logger.error('overlay snapshot failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Admin: send snapshot to AI for quick diagnosis
 */
app.post('/admin/overlay-diagnose', auth.requireAdmin, async (req, res) => {
  if (!config.OPENAI_API_KEY) return res.status(400).json({ error: 'ai_not_configured' });
  try {
    const channel = req.body?.channel || req.query?.channel || DEFAULT_CHANNEL;
    const result = await runOverlayDiagnosis(channel);
    res.json({ diagnosis: result });
  } catch (err) {
    logger.error('overlay diagnose failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Admin: AI test plan + execution
 */
app.post('/admin/ai-tests', auth.requireAdmin, async (_req, res) => {
  try {
    const report = await runAiTests('manual');
    res.json(report);
  } catch (err) {
    logger.error('AI tests failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Admin: get last AI test report
 */
app.get('/admin/ai-tests/report', auth.requireAdmin, (_req, res) => {
  res.json({ report: lastAiTestReport });
});

/**
 * Premier logo upload + AI branded set generator
 */
const PREMIER_PRESETS = {
  neon: 'Neon/tech: high contrast, teal/green glow, rounded corners, subtle glassmorphism, readable at small sizes.',
  metallic: 'Metal/forged: brushed metal nameplate, dark slate felt, chrome edge on cards/chips, restrained glow.',
  minimal: 'Minimal/clean: flat color blocks, 2-3 brand colors, thin strokes, high readability, no noise.',
};

app.post('/admin/premier/logo', auth.requireAdmin, (req, res) => {
  try {
    const login = (req.body?.login || '').toLowerCase();
    const dataUrl = req.body?.dataUrl || '';
    if (!login || !dataUrl) return res.status(400).json({ error: 'login and dataUrl required' });
    const saved = savePremierLogo(login, dataUrl);
    res.json({ ok: true, logoUrl: `${saved.url}?v=${Date.now()}` });
  } catch (err) {
    logger.warn('premier logo upload failed', { error: err.message });
    res.status(400).json({ error: err.message });
  }
});

app.post('/admin/premier/generate', auth.requireAdmin, async (req, res) => {
  if (!config.OPENAI_API_KEY) return res.status(400).json({ error: 'ai_not_configured' });
  try {
    const login = (req.body?.login || '').toLowerCase();
    const preset = (req.body?.preset || 'neon').toLowerCase();
    const palette = validatePalette(req.body?.palette);
    if (!login) return res.status(400).json({ error: 'login required' });
    if (!PREMIER_PRESETS[preset]) return res.status(400).json({ error: 'invalid preset' });
    const logoDir = path.join(uploadsDir, login);
    const logoPath = fs.existsSync(path.join(logoDir, 'logo.png'))
      ? `/uploads/${login}/logo.png`
      : fs.existsSync(path.join(logoDir, 'logo.jpg'))
        ? `/uploads/${login}/logo.jpg`
        : null;
    if (!logoPath) return res.status(400).json({ error: 'logo_missing' });

    const prompt = `You are designing branded cosmetics for a Twitch poker/blackjack overlay.
Brand login: ${login}
Logo URL (extract palette from it): ${logoPath}
Suggested palette (from logo): ${palette && palette.length ? palette.join(', ') : 'none provided'}
Style preset: ${preset} — ${PREMIER_PRESETS[preset]}

Requirements:
- Extract a 3-5 color palette from the logo (ensure contrast; include a safe text color).
- Generate TWO variants: "primary" and "alt".
- Safe-area guidance: avoid small text, avoid busy patterns behind ranks/suits, leave center readable.
- Slots: cardBack, tableSkin, avatarRing, nameplate.
- Each slot: name (4-16 chars), colors (array of hex), finish (matte/gloss/metal), render_note (concise).
- Use transparent backgrounds and match existing asset types/sizes (overlay expects PNGs sized for current cards/tables/avatar rings/nameplates; do not change aspect ratios).
- Keep JSON concise; no prose outside JSON.`;

    const reply = await ai.chat(
      [
        { role: 'system', content: 'Respond ONLY with JSON. Keep names short, 4-16 chars. Colors should be 2-4 hex values. Provide top-level keys: palette, variants (array of 2 variants with slots cardBack, tableSkin, avatarRing, nameplate). Note that downstream renderers expect transparent PNGs matching existing asset dimensions; describe usage, not base64.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.4 }
    );

    const validated = validatePremierProposal(reply);
    const history = premierHistory.get(login) || [];
    history.push({ at: Date.now(), preset, proposal: validated, logoUrl: logoPath });
    if (history.length > 5) history.shift();
    premierHistory.set(login, history);
    res.json({ login, preset, logoUrl: logoPath, proposal: validated, history });
  } catch (err) {
    logger.error('premier generate failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/premier/apply', auth.requireAdmin, (req, res) => {
  try {
    const login = (req.body?.login || '').toLowerCase();
    const proposal = req.body?.proposal;
    if (!login || !proposal) return res.status(400).json({ error: 'login and proposal required' });
    const validated = validatePremierProposal(proposal);
    const channelName = normalizeChannelName(login) || login;
    overlaySettingsByChannel[channelName] = overlaySettingsByChannel[channelName] || {};
    overlaySettingsByChannel[channelName].brandingProposal = validated;
    io.to(channelName).emit('overlaySettings', { settings: overlaySettingsByChannel[channelName], channel: channelName });
    res.json({ ok: true, channel: channelName });
  } catch (err) {
    logger.error('premier apply failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/premier/test-apply', auth.requireAdmin, (req, res) => {
  try {
    const proposal = req.body?.proposal;
    const channel = normalizeChannelName(req.body?.channel || 'sandbox') || 'sandbox';
    if (!proposal) return res.status(400).json({ error: 'proposal required' });
    const validated = validatePremierProposal(proposal);
    overlaySettingsByChannel[channel] = overlaySettingsByChannel[channel] || {};
    overlaySettingsByChannel[channel].brandingProposal = validated;
    io.to(channel).emit('overlaySettings', { settings: overlaySettingsByChannel[channel], channel });
    res.json({ ok: true, channel });
  } catch (err) {
    logger.error('premier test apply failed', { error: err.message });
    res.status(400).json({ error: err.message });
  }
});

// Pending review list (last 5 per streamer from history)
app.get('/admin/premier/pending', auth.requireAdmin, (req, res) => {
  const all = [];
  premierHistory.forEach((entries, login) => {
    entries.slice(-5).forEach((entry) => {
      all.push({ login, at: entry.at, preset: entry.preset, logoUrl: entry.logoUrl, proposal: entry.proposal });
    });
  });
  all.sort((a, b) => b.at - a.at);
  res.json({ items: all.slice(0, 20) });
});

// Approve selected proposal (no auto-store; for human review)
app.post('/admin/premier/approve', auth.requireAdmin, (req, res) => {
  try {
    const login = (req.body?.login || '').toLowerCase();
    const proposal = req.body?.proposal;
    const badge = req.body?.badge || null;
    const bundlePrice = Number(req.body?.bundlePrice || 0);
    const itemPrice = Number(req.body?.itemPrice || 0);
    const rarity = req.body?.rarity || 'legendary';
    if (!login || !proposal) return res.status(400).json({ error: 'login and proposal required' });
    const validated = validatePremierProposal(proposal);
    const history = premierHistory.get(login) || [];
    history.push({ at: Date.now(), preset: 'approved', proposal: validated, logoUrl: req.body?.logoUrl });
    if (history.length > 5) history.shift();
    premierHistory.set(login, history);
    stagedCosmetics.push({
      login,
      badge,
      bundle_price_cents: Math.max(0, Math.round(bundlePrice * 100)),
      item_price_cents: Math.max(0, Math.round(itemPrice * 100)),
      rarity,
      proposal: validated,
      at: Date.now(),
      published: false,
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error('premier approve failed', { error: err.message });
    res.status(400).json({ error: err.message });
  }
});

app.get('/admin/premier/staged', auth.requireAdmin, (_req, res) => {
  res.json({ items: stagedCosmetics.slice(-20).reverse() });
});

app.post('/admin/premier/publish', auth.requireAdmin, (req, res) => {
  try {
    const idx = Number(req.body?.index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= stagedCosmetics.length) {
      return res.status(400).json({ error: 'invalid index' });
    }
    stagedCosmetics[idx].published = true;
    res.json({ ok: true });
  } catch (err) {
    logger.error('premier publish failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Admin: ops summary + controls
 */
app.get('/admin/ops-summary', auth.requireAdmin, (_req, res) => {
  const botChannels = (tmiClient && typeof tmiClient.getChannels === 'function') ? tmiClient.getChannels() : [];
  const botConnected = !!(tmiClient && typeof tmiClient.readyState === 'function' ? tmiClient.readyState() === 'OPEN' : botChannels.length);
  const nextAiTest = 'Midnight CST';
  res.json({
    synthetic: syntheticHistory.slice(-5),
    assets: assetChecks.slice(-3),
    errors: recentErrors.slice(-20),
    slow: recentSlowRequests.slice(-20),
    socketDisconnects: recentSocketDisconnects.slice(-20),
    bot: { connected: botConnected, channels: botChannels, lastReconnectAt: lastTmiReconnectAt },
    ai: { lastTest: lastAiTestReport, lastOverlayDiagnosis },
    scheduler: { nextAiTest, lastAiTestRunDateCst, lastSyntheticRun, lastSyntheticAlert },
    db: { lastBackup: lastDbBackup, lastVacuum },
    rateLimits: { blockedIps: Array.from(blockedIPs?.keys ? blockedIPs.keys() : []), loginAttempts: adminLoginAttempts.size },
    integrity: getCriticalHashes(),
    headers: {
      csp: false,
      hsts: config.IS_PRODUCTION,
      cors: '*',
    },
  });
});

app.post('/admin/ops/run-synthetic', auth.requireAdmin, async (_req, res) => {
  try {
    const result = await runSyntheticCheck('manual');
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/ops/asset-check', auth.requireAdmin, async (_req, res) => {
  try {
    const result = await runAssetCheck('manual');
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/ops/db-backup', auth.requireAdmin, (_req, res) => {
  try {
    const backup = backupDb();
    res.json({ backup });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/ops/vacuum', auth.requireAdmin, async (_req, res) => {
  try {
    const result = await vacuumDb();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Admin-only bot chat (MDN lookup)
 */
app.post('/admin/bot-chat', auth.requireAdmin, async (req, res) => {
  try {
    const message = (req.body && req.body.message) || '';
    const scrape = !!(req.body && req.body.scrape);
    const query = (typeof message === 'string' ? message : '').trim();
    if (!query) {
      return res.status(400).json({ error: 'message required' });
    }

    // Refresh knowledge cache opportunistically
    await ingestAllowedSources(false);

    const cached = searchKnowledge(query);
    const mdnDoc = await searchMdn(query);
    const contextParts = [];
    if (cached) {
      contextParts.push(`Knowledge: ${cached.title} – ${cached.summary} ${cached.url}`);
      if (cached.snippet) contextParts.push(`Snippet: ${cached.snippet}`);
    }
    let mdnSnippet = null;
    if (mdnDoc) {
      contextParts.push(`MDN: ${mdnDoc.title} – ${mdnDoc.summary} ${mdnDoc.url}`);
      if (scrape && mdnDoc.url) {
        mdnSnippet = await fetchMdnContent(mdnDoc.url);
        if (mdnSnippet) contextParts.push(`MDN snippet: ${truncateText(mdnSnippet, 260)}`);
      }
    }

    if (!config.OPENAI_API_KEY) {
      return res.status(400).json({ error: 'ai_not_configured' });
    }

    const systemPrompt = 'You are a concise coding assistant for the All-In Chat Poker admin. Answer in <=3 sentences, cite important URLs when present, and keep responses factual and actionable.';
    const contextText = contextParts.join('\n\n') || 'No extra context.';
    const reply = await ai.chat([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `User message: ${query}\n\nContext:\n${contextText}\n\nIf context is missing, answer from general knowledge.`,
      },
    ], { temperature: 0.35 });

    return res.json({
      found: true,
      query,
      source: 'ai',
      reply,
      mdn: mdnDoc || null,
      knowledge: cached || null,
      scraped: !!mdnSnippet,
    });
  } catch (err) {
    logger.error('Admin bot chat failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Admin-only code proposals (submit + apply)
 */
app.get('/admin/code-proposals', auth.requireAdmin, (_req, res) => {
  const proposals = loadProposals();
  res.json({ proposals });
});

app.post('/admin/code-proposals', auth.requireAdmin, (req, res) => {
  try {
    const { filePath, content, note } = req.body || {};
    if (!filePath || typeof filePath !== 'string') return res.status(400).json({ error: 'filePath required' });
    if (typeof content !== 'string') return res.status(400).json({ error: 'content required' });
    const resolved = validatePath(filePath);
    if (!resolved) return res.status(400).json({ error: 'invalid file path' });

    const entry = createProposalEntry(filePath, content, note);
    logger.info('Code proposal created', { id: entry.id, filePath });
    res.json({ proposal: { ...entry, contentPreview: truncateText(content, 240) } });
  } catch (err) {
    logger.error('Failed to create code proposal', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/admin/code-proposals/:id/diff', auth.requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const proposals = loadProposals();
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return res.status(404).json({ error: 'not found' });

    const targetPath = validatePath(proposal.filePath);
    if (!targetPath) return res.status(400).json({ error: 'invalid file path' });
    const currentContent = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf-8') : '';
    const diff = generateDiff(proposal, currentContent);
    return res.json({
      diff,
      hasCurrent: !!currentContent,
      filePath: proposal.filePath,
    });
  } catch (err) {
    logger.error('Failed to get code proposal diff', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/bot-suggest', auth.requireAdmin, (req, res) => {
  try {
    const { filePath, content, note } = req.body || {};
    if (!filePath || typeof filePath !== 'string') return res.status(400).json({ error: 'filePath required' });
    if (typeof content !== 'string') return res.status(400).json({ error: 'content required' });
    const resolved = validatePath(filePath);
    if (!resolved) return res.status(400).json({ error: 'invalid file path' });

    const entry = createProposalEntry(filePath, content, note || 'bot suggestion');
    logger.info('Bot suggestion stored', { id: entry.id, filePath });
    res.json({ proposal: { ...entry, contentPreview: truncateText(content, 240) } });
  } catch (err) {
    logger.error('Failed to store bot suggestion', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/knowledge/ingest', auth.requireAdmin, async (req, res) => {
  try {
    if (!knowledgeSources.length) {
      return res.status(400).json({ error: 'no knowledge sources configured' });
    }
    const entries = await ingestAllowedSources(true);
    res.json({ ingested: entries.length, sources: knowledgeSources.length });
  } catch (err) {
    logger.error('Knowledge ingest failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/admin/knowledge', auth.requireAdmin, (_req, res) => {
  const entries = loadKnowledge();
  res.json({ entries });
});

app.post('/admin/code-proposals/:id/apply', auth.requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const proposals = loadProposals();
    const idx = proposals.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'not found' });
    const proposal = proposals[idx];
    const targetPath = validatePath(proposal.filePath);
    if (!targetPath) return res.status(400).json({ error: 'invalid file path' });
    const dir = path.dirname(targetPath);
    fs.mkdirSync(dir, { recursive: true });
    const backup = backupFile(targetPath);
    fs.writeFileSync(targetPath, proposal.content, 'utf-8');
    proposal.status = 'applied';
    proposal.appliedAt = new Date().toISOString();
    proposals[idx] = proposal;
    saveProposals(proposals);
    logger.info('Code proposal applied', { id, filePath: proposal.filePath, backup });
    res.json({ applied: true, backup });
  } catch (err) {
    logger.error('Failed to apply code proposal', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/run-tests', auth.requireAdmin, async (req, res) => {
  try {
    const cmd = (req.body && req.body.command) || 'npm test';
    const timeoutMs = Math.min(Math.max((req.body && req.body.timeoutMs) || TEST_TIMEOUT_MS, 5000), 1000 * 60 * 5);
    const result = await runCommand(cmd, { timeoutMs });
    res.json(result);
  } catch (err) {
    logger.error('Test run failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/review-and-suggest', auth.requireAdmin, async (req, res) => {
  try {
    const { filePath, runTests = false, testCommand } = req.body || {};
    if (!filePath || typeof filePath !== 'string') return res.status(400).json({ error: 'filePath required' });
    const resolved = validatePath(filePath);
    if (!resolved) return res.status(400).json({ error: 'invalid file path' });
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'file not found' });
    const content = fs.readFileSync(resolved, 'utf-8');
    const ext = path.extname(resolved).toLowerCase();
    let checkResult = null;
    let testResult = null;
    let lintResults = [];

    if (['.js', '.mjs', '.cjs'].includes(ext)) {
      checkResult = await runCommand(`node --check "${resolved}"`, { timeoutMs: 15000 });
    }

    lintResults = await runLintSet(resolved);

    if (runTests) {
      testResult = await runCommand(testCommand || 'npm test', { timeoutMs: TEST_TIMEOUT_MS });
    }

    await ingestAllowedSources(false);
    const knowledgeTip = searchKnowledge(path.basename(resolved)) || searchKnowledge('javascript') || null;
    const mdnDoc = await searchMdn(path.basename(resolved));
    const mdnContent = mdnDoc && mdnDoc.url ? await fetchMdnContent(mdnDoc.url) : null;

    if (!config.OPENAI_API_KEY) {
      return res.status(400).json({ error: 'ai_not_configured' });
    }

    const noteParts = [];
    if (checkResult) {
      noteParts.push(`node --check exit: ${checkResult.code}`);
    } else {
      noteParts.push('Syntax check skipped (non-JS file).');
    }
    if (testResult) {
      noteParts.push(`Tests exit: ${testResult.code}`);
    }
    if (lintResults.length) {
      const failed = lintResults.filter(l => l.code !== 0);
      if (failed.length) {
        noteParts.push(`Lint issues: ${failed.map(f => f.name).join(', ')}`);
      } else {
        noteParts.push('Lint clean.');
      }
    }
    if (knowledgeTip) {
      noteParts.push(`Knowledge: ${knowledgeTip.title}`);
    }
    if (mdnDoc) noteParts.push(`MDN: ${mdnDoc.title}`);
    noteParts.push(`AI model: ${config.AI_MODEL}`);
    const note = noteParts.join(' | ');

    const contextChunks = [];
    const short = (txt, max = 320) => truncateText(txt || '', max);
    if (checkResult) {
      contextChunks.push(`node --check: exit ${checkResult.code}${checkResult.signal ? ` (signal ${checkResult.signal})` : ''}\n${short(checkResult.output, 420)}`);
    }
    if (lintResults.length) {
      contextChunks.push(`lint results:\n${lintResults.map(l => `${l.name}: ${l.code}`).join('\n')}`);
    }
    if (testResult) {
      contextChunks.push(`tests: exit ${testResult.code}\n${short(testResult.output, 420)}`);
    }
    if (knowledgeTip) {
      contextChunks.push(`knowledge: ${knowledgeTip.title} – ${knowledgeTip.summary} ${knowledgeTip.url}`);
    }
    if (mdnDoc) {
      contextChunks.push(`mdn: ${mdnDoc.title} – ${mdnDoc.summary} ${mdnDoc.url}`);
    }
    if (mdnContent) {
      contextChunks.push(`mdn snippet: ${short(mdnContent, 360)}`);
    }

    const systemPrompt = 'You are a senior engineer assisting with a Twitch poker/blackjack app. Given a file, return the full updated file content only (no fences). Keep behavior intact, improve clarity, and address issues hinted by the context. Prefer minimal, safe edits.';
    const userPrompt = `File: ${filePath}\n\nCurrent content:\n${content}\n\nContext:\n${contextChunks.join('\n\n') || 'No extra context.'}\n\nReturn the full updated file content. If no change is needed, return the original content exactly.`;
    const maxTokens = Math.min(4096, Math.max(config.AI_MAX_TOKENS || 1200, Math.ceil(content.length / 3)));
    const aiReplyRaw = await ai.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.25, maxTokens });

    const cleanReply = (aiReplyRaw || '').replace(/^```[\s\S]*?\n/, '').replace(/```$/, '').trim();
    const proposalContent = cleanReply || content;

    const entry = createProposalEntry(filePath, proposalContent, note || 'auto review suggestion');
    logger.info('Auto review suggestion stored', { id: entry.id, filePath, model: config.AI_MODEL });
    res.json({
      proposal: { ...entry, contentPreview: truncateText(proposalContent, 240) },
      check: checkResult,
      tests: testResult,
      lint: lintResults,
      knowledge: knowledgeTip,
      mdn: mdnDoc || null,
    });
  } catch (err) {
    logger.error('Review and suggest failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/code-review', auth.requireAdmin, async (req, res) => {
  try {
    const { filePath } = req.body || {};
    if (!filePath || typeof filePath !== 'string') return res.status(400).json({ error: 'filePath required' });
    const resolved = validatePath(filePath);
    if (!resolved) return res.status(400).json({ error: 'invalid file path' });
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'file not found' });
    const ext = path.extname(resolved).toLowerCase();
    let checkResult = null;
    const suggestions = [];

    if (['.js', '.mjs', '.cjs'].includes(ext)) {
      checkResult = await runCommand(`node --check "${resolved}"`, { timeoutMs: 15000 });
      if (checkResult.code === 0) {
        suggestions.push('No syntax errors detected by node --check.');
      } else {
        suggestions.push('Fix syntax errors reported by node --check (see output).');
      }
    } else {
      suggestions.push('Syntax check skipped (unsupported extension).');
    }

    const lintResults = await runLintSet(resolved);
    if (lintResults.length) {
      const failed = lintResults.filter(l => l.code !== 0);
      if (failed.length) {
        suggestions.push(`Lint issues in: ${failed.map(f => f.name).join(', ')}`);
      } else {
        suggestions.push('Lint clean.');
      }
    }

    res.json({
      filePath,
      check: checkResult,
      lint: lintResults,
      suggestions,
    });
  } catch (err) {
    logger.error('Code review failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/code-patch', auth.requireAdmin, (req, res) => {
  try {
    const { filePath, patch } = req.body || {};
    if (!filePath || typeof filePath !== 'string') return res.status(400).json({ error: 'filePath required' });
    if (!patch || typeof patch !== 'string') return res.status(400).json({ error: 'patch required' });
    const targetPath = validatePath(filePath);
    if (!targetPath) return res.status(400).json({ error: 'invalid file path' });
    const backup = backupFile(targetPath);
    applyPatchFile(targetPath, patch);
    const content = fs.readFileSync(targetPath, 'utf-8');
    const entry = createProposalEntry(filePath, content, 'patch applied via endpoint');
    logger.info('Patch applied', { filePath, backup, id: entry.id });
    res.json({ applied: true, backup, proposalId: entry.id });
  } catch (err) {
    logger.error('Patch apply failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/code-edit', auth.requireAdmin, (req, res) => {
  try {
    const { filePath, startLine, endLine, replacement, note } = req.body || {};
    if (!filePath || typeof filePath !== 'string') return res.status(400).json({ error: 'filePath required' });
    const s = Number(startLine);
    const e = Number(endLine);
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 1 || e < s) {
      return res.status(400).json({ error: 'invalid line range' });
    }
    const targetPath = validatePath(filePath);
    if (!targetPath) return res.status(400).json({ error: 'invalid file path' });
    const backup = backupFile(targetPath);
    const updated = applyStructuredEdit(targetPath, s, e, replacement || '');
    const entry = createProposalEntry(filePath, updated, note || `edit ${s}-${e}`);
    logger.info('Structured edit applied', { filePath, backup, id: entry.id, range: `${s}-${e}` });
    res.json({ applied: true, backup, proposalId: entry.id });
  } catch (err) {
    logger.error('Structured edit failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Create user JWT (admin only)
 */
app.post('/admin/user-token', auth.requireAdmin, (req, res) => {
  const { login } = req.body || {};
  if (!validation.validateUsername(login || '')) {
    return res.status(400).json({ error: 'invalid username' });
  }

  // Ensure profile exists
  db.upsertProfile({
    login,
    display_name: login,
    settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
    role: 'player',
  });

  const token = auth.signUserJWT(login);
  return res.json({ token, login, expiresIn: config.USER_JWT_TTL_SECONDS });
});

/**
 * Create a shared lobby code for multi-stream games (admin/streamer)
 */
app.post('/admin/lobby', auth.requireAdmin, (req, res) => {
  try {
    const code = generateLobbyCode();
    const lobby = normalizeChannelName(code);
    const base = `${req.protocol}://${req.get('host')}`;
    const adminUrl = `${base}/admin2.html?channel=${encodeURIComponent(lobby)}`;
    const overlayUrl = `${base}/obs-overlay.html?channel=${encodeURIComponent(lobby)}`;
    return res.json({ code: lobby, adminUrl, overlayUrl });
  } catch (err) {
    logger.error('Failed to create lobby code', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get/set current game mode (admin)
 */
app.get('/admin/mode', auth.requireAdmin, (_req, res) => {
  return res.json({ mode: 'blackjack' });
});

app.post('/admin/mode', auth.requireAdmin, (req, res) => {
  // Lock to blackjack only
  currentMode = 'blackjack';
  const channel = getChannelFromReq(req);
  const state = getStateForChannel(channel);
  state.currentMode = 'blackjack';
  return res.json({ mode: 'blackjack' });
});

/**
 * Start a round (admin)
 * If startNow is true, starts immediately; otherwise opens betting window.
 */
app.post('/admin/start-round', auth.requireAdmin, (req, res) => {
  try {
    const channel = getChannelFromReq(req);
    const state = getStateForChannel(channel);
    const startNow = !!(req.body && req.body.startNow);
    if (startNow) {
      startRoundInternal(channel);
      return res.json({ started: true, mode: state.currentMode });
    }
    openBettingWindow(channel);
    return res.json({ betting: true, mode: state.currentMode });
  } catch (err) {
    logger.error('Failed to start round (admin)', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Player login via Twitch user access token -> user JWT
 */
app.post('/user/login', async (req, res) => {
  try {
    const { twitchToken } = req.body || {};
    if (!twitchToken || typeof twitchToken !== 'string') {
      return res.status(400).json({ error: 'twitch token required' });
    }

    const twitchProfile = await fetchTwitchUser(twitchToken);
    if (!twitchProfile || !twitchProfile.login) {
      return res.status(401).json({ error: 'invalid twitch token' });
    }

  const login = twitchProfile.login;
  const existingProfile = db.getProfile(login);
  let parsedSettings = {};
  try {
    parsedSettings = existingProfile?.settings ? JSON.parse(existingProfile.settings) : {};
  } catch {
    parsedSettings = {};
  }
  const safeAvatar = twitchProfile.avatarUrl ? validation.sanitizeUrl(twitchProfile.avatarUrl) : getDefaultAvatarForLogin(login, parsedSettings.avatarColor);
  const mergedSettings = (() => {
    return {
      startingChips: parsedSettings.startingChips || config.GAME_STARTING_CHIPS,
      theme: parsedSettings.theme || 'dark',
      avatarColor: sanitizeColor(parsedSettings.avatarColor),
      avatarUrl: safeAvatar || parsedSettings.avatarUrl || getDefaultAvatarForLogin(login, parsedSettings.avatarColor),
    };
  })();

  const role =
    (existingProfile && existingProfile.role) ||
    (login === config.STREAMER_LOGIN
      ? 'streamer'
      : login === config.BOT_ADMIN_LOGIN
        ? 'admin'
        : 'player');

  db.upsertProfile({
    login,
    display_name: twitchProfile.display_name || login,
    settings: mergedSettings,
    role,
  });
  db.ensureBalance(login);
  const stats = db.ensureStats(login);
  // Push avatar refresh to overlays
  io.emit('playerUpdate', { login, avatar: mergedSettings.avatarUrl, channel: DEFAULT_CHANNEL });

  // Auto-join the streamer's channel when they log in via Twitch
  if (login === config.STREAMER_LOGIN) {
    joinBotChannel(login);
  }

  const token = auth.signUserJWT(login);
  return res.json({ token, login, avatarUrl: safeAvatar, expiresIn: config.USER_JWT_TTL_SECONDS, stats, role });
  } catch (err) {
    logger.error('User login failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Set user role (streamer/player) on first login
 */
app.post('/user/role', (req, res) => {
  try {
    const login = auth.extractUserLogin(req);
    if (!validation.validateUsername(login || '')) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const requested = (req.body && req.body.role || '').toLowerCase();
    if (!['streamer', 'player'].includes(requested)) {
      return res.status(400).json({ error: 'invalid role' });
    }
    const profile = db.getProfile(login);
    const currentRole = (profile && profile.role) || 'player';
    if (currentRole === 'streamer' || currentRole === 'admin') {
      return res.json({ role: currentRole });
    }
    const updated = db.upsertProfile({
      login,
      display_name: profile?.display_name || login,
      settings: profile?.settings || { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
      role: requested,
    });
    return res.json({ role: updated.role || requested });
  } catch (err) {
    logger.error('Failed to set user role', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * PayPal: create order (donation)
 */
app.post('/paypal/order', async (req, res) => {
  try {
    if (!config.PAYPAL_CLIENT_ID || !config.PAYPAL_CLIENT_SECRET) {
      return res.status(400).json({ error: 'paypal_not_configured' });
    }
    const amount = req.body && req.body.amount ? String(req.body.amount) : '5.00';
    const order = await createPayPalOrder(amount);
    return res.json({ id: order.id });
  } catch (err) {
    logger.error('PayPal create order failed', { error: err.message });
    return res.status(500).json({ error: 'paypal_create_failed' });
  }
});

/**
 * PayPal: capture order
 */
app.post('/paypal/order/:id/capture', async (req, res) => {
  try {
    const { id } = req.params;
    const capture = await capturePayPalOrder(id);
    return res.json(capture);
  } catch (err) {
    logger.error('PayPal capture order failed', { error: err.message });
    return res.status(500).json({ error: 'paypal_capture_failed' });
  }
});

// Soft currency: coin packs and purchases
app.get('/coin-packs', (_req, res) => {
  res.json(COIN_PACKS);
});

app.get('/user/coins', (req, res) => {
  const login = auth.extractUserLogin(req);
  if (!validation.validateUsername(login || '')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const coins = db.getCoins(login);
  return res.json({ coins });
});

app.post('/coins/paypal/order', async (req, res) => {
  try {
    const login = auth.extractUserLogin(req);
    if (!validation.validateUsername(login || '')) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (!config.PAYPAL_CLIENT_ID || !config.PAYPAL_CLIENT_SECRET) {
      return res.status(400).json({ error: 'paypal_not_configured' });
    }
    const packId = req.body?.packId;
    const pack = COIN_PACKS.find(p => p.id === packId);
    if (!pack) return res.status(400).json({ error: 'invalid_pack' });
    const dollars = (pack.amount_cents / 100).toFixed(2);
    const order = await createPayPalOrder(dollars, `${pack.name} (${pack.coins} coins)`);
    return res.json({ id: order.id, pack });
  } catch (err) {
    logger.error('PayPal coin order failed', { error: err.message });
    return res.status(500).json({ error: 'paypal_create_failed' });
  }
});

app.post('/coins/paypal/capture', async (req, res) => {
  try {
    const login = auth.extractUserLogin(req);
    if (!validation.validateUsername(login || '')) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const { orderId, packId } = req.body || {};
    const pack = COIN_PACKS.find(p => p.id === packId);
    if (!pack) return res.status(400).json({ error: 'invalid_pack' });
    const capture = await capturePayPalOrder(orderId);
    const coins = db.addCoins(login, pack.coins);
    db.recordCurrencyPurchase({
      login,
      packId,
      coins: pack.coins,
      amount_cents: pack.amount_cents,
      provider: 'paypal',
      status: 'completed',
      txn_id: orderId,
      note: 'coins purchase',
    });
    return res.json({ success: true, coins, capture });
  } catch (err) {
    logger.error('PayPal coin capture failed', { error: err.message });
    return res.status(500).json({ error: 'paypal_capture_failed' });
  }
});

// ============ TOURNAMENTS (BACKEND ONLY) ============

app.get('/admin/tournaments', auth.requireAdmin, (_req, res) => {
  const list = db.listTournaments();
  return res.json(list);
});

app.get('/admin/tournaments/:id/blinds', auth.requireAdmin, (req, res) => {
  const tid = req.params.id;
  const t = db.getTournament(tid);
  if (!t) return res.status(404).json({ error: 'not_found' });
  return res.json({ blinds: db.getBlindConfig(tid) });
});

app.post('/admin/tournaments/:id/blinds', auth.requireAdmin, (req, res) => {
  try {
    const tid = req.params.id;
    const t = db.getTournament(tid);
    if (!t) return res.status(404).json({ error: 'not_found' });
    const levels = Array.isArray(req.body?.levels) ? req.body.levels : [];
    const updated = db.setBlindConfig(tid, levels);
    return res.json({ blinds: db.getBlindConfig(tid), tournament: updated });
  } catch (err) {
    logger.error('Set blinds failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/tournaments', auth.requireAdmin, (req, res) => {
  try {
    const {
      id,
      name,
      channel = DEFAULT_CHANNEL,
      buyin = TOURNAMENT_DEFAULTS.buyin,
      starting_chips = TOURNAMENT_DEFAULTS.starting_chips,
      level_seconds = TOURNAMENT_DEFAULTS.level_seconds,
      rounds = TOURNAMENT_DEFAULTS.rounds,
      advance_config = TOURNAMENT_DEFAULTS.advance_config,
      decks = TOURNAMENT_DEFAULTS.decks,
      blinds = TOURNAMENT_DEFAULTS.blinds,
    } = req.body || {};
    const tid = (id || `t-${Date.now()}`).toLowerCase();
    const next_level_at = new Date(Date.now() + level_seconds * 1000).toISOString();
    const tourney = db.upsertTournament({
      id: tid,
      name: name || tid,
      game: 'poker',
      state: 'pending',
      channel,
      buyin,
      starting_chips,
      level_seconds,
      current_level: 1,
      next_level_at,
      rounds,
      advance_config: Array.isArray(advance_config) ? advance_config : TOURNAMENT_DEFAULTS.advance_config,
      decks,
      blind_config: Array.isArray(blinds) ? blinds : TOURNAMENT_DEFAULTS.blinds,
    });
    return res.json(tourney);
  } catch (err) {
    logger.error('Create tournament failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/tournaments/:id/players', auth.requireAdmin, (req, res) => {
  try {
    const tid = req.params.id;
    const { login, seat } = req.body || {};
    if (!validation.validateUsername(login || '')) return res.status(400).json({ error: 'invalid login' });
    const player = db.addTournamentPlayer(tid, login, seat);
    return res.json(player);
  } catch (err) {
    logger.error('Add tournament player failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/tournaments/:id/advance', auth.requireAdmin, (req, res) => {
  try {
    const tid = req.params.id;
    const t = db.getTournament(tid);
    if (!t) return res.status(404).json({ error: 'not_found' });
    const level = (t.current_level || 1) + 1;
    const next = new Date(Date.now() + (t.level_seconds || TOURNAMENT_DEFAULTS.level_seconds) * 1000).toISOString();
    const updated = db.upsertTournament({ ...t, current_level: level, next_level_at: next });
    return res.json(updated);
  } catch (err) {
    logger.error('Advance tournament failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/tournaments/:id/start', auth.requireAdmin, (req, res) => {
  try {
    const tid = req.params.id;
    const t = db.getTournament(tid);
    if (!t) return res.status(404).json({ error: 'not_found' });
    const now = Date.now();
    const nextLevelMs = (t.blind_config && JSON.parse(t.blind_config || '[]')[0]?.seconds)
      ? JSON.parse(t.blind_config)[0].seconds * 1000
      : (t.level_seconds || TOURNAMENT_DEFAULTS.level_seconds) * 1000;
    const next_level_at = new Date(now + nextLevelMs).toISOString();
    const updated = db.upsertTournament({ ...t, state: 'active', current_level: 1, next_level_at });
    scheduleTournamentBlinds(updated.id);
    return res.json(updated);
  } catch (err) {
    logger.error('Start tournament failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/admin/tournaments/:id', auth.requireAdmin, (req, res) => {
  const tid = req.params.id;
  const t = db.getTournament(tid);
  if (!t) return res.status(404).json({ error: 'not_found' });
  const players = db.listTournamentPlayers(tid);
  const bracket = db.listBracket(tid);
  const results = db.listRoundResults(tid);
  return res.json({ ...t, players, bracket, results });
});

// Blackjack tournament variant (backend only)
app.post('/admin/bj-tournaments', auth.requireAdmin, (req, res) => {
  try {
    const {
      id,
      name,
      buyin = TOURNAMENT_DEFAULTS.buyin,
      starting_chips = 5000,
      rounds = TOURNAMENT_DEFAULTS.rounds,
      advance_config = TOURNAMENT_DEFAULTS.advance_config,
      decks = TOURNAMENT_DEFAULTS.decks,
    } = req.body || {};
    if (buyin > 250) return res.status(400).json({ error: 'buyin_exceeds_cap' });
    const tid = (id || `bj-${Date.now()}`).toLowerCase();
    const tourney = db.upsertTournament({
      id: tid,
      name: name || tid,
      game: 'blackjack',
      state: 'pending',
      buyin,
      starting_chips,
      level_seconds: 0,
      current_level: 1,
      rounds,
      advance_config: Array.isArray(advance_config) ? advance_config : TOURNAMENT_DEFAULTS.advance_config,
      decks,
      blind_config: db.getBlindConfig(tid),
    });
    return res.json(tourney);
  } catch (err) {
    logger.error('Create blackjack tournament failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/bj-tournaments/:id/join', auth.requireUser, (req, res) => {
  try {
    const tid = req.params.id;
    const tourney = db.getTournament(tid);
    if (!tourney || tourney.game !== 'blackjack') return res.status(404).json({ error: 'not_found' });
    const login = auth.extractUserLogin(req);
    if (!validation.validateUsername(login || '')) return res.status(401).json({ error: 'unauthorized' });
    if (tourney.buyin > 250) return res.status(400).json({ error: 'buyin_exceeds_cap' });
    const currentPlayers = db.listTournamentPlayers(tid) || [];
    const seat = currentPlayers.length + 1;
    const player = db.addTournamentPlayer(tid, login, seat, tourney.starting_chips);
    return res.json(player);
  } catch (err) {
    logger.error('Join blackjack tournament failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/bj-tournaments/:id/rounds/:round/results', auth.requireAdmin, (req, res) => {
  try {
    const tid = req.params.id;
    const round = Number(req.params.round);
    if (!Number.isInteger(round) || round <= 0) return res.status(400).json({ error: 'invalid_round' });
    const tourney = db.getTournament(tid);
    if (!tourney || tourney.game !== 'blackjack') return res.status(404).json({ error: 'not_found' });
    const advanceCfg = Array.isArray(tourney.advance_config) ? tourney.advance_config : JSON.parse(tourney.advance_config || '[]');
    const cutoff = advanceCfg[round - 1] || 0;
    const results = Array.isArray(req.body?.results) ? req.body.results : [];
    // Expect results sorted by chips desc; assign rank if missing
    const sorted = results
      .filter(r => validation.validateUsername(r.login || ''))
      .map((r, idx) => ({ ...r, chips_end: Number(r.chips_end) || 0, rank: Number.isInteger(r.rank) ? r.rank : idx + 1 }));
    sorted.forEach((r, idx) => {
      const adv = cutoff === 0 ? 0 : (idx < cutoff ? 1 : 0);
      db.recordRoundResult(tid, round, r.login, r.chips_end, r.rank, adv);
      if (!adv) {
        db.eliminateTournamentPlayer(tid, r.login, r.rank);
      }
    });
    let newState = tourney.state;
    if (round >= tourney.rounds) {
      newState = 'complete';
    } else if (round >= 1) {
      newState = 'active';
    }
    const updated = db.upsertTournament({ ...tourney, state: newState });
    const respResults = db.listRoundResults(tid, round);
    return res.json({ tournament: updated, results: respResults });
  } catch (err) {
    logger.error('Record blackjack round failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/bj-tournaments/:id', auth.requireAdmin, (req, res) => {
  const tid = req.params.id;
  const t = db.getTournament(tid);
  if (!t || t.game !== 'blackjack') return res.status(404).json({ error: 'not_found' });
  const players = db.listTournamentPlayers(tid);
  const results = db.listRoundResults(tid);
  return res.json({ ...t, players, results });
});

app.post('/admin/tournaments/:id/bracket', auth.requireAdmin, (req, res) => {
  try {
    const tid = req.params.id;
    const round = Number(req.body?.round) || 1;
    const tableSize = Math.min(Math.max(Number(req.body?.tableSize) || 6, 2), 10);
    const t = db.getTournament(tid);
    if (!t) return res.status(404).json({ error: 'not_found' });
    const roster = Array.isArray(req.body?.players) && req.body.players.length
      ? req.body.players.filter(p => validation.validateUsername(p || ''))
      : (db.listTournamentPlayers(tid) || []).filter(p => !p.eliminated).map(p => p.login);
    if (!roster.length) return res.status(400).json({ error: 'no_players' });
    const { bracket, tableChannels } = generateBracketAssignments(tid, round, roster, tableSize);
    return res.json({ round, tableSize, bracket, tableChannels });
  } catch (err) {
    logger.error('Generate bracket failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/tournaments/:id/advance-round', auth.requireAdmin, (req, res) => {
  try {
    const tid = req.params.id;
    const round = Number(req.body?.round);
    const tableSize = Math.min(Math.max(Number(req.body?.tableSize) || 6, 2), 10);
    const includeTies = req.body?.includeTies !== false;
    if (!Number.isInteger(round) || round <= 0) return res.status(400).json({ error: 'invalid_round' });
    const t = db.getTournament(tid);
    if (!t) return res.status(404).json({ error: 'not_found' });
    const advanceCfg = Array.isArray(t.advance_config) ? t.advance_config : parseJsonSafe(t.advance_config || '[]', []);
    const cutoff = advanceCfg[round - 1] || 0;
    const results = db.listRoundResults(tid, round);
    if (!results || !results.length) return res.status(400).json({ error: 'no_results' });
    const sorted = results.sort((a, b) => (b.chips_end || 0) - (a.chips_end || 0));
    let advancers = [];
    if (cutoff === 0) {
      // final round: rank and complete
      sorted.forEach((r, idx) => {
        db.eliminateTournamentPlayer(tid, r.login, r.rank || idx + 1);
      });
      const updated = db.upsertTournament({ ...t, state: 'complete' });
      return res.json({ tournament: updated, advanced: [], bracket: [] });
    }
    const threshold = sorted[Math.min(cutoff - 1, sorted.length - 1)]?.chips_end ?? 0;
    advancers = sorted.filter((r, idx) => {
      if (idx < cutoff) return true;
      if (includeTies && (r.chips_end || 0) === threshold) return true;
      return false;
    }).map(r => r.login);
    const advancedSet = new Set(advancers.map(a => a.toLowerCase()));
    sorted.forEach(r => {
      if (!advancedSet.has((r.login || '').toLowerCase())) {
        db.eliminateTournamentPlayer(tid, r.login, r.rank);
      }
    });
    const nextRound = round + 1;
    if (nextRound > (t.rounds || 1)) {
      const updated = db.upsertTournament({ ...t, state: 'complete' });
      return res.json({ tournament: updated, advanced: advancers, bracket: [] });
    }
    if (!advancers.length) return res.status(400).json({ error: 'no_advancers' });
    const { bracket, tableChannels } = generateBracketAssignments(tid, nextRound, advancers, tableSize);
    const updated = db.upsertTournament({ ...t, state: 'active' });
    return res.json({ tournament: updated, advanced: advancers, bracket, tableChannels, round: nextRound });
  } catch (err) {
    logger.error('Advance round failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.post('/admin/tournaments/:id/bootstrap-round', auth.requireAdmin, (req, res) => {
  try {
    const tid = req.params.id;
    const t = db.getTournament(tid);
    if (!t) return res.status(404).json({ error: 'not_found' });
    const round = Number(req.body?.round) || 1;
    const tableSize = Math.min(Math.max(Number(req.body?.tableSize) || 6, 2), 10);
    const bracket = db.listBracket(tid, round);
    let bracketData = bracket;
    if (!bracket || bracket.length === 0) {
      const roster = (db.listTournamentPlayers(tid) || []).filter(p => !p.eliminated).map(p => p.login);
      const generated = generateBracketAssignments(tid, round, roster, tableSize);
      bracketData = generated.bracket;
    }
    const tables = {};
    bracketData.forEach(row => {
      const key = row.table;
      tables[key] = tables[key] || [];
      tables[key].push(row.seat_login);
    });
    const bindings = [];
    Object.entries(tables).forEach(([tableNumStr, players]) => {
      const tableNum = Number(tableNumStr);
      const channelName = `t-${tid}-r${round}-table-${tableNum}`;
      bindTournamentTable(tid, round, tableNum, channelName, players);
      bindings.push({ table: tableNum, channel: channelName, players });
    });
    return res.json({ round, bindings });
  } catch (err) {
    logger.error('Bootstrap round failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Tournament table ready-up: players signal ready; when all seated are ready, return ready:true
app.post('/table/ready', auth.requireUser, (req, res) => {
  try {
    const login = auth.extractUserLogin(req);
    if (!validation.validateUsername(login || '')) return res.status(401).json({ error: 'unauthorized' });
    const channelName = normalizeChannelName(req.body?.channel || '');
    if (!channelName) return res.status(400).json({ error: 'channel required' });
    const state = getStateForChannel(channelName);
  if (!state.tournamentId) return res.status(400).json({ error: 'not_a_tournament_table' });
  const round = state.tournamentRound || 1;
  const tableNum = state.tournamentTable || 1;
  state.readyPlayers = state.readyPlayers || new Set();
  state.readyPlayers.add(login.toLowerCase());
  const seats = getBracketSeats(state.tournamentId, round, tableNum);
  const required = seats.map(s => s.toLowerCase());
  const allReady = required.length > 0 && required.every(p => state.readyPlayers.has(p));
  let started = false;
  if (allReady) {
    const result = autoStartTournamentTable(channelName);
    started = result.started;
  }
  emitReadyStatus(channelName);
  return res.json({ ready: allReady, readyCount: state.readyPlayers.size, required: required.length, channel: channelName, started });
} catch (err) {
  logger.error('Ready up failed', { error: err.message });
  return res.status(500).json({ error: 'internal_error' });
}
});

app.post('/admin/tournaments/:id/table/:table/bind', auth.requireAdmin, (req, res) => {
  try {
    const tid = req.params.id;
    const table = Number(req.params.table);
    const channel = normalizeChannelName(req.body?.channel || '');
    if (!channel) return res.status(400).json({ error: 'channel required' });
    const t = db.getTournament(tid);
    if (!t) return res.status(404).json({ error: 'not_found' });
    const state = getStateForChannel(channel);
    state.tournamentId = tid;
    state.tournamentTable = table;
    state.currentMode = t.game === 'blackjack' ? 'blackjack' : 'poker';
    state.readyPlayers = new Set();
    emitReadyStatus(channel);
    return res.json({ channel, tournamentId: tid, table });
  } catch (err) {
    logger.error('Bind tournament table failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

function scheduleTournamentBlinds(tournamentId) {
  if (tournamentTimers[tournamentId]) {
    clearTimeout(tournamentTimers[tournamentId]);
    delete tournamentTimers[tournamentId];
  }
  const t = db.getTournament(tournamentId);
  if (!t) return;
  const levels = parseJsonSafe(t.blind_config || '[]', []);
  if (!levels.length) return;
  const idx = Math.max(0, (t.current_level || 1) - 1);
  const nextIdx = idx + 1;
  const nextLevel = levels[nextIdx];
  if (!nextLevel) {
    db.upsertTournament({ ...t, next_level_at: null });
    return;
  }
  const delayMs = (nextLevel.seconds || t.level_seconds || TOURNAMENT_DEFAULTS.level_seconds) * 1000;
  const nextLevelAt = Date.now() + delayMs;
  db.upsertTournament({ ...t, next_level_at: new Date(nextLevelAt).toISOString() });
  tournamentTimers[tournamentId] = setTimeout(() => {
    const latest = db.getTournament(tournamentId);
    const updated = db.upsertTournament({
      ...latest,
      current_level: (latest.current_level || 1) + 1,
    });
    io.emit('tournamentLevel', {
      id: tournamentId,
      level: updated.current_level,
      blinds: levels[Math.min(updated.current_level - 1, levels.length - 1)],
      channel: updated.channel || null,
    });
    scheduleTournamentBlinds(tournamentId);
  }, delayMs);
}

function getBracketSeats(tournamentId, round, tableNum) {
  return db.listBracket(tournamentId, round).filter(b => (b.table_num || b.table) === tableNum).map(b => b.seat_login);
}

function applyTournamentBlinds(channelName) {
  const state = getStateForChannel(channelName);
  if (!state.tournamentId) return false;
  const seats = getBracketSeats(state.tournamentId, state.tournamentRound || 1, state.tournamentTable || 1);
  if (!seats.length) return false;
  const blinds = getCurrentBlinds(state);
  const order = seats.slice();
  const smallPlayer = order[0];
  const bigPlayer = order.length > 1 ? order[1] : order[0];
  const bets = {};
  const applyBet = (login, amount) => {
    const stack = state.tournamentStacks?.[login] ?? 0;
    const wager = Math.min(stack + (state.betAmounts[login] || 0), amount);
    const existing = state.betAmounts[login] || 0;
    state.tournamentStacks[login] = stack + existing - wager;
    state.betAmounts[login] = wager;
  };
  applyBet(smallPlayer, blinds.small);
  applyBet(bigPlayer, blinds.big);
  [smallPlayer, bigPlayer].forEach(p => {
    if (p) db.updateTournamentPlayerChips(state.tournamentId, p, Math.max(0, state.tournamentStacks[p] || 0));
  });
  state.pokerCurrentBet = Math.max(...Object.values(state.betAmounts));
  state.pokerStreetBets = { ...state.betAmounts };
  state.pokerPot = Object.values(state.betAmounts).reduce((a, b) => a + b, 0);
  state.pokerActed = new Set([smallPlayer, bigPlayer].filter(Boolean));
  state.playerTurnOrder = order;
  state.playerTurnIndex = 0;
  return true;
}

function applyBlackjackAntes(channelName) {
  const state = getStateForChannel(channelName);
  if (!state.tournamentId) return false;
  const seats = getBracketSeats(state.tournamentId, state.tournamentRound || 1, state.tournamentTable || 1);
  if (!seats.length) return false;
  const blinds = getCurrentBlinds(state);
  const ante = Math.max(blinds.big || config.GAME_MIN_BET, config.GAME_MIN_BET);
  state.betAmounts = {};
  seats.forEach((login) => {
    const stack = state.tournamentStacks?.[login] ?? 0;
    const wager = Math.min(stack, ante);
    if (wager > 0) {
      state.betAmounts[login] = wager;
      state.tournamentStacks[login] = stack - wager;
      db.updateTournamentPlayerChips(state.tournamentId, login, Math.max(0, state.tournamentStacks[login]));
    }
    state.playerStates[login] = state.playerStates[login] || {
      hand: [],
      hole: [],
      stood: false,
      busted: false,
      folded: false,
      split: false,
      hands: [],
      activeHand: 0,
      seat: null,
    };
  });
  return Object.keys(state.betAmounts).length > 0;
}

function autoStartTournamentTable(channelName) {
  const state = getStateForChannel(channelName);
  if (state.roundInProgress) return { started: false };
  let applied = false;
  if (state.currentMode === 'poker') {
    applied = applyTournamentBlinds(channelName);
  } else if (state.currentMode === 'blackjack') {
    applied = applyBlackjackAntes(channelName);
  }
  if (!applied) return { started: false };
  state.readyPlayers = new Set();
  startRoundInternal(channelName, { preserveBets: true });
  emitReadyStatus(channelName);
  return { started: true };
}

/**
 * Unblock username or IP
 */
app.post('/admin/unblock', auth.requireAdmin, (req, res) => {
  try {
    const { username, ip, note } = req.body || {};
    if (!username && !ip) return res.status(400).json({ error: 'username or ip required' });

    if (username && !validation.validateUsername(username)) return res.status(400).json({ error: 'invalid username format' });
    if (ip && !validation.validateIP(ip)) return res.status(400).json({ error: 'invalid ip format' });

    const actor = getActorFromReq(req);
    db.logUnblock(actor, username || '', ip || '', note || '');

    logger.info('Unblock executed', { username, ip, actor });
    return res.json({ success: true });
  } catch (err) {
    logger.error('Failed to execute unblock', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get leaderboard
 */
app.get('/leaderboard.json', (req, res) => {
  try {
    const leaderboard = db.getLeaderboard(10);
    return res.json(leaderboard);
  } catch (err) {
    logger.error('Failed to fetch leaderboard', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get all balances (admin only)
 */
app.get('/balances.json', auth.requireAdmin, (req, res) => {
  try {
    const balances = {};
    const profiles = db.getAllProfiles(1000);

    profiles.forEach(profile => {
      balances[profile.login] = db.getBalance(profile.login);
    });

    return res.json(balances);
  } catch (err) {
    logger.error('Failed to fetch balances', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get all stats (admin only)
 */
app.get('/stats.json', auth.requireAdmin, (req, res) => {
  try {
    const stats = {};
    const profiles = db.getAllProfiles(1000);

    profiles.forEach(profile => {
      stats[profile.login] = db.getStats(profile.login);
    });

    return res.json(stats);
  } catch (err) {
    logger.error('Failed to fetch stats', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Export all data (admin only)
 */
app.get('/export', auth.requireAdmin, (req, res) => {
  try {
    const profiles = db.getAllProfiles(1000);
    const balances = {};
    const stats = {};

    profiles.forEach(profile => {
      balances[profile.login] = db.getBalance(profile.login);
      stats[profile.login] = db.getStats(profile.login);
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      leaderboard: db.getLeaderboard(100),
      balances,
      stats,
      profiles,
    };

    return res.json(exportData);
  } catch (err) {
    logger.error('Failed to export data', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get user profile
 */
app.get('/profile', (req, res) => {
  try {
    const tokenLogin = auth.extractUserLogin(req);
    const queryLogin = (req.query && req.query.login) || null;
    const isAdmin = auth.isAdminRequest(req);

    // Determine which login to serve
    let login = tokenLogin;
    if (isAdmin && validation.validateUsername(queryLogin || '')) {
      login = queryLogin;
    }

    if (!validation.validateUsername(login || '')) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    let profile = db.getProfile(login);
    if (!profile) {
      profile = db.upsertProfile({
        login,
        display_name: login,
        settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
      });
    }

    const stats = db.getStats(login);
    const balance = db.getBalance(login);

    return res.json({ profile, stats, balance });
  } catch (err) {
    logger.error('Failed to fetch profile', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Save user profile
 */
app.post('/profile', (req, res) => {
  const login = auth.extractUserLogin(req);
  if (!validation.validateUsername(login || '')) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { display_name, settings, avatarUrl } = req.body || {};

  // Basic validation for settings object (optional)
  let safeSettings = {};
  if (typeof settings === 'object' && settings !== null) {
    safeSettings.startingChips = validation.validateNumber(settings.startingChips, 0, 100000)
      ? Number(settings.startingChips)
      : config.GAME_STARTING_CHIPS;
    safeSettings.theme = (settings.theme === 'light') ? 'light' : 'dark';
    if (settings.dealFx && typeof settings.dealFx === 'string') safeSettings.dealFx = settings.dealFx;
    if (settings.winFx && typeof settings.winFx === 'string') safeSettings.winFx = settings.winFx;
  }

  if (avatarUrl && typeof avatarUrl === 'string') {
    const sanitized = validation.sanitizeUrl(avatarUrl);
    if (sanitized) safeSettings.avatarUrl = sanitized;
  }

  try {
    const profile = db.upsertProfile({
      login,
      display_name: validation.sanitizeString(display_name) || login,
      settings: safeSettings,
      role: login === config.STREAMER_LOGIN ? 'streamer' : 'player',
    });

    logger.info('Profile saved', { login });
    return res.json(profile);
  } catch (err) {
    logger.error('Failed to save profile', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Chat-initiated bet (used by the Twitch bot)
 */
app.post('/chat/bet', (req, res) => {
  try {
    const { login, amount, secret } = req.body || {};
    const channel = getChannelFromReq(req);
    if (!config.BOT_JOIN_SECRET || secret !== config.BOT_JOIN_SECRET) {
      return res.status(403).json({ error: 'not authorized' });
    }

    const normalizedLogin = (login || '').toLowerCase();
    const betAmount = parseInt(amount, 10);

    if (!validation.validateUsername(normalizedLogin)) {
      return res.status(400).json({ error: 'invalid username' });
    }
    if (!Number.isInteger(betAmount)) {
      return res.status(400).json({ error: 'invalid amount' });
    }

    db.ensureBalance(normalizedLogin);
    const ok = placeBet(normalizedLogin, betAmount, channel);
    if (!ok) {
      return res.status(400).json({ error: 'bet_rejected' });
    }

    const balance = db.getBalance(normalizedLogin);
    return res.json({ success: true, balance, bet: betAmount, channel });
  } catch (err) {
    logger.error('Chat bet failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Bot channels list (used by Twitch bot to auto-join streamer channel)
 */
app.get('/bot/channels', (req, res) => {
  const secret = (req.query && req.query.secret) || '';
  if (!config.BOT_JOIN_SECRET || secret !== config.BOT_JOIN_SECRET) {
    return res.status(403).json({ error: 'not authorized' });
  }

  try {
    const channels = db.getBotChannels();
    const defaults = [];
    if (config.TWITCH_CHANNEL) defaults.push(config.TWITCH_CHANNEL.replace(/^#/, '').toLowerCase());
    const unique = Array.from(new Set([...defaults, ...channels]));
    return res.json({ channels: unique });
  } catch (err) {
    logger.error('Failed to fetch bot channels', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Bot state snapshot (used by Twitch bot for context)
 * Query: secret, channel
 */
app.get('/bot/state', (req, res) => {
  const secret = (req.query && req.query.secret) || '';
  if (!config.BOT_JOIN_SECRET || secret !== config.BOT_JOIN_SECRET) {
    return res.status(403).json({ error: 'not authorized' });
  }
  const channelName = normalizeChannelName(req.query?.channel || DEFAULT_CHANNEL);
  const state = getStateForChannel(channelName);
  const maxSeats = state.currentMode === 'blackjack' ? MAX_BLACKJACK_PLAYERS : MAX_POKER_PLAYERS;
  const players = Object.entries(state.playerStates || {}).map(([login, st]) => ({
    login,
    bet: (state.betAmounts && state.betAmounts[login]) || 0,
    streetBet: (state.pokerStreetBets && state.pokerStreetBets[login]) || 0,
    folded: !!st.folded,
  }));
  const waiting = Array.isArray(state.waitingQueue) ? state.waitingQueue : [];
  const ready = state.readyPlayers ? Array.from(state.readyPlayers) : [];
  const requiredSeats = state.tournamentId ? getBracketSeats(state.tournamentId, state.tournamentRound || 1, state.tournamentTable || 1) : [];
  const requiredReady = state.tournamentId ? requiredSeats.length : 0;
  res.json({
    channel: channelName,
    mode: state.currentMode || 'blackjack',
    bettingOpen: !!state.bettingOpen,
    roundInProgress: !!state.roundInProgress,
    pot: state.pokerPot || 0,
    currentBet: state.pokerCurrentBet || 0,
    dealerCard: state.dealerState?.hand ? state.dealerState.hand[0] : null,
    communityCount: Array.isArray(state.communityCards) ? state.communityCards.length : 0,
    players,
    waiting,
    seated: players.length,
    maxSeats,
    readyCount: ready.length,
    requiredReady,
    requiredSeats,
    blinds: state.tournamentId ? getCurrentBlinds(state) : null,
    tournament: state.tournamentId
      ? {
          id: state.tournamentId,
          round: state.tournamentRound || 1,
          table: state.tournamentTable || 1,
        }
      : null,
  });
});

/**
 * Get all profiles (admin only)
 */
app.get('/admin/profiles', auth.requireAdmin, (req, res) => {
  try {
    const profiles = db.getAllProfiles();
    return res.json(profiles);
  } catch (err) {
    logger.error('Failed to fetch profiles', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Get single profile (admin only)
 */
app.get('/admin/profile/:login', auth.requireAdmin, (req, res) => {
  try {
    const login = req.params.login;
    if (!validation.validateUsername(login)) return res.status(400).json({ error: 'invalid username' });
    const profile = db.getProfile(login);
    if (!profile) return res.status(404).json({ error: 'not found' });
    return res.json(profile);
  } catch (err) {
    logger.error('Failed to fetch profile', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Update profile (admin only)
 */
app.post('/admin/profile/:login', auth.requireAdmin, (req, res) => {
  try {
    const { display_name, settings } = req.body || {};
    const login = req.params.login;

    if (!validation.validateUsername(login)) return res.status(400).json({ error: 'invalid username' });

    const safeSettings = (typeof settings === 'object' && settings !== null) ? settings : {};

    const profile = db.upsertProfile({
      login,
      display_name: display_name ? validation.sanitizeString(display_name) : login,
      settings: safeSettings,
    });

    logger.info('Admin updated profile', { login });
    return res.json(profile);
  } catch (err) {
    logger.error('Failed to update profile', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Adjust player balance (admin only)
 * Body: { login, amount, mode: 'set' | 'add' }
 */
app.post('/admin/balance', auth.requireAdmin, (req, res) => {
  try {
    const { login, amount, mode } = req.body || {};
    if (!validation.validateUsername(login || '')) {
      return res.status(400).json({ error: 'invalid username' });
    }
    if (!Number.isFinite(amount)) {
      return res.status(400).json({ error: 'amount required' });
    }

    db.ensureBalance(login);
    const safeAmount = Math.floor(amount);
    let newBalance = db.getBalance(login);

    if (mode === 'set') {
      db.setBalance(login, safeAmount);
      newBalance = safeAmount;
    } else {
      // default to add
      newBalance = db.addChips(login, safeAmount);
    }

    const channel = getChannelFromReq(req);
    const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  io.to(channelName).emit('playerUpdate', { login, balance: newBalance, bet: 0, channel: channelName, cosmetics: getCosmeticsForLogin(login) });
    logger.info('Admin balance update', { login, amount: safeAmount, mode: mode || 'add', newBalance });
    return res.json({ login, balance: newBalance });
  } catch (err) {
    logger.error('Failed to update balance', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Grant cosmetic item to a user (admin only)
 * Body: { login, itemId }
 */
app.post('/admin/grant-item', auth.requireAdmin, (req, res) => {
  const { login, itemId } = req.body || {};
  if (!validation.validateUsername(login || '')) {
    return res.status(400).json({ error: 'invalid username' });
  }
  const inv = db.grantCosmetic(login, itemId);
  if (!inv) return res.status(400).json({ error: 'invalid itemId' });
  return res.json({
    success: true,
    owned: Array.from(inv.owned || []),
    equipped: inv.equipped || {},
  });
});

/**
 * Dev/admin purchase stub (records + grants). Restricted to admins.
 */
app.post('/admin/dev-purchase', auth.requireAdmin, (req, res) => {
  const { login, itemId } = req.body || {};
  if (!validation.validateUsername(login || '')) {
    return res.status(400).json({ error: 'invalid username' });
  }
  const item = db.getCosmeticById(itemId);
  if (!item) return res.status(400).json({ error: 'invalid itemId' });

  db.recordPurchase({
    login,
    itemId,
    provider: 'dev',
    amount_cents: item.price_cents || 0,
    status: 'completed',
    note: 'dev/admin purchase stub',
  });
  const inv = db.grantCosmetic(login, itemId);
  return res.json({
    success: true,
    purchased: itemId,
    owned: Array.from(inv?.owned || []),
    equipped: inv?.equipped || {},
  });
});

/**
 * Get user cosmetics (requires user token)
 */
app.get('/user/items', (req, res) => {
  const login = auth.extractUserLogin(req);
  if (!validation.validateUsername(login || '')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const inv = getUserInventory(login);
  return res.json({
    owned: Array.from(inv.owned || []),
    equipped: inv.equipped,
    coins: db.getCoins(login),
  });
});

/**
 * Partner progress for a streamer (requires user token; admin can query any channel)
 */
app.get('/partner/progress', (req, res) => {
  try {
    const tokenLogin = auth.extractUserLogin(req);
    if (!validation.validateUsername(tokenLogin || '')) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const queryChannel = (req.query && req.query.channel) || tokenLogin;
    const channel = normalizeChannelName(queryChannel) || tokenLogin;
    const isAdmin = auth.isAdminRequest(req);
    if (!isAdmin && channel !== normalizeChannelName(tokenLogin)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const days = Math.max(1, Math.min(90, parseInt(req.query?.days, 10) || 30));
    const progress = db.getPartnerProgress(channel, days);
    return res.json(progress);
  } catch (err) {
    logger.error('Partner progress failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Admin: list partner progress for all streamers
 */
app.get('/admin/partner/progress', auth.requireAdmin, (_req, res) => {
  try {
    const rows = db.listEligibility();
    res.json({ rows });
  } catch (err) {
    logger.error('Admin partner progress failed', { error: err.message });
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Equip a cosmetic item (requires user token)
 * Body: { itemId }
 */
app.post('/user/equip', (req, res) => {
  const login = auth.extractUserLogin(req);
  if (!validation.validateUsername(login || '')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const itemId = req.body?.itemId;
  const updated = db.equipCosmetic(login, itemId);
  if (!updated) return res.status(400).json({ error: 'invalid itemId or not owned' });
  const inv = getUserInventory(login);
  const channel = getChannelFromReq(req);
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  io.to(channelName).emit('playerUpdate', { login, channel: channelName, cosmetics: getCosmeticsForLogin(login) });
  return res.json({
    success: true,
    equipped: inv.equipped || {},
  });
});

/**
 * Save overlay loadout (cosmetics/effects) for the current channel (requires user token)
 * Body: { cosmetics, effects }
 */
app.post('/overlay/sync', (req, res) => {
  const login = auth.extractUserLogin(req);
  if (!validation.validateUsername(login || '')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const channel = normalizeChannelName(req.query?.channel || login) || login;
  const payload = {
    cosmetics: req.body?.cosmetics || {},
    effects: req.body?.effects || {},
  };
  db.saveOverlayLoadout(channel, payload);
  const mappedSettings = sanitizeOverlaySettings(mapLoadoutToOverlaySettings(payload));
  overlaySettingsByChannel[channel] = {
    ...overlaySettingsByChannel[channel],
    ...mappedSettings,
  };
  overlayFxByChannel[channel] = payload.effects || {};
  io.to(channel).emit('overlaySettings', { settings: overlaySettingsByChannel[channel], fx: overlayFxByChannel[channel], channel });
  return res.json({ saved: true, channel });
});

/**
 * Get overlay loadout for a channel (public)
 */
app.get('/overlay/loadout', (req, res) => {
  const channel = normalizeChannelName(req.query?.channel || req.query?.c || '') || DEFAULT_CHANNEL;
  const data = db.getOverlayLoadout(channel);
  if (!data) return res.json({ channel, cosmetics: {}, effects: {} });
  return res.json({ channel, ...data });
});

/**
 * Purchase a cosmetic using soft currency (coins)
 * Body: { itemId }
 */
app.post('/market/buy', (req, res) => {
  const login = auth.extractUserLogin(req);
  if (!validation.validateUsername(login || '')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const itemId = req.body?.itemId;
  const partnerId = (req.body?.partnerId || '').toLowerCase() || null;
  if (!itemId) return res.status(400).json({ error: 'itemId required' });
  const catalog = db.getCatalog();
  const item = catalog.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: 'not_found' });
  const price = Number.isFinite(item.price_cents) ? item.price_cents : 0;
  if (price > 0) {
    const spend = db.spendCoins(login, price);
    if (!spend.ok) {
      return res.status(400).json({ error: 'insufficient_coins', coins: spend.remaining });
    }
  }
  const inv = db.grantCosmetic(login, itemId);
  db.recordPurchase({
    login,
    itemId,
    provider: 'coins',
    amount_cents: price,
    coin_amount: price,
    status: 'completed',
    partner_id: partnerId,
    note: 'soft currency purchase',
  });
  return res.json({
    success: true,
    purchased: itemId,
    coins: db.getCoins(login),
    owned: Array.from(inv?.owned || []),
    equipped: inv?.equipped || {},
  });
});

// Partner views (fire-and-forget)
app.post('/partners/:id/view', (req, res) => {
  const partnerId = (req.params.id || '').toLowerCase();
  if (!partnerId) return res.status(400).json({ error: 'invalid_partner' });
  const login = auth.extractUserLogin(req);
  db.recordPartnerView(partnerId, validation.validateUsername(login || '') ? login : null);
  return res.json({ ok: true });
});

// Admin: upsert partner
app.post('/admin/partners', auth.requireAdmin, (req, res) => {
  try {
    const { id, display_name, payout_pct } = req.body || {};
    if (!validation.validateUsername(id || '')) {
      return res.status(400).json({ error: 'invalid_id' });
    }
    const pct = Math.max(0, Math.min(Number(payout_pct || 0.1), 0.9));
    const partner = db.upsertPartner({ id, display_name, payout_pct: pct });
    return res.json(partner);
  } catch (err) {
    logger.error('Upsert partner failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Admin: list partners with stats
app.get('/admin/partners', auth.requireAdmin, (_req, res) => {
  try {
    const partners = db.listPartnerStats();
    return res.json({ partners });
  } catch (err) {
    logger.error('List partners failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Admin: verify subscription via bot token and grant subscriber cosmetics
 * Body: { login, broadcaster }
 */
app.post('/admin/grant-subscriber', auth.requireAdmin, async (req, res) => {
  try {
    const { login, broadcaster } = req.body || {};
    if (!validation.validateUsername(login || '')) {
      return res.status(400).json({ error: 'invalid login' });
      }
      const broadcasterLogin = (broadcaster || config.STREAMER_LOGIN || '').toLowerCase();
      if (!validation.validateUsername(broadcasterLogin)) {
        return res.status(400).json({ error: 'invalid broadcaster' });
      }
      const isSub = await isUserSubscribedTo(broadcasterLogin, login, broadcasterLogin);
      if (!isSub) {
        return res.status(403).json({ error: 'not_subscribed' });
      }
      const granted = grantSubscriberCosmetics(login);
      return res.json({ ok: true, granted });
  } catch (err) {
    logger.error('grant-subscriber failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ====== PAYOUTS (stub) ======
// These endpoints illustrate idempotency key usage; replace with real payout logic/batch persistence.
  app.post('/admin/payouts/dry-run', auth.requireAdmin, async (req, res) => {
    if (!payoutStore?.payoutDryRun) {
      return res.status(501).json({ error: 'payouts_unavailable' });
    }
    try {
      const {
        period_start,
        period_end,
        currency = 'USD',
        payout_minimum_cents = 0,
        note_template = '',
      } = req.body || {};
      if (!period_start || !period_end) {
        return res.status(400).json({ error: 'missing_period' });
      }
      const result = await payoutStore.payoutDryRun({
        periodStart: period_start,
        periodEnd: period_end,
        currency,
        payoutMinimumCents: Number(payout_minimum_cents) || 0,
        noteTemplate: note_template || '',
      });
      return res.json(result);
    } catch (err) {
      logger.error('payout dry run failed', { error: err.message });
      const status = err.message === 'postgres_unavailable' ? 503 : 500;
      return res.status(status).json({ error: err.message || 'internal_error' });
    }
  });
  
  app.post('/admin/payouts/submit', auth.requireAdmin, async (req, res) => {
    if (!payoutStore?.payoutSubmit) {
      return res.status(501).json({ error: 'payouts_unavailable' });
    }
    try {
      const {
        period_start,
        period_end,
        currency = 'USD',
        payout_minimum_cents = 0,
        note_template = '',
        items = [],
        idempotency_key,
      } = req.body || {};
      if (!period_start || !period_end) {
        return res.status(400).json({ error: 'missing_period' });
      }

      // Normalize incoming items if provided; otherwise run a dry run to build the list.
      let normalizedItems = Array.isArray(items)
        ? items.map(i => ({
            partnerId: i.partnerId || i.partner_id,
            receiver: i.receiver || i.paypal_receiver || i.email,
            amountCents: Number(i.amountCents ?? i.amount_cents ?? i.amount) || 0,
            currency: i.currency || currency,
          })).filter(i => i.partnerId && i.receiver && i.amountCents > 0)
        : [];

      if (!normalizedItems.length) {
        const preview = await payoutStore.payoutDryRun({
          periodStart: period_start,
          periodEnd: period_end,
          currency,
          payoutMinimumCents: Number(payout_minimum_cents) || 0,
          noteTemplate: note_template || '',
        });
        normalizedItems = preview.items_preview || [];
        if (!normalizedItems.length) {
          return res.status(400).json({ error: 'no_eligible_partners' });
        }
      }

      const batch = await payoutStore.payoutSubmit({
        periodStart: period_start,
        periodEnd: period_end,
        currency,
        payoutMinimumCents: Number(payout_minimum_cents) || 0,
        noteTemplate: note_template || '',
        items: normalizedItems,
        idempotencyKey: idempotency_key,
        adminId: req.user?.id || null,
      });
      return res.status(201).json(batch);
    } catch (err) {
      logger.error('payout submit failed', { error: err.message });
      const status = err.message === 'postgres_unavailable' ? 503 : 500;
      return res.status(status).json({ error: err.message || 'internal_error' });
    }
  });

  app.post('/admin/payouts/:id/reconcile', auth.requireAdmin, async (req, res) => {
    if (!payoutStore?.reconcileBatch) {
      return res.status(501).json({ error: 'payouts_unavailable' });
    }
    try {
      const result = await payoutStore.reconcileBatch(req.params.id);
      return res.json(result);
    } catch (err) {
      logger.error('payout reconcile failed', { error: err.message });
      const status = err.message === 'postgres_unavailable' ? 503 : 500;
      return res.status(status).json({ error: err.message || 'internal_error' });
    }
  });

  app.get('/admin/payouts/export/summary', auth.requireAdmin, async (req, res) => {
    if (!payoutStore?.exportSummaryCsv) {
      return res.status(501).json({ error: 'payouts_unavailable' });
    }
    try {
      const { period_start, period_end } = req.query || {};
      if (!period_start || !period_end) {
        return res.status(400).json({ error: 'missing_period' });
      }
      const csv = await payoutStore.exportSummaryCsv({ periodStart: period_start, periodEnd: period_end });
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv || '');
    } catch (err) {
      logger.error('payout export summary failed', { error: err.message });
      const status = err.message === 'postgres_unavailable' ? 503 : 500;
      return res.status(status).json({ error: err.message || 'internal_error' });
    }
  });

  app.get('/admin/payouts/:id/items.csv', auth.requireAdmin, async (req, res) => {
    if (!payoutStore?.exportItemsCsv) {
      return res.status(501).json({ error: 'payouts_unavailable' });
    }
    try {
      const masked = req.query?.masked !== 'false';
      const csv = await payoutStore.exportItemsCsv({ batchId: req.params.id, masked });
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv || '');
    } catch (err) {
      logger.error('payout export items failed', { error: err.message });
      const status = err.message === 'postgres_unavailable' ? 503 : 500;
      return res.status(status).json({ error: err.message || 'internal_error' });
    }
  });
  
  app.get('/admin/payouts/:id', auth.requireAdmin, async (req, res) => {
    if (!payoutStore?.getBatchDetail) {
      return res.status(501).json({ error: 'payouts_unavailable' });
    }
    try {
      const detail = await payoutStore.getBatchDetail(req.params.id);
      if (!detail) return res.status(404).json({ error: 'not_found' });
      return res.json(detail);
    } catch (err) {
      logger.error('payout batch lookup failed', { error: err.message });
      const status = err.message === 'postgres_unavailable' ? 503 : 500;
      return res.status(status).json({ error: err.message || 'internal_error' });
    }
  });

/**
 * Admin: test Twitch subscription scope with current bot token
 * Optional query params: broadcaster, user (logins) to attempt a real check
 */
app.get('/admin/test-subs', auth.requireAdmin, async (req, res) => {
  try {
    const validation = await validateBotToken();
    if (!validation.ok) {
      return res.status(400).json({ ok: false, status: validation.status || 400, message: 'Token invalid or missing' });
    }
    const result = {
      ok: true,
      client_id: validation.client_id,
      login: validation.login,
      scopes: validation.scopes,
      hasSubScope: (validation.scopes || []).includes('channel:read:subscriptions'),
    };

    const broadcaster = (req.query?.broadcaster || '').toLowerCase();
    const user = (req.query?.user || '').toLowerCase();
    if (broadcaster && user && result.hasSubScope) {
      try {
        result.subscription = await isUserSubscribedTo(broadcaster, user, broadcaster);
      } catch (e) {
        result.subscription = false;
        result.subscriptionError = e.message;
      }
    }
    return res.json(result);
  } catch (err) {
    logger.error('test-subs failed', { error: err.message });
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

/**
 * Set player avatar color (admin/streamer)
 */
app.post('/admin/player-color', auth.requireAdmin, (req, res) => {
  try {
    const { login, color } = req.body || {};
    if (!validation.validateUsername(login || '')) {
      return res.status(400).json({ error: 'invalid username' });
    }
    const safeColor = sanitizeColor(color);
    if (!safeColor) {
      return res.status(400).json({ error: 'invalid color (use #rrggbb)' });
    }
    const avatar = updatePlayerAvatar(login, safeColor);
    return res.json({ login, avatar, color: safeColor });
  } catch (err) {
    logger.error('Failed to set player color', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Bulk import cosmetics (JSON array) admin-only
 * Body: { items: [...] }
 */
app.post('/admin/cosmetics/import', auth.requireAdmin, (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: 'no items provided' });
    const normalized = items.map(item => ({
      id: String(item.id || '').trim(),
      type: String(item.type || '').trim(),
      name: item.name || item.id || 'Unnamed cosmetic',
      price_cents: Number.isFinite(item.price_cents) ? item.price_cents : Number(item.price || 0) || 0,
      rarity: item.rarity || 'common',
      preview: item.preview || '',
      tint: item.tint || item.color || null,
      color: item.color || null,
      texture_url: item.texture_url || item.image_url || null,
      image_url: item.image_url || null,
      unlock_type: item.unlock_type || null,
      unlock_value: Number(item.unlock_value) || 0,
      unlock_note: item.unlock_note || '',
      tags: item.tags || '',
    })).filter(i => i.id && i.type);
    if (!normalized.length) return res.status(400).json({ error: 'no valid items' });
    db.upsertCosmetics(normalized);
    return res.json({ imported: normalized.length });
  } catch (err) {
    logger.error('Cosmetic import failed', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});
/**
 * Get audit log (admin only)
 */
app.get('/admin/audit', auth.requireAdmin, (req, res) => {
  try {
    const raw = req.query.limit || '100';
    const limit = Math.min(parseInt(raw, 10) || 100, 1000);
    const audit = db.getAuditLog(limit);
    return res.json(audit);
  } catch (err) {
    logger.error('Failed to fetch audit log', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Delete audit entry (admin only)
 */
app.delete('/admin/audit/:id', auth.requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'invalid id' });

    db.deleteAuditById(id);
    logger.info('Audit entry deleted', { id });
    return res.json({ success: true });
  } catch (err) {
    logger.error('Failed to delete audit entry', { error: err.message });
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============ SOCKET.IO EVENTS ============

io.on('connection', (socket) => {
  const channel = getChannelFromSocket(socket);
  socket.data.channel = channel;
  socket.join(channel);
  logger.debug('Client connected', { socketId: socket.id, channel });
  socket.on('disconnect', (reason) => {
    recentSocketDisconnects.push({ reason, at: Date.now(), channel });
    if (recentSocketDisconnects.length > 50) recentSocketDisconnects.shift();
  });

  // Send current state
  const stateView = getStateForChannel(channel);
  socket.emit('state', {
    bettingOpen: stateView.bettingOpen,
    roundInProgress: stateView.roundInProgress,
    deck: (stateView.currentDeck || []).length,
    mode: stateView.currentMode,
    pot: stateView.pokerPot,
    currentBet: stateView.pokerCurrentBet,
    channel,
    players: Object.entries(stateView.playerStates || {}).map(([login, st]) => ({
      login,
      hand: st.hand,
      hands: st.hands,
      activeHand: st.activeHand,
      split: st.isSplit,
      insurance: st.insurance,
      insurancePlaced: st.insurancePlaced,
      bet: (stateView.betAmounts && stateView.betAmounts[login]) || 0,
      streetBet: (stateView.pokerStreetBets && stateView.pokerStreetBets[login]) || 0,
      avatar: (db.getProfile(login)?.settings && JSON.parse(db.getProfile(login).settings || '{}').avatarUrl) || null,
      cosmetics: getCosmeticsForLogin(login),
      ...getHeuristics(login, channel),
    })),
  });
  if (overlaySettingsByChannel[channel]) {
    socket.emit('overlaySettings', { settings: overlaySettingsByChannel[channel], fx: overlayFxByChannel[channel], channel });
  }

  const socketLogin = auth.extractUserLogin(socket.handshake);
  socket.data.login = socketLogin;

  // Send profile if user is authenticated
  if (socketLogin) {
    const profile = db.getProfile(socketLogin);
    if (profile) socket.emit('profile', profile);
    try {
      const settings = profile?.settings ? JSON.parse(profile.settings) : {};
      const avatarUrl = settings?.avatarUrl || getDefaultAvatarForLogin(socketLogin, settings?.avatarColor);
      io.to(channel).emit('playerUpdate', { login: socketLogin, avatar: avatarUrl, channel });
    } catch (e) {
      // ignore parse errors
    }
  }

  /**
   * Start a new round
   */
  socket.on('startRound', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (!auth.isAdminRequest(socket.handshake)) {
      logger.warn('Unauthorized round start attempt', { socketId: socket.id, channel: channelName });
      return;
    }

    if (state.roundInProgress) {
      socket.emit('error', 'Round already in progress');
      return;
    }

    if (data && data.startNow) {
      startRoundInternal(channelName);
    } else if (state.bettingOpen) {
      startRoundInternal(channelName);
    } else {
      openBettingWindow(channelName);
    }
  });

  /**
   * Force a draw/discard decision
   */
  socket.on('forceDraw', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (!auth.isAdminRequest(socket.handshake)) {
      logger.warn('Unauthorized draw attempt', { socketId: socket.id });
      return;
    }

    if (!state.roundInProgress) {
      socket.emit('error', 'No round in progress');
      return;
    }

    if (state.currentMode === 'blackjack') {
      settleRound({ ...data, channel: channelName });
    } else {
      advancePokerPhase(channelName);
    }
  });

  /**
   * Overlay tuning (admin only)
   */
  socket.on('overlaySettings', (data) => {
    if (!auth.isAdminRequest(socket.handshake)) {
      logger.warn('Unauthorized overlaySettings attempt', { socketId: socket.id });
      return;
    }
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const safe = sanitizeOverlaySettings(data || {});
    overlaySettingsByChannel[channelName] = {
      ...overlaySettingsByChannel[channelName],
      ...safe,
    };
    io.to(channelName).emit('overlaySettings', { settings: overlaySettingsByChannel[channelName], channel: channelName });
    logger.info('Overlay settings updated', { channel: channelName, settings: overlaySettingsByChannel[channelName] });
  });

  /**
   * Add AI test bots (admin-only)
   */
  socket.on('addTestBots', (data = {}) => {
    if (!auth.isAdminRequest(socket.handshake)) {
      logger.warn('Unauthorized addTestBots attempt', { socketId: socket.id });
      return;
    }
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const count = Math.max(1, Math.min(parseInt(data.count, 10) || 3, MAX_BLACKJACK_PLAYERS));
    const state = getStateForChannel(channelName);
    const maxSeats = state.currentMode === 'blackjack' ? MAX_BLACKJACK_PLAYERS : MAX_POKER_PLAYERS;
    const bots = addTestBots(channelName, count, maxSeats);
    logger.info('Added test bots', { channel: channelName, bots });
    if (data.startNow) {
      startRoundInternal(channelName);
    }
  });

  /**
   * Player selects held cards (poker)
   */
  socket.on('playerHold', (data) => {
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerHold: missing/invalid login', { socketId: socket.id });
      return;
    }
    const held = Array.isArray(data.held) ? data.held : [];
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getPlayerState(login, channelName);
    state.held = held.slice(0, 5);
  });

  /**
   * Poker betting: check
   */
  socket.on('playerCheck', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (!isMultiStreamChannel(channelName) || state.currentMode !== 'poker' || !state.roundInProgress) return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) return;
    pokerCheckAction(login, channelName);
  });

  /**
   * Poker betting: call
   */
  socket.on('playerCall', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (!isMultiStreamChannel(channelName) || state.currentMode !== 'poker' || !state.roundInProgress) return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) return;
    pokerCallAction(login, channelName);
  });

  /**
   * Poker betting: raise/bet
   */
  socket.on('playerRaise', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (!isMultiStreamChannel(channelName) || state.currentMode !== 'poker' || !state.roundInProgress) return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) return;
    const amount = Number.isInteger(data?.amount) ? data.amount : null;
    if (amount === null) return;
    pokerRaiseAction(login, amount, channelName);
  });

  /**
   * Poker betting: fold
   */
  socket.on('playerFold', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (!isMultiStreamChannel(channelName) || state.currentMode !== 'poker' || !state.roundInProgress) return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) return;
    pokerFoldAction(login, channelName);
  });

  /**
   * Blackjack: player requests a hit
   */
  socket.on('playerHit', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerHit: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.hit?.(login);
  });

  /**
   * Blackjack: player stands
   */
  socket.on('playerStand', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerStand: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.stand?.(login);
  });

  /**
   * Blackjack: player double down
   */
  socket.on('playerDouble', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerDouble: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.doubleDown?.(login, state.betAmounts, db);
  });

  /**
   * Blackjack: player surrender (forfeit half bet)
   */
  socket.on('playerSurrender', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerSurrender: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.surrender?.(login, state.betAmounts, db);
  });

  /**
   * Blackjack: player insurance (max 50% of bet when dealer shows Ace)
   */
  socket.on('playerInsurance', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    const amount = data && Number(data.amount);
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerInsurance: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.insurance?.(login, amount, state.betAmounts, db);
  });

  /**
   * Blackjack: player split (duplicates bet and plays two hands)
   */
  socket.on('playerSplit', () => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerSplit: missing/invalid login', { socketId: socket.id });
      return;
    }
    state.blackjackHandlers?.split?.(login, state.betAmounts, db);
  });

  socket.on('playerSwitchHand', (data) => {
    const channelName = socket.data.channel || DEFAULT_CHANNEL;
    const state = getStateForChannel(channelName);
    if (state.currentMode !== 'blackjack') return;
    const login = socket.data.login;
    if (!validation.validateUsername(login || '')) {
      logger.warn('Unauthorized playerSwitchHand: missing/invalid login', { socketId: socket.id });
      return;
    }
    const index = Number.isInteger(data?.index) ? data.index : null;
    if (index !== null) {
      state.blackjackHandlers?.switchHand?.(login, index);
    }
  });

  socket.on('disconnect', () => {
    logger.debug('Client disconnected', { socketId: socket.id });
  });
});

// ============ TWITCH CHAT INTEGRATION ============

async function initializeTwitch() {
  if (!config.TWITCH_OAUTH_TOKEN || !config.TWITCH_BOT_USERNAME) {
    logger.warn('Twitch configuration incomplete, skipping chat integration');
    return;
  }

  try {
    // Determine channels to join (persisted list + default channel)
    let botChannels = [];
    try {
      botChannels = db.getBotChannels();
    } catch (e) {
      logger.warn('Failed to load bot channels; defaulting to TWITCH_CHANNEL', { error: e.message });
    }
    if ((!botChannels || botChannels.length === 0) && config.TWITCH_CHANNEL) {
      db.addBotChannel(config.TWITCH_CHANNEL);
      botChannels = [config.TWITCH_CHANNEL];
    }
    botChannels = (botChannels || []).map(c => c.replace(/^#/, '').toLowerCase());

    tmiClient = new tmi.Client({
      options: { debug: config.NODE_ENV === 'development' },
      connection: {
        reconnect: true,
        secure: true,
      },
      identity: {
        username: config.TWITCH_BOT_USERNAME,
        password: config.TWITCH_OAUTH_TOKEN,
      },
      channels: botChannels,
    });

    tmiClient.on('connected', () => {
      lastTmiReconnectAt = Date.now();
    });

    tmiClient.on('reconnect', () => {
      lastTmiReconnectAt = Date.now();
    });

    tmiClient.on('message', (channel, tags, message, self) => {
      if (self) return;

      const username = tags['display-name'] || tags.username;
      const loginLower = (username || '').toLowerCase();
      const isBroadcaster = (tags.badges && tags.badges.broadcaster === '1') || false;
      const isMod = tags.mod === true || (tags.badges && tags.badges.moderator === '1');
      const isStreamer = config.STREAMER_LOGIN && loginLower === config.STREAMER_LOGIN.toLowerCase();
      const isBotAdmin = config.BOT_ADMIN_LOGIN && loginLower === config.BOT_ADMIN_LOGIN.toLowerCase();
      const canAdjustBalance = isBroadcaster || isMod || isStreamer || isBotAdmin;
      const content = message.trim();
      const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
      const channelState = getStateForChannel(channelName);

      logger.debug('Twitch message', { username, message: content });

      // Handle betting commands
      if (content.startsWith('!bet ')) {
        const parts = content.split(/\s+/);
        const amount = parseInt(parts[1], 10);
        placeBet(username, amount, channelName);
      } else if (content.toLowerCase().startsWith('!addchips')) {
        if (!canAdjustBalance) return;
        const parts = content.split(/\s+/);
        const target = (parts[1] || '').trim().toLowerCase();
        const amt = parseInt(parts[2], 10);
        if (!validation.validateUsername(target) || !Number.isInteger(amt) || amt <= 0) {
          tmiClient.say(channel, 'Usage: !addchips <username> <amount>');
          return;
        }
        db.ensureBalance(target);
        db.upsertProfile({
          login: target,
          display_name: target,
          settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
          role: 'player',
        });
        const newBalance = db.addChips(target, amt);
        io.to(channelName).emit('playerUpdate', { login: target, balance: newBalance, bet: 0, channel: channelName });
        logger.info('Chips added via chat', { actor: username, target, amount: amt, newBalance });
        tmiClient.say(channel, `Added ${amt} chips to ${target}. New balance: ${newBalance}`);
      } else if (content.toLowerCase().startsWith('!joinme ')) {
        const parts = content.split(/\s+/);
        const token = parts[1]?.trim();
        const secretOk = token && (
          (config.BOT_JOIN_SECRET && token === config.BOT_JOIN_SECRET) ||
          (config.ADMIN_TOKEN && token === config.ADMIN_TOKEN)
        );
        if (!secretOk) {
          logger.warn('Join request rejected (bad token)', { channel, user: username });
          return;
        }
        const requestedChannel = channel.replace(/^#/, '');
        joinBotChannel(requestedChannel);
        tmiClient.say(channel, `Bot joining ${requestedChannel}`);
      } else if (content.toLowerCase().startsWith('!color ')) {
        if (!canAdjustBalance) return;
        const parts = content.split(/\s+/);
        const target = (parts[1] || '').trim().toLowerCase();
        const color = (parts[2] || '').trim();
        if (!validation.validateUsername(target) || !sanitizeColor(color)) {
          tmiClient.say(channel, 'Usage: !color <username> #rrggbb');
          return;
        }
        const chanName = channel.replace(/^#/, '') || DEFAULT_CHANNEL;
        const avatar = updatePlayerAvatar(target, color, chanName);
        tmiClient.say(channel, `Set ${target}'s color to ${color}`);
      } else if (content === '!hit') {
        if (channelState.currentMode === 'blackjack') {
          channelState.blackjackHandlers?.hit?.(username);
        }
      } else if (content === '!stand') {
        if (channelState.currentMode === 'blackjack') {
          channelState.blackjackHandlers?.stand?.(username);
        }
      } else if (content.startsWith('!hold ')) {
        const indices = content
          .split(/\s+/)[1]
          .split(',')
          .map(n => parseInt(n, 10))
          .filter(n => Number.isInteger(n) && n >= 0 && n < 5);
        const state = getPlayerState(username, channelName);
        state.held = indices.slice(0, 5);
      }
    });

    await tmiClient.connect();
    logger.info('Twitch chat connected', { channels: botChannels });
  } catch (err) {
    logger.error('Failed to initialize Twitch', { error: err.message });
  }
}

// ============ SERVER STARTUP ============

/**
 * Start the server
 */
async function start() {
  try {
    // Run startup checks
    const checks = startup.checkStartup();
    startup.logStartupCheck(checks);

    if (checks.status === 'error') {
      logger.error('Startup checks failed, exiting');
      process.exit(1);
    }

    // Initialize database
    db.init();
    db.seedCosmetics(COSMETIC_CATALOG);

    // Ensure streamer profile exists
    if (validation.validateUsername(config.STREAMER_LOGIN)) {
      streamerProfile = db.upsertProfile({
        login: config.STREAMER_LOGIN,
        display_name: config.STREAMER_LOGIN,
        settings: { startingChips: config.GAME_STARTING_CHIPS, theme: 'dark' },
        role: 'streamer',
      });
    }

    // Initialize Twitch (optional)
    await initializeTwitch();

    // Schedule automated AI overlay checks (best-effort)
    if (config.OPENAI_API_KEY) {
      setInterval(() => {
        runOverlayDiagnosis(DEFAULT_CHANNEL).catch(err => logger.warn('overlay auto-check failed', { error: err.message }));
      }, AUTO_AI_CHECK_MS);

      // Daily AI test run at midnight CST
      setInterval(() => {
        try {
          const parts = getCstParts(new Date());
          const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
          if (parts.hour === '00' && lastAiTestRunDateCst !== dateKey) {
            lastAiTestRunDateCst = dateKey;
            runAiTests('scheduled').catch(err => logger.warn('scheduled AI tests failed', { error: err.message }));
          }
        } catch (err) {
          logger.warn('AI test scheduler failed', { error: err.message });
        }
      }, 5 * 60 * 1000); // check every 5 minutes
    }

    // Synthetic health check every 10 minutes
    setInterval(() => {
      runSyntheticCheck('scheduled').catch(err => logger.warn('synthetic check failed', { error: err.message }));
    }, 10 * 60 * 1000);

    // Asset sanity check hourly
    setInterval(() => {
      runAssetCheck('scheduled').catch(err => logger.warn('asset check failed', { error: err.message }));
    }, 60 * 60 * 1000);

    // Start listening
    server.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`Server running on 0.0.0.0:${config.PORT}`, {
        environment: config.NODE_ENV,
        database: config.DB_FILE,
      });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

// ============ GRACEFUL SHUTDOWN ============

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);

  try {
    // Close Twitch connection
    if (tmiClient) {
      await tmiClient.disconnect();
      logger.info('Twitch disconnected');
    }

    // Close Socket.IO
    io.close();
    logger.info('Socket.IO closed');

    // Close database
    db.close();
    logger.info('Database closed');

    // Close HTTP server
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force exit after configured timeout
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, config.SHUTDOWN_FORCE_TIMEOUT_MS);
  } catch (err) {
    logger.error('Error during shutdown', { error: err.message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
start();
function startPlayerTurnCycle(channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  if (state.turnManager && state.turnManager.stop) state.turnManager.stop();
  if (!state.playerTurnOrder.length) return;

  const activeOrder = state.playerTurnOrder.filter(login => {
    const pState = getPlayerState(login, channel);
    if (state.currentMode === 'blackjack') {
      return !pState.stood && !pState.busted;
    }
    return !pState.folded;
  });

  if (!activeOrder.length) {
    settleRound({ channel });
    return;
  }

  if (state.currentMode === 'blackjack') {
    const aiDecider = (login) => isAiPlayer(login) && aiBlackjackAction(login, channel);
    state.turnManager = state.blackjackHandlers?.turnManager?.(activeOrder, aiDecider);
  } else {
    const duration = config.POKER_ACTION_DURATION_MS;
    const aiDecider = (login) => isAiPlayer(login) && aiPokerAction(login, channel);
    state.turnManager = state.pokerHandlers?.turnManager?.(activeOrder, duration, (login) => {
      if (!login) return;
      const streetBet = state.pokerStreetBets[login] || 0;
      if (streetBet >= state.pokerCurrentBet) {
        state.pokerActed.add(login);
        emitPokerBettingState(channel);
        maybeAdvanceAfterAction(channel);
      } else {
        pokerFoldAction(login, channel);
      }
    }, aiDecider);
  }

  if (state.turnManager && state.turnManager.start) {
    state.turnManager.start();
  }
}

function emitPokerBettingState(channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  const normalized = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  io.to(normalized).emit('pokerBetting', {
    pot: state.pokerPot,
    currentBet: state.pokerCurrentBet,
    streetBets: state.pokerStreetBets,
    totalBets: state.betAmounts,
    phase: state.pokerPhase,
    channel: normalized,
  });
}

function maybeAdvanceAfterAction(channel = DEFAULT_CHANNEL) {
  const state = getStateForChannel(channel);
  const active = state.playerTurnOrder.filter(login => !getPlayerState(login, channel).folded);
  if (active.length <= 1) {
    settleRound({ channel });
    return;
  }

  const allMatched = active.every(login => (state.pokerStreetBets[login] || 0) >= state.pokerCurrentBet);
  const allActed = active.every(login => state.pokerActed.has(login));
  if (allMatched && allActed) {
    advancePokerPhase(channel);
  }
}

function pokerFoldAction(login, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const playerState = getPlayerState(login, channelName);
  if (!playerState || playerState.folded) return;
  playerState.folded = true;
  state.pokerActed.add(login);
  io.to(channelName).emit('playerUpdate', { login, folded: true, channel: channelName });
  maybeAdvanceAfterAction(channelName);
  startPlayerTurnCycle(channelName);
}

function pokerCheckAction(login, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const streetBet = state.pokerStreetBets[login] || 0;
  if (streetBet < state.pokerCurrentBet) return;
  state.pokerActed.add(login);
  emitPokerBettingState(channelName);
  maybeAdvanceAfterAction(channelName);
  startPlayerTurnCycle(channelName);
}

function pokerCallAction(login, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const streetBet = state.pokerStreetBets[login] || 0;
  const needed = Math.max(0, state.pokerCurrentBet - streetBet);
  if (needed === 0) {
    pokerCheckAction(login, channelName);
    return;
  }
  const balance = state.tournamentId && state.tournamentStacks ? (state.tournamentStacks[login] || 0) : db.getBalance(login);
  if (needed > balance) return;
  const isAllIn = needed === balance;
  if (state.tournamentId && state.tournamentStacks) {
    state.tournamentStacks[login] = balance - needed;
    db.updateTournamentPlayerChips(state.tournamentId, login, state.tournamentStacks[login]);
  } else {
    db.setBalance(login, balance - needed);
  }
  state.betAmounts[login] = (state.betAmounts[login] || 0) + needed;
  state.pokerStreetBets[login] = streetBet + needed;
  state.pokerPot += needed;
  state.pokerActed.add(login);
  if (isAllIn) {
    io.to(channelName).emit('playerUpdate', { login, allIn: true, channel: channelName });
  }
  emitPokerBettingState(channelName);
  maybeAdvanceAfterAction(channelName);
  startPlayerTurnCycle(channelName);
}

function pokerRaiseAction(login, amount, channel = DEFAULT_CHANNEL) {
  const channelName = normalizeChannelName(channel) || DEFAULT_CHANNEL;
  const state = getStateForChannel(channelName);
  const streetBet = state.pokerStreetBets[login] || 0;
  if (!Number.isInteger(amount) || amount <= state.pokerCurrentBet || amount < config.GAME_MIN_BET || amount > config.GAME_MAX_BET) {
    return;
  }
  const needed = amount - streetBet;
  const balance = state.tournamentId && state.tournamentStacks ? (state.tournamentStacks[login] || 0) : db.getBalance(login);
  if (needed > balance) return;
  const isAllIn = needed === balance;
  if (state.tournamentId && state.tournamentStacks) {
    state.tournamentStacks[login] = balance - needed;
    db.updateTournamentPlayerChips(state.tournamentId, login, state.tournamentStacks[login]);
  } else {
    db.setBalance(login, balance - needed);
  }
  state.betAmounts[login] = (state.betAmounts[login] || 0) + needed;
  state.pokerStreetBets[login] = amount;
  state.pokerCurrentBet = amount;
  state.pokerPot += needed;
  state.pokerActed = new Set([login]); // others must respond
  if (isAllIn) {
    io.to(channelName).emit('playerUpdate', { login, allIn: true, channel: channelName });
  }
  emitPokerBettingState(channelName);
  startPlayerTurnCycle(channelName);
}
/**
 * Check VIP status for a user
 */
async function isUserVipOf(broadcasterLogin, userLogin, channel) {
  if (!broadcasterLogin || !userLogin) return false;
  const token = getHelixToken(channel || broadcasterLogin);
  if (!token || !config.TWITCH_CLIENT_ID) return false;
  const ids = await fetchTwitchUsersByLogin([broadcasterLogin, userLogin], channel || broadcasterLogin);
  const bId = ids[broadcasterLogin.toLowerCase()];
  const uId = ids[userLogin.toLowerCase()];
  if (!bId || !uId) return false;
  const url = `https://api.twitch.tv/helix/channels/vips?broadcaster_id=${bId}&user_id=${uId}`;
  const res = await fetch(url, {
    headers: {
      'Client-ID': config.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Array.isArray(data.data) && data.data.length > 0;
}

/**
 * Check follower status for a user
 */
async function isUserFollowerOf(broadcasterLogin, userLogin, channel) {
  if (!broadcasterLogin || !userLogin) return false;
  const token = getHelixToken(channel || broadcasterLogin);
  if (!token || !config.TWITCH_CLIENT_ID) return false;
  const ids = await fetchTwitchUsersByLogin([broadcasterLogin, userLogin], channel || broadcasterLogin);
  const bId = ids[broadcasterLogin.toLowerCase()];
  const uId = ids[userLogin.toLowerCase()];
  if (!bId || !uId) return false;
  const url = `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${bId}&user_id=${uId}`;
  const res = await fetch(url, {
    headers: {
      'Client-ID': config.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Array.isArray(data.data) && data.data.length > 0;
}
