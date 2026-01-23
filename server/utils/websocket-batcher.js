/**
 * WebSocket Batcher - Simplified Version
 * Basic WebSocket message batching functionality
 */

const logger = require('./logger');

class WebSocketBatcher {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 100;
    this.batches = new Map();
    this.stats = { batches: 0, messages: 0 };
  }

  /**
   * Initialize WebSocket batcher
   */
  async initialize() {
    logger.info('WebSocket Batcher initialized', { batchSize: this.batchSize, batchTimeout: this.batchTimeout });
    return true;
  }

  /**
   * Add message to batch
   */
  addMessage(clientId, message) {
    this.stats.messages++;
    
    if (!this.batches.has(clientId)) {
      this.batches.set(clientId, []);
    }
    
    const batch = this.batches.get(clientId);
    batch.push(message);
    
    // Send batch if it reaches the size limit
    if (batch.length >= this.batchSize) {
      return this.sendBatch(clientId);
    }
    
    return null;
  }

  /**
   * Send batch for client
   */
  sendBatch(clientId) {
    const batch = this.batches.get(clientId);
    if (!batch || batch.length === 0) {
      return null;
    }
    
    this.stats.batches++;
    this.batches.set(clientId, []);
    
    return {
      clientId,
      messages: [...batch],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get batcher status
   */
  getStatus() {
    return {
      stats: this.stats,
      activeBatches: this.batches.size,
      batchSize: this.batchSize,
      batchTimeout: this.batchTimeout,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear batch for client
   */
  clearBatch(clientId) {
    this.batches.delete(clientId);
  }
}

module.exports = WebSocketBatcher;
