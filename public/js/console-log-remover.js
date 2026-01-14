/**
 * Console Log Remover
 * Removes console.log statements from production code
 */

class ConsoleLogRemover {
  constructor(options = {}) {
    this.options = {
      enableInDevelopment: false,
      preserveErrors: true,
      preserveWarnings: false,
      customLogger: null,
      debugMode: false,
      ...options
    };
    
    this.originalConsole = { ...console };
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    // Check if we're in development
    const isDevelopment = this.isDevelopmentEnvironment();
    
    if (isDevelopment && !this.options.enableInDevelopment) {
      if (this.options.debugMode) {
        console.log('Console logs preserved in development mode');
      }
      return;
    }
    
    this.setupConsoleOverrides();
    this.isInitialized = true;
  }

  isDevelopmentEnvironment() {
    // Check various development indicators
    return (
      process?.env?.NODE_ENV === 'development' ||
      window.location?.hostname === 'localhost' ||
      window.location?.hostname === '127.0.0.1' ||
      window.location?.hostname === '0.0.0.0' ||
      window.location?.port === '3000' ||
      window.location?.port === '5173' ||
      window.location?.port === '8080' ||
      window.location?.href?.includes('localhost') ||
      window.location?.href?.includes('127.0.0.1')
    );
  }

  setupConsoleOverrides() {
    const self = this;
    
    // Override console.log
    console.log = function(...args) {
      if (self.options.customLogger) {
        self.options.customLogger('log', args);
      }
      // Silently ignore in production
    };
    
    // Override console.info
    console.info = function(...args) {
      if (self.options.customLogger) {
        self.options.customLogger('info', args);
      }
      // Silently ignore in production
    };
    
    // Override console.debug
    console.debug = function(...args) {
      if (self.options.customLogger) {
        self.options.customLogger('debug', args);
      }
      // Silently ignore in production
    };
    
    // Conditionally preserve console.warn
    if (!this.options.preserveWarnings) {
      console.warn = function(...args) {
        if (self.options.customLogger) {
          self.options.customLogger('warn', args);
        }
        // Silently ignore in production
      };
    }
    
    // Conditionally preserve console.error
    if (!this.options.preserveErrors) {
      console.error = function(...args) {
        if (self.options.customLogger) {
          self.options.customLogger('error', args);
        }
        // Silently ignore in production
      };
    }
    
    // Override console.trace
    console.trace = function(...args) {
      if (self.options.customLogger) {
        self.options.customLogger('trace', args);
      }
      // Silently ignore in production
    };
    
    // Override console.group
    console.group = function(...args) {
      if (self.options.customLogger) {
        self.options.customLogger('group', args);
      }
      // Silently ignore in production
    };
    
    // Override console.groupEnd
    console.groupEnd = function(...args) {
      if (self.options.customLogger) {
        self.options.customLogger('groupEnd', args);
      }
      // Silently ignore in production
    };
    
    // Override console.table
    console.table = function(...args) {
      if (self.options.customLogger) {
        self.options.customLogger('table', args);
      }
      // Silently ignore in production
    };
    
    // Override console.time
    console.time = function(...args) {
      if (self.options.customLogger) {
        self.options.customLogger('time', args);
      }
      // Silently ignore in production
    };
    
    // Override console.timeEnd
    console.timeEnd = function(...args) {
      if (self.options.customLogger) {
        self.options.customLogger('timeEnd', args);
      }
      // Silently ignore in production
    };
    
    // Override console.count
    console.count = function(...args) {
      if (self.options.customLogger) {
        self.options.customLogger('count', args);
      }
      // Silently ignore in production
    };
    
    // Override console.clear
    console.clear = function(...args) {
      if (self.options.customLogger) {
        self.options.customLogger('clear', args);
      }
      // Silently ignore in production
    };
    
    if (this.options.debugMode) {
      console.warn('Console methods overridden for production');
    }
  }

  // Restore original console methods
  restore() {
    Object.assign(console, this.originalConsole);
    
    if (this.options.debugMode) {
      console.log('Console methods restored to original');
    }
  }

  // Get original console methods
  getOriginalConsole() {
    return { ...this.originalConsole };
  }

  // Check if console is overridden
  isOverridden() {
    return this.isInitialized;
  }

  // Conditional logging utility
  static log(message, ...args) {
    if (this.isDevelopmentEnvironment()) {
      console.log(message, ...args);
    }
  }

  static error(message, ...args) {
    if (this.isDevelopmentEnvironment()) {
      console.error(message, ...args);
    }
  }

  static warn(message, ...args) {
    if (this.isDevelopmentEnvironment()) {
      console.warn(message, ...args);
    }
  }

  static debug(message, ...args) {
    if (this.isDevelopmentEnvironment()) {
      console.debug(message, ...args);
    }
  }

  // Create a safe logger that works in both dev and production
  static createLogger(name, options = {}) {
    return {
      log: (...args) => this.log(`[${name}]`, ...args),
      error: (...args) => this.error(`[${name}]`, ...args),
      warn: (...args) => this.warn(`[${name}]`, ...args),
      debug: (...args) => this.debug(`[${name}]`, ...args),
      info: (...args) => this.log(`[${name}]`, ...args),
      trace: (...args) => this.debug(`[${name}]`, ...args),
      group: (...args) => this.log(`[${name}]`, ...args),
      groupEnd: () => {},
      time: (label) => this.debug(`[${name}] Timer started: ${label}`),
      timeEnd: (label) => this.debug(`[${name}] Timer ended: ${label}`),
      count: (label) => this.debug(`[${name}] Count: ${label}`),
      table: (data) => this.debug(`[${name}] Table:`, data)
    };
  }

  // Cleanup
  destroy() {
    this.restore();
  }
}

// Create global instance
window.consoleLogRemover = new ConsoleLogRemover({
  enableInDevelopment: false,
  preserveErrors: true,
  preserveWarnings: false,
  debugMode: false
});

// Global convenience methods
window.devLog = ConsoleLogRemover.log;
window.devError = ConsoleLogRemover.error;
window.devWarn = ConsoleLogRemover.warn;
window.devDebug = ConsoleLogRemover.debug;
window.createLogger = ConsoleLogRemover.createLogger;

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsoleLogRemover;
}
