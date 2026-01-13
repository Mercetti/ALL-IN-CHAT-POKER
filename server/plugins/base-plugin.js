/**
 * Base Plugin Class
 * Abstract base class for all plugins
 */

const EventEmitter = require('events');
const Logger = require('../utils/logger');

class BasePlugin extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      name: config.name || 'unknown',
      version: config.version || '1.0.0',
      description: config.description || '',
      author: config.author || 'Unknown',
      enabled: config.enabled !== false,
      dependencies: config.dependencies || [],
      permissions: config.permissions || [],
      ...config
    };
    
    this.logger = new Logger(`plugin:${this.config.name}`);
    this.state = 'initialized';
    this.startTime = null;
    this.metrics = {
      requests: 0,
      errors: 0,
      averageResponseTime: 0,
      lastActivity: null
    };
    
    // Validate plugin configuration
    this.validateConfig();
  }

  /**
   * Validate plugin configuration
   */
  validateConfig() {
    if (!this.config.name || typeof this.config.name !== 'string') {
      throw new Error('Plugin name is required and must be a string');
    }
    
    if (!this.config.version || typeof this.config.version !== 'string') {
      throw new Error('Plugin version is required and must be a string');
    }
    
    if (!Array.isArray(this.config.dependencies)) {
      throw new Error('Plugin dependencies must be an array');
    }
    
    if (!Array.isArray(this.config.permissions)) {
      throw new Error('Plugin permissions must be an array');
    }
  }

  /**
   * Initialize the plugin
   */
  async initialize() {
    this.logger.info('Initializing plugin');
    
    try {
      this.state = 'initializing';
      
      // Call plugin-specific initialization
      await this.onInitialize();
      
      this.state = 'initialized';
      this.emit('initialized');
      
      this.logger.info('Plugin initialized successfully');
      
    } catch (error) {
      this.state = 'error';
      this.logger.error('Plugin initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Start the plugin
   */
  async start() {
    if (this.state === 'running') {
      return;
    }
    
    this.logger.info('Starting plugin');
    
    try {
      this.state = 'starting';
      this.startTime = Date.now();
      
      // Call plugin-specific start logic
      await this.onStart();
      
      this.state = 'running';
      this.emit('started');
      
      this.logger.info('Plugin started successfully');
      
    } catch (error) {
      this.state = 'error';
      this.logger.error('Plugin start failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the plugin
   */
  async stop() {
    if (this.state !== 'running') {
      return;
    }
    
    this.logger.info('Stopping plugin');
    
    try {
      this.state = 'stopping';
      
      // Call plugin-specific stop logic
      await this.onStop();
      
      this.state = 'stopped';
      this.emit('stopped');
      
      this.logger.info('Plugin stopped successfully');
      
    } catch (error) {
      this.state = 'error';
      this.logger.error('Plugin stop failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Cleanup the plugin
   */
  async cleanup() {
    this.logger.info('Cleaning up plugin');
    
    try {
      // Call plugin-specific cleanup
      await this.onCleanup();
      
      // Remove all event listeners
      this.removeAllListeners();
      
      this.state = 'cleaned';
      this.emit('cleaned');
      
      this.logger.info('Plugin cleaned up successfully');
      
    } catch (error) {
      this.logger.error('Plugin cleanup failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const health = await this.onHealthCheck();
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        uptime: this.getUptime(),
        state: this.state,
        metrics: this.metrics,
        ...health
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: error.message,
        state: this.state
      };
    }
  }

  /**
   * Get plugin information
   */
  getInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      author: this.config.author,
      state: this.state,
      enabled: this.config.enabled,
      dependencies: this.config.dependencies,
      permissions: this.config.permissions,
      uptime: this.getUptime(),
      metrics: this.metrics,
      startTime: this.startTime
    };
  }

  /**
   * Get plugin uptime
   */
  getUptime() {
    return this.startTime ? Date.now() - this.startTime : 0;
  }

  /**
   * Get plugin metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: this.getUptime(),
      errorRate: this.metrics.requests > 0 
        ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Reset plugin metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      averageResponseTime: 0,
      lastActivity: null
    };
    
    this.logger.info('Plugin metrics reset');
  }

  /**
   * Execute plugin method with metrics tracking
   */
  async executeMethod(methodName, method, ...args) {
    const startTime = Date.now();
    
    try {
      this.metrics.requests++;
      this.metrics.lastActivity = Date.now();
      
      const result = await method.apply(this, args);
      
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.metrics.errors++;
      this.logger.error(`Plugin method failed: ${methodName}`, {
        error: error.message,
        responseTime
      });
      
      throw error;
    }
  }

  /**
   * Update average response time
   */
  updateAverageResponseTime(responseTime) {
    if (this.metrics.requests === 1) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.requests - 1) + responseTime) / 
        this.metrics.requests;
    }
  }

  /**
   * Get event listeners for plugin manager
   */
  getEventListeners() {
    return {};
  }

  /**
   * Get API methods for plugin manager
   */
  getAPI() {
    return {};
  }

  /**
   * Emit plugin event
   */
  emitPluginEvent(eventName, data = {}) {
    this.emit(eventName, {
      plugin: this.config.name,
      timestamp: Date.now(),
      ...data
    });
  }

  /**
   * Log plugin activity
   */
  logActivity(level, message, data = {}) {
    this.logger[level](message, {
      plugin: this.config.name,
      ...data
    });
  }

  /**
   * Check if plugin has permission
   */
  hasPermission(permission) {
    return this.config.permissions.includes(permission);
  }

  /**
   * Check if plugin dependency is satisfied
   */
  hasDependency(dependency) {
    return this.config.dependencies.includes(dependency);
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
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Create standardized response
   */
  createResponse(success, data = null, error = null, metadata = {}) {
    return {
      success,
      data,
      error,
      metadata: {
        plugin: this.config.name,
        version: this.config.version,
        timestamp: Date.now(),
        uptime: this.getUptime(),
        ...metadata
      }
    };
  }

  // Abstract methods to be implemented by subclasses

  /**
   * Called when plugin is initialized
   */
  async onInitialize() {
    // Override in subclasses
  }

  /**
   * Called when plugin is started
   */
  async onStart() {
    // Override in subclasses
  }

  /**
   * Called when plugin is stopped
   */
  async onStop() {
    // Override in subclasses
  }

  /**
   * Called when plugin is cleaned up
   */
  async onCleanup() {
    // Override in subclasses
  }

  /**
   * Called for health check
   */
  async onHealthCheck() {
    return {
      status: 'healthy',
      message: 'Plugin is operational'
    };
  }
}

module.exports = BasePlugin;
