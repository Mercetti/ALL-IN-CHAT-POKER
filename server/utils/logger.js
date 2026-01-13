/**
 * Centralized logging utility for the poker game server
 * Replaces console statements with proper logging levels
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    this.currentLevel = isDevelopment ? this.levels.debug : this.levels.info;
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return { prefix, message, args };
  }

  error(message, ...args) {
    if (this.currentLevel >= this.levels.error) {
      const { prefix, message: msg, args: a } = this.formatMessage('error', message, ...args);
      if (isDevelopment || isTest) {
        console.error(prefix, msg, ...a);
      } else {
        // In production, you'd send this to a logging service
        console.error(prefix, msg);
      }
    }
  }

  warn(message, ...args) {
    if (this.currentLevel >= this.levels.warn) {
      const { prefix, message: msg, args: a } = this.formatMessage('warn', message, ...args);
      if (isDevelopment || isTest) {
        console.warn(prefix, msg, ...a);
      } else {
        // In production, you'd send this to a logging service
        console.warn(prefix, msg);
      }
    }
  }

  info(message, ...args) {
    if (this.currentLevel >= this.levels.info) {
      const { prefix, message: msg, args: a } = this.formatMessage('info', message, ...args);
      if (isDevelopment || isTest) {
        console.info(prefix, msg, ...a);
      } else {
        // In production, you'd send this to a logging service
        console.info(prefix, msg);
      }
    }
  }

  debug(message, ...args) {
    if (this.currentLevel >= this.levels.debug) {
      const { prefix, message: msg, args: a } = this.formatMessage('debug', message, ...args);
      if (isDevelopment || isTest) {
        console.debug(prefix, msg, ...a);
      }
      // No debug logging in production
    }
  }

  // Specialized logging methods for different contexts
  security(message, ...args) {
    this.warn(`[SECURITY] ${message}`, ...args);
  }

  performance(message, ...args) {
    this.info(`[PERFORMANCE] ${message}`, ...args);
  }

  memory(message, ...args) {
    this.info(`[MEMORY] ${message}`, ...args);
  }

  api(message, ...args) {
    this.info(`[API] ${message}`, ...args);
  }

  websocket(message, ...args) {
    this.info(`[WEBSOCKET] ${message}`, ...args);
  }

  database(message, ...args) {
    this.info(`[DATABASE] ${message}`, ...args);
  }

  auth(message, ...args) {
    this.info(`[AUTH] ${message}`, ...args);
  }

  ai(message, ...args) {
    this.info(`[AI] ${message}`, ...args);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
