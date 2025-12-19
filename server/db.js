/**
 * Database helper - single data access layer for all DB operations
 */

const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config');
const Logger = require('./logger');

const logger = new Logger('db');

class DBHelper {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize database connection and schema
   */
  init() {
    if (this.initialized) return;

    try {
      const dbPath = path.resolve(config.DB_FILE);
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.initSchema();
      this.initialized = true;
      logger.info('Database initialized', { path: dbPath });
    } catch (err) {
      logger.error('Failed to initialize database', { error: err.message });
      throw err;
    }
  }

  /**
   * Initialize database schema
   */
  initSchema() {
    // Balances table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS balances (
        username TEXT PRIMARY KEY,
        chips INTEGER DEFAULT 1000
      )
    `);

    // Stats table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stats (
        username TEXT PRIMARY KEY,
        roundsPlayed INTEGER DEFAULT 0,
        roundsWon INTEGER DEFAULT 0,
        totalWon INTEGER DEFAULT 0,
        biggestWin INTEGER DEFAULT 0,
        bestHand TEXT DEFAULT 'None',
        handsPlayed INTEGER DEFAULT 0,
        playSeconds INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Leaderboard history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP,
        eval TEXT,
        mult INTEGER,
        voters TEXT DEFAULT '[]'
      )
    `);

    // Tokens
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        purpose TEXT,
        origin TEXT,
        expires_at DATETIME,
        consumed INTEGER DEFAULT 0
      )
    `);

    // Unblock audit
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS unblock_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor TEXT,
        target_username TEXT,
        target_ip TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        note TEXT
      )
    `);

    // Bot joined channels
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bot_channels (
        channel TEXT PRIMARY KEY
      )
    `);

    // Profiles
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        twitch_id TEXT UNIQUE,
        login TEXT UNIQUE,
        display_name TEXT,
        settings TEXT DEFAULT '{}',
        role TEXT DEFAULT 'player',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add role column if missing (idempotent)
    try {
      this.db.exec(`ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'player'`);
    } catch (err) {
      // Ignore if column already exists
    }
    try {
      this.db.exec(`ALTER TABLE stats ADD COLUMN handsPlayed INTEGER DEFAULT 0`);
      this.db.exec(`ALTER TABLE stats ADD COLUMN playSeconds INTEGER DEFAULT 0`);
    } catch (err) {
      // ignore
    }
    try {
      this.db.exec(`ALTER TABLE cosmetics ADD COLUMN image_url TEXT`);
      this.db.exec(`ALTER TABLE cosmetics ADD COLUMN unlock_type TEXT`);
      this.db.exec(`ALTER TABLE cosmetics ADD COLUMN unlock_value INTEGER`);
      this.db.exec(`ALTER TABLE cosmetics ADD COLUMN unlock_note TEXT`);
      this.db.exec(`ALTER TABLE purchases ADD COLUMN coin_amount INTEGER`);
      this.db.exec(`ALTER TABLE purchases ADD COLUMN partner_id TEXT`);
      this.db.exec(`ALTER TABLE tournaments ADD COLUMN game TEXT DEFAULT 'poker'`);
      this.db.exec(`ALTER TABLE tournaments ADD COLUMN rounds INTEGER DEFAULT 1`);
      this.db.exec(`ALTER TABLE tournaments ADD COLUMN advance_config TEXT DEFAULT '[]'`);
      this.db.exec(`ALTER TABLE tournaments ADD COLUMN decks INTEGER DEFAULT 6`);
      this.db.exec(`ALTER TABLE tournaments ADD COLUMN blind_config TEXT DEFAULT '[]'`);
    } catch (err) {
      // ignore
    }

    // Cosmetics catalog
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cosmetics (
        id TEXT PRIMARY KEY,
        type TEXT,
        name TEXT,
        price_cents INTEGER DEFAULT 0,
        rarity TEXT,
        preview TEXT,
        tint TEXT,
        color TEXT,
        texture_url TEXT,
        image_url TEXT,
        unlock_type TEXT,
        unlock_value INTEGER,
        unlock_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User cosmetics ownership/equipped
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_cosmetics (
        login TEXT,
        item_id TEXT,
        slot TEXT,
        equipped INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (login, item_id)
      )
    `);

    // Purchases audit
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT,
        item_id TEXT,
        provider TEXT,
        amount_cents INTEGER,
        coin_amount INTEGER,
        partner_id TEXT,
        status TEXT,
        txn_id TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Partner usage (per-channel daily aggregates)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS partner_usage_daily (
        channel TEXT,
        day TEXT,
        rounds INTEGER DEFAULT 0,
        unique_players TEXT DEFAULT '[]',
        PRIMARY KEY (channel, day)
      )
    `);

    // Overlay loadouts (per channel)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS overlay_settings (
        channel TEXT PRIMARY KEY,
        data TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cached eligibility snapshots
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS partner_eligibility (
        channel TEXT,
        computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        window_days INTEGER,
        data TEXT,
        PRIMARY KEY (channel, window_days)
      )
    `);

    // Partners program
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS partners (
        id TEXT PRIMARY KEY,
        display_name TEXT,
        payout_pct REAL DEFAULT 0.1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS partner_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partner_id TEXT,
        login TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Currency balances (soft currency for cosmetics)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS currency_balance (
        login TEXT PRIMARY KEY,
        coins INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Twitch sub tokens (per channel)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS twitch_sub_tokens (
        channel TEXT PRIMARY KEY,
        access_token TEXT,
        refresh_token TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Poker tournaments
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        name TEXT,
        game TEXT DEFAULT 'poker',
        state TEXT DEFAULT 'pending',
        channel TEXT,
        buyin INTEGER DEFAULT 0,
        starting_chips INTEGER DEFAULT 1000,
        current_level INTEGER DEFAULT 1,
        level_seconds INTEGER DEFAULT 600,
        rounds INTEGER DEFAULT 1,
        advance_config TEXT DEFAULT '[]',
        decks INTEGER DEFAULT 6,
        blind_config TEXT DEFAULT '[]',
        next_level_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tournament_players (
        tournament_id TEXT,
        login TEXT,
        seat INTEGER,
        chips INTEGER,
        eliminated INTEGER DEFAULT 0,
        rank INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tournament_id, login)
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tournament_bracket (
        tournament_id TEXT,
        round INTEGER,
        table_num INTEGER,
        seat_login TEXT,
        PRIMARY KEY (tournament_id, round, table_num, seat_login)
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tournament_round_results (
        tournament_id TEXT,
        round INTEGER,
        login TEXT,
        chips_end INTEGER,
        rank INTEGER,
        advanced INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tournament_id, round, login)
      )
    `);
  }

  // ============ BALANCES ============

  /**
   * Get user balance
   * @param {string} username
   * @returns {number}
   */
  getBalance(username) {
    const stmt = this.db.prepare('SELECT chips FROM balances WHERE username = ?');
    const result = stmt.get(username);
    return result ? result.chips : config.GAME_STARTING_CHIPS;
  }

  /**
   * Ensure a balance row exists, seeded with starting chips
   * @param {string} username
   * @returns {number} current balance
   */
  ensureBalance(username) {
    this.db
      .prepare('INSERT OR IGNORE INTO balances (username, chips) VALUES (?, ?)')
      .run(username, config.GAME_STARTING_CHIPS);
    return this.getBalance(username);
  }

  /**
   * Set user balance
   * @param {string} username
   * @param {number} chips
   */
  setBalance(username, chips) {
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO balances (username, chips) VALUES (?, ?)'
    );
    stmt.run(username, Math.max(0, chips));
  }

  /**
   * Add chips to balance
   * @param {string} username
   * @param {number} chips
   * @returns {number} - New balance
   */
  addChips(username, chips) {
    const current = this.getBalance(username);
    const newBalance = current + chips;
    this.setBalance(username, newBalance);
    return newBalance;
  }

  // ============ STATS ============

  /**
   * Get user stats
   * @param {string} username
   * @returns {Object}
   */
  getStats(username) {
    const stmt = this.db.prepare(
      'SELECT * FROM stats WHERE username = ?'
    );
    const result = stmt.get(username);
    return result || {
      username,
      roundsPlayed: 0,
      roundsWon: 0,
      totalWon: 0,
      biggestWin: 0,
      bestHand: 'None',
      handsPlayed: 0,
      playSeconds: 0,
    };
  }

  /**
   * Ensure a stats row exists for a user
   * @param {string} username
   * @returns {Object} stats row
   */
  ensureStats(username) {
    this.db.prepare('INSERT OR IGNORE INTO stats (username) VALUES (?)').run(username);
    return this.getStats(username);
  }

  /**
   * Update user stats
   * @param {string} username
   * @param {Object} updates - Fields to update
   */
  updateStats(username, updates) {
    const current = this.getStats(username);
    const merged = { ...current, ...updates, username };

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO stats (
        username, roundsPlayed, roundsWon, totalWon, biggestWin, bestHand, handsPlayed, playSeconds, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      username,
      merged.roundsPlayed,
      merged.roundsWon,
      merged.totalWon,
      merged.biggestWin,
      merged.bestHand,
      merged.handsPlayed || 0,
      merged.playSeconds || 0
    );
  }

  /**
   * Get leaderboard
   * @param {number} limit - Top N users
   * @returns {Array}
   */
  getLeaderboard(limit = 10) {
    const stmt = this.db.prepare(
      'SELECT username, totalWon, roundsWon, bestHand FROM stats ORDER BY totalWon DESC LIMIT ?'
    );
    return stmt.all(limit);
  }

  // ============ TOKENS ============

  /**
   * Create ephemeral token
   * @param {string} purpose - Token purpose
   * @param {string} origin - Token origin (IP)
   * @param {number} expiresInSeconds - TTL
   * @returns {string}
   */
  createToken(purpose, origin, expiresInSeconds = 300) {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const stmt = this.db.prepare(
      'INSERT INTO tokens (token, purpose, origin, expires_at) VALUES (?, ?, ?, ?)'
    );
    stmt.run(token, purpose, origin, expiresAt);

    return token;
  }

  /**
   * Check and consume token
   * @param {string} token
   * @returns {boolean}
   */
  consumeToken(token) {
    const stmt = this.db.prepare(
      'SELECT * FROM tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP AND consumed = 0'
    );
    const result = stmt.get(token);

    if (result) {
      const updateStmt = this.db.prepare('UPDATE tokens SET consumed = 1 WHERE token = ?');
      updateStmt.run(token);
      return true;
    }
    return false;
  }

  // ============ AUDIT ============

  /**
   * Log unblock action
   * @param {string} actor - Admin username
   * @param {string} targetUsername - Unblocked username
   * @param {string} targetIP - Unblocked IP
   * @param {string} note - Optional note
   */
  logUnblock(actor, targetUsername, targetIP, note = '') {
    const stmt = this.db.prepare(
      'INSERT INTO unblock_audit (actor, target_username, target_ip, note) VALUES (?, ?, ?, ?)'
    );
    stmt.run(actor, targetUsername, targetIP, note);
  }

  /**
   * Get audit log
   * @param {number} limit
   * @returns {Array}
   */
  getAuditLog(limit = 100) {
    const stmt = this.db.prepare(
      'SELECT * FROM unblock_audit ORDER BY created_at DESC LIMIT ?'
    );
    return stmt.all(limit);
  }

  /**
   * Delete audit entry
   * @param {number} id
   */
  deleteAuditById(id) {
    const stmt = this.db.prepare('DELETE FROM unblock_audit WHERE id = ?');
    stmt.run(id);
  }

  // ============ PROFILES ============

  /**
   * Get user profile
   * @param {string} login
   * @returns {Object|null}
   */
  getProfile(login) {
    const stmt = this.db.prepare(
      'SELECT * FROM profiles WHERE login = ?'
    );
    return stmt.get(login);
  }

  /**
   * Get profile by Twitch ID
   * @param {string} twitchId
   * @returns {Object|null}
   */
  getProfileByTwitchId(twitchId) {
    const stmt = this.db.prepare(
      'SELECT * FROM profiles WHERE twitch_id = ?'
    );
    return stmt.get(twitchId);
  }

  /**
   * Create or update profile
   * @param {Object} profileData - { twitch_id, login, display_name, settings }
   * @returns {Object}
   */
  upsertProfile(profileData) {
    const { twitch_id, login, display_name, settings, role } = profileData;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO profiles (twitch_id, login, display_name, settings, role, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      twitch_id,
      login,
      display_name,
      JSON.stringify(settings || {}),
      role || 'player'
    );

    return this.getProfile(login);
  }

  /**
   * Get a valid token record without consuming it
   * @param {string} token
   * @returns {Object|null}
   */
  getToken(token) {
    const stmt = this.db.prepare(
      'SELECT * FROM tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP AND consumed = 0'
    );
    return stmt.get(token);
  }

  /**
   * Update stats for a single round
   * @param {string} username
   * @param {Object} options
   * @param {boolean} options.won
   * @param {number} options.winnings
   * @param {string} options.bestHand
   * @param {number} options.hands
   * @param {number} options.seconds
   */
  updateRoundStats(username, { won = false, winnings = 0, bestHand = '', hands = 1, seconds = 0 }) {
    const current = this.getStats(username);

    const updated = {
      username,
      roundsPlayed: (current.roundsPlayed || 0) + 1,
      roundsWon: (current.roundsWon || 0) + (won ? 1 : 0),
      totalWon: (current.totalWon || 0) + (winnings || 0),
      biggestWin: Math.max(current.biggestWin || 0, winnings || 0),
      bestHand: bestHand || current.bestHand,
      handsPlayed: (current.handsPlayed || 0) + (hands || 0),
      playSeconds: (current.playSeconds || 0) + (seconds || 0),
    };

    this.updateStats(username, updated);
  }

  /**
   * Get all profiles
   * @param {number} limit
   * @returns {Array}
   */
  getAllProfiles(limit = 100) {
    const stmt = this.db.prepare(
      'SELECT id, login, display_name, created_at, updated_at FROM profiles LIMIT ?'
    );
    return stmt.all(limit);
  }

  /**
   * Get bot joined channels
   * @returns {string[]}
   */
  getBotChannels() {
    const stmt = this.db.prepare('SELECT channel FROM bot_channels');
    return stmt.all().map(row => row.channel);
  }

  /**
   * Add a channel to bot join list
   * @param {string} channel
   */
  addBotChannel(channel) {
    if (!channel) return;
    const normalized = channel.trim().toLowerCase().replace(/^#/, '');
    if (!normalized) return;
    this.db.prepare('INSERT OR IGNORE INTO bot_channels (channel) VALUES (?)').run(normalized);
  }

  /**
   * Store a Twitch sub token (per channel)
   * @param {string} channel
   * @param {{access_token:string, refresh_token?:string, expires_at?:number}}
   */
  setTwitchSubToken(channel, tokenObj = {}) {
    if (!channel || !tokenObj.access_token) return;
    const chan = channel.toLowerCase();
    const expires = tokenObj.expires_at
      ? new Date(tokenObj.expires_at * 1000).toISOString()
      : null;
    this.db.prepare(`
      INSERT OR REPLACE INTO twitch_sub_tokens (channel, access_token, refresh_token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(chan, tokenObj.access_token, tokenObj.refresh_token || null, expires);
  }

  /**
   * Get a Twitch sub token for a channel
   * @param {string} channel
   */
  getTwitchSubToken(channel) {
    if (!channel) return null;
    const chan = channel.toLowerCase();
    return this.db.prepare('SELECT * FROM twitch_sub_tokens WHERE channel = ?').get(chan);
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  // ============ COSMETICS ============

  seedCosmetics(catalog = []) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO cosmetics (id, type, name, price_cents, rarity, preview, tint, color, texture_url, image_url, unlock_type, unlock_value, unlock_note)
      VALUES (@id, @type, @name, @price_cents, @rarity, @preview, @tint, @color, @texture_url, @image_url, @unlock_type, @unlock_value, @unlock_note)
    `);
    const tx = this.db.transaction((items) => {
      items.forEach(item => {
        stmt.run({
          id: item.id,
          type: item.type,
          name: item.name,
          price_cents: item.price_cents || item.price || 0,
          rarity: item.rarity || 'common',
          preview: item.preview || '',
          tint: item.tint || null,
          color: item.color || null,
          texture_url: item.texture_url || null,
          image_url: item.image_url || null,
          unlock_type: item.unlock_type || null,
          unlock_value: item.unlock_value || null,
          unlock_note: item.unlock_note || null,
        });
      });
    });
    tx(catalog);
  }

  getCatalog() {
    return this.db.prepare('SELECT * FROM cosmetics ORDER BY type, rarity, name').all();
  }

  getCosmeticById(id) {
    return this.db.prepare('SELECT * FROM cosmetics WHERE id = ?').get(id);
  }

  grantCosmetic(login, itemId) {
    const item = this.getCosmeticById(itemId);
    if (!item) return null;
    this.db.prepare(`
      INSERT OR IGNORE INTO user_cosmetics (login, item_id, slot, equipped)
      VALUES (?, ?, ?, 0)
    `).run(login, itemId, item.type);
    return this.getUserInventory(login);
  }

  equipCosmetic(login, itemId) {
    const item = this.getCosmeticById(itemId);
    if (!item) return null;
    const owned = this.db.prepare('SELECT 1 FROM user_cosmetics WHERE login = ? AND item_id = ?').get(login, itemId);
    if (!owned) return null;
    const slot = item.type;
    const tx = this.db.transaction(() => {
      this.db.prepare('UPDATE user_cosmetics SET equipped = 0 WHERE login = ? AND slot = ?').run(login, slot);
      this.db.prepare('UPDATE user_cosmetics SET equipped = 1 WHERE login = ? AND item_id = ?').run(login, itemId);
    });
    tx();
    return this.getUserInventory(login);
  }

  ensureDefaultCosmetics(login, defaults = []) {
    defaults.forEach(itemId => {
      const item = this.getCosmeticById(itemId);
      if (!item) return;
      this.db.prepare(`
        INSERT OR IGNORE INTO user_cosmetics (login, item_id, slot, equipped)
        VALUES (?, ?, ?, 0)
      `).run(login, itemId, item.type);
    });
  }

  getUserInventory(login) {
    const rows = this.db.prepare('SELECT * FROM user_cosmetics WHERE login = ?').all(login);
    const owned = new Set(rows.map(r => r.item_id));
    const equipped = {};
    rows.forEach(r => {
      if (r.equipped) {
        equipped[r.slot] = r.item_id;
      }
    });
    return { owned, equipped };
  }

  recordPurchase({ login, itemId, provider = 'dev', amount_cents = 0, coin_amount = 0, status = 'completed', txn_id = null, note = '', partner_id = null }) {
    this.db.prepare(`
      INSERT INTO purchases (login, item_id, provider, amount_cents, coin_amount, status, txn_id, note, partner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(login, itemId, provider, amount_cents, coin_amount, status, txn_id, note, partner_id);
  }

  // ============ CURRENCY ============

  getCoins(login) {
    const row = this.db.prepare('SELECT coins FROM currency_balance WHERE login = ?').get(login);
    return row ? row.coins : 0;
  }

  addCoins(login, amount = 0) {
    const amt = Math.max(0, Math.floor(amount || 0));
    this.db.prepare(`
      INSERT INTO currency_balance (login, coins)
      VALUES (?, ?)
      ON CONFLICT(login) DO UPDATE SET coins = coins + excluded.coins, updated_at = CURRENT_TIMESTAMP
    `).run(login, amt);
    return this.getCoins(login);
  }

  spendCoins(login, amount = 0) {
    const amt = Math.max(0, Math.floor(amount || 0));
    if (amt <= 0) return { ok: true, remaining: this.getCoins(login) };
    const current = this.getCoins(login);
    if (current < amt) return { ok: false, remaining: current };
    this.db.prepare('UPDATE currency_balance SET coins = coins - ?, updated_at = CURRENT_TIMESTAMP WHERE login = ?').run(amt, login);
    return { ok: true, remaining: this.getCoins(login) };
  }

  recordCurrencyPurchase({ login, packId = null, coins = 0, amount_cents = 0, provider = 'paypal', status = 'completed', txn_id = null, note = '' }) {
    this.db.prepare(`
      INSERT INTO purchases (login, item_id, provider, amount_cents, coin_amount, status, txn_id, note, partner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `).run(login, packId, provider, amount_cents, coins, status, txn_id, note);
  }

  // ============ PARTNERS ============

  // ============ PARTNERS ============

  upsertPartner({ id, display_name, payout_pct = 0.1 }) {
    if (!id) return null;
    const pid = id.toLowerCase();
    this.db.prepare(`
      INSERT INTO partners (id, display_name, payout_pct)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, payout_pct = excluded.payout_pct
    `).run(pid, display_name || pid, payout_pct);
    return this.getPartner(pid);
  }

  getPartner(id) {
    if (!id) return null;
    return this.db.prepare('SELECT * FROM partners WHERE id = ?').get(id.toLowerCase());
  }

  listPartners() {
    return this.db.prepare('SELECT * FROM partners ORDER BY display_name').all();
  }

  recordPartnerView(partnerId, login = null) {
    if (!partnerId) return;
    this.db.prepare(`
      INSERT INTO partner_views (partner_id, login) VALUES (?, ?)
    `).run(partnerId.toLowerCase(), login || null);
  }

  getPartnerStats(partnerId) {
    const id = partnerId?.toLowerCase?.();
    if (!id) return null;
    const sales = this.db.prepare(`
      SELECT
        COUNT(*) AS orders,
        COALESCE(SUM(amount_cents),0) AS amount_cents,
        COALESCE(SUM(coin_amount),0) AS coin_amount
      FROM purchases
      WHERE partner_id = ? AND status = 'completed'
    `).get(id);
    const views = this.db.prepare(`SELECT COUNT(*) AS views FROM partner_views WHERE partner_id = ?`).get(id);
    return { partner_id: id, orders: sales?.orders || 0, amount_cents: sales?.amount_cents || 0, coin_amount: sales?.coin_amount || 0, views: views?.views || 0 };
  }

  listPartnerStats() {
    const partners = this.listPartners();
    return partners.map(p => ({ ...p, stats: this.getPartnerStats(p.id) || {} }));
  }

  // ============ TOURNAMENTS ============

  upsertTournament(t) {
    const stmt = this.db.prepare(`
      INSERT INTO tournaments (id, name, game, state, channel, buyin, starting_chips, current_level, level_seconds, next_level_at, rounds, advance_config, decks, blind_config)
      VALUES (@id, @name, @game, @state, @channel, @buyin, @starting_chips, @current_level, @level_seconds, @next_level_at, @rounds, @advance_config, @decks, @blind_config)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        game=excluded.game,
        state=excluded.state,
        channel=excluded.channel,
        buyin=excluded.buyin,
        starting_chips=excluded.starting_chips,
        current_level=excluded.current_level,
        level_seconds=excluded.level_seconds,
        rounds=excluded.rounds,
        advance_config=excluded.advance_config,
        decks=excluded.decks,
        blind_config=excluded.blind_config,
        next_level_at=excluded.next_level_at,
        updated_at=CURRENT_TIMESTAMP
    `);
    stmt.run({
      id: t.id,
      name: t.name || t.id,
      game: t.game || 'poker',
      state: t.state || 'pending',
      channel: t.channel || null,
      buyin: t.buyin || 0,
      starting_chips: t.starting_chips || 1000,
      current_level: t.current_level || 1,
      level_seconds: t.level_seconds || 600,
      next_level_at: t.next_level_at || null,
      rounds: t.rounds || 1,
      advance_config: Array.isArray(t.advance_config) ? JSON.stringify(t.advance_config) : (t.advance_config || '[]'),
      decks: t.decks || 6,
      blind_config: Array.isArray(t.blind_config) ? JSON.stringify(t.blind_config) : (t.blind_config || '[]'),
    });
    return this.getTournament(t.id);
  }

  getTournament(id) {
    return this.db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
  }

  listTournaments() {
    return this.db.prepare('SELECT * FROM tournaments ORDER BY created_at DESC').all();
  }

  addTournamentPlayer(tournamentId, login, seat = null, chips = null) {
    const start = chips ?? (this.getTournament(tournamentId)?.starting_chips || 1000);
    this.db.prepare(`
      INSERT INTO tournament_players (tournament_id, login, seat, chips)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(tournament_id, login) DO UPDATE SET
        seat = excluded.seat,
        updated_at = CURRENT_TIMESTAMP
    `).run(tournamentId, login, seat, start);
    return this.getTournamentPlayer(tournamentId, login);
  }

  getTournamentPlayer(tournamentId, login) {
    return this.db.prepare('SELECT * FROM tournament_players WHERE tournament_id = ? AND login = ?').get(tournamentId, login);
  }

  updateTournamentSeat(tournamentId, login, seat = null) {
    this.db.prepare(`
      UPDATE tournament_players
      SET seat = ?, updated_at = CURRENT_TIMESTAMP
      WHERE tournament_id = ? AND login = ?
    `).run(seat, tournamentId, login);
    return this.getTournamentPlayer(tournamentId, login);
  }

  listTournamentPlayers(tournamentId) {
    return this.db.prepare('SELECT * FROM tournament_players WHERE tournament_id = ? ORDER BY seat ASC, login ASC').all(tournamentId);
  }

  eliminateTournamentPlayer(tournamentId, login, rank = null) {
    this.db.prepare(`
      UPDATE tournament_players
      SET eliminated = 1, rank = COALESCE(?, rank), updated_at = CURRENT_TIMESTAMP
      WHERE tournament_id = ? AND login = ?
    `).run(rank, tournamentId, login);
  }

  updateTournamentPlayerChips(tournamentId, login, chips) {
    this.db.prepare(`
      UPDATE tournament_players
      SET chips = ?, updated_at = CURRENT_TIMESTAMP
      WHERE tournament_id = ? AND login = ?
    `).run(chips, tournamentId, login);
  }

  upsertBracketSeat(tournamentId, round, table, login) {
    this.db.prepare(`
      INSERT INTO tournament_bracket (tournament_id, round, table_num, seat_login)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(tournament_id, round, table_num, seat_login) DO NOTHING
    `).run(tournamentId, round, table, login);
  }

  listBracket(tournamentId, round = null) {
    if (round === null || typeof round === 'undefined') {
      return this.db.prepare('SELECT * FROM tournament_bracket WHERE tournament_id = ? ORDER BY round, table_num, seat_login').all(tournamentId);
    }
    return this.db.prepare('SELECT * FROM tournament_bracket WHERE tournament_id = ? AND round = ? ORDER BY table_num, seat_login').all(tournamentId, round);
  }

  clearBracket(tournamentId, round = null) {
    if (round === null || typeof round === 'undefined') {
      this.db.prepare('DELETE FROM tournament_bracket WHERE tournament_id = ?').run(tournamentId);
    } else {
      this.db.prepare('DELETE FROM tournament_bracket WHERE tournament_id = ? AND round = ?').run(tournamentId, round);
    }
  }

  recordRoundResult(tournamentId, round, login, chips_end, rank = null, advanced = 0) {
    this.db.prepare(`
      INSERT INTO tournament_round_results (tournament_id, round, login, chips_end, rank, advanced)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(tournament_id, round, login) DO UPDATE SET
        chips_end = excluded.chips_end,
        rank = excluded.rank,
        advanced = excluded.advanced,
        created_at = CURRENT_TIMESTAMP
    `).run(tournamentId, round, login, chips_end, rank, advanced ? 1 : 0);
  }

  listRoundResults(tournamentId, round = null) {
    if (round === null || typeof round === 'undefined') {
      return this.db.prepare('SELECT * FROM tournament_round_results WHERE tournament_id = ? ORDER BY round, rank, chips_end DESC').all(tournamentId);
    }
    return this.db.prepare('SELECT * FROM tournament_round_results WHERE tournament_id = ? AND round = ? ORDER BY rank, chips_end DESC').all(tournamentId, round);
  }

  setBlindConfig(tournamentId, levels = []) {
    const t = this.getTournament(tournamentId);
    if (!t) return null;
    const cfg = Array.isArray(levels) ? JSON.stringify(levels) : '[]';
    this.db.prepare('UPDATE tournaments SET blind_config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cfg, tournamentId);
    return this.getTournament(tournamentId);
  }

  getBlindConfig(tournamentId) {
    const t = this.getTournament(tournamentId);
    if (!t) return [];
    try {
      return JSON.parse(t.blind_config || '[]');
    } catch (e) {
      return [];
    }
  }

  // Partner progression tracking
  addPartnerUsage(channel, players = []) {
    if (!channel) return;
    const day = new Date().toISOString().slice(0, 10);
    const row = this.db.prepare('SELECT * FROM partner_usage_daily WHERE channel = ? AND day = ?').get(channel, day);
    const existing = row ? JSON.parse(row.unique_players || '[]') : [];
    const merged = Array.from(new Set([...(existing || []), ...players.filter(Boolean)]));
    if (row) {
      this.db.prepare(`
        UPDATE partner_usage_daily
        SET rounds = rounds + 1,
            unique_players = ?
        WHERE channel = ? AND day = ?
      `).run(JSON.stringify(merged), channel, day);
    } else {
      this.db.prepare(`
        INSERT INTO partner_usage_daily (channel, day, rounds, unique_players)
        VALUES (?, ?, 1, ?)
      `).run(channel, day, JSON.stringify(merged));
    }
  }

  getPartnerUsage(channel, days = 30) {
    if (!channel) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return this.db.prepare(`
      SELECT * FROM partner_usage_daily
      WHERE channel = ? AND day >= ?
      ORDER BY day DESC
    `).all(channel, cutoffStr);
  }

  getPartnerProgress(channel, days = 30) {
    const rows = this.getPartnerUsage(channel, days) || [];
    const streams = rows.length;
    let rounds = 0;
    let totalPlayers = 0;
    const uniquePlayers = new Set();
    rows.forEach(r => {
      const players = (() => {
        try { return JSON.parse(r.unique_players || '[]'); } catch { return []; }
      })();
      rounds += Number(r.rounds) || 0;
      totalPlayers += players.length;
      players.forEach(p => uniquePlayers.add(p));
    });
    const avgPlayersPerStream = streams ? totalPlayers / streams : 0;
    const estimatedHours = Math.max(rounds * 2 / 60, streams * 2); // rough: 2 min/round, floor 2h/stream requirement baseline

    const goals = {
      streams4: streams >= 4,
      hours2PerStream: estimatedHours >= streams * 2,
      avgPlayers10: avgPlayersPerStream >= 10,
      uniquePlayers5: uniquePlayers.size >= 5,
      rounds20: rounds >= 20,
    };

    return {
      channel,
      windowDays: days,
      streams,
      rounds,
      uniquePlayers: uniquePlayers.size,
      avgPlayersPerStream,
      estimatedHours,
      goals,
    };
  }

  computeEligibility(channel) {
    const win30 = this.getPartnerProgress(channel, 30);
    const win60 = this.getPartnerProgress(channel, 60);
    const abuseScore = 0; // placeholder until richer signals exist

    const hardPartner = {
      sessions_count: { value: win30.streams, required: 4, pass: win30.streams >= 4 },
      valid_minutes: { value: Math.round(win30.estimatedHours * 60), required: 240, pass: win30.estimatedHours * 60 >= 240 },
      unique_active_players: { value: win30.uniquePlayers, required: 25, pass: win30.uniquePlayers >= 25 },
      abuse_score: { value: abuseScore, requiredMax: 25, pass: abuseScore <= 25 },
    };

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    const partnerScore =
      40 * clamp(win30.uniquePlayers / 60, 0, 1) +
      25 * clamp(win30.streams / 8, 0, 1) +
      25 * clamp(win30.rounds / 120, 0, 1) +
      10 * clamp((win30.uniquePlayers / Math.max(1, win30.streams)) / 0.35, 0, 1);

    let partnerStatus = 'not_eligible';
    if (partnerScore >= 60 && Object.values(hardPartner).every(g => g.pass)) {
      partnerStatus = 'auto_approve';
    } else if (partnerScore >= 45 && Object.values(hardPartner).every(g => g.pass)) {
      partnerStatus = 'review';
    }

    const hardPremier = {
      sessions_count: { value: win60.streams, required: 16, pass: win60.streams >= 16 },
      valid_minutes: { value: Math.round(win60.estimatedHours * 60), required: 900, pass: win60.estimatedHours * 60 >= 900 },
      unique_active_players: { value: win60.uniquePlayers, required: 120, pass: win60.uniquePlayers >= 120 },
      returning_players_ratio: { value: 0, required: 0.3, pass: false }, // not tracked yet
      abuse_score: { value: abuseScore, requiredMax: 15, pass: abuseScore <= 15 },
    };

    const premierScore =
      35 * clamp(win60.uniquePlayers / 200, 0, 1) +
      25 * clamp(win60.streams / 16, 0, 1) +
      15 * clamp((win60.uniquePlayers - win30.uniquePlayers) / 60, 0, 1) +
      15 * clamp(hardPremier.returning_players_ratio.value / 0.35, 0, 1) +
      10 * 0;

    let premierStatus = 'not_eligible';
    if (premierScore >= 75 && Object.values(hardPremier).every(g => g.pass)) {
      premierStatus = 'invite_candidate';
    } else if (premierScore >= 65 && Object.values(hardPremier).every(g => g.pass)) {
      premierStatus = 'watchlist';
    }

    const payload = {
      channel,
      affiliate: { linked: true, overlayLaunched: true },
      partner: { hardGates: hardPartner, score: partnerScore, status: partnerStatus },
      premier: { hardGates: hardPremier, score: premierScore, status: premierStatus },
      windows: { win30, win60 },
    };
    this.db.prepare(`
      INSERT INTO partner_eligibility (channel, window_days, data, computed_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(channel, window_days) DO UPDATE SET data = excluded.data, computed_at = excluded.computed_at
    `).run(channel, 30, JSON.stringify(payload));
    return payload;
  }

  listEligibility() {
    const profiles = this.listProfiles();
    return profiles.map(p => this.computeEligibility(p.login));
  }

  // Overlay loadout (cosmetics/effects) per channel
  saveOverlayLoadout(channel, payload = {}) {
    if (!channel) return null;
    const safe = JSON.stringify(payload || {});
    this.db.prepare(`
      INSERT INTO overlay_settings (channel, data, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(channel) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `).run(channel, safe);
    return this.getOverlayLoadout(channel);
  }

  getOverlayLoadout(channel) {
    if (!channel) return null;
    const row = this.db.prepare(`SELECT data FROM overlay_settings WHERE channel = ?`).get(channel);
    if (!row || !row.data) return null;
    try {
      return JSON.parse(row.data);
    } catch {
      return null;
    }
  }
}

// Export singleton instance
module.exports = new DBHelper();
