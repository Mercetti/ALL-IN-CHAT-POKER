/**
 * AI Response Caching System
 * Improves performance by caching common AI responses
 */

const crypto = require('crypto');
const Logger = require('./logger');

const logger = new Logger('ai-cache');

class AICache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 300000; // 5 minutes
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    
    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Generate cache key from messages and options
   */
  generateKey(messages = [], options = {}) {
    // Create a more flexible cache key that groups similar requests
    const lastMessage = messages[messages.length - 1]?.content || '';
    const context = messages[0]?.content || '';
    
    // Extract key patterns for better cache hits
    const keyData = {
      // Simplified message pattern - focus on intent, not exact wording
      intent: this.extractIntent(lastMessage),
      context: this.extractContext(context),
      model: options.model || 'default',
      // Group similar token ranges
      tokenRange: this.getTokenRange(options.maxTokens || 1000),
      // Group similar temperatures
      tempRange: this.getTempRange(options.temperature || 0.7)
    };
    
    return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  }

  /**
   * Extract intent from message for better cache grouping
   */
  extractIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Common patterns
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'greeting';
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('assist') || lowerMessage.includes('support')) {
      return 'help_request';
    }
    if (lowerMessage.includes('error') || lowerMessage.includes('bug') || lowerMessage.includes('issue')) {
      return 'error_help';
    }
    if (lowerMessage.includes('generate') || lowerMessage.includes('create') || lowerMessage.includes('make')) {
      return 'generation';
    }
    if (lowerMessage.includes('test') || lowerMessage.includes('check') || lowerMessage.includes('verify')) {
      return 'testing';
    }
    
    // Default: use first few words
    return lowerMessage.split(' ').slice(0, 3).join('_');
  }

  /**
   * Extract context from system message
   */
  extractContext(systemMessage) {
    const lowerMessage = systemMessage.toLowerCase();
    
    if (lowerMessage.includes('poker') || lowerMessage.includes('dealer')) {
      return 'poker';
    }
    if (lowerMessage.includes('coding') || lowerMessage.includes('code') || lowerMessage.includes('programming')) {
      return 'coding';
    }
    if (lowerMessage.includes('personality') || lowerMessage.includes('flirty') || lowerMessage.includes('savage')) {
      return 'personality';
    }
    if (lowerMessage.includes('audio') || lowerMessage.includes('music') || lowerMessage.includes('sound')) {
      return 'audio';
    }
    
    return 'general';
  }

  /**
   * Group token amounts into ranges
   */
  getTokenRange(tokens) {
    if (tokens <= 10) return 'tiny';
    if (tokens <= 25) return 'small';
    if (tokens <= 50) return 'medium';
    if (tokens <= 100) return 'large';
    return 'huge';
  }

  /**
   * Group temperatures into ranges
   */
  getTempRange(temp) {
    if (temp <= 0.3) return 'low';
    if (temp <= 0.7) return 'medium';
    return 'high';
  }

  /**
   * Get cached response
   */
  get(messages = [], options = {}) {
    const key = this.generateKey(messages, options);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      this.stats.hits++;
      logger.debug('Cache hit', { key });
      return cached.response;
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Set cached response
   */
  set(messages = [], options = {}, response) {
    const key = this.generateKey(messages, options);
    
    // Evict oldest if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      logger.debug('Cache eviction', { key: oldestKey });
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      options: { ...options }
    });
    
    logger.debug('Cache set', { key });
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });
    
    if (expiredKeys.length > 0) {
      logger.debug('Cache cleanup', { expired: expiredKeys.length });
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
    logger.info('Cache cleared');
  }
}

module.exports = AICache;
