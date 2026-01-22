/**
 * Pooled Database Helper
 * Database helper using connection pooling for better performance
 */

const { poolManager } = require('./utils/pool-manager');
const path = require('path');
const Logger = require('./logger');

const logger = new Logger('db-pooled');

class PooledDBHelper {
  constructor() {
    this.defaultPool = null;
    this.initialized = false;
  }

  /**
   * Initialize database connection pools
   */
  async init() {
    if (this.initialized) return;

    try {
      // Create default pool for general operations
      const dbPath = path.resolve(process.env.DB_FILE || './data/poker.db');
      this.defaultPool = poolManager.createPool('default', dbPath, {
        min: 3,
        max: 15,
        idleTimeoutMillis: 60000, // 1 minute
        acquireTimeoutMillis: 30000, // 30 seconds
        walMode: true,
        foreignKeys: true,
        synchronous: 'NORMAL',
        cacheSize: 4000,
        busyTimeout: 60000
      });

      // Create specialized pools
      this.createSpecializedPools();

      this.initialized = true;
      logger.info('Pooled database initialized', { dbPath });
      
    } catch (err) {
      logger.error('Failed to initialize pooled database', { error: err.message });
      throw err;
    }
  }

  /**
   * Create specialized connection pools for different use cases
   */
  createSpecializedPools() {
    // Read-only pool for analytics and reporting
    const dbPath = path.resolve(process.env.DB_FILE || './data/poker.db');
    poolManager.createPool('readonly', dbPath, {
      min: 2,
      max: 8,
      idleTimeoutMillis: 120000, // 2 minutes
      synchronous: 'OFF', // Faster for read-only
      cacheSize: 8000 // Larger cache for read operations
    });

    // Transaction pool for high-volume writes
    poolManager.createPool('transaction', dbPath, {
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000, // 30 seconds
      synchronous: 'FULL', // Safer for transactions
      busyTimeout: 120000 // Longer timeout for complex transactions
    });

    // Background task pool
    poolManager.createPool('background', dbPath, {
      min: 1,
      max: 5,
      idleTimeoutMillis: 300000, // 5 minutes
      createTimeoutMillis: 60000 // Longer creation timeout for background tasks
    });
  }

  /**
   * Initialize database schema
   */
  async initSchema() {
    await this.transaction('default', async (connection) => {
      // Balances table
      connection.exec(`
        CREATE TABLE IF NOT EXISTS balances (
          username TEXT PRIMARY KEY,
          chips INTEGER DEFAULT 1000,
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // Game history table
      connection.exec(`
        CREATE TABLE IF NOT EXISTS game_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          game_id TEXT UNIQUE,
          players TEXT,
          winner TEXT,
          pot_amount INTEGER,
          timestamp INTEGER DEFAULT (strftime('%s', 'now')),
          game_data TEXT
        )
      `);

      // User sessions table
      connection.exec(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          session_id TEXT PRIMARY KEY,
          username TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          expires_at INTEGER,
          last_activity INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // Tournament table
      connection.exec(`
        CREATE TABLE IF NOT EXISTS tournaments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          max_players INTEGER,
          buy_in INTEGER,
          start_time INTEGER,
          status TEXT DEFAULT 'upcoming',
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // Create indexes for better performance
      connection.exec('CREATE INDEX IF NOT EXISTS idx_balances_username ON balances(username)');
      connection.exec('CREATE INDEX IF NOT EXISTS idx_game_history_timestamp ON game_history(timestamp)');
      connection.exec('CREATE INDEX IF NOT EXISTS idx_user_sessions_username ON user_sessions(username)');
      connection.exec('CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)');
      connection.exec('CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status)');
      connection.exec('CREATE INDEX IF NOT EXISTS idx_tournaments_start_time ON tournaments(start_time)');

      logger.info('Database schema initialized');
  }

  /**
   * Execute query with automatic connection management
   */
  async query(sql, params = [], poolName = 'default') {
    if (!this.initialized) {
      await this.init();
    }

    return await poolManager.query(poolName, sql, params);
  }

  /**
   * Execute single row query
   */
  async get(sql, params = [], poolName = 'default') {
    if (!this.initialized) {
      await this.init();
    }

    return await poolManager.get(poolName, sql, params);
  }

  /**
   * Execute insert/update/delete query
   */
  async run(sql, params = [], poolName = 'default') {
    if (!this.initialized) {
      await this.init();
    }

    return await poolManager.run(poolName, sql, params);
  }

  /**
   * Execute transaction
   */
  async transaction(callback, poolName = 'default') {
    if (!this.initialized) {
      await this.init();
    }

    return await poolManager.transaction(poolName, callback);
  }

  /**
   * Execute batch operations
   */
  async batch(queries, poolName = 'default') {
    if (!this.initialized) {
      await this.init();
    }

    return await poolManager.batch(poolName, queries);
  }

  /**
   * User balance operations
   */
  async getUserBalance(username) {
    const result = await this.get(
      'SELECT chips FROM balances WHERE username = ?',
      [username],
      'readonly'
    );
    return result ? result.chips : 0;
  }

  async updateUserBalance(username, chips) {
    await this.run(
      'UPDATE balances SET chips = ?, updated_at = strftime("%s", "now") WHERE username = ?',
      [chips, username],
      'transaction'
    );
  }

  async adjustUserBalance(username, amount) {
    await this.run(
      'UPDATE balances SET chips = chips + ?, updated_at = strftime("%s", "now") WHERE username = ?',
      [amount, username],
      'transaction'
    );
  }

  /**
   * Game history operations
   */
  async saveGameHistory(gameData) {
    await this.run(
      'INSERT INTO game_history (game_id, players, winner, pot_amount, game_data) VALUES (?, ?, ?, ?, ?)',
      [
        gameData.gameId,
        JSON.stringify(gameData.players),
        gameData.winner,
        gameData.potAmount,
        JSON.stringify(gameData.gameData)
      ],
      'transaction'
    );
  }

  async getGameHistory(limit = 50, offset = 0) {
    return await this.query(
      'SELECT * FROM game_history ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset],
      'readonly'
    );
  }

  /**
   * User session operations
   */
  async createSession(sessionId, username, expiresIn = 86400000) { // 24 hours
    const expiresAt = Date.now() + expiresIn;
    
    await this.run(
      'INSERT INTO user_sessions (session_id, username, expires_at, last_activity) VALUES (?, ?, ?, ?)',
      [sessionId, username, expiresAt, Date.now()],
      'transaction'
    );
  }

  async getSession(sessionId) {
    const result = await this.get(
      'SELECT * FROM user_sessions WHERE session_id = ? AND expires_at > ?',
      [sessionId, Date.now()],
      'readonly'
    );
    
    if (result) {
      // Update last activity
      await this.run(
        'UPDATE user_sessions SET last_activity = ? WHERE session_id = ?',
        [Date.now(), sessionId],
        'transaction'
      );
    }
    
    return result;
  }

  async deleteSession(sessionId) {
    await this.run(
      'DELETE FROM user_sessions WHERE session_id = ?',
      [sessionId],
      'transaction'
    );
  }

  async cleanupExpiredSessions() {
    await this.run(
      'DELETE FROM user_sessions WHERE expires_at < ?',
      [Date.now()],
      'background'
    );
  }

  /**
   * Tournament operations
   */
  async createTournament(tournamentData) {
    await this.run(
      'INSERT INTO tournaments (name, type, max_players, buy_in, start_time) VALUES (?, ?, ?, ?, ?)',
      [
        tournamentData.name,
        tournamentData.type,
        tournamentData.maxPlayers,
        tournamentData.buyIn,
        tournamentData.startTime
      ],
      'transaction'
    );
  }

  async getTournaments(status = null) {
    let sql = 'SELECT * FROM tournaments ORDER BY start_time ASC';
    let params = [];
    
    if (status) {
      sql = 'SELECT * FROM tournaments WHERE status = ? ORDER BY start_time ASC';
      params = [status];
    }
    
    return await this.query(sql, params, 'readonly');
  }

  async updateTournamentStatus(tournamentId, status) {
    await this.run(
      'UPDATE tournaments SET status = ? WHERE id = ?',
      [status, tournamentId],
      'transaction'
    );
  }

  /**
   * Analytics and reporting
   */
  async getAnalytics(timeRange = '24h') {
    const timeConditions = {
      '1h': "timestamp > strftime('%s', 'now', '-1 hour')",
      '24h': "timestamp > strftime('%s', 'now', '-1 day')",
      '7d': "timestamp > strftime('%s', 'now', '-7 days')",
      '30d': "timestamp > strftime('%s', 'now', '-30 days')"
    };
    
    const timeCondition = timeConditions[timeRange] || timeConditions['24h'];
    
    const [games, balances] = await Promise.all([
      this.query(
        `SELECT 
          COUNT(*) as total_games,
          AVG(pot_amount) as avg_pot,
          MAX(pot_amount) as max_pot,
          SUM(pot_amount) as total_pot
        FROM game_history 
        WHERE ${timeCondition}`,
        [],
        'readonly'
      ),
      this.query(
        `SELECT 
          COUNT(*) as total_users,
          AVG(chips) as avg_balance,
          SUM(chips) as total_chips
        FROM balances 
        WHERE updated_at > strftime('%s', 'now', '-1 day')`,
        [],
        'readonly'
      )
    ]);
    
    return {
      timeRange,
      games: games[0] || {},
      balances: balances[0] || {},
      timestamp: Date.now()
    };
  }

  /**
   * Database maintenance operations
   */
  async optimize() {
    logger.info('Starting database optimization');
    
    try {
      // Optimize all pools
      const results = await poolManager.optimizeAll();
      
      // Clean up expired sessions
      await this.cleanupExpiredSessions();
      
      // Update statistics
      await this.updateStatistics();
      
      logger.info('Database optimization completed', { results });
      return results;
      
    } catch (error) {
      logger.error('Database optimization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Update database statistics
   */
  async updateStatistics() {
    await this.transaction('background', async (connection) => {
      // Update user activity stats
      connection.exec(`
        CREATE TABLE IF NOT EXISTS user_stats (
          username TEXT PRIMARY KEY,
          games_played INTEGER DEFAULT 0,
          total_winnings INTEGER DEFAULT 0,
          last_login INTEGER,
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);
      
      // This would typically be called by a scheduled job
      logger.debug('User statistics updated');
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.initialized) {
      return { healthy: false, error: 'Database not initialized' };
    }

    try {
      const health = await poolManager.healthCheck();
      const summary = poolManager.getSummary();
      const recommendations = poolManager.getRecommendations();
      
      return {
        healthy: health.overall,
        pools: health.pools,
        summary,
        recommendations,
        timestamp: Date.now()
      };
      
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    if (!this.initialized) {
      return null;
    }

    const summary = poolManager.getSummary();
    const allStats = poolManager.getAllStats();
    
    return {
      summary,
      pools: allStats,
      recommendations: poolManager.getRecommendations(),
      timestamp: Date.now()
    };
  }

  /**
   * Close all database connections
   */
  async close() {
    if (!this.initialized) return;

    try {
      const results = await poolManager.closeAll();
      this.initialized = false;
      
      logger.info('Pooled database closed', { results });
      return results;
      
    } catch (error) {
      logger.error('Failed to close pooled database', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
const pooledDB = new PooledDBHelper();

module.exports = { PooledDBHelper, pooledDB };
