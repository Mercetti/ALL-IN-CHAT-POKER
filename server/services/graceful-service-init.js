/**
 * Graceful Service Initialization
 * Prevents crashes from missing configuration or external service failures
 */

const Logger = require('../utils/logger');

class GracefulServiceInit {
  constructor() {
    this.logger = new Logger('graceful-service-init');
    this.serviceStates = new Map(); // Map<serviceName, {isReady, error, lastCheck}>
  }

  /**
   * Initialize service with graceful error handling
   */
  async initializeService(serviceName, initFunction, required = false) {
    this.logger.info(`Initializing service: ${serviceName}`);
    
    try {
      const result = await initFunction();
      
      this.serviceStates.set(serviceName, {
        isReady: true,
        error: null,
        lastCheck: Date.now(),
        result
      });
      
      this.logger.info(`Service initialized successfully: ${serviceName}`);
      return result;
      
    } catch (error) {
      this.serviceStates.set(serviceName, {
        isReady: false,
        error: error.message,
        lastCheck: Date.now(),
        result: null
      });
      
      this.logger.error(`Service initialization failed: ${serviceName}`, { 
        error: error.message,
        stack: error.stack,
        required 
      });
      
      if (required) {
        throw new Error(`Required service ${serviceName} failed to initialize: ${error.message}`);
      }
      
      return null;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(serviceName) {
    const state = this.serviceStates.get(serviceName);
    return state ? state.isReady : false;
  }

  /**
   * Get service state
   */
  getServiceState(serviceName) {
    return this.serviceStates.get(serviceName) || {
      isReady: false,
      error: 'Service not found',
      lastCheck: null,
      result: null
    };
  }

  /**
   * Execute service method with readiness check
   */
  async executeIfReady(serviceName, method, ...args) {
    const state = this.serviceStates.get(serviceName);
    
    if (!state || !state.isReady) {
      this.logger.warn(`Service not ready: ${serviceName}`, {
        isReady: !!state,
        error: state ? state.error : 'Service not found'
      });
      
      throw new Error(`Service ${serviceName} is not ready: ${state ? state.error : 'Service not found'}`);
    }
    
    try {
      return await method(...args);
    } catch (error) {
      this.logger.error(`Service method execution failed: ${serviceName}`, {
        error: error.message,
        method: method.name
      });
      
      // Mark service as potentially unhealthy
      state.lastCheck = Date.now();
      
      throw error;
    }
  }

  /**
   * Retry service initialization
   */
  async retryService(serviceName, initFunction, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.logger.info(`Retrying service initialization: ${serviceName} (attempt ${attempt}/${maxRetries})`);
      
      try {
        const result = await this.initializeService(serviceName, initFunction);
        
        if (this.isReady(serviceName)) {
          this.logger.info(`Service retry successful: ${serviceName} (attempt ${attempt})`);
          return result;
        }
      } catch (error) {
        this.logger.warn(`Service retry failed: ${serviceName} (attempt ${attempt})`, {
          error: error.message
        });
        
        if (attempt < maxRetries) {
          await this.delay(delay * attempt); // Exponential backoff
        }
      }
    }
    
    throw new Error(`Service ${serviceName} failed after ${maxRetries} retries`);
  }

  /**
   * Periodic health check for services
   */
  startHealthCheck(interval = 30000) {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, interval);
    
    this.logger.info('Started periodic service health check', { interval });
  }

  /**
   * Stop health check
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.info('Stopped periodic service health check');
    }
  }

  /**
   * Perform health check on all services
   */
  async performHealthCheck() {
    const healthResults = {};
    
    for (const [serviceName, state] of this.serviceStates) {
      try {
        // Basic health check - service is still in expected state
        if (state.isReady && state.result) {
          // If service has a health check method, call it
          if (typeof state.result.getHealthChecks === 'function') {
            const serviceHealth = await state.result.getHealthChecks();
            healthResults[serviceName] = {
              status: serviceHealth.status || 'healthy',
              lastCheck: Date.now(),
              details: serviceHealth
            };
          } else {
            healthResults[serviceName] = {
              status: 'healthy',
              lastCheck: Date.now(),
              message: 'Service is ready'
            };
          }
        } else {
          healthResults[serviceName] = {
            status: 'unhealthy',
            lastCheck: Date.now(),
            error: state.error || 'Service not ready'
          };
        }
      } catch (error) {
        healthResults[serviceName] = {
          status: 'unhealthy',
          lastCheck: Date.now(),
          error: error.message
        };
      }
    }
    
    this.emit('healthCheck', healthResults);
    return healthResults;
  }

  /**
   * Get all service states
   */
  getAllServiceStates() {
    const states = {};
    
    for (const [serviceName, state] of this.serviceStates) {
      states[serviceName] = {
        isReady: state.isReady,
        error: state.error,
        lastCheck: state.lastCheck,
        uptime: state.isReady ? Date.now() - (state.initializedAt || state.lastCheck) : 0
      };
    }
    
    return states;
  }

  /**
   * Reset service state
   */
  resetService(serviceName) {
    this.serviceStates.delete(serviceName);
    this.logger.info(`Reset service state: ${serviceName}`);
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get statistics
   */
  getStats() {
    const states = Array.from(this.serviceStates.values());
    
    return {
      totalServices: states.length,
      readyServices: states.filter(s => s.isReady).length,
      failedServices: states.filter(s => !s.isReady).length,
      services: this.getAllServiceStates()
    };
  }
}

// Make it an EventEmitter for health check events
const EventEmitter = require('events');
Object.setPrototypeOf(GracefulServiceInit.prototype, EventEmitter.prototype);

module.exports = GracefulServiceInit;
