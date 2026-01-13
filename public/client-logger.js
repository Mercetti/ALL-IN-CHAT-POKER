/**
 * Client-side logging utility
 * Replaces console statements with environment-aware logging
 */

class ClientLogger {
  constructor() {
    this.isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '0.0.0.0' ||
                        window.location.search.includes('debug=true');
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    // In production, only show errors and warnings
    this.currentLevel = this.isDevelopment ? this.levels.debug : this.levels.warn;
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return { prefix, message, args };
  }

  error(message, ...args) {
    if (this.currentLevel >= this.levels.error) {
      const { prefix, message: msg, args: a } = this.formatMessage('error', message, ...args);
      console.error(prefix, msg, ...a);
      
      // In production, send errors to monitoring service
      if (!this.isDevelopment) {
        this.sendToMonitoring('error', message, args);
      }
    }
  }

  warn(message, ...args) {
    if (this.currentLevel >= this.levels.warn) {
      const { prefix, message: msg, args: a } = this.formatMessage('warn', message, ...args);
      console.warn(prefix, msg, ...a);
    }
  }

  info(message, ...args) {
    if (this.currentLevel >= this.levels.info) {
      const { prefix, message: msg, args: a } = this.formatMessage('info', message, ...args);
      console.info(prefix, msg, ...a);
    }
  }

  debug(message, ...args) {
    if (this.currentLevel >= this.levels.debug) {
      const { prefix, message: msg, args: a } = this.formatMessage('debug', message, ...args);
      console.debug(prefix, msg, ...a);
    }
  }

  // Specialized logging methods for different contexts
  auth(message, ...args) {
    this.info(`[AUTH] ${message}`, ...args);
  }

  api(message, ...args) {
    this.info(`[API] ${message}`, ...args);
  }

  ui(message, ...args) {
    this.debug(`[UI] ${message}`, ...args);
  }

  performance(message, ...args) {
    this.info(`[PERF] ${message}`, ...args);
  }

  serviceWorker(message, ...args) {
    this.info(`[SW] ${message}`, ...args);
  }

  theme(message, ...args) {
    this.debug(`[THEME] ${message}`, ...args);
  }

  animation(message, ...args) {
    this.debug(`[ANIM] ${message}`, ...args);
  }

  // Send errors to monitoring service in production
  sendToMonitoring(level, message, args) {
    try {
      // Send to error reporting service
      if (window.errorReporting) {
        window.errorReporting.captureException(new Error(message), {
          extra: { args, level, context: 'client' }
        });
      }
      
      // Or send to custom endpoint
      if (window.fetch) {
        fetch('/api/client-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            message,
            args,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          })
        }).catch(() => {
          // Silently fail to avoid infinite loops
        });
      }
    } catch (e) {
      // Silently fail
    }
  }

  // Performance measurement helper
  time(label) {
    if (this.currentLevel >= this.levels.debug) {
      console.time(`${this.formatMessage('debug', '').prefix} ${label}`);
    }
  }

  timeEnd(label) {
    if (this.currentLevel >= this.levels.debug) {
      console.timeEnd(`${this.formatMessage('debug', '').prefix} ${label}`);
    }
  }

  // Group logging
  group(label) {
    if (this.currentLevel >= this.levels.debug) {
      console.group(`${this.formatMessage('debug', '').prefix} ${label}`);
    }
  }

  groupEnd() {
    if (this.currentLevel >= this.levels.debug) {
      console.groupEnd();
    }
  }

  // Table logging for structured data
  table(data, label) {
    if (this.currentLevel >= this.levels.debug) {
      if (label) {
        console.group(`${this.formatMessage('debug', '').prefix} ${label}`);
        console.table(data);
        console.groupEnd();
      } else {
        console.table(data);
      }
    }
  }
}

// Create singleton instance
const clientLogger = new ClientLogger();

// Global exports for backward compatibility
window.logger = clientLogger;

// Replace console methods with our logger (optional - can be disabled)
if (window.location.search.includes('replaceConsole=true')) {
  window.console = {
    error: (...args) => clientLogger.error(...args),
    warn: (...args) => clientLogger.warn(...args),
    info: (...args) => clientLogger.info(...args),
    debug: (...args) => clientLogger.debug(...args),
    log: (...args) => clientLogger.info(...args),
    time: (label) => clientLogger.time(label),
    timeEnd: (label) => clientLogger.timeEnd(label),
    group: (label) => clientLogger.group(label),
    groupEnd: () => clientLogger.groupEnd(),
    table: (data, label) => clientLogger.table(data, label)
  };
}

export default clientLogger;
