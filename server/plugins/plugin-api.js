/**
 * Plugin API
 * Provides a secure API for plugins to interact with the system
 */

const EventEmitter = require('events');
const Logger = require('../utils/logger');

class PluginAPI extends EventEmitter {
  constructor(pluginManager, options = {}) {
    super();
    
    this.pluginManager = pluginManager;
    this.options = {
      enableLogging: options.enableLogging !== false,
      enableMetrics: options.enableMetrics !== false,
      enableValidation: options.enableValidation !== false,
      rateLimit: options.rateLimit || 100, // requests per minute
      timeout: options.timeout || 30000
    };
    
    this.logger = new Logger('plugin-api');
    
    this.rateLimitMap = new Map(); // pluginName -> { count, resetTime }
    this.apiMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitHits: 0,
      errors: []
    };
    
    this.setupAPI();
  }

  /**
   * Setup API endpoints
   */
  setupAPI() {
    // System API
    this.system = {
      getInfo: this.getSystemInfo.bind(this),
      getHealth: this.getSystemHealth.bind(this),
      getMetrics: this.getSystemMetrics.bind(this),
      getConfig: this.getSystemConfig.bind(this)
    };
    
    // Event API
    this.events = {
      emit: this.emitEvent.bind(this),
      on: this.addEventListener.bind(this),
      off: this.removeEventListener.bind(this),
      getHistory: this.getEventHistory.bind(this),
      getAggregations: this.getEventAggregations.bind(this)
    };
    
    // Database API
    this.database = {
      query: this.databaseQuery.bind(this),
      get: this.databaseGet.bind(this),
      run: this.databaseRun.bind(this),
      transaction: this.databaseTransaction.bind(this),
      batch: this.databaseBatch.bind(this)
    };
    
    // WebSocket API
    this.websocket = {
      sendToClient: this.sendToClient.bind(this),
      sendToSession: this.sendToSession.bind(this),
      broadcast: this.broadcast.bind(this),
      getSessionStats: this.getSessionStats.bind(this),
      getAllClients: this.getAllClients.bind(this)
    };
    
    // User API
    this.users = {
      getBalance: this.getUserBalance.bind(this),
      updateBalance: this.updateUserBalance.bind(this),
      getSession: this.getUserSession.bind(this),
      createSession: this.createUserSession.bind(this),
      deleteSession: this.deleteUserSession.bind(this)
    };
    
    // Game API
    this.game = {
      getState: this.getGameState.bind(this),
      createSession: this.createGameSession.bind(this),
      endSession: this.endGameSession.bind(this),
      getPlayerInfo: this.getPlayerInfo.bind(this),
      getHistory: this.getGameHistory.bind(this)
    };
    
    // Analytics API
    this.analytics = {
      getData: this.getAnalyticsData.bind(this),
      getReport: this.getAnalyticsReport.bind(this),
      exportData: this.exportAnalytics.bind(this)
    };
    
    // Utility API
    this.utils = {
      generateId: this.generateId.bind(this),
      formatDate: this.formatDate.bind(this),
      validateInput: this.validateInput.bind(this),
      sanitize: this.sanitize.bind(this),
      hash: this.hash.bind(this)
    };
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(pluginName) {
    if (!this.options.rateLimit) {
      return true;
    }
    
    const now = Date.now();
    const limit = this.rateLimitMap.get(pluginName);
    
    if (!limit || now > limit.resetTime) {
      this.rateLimitMap.set(pluginName, {
        count: 1,
        resetTime: now + 60000 // 1 minute from now
      });
      return true;
    }
    
    if (limit.count >= this.options.rateLimit) {
      this.apiMetrics.rateLimitHits++;
      return false;
    }
    
    limit.count++;
    return true;
  }

  /**
   * Execute API method with security and metrics
   */
  async executeAPIMethod(pluginName, methodName, method, ...args) {
    const startTime = Date.now();
    
    try {
      // Rate limiting
      if (!this.checkRateLimit(pluginName)) {
        throw new Error('Rate limit exceeded');
      }
      
      // Input validation
      if (this.options.enableValidation) {
        this.validateAPIInput(methodName, args);
      }
      
      this.apiMetrics.totalRequests++;
      
      // Execute with timeout
      const result = await Promise.race([
        method.apply(this, args),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API method timeout')), this.options.timeout);
        })
      ]);
      
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      this.apiMetrics.successfulRequests++;
      
      // Log if enabled
      if (this.options.enableLogging) {
        this.logger.debug('API method executed', {
          plugin: pluginName,
          method: methodName,
          responseTime,
          success: true
        });
      }
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiMetrics.failedRequests++;
      
      this.apiMetrics.errors.push({
        timestamp: Date.now(),
        plugin: pluginName,
        method: methodName,
        error: error.message,
        responseTime
      });
      
      // Keep only last 100 errors
      if (this.apiMetrics.errors.length > 100) {
        this.apiMetrics.errors = this.apiMetrics.errors.slice(-100);
      }
      
      // Log if enabled
      if (this.options.enableLogging) {
        this.logger.error('API method failed', {
          plugin: pluginName,
          method: methodName,
          error: error.message,
          responseTime
        });
      }
      
      throw error;
    }
  }

  /**
   * Validate API input
   */
  validateAPIInput(methodName, args) {
    // Basic validation - can be extended
    if (args.length > 10) {
      throw new Error('Too many arguments');
    }
    
    for (const arg of args) {
      if (typeof arg === 'object' && arg !== null) {
        if (Object.keys(arg).length > 50) {
          throw new Error('Object has too many properties');
        }
        
        if (JSON.stringify(arg).length > 10000) {
          throw new Error('Argument too large');
        }
      }
    }
  }

  /**
   * Update average response time
   */
  updateAverageResponseTime(responseTime) {
    if (this.apiMetrics.totalRequests === 1) {
      this.apiMetrics.averageResponseTime = responseTime;
    } else {
      this.apiMetrics.averageResponseTime = 
        (this.apiMetrics.averageResponseTime * (this.apiMetrics.totalRequests - 1) + responseTime) / 
        this.apiMetrics.totalRequests;
    }
  }

  // System API methods

  /**
   * Get system information
   */
  async getSystemInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: Date.now()
    };
  }

  /**
   * Get system health
   */
  async getSystemHealth() {
    const services = this.pluginManager.getAllServices();
    const health = {
      overall: 'healthy',
      services: {},
      timestamp: Date.now()
    };
    
    for (const [serviceName, service] of Object.entries(services)) {
      try {
        const serviceHealth = await service.getHealthChecks();
        health.services[serviceName] = serviceHealth;
        
        if (serviceHealth.status !== 'healthy') {
          health.overall = 'degraded';
        }
      } catch (error) {
        health.services[serviceName] = {
          status: 'unhealthy',
          error: error.message
        };
        health.overall = 'unhealthy';
      }
    }
    
    return health;
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    return this.pluginManager.getMetrics();
  }

  /**
   * Get system configuration
   */
  async getSystemConfig() {
    return this.pluginManager.getConfig();
  }

  // Event API methods

  /**
   * Emit event
   */
  async emitEvent(eventName, data) {
    return this.pluginManager.emit(eventName, data);
  }

  /**
   * Add event listener
   */
  async addEventListener(eventName, listener) {
    return this.pluginManager.on(eventName, listener);
  }

  /**
   * Remove event listener
   */
  async removeEventListener(eventName, listener) {
    return this.pluginManager.off(eventName, listener);
  }

  /**
   * Get event history
   */
  async getEventHistory(eventName = null, limit = 100) {
    return this.pluginManager.getEventHistory(eventName, limit);
  }

  /**
   * Get event aggregations
   */
  async getEventAggregations() {
    return this.pluginManager.getAllAggregationSummaries();
  }

  // Database API methods

  /**
   * Database query
   */
  async databaseQuery(sql, params = []) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.query(sql, params);
  }

  /**
   * Database get
   */
  async databaseGet(sql, params = []) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.get(sql, params);
  }

  /**
   * Database run
   */
  async databaseRun(sql, params = []) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.run(sql, params);
  }

  /**
   * Database transaction
   */
  async databaseTransaction(callback) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.transaction(callback);
  }

  /**
   * Database batch
   */
  async databaseBatch(operations) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.batch(operations);
  }

  // WebSocket API methods

  /**
   * Send to client
   */
  async sendToClient(clientId, message) {
    const wsService = this.pluginManager.getWebSocketService();
    if (!wsService) {
      throw new Error('WebSocket service not available');
    }
    
    return wsService.sendToClient(clientId, message);
  }

  /**
   * Send to session
   */
  async sendToSession(sessionId, message) {
    const wsService = this.pluginManager.getWebSocketService();
    if (!wsService) {
      throw new Error('WebSocket service not available');
    }
    
    return wsService.sendToSession(sessionId, message);
  }

  /**
   * Broadcast message
   */
  async broadcast(message, options = {}) {
    const wsService = this.pluginManager.getWebSocketService();
    if (!wsService) {
      throw new Error('WebSocket service not available');
    }
    
    return wsService.broadcast(message, options);
  }

  /**
   * Get session stats
   */
  async getSessionStats(sessionId) {
    const wsService = this.pluginManager.getWebSocketService();
    if (!wsService) {
      throw new Error('WebSocket service not available');
    }
    
    return wsService.getSessionStats(sessionId);
  }

  /**
   * Get all clients
   */
  async getAllClients() {
    const wsService = this.pluginManager.getWebSocketService();
    if (!wsService) {
      throw new Error('WebSocket service not available');
    }
    
    return wsService.getAllClients();
  }

  // User API methods

  /**
   * Get user balance
   */
  async getUserBalance(username) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.getUserBalance(username);
  }

  /**
   * Update user balance
   */
  async updateUserBalance(username, chips) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.updateUserBalance(username, chips);
  }

  /**
   * Get user session
   */
  async getUserSession(sessionId) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.getUserSession(sessionId);
  }

  /**
   * Create user session
   */
  async createUserSession(sessionData) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.createUserSession(sessionData);
  }

  /**
   * Delete user session
   */
  async deleteUserSession(sessionId) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.deleteUserSession(sessionId);
  }

  // Game API methods

  /**
   * Get game state
   */
  async getGameState(gameId) {
    // This would interact with the game engine
    return {
      gameId,
      state: 'waiting',
      players: [],
      pot: 0,
      timestamp: Date.now()
    };
  }

  /**
   * Create game session
   */
  async createGameSession(gameData) {
    // This would create a new game session
    return {
      gameId: this.generateId(),
      ...gameData,
      createdAt: Date.now()
    };
  }

  /**
   * End game session
   */
  async endGameSession(gameId) {
    // This would end a game session
    return {
      gameId,
      endedAt: Date.now()
    };
  }

  /**
   * Get player info
   */
  async getPlayerInfo(playerId) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    // This would get player information from database
    return {
      playerId,
      username: playerId,
      balance: 0,
      stats: {}
    };
  }

  /**
   * Get game history
   */
  async getGameHistory(limit = 50, offset = 0) {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.getGameHistory(limit, offset);
  }

  // Analytics API methods

  /**
   * Get analytics data
   */
  async getAnalyticsData(timeRange = '24h') {
    const dbService = this.pluginManager.getDatabaseService();
    if (!dbService) {
      throw new Error('Database service not available');
    }
    
    return dbService.getAnalytics(timeRange);
  }

  /**
   * Get analytics report
   */
  async getAnalyticsReport(reportType, options = {}) {
    // This would generate specific analytics reports
    return {
      reportType,
      data: {},
      generatedAt: Date.now(),
      ...options
    };
  }

  /**
   * Export analytics
   */
  async exportAnalytics(format = 'json', timeRange = '24h') {
    const data = await this.getAnalyticsData(timeRange);
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV format
      return this.convertToCSV(data);
    } else {
      throw new Error('Unsupported export format');
    }
  }

  // Utility API methods

  /**
   * Generate ID
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format date
   */
  formatDate(date, format = 'iso') {
    const d = new Date(date);
    
    if (format === 'iso') {
      return d.toISOString();
    } else if (format === 'timestamp') {
      return d.getTime();
    } else if (format === 'readable') {
      return d.toLocaleString();
    } else {
      return d.toISOString();
    }
  }

  /**
   * Validate input
   */
  validateInput(input, type = 'string') {
    if (type === 'string') {
      return typeof input === 'string';
    } else if (type === 'number') {
      return typeof input === 'number' && !isNaN(input);
    } else if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(input);
    } else if (type === 'url') {
      try {
        new URL(input);
        return true;
      } catch {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Sanitize input
   */
  sanitize(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return input
      .replace(/[<>]/g, '')
      .trim()
      .substring(0, 1000);
  }

  /**
   * Hash data
   */
  hash(data, algorithm = 'md5') {
    const crypto = require('crypto');
    return crypto.createHash(algorithm).update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Convert data to CSV
   */
  convertToCSV(data) {
    // Simple CSV conversion - can be enhanced
    if (!data || typeof data !== 'object') {
      return '';
    }
    
    const headers = Object.keys(data);
    const values = headers.map(header => data[header]);
    
    return [headers.join(','), values.join(',')].join('\n');
  }

  /**
   * Get API metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.apiMetrics.startTime || 0;
    const errorRate = this.apiMetrics.totalRequests > 0 
      ? (this.apiMetrics.failedRequests / this.apiMetrics.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      ...this.apiMetrics,
      uptime,
      errorRate: parseFloat(errorRate),
      averageResponseTime: Math.round(this.apiMetrics.averageResponseTime),
      rateLimitHits: this.apiMetrics.rateLimitHits,
      pluginsCount: this.rateLimitMap.size
    };
  }

  /**
   * Reset API metrics
   */
  resetMetrics() {
    this.apiMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitHits: 0,
      errors: []
    };
    
    this.rateLimitMap.clear();
    
    this.logger.info('Plugin API metrics reset');
  }

  /**
   * Get API health status
   */
  async getHealthStatus() {
    try {
      const metrics = this.getMetrics();
      const systemHealth = await this.getSystemHealth();
      
      return {
        status: systemHealth.overall === 'healthy' && metrics.errorRate < 5 ? 'healthy' : 'degraded',
        timestamp: Date.now(),
        metrics,
        system: systemHealth
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: error.message
      };
    }
  }
}

module.exports = PluginAPI;
