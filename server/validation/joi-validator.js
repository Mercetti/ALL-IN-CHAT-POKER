/**
 * Joi Validator
 * Comprehensive input validation using Joi schema validation
 */

const Joi = require('joi');
const Logger = require('../utils/logger');

class JoiValidator {
  constructor(options = {}) {
    this.options = {
      // Validation options
      abortEarly: options.abortEarly !== false,
      allowUnknown: options.allowUnknown !== false,
      stripUnknown: options.stripUnknown !== false,
      skipFunctions: options.skipFunctions || false,
      
      // Error handling
      returnAllErrors: options.returnAllErrors !== false,
      errorFormatter: options.errorFormatter || this.defaultErrorFormatter,
      
      // Performance
      cacheSchemas: options.cacheSchemas !== false,
      maxCacheSize: options.maxCacheSize || 100,
      
      // Logging
      enableLogging: options.enableLogging !== false,
      logLevel: options.logLevel || 'warn',
      
      // Custom error messages
      customMessages: options.customMessages || {},
      
      // Sanitization
      enableSanitization: options.enableSanitization !== false,
      sanitizeHtml: options.sanitizeHtml !== false,
      sanitizeSql: options.sanitizeSql !== false,
      sanitizeXss: options.sanitizeXss !== false
    };
    
    this.logger = new Logger('joi-validator');
    
    // Schema cache for performance
    this.schemaCache = new Map();
    
    // Statistics
    this.stats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0,
      errors: [],
      startTime: Date.now()
    };
    
    // Custom validation rules
    this.customRules = new Map();
    
    this.initialize();
  }

  /**
   * Initialize the validator
   */
  initialize() {
    this.logger.info('Initializing Joi validator');
    
    // Add custom validation rules
    this.addCustomRules();
    
    // Setup performance monitoring
    if (this.options.enableLogging) {
      this.setupPerformanceMonitoring();
    }
    
    this.logger.info('Joi validator initialized', {
      abortEarly: this.options.abortEarly,
      allowUnknown: this.options.allowUnknown,
      stripUnknown: this.options.stripUnknown,
      cacheSchemas: this.options.cacheSchemas
    });
  }

  /**
   * Add custom validation rules
   */
  addCustomRules() {
    // Username validation
    this.customRules.set('username', Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .lowercase()
      .required()
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters',
        'any.required': 'Username is required'
      }));
    
    // Email validation
    this.customRules.set('email', Joi.string()
      .email()
      .max(255)
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email address must not exceed 255 characters',
        'any.required': 'Email is required'
      }));
    
    // Password validation
    this.customRules.set('password', Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }));
    
    // Chip amount validation
    this.customRules.set('chips', Joi.number()
      .integer()
      .min(0)
      .max(1000000)
      .required()
      .messages({
        'number.base': 'Chips must be a number',
        'number.integer': 'Chips must be a whole number',
        'number.min': 'Chips cannot be negative',
        'number.max': 'Chips cannot exceed 1,000,000',
        'any.required': 'Chip amount is required'
      }));
    
    // Game ID validation
    this.customRules.set('gameId', Joi.string()
      .alphanum()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'Game ID must contain only alphanumeric characters',
        'string.min': 'Game ID cannot be empty',
        'string.max': 'Game ID must not exceed 50 characters',
        'any.required': 'Game ID is required'
      }));
    
    // Bet amount validation
    this.customRules.set('betAmount', Joi.number()
      .integer()
      .min(1)
      .max(100000)
      .required()
      .messages({
        'number.base': 'Bet amount must be a number',
        'number.integer': 'Bet amount must be a whole number',
        'number.min': 'Bet amount must be at least 1',
        'number.max': 'Bet amount cannot exceed 100,000',
        'any.required': 'Bet amount is required'
      }));
    
    // Session ID validation
    this.customRules.set('sessionId', Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Session ID must be a valid UUID',
        'any.required': 'Session ID is required'
      }));
    
    // User ID validation
    this.customRules.set('userId', Joi.string()
      .alphanum()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'User ID must contain only alphanumeric characters',
        'string.min': 'User ID cannot be empty',
        'string.max': 'User ID must not exceed 50 characters',
        'any.required': 'User ID is required'
      }));
    
    // Pagination validation
    this.customRules.set('pagination', Joi.object({
      page: Joi.number().integer().min(1).max(1000).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      offset: Joi.number().integer().min(0).max(10000).default(0)
    }));
    
    // Sort validation
    this.customRules.set('sort', Joi.object({
      field: Joi.string().required(),
      direction: Joi.string().valid('asc', 'desc').default('desc')
    }));
    
    // Date range validation
    this.customRules.set('dateRange', Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
    }));
    
    // File upload validation
    this.customRules.set('fileUpload', Joi.object({
      filename: Joi.string().required(),
      mimetype: Joi.string().required(),
      size: Joi.number().integer().max(10 * 1024 * 1024).required(), // 10MB max
      buffer: Joi.binary().required()
    }));
  }

  /**
   * Validate data against schema
   */
  async validate(data, schema, options = {}) {
    const startTime = Date.now();
    
    try {
      this.stats.totalValidations++;
      
      // Get or create schema
      const validationSchema = this.getSchema(schema);
      
      // Add custom options
      const validationOptions = {
        abortEarly: options.abortEarly !== undefined ? options.abortEarly : this.options.abortEarly,
        allowUnknown: options.allowUnknown !== undefined ? options.allowUnknown : this.options.allowUnknown,
        stripUnknown: options.stripUnknown !== undefined ? options.stripUnknown : this.options.stripUnknown,
        skipFunctions: options.skipFunctions !== undefined ? options.skipFunctions : this.options.skipFunctions,
        returnAllErrors: options.returnAllErrors !== undefined ? options.returnAllErrors : this.options.returnAllErrors
      };
      
      // Perform validation
      const result = await validationSchema.validateAsync(data, validationOptions);
      
      // Sanitize if enabled
      if (this.options.enableSanitization) {
        this.sanitizeResult(result);
      }
      
      const validationTime = Date.now() - startTime;
      this.updateAverageValidationTime(validationTime);
      this.stats.successfulValidations++;
      
      // Log successful validation if enabled
      if (this.options.enableLogging && this.options.logLevel === 'debug') {
        this.logger.debug('Validation successful', {
          schema: typeof schema === 'string' ? schema : 'custom',
          validationTime
        });
      }
      
      return {
        success: true,
        data: result,
        errors: null,
        validationTime,
        metadata: {
          schema: typeof schema === 'string' ? schema : 'custom',
          timestamp: Date.now()
        }
      };
      
    } catch (error) {
      const validationTime = Date.now() - startTime;
      this.updateAverageValidationTime(validationTime);
      this.stats.failedValidations++;
      
      // Format errors
      const formattedErrors = this.formatValidationErrors(error);
      
      // Add to error tracking
      this.stats.errors.push({
        timestamp: Date.now(),
        schema: typeof schema === 'string' ? schema : 'custom',
        errors: formattedErrors,
        validationTime
      });
      
      // Keep only last 100 errors
      if (this.stats.errors.length > 100) {
        this.stats.errors = this.stats.errors.slice(-100);
      }
      
      // Log validation failure if enabled
      if (this.options.enableLogging) {
        this.logger.warn('Validation failed', {
          schema: typeof schema === 'string' ? schema : 'custom',
          errors: formattedErrors,
          validationTime
        });
      }
      
      return {
        success: false,
        data: null,
        errors: formattedErrors,
        validationTime,
        metadata: {
          schema: typeof schema === 'string' ? schema : 'custom',
          timestamp: Date.now()
        }
      };
    }
  }

  /**
   * Get schema (cached or create new)
   */
  getSchema(schema) {
    if (typeof schema === 'string') {
      // Check cache first
      if (this.options.cacheSchemas && this.schemaCache.has(schema)) {
        return this.schemaCache.get(schema);
      }
      
      // Create schema from string
      const newSchema = this.createSchemaFromString(schema);
      
      // Cache if enabled
      if (this.options.cacheSchemas) {
        this.cacheSchema(schema, newSchema);
      }
      
      return newSchema;
    }
    
    // Return custom schema directly
    return schema;
  }

  /**
   * Create schema from string identifier
   */
  createSchemaFromString(schemaName) {
    const parts = schemaName.split('.');
    let schema;
    
    if (parts.length === 1) {
      // Single rule
      schema = this.customRules.get(schemaName);
    } else {
      // Combined schema
      const schemaObject = {};
      for (const part of parts) {
        if (this.customRules.has(part)) {
          schemaObject[part] = this.customRules.get(part);
        }
      }
      schema = Joi.object(schemaObject);
    }
    
    if (!schema) {
      throw new Error(`Unknown schema: ${schemaName}`);
    }
    
    return schema;
  }

  /**
   * Cache schema for performance
   */
  cacheSchema(key, schema) {
    if (this.schemaCache.size >= this.options.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.schemaCache.keys().next().value;
      this.schemaCache.delete(firstKey);
    }
    
    this.schemaCache.set(key, schema);
  }

  /**
   * Format validation errors
   */
  formatValidationErrors(error) {
    if (!error.details) {
      return [{
        field: 'unknown',
        message: error.message,
        value: null
      }];
    }
    
    return error.details.map(detail => ({
      field: detail.path.join('.'),
      message: this.getErrorMessage(detail),
      value: detail.context?.value,
      type: detail.type
    }));
  }

  /**
   * Get error message with custom messages support
   */
  getErrorMessage(detail) {
    const key = `${detail.type}.${detail.path.join('.')}`;
    
    if (this.options.customMessages[key]) {
      return this.options.customMessages[key];
    }
    
    if (this.options.customMessages[detail.type]) {
      return this.options.customMessages[detail.type];
    }
    
    return detail.message;
  }

  /**
   * Default error formatter
   */
  defaultErrorFormatter(errors) {
    return errors.map(error => ({
      field: error.field,
      message: error.message,
      value: error.value
    }));
  }

  /**
   * Sanitize result data
   */
  sanitizeResult(result) {
    if (typeof result !== 'object' || result === null) {
      return;
    }
    
    // Recursively sanitize object
    this.sanitizeObject(result);
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          if (this.options.sanitizeHtml) {
            obj[key] = this.sanitizeHtml(value);
          }
          
          if (this.options.sanitizeSql) {
            obj[key] = this.sanitizeSql(value);
          }
          
          if (this.options.sanitizeXss) {
            obj[key] = this.sanitizeXss(value);
          }
        } else if (typeof value === 'object' && value !== null) {
          this.sanitizeObject(value);
        }
      }
    }
  }

  /**
   * Basic HTML sanitization
   */
  sanitizeHtml(input) {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Basic SQL injection sanitization
   */
  sanitizeSql(input) {
    return input
      .replace(/['"\\]/g, '')
      .replace(/--/g, '')
      .replace(/;/g, '')
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '');
  }

  /**
   * Basic XSS sanitization
   */
  sanitizeXss(input) {
    return input
      .replace(/javascript:/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Update average validation time
   */
  updateAverageValidationTime(validationTime) {
    if (this.stats.totalValidations === 1) {
      this.stats.averageValidationTime = validationTime;
    } else {
      this.stats.averageValidationTime = 
        (this.stats.averageValidationTime * (this.stats.totalValidations - 1) + validationTime) / 
        this.stats.totalValidations;
    }
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    setInterval(() => {
      this.emit('metrics', this.getStats());
    }, 60000); // Every minute
  }

  /**
   * Get validation statistics
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const successRate = this.stats.totalValidations > 0 
      ? (this.stats.successfulValidations / this.stats.totalValidations * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      uptime,
      successRate: parseFloat(successRate),
      averageValidationTime: Math.round(this.stats.averageValidationTime),
      cacheSize: this.schemaCache.size,
      customRulesCount: this.customRules.size,
      errorRate: this.stats.totalValidations > 0 
        ? (this.stats.failedValidations / this.stats.totalValidations * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0,
      errors: [],
      startTime: Date.now()
    };
    
    this.logger.info('Joi validator statistics reset');
  }

  /**
   * Clear schema cache
   */
  clearCache() {
    this.schemaCache.clear();
    this.logger.info('Joi validator schema cache cleared');
  }

  /**
   * Add custom validation rule
   */
  addCustomRule(name, schema) {
    this.customRules.set(name, schema);
    this.logger.info(`Added custom validation rule: ${name}`);
  }

  /**
   * Remove custom validation rule
   */
  removeCustomRule(name) {
    const removed = this.customRules.delete(name);
    if (removed) {
      this.logger.info(`Removed custom validation rule: ${name}`);
    }
    return removed;
  }

  /**
   * Get all custom rules
   */
  getCustomRules() {
    return Array.from(this.customRules.keys());
  }

  /**
   * Create combined schema
   */
  createCombinedSchema(rules, options = {}) {
    const schemaObject = {};
    
    for (const rule of rules) {
      if (this.customRules.has(rule)) {
        schemaObject[rule] = this.customRules.get(rule);
      }
    }
    
    return Joi.object(schemaObject, options);
  }

  /**
   * Validate with custom schema
   */
  async validateWithCustomSchema(data, schemaObject, options = {}) {
    const schema = Joi.object(schemaObject);
    return this.validate(data, schema, options);
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = this.getStats();
      
      // Test basic validation
      const testResult = await this.validate(
        { username: 'test', email: 'test@example.com' },
        'username.email'
      );
      
      return {
        status: testResult.success ? 'healthy' : 'degraded',
        timestamp: Date.now(),
        stats,
        testValidation: testResult.success,
        cacheSize: this.schemaCache.size,
        customRulesCount: this.customRules.size
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
   * Create poker game specific schemas
   */
  createPokerGameSchemas() {
    // User registration schema
    this.addCustomRule('userRegistration', Joi.object({
      username: this.customRules.get('username'),
      email: this.customRules.get('email'),
      password: this.customRules.get('password'),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Password confirmation must match password'
      })
    }));
    
    // Login schema
    this.addCustomRule('login', Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required()
    }));
    
    // Create game schema
    this.addCustomRule('createGame', Joi.object({
      name: Joi.string().min(1).max(50).required(),
      maxPlayers: Joi.number().integer().min(2).max(10).required(),
      buyIn: this.customRules.get('chips'),
      blinds: Joi.object({
        small: Joi.number().integer().min(1).required(),
        big: Joi.number().integer().min(1).required()
      }).required()
    }));
    
    // Join game schema
    this.addCustomRule('joinGame', Joi.object({
      gameId: this.customRules.get('gameId'),
      userId: this.customRules.get('userId'),
      buyIn: this.customRules.get('chips')
    }));
    
    // Bet action schema
    this.addCustomRule('betAction', Joi.object({
      gameId: this.customRules.get('gameId'),
      userId: this.customRules.get('userId'),
      action: Joi.string().valid('bet', 'raise', 'call', 'fold', 'check', 'all-in').required(),
      amount: Joi.when('action', {
        is: Joi.string().valid('bet', 'raise'),
        then: this.customRules.get('betAmount'),
        otherwise: Joi.number().integer().min(0)
      })
    }));
    
    // Tournament registration schema
    this.addCustomRule('tournamentRegistration', Joi.object({
      tournamentId: this.customRules.get('gameId'),
      userId: this.customRules.get('userId'),
      buyIn: this.customRules.get('chips')
    }));
    
    this.logger.info('Created poker game specific schemas');
  }

  /**
   * Get poker game schemas
   */
  getPokerGameSchemas() {
    return [
      'userRegistration',
      'login',
      'createGame',
      'joinGame',
      'betAction',
      'tournamentRegistration'
    ];
  }
}

module.exports = JoiValidator;
