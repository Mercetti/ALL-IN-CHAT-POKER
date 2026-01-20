/**
 * Resilient Parser Utility
 * Safe parsing with fallback values for LLM output and user input
 */

const Logger = require('./logger');

class ResilientParser {
  constructor() {
    this.logger = new Logger('resilient-parser');
    this.parseStats = {
      total: 0,
      successful: 0,
      failed: 0,
      fallbacks: 0
    };
  }

  /**
   * Safe JSON parsing with fallback
   */
  safeJsonParse(input, fallback = null, options = {}) {
    this.parseStats.total++;
    
    if (typeof input === 'object') {
      this.parseStats.successful++;
      return input; // Already parsed
    }

    if (typeof input !== 'string') {
      this.parseStats.failed++;
      this.logger.warn('Invalid input type for JSON parsing', {
        inputType: typeof input,
        input: String(input).substring(0, 100)
      });
      return fallback;
    }

    try {
      const parsed = JSON.parse(input);
      this.parseStats.successful++;
      return parsed;
    } catch (error) {
      this.parseStats.failed++;
      
      this.logger.warn('JSON parsing failed, attempting fallback', {
        error: error.message,
        inputLength: input.length,
        inputPreview: input.substring(0, 200)
      });

      // Try common fallback strategies
      if (options.enableFallbacks !== false) {
        const fallbackResult = this.tryFallbackStrategies(input, fallback);
        if (fallbackResult !== null) {
          this.parseStats.fallbacks++;
          return fallbackResult;
        }
      }

      return fallback;
    }
  }

  /**
   * Try multiple fallback strategies for corrupted JSON
   */
  tryFallbackStrategies(input, fallback) {
    const strategies = [
      this.fixTruncatedJson.bind(this),
      this.fixMissingQuotes.bind(this),
      this.fixExtraCommas.bind(this),
      this.fixNewlines.bind(this),
      this.extractPartialJson.bind(this)
    ];

    for (const strategy of strategies) {
      try {
        const result = strategy(input);
        if (result !== null) {
          this.logger.info('Fallback strategy successful', {
            strategy: strategy.name
          });
          return result;
        }
      } catch (error) {
        this.logger.debug('Fallback strategy failed', {
          strategy: strategy.name,
          error: error.message
        });
      }
    }

    return null;
  }

  /**
   * Fix truncated JSON
   */
  fixTruncatedJson(input) {
    // Find the last complete object or array
    let braceCount = 0;
    let bracketCount = 0;
    let lastCompleteIndex = -1;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;

      // Check if we're at a balanced point
      if (braceCount === 0 && bracketCount === 0) {
        if (char === '}' || char === ']') {
          lastCompleteIndex = i;
        }
      }
    }

    if (lastCompleteIndex > 0) {
      const truncated = input.substring(0, lastCompleteIndex + 1);
      return JSON.parse(truncated);
    }

    return null;
  }

  /**
   * Fix missing quotes around keys
   */
  fixMissingQuotes(input) {
    // Add quotes around unquoted JSON keys
    const fixed = input.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    if (fixed !== input) {
      return JSON.parse(fixed);
    }
    
    return null;
  }

  /**
   * Fix extra commas
   */
  fixExtraCommas(input) {
    // Remove trailing commas before brackets/braces
    const fixed = input.replace(/,\s*([}\]])/g, '$1');
    
    if (fixed !== input) {
      return JSON.parse(fixed);
    }
    
    return null;
  }

  /**
   * Fix newlines in JSON
   */
  fixNewlines(input) {
    // Remove problematic newlines and clean up
    const cleaned = input
      .replace(/[\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleaned !== input) {
      try {
        return JSON.parse(cleaned);
      } catch (error) {
        // Continue to next strategy
      }
    }
    
    return null;
  }

  /**
   * Extract partial JSON from mixed content
   */
  extractPartialJson(input) {
    // Look for JSON-like patterns in mixed content
    const jsonPatterns = [
      /\{[^{}]*\}/g,
      /\[[^\[\]]*\]/g,
      /"type"\s*:\s*"[^"]*"/g,
      /"data"\s*:\s*\{[^}]*\}/g
    ];

    for (const pattern of jsonPatterns) {
      const matches = input.match(pattern);
      if (matches && matches.length > 0) {
        try {
          // Try to combine found JSON fragments
          const combined = matches.join(',');
          return JSON.parse(`{${combined}}`);
        } catch (error) {
          // Try individual matches
          for (const match of matches) {
            try {
              return JSON.parse(match);
            } catch (e) {
              // Continue
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Safe number parsing
   */
  safeParseNumber(input, fallback = 0) {
    if (typeof input === 'number') {
      return input;
    }

    if (typeof input === 'string') {
      const parsed = parseFloat(input);
      return isNaN(parsed) ? fallback : parsed;
    }

    return fallback;
  }

  /**
   * Safe boolean parsing
   */
  safeParseBoolean(input, fallback = false) {
    if (typeof input === 'boolean') {
      return input;
    }

    if (typeof input === 'string') {
      const lower = input.toLowerCase().trim();
      return lower === 'true' || lower === '1' || lower === 'yes';
    }

    if (typeof input === 'number') {
      return input !== 0;
    }

    return fallback;
  }

  /**
   * Safe array parsing
   */
  safeParseArray(input, fallback = []) {
    const parsed = this.safeJsonParse(input, null);
    
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    if (parsed && typeof parsed === 'object') {
      // Try to extract array values
      const values = Object.values(parsed);
      if (values.length > 0) {
        return values;
      }
    }
    
    return fallback;
  }

  /**
   * Sanitize and validate LLM output
   */
  sanitizeLLMOutput(output, schema = null) {
    if (typeof output !== 'string' && typeof output !== 'object') {
      return this.createSafeResult('Invalid output type', null);
    }

    let parsed;
    if (typeof output === 'object') {
      parsed = output;
    } else {
      parsed = this.safeJsonParse(output, null);
    }

    if (!parsed) {
      return this.createSafeResult('Failed to parse LLM output', null);
    }

    // Basic structure validation
    if (!this.validateBasicStructure(parsed)) {
      return this.createSafeResult('Invalid LLM output structure', this.extractSafeContent(parsed));
    }

    // Schema validation if provided
    if (schema && !this.validateSchema(parsed, schema)) {
      return this.createSafeResult('Schema validation failed', this.extractSafeContent(parsed));
    }

    return this.createSafeResult(null, parsed);
  }

  /**
   * Validate basic structure
   */
  validateBasicStructure(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for dangerous or malformed content
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    for (const key of Object.keys(data)) {
      if (dangerousKeys.includes(key)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate against schema
   */
  validateSchema(data, schema) {
    if (!schema || typeof schema !== 'object') {
      return true; // No schema to validate against
    }

    for (const [key, type] of Object.entries(schema)) {
      if (!(key in data)) {
        continue; // Optional field
      }

      if (type === 'string' && typeof data[key] !== 'string') {
        return false;
      }
      
      if (type === 'number' && typeof data[key] !== 'number') {
        return false;
      }
      
      if (type === 'boolean' && typeof data[key] !== 'boolean') {
        return false;
      }
      
      if (type === 'array' && !Array.isArray(data[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Extract safe content from potentially dangerous data
   */
  extractSafeContent(data) {
    const safe = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip dangerous keys
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        // Remove potential script injections
        safe[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else {
        safe[key] = value;
      }
    }

    return safe;
  }

  /**
   * Create safe result object
   */
  createSafeResult(error, data) {
    return {
      success: !error,
      error,
      data,
      timestamp: Date.now(),
      fallback: !!error
    };
  }

  /**
   * Safe sorting with error handling
   */
  safeSort(array, compareFunction, fallback = (a, b) => String(a).localeCompare(String(b))) {
    if (!Array.isArray(array)) {
      this.logger.warn('safeSort called with non-array', { 
        inputType: typeof array 
      });
      return [];
    }

    try {
      return array.sort(compareFunction);
    } catch (error) {
      this.logger.warn('Sorting failed, using fallback', {
        error: error.message,
        arrayLength: array.length
      });
      return array.sort(fallback);
    }
  }

  /**
   * Get parsing statistics
   */
  getStats() {
    const successRate = this.parseStats.total > 0 
      ? (this.parseStats.successful / this.parseStats.total * 100).toFixed(2)
      : 0;

    const fallbackRate = this.parseStats.total > 0
      ? (this.parseStats.fallbacks / this.parseStats.total * 100).toFixed(2)
      : 0;

    return {
      ...this.parseStats,
      successRate: `${successRate}%`,
      fallbackRate: `${fallbackRate}%`
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.parseStats = {
      total: 0,
      successful: 0,
      failed: 0,
      fallbacks: 0
    };
  }
}

module.exports = ResilientParser;
