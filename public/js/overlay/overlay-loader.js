/**
 * Overlay Module Loader
 * Handles dynamic loading of overlay modules with code splitting
 */

class OverlayModuleLoader {
  constructor() {
    this.loadedModules = new Set();
    this.loadingPromises = new Map();
    this.moduleRegistry = new Map();
    this.core = null;
    this.config = null;
    this.state = null;
  }

  /**
   * Initialize the overlay
   */
  async init() {
    console.log('🎮 Initializing Poker Overlay...');
    
    try {
      // Load configuration first
      await this.loadConfig();
      
      // Load core functionality
      await this.loadCore();
      
      // Initialize core
      this.core = new OverlayRenderCore();
      
      // Load state management
      await this.loadState();
      
      // Setup communication
      this.setupWebSocket();
      
      // Preload critical modules
      await this.preloadCriticalModules();
      
      console.log('✅ Poker Overlay initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Poker Overlay:', error);
      this.showError('Failed to initialize Poker Overlay');
    }
  }

  /**
   * Load overlay configuration
   */
  async loadConfig() {
    if (this.loadedModules.has('config')) {
      return;
    }

    return this.loadScript('/js/overlay/overlay-config.js', 'config').then(() => {
      this.config = window.overlayConfig;
    });
  }

  /**
   * Load core rendering functionality
   */
  async loadCore() {
    if (this.loadedModules.has('render-core')) {
      return;
    }

    return this.loadScript('/js/overlay/modules/overlay-render-core.js', 'render-core');
  }

  /**
   * Load state management
   */
  async loadState() {
    if (this.loadedModules.has('state')) {
      return;
    }

    return this.loadScript('/js/overlay/overlay-state.js', 'state').then(() => {
      this.state = window.overlayState;
    });
  }

  /**
   * Load a specific overlay module
   */
  async loadModule(moduleName) {
    if (this.loadedModules.has(moduleName)) {
      return this.moduleRegistry.get(moduleName);
    }

    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    const promise = this.loadScript(`/js/overlay/modules/${moduleName}.js`, moduleName);
    this.loadingPromises.set(moduleName, promise);

    try {
      const module = await promise;
      this.loadedModules.add(moduleName);
      this.moduleRegistry.set(moduleName, module);
      this.loadingPromises.delete(moduleName);
      
      console.log(`✅ Overlay module loaded: ${moduleName}`);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      console.error(`❌ Failed to load overlay module: ${moduleName}`, error);
      throw error;
    }
  }

  /**
   * Load a script dynamically
   */
  loadScript(url, moduleName) {
    return new Promise((resolve, reject) => {
      // Check if already loaded via script tag
      const existingScript = document.querySelector(`script[src="${url}"]`);
      if (existingScript) {
        if (window.OverlayModules && window.OverlayModules[moduleName]) {
          resolve(window.OverlayModules[moduleName]);
        } else {
          reject(new Error(`Script loaded but module ${moduleName} not found`));
        }
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      script.onload = () => {
        // Small delay to ensure module is registered
        setTimeout(() => {
          if (window.OverlayModules && window.OverlayModules[moduleName]) {
            resolve(window.OverlayModules[moduleName]);
          } else {
            reject(new Error(`Module ${moduleName} not found in window.OverlayModules`));
          }
        }, 100);
      };
      
      script.onerror = () => {
        reject(new Error(`Failed to load script: ${url}`));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Setup WebSocket connection
   */
  async setupWebSocket() {
    await this.loadModule('connection');
    
    const connectionModule = this.moduleRegistry.get('connection');
    if (connectionModule) {
      this.ws = connectionModule.createConnection(this.config.websocketUrl);
      
      this.ws.on('stateUpdate', (data) => {
        this.handleStateUpdate(data);
      });
      
      this.ws.on('animation', (data) => {
        this.handleAnimation(data);
      });
    }
  }

  /**
   * Preload critical overlay modules
   */
  async preloadCriticalModules() {
    const criticalModules = ['animations', 'effects', 'sounds'];
    
    console.log('📦 Preloading critical overlay modules...');
    
    const preloadPromises = criticalModules.map(module => 
      this.loadModule(module).catch(error => {
        console.warn(`⚠️ Failed to preload overlay module ${module}:`, error);
      })
    );
    
    await Promise.allSettled(preloadPromises);
    console.log('✅ Critical overlay modules preloaded');
  }

  /**
   * Load module on demand
   */
  async loadModuleOnDemand(moduleName, trigger) {
    console.log(`🎯 Loading overlay module on demand: ${moduleName} (trigger: ${trigger})`);
    
    try {
      const startTime = performance.now();
      const module = await this.loadModule(moduleName);
      const loadTime = performance.now() - startTime;
      
      // Track loading performance
      this.trackModuleLoad(moduleName, loadTime, trigger);
      
      return module;
    } catch (error) {
      console.error(`Failed to load overlay module on demand: ${moduleName}`, error);
      throw error;
    }
  }

  /**
   * Track module loading performance
   */
  trackModuleLoad(moduleName, loadTime, trigger) {
    if (!this.moduleLoadTimes) {
      this.moduleLoadTimes = [];
    }
    
    this.moduleLoadTimes.push({
      module: moduleName,
      loadTime,
      trigger,
      timestamp: Date.now()
    });
    
    // Send analytics if available
    if (window.gtag) {
      window.gtag('event', 'overlay_module_load', {
        module_name: moduleName,
        load_time: Math.round(loadTime),
        trigger: trigger
      });
    }
  }

  /**
   * Handle state updates
   */
  handleStateUpdate(data) {
    if (this.state) {
      this.state.update(data);
    }
    
    // Emit state update event
    window.dispatchEvent(new CustomEvent('overlayStateUpdate', {
      detail: data
    }));
  }

  /**
   * Handle animations
   */
  handleAnimation(data) {
    // Emit animation event
    window.dispatchEvent(new CustomEvent('overlayAnimation', {
      detail: data
    }));
  }

  /**
   * Setup error handling for module loading
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('/js/overlay/')) {
        console.error('Overlay module error:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
        
        this.showModuleError(event.message, event.filename);
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection in overlay:', event.reason);
      this.showModuleError('Unhandled promise rejection', 'unknown');
    });
  }

  /**
   * Show module error to user
   */
  showModuleError(message, filename) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'overlay-module-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h4>⚠️ Overlay Module Error</h4>
        <p>${message}</p>
        <p><small>File: ${filename}</small></p>
        <button onclick="this.parentElement.parentElement.remove()" class="btn btn-sm">Dismiss</button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 10000);
  }

  /**
   * Show general error
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'overlay-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h3>❌ Overlay Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" class="btn btn-primary">Reload Overlay</button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
  }

  /**
   * Get loaded modules
   */
  getLoadedModules() {
    return Array.from(this.loadedModules);
  }

  /**
   * Get module load times
   */
  getModuleLoadTimes() {
    return this.moduleLoadTimes || [];
  }

  /**
   * Check if module is loaded
   */
  isModuleLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Unload a module (for development)
   */
  unloadModule(moduleName) {
    if (this.loadedModules.has(moduleName)) {
      this.loadedModules.delete(moduleName);
      this.moduleRegistry.delete(moduleName);
      
      // Remove script tag
      const script = document.querySelector(`script[src*="/js/overlay/modules/${moduleName}.js"]`);
      if (script) {
        script.remove();
      }
      
      // Clean up module from global scope
      if (window.OverlayModules && window.OverlayModules[moduleName]) {
        delete window.OverlayModules[moduleName];
      }
      
      console.log(`🗑️ Overlay module unloaded: ${moduleName}`);
    }
  }

  /**
   * Get module statistics
   */
  getModuleStats() {
    return {
      totalLoaded: this.loadedModules.size,
      loadedModules: Array.from(this.loadedModules),
      loadTimes: this.getModuleLoadTimes(),
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Unload all modules
    this.loadedModules.forEach(moduleName => {
      this.unloadModule(moduleName);
    });
    
    // Clear references
    this.loadedModules.clear();
    this.loadingPromises.clear();
    this.moduleRegistry.clear();
    this.core = null;
    this.config = null;
    this.state = null;
    
    // Close WebSocket
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Global instance
window.OverlayModuleLoader = new OverlayModuleLoader();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.OverlayModuleLoader.init();
  });
} else {
  window.OverlayModuleLoader.init();
}
