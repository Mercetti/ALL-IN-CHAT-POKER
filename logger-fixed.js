/**
 * Logger implementation with fixes for testing
 */

class Logger {
  static instance = null;
  logs = [];
  maxLogSize = 1000;

  static getInstance(serviceName = 'app') {
    if (!Logger.instance) {
      Logger.instance = new Logger(serviceName);
    }
    return Logger.instance;
  }

  constructor(serviceName = 'app') {
    this.serviceName = serviceName;
  }

  log(message, context = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context
    };

    this.logs.push(entry);

    // Keep log size manageable
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
  }

  error(message, error = null, context = null) {
    // Handle case where metadata is passed as second argument
    if (error && typeof error === 'object' && !(error instanceof Error)) {
      // error is actually metadata/context
      context = error;
      error = null;
    }
    
    const errorMessage = error ? `${message}: ${error.message || error}` : message;
    this.addEntry('error', errorMessage, context);
  }

  warn(message, context = null) {
    this.addEntry('warn', message, context);
  }

  info(message, context = null) {
    this.addEntry('info', message, context);
  }

  debug(message, context = null) {
    this.addEntry('debug', message, context);
  }

  addEntry(level, message, context = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    this.logs.push(entry);

    // Keep log size manageable
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
  }

  getRecentLogs(limit = 100, level = null) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  getLogsByLevel() {
    return this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});
  }

  async exportLogs() {
    const logData = {
      exportTime: new Date().toISOString(),
      totalEntries: this.logs.length,
      entries: this.logs
    };
    
    // Safe serialization with circular reference protection
    const seen = new WeakSet();
    const replacer = (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    };
    
    return JSON.stringify(logData, replacer, 2);
  }

  clearLogs() {
    this.logs = [];
    this.log('Logs cleared');
  }

  getMetrics() {
    const last24Hours = this.logs.filter(
      log => new Date(log.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );

    return {
      totalLogs: this.logs.length,
      last24Hours: last24Hours.length,
      byLevel: this.getLogsByLevel(),
      errorRate: last24Hours.length > 0 ? 
        (last24Hours.filter(log => log.level === 'error').length / last24Hours.length * 100).toFixed(2) : 
        '0'
    };
  }
}

module.exports = { Logger };
