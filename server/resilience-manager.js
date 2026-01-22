/**
 * Resilience Manager - Hardens the app against failures
 * Provides multiple layers of protection and auto-recovery
 */

const Logger = require('./logger');
const logger = new Logger('RESILIENCE');

class ResilienceManager {
  constructor() {
    this.circuitBreakers = new Map();
    this.retryAttempts = new Map();
    this.fallbackResponses = new Map();
    this.healthChecks = new Map();
    this.isInitialized = false;
    
    this.initializeResilience();
  }

  initializeResilience() {
    if (this.isInitialized) return;
    
    // Setup circuit breakers for critical services
    this.setupCircuitBreakers();
    
    // Setup fallback responses
    this.setupFallbackResponses();
    
    // Setup health checks
    this.setupHealthChecks();
    
    // Setup global error handlers
    this.setupGlobalErrorHandlers();
    
    this.isInitialized = true;
    logger.info('Resilience Manager initialized');
  }

  setupCircuitBreakers() {
    // Ollama circuit breaker
    this.circuitBreakers.set('ollama', {
      failures: 0,
      maxFailures: 3,
      timeout: 60000, // 1 minute
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      lastFailure: 0
    });

    // AI services circuit breaker
    this.circuitBreakers.set('ai', {
      failures: 0,
      maxFailures: 5,
      timeout: 30000, // 30 seconds
      state: 'CLOSED',
      lastFailure: 0
    });

    // Database circuit breaker
    this.circuitBreakers.set('database', {
      failures: 0,
      maxFailures: 2,
      timeout: 10000, // 10 seconds
      state: 'CLOSED',
      lastFailure: 0
    });
  }

  setupFallbackResponses() {
    // AI fallback responses
    this.fallbackResponses.set('ai', {
      chat: "I'm temporarily experiencing high demand. Please try again in a moment.",
      analysis: {
        issues: [],
        recommendations: [{
          type: 'system',
          priority: 'low',
          description: 'AI services temporarily unavailable',
          expectedImprovement: 'Services will resume shortly'
        }],
        overallHealth: 'fair'
      },
      performance: {
        responseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        status: 'degraded'
      }
    });

    // Database fallbacks
    this.fallbackResponses.set('database', {
      query: [],
      status: 'unavailable',
      message: 'Database temporarily unavailable'
    });

    // Ollama fallbacks
    this.fallbackResponses.set('ollama', {
      models: ['deepseek-coder:1.3b'],
      status: 'fallback',
      message: 'Using cached model information'
    });
  }

  setupHealthChecks() {
    // Ollama health check
    this.healthChecks.set('ollama', async () => {
      try {
        const config = require('./config');
        const response = await fetch(`${config.OLLAMA_HOST}/api/tags`, {
          timeout: 3000,
          signal: AbortSignal.timeout(3000)
        });
        return response.ok;
      } catch (error) {
        return false;
      }
    });

    // Database health check
    this.healthChecks.set('database', async () => {
      try {
        const db = require('./db');
        return new Promise((resolve) => {
          db.get('SELECT 1 as test', (err) => {
            resolve(!err);
        });
      } catch (error) {
        return false;
      }
    });

    // AI system health check
    this.healthChecks.set('ai', async () => {
      try {
        const { chat } = require('./ai');
        await chat([{ role: 'user', content: 'health' }], { maxTokens: 1 });
        return true;
      } catch (error) {
        return false;
      }
    });
  }

  setupGlobalErrorHandlers() {
    // Prevent uncaught exceptions from crashing the app
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception caught by resilience manager', { 
        error: error.message,
        stack: error.stack 
      });
      
      // Don't exit the process, just log and continue
      this.handleCriticalError('uncaughtException', error);

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection caught by resilience manager', { 
        reason: reason?.message || reason,
        promise: promise.toString()
      });
      
      this.handleCriticalError('unhandledRejection', reason);
  }

  async executeWithCircuitBreaker(serviceName, operation, fallback = null) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      return await operation();
    }

    // Check if circuit is open
    if (breaker.state === 'OPEN') {
      if (Date.now() - breaker.lastFailure > breaker.timeout) {
        // Try half-open state
        breaker.state = 'HALF_OPEN';
        logger.info(`Circuit breaker for ${serviceName} entering HALF_OPEN state`);
      } else {
        // Circuit is still open, use fallback
        logger.warn(`Circuit breaker OPEN for ${serviceName}, using fallback`);
        return fallback || this.fallbackResponses.get(serviceName);
      }
    }

    try {
      const result = await operation();
      
      // Success - reset circuit breaker
      if (breaker.state === 'HALF_OPEN') {
        breaker.state = 'CLOSED';
        breaker.failures = 0;
        logger.info(`Circuit breaker for ${serviceName} reset to CLOSED`);
      }
      
      return result;
    } catch (error) {
      // Failure - increment counter and potentially open circuit
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      if (breaker.failures >= breaker.maxFailures) {
        breaker.state = 'OPEN';
        logger.error(`Circuit breaker OPENED for ${serviceName} after ${breaker.failures} failures`, {
          error: error.message
        });
      }
      
      // Use fallback if available
      if (fallback) {
        logger.warn(`Operation failed for ${serviceName}, using fallback`, { error: error.message });
        return fallback;
      }
      
      const fallbackResponse = this.fallbackResponses.get(serviceName);
      if (fallbackResponse) {
        logger.warn(`Operation failed for ${serviceName}, using default fallback`, { error: error.message });
        return fallbackResponse;
      }
      
      throw error;
    }
  }

  async executeWithRetry(serviceName, operation, maxRetries = 3, delay = 1000) {
    const key = `${serviceName}_retry`;
    let attempts = this.retryAttempts.get(key) || 0;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await operation();
        
        // Success - reset retry counter
        this.retryAttempts.set(key, 0);
        return result;
      } catch (error) {
        attempts++;
        this.retryAttempts.set(key, attempts);
        
        if (i === maxRetries) {
          logger.error(`Operation failed for ${serviceName} after ${maxRetries + 1} attempts`, {
            error: error.message,
            attempts
          });
          throw error;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, i);
        logger.warn(`Operation failed for ${serviceName}, retrying in ${waitTime}ms (attempt ${i + 1}/${maxRetries + 1})`, {
          error: error.message
        });
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  async healthCheck(serviceName) {
    const check = this.healthChecks.get(serviceName);
    if (!check) {
      return { status: 'unknown', message: 'No health check configured' };
    }

    try {
      const isHealthy = await check();
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: serviceName
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
        service: serviceName
      };
    }
  }

  async getAllHealthChecks() {
    const results = {};
    for (const [serviceName] of this.healthChecks) {
      results[serviceName] = await this.healthCheck(serviceName);
    }
    return results;
  }

  handleCriticalError(type, error) {
    logger.error(`Critical error handled by resilience manager`, {
      type,
      error: error?.message || error,
      timestamp: new Date().toISOString()
    });

    // Try to recover gracefully
    this.attemptRecovery(type, error);
  }

  async attemptRecovery(type, error) {
    logger.info('Attempting automatic recovery', { type });
    
    try {
      // Reset circuit breakers that might be causing issues
      for (const [serviceName, breaker] of this.circuitBreakers) {
        if (breaker.state === 'OPEN' && Date.now() - breaker.lastFailure > breaker.timeout) {
          breaker.state = 'HALF_OPEN';
          breaker.failures = Math.max(0, breaker.failures - 1);
          logger.info(`Reset circuit breaker for ${serviceName} during recovery`);
        }
      }

      // Run health checks to verify services
      const healthResults = await this.getAllHealthChecks();
      const unhealthyServices = Object.entries(healthResults)
        .filter(([_, result]) => result.status !== 'healthy')
        .map(([service, _]) => service);

      if (unhealthyServices.length > 0) {
        logger.warn('Recovery attempt - unhealthy services detected', { services: unhealthyServices });
      } else {
        logger.info('Recovery successful - all services healthy');
      }
    } catch (recoveryError) {
      logger.error('Recovery attempt failed', { error: recoveryError.message });
    }
  }

  getResilienceStatus() {
    const status = {
      circuitBreakers: {},
      retryAttempts: Object.fromEntries(this.retryAttempts),
      timestamp: new Date().toISOString()
    };

    for (const [serviceName, breaker] of this.circuitBreakers) {
      status.circuitBreakers[serviceName] = {
        state: breaker.state,
        failures: breaker.failures,
        maxFailures: breaker.maxFailures,
        lastFailure: breaker.lastFailure,
        nextRetry: breaker.lastFailure + breaker.timeout
      };
    }

    return status;
  }
}

// Singleton instance
const resilienceManager = new ResilienceManager();

module.exports = resilienceManager;
