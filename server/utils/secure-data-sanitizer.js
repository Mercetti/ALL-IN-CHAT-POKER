/**
 * Secure Data Sanitizer
 * Prevents PII and secrets from being exported to training files
 */

const Logger = require('./logger');

class SecureDataSanitizer {
  constructor() {
    this.logger = new Logger('secure-data-sanitizer');
    
    // Patterns for sensitive data
    this.patterns = {
      // Email addresses
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      
      // Phone numbers (US format)
      phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      
      // Social Security Numbers
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      
      // Credit card numbers
      creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      
      // API keys and tokens
      apiKey: /(?:api[_-]?key|token|secret|password)[\s:=]+['"]?([a-zA-Z0-9_\-\.+=\/]{16,})['"]?/gi,
      
      // URLs that might contain sensitive info
      url: /https?:\/\/[^\s<>"']+/gi,
      
      // IP addresses
      ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      
      // Database connection strings
      connectionString: /(?:mongodb|mysql|postgres|redis):\/\/[^\s<>"']+/gi,
      
      // JWT tokens
      jwt: /eyJ[a-zA-Z0-9_\-\.]*\.[a-zA-Z0-9_\-\.]*\.[a-zA-Z0-9_\-\.]*/g,
      
      // Private keys
      privateKey: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
      
      // Passwords in logs
      password: /password[\s:=]+['"]?([^\s'"`]{6,})['"]?/gi
    };
    
    // Redaction methods
    this.redactionMethods = {
      full: (match) => '[REDACTED]',
      partial: (match, keepChars = 2) => {
        if (match.length <= keepChars * 2) {
          return '[REDACTED]';
        }
        const start = match.substring(0, keepChars);
        const end = match.substring(match.length - keepChars);
        const middle = '*'.repeat(match.length - (keepChars * 2));
        return `${start}${middle}${end}`;
      },
      hash: (match) => `[HASH:${require('crypto').createHash('sha256').update(match).digest('hex').substring(0, 8)}]`,
      type: (match, type) => `[${type.toUpperCase()}]`
    };
  }

  /**
   * Sanitize data for training export
   */
  sanitizeForTraining(data, options = {}) {
    const defaults = {
      redactEmail: true,
      redactPhone: true,
      redactSSN: true,
      redactCreditCard: true,
      redactAPIKeys: true,
      redactURLs: false,
      redactIPs: true,
      redactPasswords: true,
      preserveStructure: true,
      logLevel: 'warn'
    };

    const config = { ...defaults, ...options };
    
    this.logger.info('Sanitizing data for training export', {
      dataKeys: Object.keys(data || {}),
      redactionConfig: config
    });

    const sanitized = this.sanitizeObject(data, config);
    
    this.logger.info('Data sanitization complete', {
      originalKeys: Object.keys(data || {}),
      sanitizedKeys: Object.keys(sanitized),
      redactionsMade: this.getRedactionCount()
    });

    return sanitized;
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj, config) {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj !== 'object') {
      return this.sanitizeValue(obj, config);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, config));
    }

    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive keys entirely
      if (this.isSensitiveKey(key)) {
        this.logRedaction(key, 'sensitive_key', config.logLevel);
        continue;
      }

      sanitized[key] = this.sanitizeObject(value, config);
    }

    return sanitized;
  }

  /**
   * Sanitize individual values
   */
  sanitizeValue(value, config) {
    if (typeof value !== 'string') {
      return value;
    }

    let sanitized = value;
    let redactionCount = 0;

    // Apply redaction patterns
    if (config.redactEmail) {
      sanitized = sanitized.replace(this.patterns.email, (match) => {
        redactionCount++;
        this.logRedaction('email', 'email', config.logLevel);
        return this.redactionMethods.partial(match, 2);
      });
    }

    if (config.redactPhone) {
      sanitized = sanitized.replace(this.patterns.phone, (match) => {
        redactionCount++;
        this.logRedaction('phone', 'phone', config.logLevel);
        return this.redactionMethods.partial(match, 3);
      });
    }

    if (config.redactSSN) {
      sanitized = sanitized.replace(this.patterns.ssn, (match) => {
        redactionCount++;
        this.logRedaction('ssn', 'social security number', config.logLevel);
        return this.redactionMethods.type(match, 'SSN');
      });
    }

    if (config.redactCreditCard) {
      sanitized = sanitized.replace(this.patterns.creditCard, (match) => {
        redactionCount++;
        this.logRedaction('credit_card', 'credit card', config.logLevel);
        return this.redactionMethods.partial(match, 4);
      });
    }

    if (config.redactAPIKeys) {
      sanitized = sanitized.replace(this.patterns.apiKey, (match, full) => {
        redactionCount++;
        this.logRedaction('api_key', 'API key/secret', config.logLevel);
        return this.redactionMethods.type(full, 'API_KEY');
      });
    }

    if (config.redactURLs) {
      sanitized = sanitized.replace(this.patterns.url, (match) => {
        redactionCount++;
        this.logRedaction('url', 'URL', config.logLevel);
        return this.redactionMethods.type(match, 'URL');
      });
    }

    if (config.redactIPs) {
      sanitized = sanitized.replace(this.patterns.ipAddress, (match) => {
        redactionCount++;
        this.logRedaction('ip', 'IP address', config.logLevel);
        return this.redactionMethods.type(match, 'IP');
      });
    }

    if (config.redactPasswords) {
      sanitized = sanitized.replace(this.patterns.password, (match, full) => {
        redactionCount++;
        this.logRedaction('password', 'password', config.logLevel);
        return this.redactionMethods.type(full, 'PASSWORD');
      });
    }

    // Additional sanitizations
    sanitized = this.removeScriptTags(sanitized);
    sanitized = this.removeSQLInjection(sanitized);
    sanitized = this.normalizeWhitespace(sanitized);

    return sanitized;
  }

  /**
   * Check if key is sensitive
   */
  isSensitiveKey(key) {
    const sensitiveKeys = [
      'password', 'passwd', 'secret', 'token', 'key', 'apikey',
      'authorization', 'auth', 'credentials', 'private', 'confidential',
      'ssn', 'social_security', 'credit_card', 'cc_number',
      'bank_account', 'routing_number', 'pin', 'cvv', 'cvc'
    ];

    const lowerKey = key.toLowerCase();
    return sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
  }

  /**
   * Remove script tags
   */
  removeScriptTags(text) {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT_REMOVED]')
      .replace(/javascript:/gi, '[JS_REMOVED]')
      .replace(/on\w+\s*=/gi, '[EVENT_REMOVED]');
  }

  /**
   * Remove SQL injection patterns
   */
  removeSQLInjection(text) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(--|\/\*|\*\/|;|'|")/g
    ];

    let sanitized = text;
    for (const pattern of sqlPatterns) {
      sanitized = sanitized.replace(pattern, '[SQL_REMOVED]');
    }

    return sanitized;
  }

  /**
   * Normalize whitespace
   */
  normalizeWhitespace(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }

  /**
   * Log redaction
   */
  logRedaction(type, description, level = 'warn') {
    this.logger[level](`Redacted sensitive data: ${description}`, {
      type,
      timestamp: Date.now()
    });
  }

  /**
   * Get redaction statistics
   */
  getRedactionCount() {
    // This would be tracked during actual usage
    return {
      email: 0,
      phone: 0,
      ssn: 0,
      creditCard: 0,
      apiKey: 0,
      url: 0,
      ip: 0,
      password: 0,
      total: 0
    };
  }

  /**
   * Validate data for export
   */
  validateForExport(data) {
    const issues = [];
    
    if (!data || typeof data !== 'object') {
      issues.push('Invalid data structure');
      return { valid: false, issues };
    }

    // Check for remaining sensitive patterns
    const dataString = JSON.stringify(data);
    
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      const matches = dataString.match(pattern);
      if (matches && matches.length > 0) {
        issues.push(`Found ${patternName} patterns in export data`);
      }
    }

    // Check data size
    const sizeKB = Buffer.byteLength(dataString, 'utf8') / 1024;
    if (sizeKB > 1024 * 10) { // 10MB limit
      issues.push(`Export data too large: ${sizeKB.toFixed(2)}KB`);
    }

    return {
      valid: issues.length === 0,
      issues,
      sizeKB,
      recordCount: Array.isArray(data) ? data.length : Object.keys(data).length
    };
  }

  /**
   * Create export summary
   */
  createExportSummary(originalData, sanitizedData, options) {
    return {
      timestamp: Date.now(),
      original: {
        sizeKB: Buffer.byteLength(JSON.stringify(originalData), 'utf8') / 1024,
        recordCount: Array.isArray(originalData) ? originalData.length : Object.keys(originalData).length
      },
      sanitized: {
        sizeKB: Buffer.byteLength(JSON.stringify(sanitizedData), 'utf8') / 1024,
        recordCount: Array.isArray(sanitizedData) ? sanitizedData.length : Object.keys(sanitizedData).length
      },
      redactions: this.getRedactionCount(),
      options,
      validation: this.validateForExport(sanitizedData)
    };
  }
}

module.exports = SecureDataSanitizer;
