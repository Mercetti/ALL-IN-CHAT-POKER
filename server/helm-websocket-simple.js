/**
 * Helm WebSocket Server - Simplified Version
 * Basic WebSocket functionality for Helm control
 */

const WebSocket = require('ws');
const crypto = require('crypto');

// Helper functions
function extractUserLogin(req) {
  return req.headers['x-user-login'] || req.query?.user || 'anonymous';
}

function getChannelFromSocket(req) {
  return req.headers['x-channel'] || req.query?.channel || 'default';
}

class HelmWebSocketServer {
  constructor(options = {}) {
    this.port = options.port || 0; // Use 0 for dynamic port allocation
    this.path = options.path || '/helm-ws';
    this.logger = options.logger || console;
    this.clients = new Map();
    this.wss = null;
    this.actualPort = null;
    this.initialize();
  }

  initialize() {
    try {
      this.wss = new WebSocket.Server({
        port: this.port,
        path: this.path
      });

      // Get the actual port assigned
      if (this.port === 0) {
        this.actualPort = this.wss.address().port;
      } else {
        this.actualPort = this.port;
      }

      this.setupEventHandlers();
      this.logger.info?.(`🔗 Helm WebSocket server initialized on port: ${this.actualPort}, path: ${this.path}`);
    } catch (error) {
      this.logger.error?.('Failed to initialize Helm WebSocket server:', error);
      throw error;
    }
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
        sessionId: crypto.randomUUID(),
        connectedAt: Date.now(),
        lastActivity: Date.now()
      };

      // Store client
      this.clients.set(client.sessionId, client);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        sessionId: client.sessionId,
        message: 'Connected to Helm Control engine',
        timestamp: Date.now()
      }));

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
      
      const message = JSON.parse(data.toString());
      
      this.logger.debug?.(`🔗 Message from ${client.userLogin}:`, message);

      // Handle different message types
      switch (message.type) {
        case 'ping':
          client.ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
          break;
          
        case 'helm_command':
          await this.handleHelmCommand(client, message);
          break;
          
        default:
          client.ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
            originalType: message.type,
            timestamp: Date.now()
          }));
      }
    } catch (error) {
      this.logger.error?.('🔗 Error handling message:', error);
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message',
        timestamp: Date.now()
      }));
    }
  }

  async handleHelmCommand(client, message) {
    try {
      // Simplified Helm command handling
      const response = {
        type: 'helm_response',
        command: message.command,
        result: 'Command processed successfully',
        timestamp: Date.now()
      };

      client.ws.send(JSON.stringify(response));
    } catch (error) {
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to execute Helm command',
        command: message.command,
        timestamp: Date.now()
      }));
    }
  }

  handleDisconnection(client) {
    if (client && client.sessionId) {
      this.clients.delete(client.sessionId);
      this.logger.info?.(`🔗 Client disconnected: ${client.userLogin} (${client.sessionId})`);
    }
  }

  // Health check endpoint
  getStatus() {
    return {
      status: 'running',
      port: this.actualPort || this.port,
      path: this.path,
      connectedClients: this.clients.size,
      uptime: process.uptime(),
      timestamp: Date.now()
    };
  }

  // Get the actual port (useful for dynamic port allocation)
  getPort() {
    return this.actualPort || this.port;
  }

  // Broadcast message to all clients
  broadcast(message) {
    const data = JSON.stringify({
      ...message,
      timestamp: Date.now()
    });

    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }

  // Close server
  close() {
    if (this.wss) {
      this.wss.close();
      this.logger.info?.('🔗 Helm WebSocket server closed');
    }
  }
}

module.exports = HelmWebSocketServer;
