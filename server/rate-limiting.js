/**
 * Rate Limiting System
 * Main entry point for rate limiting in the poker game application
 */

const { RateLimiterMiddleware } = require('./middleware/rate-limiting');
const Logger = require('./utils/logger');

const logger = new Logger('rate-limiting');

class RateLimitingSystem {
  constructor(options = {}) {
    this.options = {
      enableRateLimiting: options.enableRateLimiting !== false,
      enableCommonLimiters: options.enableCommonLimiters !== false,
      enableUserTierLimiters: options.enableUserTierLimiters !== false,
      enableEndpointLimiters: options.enableEndpointLimiters !== false,
      enableAdaptiveLimiters: options.enableAdaptiveLimiters !== false,
      enableMetrics: options.enableMetrics !== false,
      enableHealthCheck: options.enableHealthCheck !== false,
      
      // Global settings
      defaultWindowMs: options.defaultWindowMs || 60000, // 1 minute
      defaultMaxRequests: options.defaultMaxRequests || 100,
      defaultMessage: options.defaultMessage || 'Too many requests, please try again later.',
      
      // Skip settings
      skipPaths: options.skipPaths || ['/health', '/metrics', '/status'],
      skipMethods: options.skipMethods || ['GET', 'HEAD', 'OPTIONS'],
      skipUsers: options.skipUsers || ['admin'],
      skipRoles: options.skipRoles || ['admin'],
      
      // Rate limiting strategies
      strategies: options.strategies || {
        'strict': {
          windowMs: 30000, // 30 seconds
          maxRequests: 10,
          message: 'Rate limit exceeded. Please slow down.'
        },
        'moderate': {
          windowMs: 60000, // 1 minute
          maxRequests: 100,
          message: 'Too many requests, please try again later.'
        },
        'lenient': {
          windowMs: 300000, // 5 minutes
          maxRequests: 1000,
          message: 'Rate limit exceeded. Please try again later.'
        }
      },
      
      // User tiers
      userTiers: {
        'anonymous': {
          windowMs: 300000, // 5 minutes
          maxRequests: 20,
          message: 'Too many requests. Please register for higher limits.'
        },
        'registered': {
          windowMs: 60000, // 1 minute
          maxRequests: 100,
          message: 'Too many requests, please try again later.'
        },
        'premium': {
          windowMs: 60000, // 1 minute
          maxRequests: 500,
          message: 'Too many requests, please try again later.'
        },
        'vip': {
          windowMs: 60000, // 1 minute
          maxRequests: 1000,
          message: 'Too many requests, please try again later.'
        }
      }
    };
    
    this.rateLimiterMiddleware = null;
    this.state = 'stopped';
    this.metrics = {
      startTime: Date.now(),
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      averageResponseTime: 0,
      errors: []
    };
    
    this.initialize();
  }

  /**
   * Initialize the rate limiting system
   */
  initialize() {
    if (!this.options.enableRateLimiting) {
      logger.info('Rate limiting is disabled');
      return;
    }
    
    logger.info('Initializing rate limiting system');
    
    try {
      // Create rate limiter middleware
      this.rateLimiterMiddleware = new RateLimiterMiddleware({
        factory: new RateLimiterFactory(),
        defaultLimiter: 'api',
        enableLogging: this.options.enableMetrics,
        enableMetrics: this.options.enableMetrics,
        enableHealthCheck: this.options.enableHealthCheck,
        skipPaths: this.options.skipPaths,
        skipMethods: this.options.skipMethods,
        skipUsers: this.options.skipUsers,
        skipRoles: this.options.skipRoles
      });
      
      // Create common limiters if enabled
      if (this.options.enableCommonLimiters) {
        this.rateLimiterMiddleware.createPokerGameLimiter();
      }
      
      // Create user tier limiters if enabled
      if (this.options.enableUserTierLimiters) {
        this.rateLimiterMiddleware.createUserTierLimiter();
      }
      
      // Create endpoint limiters if enabled
      if (this.options.enableEndpointLimiters) {
        this.rateLimitingMiddleware.createGameLimiter();
      }
      
      // Create adaptive limiters if enabled
      if (this.options.enableAdaptiveLimiters) {
        this.createAdaptiveLimiters();
      }
      
      this.state = 'running';
      this.emit('initialized');
      
      logger.info('Rate limiting system initialized', {
        commonLimiters: this.options.enableCommonLimiters,
        userTierLimiters: this.options.enableUserTierLimiters,
        endpointLimiters: this.options.enableEndpointLimiters,
        adaptiveLimiters: this.options.enableAdaptiveLimiters
      });
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      logger.error('Failed to initialize rate limiting system', { error: error.message });
      throw error;
    }
  }

  /**
   * Start the rate limiting system
   */
  start() {
    if (this.state === 'starting' || this.state === 'running') {
      return;
    }
    
    this.state = 'starting';
    this.metrics.startTime = Date.now();
    
    try {
      logger.info('Starting rate limiting system');
      
      this.state = 'running';
      this.emit('started');
      
      logger.info('Rate limiting system started');
      
    } catch (rateLimitingError) {
      this.state = 'error';
      this.emit('error', rateLimitingError);
      throw rateLimitingError;
    }
  }

  /**
   * Stop the rate limiting system
   */
  stop() {
    if (this.state === 'stopping' || this.state === 'stopped') {
      return;
    }
    
    this.state = 'stopping';
    
    try {
      logger.info('Stopping rate limiting system');
      
      this.state = 'stopped';
      this.emit('stopped');
      
      logger.info('Rate limiting system stopped');
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create rate limiter with specific strategy
   */
  createRateLimiter(name, strategy = 'moderate', config = {}) {
    const strategyConfig = this.options.strategies[strategy] || {};
    
    return this.rateLimiterMiddleware.create(name, {
      windowMs: strategyConfig.windowMs,
      maxRequests: strategyConfig.maxRequests,
      message: strategyConfig.message,
      ...config
    });
  }

  /**
   * Create user tier rate limiter
   */
  createUserTierLimiter(userTier, config = {}) {
    const tierConfig = this.options.userTiers[userTier] || this.options.userTiers.registered;
    
    return this.rateLimiterMiddleware.createUserRateLimiter(userTier, {
      ...tierConfig,
      ...config
    });
  }

  /**
   * Create endpoint rate limiter
   */
  createEndpointLimiter(endpoint, config = {}) {
    const endpointConfig = {
      windowMs: this.options.defaultWindowMs,
      maxRequests: this.options.defaultMaxRequests,
      message: this.options.defaultMessage,
      ...config
    };
    
    // Adjust based on endpoint type
    if (endpoint.includes('login') || endpoint.includes('register') || endpoint.includes('password')) {
      endpointConfig.windowMs = 900000; // 15 minutes
      endpointConfig.maxRequests = 5;
      endpointConfig.message = 'Too many authentication attempts, please try again later.';
    } else if (endpoint.includes('game')) {
      endpointConfig.windowMs = 30000; // 5 minutes
      endpointConfig.maxRequests = 200;
      endpointConfig.message = 'Too many game actions, please slow down.';
    } else if (endpoint.includes('upload')) {
      endpointConfig.windowMs = 3600000; // 1 hour
      endpointConfig.maxRequests = 20;
      endpointConfig.message = 'Too many file uploads, please try again later.';
    }
    
    return this.rateLimiterMiddleware.createPathRateLimiter(endpoint, endpointConfig);
  }

  /**
   * Create adaptive rate limiter
   */
  createAdaptiveLimiter(name, config = {}) {
    const adaptiveConfig = {
      adaptive: {
        enabled: true,
        loadThreshold: 0.8,
        scaleUpFactor: 2,
        scaleDownFactor: 0.5,
        adjustmentInterval: 300000 // 5 minutes
      },
      ...config
    };
    
    return this.rateLimiterMiddleware.createAdaptiveLimiter(name, adaptiveConfig);
  }

  /**
   * Get rate limiter middleware
   */
  getMiddleware(limiterName = null) {
    if (!this.rateLimiterMiddleware) {
      return null;
    }
    
    return this.rateLimiterMiddleware.createMiddleware(limiterName);
  }

  /**
   * Apply rate limiting to Express app
   */
  applyToApp(app, options = {}) {
    if (!this.rateLimiterMiddleware) {
      return;
    }
    
    const {
      global = options.global !== false,
      paths = options.paths || {},
      methods = options.methods || {},
      users = options.users || {},
      endpoints = options.endpoints || {}
    } = options;
    
    // Apply global rate limiter
    if (global) {
      app.use(this.getMiddleware());
    }
    
    // Apply path-based rate limiters
    for (const [endpoint, config] of Object.entries(endpoints)) {
      app.use(endpoint, this.getEndpointLimiter(endpoint, config));
    }
    
    // Apply method-based rate limiters
    for (const [method, config] of Object.entries(methods)) {
      app.use(this.getMethodRateLimiter(method, config));
    }
    
    // Apply user-based rate limiters
    for (const [userType, config] of Object.entries(users)) {
      app.use(this.getUserTierLimiter(userType, config));
    }
    
    logger.info('Rate limiting applied to Express app', {
      global,
      pathCount: Object.keys(endpoints).length,
      methodCount: Object.keys(methods).length,
      userCount: Object.keys(users).length
    });
  }

  /**
   * Get method rate limiter
   */
  getMethodRateLimiter(method, config = {}) {
    return this.rateLimiterMiddleware.createMethodRateLimiter(method, config);
  }

  /**
   * Get user tier rate limiter
   */
  getUserTierLimiter(userTier, config = {}) {
    return this.rateLimiter.createUserRateLimiter(userTier, config);
  }

  /**
   * Get system metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    
    if (!this.rateLimiterMiddleware) {
      return {
        state: this.state,
        uptime,
        enabled: this.options.enableRateLimiting,
        totalRequests: this.metrics.totalRequests,
        blockedRequests: this.metrics.blockedRequests,
        allowedRequests: this.metrics.allowedRequests,
        averageResponseTime: this.metrics.averageResponseTime,
        errors: this.metrics.errors.length
      };
    }
    
    const middlewareStats = this.rateLimiterMiddleware.getStats();
    
    return {
      ...this.metrics,
      uptime,
      enabled: this.options.enableRateLimiting,
      middleware: middlewareStats,
      factory: this.rateLimiterMiddleware.getFactory().getAllStats()
    };
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    try {
      if (!this.rateLimiterMiddleware) {
        return {
          status: 'disabled',
          timestamp: Date.now(),
          message: 'Rate limiting is disabled'
        };
      }
      
      const health = await this.rateLimiterMiddleware.healthCheck();
      
      return {
        status: this.state === 'running' ? health.status : 'stopped',
        timestamp: Date.now(),
        uptime: this.getMetrics().uptime,
        enabled: this.options.enableRateLimiting,
        health
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    this.metrics = {
      startTime: Date.now(),
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      averageResponseTime: 0,
      errors: []
    };
    
    if (this.rateLimiterMiddleware) {
      this.rateLimiter.resetStats();
    }
    
    logger.info('Rate limiting system statistics reset');
  }

  /**
   * Get configuration
   */
  getConfig() {
    return {
      ...this.options,
      state: this.state,
      middleware: !!this.rateLimiter,
      limiterCount: this.rateLimiter?.getCount() || 0
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    // Reinitialize if rate limiting is enabled
    if (this.options.enableRateLimiting && this.state === 'running') {
      this.stop();
      this.initialize();
      this.start();
    }
    
    logger.info('Rate limiting configuration updated');
  }

  /**
   * Create rate limiter with custom configuration
   */
  createCustomLimiter(name, config = {}) {
    return this.rateLimiterMiddleware.create(name, config);
  }

  /**
   * Create rate limiter for specific user
   */
  createUserSpecificLimiter(userId, config = {}) {
    return this.createCustomLimiter(`user:${userId}`, {
      windowMs: this.options.defaultWindowMs,
      maxRequests: this.options.defaultMaxRequests,
      keyGenerator: (req) => `user:${userId}:${req.ip}`,
      ...config
    });
  }

  /**
   * Create rate limiter for IP address
   */
  createIPRateLimiter(ip, config = {}) {
    return this.createCustomLimiter(`ip:${ip}`, {
      windowMs: this.options.defaultWindowMs,
      maxRequests: this.options.defaultMaxRequests,
      keyGenerator: (req) => `ip:${req.ip}`,
      ...config
    });
  }

  /**
   * Get rate limiter statistics for a specific limiter
   */
  getLimiterStats(limiterName) {
    if (!this.rateLimiterMiddleware) {
      return null;
    }
    
    const limiter = this.rateLimiter.getFactory().get(limiterName);
    
    if (!limiter) {
      return null;
    }
    
    return limiter.getStats();
  }

  /**
   * Clear rate limiter data for a specific limiter
   */
  clearLimiter(limiterName) {
    if (!this.rateLimiterMiddleware) {
      return false;
    }
    
    const limiter = this.rateLimiter.getFactory().get(limiterName);
    
    if (!limiter) {
      return false;
    }
    
    limiter.clearAll();
    
    logger.info('Rate limiter data cleared', { limiterName });
    
    return true;
  }

  /**
   * Clear all rate limiter data
   */
  clearAllLimiters() {
    if (this.rateLimiterMiddleware) {
      this.rateLimiter.clearAll();
    }
    
    logger.info('All rate limiter data cleared');
  }

  /**
   * Get all rate limiter names
   */
  getLimiterNames() {
    if (!this.rateLimiter) {
      return [];
    }
    
    return this.rateLimiter.getFactory().getNames();
  }

  /**
   * Get all rate limiter statistics
   */
  getAllLimiterStats() {
    if (!this.rateLimiter) {
      return {};
    }
    
    return this.rateLimiter.getFactory().getAllStats();
  }

  /**
   * Export rate limiting middleware
   */
  exportMiddleware() {
    if (!this.rateLimiter) {
      return (req, res, next) => next();
    }
    
    return this.rateLimiter.createMiddleware();
  }

  /**
   * Create rate limiting system instance
   */
  static async create(options = {}) {
    const rateLimiting = new RateLimitingSystem(options);
    await rateLimiting.start();
    return rateLimiting;
  }
}

module.exports = RateLimitingSystem;
