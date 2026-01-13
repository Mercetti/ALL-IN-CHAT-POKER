/**
 * WebSocket Message Batcher
 * Batches WebSocket messages to improve performance and reduce overhead
 */

const EventEmitter = require('events');
const Logger = require('./logger');

const logger = new Logger('websocket-batcher');

class WebSocketMessageBatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      batchSize: options.batchSize || 10, // Messages per batch
      batchTimeout: options.batchTimeout || 100, // ms to wait before sending
      maxBatchSize: options.maxBatchSize || 50, // Maximum messages per batch
      enableCompression: options.enableCompression !== false,
      compressionThreshold: options.compressionThreshold || 1024, // Compress if batch > 1KB
      enableDeduplication: options.enableDeduplication !== false,
      deduplicationWindow: options.deduplicationWindow || 5000, // 5 seconds
      enablePriority: options.enablePriority !== false,
      priorityLevels: options.priorityLevels || ['high', 'medium', 'low'],
      enableMetrics: options.enableMetrics !== false,
      metricsInterval: options.metricsInterval || 10000 // 10 seconds
    };
    
    this.batches = new Map(); // sessionId -> batch
    this.messageQueue = []; // Queue of messages to be batched
    this.batchTimers = new Map(); // sessionId -> timer
    this.messageIds = new Set(); // For deduplication
    this.lastActivity = new Map(); // sessionId -> timestamp
    this.stats = {
      totalMessages: 0,
      batchesSent: 0,
      messagesDeduped: 0,
      averageBatchSize: 0,
      compressionSavings: 0,
      priorityStats: { high: 0, medium: 0, low: 0 }
    };
    
    this.startMetricsReporting();
  }

  /**
   * Add message to batch
   */
  addMessage(sessionId, message, priority = 'medium') {
    // Validate message
    if (!message || typeof message !== 'object') {
      logger.warn('Invalid message for batching', { sessionId, message });
      return false;
    }
    
    // Add metadata
    const enhancedMessage = {
      ...message,
      id: message.id || this.generateMessageId(),
      sessionId,
      priority: this.options.priorityLevels.includes(priority) ? priority : 'medium',
      timestamp: Date.now(),
      addedAt: Date.now()
    };
    
    // Check deduplication
    if (this.options.enableDeduplication && this.isDuplicate(enhancedMessage)) {
      this.stats.messagesDeduped++;
      logger.debug('Message deduped', { messageId: enhancedMessage.id });
      return false;
    }
    
    this.messageQueue.push(enhancedMessage);
    this.stats.totalMessages++;
    
    // Update last activity
    this.lastActivity.set(sessionId, Date.now());
    
    // Process queue
    this.processQueue();
    
    logger.debug('Message added to batch', { 
      sessionId, 
      messageId: enhancedMessage.id,
      priority,
      queueSize: this.messageQueue.length 
    });
    
    return enhancedMessage.id;
  }

  /**
   * Check if message is duplicate
   */
  isDuplicate(message) {
    const messageKey = this.getMessageKey(message);
    return this.messageIds.has(messageKey);
  }

  /**
   * Generate message key for deduplication
   */
  getMessageKey(message) {
    // Create a hashable key from message
    const key = `${message.sessionId}:${message.type}`;
    
    if (message.data && typeof message.data === 'object') {
      // Include relevant data fields for more precise deduplication
      const dataFields = ['gameId', 'playerId', 'action', 'amount'];
      const relevantData = {};
      
      dataFields.forEach(field => {
        if (message.data[field] !== undefined) {
          relevantData[field] = message.data[field];
        }
      });
      
      return `${key}:${JSON.stringify(relevantData)}`;
    }
    
    return key;
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Process message queue
   */
  processQueue() {
    if (this.messageQueue.length === 0) return;
    
    // Sort queue by priority and timestamp
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.timestamp - b.timestamp;
    });
    
    // Process messages in priority order
    while (this.messageQueue.length > 0) {
      const batch = this.createBatch();
      if (batch.messages.length > 0) {
        this.sendBatch(batch);
      }
    }
  }

  /**
   * Create batch from queue
   */
  createBatch() {
    const batch = {
      messages: [],
      sessionId: null,
      priority: 'medium',
      createdAt: Date.now()
    };
    
    // Take messages from queue until batch size or max batch size
    while (batch.messages.length < this.options.batchSize && 
           this.messageQueue.length > 0 && 
           batch.messages.length < this.options.maxBatchSize) {
      
      const message = this.messageQueue.shift();
      
      // Group by session and priority
      if (!batch.sessionId) {
        batch.sessionId = message.sessionId;
        batch.priority = message.priority;
      } else {
        // Prefer higher priority messages
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const currentPriority = priorityOrder[batch.priority] || 2;
        const messagePriority = priorityOrder[message.priority] || 2;
        
        if (messagePriority > currentPriority) {
          batch.priority = message.priority;
        }
      }
      
      batch.messages.push(message);
      
      // Track message ID for deduplication
      const messageKey = this.getMessageKey(message);
      this.messageIds.add(messageKey);
      
      // Update last activity
      this.lastActivity.set(message.sessionId, Date.now());
    }
    
    return batch;
  }

  /**
   * Send batch to clients
   */
  sendBatch(batch) {
    if (!this.emit('beforeBatchSend', { batch })) {
      return;
    }
    
    try {
      // Prepare batch payload
      const payload = {
        type: 'batch',
        sessionId: batch.sessionId,
        priority: batch.priority,
        timestamp: batch.createdAt,
        messages: batch.messages,
        count: batch.messages.length
      };
      
      // Compress if enabled and threshold met
      let finalPayload = payload;
      if (this.options.enableCompression) {
        const payloadSize = JSON.stringify(payload).length;
        if (payloadSize > this.options.compressionThreshold) {
          finalPayload = {
            ...payload,
            compressed: true,
            originalSize: payloadSize
          };
        }
      }
      
      // Emit batch send event
      this.emit('batchSend', finalPayload);
      
      // Update statistics
      this.stats.batchesSent++;
      this.stats.averageBatchSize = this.calculateAverageBatchSize(batch.messages.length);
      
      if (finalPayload.compressed) {
        this.stats.compressionSavings += payloadSize - JSON.stringify(finalPayload).length;
      }
      
      // Update priority statistics
      this.stats.priorityStats[batch.priority]++;
      
      logger.debug('Batch sent', {
        sessionId: batch.sessionId,
        messageCount: batch.messages.length,
        priority: batch.priority,
        compressed: finalPayload.compressed || false
      });
      
    } catch (error) {
      logger.error('Failed to send batch', { 
        error: error.message,
        batchSize: batch.messages.length 
      });
    }
  }

  /**
   * Calculate average batch size
   */
  calculateAverageBatchSize(newBatchSize) {
    const totalBatches = this.stats.batchesSent;
    if (totalBatches === 0) return newBatchSize;
    
    const currentAverage = this.stats.averageBatchSize;
    return Math.round((currentAverage * (totalBatches - 1) + newBatchSize) / totalBatches);
  }

  /**
   * Start batch timer for session
   */
  startBatchTimer(sessionId) {
    // Clear existing timer
    if (this.batchTimers.has(sessionId)) {
      clearTimeout(this.batchTimers.get(sessionId));
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.flushSession(sessionId);
    }, this.options.batchTimeout);
    
    this.batchTimers.set(sessionId, timer);
  }

  /**
   * Flush all messages for a session
   */
  flushSession(sessionId) {
    // Find and remove all messages for this session
    const sessionMessages = this.messageQueue.filter(msg => msg.sessionId === sessionId);
    this.messageQueue = this.messageQueue.filter(msg => msg.sessionId !== sessionId);
    
    if (sessionMessages.length > 0) {
      const batch = {
        messages: sessionMessages,
        sessionId,
        priority: sessionMessages[0].priority,
        createdAt: Date.now()
      };
      
      this.sendBatch(batch);
    }
    
    // Clear timer
    if (this.batchTimers.has(sessionId)) {
      clearTimeout(this.batchTimers.get(sessionId));
      this.batchTimers.delete(sessionId);
    }
  }

  /**
   * Flush all pending messages
   */
  flushAll() {
    const allMessages = [...this.messageQueue];
    this.messageQueue = [];
    
    // Group by session
    const sessionGroups = new Map();
    allMessages.forEach(message => {
      if (!sessionGroups.has(message.sessionId)) {
        sessionGroups.set(message.sessionId, []);
      }
      sessionGroups.get(message.sessionId).push(message);
    });
    
    // Send batch for each session
    sessionGroups.forEach((messages, sessionId) => {
      if (messages.length > 0) {
        const batch = {
          messages,
          sessionId,
          priority: messages[0].priority,
          createdAt: Date.now()
        };
        
        this.sendBatch(batch);
      }
    });
    
    // Clear all timers
    this.batchTimers.forEach((timer, id) => {
      clearTimeout(timer);
    });
    this.batchTimers.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.messageQueue.length,
      activeTimers: this.batchTimers.size,
      messageIdsInWindow: this.messageIds.size,
      averageProcessingDelay: this.calculateAverageDelay()
    };
  }

  /**
   * Calculate average processing delay
   */
  calculateAverageDelay() {
    // This would need to be implemented based on actual processing times
    // For now, return a placeholder
    return 0;
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalMessages: 0,
      batchesSent: 0,
      messagesDeduped: 0,
      averageBatchSize: 0,
      compressionSavings: 0,
      priorityStats: { high: 0, medium: 0, low: 0 }
    };
    
    this.messageIds.clear();
    logger.info('WebSocket batcher statistics reset');
  }

  /**
   * Start metrics reporting
   */
  startMetricsReporting() {
    if (!this.options.enableMetrics) return;
    
    setInterval(() => {
      const stats = this.getStats();
      this.emit('metrics', stats);
      
      logger.debug('WebSocket batcher metrics', stats);
    }, this.options.metricsInterval);
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    const sessionMessages = this.messageQueue.filter(msg => msg.sessionId === sessionId);
    const lastActivity = this.lastActivity.get(sessionId) || 0;
    
    return {
      sessionId,
      messageCount: sessionMessages.length,
      lastActivity,
      priorityDistribution: sessionMessages.reduce((acc, msg) => {
        acc[msg.priority] = (acc[msg.priority] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Configure batcher options
   */
  configure(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    logger.info('WebSocket batcher configured', { options: this.options });
    
    // Restart processing with new configuration
    this.processQueue();
  }

  /**
   * Destroy batcher
   */
  destroy() {
    // Clear all timers
    this.batchTimers.forEach((timer, id) => {
      clearTimeout(timer);
    });
    this.batchTimers.clear();
    
    // Clear queues
    this.messageQueue = [];
    this.messageIds.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    logger.info('WebSocket batcher destroyed');
  }
}

module.exports = WebSocketMessageBatcher;
