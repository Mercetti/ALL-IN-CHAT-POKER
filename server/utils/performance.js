/**
 * Performance optimization utilities
 * Provides optimized alternatives to common operations
 */

/**
 * Fast object size check - avoids creating array
 * @param {Object} obj - Object to check
 * @returns {number} - Number of keys
 */
function getObjectSize(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  
  let count = 0;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      count++;
    }
  }
  return count;
}

/**
 * Fast array-like iteration over object keys
 * @param {Object} obj - Object to iterate
 * @param {Function} callback - Callback function
 */
function forEachKey(obj, callback) {
  if (!obj || typeof obj !== 'object') return;
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      callback(key, obj[key]);
    }
  }
}

/**
 * Fast filter object keys without creating intermediate array
 * @param {Object} obj - Object to filter
 * @param {Function} predicate - Filter function
 * @returns {Array} - Filtered keys array
 */
function filterKeys(obj, predicate) {
  if (!obj || typeof obj !== 'object') return [];
  
  const result = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (predicate(key, obj[key])) {
        result.push(key);
      }
    }
  }
  return result;
}

/**
 * Fast map object keys without creating intermediate array
 * @param {Object} obj - Object to map
 * @param {Function} mapper - Map function
 * @returns {Array} - Mapped values array
 */
function mapKeys(obj, mapper) {
  if (!obj || typeof obj !== 'object') return [];
  
  const result = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result.push(mapper(key, obj[key]));
    }
  }
  return result;
}

/**
 * Cached object size with invalidation
 */
class SizeCache {
  constructor() {
    this.cache = new Map(); // obj -> { size, timestamp }
    this.maxAge = 1000; // 1 second cache
  }

  /**
   * Get cached size or compute it
   * @param {Object} obj - Object to measure
   * @returns {number} - Object size
   */
  getSize(obj) {
    if (!obj || typeof obj !== 'object') return 0;
    
    const cacheKey = obj;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.maxAge) {
      return cached.size;
    }
    
    const size = getObjectSize(obj);
    this.cache.set(cacheKey, { size, timestamp: now });
    
    // Clean old entries periodically
    if (this.cache.size > 100) {
      this.cleanup();
    }
    
    return size;
  }

  /**
   * Clean up old cache entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache for specific object
   * @param {Object} obj - Object to invalidate
   */
  invalidate(obj) {
    this.cache.delete(obj);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }
}

/**
 * Performance monitoring for function calls
 */
class PerformanceMonitor {
  constructor() {
    this.stats = new Map(); // function name -> { calls, totalTime, avgTime }
  }

  /**
   * Monitor a function call
   * @param {string} name - Function name for tracking
   * @param {Function} fn - Function to monitor
   * @returns {Function} - Wrapped function
   */
  monitor(name, fn) {
    return (...args) => {
      const start = performance.now();
      try {
        const result = fn(...args);
        const end = performance.now();
        this.recordCall(name, end - start);
        return result;
      } catch (error) {
        const end = performance.now();
        this.recordCall(name, end - start);
        throw error;
      }
    };
  }

  /**
   * Record a function call performance
   * @param {string} name - Function name
   * @param {number} duration - Call duration in ms
   */
  recordCall(name, duration) {
    if (!this.stats.has(name)) {
      this.stats.set(name, { calls: 0, totalTime: 0, avgTime: 0 });
    }
    
    const stats = this.stats.get(name);
    stats.calls++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.calls;
  }

  /**
   * Get performance statistics
   * @returns {Object} - Performance stats
   */
  getStats() {
    const result = {};
    for (const [name, stats] of this.stats.entries()) {
      result[name] = { ...stats };
    }
    return result;
  }

  /**
   * Clear all statistics
   */
  clear() {
    this.stats.clear();
  }
}

/**
 * Optimized state cache for frequently accessed computed values
 */
class StateCache {
  constructor() {
    this.cache = new Map(); // key -> { value, timestamp, ttl }
  this.defaultTTL = 100; // 100ms default TTL
  }

  /**
   * Get cached value or compute it
   * @param {string} key - Cache key
   * @param {Function} computeFn - Function to compute value
   * @param {number} ttl - Time to live in ms
   * @returns {*} - Cached or computed value
   */
  get(key, computeFn, ttl = this.defaultTTL) {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.value;
    }
    
    const value = computeFn();
    this.cache.set(key, { value, timestamp: now, ttl });
    
    // Clean old entries periodically
    if (this.cache.size > 50) {
      this.cleanup();
    }
    
    return value;
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in ms
   */
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, { value, timestamp: Date.now(), ttl });
  }

  /**
   * Invalidate cache entry
   * @param {string} key - Cache key to invalidate
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        expired++;
      } else {
        valid++;
      }
    }
    
    return {
      total: this.cache.size,
      valid,
      expired
    };
  }
}

// Create global instances
const sizeCache = new SizeCache();
const perfMonitor = new PerformanceMonitor();
const stateCache = new StateCache();

// Auto-cleanup intervals
setInterval(() => {
  sizeCache.cleanup();
  stateCache.cleanup();
}, 5000); // Every 5 seconds

module.exports = {
  getObjectSize,
  forEachKey,
  filterKeys,
  mapKeys,
  SizeCache,
  PerformanceMonitor,
  StateCache,
  sizeCache,
  perfMonitor,
  stateCache
};
