/**
 * AI Performance Monitor
 * Tracks AI system performance and provides optimization recommendations
 */

const EventEmitter = require('events');
const Logger = require('./logger');

const logger = new Logger('ai-performance');

class AIPerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.metricsInterval = options.metricsInterval || 30000; // 30 seconds
    this.alertThresholds = {
      responseTime: options.alertThresholds?.responseTime || 5000,
      errorRate: options.alertThresholds?.errorRate || 0.1,
      queueLength: options.alertThresholds?.queueLength || 10
    };
    
    this.metrics = {
      totalRequests: 0,
      totalResponseTime: 0,
      errors: 0,
      queueLength: 0,
      cacheHits: 0,
      cacheMisses: 0,
      modelUsage: new Map(),
      hourlyStats: new Map()
    };
    
    this.startMonitoring();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    // Only skip in test environment, keep running in production for diagnostics
    if (process.env.NODE_ENV === 'test') {
      console.log('[AI-PERF] Skipping AI performance monitoring in test mode');
      return;
    }
    
    setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
    }, this.metricsInterval);
    
    logger.info('AI Performance Monitor started');
  }

  /**
   * Record AI request metrics
   */
  recordRequest(startTime, endTime, model, success = true, cached = false) {
    const responseTime = endTime - startTime;
    
    this.metrics.totalRequests++;
    this.metrics.totalResponseTime += responseTime;
    
    if (!success) {
      this.metrics.errors++;
    }
    
    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    // Track model usage
    const modelStats = this.metrics.modelUsage.get(model) || { count: 0, totalTime: 0, errors: 0 };
    modelStats.count++;
    modelStats.totalTime += responseTime;
    if (!success) modelStats.errors++;
    this.metrics.modelUsage.set(model, modelStats);
    
    // Hourly stats
    const hour = new Date().getHours();
    const hourlyStats = this.metrics.hourlyStats.get(hour) || { requests: 0, responseTime: 0, errors: 0 };
    hourlyStats.requests++;
    hourlyStats.responseTime += responseTime;
    if (!success) hourlyStats.errors++;
    this.metrics.hourlyStats.set(hour, hourlyStats);
    
    // Check for performance issues
    this.checkPerformanceIssues(responseTime, model);
  }

  /**
   * Check for performance issues and emit alerts
   */
  checkPerformanceIssues(responseTime, model) {
    if (responseTime > this.alertThresholds.responseTime) {
      this.emit('slow-response', {
        model,
        responseTime,
        threshold: this.alertThresholds.responseTime
      });
    }
    
    const errorRate = this.metrics.errors / this.metrics.totalRequests;
    if (errorRate > this.alertThresholds.errorRate) {
      this.emit('high-error-rate', {
        errorRate,
        threshold: this.alertThresholds.errorRate
      });
    }
  }

  /**
   * Collect current metrics
   */
  collectMetrics() {
    const avgResponseTime = this.metrics.totalRequests > 0 
      ? this.metrics.totalResponseTime / this.metrics.totalRequests 
      : 0;
    
    const errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.errors / this.metrics.totalRequests 
      : 0;
    
    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
      ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
      : 0;
    
    const report = {
      timestamp: Date.now(),
      avgResponseTime,
      totalRequests: this.metrics.totalRequests,
      errorRate,
      cacheHitRate,
      queueLength: this.metrics.queueLength,
      modelUsage: Object.fromEntries(this.metrics.modelUsage),
      hourlyStats: Object.fromEntries(this.metrics.hourlyStats)
    };
    
    this.emit('metrics-collected', report);
    return report;
  }

  /**
   * Analyze performance and provide recommendations
   */
  analyzePerformance() {
    const report = this.collectMetrics();
    
    const recommendations = [];
    
    // Response time recommendations
    if (report.avgResponseTime > 3000) {
      recommendations.push({
        type: 'response_time',
        severity: 'warning',
        message: 'Average response time is high',
        suggestion: 'Consider reducing max_tokens or using faster models'
      });
    }
    
    // Error rate recommendations
    if (report.errorRate > 0.05) {
      recommendations.push({
        type: 'error_rate',
        severity: 'warning',
        message: 'Error rate is elevated',
        suggestion: 'Check tunnel health or model availability'
      });
    }
    
    // Cache recommendations
    if (report.cacheHitRate < 0.3) {
      recommendations.push({
        type: 'cache_hit_rate',
        severity: 'info',
        message: 'Cache hit rate is low',
        suggestion: 'Consider increasing cache TTL or size'
      });
    }
    
    // Model performance recommendations
    for (const [model, stats] of Object.entries(report.modelUsage)) {
      const avgTime = stats.totalTime / stats.count;
      if (avgTime > 4000) {
        recommendations.push({
          type: 'model_performance',
          severity: 'info',
          message: `${model} is slow`,
          suggestion: 'Consider using faster model for this use case'
        });
      }
    }
    
    if (recommendations.length > 0) {
      this.emit('recommendations', recommendations);
    }
    
    return recommendations;
  }

  /**
   * Get performance report
   */
  getReport() {
    return this.collectMetrics();
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      totalResponseTime: 0,
      errors: 0,
      queueLength: 0,
      cacheHits: 0,
      cacheMisses: 0,
      modelUsage: new Map(),
      hourlyStats: new Map()
    };
    
    logger.info('AI Performance metrics reset');
  }
}

module.exports = AIPerformanceMonitor;
