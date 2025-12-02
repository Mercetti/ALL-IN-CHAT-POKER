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
    };
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
        username, roundsPlayed, roundsWon, totalWon, biggestWin, bestHand, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      username,
      merged.roundsPlayed,
      merged.roundsWon,
      merged.totalWon,
      merged.biggestWin,
      merged.bestHand
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
   */
  updateRoundStats(username, { won = false, winnings = 0, bestHand = '' }) {
    const current = this.getStats(username);

    const updated = {
      username,
      roundsPlayed: (current.roundsPlayed || 0) + 1,
      roundsWon: (current.roundsWon || 0) + (won ? 1 : 0),
      totalWon: (current.totalWon || 0) + (winnings || 0),
      biggestWin: Math.max(current.biggestWin || 0, winnings || 0),
      bestHand: bestHand || current.bestHand,
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
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Export singleton instance
module.exports = new DBHelper();
