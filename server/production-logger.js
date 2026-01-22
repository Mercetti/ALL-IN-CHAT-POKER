/**
 * Production logging and monitoring system
 * Structured logging, error tracking, and performance monitoring
 */

const winston = require('winston');
const path = require('path');

class ProductionLogger {
  constructor() {
    this.loggers = {};
    this.init();
  }

  init() {
    // Create log directory if it doesn't exist
    const fs = require('fs');
    const logDir = path.join(process.cwd(), 'logs');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Create different loggers for different purposes
    this.loggers.app = this.createAppLogger();
    this.loggers.access = this.createAccessLogger();
    this.loggers.error = this.createErrorLogger();
    this.loggers.security = this.createSecurityLogger();
    this.loggers.performance = this.createPerformanceLogger();
  }

  createAppLogger() {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta,
            service: 'poker-game',
            version: process.env.npm_package_version || '1.0.0'
          });
        })
      ),
      defaultMeta: {
        service: 'poker-game',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        new winston.transports.File({
          filename: path.join('logs', 'app.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          tailable: true
        }),
        new winston.transports.File({
          filename: path.join('logs', 'app-error.log'),
          level: 'error',
          maxsize: 10485760,
          maxFiles: 5,
          tailable: true
        })
      ]
    });
  }

  createAccessLogger() {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(({ timestamp, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            type: 'access',
            ...meta
          });
        })
      ),
      transports: [
        new winston.transports.File({
          filename: path.join('logs', 'access.log'),
          maxsize: 10485760,
          maxFiles: 10,
          tailable: true
        })
      ]
    });
  }

  createErrorLogger() {
    return winston.createLogger({
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            stack,
            ...meta,
            type: 'error'
          });
        })
      ),
      transports: [
        new winston.transports.File({
          filename: path.join('logs', 'error.log'),
          maxsize: 10485760,
          maxFiles: 5,
          tailable: true
        })
      ]
    });
  }

  createSecurityLogger() {
    return winston.createLogger({
      level: 'warn',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta,
            type: 'security'
          });
        })
      ),
      transports: [
        new winston.transports.File({
          filename: path.join('logs', 'security.log'),
          maxsize: 10485760,
          maxFiles: 10,
          tailable: true
        })
      ]
    });
  }

  createPerformanceLogger() {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(({ timestamp, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            type: 'performance',
            ...meta
          });
        })
      ),
      transports: [
        new winston.transports.File({
          filename: path.join('logs', 'performance.log'),
          maxsize: 10485760,
          maxFiles: 5,
          tailable: true
        })
      ]
    });
  }

  // Convenience methods
  info(message, meta = {}) {
    this.loggers.app.info(message, meta);
  }

  warn(message, meta = {}) {
    this.loggers.app.warn(message, meta);
  }

  error(message, meta = {}) {
    this.loggers.app.error(message, meta);
    this.loggers.error.error(message, meta);
  }

  debug(message, meta = {}) {
    this.loggers.app.debug(message, meta);
  }

  // Specialized logging methods
  logAccess(req, res, responseTime) {
    this.loggers.access.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.login || 'anonymous'
    });
  }

  logSecurity(event, details) {
    this.loggers.security.warn(event, {
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  logPerformance(operation, duration, details = {}) {
    this.loggers.performance.info(operation, {
      duration,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  logError(error, context = {}) {
    this.loggers.error.error('Application Error', {
      message: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  // Health check endpoint
  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  // Log rotation and cleanup
  cleanup() {
    // Winston handles log rotation automatically
    // Add any additional cleanup logic here
  }
}

// Create singleton instance
const logger = new ProductionLogger();

// Add console transport for non-production
if (process.env.NODE_ENV !== 'production') {
  logger.loggers.app.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Express middleware for request logging
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logAccess(req, res, responseTime);
  
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.logError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.login || 'anonymous'
  });
  
  // Don't expose error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
  
  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = {
  ProductionLogger,
  logger,
  requestLogger,
  errorHandler
};
