/**
 * Event-Driven Architecture
 * Main entry point for the event-driven system
 */

const EventBus = require('./event-bus');
const EventStore = require('./event-store');
const EventAggregator = require('./event-aggregator');
const Logger = require('../utils/logger');

const logger = new Logger('event-driven-architecture');

class EventDrivenArchitecture {
  constructor(options = {}) {
    this.options = {
      enableEventBus: options.enableEventBus !== false,
      enableEventStore: options.enableEventStore !== false,
      enableEventAggregator: options.enableEventAggregator !== false,
      enablePersistence: options.enablePersistence !== false,
      enableMetrics: options.enableMetrics !== false,
      enableHealthCheck: options.enableHealthCheck !== false,
      healthCheckInterval: options.healthCheckInterval || 30000,
      gracefulShutdownTimeout: options.gracefulShutdownTimeout || 10000
    };
    
    this.eventBus = null;
    this.eventStore = null;
    this.eventAggregator = null;
    this.state = 'stopped';
    this.metrics = {
      startTime: null,
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      averageProcessingTime: 0,
      lastActivity: null
    };
    
    this.initialize();
  }

  /**
   * Initialize the event-driven architecture
   */
  initialize() {
    logger.info('Initializing event-driven architecture');
    
    try {
      // Initialize components
      if (this.options.enableEventBus) {
        this.eventBus = new EventBus({
          enableMetrics: this.options.enableMetrics,
          enablePersistence: this.options.enablePersistence,
          enableReplay: true
        });
      }
      
      if (this.options.enableEventStore) {
        this.eventStore = new EventStore({
          enablePersistence: this.options.enablePersistence,
          enableIndexing: true,
          enableSnapshots: true
        });
      }
      
      if (this.options.enableEventAggregator) {
        this.eventAggregator = new EventAggregator({
          enableRealTime: true,
          enableBatching: true,
          enablePersistence: this.options.enablePersistence,
          enableMetrics: this.options.enableMetrics
        });
      }
      
      // Set up component integration
      this.setupComponentIntegration();
      
      // Set up health monitoring
      if (this.options.enableHealthCheck) {
        this.setupHealthMonitoring();
      }
      
      logger.info('Event-driven architecture initialized', {
        eventBus: !!this.eventBus,
        eventStore: !!this.eventStore,
        eventAggregator: !!this.eventAggregator
      });
      
    } catch (error) {
      logger.error('Failed to initialize event-driven architecture', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup integration between components
   */
  setupComponentIntegration() {
    if (!this.eventBus) return;
    
    // Store events in event store
    if (this.eventStore) {
      this.eventBus.on('event', async (event) => {
        try {
          await this.eventStore.storeEvent(event);
        } catch (error) {
          logger.error('Failed to store event', { eventId: event.id, error: error.message });
        }
      });
    }
    
    // Aggregate events
    if (this.eventAggregator) {
      this.eventBus.on('event', async (event) => {
        try {
          await this.eventAggregator.processEvent(event);
        } catch (error) {
          logger.error('Failed to aggregate event', { eventId: event.id, error: error.message });
        }
      });
    }
    
    // Handle metrics
    if (this.options.enableMetrics) {
      this.eventBus.on('metrics', (metrics) => {
        this.updateMetrics(metrics);
      });
      
      if (this.eventAggregator) {
        this.eventAggregator.on('metrics', (metrics) => {
          this.updateMetrics(metrics);
        });
      }
    }
    
    // Handle errors
    this.eventBus.on('error', (error) => {
      this.metrics.failedEvents++;
      this.emit('error', error);
    });
    
    if (this.eventAggregator) {
      this.eventAggregator.on('processingError', ({ event, error }) => {
        this.metrics.failedEvents++;
        this.emit('error', { event, error });
      });
    }
  }

  /**
   * Setup health monitoring
   */
  setupHealthMonitoring() {
    setInterval(async () => {
      const health = await this.getHealthStatus();
      this.emit('healthCheck', health);
    }, this.options.healthCheckInterval);
  }

  /**
   * Start the event-driven architecture
   */
  async start() {
    if (this.state === 'starting' || this.state === 'running') {
      return;
    }
    
    this.state = 'starting';
    this.metrics.startTime = Date.now();
    
    try {
      logger.info('Starting event-driven architecture');
      
      // Start components (they don't have explicit start methods, but we can initialize them)
      
      this.state = 'running';
      this.emit('started');
      
      logger.info('Event-driven architecture started successfully');
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      logger.error('Failed to start event-driven architecture', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the event-driven architecture
   */
  async stop() {
    if (this.state === 'stopping' || this.state === 'stopped') {
      return;
    }
    
    this.state = 'stopping';
    
    try {
      logger.info('Stopping event-driven architecture');
      
      // Shutdown components
      if (this.eventAggregator) {
        await this.eventAggregator.shutdown();
      }
      
      if (this.eventStore) {
        await this.eventStore.shutdown();
      }
      
      if (this.eventBus) {
        await this.eventBus.shutdown();
      }
      
      this.state = 'stopped';
      this.emit('stopped');
      
      logger.info('Event-driven architecture stopped');
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      logger.error('Failed to stop event-driven architecture', { error: error.message });
      throw error;
    }
  }

  /**
   * Emit an event
   */
  emit(eventName, ...args) {
    if (!this.eventBus) {
      logger.warn('Event bus not available, event not emitted', { eventName });
      return false;
    }
    
    this.metrics.totalEvents++;
    this.metrics.lastActivity = Date.now();
    
    const emitted = this.eventBus.emit(eventName, ...args);
    
    if (emitted) {
      this.metrics.processedEvents++;
    }
    
    return emitted;
  }

  /**
   * Add event listener
   */
  on(eventName, listener, options = {}) {
    if (!this.eventBus) {
      throw new Error('Event bus not available');
    }
    
    return this.eventBus.on(eventName, listener, options);
  }

  /**
   * Add one-time event listener
   */
  once(eventName, listener, options = {}) {
    if (!this.eventBus) {
      throw new Error('Event bus not available');
    }
    
    return this.eventBus.once(eventName, listener, options);
  }

  /**
   * Remove event listener
   */
  off(eventName, listener) {
    if (!this.eventBus) {
      return false;
    }
    
    return this.eventBus.removeListener(eventName, listener);
  }

  /**
   * Get event history
   */
  getEventHistory(eventName = null, limit = 100) {
    if (!this.eventBus) {
      return [];
    }
    
    return this.eventBus.getEventHistory(eventName, limit);
  }

  /**
   * Replay events
   */
  async replayEvents(options = {}) {
    if (!this.eventStore) {
      throw new Error('Event store not available');
    }
    
    return this.eventStore.replayEvents(options);
  }

  /**
   * Retrieve events from store
   */
  async retrieveEvents(options = {}) {
    if (!this.eventStore) {
      throw new Error('Event store not available');
    }
    
    return this.eventStore.retrieveEvents(options);
  }

  /**
   * Get aggregation data
   */
  getAggregation(key) {
    if (!this.eventAggregator) {
      return null;
    }
    
    return this.eventAggregator.getAggregation(key);
  }

  /**
   * Get all aggregations
   */
  getAllAggregations() {
    if (!this.eventAggregator) {
      return {};
    }
    
    return this.eventAggregator.getAllAggregations();
  }

  /**
   * Get aggregation summaries
   */
  getAggregationSummary(key) {
    if (!this.eventAggregator) {
      return null;
    }
    
    return this.eventAggregator.getAggregationSummary(key);
  }

  /**
   * Get all aggregation summaries
   */
  getAllAggregationSummaries() {
    if (!this.eventAggregator) {
      return {};
    }
    
    return this.eventAggregator.getAllAggregationSummaries();
  }

  /**
   * Add event filter
   */
  addEventFilter(name, filterFn) {
    if (!this.eventBus) {
      return false;
    }
    
    this.eventBus.addFilter(name, filterFn);
    return true;
  }

  /**
   * Remove event filter
   */
  removeEventFilter(name) {
    if (!this.eventBus) {
      return false;
    }
    
    return this.eventBus.removeFilter(name);
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(limit = 100) {
    if (!this.eventBus) {
      return [];
    }
    
    return this.eventBus.getDeadLetterQueue(limit);
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue() {
    if (!this.eventBus) {
      return false;
    }
    
    this.eventBus.clearDeadLetterQueue();
    return true;
  }

  /**
   * Update metrics
   */
  updateMetrics(componentMetrics) {
    // Merge component metrics with system metrics
    if (componentMetrics.totalEvents) {
      this.metrics.totalEvents = componentMetrics.totalEvents;
    }
    
    if (componentMetrics.averageProcessingTime) {
      this.metrics.averageProcessingTime = componentMetrics.averageProcessingTime;
    }
    
    this.emit('metrics', this.getMetrics());
  }

  /**
   * Get system metrics
   */
  getMetrics() {
    const uptime = this.metrics.startTime ? Date.now() - this.metrics.startTime : 0;
    
    const metrics = {
      ...this.metrics,
      uptime,
      state: this.state,
      components: {}
    };
    
    // Add component metrics
    if (this.eventBus) {
      metrics.components.eventBus = this.eventBus.getMetrics();
    }
    
    if (this.eventStore) {
      metrics.components.eventStore = this.eventStore.getStats();
    }
    
    if (this.eventAggregator) {
      metrics.components.eventAggregator = this.eventAggregator.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    const checks = {};
    let overallStatus = 'healthy';
    
    // Check event bus
    if (this.eventBus) {
      try {
        const eventBusHealth = await this.eventBus.healthCheck();
        checks.eventBus = eventBusHealth;
        
        if (eventBusHealth.status !== 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        checks.eventBus = {
          status: 'unhealthy',
          error: error.message
        };
        overallStatus = 'unhealthy';
      }
    }
    
    // Check event store
    if (this.eventStore) {
      try {
        const eventStoreHealth = await this.eventStore.healthCheck();
        checks.eventStore = eventStoreHealth;
        
        if (eventStoreHealth.status !== 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        checks.eventStore = {
          status: 'unhealthy',
          error: error.message
        };
        overallStatus = 'unhealthy';
      }
    }
    
    // Check event aggregator
    if (this.eventAggregator) {
      try {
        const aggregatorHealth = await this.eventAggregator.healthCheck();
        checks.eventAggregator = aggregatorHealth;
        
        if (aggregatorHealth.status !== 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        checks.eventAggregator = {
          status: 'unhealthy',
          error: error.message
        };
        overallStatus = 'unhealthy';
      }
    }
    
    return {
      status: overallStatus,
      timestamp: Date.now(),
      state: this.state,
      uptime: this.getMetrics().uptime,
      checks,
      metrics: this.getMetrics()
    };
  }

  /**
   * Get system statistics
   */
  getStatistics() {
    const stats = {
      system: {
        state: this.state,
        uptime: this.getMetrics().uptime,
        totalEvents: this.metrics.totalEvents,
        processedEvents: this.metrics.processedEvents,
        failedEvents: this.metrics.failedEvents,
        averageProcessingTime: this.metrics.averageProcessingTime,
        lastActivity: this.metrics.lastActivity
      }
    };
    
    // Add component statistics
    if (this.eventBus) {
      stats.eventBus = this.eventBus.getEventStats();
    }
    
    if (this.eventStore) {
      stats.eventStore = this.eventStore.getStats();
    }
    
    if (this.eventAggregator) {
      stats.eventAggregator = this.eventAggregator.getAllAggregationSummaries();
    }
    
    return stats;
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      startTime: Date.now(),
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      averageProcessingTime: 0,
      lastActivity: null
    };
    
    if (this.eventBus) {
      this.eventBus.resetMetrics();
    }
    
    if (this.eventAggregator) {
      this.eventAggregator.resetAllAggregations();
    }
    
    logger.info('Event-driven architecture metrics reset');
  }

  /**
   * Get configuration
   */
  getConfiguration() {
    return {
      ...this.options,
      components: {
        eventBus: !!this.eventBus,
        eventStore: !!this.eventStore,
        eventAggregator: !!this.eventAggregator
      },
      state: this.state
    };
  }

  /**
   * Create event-driven architecture instance
   */
  static async create(options = {}) {
    const eda = new EventDrivenArchitecture(options);
    await eda.start();
    return eda;
  }
}

module.exports = EventDrivenArchitecture;
