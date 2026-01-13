/**
 * Validation Middleware
 * Express middleware for input validation using Joi
 */

const JoiValidator = require('./joi-validator');
const Logger = require('../utils/logger');

const logger = new Logger('validation-middleware');

class ValidationMiddleware {
  constructor(options = {}) {
    this.options = {
      // Validator configuration
      validator: options.validator || new JoiValidator({
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
        enableLogging: true,
        enableSanitization: true
      }),
      
      // Error handling
      errorHandler: options.errorHandler || this.defaultErrorHandler,
      
      // Response format
      sendDetailedErrors: options.sendDetailedErrors !== false,
      includeMetadata: options.includeMetadata !== false,
      
      // Performance
      enableMetrics: options.enableMetrics !== false,
      
      // Skip validation
      skipPaths: options.skipPaths || [],
      skipMethods: options.skipMethods || [],
      skipRoutes: options.skipRoutes || [],
      
      // Custom skip function
      skip: options.skip || (() => false)
    };
    
    this.metrics = {
      totalRequests: 0,
      validatedRequests: 0,
      failedValidations: 0,
      skippedValidations: 0,
      averageValidationTime: 0,
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
   * Create validation middleware
   */
  createMiddleware(schema, options = {}) {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      try {
        this.metrics.totalRequests++;
        
        // Skip validation if conditions are met
        if (this.shouldSkip(req, schema, options)) {
          this.metrics.skippedValidations++;
          return next();
        }
        
        // Determine what to validate
        const validationTarget = this.getValidationTarget(req, options);
        
        if (!validationTarget) {
          this.metrics.skippedValidations++;
          return next();
        }
        
        // Perform validation
        const validationResult = await this.options.validator.validate(
          validationTarget,
          schema,
          options
        );
        
        const validationTime = Date.now() - startTime;
        this.updateAverageValidationTime(validationTime);
        
        if (validationResult.success) {
          this.metrics.validatedRequests++;
          
          // Update request with validated data
          if (options.replaceBody) {
            req.body = validationResult.data;
          } else if (options.addToReq) {
            req.validated = validationResult.data;
          }
          
          // Log successful validation if enabled
          if (this.options.validator.options.enableLogging && this.options.validator.options.logLevel === 'debug') {
            logger.debug('Validation successful', {
              method: req.method,
              url: req.url,
              schema: typeof schema === 'string' ? schema : 'custom',
              validationTime
            });
          }
          
          next();
        } else {
          this.metrics.failedValidations++;
          
          // Handle validation error
          await this.handleValidationError(req, res, validationResult, validationTime);
        }
        
      } catch (error) {
        const validationTime = Date.now() - startTime;
        this.updateAverageValidationTime(validationTime);
        
        this.metrics.errors.push({
          timestamp: Date.now(),
          error: error.message,
          url: req.url,
          method: req.method,
          validationTime
        });
        
        // Keep only last 100 errors
        if (this.metrics.errors.length > 100) {
          this.metrics.errors = this.metrics.errors.slice(-100);
        }
        
        logger.error('Validation middleware error', {
          error: error.message,
          url: req.url,
          method: req.method
        });
        
        next(error);
      }
    };
  }

  /**
   * Determine if validation should be skipped
   */
  shouldSkip(req, schema, options) {
    // Custom skip function
    if (this.options.skip(req, schema, options)) {
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
    
    // Skip by route
    if (this.options.skipRoutes.length > 0) {
      for (const route of this.options.skipRoutes) {
        if (this.matchRoute(req, route)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get validation target from request
   */
  getValidationTarget(req, options) {
    const source = options.source || 'body';
    
    switch (source) {
      case 'body':
        return req.body;
      case 'query':
        return req.query;
      case 'params':
        return req.params;
      case 'headers':
        return req.headers;
      case 'cookies':
        return req.cookies;
      case 'all':
        return {
          body: req.body,
          query: req.query,
          params: req.params,
          headers: req.headers,
          cookies: req.cookies
        };
      default:
        return req[source];
    }
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
   * Match route against pattern
   */
  matchRoute(req, route) {
    if (typeof route === 'string') {
      return this.matchPath(req.path, route);
    }
    
    if (typeof route === 'object') {
      const pathMatch = route.path ? this.matchPath(req.path, route.path) : true;
      const methodMatch = route.method ? req.method === route.method.toUpperCase() : true;
      
      return pathMatch && methodMatch;
    }
    
    return false;
  }

  /**
   * Handle validation error
   */
  async handleValidationError(req, res, validationResult, validationTime) {
    // Log validation failure
    if (this.options.validator.options.enableLogging) {
      logger.warn('Validation failed', {
        method: req.method,
        url: req.url,
        errors: validationResult.errors,
        validationTime
      });
    }
    
    // Call custom error handler if provided
    if (this.options.errorHandler) {
      await this.options.errorHandler(req, res, validationResult);
      return;
    }
    
    // Default error handling
    this.defaultErrorHandler(req, res, validationResult);
  }

  /**
   * Default error handler
   */
  defaultErrorHandler(req, res, validationResult) {
    const response = {
      success: false,
      error: 'Validation failed',
      message: 'Invalid input data'
    };
    
    // Add detailed errors if enabled
    if (this.options.sendDetailedErrors) {
      response.errors = validationResult.errors;
    }
    
    // Add metadata if enabled
    if (this.options.includeMetadata) {
      response.metadata = validationResult.metadata;
    }
    
    res.status(400);
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  }

  /**
   * Update average validation time
   */
  updateAverageValidationTime(validationTime) {
    if (this.metrics.totalRequests === 1) {
      this.metrics.averageValidationTime = validationTime;
    } else {
      this.metrics.averageValidationTime = 
        (this.metrics.averageValidationTime * (this.metrics.totalRequests - 1) + validationTime) / 
        this.metrics.totalRequests;
    }
  }

  /**
   * Create body validation middleware
   */
  validateBody(schema, options = {}) {
    return this.createMiddleware(schema, { ...options, source: 'body' });
  }

  /**
   * Create query validation middleware
   */
  validateQuery(schema, options = {}) {
    return this.createMiddleware(schema, { ...options, source: 'query' });
  }

  /**
   * Create params validation middleware
   */
  validateParams(schema, options = {}) {
    return this.createMiddleware(schema, { ...options, source: 'params' });
  }

  /**
   * Create headers validation middleware
   */
  validateHeaders(schema, options = {}) {
    return this.createMiddleware(schema, { ...options, source: 'headers' });
  }

  /**
   * Create cookies validation middleware
   */
  validateCookies(schema, options = {}) {
    return this.createMiddleware(schema, { ...options, source: 'cookies' });
  }

  /**
   * Create combined validation middleware
   */
  validateAll(schemas, options = {}) {
    return this.createMiddleware(schemas, { ...options, source: 'all' });
  }

  /**
   * Create conditional validation middleware
   */
  validateIf(condition, schema, options = {}) {
    return async (req, res, next) => {
      if (typeof condition === 'function' ? condition(req) : condition) {
        return this.createMiddleware(schema, options)(req, res, next);
      }
      
      next();
    };
  }

  /**
   * Create validation middleware for specific HTTP methods
   */
  validateForMethods(methods, schema, options = {}) {
    return this.validateIf(
      (req) => methods.includes(req.method.toLowerCase()),
      schema,
      options
    );
  }

  /**
   * Create validation middleware for specific paths
   */
  validateForPaths(paths, schema, options = {}) {
    return this.validateIf(
      (req) => paths.some(path => this.matchPath(req.path, path)),
      schema,
      options
    );
  }

  /**
   * Create validation middleware with custom error handler
   */
  validateWithHandler(schema, errorHandler, options = {}) {
    return this.createMiddleware(schema, {
      ...options,
      errorHandler
    });
  }

  /**
   * Apply validation to Express app
   */
  applyToApp(app, validations = {}) {
    // Apply global validations
    if (validations.global) {
      app.use(this.createMiddleware(validations.global.schema, validations.global.options));
    }
    
    // Apply path-specific validations
    if (validations.paths) {
      for (const [path, config] of Object.entries(validations.paths)) {
        app.use(path, this.createMiddleware(config.schema, config.options));
      }
    }
    
    // Apply method-specific validations
    if (validations.methods) {
      for (const [method, config] of Object.entries(validations.methods)) {
        app.use(this.validateForMethods([method], config.schema, config.options));
      }
    }
    
    logger.info('Validation middleware applied to Express app', {
      global: !!validations.global,
      pathCount: Object.keys(validations.paths || {}).length,
      methodCount: Object.keys(validations.methods || {}).length
    });
  }

  /**
   * Get middleware statistics
   */
  getStats() {
    const uptime = Date.now() - this.metrics.startTime;
    const validationRate = this.metrics.totalRequests > 0 
      ? (this.metrics.validatedRequests / this.metrics.totalRequests * 100).toFixed(2)
      : 0;
    const errorRate = this.metrics.totalRequests > 0 
      ? (this.metrics.failedValidations / this.metrics.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      ...this.metrics,
      uptime,
      validationRate: parseFloat(validationRate),
      errorRate: parseFloat(errorRate),
      averageValidationTime: Math.round(this.metrics.averageValidationTime),
      skipRate: this.metrics.totalRequests > 0 
        ? (this.metrics.skippedValidations / this.metrics.totalRequests * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Reset middleware statistics
   */
  resetStats() {
    this.metrics = {
      totalRequests: 0,
      validatedRequests: 0,
      failedValidations: 0,
      skippedValidations: 0,
      averageValidationTime: 0,
      errors: [],
      startTime: Date.now()
    };
    
    this.logger.info('Validation middleware statistics reset');
  }

  /**
   * Get health status
   */
  async healthCheck() {
    try {
      const stats = this.getStats();
      const validatorHealth = await this.options.validator.healthCheck();
      
      return {
        status: validatorHealth.status === 'healthy' && stats.errorRate < 5 ? 'healthy' : 'degraded',
        timestamp: Date.now(),
        stats,
        validator: validatorHealth
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
   * Create validation middleware for poker game
   */
  createPokerGameValidations() {
    // Create poker game schemas
    this.options.validator.createPokerGameSchemas();
    
    return {
      // User registration validation
      userRegistration: this.validateBody('userRegistration', {
        source: 'body',
        replaceBody: true
      }),
      
      // Login validation
      login: this.validateBody('login', {
        source: 'body',
        replaceBody: true
      }),
      
      // Create game validation
      createGame: this.validateBody('createGame', {
        source: 'body',
        replaceBody: true
      }),
      
      // Join game validation
      joinGame: this.validateBody('joinGame', {
        source: 'body',
        replaceBody: true
      }),
      
      // Bet action validation
      betAction: this.validateBody('betAction', {
        source: 'body',
        replaceBody: true
      }),
      
      // Tournament registration validation
      tournamentRegistration: this.validateBody('tournamentRegistration', {
        source: 'body',
        replaceBody: true
      }),
      
      // Game ID validation (params)
      gameId: this.validateParams('gameId', {
        source: 'params'
      }),
      
      // Pagination validation (query)
      pagination: this.validateQuery('pagination', {
        source: 'query'
      }),
      
      // Date range validation (query)
      dateRange: this.validateQuery('dateRange', {
        source: 'query'
      })
    };
  }

  /**
   * Get validator instance
   */
  getValidator() {
    return this.options.validator;
  }

  /**
   * Update validator configuration
   */
  updateValidatorConfig(newOptions) {
    this.options.validator = new JoiValidator({
      ...this.options.validator.options,
      ...newOptions
    });
    
    logger.info('Validator configuration updated');
  }

  /**
   * Add custom validation rule
   */
  addCustomRule(name, schema) {
    this.options.validator.addCustomRule(name, schema);
  }

  /**
   * Remove custom validation rule
   */
  removeCustomRule(name) {
    return this.options.validator.removeCustomRule(name);
  }

  /**
   * Get all custom rules
   */
  getCustomRules() {
    return this.options.validator.getCustomRules();
  }
}

module.exports = ValidationMiddleware;
