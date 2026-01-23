/**
 * Rate Limiter Middleware - Simplified Version
 * Basic rate limiting functionality
 */

const logger = require('../utils/logger');

class RateLimiterMiddleware {
  constructor(options = {}) {
    this.options = {
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      maxRequests: options.maxRequests || 100,
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      ...options
    };
    
    this.clients = new Map();
    this.stats = { requests: 0, blocked: 0, warnings: 0 };
  }

  /**
   * Default key generator (uses IP address)
   */
  defaultKeyGenerator(req) {
    return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  }

  /**
   * Create middleware
   */
  middleware() {
    return (req, res, next) => {
      try {
        this.stats.requests++;
        
        const key = this.options.keyGenerator(req);
        const now = Date.now();
        const windowStart = now - this.options.windowMs;

        // Get or create client record
        if (!this.clients.has(key)) {
          this.clients.set(key, {
            requests: [],
            warnings: 0,
            blockedUntil: null
          });
        }

        const client = this.clients.get(key);

        // Check if client is currently blocked
        if (client.blockedUntil && now < client.blockedUntil) {
          this.stats.blocked++;
          
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((client.blockedUntil - now) / 1000)
          });
        }

        // Clean old requests outside the window
        client.requests = client.requests.filter(timestamp => timestamp > windowStart);

        // Check rate limit
        if (client.requests.length >= this.options.maxRequests) {
          // Block the client
          client.blockedUntil = now + this.options.windowMs;
          this.stats.blocked++;

          logger.warn('Rate limit exceeded', { 
            key, 
            requests: client.requests.length, 
            maxRequests: this.options.maxRequests 
          });

          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil(this.options.windowMs / 1000)
          });
        }

        // Add current request
        client.requests.push(now);

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': this.options.maxRequests,
          'X-RateLimit-Remaining': Math.max(0, this.options.maxRequests - client.requests.length),
          'X-RateLimit-Reset': new Date(now + this.options.windowMs).toISOString()
        });

        // Check if we should send a warning
        const warningThreshold = Math.floor(this.options.maxRequests * 0.8);
        if (client.requests.length >= warningThreshold && client.warnings === 0) {
          client.warnings++;
          this.stats.warnings++;
          
          res.set('X-RateLimit-Warning', 'true');
          
          logger.info('Rate limit warning', { 
            key, 
            requests: client.requests.length, 
            threshold: warningThreshold 
          });
        }

        next();

      } catch (error) {
        logger.error('Rate limiter middleware error', { error: error.message });
        next(); // Continue on error to not break the application
      }
    };
  }

  /**
   * Create custom rate limiter with specific options
   */
  createLimiter(customOptions = {}) {
    const options = { ...this.options, ...customOptions };
    return new RateLimiterMiddleware(options);
  }

  /**
   * Check if a key is currently rate limited
   */
  isRateLimited(key) {
    const client = this.clients.get(key);
    if (!client) return false;

    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Clean old requests
    client.requests = client.requests.filter(timestamp => timestamp > windowStart);

    return client.requests.length >= this.options.maxRequests;
  }

  /**
   * Get rate limit status for a key
   */
  getRateLimitStatus(key) {
    const client = this.clients.get(key);
    if (!client) {
      return {
        limit: this.options.maxRequests,
        remaining: this.options.maxRequests,
        resetTime: Date.now() + this.options.windowMs,
        isBlocked: false
      };
    }

    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Clean old requests
    client.requests = client.requests.filter(timestamp => timestamp > windowStart);

    return {
      limit: this.options.maxRequests,
      remaining: Math.max(0, this.options.maxRequests - client.requests.length),
      resetTime: now + this.options.windowMs,
      isBlocked: client.blockedUntil && now < client.blockedUntil,
      blockedUntil: client.blockedUntil,
      warnings: client.warnings
    };
  }

  /**
   * Reset rate limit for a key
   */
  resetKey(key) {
    this.clients.delete(key);
    logger.debug('Rate limit reset for key', { key });
  }

  /**
   * Clear all rate limit data
   */
  clear() {
    const clientCount = this.clients.size;
    this.clients.clear();
    logger.info('All rate limit data cleared', { clientCount });
  }

  /**
   * Get rate limiter statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeClients: this.clients.size,
      options: this.options,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get detailed client information
   */
  getClientInfo(key) {
    const client = this.clients.get(key);
    if (!client) return null;

    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Clean old requests
    client.requests = client.requests.filter(timestamp => timestamp > windowStart);

    return {
      key,
      requests: client.requests.length,
      maxRequests: this.options.maxRequests,
      warnings: client.warnings,
      isBlocked: client.blockedUntil && now < client.blockedUntil,
      blockedUntil: client.blockedUntil,
      requestTimes: client.requests,
      windowStart,
      windowEnd: now
    };
  }

  /**
   * Get all active clients
   */
  getAllClients() {
    const clients = [];
    
    for (const [key, client] of this.clients.entries()) {
      clients.push(this.getClientInfo(key));
    }

    return clients;
  }

  /**
   * Cleanup expired data
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    let cleaned = 0;

    for (const [key, client] of this.clients.entries()) {
      // Clean old requests
      const originalLength = client.requests.length;
      client.requests = client.requests.filter(timestamp => timestamp > windowStart);
      
      // Remove blocked status if expired
      if (client.blockedUntil && now >= client.blockedUntil) {
        client.blockedUntil = null;
      }

      // Remove client if no recent activity
      if (client.requests.length === 0 && !client.blockedUntil) {
        this.clients.delete(key);
        cleaned++;
      }
    }

    logger.debug('Rate limiter cleanup completed', { cleaned });

    return {
      success: true,
      cleaned,
      activeClients: this.clients.size
    };
  }
}

module.exports = RateLimiterMiddleware;
