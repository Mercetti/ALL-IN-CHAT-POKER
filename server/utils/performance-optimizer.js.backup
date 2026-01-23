/**
 * Performance Optimization System
 * Analyzes usage patterns and optimizes performance automatically
 */

class PerformanceOptimizer {
  constructor(config = {}) {
    this.config = {
      analysisInterval: 60000, // 1 minute
      optimizationThresholds: {
        responseTime: 500,    // ms
        memoryUsage: 75,    // percentage
        cpuUsage: 80,        // percentage
        errorRate: 2         // percentage
      },
      ...config
    };
    
    this.isRunning = false;
    this.analysisTimer = null;
    this.metrics = {
      responseTimes: [],
      memorySnapshots: [],
      cpuSnapshots: [],
      requestCounts: {},
      errors: []
    };
    
    this.optimizations = {
      cacheEnabled: false,
      compressionEnabled: false,
      connectionPooling: false,
      lazyLoading: false
    };
  }

  async initialize() {
    console.log('[OPTIMIZER] Initializing performance optimizer');
    
    this.startAnalysis();
    this.isRunning = true;
    
    console.log('[OPTIMIZER] Performance optimizer initialized');
    return true;
  }

  startAnalysis() {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }
    
    this.analysisTimer = setInterval(async () => {
      try {
        await this.analyzePerformance();
        await this.applyOptimizations();
      } catch (error) {
        console.error('[OPTIMIZER] Analysis failed:', error.message);
      }
    }, this.config.analysisInterval);
    
    console.log(`[OPTIMIZER] Performance analysis started (interval: ${this.config.analysisInterval / 1000} seconds)`);
  }

  async analyzePerformance() {
    const now = Date.now();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Collect metrics
    this.metrics.memorySnapshots.push({
      timestamp: now,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      usagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
    });
    
    this.metrics.cpuSnapshots.push({
      timestamp: now,
      user: cpuUsage.user,
      system: cpuUsage.system,
      percent: this.calculateCPUPercent(cpuUsage)
    });
    
    // Keep only last 100 snapshots
    if (this.metrics.memorySnapshots.length > 100) {
      this.metrics.memorySnapshots = this.metrics.memorySnapshots.slice(-100);
    }
    
    if (this.metrics.cpuSnapshots.length > 100) {
      this.metrics.cpuSnapshots = this.metrics.cpuSnapshots.slice(-100);
    }
    
    // Analyze patterns
    const analysis = this.performPatternAnalysis();
    console.log('[OPTIMIZER] Performance analysis completed:', analysis);
    
    return analysis;
  }

  calculateCPUPercent(cpuUsage) {
    // Simple CPU percentage calculation (approximation)
    const totalUsage = cpuUsage.user + cpuUsage.system;
    return Math.min(100, (totalUsage / 1000000) * 100); // Convert microseconds to percentage
  }

  performPatternAnalysis() {
    const recentMemory = this.metrics.memorySnapshots.slice(-20);
    const recentCPU = this.metrics.cpuSnapshots.slice(-20);
    const recentResponseTimes = this.metrics.responseTimes.slice(-50);
    
    const analysis = {
      memoryTrend: this.calculateTrend(recentMemory.map(s => s.usagePercent)),
      cpuTrend: this.calculateTrend(recentCPU.map(s => s.percent)),
      responseTimeTrend: this.calculateTrend(recentResponseTimes),
      peakUsageHours: this.identifyPeakUsageHours(),
      recommendations: []
    };
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);
    
    return analysis;
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  identifyPeakUsageHours() {
    const hourlyUsage = {};
    
    // Group by hour
    this.metrics.memorySnapshots.forEach(snapshot => {
      const hour = new Date(snapshot.timestamp).getHours();
      if (!hourlyUsage[hour]) {
        hourlyUsage[hour] = [];
      }
      hourlyUsage[hour].push(snapshot.usagePercent);
    
    // Find peak hours
    const peakHours = Object.entries(hourlyUsage)
      .map(([hour, usages]) => [hour, Math.max(...usages)])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);
    
    return peakHours;
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Memory recommendations
    if (analysis.memoryTrend === 'increasing') {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        title: 'Memory Usage Increasing',
        description: 'Memory usage has been trending upward. Consider optimizing memory usage or increasing available memory.',
        action: 'optimize_memory'
      });
    }
    
    // CPU recommendations
    if (analysis.cpuTrend === 'increasing') {
      recommendations.push({
        type: 'cpu',
        priority: 'high',
        title: 'CPU Usage Increasing',
        description: 'CPU usage has been trending upward. Consider optimizing CPU-intensive operations.',
        action: 'optimize_cpu'
      });
    }
    
    // Response time recommendations
    if (analysis.responseTimeTrend === 'increasing') {
      recommendations.push({
        type: 'response_time',
        priority: 'medium',
        title: 'Response Time Degradation',
        description: 'Response times have been increasing. Consider enabling caching or optimizing database queries.',
        action: 'optimize_response_time'
      });
    }
    
    // Peak usage recommendations
    if (analysis.peakUsageHours.length > 0) {
      recommendations.push({
        type: 'peak_usage',
        priority: 'medium',
        title: 'Peak Usage Identified',
        description: `Peak usage detected during hours: ${analysis.peakUsageHours.join(', ')}. Consider load balancing or auto-scaling.`,
        action: 'optimize_peak_hours'
      });
    }
    
    return recommendations;
  }

  async applyOptimizations() {
    const analysis = this.performPatternAnalysis();
    
    for (const recommendation of analysis.recommendations) {
      await this.applyOptimization(recommendation);
    }
  }

  async applyOptimization(recommendation) {
    switch (recommendation.action) {
      case 'optimize_memory':
        await this.optimizeMemory();
        break;
      case 'optimize_cpu':
        await this.optimizeCPU();
        break;
      case 'optimize_response_time':
        await this.optimizeResponseTime();
        break;
      case 'optimize_peak_hours':
        await this.optimizePeakHours();
        break;
    }
  }

  async optimizeMemory() {
    if (!this.optimizations.cacheEnabled) {
      console.log('[OPTIMIZER] Enabling memory optimization: caching');
      this.optimizations.cacheEnabled = true;
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
    }
  }

  async optimizeCPU() {
    if (!this.optimizations.compressionEnabled) {
      console.log('[OPTIMIZER] Enabling CPU optimization: compression');
      this.optimizations.compressionEnabled = true;
    }
  }

  async optimizeResponseTime() {
    if (!this.optimizations.connectionPooling) {
      console.log('[OPTIMIZER] Enabling response time optimization: connection pooling');
      this.optimizations.connectionPooling = true;
    }
  }

  async optimizePeakHours() {
    if (!this.optimizations.lazyLoading) {
      console.log('[OPTIMIZER] Enabling peak hours optimization: lazy loading');
      this.optimizations.lazyLoading = true;
    }
  }

  // Public methods for tracking
  trackResponseTime(responseTime) {
    this.metrics.responseTimes.push({
      timestamp: Date.now(),
      value: responseTime
    });
    
    // Keep only last 1000 response times
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
  }

  trackError(error) {
    this.metrics.errors.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack
    });
    
    // Keep only last 500 errors
    if (this.metrics.errors.length > 500) {
      this.metrics.errors = this.metrics.errors.slice(-500);
    }
  }

  getPerformanceReport() {
    const analysis = this.performPatternAnalysis();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: {
        memory: {
          current: this.metrics.memorySnapshots.slice(-1)[0] || {},
          trend: analysis.memoryTrend,
          average: this.metrics.memorySnapshots.reduce((sum, s) => sum + s.usagePercent, 0) / this.metrics.memorySnapshots.length
        },
        cpu: {
          current: this.metrics.cpuSnapshots.slice(-1)[0] || {},
          trend: analysis.cpuTrend,
          average: this.metrics.cpuSnapshots.reduce((sum, s) => sum + s.percent, 0) / this.metrics.cpuSnapshots.length
        },
        responseTime: {
          current: this.metrics.responseTimes.slice(-1)[0] || {},
          trend: analysis.responseTimeTrend,
          average: this.metrics.responseTimes.length > 0 
            ? this.metrics.responseTimes.reduce((sum, r) => sum + r.value, 0) / this.metrics.responseTimes.length
            : 0
        }
      },
      optimizations: this.optimizations,
      recommendations: analysis.recommendations,
      alerts: this.generateAlerts(analysis)
    };
  }

  generateAlerts(analysis) {
    const alerts = [];
    
    if (analysis.memoryTrend === 'increasing') {
      alerts.push({
        level: 'warning',
        type: 'memory',
        message: 'Memory usage trending upward'
      });
    }
    
    if (analysis.cpuTrend === 'increasing') {
      alerts.push({
        level: 'warning',
        type: 'cpu',
        message: 'CPU usage trending upward'
      });
    }
    
    if (analysis.responseTimeTrend === 'increasing') {
      alerts.push({
        level: 'info',
        type: 'performance',
        message: 'Response times degrading'
      });
    }
    
    return alerts;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      optimizations: this.optimizations,
      metrics: {
        memorySnapshots: this.metrics.memorySnapshots.length,
        cpuSnapshots: this.metrics.cpuSnapshots.length,
        responseTimes: this.metrics.responseTimes.length,
        errors: this.metrics.errors.length
      }
    };
  }

  async shutdown() {
    console.log('[OPTIMIZER] Shutting down performance optimizer');
    
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
    
    this.isRunning = false;
  }
}

module.exports = { PerformanceOptimizer };
