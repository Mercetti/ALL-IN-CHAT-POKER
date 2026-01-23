/**
 * Event Driven Architecture - Simplified Version
 * Basic event-driven architecture functionality
 */

const logger = require('../utils/logger');

class EventDrivenArchitecture {
  constructor() {
    this.aggregates = new Map();
    this.eventStore = null;
    this.isInitialized = false;
    this.stats = { events: 0, aggregates: 0, projections: 0 };
  }

  /**
   * Initialize event-driven architecture
   */
  async initialize() {
    logger.info('Event Driven Architecture initialized');
    this.isInitialized = true;
    return true;
  }

  /**
   * Create aggregate
   */
  createAggregate(aggregateId, aggregateType, initialState = {}) {
    try {
      const aggregate = {
        id: aggregateId,
        type: aggregateType,
        state: initialState,
        version: 0,
        events: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.aggregates.set(aggregateId, aggregate);
      this.stats.aggregates++;

      logger.info('Aggregate created', { aggregateId, aggregateType });

      return {
        success: true,
        aggregate
      };

    } catch (error) {
      logger.error('Failed to create aggregate', { aggregateId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply event to aggregate
   */
  async applyEvent(aggregateId, eventType, eventData) {
    try {
      const aggregate = this.aggregates.get(aggregateId);
      if (!aggregate) {
        return { success: false, message: 'Aggregate not found' };
      }

      const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        aggregateId,
        type: eventType,
        data: eventData,
        timestamp: new Date().toISOString(),
        version: aggregate.version + 1
      };

      // Apply event to aggregate state (simplified)
      aggregate.state = this.applyEventToState(aggregate.state, event);
      aggregate.events.push(event);
      aggregate.version++;
      aggregate.updatedAt = new Date();
      this.stats.events++;

      logger.debug('Event applied to aggregate', { aggregateId, eventType });

      return {
        success: true,
        event,
        aggregate
      };

    } catch (error) {
      logger.error('Failed to apply event to aggregate', { aggregateId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply event to state (simplified)
   */
  applyEventToState(state, event) {
    switch (event.type) {
      case 'UserCreated':
        return {
          ...state,
          id: event.data.id,
          name: event.data.name,
          email: event.data.email,
          createdAt: event.timestamp
        };
      
      case 'UserUpdated':
        return {
          ...state,
          ...event.data,
          updatedAt: event.timestamp
        };
      
      case 'UserDeleted':
        return {
          ...state,
          deleted: true,
          deletedAt: event.timestamp
        };
      
      default:
        return {
          ...state,
          lastEvent: event.type,
          lastEventAt: event.timestamp
        };
    }
  }

  /**
   * Get aggregate
   */
  getAggregate(aggregateId) {
    return this.aggregates.get(aggregateId);
  }

  /**
   * Get aggregate state
   */
  getAggregateState(aggregateId) {
    const aggregate = this.aggregates.get(aggregateId);
    return aggregate ? aggregate.state : null;
  }

  /**
   * Get aggregate events
   */
  getAggregateEvents(aggregateId) {
    const aggregate = this.aggregates.get(aggregateId);
    return aggregate ? aggregate.events : [];
  }

  /**
   * Create projection
   */
  createProjection(projectionName, eventTypes, projectionFunction) {
    try {
      const projection = {
        name: projectionName,
        eventTypes: eventTypes,
        function: projectionFunction,
        state: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store projection (simplified - in real implementation would use a separate store)
      if (!this.projections) {
        this.projections = new Map();
      }
      this.projections.set(projectionName, projection);
      this.stats.projections++;

      logger.info('Projection created', { projectionName, eventTypes });

      return {
        success: true,
        projection
      };

    } catch (error) {
      logger.error('Failed to create projection', { projectionName, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update projection
   */
  async updateProjection(projectionName, event) {
    try {
      if (!this.projections || !this.projections.has(projectionName)) {
        return { success: false, message: 'Projection not found' };
      }

      const projection = this.projections.get(projectionName);
      
      if (projection.eventTypes.includes(event.type)) {
        projection.state = await projection.function(projection.state, event);
        projection.updatedAt = new Date();
      }

      return {
        success: true,
        projection
      };

    } catch (error) {
      logger.error('Failed to update projection', { projectionName, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get projection state
   */
  getProjectionState(projectionName) {
    if (!this.projections || !this.projections.has(projectionName)) {
      return null;
    }

    return this.projections.get(projectionName).state;
  }

  /**
   * Replay events for aggregate
   */
  async replayEvents(aggregateId) {
    try {
      const aggregate = this.aggregates.get(aggregateId);
      if (!aggregate) {
        return { success: false, message: 'Aggregate not found' };
      }

      // Reset state to initial
      aggregate.state = {};
      aggregate.version = 0;

      // Replay all events
      for (const event of aggregate.events) {
        aggregate.state = this.applyEventToState(aggregate.state, event);
        aggregate.version = event.version;
      }

      logger.info('Events replayed for aggregate', { aggregateId, eventCount: aggregate.events.length });

      return {
        success: true,
        aggregate,
        eventsReplayed: aggregate.events.length
      };

    } catch (error) {
      logger.error('Failed to replay events', { aggregateId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get architecture status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      stats: this.stats,
      aggregates: this.aggregates.size,
      projections: this.projections ? this.projections.size : 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get all aggregates
   */
  getAllAggregates() {
    return Array.from(this.aggregates.values());
  }

  /**
   * Get all projections
   */
  getAllProjections() {
    if (!this.projections) return [];
    
    return Array.from(this.projections.values()).map(projection => ({
      name: projection.name,
      eventTypes: projection.eventTypes,
      createdAt: projection.createdAt,
      updatedAt: projection.updatedAt
    }));
  }
}

// Create singleton instance
const eventDrivenArchitecture = new EventDrivenArchitecture();

module.exports = eventDrivenArchitecture;
