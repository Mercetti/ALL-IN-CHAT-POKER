/**
 * Rate Limiting System
 * Implements client-side rate limiting to prevent abuse
 */

class RateLimiter {
  constructor(options = {}) {
    this.options = {
      windowMs: 60000, // 1 minute window
      maxRequests: 100, // Max requests per window
      enableLogging: true,
      enableStorage: true,
      storageKey: 'rate_limiter_data',
      enableBurstProtection: true,
      burstMax: 10, // Max requests in burst
      burstWindowMs: 1000, // 1 second burst window
      enableBackoff: true,
      backoffMultiplier: 2,
      maxBackoffMs: 30000, // 30 seconds max backoff
      ...options
    };
    
    this.requests = new Map();
    this.burstRequests = new Map();
    this.backoffTimes = new Map();
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    this.loadStoredData();
    this.cleanupExpiredEntries();
    this.isInitialized = true;
  }

  loadStoredData() {
    if (!this.options.enableStorage || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.requests = new Map(data.requests || []);
        this.burstRequests = new Map(data.burstRequests || []);
        this.backoffTimes = new Map(data.backoffTimes || []);
      }
    } catch (error) {
      console.warn('Failed to load rate limiter data:', error);
    }
  }

  saveData() {
    if (!this.options.enableStorage || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const data = {
        requests: Array.from(this.requests.entries()),
        burstRequests: Array.from(this.burstRequests.entries()),
        backoffTimes: Array.from(this.backoffTimes.entries())
      };
      localStorage.setItem(this.options.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save rate limiter data:', error);
    }
  }

  cleanupExpiredEntries() {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    const burstWindowStart = now - this.options.burstWindowMs;
    
    // Clean main window requests
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
    
    // Clean burst window requests
    for (const [key, timestamps] of this.burstRequests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > burstWindowStart);
      if (validTimestamps.length === 0) {
        this.burstRequests.delete(key);
      } else {
        this.burstRequests.set(key, validTimestamps);
      }
    }
    
    // Clean expired backoff times
    for (const [key, backoffTime] of this.backoffTimes.entries()) {
      if (now >= backoffTime) {
        this.backoffTimes.delete(key);
      }
    }
    
    this.saveData();
  }

  generateKey(identifier, endpoint) {
    return `${identifier}:${endpoint}`;
  }

  checkRateLimit(identifier, endpoint) {
    const key = this.generateKey(identifier, endpoint);
    const now = Date.now();
    
    // Check if user is in backoff
    if (this.options.enableBackoff) {
      const backoffTime = this.backoffTimes.get(key);
      if (backoffTime && now < backoffTime) {
        const remainingTime = Math.ceil((backoffTime - now) / 1000);
        return {
          allowed: false,
          remainingTime,
          resetTime: backoffTime,
          reason: 'backoff',
          message: `Rate limit exceeded. Try again in ${remainingTime} seconds.`
        };
      }
    }
    
    // Check burst protection
    if (this.options.enableBurstProtection) {
      const burstResult = this.checkBurstLimit(key, now);
      if (!burstResult.allowed) {
        return burstResult;
      }
    }
    
    // Check main rate limit
    const mainResult = this.checkMainLimit(key, now);
    if (!mainResult.allowed) {
      // Apply backoff if enabled
      if (this.options.enableBackoff) {
        this.applyBackoff(key, now);
      }
      return mainResult;
    }
    
    // Record the request
    this.recordRequest(key, now);
    
    return {
      allowed: true,
      remainingRequests: this.options.maxRequests - this.getRequestCount(key),
      resetTime: now + this.options.windowMs,
      reason: 'allowed'
    };
  }

  checkBurstLimit(key, now) {
    const timestamps = this.burstRequests.get(key) || [];
    const burstWindowStart = now - this.options.burstWindowMs;
    const recentRequests = timestamps.filter(timestamp => timestamp > burstWindowStart);
    
    if (recentRequests.length >= this.options.burstMax) {
      const oldestRequest = Math.min(...recentRequests);
      const resetTime = oldestRequest + this.options.burstWindowMs;
      const remainingTime = Math.ceil((resetTime - now) / 1000);
      
      return {
        allowed: false,
        remainingTime,
        resetTime,
        reason: 'burst',
        message: `Too many requests. Try again in ${remainingTime} seconds.`
      };
    }
    
    return { allowed: true };
  }

  checkMainLimit(key, now) {
    const timestamps = this.requests.get(key) || [];
    const windowStart = now - this.options.windowMs;
    const recentRequests = timestamps.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= this.options.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const resetTime = oldestRequest + this.options.windowMs;
      const remainingTime = Math.ceil((resetTime - now) / 1000);
      
      return {
        allowed: false,
        remainingTime,
        resetTime,
        reason: 'limit',
        message: `Rate limit exceeded. Try again in ${remainingTime} seconds.`
      };
    }
    
    return { allowed: true };
  }

  recordRequest(key, timestamp) {
    // Record in main window
    const mainTimestamps = this.requests.get(key) || [];
    mainTimestamps.push(timestamp);
    this.requests.set(key, mainTimestamps);
    
    // Record in burst window
    if (this.options.enableBurstProtection) {
      const burstTimestamps = this.burstRequests.get(key) || [];
      burstTimestamps.push(timestamp);
      this.burstRequests.set(key, burstTimestamps);
    }
    
    this.saveData();
  }

  getRequestCount(key) {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    const timestamps = this.requests.get(key) || [];
    return timestamps.filter(timestamp => timestamp > windowStart).length;
  }

  getBurstRequestCount(key) {
    const now = Date.now();
    const burstWindowStart = now - this.options.burstWindowMs;
    const timestamps = this.burstRequests.get(key) || [];
    return timestamps.filter(timestamp => timestamp > burstWindowStart).length;
  }

  applyBackoff(key, now) {
    const currentBackoff = this.backoffTimes.get(key) || 0;
    const newBackoff = currentBackoff === 0 
      ? this.options.burstWindowMs 
      : Math.min(currentBackoff * this.options.backoffMultiplier, this.options.maxBackoffMs);
    
    this.backoffTimes.set(key, now + newBackoff);
    this.saveData();
  }

  // Public API methods
  
  isAllowed(identifier, endpoint) {
    const result = this.checkRateLimit(identifier, endpoint);
    
    if (this.options.enableLogging) {
      if (!result.allowed) {
        console.warn(`Rate limit exceeded for ${identifier}:${endpoint} - ${result.message}`);
      }
    }
    
    return result;
  }

  getStatus(identifier, endpoint) {
    const key = this.generateKey(identifier, endpoint);
    const now = Date.now();
    
    return {
      requests: this.getRequestCount(key),
      maxRequests: this.options.maxRequests,
      burstRequests: this.getBurstRequestCount(key),
      maxBurstRequests: this.options.burstMax,
      backoffTime: this.backoffTimes.get(key) || null,
      windowMs: this.options.windowMs,
      burstWindowMs: this.options.burstWindowMs
    };
  }

  reset(identifier, endpoint) {
    if (endpoint) {
      const key = this.generateKey(identifier, endpoint);
      this.requests.delete(key);
      this.burstRequests.delete(key);
      this.backoffTimes.delete(key);
    } else {
      // Reset all endpoints for this identifier
      for (const [key] of this.requests.entries()) {
        if (key.startsWith(identifier + ':')) {
          this.requests.delete(key);
        }
      }
      for (const [key] of this.burstRequests.entries()) {
        if (key.startsWith(identifier + ':')) {
          this.burstRequests.delete(key);
        }
      }
      for (const [key] of this.backoffTimes.entries()) {
        if (key.startsWith(identifier + ':')) {
          this.backoffTimes.delete(key);
        }
      }
    }
    
    this.saveData();
  }

  clearAll() {
    this.requests.clear();
    this.burstRequests.clear();
    this.backoffTimes.clear();
    
    if (this.options.enableStorage && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.options.storageKey);
    }
  }

  // Middleware for fetch requests
  createFetchMiddleware() {
    return (url, options = {}) => {
      const identifier = options.identifier || 'anonymous';
      const endpoint = options.endpoint || new URL(url).pathname;
      
      const rateLimitResult = this.isAllowed(identifier, endpoint);
      
      if (!rateLimitResult.allowed) {
        return Promise.reject(new Error(rateLimitResult.message));
      }
      
      // Continue with original fetch
      return fetch(url, options);
    };
  }

  // Convenience methods for common endpoints
  
  isApiAllowed(identifier) {
    return this.isAllowed(identifier, '/api');
  }
  
  isLoginAllowed(identifier) {
    return this.isAllowed(identifier, '/login');
  }
  
  isRegisterAllowed(identifier) {
    return this.isAllowed(identifier, '/register');
  }
  
  isUploadAllowed(identifier) {
    return this.isAllowed(identifier, '/upload');
  }
  
  // Preset configurations
  
  static createStrictLimiter() {
    return new RateLimiter({
      windowMs: 60000,
      maxRequests: 30,
      burstMax: 5,
      burstWindowMs: 1000,
      enableBackoff: true,
      backoffMultiplier: 2,
      maxBackoffMs: 60000
    });
  }
  
  static createLenientLimiter() {
    return new RateLimiter({
      windowMs: 60000,
      maxRequests: 1000,
      burstMax: 100,
      burstWindowMs: 1000,
      enableBackoff: false
    });
  }
  
  static createApiLimiter() {
    return new RateLimiter({
      windowMs: 60000,
      maxRequests: 60,
      burstMax: 10,
      burstWindowMs: 1000,
      enableBackoff: true,
      backoffMultiplier: 2,
      maxBackoffMs: 30000
    });
  }
}

// Create global instance
window.rateLimiter = RateLimiter.createApiLimiter();

// Global convenience methods
window.isRateLimited = (identifier, endpoint) => {
  const result = window.rateLimiter.isAllowed(identifier, endpoint);
  return !result.allowed;
};

window.getRateLimitStatus = (identifier, endpoint) => {
  return window.rateLimiter.getStatus(identifier, endpoint);
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RateLimiter;
}
