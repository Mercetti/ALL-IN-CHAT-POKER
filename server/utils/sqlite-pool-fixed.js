/**
 * SQLite Connection Pool
 * Specialized connection pool for SQLite databases
 */

const ConnectionPool = require('./connection-pool');
const Database = require('better-sqlite3');
const path = require('path');
const Logger = require('./logger');

const logger = new Logger('sqlite-pool');

class SQLitePool extends ConnectionPool {
  constructor(dbPath, options = {}) {
    const defaultOptions = {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    };
    
    const poolOptions = { ...defaultOptions, ...options };
    
    // Create connection factory
    const factory = () => this.createSQLiteConnection(dbPath, poolOptions);
    const validator = (connection) => this.validateSQLiteConnection(connection, poolOptions);
    
    super({ factory, validator, ...poolOptions });
    
    this.dbPath = dbPath;
    this.options = poolOptions;
  }

  /**
   * Create a new SQLite connection
   */
  createSQLiteConnection(dbPath, options) {
    return new Promise((resolve, reject) => {
      try {
        const db = new Database(dbPath);
        
        // Configure connection
        if (options.walMode !== false) {
          db.pragma('journal_mode = WAL');
        }
        
        if (options.foreignKeys !== false) {
          db.pragma('foreign_keys = ON');
        }
        
        if (options.synchronous !== undefined) {
          db.pragma(`synchronous = ${options.synchronous}`);
        }
        
        if (options.cacheSize !== undefined) {
          db.pragma(`cache_size = ${options.cacheSize}`);
        }
        
        if (options.tempStore !== undefined) {
          db.pragma(`temp_store = ${options.tempStore}`);
        }
        
        // Set busy timeout
        db.pragma(`busy_timeout = ${options.busyTimeout || 30000}`);
        
        logger.debug('SQLite connection created', { 
          dbPath,
          walMode: options.walMode !== false,
          foreignKeys: options.foreignKeys !== false
        });
        
        resolve(db);
        
      } catch (error) {
        logger.error('Failed to create SQLite connection', { 
          dbPath, 
          error: error.message 
        });
        reject(error);
      }
    });
  }

  /**
   * Validate SQLite connection
   */
  validateSQLiteConnection(connection, options) {
    return new Promise((resolve) => {
      try {
        // Simple validation - execute a quick query
        const result = connection.prepare('SELECT 1').get();
        
        // Check if connection is still open
        if (connection.open === false) {
          resolve(false);
          return;
        }
        
        // Check connection age if specified
        if (options.maxConnectionAge) {
          const connectionAge = Date.now() - connection._createdAt;
          if (connectionAge > options.maxConnectionAge) {
            logger.debug('Connection too old, marking as invalid', { 
              age: connectionAge,
              maxAge: options.maxConnectionAge 
            });
            resolve(false);
            return;
          }
        }
        
        resolve(result === 1);
        
      } catch (error) {
        logger.warn('SQLite connection validation failed', { 
          error: error.message 
        });
        resolve(false);
      }
    });
  }

  /**
   * Execute query with automatic connection management
   */
  async query(sql, params = []) {
    const connection = await this.acquire();
    
    try {
      const stmt = connection.prepare(sql);
      const result = stmt.all(params);
      stmt.finalize();
      
      logger.debug('Query executed', { 
        sql: sql.substring(0, 100), 
        params: params.length,
        resultCount: result.length 
      });
      
      return result;
      
    } catch (error) {
      logger.error('Query execution failed', { 
        sql: sql.substring(0, 100), 
        params,
        error: error.message 
      });
      throw error;
      
    } finally {
      await this.release(connection);
    }
  }

  /**
   * Execute single row query
   */
  async get(sql, params = []) {
    const connection = await this.acquire();
    
    try {
      const stmt = connection.prepare(sql);
      const result = stmt.get(params);
      stmt.finalize();
      
      logger.debug('Get query executed', { 
        sql: sql.substring(0, 100), 
        params 
      });
      
      return result;
      
    } catch (error) {
      logger.error('Get query execution failed', { 
        sql: sql.substring(0, 100), 
        params,
        error: error.message 
      });
      throw error;
      
    } finally {
      await this.release(connection);
    }
  }

  /**
   * Execute insert/update/delete query
   */
  async run(sql, params = []) {
    const connection = await this.acquire();
    
    try {
      const stmt = connection.prepare(sql);
      const result = stmt.run(params);
      stmt.finalize();
      
      logger.debug('Run query executed', { 
        sql: sql.substring(0, 100), 
        params,
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid 
      });
      
      return result;
      
    } catch (error) {
      logger.error('Run query execution failed', { 
        sql: sql.substring(0, 100), 
        params,
        error: error.message 
      });
      throw error;
      
    } finally {
      await this.release(connection);
    }
  }

  /**
   * Execute transaction
   */
  async transaction(callback) {
    const connection = await this.acquire();
    
    try {
      // Begin transaction
      connection.exec('BEGIN TRANSACTION');
      
      // Execute callback
      const result = await callback(connection);
      
      // Commit transaction
      connection.exec('COMMIT');
      
      logger.debug('Transaction completed successfully');
      return result;
      
    } catch (error) {
      // Rollback transaction
      try {
        connection.exec('ROLLBACK');
        logger.debug('Transaction rolled back', { error: error.message });
      } catch (rollbackError) {
        logger.error('Failed to rollback transaction', { 
          error: rollbackError.message 
        });
      }
      
      throw error;
      
    } finally {
      await this.release(connection);
    }
  }

  /**
   * Batch execute multiple queries
   */
  async batch(queries) {
    const connection = await this.acquire();
    
    try {
      connection.exec('BEGIN TRANSACTION');
      
      const results = [];
      
      for (const query of queries) {
        const { sql, params = [] } = query;
        try {
          const stmt = connection.prepare(sql);
          const result = params.length > 0 ? stmt.run(params) : stmt.run();
          stmt.finalize();
          results.push({ success: true, result });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
      
      // Check if all queries were successful
      const allSuccessful = results.every(r => r.success);
      
      if (allSuccessful) {
        connection.exec('COMMIT');
        logger.debug('Batch transaction completed', { 
          queryCount: queries.length 
        });
      } else {
        connection.exec('ROLLBACK');
        logger.warn('Batch transaction rolled back', { 
          failures: results.filter(r => !r.success).length 
        });
      }
      
      return results;
      
    } catch (error) {
      try {
        connection.exec('ROLLBACK');
      } catch (rollbackError) {
        logger.error('Failed to rollback batch transaction', { 
          error: rollbackError.message 
        });
      }
      
      throw error;
      
    } finally {
      await this.release(connection);
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const connection = await this.acquire();
    
    try {
      const stats = {
        // Pool stats
        pool: this.getStats(),
        
        // Database stats
        database: {
          pageCount: connection.prepare('PRAGMA page_count').get()?.page_count || 0,
          pageSize: connection.prepare('PRAGMA page_size').get()?.page_size || 4096,
          freelistCount: connection.prepare('PRAGMA freelist_count').get()?.freelist_count || 0,
          cacheSize: connection.prepare('PRAGMA cache_size').get()?.cache_size || 0,
          journalMode: connection.prepare('PRAGMA journal_mode').get()?.journal_mode || 'DELETE',
          synchronous: connection.prepare('PRAGMA synchronous').get()?.synchronous || 'NORMAL'
        }
      };
      
      // Calculate database size
      stats.database.sizeBytes = stats.database.pageCount * stats.database.pageSize;
      stats.database.sizeMB = Math.round(stats.database.sizeBytes / 1024 / 1024 * 100) / 100;
      
      return stats;
      
    } catch (error) {
      logger.error('Failed to get database stats', { error: error.message });
      throw error;
      
    } finally {
      await this.release(connection);
    }
  }

  /**
   * Optimize database
   */
  async optimize() {
    const connection = await this.acquire();
    
    try {
      logger.info('Starting database optimization');
      
      // Analyze tables
      connection.exec('ANALYZE');
      
      // Vacuum database
      connection.exec('VACUUM');
      
      // Rebuild indexes
      connection.exec('REINDEX');
      
      logger.info('Database optimization completed');
      
    } catch (error) {
      logger.error('Database optimization failed', { error: error.message });
      throw error;
      
    } finally {
      await this.release(connection);
    }
  }

  /**
   * Backup database
   */
  async backup(backupPath) {
    const connection = await this.acquire();
    
    try {
      logger.info('Starting database backup', { backupPath });
      
      // Create backup connection
      const backup = new Database(backupPath);
      
      // Perform backup
      return new Promise((resolve, reject) => {
        connection.backup(backup)
          .then(() => {
            logger.info('Database backup completed', { backupPath });
            backup.close();
            resolve();
          })
          .catch((error) => {
            logger.error('Database backup failed', { error: error.message });
            backup.close();
            reject(error);
      });
      
    } catch (error) {
      logger.error('Failed to start database backup', { error: error.message });
      throw error;
      
    } finally {
      await this.release(connection);
    }
  }

  /**
   * Close all connections and cleanup
   */
  async close() {
    logger.info('Closing SQLite connection pool');
    await this.destroy();
  }
}

module.exports = SQLitePool;
