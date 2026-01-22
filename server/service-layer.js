/**
 * Service Layer Entry Point
 * Initializes and manages all application services
 */

const { ServiceManager, DatabaseService, WebSocketService } = require('./services');
const Logger = require('./utils/logger');

const logger = new Logger('service-layer');

class ServiceLayer {
  constructor(options = {}) {
    this.options = {
      enableDatabase: options.enableDatabase !== false,
      enableWebSocket: options.enableWebSocket !== false,
      enableMetrics: options.enableMetrics !== false,
      enableHealthCheck: options.enableHealthCheck !== false,
      gracefulShutdownTimeout: options.gracefulShutdownTimeout || 10000
    };
    
    this.serviceManager = new ServiceManager({
      enableMetrics: this.options.enableMetrics,
      enableHealthCheck: this.options.enableHealthCheck,
      gracefulShutdownTimeout: this.options.gracefulShutdownTimeout
    });
    
    this.services = {};
    this.state = 'stopped';
  }

  /**
   * Initialize all services
   */
  async initialize() {
    logger.info('Initializing service layer');
    
    try {
      // Register services
      await this.registerServices();
      
      // Set up service manager event listeners
      this.setupServiceManagerListeners();
      
      logger.info('Service layer initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize service layer', { error: error.message });
      throw error;
    }
  }

  /**
   * Register all services
   */
  async registerServices() {
    // Database Service
    if (this.options.enableDatabase) {
      const databaseService = new DatabaseService({
        enableMetrics: this.options.enableMetrics,
        enableHealthCheck: this.options.enableHealthCheck
      });
      
      this.serviceManager.registerService(databaseService);
      this.services.database = databaseService;
    }
    
    // WebSocket Service
    if (this.options.enableWebSocket) {
      const webSocketService = new WebSocketService({
        enableMetrics: this.options.enableMetrics,
        enableHealthCheck: this.options.enableHealthCheck
      });
      
      // WebSocket service depends on database service
      const dependencies = this.options.enableDatabase ? ['database-service'] : [];
      this.serviceManager.registerService(webSocketService, dependencies);
      this.services.websocket = webSocketService;
    }
  }

  /**
   * Set up service manager event listeners
   */
  setupServiceManagerListeners() {
    this.serviceManager.on('serviceStarted', ({ serviceName }) => {
      logger.info(`Service started: ${serviceName}`);
    
    this.serviceManager.on('serviceStopped', ({ serviceName }) => {
      logger.info(`Service stopped: ${serviceName}`);
    
    this.serviceManager.on('serviceError', ({ serviceName, error }) => {
      logger.error(`Service error: ${serviceName}`, { error: error.message });
    
    this.serviceManager.on('allServicesStarted', () => {
      this.state = 'running';
      logger.info('All services started successfully');
    
    this.serviceManager.on('allServicesStopped', () => {
      this.state = 'stopped';
      logger.info('All services stopped');
    
    this.serviceManager.on('error', (error) => {
      logger.error('Service manager error', { error: error.message });
    
    this.serviceManager.on('healthCheck', (healthChecks) => {
      this.emit('healthCheck', healthChecks);
    
    this.serviceManager.on('metrics', (metrics) => {
      this.emit('metrics', metrics);
  }

  /**
   * Start all services
   */
  async start() {
    if (this.state === 'starting' || this.state === 'running') {
      return;
    }
    
    this.state = 'starting';
    
    try {
      await this.serviceManager.startAll();
      
      logger.info('Service layer started successfully');
      
    } catch (error) {
      this.state = 'error';
      logger.error('Failed to start service layer', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop all services
   */
  async stop() {
    if (this.state === 'stopping' || this.state === 'stopped') {
      return;
    }
    
    this.state = 'stopping';
    
    try {
      await this.serviceManager.stopAll();
      
      logger.info('Service layer stopped successfully');
      
    } catch (error) {
      this.state = 'error';
      logger.error('Failed to stop service layer', { error: error.message });
      throw error;
    }
  }

  /**
   * Restart all services
   */
  async restart() {
    await this.stop();
    await this.start();
  }

  /**
   * Get service by name
   */
  getService(serviceName) {
    return this.services[serviceName] || this.serviceManager.getService(serviceName);
  }

  /**
   * Get database service
   */
  getDatabaseService() {
    return this.services.database;
  }

  /**
   * Get WebSocket service
   */
  getWebSocketService() {
    return this.services.websocket;
  }

  /**
   * Get all services
   */
  getAllServices() {
    return this.serviceManager.getAllServices();
  }

  /**
   * Get service layer status
   */
  getStatus() {
    return {
      state: this.state,
      services: this.getAllServices(),
      metrics: this.serviceManager.getMetrics()
    };
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    return this.serviceManager.getHealthStatus();
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return this.serviceManager.getMetrics();
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.serviceManager.resetMetrics();
  }

  /**
   * Get service layer configuration
   */
  getConfig() {
    return {
      ...this.options,
      registeredServices: Object.keys(this.services),
      totalServices: this.serviceManager.metrics.totalServices
    };
  }

  /**
   * Update service configuration
   */
  updateConfig(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    logger.info('Service layer configuration updated', { options: this.options });
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    return this.serviceManager.performHealthCheck();
  }

  /**
   * Get service dependencies
   */
  getDependencies() {
    const dependencies = {};
    
    for (const [serviceName, serviceInfo] of Object.entries(this.getAllServices())) {
      dependencies[serviceName] = serviceInfo.dependencies || [];
    }
    
    return dependencies;
  }

  /**
   * Get service performance metrics
   */
  async getPerformanceMetrics() {
    const metrics = {
      serviceLayer: this.getMetrics(),
      services: {}
    };
    
    for (const [serviceName, service] of Object.entries(this.services)) {
      metrics.services[serviceName] = service.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Get service error summary
   */
  getErrorSummary() {
    const errors = [];
    
    for (const [serviceName, service] of Object.entries(this.services)) {
      const serviceErrors = service.metrics.errors || [];
      
      serviceErrors.forEach(error => {
        errors.push({
          service: serviceName,
          timestamp: error.timestamp,
          error: error.error,
          context: error.context
        });
    }
    
    // Sort by timestamp (most recent first)
    errors.sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      totalErrors: errors.length,
      recentErrors: errors.slice(0, 50), // Last 50 errors
      errorsByService: errors.reduce((acc, error) => {
        acc[error.service] = (acc[error.service] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Create service instance
   */
  static async create(options = {}) {
    const serviceLayer = new ServiceLayer(options);
    await serviceLayer.initialize();
    return serviceLayer;
  }
}

module.exports = ServiceLayer;
