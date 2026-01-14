/**
 * Performance Monitoring to Main Website
 * Implements comprehensive performance monitoring and analytics
 */

class WebsitePerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enableCoreWebVitals: true,
      enableResourceTiming: true,
      enableUserTiming: true,
      enableErrorTracking: true,
      enableNetworkMonitoring: true,
      enableMemoryMonitoring: true,
      enableFrameRateMonitoring: true,
      enableInteractionMonitoring: true,
      enableAnalytics: true,
      reportingEndpoint: null,
      sampleRate: 1.0,
      debugMode: false,
      ...options
    };
    
    this.isInitialized = false;
    this.metrics = new Map();
    this.observers = new Set();
    this.performanceEntries = [];
    this.frameRateData = [];
    this.interactionData = [];
    this.errorData = [];
    this.networkData = [];
    this.memoryData = [];
    
    this.init();
  }

  init() {
    // Setup performance observers
    this.setupPerformanceObservers();
    
    // Setup monitoring systems
    this.setupCoreWebVitals();
    this.setupResourceTiming();
    this.setupUserTiming();
    this.setupErrorTracking();
    this.setupNetworkMonitoring();
    this.setupMemoryMonitoring();
    this.setupFrameRateMonitoring();
    this.setupInteractionMonitoring();
    
    // Setup analytics
    if (this.options.enableAnalytics) {
      this.setupAnalytics();
    }
    
    // Setup global API
    this.setupGlobalAPI();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Start monitoring
    this.startMonitoring();
    
    this.isInitialized = true;
  }

  setupPerformanceObservers() {
    // Performance Observer for various metrics
    if ('PerformanceObserver' in window) {
      // Core Web Vitals observer
      this.coreWebVitalsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.processCoreWebVital(entry);
        });
      });
      
      // Resource timing observer
      this.resourceTimingObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.processResourceTiming(entry);
        });
      });
      
      // User timing observer
      this.userTimingObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.processUserTiming(entry);
        });
      });
      
      // Layout shift observer
      this.layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.processLayoutShift(entry);
        });
      });
      
      // Long task observer
      this.longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.processLongTask(entry);
        });
      });
    }
  }

  setupCoreWebVitals() {
    if (!this.options.enableCoreWebVitals) {
      return;
    }
    
    // Largest Contentful Paint (LCP)
    if (this.coreWebVitalsObserver) {
      try {
        this.coreWebVitalsObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
      }
    }
    
    // First Input Delay (FID)
    if (this.coreWebVitalsObserver) {
      try {
        this.coreWebVitalsObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observer not supported');
      }
    }
    
    // Cumulative Layout Shift (CLS)
    if (this.layoutShiftObserver) {
      try {
        this.layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
    
    // First Contentful Paint (FCP)
    this.measureFirstContentfulPaint();
    
    // Time to Interactive (TTI)
    this.measureTimeToInteractive();
  }

  setupResourceTiming() {
    if (!this.options.enableResourceTiming) {
      return;
    }
    
    if (this.resourceTimingObserver) {
      try {
        this.resourceTimingObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        console.warn('Resource timing observer not supported');
      }
    }
  }

  setupUserTiming() {
    if (!this.options.enableUserTiming) {
      return;
    }
    
    if (this.userTimingObserver) {
      try {
        this.userTimingObserver.observe({ entryTypes: ['measure', 'mark'] });
      } catch (e) {
        console.warn('User timing observer not supported');
      }
    }
  }

  setupErrorTracking() {
    if (!this.options.enableErrorTracking) {
      return;
    }
    
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });
    
    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.trackError({
          type: 'resource',
          message: `Failed to load ${event.target.tagName}`,
          source: event.target.src || event.target.href,
          timestamp: Date.now()
        });
      }
    }, true);
  }

  setupNetworkMonitoring() {
    if (!this.options.enableNetworkMonitoring) {
      return;
    }
    
    // Monitor network information
    if ('connection' in navigator) {
      this.networkInfo = {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
      
      // Listen for network changes
      navigator.connection.addEventListener('change', () => {
        this.trackNetworkChange({
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData,
          timestamp: Date.now()
        });
      });
    }
    
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.trackNetworkRequest({
          url: typeof url === 'string' ? url : url.url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: endTime - startTime,
          success: response.ok,
          timestamp: Date.now()
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.trackNetworkRequest({
          url: typeof url === 'string' ? url : url.url,
          method: args[1]?.method || 'GET',
          status: 0,
          duration: endTime - startTime,
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
        
        throw error;
      }
    };
  }

  setupMemoryMonitoring() {
    if (!this.options.enableMemoryMonitoring) {
      return;
    }
    
    // Monitor memory usage (Chrome only)
    if ('memory' in performance) {
      this.memoryInterval = setInterval(() => {
        const memoryInfo = {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          timestamp: Date.now()
        };
        
        this.memoryData.push(memoryInfo);
        
        // Keep only last 100 entries
        if (this.memoryData.length > 100) {
          this.memoryData.shift();
        }
        
        // Check for memory leaks
        this.checkMemoryLeaks(memoryInfo);
      }, 5000); // Every 5 seconds
    }
  }

  setupFrameRateMonitoring() {
    if (!this.options.enableFrameRateMonitoring) {
      return;
    }
    
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFrameRate = (currentTime) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        this.frameRateData.push({
          fps,
          timestamp: Date.now()
        });
        
        // Keep only last 60 entries (1 minute of data)
        if (this.frameRateData.length > 60) {
          this.frameRateData.shift();
        }
        
        // Check for low frame rate
        if (fps < 30) {
          this.trackPerformanceIssue({
            type: 'low_fps',
            value: fps,
            timestamp: Date.now()
          });
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  setupInteractionMonitoring() {
    if (!this.options.enableInteractionMonitoring) {
      return;
    }
    
    // Monitor click interactions
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      
      // Use setTimeout to measure response time
      setTimeout(() => {
        const responseTime = performance.now() - startTime;
        
        this.trackInteraction({
          type: 'click',
          target: event.target.tagName,
          responseTime,
          timestamp: Date.now()
        });
      }, 0);
    });
    
    // Monitor scroll interactions
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        this.trackInteraction({
          type: 'scroll',
          timestamp: Date.now()
        });
      }, 100);
    });
    
    // Monitor form interactions
    document.addEventListener('submit', (event) => {
      const startTime = performance.now();
      
      setTimeout(() => {
        const responseTime = performance.now() - startTime;
        
        this.trackInteraction({
          type: 'form_submit',
          target: event.target.tagName,
          responseTime,
          timestamp: Date.now()
        });
      }, 0);
    });
  }

  setupAnalytics() {
    // Setup analytics collection
    this.analyticsData = {
      pageViews: 0,
      sessions: 0,
      bounceRate: 0,
      averageSessionDuration: 0,
      topPages: new Map(),
      userAgents: new Map(),
      referrers: new Map()
    };
    
    // Track page view
    this.trackPageView();
    
    // Track session start
    this.trackSessionStart();
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackPageHide();
      } else {
        this.trackPageShow();
      }
    });
  }

  setupGlobalAPI() {
    // Global performance monitoring API
    window.websitePerformanceMonitor = {
      // Metrics
      getMetrics: () => this.getMetrics(),
      getCoreWebVitals: () => this.getCoreWebVitals(),
      getResourceTiming: () => this.getResourceTiming(),
      getFrameRate: () => this.getFrameRate(),
      getMemoryUsage: () => this.getMemoryUsage(),
      getErrors: () => this.getErrors(),
      getNetworkData: () => this.getNetworkData(),
      
      // Custom tracking
      mark: (name) => this.mark(name),
      measure: (name, startMark, endMark) => this.measure(name, startMark, endMark),
      trackCustomMetric: (name, value, tags) => this.trackCustomMetric(name, value, tags),
      
      // Analytics
      trackPageView: (url) => this.trackPageView(url),
      trackEvent: (category, action, label, value) => this.trackEvent(category, action, label, value),
      
      // Controls
      startMonitoring: () => this.startMonitoring(),
      stopMonitoring: () => this.stopMonitoring(),
      sendMetrics: () => this.sendMetrics(),
      
      // Utilities
      generateReport: () => this.generateReport(),
      exportData: () => this.exportData(),
      clearData: () => this.clearData()
    };
  }

  setupEventListeners() {
    // Listen for page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics(true);
    });
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseMonitoring();
      } else {
        this.resumeMonitoring();
      }
    });
  }

  startMonitoring() {
    this.isMonitoring = true;
    this.startTime = performance.now();
    
    // Start all observers
    if (this.coreWebVitalsObserver) this.coreWebVitalsObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
    if (this.resourceTimingObserver) this.resourceTimingObserver.observe({ entryTypes: ['resource'] });
    if (this.userTimingObserver) this.userTimingObserver.observe({ entryTypes: ['measure', 'mark'] });
    if (this.layoutShiftObserver) this.layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    if (this.longTaskObserver) this.longTaskObserver.observe({ entryTypes: ['longtask'] });
  }

  stopMonitoring() {
    this.isMonitoring = false;
    
    // Disconnect all observers
    if (this.coreWebVitalsObserver) this.coreWebVitalsObserver.disconnect();
    if (this.resourceTimingObserver) this.resourceTimingObserver.disconnect();
    if (this.userTimingObserver) this.userTimingObserver.disconnect();
    if (this.layoutShiftObserver) this.layoutShiftObserver.disconnect();
    if (this.longTaskObserver) this.longTaskObserver.disconnect();
    
    // Clear intervals
    if (this.memoryInterval) clearInterval(this.memoryInterval);
  }

  pauseMonitoring() {
    this.isPaused = true;
  }

  resumeMonitoring() {
    this.isPaused = false;
  }

  // Core Web Vitals processing
  processCoreWebVital(entry) {
    const vital = {
      name: entry.name,
      value: entry.startTime,
      rating: this.rateVital(entry.name, entry.value),
      timestamp: Date.now()
    };
    
    this.metrics.set(entry.name, vital);
    
    // Notify observers
    this.notifyObservers('coreWebVital', vital);
  }

  processResourceTiming(entry) {
    const resource = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.duration,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      timestamp: Date.now()
    };
    
    this.performanceEntries.push(resource);
    
    // Keep only last 1000 entries
    if (this.performanceEntries.length > 1000) {
      this.performanceEntries.shift();
    }
    
    // Check for slow resources
    if (entry.duration > 1000) {
      this.trackPerformanceIssue({
        type: 'slow_resource',
        resource: entry.name,
        duration: entry.duration,
        timestamp: Date.now()
      });
    }
  }

  processUserTiming(entry) {
    const timing = {
      name: entry.name,
      type: entry.entryType,
      duration: entry.duration || 0,
      timestamp: Date.now()
    };
    
    this.metrics.set(entry.name, timing);
  }

  processLayoutShift(entry) {
    if (!entry.hadRecentInput) {
      this.cumulativeLayoutShift = (this.cumulativeLayoutShift || 0) + entry.value;
      
      this.metrics.set('CLS', {
        name: 'Cumulative Layout Shift',
        value: this.cumulativeLayoutShift,
        rating: this.rateVital('CLS', this.cumulativeLayoutShift),
        timestamp: Date.now()
      });
    }
  }

  processLongTask(entry) {
    this.trackPerformanceIssue({
      type: 'long_task',
      duration: entry.duration,
      timestamp: Date.now()
    });
  }

  // Measurement methods
  measureFirstContentfulPaint() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const fcp = entries[entries.length - 1];
        this.metrics.set('FCP', {
          name: 'First Contentful Paint',
          value: fcp.startTime,
          rating: this.rateVital('FCP', fcp.startTime),
          timestamp: Date.now()
        });
      }
    });
    
    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP observer not supported');
    }
  }

  measureTimeToInteractive() {
    // TTI calculation based on Long Tasks
    let ttiCandidate = 0;
    let lastLongTaskEnd = 0;
    
    if (this.longTaskObserver) {
      this.longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          lastLongTaskEnd = entry.startTime + entry.duration;
          
          // Look for 5 second window with no long tasks
          setTimeout(() => {
            if (performance.now() - lastLongTaskEnd >= 5000) {
              ttiCandidate = lastLongTaskEnd;
              
              this.metrics.set('TTI', {
                name: 'Time to Interactive',
                value: ttiCandidate,
                rating: this.rateVital('TTI', ttiCandidate),
                timestamp: Date.now()
              });
            }
          }, 5000);
        });
      });
      
      try {
        this.longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('TTI observer not supported');
      }
    }
  }

  // Tracking methods
  trackError(error) {
    this.errorData.push(error);
    
    // Keep only last 100 errors
    if (this.errorData.length > 100) {
      this.errorData.shift();
    }
    
    // Notify observers
    this.notifyObservers('error', error);
  }

  trackNetworkChange(networkInfo) {
    this.networkData.push({
      type: 'change',
      ...networkInfo
    });
  }

  trackNetworkRequest(request) {
    this.networkData.push(request);
    
    // Keep only last 500 requests
    if (this.networkData.length > 500) {
      this.networkData.shift();
    }
  }

  trackInteraction(interaction) {
    this.interactionData.push(interaction);
    
    // Keep only last 200 interactions
    if (this.interactionData.length > 200) {
      this.interactionData.shift();
    }
  }

  trackPerformanceIssue(issue) {
    this.metrics.set(`issue_${issue.type}`, issue);
    
    // Notify observers
    this.notifyObservers('performanceIssue', issue);
  }

  trackCustomMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    };
    
    this.metrics.set(name, metric);
    
    // Notify observers
    this.notifyObservers('customMetric', metric);
  }

  trackPageView(url = window.location.href) {
    this.analyticsData.pageViews++;
    
    const page = new URL(url).pathname;
    const currentCount = this.analyticsData.topPages.get(page) || 0;
    this.analyticsData.topPages.set(page, currentCount + 1);
  }

  trackEvent(category, action, label, value) {
    const event = {
      category,
      action,
      label,
      value,
      timestamp: Date.now()
    };
    
    this.notifyObservers('event', event);
  }

  trackSessionStart() {
    this.analyticsData.sessions++;
    this.sessionStartTime = Date.now();
  }

  trackPageHide() {
    this.pageHideTime = Date.now();
  }

  trackPageShow() {
    if (this.pageHideTime) {
      const hideDuration = Date.now() - this.pageHideTime;
      this.analyticsData.totalHiddenTime = (this.analyticsData.totalHiddenTime || 0) + hideDuration;
    }
  }

  // Utility methods
  mark(name) {
    if (performance.mark) {
      performance.mark(name);
    }
  }

  measure(name, startMark, endMark) {
    if (performance.measure) {
      performance.measure(name, startMark, endMark);
    }
  }

  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  rateVital(name, value) {
    const thresholds = {
      'LCP': { good: 2500, poor: 4000 },
      'FID': { good: 100, poor: 300 },
      'CLS': { good: 0.1, poor: 0.25 },
      'FCP': { good: 1800, poor: 3000 },
      'TTI': { good: 3800, poor: 7300 }
    };
    
    const threshold = thresholds[name];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  checkMemoryLeaks(memoryInfo) {
    const threshold = memoryInfo.jsHeapSizeLimit * 0.9;
    if (memoryInfo.usedJSHeapSize > threshold) {
      this.trackPerformanceIssue({
        type: 'memory_leak',
        usage: memoryInfo.usedJSHeapSize,
        limit: memoryInfo.jsHeapSizeLimit,
        timestamp: Date.now()
      });
    }
  }

  notifyObservers(type, data) {
    this.observers.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Observer error:', error);
      }
    });
  }

  // Data access methods
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  getCoreWebVitals() {
    return {
      LCP: this.metrics.get('largest-contentful-paint'),
      FID: this.metrics.get('first-input'),
      CLS: this.metrics.get('CLS'),
      FCP: this.metrics.get('FCP'),
      TTI: this.metrics.get('TTI')
    };
  }

  getResourceTiming() {
    return this.performanceEntries.slice(-100); // Last 100 entries
  }

  getFrameRate() {
    return this.frameRateData.slice(-60); // Last 60 entries
  }

  getMemoryUsage() {
    return this.memoryData.slice(-100); // Last 100 entries
  }

  getErrors() {
    return this.errorData.slice(-50); // Last 50 errors
  }

  getNetworkData() {
    return this.networkData.slice(-100); // Last 100 entries
  }

  // Reporting methods
  generateReport() {
    const coreWebVitals = this.getCoreWebVitals();
    const resourceTiming = this.getResourceTiming();
    const frameRate = this.getFrameRate();
    const memoryUsage = this.getMemoryUsage();
    const errors = this.getErrors();
    const networkData = this.getNetworkData();
    
    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      coreWebVitals,
      resourceTiming: {
        total: resourceTiming.length,
        averageDuration: resourceTiming.reduce((sum, r) => sum + r.duration, 0) / resourceTiming.length,
        slowResources: resourceTiming.filter(r => r.duration > 1000).length,
        cachedResources: resourceTiming.filter(r => r.cached).length
      },
      frameRate: {
        average: frameRate.reduce((sum, f) => sum + f.fps, 0) / frameRate.length,
        min: Math.min(...frameRate.map(f => f.fps)),
        max: Math.max(...frameRate.map(f => f.fps)),
        lowFrames: frameRate.filter(f => f.fps < 30).length
      },
      memoryUsage: memoryUsage.length > 0 ? {
        average: memoryUsage.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / memoryUsage.length,
        peak: Math.max(...memoryUsage.map(m => m.usedJSHeapSize)),
        current: memoryUsage[memoryUsage.length - 1].usedJSHeapSize
      } : null,
      errors: {
        total: errors.length,
        javascriptErrors: errors.filter(e => e.type === 'javascript').length,
        resourceErrors: errors.filter(e => e.type === 'resource').length,
        promiseErrors: errors.filter(e => e.type === 'promise').length
      },
      networkData: {
        total: networkData.length,
        averageDuration: networkData.reduce((sum, n) => sum + (n.duration || 0), 0) / networkData.length,
        failedRequests: networkData.filter(n => !n.success).length
      },
      analytics: this.analyticsData
    };
  }

  exportData() {
    return {
      metrics: this.getMetrics(),
      performanceEntries: this.performanceEntries,
      frameRateData: this.frameRateData,
      interactionData: this.interactionData,
      errorData: this.errorData,
      networkData: this.networkData,
      memoryData: this.memoryData,
      analyticsData: this.analyticsData
    };
  }

  clearData() {
    this.metrics.clear();
    this.performanceEntries = [];
    this.frameRateData = [];
    this.interactionData = [];
    this.errorData = [];
    this.networkData = [];
    this.memoryData = [];
  }

  sendMetrics(isBeacon = false) {
    if (!this.options.reportingEndpoint) {
      return;
    }
    
    const data = this.generateReport();
    
    if (isBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(this.options.reportingEndpoint, JSON.stringify(data));
    } else {
      fetch(this.options.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).catch(error => {
        console.warn('Failed to send metrics:', error);
      });
    }
  }

  // Observer management
  addObserver(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  removeObserver(callback) {
    this.observers.delete(callback);
  }

  // Cleanup
  destroy() {
    this.stopMonitoring();
    this.clearData();
    this.observers.clear();
    
    // Restore original fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    
    // Remove global API
    delete window.websitePerformanceMonitor;
  }
}

// Create global instance
window.websitePerformanceMonitor = new WebsitePerformanceMonitor({
  enableCoreWebVitals: true,
  enableResourceTiming: true,
  enableUserTiming: true,
  enableErrorTracking: true,
  enableNetworkMonitoring: true,
  enableMemoryMonitoring: true,
  enableFrameRateMonitoring: true,
  enableInteractionMonitoring: true,
  enableAnalytics: true,
  reportingEndpoint: null,
  sampleRate: 1.0,
  debugMode: false
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebsitePerformanceMonitor;
}
