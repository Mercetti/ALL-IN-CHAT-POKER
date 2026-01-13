/**
 * Enhanced WebSocket Handler
 * WebSocket server with message batching and advanced features
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const Logger = require('./logger');
const WebSocketMessageBatcher = require('./websocket-batcher');

const logger = new Logger('websocket-enhanced');

class EnhancedWebSocket extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      port: options.port || 8081,
      host: options.host || '0.0.0.0',
      path: options.path || '/ws',
      enableBatching: options.enableBatching !== false,
      enableCompression: options.enableCompression !== false,
      enableMetrics: options.enableMetrics !== false,
      enableRateLimiting: options.enableRateLimiting !== false,
      maxConnections: options.maxConnections || 1000,
      perMessageDeflate: options.perMessageDeflate !== false,
      maxPayloadSize: options.maxPayloadSize || 1024 * 1024, // 1MB
      heartbeatInterval: options.heartbeatInterval || 30000, // 30 seconds
      heartbeatTimeout: options.heartbeatTimeout || 60000 // 60 seconds
    };
    
    this.wss = null;
    this.clients = new Map(); // clientId -> client info
    this.sessions = new Map(); // sessionId -> Set of clientIds
    this.messageBatcher = null;
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      totalBatches: 0,
      totalBytes: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    this.initializeBatcher();
  }

  /**
   * Initialize message batcher
   */
  initializeBatcher() {
    if (this.options.enableBatching) {
      this.messageBatcher = new WebSocketMessageBatcher({
        batchSize: 10,
        batchTimeout: 100,
        maxBatchSize: 50,
        enableCompression: this.options.enableCompression,
        enableDeduplication: true,
        enablePriority: true,
        enableMetrics: this.options.enableMetrics
      });
      
      // Listen for batch events
      this.messageBatcher.on('batchSend', (batch) => {
        this.sendBatchToClients(batch);
      });
      
      this.messageBatcher.on('metrics', (metrics) => {
        this.emit('batchMetrics', metrics);
      });
    }
  }

  /**
   * Start WebSocket server
   */
  start() {
    try {
      this.wss = new WebSocket.Server({
        port: this.options.port,
        host: this.options.host,
        path: this.options.path,
        perMessageDeflate: this.options.perMessageDeflate,
        maxPayload: this.options.maxPayloadSize
      });

      this.setupServerEvents();
      
      this.wss.listen(() => {
        logger.info('Enhanced WebSocket server started', {
          host: this.options.host,
          port: this.options.port,
          path: this.options.path,
          batching: this.options.enableBatching,
          compression: this.options.enableCompression,
          metrics: this.options.enableMetrics
        });
      });
      
    } catch (error) {
      logger.error('Failed to start WebSocket server', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup server event handlers
   */
  setupServerEvents() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error) => {
      this.stats.errors++;
      logger.error('WebSocket server error', { error: error.message });
    });

    // Setup heartbeat
    this.setupHeartbeat();
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const sessionId = this.extractSessionId(req) || 'default';
    
    const clientInfo = {
      id: clientId,
      ws,
      sessionId,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      bytesReceived: 0,
      bytesSent: 0,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      alive: true
    };
    
    // Add to clients and sessions
    this.clients.set(clientId, clientInfo);
    
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Set());
    }
    this.sessions.get(sessionId).add(clientId);
    
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    
    logger.info('WebSocket client connected', {
      clientId,
      sessionId,
      ip: clientInfo.ip,
      totalConnections: this.stats.activeConnections
    });
    
    // Setup client event handlers
    this.setupClientEvents(clientInfo);
    
    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connected',
      clientId,
      sessionId,
      timestamp: Date.now(),
      message: 'Connected to enhanced WebSocket server'
    });
    
    // Emit connection event
    this.emit('connection', clientInfo);
  }

  /**
   * Setup client event handlers
   */
  setupClientEvents(clientInfo) {
    const { ws, id: clientId } = clientInfo;
    
    ws.on('message', (data) => {
      this.handleMessage(clientInfo, data);
    });
    
    ws.on('close', (code, reason) => {
      this.handleDisconnection(clientInfo, code, reason);
    });
    
    ws.on('error', (error) => {
      this.stats.errors++;
      logger.error('WebSocket client error', {
        clientId,
        error: error.message
      });
    });
    
    ws.on('pong', () => {
      clientInfo.alive = true;
      clientInfo.lastActivity = Date.now();
    });
  }

  /**
   * Handle incoming message
   */
  handleMessage(clientInfo, data) {
    try {
      const message = JSON.parse(data.toString());
      
      // Update client stats
      clientInfo.messageCount++;
      clientInfo.bytesReceived += data.length;
      clientInfo.lastActivity = Date.now();
      this.stats.totalMessages++;
      this.stats.totalBytes += data.length;
      
      // Add to batcher if enabled
      if (this.messageBatcher) {
        const priority = this.getMessagePriority(message);
        this.messageBatcher.addMessage(clientInfo.sessionId, message, priority);
      } else {
        // Send immediately
        this.processMessage(clientInfo, message);
      }
      
      logger.debug('Message received', {
        clientId: clientInfo.id,
        sessionId: clientInfo.sessionId,
        type: message.type,
        size: data.length
      });
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to parse WebSocket message', {
        clientId: clientInfo.id,
        error: error.message,
        data: data.toString()
      });
    }
  }

  /**
   * Process individual message
   */
  processMessage(clientInfo, message) {
    // Handle special message types
    switch (message.type) {
      case 'ping':
        this.sendToClient(clientInfo.id, {
          type: 'pong',
          timestamp: Date.now()
        });
        break;
        
      case 'subscribe':
        this.handleSubscription(clientInfo, message);
        break;
        
      case 'unsubscribe':
        this.handleUnsubscription(clientInfo, message);
        break;
        
      default:
        // Emit message for external handling
        this.emit('message', {
          client: clientInfo,
          message
        });
    }
  }

  /**
   * Get message priority
   */
  getMessagePriority(message) {
    const highPriorityTypes = ['gameEvent', 'system', 'emergency'];
    const mediumPriorityTypes = ['chat', 'playerAction', 'bet'];
    
    if (highPriorityTypes.includes(message.type)) {
      return 'high';
    } else if (mediumPriorityTypes.includes(message.type)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Handle subscription
   */
  handleSubscription(clientInfo, message) {
    const { channels = [] } = message;
    
    if (!clientInfo.subscriptions) {
      clientInfo.subscriptions = new Set();
    }
    
    channels.forEach(channel => {
      clientInfo.subscriptions.add(channel);
    });
    
    this.sendToClient(clientInfo.id, {
      type: 'subscribed',
      channels: Array.from(clientInfo.subscriptions),
      timestamp: Date.now()
    });
    
    logger.debug('Client subscribed to channels', {
      clientId: clientInfo.id,
      channels
    });
  }

  /**
   * Handle unsubscription
   */
  handleUnsubscription(clientInfo, message) {
    const { channels = [] } = message;
    
    if (clientInfo.subscriptions) {
      channels.forEach(channel => {
        clientInfo.subscriptions.delete(channel);
      });
    }
    
    this.sendToClient(clientInfo.id, {
      type: 'unsubscribed',
      channels: channels,
      timestamp: Date.now()
    });
    
    logger.debug('Client unsubscribed from channels', {
      clientId: clientInfo.id,
      channels
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(clientInfo, code, reason) {
    const { id: clientId, sessionId } = clientInfo;
    
    // Remove from clients and sessions
    this.clients.delete(clientId);
    
    if (this.sessions.has(sessionId)) {
      this.sessions.get(sessionId).delete(clientId);
      if (this.sessions.get(sessionId).size === 0) {
        this.sessions.delete(sessionId);
      }
    }
    
    this.stats.activeConnections--;
    
    logger.info('WebSocket client disconnected', {
      clientId,
      sessionId,
      code,
      reason,
      connectionDuration: Date.now() - clientInfo.connectedAt,
      messageCount: clientInfo.messageCount,
      activeConnections: this.stats.activeConnections
    });
    
    // Emit disconnection event
    this.emit('disconnection', {
      client: clientInfo,
      code,
      reason
    });
  }

  /**
   * Setup heartbeat mechanism
   */
  setupHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (!ws.alive) {
          ws.terminate();
          return;
        }
        
        ws.alive = false;
        ws.ping();
      });
    }, this.options.heartbeatInterval);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const clientInfo = this.clients.get(clientId);
    
    if (!clientInfo || clientInfo.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      const payload = JSON.stringify(message);
      clientInfo.ws.send(payload);
      
      clientInfo.bytesSent += payload.length;
      clientInfo.lastActivity = Date.now();
      
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to send message to client', {
        clientId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Send batch to clients in session
   */
  sendBatchToClients(batch) {
    const { sessionId, messages } = batch;
    const sessionClients = this.sessions.get(sessionId);
    
    if (!sessionClients) return;
    
    let sentCount = 0;
    
    sessionClients.forEach(clientId => {
      if (this.sendToClient(clientId, {
        type: 'batch',
        sessionId,
        messages,
        timestamp: batch.timestamp,
        count: messages.length
      })) {
        sentCount++;
      }
    });
    
    this.stats.totalBatches++;
    
    logger.debug('Batch sent to session', {
      sessionId,
      messageCount: messages.length,
      clientsSent: sentCount
    });
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(message, options = {}) {
    const { 
      excludeSession, 
      excludeClient,
      onlySubscribed,
      channel 
    } = options;
    
    let sentCount = 0;
    
    this.clients.forEach((clientInfo, clientId) => {
      // Apply filters
      if (excludeSession && clientInfo.sessionId === excludeSession) {
        return;
      }
      
      if (excludeClient && clientId === excludeClient) {
        return;
      }
      
      if (onlySubscribed && channel && clientInfo.subscriptions) {
        if (!clientInfo.subscriptions.has(channel)) {
          return;
        }
      }
      
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    });
    
    logger.debug('Message broadcasted', {
      messageType: message.type,
      clientsSent: sentCount,
      totalClients: this.stats.activeConnections
    });
    
    return sentCount;
  }

  /**
   * Send message to session
   */
  sendToSession(sessionId, message) {
    const sessionClients = this.sessions.get(sessionId);
    
    if (!sessionClients) return 0;
    
    let sentCount = 0;
    
    sessionClients.forEach(clientId => {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    });
    
    return sentCount;
  }

  /**
   * Send message to channel subscribers
   */
  sendToChannel(channel, message) {
    return this.broadcast(message, { onlySubscribed: true, channel });
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract session ID from request
   */
  extractSessionId(req) {
    // Try to get session ID from query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('sessionId') || 
           req.headers['x-session-id'] || 
           req.headers['cookie']?.match(/sessionId=([^;]+)/)?.[1];
  }

  /**
   * Get server statistics
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const batcherStats = this.messageBatcher ? this.messageBatcher.getStats() : null;
    
    return {
      ...this.stats,
      uptime,
      activeConnections: this.stats.activeConnections,
      averageMessagesPerSecond: this.stats.totalMessages / (uptime / 1000),
      averageBytesPerSecond: this.stats.totalBytes / (uptime / 1000),
      sessionCount: this.sessions.size,
      batcher: batcherStats,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    const sessionClients = this.sessions.get(sessionId);
    
    if (!sessionClients) return null;
    
    const clients = Array.from(sessionClients).map(id => this.clients.get(id));
    
    return {
      sessionId,
      clientCount: clients.length,
      clients: clients.map(client => ({
        id: client.id,
        connectedAt: client.connectedAt,
        lastActivity: client.lastActivity,
        messageCount: client.messageCount,
        bytesReceived: client.bytesReceived,
        bytesSent: client.bytesSent,
        ip: client.ip
      })),
      totalMessages: clients.reduce((sum, client) => sum + client.messageCount, 0),
      totalBytes: clients.reduce((sum, client) => sum + client.bytesReceived + client.bytesSent, 0)
    };
  }

  /**
   * Get all session statistics
   */
  getAllSessionStats() {
    const stats = {};
    
    this.sessions.forEach((clients, sessionId) => {
      stats[sessionId] = this.getSessionStats(sessionId);
    });
    
    return stats;
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      totalBatches: 0,
      totalBytes: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    if (this.messageBatcher) {
      this.messageBatcher.resetStats();
    }
    
    logger.info('Enhanced WebSocket statistics reset');
  }

  /**
   * Force flush all pending messages
   */
  flushAllMessages() {
    if (this.messageBatcher) {
      this.messageBatcher.flushAll();
    }
  }

  /**
   * Close WebSocket server
   */
  close() {
    if (this.wss) {
      // Close all connections
      this.wss.clients.forEach(ws => {
        ws.close(1000, 'Server shutting down');
      });
      
      // Close server
      this.wss.close(() => {
        logger.info('Enhanced WebSocket server closed');
      });
      
      // Cleanup batcher
      if (this.messageBatcher) {
        this.messageBatcher.destroy();
      }
    }
  }
}

module.exports = EnhancedWebSocket;
