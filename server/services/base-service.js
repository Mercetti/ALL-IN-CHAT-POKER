/**
 * Base Service Class
 * Abstract base class for all services in the application
 */

const EventEmitter = require('events');
const Logger = require('../utils/logger');

class BaseService extends EventEmitter {
  constructor(name, options = {}) {
    super();
    
    this.name = name;
    this.options = {
      enableMetrics: options.enableMetrics !== false,
      enableLogging: options.enableLogging !== false,
      enableHealthCheck: options.enableHealthCheck !== false,
      enableCaching: options.enableCaching !== false,
      enableRetry: options.enableRetry !== false,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      timeout: options.timeout || 30000
    };
    
    this.logger = new Logger(name);
    this.state = 'stopped';
    this.metrics = {
      startTime: null,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastActivity: null,
      errors: []
    };
    
    this.cache = new Map();
    this.health = {
      status: 'healthy',
      lastCheck: null,
      checks: {}
    };
    
    this.initialize();
  }

  /**
   * Initialize the service
   */
  initialize() {
    this.logger.info(`Initializing ${this.name} service`);
    
    if (this.options.enableMetrics) {
      this.setupMetrics();
    }
    
    if (this.options.enableHealthCheck) {
      this.setupHealthCheck();
    }
  }

  /**
   * Start the service
   */
  async start() {
    if (this.state === 'starting' || this.state === 'running') {
      return;
    }
    
    this.state = 'starting';
    this.metrics.startTime = Date.now();
    
    try {
      await this.onStart();
      
      this.state = 'running';
      this.emit('started');
      this.logger.info(`${this.name} service started`);
      
    } catch (error) {
      this.state = 'stopped';
      this.emit('error', error);
      this.logger.error(`Failed to start ${this.name} service`, { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the service
   */
  async stop() {
    if (this.state === 'stopping' || this.state === 'stopped') {
      return;
    }
    
    this.state = 'stopping';
    
    try {
      await this.onStop();
      
      this.state = 'stopped';
      this.emit('stopped');
      this.logger.info(`${this.name} service stopped`);
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      this.logger.error(`Failed to stop ${this.name} service`, { error: error.message });
      throw error;
    }
  }

  /**
   * Restart the service
   */
  async restart() {
    await this.stop();
    await this.start();
  }

  /**
   * Abstract method to be implemented by subclasses
   */
  async onStart() {
    // Override in subclasses
  }

  /**
   * Abstract method to be implemented by subclasses
   */
  async onStop() {
    // Override in subclasses
  }

  /**
   * Execute a method with retry logic
   */
  async executeWithRetry(method, ...args) {
    if (!this.options.enableRetry) {
      return method.apply(this, args);
    }
    
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        const result = await method.apply(this, args);
        
        if (attempt > 1) {
          this.logger.info(`Method succeeded on attempt ${attempt}`, { 
            method: method.name,
            args: args.length 
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        this.logger.warn(`Method failed on attempt ${attempt}`, {
          method: method.name,
          attempt,
          error: error.message
        });
        
        if (attempt < this.options.maxRetries) {
          await this.delay(this.options.retryDelay * attempt);
        }
      }
    }
    
    this.logger.error(`Method failed after ${this.options.maxRetries} attempts`, {
      method: method.name,
      error: lastError.message
    });
    
    throw lastError;
  }

  /**
   * Execute a method with timeout
   */
  async executeWithTimeout(method, timeout = this.options.timeout, ...args) {
    return Promise.race([
      method.apply(this, args),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Method timeout: ${method.name}`)), timeout);
      })
    ]);
  }

  /**
   * Execute a method with metrics tracking
   */
  async executeWithMetrics(method, ...args) {
    const startTime = Date.now();
    
    try {
      this.metrics.totalRequests++;
      const result = await method.apply(this, args);
      
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      this.metrics.successfulRequests++;
      this.metrics.lastActivity = Date.now();
      
      if (this.options.enableMetrics) {
        this.emit('metric', {
          type: 'request',
          method: method.name,
          responseTime,
          success: true
        });
      }
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.metrics.failedRequests++;
      this.metrics.errors.push({
        timestamp: Date.now(),
        method: method.name,
        error: error.message,
        responseTime
      });
      
      if (this.options.enableMetrics) {
        this.emit('metric', {
          type: 'request',
          method: method.name,
          responseTime,
          success: false,
          error: error.message
        });
      }
      
      throw error;
    }
  }

  /**
   * Get cached value or execute function and cache result
   */
  async getCachedValue(key, fn, ttl = 300000) { // 5 minutes default TTL
    if (!this.options.enableCaching) {
      return fn();
    }
    
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }
    
    const value = await fn();
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    return value;
  }

  /**
   * Clear cache
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Update average response time
   */
  updateAverageResponseTime(responseTime) {
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    
    if (totalRequests === 1) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
    }
  }

  /**
   * Setup metrics collection
   */
  setupMetrics() {
    // Emit metrics periodically
    setInterval(() => {
      this.emit('metrics', this.getMetrics());
    }, 60000); // Every minute
  }

  /**
   * Setup health check
   */
  setupHealthCheck() {
    // Run health check periodically
    setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    try {
      const checks = await this.getHealthChecks();
      const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
      
      this.health = {
        status: allHealthy ? 'healthy' : 'unhealthy',
        lastCheck: Date.now(),
        checks
      };
      
      this.emit('healthCheck', this.health);
      
    } catch (error) {
      this.health = {
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message
      };
      
      this.emit('healthCheck', this.health);
    }
  }

  /**
   * Get health checks - override in subclasses
   */
  async getHealthChecks() {
    return {
      service: {
        status: this.state === 'running' ? 'healthy' : 'unhealthy',
        message: `Service is ${this.state}`
      },
      memory: {
        status: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'unhealthy',
        message: `Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      uptime: {
        status: this.getUptime() > 0 ? 'healthy' : 'unhealthy',
        message: `Uptime: ${Math.round(this.getUptime() / 1000)}s`
      }
    };
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    const uptime = this.getUptime();
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      name: this.name,
      state: this.state,
      uptime,
      startTime: this.metrics.startTime,
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      failedRequests: this.metrics.failedRequests,
      successRate: parseFloat(successRate),
      averageResponseTime: Math.round(this.metrics.averageResponseTime),
      lastActivity: this.metrics.lastActivity,
      errorCount: this.metrics.errors.length,
      cacheSize: this.cache.size,
      memoryUsage: process.memoryUsage(),
      health: this.health
    };
  }

  /**
   * Get service uptime
   */
  getUptime() {
    return this.metrics.startTime ? Date.now() - this.metrics.startTime : 0;
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      startTime: Date.now(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastActivity: null,
      errors: []
    };
    
    this.logger.info(`${this.name} service metrics reset`);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      uptime: this.getUptime(),
      health: this.health,
      metrics: this.getMetrics()
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config) {
    const errors = [];
    
    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be an object');
      return errors;
    }
    
    // Override in subclasses to add specific validation
    return errors;
  }

  /**
   * Handle service error
   */
  handleError(error, context = {}) {
    this.logger.error(`Service error in ${this.name}`, {
      error: error.message,
      stack: error.stack,
      context
    });
    
    this.emit('error', {
      error,
      context,
      service: this.name,
      timestamp: Date.now()
    });
    
    // Add to metrics
    this.metrics.errors.push({
      timestamp: Date.now(),
      error: error.message,
      context
    });
    
    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate input parameters
   */
  validateParams(params, schema) {
    const errors = [];
    
    for (const [key, rules] of Object.entries(schema)) {
      const value = params[key];
      
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
        continue;
      }
      
      if (value !== undefined) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${key} must be of type ${rules.type}`);
        }
        
        if (rules.min && value < rules.min) {
          errors.push(`${key} must be at least ${rules.min}`);
        }
        
        if (rules.max && value > rules.max) {
          errors.push(`${key} must be at most ${rules.max}`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${key} does not match required pattern`);
        }
      }
    }
    
    return errors;
  }

  /**
   * Sanitize input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Create a standardized response
   */
  createResponse(success, data = null, error = null, metadata = {}) {
    return {
      success,
      data,
      error,
      metadata: {
        service: this.name,
        timestamp: Date.now(),
        uptime: this.getUptime(),
        ...metadata
      }
    };
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation, duration, metadata = {}) {
    this.logger.info(`Performance: ${operation}`, {
      duration,
      service: this.name,
      ...metadata
    });
    
    if (this.options.enableMetrics) {
      this.emit('performance', {
        operation,
        duration,
        service: this.name,
        timestamp: Date.now(),
        metadata
      });
    }
  }
}

module.exports = BaseService;
