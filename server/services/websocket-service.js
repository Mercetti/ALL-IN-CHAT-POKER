/**
 * WebSocket Service
 * Service layer for WebSocket operations with message batching
 */

const BaseService = require('./base-service');
const { AceyWebSocketEnhanced } = require('../acey-websocket-enhanced');
const Logger = require('../utils/logger');

class WebSocketService extends BaseService {
  constructor(options = {}) {
    super('websocket-service', options);
    
    this.options = {
      ...this.options,
      port: options.port || 8082,
      path: options.path || '/acey-enhanced',
      enableBatching: options.enableBatching !== false,
      enableCompression: options.enableCompression !== false,
      enableMetrics: options.enableMetrics !== false,
      maxConnections: options.maxConnections || 500,
      heartbeatInterval: options.heartbeatInterval || 30000
    };
    
    this.wsServer = null;
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      totalBatches: 0,
      averageMessageSize: 0,
      messageTypes: {},
      errors: []
    };
  }

  /**
   * Start the WebSocket service
   */
  async onStart() {
    try {
      // Create WebSocket server
      this.wsServer = new AceyWebSocketEnhanced({
        port: this.options.port,
        path: this.options.path,
        enableBatching: this.options.enableBatching,
        enableCompression: this.options.enableCompression,
        enableMetrics: this.options.enableMetrics,
        maxConnections: this.options.maxConnections,
        heartbeatInterval: this.options.heartbeatInterval
      });
      
      // Set up event listeners
      this.setupWebSocketListeners();
      
      // Start the server
      this.wsServer.start();
      
      this.logger.info('WebSocket service started', {
        port: this.options.port,
        path: this.options.path,
        batching: this.options.enableBatching,
        compression: this.options.enableCompression
      });
      
    } catch (error) {
      this.logger.error('Failed to start WebSocket service', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the WebSocket service
   */
  async onStop() {
    try {
      if (this.wsServer) {
        this.wsServer.close();
        this.wsServer = null;
      }
      
      this.logger.info('WebSocket service stopped');
      
    } catch (error) {
      this.logger.error('Failed to stop WebSocket service', { error: error.message });
      throw error;
    }
  }

  /**
   * Set up WebSocket event listeners
   */
  setupWebSocketListeners() {
    this.wsServer.on('connection', (clientInfo) => {
      this.handleConnection(clientInfo);
    });
    
    this.wsServer.on('message', ({ client, message }) => {
      this.handleMessage(client, message);
    });
    
    this.wsServer.on('disconnection', ({ client, code, reason }) => {
      this.handleDisconnection(client, code, reason);
    });
    
    this.wsServer.on('batchMetrics', (metrics) => {
      this.handleBatchMetrics(metrics);
    });
    
    this.wsServer.on('error', (error) => {
      this.handleError(error);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(clientInfo) {
    this.connectionStats.totalConnections++;
    this.connectionStats.activeConnections++;
    
    this.logger.info('WebSocket client connected', {
      clientId: clientInfo.id,
      sessionId: clientInfo.sessionId,
      ip: clientInfo.ip,
      totalConnections: this.connectionStats.activeConnections
    });
    
    this.emit('clientConnected', clientInfo);
  }

  /**
   * Handle WebSocket message
   */
  handleMessage(clientInfo, message) {
    this.connectionStats.totalMessages++;
    
    // Track message types
    const messageType = message.type || 'unknown';
    this.connectionStats.messageTypes[messageType] = 
      (this.connectionStats.messageTypes[messageType] || 0) + 1;
    
    // Track message size
    const messageSize = JSON.stringify(message).length;
    this.updateAverageMessageSize(messageSize);
    
    this.logger.debug('WebSocket message received', {
      clientId: clientInfo.id,
      sessionId: clientInfo.sessionId,
      type: messageType,
      size: messageSize
    });
    
    this.emit('message', { client: clientInfo, message });
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnection(clientInfo, code, reason) {
    this.connectionStats.activeConnections--;
    
    this.logger.info('WebSocket client disconnected', {
      clientId: clientInfo.id,
      sessionId: clientInfo.sessionId,
      code,
      reason,
      connectionDuration: Date.now() - clientInfo.connectedAt,
      messageCount: clientInfo.messageCount,
      activeConnections: this.connectionStats.activeConnections
    });
    
    this.emit('clientDisconnected', { client: clientInfo, code, reason });
  }

  /**
   * Handle batch metrics
   */
  handleBatchMetrics(metrics) {
    this.connectionStats.totalBatches += metrics.batchesSent || 0;
    
    this.emit('batchMetrics', metrics);
  }

  /**
   * Handle WebSocket error
   */
  handleError(error) {
    this.connectionStats.errors.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack
    });
    
    // Keep only last 50 errors
    if (this.connectionStats.errors.length > 50) {
      this.connectionStats.errors = this.connectionStats.errors.slice(-50);
    }
    
    this.logger.error('WebSocket error', { error: error.message });
    this.emit('error', error);
  }

  /**
   * Update average message size
   */
  updateAverageMessageSize(messageSize) {
    if (this.connectionStats.totalMessages === 1) {
      this.connectionStats.averageMessageSize = messageSize;
    } else {
      this.connectionStats.averageMessageSize = 
        (this.connectionStats.averageMessageSize * (this.connectionStats.totalMessages - 1) + messageSize) / 
        this.connectionStats.totalMessages;
    }
  }

  /**
   * Send message to specific client
   */
  async sendToClient(clientId, message) {
    return this.executeWithMetrics(async () => {
      if (!this.wsServer) {
        throw new Error('WebSocket server is not running');
      }
      
      return this.wsServer.sendToClient(clientId, message);
    }, 'sendToClient');
  }

  /**
   * Send message to session
   */
  async sendToSession(sessionId, message) {
    return this.executeWithMetrics(async () => {
      if (!this.wsServer) {
        throw new Error('WebSocket server is not running');
      }
      
      return this.wsServer.sendToSession(sessionId, message);
    }, 'sendToSession');
  }

  /**
   * Broadcast message to all clients
   */
  async broadcast(message, options = {}) {
    return this.executeWithMetrics(async () => {
      if (!this.wsServer) {
        throw new Error('WebSocket server is not running');
      }
      
      return this.wsServer.broadcast(message, options);
    }, 'broadcast');
  }

  /**
   * Send overlay update
   */
  async sendOverlayUpdate(data) {
    return this.executeWithMetrics(async () => {
      if (!this.wsServer) {
        throw new Error('WebSocket server is not running');
      }
      
      this.wsServer.sendOverlayUpdate(data);
    }, 'sendOverlayUpdate');
  }

  /**
   * Send game state update
   */
  async sendGameStateUpdate(data) {
    return this.executeWithMetrics(async () => {
      if (!this.wsServer) {
        throw new Error('WebSocket server is not running');
      }
      
      this.wsServer.sendGameStateUpdate(data);
    }, 'sendGameStateUpdate');
  }

  /**
   * Send player action update
   */
  async sendPlayerActionUpdate(data) {
    return this.executeWithMetrics(async () => {
      if (!this.wsServer) {
        throw new Error('WebSocket server is not running');
      }
      
      this.wsServer.sendPlayerActionUpdate(data);
    }, 'sendPlayerActionUpdate');
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    if (!this.wsServer) {
      return null;
    }
    
    return this.wsServer.getSessionStats(sessionId);
  }

  /**
   * Get all session statistics
   */
  getAllSessionStats() {
    if (!this.wsServer) {
      return {};
    }
    
    return this.wsServer.getAllSessionStats();
  }

  /**
   * Get client information
   */
  getClientInfo(clientId) {
    if (!this.wsServer) {
      return null;
    }
    
    const stats = this.wsServer.getStats();
    
    // Find client in session stats
    for (const [sessionId, sessionStats] of Object.entries(stats.sessionStats || {})) {
      const client = sessionStats.clients.find(c => c.id === clientId);
      if (client) {
        return {
          ...client,
          sessionId
        };
      }
    }
    
    return null;
  }

  /**
   * Get all connected clients
   */
  getAllClients() {
    if (!this.wsServer) {
      return [];
    }
    
    const stats = this.wsServer.getStats();
    const allClients = [];
    
    for (const [sessionId, sessionStats] of Object.entries(stats.sessionStats || {})) {
      for (const client of sessionStats.clients) {
        allClients.push({
          ...client,
          sessionId
        });
      }
    }
    
    return allClients;
  }

  /**
   * Force flush all pending messages
   */
  async flushAllMessages() {
    if (!this.wsServer) {
      return;
    }
    
    this.wsServer.flushAllMessages();
  }

  /**
   * Get WebSocket health checks
   */
  async getHealthChecks() {
    const checks = await super.getHealthChecks();
    
    try {
      if (this.wsServer) {
        const wsHealth = await this.wsServer.healthCheck();
        
        checks.websocket = {
          status: wsHealth.status,
          message: wsHealth.status === 'healthy' ? 'WebSocket server healthy' : 'WebSocket server unhealthy',
          details: wsHealth
        };
      } else {
        checks.websocket = {
          status: 'unhealthy',
          message: 'WebSocket server is not running'
        };
      }
      
      // Check connection metrics
      checks.connections = {
        status: this.connectionStats.activeConnections >= 0 ? 'healthy' : 'unhealthy',
        message: `${this.connectionStats.activeConnections} active connections`,
        details: {
          totalConnections: this.connectionStats.totalConnections,
          activeConnections: this.connectionStats.activeConnections,
          totalMessages: this.connectionStats.totalMessages
        }
      };
      
      // Check error rate
      const errorRate = this.connectionStats.totalMessages > 0 
        ? (this.connectionStats.errors.length / this.connectionStats.totalMessages * 100)
        : 0;
      
      checks.errors = {
        status: errorRate < 5 ? 'healthy' : errorRate < 10 ? 'degraded' : 'unhealthy',
        message: `${errorRate.toFixed(2)}% error rate`,
        details: {
          errorCount: this.connectionStats.errors.length,
          errorRate: errorRate.toFixed(2)
        }
      };
      
    } catch (error) {
      checks.websocket = {
        status: 'unhealthy',
        message: error.message
      };
    }
    
    return checks;
  }

  /**
   * Get WebSocket statistics
   */
  getWebSocketStats() {
    const wsStats = this.wsServer ? this.wsServer.getStats() : null;
    
    return {
      connectionStats: this.connectionStats,
      serverStats: wsStats,
      sessionStats: this.getAllSessionStats()
    };
  }

  /**
   * Reset connection statistics
   */
  resetConnectionStats() {
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      totalBatches: 0,
      averageMessageSize: 0,
      messageTypes: {},
      errors: []
    };
    
    if (this.wsServer) {
      this.wsServer.resetStats();
    }
    
    this.logger.info('WebSocket connection statistics reset');
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    const baseMetrics = super.getMetrics();
    
    return {
      ...baseMetrics,
      websocket: this.getWebSocketStats()
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config) {
    const errors = super.validateConfig(config);
    
    if (config.port !== undefined && (config.port < 1 || config.port > 65535)) {
      errors.push('Port must be between 1 and 65535');
    }
    
    if (config.maxConnections !== undefined && config.maxConnections < 1) {
      errors.push('Max connections must be at least 1');
    }
    
    if (config.heartbeatInterval !== undefined && config.heartbeatInterval < 1000) {
      errors.push('Heartbeat interval must be at least 1000ms');
    }
    
    return errors;
  }
}

module.exports = WebSocketService;
