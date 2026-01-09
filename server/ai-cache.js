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
    const keyData = {
      messages: messages.slice(-3), // Last 3 messages for context
      model: options.model || 'default',
      maxTokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7
    };
    
    return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
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
