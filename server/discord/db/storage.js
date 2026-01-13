/**
 * Discord Database Storage
 * Minimal SQLite storage for Discord user metadata
 * No chat logs or message content stored
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DiscordStorage {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.init();
  }

  init() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.createTables();
      console.log('✅ Discord database initialized');
    } catch (error) {
      console.error('❌ Discord database initialization failed:', error.message);
      throw error;
    }
  }

  createTables() {
    // User metadata table - minimal data only
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS discord_users (
        discord_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        roles_played INTEGER DEFAULT 0,
        roles_vip INTEGER DEFAULT 0,
        roles_high_roller INTEGER DEFAULT 0,
        last_seen INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);

    // OAuth tokens table (encrypted storage)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        discord_id TEXT PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_discord_users_last_seen ON discord_users(last_seen);
      CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
    `);
  }

  /**
   * Create or update a Discord user
   */
  upsertUser(discordId, username) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO discord_users (discord_id, username, last_seen)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(discordId, username, Math.floor(Date.now() / 1000));
    return result;
  }

  /**
   * Get user by Discord ID
   */
  getUser(discordId) {
    const stmt = this.db.prepare(`
      SELECT * FROM discord_users WHERE discord_id = ?
    `);

    return stmt.get(discordId);
  }

  /**
   * Update user role metadata
   */
  updateUserRoles(discordId, roles = {}) {
    const {
      played = false,
      vip = false,
      high_roller = false
    } = roles;

    const stmt = this.db.prepare(`
      UPDATE discord_users 
      SET roles_played = ?, roles_vip = ?, roles_high_roller = ?, last_seen = ?
      WHERE discord_id = ?
    `);

    const result = stmt.run(
      played ? 1 : 0,
      vip ? 1 : 0,
      high_roller ? 1 : 0,
      Math.floor(Date.now() / 1000),
      discordId
    );

    return result;
  }

  /**
   * Store OAuth tokens
   */
  storeOAuthTokens(discordId, accessToken, refreshToken, expiresIn) {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO oauth_tokens (discord_id, access_token, refresh_token, expires_at)
      VALUES (?, ?, ?, ?)
    `);

    return stmt.run(discordId, accessToken, refreshToken, expiresAt);
  }

  /**
   * Get OAuth tokens for user
   */
  getOAuthTokens(discordId) {
    const stmt = this.db.prepare(`
      SELECT * FROM oauth_tokens WHERE discord_id = ? AND expires_at > ?
    `);

    return stmt.get(discordId, Math.floor(Date.now() / 1000));
  }

  /**
   * Delete user data (GDPR compliance)
   */
  deleteUser(discordId) {
    const deleteUserStmt = this.db.prepare('DELETE FROM discord_users WHERE discord_id = ?');
    const deleteTokensStmt = this.db.prepare('DELETE FROM oauth_tokens WHERE discord_id = ?');

    deleteUserStmt.run(discordId);
    deleteTokensStmt.run(discordId);
  }

  /**
   * Get user metadata for Discord Linked Roles
   */
  getUserMetadata(discordId) {
    const user = this.getUser(discordId);
    
    if (!user) {
      return {
        platform_name: "All-In Chat Poker",
        metadata: {
          played: false,
          vip: false,
          high_roller: false
        }
      };
    }

    return {
      platform_name: "All-In Chat Poker",
      metadata: {
        played: Boolean(user.roles_played),
        vip: Boolean(user.roles_vip),
        high_roller: Boolean(user.roles_high_roller)
      }
    };
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens() {
    const stmt = this.db.prepare('DELETE FROM oauth_tokens WHERE expires_at <= ?');
    const result = stmt.run(Math.floor(Date.now() / 1000));
    
    if (result.changes > 0) {
      console.log(`🧹 Cleaned up ${result.changes} expired OAuth tokens`);
    }
    
    return result;
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM discord_users').get();
    const tokenCount = this.db.prepare('SELECT COUNT(*) as count FROM oauth_tokens').get();
    
    return {
      totalUsers: userCount.count,
      activeTokens: tokenCount.count
    };
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = DiscordStorage;
