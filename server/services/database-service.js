/**
 * Database Service
 * Service layer for database operations using connection pooling
 */

const BaseService = require('./base-service');
const { pooledDB } = require('../db-pooled');
const Logger = require('../utils/logger');

class DatabaseService extends BaseService {
  constructor(options = {}) {
    super('database-service', options);
    
    this.options = {
      ...this.options,
      connectionPool: options.connectionPool || 'default',
      enableTransactions: options.enableTransactions !== false,
      enableBatching: options.enableBatching !== false,
      maxBatchSize: options.maxBatchSize || 100,
      queryTimeout: options.queryTimeout || 30000
    };
    
    this.queryStats = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      slowQueries: [],
      queryTypes: {}
    };
  }

  /**
   * Start the database service
   */
  async onStart() {
    try {
      // Initialize database connection pool
      await pooledDB.init();
      
      // Test database connection
      await this.testConnection();
      
      this.logger.info('Database service started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start database service', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the database service
   */
  async onStop() {
    try {
      // Close all database connections
      await pooledDB.close();
      
      this.logger.info('Database service stopped');
      
    } catch (error) {
      this.logger.error('Failed to stop database service', { error: error.message });
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    return this.executeWithMetrics(async () => {
      const result = await pooledDB.query('SELECT 1 as test');
      return result.length > 0 && result[0].test === 1;
    }, 'testConnection');
  }

  /**
   * Execute a query with metrics tracking
   */
  async query(sql, params = []) {
    return this.executeWithMetrics(async () => {
      const startTime = Date.now();
      
      try {
        this.queryStats.totalQueries++;
        
        const result = await pooledDB.query(sql, params);
        
        const queryTime = Date.now() - startTime;
        this.updateQueryStats(sql, queryTime, true);
        
        return result;
        
      } catch (error) {
        const queryTime = Date.now() - startTime;
        this.updateQueryStats(sql, queryTime, false, error);
        throw error;
      }
    }, 'query');
  }

  /**
   * Get a single row
   */
  async get(sql, params = []) {
    return this.executeWithMetrics(async () => {
      const startTime = Date.now();
      
      try {
        this.queryStats.totalQueries++;
        
        const result = await pooledDB.get(sql, params);
        
        const queryTime = Date.now() - startTime;
        this.updateQueryStats(sql, queryTime, true);
        
        return result;
        
      } catch (error) {
        const queryTime = Date.now() - startTime;
        this.updateQueryStats(sql, queryTime, false, error);
        throw error;
      }
    }, 'get');
  }

  /**
   * Execute a write operation
   */
  async run(sql, params = []) {
    return this.executeWithMetrics(async () => {
      const startTime = Date.now();
      
      try {
        this.queryStats.totalQueries++;
        
        const result = await pooledDB.run(sql, params);
        
        const queryTime = Date.now() - startTime;
        this.updateQueryStats(sql, queryTime, true);
        
        return result;
        
      } catch (error) {
        const queryTime = Date.now() - startTime;
        this.updateQueryStats(sql, queryTime, false, error);
        throw error;
      }
    }, 'run');
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    if (!this.options.enableTransactions) {
      throw new Error('Transactions are disabled');
    }
    
    return this.executeWithMetrics(async () => {
      const startTime = Date.now();
      
      try {
        const result = await pooledDB.transaction(callback);
        
        const queryTime = Date.now() - startTime;
        this.updateQueryStats('TRANSACTION', queryTime, true);
        
        return result;
        
      } catch (error) {
        const queryTime = Date.now() - startTime;
        this.updateQueryStats('TRANSACTION', queryTime, false, error);
        throw error;
      }
    }, 'transaction');
  }

  /**
   * Execute batch operations
   */
  async batch(operations) {
    if (!this.options.enableBatching) {
      throw new Error('Batching is disabled');
    }
    
    if (operations.length > this.options.maxBatchSize) {
      throw new Error(`Batch size exceeds maximum of ${this.options.maxBatchSize}`);
    }
    
    return this.executeWithMetrics(async () => {
      const startTime = Date.now();
      
      try {
        const result = await pooledDB.batch(operations);
        
        const queryTime = Date.now() - startTime;
        this.updateQueryStats('BATCH', queryTime, true);
        
        return result;
        
      } catch (error) {
        const queryTime = Date.now() - startTime;
        this.updateQueryStats('BATCH', queryTime, false, error);
        throw error;
      }
    }, 'batch');
  }

  /**
   * Update query statistics
   */
  updateQueryStats(sql, queryTime, success, error = null) {
    if (success) {
      this.queryStats.successfulQueries++;
    } else {
      this.queryStats.failedQueries++;
    }
    
    // Update average query time
    const totalQueries = this.queryStats.successfulQueries + this.queryStats.failedQueries;
    if (totalQueries === 1) {
      this.queryStats.averageQueryTime = queryTime;
    } else {
      this.queryStats.averageQueryTime = 
        (this.queryStats.averageQueryTime * (totalQueries - 1) + queryTime) / totalQueries;
    }
    
    // Track slow queries (over 1 second)
    if (queryTime > 1000) {
      this.queryStats.slowQueries.push({
        sql: sql.substring(0, 100),
        queryTime,
        timestamp: Date.now(),
        error: error ? error.message : null
      });
      
      // Keep only last 50 slow queries
      if (this.queryStats.slowQueries.length > 50) {
        this.queryStats.slowQueries = this.queryStats.slowQueries.slice(-50);
      }
    }
    
    // Track query types
    const queryType = this.getQueryType(sql);
    this.queryStats.queryTypes[queryType] = (this.queryStats.queryTypes[queryType] || 0) + 1;
  }

  /**
   * Get query type from SQL
   */
  getQueryType(sql) {
    const trimmed = sql.trim().toUpperCase();
    
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    if (trimmed.startsWith('CREATE')) return 'CREATE';
    if (trimmed.startsWith('DROP')) return 'DROP';
    if (trimmed.startsWith('ALTER')) return 'ALTER';
    if (trimmed.startsWith('BEGIN') || trimmed.includes('TRANSACTION')) return 'TRANSACTION';
    
    return 'OTHER';
  }

  /**
   * User balance operations
   */
  async getUserBalance(username) {
    return this.getCachedValue(`user_balance:${username}`, async () => {
      const result = await this.get(
        'SELECT chips FROM balances WHERE username = ?',
        [username]
      );
      
      return result ? result.chips : 0;
    }, 300000); // 5 minutes cache
  }

  async updateUserBalance(username, chips) {
    const result = await this.run(
      'UPDATE balances SET chips = ? WHERE username = ?',
      [chips, username]
    );
    
    // Clear cache
    this.clearCache(`user_balance:${username}`);
    
    return result;
  }

  async addUserBalance(username, chips) {
    await this.run(
      'INSERT OR REPLACE INTO balances (username, chips) VALUES (?, ?)',
      [username, chips]
    );
    
    // Clear cache
    this.clearCache(`user_balance:${username}`);
  }

  /**
   * Game history operations
   */
  async addGameHistory(gameData) {
    await this.run(
      `INSERT INTO game_history (game_id, player_count, pot_size, winner, timestamp, data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        gameData.gameId,
        gameData.playerCount,
        gameData.potSize,
        gameData.winner,
        Date.now(),
        JSON.stringify(gameData)
      ]
    );
  }

  async getGameHistory(limit = 50, offset = 0) {
    return this.query(
      'SELECT * FROM game_history ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  async getGameHistoryByPlayer(username, limit = 50, offset = 0) {
    return this.query(
      `SELECT * FROM game_history 
       WHERE data LIKE ? 
       ORDER BY timestamp DESC 
       LIMIT ? OFFSET ?`,
      [`%"${username}"%`, limit, offset]
    );
  }

  /**
   * User session operations
   */
  async createUserSession(sessionData) {
    await this.run(
      `INSERT INTO user_sessions (session_id, username, created_at, last_activity, data)
       VALUES (?, ?, ?, ?, ?)`,
      [
        sessionData.sessionId,
        sessionData.username,
        Date.now(),
        Date.now(),
        JSON.stringify(sessionData)
      ]
    );
  }

  async getUserSession(sessionId) {
    const result = await this.get(
      'SELECT * FROM user_sessions WHERE session_id = ?',
      [sessionId]
    );
    
    return result ? {
      ...result,
      data: JSON.parse(result.data)
    } : null;
  }

  async updateUserSession(sessionId, sessionData) {
    await this.run(
      'UPDATE user_sessions SET last_activity = ?, data = ? WHERE session_id = ?',
      [Date.now(), JSON.stringify(sessionData), sessionId]
    );
  }

  async deleteUserSession(sessionId) {
    await this.run(
      'DELETE FROM user_sessions WHERE session_id = ?',
      [sessionId]
    );
  }

  /**
   * Tournament operations
   */
  async createTournament(tournamentData) {
    await this.run(
      `INSERT INTO tournaments (tournament_id, name, buy_in, max_players, start_time, status, data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tournamentData.tournamentId,
        tournamentData.name,
        tournamentData.buyIn,
        tournamentData.maxPlayers,
        tournamentData.startTime,
        tournamentData.status || 'pending',
        JSON.stringify(tournamentData)
      ]
    );
  }

  async getTournament(tournamentId) {
    const result = await this.get(
      'SELECT * FROM tournaments WHERE tournament_id = ?',
      [tournamentId]
    );
    
    return result ? {
      ...result,
      data: JSON.parse(result.data)
    } : null;
  }

  async getTournaments(status = null, limit = 50) {
    let sql = 'SELECT * FROM tournaments';
    const params = [];
    
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY start_time DESC LIMIT ?';
    params.push(limit);
    
    const results = await this.query(sql, params);
    
    return results.map(result => ({
      ...result,
      data: JSON.parse(result.data)
    }));
  }

  /**
   * Analytics operations
   */
  async getAnalytics(timeRange = '24h') {
    return this.getCachedValue(`analytics:${timeRange}`, async () => {
      const timeMs = this.parseTimeRange(timeRange);
      const startTime = Date.now() - timeMs;
      
      const stats = await pooledDB.getAnalytics(timeRange);
      
      return {
        timeRange,
        startTime,
        endTime: Date.now(),
        ...stats
      };
    }, 60000); // 1 minute cache
  }

  /**
   * Parse time range string to milliseconds
   */
  parseTimeRange(timeRange) {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));
    
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      case 'm': return value * 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // Default to 24 hours
    }
  }

  /**
   * Get database health checks
   */
  async getHealthChecks() {
    const checks = await super.getHealthChecks();
    
    try {
      // Test database connection
      const connectionTest = await this.testConnection();
      
      checks.database = {
        status: connectionTest ? 'healthy' : 'unhealthy',
        message: connectionTest ? 'Database connection successful' : 'Database connection failed'
      };
      
      // Check connection pool
      const poolStats = pooledDB.getStats();
      checks.connectionPool = {
        status: poolStats.activeConnections > 0 ? 'healthy' : 'unhealthy',
        message: `Active connections: ${poolStats.activeConnections}`,
        details: poolStats
      };
      
      // Check slow queries
      const slowQueryCount = this.queryStats.slowQueries.length;
      checks.slowQueries = {
        status: slowQueryCount < 10 ? 'healthy' : 'degraded',
        message: `${slowQueryCount} slow queries detected`,
        details: {
          count: slowQueryCount,
          averageQueryTime: Math.round(this.queryStats.averageQueryTime)
        }
      };
      
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        message: error.message
      };
    }
    
    return checks;
  }

  /**
   * Get database statistics
   */
  getDatabaseStats() {
    return {
      queryStats: this.queryStats,
      poolStats: pooledDB.getStats(),
      cacheSize: this.cache.size
    };
  }

  /**
   * Reset query statistics
   */
  resetQueryStats() {
    this.queryStats = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      slowQueries: [],
      queryTypes: {}
    };
    
    this.logger.info('Database query statistics reset');
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    const baseMetrics = super.getMetrics();
    
    return {
      ...baseMetrics,
      database: this.getDatabaseStats()
    };
  }
}

module.exports = DatabaseService;
