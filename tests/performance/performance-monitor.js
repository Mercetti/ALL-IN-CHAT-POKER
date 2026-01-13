/**
 * Performance Monitor Utility
 * Comprehensive performance monitoring and benchmarking tools
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      pageLoad: 3000,      // 3 seconds
      apiResponse: 1000,  // 1 second
      memoryUsage: 100 * 1024 * 1024, // 100MB
      frameRate: 55,       // 55fps minimum
      webSocket: 1000      // 1 second
    };
    
    this.measurements = {
      navigation: [],
      resources: [],
      paint: [],
      layout: [],
      memory: [],
      frameRate: []
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    this.setupPerformanceObserver();
    this.setupMemoryMonitoring();
    this.setupFrameRateMonitoring();
  }

  /**
   * Setup Performance Observer API
   */
  setupPerformanceObserver() {
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          switch (entry.entryType) {
            case 'navigation':
              this.measurements.navigation.push({
                name: entry.name,
                loadTime: entry.loadEventEnd - entry.fetchStart,
                domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
                firstPaint: entry.responseStart - entry.fetchStart,
                timestamp: entry.startTime
              });
              break;
              
            case 'resource':
              this.measurements.resources.push({
                name: entry.name,
                type: this.getResourceType(entry.name),
                duration: entry.duration,
                size: entry.transferSize || 0,
                timestamp: entry.startTime
              });
              break;
              
            case 'paint':
              this.measurements.paint.push({
                name: entry.name,
                time: entry.startTime,
                timestamp: entry.startTime
              });
              break;
              
            case 'layout':
              this.measurements.layout.push({
                duration: entry.duration,
                timestamp: entry.startTime
              });
              break;
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'layout'] });
    }
  }

  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    if (performance.memory) {
      const measureMemory = () => {
        this.measurements.memory.push({
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          timestamp: Date.now()
        });
      };
      
      // Measure memory every 5 seconds
      setInterval(measureMemory, 5000);
    }
  }

  /**
   * Setup frame rate monitoring
   */
  setupFrameRateMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        this.measurements.frameRate.push({
          fps: fps,
          timestamp: currentTime
        });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.gif')) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Measure page load performance
   */
  async measurePageLoad(page) {
    const startTime = performance.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = performance.now() - startTime;
    
    // Get navigation timing
    const navigationTiming = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: timing.responseStart - timing.navigationStart,
        firstContentfulPaint: timing.firstContentfulPaint
      };
    });
    
    return {
      loadTime,
      navigationTiming,
      withinThreshold: loadTime <= this.thresholds.pageLoad
    };
  }

  /**
   * Measure API performance
   */
  async measureAPIPerformance(page, endpoint) {
    const startTime = performance.now();
    
    const response = await page.evaluate(async (url) => {
      const start = performance.now();
      const response = await fetch(url);
      const end = performance.now();
      
      return {
        status: response.status,
        responseTime: end - start,
        size: response.headers.get('content-length') || 0
      };
    }, endpoint);
    
    const totalTime = performance.now() - startTime;
    
    return {
      ...response,
      totalTime,
      withinThreshold: response.responseTime <= this.thresholds.apiResponse
    };
  }

  /**
   * Measure WebSocket performance
   */
  async measureWebSocketPerformance(page, url) {
    return await page.evaluate(async (wsUrl) => {
      return new Promise((resolve) => {
        const startTime = performance.now();
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          const connectionTime = performance.now() - startTime;
          
          // Test message round-trip time
          const messageStart = performance.now();
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          
          ws.onmessage = () => {
            const roundTripTime = performance.now() - messageStart;
            
            resolve({
              connectionTime,
              roundTripTime,
              withinThreshold: connectionTime <= 1000 && roundTripTime <= 500
            });
            
            ws.close();
          };
        };
        
        ws.onerror = () => {
          resolve({
            connectionTime: 10000,
            roundTripTime: 10000,
            withinThreshold: false
          });
        };
        
        // Timeout fallback
        setTimeout(() => {
          resolve({
            connectionTime: 10000,
            roundTripTime: 10000,
            withinThreshold: false
          });
        }, 5000);
      });
    }, url);
  }

  /**
   * Measure memory usage
   */
  measureMemoryUsage() {
    if (!performance.memory) {
      return { available: false };
    }
    
    const memory = {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      withinThreshold: performance.memory.usedJSHeapSize <= this.thresholds.memoryUsage
    };
    
    memory.utilization = (memory.used / memory.limit) * 100;
    
    return memory;
  }

  /**
   * Measure frame rate
   */
  getFrameRateMetrics() {
    if (this.measurements.frameRate.length === 0) {
      return { available: false };
    }
    
    const recentFrames = this.measurements.frameRate.slice(-10);
    const avgFps = recentFrames.reduce((sum, frame) => sum + frame.fps, 0) / recentFrames.length;
    const minFps = Math.min(...recentFrames.map(f => f.fps));
    const maxFps = Math.max(...recentFrames.map(f => f.fps));
    
    return {
      average: Math.round(avgFps),
      min: minFps,
      max: maxFps,
      withinThreshold: avgFps >= this.thresholds.frameRate
    };
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      thresholds: this.thresholds,
      measurements: {
        pageLoad: this.getAverageMetric('navigation', 'loadTime'),
        apiResponse: this.getAverageMetric('resources', 'duration'),
        memory: this.getLatestMetric('memory'),
        frameRate: this.getFrameRateMetrics()
      },
      issues: this.identifyIssues(),
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  /**
   * Get average metric
   */
  getAverageMetric(measurementType, metric) {
    const measurements = this.measurements[measurementType];
    if (!measurements || measurements.length === 0) {
      return { available: false };
    }
    
    const values = measurements.map(m => m[metric]).filter(v => v !== undefined);
    if (values.length === 0) {
      return { available: false };
    }
    
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return {
      average: Math.round(average),
      min,
      max,
      samples: values.length
    };
  }

  /**
   * Get latest metric
   */
  getLatestMetric(measurementType) {
    const measurements = this.measurements[measurementType];
    if (!measurements || measurements.length === 0) {
      return { available: false };
    }
    
    return measurements[measurements.length - 1];
  }

  /**
   * Identify performance issues
   */
  identifyIssues() {
    const issues = [];
    
    // Check page load times
    const pageLoad = this.getAverageMetric('navigation', 'loadTime');
    if (pageLoad.available && pageLoad.average > this.thresholds.pageLoad) {
      issues.push({
        type: 'page_load',
        severity: 'high',
        message: `Page load time (${pageLoad.average}ms) exceeds threshold (${this.thresholds.pageLoad}ms)`,
        recommendation: 'Optimize critical rendering path, reduce bundle size'
      });
    }
    
    // Check API response times
    const apiResponse = this.getAverageMetric('resources', 'duration');
    if (apiResponse.available && apiResponse.average > this.thresholds.apiResponse) {
      issues.push({
        type: 'api_response',
        severity: 'medium',
        message: `API response time (${apiResponse.average}ms) exceeds threshold (${this.thresholds.apiResponse}ms)`,
        recommendation: 'Implement caching, optimize database queries'
      });
    }
    
    // Check memory usage
    const memory = this.getLatestMetric('memory');
    if (memory.available && memory.used > this.thresholds.memoryUsage) {
      issues.push({
        type: 'memory',
        severity: 'high',
        message: `Memory usage (${Math.round(memory.used / 1024 / 1024)}MB) exceeds threshold (${Math.round(this.thresholds.memoryUsage / 1024 / 1024)}MB)`,
        recommendation: 'Check for memory leaks, optimize data structures'
      });
    }
    
    // Check frame rate
    const frameRate = this.getFrameRateMetrics();
    if (frameRate.available && frameRate.average < this.thresholds.frameRate) {
      issues.push({
        type: 'frame_rate',
        severity: 'medium',
        message: `Frame rate (${frameRate.average}fps) below threshold (${this.thresholds.frameRate}fps)`,
        recommendation: 'Optimize animations, reduce layout thrashing'
      });
    }
    
    return issues;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Analyze resource loading
    const resources = this.measurements.resources;
    if (resources.length > 0) {
      const slowResources = resources.filter(r => r.duration > 1000);
      if (slowResources.length > 0) {
        recommendations.push({
          category: 'resource_optimization',
          priority: 'high',
          title: 'Optimize Slow Resources',
          description: `${slowResources.length} resources take more than 1 second to load`,
          actions: [
            'Enable compression for static assets',
            'Implement lazy loading for images',
            'Use CDN for static resources'
          ]
        });
      }
    }
    
    // Analyze memory trends
    const memoryMeasurements = this.measurements.memory;
    if (memoryMeasurements.length > 5) {
      const recent = memoryMeasurements.slice(-5);
      const trend = recent[recent.length - 1].used - recent[0].used;
      
      if (trend > 10 * 1024 * 1024) { // 10MB increase
        recommendations.push({
          category: 'memory_management',
          priority: 'medium',
          title: 'Memory Usage Trend',
          description: `Memory usage increased by ${Math.round(trend / 1024 / 1024)}MB recently`,
          actions: [
            'Check for memory leaks',
            'Optimize event listeners',
            'Implement object pooling'
          ]
        });
      }
    }
    
    // Analyze frame rate stability
    const frameRateMeasurements = this.measurements.frameRate;
    if (frameRateMeasurements.length > 10) {
      const fpsValues = frameRateMeasurements.map(f => f.fps);
      const variance = this.calculateVariance(fpsValues);
      
      if (variance > 100) {
        recommendations.push({
          category: 'rendering_performance',
          priority: 'medium',
          title: 'Frame Rate Instability',
          description: 'Frame rate variance is high, indicating performance inconsistency',
          actions: [
            'Optimize animation loops',
            'Reduce layout calculations',
            'Use requestAnimationFrame efficiently'
          ]
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Calculate variance
   */
  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  /**
   * Export performance data
   */
  exportData() {
    return {
      measurements: this.measurements,
      thresholds: this.thresholds,
      report: this.generateReport()
    };
  }

  /**
   * Clear performance data
   */
  clearData() {
    this.measurements = {
      navigation: [],
      resources: [],
      paint: [],
      layout: [],
      memory: [],
      frameRate: []
    };
  }

  /**
   * Set custom thresholds
   */
  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore() {
    const issues = this.identifyIssues();
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 25;
          break;
        case 'medium':
          score -= 15;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }
}

module.exports = PerformanceMonitor;
