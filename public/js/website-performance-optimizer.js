/**
 * Performance Optimization for Main Website
 * Implements lazy loading, code splitting, and performance monitoring
 */

class WebsitePerformanceOptimizer {
  constructor(options = {}) {
    this.options = {
      enableLazyLoading: true,
      enableCodeSplitting: true,
      enableImageOptimization: true,
      enableCaching: true,
      enablePerformanceMonitoring: true,
      enablePreloading: true,
      enableMinification: true,
      debugMode: false,
      ...options
    };
    
    this.isInitialized = false;
    this.performanceMetrics = new Map();
    this.loadedModules = new Set();
    this.cache = new Map();
    this.observers = new Map();
    
    this.init();
  }

  init() {
    // Setup performance monitoring
    if (this.options.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }
    
    // Setup lazy loading
    if (this.options.enableLazyLoading) {
      this.setupLazyLoading();
    }
    
    // Setup image optimization
    if (this.options.enableImageOptimization) {
      this.setupImageOptimization();
    }
    
    // Setup caching
    if (this.options.enableCaching) {
      this.setupCaching();
    }
    
    // Setup preloading
    if (this.options.enablePreloading) {
      this.setupPreloading();
    }
    
    // Setup code splitting
    if (this.options.enableCodeSplitting) {
      this.setupCodeSplitting();
    }
    
    this.isInitialized = true;
  }

  setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      this.recordPageLoadMetrics();
    });
    
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Setup performance observer
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }
    
    // Monitor user interactions
    this.setupUserInteractionMonitoring();
  }

  recordPageLoadMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return;
    
    const metrics = {
      // Navigation timing
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
      ttfb: navigation.responseStart - navigation.requestStart,
      download: navigation.responseEnd - navigation.responseStart,
      domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
      domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Overall metrics
      totalTime: navigation.loadEventEnd - navigation.navigationStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0
    };
    
    // Get paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });
    
    // Get LCP
    this.getLargestContentfulPaint().then(lcp => {
      metrics.largestContentfulPaint = lcp;
      this.saveMetrics('pageLoad', metrics);
    });
    
    if (this.options.debugMode) {
      console.log('Page load metrics:', metrics);
    }
  }

  monitorCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
  }

  observeLCP() {
    if (!('PerformanceObserver' in window)) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.saveMetrics('lcp', {
        value: lastEntry.startTime,
        element: lastEntry.element?.tagName || 'unknown',
        url: lastEntry.url || '',
        timestamp: Date.now()
      });
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', observer);
  }

  observeFID() {
    if (!('PerformanceObserver' in window)) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-input') {
          this.saveMetrics('fid', {
            value: entry.processingStart - entry.startTime,
            inputType: entry.name,
            timestamp: Date.now()
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', observer);
  }

  observeCLS() {
    if (!('PerformanceObserver' in window)) return;
    
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries = [];
    
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          sessionValue += entry.value;
          sessionEntries.push(entry);
          
          // Only keep sessions for 5 seconds
          if (sessionEntries.length > 0) {
            const firstEntry = sessionEntries[0];
            if (entry.startTime - firstEntry.startTime > 5000) {
              sessionValue = 0;
              sessionEntries = [];
            }
          }
          
          clsValue = Math.max(clsValue, sessionValue);
          
          this.saveMetrics('cls', {
            value: clsValue,
            entries: sessionEntries.length,
            timestamp: Date.now()
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', observer);
  }

  setupPerformanceObserver() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.duration > 50) { // Long task threshold
            this.saveMetrics('longTask', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
              timestamp: Date.now()
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    }
  }

  setupUserInteractionMonitoring() {
    // Monitor click performance
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const endTime = performance.now();
        this.saveMetrics('click', {
          duration: endTime - startTime,
          target: event.target.tagName,
          timestamp: Date.now()
        });
      });
    });
    
    // Monitor scroll performance
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      
      scrollTimeout = setTimeout(() => {
        const scrollMetrics = this.getScrollMetrics();
        this.saveMetrics('scroll', scrollMetrics);
        scrollTimeout = null;
      }, 100);
    });
  }

  setupLazyLoading() {
    // Lazy load images
    this.lazyLoadImages();
    
    // Lazy load iframes
    this.lazyLoadIframes();
    
    // Lazy load videos
    this.lazyLoadVideos();
    
    // Lazy load components
    this.lazyLoadComponents();
  }

  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.1
      });
      
      images.forEach(img => imageObserver.observe(img));
      this.observers.set('images', imageObserver);
    } else {
      // Fallback for older browsers
      images.forEach(img => this.loadImage(img));
    }
  }

  loadImage(img) {
    const startTime = performance.now();
    
    if (img.dataset.src) {
      img.src = img.dataset.src;
      delete img.dataset.src;
    }
    
    img.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      this.saveMetrics('imageLoad', {
        duration: loadTime,
        src: img.src,
        timestamp: Date.now()
      });
      
      img.classList.add('loaded');
    });
    
    img.addEventListener('error', () => {
      this.saveMetrics('imageError', {
        src: img.src,
        timestamp: Date.now()
      });
      
      img.classList.add('error');
    });
  }

  lazyLoadIframes() {
    const iframes = document.querySelectorAll('iframe[data-src]');
    
    if ('IntersectionObserver' in window) {
      const iframeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const iframe = entry.target;
            iframe.src = iframe.dataset.src;
            delete iframe.dataset.src;
            iframeObserver.unobserve(iframe);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.1
      });
      
      iframes.forEach(iframe => iframeObserver.observe(iframe));
      this.observers.set('iframes', iframeObserver);
    }
  }

  lazyLoadVideos() {
    const videos = document.querySelectorAll('video[data-src]');
    
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const video = entry.target;
            video.src = video.dataset.src;
            delete video.dataset.src;
            videoObserver.unobserve(video);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.1
      });
      
      videos.forEach(video => videoObserver.observe(video));
      this.observers.set('videos', videoObserver);
    }
  }

  lazyLoadComponents() {
    // Find components with data-lazy attribute
    const components = document.querySelectorAll('[data-lazy]');
    
    if ('IntersectionObserver' in window) {
      const componentObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const component = entry.target;
            this.loadComponent(component);
            componentObserver.unobserve(component);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.1
      });
      
      components.forEach(component => componentObserver.observe(component));
      this.observers.set('components', componentObserver);
    }
  }

  loadComponent(element) {
    const componentName = element.getAttribute('data-lazy');
    const startTime = performance.now();
    
    // Load component script or module
    if (componentName) {
      this.loadModule(componentName)
        .then(() => {
          const loadTime = performance.now() - startTime;
          this.saveMetrics('componentLoad', {
            component: componentName,
            duration: loadTime,
            timestamp: Date.now()
          });
          
          element.classList.add('loaded');
        })
        .catch(error => {
          this.saveMetrics('componentError', {
            component: componentName,
            error: error.message,
            timestamp: Date.now()
          });
          
          element.classList.add('error');
        });
    }
  }

  setupImageOptimization() {
    // Optimize existing images
    this.optimizeExistingImages();
    
    // Setup WebP support
    this.setupWebPSupport();
    
    // Setup responsive images
    this.setupResponsiveImages();
  }

  optimizeExistingImages() {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach(img => {
      // Add loading attribute
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Add alt text if missing
      if (!img.hasAttribute('alt')) {
        img.setAttribute('alt', 'Image');
      }
      
      // Mark as optimized
      img.setAttribute('data-optimized', 'true');
    });
  }

  setupWebPSupport() {
    // Check WebP support
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      const supported = webP.height === 2;
      document.body.classList.toggle('webp', supported);
      document.body.classList.toggle('no-webp', !supported);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgTuSygSJc/3f759TR1BSWvWAtbRhAgAFAAARwAQAWKwARDwARABkADQbAA7Y7AA';
  }

  setupResponsiveImages() {
    const images = document.querySelectorAll('img[srcset], picture img');
    
    images.forEach(img => {
      // Add sizes attribute if missing
      if (!img.hasAttribute('sizes') && img.srcset) {
        // Calculate appropriate sizes based on image context
        const sizes = this.calculateImageSizes(img);
        img.setAttribute('sizes', sizes);
      }
    });
  }

  calculateImageSizes(img) {
    // Simple logic to calculate sizes
    const width = img.offsetWidth || img.getAttribute('width') || 800;
    const parentWidth = img.parentElement?.offsetWidth || window.innerWidth;
    
    if (width >= parentWidth * 0.8) {
      return '100vw';
    } else if (width >= parentWidth * 0.5) {
      return '75vw';
    } else {
      return '50vw';
    }
  }

  setupCaching() {
    // Setup service worker for caching
    this.setupServiceWorker();
    
    // Setup memory caching
    this.setupMemoryCache();
    
    // Setup local storage caching
    this.setupLocalStorageCache();
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  setupMemoryCache() {
    // Simple in-memory cache for frequently accessed data
    this.cache = new Map();
    
    // Add cache methods to global scope
    window.pokerCache = {
      get: (key) => this.cache.get(key),
      set: (key, value, ttl = 300000) => {
        this.cache.set(key, {
          value,
          expires: Date.now() + ttl
        });
      },
      clear: () => this.cache.clear(),
      cleanup: () => {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
          if (item.expires < now) {
            this.cache.delete(key);
          }
        }
      }
    };
    
    // Cleanup expired cache items periodically
    setInterval(() => {
      window.pokerCache.cleanup();
    }, 60000); // Every minute
  }

  setupLocalStorageCache() {
    // Enhanced localStorage with TTL support
    window.pokerStorage = {
      get: (key) => {
        try {
          const item = localStorage.getItem(key);
          if (!item) return null;
          
          const parsed = JSON.parse(item);
          if (parsed.expires && parsed.expires < Date.now()) {
            localStorage.removeItem(key);
            return null;
          }
          
          return parsed.value;
        } catch (error) {
          return null;
        }
      },
      set: (key, value, ttl = 3600000) => {
        try {
          const item = {
            value,
            expires: Date.now() + ttl
          };
          localStorage.setItem(key, JSON.stringify(item));
        } catch (error) {
          console.error('LocalStorage set error:', error);
        }
      },
      remove: (key) => {
        localStorage.removeItem(key);
      },
      clear: () => {
        localStorage.clear();
      }
    };
  }

  setupPreloading() {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Preload based on user interaction
    this.setupInteractionPreloading();
  }

  preloadCriticalResources() {
    // Preload critical CSS
    this.preloadStylesheet('/css/style.css');
    
    // Preload critical fonts
    this.preloadFont('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    // Preload critical images
    this.preloadImage('/logo.png');
  }

  preloadStylesheet(href) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  }

  preloadFont(href) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  preloadImage(src) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }

  setupInteractionPreloading() {
    // Preload on hover
    document.addEventListener('mouseover', (event) => {
      const target = event.target;
      
      if (target.tagName === 'A' && target.href) {
        this.preloadPage(target.href);
      }
    }, { passive: true });
    
    // Preload on focus
    document.addEventListener('focus', (event) => {
      const target = event.target;
      
      if (target.tagName === 'A' && target.href) {
        this.preloadPage(target.href);
      }
    }, { passive: true });
  }

  preloadPage(url) {
    if (this.loadedModules.has(url)) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
    
    this.loadedModules.add(url);
  }

  setupCodeSplitting() {
    // Dynamic import based on route
    this.setupRouteBasedSplitting();
    
    // Dynamic import based on user interaction
    this.setupInteractionBasedSplitting();
  }

  setupRouteBasedSplitting() {
    // Split by page sections
    const routes = {
      '/': ['home', 'landing'],
      '/about': ['about'],
      '/features': ['features'],
      '/contact': ['contact']
    };
    
    const currentPath = window.location.pathname;
    const routeModules = routes[currentPath] || ['home'];
    
    routeModules.forEach(module => {
      this.loadModule(module);
    });
  }

  setupInteractionBasedSplitting() {
    // Load modules on specific interactions
    document.addEventListener('click', (event) => {
      const target = event.target;
      
      // Load contact form when clicking contact button
      if (target.matches('[data-load="contact-form"]')) {
        this.loadModule('contact-form');
      }
      
      // Load gallery when clicking gallery button
      if (target.matches('[data-load="gallery"]')) {
        this.loadModule('gallery');
      }
    });
  }

  async loadModule(moduleName) {
    if (this.loadedModules.has(moduleName)) return;
    
    try {
      const startTime = performance.now();
      
      // Dynamic import
      const module = await import(`/js/modules/${moduleName}.js`);
      
      const loadTime = performance.now() - startTime;
      this.saveMetrics('moduleLoad', {
        module: moduleName,
        duration: loadTime,
        timestamp: Date.now()
      });
      
      this.loadedModules.add(moduleName);
      
      if (this.options.debugMode) {
        console.log(`Module loaded: ${moduleName} (${loadTime.toFixed(2)}ms)`);
      }
      
      return module;
    } catch (error) {
      this.saveMetrics('moduleError', {
        module: moduleName,
        error: error.message,
        timestamp: Date.now()
      });
      
      console.error(`Failed to load module: ${moduleName}`, error);
    }
  }

  // Utility methods
  async getLargestContentfulPaint() {
    return new Promise((resolve) => {
      if (!('PerformanceObserver' in window)) {
        resolve(0);
        return;
      }
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
        observer.disconnect();
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    });
  }

  getScrollMetrics() {
    return {
      scrollTop: window.pageYOffset,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      scrollPercentage: (window.pageYOffset / (document.documentElement.scrollHeight - document.documentElement.clientHeight)) * 100
    };
  }

  saveMetrics(type, data) {
    if (!this.performanceMetrics.has(type)) {
      this.performanceMetrics.set(type, []);
    }
    
    const metrics = this.performanceMetrics.get(type);
    metrics.push({
      ...data,
      timestamp: Date.now()
    });
    
    // Keep only last 100 entries
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  // Public API
  getMetrics(type) {
    return this.performanceMetrics.get(type) || [];
  }

  getAllMetrics() {
    const allMetrics = {};
    this.performanceMetrics.forEach((metrics, type) => {
      allMetrics[type] = metrics;
    });
    return allMetrics;
  }

  getPerformanceReport() {
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: {}
    };
    
    // Core Web Vitals
    const lcp = this.getMetrics('lcp');
    if (lcp.length > 0) {
      report.metrics.lcp = lcp[lcp.length - 1];
    }
    
    const fid = this.getMetrics('fid');
    if (fid.length > 0) {
      report.metrics.fid = fid[fid.length - 1];
    }
    
    const cls = this.getMetrics('cls');
    if (cls.length > 0) {
      report.metrics.cls = cls[cls.length - 1];
    }
    
    // Page load metrics
    const pageLoad = this.getMetrics('pageLoad');
    if (pageLoad.length > 0) {
      report.metrics.pageLoad = pageLoad[pageLoad.length - 1];
    }
    
    // Resource metrics
    const imageLoads = this.getMetrics('imageLoad');
    const componentLoads = this.getMetrics('componentLoad');
    const moduleLoads = this.getMetrics('moduleLoad');
    
    if (imageLoads.length > 0) {
      report.metrics.imageLoads = {
        count: imageLoads.length,
        averageLoadTime: imageLoads.reduce((sum, m) => sum + m.duration, 0) / imageLoads.length,
        errors: this.getMetrics('imageError').length
      };
    }
    
    if (componentLoads.length > 0) {
      report.metrics.componentLoads = {
        count: componentLoads.length,
        averageLoadTime: componentLoads.reduce((sum, m) => sum + m.duration, 0) / componentLoads.length,
        errors: this.getMetrics('componentError').length
      };
    }
    
    if (moduleLoads.length > 0) {
      report.metrics.moduleLoads = {
        count: moduleLoads.length,
        averageLoadTime: moduleLoads.reduce((sum, m) => sum + m.duration, 0) / moduleLoads.length,
        errors: this.getMetrics('moduleError').length
      };
    }
    
    return report;
  }

  optimizePerformance() {
    // Run performance optimizations
    this.optimizeImages();
    this.optimizeAnimations();
    this.optimizeEventListeners();
    this.cleanupMemory();
  }

  optimizeImages() {
    // Compress images if possible
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.naturalWidth > 2000) {
        // Large image - could be optimized
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
    });
  }

  optimizeAnimations() {
    // Reduce animation complexity on low-end devices
    if (navigator.hardwareConcurrency < 4) {
      document.body.classList.add('reduce-animations');
      
      const style = document.createElement('style');
      style.textContent = `
        .reduce-animations * {
          animation-duration: 0.01s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01s !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  optimizeEventListeners() {
    // Use passive event listeners where possible
    const events = ['scroll', 'touchstart', 'touchmove'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, () => {
        // Passive event listener
      }, { passive: true });
    });
  }

  cleanupMemory() {
    // Clean up expired cache items
    if (window.pokerCache) {
      window.pokerCache.cleanup();
    }
    
    // Clean up observers
    this.observers.forEach(observer => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    });
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  // Export performance data
  exportMetrics() {
    const report = this.getPerformanceReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  // Cleanup
  destroy() {
    // Disconnect all observers
    this.observers.forEach(observer => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    });
    
    // Clear caches
    this.cache.clear();
    this.performanceMetrics.clear();
    this.loadedModules.clear();
    
    // Remove global objects
    delete window.pokerCache;
    delete window.pokerStorage;
  }
}

// Create global instance
window.websitePerformanceOptimizer = new WebsitePerformanceOptimizer({
  enableLazyLoading: true,
  enableCodeSplitting: true,
  enableImageOptimization: true,
  enableCaching: true,
  enablePerformanceMonitoring: true,
  enablePreloading: true,
  enableMinification: true,
  debugMode: false
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebsitePerformanceOptimizer;
}
