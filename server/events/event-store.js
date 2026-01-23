/**
 * Event Store - Simplified Version
 * Basic event store functionality
 */

const logger = require('../utils/logger');

class EventStore {
  constructor(options = {}) {
    this.options = options;
    this.events = new Map();
    this.snapshots = new Map();
    this.isInitialized = false;
    this.stats = { stored: 0, retrieved: 0, snapshots: 0 };
  }

  /**
   * Initialize event store
   */
  async initialize() {
    logger.info('Event Store initialized');
    this.isInitialized = true;
    return true;
  }

  /**
   * Store event
   */
  async storeEvent(event) {
    try {
      const eventId = `${event.aggregateId}_${event.version}`;
      
      const storedEvent = {
        ...event,
        storedAt: new Date().toISOString(),
        id: eventId
      };

      this.events.set(eventId, storedEvent);
      this.stats.stored++;

      logger.debug('Event stored', { eventId, eventType: event.type });

      return {
        success: true,
        eventId: storedEvent.id
      };

    } catch (error) {
      logger.error('Failed to store event', { error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get events for aggregate
   */
  async getEvents(aggregateId, fromVersion = 0, toVersion = null) {
    try {
      const events = [];
      
      // Find all events for this aggregate
      for (const [eventId, event] of this.events.entries()) {
        if (event.aggregateId === aggregateId) {
          if (event.version > fromVersion && (!toVersion || event.version <= toVersion)) {
            events.push(event);
          }
        }
      }

      // Sort by version
      events.sort((a, b) => a.version - b.version);
      this.stats.retrieved += events.length;

      logger.debug('Events retrieved', { aggregateId, count: events.length });

      return {
        success: true,
        events,
        count: events.length
      };

    } catch (error) {
      logger.error('Failed to get events', { aggregateId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId) {
    try {
      const event = this.events.get(eventId);
      
      if (event) {
        this.stats.retrieved++;
      }

      return {
        success: !!event,
        event: event || null
      };

    } catch (error) {
      logger.error('Failed to get event', { eventId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create snapshot
   */
  async createSnapshot(aggregateId, state, version) {
    try {
      const snapshotId = `snapshot_${aggregateId}_${version}`;
      
      const snapshot = {
        id: snapshotId,
        aggregateId,
        state,
        version,
        createdAt: new Date().toISOString()
      };

      this.snapshots.set(snapshotId, snapshot);
      this.stats.snapshots++;

      logger.debug('Snapshot created', { snapshotId, version });

      return {
        success: true,
        snapshotId: snapshot.id
      };

    } catch (error) {
      logger.error('Failed to create snapshot', { aggregateId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot(aggregateId) {
    try {
      let latestSnapshot = null;
      let latestVersion = -1;

      for (const [snapshotId, snapshot] of this.snapshots.entries()) {
        if (snapshot.aggregateId === aggregateId && snapshot.version > latestVersion) {
          latestSnapshot = snapshot;
          latestVersion = snapshot.version;
        }
      }

      return {
        success: !!latestSnapshot,
        snapshot: latestSnapshot
      };

    } catch (error) {
      logger.error('Failed to get latest snapshot', { aggregateId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get events from snapshot
   */
  async getEventsFromSnapshot(aggregateId, fromVersion = null) {
    try {
      // Get latest snapshot
      const snapshotResult = await this.getLatestSnapshot(aggregateId);
      
      if (!snapshotResult.success) {
        // No snapshot, get all events
        return this.getEvents(aggregateId, fromVersion || 0);
      }

      const snapshot = snapshotResult.snapshot;
      const events = [];

      // Get events after snapshot version
      for (const [eventId, event] of this.events.entries()) {
        if (event.aggregateId === aggregateId && event.version > snapshot.version) {
          if (!fromVersion || event.version >= fromVersion) {
            events.push(event);
          }
        }
      }

      // Sort by version
      events.sort((a, b) => a.version - b.version);
      this.stats.retrieved += events.length;

      return {
        success: true,
        snapshot,
        events,
        count: events.length
      };

    } catch (error) {
      logger.error('Failed to get events from snapshot', { aggregateId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete events for aggregate
   */
  async deleteEvents(aggregateId) {
    try {
      let deletedCount = 0;
      const eventsToDelete = [];

      for (const [eventId, event] of this.events.entries()) {
        if (event.aggregateId === aggregateId) {
          eventsToDelete.push(eventId);
        }
      }

      for (const eventId of eventsToDelete) {
        this.events.delete(eventId);
        deletedCount++;
      }

      logger.info('Events deleted for aggregate', { aggregateId, count: deletedCount });

      return {
        success: true,
        deleted: deletedCount
      };

    } catch (error) {
      logger.error('Failed to delete events', { aggregateId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get event store statistics
   */
  getStats() {
    return {
      totalEvents: this.events.size,
      totalSnapshots: this.snapshots.size,
      stats: this.stats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get event store status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      options: this.options,
      ...this.getStats()
    };
  }

  /**
   * Compact events (remove old events)
   */
  async compact(aggregateId, keepVersions = 10) {
    try {
      const events = await this.getEvents(aggregateId);
      
      if (!events.success || events.events.length <= keepVersions) {
        return { success: true, compacted: 0 };
      }

      const eventsToKeep = events.events.slice(-keepVersions);
      const eventsToDelete = events.events.slice(0, -keepVersions);
      
      let deletedCount = 0;
      for (const event of eventsToDelete) {
        const eventId = `${event.aggregateId}_${event.version}`;
        if (this.events.delete(eventId)) {
          deletedCount++;
        }
      }

      logger.info('Events compacted', { aggregateId, deleted: deletedCount, kept: eventsToKeep.length });

      return {
        success: true,
        deleted: deletedCount,
        kept: eventsToKeep.length
      };

    } catch (error) {
      logger.error('Failed to compact events', { aggregateId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all aggregate IDs
   */
  getAllAggregateIds() {
    const aggregateIds = new Set();
    
    for (const event of this.events.values()) {
      aggregateIds.add(event.aggregateId);
    }

    return Array.from(aggregateIds);
  }
}

// Create singleton instance
const eventStore = new EventStore();

module.exports = eventStore;
