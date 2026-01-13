/**
 * Service Manager
 * Manages the lifecycle and coordination of all services
 */

const EventEmitter = require('events');
const Logger = require('../utils/logger');

class ServiceManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableMetrics: options.enableMetrics !== false,
      enableHealthCheck: options.enableHealthCheck !== false,
      healthCheckInterval: options.healthCheckInterval || 30000,
      gracefulShutdownTimeout: options.gracefulShutdownTimeout || 10000,
      enableDependencyManagement: options.enableDependencyManagement !== false
    };
    
    this.logger = new Logger('service-manager');
    this.services = new Map();
    this.dependencies = new Map();
    this.state = 'stopped';
    this.metrics = {
      startTime: null,
      totalServices: 0,
      runningServices: 0,
      failedServices: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      lastHealthCheck: null
    };
    
    this.initialize();
  }

  /**
   * Initialize the service manager
   */
  initialize() {
    this.logger.info('Initializing service manager');
    
    if (this.options.enableHealthCheck) {
      this.setupHealthCheck();
    }
    
    if (this.options.enableMetrics) {
      this.setupMetrics();
    }
    
    // Handle process signals for graceful shutdown
    this.setupSignalHandlers();
  }

  /**
   * Register a service
   */
  registerService(service, dependencies = []) {
    if (!service || !service.name) {
      throw new Error('Service must have a name property');
    }
    
    if (this.services.has(service.name)) {
      throw new Error(`Service ${service.name} is already registered`);
    }
    
    this.services.set(service.name, {
      service,
      dependencies,
      state: 'registered',
      registeredAt: Date.now(),
      lastHealthCheck: null,
      health: null,
      metrics: {
        startTime: null,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        errors: []
      }
    });
    
    this.dependencies.set(service.name, dependencies);
    this.metrics.totalServices++;
    
    // Set up service event listeners
    this.setupServiceListeners(service);
    
    this.logger.info(`Service registered: ${service.name}`, {
      dependencies,
      totalServices: this.metrics.totalServices
    });
    
    this.emit('serviceRegistered', { service, dependencies });
    
    return this;
  }

  /**
   * Set up service event listeners
   */
  setupServiceListeners(service) {
    service.on('started', () => {
      this.handleServiceStarted(service);
    });
    
    service.on('stopped', () => {
      this.handleServiceStopped(service);
    });
    
    service.on('error', (error) => {
      this.handleServiceError(service, error);
    });
    
    service.on('metric', (metric) => {
      this.handleServiceMetric(service, metric);
    });
    
    service.on('healthCheck', (health) => {
      this.handleServiceHealthCheck(service, health);
    });
  }

  /**
   * Start all services
   */
  async startAll() {
    if (this.state === 'starting' || this.state === 'running') {
      return;
    }
    
    this.state = 'starting';
    this.metrics.startTime = Date.now();
    
    this.logger.info('Starting all services');
    
    try {
      // Start services in dependency order
      const startOrder = this.getDependencyOrder();
      
      for (const serviceName of startOrder) {
        await this.startService(serviceName);
      }
      
      this.state = 'running';
      this.emit('allServicesStarted');
      this.logger.info('All services started successfully');
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      this.logger.error('Failed to start all services', { error: error.message });
      throw error;
    }
  }

  /**
   * Start a specific service
   */
  async startService(serviceName) {
    const serviceInfo = this.services.get(serviceName);
    
    if (!serviceInfo) {
      throw new Error(`Service ${serviceName} is not registered`);
    }
    
    if (serviceInfo.state === 'starting' || serviceInfo.state === 'running') {
      return;
    }
    
    // Check dependencies
    if (this.options.enableDependencyManagement) {
      await this.checkDependencies(serviceName);
    }
    
    serviceInfo.state = 'starting';
    this.logger.info(`Starting service: ${serviceName}`);
    
    try {
      await serviceInfo.service.start();
      serviceInfo.state = 'running';
      serviceInfo.metrics.startTime = Date.now();
      
      this.metrics.runningServices++;
      this.emit('serviceStarted', { serviceName });
      
    } catch (error) {
      serviceInfo.state = 'error';
      this.metrics.failedServices++;
      this.emit('serviceError', { serviceName, error });
      throw error;
    }
  }

  /**
   * Stop all services
   */
  async stopAll() {
    if (this.state === 'stopping' || this.state === 'stopped') {
      return;
    }
    
    this.state = 'stopping';
    
    this.logger.info('Stopping all services');
    
    try {
      // Stop services in reverse dependency order
      const stopOrder = this.getDependencyOrder().reverse();
      
      const stopPromises = stopOrder.map(serviceName => 
        this.stopService(serviceName).catch(error => {
          this.logger.error(`Failed to stop service: ${serviceName}`, { error: error.message });
        })
      );
      
      await Promise.all(stopPromises);
      
      this.state = 'stopped';
      this.emit('allServicesStopped');
      this.logger.info('All services stopped');
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      this.logger.error('Failed to stop all services', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop a specific service
   */
  async stopService(serviceName) {
    const serviceInfo = this.services.get(serviceName);
    
    if (!serviceInfo) {
      throw new Error(`Service ${serviceName} is not registered`);
    }
    
    if (serviceInfo.state === 'stopping' || serviceInfo.state === 'stopped') {
      return;
    }
    
    serviceInfo.state = 'stopping';
    this.logger.info(`Stopping service: ${serviceName}`);
    
    try {
      await serviceInfo.service.stop();
      serviceInfo.state = 'stopped';
      
      this.metrics.runningServices--;
      this.emit('serviceStopped', { serviceName });
      
    } catch (error) {
      serviceInfo.state = 'error';
      this.emit('serviceError', { serviceName, error });
      throw error;
    }
  }

  /**
   * Restart a service
   */
  async restartService(serviceName) {
    await this.stopService(serviceName);
    await this.startService(serviceName);
  }

  /**
   * Get dependency order for services
   */
  getDependencyOrder() {
    const order = [];
    const visited = new Set();
    const visiting = new Set();
    
    const visit = (serviceName) => {
      if (visited.has(serviceName)) {
        return;
      }
      
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected involving ${serviceName}`);
      }
      
      visiting.add(serviceName);
      
      const dependencies = this.dependencies.get(serviceName) || [];
      
      for (const dependency of dependencies) {
        if (this.services.has(dependency)) {
          visit(dependency);
        }
      }
      
      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };
    
    for (const serviceName of this.services.keys()) {
      visit(serviceName);
    }
    
    return order;
  }

  /**
   * Check service dependencies
   */
  async checkDependencies(serviceName) {
    const dependencies = this.dependencies.get(serviceName) || [];
    
    for (const dependency of dependencies) {
      const dependencyInfo = this.services.get(dependency);
      
      if (!dependencyInfo) {
        throw new Error(`Dependency ${dependency} is not registered`);
      }
      
      if (dependencyInfo.state !== 'running') {
        throw new Error(`Dependency ${dependency} is not running`);
      }
    }
  }

  /**
   * Handle service started event
   */
  handleServiceStarted(service) {
    const serviceInfo = this.services.get(service.name);
    
    if (serviceInfo) {
      serviceInfo.state = 'running';
      this.logger.info(`Service started: ${service.name}`);
    }
  }

  /**
   * Handle service stopped event
   */
  handleServiceStopped(service) {
    const serviceInfo = this.services.get(service.name);
    
    if (serviceInfo) {
      serviceInfo.state = 'stopped';
      this.logger.info(`Service stopped: ${service.name}`);
    }
  }

  /**
   * Handle service error event
   */
  handleServiceError(service, error) {
    const serviceInfo = this.services.get(service.name);
    
    if (serviceInfo) {
      serviceInfo.state = 'error';
      serviceInfo.metrics.errors.push({
        timestamp: Date.now(),
        error: error.message
      });
      
      this.logger.error(`Service error: ${service.name}`, { error: error.message });
    }
  }

  /**
   * Handle service metric event
   */
  handleServiceMetric(service, metric) {
    const serviceInfo = this.services.get(service.name);
    
    if (serviceInfo) {
      if (metric.type === 'request') {
        serviceInfo.metrics.totalRequests++;
        
        if (metric.success) {
          serviceInfo.metrics.successfulRequests++;
        } else {
          serviceInfo.metrics.failedRequests++;
        }
        
        // Update average response time
        const totalRequests = serviceInfo.metrics.totalRequests;
        if (totalRequests === 1) {
          serviceInfo.metrics.averageResponseTime = metric.responseTime;
        } else {
          serviceInfo.metrics.averageResponseTime = 
            (serviceInfo.metrics.averageResponseTime * (totalRequests - 1) + metric.responseTime) / totalRequests;
        }
      }
    }
    
    this.emit('serviceMetric', { serviceName: service.name, metric });
  }

  /**
   * Handle service health check event
   */
  handleServiceHealthCheck(service, health) {
    const serviceInfo = this.services.get(service.name);
    
    if (serviceInfo) {
      serviceInfo.lastHealthCheck = Date.now();
      serviceInfo.health = health;
    }
  }

  /**
   * Setup health check
   */
  setupHealthCheck() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.options.healthCheckInterval);
  }

  /**
   * Perform health check for all services
   */
  async performHealthCheck() {
    const healthChecks = {};
    
    for (const [serviceName, serviceInfo] of this.services) {
      if (serviceInfo.state === 'running') {
        try {
          const health = await serviceInfo.service.getHealthChecks();
          healthChecks[serviceName] = health;
        } catch (error) {
          healthChecks[serviceName] = {
            status: 'unhealthy',
            error: error.message
          };
        }
      } else {
        healthChecks[serviceName] = {
          status: 'unhealthy',
          message: `Service is ${serviceInfo.state}`
        };
      }
    }
    
    this.metrics.lastHealthCheck = Date.now();
    this.emit('healthCheck', healthChecks);
  }

  /**
   * Setup metrics collection
   */
  setupMetrics() {
    setInterval(() => {
      this.emit('metrics', this.getMetrics());
    }, 60000); // Every minute
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  setupSignalHandlers() {
    const shutdown = async (signal) => {
      this.logger.info(`Received ${signal}, shutting down gracefully`);
      
      try {
        await Promise.race([
          this.stopAll(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Shutdown timeout')), 
            this.options.gracefulShutdownTimeout)
          )
        ]);
        
        process.exit(0);
        
      } catch (error) {
        this.logger.error('Graceful shutdown failed', { error: error.message });
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Get service
   */
  getService(serviceName) {
    const serviceInfo = this.services.get(serviceName);
    return serviceInfo ? serviceInfo.service : null;
  }

  /**
   * Get all services
   */
  getAllServices() {
    const services = {};
    
    for (const [serviceName, serviceInfo] of this.services) {
      services[serviceName] = {
        name: serviceName,
        state: serviceInfo.state,
        dependencies: this.dependencies.get(serviceName),
        registeredAt: serviceInfo.registeredAt,
        lastHealthCheck: serviceInfo.lastHealthCheck,
        health: serviceInfo.health,
        metrics: serviceInfo.metrics
      };
    }
    
    return services;
  }

  /**
   * Get service manager metrics
   */
  getMetrics() {
    const uptime = this.metrics.startTime ? Date.now() - this.metrics.startTime : 0;
    const totalServiceRequests = Array.from(this.services.values())
      .reduce((sum, serviceInfo) => sum + serviceInfo.metrics.totalRequests, 0);
    
    return {
      state: this.state,
      uptime,
      startTime: this.metrics.startTime,
      totalServices: this.metrics.totalServices,
      runningServices: this.metrics.runningServices,
      failedServices: this.metrics.failedServices,
      totalServiceRequests,
      averageResponseTime: this.calculateAverageResponseTime(),
      lastHealthCheck: this.metrics.lastHealthCheck,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Calculate average response time across all services
   */
  calculateAverageResponseTime() {
    const services = Array.from(this.services.values());
    const runningServices = services.filter(s => s.state === 'running');
    
    if (runningServices.length === 0) {
      return 0;
    }
    
    const totalResponseTime = runningServices.reduce(
      (sum, serviceInfo) => sum + serviceInfo.metrics.averageResponseTime, 
      0
    );
    
    return Math.round(totalResponseTime / runningServices.length);
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    const healthChecks = {};
    let overallStatus = 'healthy';
    
    for (const [serviceName, serviceInfo] of this.services) {
      if (serviceInfo.state === 'running') {
        try {
          const health = await serviceInfo.service.getHealthChecks();
          healthChecks[serviceName] = health;
          
          if (health.status !== 'healthy') {
            overallStatus = 'degraded';
          }
        } catch (error) {
          healthChecks[serviceName] = {
            status: 'unhealthy',
            error: error.message
          };
          overallStatus = 'unhealthy';
        }
      } else {
        healthChecks[serviceName] = {
          status: 'unhealthy',
          message: `Service is ${serviceInfo.state}`
        };
        overallStatus = 'unhealthy';
      }
    }
    
    return {
      status: overallStatus,
      timestamp: Date.now(),
      services: healthChecks,
      manager: {
        state: this.state,
        uptime: this.getMetrics().uptime
      }
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      startTime: Date.now(),
      totalServices: this.services.size,
      runningServices: this.metrics.runningServices,
      failedServices: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      lastHealthCheck: null
    };
    
    // Reset service metrics
    for (const serviceInfo of this.services.values()) {
      serviceInfo.metrics = {
        startTime: serviceInfo.metrics.startTime,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        errors: []
      };
    }
    
    this.logger.info('Service manager metrics reset');
  }
}

module.exports = ServiceManager;
