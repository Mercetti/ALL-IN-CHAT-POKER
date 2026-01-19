/**
 * Enhanced Acey WebSocket Bridge
 * Acey overlay WebSocket with message batching and advanced features
 */

const EnhancedWebSocket = require('./utils/websocket-enhanced');
const Logger = require('./logger');
const AceyEngine = require('./aceyEngine');

const logger = new Logger('acey-websocket-enhanced');

class AceyWebSocketEnhanced {
  constructor(options = {}) {
    this.options = {
      port: options.port || 8082,
      path: options.path || '/acey-enhanced',
      enableBatching: options.enableBatching !== false,
      enableCompression: options.enableCompression !== false,
      enableMetrics: options.enableMetrics !== false,
      enableRateLimiting: options.enableRateLimiting !== false,
      maxConnections: options.maxConnections || 500,
      heartbeatInterval: options.heartbeatInterval || 30000
    };
    
    this.wsServer = null;
    this.aceyEngine = null;
    this.stats = {
      totalGameEvents: 0,
      totalOverlayUpdates: 0,
      totalBatchesSent: 0,
      averageBatchSize: 0,
      processingTime: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    this.initializeEngine();
  }

  /**
   * Initialize Acey Engine
   */
  initializeEngine() {
    this.aceyEngine = new AceyEngine({ 
      logger: new Logger('acey-engine'),
      useAI: true 
    });
    
    // Forward Acey events to WebSocket clients
    this.aceyEngine.on('overlay', (data) => {
      this.handleOverlayEvent(data);
    });
    
    this.aceyEngine.on('dynamicMemory', (data) => {
      this.handleDynamicMemoryEvent(data);
    });
    
    this.aceyEngine.on('gameState', (data) => {
      this.handleGameStateEvent(data);
    });
    
    this.aceyEngine.on('playerAction', (data) => {
      this.handlePlayerActionEvent(data);
    });
  }

  /**
   * Start enhanced WebSocket server
   */
  start() {
    try {
      this.wsServer = new EnhancedWebSocket({
        port: this.options.port,
        path: this.options.path,
        enableBatching: this.options.enableBatching,
        enableCompression: this.options.enableCompression,
        enableMetrics: this.options.enableMetrics,
        enableRateLimiting: this.options.enableRateLimiting,
        maxConnections: this.options.maxConnections,
        heartbeatInterval: this.options.heartbeatInterval
      });
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Start server
      this.wsServer.start();
      
      logger.info('Enhanced Acey WebSocket server started', {
        port: this.options.port,
        path: this.options.path,
        batching: this.options.enableBatching,
        compression: this.options.enableCompression
      });
      
    } catch (error) {
      logger.error('Failed to start enhanced Acey WebSocket server', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Handle client connections
    this.wsServer.on('connection', (clientInfo) => {
      this.handleClientConnection(clientInfo);
    });
    
    // Handle messages
    this.wsServer.on('message', ({ client, message }) => {
      this.handleClientMessage(client, message);
    });
    
    // Handle disconnections
    this.wsServer.on('disconnection', ({ client, code, reason }) => {
      this.handleClientDisconnection(client, code, reason);
    });
    
    // Handle batch metrics
    this.wsServer.on('batchMetrics', (metrics) => {
      this.updateBatchMetrics(metrics);
    });
  }

  /**
   * Handle new client connection
   */
  handleClientConnection(clientInfo) {
    logger.info('Acey client connected', {
      clientId: clientInfo.id,
      sessionId: clientInfo.sessionId,
      ip: clientInfo.ip
    });
    
    // Send initial state
    this.sendInitialState(clientInfo);
    
    // Subscribe to relevant channels
    this.subscribeClientToChannels(clientInfo);
  }

  /**
   * Send initial state to client
   */
  async sendInitialState(clientInfo) {
    try {
      // Get current game state
      const gameState = await this.aceyEngine.getCurrentState();
      
      // Send initial state
      this.wsServer.sendToClient(clientInfo.id, {
        type: 'initialState',
        sessionId: clientInfo.sessionId,
        data: gameState,
        timestamp: Date.now()
      });
      
    } catch (error) {
      logger.error('Failed to send initial state', {
        clientId: clientInfo.id,
        error: error.message
      });
    }
  }

  /**
   * Subscribe client to channels
   */
  subscribeClientToChannels(clientInfo) {
    const channels = ['overlay', 'gameState', 'playerActions'];
    
    this.wsServer.sendToClient(clientInfo.id, {
      type: 'subscribe',
      channels,
      timestamp: Date.now()
    });
  }

  /**
   * Handle client message
   */
  async handleClientMessage(clientInfo, message) {
    const startTime = Date.now();
    
    try {
      switch (message.type) {
        case 'gameEvent':
          await this.handleGameEvent(clientInfo, message);
          break;
          
        case 'ping':
          this.handlePing(clientInfo);
          break;
          
        case 'getGameState':
          await this.handleGetGameState(clientInfo);
          break;
          
        case 'getPlayerInfo':
          await this.handleGetPlayerInfo(clientInfo, message);
          break;
          
        case 'overlayConfig':
          await this.handleOverlayConfig(clientInfo, message);
          break;
          
        default:
          logger.warn('Unknown message type', {
            type: message.type,
            clientId: clientInfo.id
          });
      }
      
      // Update processing time
      const processingTime = Date.now() - startTime;
      this.updateProcessingTime(processingTime);
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to handle client message', {
        clientId: clientInfo.id,
        messageType: message.type,
        error: error.message
      });
    }
  }

  /**
   * Handle game event
   */
  async handleGameEvent(clientInfo, message) {
    const { sessionId = 'default', data } = message;
    
    // Process event through Acey engine
    await this.aceyEngine.processEvent(sessionId, data);
    
    this.stats.totalGameEvents++;
    
    logger.debug('Game event processed', {
      clientId: clientInfo.id,
      sessionId,
      eventType: data.type
    });
  }

  /**
   * Handle ping
   */
  handlePing(clientInfo) {
    this.wsServer.sendToClient(clientInfo.id, {
      type: 'pong',
      timestamp: Date.now(),
      sessionId: clientInfo.sessionId
    });
  }

  /**
   * Handle get game state request
   */
  async handleGetGameState(clientInfo) {
    try {
      const gameState = await this.aceyEngine.getCurrentState();
      
      this.wsServer.sendToClient(clientInfo.id, {
        type: 'gameState',
        sessionId: clientInfo.sessionId,
        data: gameState,
        timestamp: Date.now()
      });
      
    } catch (error) {
      logger.error('Failed to get game state', {
        clientId: clientInfo.id,
        error: error.message
      });
    }
  }

  /**
   * Handle get player info request
   */
  async handleGetPlayerInfo(clientInfo, message) {
    try {
      const { playerId } = message.data;
      const playerInfo = await this.aceyEngine.getPlayerInfo(playerId);
      
      this.wsServer.sendToClient(clientInfo.id, {
        type: 'playerInfo',
        sessionId: clientInfo.sessionId,
        data: playerInfo,
        timestamp: Date.now()
      });
      
    } catch (error) {
      logger.error('Failed to get player info', {
        clientId: clientInfo.id,
        playerId: message.data.playerId,
        error: error.message
      });
    }
  }

  /**
   * Handle overlay configuration
   */
  async handleOverlayConfig(clientInfo, message) {
    try {
      const { config } = message.data;
      
      // Update overlay configuration
      await this.aceyEngine.updateOverlayConfig(config);
      
      this.wsServer.sendToClient(clientInfo.id, {
        type: 'overlayConfigUpdated',
        sessionId: clientInfo.sessionId,
        data: { success: true },
        timestamp: Date.now()
      });
      
    } catch (error) {
      logger.error('Failed to update overlay config', {
        clientId: clientInfo.id,
        error: error.message
      });
    }
  }

  /**
   * Handle overlay event from Acey engine
   */
  handleOverlayEvent(data) {
    this.stats.totalOverlayUpdates++;
    
    // Send to overlay channel
    this.wsServer.sendToChannel('overlay', {
      type: 'overlayUpdate',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Handle dynamic memory event from Acey engine
   */
  handleDynamicMemoryEvent(data) {
    // Send to dynamic memory channel
    this.wsServer.sendToChannel('dynamicMemory', {
      type: 'dynamicMemoryUpdate',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Handle game state event from Acey engine
   */
  handleGameStateEvent(data) {
    // Send to game state channel
    this.wsServer.sendToChannel('gameState', {
      type: 'gameStateUpdate',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Handle player action event from Acey engine
   */
  handlePlayerActionEvent(data) {
    // Send to player actions channel
    this.wsServer.sendToChannel('playerActions', {
      type: 'playerActionUpdate',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Handle client disconnection
   */
  handleClientDisconnection(clientInfo, code, reason) {
    logger.info('Acey client disconnected', {
      clientId: clientInfo.id,
      sessionId: clientInfo.sessionId,
      code,
      reason,
      connectionDuration: Date.now() - clientInfo.connectedAt
    });
    
    // Clean up any session-specific data
    this.cleanupClientSession(clientInfo);
  }

  /**
   * Clean up client session data
   */
  cleanupClientSession(clientInfo) {
    // Remove from any active games or sessions
    // This would be implemented based on specific requirements
    logger.debug('Client session cleaned up', {
      clientId: clientInfo.id,
      sessionId: clientInfo.sessionId
    });
  }

  /**
   * Update batch metrics
   */
  updateBatchMetrics(metrics) {
    this.stats.totalBatchesSent += metrics.batchesSent || 0;
    this.stats.averageBatchSize = metrics.averageBatchSize || 0;
    
    // Emit metrics event for external monitoring
    this.emit('batchMetrics', metrics);
  }

  /**
   * Update processing time
   */
  updateProcessingTime(processingTime) {
    const totalEvents = this.stats.totalGameEvents + this.stats.totalOverlayUpdates;
    this.stats.processingTime = Math.round(
      (this.stats.processingTime * (totalEvents - 1) + processingTime) / totalEvents
    );
  }

  /**
   * Get server statistics
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const wsStats = this.wsServer ? this.wsServer.getStats() : null;
    
    return {
      ...this.stats,
      uptime,
      averageProcessingTime: this.stats.processingTime,
      eventsPerSecond: (this.stats.totalGameEvents + this.stats.totalOverlayUpdates) / (uptime / 1000),
      wsServer: wsStats,
      aceyEngine: this.aceyEngine ? this.aceyEngine.getStats() : null
    };
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    const wsSessionStats = this.wsServer ? this.wsServer.getSessionStats(sessionId) : null;
    const aceySessionStats = this.aceyEngine ? this.aceyEngine.getSessionStats(sessionId) : null;
    
    return {
      sessionId,
      wsServer: wsSessionStats,
      aceyEngine: aceySessionStats,
      timestamp: Date.now()
    };
  }

  /**
   * Get all session statistics
   */
  getAllSessionStats() {
    const wsSessionStats = this.wsServer ? this.wsServer.getAllSessionStats() : {};
    const aceySessionStats = this.aceyEngine ? this.aceyEngine.getAllSessionStats() : {};
    
    return {
      wsServer: wsSessionStats,
      aceyEngine: aceySessionStats,
      timestamp: Date.now()
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalGameEvents: 0,
      totalOverlayUpdates: 0,
      totalBatchesSent: 0,
      averageBatchSize: 0,
      processingTime: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    if (this.wsServer) {
      this.wsServer.resetStats();
    }
    
    logger.info('Enhanced Acey WebSocket statistics reset');
  }

  /**
   * Force flush all pending messages
   */
  flushAllMessages() {
    if (this.wsServer) {
      this.wsServer.flushAllMessages();
    }
  }

  /**
   * Send custom message to session
   */
  sendToSession(sessionId, message) {
    if (this.wsServer) {
      return this.wsServer.sendToSession(sessionId, {
        ...message,
        sessionId,
        timestamp: Date.now()
      });
    }
    return 0;
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(message, options = {}) {
    if (this.wsServer) {
      return this.wsServer.broadcast({
        ...message,
        timestamp: Date.now()
      }, options);
    }
    return 0;
  }

  /**
   * Send overlay update
   */
  sendOverlayUpdate(data) {
    this.handleOverlayEvent(data);
  }

  /**
   * Send game state update
   */
  sendGameStateUpdate(data) {
    this.handleGameStateEvent(data);
  }

  /**
   * Send player action update
   */
  sendPlayerActionUpdate(data) {
    this.handlePlayerActionEvent(data);
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = this.getStats();
      const wsHealth = this.wsServer ? await this.wsServer.healthCheck() : null;
      const aceyHealth = this.aceyEngine ? await this.aceyEngine.healthCheck() : null;
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: stats.uptime,
        stats,
        components: {
          wsServer: wsHealth,
          aceyEngine: aceyHealth
        }
      };
      
      // Check for any issues
      if (stats.errors > 100) {
        health.status = 'degraded';
        health.issues = ['High error rate detected'];
      }
      
      if (stats.averageProcessingTime > 1000) {
        health.status = 'degraded';
        health.issues = health.issues || [];
        health.issues.push('High processing time detected');
      }
      
      return health;
      
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Close server
   */
  close() {
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    if (this.aceyEngine) {
      this.aceyEngine.stop();
    }
    
    logger.info('Enhanced Acey WebSocket server closed');
  }
}

module.exports = { AceyWebSocketEnhanced };
