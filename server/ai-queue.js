/**
 * AI Request Queue & Batching System
 * Handles multiple AI requests efficiently
 */

const EventEmitter = require('events');
const Logger = require('./logger');

const logger = new Logger('ai-queue');

class AIQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxBatchSize = options.maxBatchSize || 5;
    this.batchTimeout = options.batchTimeout || 100; // 100ms
    this.maxConcurrency = options.maxConcurrency || 3;
    this.processing = new Set();
    this.queue = [];
    this.batch = [];
    this.batchTimer = null;
    this.stats = {
      processed: 0,
      batched: 0,
      queued: 0,
      errors: 0
    };
  }

  /**
   * Add request to queue
   */
  async add(request) {
    return new Promise((resolve, reject) => {
      const queueItem = {
        id: this.generateId(),
        request,
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      this.queue.push(queueItem);
      this.stats.queued++;
      
      this.processQueue();
      logger.debug('Request queued', { id: queueItem.id });
    });
  }

  /**
   * Process queue and create batches
   */
  processQueue() {
    if (this.processing.size >= this.maxConcurrency) {
      return; // Max concurrency reached
    }

    // Move items from queue to batch
    while (this.batch.length < this.maxBatchSize && this.queue.length > 0) {
      const item = this.queue.shift();
      this.batch.push(item);
    }

    if (this.batch.length === 0) {
      return; // No items to process
    }

    // Set timer for batch processing
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.batchTimeout);
  }

  /**
   * Process current batch
   */
  async processBatch() {
    if (this.batch.length === 0) return;

    const batch = [...this.batch];
    this.batch = [];
    this.batchTimer = null;
    
    this.processing.add(batch[0].id); // Track by first item ID
    
    try {
      logger.debug('Processing batch', { size: batch.length });
      
      // Process batch (simplified - in real implementation, would batch to AI API)
      const results = await this.processBatchRequests(batch);
      
      // Resolve all requests in batch
      batch.forEach((item, index) => {
        this.processing.delete(item.id);
        
        if (results[index]) {
          item.resolve(results[index]);
          this.stats.processed++;
        } else {
          item.reject(new Error('No response received'));
          this.stats.errors++;
        }
      });
      
      this.stats.batched++;
      this.emit('batch-processed', { size: batch.length });
      
    } catch (error) {
      logger.error('Batch processing failed', { error: error.message });
      
      // Reject all requests in batch
      batch.forEach(item => {
        this.processing.delete(item.id);
        item.reject(error);
        this.stats.errors++;
      });
    }
    
    // Continue processing queue
    this.processQueue();
  }

  /**
   * Process batch requests (simplified implementation)
   */
  async processBatchRequests(batch) {
    // In a real implementation, this would batch requests to the AI API
    // For now, process individually but in parallel
    
    const promises = batch.map(async (item) => {
      try {
        // This would call the actual AI system
        const { ai } = require('./ai');
        const response = await ai.chat(item.request.messages, item.request.options);
        return response;
      } catch (error) {
        logger.error('Request failed in batch', { id: item.id, error: error.message });
        return null;
      }
    });
    
    return Promise.all(promises);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      batchSize: this.batch.length,
      processing: this.processing.size,
      maxConcurrency: this.maxConcurrency
    };
  }

  /**
   * Clear queue
   */
  clear() {
    // Reject all queued requests
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
      this.stats.errors++;
    });
    
    this.queue = [];
    this.batch = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    logger.info('AI queue cleared');
  }
}

module.exports = AIQueue;
