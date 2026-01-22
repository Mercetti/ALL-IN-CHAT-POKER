/**
 * Event Bus
 * Central event system for the application
 */

const EventEmitter = require('events');
const Logger = require('../utils/logger');

class EventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxListeners: options.maxListeners || 100,
      enableMetrics: options.enableMetrics !== false,
      enablePersistence: options.enablePersistence !== false,
      enableReplay: options.enableReplay !== false,
      persistencePath: options.persistencePath || './events.json',
      maxHistorySize: options.maxHistorySize || 10000,
      enableFiltering: options.enableFiltering !== false,
      enableThrottling: options.enableThrottling !== false,
      throttleLimit: options.throttleLimit || 1000, // events per second
      enableDeadLetterQueue: options.enableDeadLetterQueue !== false
    };
    
    this.logger = new Logger('event-bus');
    
    // Set maximum listeners
    this.setMaxListeners(this.options.maxListeners);
    
    // Event history for replay
    this.eventHistory = [];
    
    // Metrics
    this.metrics = {
      totalEvents: 0,
      eventsPerSecond: 0,
      averageProcessingTime: 0,
      failedEvents: 0,
      eventTypes: {},
      listenerCounts: {},
      lastEventTime: null,
      startTime: Date.now()
    };
    
    // Dead letter queue for failed events
    this.deadLetterQueue = [];
    
    // Throttling
    this.throttleCount = 0;
    this.throttleResetTime = Date.now() + 1000;
    
    // Event filters
    this.filters = new Map();
    
    // Initialize
    this.initialize();
  }

  /**
   * Initialize the event bus
   */
  initialize() {
    this.logger.info('Initializing event bus');
    
    if (this.options.enablePersistence) {
      this.loadPersistedEvents();
    }
    
    if (this.options.enableMetrics) {
      this.setupMetrics();
    }
    
    // Set up error handling
    this.on('error', (error) => {
      this.logger.error('Event bus error', { error: error.message });
  }

  /**
   * Emit an event with enhanced features
   */
  emit(eventName, ...args) {
    const event = this.createEvent(eventName, args);
    
    try {
      // Apply filters
      if (!this.shouldEmitEvent(event)) {
        return false;
      }
      
      // Check throttling
      if (this.options.enableThrottling && this.isThrottled()) {
        this.addToDeadLetterQueue(event, 'throttled');
        return false;
      }
      
      const startTime = Date.now();
      
      // Emit the event
      const emitted = super.emit(eventName, event, ...args);
      
      const processingTime = Date.now() - startTime;
      
      // Update metrics
      this.updateMetrics(event, processingTime, emitted);
      
      // Add to history
      if (this.options.enableReplay) {
        this.addToHistory(event);
      }
      
      // Persist if enabled
      if (this.options.enablePersistence) {
        this.persistEvent(event);
      }
      
      return emitted;
      
    } catch (error) {
      this.handleEventError(event, error);
      return false;
    }
  }

  /**
   * Create event object
   */
  createEvent(eventName, args) {
    return {
      id: this.generateEventId(),
      name: eventName,
      args,
      timestamp: Date.now(),
      source: this.getEventSource(),
      metadata: {
        version: '1.0',
        priority: this.getEventPriority(eventName),
        category: this.getEventCategory(eventName)
      }
    };
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event source
   */
  getEventSource() {
    const stack = new Error().stack;
    const caller = stack.split('\n')[3]; // Get the calling function
    return caller ? caller.trim() : 'unknown';
  }

  /**
   * Get event priority
   */
  getEventPriority(eventName) {
    const highPriorityEvents = ['error', 'critical', 'emergency', 'shutdown'];
    const mediumPriorityEvents = ['warning', 'alert', 'game-event'];
    
    if (highPriorityEvents.includes(eventName)) return 'high';
    if (mediumPriorityEvents.includes(eventName)) return 'medium';
    return 'low';
  }

  /**
   * Get event category
   */
  getEventCategory(eventName) {
    if (eventName.startsWith('game.')) return 'game';
    if (eventName.startsWith('user.')) return 'user';
    if (eventName.startsWith('system.')) return 'system';
    if (eventName.startsWith('websocket.')) return 'websocket';
    if (eventName.startsWith('database.')) return 'database';
    return 'general';
  }

  /**
   * Check if event should be emitted based on filters
   */
  shouldEmitEvent(event) {
    if (!this.options.enableFiltering) {
      return true;
    }
    
    for (const [filterName, filter] of this.filters) {
      if (!filter(event)) {
        this.logger.debug('Event filtered out', { 
          eventId: event.id, 
          eventName: event.name, 
          filterName 
        });
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if event is throttled
   */
  isThrottled() {
    const now = Date.now();
    
    // Reset throttle count every second
    if (now > this.throttleResetTime) {
      this.throttleCount = 0;
      this.throttleResetTime = now + 1000;
    }
    
    this.throttleCount++;
    
    return this.throttleCount > this.options.throttleLimit;
  }

  /**
   * Add event to dead letter queue
   */
  addToDeadLetterQueue(event, reason) {
    this.deadLetterQueue.push({
      ...event,
      deadLetterReason: reason,
      queuedAt: Date.now()
    });
    
    // Keep only last 1000 dead letters
    if (this.deadLetterQueue.length > 1000) {
      this.deadLetterQueue = this.deadLetterQueue.slice(-1000);
    }
    
    this.logger.warn('Event added to dead letter queue', {
      eventId: event.id,
      eventName: event.name,
      reason
    });
  }

  /**
   * Handle event error
   */
  handleEventError(event, error) {
    this.metrics.failedEvents++;
    
    this.logger.error('Event processing error', {
      eventId: event.id,
      eventName: event.name,
      error: error.message
    });
    
    if (this.options.enableDeadLetterQueue) {
      this.addToDeadLetterQueue(event, error.message);
    }
    
    // Emit error event
    super.emit('event-error', {
      event,
      error,
      timestamp: Date.now()
    });
  }

  /**
   * Add event to history
   */
  addToHistory(event) {
    this.eventHistory.push(event);
    
    // Keep only recent events
    if (this.eventHistory.length > this.options.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.options.maxHistorySize);
    }
  }

  /**
   * Persist event
   */
  persistEvent(event) {
    // This would typically write to a database or file
    // For now, we'll just log it
    this.logger.debug('Event persisted', { eventId: event.id, eventName: event.name });
  }

  /**
   * Load persisted events
   */
  loadPersistedEvents() {
    // This would typically load from a database or file
    // For now, we'll just log it
    this.logger.debug('Loading persisted events');
  }

  /**
   * Update metrics
   */
  updateMetrics(event, processingTime, emitted) {
    this.metrics.totalEvents++;
    this.metrics.lastEventTime = Date.now();
    
    // Update event types
    this.metrics.eventTypes[event.name] = (this.metrics.eventTypes[event.name] || 0) + 1;
    
    // Update average processing time
    if (this.metrics.totalEvents === 1) {
      this.metrics.averageProcessingTime = processingTime;
    } else {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * (this.metrics.totalEvents - 1) + processingTime) / 
        this.metrics.totalEvents;
    }
    
    // Update events per second
    this.updateEventsPerSecond();
    
    // Emit metrics event
    if (this.options.enableMetrics) {
      super.emit('metrics', this.getMetrics());
    }
  }

  /**
   * Update events per second
   */
  updateEventsPerSecond() {
    const now = Date.now();
    const timeWindow = 5000; // 5 seconds
    
    const recentEvents = this.eventHistory.filter(
      event => now - event.timestamp < timeWindow
    );
    
    this.metrics.eventsPerSecond = recentEvents.length / (timeWindow / 1000);
  }

  /**
   * Setup metrics collection
   */
  setupMetrics() {
    setInterval(() => {
      this.updateEventsPerSecond();
      super.emit('metrics', this.getMetrics());
    }, 1000); // Every second
  }

  /**
   * Add event listener with metadata
   */
  on(eventName, listener, options = {}) {
    const wrappedListener = this.wrapListener(listener, options);
    
    super.on(eventName, wrappedListener);
    
    // Update listener count metrics
    this.metrics.listenerCounts[eventName] = (this.metrics.listenerCounts[eventName] || 0) + 1;
    
    return wrappedListener;
  }

  /**
   * Add one-time event listener
   */
  once(eventName, listener, options = {}) {
    const wrappedListener = this.wrapListener(listener, options);
    
    super.once(eventName, wrappedListener);
    
    return wrappedListener;
  }

  /**
   * Wrap listener with additional functionality
   */
  wrapListener(listener, options) {
    return async (event, ...args) => {
      const startTime = Date.now();
      
      try {
        // Check if listener should handle this event
        if (options.filter && !options.filter(event)) {
          return;
        }
        
        // Execute listener
        await listener(event, ...args);
        
        const processingTime = Date.now() - startTime;
        
        // Log performance if enabled
        if (options.logPerformance) {
          this.logger.debug('Listener performance', {
            eventName: event.name,
            listenerName: listener.name || 'anonymous',
            processingTime
          });
        }
        
      } catch (error) {
        this.logger.error('Listener error', {
          eventName: event.name,
          listenerName: listener.name || 'anonymous',
          error: error.message
        });
        
        // Emit listener error event
        super.emit('listener-error', {
          event,
          listener: listener.name || 'anonymous',
          error,
          timestamp: Date.now()
        });
      }
    };
  }

  /**
   * Add event filter
   */
  addFilter(name, filterFn) {
    this.filters.set(name, filterFn);
    this.logger.info('Event filter added', { name });
  }

  /**
   * Remove event filter
   */
  removeFilter(name) {
    const removed = this.filters.delete(name);
    if (removed) {
      this.logger.info('Event filter removed', { name });
    }
    return removed;
  }

  /**
   * Replay events from history
   */
  replayEvents(eventName = null, startTime = null, endTime = null) {
    let events = this.eventHistory;
    
    // Filter by event name
    if (eventName) {
      events = events.filter(event => event.name === eventName);
    }
    
    // Filter by time range
    if (startTime) {
      events = events.filter(event => event.timestamp >= startTime);
    }
    
    if (endTime) {
      events = events.filter(event => event.timestamp <= endTime);
    }
    
    this.logger.info('Replaying events', {
      totalEvents: events.length,
      eventName,
      startTime,
      endTime
    });
    
    // Replay events
    events.forEach(event => {
      super.emit(event.name, event, ...event.args);
    
    return events.length;
  }

  /**
   * Get event history
   */
  getEventHistory(eventName = null, limit = 100) {
    let events = this.eventHistory;
    
    if (eventName) {
      events = events.filter(event => event.name === eventName);
    }
    
    return events.slice(-limit);
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(limit = 100) {
    return this.deadLetterQueue.slice(-limit);
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue() {
    this.deadLetterQueue = [];
    this.logger.info('Dead letter queue cleared');
  }

  /**
   * Get metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    
    return {
      ...this.metrics,
      uptime,
      eventsPerSecond: this.metrics.eventsPerSecond,
      averageProcessingTime: Math.round(this.metrics.averageProcessingTime),
      historySize: this.eventHistory.length,
      deadLetterQueueSize: this.deadLetterQueue.length,
      filterCount: this.filters.size,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalEvents: 0,
      eventsPerSecond: 0,
      averageProcessingTime: 0,
      failedEvents: 0,
      eventTypes: {},
      listenerCounts: {},
      lastEventTime: null,
      startTime: Date.now()
    };
    
    this.logger.info('Event bus metrics reset');
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
    this.logger.info('Event history cleared');
  }

  /**
   * Get event statistics
   */
  getEventStats() {
    const stats = {
      totalEvents: this.eventHistory.length,
      eventTypes: {},
      categories: {},
      priorities: {},
      hourlyDistribution: {},
      topEmitters: {}
    };
    
    this.eventHistory.forEach(event => {
      // Event types
      stats.eventTypes[event.name] = (stats.eventTypes[event.name] || 0) + 1;
      
      // Categories
      const category = event.metadata.category;
      stats.categories[category] = (stats.categories[category] || 0) + 1;
      
      // Priorities
      const priority = event.metadata.priority;
      stats.priorities[priority] = (stats.priorities[priority] || 0) + 1;
      
      // Hourly distribution
      const hour = new Date(event.timestamp).getHours();
      stats.hourlyDistribution[hour] = (stats.hourlyDistribution[hour] || 0) + 1;
      
      // Top emitters
      const source = event.source;
      stats.topEmitters[source] = (stats.topEmitters[source] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const checks = {
      eventBus: {
        status: 'healthy',
        message: 'Event bus is operational'
      },
      metrics: {
        status: this.metrics.eventsPerSecond < this.options.throttleLimit ? 'healthy' : 'degraded',
        message: `${this.metrics.eventsPerSecond.toFixed(2)} events per second`
      },
      memory: {
        status: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'degraded',
        message: `Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      deadLetterQueue: {
        status: this.deadLetterQueue.length < 100 ? 'healthy' : 'degraded',
        message: `${this.deadLetterQueue.length} events in dead letter queue`
      }
    };
    
    const overallStatus = Object.values(checks).every(check => check.status === 'healthy') 
      ? 'healthy' 
      : Object.values(checks).some(check => check.status === 'unhealthy')
      ? 'unhealthy'
      : 'degraded';
    
    return {
      status: overallStatus,
      timestamp: Date.now(),
      checks,
      metrics: this.getMetrics()
    };
  }

  /**
   * Shutdown event bus
   */
  async shutdown() {
    this.logger.info('Shutting down event bus');
    
    // Remove all listeners
    this.removeAllListeners();
    
    // Clear collections
    this.eventHistory = [];
    this.deadLetterQueue = [];
    this.filters.clear();
    
    this.logger.info('Event bus shutdown complete');
  }
}

module.exports = EventBus;
