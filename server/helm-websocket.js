/**
 * Helm WebSocket Server
 * Real-time communication for Helm Control engine
 * Replaces AceyWebSocket with Helm engine integration
 */

const WebSocket = require('ws');
const { extractUserLogin, getChannelFromSocket } = require('./auth');

class HelmWebSocket {
  constructor(options = {}) {
    this.server = options.server;
    this.path = options.path || '/helm';
    this.logger = options.logger || console;
    this.wss = null;
    this.clients = new Map();
    this.helmEngine = options.helmEngine;
    
    this.init();
  }

  init() {
    if (!this.server) {
      throw new Error('HTTP server is required for WebSocket initialization');
    }

    // Create WebSocket server
    this.wss = new WebSocket.Server({
      server: this.server,
      path: this.path
    });

    this.setupEventHandlers();
    this.logger.info?.(`🔗 Helm WebSocket server initialized on path: ${this.path}`);
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error) => {
      this.logger.error?.('🔗 Helm WebSocket server error:', error);
    });

    this.wss.on('close', () => {
      this.logger.info?.('🔗 Helm WebSocket server closed');
    });
  }

  async handleConnection(ws, req) {
    try {
      // Extract user information
      const userLogin = extractUserLogin(req) || 'anonymous';
      const channel = getChannelFromSocket(req) || 'default';
      
      // Create client session
      const client = {
        ws,
        userLogin,
        channel,
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        sessionId: this.generateSessionId()
      };

      this.clients.set(client.sessionId, client);

      // Send welcome message
      this.sendToClient(client, {
        type: 'connection',
        status: 'connected',
        sessionId: client.sessionId,
        message: 'Connected to Helm Control engine',
        timestamp: Date.now()
      });

      // Setup client event handlers
      ws.on('message', (data) => {
        this.handleMessage(client, data);
      });

      ws.on('close', () => {
        this.handleDisconnection(client);
      });

      ws.on('error', (error) => {
        this.logger.error?.(`🔗 WebSocket error for ${userLogin}:`, error);
        this.handleDisconnection(client);
      });

      this.logger.info?.(`🔗 Client connected: ${userLogin} (${client.sessionId})`);
    } catch (error) {
      this.logger.error?.('🔗 Error handling connection:', error);
      ws.close();
    }
  }

  async handleMessage(client, data) {
    try {
      client.lastActivity = Date.now();

      // Parse message
      const message = JSON.parse(data.toString());
      
      this.logger.debug?.(`🔗 Message from ${client.userLogin}:`, message);

      // Route message based on type
      switch (message.type) {
        case 'chat':
          await this.handleChatMessage(client, message);
          break;
          
        case 'helm_request':
          await this.handleHelmRequest(client, message);
          break;
          
        case 'persona_switch':
          await this.handlePersonaSwitch(client, message);
          break;
          
        case 'status':
          await this.handleStatusRequest(client, message);
          break;
          
        default:
          this.sendToClient(client, {
            type: 'error',
            message: `Unknown message type: ${message.type}`,
            timestamp: Date.now()
          });
      }

    } catch (error) {
      this.logger.error?.('🔗 Error handling message:', error);
      this.sendToClient(client, {
        type: 'error',
        message: 'Failed to process message',
        timestamp: Date.now()
      });
    }
  }

  async handleChatMessage(client, message) {
    if (!this.helmEngine) {
      this.sendToClient(client, {
        type: 'chat_response',
        error: 'Helm engine not available',
        timestamp: Date.now()
      });
      return;
    }

    try {
      // Process chat message through Helm engine
      const response = await this.helmEngine.processRequest({
        id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: client.userLogin,
        persona: message.persona || 'acey',
        message: message.content,
        timestamp: Date.now(),
        context: {
          source: 'websocket',
          channel: client.channel,
          sessionId: client.sessionId
        }
      });

      this.sendToClient(client, {
        type: 'chat_response',
        requestId: response.id,
        content: response.content,
        persona: response.persona,
        metadata: response.metadata,
        timestamp: Date.now()
      });

    } catch (error) {
      this.logger.error?.('🔗 Error processing chat message:', error);
      this.sendToClient(client, {
        type: 'chat_response',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  async handleHelmRequest(client, message) {
    if (!this.helmEngine) {
      this.sendToClient(client, {
        type: 'helm_response',
        error: 'Helm engine not available',
        timestamp: Date.now()
      });
      return;
    }

    try {
      const response = await this.helmEngine.processRequest(message.request);
      
      this.sendToClient(client, {
        type: 'helm_response',
        requestId: response.id,
        response: response,
        timestamp: Date.now()
      });

    } catch (error) {
      this.logger.error?.('🔗 Error processing Helm request:', error);
      this.sendToClient(client, {
        type: 'helm_response',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  async handlePersonaSwitch(client, message) {
    try {
      // Validate persona exists
      const availablePersonas = ['acey', 'professional', 'casual'];
      const persona = message.persona || 'acey';
      
      if (!availablePersonas.includes(persona)) {
        throw new Error(`Unknown persona: ${persona}`);
      }

      // Send confirmation
      this.sendToClient(client, {
        type: 'persona_switched',
        persona: persona,
        message: `Switched to ${persona} persona`,
        timestamp: Date.now()
      });

      this.logger.info?.(`🔗 Client ${client.userLogin} switched to ${persona} persona`);

    } catch (error) {
      this.sendToClient(client, {
        type: 'error',
        message: error.message,
        timestamp: Date.now()
      });
    }
  }

  async handleStatusRequest(client, message) {
    const status = {
      type: 'status',
      connected: true,
      sessionId: client.sessionId,
      userLogin: client.userLogin,
      channel: client.channel,
      connectedAt: client.connectedAt,
      lastActivity: client.lastActivity,
      helmEngine: this.helmEngine ? {
        initialized: this.helmEngine.isHealthy(),
        version: '1.0.0'
      } : null,
      timestamp: Date.now()
    };

    this.sendToClient(client, status);
  }

  handleDisconnection(client) {
    this.clients.delete(client.sessionId);
    this.logger.info?.(`🔗 Client disconnected: ${client.userLogin} (${client.sessionId})`);
  }

  sendToClient(client, data) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  broadcast(data, filter = null) {
    const message = JSON.stringify({
      ...data,
      timestamp: Date.now()
    });

    for (const client of this.clients.values()) {
      if (filter && !filter(client)) continue;
      
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    }
  }

  // Game event broadcasting (for poker integration)
  broadcastGameEvent(event, channel = 'default') {
    this.broadcast({
      type: 'game_event',
      event,
      channel
    }, client => client.channel === channel);
  }

  // System status broadcasting
  broadcastSystemStatus(status) {
    this.broadcast({
      type: 'system_status',
      status
    });
  }

  generateSessionId() {
    return `helm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get connection statistics
  getStats() {
    const now = Date.now();
    const activeClients = Array.from(this.clients.values()).filter(
      client => now - client.lastActivity < 300000 // Active within 5 minutes
    );

    return {
      totalConnections: this.clients.size,
      activeConnections: activeClients.length,
      connectionsByChannel: this.getConnectionsByChannel(),
      averageSessionDuration: this.calculateAverageSessionDuration()
    };
  }

  getConnectionsByChannel() {
    const channels = {};
    for (const client of this.clients.values()) {
      channels[client.channel] = (channels[client.channel] || 0) + 1;
    }
    return channels;
  }

  calculateAverageSessionDuration() {
    const now = Date.now();
    const durations = Array.from(this.clients.values())
      .map(client => now - client.connectedAt);
    
    if (durations.length === 0) return 0;
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  // Clean up inactive connections
  cleanup() {
    const now = Date.now();
    const inactiveThreshold = 10 * 60 * 1000; // 10 minutes

    for (const [sessionId, client] of this.clients.entries()) {
      if (now - client.lastActivity > inactiveThreshold) {
        client.ws.close();
        this.clients.delete(sessionId);
      }
    }
  }

  // Graceful shutdown
  close() {
    if (this.wss) {
      this.broadcast({
        type: 'server_shutdown',
        message: 'Helm WebSocket server shutting down',
        timestamp: Date.now()
      });

      this.wss.close(() => {
        this.logger.info?.('🔗 Helm WebSocket server closed');
    }
  }
}

module.exports = { HelmWebSocket };
