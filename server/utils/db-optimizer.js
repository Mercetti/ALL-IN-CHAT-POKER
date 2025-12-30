/**
 * Database query optimization utilities
 * Provides batching, caching, and connection pooling for better performance
 */

class DatabaseCache {
  constructor(ttl = 1000) { // 1 second default TTL
    this.cache = new Map(); // key -> { data, timestamp, ttl }
    this.ttl = ttl;
  }

  /**
   * Get cached data or compute it
   * @param {string} key - Cache key
   * @param {Function} computeFn - Function to compute data
   * @param {number} ttl - Custom TTL
   * @returns {*} - Cached or computed data
   */
  get(key, computeFn, ttl = this.ttl) {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data;
    }
    
    const data = computeFn();
    this.cache.set(key, { data, timestamp: now, ttl });
    
    // Clean old entries periodically
    if (this.cache.size > 100) {
      this.cleanup();
    }
    
    return data;
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttl - Custom TTL
   */
  set(key, data, ttl = this.ttl) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  /**
   * Invalidate cache entry
   * @param {string} key - Cache key to invalidate
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {string} pattern - Pattern to match (supports wildcards)
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        expired++;
      } else {
        valid++;
      }
    }
    
    return {
      total: this.cache.size,
      valid,
      expired
    };
  }
}

class DatabaseBatcher {
  constructor(db) {
    this.db = db;
    this.pendingQueries = new Map(); // queryType -> { params, callbacks }
    this.batchTimeout = null;
    this.batchDelay = 50; // 50ms batch delay
  }

  /**
   * Batch multiple queries of the same type
   * @param {string} queryType - Type of query for batching
   * @param {Array} params - Query parameters
   * @param {Function} queryFn - Function to execute batched query
   * @returns {Promise} - Promise that resolves with result
   */
  async batch(queryType, params, queryFn) {
    return new Promise((resolve, reject) => {
      if (!this.pendingQueries.has(queryType)) {
        this.pendingQueries.set(queryType, []);
      }
      
      this.pendingQueries.get(queryType).push({ params, resolve, reject });
      
      // Schedule batch execution
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.executeBatches();
        }, this.batchDelay);
      }
    });
  }

  /**
   * Execute all pending batches
   */
  executeBatches() {
    this.batchTimeout = null;
    
    for (const [queryType, queries] of this.pendingQueries.entries()) {
      try {
        const results = this.executeBatch(queryType, queries);
        queries.forEach(({ resolve }, index) => {
          resolve(results[index]);
        });
      } catch (error) {
        queries.forEach(({ reject }) => {
          reject(error);
        });
      }
    }
    
    this.pendingQueries.clear();
  }

  /**
   * Execute a specific batch of queries
   * @param {string} queryType - Type of query
   * @param {Array} queries - Array of queries with params and callbacks
   * @returns {Array} - Results array
   */
  executeBatch(queryType, queries) {
    switch (queryType) {
      case 'getBalance':
        return this.batchGetBalances(queries.map(q => q.params[0]));
      case 'getProfile':
        return this.batchGetProfiles(queries.map(q => q.params[0]));
      case 'getStats':
        return this.batchGetStats(queries.map(q => q.params[0]));
      default:
        throw new Error(`Unknown batch query type: ${queryType}`);
    }
  }

  /**
   * Batch get balance queries
   * @param {Array} usernames - Array of usernames
   * @returns {Array} - Array of balances
   */
  batchGetBalances(usernames) {
    if (usernames.length === 0) return [];
    
    const placeholders = usernames.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `SELECT username, chips FROM balances WHERE username IN (${placeholders})`
    );
    const results = stmt.all(...usernames);
    
    // Convert to map for fast lookup
    const balanceMap = new Map();
    results.forEach(row => balanceMap.set(row.username, row.chips));
    
    // Return results in same order as input
    return usernames.map(username => balanceMap.get(username) || 1000);
  }

  /**
   * Batch get profile queries
   * @param {Array} logins - Array of logins
   * @returns {Array} - Array of profiles
   */
  batchGetProfiles(logins) {
    if (logins.length === 0) return [];
    
    const placeholders = logins.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `SELECT * FROM profiles WHERE login IN (${placeholders})`
    );
    const results = stmt.all(...logins);
    
    // Convert to map for fast lookup
    const profileMap = new Map();
    results.forEach(row => profileMap.set(row.login, row));
    
    // Return results in same order as input
    return logins.map(login => profileMap.get(login) || null);
  }

  /**
   * Batch get stats queries
   * @param {Array} usernames - Array of usernames
   * @returns {Array} - Array of stats
   */
  batchGetStats(usernames) {
    if (usernames.length === 0) return [];
    
    const placeholders = usernames.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `SELECT * FROM stats WHERE username IN (${placeholders})`
    );
    const results = stmt.all(...usernames);
    
    // Convert to map for fast lookup
    const statsMap = new Map();
    results.forEach(row => statsMap.set(row.username, row));
    
    // Return results in same order as input
    return usernames.map(username => statsMap.get(username) || null);
  }
}

class DatabaseOptimizer {
  constructor(db) {
    this.db = db;
    this.cache = new DatabaseCache();
    this.batcher = new DatabaseBatcher(db);
    
    // Create optimized prepared statements
    this.prepareStatements();
    
    // Setup periodic cleanup
    setInterval(() => {
      this.cache.cleanup();
    }, 10000); // Every 10 seconds
  }

  /**
   * Prepare frequently used statements
   */
  prepareStatements() {
    this.statements = {
      getBalance: this.db.prepare('SELECT chips FROM balances WHERE username = ?'),
      setBalance: this.db.prepare('INSERT OR REPLACE INTO balances (username, chips) VALUES (?, ?)'),
      ensureBalance: this.db.prepare('INSERT OR IGNORE INTO balances (username, chips) VALUES (?, ?)'),
      
      getProfile: this.db.prepare('SELECT * FROM profiles WHERE login = ?'),
      getProfileByEmail: this.db.prepare('SELECT * FROM profiles WHERE LOWER(email) = LOWER(?)'),
      
      getStats: this.db.prepare('SELECT * FROM stats WHERE username = ?'),
      ensureStats: this.db.prepare('INSERT OR IGNORE INTO stats (username) VALUES (?)'),
      
      // Database optimizer - v2 (SQLite GREATEST fix applied)
      updateStats: this.db.prepare(`
        UPDATE stats SET 
          roundsPlayed = COALESCE(?, roundsPlayed),
          roundsWon = COALESCE(?, roundsWon),
          totalWon = COALESCE(?, totalWon),
          biggestWin = CASE WHEN COALESCE(?, biggestWin) > biggestWin THEN COALESCE(?, biggestWin) ELSE biggestWin END,
          bestHand = COALESCE(?, bestHand),
          handsPlayed = COALESCE(?, handsPlayed),
          playSeconds = COALESCE(?, playSeconds),
          updated_at = CURRENT_TIMESTAMP
        WHERE username = ?
      `)
    };
  }

  /**
   * Get balance with caching
   * @param {string} username - Username
   * @returns {number} - Balance
   */
  getBalance(username) {
    const cacheKey = `balance:${username}`;
    return this.cache.get(cacheKey, () => {
      const result = this.statements.getBalance.get(username);
      return result ? result.chips : 1000;
    }, 5000); // 5 second cache for balances
  }

  /**
   * Batch get balances
   * @param {Array} usernames - Array of usernames
   * @returns {Promise<Array>} - Array of balances
   */
  async getBalances(usernames) {
    if (usernames.length <= 1) {
      return usernames.map(username => this.getBalance(username));
    }
    
    return this.batcher.batch('getBalance', usernames, (batch) => {
      return this.batcher.batchGetBalances(batch);
    });
  }

  /**
   * Set balance and invalidate cache
   * @param {string} username - Username
   * @param {number} chips - New balance
   */
  setBalance(username, chips) {
    this.statements.setBalance.run(username, Math.max(0, chips));
    this.cache.invalidate(`balance:${username}`);
  }

  /**
   * Get profile with caching
   * @param {string} login - Login
   * @returns {Object|null} - Profile data
   */
  getProfile(login) {
    const cacheKey = `profile:${login}`;
    return this.cache.get(cacheKey, () => {
      return this.statements.getProfile.get(login) || null;
    }, 10000); // 10 second cache for profiles
  }

  /**
   * Batch get profiles
   * @param {Array} logins - Array of logins
   * @returns {Promise<Array>} - Array of profiles
   */
  async getProfiles(logins) {
    if (logins.length <= 1) {
      return logins.map(login => this.getProfile(login));
    }
    
    return this.batcher.batch('getProfile', logins, (batch) => {
      return this.batcher.batchGetProfiles(batch);
    });
  }

  /**
   * Update profile and invalidate cache
   * @param {string} login - Login
   * @param {Object} updates - Profile updates
   * @returns {Object} - Updated profile
   */
  updateProfile(login, updates) {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'login') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(login);
      
      const stmt = this.db.prepare(`UPDATE profiles SET ${fields.join(', ')} WHERE login = ?`);
      stmt.run(...values);
    }
    
    this.cache.invalidate(`profile:${login}`);
    return this.getProfile(login);
  }

  /**
   * Get stats with caching
   * @param {string} username - Username
   * @returns {Object|null} - Stats data
   */
  getStats(username) {
    const cacheKey = `stats:${username}`;
    return this.cache.get(cacheKey, () => {
      return this.statements.getStats.get(username) || null;
    }, 15000); // 15 second cache for stats
  }

  /**
   * Update stats and invalidate cache
   * @param {string} username - Username
   * @param {Object} updates - Stats updates
   */
  updateStats(username, updates) {
    this.statements.updateStats.run(
      updates.roundsPlayed,
      updates.roundsWon,
      updates.totalWon,
      updates.biggestWin,
      updates.bestHand,
      updates.handsPlayed,
      updates.playSeconds,
      username
    );
    
    this.cache.invalidate(`stats:${username}`);
  }

  /**
   * Execute multiple operations in a transaction
   * @param {Function} operations - Function that performs operations
   */
  transaction(operations) {
    const transaction = this.db.transaction(operations);
    return transaction();
  }

  /**
   * Get optimization statistics
   * @returns {Object} - Stats about cache and performance
   */
  getOptimizationStats() {
    return {
      cache: this.cache.getStats(),
      pendingBatches: this.batcher.pendingQueries.size
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = {
  DatabaseCache,
  DatabaseBatcher,
  DatabaseOptimizer
};
