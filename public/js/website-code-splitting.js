/**
 * Code Splitting for Main Website
 * Implements dynamic code splitting and lazy loading for improved performance
 */

class WebsiteCodeSplitting {
  constructor(options = {}) {
    this.options = {
      enableLazyLoading: true,
      enablePrefetching: true,
      enablePreloading: true,
      enableCompression: true,
      chunkSize: 50000, // 50KB chunks
      maxConcurrentLoads: 3,
      retryAttempts: 3,
      retryDelay: 1000,
      enableServiceWorker: true,
      enableCache: true,
      cacheExpiration: 3600000, // 1 hour
      ...options
    };
    
    this.isInitialized = false;
    this.chunks = new Map();
    this.loadedChunks = new Set();
    this.loadingChunks = new Set();
    this.failedChunks = new Set();
    this.chunkQueue = [];
    this.activeLoads = 0;
    this.performanceMetrics = new Map();
    this.cache = new Map();
    
    this.init();
  }

  init() {
    // Setup service worker for caching
    if (this.options.enableServiceWorker && 'serviceWorker' in navigator) {
      this.setupServiceWorker();
    }
    
    // Setup chunk registry
    this.setupChunkRegistry();
    
    // Setup lazy loading observers
    if (this.options.enableLazyLoading && 'IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    }
    
    // Setup prefetching
    if (this.options.enablePrefetching) {
      this.setupPrefetching();
    }
    
    // Setup preloading
    if (this.options.enablePreloading) {
      this.setupPreloading();
    }
    
    // Setup global API
    this.setupGlobalAPI();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    this.isInitialized = true;
  }

  setupChunkRegistry() {
    // Register code chunks
    this.registerChunk('core', {
      files: ['js/error-boundary.js', 'js/accessibility-manager.js', 'js/responsive-manager.js'],
      priority: 'high',
      preload: true,
      dependencies: []
    });
    
    this.registerChunk('components', {
      files: ['js/poker-component-library.js'],
      priority: 'medium',
      preload: false,
      dependencies: ['core']
    });
    
    this.registerChunk('design', {
      files: ['js/poker-design-system.js'],
      priority: 'medium',
      preload: false,
      dependencies: ['core']
    });
    
    this.registerChunk('performance', {
      files: ['js/website-performance-optimizer.js'],
      priority: 'medium',
      preload: false,
      dependencies: ['core']
    });
    
    this.registerChunk('theme', {
      files: ['js/website-theme-manager.js'],
      priority: 'medium',
      preload: false,
      dependencies: ['core', 'design']
    });
    
    this.registerChunk('skeletons', {
      files: ['js/website-loading-skeletons.js'],
      priority: 'medium',
      preload: false,
      dependencies: ['core']
    });
    
    this.registerChunk('poker-game', {
      files: [
        'js/poker-keyboard-navigation.js',
        'js/poker-mobile-responsive.js',
        'js/poker-websocket-manager.js',
        'js/poker-realtime-updates.js',
        'js/poker-game-ui.js',
        'js/poker-loading-states.js',
        'js/poker-game-components.js'
      ],
      priority: 'low',
      preload: false,
      dependencies: ['core', 'components', 'design']
    });
    
    this.registerChunk('overlay', {
      files: ['js/overlay-error-boundary.js'],
      priority: 'high',
      preload: false,
      dependencies: ['core']
    });
  }

  setupServiceWorker() {
    // Register service worker for chunk caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered for code splitting');
          this.serviceWorkerRegistration = registration;
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const chunks = element.dataset.chunks;
          
          if (chunks) {
            const chunkList = chunks.split(',').map(chunk => chunk.trim());
            this.loadChunks(chunkList);
            this.observer.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px'
    });
  }

  setupPrefetching() {
    // Prefetch chunks on hover or idle
    document.addEventListener('mouseover', (e) => {
      const element = e.target.closest('[data-chunks]');
      if (element && !element.dataset.prefetched) {
        const chunks = element.dataset.chunks.split(',').map(chunk => chunk.trim());
        this.prefetchChunks(chunks);
        element.dataset.prefetched = 'true';
      }
    });
    
    // Prefetch on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.prefetchHighPriorityChunks();
      });
    }
  }

  setupPreloading() {
    // Preload critical chunks
    window.addEventListener('load', () => {
      this.preloadCriticalChunks();
    });
  }

  setupGlobalAPI() {
    // Global code splitting API
    window.websiteCodeSplitting = {
      loadChunk: (name) => this.loadChunk(name),
      loadChunks: (names) => this.loadChunks(names),
      preloadChunk: (name) => this.preloadChunk(name),
      prefetchChunk: (name) => this.prefetchChunk(name),
      unloadChunk: (name) => this.unloadChunk(name),
      getLoadedChunks: () => this.getLoadedChunks(),
      getLoadingChunks: () => this.getLoadingChunks(),
      getFailedChunks: () => this.getFailedChunks(),
      getPerformanceMetrics: () => this.getPerformanceMetrics(),
      clearCache: () => this.clearCache()
    };
  }

  setupPerformanceMonitoring() {
    // Monitor chunk loading performance
    this.performanceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.name.includes('chunk-')) {
          this.recordPerformanceMetric(entry);
        }
      });
    });
    
    this.performanceObserver.observe({ entryTypes: ['resource', 'measure'] });
  }

  registerChunk(name, config) {
    this.chunks.set(name, {
      name,
      files: config.files || [],
      priority: config.priority || 'medium',
      preload: config.preload || false,
      dependencies: config.dependencies || [],
      loaded: false,
      loading: false,
      failed: false,
      loadTime: 0,
      retryCount: 0
    });
  }

  async loadChunk(name) {
    const chunk = this.chunks.get(name);
    
    if (!chunk) {
      throw new Error(`Chunk "${name}" not found`);
    }
    
    if (chunk.loaded) {
      return chunk;
    }
    
    if (chunk.loading) {
      return this.waitForChunkLoad(name);
    }
    
    if (chunk.failed && chunk.retryCount >= this.options.retryAttempts) {
      throw new Error(`Chunk "${name}" failed to load after ${chunk.retryCount} attempts`);
    }
    
    // Load dependencies first
    if (chunk.dependencies.length > 0) {
      await this.loadChunks(chunk.dependencies);
    }
    
    return this.loadChunkFiles(name);
  }

  async loadChunks(names) {
    const loadPromises = names.map(name => this.loadChunk(name));
    return Promise.all(loadPromises);
  }

  async loadChunkFiles(name) {
    const chunk = this.chunks.get(name);
    const startTime = performance.now();
    
    chunk.loading = true;
    chunk.retryCount++;
    this.loadingChunks.add(name);
    
    try {
      // Check cache first
      if (this.options.enableCache) {
        const cached = this.getFromCache(name);
        if (cached) {
          await this.executeChunkFiles(name, cached.files);
          chunk.loaded = true;
          chunk.loading = false;
          chunk.loadTime = performance.now() - startTime;
          this.loadingChunks.delete(name);
          this.loadedChunks.add(name);
          return chunk;
        }
      }
      
      // Load files
      const files = await Promise.all(
        chunk.files.map(file => this.loadFile(file))
      );
      
      // Execute files
      await this.executeChunkFiles(name, files);
      
      // Cache the chunk
      if (this.options.enableCache) {
        this.setCache(name, files);
      }
      
      chunk.loaded = true;
      chunk.loading = false;
      chunk.loadTime = performance.now() - startTime;
      chunk.failed = false;
      
      this.loadingChunks.delete(name);
      this.loadedChunks.add(name);
      
      // Emit load event
      this.emitChunkEvent('loaded', name);
      
      return chunk;
      
    } catch (error) {
      chunk.loading = false;
      chunk.failed = true;
      chunk.loadTime = performance.now() - startTime;
      
      this.loadingChunks.delete(name);
      this.failedChunks.add(name);
      
      // Emit error event
      this.emitChunkEvent('error', name, error);
      
      // Retry if attempts remaining
      if (chunk.retryCount < this.options.retryAttempts) {
        setTimeout(() => {
          this.loadChunk(name);
        }, this.options.retryDelay * chunk.retryCount);
      }
      
      throw error;
    }
  }

  async loadFile(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      script.onload = () => {
        document.head.removeChild(script);
        resolve(url);
      };
      
      script.onerror = () => {
        document.head.removeChild(script);
        reject(new Error(`Failed to load script: ${url}`));
      };
      
      document.head.appendChild(script);
    });
  }

  async executeChunkFiles(name, files) {
    // Files are already executed by the browser when loaded
    // This method can be used for additional initialization
    const chunk = this.chunks.get(name);
    
    // Call chunk initialization if available
    if (window.chunkInitializers && window.chunkInitializers[name]) {
      await window.chunkInitializers[name]();
    }
    
    // Emit chunk ready event
    this.emitChunkEvent('ready', name);
  }

  async preloadChunk(name) {
    const chunk = this.chunks.get(name);
    
    if (!chunk || chunk.loaded || chunk.loading) {
      return;
    }
    
    // Preload without executing
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = chunk.files[0];
    
    document.head.appendChild(link);
    
    // Remove after preload
    setTimeout(() => {
      document.head.removeChild(link);
    }, 1000);
  }

  async prefetchChunk(name) {
    const chunk = this.chunks.get(name);
    
    if (!chunk || chunk.loaded || chunk.loading) {
      return;
    }
    
    // Prefetch with low priority
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = chunk.files[0];
    
    document.head.appendChild(link);
  }

  async preloadCriticalChunks() {
    const criticalChunks = Array.from(this.chunks.values())
      .filter(chunk => chunk.priority === 'high' || chunk.preload);
    
    for (const chunk of criticalChunks) {
      if (!chunk.loaded) {
        await this.loadChunk(chunk.name);
      }
    }
  }

  async prefetchHighPriorityChunks() {
    const highPriorityChunks = Array.from(this.chunks.values())
      .filter(chunk => chunk.priority === 'high' && !chunk.loaded);
    
    for (const chunk of highPriorityChunks) {
      this.prefetchChunk(chunk.name);
    }
  }

  prefetchChunks(names) {
    names.forEach(name => {
      this.prefetchChunk(name);
    });
  }

  unloadChunk(name) {
    const chunk = this.chunks.get(name);
    
    if (!chunk || !chunk.loaded) {
      return;
    }
    
    // Remove from loaded set
    this.loadedChunks.delete(name);
    
    // Reset chunk state
    chunk.loaded = false;
    chunk.loading = false;
    chunk.failed = false;
    chunk.loadTime = 0;
    
    // Emit unload event
    this.emitChunkEvent('unloaded', name);
  }

  waitForChunkLoad(name) {
    return new Promise((resolve, reject) => {
      const checkLoad = () => {
        const chunk = this.chunks.get(name);
        
        if (chunk.loaded) {
          resolve(chunk);
        } else if (chunk.failed) {
          reject(new Error(`Chunk "${name}" failed to load`));
        } else {
          setTimeout(checkLoad, 100);
        }
      };
      
      checkLoad();
    });
  }

  // Cache management
  getFromCache(name) {
    if (!this.options.enableCache) {
      return null;
    }
    
    const cached = this.cache.get(name);
    
    if (cached && Date.now() - cached.timestamp < this.options.cacheExpiration) {
      return cached;
    }
    
    // Remove expired cache
    if (cached) {
      this.cache.delete(name);
    }
    
    return null;
  }

  setCache(name, files) {
    if (!this.options.enableCache) {
      return;
    }
    
    this.cache.set(name, {
      files,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Event management
  emitChunkEvent(type, name, data = null) {
    const event = new CustomEvent(`chunk-${type}`, {
      detail: {
        chunk: name,
        data,
        timestamp: Date.now()
      }
    });
    
    document.dispatchEvent(event);
  }

  // Performance monitoring
  recordPerformanceMetric(entry) {
    const chunkName = this.extractChunkName(entry.name);
    
    if (!this.performanceMetrics.has(chunkName)) {
      this.performanceMetrics.set(chunkName, {
        loadTimes: [],
        sizes: [],
        errors: 0
      });
    }
    
    const metrics = this.performanceMetrics.get(chunkName);
    
    if (entry.duration) {
      metrics.loadTimes.push(entry.duration);
    }
    
    if (entry.transferSize) {
      metrics.sizes.push(entry.transferSize);
    }
    
    // Keep only last 100 measurements
    if (metrics.loadTimes.length > 100) {
      metrics.loadTimes.shift();
    }
    
    if (metrics.sizes.length > 100) {
      metrics.sizes.shift();
    }
  }

  extractChunkName(url) {
    const match = url.match(/chunk-(\w+)/);
    return match ? match[1] : 'unknown';
  }

  // Utility methods
  observeElement(element) {
    if (this.observer) {
      this.observer.observe(element);
    }
  }

  unobserveElement(element) {
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }

  // Getters
  getLoadedChunks() {
    return Array.from(this.loadedChunks);
  }

  getLoadingChunks() {
    return Array.from(this.loadingChunks);
  }

  getFailedChunks() {
    return Array.from(this.failedChunks);
  }

  getPerformanceMetrics() {
    return this.performanceMetrics;
  }

  getChunkInfo(name) {
    return this.chunks.get(name);
  }

  getAllChunks() {
    return Array.from(this.chunks.values());
  }

  // Dynamic chunk registration
  registerDynamicChunk(name, config) {
    this.registerChunk(name, config);
    
    // Auto-load if marked as preload
    if (config.preload) {
      this.loadChunk(name);
    }
  }

  // Batch operations
  async loadBatch(chunkNames) {
    const batches = this.chunkArray(chunkNames, this.options.maxConcurrentLoads);
    
    for (const batch of batches) {
      await this.loadChunks(batch);
    }
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Cleanup
  destroy() {
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    // Clear all data
    this.chunks.clear();
    this.loadedChunks.clear();
    this.loadingChunks.clear();
    this.failedChunks.clear();
    this.performanceMetrics.clear();
    this.cache.clear();
    
    // Remove global API
    delete window.websiteCodeSplitting;
  }
}

// Create global instance
window.websiteCodeSplitting = new WebsiteCodeSplitting({
  enableLazyLoading: true,
  enablePrefetching: true,
  enablePreloading: true,
  enableCompression: true,
  chunkSize: 50000,
  maxConcurrentLoads: 3,
  retryAttempts: 3,
  retryDelay: 1000,
  enableServiceWorker: true,
  enableCache: true,
  cacheExpiration: 3600000
});

// Auto-initialize critical chunks
document.addEventListener('DOMContentLoaded', () => {
  // Load core chunks immediately
  window.websiteCodeSplitting.loadChunk('core');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebsiteCodeSplitting;
}
