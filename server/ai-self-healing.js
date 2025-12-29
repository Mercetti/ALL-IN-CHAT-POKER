/**
 * AI Self-Healing Middleware
 * Automatically detects and fixes common issues
 */

const aiErrorManager = require('./ai-error-manager');
const aiPerformanceOptimizer = require('./ai-performance-optimizer');
const aiUXMonitor = require('./ai-ux-monitor');
const { logger } = require('./logger');

class AISelfHealingMiddleware {
  constructor(options = {}) {
    this.options = {
      enableAutoHealing: options.enableAutoHealing !== false,
      healingInterval: options.healingInterval || 60000, // 1 minute
      maxHealingAttempts: options.maxHealingAttempts || 3,
      ...options
    };
    
    this.healingHistory = new Map();
    this.activeHealings = new Set();
    
    this.init();
  }

  init() {
    // Start periodic healing
    this.startPeriodicHealing();
    
    // Set up error handlers
    this.setupErrorHandlers();
    
    logger.info('AI Self-Healing Middleware initialized', {
      autoHealing: this.options.enableAutoHealing,
      interval: this.options.healingInterval
    });
  }

  /**
   * Express middleware for error handling
   */
  middleware() {
    return async (error, req, res, next) => {
      if (!this.options.enableAutoHealing) {
        return next(error);
      }

      try {
        // Detect and analyze error
        const errorInfo = await aiErrorManager.detectError(error, {
          url: req.url,
          method: req.method,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          userId: req.user?.id || 'anonymous'
        });

        // Attempt auto-fix
        if (errorInfo.severity === 'high' || errorInfo.severity === 'critical') {
          const fixResult = await aiErrorManager.attemptAutoFix(errorInfo);
          
          if (fixResult.success) {
            logger.info('Auto-fix successful', { 
              errorId: errorInfo.id,
              fixType: fixResult.type 
            });
            
            // Try the request again
            return this.retryRequest(req, res, next);
          }
        }

        // Track UX impact
        this.trackUXImpact(error, req);

        // Continue with normal error handling
        next(error);

      } catch (healingError) {
        logger.error('Self-healing failed', { 
          originalError: error.message,
          healingError: healingError.message 
        });
        
        next(error);
      }
    };
  }

  /**
   * Retry request after successful fix
   */
  async retryRequest(req, res, next) {
    try {
      // Simple retry - in production, you'd want more sophisticated retry logic
      const originalHandler = req.app._router.handle.bind(req.app._router);
      await originalHandler(req, res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track UX impact of errors
   */
  trackUXImpact(error, req) {
    const userId = req.user?.id || 'anonymous';
    
    aiUXMonitor.trackUserError(userId, {
      type: error.name || 'unknown',
      message: error.message,
      context: {
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent')
      }
    });
  }

  /**
   * Setup global error handlers
   */
  setupErrorHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      
      if (this.options.enableAutoHealing) {
        await this.handleCriticalError(error);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled promise rejection', { reason, promise });
      
      if (this.options.enableAutoHealing) {
        await this.handleCriticalError(new Error(`Unhandled rejection: ${reason}`));
      }
    });
  }

  /**
   * Handle critical system errors
   */
  async handleCriticalError(error) {
    const healingId = this.generateHealingId();
    
    if (this.activeHealings.has(healingId)) {
      return; // Already healing this type of error
    }

    this.activeHealings.add(healingId);

    try {
      // Detect error
      const errorInfo = await aiErrorManager.detectError(error, {
        context: 'critical_system_error',
        timestamp: Date.now()
      });

      // Attempt fix
      const fixResult = await aiErrorManager.attemptAutoFix(errorInfo);

      if (fixResult.success) {
        logger.info('Critical error auto-fixed', { 
          healingId,
          errorId: errorInfo.id 
        });
      } else {
        logger.error('Failed to auto-fix critical error', { 
          healingId,
          errorId: errorInfo.id,
          reason: fixResult.reason 
        });
      }

    } catch (healingError) {
      logger.error('Critical error healing failed', { 
        healingId,
        error: healingError.message 
      });
    } finally {
      this.activeHealings.delete(healingId);
    }
  }

  /**
   * Start periodic healing
   */
  startPeriodicHealing() {
    setInterval(async () => {
      if (this.options.enableAutoHealing) {
        await this.performPeriodicHealing();
      }
    }, this.options.healingInterval);
  }

  /**
   * Perform periodic healing checks
   */
  async performPeriodicHealing() {
    try {
      // Check system health
      await this.checkSystemHealth();
      
      // Check for recurring issues
      await this.checkRecurringIssues();
      
      // Apply preventive optimizations
      await this.applyPreventiveOptimizations();
      
    } catch (error) {
      logger.error('Periodic healing failed', { error: error.message });
    }
  }

  /**
   * Check system health
   */
  async checkSystemHealth() {
    const performanceReport = aiPerformanceOptimizer.getPerformanceReport();
    const errorHealth = aiErrorManager.getHealthReport();
    
    // Check if system is unhealthy
    if (performanceReport.metrics.health < 0.7) {
      await this.handlePerformanceIssues(performanceReport);
    }
    
    if (errorHealth.metrics.activeErrors > 5) {
      await this.handleErrorIssues(errorHealth);
    }
  }

  /**
   * Handle performance issues
   */
  async handlePerformanceIssues(performanceReport) {
    const issues = performanceReport.metrics.issues || [];
    
    for (const issue of issues) {
      if (issue.severity === 'high') {
        await this.attemptPerformanceHealing(issue);
      }
    }
  }

  /**
   * Handle error issues
   */
  async handleErrorIssues(errorHealth) {
    const activeErrors = errorHealth.activeErrors || [];
    
    for (const error of activeErrors) {
      if (error.severity === 'high' || error.severity === 'critical') {
        await this.attemptErrorHealing(error);
      }
    }
  }

  /**
   * Attempt performance healing
   */
  async attemptPerformanceHealing(issue) {
    const healingId = this.generateHealingId();
    
    if (this.activeHealings.has(healingId)) {
      return;
    }

    this.activeHealings.add(healingId);

    try {
      // Trigger performance optimizations
      await aiPerformanceOptimizer.handleHighSeverityIssue(issue);
      
      logger.info('Performance healing applied', { 
        healingId,
        issueType: issue.type 
      });
      
    } catch (error) {
      logger.error('Performance healing failed', { 
        healingId,
        error: error.message 
      });
    } finally {
      this.activeHealings.delete(healingId);
    }
  }

  /**
   * Attempt error healing
   */
  async attemptErrorHealing(error) {
    const healingId = this.generateHealingId();
    
    if (this.activeHealings.has(healingId)) {
      return;
    }

    this.activeHealings.add(healingId);

    try {
      // Attempt auto-fix
      const fixResult = await aiErrorManager.attemptAutoFix(error);
      
      if (fixResult.success) {
        logger.info('Error healing applied', { 
          healingId,
          errorId: error.id 
        });
      }
      
    } catch (healingError) {
      logger.error('Error healing failed', { 
        healingId,
        error: healingError.message 
      });
    } finally {
      this.activeHealings.delete(healingId);
    }
  }

  /**
   * Check for recurring issues
   */
  async checkRecurringIssues() {
    const errorHealth = aiErrorManager.getHealthReport();
    const recurringErrors = errorHealth.metrics.errorsDetected > 10;
    
    if (recurringErrors) {
      await this.handleRecurringErrors(errorHealth);
    }
  }

  /**
   * Handle recurring errors
   */
  async handleRecurringErrors(errorHealth) {
    const patterns = errorHealth.learnedPatterns || [];
    
    for (const [patternKey, pattern] of patterns) {
      if (pattern.count > 5) {
        await this.applyPatternBasedFix(pattern);
      }
    }
  }

  /**
   * Apply pattern-based fix
   */
  async applyPatternBasedFix(pattern) {
    const healingId = this.generateHealingId();
    
    if (this.activeHealings.has(healingId)) {
      return;
    }

    this.activeHealings.add(healingId);

    try {
      // Apply the learned fix
      if (pattern.fixType === 'code_change') {
        await this.applyCodeFix(pattern);
      } else if (pattern.fixType === 'config_update') {
        await this.applyConfigFix(pattern);
      }
      
      logger.info('Pattern-based fix applied', { 
        healingId,
        patternKey 
      });
      
    } catch (error) {
      logger.error('Pattern-based fix failed', { 
        healingId,
        error: error.message 
      });
    } finally {
      this.activeHealings.delete(healingId);
    }
  }

  /**
   * Apply code fix
   */
  async applyCodeFix(pattern) {
    // This would implement the actual code fix
    logger.info('Applied code fix from pattern', pattern);
  }

  /**
   * Apply config fix
   */
  async applyConfigFix(pattern) {
    // This would implement the actual config fix
    logger.info('Applied config fix from pattern', pattern);
  }

  /**
   * Apply preventive optimizations
   */
  async applyPreventiveOptimizations() {
    try {
      // Trigger garbage collection if memory is high
      const memUsage = process.memoryUsage();
      const memoryUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
      
      if (memoryUsagePercent > 0.8 && global.gc) {
        global.gc();
        logger.info('Preventive garbage collection triggered');
      }
      
      // Clear caches if needed
      if (global.clearCache && memoryUsagePercent > 0.7) {
        global.clearCache();
        logger.info('Preventive cache clearing triggered');
      }
      
    } catch (error) {
      logger.error('Preventive optimization failed', { error: error.message });
    }
  }

  /**
   * Get healing status
   */
  getHealingStatus() {
    return {
      activeHealings: Array.from(this.activeHealings),
      healingHistory: Array.from(this.healingHistory.entries()),
      options: this.options,
      lastCheck: Date.now()
    };
  }

  /**
   * Generate healing ID
   */
  generateHealingId() {
    return `heal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
const aiSelfHealing = new AISelfHealingMiddleware({
  enableAutoHealing: true,
  healingInterval: 60000,
  maxHealingAttempts: 3
});

module.exports = aiSelfHealing;
