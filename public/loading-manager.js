/**
 * Loading State Manager for Game UI
 * Provides consistent loading states and feedback for all game actions
 */

class LoadingStateManager {
  constructor() {
    this.activeLoaders = new Map(); // loaderId -> { type, startTime, message }
    this.loadingStates = new Set(); // Set of currently loading action types
    this.callbacks = new Map(); // type -> Set of callbacks
  }

  /**
   * Start a loading state
   * @param {string} type - Action type (bet, deal, fold, etc.)
   * @param {string} message - Loading message
   * @param {string} loaderId - Unique loader ID
   * @returns {string} - Loader ID for cleanup
   */
  startLoading(type, message = 'Loading...', loaderId = null) {
    const id = loaderId || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeLoaders.set(id, {
      type,
      message,
      startTime: Date.now()
    });
    
    this.loadingStates.add(type);
    this.notifyCallbacks(type, 'start', { message, id });
    
    // Auto-timeout after 30 seconds
    setTimeout(() => {
      if (this.activeLoaders.has(id)) {
        this.stopLoading(id);
        console.warn(`Loading state auto-timed out: ${type} (${id})`);
      }
    }, 30000);
    
    return id;
  }

  /**
   * Stop a specific loading state
   * @param {string} loaderId - Loader ID to stop
   * @param {Object} result - Optional result data
   */
  stopLoading(loaderId, result = null) {
    const loader = this.activeLoaders.get(loaderId);
    if (!loader) return false;
    
    const { type, message, startTime } = loader;
    const duration = Date.now() - startTime;
    
    this.activeLoaders.delete(loaderId);
    
    // Check if any other loaders of this type are active
    const hasOtherLoaders = Array.from(this.activeLoaders.values())
      .some(l => l.type === type);
    
    if (!hasOtherLoaders) {
      this.loadingStates.delete(type);
    }
    
    this.notifyCallbacks(type, 'stop', { 
      message, 
      duration, 
      result,
      id: loaderId 
    });
    
    return true;
  }

  /**
   * Check if a type is currently loading
   * @param {string} type - Action type to check
   * @returns {boolean} - Whether type is loading
   */
  isLoading(type) {
    return this.loadingStates.has(type);
  }

  /**
   * Get all currently loading types
   * @returns {Array} - Array of loading types
   */
  getLoadingTypes() {
    return Array.from(this.loadingStates);
  }

  /**
   * Get all active loaders
   * @returns {Array} - Array of active loader info
   */
  getActiveLoaders() {
    return Array.from(this.activeLoaders.entries()).map(([id, loader]) => ({
      id,
      ...loader,
      duration: Date.now() - loader.startTime
    }));
  }

  /**
   * Subscribe to loading state changes
   * @param {string} type - Action type to watch (or '*' for all)
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(type, callback) {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, new Set());
    }
    
    this.callbacks.get(type).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.callbacks.delete(type);
        }
      }
    };
  }

  /**
   * Notify all subscribers of a type
   * @param {string} type - Action type
   * @param {string} action - 'start' or 'stop'
   * @param {Object} data - Event data
   */
  notifyCallbacks(type, action, data) {
    // Notify type-specific subscribers
    const typeCallbacks = this.callbacks.get(type);
    if (typeCallbacks) {
      typeCallbacks.forEach(callback => {
        try {
          callback(action, data);
        } catch (error) {
          console.error('Loading callback error:', error);
        }
      });
    }
    
    // Notify global subscribers
    const globalCallbacks = this.callbacks.get('*');
    if (globalCallbacks) {
      globalCallbacks.forEach(callback => {
        try {
          callback(action, { ...data, type });
        } catch (error) {
          console.error('Global loading callback error:', error);
        }
      });
    }
  }

  /**
   * Clear all loading states
   */
  clearAll() {
    const loaders = Array.from(this.activeLoaders.keys());
    loaders.forEach(id => this.stopLoading(id));
  }

  /**
   * Get loading statistics
   * @returns {Object} - Loading statistics
   */
  getStats() {
    const loaders = this.getActiveLoaders();
    const types = this.getLoadingTypes();
    
    return {
      activeLoaders: loaders.length,
      loadingTypes: types.length,
      averageDuration: loaders.length > 0 
        ? loaders.reduce((sum, l) => sum + l.duration, 0) / loaders.length 
        : 0,
      oldestLoader: loaders.length > 0 
        ? Math.max(...loaders.map(l => l.duration)) 
        : 0,
      types
    };
  }
}

// Global singleton instance
const loadingManager = new LoadingStateManager();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = loadingManager;
} else if (typeof window !== 'undefined') {
  window.loadingManager = loadingManager;
}
