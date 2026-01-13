/**
 * Rate Limiter Middleware
 * Provides configurable rate limiting for API endpoints
 */

const Logger = require('../utils/logger');

class RateLimiter {
  constructor(options = {}) {
    this.options = {
      // Rate limiting settings
      windowMs: options.windowMs || 60000, // 1 minute default
      maxRequests: options.maxRequests || 100, // 100 requests per window
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      
      // Response settings
      statusCode: options.statusCode || 429,
      message: options.message || 'Too many requests, please try again later.',
      
      // Headers
      headers: options.headers || {
        'Retry-After': '60',
        'X-RateLimit-Limit': this.options.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': '0'
      },
      
      // Key generator
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      
      // Store for rate limiting data
      store: options.store || new Map(),
      
      // Skip conditions
      skip: options.skip || (() => false),
      
      // Logging
      enableLogging: options.enableLogging !== false
    };
    
    this.logger = new Logger('rate-limiter');
    
    // Statistics
    this.stats = {
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
   * Default key generator (IP address)
   */
  defaultKeyGenerator(req) {
    return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  }

  /**
   * Setup metrics collection
   */
  setupMetrics() {
    setInterval(() => {
      this.emit('metrics', this.getStats());
    }, 60000); // Every minute
  }

  /**
   * Check if request should be rate limited
   */
  async checkRateLimit(key) {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    
    // Get existing records for this key
    let records = this.options.store.get(key) || [];
    
    // Remove expired records
    records = records.filter(record => record.timestamp > windowStart);
    
    // Check if limit exceeded
    if (records.length >= this.options.maxRequests) {
      // Update store
      this.options.store.set(key, records);
      
      return {
        allowed: false,
        limit: this.options.maxRequests,
        remaining: 0,
        resetTime: records[0].timestamp + this.options.windowMs,
        retryAfter: Math.ceil((records[0].timestamp + this.options.windowMs - now) / 1000)
      };
    }
    
    // Add current request
    records.push({
      timestamp: now,
      requestId: this.generateRequestId()
    });
    
    // Update store
    this.options.store.set(key, records);
    
    return {
      allowed: true,
      limit: this.options.maxRequests,
      remaining: this.options.maxRequests - records.length,
      resetTime: now + this.options.windowMs,
      retryAfter: 0
    };
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create Express middleware
   */
  middleware() {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      try {
        this.stats.totalRequests++;
        
        // Skip rate limiting if conditions met
        if (this.options.skip(req)) {
          this.stats.allowedRequests++;
          return next();
        }
        
        // Get key for this request
        const key = this.options.keyGenerator(req);
        
        // Check rate limit
        const result = await this.checkRateLimit(key);
        
        // Update statistics
        const responseTime = Date.now() - startTime;
        this.updateAverageResponseTime(responseTime);
        
        if (!result.allowed) {
          this.stats.blockedRequests++;
          
          // Log if enabled
          if (this.options.enableLogging) {
            this.logger.warn('Request rate limited', {
              key,
              limit: result.limit,
              retryAfter: result.retryAfter,
              userAgent: req.headers['user-agent'],
              url: req.url
            });
          }
          
          // Set headers
          this.setRateLimitHeaders(res, result);
          
          // Send rate limit response
          return this.sendRateLimitResponse(res, result);
        }
        
        this.stats.allowedRequests++;
        
        // Set headers for allowed requests
        this.setRateLimitHeaders(res, result);
        
        // Continue to next middleware
        next();
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.updateAverageResponseTime(responseTime);
        
        this.stats.errors.push({
          timestamp: Date.now(),
          error: error.message,
          url: req.url,
          method: req.method
        });
        
        // Keep only last 100 errors
        if (this.stats.errors.length > 100) {
          this.stats.errors = this.stats.errors.slice(-100);
        }
        
        this.logger.error('Rate limiter error', {
          error: error.message,
          url: req.url,
          method: req.method
        });
        
        // Continue to next middleware on error
        next();
      }
    };
  }

  /**
   * Set rate limit headers
   */
  setRateLimitHeaders(res, result) {
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    if (result.retryAfter > 0) {
      res.setHeader('Retry-After', result.retryAfter.toString());
    }
  }

  /**
   * Send rate limit response
   */
  sendRateLimitResponse(res, result) {
    const response = {
      error: 'Too Many Requests',
      message: this.options.message,
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.resetTime,
      retryAfter: result.retryAfter,
      timestamp: Date.now()
    };
    
    res.status(this.options.statusCode);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    res.json(response);
  }

  /**
   * Update average response time
   */
  updateAverageResponseTime(responseTime) {
    if (this.stats.totalRequests === 1) {
      this.stats.averageResponseTime = responseTime;
    } else {
      this.stats.averageResponseTime = 
        (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / 
        this.stats.totalRequests;
    }
  }

  /**
   * Get rate limit statistics for a specific key
   */
  getStats(key = null) {
    if (key) {
      const records = this.options.store.get(key) || [];
      const now = Date.now();
      const windowStart = now - this.options.windowMs;
      
      const recentRecords = records.filter(record => record.timestamp > windowStart);
      
      return {
        key,
        requests: recentRecords.length,
        limit: this.options.maxRequests,
        remaining: Math.max(0, this.options.maxRequests - recentRecords.length),
        resetTime: recentRecords.length > 0 
          ? recentRecords[0].timestamp + this.options.windowMs 
          : now + this.options.windowMs,
        windowMs: this.options.windowMs
      };
    }
    
    // Return overall statistics
    const uptime = Date.now() - this.stats.startTime;
    const blockRate = this.stats.totalRequests > 0 
      ? (this.stats.blockedRequests / this.stats.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      totalRequests: this.stats.totalRequests,
      blockedRequests: this.stats.blockedRequests,
      allowedRequests: this.stats.allowedRequests,
      blockRate: parseFloat(blockRate),
      averageResponseTime: Math.round(this.stats.averageResponseTime),
      errors: this.stats.errors.length,
      uptime,
      windowMs: this.options.windowMs,
      maxRequests: this.options.maxRequests,
      storeSize: this.options.store.size
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      averageResponseTime: 0,
      errors: [],
      startTime: Date.now()
    };
    
    this.logger.info('Rate limiter statistics reset');
  }

  /**
   * Clear rate limit data for a specific key
   */
  clearKey(key) {
    this.options.store.delete(key);
    
    if (this.options.enableLogging) {
      this.logger.info('Rate limit data cleared', { key });
    }
  }

  /**
   * Clear all rate limit data
   */
  clearAll() {
    this.options.store.clear();
    
    if (this.options.enableLogging) {
      this.logger.info('All rate limit data cleared');
    }
  }

  /**
   * Get all keys with rate limit data
   */
  getKeys() {
    return Array.from(this.options.store.keys());
  }

  /**
   * Get rate limit data for all keys
   */
  getAllKeyStats() {
    const allStats = {};
    
    for (const key of this.getKeys()) {
      allStats[key] = this.getStats(key);
    }
    
    return allStats;
  }

  /**
   * Clean up expired records
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    let cleanedCount = 0;
    
    for (const [key, records] of this.options.store.entries()) {
      const originalLength = records.length;
      const filteredRecords = records.filter(record => record.timestamp > windowStart);
      
      if (filteredRecords.length !== originalLength) {
        this.options.store.set(key, filteredRecords);
        cleanedCount += originalLength - filteredRecords.length;
      }
    }
    
    if (cleanedCount > 0 && this.options.enableLogging) {
      this.logger.debug('Cleaned up expired rate limit records', { 
        cleanedCount,
        totalKeys: this.options.store.size 
      });
    }
    
    return cleanedCount;
  }

  /**
   * Set up automatic cleanup
   */
  setupCleanup() {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = this.getStats();
      const keyCount = this.getKeys().length;
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        metrics: {
          totalRequests: stats.totalRequests,
          blockRate: stats.blockRate,
          averageResponseTime: stats.averageResponseTime,
          keyCount,
          errors: stats.errors.length
        },
        config: {
          windowMs: this.options.windowMs,
          maxRequests: this.options.maxRequests,
          statusCode: this.options.statusCode
        }
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
   * Create rate limiter with different strategies
   */
  static createMemoryRateLimiter(options = {}) {
    return new RateLimiter({
      store: new Map(),
      ...options
    });
  }

  static createIPRateLimiter(options = {}) {
    return new RateLimiter({
      keyGenerator: (req) => req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
      ...options
    });
  }

  static createUserRateLimiter(options = {}) {
    return new RateLimiter({
      keyGenerator: (req) => {
        // Try to get user ID from session or auth
        return req.user?.id || req.session?.userId || req.headers['x-user-id'] || req.ip;
      },
      ...options
    });
  }

  static createEndpointRateLimiter(options = {}) {
    return new RateLimiter({
      keyGenerator: (req) => `${req.method}:${req.path}:${req.ip}`,
      ...options
    });
  }

  static createSlidingWindowRateLimiter(options = {}) {
    return new RateLimiter({
      windowMs: options.windowMs || 60000,
      maxRequests: options.maxRequests || 100,
      ...options
    });
  }

  static createFixedWindowRateLimiter(options = {}) {
    return new RateLimiter({
      windowMs: options.windowMs || 60000,
      maxRequests: options.maxRequests || 100,
      ...options
    });
  }
}

module.exports = RateLimiter;
