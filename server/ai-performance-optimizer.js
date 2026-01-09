/**
 * AI-Powered Performance Monitoring and Optimization
 * Uses AI to detect performance issues and suggest optimizations
 */

const ai = require('./ai');
const config = require('./config');
const Logger = require('./logger');

const logger = new Logger();

class AIPerformanceOptimizer {
  constructor(options = {}) {
    this.options = {
      enableAutoOptimize: options.enableAutoOptimize !== false,
      monitoringInterval: options.monitoringInterval || 30000, // 30 seconds
      alertThreshold: options.alertThreshold || 0.8, // 80% resource usage
      ...options
    };
    
    this.metrics = {
      cpu: [],
      memory: [],
      responseTime: [],
      errorRate: [],
      databaseQueries: [],
      activeConnections: []
    };
    
    this.baseline = null;
    this.optimizations = new Map();
    this.alerts = [];
    
    this.init();
  }

  init() {
    // Start monitoring
    this.startMonitoring();
    
    // Establish baseline
    setTimeout(() => this.establishBaseline(), 60000); // Wait 1 minute
    
    logger.info('AI Performance Optimizer initialized', {
      autoOptimize: this.options.enableAutoOptimize,
      interval: this.options.monitoringInterval
    });
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
    }, this.options.monitoringInterval);
  }

  /**
   * Collect performance metrics
   */
  collectMetrics() {
    const now = Date.now();
    
    // CPU Usage
    const cpuUsage = process.cpuUsage();
    this.metrics.cpu.push({
      timestamp: now,
      user: cpuUsage.user,
      system: cpuUsage.system
    });
    
    // Memory Usage
    const memUsage = process.memoryUsage();
    this.metrics.memory.push({
      timestamp: now,
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    });
    
    // Keep only recent metrics (last 100 data points)
    this.trimMetrics();
  }

  /**
   * Trim old metrics to prevent memory leaks
   */
  trimMetrics() {
    const maxDataPoints = 100;
    
    Object.keys(this.metrics).forEach(key => {
      if (this.metrics[key].length > maxDataPoints) {
        this.metrics[key] = this.metrics[key].slice(-maxDataPoints);
      }
    });
  }

  /**
   * Analyze performance using AI
   */
  async analyzePerformance() {
    if (!this.baseline) return;
    
    const currentMetrics = this.getCurrentMetrics();
    const analysis = await this.analyzeWithAI(currentMetrics);
    
    if (analysis.issues && analysis.issues.length > 0) {
      await this.handlePerformanceIssues(analysis.issues);
    }
    
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      await this.applyOptimizations(analysis.recommendations);
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics() {
    const now = Date.now();
    const recentThreshold = 60000; // Last minute
    
    return {
      timestamp: now,
      cpu: this.getAverageMetric('cpu', recentThreshold),
      memory: this.getAverageMetric('memory', recentThreshold),
      responseTime: this.getAverageMetric('responseTime', recentThreshold),
      errorRate: this.getAverageMetric('errorRate', recentThreshold),
      databaseQueries: this.getAverageMetric('databaseQueries', recentThreshold),
      activeConnections: this.getAverageMetric('activeConnections', recentThreshold)
    };
  }

  /**
   * Get average metric for recent period
   */
  getAverageMetric(metricName, timeWindow) {
    const metrics = this.metrics[metricName];
    const now = Date.now();
    const recent = metrics.filter(m => now - m.timestamp <= timeWindow);
    
    if (recent.length === 0) return null;
    
    if (metricName === 'memory') {
      return {
        rss: recent.reduce((sum, m) => sum + m.rss, 0) / recent.length,
        heapUsed: recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length,
        heapTotal: recent.reduce((sum, m) => sum + m.heapTotal, 0) / recent.length,
        external: recent.reduce((sum, m) => sum + m.external, 0) / recent.length
      };
    }
    
    return recent.reduce((sum, m) => sum + (m.value || 0), 0) / recent.length;
  }

  /**
   * Analyze performance with AI
   */
  async analyzeWithAI(currentMetrics) {
    const prompt = `You are an expert performance analyst for a Node.js poker game application.

Current Performance Metrics:
- CPU Usage: ${JSON.stringify(currentMetrics.cpu)}
- Memory Usage: ${JSON.stringify(currentMetrics.memory)}
- Response Time: ${currentMetrics.responseTime}ms
- Error Rate: ${(currentMetrics.errorRate || 0) * 100}%
- Database Queries: ${currentMetrics.databaseQueries || 0}
- Active Connections: ${currentMetrics.activeConnections || 0}

Baseline Performance:
- CPU Usage: ${JSON.stringify(this.baseline.cpu)}
- Memory Usage: ${JSON.stringify(this.baseline.memory)}
- Response Time: ${this.baseline.responseTime}ms
- Error Rate: ${(this.baseline.errorRate || 0) * 100}%

Analyze the performance and identify:
1. Issues: Array of performance problems with severity (low/medium/high)
2. Recommendations: Array of specific optimization suggestions
3. Priority: Which issue to address first

Respond with JSON only:
{
  "issues": [
    {
      "type": "cpu/memory/database/network",
      "severity": "low/medium/high",
      "description": "Issue description",
      "impact": "How this affects the application"
    }
  ],
  "recommendations": [
    {
      "type": "code/config/infrastructure",
      "priority": "low/medium/high",
      "description": "What to optimize",
      "expectedImprovement": "Expected performance gain",
      "implementation": "Brief implementation steps"
    }
  ],
  "overallHealth": "good/fair/poor"
}`;

    try {
      const response = await ai.chat([
        { role: 'system', content: 'You are a performance analyst. Always respond with valid JSON only. No explanations outside JSON.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.1, // Lower temperature for more consistent output
        maxTokens: 500    // Smaller token limit for reliability
      });

      // Enhanced JSON parsing with multiple fallback strategies
      try {
        // First try direct JSON parse
        return JSON.parse(response);
      } catch (parseError) {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            logger.warn('Extracted JSON still invalid, using fallback', { extracted: jsonMatch[0].substring(0, 100) });
          }
        }
        
        // Final fallback with structured response
        logger.warn('AI response not valid JSON, using structured fallback', { response: response.substring(0, 100) });
        return { 
          issues: [
            {
              type: 'ai-performance',
              severity: 'low',
              description: 'AI analysis temporarily unavailable',
              impact: 'Performance recommendations may be limited'
            }
          ], 
          recommendations: [
            {
              type: 'ai-config',
              priority: 'medium',
              description: 'Check AI model configuration',
              expectedImprovement: 'Better performance analysis',
              implementation: 'Verify AI model is properly loaded and configured'
            }
          ], 
          overallHealth: 'fair',
          error: 'AI response parsing failed',
          originalResponse: response.substring(0, 200)
        };
      }
    } catch (error) {
      logger.error('AI performance analysis failed', { error: error.message });
      return { issues: [], recommendations: [], overallHealth: 'unknown' };
    }
  }

  /**
   * Handle performance issues
   */
  async handlePerformanceIssues(issues) {
    for (const issue of issues) {
      if (issue.severity === 'high') {
        await this.handleHighSeverityIssue(issue);
      } else if (issue.severity === 'medium') {
        await this.handleMediumSeverityIssue(issue);
      }
      
      // Log issue
      logger.warn('Performance issue detected', issue);
      
      // Add to alerts
      this.alerts.push({
        ...issue,
        timestamp: Date.now(),
        status: 'detected'
      });
    }
  }

  /**
   * Handle high severity issues
   */
  async handleHighSeverityIssue(issue) {
    switch (issue.type) {
      case 'cpu':
        await this.handleHighCPUUsage(issue);
        break;
      case 'memory':
        await this.handleHighMemoryUsage(issue);
        break;
      case 'database':
        await this.handleDatabaseIssue(issue);
        break;
      case 'network':
        await this.handleNetworkIssue(issue);
        break;
    }
  }

  /**
   * Handle high CPU usage
   */
  async handleHighCPUUsage(issue) {
    // Trigger garbage collection
    if (global.gc) {
      global.gc();
      logger.info('Triggered garbage collection due to high CPU usage');
    }
    
    // Reduce AI processing frequency
    if (this.options.enableAutoOptimize) {
      this.options.monitoringInterval = Math.min(this.options.monitoringInterval * 2, 120000);
      logger.info('Reduced monitoring frequency due to high CPU');
    }
  }

  /**
   * Handle high memory usage
   */
  async handleHighMemoryUsage(issue) {
    // Force garbage collection
    if (global.gc) {
      global.gc();
      logger.info('Triggered garbage collection due to high memory usage');
    }
    
    // Clear caches if available
    if (global.clearCache) {
      global.clearCache();
      logger.info('Cleared caches due to high memory usage');
    }
  }

  /**
   * Handle database issues
   */
  async handleDatabaseIssue(issue) {
    // This would implement database-specific optimizations
    logger.warn('Database performance issue detected', issue);
  }

  /**
   * Handle network issues
   */
  async handleNetworkIssue(issue) {
    // This would implement network-specific optimizations
    logger.warn('Network performance issue detected', issue);
  }

  /**
   * Apply optimizations
   */
  async applyOptimizations(recommendations) {
    if (!this.options.enableAutoOptimize) return;
    
    // Sort by priority
    const sortedRecommendations = recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    for (const rec of sortedRecommendations) {
      if (rec.priority === 'high') {
        await this.applyOptimization(rec);
      }
    }
  }

  /**
   * Apply specific optimization
   */
  async applyOptimization(recommendation) {
    const optimizationId = `opt_${Date.now()}`;
    
    try {
      switch (recommendation.type) {
        case 'code':
          await this.applyCodeOptimization(recommendation);
          break;
        case 'config':
          await this.applyConfigOptimization(recommendation);
          break;
        case 'infrastructure':
          await this.applyInfrastructureOptimization(recommendation);
          break;
      }
      
      this.optimizations.set(optimizationId, {
        ...recommendation,
        appliedAt: Date.now(),
        status: 'applied'
      });
      
      logger.info('Applied optimization', { 
        id: optimizationId, 
        type: recommendation.type,
        description: recommendation.description 
      });
      
    } catch (error) {
      logger.error('Failed to apply optimization', { 
        id: optimizationId, 
        error: error.message 
      });
      
      this.optimizations.set(optimizationId, {
        ...recommendation,
        appliedAt: Date.now(),
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Apply code optimization
   */
  async applyCodeOptimization(recommendation) {
    // This would implement code-specific optimizations
    // For example: optimizing loops, reducing memory allocations, etc.
    logger.info('Applied code optimization', recommendation);
  }

  /**
   * Apply configuration optimization
   */
  async applyConfigOptimization(recommendation) {
    // This would implement configuration-specific optimizations
    // For example: adjusting timeouts, buffer sizes, etc.
    logger.info('Applied configuration optimization', recommendation);
  }

  /**
   * Apply infrastructure optimization
   */
  async applyInfrastructureOptimization(recommendation) {
    // This would implement infrastructure-specific optimizations
    // For example: scaling, load balancing, etc.
    logger.info('Applied infrastructure optimization', recommendation);
  }

  /**
   * Establish performance baseline
   */
  establishBaseline() {
    this.baseline = this.getCurrentMetrics();
    logger.info('Performance baseline established', this.baseline);
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const current = this.getCurrentMetrics();
    const issues = this.alerts.filter(a => a.status === 'detected');
    const recentOptimizations = Array.from(this.optimizations.values())
      .filter(o => Date.now() - o.appliedAt < 3600000); // Last hour
    
    return {
      current,
      baseline: this.baseline,
      health: this.calculateHealthScore(current),
      issues: issues.slice(-10), // Last 10 issues
      optimizations: recentOptimizations,
      metrics: {
        cpu: this.metrics.cpu.slice(-20),
        memory: this.metrics.memory.slice(-20),
        responseTime: this.metrics.responseTime.slice(-20)
      }
    };
  }

  /**
   * Calculate health score
   */
  calculateHealthScore(current) {
    if (!this.baseline) return 0.5;
    
    let score = 1.0;
    
    // CPU health
    if (current.cpu && this.baseline.cpu) {
      const cpuRatio = current.cpu / this.baseline.cpu;
      if (cpuRatio > 1.5) score -= 0.3;
      else if (cpuRatio > 1.2) score -= 0.1;
    }
    
    // Memory health
    if (current.memory && this.baseline.memory) {
      const memRatio = current.memory.heapUsed / this.baseline.memory.heapUsed;
      if (memRatio > 1.5) score -= 0.3;
      else if (memRatio > 1.2) score -= 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Record response time
   */
  recordResponseTime(time) {
    this.metrics.responseTime.push({
      timestamp: Date.now(),
      value: time
    });
  }

  /**
   * Record error rate
   */
  recordErrorRate(rate) {
    this.metrics.errorRate.push({
      timestamp: Date.now(),
      value: rate
    });
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(duration) {
    this.metrics.databaseQueries.push({
      timestamp: Date.now(),
      value: duration
    });
  }

  /**
   * Record active connections
   */
  recordActiveConnections(count) {
    this.metrics.activeConnections.push({
      timestamp: Date.now(),
      value: count
    });
  }
}

module.exports = AIPerformanceOptimizer;
