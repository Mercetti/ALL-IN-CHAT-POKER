/**
 * Secure Data Sanitizer - Simplified Version
 * Basic data sanitization functionality
 */

const logger = require('./logger');

class SecureDataSanitizer {
  constructor() {
    this.sanitizedCount = 0;
  }

  /**
   * Initialize data sanitizer
   */
  async initialize() {
    logger.info('Secure Data Sanitizer initialized');
    return true;
  }

  /**
   * Sanitize data
   */
  sanitize(data) {
    this.sanitizedCount++;
    
    if (typeof data === 'string') {
      return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitize(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Get sanitizer status
   */
  getStatus() {
    return {
      sanitizedCount: this.sanitizedCount,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const secureDataSanitizer = new SecureDataSanitizer();

module.exports = secureDataSanitizer;
