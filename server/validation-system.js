/**
 * Validation System
 * Main entry point for input validation in the poker game application
 */

const { ValidationMiddleware } = require('./validation/index');
const Logger = require('./utils/logger');

const logger = new Logger('validation-system');

class ValidationSystem {
  constructor(options = {}) {
    this.options = {
      enableValidation: options.enableValidation !== false,
      enableMiddleware: options.enableMiddleware !== false,
      enableCustomRules: options.enableCustomRules !== false,
      enablePokerGameSchemas: options.enablePokerGameSchemas !== false,
      enableMetrics: options.enableMetrics !== false,
      enableHealthCheck: options.enableHealthCheck !== false,
      
      // Validator configuration
      validator: {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
        enableLogging: true,
        enableSanitization: true,
        sanitizeHtml: true,
        sanitizeSql: true,
        sanitizeXss: true,
        ...options.validator
      },
      
      // Middleware configuration
      middleware: {
        sendDetailedErrors: options.sendDetailedErrors !== false,
        includeMetadata: options.includeMetadata !== false,
        skipPaths: options.skipPaths || ['/health', '/metrics', '/status'],
        skipMethods: options.skipMethods || ['GET', 'HEAD', 'OPTIONS'],
        ...options.middleware
      },
      
      // Custom error handling
      errorHandler: options.errorHandler || null
    };
    
    this.validationMiddleware = null;
    this.state = 'stopped';
    this.metrics = {
      startTime: Date.now(),
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      skippedValidations: 0,
      averageValidationTime: 0,
      errors: []
    };
    
    this.initialize();
  }

  /**
   * Initialize the validation system
   */
  initialize() {
    if (!this.options.enableValidation) {
      logger.info('Validation is disabled');
      return;
    }
    
    logger.info('Initializing validation system');
    
    try {
      // Create validation middleware
      this.validationMiddleware = new ValidationMiddleware({
        validator: this.options.validator,
        errorHandler: this.options.errorHandler,
        sendDetailedErrors: this.options.middleware.sendDetailedErrors,
        includeMetadata: this.options.middleware.includeMetadata,
        skipPaths: this.options.middleware.skipPaths,
        skipMethods: this.options.middleware.skipMethods,
        enableMetrics: this.options.enableMetrics
      });
      
      // Create poker game schemas if enabled
      if (this.options.enablePokerGameSchemas) {
        this.validationMiddleware.createPokerGameValidations();
      }
      
      // Add custom rules if enabled
      if (this.options.enableCustomRules) {
        this.addCustomRules();
      }
      
      this.state = 'running';
      this.emit('initialized');
      
      logger.info('Validation system initialized', {
        middleware: !!this.validationMiddleware,
        pokerGameSchemas: this.options.enablePokerGameSchemas,
        customRules: this.options.enableCustomRules
      });
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      logger.error('Failed to initialize validation system', { error: error.message });
      throw error;
    }
  }

  /**
   * Start the validation system
   */
  start() {
    if (this.state === 'starting' || this.state === 'running') {
      return;
    }
    
    this.state = 'starting';
    this.metrics.startTime = Date.now();
    
    try {
      logger.info('Starting validation system');
      
      this.state = 'running';
      this.emit('started');
      
      logger.info('Validation system started');
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the validation system
   */
  stop() {
    if (this.state === 'stopping' || this.state === 'stopped') {
      return;
    }
    
    this.state = 'stopping';
    
    try {
      logger.info('Stopping validation system');
      
      this.state = 'stopped';
      this.emit('stopped');
      
      logger.info('Validation system stopped');
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Validate data using the validator
   */
  async validate(data, schema, options = {}) {
    if (!this.validationMiddleware) {
      return {
        success: true,
        data,
        errors: null,
        metadata: {
          timestamp: Date.now(),
          validationDisabled: true
        }
      };
    }
    
    return this.validationMiddleware.getValidator().validate(data, schema, options);
  }

  /**
   * Create validation middleware
   */
  createMiddleware(schema, options = {}) {
    if (!this.validationMiddleware) {
      return (req, res, next) => next();
    }
    
    return this.validationMiddleware.createMiddleware(schema, options);
  }

  /**
   * Create body validation middleware
   */
  validateBody(schema, options = {}) {
    if (!this.validationMiddleware) {
      return (req, res, next) => next();
    }
    
    return this.validationMiddleware.validateBody(schema, options);
  }

  /**
   * Create query validation middleware
   */
  validateQuery(schema, options = {}) {
    if (!this.validationMiddleware) {
      return (req, res, next) => next();
    }
    
    return this.validationMiddleware.validateQuery(schema, options);
  }

  /**
   * Create params validation middleware
   */
  validateParams(schema, options = {}) {
    if (!this.validationMiddleware) {
      return (req, res, next) => next();
    }
    
    return this.validationMiddleware.validateParams(schema, options);
  }

  /**
   * Create headers validation middleware
   */
  validateHeaders(schema, options = {}) {
    if (!this.validationMiddleware) {
      return (req, res, next) => next();
    }
    
    return this.validationMiddleware.validateHeaders(schema, options);
  }

  /**
   * Create cookies validation middleware
   */
  validateCookies(schema, options = {}) {
    if (!this.validationMiddleware) {
      return (req, res, next) => next();
    }
    
    return this.validationMiddleware.validateCookies(schema, options);
  }

  /**
   * Create combined validation middleware
   */
  validateAll(schemas, options = {}) {
    if (!this.validationMiddleware) {
      return (req, res, next) => next();
    }
    
    return this.validationMiddleware.validateAll(schemas, options);
  }

  /**
   * Create conditional validation middleware
   */
  validateIf(condition, schema, options = {}) {
    if (!this.validationMiddleware) {
      return (req, res, next) => next();
    }
    
    return this.validationMiddleware.validateIf(condition, schema, options);
  }

  /**
   * Apply validation to Express app
   */
  applyToApp(app, validations = {}) {
    if (!this.validationMiddleware) {
      logger.warn('Validation middleware not available, skipping validation application');
      return;
    }
    
    this.validationMiddleware.applyToApp(app, validations);
  }

  /**
   * Add custom validation rules
   */
  addCustomRules() {
    if (!this.validationMiddleware) {
      return;
    }
    
    // Add poker game specific rules
    this.validationMiddleware.addCustomRule('playerName', this.validationMiddleware.getValidator().customRules.get('username'));
    
    // Add tournament specific rules
    this.validationMiddleware.addCustomRule('tournamentName', this.validationMiddleware.getValidator().customRules.get('username'));
    
    // Add chip stack validation
    this.validationMiddleware.addCustomRule('chipStack', this.validationMiddleware.getValidator().customRules.get('chips'));
    
    // Add hand ranking validation
    this.validationMiddleware.addCustomRule('handRanking', this.validationMiddleware.getValidator().customRules.get('gameId'));
    
    logger.info('Added custom validation rules');
  }

  /**
   * Get poker game validation middleware
   */
  getPokerGameValidations() {
    if (!this.validationMiddleware) {
      return {};
    }
    
    return this.validationMiddleware.createPokerGameValidations();
  }

  /**
   * Get system metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const successRate = this.metrics.totalValidations > 0 
      ? (this.metrics.successfulValidations / this.metrics.totalValidations * 100).toFixed(2)
      : 0;
    const errorRate = this.metrics.totalValidations > 0 
      ? (this.metrics.failedValidations / this.metrics.totalValidations * 100).toFixed(2)
      : 0;
    
    const baseMetrics = {
      ...this.metrics,
      uptime,
      successRate: parseFloat(successRate),
      errorRate: parseFloat(errorRate),
      averageValidationTime: Math.round(this.metrics.averageValidationTime),
      skipRate: this.metrics.totalValidations > 0 
        ? (this.metrics.skippedValidations / this.metrics.totalValidations * 100).toFixed(2)
        : 0
    };
    
    if (this.validationMiddleware) {
      baseMetrics.middleware = this.validationMiddleware.getStats();
    }
    
    return baseMetrics;
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    this.metrics = {
      startTime: Date.now(),
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      skippedValidations: 0,
      averageValidationTime: 0,
      errors: []
    };
    
    if (this.validationMiddleware) {
      this.validationMiddleware.resetStats();
    }
    
    logger.info('Validation system statistics reset');
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    try {
      if (!this.validationMiddleware) {
        return {
          status: 'disabled',
          timestamp: Date.now(),
          message: 'Validation is disabled'
        };
      }
      
      const health = await this.validationMiddleware.healthCheck();
      
      return {
        status: this.state === 'running' ? health.status : 'stopped',
        timestamp: Date.now(),
        uptime: this.getMetrics().uptime,
        enabled: this.options.enableValidation,
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
   * Get configuration
   */
  getConfig() {
    return {
      ...this.options,
      state: this.state,
      middleware: !!this.validationMiddleware,
      validator: !!this.validationMiddleware?.getValidator()
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    // Reinitialize if validation is enabled and running
    if (this.options.enableValidation && this.state === 'running') {
      this.stop();
      this.initialize();
      this.start();
    }
    
    logger.info('Validation system configuration updated');
  }

  /**
   * Add custom validation rule
   */
  addCustomRule(name, schema) {
    if (this.validationMiddleware) {
      this.validationMiddleware.addCustomRule(name, schema);
    }
  }

  /**
   * Remove custom validation rule
   */
  removeCustomRule(name) {
    if (this.validationMiddleware) {
      return this.validationMiddleware.removeCustomRule(name);
    }
    return false;
  }

  /**
   * Get all custom rules
   */
  getCustomRules() {
    if (this.validationMiddleware) {
      return this.validationMiddleware.getCustomRules();
    }
    return [];
  }

  /**
   * Get validator instance
   */
  getValidator() {
    return this.validationMiddleware?.getValidator();
  }

  /**
   * Create validation schema for poker game entities
   */
  createPokerGameSchemas() {
    const validator = this.getValidator();
    
    if (!validator) {
      return;
    }
    
    // Player schema
    validator.addCustomRule('player', validator.customRules.get('username'));
    
    // Game session schema
    validator.addCustomRule('gameSession', validator.createCombinedSchema(['gameId', 'userId']));
    
    // Bet schema
    validator.addCustomRule('bet', validator.createCombinedSchema(['gameId', 'userId', 'betAmount']));
    
    // Tournament schema
    validator.addCustomRule('tournament', validator.createCombinedSchema(['gameId', 'userId']));
    
    logger.info('Created poker game validation schemas');
  }

  /**
   * Validate poker game data
   */
  async validatePokerGameData(data, type, options = {}) {
    const schemas = {
      'player': 'player',
      'gameSession': 'gameSession',
      'bet': 'bet',
      'tournament': 'tournament'
    };
    
    const schema = schemas[type];
    if (!schema) {
      return {
        success: false,
        error: 'Unknown poker game data type',
        errors: [{ field: 'type', message: 'Unknown poker game data type' }]
      };
    }
    
    return this.validate(data, schema, options);
  }

  /**
   * Create validation system instance
   */
  static async create(options = {}) {
    const validationSystem = new ValidationSystem(options);
    await validationSystem.start();
    return validationSystem;
  }
}

module.exports = ValidationSystem;
