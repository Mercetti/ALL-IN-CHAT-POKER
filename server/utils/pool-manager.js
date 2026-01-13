/**
 * Pool Manager
 * Manages multiple database connection pools for different purposes
 */

const SQLitePool = require('./sqlite-pool-fixed');
const Logger = require('./logger');

const logger = new Logger('pool-manager');

class PoolManager {
  constructor() {
    this.pools = new Map();
    this.defaultOptions = {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
      walMode: true,
      foreignKeys: true,
      synchronous: 'NORMAL',
      cacheSize: 2000,
      tempStore: 'MEMORY',
      busyTimeout: 30000,
      maxConnectionAge: 3600000 // 1 hour
    };
  }

  /**
   * Create a new connection pool
   */
  createPool(name, dbPath, options = {}) {
    if (this.pools.has(name)) {
      throw new Error(`Pool '${name}' already exists`);
    }

    const poolOptions = { ...this.defaultOptions, ...options };
    const pool = new SQLitePool(dbPath, poolOptions);
    
    this.pools.set(name, {
      pool,
      dbPath,
      options: poolOptions,
      created: Date.now(),
      stats: {
        totalAcquires: 0,
        totalReleases: 0,
        totalErrors: 0,
        lastActivity: Date.now()
      }
    });

    logger.info('Connection pool created', { 
      name, 
      dbPath,
      minConnections: poolOptions.min,
      maxConnections: poolOptions.max
    });

    return pool;
  }

  /**
   * Get an existing pool
   */
  getPool(name) {
    const poolInfo = this.pools.get(name);
    return poolInfo ? poolInfo.pool : null;
  }

  /**
   * Get pool statistics
   */
  getPoolStats(name) {
    const poolInfo = this.pools.get(name);
    if (!poolInfo) {
      return null;
    }

    return {
      ...poolInfo.pool.getStats(),
      customStats: poolInfo.stats,
      dbPath: poolInfo.dbPath,
      options: poolInfo.options,
      created: poolInfo.created
    };
  }

  /**
   * Get all pool statistics
   */
  getAllStats() {
    const stats = {};
    
    for (const [name, poolInfo] of this.pools) {
      stats[name] = {
        ...poolInfo.pool.getStats(),
        customStats: poolInfo.stats,
        dbPath: poolInfo.dbPath,
        options: poolInfo.options,
        created: poolInfo.created
      };
    }
    
    return stats;
  }

  /**
   * Execute query on specific pool
   */
  async query(poolName, sql, params = []) {
    const pool = this.getPool(poolName);
    if (!pool) {
      throw new Error(`Pool '${poolName}' not found`);
    }

    // Update stats
    const poolInfo = this.pools.get(poolName);
    poolInfo.stats.totalAcquires++;
    poolInfo.stats.lastActivity = Date.now();

    try {
      const result = await pool.query(sql, params);
      poolInfo.stats.totalReleases++;
      return result;
    } catch (error) {
      poolInfo.stats.totalErrors++;
      throw error;
    }
  }

  /**
   * Execute get query on specific pool
   */
  async get(poolName, sql, params = []) {
    const pool = this.getPool(poolName);
    if (!pool) {
      throw new Error(`Pool '${poolName}' not found`);
    }

    const poolInfo = this.pools.get(poolName);
    poolInfo.stats.totalAcquires++;
    poolInfo.stats.lastActivity = Date.now();

    try {
      const result = await pool.get(sql, params);
      poolInfo.stats.totalReleases++;
      return result;
    } catch (error) {
      poolInfo.stats.totalErrors++;
      throw error;
    }
  }

  /**
   * Execute run query on specific pool
   */
  async run(poolName, sql, params = []) {
    const pool = this.getPool(poolName);
    if (!pool) {
      throw new Error(`Pool '${poolName}' not found`);
    }

    const poolInfo = this.pools.get(poolName);
    poolInfo.stats.totalAcquires++;
    poolInfo.stats.lastActivity = Date.now();

    try {
      const result = await pool.run(sql, params);
      poolInfo.stats.totalReleases++;
      return result;
    } catch (error) {
      poolInfo.stats.totalErrors++;
      throw error;
    }
  }

  /**
   * Execute transaction on specific pool
   */
  async transaction(poolName, callback) {
    const pool = this.getPool(poolName);
    if (!pool) {
      throw new Error(`Pool '${poolName}' not found`);
    }

    const poolInfo = this.pools.get(poolName);
    poolInfo.stats.totalAcquires++;
    poolInfo.stats.lastActivity = Date.now();

    try {
      const result = await pool.transaction(callback);
      poolInfo.stats.totalReleases++;
      return result;
    } catch (error) {
      poolInfo.stats.totalErrors++;
      throw error;
    }
  }

  /**
   * Execute batch on specific pool
   */
  async batch(poolName, queries) {
    const pool = this.getPool(poolName);
    if (!pool) {
      throw new Error(`Pool '${poolName}' not found`);
    }

    const poolInfo = this.pools.get(poolName);
    poolInfo.stats.totalAcquires++;
    poolInfo.stats.lastActivity = Date.now();

    try {
      const result = await pool.batch(queries);
      poolInfo.stats.totalReleases++;
      return result;
    } catch (error) {
      poolInfo.stats.totalErrors++;
      throw error;
    }
  }

  /**
   * Health check for all pools
   */
  async healthCheck() {
    const health = {};
    
    for (const [name, poolInfo] of this.pools) {
      try {
        const poolHealth = await poolInfo.pool.healthCheck();
        const dbStats = await poolInfo.pool.getStats();
        
        health[name] = {
          ...poolHealth,
          database: dbStats.database,
          customStats: poolInfo.stats
        };
      } catch (error) {
        health[name] = {
          healthy: false,
          error: error.message,
          customStats: poolInfo.stats
        };
      }
    }
    
    return {
      overall: Object.values(health).every(h => h.healthy),
      pools: health
    };
  }

  /**
   * Optimize all pools
   */
  async optimizeAll() {
    const results = {};
    
    for (const [name, poolInfo] of this.pools) {
      try {
        await poolInfo.pool.optimize();
        results[name] = { success: true };
        logger.info('Pool optimized', { name });
      } catch (error) {
        results[name] = { success: false, error: error.message };
        logger.error('Pool optimization failed', { name, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Backup all pools
   */
  async backupAll(backupDir) {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    
    const results = {};
    
    for (const [name, poolInfo] of this.pools) {
      try {
        const backupPath = path.join(backupDir, `${name}-${Date.now()}.db`);
        await poolInfo.pool.backup(backupPath);
        results[name] = { success: true, backupPath };
        logger.info('Pool backed up', { name, backupPath });
      } catch (error) {
        results[name] = { success: false, error: error.message };
        logger.error('Pool backup failed', { name, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Close specific pool
   */
  async closePool(name) {
    const poolInfo = this.pools.get(name);
    if (!poolInfo) {
      return false;
    }

    try {
      await poolInfo.pool.close();
      this.pools.delete(name);
      
      logger.info('Pool closed', { name });
      return true;
    } catch (error) {
      logger.error('Failed to close pool', { name, error: error.message });
      return false;
    }
  }

  /**
   * Close all pools
   */
  async closeAll() {
    const results = {};
    
    for (const [name, poolInfo] of this.pools) {
      try {
        await poolInfo.pool.close();
        results[name] = { success: true };
        logger.info('Pool closed', { name });
      } catch (error) {
        results[name] = { success: false, error: error.message };
        logger.error('Failed to close pool', { name, error: error.message });
      }
    }
    
    this.pools.clear();
    return results;
  }

  /**
   * Get pool recommendations
   */
  getRecommendations() {
    const recommendations = [];
    
    for (const [name, poolInfo] of this.pools) {
      const stats = poolInfo.pool.getStats();
      const customStats = poolInfo.stats;
      
      // Check utilization
      const utilizationRate = stats.activeConnections / stats.totalConnections;
      if (utilizationRate > 0.8) {
        recommendations.push({
          pool: name,
          type: 'high_utilization',
          message: `Pool '${name}' has high utilization (${Math.round(utilizationRate * 100)}%). Consider increasing max connections.`,
          priority: 'medium'
        });
      }
      
      // Check error rate
      const errorRate = customStats.totalErrors / (customStats.totalAcquires || 1);
      if (errorRate > 0.1) {
        recommendations.push({
          pool: name,
          type: 'high_error_rate',
          message: `Pool '${name}' has high error rate (${Math.round(errorRate * 100)}%). Check connection health.`,
          priority: 'high'
        });
      }
      
      // Check waiting clients
      if (stats.waitingClients > 5) {
        recommendations.push({
          pool: name,
          type: 'long_wait_times',
          message: `Pool '${name}' has many waiting clients (${stats.waitingClients}). Consider increasing min connections or optimizing queries.`,
          priority: 'medium'
        });
      }
      
      // Check pool age
      const poolAge = Date.now() - poolInfo.created;
      if (poolAge > 86400000) { // 24 hours
        recommendations.push({
          pool: name,
          type: 'old_pool',
          message: `Pool '${name}' has been active for ${Math.round(poolAge / 3600000)} hours. Consider connection rotation.`,
          priority: 'low'
        });
      }
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Reset pool statistics
   */
  resetStats(name) {
    const poolInfo = this.pools.get(name);
    if (!poolInfo) {
      return false;
    }

    poolInfo.stats = {
      totalAcquires: 0,
      totalReleases: 0,
      totalErrors: 0,
      lastActivity: Date.now()
    };

    logger.info('Pool stats reset', { name });
    return true;
  }

  /**
   * Reset all pool statistics
   */
  resetAllStats() {
    for (const [name, poolInfo] of this.pools) {
      poolInfo.stats = {
        totalAcquires: 0,
        totalReleases: 0,
        totalErrors: 0,
        lastActivity: Date.now()
      };
    }
    
    logger.info('All pool stats reset');
  }

  /**
   * Get manager summary
   */
  getSummary() {
    const summary = {
      totalPools: this.pools.size,
      totalConnections: 0,
      totalActiveConnections: 0,
      totalWaitingClients: 0,
      pools: {}
    };

    for (const [name, poolInfo] of this.pools) {
      const stats = poolInfo.pool.getStats();
      summary.totalConnections += stats.totalConnections;
      summary.totalActiveConnections += stats.activeConnections;
      summary.totalWaitingClients += stats.waitingClients;
      
      summary.pools[name] = {
        connections: stats.totalConnections,
        active: stats.activeConnections,
        waiting: stats.waitingClients,
        utilization: Math.round((stats.activeConnections / stats.totalConnections) * 100)
      };
    }

    return summary;
  }
}

// Global instance
const poolManager = new PoolManager();

module.exports = { PoolManager, poolManager };
