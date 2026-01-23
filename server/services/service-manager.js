/**
 * Service Manager - Simplified Version
 * Basic service management functionality
 */

const logger = require('../utils/logger');

class ServiceManager {
  constructor() {
    this.services = new Map();
    this.isInitialized = false;
    this.stats = { registered: 0, started: 0, stopped: 0, errors: 0 };
  }

  /**
   * Initialize service manager
   */
  async initialize() {
    logger.info('Service Manager initialized');
    this.isInitialized = true;
    return true;
  }

  /**
   * Register service
   */
  registerService(serviceName, serviceConfig = {}) {
    try {
      const service = {
        name: serviceName,
        config: serviceConfig,
        status: 'registered',
        registeredAt: new Date(),
        startedAt: null,
        stoppedAt: null,
        health: 'unknown',
        dependencies: serviceConfig.dependencies || []
      };

      this.services.set(serviceName, service);
      this.stats.registered++;

      logger.info('Service registered', { serviceName });

      return {
        success: true,
        service
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to register service', { serviceName, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start service
   */
  async startService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return { success: false, message: 'Service not found' };
    }

    if (service.status === 'running') {
      return { success: false, message: 'Service already running' };
    }

    try {
      // Check dependencies
      for (const dep of service.dependencies) {
        const depService = this.services.get(dep);
        if (!depService || depService.status !== 'running') {
          return { success: false, message: `Dependency ${dep} is not running` };
        }
      }

      service.status = 'starting';
      service.startedAt = new Date();

      // Simulate service startup
      await new Promise(resolve => setTimeout(resolve, 100));

      service.status = 'running';
      service.health = 'healthy';
      this.stats.started++;

      logger.info('Service started', { serviceName });

      return {
        success: true,
        service
      };

    } catch (error) {
      this.stats.errors++;
      service.status = 'error';
      service.health = 'unhealthy';
      logger.error('Failed to start service', { serviceName, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop service
   */
  async stopService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return { success: false, message: 'Service not found' };
    }

    if (service.status !== 'running') {
      return { success: false, message: 'Service is not running' };
    }

    try {
      service.status = 'stopping';
      service.stoppedAt = new Date();

      // Simulate service shutdown
      await new Promise(resolve => setTimeout(resolve, 50));

      service.status = 'stopped';
      service.health = 'unknown';
      this.stats.stopped++;

      logger.info('Service stopped', { serviceName });

      return {
        success: true,
        service
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to stop service', { serviceName, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get service
   */
  getService(serviceName) {
    return this.services.get(serviceName);
  }

  /**
   * Get all services
   */
  getAllServices() {
    return Array.from(this.services.values());
  }

  /**
   * Get running services
   */
  getRunningServices() {
    return Array.from(this.services.values()).filter(s => s.status === 'running');
  }

  /**
   * Check service health
   */
  async checkServiceHealth(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return { healthy: false, message: 'Service not found' };
    }

    try {
      if (service.status !== 'running') {
        return { healthy: false, status: service.status };
      }

      // Simulate health check
      const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
      service.health = isHealthy ? 'healthy' : 'unhealthy';

      return {
        healthy: isHealthy,
        status: service.health,
        lastChecked: new Date()
      };

    } catch (error) {
      this.stats.errors++;
      service.health = 'unhealthy';
      logger.error('Failed to check service health', { serviceName, error: error.message });

      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Get service manager status
   */
  getStatus() {
    const runningServices = this.getRunningServices();

    return {
      isInitialized: this.isInitialized,
      stats: this.stats,
      totalServices: this.services.size,
      runningServices: runningServices.length,
      healthyServices: runningServices.filter(s => s.health === 'healthy').length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Start all services
   */
  async startAllServices() {
    const services = Array.from(this.services.values());
    const results = [];

    for (const service of services) {
      const result = await this.startService(service.name);
      results.push({ service: service.name, result });
    }

    return {
      success: true,
      results,
      started: results.filter(r => r.result.success).length,
      failed: results.filter(r => !r.result.success).length
    };
  }

  /**
   * Stop all services
   */
  async stopAllServices() {
    const services = Array.from(this.services.values());
    const results = [];

    for (const service of services) {
      const result = await this.stopService(service.name);
      results.push({ service: service.name, result });
    }

    return {
      success: true,
      results,
      stopped: results.filter(r => r.result.success).length,
      failed: results.filter(r => !r.result.success).length
    };
  }
}

// Create singleton instance
const serviceManager = new ServiceManager();

module.exports = serviceManager;
