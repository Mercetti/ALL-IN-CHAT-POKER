/**
 * Event Store
 * Persistent storage for events with replay capabilities
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

class EventStore {
  constructor(options = {}) {
    this.options = {
      storagePath: options.storagePath || './data/events',
      enableCompression: options.enableCompression !== false,
      enableEncryption: options.enableEncryption || false,
      encryptionKey: options.encryptionKey || 'default-key',
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: options.maxFiles || 100,
      enableIndexing: options.enableIndexing !== false,
      enableSnapshots: options.enableSnapshots !== false,
      snapshotInterval: options.snapshotInterval || 1000,
      enableCompaction: options.enableCompaction !== false,
      compactionThreshold: options.compactionThreshold || 0.5
    };
    
    this.logger = new Logger('event-store');
    this.currentIndex = 0;
    this.eventIndex = new Map(); // eventId -> file position
    this.typeIndex = new Map(); // eventType -> Set of eventIds
    this.timestampIndex = new Map(); // timestamp -> Set of eventIds
    this.snapshotCounter = 0;
    
    this.initialize();
  }

  /**
   * Initialize the event store
   */
  async initialize() {
    this.logger.info('Initializing event store');
    
    try {
      // Create storage directory
      if (!fs.existsSync(this.options.storagePath)) {
        fs.mkdirSync(this.options.storagePath, { recursive: true });
      }
      
      // Load existing indexes
      if (this.options.enableIndexing) {
        await this.loadIndexes();
      }
      
      // Find current index
      await this.findCurrentIndex();
      
      this.logger.info('Event store initialized', {
        storagePath: this.options.storagePath,
        currentIndex: this.currentIndex,
        indexedEvents: this.eventIndex.size
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize event store', { error: error.message });
      throw error;
    }
  }

  /**
   * Store an event
   */
  async storeEvent(event) {
    try {
      const eventData = this.prepareEventData(event);
      const fileName = this.getEventFileName();
      const filePath = path.join(this.options.storagePath, fileName);
      
      // Check file size and rotate if necessary
      await this.rotateFileIfNeeded(filePath);
      
      // Write event to file
      await this.writeEventToFile(filePath, eventData);
      
      // Update indexes
      if (this.options.enableIndexing) {
        this.updateIndexes(event, filePath);
      }
      
      // Create snapshot if needed
      if (this.options.enableSnapshots) {
        await this.checkSnapshotNeeded();
      }
      
      this.logger.debug('Event stored', {
        eventId: event.id,
        eventName: event.name,
        fileName
      });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to store event', {
        eventId: event.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Prepare event data for storage
   */
  prepareEventData(event) {
    let data = JSON.stringify(event);
    
    // Compress if enabled
    if (this.options.enableCompression) {
      data = this.compressData(data);
    }
    
    // Encrypt if enabled
    if (this.options.enableEncryption) {
      data = this.encryptData(data);
    }
    
    return data;
  }

  /**
   * Get event file name
   */
  getEventFileName() {
    return `events_${this.currentIndex.toString().padStart(6, '0')}.log`;
  }

  /**
   * Rotate file if it exceeds max size
   */
  async rotateFileIfNeeded(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return;
      }
      
      const stats = fs.statSync(filePath);
      
      if (stats.size >= this.options.maxFileSize) {
        this.currentIndex++;
        
        // Clean up old files if needed
        await this.cleanupOldFiles();
        
        this.logger.info('Event file rotated', {
          oldFile: filePath,
          newIndex: this.currentIndex
        });
      }
      
    } catch (error) {
      this.logger.error('Failed to rotate file', { error: error.message });
    }
  }

  /**
   * Write event to file
   */
  async writeEventToFile(filePath, eventData) {
    return new Promise((resolve, reject) => {
      fs.appendFile(filePath, eventData + '\n', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Update indexes
   */
  updateIndexes(event, filePath) {
    // Event index
    this.eventIndex.set(event.id, {
      fileName: path.basename(filePath),
      timestamp: event.timestamp,
      type: event.name
    });
    
    // Type index
    if (!this.typeIndex.has(event.name)) {
      this.typeIndex.set(event.name, new Set());
    }
    this.typeIndex.get(event.name).add(event.id);
    
    // Timestamp index
    const timestampKey = this.getTimestampKey(event.timestamp);
    if (!this.timestampIndex.has(timestampKey)) {
      this.timestampIndex.set(timestampKey, new Set());
    }
    this.timestampIndex.get(timestampKey).add(event.id);
  }

  /**
   * Get timestamp key for indexing
   */
  getTimestampKey(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  /**
   * Load existing indexes
   */
  async loadIndexes() {
    const indexPath = path.join(this.options.storagePath, 'indexes.json');
    
    if (fs.existsSync(indexPath)) {
      try {
        const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        
        this.eventIndex = new Map(Object.entries(indexData.eventIndex || {}));
        this.typeIndex = new Map(
          Object.entries(indexData.typeIndex || {}).map(([k, v]) => [k, new Set(v)])
        );
        this.timestampIndex = new Map(
          Object.entries(indexData.timestampIndex || {}).map(([k, v]) => [k, new Set(v)])
        );
        
        this.logger.info('Indexes loaded', {
          eventIndexSize: this.eventIndex.size,
          typeIndexSize: this.typeIndex.size,
          timestampIndexSize: this.timestampIndex.size
        });
        
      } catch (error) {
        this.logger.error('Failed to load indexes', { error: error.message });
      }
    }
  }

  /**
   * Save indexes
   */
  async saveIndexes() {
    const indexPath = path.join(this.options.storagePath, 'indexes.json');
    
    try {
      const indexData = {
        eventIndex: Object.fromEntries(this.eventIndex),
        typeIndex: Object.fromEntries(
          Array.from(this.typeIndex.entries()).map(([k, v]) => [k, Array.from(v)])
        ),
        timestampIndex: Object.fromEntries(
          Array.from(this.timestampIndex.entries()).map(([k, v]) => [k, Array.from(v)])
        ),
        lastUpdated: Date.now()
      };
      
      fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
      
    } catch (error) {
      this.logger.error('Failed to save indexes', { error: error.message });
    }
  }

  /**
   * Find current index
   */
  async findCurrentIndex() {
    try {
      const files = fs.readdirSync(this.options.storagePath)
        .filter(file => file.startsWith('events_') && file.endsWith('.log'))
        .sort();
      
      if (files.length > 0) {
        const lastFile = files[files.length - 1];
        const match = lastFile.match(/events_(\d+)\.log/);
        
        if (match) {
          this.currentIndex = parseInt(match[1]);
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to find current index', { error: error.message });
    }
  }

  /**
   * Retrieve events
   */
  async retrieveEvents(options = {}) {
    const {
      eventId = null,
      eventType = null,
      startTime = null,
      endTime = null,
      limit = 100,
      offset = 0
    } = options;
    
    try {
      let eventIds = [];
      
      // Find event IDs based on criteria
      if (eventId) {
        const index = this.eventIndex.get(eventId);
        if (index) {
          eventIds = [eventId];
        }
      } else if (eventType) {
        const typeEvents = this.typeIndex.get(eventType);
        if (typeEvents) {
          eventIds = Array.from(typeEvents);
        }
      } else {
        // Get all events
        eventIds = Array.from(this.eventIndex.keys());
      }
      
      // Filter by time range
      if (startTime || endTime) {
        eventIds = eventIds.filter(id => {
          const index = this.eventIndex.get(id);
          if (!index) return false;
          
          if (startTime && index.timestamp < startTime) return false;
          if (endTime && index.timestamp > endTime) return false;
          
          return true;
        });
      }
      
      // Sort by timestamp
      eventIds.sort((a, b) => {
        const indexA = this.eventIndex.get(a);
        const indexB = this.eventIndex.get(b);
        return indexA.timestamp - indexB.timestamp;
      });
      
      // Apply pagination
      eventIds = eventIds.slice(offset, offset + limit);
      
      // Load events from files
      const events = [];
      for (const eventId of eventIds) {
        const event = await this.loadEvent(eventId);
        if (event) {
          events.push(event);
        }
      }
      
      return events;
      
    } catch (error) {
      this.logger.error('Failed to retrieve events', { error: error.message });
      throw error;
    }
  }

  /**
   * Load a specific event
   */
  async loadEvent(eventId) {
    try {
      const index = this.eventIndex.get(eventId);
      if (!index) {
        return null;
      }
      
      const filePath = path.join(this.options.storagePath, index.fileName);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      // Read file and find event
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            let data = line;
            
            // Decrypt if needed
            if (this.options.enableEncryption) {
              data = this.decryptData(data);
            }
            
            // Decompress if needed
            if (this.options.enableCompression) {
              data = this.decompressData(data);
            }
            
            const event = JSON.parse(data);
            
            if (event.id === eventId) {
              return event;
            }
            
          } catch (parseError) {
            // Skip malformed lines
            continue;
          }
        }
      }
      
      return null;
      
    } catch (error) {
      this.logger.error('Failed to load event', { eventId, error: error.message });
      return null;
    }
  }

  /**
   * Replay events
   */
  async replayEvents(options = {}) {
    const {
      fromEventId = null,
      toEventId = null,
      eventType = null,
      startTime = null,
      endTime = null,
      batchSize = 100
    } = options;
    
    this.logger.info('Starting event replay', options);
    
    const events = await this.retrieveEvents({
      eventType,
      startTime,
      endTime,
      limit: 10000 // Large limit for replay
    });
    
    // Filter by event ID range if specified
    let filteredEvents = events;
    if (fromEventId || toEventId) {
      filteredEvents = events.filter(event => {
        if (fromEventId && event.id < fromEventId) return false;
        if (toEventId && event.id > toEventId) return false;
        return true;
      });
    }
    
    // Process in batches
    for (let i = 0; i < filteredEvents.length; i += batchSize) {
      const batch = filteredEvents.slice(i, i + batchSize);
      
      this.logger.debug('Processing replay batch', {
        batchNumber: Math.floor(i / batchSize) + 1,
        batchSize: batch.length
      });
      
      // Emit batch events (this would be handled by the event bus)
      for (const event of batch) {
        // The actual emission would be handled by the event bus
        this.emit('replay-event', event);
      }
    }
    
    this.logger.info('Event replay completed', {
      totalEvents: filteredEvents.length,
      batchesProcessed: Math.ceil(filteredEvents.length / batchSize)
    });
    
    return filteredEvents.length;
  }

  /**
   * Create snapshot
   */
  async createSnapshot() {
    if (!this.options.enableSnapshots) {
      return;
    }
    
    this.snapshotCounter++;
    const snapshotPath = path.join(this.options.storagePath, `snapshot_${this.snapshotCounter}.json`);
    
    try {
      const snapshot = {
        id: this.snapshotCounter,
        timestamp: Date.now(),
        currentIndex: this.currentIndex,
        eventCount: this.eventIndex.size,
        eventIndex: Object.fromEntries(this.eventIndex),
        typeIndex: Object.fromEntries(
          Array.from(this.typeIndex.entries()).map(([k, v]) => [k, Array.from(v)])
        ),
        timestampIndex: Object.fromEntries(
          Array.from(this.timestampIndex.entries()).map(([k, v]) => [k, Array.from(v)])
        )
      };
      
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
      
      this.logger.info('Snapshot created', {
        snapshotId: this.snapshotCounter,
        eventCount: this.eventIndex.size
      });
      
      // Clean up old snapshots
      await this.cleanupOldSnapshots();
      
    } catch (error) {
      this.logger.error('Failed to create snapshot', { error: error.message });
    }
  }

  /**
   * Check if snapshot is needed
   */
  async checkSnapshotNeeded() {
    if (this.eventIndex.size % this.options.snapshotInterval === 0) {
      await this.createSnapshot();
    }
  }

  /**
   * Clean up old files
   */
  async cleanupOldFiles() {
    try {
      const files = fs.readdirSync(this.options.storagePath)
        .filter(file => file.startsWith('events_') && file.endsWith('.log'))
        .sort();
      
      while (files.length > this.options.maxFiles) {
        const fileToRemove = files.shift();
        const filePath = path.join(this.options.storagePath, fileToRemove);
        
        fs.unlinkSync(filePath);
        this.logger.debug('Old event file removed', { file: fileToRemove });
      }
      
    } catch (error) {
      this.logger.error('Failed to cleanup old files', { error: error.message });
    }
  }

  /**
   * Clean up old snapshots
   */
  async cleanupOldSnapshots() {
    try {
      const snapshots = fs.readdirSync(this.options.storagePath)
        .filter(file => file.startsWith('snapshot_') && file.endsWith('.json'))
        .sort();
      
      // Keep only last 10 snapshots
      while (snapshots.length > 10) {
        const snapshotToRemove = snapshots.shift();
        const snapshotPath = path.join(this.options.storagePath, snapshotToRemove);
        
        fs.unlinkSync(snapshotPath);
        this.logger.debug('Old snapshot removed', { snapshot: snapshotToRemove });
      }
      
    } catch (error) {
      this.logger.error('Failed to cleanup old snapshots', { error: error.message });
    }
  }

  /**
   * Compact event store
   */
  async compact() {
    if (!this.options.enableCompaction) {
      return;
    }
    
    this.logger.info('Starting event store compaction');
    
    try {
      // This would implement compaction logic
      // For now, just save indexes
      await this.saveIndexes();
      
      this.logger.info('Event store compaction completed');
      
    } catch (error) {
      this.logger.error('Failed to compact event store', { error: error.message });
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      currentIndex: this.currentIndex,
      totalEvents: this.eventIndex.size,
      eventTypes: this.typeIndex.size,
      timestampRanges: this.timestampIndex.size,
      snapshotCount: this.snapshotCounter,
      storagePath: this.options.storagePath,
      indexesEnabled: this.options.enableIndexing,
      snapshotsEnabled: this.options.enableSnapshots,
      compressionEnabled: this.options.enableCompression,
      encryptionEnabled: this.options.enableEncryption
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = this.getStats();
      
      // Check storage directory
      const storageExists = fs.existsSync(this.options.storagePath);
      
      // Check file sizes
      const files = fs.readdirSync(this.options.storagePath)
        .filter(file => file.startsWith('events_') && file.endsWith('.log'));
      
      let totalSize = 0;
      for (const file of files) {
        const filePath = path.join(this.options.storagePath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        storage: {
          exists: storageExists,
          path: this.options.storagePath,
          fileCount: files.length,
          totalSize: totalSize
        },
        indexes: {
          eventIndexSize: stats.totalEvents,
          typeIndexSize: stats.eventTypes,
          timestampIndexSize: stats.timestampRanges
        },
        snapshots: {
          count: stats.snapshotCount,
          enabled: stats.snapshotsEnabled
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Shutdown event store
   */
  async shutdown() {
    this.logger.info('Shutting down event store');
    
    try {
      // Save indexes
      if (this.options.enableIndexing) {
        await this.saveIndexes();
      }
      
      // Create final snapshot
      if (this.options.enableSnapshots) {
        await this.createSnapshot();
      }
      
      this.logger.info('Event store shutdown complete');
      
    } catch (error) {
      this.logger.error('Failed to shutdown event store', { error: error.message });
    }
  }

  // Placeholder methods for compression and encryption
  compressData(data) {
    // Implement compression (e.g., using zlib)
    return data;
  }

  decompressData(data) {
    // Implement decompression
    return data;
  }

  encryptData(data) {
    // Implement encryption
    return data;
  }

  decryptData(data) {
    // Implement decryption
    return data;
  }
}

module.exports = EventStore;
