/**
 * Admin Dashboard Module Loader
 * Handles dynamic loading of admin modules with code splitting
 */

class AdminModuleLoader {
  constructor() {
    this.loadedModules = new Set();
    this.loadingPromises = new Map();
    this.moduleRegistry = new Map();
    this.core = null;
  }

  /**
   * Initialize the admin dashboard
   */
  async init() {
    console.log('🚀 Initializing Admin Dashboard...');
    
    try {
      // Load core functionality first
      await this.loadCore();
      
      // Initialize core
      this.core = new AdminDashboardCore();
      
      // Setup global error handling
      this.setupErrorHandling();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      console.log('✅ Admin Dashboard initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Admin Dashboard:', error);
      this.showError('Failed to initialize Admin Dashboard');
    }
  }

  /**
   * Load core dashboard functionality
   */
  async loadCore() {
    if (this.loadedModules.has('core')) {
      return;
    }

    return this.loadScript('/js/admin/dashboard-core.js', 'core');
  }

  /**
   * Load a specific module
   */
  async loadModule(moduleName) {
    if (this.loadedModules.has(moduleName)) {
      return this.moduleRegistry.get(moduleName);
    }

    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    const promise = this.loadScript(`/js/admin/modules/${moduleName}.js`, moduleName);
    this.loadingPromises.set(moduleName, promise);

    try {
      const module = await promise;
      this.loadedModules.add(moduleName);
      this.moduleRegistry.set(moduleName, module);
      this.loadingPromises.delete(moduleName);
      
      console.log(`✅ Module loaded: ${moduleName}`);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      console.error(`❌ Failed to load module: ${moduleName}`, error);
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
        if (window.AdminModules && window.AdminModules[moduleName]) {
          resolve(window.AdminModules[moduleName]);
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
          if (window.AdminModules && window.AdminModules[moduleName]) {
            resolve(window.AdminModules[moduleName]);
          } else {
            reject(new Error(`Module ${moduleName} not found in window.AdminModules`));
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
   * Preload critical modules
   */
  async preloadCriticalModules() {
    const criticalModules = ['ai-monitor', 'user-management'];
    
    console.log('📦 Preloading critical modules...');
    
    const preloadPromises = criticalModules.map(module => 
      this.loadModule(module).catch(error => {
        console.warn(`⚠️ Failed to preload module ${module}:`, error);
      })
    );
    
    await Promise.allSettled(preloadPromises);
    console.log('✅ Critical modules preloaded');
  }

  /**
   * Load module on demand
   */
  async loadModuleOnDemand(moduleName, trigger) {
    console.log(`🎯 Loading module on demand: ${moduleName} (trigger: ${trigger})`);
    
    try {
      const startTime = performance.now();
      const module = await this.loadModule(moduleName);
      const loadTime = performance.now() - startTime;
      
      // Track loading performance
      this.trackModuleLoad(moduleName, loadTime, trigger);
      
      return module;
    } catch (error) {
      console.error(`Failed to load module on demand: ${moduleName}`, error);
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
      window.gtag('event', 'module_load', {
        module_name: moduleName,
        load_time: Math.round(loadTime),
        trigger: trigger
      });
    }
  }

  /**
   * Setup error handling for module loading
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('/js/admin/')) {
        console.error('Module error:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
        
        this.showModuleError(event.message, event.filename);
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showModuleError('Unhandled promise rejection', 'unknown');
    });
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.name.includes('/js/admin/')) {
            console.log(`📊 Module performance: ${entry.name} - ${entry.duration}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Show module error to user
   */
  showModuleError(message, filename) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'module-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h4>⚠️ Module Error</h4>
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
    errorDiv.className = 'admin-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h3>❌ Dashboard Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" class="btn btn-primary">Reload Dashboard</button>
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
      const script = document.querySelector(`script[src*="/js/admin/modules/${moduleName}.js"]`);
      if (script) {
        script.remove();
      }
      
      // Clean up module from global scope
      if (window.AdminModules && window.AdminModules[moduleName]) {
        delete window.AdminModules[moduleName];
      }
      
      console.log(`🗑️ Module unloaded: ${moduleName}`);
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
  }
}

// Global instance
window.AdminModuleLoader = new AdminModuleLoader();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.AdminModuleLoader.init();
  });
} else {
  window.AdminModuleLoader.init();
}
