/**
 * Input Validation System
 * Comprehensive input validation for all API endpoints and user inputs
 */

class InputValidator {
  constructor(options = {}) {
    this.options = {
      enableStrictMode: true,
      enableSanitization: true,
      enableLogging: true,
      customValidators: {},
      ...options
    };
    
    this.validationRules = new Map();
    this.sanitizers = new Map();
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    this.setupDefaultRules();
    this.setupSanitizers();
    this.isInitialized = true;
  }

  setupDefaultRules() {
    // String validation rules
    this.validationRules.set('string', {
      type: 'string',
      required: false,
      minLength: 0,
      maxLength: 10000,
      pattern: null,
      sanitize: true
    });
    
    // Email validation
    this.validationRules.set('email', {
      type: 'string',
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 254,
      sanitize: true
    });
    
    // Username validation
    this.validationRules.set('username', {
      type: 'string',
      required: false,
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_-]+$/,
      sanitize: true
    });
    
    // Password validation
    this.validationRules.set('password', {
      type: 'string',
      required: false,
      minLength: 8,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      sanitize: false
    });
    
    // Number validation
    this.validationRules.set('number', {
      type: 'number',
      required: false,
      min: Number.NEGATIVE_INFINITY,
      max: Number.POSITIVE_INFINITY,
      integer: false
    });
    
    // Integer validation
    this.validationRules.set('integer', {
      type: 'number',
      required: false,
      min: Number.NEGATIVE_INFINITY,
      max: Number.POSITIVE_INFINITY,
      integer: true
    });
    
    // Boolean validation
    this.validationRules.set('boolean', {
      type: 'boolean',
      required: false
    });
    
    // Array validation
    this.validationRules.set('array', {
      type: 'array',
      required: false,
      minLength: 0,
      maxLength: 1000,
      itemType: null
    });
    
    // Object validation
    this.validationRules.set('object', {
      type: 'object',
      required: false,
      strict: true,
      allowedKeys: null
    });
    
    // URL validation
    this.validationRules.set('url', {
      type: 'string',
      required: false,
      pattern: /^https?:\/\/.+/,
      maxLength: 2048,
      sanitize: true
    });
    
    // ID validation (UUID or alphanumeric)
    this.validationRules.set('id', {
      type: 'string',
      required: false,
      pattern: /^[a-zA-Z0-9_-]+$/,
      maxLength: 50,
      sanitize: true
    });
    
    // Token validation
    this.validationRules.set('token', {
      type: 'string',
      required: false,
      minLength: 10,
      maxLength: 500,
      pattern: /^[a-zA-Z0-9._-]+$/,
      sanitize: false
    });
    
    // HTML content validation
    this.validationRules.set('html', {
      type: 'string',
      required: false,
      maxLength: 50000,
      sanitize: true,
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'span', 'div', 'a', 'img'],
      allowedAttributes: {
        'a': ['href', 'title', 'target'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        '*': ['class', 'id']
      }
    });
  }

  setupSanitizers() {
    // String sanitizer
    this.sanitizers.set('string', (value) => {
      if (typeof value !== 'string') return value;
      
      return value
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/data:/gi, ''); // Remove data: URLs
    });
    
    // Number sanitizer
    this.sanitizers.set('number', (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      }
      return null;
    });
    
    // Boolean sanitizer
    this.sanitizers.set('boolean', (value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);
    });
    
    // Array sanitizer
    this.sanitizers.set('array', (value) => {
      if (!Array.isArray(value)) return [];
      return value.filter(item => item !== null && item !== undefined);
    });
    
    // Email sanitizer
    this.sanitizers.set('email', (value) => {
      if (typeof value !== 'string') return value;
      return value.toLowerCase().trim();
    });
    
    // URL sanitizer
    this.sanitizers.set('url', (value) => {
      if (typeof value !== 'string') return value;
      
      try {
        const url = new URL(value);
        // Only allow http and https protocols
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return '#';
        }
        return url.toString();
      } catch (error) {
        return '#';
      }
    });
    
    // HTML sanitizer
    this.sanitizers.set('html', (value) => {
      if (typeof value !== 'string') return value;
      
      // Basic HTML sanitization
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^>]*>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    });
  }

  validate(value, ruleName, options = {}) {
    const rule = this.getRule(ruleName, options);
    const result = {
      valid: true,
      value: value,
      errors: []
    };
    
    try {
      // Type validation
      if (!this.validateType(value, rule.type)) {
        result.valid = false;
        result.errors.push(`Expected type ${rule.type}, got ${typeof value}`);
        return result;
      }
      
      // Required validation
      if (rule.required && (value === null || value === undefined || value === '')) {
        result.valid = false;
        result.errors.push('Value is required');
        return result;
      }
      
      // Skip further validation if value is null/undefined and not required
      if (value === null || value === undefined) {
        return result;
      }
      
      // Type-specific validation
      switch (rule.type) {
        case 'string':
          this.validateString(value, rule, result);
          break;
        case 'number':
          this.validateNumber(value, rule, result);
          break;
        case 'boolean':
          this.validateBoolean(value, rule, result);
          break;
        case 'array':
          this.validateArray(value, rule, result);
          break;
        case 'object':
          this.validateObject(value, rule, result);
          break;
      }
      
      // Sanitization
      if (result.valid && rule.sanitize && this.options.enableSanitization) {
        result.value = this.sanitize(value, ruleName);
      }
      
      return result;
      
    } catch (error) {
      if (this.options.enableLogging) {
        console.error('Validation error:', error);
      }
      
      result.valid = false;
      result.errors.push('Validation failed due to internal error');
      return result;
    }
  }

  validateType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  validateString(value, rule, result) {
    // Length validation
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      result.valid = false;
      result.errors.push(`String must be at least ${rule.minLength} characters long`);
    }
    
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      result.valid = false;
      result.errors.push(`String must be no more than ${rule.maxLength} characters long`);
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      result.valid = false;
      result.errors.push('String format is invalid');
    }
  }

  validateNumber(value, rule, result) {
    // Range validation
    if (rule.min !== undefined && value < rule.min) {
      result.valid = false;
      result.errors.push(`Number must be at least ${rule.min}`);
    }
    
    if (rule.max !== undefined && value > rule.max) {
      result.valid = false;
      result.errors.push(`Number must be no more than ${rule.max}`);
    }
    
    // Integer validation
    if (rule.integer && !Number.isInteger(value)) {
      result.valid = false;
      result.errors.push('Number must be an integer');
    }
    
    // NaN validation
    if (isNaN(value)) {
      result.valid = false;
      result.errors.push('Number must be a valid number');
    }
  }

  validateBoolean(value, rule, result) {
    // Boolean values are always valid if they're actually boolean
    // No additional validation needed
  }

  validateArray(value, rule, result) {
    // Length validation
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      result.valid = false;
      result.errors.push(`Array must have at least ${rule.minLength} items`);
    }
    
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      result.valid = false;
      result.errors.push(`Array must have no more than ${rule.maxLength} items`);
    }
    
    // Item type validation
    if (rule.itemType) {
      for (let i = 0; i < value.length; i++) {
        const itemResult = this.validate(value[i], rule.itemType);
        if (!itemResult.valid) {
          result.valid = false;
          result.errors.push(`Item at index ${i} is invalid: ${itemResult.errors.join(', ')}`);
        }
      }
    }
  }

  validateObject(value, rule, result) {
    // Strict mode validation
    if (rule.strict && rule.allowedKeys) {
      const keys = Object.keys(value);
      const invalidKeys = keys.filter(key => !rule.allowedKeys.includes(key));
      
      if (invalidKeys.length > 0) {
        result.valid = false;
        result.errors.push(`Invalid object keys: ${invalidKeys.join(', ')}`);
      }
    }
  }

  sanitize(value, ruleName) {
    const sanitizer = this.sanitizers.get(ruleName);
    if (sanitizer) {
      return sanitizer(value);
    }
    
    // Default string sanitizer
    if (typeof value === 'string') {
      return this.sanitizers.get('string')(value);
    }
    
    return value;
  }

  getRule(ruleName, options = {}) {
    const baseRule = this.validationRules.get(ruleName);
    if (!baseRule) {
      throw new Error(`Unknown validation rule: ${ruleName}`);
    }
    
    return { ...baseRule, ...options };
  }

  // Convenience methods for common validations
  
  validateEmail(email) {
    return this.validate(email, 'email');
  }
  
  validatePassword(password) {
    return this.validate(password, 'password');
  }
  
  validateUsername(username) {
    return this.validate(username, 'username');
  }
  
  validateUrl(url) {
    return this.validate(url, 'url');
  }
  
  validateId(id) {
    return this.validate(id, 'id');
  }
  
  validateToken(token) {
    return this.validate(token, 'token');
  }
  
  validateHtml(html) {
    return this.validate(html, 'html');
  }
  
  // Batch validation
  validateBatch(data, schema) {
    const results = {};
    let isValid = true;
    
    for (const [key, ruleName] of Object.entries(schema)) {
      const result = this.validate(data[key], ruleName);
      results[key] = result;
      
      if (!result.valid) {
        isValid = false;
      }
    }
    
    return {
      valid: isValid,
      data: results,
      errors: Object.entries(results)
        .filter(([_, result]) => !result.valid)
        .map(([key, result]) => `${key}: ${result.errors.join(', ')}`)
    };
  }
  
  // Add custom validation rule
  addRule(name, rule) {
    this.validationRules.set(name, rule);
  }
  
  // Add custom sanitizer
  addSanitizer(name, sanitizer) {
    this.sanitizers.set(name, sanitizer);
  }
  
  // Remove rule
  removeRule(name) {
    this.validationRules.delete(name);
  }
  
  // Remove sanitizer
  removeSanitizer(name) {
    this.sanitizers.delete(name);
  }
  
  // Get all rules
  getRules() {
    return Object.fromEntries(this.validationRules);
  }
  
  // Get all sanitizers
  getSanitizers() {
    return Object.fromEntries(this.sanitizers);
  }
}

// Create global instance
window.inputValidator = new InputValidator({
  enableStrictMode: true,
  enableSanitization: true,
  enableLogging: true
});

// Global convenience methods
window.validateEmail = (email) => window.inputValidator.validateEmail(email);
window.validatePassword = (password) => window.inputValidator.validatePassword(password);
window.validateUsername = (username) => window.inputValidator.validateUsername(username);
window.validateUrl = (url) => window.inputValidator.validateUrl(url);
window.validateId = (id) => window.inputValidator.validateId(id);
window.validateToken = (token) => window.inputValidator.validateToken(token);
window.validateHtml = (html) => window.inputValidator.validateHtml(html);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputValidator;
}
