/**
 * Performance metrics and monitoring utilities
 * Provides comprehensive performance tracking, metrics collection, and reporting
 */

const logger = require('./logger');

class PerformanceMonitor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.sampleInterval = options.sampleInterval || 10000; // 10 seconds
    this.maxSamples = options.maxSamples || 100;
    this.alertThresholds = {
      responseTime: options.responseTimeThreshold || 1000, // ms
      errorRate: options.errorRateThreshold || 0.05, // 5%
      memoryUsage: options.memoryUsageThreshold || 0.8, // 80%
      cpuUsage: options.cpuUsageThreshold || 0.8 // 80%
    };
    
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        responseTime: [],
        endpoints: new Map(),
        methods: new Map()
      },
      database: {
        queries: 0,
        totalTime: 0,
        avgTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        operations: new Map()
      },
      game: {
        rounds: 0,
        players: 0,
        avgRoundTime: 0,
        activeGames: 0,
        gameTypes: new Map()
      },
      system: {
        samples: [],
        alerts: [],
        startTime: Date.now(),
        uptime: 0
      }
    };
    
    this.timers = new Map();
    this.alerts = [];
    this.isMonitoring = false;
    this.monitoringTimer = null;
    
    // Initialize monitoring (temporarily disabled due to high memory usage warnings)
    // if (this.enabled) {
    //   this.start();
    // }
  }

  /**
   * Start performance monitoring
   */
  start() {
    // Only skip in test environment, keep running in production for diagnostics
    if (process.env.NODE_ENV === 'test') {
      console.log('[PERF] Skipping performance monitoring in test mode');
      return;
    }
    
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.metrics.system.startTime = Date.now();
    
    // Start periodic sampling
    this.monitoringTimer = setInterval(() => {
      this.collectSystemMetrics();
    }, this.sampleInterval);
    
    // Collect initial sample
    this.collectSystemMetrics();
  }

  /**
   * Stop performance monitoring
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
   * Start timing a request
   * @param {string} name - Request name/identifier
   * @param {Object} metadata - Additional metadata
   * @returns {Function} - Stop function
   */
  startTimer(name, metadata = {}) {
    if (!this.enabled) return () => {};
    
    const startTime = process.hrtime.bigint();
    const timerId = `${name}_${Date.now()}_${Math.random()}`;
    
    this.timers.set(timerId, {
      name,
      startTime,
      metadata
    });
    
    return (endMetadata = {}) => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      this.timers.delete(timerId);
      this.recordRequestMetric(name, duration, { ...metadata, ...endMetadata });
      
      return duration;
    };
  }

  /**
   * Record request metrics
   * @param {string} endpoint - Request endpoint
   * @param {number} responseTime - Response time in ms
   * @param {Object} metadata - Additional metadata
   */
  recordRequestMetric(endpoint, responseTime, metadata = {}) {
    if (!this.enabled) return;
    
    const method = metadata.method || 'GET';
    const success = metadata.success !== false;
    
    // Update overall metrics
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }
    
    // Update response times
    this.metrics.requests.responseTime.push(responseTime);
    if (this.metrics.requests.responseTime.length > this.maxSamples) {
      this.metrics.requests.responseTime.shift();
    }
    
    // Update endpoint metrics
    if (!this.metrics.requests.endpoints.has(endpoint)) {
      this.metrics.requests.endpoints.set(endpoint, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        successCount: 0,
        failCount: 0
      });
    }
    
    const endpointMetrics = this.metrics.requests.endpoints.get(endpoint);
    endpointMetrics.count++;
    endpointMetrics.totalTime += responseTime;
    endpointMetrics.avgTime = endpointMetrics.totalTime / endpointMetrics.count;
    
    if (success) {
      endpointMetrics.successCount++;
    } else {
      endpointMetrics.failCount++;
    }
    
    // Update method metrics
    if (!this.metrics.requests.methods.has(method)) {
      this.metrics.requests.methods.set(method, {
        count: 0,
        totalTime: 0,
        avgTime: 0
      });
    }
    
    const methodMetrics = this.metrics.requests.methods.get(method);
    methodMetrics.count++;
    methodMetrics.totalTime += responseTime;
    methodMetrics.avgTime = methodMetrics.totalTime / methodMetrics.count;
    
    // Check for performance alerts
    this.checkPerformanceAlerts(endpoint, responseTime, success);
  }

  /**
   * Record database operation metrics
   * @param {string} operation - Database operation type
   * @param {number} duration - Operation duration in ms
   * @param {Object} metadata - Additional metadata
   */
  recordDatabaseMetric(operation, duration, metadata = {}) {
    if (!this.enabled) return;
    
    // Update overall database metrics
    this.metrics.database.queries++;
    this.metrics.database.totalTime += duration;
    this.metrics.database.avgTime = this.metrics.database.totalTime / this.metrics.database.queries;
    
    // Update operation-specific metrics
    if (!this.metrics.database.operations.has(operation)) {
      this.metrics.database.operations.set(operation, {
        count: 0,
        totalTime: 0,
        avgTime: 0
      });
    }
    
    const opMetrics = this.metrics.database.operations.get(operation);
    opMetrics.count++;
    opMetrics.totalTime += duration;
    opMetrics.avgTime = opMetrics.totalTime / opMetrics.count;
    
    // Record cache hits/misses
    if (metadata.cacheHit) {
      this.metrics.database.cacheHits++;
    } else if (metadata.cacheMiss) {
      this.metrics.database.cacheMisses++;
    }
  }

  /**
   * Record game metrics
   * @param {string} eventType - Game event type
   * @param {Object} data - Game event data
   */
  recordGameMetric(eventType, data = {}) {
    if (!this.enabled) return;
    
    switch (eventType) {
      case 'round_start': {
        this.metrics.game.rounds++;
        this.metrics.game.activeGames++;
        break;
      }
        
      case 'round_end': {
        this.metrics.game.activeGames = Math.max(0, this.metrics.game.activeGames - 1);
        if (data.duration) {
          this.updateAverageRoundTime(data.duration);
        }
        break;
      }
        
      case 'player_join': {
        this.metrics.game.players++;
        break;
      }
        
      case 'player_leave': {
        this.metrics.game.players = Math.max(0, this.metrics.game.players - 1);
        break;
      }
        
      case 'game_type': {
        const gameType = data.type || 'unknown';
        if (!this.metrics.game.gameTypes.has(gameType)) {
          this.metrics.game.gameTypes.set(gameType, 0);
        }
        this.metrics.game.gameTypes.set(gameType, this.metrics.game.gameTypes.get(gameType) + 1);
        break;
      }
    }
  }

  /**
   * Update average round time
   * @param {number} duration - Round duration in ms
   */
  updateAverageRoundTime(duration) {
    const totalRounds = this.metrics.game.rounds;
    if (totalRounds === 1) {
      this.metrics.game.avgRoundTime = duration;
    } else {
      this.metrics.game.avgRoundTime = (this.metrics.game.avgRoundTime * (totalRounds - 1) + duration) / totalRounds;
    }
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    if (!this.enabled) return;
    
    const now = Date.now();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const sample = {
      timestamp: now,
      uptime: now - this.metrics.system.startTime,
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers || 0
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      requests: {
        total: this.metrics.requests.total,
        successRate: this.calculateSuccessRate(),
        avgResponseTime: this.calculateAvgResponseTime()
      },
      database: {
        queries: this.metrics.database.queries,
        avgTime: this.metrics.database.avgTime,
        cacheHitRate: this.calculateCacheHitRate()
      },
      game: {
        rounds: this.metrics.game.rounds,
        players: this.metrics.game.players,
        activeGames: this.metrics.game.activeGames
      }
    };
    
    this.metrics.system.samples.push(sample);
    
    // Maintain sample limit
    if (this.metrics.system.samples.length > this.maxSamples) {
      this.metrics.system.samples.shift();
    }
    
    // Update uptime
    this.metrics.system.uptime = sample.uptime;
    
    // Check system alerts
    this.checkSystemAlerts(sample);
  }

  /**
   * Calculate success rate
   * @returns {number} - Success rate (0-1)
   */
  calculateSuccessRate() {
    const total = this.metrics.requests.total;
    return total > 0 ? this.metrics.requests.successful / total : 1;
  }

  /**
   * Calculate average response time
   * @returns {number} - Average response time in ms
   */
  calculateAvgResponseTime() {
    const times = this.metrics.requests.responseTime;
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }

  /**
   * Calculate cache hit rate
   * @returns {number} - Cache hit rate (0-1)
   */
  calculateCacheHitRate() {
    const total = this.metrics.database.cacheHits + this.metrics.database.cacheMisses;
    return total > 0 ? this.metrics.database.cacheHits / total : 0;
  }

  /**
   * Check for performance alerts
   * @param {string} endpoint - Request endpoint
   * @param {number} responseTime - Response time
   * @param {boolean} success - Request success
   */
  checkPerformanceAlerts(endpoint, responseTime, success) {
    const alerts = [];
    
    // Response time alert
    if (responseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'slow_request',
        severity: 'warning',
        message: `Slow response time: ${responseTime}ms for ${endpoint}`,
        timestamp: Date.now(),
        data: { endpoint, responseTime }
      });
    }
    
    // Error rate alert
    const errorRate = 1 - this.calculateSuccessRate();
    if (errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'high_error_rate',
        severity: 'critical',
        message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        timestamp: Date.now(),
        data: { errorRate }
      });
    }
    
    // Add alerts to list
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.metrics.system.alerts.push(alert);
      
      // Log alert
      logger.performance(`${alert.type.toUpperCase()}: ${alert.message}`, alert);
    });
    
    // Maintain alert limit
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }

  /**
   * Check for system alerts
   * @param {Object} sample - System metrics sample
   */
  checkSystemAlerts(sample) {
    const alerts = [];
    
    // Memory usage alert
    const memoryUsage = sample.memory.heapUsed / sample.memory.heapTotal;
    if (memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'high_memory_usage',
        severity: 'warning',
        message: `High memory usage: ${(memoryUsage * 100).toFixed(2)}%`,
        timestamp: Date.now(),
        data: { memoryUsage, memory: sample.memory }
      });
    }
    
    // Add alerts to list
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.metrics.system.alerts.push(alert);
      
      // Log alert
      logger.warn(`${alert.type.toUpperCase()}: ${alert.message}`, alert);
    });
  }

  /**
   * Get comprehensive performance report
   * @returns {Object} - Performance report
   */
  getReport() {
    if (!this.enabled) return { enabled: false };
    
    const now = Date.now();
    const latestSample = this.metrics.system.samples[this.metrics.system.samples.length - 1];
    
    return {
      timestamp: now,
      uptime: now - this.metrics.system.startTime,
      enabled: this.enabled,
      isMonitoring: this.isMonitoring,
      
      // Request metrics
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        successRate: this.calculateSuccessRate(),
        avgResponseTime: this.calculateAvgResponseTime(),
        endpoints: Object.fromEntries(this.metrics.requests.endpoints),
        methods: Object.fromEntries(this.metrics.requests.methods),
        recentResponseTimes: this.metrics.requests.responseTime.slice(-10)
      },
      
      // Database metrics
      database: {
        queries: this.metrics.database.queries,
        totalTime: this.metrics.database.totalTime,
        avgTime: this.metrics.database.avgTime,
        cacheHits: this.metrics.database.cacheHits,
        cacheMisses: this.metrics.database.cacheMisses,
        cacheHitRate: this.calculateCacheHitRate(),
        operations: Object.fromEntries(this.metrics.database.operations)
      },
      
      // Game metrics
      game: {
        rounds: this.metrics.game.rounds,
        players: this.metrics.game.players,
        activeGames: this.metrics.game.activeGames,
        avgRoundTime: this.metrics.game.avgRoundTime,
        gameTypes: Object.fromEntries(this.metrics.game.gameTypes)
      },
      
      // System metrics
      system: {
        current: latestSample,
        samples: this.metrics.system.samples.slice(-10),
        alerts: this.alerts.slice(-10)
      },
      
      // Performance summary
      summary: {
        health: this.calculateHealthScore(),
        alerts: {
          total: this.alerts.length,
          recent: this.alerts.filter(a => now - a.timestamp < 300000).length // Last 5 minutes
        }
      }
    };
  }

  /**
   * Calculate overall health score
   * @returns {number} - Health score (0-100)
   */
  calculateHealthScore() {
    let score = 100;
    
    // Response time impact
    const avgResponseTime = this.calculateAvgResponseTime();
    if (avgResponseTime > this.alertThresholds.responseTime) {
      score -= Math.min(30, (avgResponseTime - this.alertThresholds.responseTime) / 10);
    }
    
    // Error rate impact
    const errorRate = 1 - this.calculateSuccessRate();
    if (errorRate > this.alertThresholds.errorRate) {
      score -= Math.min(40, errorRate * 100);
    }
    
    // Recent alerts impact
    const recentAlerts = this.alerts.filter(a => Date.now() - a.timestamp < 300000).length;
    score -= Math.min(30, recentAlerts * 5);
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Get metrics for specific time range
   * @param {number} minutes - Time range in minutes
   * @returns {Object} - Metrics for time range
   */
  getMetricsForTimeRange(minutes) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentSamples = this.metrics.system.samples.filter(s => s.timestamp >= cutoff);
    const recentAlerts = this.alerts.filter(a => a.timestamp >= cutoff);
    const recentResponseTimes = this.metrics.requests.responseTime.filter((_, i) => {
      // This is approximate - in production, you'd timestamp each request
      return i >= this.metrics.requests.responseTime.length - (minutes * 6); // Rough estimate
    });
    
    return {
      timeRange: minutes,
      samples: recentSamples,
      alerts: recentAlerts,
      responseTimes: recentResponseTimes,
      avgResponseTime: recentResponseTimes.length > 0 
        ? recentResponseTimes.reduce((sum, time) => sum + time, 0) / recentResponseTimes.length 
        : 0
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        responseTime: [],
        endpoints: new Map(),
        methods: new Map()
      },
      database: {
        queries: 0,
        totalTime: 0,
        avgTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        operations: new Map()
      },
      game: {
        rounds: 0,
        players: 0,
        avgRoundTime: 0,
        activeGames: 0,
        gameTypes: new Map()
      },
      system: {
        samples: [],
        alerts: [],
        startTime: Date.now(),
        uptime: 0
      }
    };
    
    this.timers.clear();
    this.alerts = [];
  }

  /**
   * Export metrics in various formats
   * @param {string} format - Export format ('json', 'csv', 'prometheus')
   * @returns {string} - Formatted metrics
   */
  exportMetrics(format = 'json') {
    const report = this.getReport();
    
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(report);
      case 'prometheus':
        return this.exportToPrometheus(report);
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  /**
   * Export metrics to CSV format
   * @param {Object} report - Performance report
   * @returns {string} - CSV formatted data
   */
  exportToCSV(report) {
    const headers = ['timestamp', 'uptime', 'requests_total', 'requests_avg_response_time', 'database_queries', 'database_avg_time', 'game_rounds', 'health_score'];
    const rows = [headers.join(',')];
    
    if (report.system.current) {
      const row = [
        new Date(report.timestamp).toISOString(),
        report.uptime,
        report.requests.total,
        report.requests.avgResponseTime,
        report.database.queries,
        report.database.avgTime,
        report.game.rounds,
        report.summary.health
      ];
      rows.push(row.join(','));
    }
    
    return rows.join('\n');
  }

  /**
   * Export metrics to Prometheus format
   * @param {Object} report - Performance report
   * @returns {string} - Prometheus formatted metrics
   */
  exportToPrometheus(report) {
    const timestamp = Date.now();
    const metrics = [];
    
    metrics.push(`# HELP poker_requests_total Total number of requests`);
    metrics.push(`# TYPE poker_requests_total counter`);
    metrics.push(`poker_requests_total ${report.requests.total} ${timestamp}`);
    
    metrics.push(`# HELP poker_requests_duration_seconds Request duration`);
    metrics.push(`# TYPE poker_requests_duration_seconds histogram`);
    metrics.push(`poker_requests_duration_seconds_sum ${report.requests.avgResponseTime / 1000} ${timestamp}`);
    
    metrics.push(`# HELP poker_database_queries_total Total database queries`);
    metrics.push(`# TYPE poker_database_queries_total counter`);
    metrics.push(`poker_database_queries_total ${report.database.queries} ${timestamp}`);
    
    metrics.push(`# HELP poker_game_rounds_total Total game rounds`);
    metrics.push(`# TYPE poker_game_rounds_total counter`);
    metrics.push(`poker_game_rounds_total ${report.game.rounds} ${timestamp}`);
    
    metrics.push(`# HELP poker_health_score Overall health score`);
    metrics.push(`# TYPE poker_health_score gauge`);
    metrics.push(`poker_health_score ${report.summary.health} ${timestamp}`);
    
    return metrics.join('\n') + '\n';
  }
}

// Create global performance monitor
const performanceMonitor = new PerformanceMonitor({
  enabled: true,
  sampleInterval: 10000,
  responseTimeThreshold: 1000,
  errorRateThreshold: 0.05,
  memoryUsageThreshold: 0.8,
  cpuUsageThreshold: 0.8
});

module.exports = {
  PerformanceMonitor,
  performanceMonitor
};
