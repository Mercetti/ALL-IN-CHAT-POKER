/**
 * Rate Limiter Factory
 * Factory for creating different types of rate limiters
 */

const RateLimiter = require('./rate-limiter');
const Logger = require('../utils/logger');

const logger = new Logger('rate-limiter-factory');

class RateLimiterFactory {
  constructor() {
    this.limiters = new Map();
    this.configurations = new Map();
  }

  /**
   * Create a rate limiter with the given configuration
   */
  create(name, config = {}) {
    if (this.limiters.has(name)) {
      throw new Error(`Rate limiter '${name}' already exists`);
    }

    const limiter = new RateLimiter(config);
    this.limiters.set(name, limiter);
    this.configurations.set(name, config);

    logger.info(`Created rate limiter: ${name}`, {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator?.name || 'default'
    });

    return limiter;
  }

  /**
   * Get an existing rate limiter
   */
  get(name) {
    return this.limiters.get(name);
  }

  /**
   * Remove a rate limiter
   */
  remove(name) {
    const removed = this.limiters.delete(name);
    this.configurations.delete(name);

    if (removed) {
      logger.info(`Removed rate limiter: ${name}`);
    }

    return removed;
  }

  /**
   * Create middleware for a specific rate limiter
   */
  middleware(name) {
    const limiter = this.get(name);
    if (!limiter) {
      throw new Error(`Rate limiter '${name}' not found`);
    }

    return limiter.middleware();
  }

  /**
   * Create multiple rate limiters from configuration
   */
  createFromConfig(configs) {
    const created = {};

    for (const [name, config] of Object.entries(configs)) {
      try {
        created[name] = this.create(name, config);
      } catch (error) {
        logger.error(`Failed to create rate limiter: ${name}`, { error: error.message });
      }
    }

    return created;
  }

  /**
   * Create common rate limiters for poker game
   */
  createCommonLimiters() {
    const configs = {
      // General API rate limiting
      'api': {
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        message: 'Too many API requests, please try again later.',
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '60'
        }
      },

      // Authentication endpoints (more restrictive)
      'auth': {
        windowMs: 900000, // 15 minutes
        maxRequests: 10,
        message: 'Too many authentication attempts, please try again later.',
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '900'
        }
      },

      // Game actions (high frequency)
      'game': {
        windowMs: 60000, // 1 minute
        maxRequests: 200,
        message: 'Too many game actions, please slow down.',
        headers: {
          'X-RateLimit-Limit': '200',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '60'
        }
      },

      // WebSocket connections
      'websocket': {
        windowMs: 60000, // 1 minute
        maxRequests: 50,
        message: 'Too many WebSocket connections, please try again later.',
        headers: {
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '60'
        }
      },

      // File uploads
      'upload': {
        windowMs: 3600000, // 1 hour
        maxRequests: 20,
        message: 'Too many file uploads, please try again later.',
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '3600'
        }
      },

      // Admin endpoints (very restrictive)
      'admin': {
        windowMs: 1800000, // 30 minutes
        maxRequests: 50,
        message: 'Too many admin requests, please try again later.',
        headers: {
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '1800'
        }
      },

      // Analytics endpoints
      'analytics': {
        windowMs: 300000, // 5 minutes
        maxRequests: 30,
        message: 'Too many analytics requests, please try again later.',
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '300'
        }
      }
    };

    return this.createFromConfig(configs);
  }

  /**
   * Create rate limiters for different user types
   */
  createUserTypeLimiters() {
    const configs = {
      // Anonymous users (very restrictive)
      'anonymous': {
        windowMs: 300000, // 5 minutes
        maxRequests: 20,
        message: 'Too many requests for anonymous users, please register for higher limits.',
        keyGenerator: (req) => `anonymous:${req.ip}`,
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '300'
        }
      },

      // Registered users
      'registered': {
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        message: 'Too many requests, please try again later.',
        keyGenerator: (req) => `user:${req.user?.id || req.ip}`,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '60'
        }
      },

      // Premium users (higher limits)
      'premium': {
        windowMs: 60000, // 1 minute
        maxRequests: 500,
        message: 'Too many requests, please try again later.',
        keyGenerator: (req) => `premium:${req.user?.id || req.ip}`,
        headers: {
          'X-RateLimit-Limit': '500',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '60'
        }
      },

      // VIP users (highest limits)
      'vip': {
        windowMs: 60000, // 1 minute
        maxRequests: 1000,
        message: 'Too many requests, please try again later.',
        keyGenerator: (req) => `vip:${req.user?.id || req.ip}`,
        headers: {
          'X-RateLimit-Limit': '1000',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '60'
        }
      }
    };

    return this.createFromConfig(configs);
  }

  /**
   * Create rate limiters for different endpoints
   */
  createEndpointLimiters() {
    const configs = {
      // Login endpoint
      'login': {
        windowMs: 900000, // 15 minutes
        maxRequests: 5,
        message: 'Too many login attempts, please try again later.',
        keyGenerator: (req) => `login:${req.ip}`,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '900'
        }
      },

      // Registration endpoint
      'register': {
        windowMs: 3600000, // 1 hour
        maxRequests: 3,
        message: 'Too many registration attempts, please try again later.',
        keyGenerator: (req) => `register:${req.ip}`,
        headers: {
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '3600'
        }
      },

      // Password reset
      'password-reset': {
        windowMs: 3600000, // 1 hour
        maxRequests: 3,
        message: 'Too many password reset requests, please try again later.',
        keyGenerator: (req) => `password-reset:${req.ip}`,
        headers: {
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '3600'
        }
      },

      // Game creation
      'create-game': {
        windowMs: 300000, // 5 minutes
        maxRequests: 10,
        message: 'Too many game creation attempts, please try again later.',
        keyGenerator: (req) => `create-game:${req.user?.id || req.ip}`,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '300'
        }
      },

      // Betting actions
      'bet': {
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        message: 'Too many betting actions, please slow down.',
        keyGenerator: (req) => `bet:${req.user?.id || req.ip}`,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '0',
          'Retry-After': '60'
        }
      }
    };

    return this.createFromConfig(configs);
  }

  /**
   * Create adaptive rate limiter that adjusts based on load
   */
  createAdaptiveLimiter(name, baseConfig = {}) {
    const adaptiveConfig = {
      windowMs: baseConfig.windowMs || 60000,
      maxRequests: baseConfig.maxRequests || 100,
      message: baseConfig.message || 'Too many requests, please try again later.',
      keyGenerator: baseConfig.keyGenerator || this.defaultKeyGenerator,
      enableLogging: true,
      enableMetrics: true,
      // Adaptive features
      adaptive: {
        enabled: true,
        loadThreshold: 0.8, // 80% of max requests
        scaleUpFactor: 2, // Double the limit when load is high
        scaleDownFactor: 0.5, // Half the limit when load is low
        adjustmentInterval: 300000 // Adjust every 5 minutes
      },
      ...baseConfig
    };

    const limiter = this.create(name, adaptiveConfig);

    // Set up adaptive adjustment
    if (adaptiveConfig.adaptive.enabled) {
      this.setupAdaptiveAdjustment(name, limiter, adaptiveConfig.adaptive);
    }

    return limiter;
  }

  /**
   * Set up adaptive adjustment for rate limiter
   */
  setupAdaptiveAdjustment(name, limiter, config) {
    setInterval(async () => {
      try {
        const stats = limiter.getStats();
        const loadRate = stats.totalRequests / stats.maxRequests;
        
        let newMaxRequests = stats.maxRequests;
        let newWindowMs = stats.windowMs;

        if (loadRate > config.loadThreshold) {
          // Scale up when load is high
          newMaxRequests = Math.min(
            stats.maxRequests * config.scaleUpFactor,
            1000 // Maximum 1000 requests per window
          );
          newWindowMs = Math.max(
            stats.windowMs * 0.5,
            30000 // Minimum 30 seconds
          );
        } else if (loadRate < config.loadThreshold * 0.5) {
          // Scale down when load is low
          newMaxRequests = Math.max(
            stats.maxRequests * config.scaleDownFactor,
            10 // Minimum 10 requests per window
          );
          newWindowMs = Math.min(
            stats.windowMs * 2,
            600000 // Maximum 10 minutes
          );
        }

        // Update configuration if changed
        if (newMaxRequests !== stats.maxRequests || newWindowMs !== stats.windowMs) {
          limiter.options.maxRequests = newMaxRequests;
          limiter.options.windowMs = newWindowMs;

          logger.info(`Adaptive rate limiter adjusted: ${name}`, {
            oldMaxRequests: stats.maxRequests,
            newMaxRequests,
            oldWindowMs: stats.windowMs,
            newWindowMs,
            loadRate: loadRate.toFixed(2)
          });
        }

      } catch (error) {
        logger.error('Failed to adjust adaptive rate limiter', {
          name,
          error: error.message
        });
      }
    }, config.adjustmentInterval);
  }

  /**
   * Get all rate limiter statistics
   */
  getAllStats() {
    const allStats = {};

    for (const [name, limiter] of this.limiters) {
      try {
        allStats[name] = limiter.getStats();
        allStats[name].config = this.configurations.get(name);
      } catch (error) {
        allStats[name] = {
          error: error.message,
          status: 'error'
        };
      }
    }

    return allStats;
  }

  /**
   * Get configuration for a specific rate limiter
   */
  getConfig(name) {
    return this.configurations.get(name);
  }

  /**
   * Update configuration for a specific rate limiter
   */
  updateConfig(name, newConfig) {
    const limiter = this.get(name);
    if (!limiter) {
      throw new Error(`Rate limiter '${name}' not found`);
    }

    // Update configuration
    Object.assign(limiter.options, newConfig);
    this.configurations.set(name, limiter.options);

    logger.info(`Updated rate limiter configuration: ${name}`, {
      windowMs: limiter.options.windowMs,
      maxRequests: limiter.options.maxRequests
    });
  }

  /**
   * Get all rate limiter names
   */
  getNames() {
    return Array.from(this.limiters.keys());
  }

  /**
   * Check if rate limiter exists
   */
  has(name) {
    return this.limiters.has(name);
  }

  /**
   * Get rate limiter count
   */
  getCount() {
    return this.limiters.size;
  }

  /**
   * Clear all rate limiters
   */
  clearAll() {
    for (const [name, limiter] of this.limiters) {
      limiter.clearAll();
    }

    this.limiters.clear();
    this.configurations.clear();

    logger.info('All rate limiters cleared');
  }

  /**
   * Reset all rate limiter statistics
   */
  resetAllStats() {
    for (const [name, limiter] of this.limiters) {
      limiter.resetStats();
    }

    logger.info('All rate limiter statistics reset');
  }

  /**
   * Health check for all rate limiters
   */
  async healthCheck() {
    const checks = {};
    let overallStatus = 'healthy';

    for (const [name, limiter] of this.limiters) {
      try {
        const health = await limiter.healthCheck();
        checks[name] = health;

        if (health.status !== 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        checks[name] = {
          status: 'unhealthy',
          error: error.message
        };
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      timestamp: Date.now(),
      count: this.limiters.size,
      checks,
      factory: {
        count: this.limiters.size,
        names: this.getNames()
      }
    };
  }

  /**
   * Default key generator (IP address)
   */
  defaultKeyGenerator(req) {
    return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  }
}

module.exports = RateLimiterFactory;
