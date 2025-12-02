/**
 * Structured logging module with levels and colored output
 */

const config = require('./config');

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
};

const LEVEL_COLORS = {
  error: COLORS.red,
  warn: COLORS.yellow,
  info: COLORS.green,
  debug: COLORS.blue,
};

class Logger {
  constructor(serviceName = 'app', level = config.LOG_LEVEL) {
    this.serviceName = serviceName;
    this.level = LEVELS[level] !== undefined ? level : 'info';
  }

  /**
   * Log a message at specified level
   * @param {string} level - Log level (error, warn, info, debug)
   * @param {string} message - Message to log
   * @param {any} data - Optional data object to log
   */
  log(level, message, data = null) {
    if (LEVELS[level] > LEVELS[this.level]) {
      return; // Skip logging if below current level
    }

    const timestamp = new Date().toISOString();
    const color = LEVEL_COLORS[level] || COLORS.reset;
    const levelStr = level.toUpperCase().padEnd(5);
    const prefix = `${COLORS.gray}${timestamp}${COLORS.reset} ${color}${levelStr}${COLORS.reset} [${this.serviceName}]`;

    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  debug(message, data = null) {
    this.log('debug', message, data);
  }
}

module.exports = Logger;
