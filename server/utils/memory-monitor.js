/**
 * Memory usage monitoring and reporting utilities
 * Provides real-time memory tracking, leak detection, and performance metrics
 */

class MemoryMonitor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.sampleInterval = options.sampleInterval || 5000; // 5 seconds
    this.maxSamples = options.maxSamples || 100;
    this.alertThresholdMB = options.alertThresholdMB || 500;
    this.criticalThresholdMB = options.criticalThresholdMB || 1000;
    
    this.samples = [];
    this.timers = new Map();
    this.counters = new Map();
    this.gauges = new Map();
    this.isMonitoring = false;
    this.monitoringTimer = null;
    
    // Memory statistics
    this.stats = {
      totalSamples: 0,
      avgMemoryUsage: 0,
      peakMemoryUsage: 0,
      minMemoryUsage: Infinity,
      memoryGrowthRate: 0,
      lastSampleTime: 0,
      alertsTriggered: 0,
      criticalAlertsTriggered: 0
    };
    
    // Memory leak detection
    this.leakDetection = {
      enabled: options.leakDetection !== false,
      thresholdGrowthMB: options.thresholdGrowthMB || 50,
      windowSamples: options.windowSamples || 10,
      consecutiveGrowthCount: 0
    };
  }

  /**
   * Start memory monitoring
   */
  start() {
    if (!this.enabled || this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringTimer = setInterval(() => {
      this.collectSample();
    }, this.sampleInterval);
    
    // Collect initial sample
    this.collectSample();
  }

  /**
   * Stop memory monitoring
   */
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  /**
   * Collect a memory sample
   */
  collectSample() {
    if (!this.enabled) return;
    
    const now = Date.now();
    const memInfo = this.getMemoryInfo();
    
    const sample = {
      timestamp: now,
      rss: memInfo.rss, // Resident Set Size
      heapUsed: memInfo.heapUsed,
      heapTotal: memInfo.heapTotal,
      external: memInfo.external,
      arrayBuffers: memInfo.arrayBuffers,
      processId: process.pid
    };
    
    // Add to samples array
    this.samples.push(sample);
    
    // Maintain sample limit
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    
    // Update statistics
    this.updateStatistics(sample);
    
    // Check for alerts
    this.checkAlerts(sample);
    
    // Check for memory leaks
    if (this.leakDetection.enabled) {
      this.checkMemoryLeaks();
    }
  }

  /**
   * Get current memory information
   * @returns {Object} - Memory statistics
   */
  getMemoryInfo() {
    const usage = process.memoryUsage();
    
    return {
      rss: usage.rss, // Resident Set Size
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers || 0,
      rssMB: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100
    };
  }

  /**
   * Update running statistics
   * @param {Object} sample - Current memory sample
   */
  updateStatistics(sample) {
    this.stats.totalSamples++;
    this.stats.lastSampleTime = sample.timestamp;
    
    // Update peak and min
    this.stats.peakMemoryUsage = Math.max(this.stats.peakMemoryUsage, sample.rss);
    this.stats.minMemoryUsage = Math.min(this.stats.minMemoryUsage, sample.rss);
    
    // Calculate average
    const totalRSS = this.samples.reduce((sum, s) => sum + s.rss, 0);
    this.stats.avgMemoryUsage = totalRSS / this.samples.length;
    
    // Calculate growth rate (MB per minute)
    if (this.samples.length >= 2) {
      const recentSample = this.samples[this.samples.length - 1];
      const oldSample = this.samples[Math.max(0, this.samples.length - 6)]; // Last ~30 seconds
      const timeDiff = (recentSample.timestamp - oldSample.timestamp) / 1000 / 60; // minutes
      const memDiff = (recentSample.rss - oldSample.rss) / 1024 / 1024; // MB
      this.stats.memoryGrowthRate = timeDiff > 0 ? memDiff / timeDiff : 0;
    }
  }

  /**
   * Check for memory alerts
   * @param {Object} sample - Current memory sample
   */
  checkAlerts(sample) {
    const rssMB = sample.rss / 1024 / 1024;
    
    if (rssMB >= this.criticalThresholdMB) {
      this.stats.criticalAlertsTriggered++;
      this.triggerAlert('critical', `Critical memory usage: ${rssMB.toFixed(2)}MB`);
    } else if (rssMB >= this.alertThresholdMB) {
      this.stats.alertsTriggered++;
      this.triggerAlert('warning', `High memory usage: ${rssMB.toFixed(2)}MB`);
    }
  }

  /**
   * Check for potential memory leaks
   */
  checkMemoryLeaks() {
    if (this.samples.length < this.leakDetection.windowSamples) return;
    
    const recentSamples = this.samples.slice(-this.leakDetection.windowSamples);
    const oldestSample = recentSamples[0];
    const newestSample = recentSamples[recentSamples.length - 1];
    
    const growthMB = (newestSample.rss - oldestSample.rss) / 1024 / 1024;
    
    if (growthMB > this.leakDetection.thresholdGrowthMB) {
      this.leakDetection.consecutiveGrowthCount++;
      
      if (this.leakDetection.consecutiveGrowthCount >= 2) {
        this.triggerAlert('leak', `Potential memory leak detected: ${growthMB.toFixed(2)}MB growth in ${this.leakDetection.windowSamples} samples`);
        this.leakDetection.consecutiveGrowthCount = 0;
      }
    } else {
      this.leakDetection.consecutiveGrowthCount = 0;
    }
  }

  /**
   * Trigger an alert
   * @param {string} type - Alert type
   * @param {string} message - Alert message
   */
  triggerAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: Date.now(),
      memory: this.getMemoryInfo()
    };
    
    // Log alert
    console.warn(`[MEMORY ALERT] ${type.toUpperCase()}: ${message}`, alert);
    
    // Could emit to monitoring system, send to logging service, etc.
    if (this.onAlert) {
      this.onAlert(alert);
    }
  }

  /**
   * Start a named timer
   * @param {string} name - Timer name
   * @returns {Function} - Stop function
   */
  startTimer(name) {
    const startTime = process.hrtime.bigint();
    
    return () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      if (!this.timers.has(name)) {
        this.timers.set(name, {
          count: 0,
          totalTime: 0,
          avgTime: 0,
          minTime: Infinity,
          maxTime: 0
        });
      }
      
      const timer = this.timers.get(name);
      timer.count++;
      timer.totalTime += duration;
      timer.avgTime = timer.totalTime / timer.count;
      timer.minTime = Math.min(timer.minTime, duration);
      timer.maxTime = Math.max(timer.maxTime, duration);
      
      return duration;
    };
  }

  /**
   * Increment a counter
   * @param {string} name - Counter name
   * @param {number} value - Increment value (default: 1)
   */
  incrementCounter(name, value = 1) {
    if (!this.counters.has(name)) {
      this.counters.set(name, 0);
    }
    this.counters.set(name, this.counters.get(name) + value);
  }

  /**
   * Set a gauge value
   * @param {string} name - Gauge name
   * @param {number} value - Gauge value
   */
  setGauge(name, value) {
    this.gauges.set(name, value);
  }

  /**
   * Get comprehensive memory report
   * @returns {Object} - Memory report
   */
  getReport() {
    const currentMemory = this.getMemoryInfo();
    
    return {
      timestamp: Date.now(),
      monitoring: {
        enabled: this.enabled,
        isMonitoring: this.isMonitoring,
        sampleInterval: this.sampleInterval,
        totalSamples: this.stats.totalSamples
      },
      current: currentMemory,
      statistics: {
        ...this.stats,
        avgMemoryUsageMB: Math.round(this.stats.avgMemoryUsage / 1024 / 1024 * 100) / 100,
        peakMemoryUsageMB: Math.round(this.stats.peakMemoryUsage / 1024 / 1024 * 100) / 100,
        minMemoryUsageMB: Math.round(this.stats.minMemoryUsage / 1024 / 1024 * 100) / 100
      },
      alerts: {
        thresholdMB: this.alertThresholdMB,
        criticalThresholdMB: this.criticalThresholdMB,
        alertsTriggered: this.stats.alertsTriggered,
        criticalAlertsTriggered: this.stats.criticalAlertsTriggered
      },
      leakDetection: {
        ...this.leakDetection,
        consecutiveGrowthCount: this.leakDetection.consecutiveGrowthCount
      },
      timers: Object.fromEntries(this.timers),
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      samples: this.samples.slice(-10) // Last 10 samples
    };
  }

  /**
   * Get memory usage trend
   * @param {number} minutes - Time window in minutes
   * @returns {Array} - Memory samples within window
   */
  getTrend(minutes = 10) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.samples.filter(sample => sample.timestamp >= cutoff);
  }

  /**
   * Reset all statistics and samples
   */
  reset() {
    this.samples = [];
    this.timers.clear();
    this.counters.clear();
    this.gauges.clear();
    
    this.stats = {
      totalSamples: 0,
      avgMemoryUsage: 0,
      peakMemoryUsage: 0,
      minMemoryUsage: Infinity,
      memoryGrowthRate: 0,
      lastSampleTime: 0,
      alertsTriggered: 0,
      criticalAlertsTriggered: 0
    };
    
    this.leakDetection.consecutiveGrowthCount = 0;
  }

  /**
   * Force garbage collection if available
   */
  forceGC() {
    if (global.gc) {
      global.gc();
      return true;
    }
    return false;
  }

  /**
   * Set alert callback
   * @param {Function} callback - Alert callback function
   */
  setAlertCallback(callback) {
    this.onAlert = callback;
  }
}

// Create global memory monitor instance
const memoryMonitor = new MemoryMonitor({
  enabled: true,
  sampleInterval: 5000,
  maxSamples: 100,
  alertThresholdMB: 500,
  criticalThresholdMB: 1000,
  leakDetection: true,
  thresholdGrowthMB: 50,
  windowSamples: 10
});

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  memoryMonitor.start();
}

module.exports = {
  MemoryMonitor,
  memoryMonitor
};
