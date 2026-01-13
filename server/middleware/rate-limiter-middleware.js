/**
 * Rate Limiter Middleware
 * Express middleware for applying rate limiting to routes
 */

const RateLimiterFactory = require('./rate-limiter-factory');
const Logger = require('../utils/logger');

const logger = new Logger('rate-limiter-middleware');

class RateLimiterMiddleware {
  constructor(options = {}) {
    this.options = {
      // Factory configuration
      factory: options.factory || new RateLimiterFactory(),
      
      // Default rate limiter
      defaultLimiter: options.defaultLimiter || 'api',
      
      // Path-based rate limiting
      pathLimiters: options.pathLimiters || {},
      
      // Method-based rate limiting
      methodLimiters: options.methodLimiters || {},
      
      // User-based rate limiting
      userLimiters: options.userLimiters || {},
      
      // Global settings
      enableLogging: options.enableLogging !== false,
      enableMetrics: options.enableMetrics !== false,
      enableHealthCheck: options.enableHealthCheck !== false,
      healthCheckInterval: options.healthCheckInterval || 60000,
      
      // Skip conditions
      skipPaths: options.skipPaths || [],
      skipMethods: options.skipMethods || [],
      skipUsers: options.skipUsers || [],
      skipRoles: options.skipRoles || [],
      
      // Custom skip function
      skip: options.skip || (() => false)
    };
    
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      averageResponseTime: 0,
      errors: [],
      startTime: Date.now()
    };
    
    this.setupMetrics();
  }

  /**
   * Setup metrics collection
   */
  setupMetrics() {
    if (this.options.enableMetrics) {
      setInterval(() => {
        this.emit('metrics', this.getMetrics());
      }, 60000); // Every minute
    }
  }

  /**
   * Create a rate limiter middleware
   */
  createMiddleware(limiterName = null) {
    return (req, res, next) => {
      const startTime = Date.now();
      
      try {
        this.metrics.totalRequests++;
        
        // Skip rate limiting if conditions are met
        if (this.shouldSkip(req, limiterName)) {
          this.metrics.allowedRequests++;
          return next();
        }
        
        // Determine which limiter to use
        const selectedLimiter = this.selectLimiter(req, limiterName);
        
        if (!selectedLimiter) {
          this.metrics.allowedRequests++;
          return next();
        }
        
        // Get rate limiter instance
        const limiter = this.options.factory.get(selectedLimiter);
        
        if (!limiter) {
          this.metrics.allowedRequests++;
          return next();
        }
        
        // Apply rate limiting
        const limiterMiddleware = limiter.middleware();
        
        // Wrap the middleware to add metrics
        const wrappedMiddleware = (req, res, next) => {
          limiterMiddleware(req, res, (error) => {
            const responseTime = Date.now() - startTime;
            this.updateAverageResponseTime(responseTime);
            
            if (error) {
              this.metrics.errors.push({
                timestamp: Date.now(),
                limiter: selectedLimiter,
                error: error.message,
                url: req.url,
                method: req.method
              });
              
              // Keep only last 100 errors
              if (this.metrics.errors.length > 100) {
                this.metrics.errors = this.metrics.errors.slice(-100);
              }
              
              this.logger.error('Rate limiter middleware error', {
                limiter: selectedLimiter,
                error: error.message,
                url: req.url,
                method: req.method
              });
            }
            
            next(error);
          });
        };
        
        wrappedMiddleware(req, res, next);
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.updateAverageResponseTime(responseTime);
        
        this.metrics.errors.push({
          timestamp: Date.now(),
          error: error.message,
          url: req.url,
          method: req.method
        });
        
        this.logger.error('Rate limiter middleware error', {
          error: error.message,
          url: req.url,
          method: req.method
        });
        
        next(error);
      }
    };
  }

  /**
   * Determine if request should skip rate limiting
   */
  shouldSkip(req, limiterName) {
    // Custom skip function
    if (this.options.skip(req, limiterName)) {
      return true;
    }
    
    // Skip by path
    if (this.options.skipPaths.length > 0) {
      for (const path of this.options.skipPaths) {
        if (this.matchPath(req.path, path)) {
          return true;
        }
      }
    }
    
    // Skip by method
    if (this.options.skipMethods.length > 0) {
      for (const method of this.options.skipMethods) {
        if (req.method === method.toUpperCase()) {
          return true;
        }
      }
    }
    
    // Skip by user
    if (this.options.skipUsers.length > 0 && req.user) {
      for (const user of this.options.skipUsers) {
        if (req.user.id === user || req.user.username === user) {
          return true;
        }
      }
    }
    
    // Skip by role
    if (this.options.skipRoles.length > 0 && req.user && req.user.role) {
      for (const role of this.options.skipRoles) {
        if (req.user.role === role) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Select the appropriate rate limiter for the request
   */
  selectLimiter(req, limiterName) {
    // Use specified limiter if provided
    if (limiterName && this.options.factory.has(limiterName)) {
      return limiterName;
    }
    
    // Check path-based limiters
    for (const [pathPattern, limiter] of Object.entries(this.options.pathLimiters)) {
      if (this.matchPath(req.path, pathPattern)) {
        return limiter;
      }
    }
    
    // Check method-based limiters
    for (const [method, limiter] of Object.entries(this.options.methodLimiters)) {
      if (req.method === method.toUpperCase()) {
        return limiter;
      }
    }
    
    // Check user-based limiters
    if (req.user) {
      for (const [userType, limiter] of Object.entries(this.options.userLimiters)) {
        if (this.matchUser(req.user, userType)) {
          return limiter;
        }
      }
    }
    
    // Use default limiter
    return this.options.defaultLimiter;
  }

  /**
   * Match path against pattern
   */
  matchPath(path, pattern) {
    // Exact match
    if (path === pattern) {
      return true;
    }
    
    // Wildcard pattern
    if (pattern.includes('*')) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '.*') + '$'
      );
      return regex.test(path);
    }
    
    // Parameterized pattern
    if (pattern.includes(':')) {
      const regex = new RegExp(
        '^' + pattern.replace(/:\w+/g, '[^/]+') + '$'
      );
      return regex.test(path);
    }
    
    return false;
  }

  /**
   * Match user against user type
   */
  matchUser(user, userType) {
    if (typeof userType === 'string') {
      // By ID
      if (user.id === userType) {
        return true;
      }
      
      // By username
      if (user.username === userType) {
        return true;
      }
      
      // By role
      if (user.role === userType) {
        return true;
      }
      
      // By property
      if (userType.includes('.')) {
        const [prop, value] = userType.split('.');
        return user[prop] === value;
      }
    }
    
    return false;
  }

  /**
   * Create path-based rate limiter
   */
  createPathRateLimiter(pathPattern, config = {}) {
    const name = `path:${pathPattern}`;
    return this.options.factory.create(name, {
      keyGenerator: (req) => `path:${pathPattern}:${req.ip}`,
      ...config
    });
  }

  /**
   * Create method-based rate limiter
   */
  createMethodRateLimiter(method, config = {}) {
    const name = `method:${method}`;
    return this.options.factory.create(name, {
      keyGenerator: (req) => `method:${method}:${req.ip}`,
      ...config
    });
  }

  /**
   * Create user-based rate limiter
   */
  createUserRateLimiter(userType, config = {}) {
    const name = `user:${userType}`;
    return this.options.factory.create(name, {
      keyGenerator: (req) => {
        if (userType === 'anonymous') {
          return `anonymous:${req.ip}`;
        }
        
        const user = req.user;
        if (user) {
          return `${userType}:${user.id || user.username || user.role || req.ip}`;
        }
        
        return `user:${req.ip}`;
      },
      ...config
    });
  }

  /**
   * Apply rate limiting to Express app
   */
  applyToApp(app, options = {}) {
    const {
      defaultLimiter = this.options.defaultLimiter,
      global = options.global !== false,
      paths = options.paths || {},
      methods = options.methods || {},
      users = options.users || {}
    } = options;

    // Apply global rate limiter if enabled
    if (global) {
      app.use(this.createMiddleware(defaultLimiter));
    }

    // Apply path-based rate limiters
    for (const [pathPattern, config] of Object.entries(paths)) {
      const limiter = this.createPathRateLimiter(pathPattern, config);
      app.use(pathPattern, this.createMiddleware(limiter));
    }

    // Apply method-based rate limiters
    for (const [method, config] of Object.entries(methods)) {
      const limiter = this.createMethodRateLimiter(method, config);
      app.use(this.createMiddleware(limiter));
    }

    // Apply user-based rate limiters
    for (const [userType, config] of Object.entries(users)) {
      const limiter = this.createUserRateLimiter(userType, config);
      app.use(this.createMiddleware(limiter));
    }
  }

  /**
   * Update average response time
   */
  updateAverageResponseTime(responseTime) {
    if (this.metrics.totalRequests === 1) {
      this.metrics.averageResponseTime = rateTime;
    } else {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
        this.metrics.totalRequests;
    }
  }

  /**
   * Get middleware statistics
   */
  getStats() {
    const uptime = Date.now() - this.metrics.startTime;
    const blockRate = this.metrics.totalRequests > 0 
      ? (this.metrics.blockedRequests / this.metrics.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      ...this.metrics,
      uptime,
      blockRate: parseFloat(blockRate),
      averageResponseTime: Math.round(this.metrics.averageResponseTime),
      errorRate: this.metrics.errors.length > 0 
        ? (this.metrics.errors.length / this.metrics.totalRequests * 100).toFixed(2)
        : 0,
      factoryStats: this.options.factory.getAllStats()
    };
  }

  /**
   * Reset middleware statistics
   */
  resetStats() {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      averageResponseTime: 0,
      errors: [],
      startTime: Date.now()
    };
    
    this.logger.info('Rate limiter middleware statistics reset');
  }

  /**
   * Get health status
   */
  async healthCheck() {
    try {
      const stats = this.getStats();
      const factoryHealth = await this.options.factory.healthCheck();
      
      return {
        status: factoryHealth.status === 'healthy' && stats.errorRate < 5 ? 'healthy' : 'degraded',
        timestamp: Date.now(),
        stats,
        factory: factoryHealth
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
   * Create rate limiter with poker game specific settings
   */
  createPokerGameLimiter() {
    return this.options.factory.createCommonLimiters();
  }

  /**
   * Create rate limiter for different user tiers
   */
  createUserTierLimiter() {
    return this.options.factory.createUserTypeLimiters();
  }

  /**
   * Create rate limiter for game endpoints
   */
  createGameLimiter() {
    return this.options.factory.createEndpointLimiters();
  }

  /**
   * Create adaptive rate limiter
   */
  createAdaptiveLimiter(name, config = {}) {
    return this.options.factory.createAdaptiveLimiter(name, config);
  }
}

module.exports = RateLimiterMiddleware;
