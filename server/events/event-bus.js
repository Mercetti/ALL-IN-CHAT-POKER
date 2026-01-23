/**
 * Event Bus - Simplified Version
 * Basic event bus functionality
 */

const logger = require('../utils/logger');

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.isInitialized = false;
    this.stats = { events: 0, listeners: 0, errors: 0 };
  }

  /**
   * Initialize event bus
   */
  async initialize() {
    logger.info('Event Bus initialized');
    this.isInitialized = true;
    return true;
  }

  /**
   * Subscribe to event
   */
  subscribe(eventName, callback, options = {}) {
    try {
      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, []);
      }

      const listener = {
        id: `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        callback,
        options: {
          once: options.once || false,
          priority: options.priority || 0,
          ...options
        },
        subscribedAt: new Date(),
        executions: 0
      };

      this.listeners.get(eventName).push(listener);
      this.stats.listeners++;

      // Sort by priority (higher priority first)
      this.listeners.get(eventName).sort((a, b) => b.options.priority - a.options.priority);

      logger.debug('Event listener subscribed', { eventName, listenerId: listener.id });

      return {
        success: true,
        listenerId: listener.id
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to subscribe to event', { eventName, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unsubscribe from event
   */
  unsubscribe(eventName, listenerId) {
    try {
      const eventListeners = this.listeners.get(eventName);
      if (!eventListeners) {
        return { success: false, message: 'Event not found' };
      }

      const initialLength = eventListeners.length;
      const filtered = eventListeners.filter(listener => listener.id !== listenerId);
      
      if (filtered.length === initialLength) {
        return { success: false, message: 'Listener not found' };
      }

      this.listeners.set(eventName, filtered);
      this.stats.listeners--;

      logger.debug('Event listener unsubscribed', { eventName, listenerId });

      return {
        success: true,
        message: 'Listener unsubscribed successfully'
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to unsubscribe from event', { eventName, listenerId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Publish event
   */
  async publish(eventName, data = {}) {
    try {
      this.stats.events++;

      const event = {
        name: eventName,
        data,
        timestamp: new Date().toISOString(),
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const listeners = this.listeners.get(eventName) || [];
      const results = [];

      for (const listener of listeners) {
        try {
          listener.executions++;
          const result = await listener.callback(event);

          results.push({
            listenerId: listener.id,
            success: true,
            result
          });

          // Remove once listeners
          if (listener.options.once) {
            this.unsubscribe(eventName, listener.id);
          }

        } catch (error) {
          this.stats.errors++;
          logger.error('Event listener execution failed', { 
            eventName, 
            listenerId: listener.id, 
            error: error.message 
          });

          results.push({
            listenerId: listener.id,
            success: false,
            error: error.message
          });
        }
      }

      logger.debug('Event published', { 
        eventName, 
        listeners: listeners.length, 
        successful: results.filter(r => r.success).length 
      });

      return {
        success: true,
        event,
        results,
        listeners: listeners.length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to publish event', { eventName, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Subscribe once (convenience method)
   */
  once(eventName, callback, options = {}) {
    return this.subscribe(eventName, callback, { ...options, once: true });
  }

  /**
   * Get event listeners
   */
  getListeners(eventName) {
    const listeners = this.listeners.get(eventName) || [];
    return listeners.map(listener => ({
      id: listener.id,
      options: listener.options,
      subscribedAt: listener.subscribedAt,
      executions: listener.executions
    }));
  }

  /**
   * Get all events
   */
  getAllEvents() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Remove all listeners for event
   */
  removeAllListeners(eventName) {
    const listeners = this.listeners.get(eventName) || [];
    const count = listeners.length;
    
    this.listeners.delete(eventName);
    this.stats.listeners -= count;

    logger.info('All listeners removed for event', { eventName, count });

    return {
      success: true,
      removed: count
    };
  }

  /**
   * Clear all events
   */
  clear() {
    const totalListeners = this.stats.listeners;
    this.listeners.clear();
    this.stats.listeners = 0;

    logger.info('All event listeners cleared', { totalListeners });

    return {
      success: true,
      cleared: totalListeners
    };
  }

  /**
   * Get event bus status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      stats: this.stats,
      events: this.listeners.size,
      totalListeners: Array.from(this.listeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get event statistics
   */
  getEventStats(eventName) {
    const listeners = this.listeners.get(eventName) || [];
    
    return {
      eventName,
      listenerCount: listeners.length,
      totalExecutions: listeners.reduce((sum, listener) => sum + listener.executions, 0),
      averageExecutions: listeners.length > 0 ? 
        listeners.reduce((sum, listener) => sum + listener.executions, 0) / listeners.length : 0
    };
  }
}

// Create singleton instance
const eventBus = new EventBus();

module.exports = eventBus;
