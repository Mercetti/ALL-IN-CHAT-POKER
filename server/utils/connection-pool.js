/**
 * Database Connection Pool
 * Efficient connection management for database operations
 */

const EventEmitter = require('events');
const Logger = require('./logger');

const logger = new Logger('connection-pool');

class ConnectionPool extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      min: options.min || 2,
      max: options.max || 10,
      idleTimeoutMillis: options.idleTimeoutMillis || 30000,
      acquireTimeoutMillis: options.acquireTimeoutMillis || 60000,
      createTimeoutMillis: options.createTimeoutMillis || 30000,
      destroyTimeoutMillis: options.destroyTimeoutMillis || 5000,
      reapIntervalMillis: options.reapIntervalMillis || 1000,
      createRetryIntervalMillis: options.createRetryIntervalMillis || 200,
      propagateCreateError: options.propagateCreateError || false
    };
    
    this.factory = options.factory;
    this.validate = options.validate || (() => Promise.resolve(true));
    
    this.pool = [];
    this.waitingQueue = [];
    this.activeConnections = 0;
    this.totalConnections = 0;
    this.destroyed = false;
    
    this.reapTimer = null;
    this.createPending = 0;
    
    this.startReaping();
    this.ensureMinimum();
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire() {
    if (this.destroyed) {
      throw new Error('Connection pool has been destroyed');
    }

    // Check if there's an available connection
    const availableConnection = this.pool.find(conn => conn.available);
    
    if (availableConnection) {
      availableConnection.available = false;
      availableConnection.lastUsed = Date.now();
      this.activeConnections++;
      
      // Validate connection before returning
      const isValid = await this.validateConnection(availableConnection);
      if (!isValid) {
        // Remove invalid connection and try again
        this.pool = this.pool.filter(conn => conn !== availableConnection);
        this.totalConnections--;
        return this.acquire();
      }
      
      logger.debug('Connection acquired from pool', { 
        activeConnections: this.activeConnections,
        totalConnections: this.totalConnections 
      });
      
      return availableConnection.connection;
    }
    
    // If we can create more connections, do so
    if (this.totalConnections < this.options.max) {
      try {
        const connection = await this.createConnection();
        this.activeConnections++;
        return connection;
      } catch (error) {
        logger.error('Failed to create connection', { error: error.message });
        throw error;
      }
    }
    
    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.options.acquireTimeoutMillis);
      
      this.waitingQueue.push({
        resolve,
        reject,
        timeout
      });
  }

  /**
   * Release a connection back to the pool
   */
  async release(connection) {
    if (this.destroyed) {
      await this.destroyConnection(connection);
      return;
    }

    // Find the connection in our tracking
    const poolConnection = this.pool.find(conn => conn.connection === connection);
    
    if (poolConnection) {
      poolConnection.available = true;
      poolConnection.lastUsed = Date.now();
      this.activeConnections--;
      
      // Check if someone is waiting for this connection
      if (this.waitingQueue.length > 0) {
        const waiter = this.waitingQueue.shift();
        clearTimeout(waiter.timeout);
        
        // Validate before giving to waiter
        const isValid = await this.validateConnection(poolConnection);
        if (isValid) {
          poolConnection.available = false;
          this.activeConnections++;
          waiter.resolve(connection);
        } else {
          // Remove invalid connection and continue
          this.pool = this.pool.filter(conn => conn !== poolConnection);
          this.totalConnections--;
          this.acquire().then(waiter.resolve).catch(waiter.reject);
        }
      }
      
      logger.debug('Connection released to pool', { 
        activeConnections: this.activeConnections,
        totalConnections: this.totalConnections 
      });
    } else {
      // Unknown connection, destroy it
      await this.destroyConnection(connection);
    }
  }

  /**
   * Create a new connection
   */
  async createConnection() {
    this.createPending++;
    
    try {
      const connection = await Promise.race([
        this.factory(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection creation timeout')), 
          this.options.createTimeoutMillis)
        )
      ]);
      
      const poolConnection = {
        connection,
        available: false,
        created: Date.now(),
        lastUsed: Date.now()
      };
      
      this.pool.push(poolConnection);
      this.totalConnections++;
      this.createPending--;
      
      logger.debug('New connection created', { 
        totalConnections: this.totalConnections 
      });
      
      this.emit('connectionCreated', connection);
      return connection;
      
    } catch (error) {
      this.createPending--;
      
      if (this.options.propagateCreateError) {
        throw error;
      }
      
      // Retry connection creation
      setTimeout(() => {
        this.ensureMinimum();
      }, this.options.createRetryIntervalMillis);
      
      throw error;
    }
  }

  /**
   * Destroy a connection
   */
  async destroyConnection(connection) {
    try {
      await Promise.race([
        this._destroyConnection(connection),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection destroy timeout')), 
          this.options.destroyTimeoutMillis)
        )
      ]);
      
      // Remove from pool
      this.pool = this.pool.filter(conn => conn.connection !== connection);
      this.totalConnections--;
      this.activeConnections--;
      
      logger.debug('Connection destroyed', { 
        totalConnections: this.totalConnections 
      });
      
      this.emit('connectionDestroyed', connection);
      
    } catch (error) {
      logger.error('Failed to destroy connection', { error: error.message });
    }
  }

  /**
   * Internal connection destroy method
   */
  async _destroyConnection(connection) {
    if (connection && typeof connection.close === 'function') {
      await connection.close();
    } else if (connection && typeof connection.end === 'function') {
      connection.end();
    }
  }

  /**
   * Validate a connection
   */
  async validateConnection(poolConnection) {
    try {
      const isValid = await this.validate(poolConnection.connection);
      
      if (!isValid) {
        logger.warn('Connection validation failed', { 
          connectionAge: Date.now() - poolConnection.created 
        });
      }
      
      return isValid;
    } catch (error) {
      logger.error('Connection validation error', { error: error.message });
      return false;
    }
  }

  /**
   * Ensure minimum number of connections
   */
  async ensureMinimum() {
    if (this.destroyed) return;
    
    const connectionsNeeded = Math.max(0, this.options.min - this.totalConnections - this.createPending);
    
    for (let i = 0; i < connectionsNeeded; i++) {
      try {
        await this.createConnection();
      } catch (error) {
        logger.error('Failed to create minimum connection', { error: error.message });
        break;
      }
    }
  }

  /**
   * Start reaping idle connections
   */
  startReaping() {
    this.reapTimer = setInterval(() => {
      this.reapIdleConnections();
    }, this.options.reapIntervalMillis);
  }

  /**
   * Reap idle connections
   */
  async reapIdleConnections() {
    if (this.destroyed) return;
    
    const now = Date.now();
    const idleConnections = this.pool.filter(conn => 
      conn.available && 
      (now - conn.lastUsed) > this.options.idleTimeoutMillis
    );
    
    for (const poolConnection of idleConnections) {
      // Don't reap below minimum
      if (this.totalConnections <= this.options.min) {
        break;
      }
      
      await this.destroyConnection(poolConnection.connection);
    }
    
    if (idleConnections.length > 0) {
      logger.debug('Reaped idle connections', { 
        count: idleConnections.length,
        totalConnections: this.totalConnections 
      });
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      totalConnections: this.totalConnections,
      activeConnections: this.activeConnections,
      idleConnections: this.pool.filter(conn => conn.available).length,
      waitingClients: this.waitingQueue.length,
      createPending: this.createPending,
      minConnections: this.options.min,
      maxConnections: this.options.max
    };
  }

  /**
   * Get detailed pool information
   */
  getPoolInfo() {
    return {
      ...this.getStats(),
      connections: this.pool.map(conn => ({
        age: Date.now() - conn.created,
        idleTime: conn.available ? Date.now() - conn.lastUsed : 0,
        available: conn.available
      })),
      options: this.options
    };
  }

  /**
   * Health check for the pool
   */
  async healthCheck() {
    const stats = this.getStats();
    const issues = [];
    
    // Check if we have enough connections
    if (stats.totalConnections < this.options.min) {
      issues.push('Below minimum connection count');
    }
    
    // Check if too many connections are active
    const utilizationRate = stats.activeConnections / stats.totalConnections;
    if (utilizationRate > 0.9) {
      issues.push('High connection utilization');
    }
    
    // Check if clients are waiting
    if (stats.waitingClients > 0) {
      issues.push('Clients waiting for connections');
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      stats
    };
  }

  /**
   * Destroy the connection pool
   */
  async destroy() {
    if (this.destroyed) return;
    
    this.destroyed = true;
    
    // Clear reaping timer
    if (this.reapTimer) {
      clearInterval(this.reapTimer);
      this.reapTimer = null;
    }
    
    // Reject all waiting clients
    this.waitingQueue.forEach(waiter => {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Connection pool destroyed'));
    this.waitingQueue = [];
    
    // Destroy all connections
    const destroyPromises = this.pool.map(poolConnection => 
      this.destroyConnection(poolConnection.connection)
    );
    
    await Promise.allSettled(destroyPromises);
    
    this.pool = [];
    this.totalConnections = 0;
    this.activeConnections = 0;
    
    logger.info('Connection pool destroyed');
    this.emit('poolDestroyed');
  }
}

module.exports = ConnectionPool;
