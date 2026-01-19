/**
 * Acey WebSocket Bridge
 * Handles WebSocket connections for Acey overlay
 */

const WebSocket = require('ws');
const Logger = require('./logger');
const AceyEngine = require('./aceyEngine');

const logger = new Logger('acey-websocket');

class AceyWebSocket {
  constructor(options = {}) {
    this.wss = null;
    this.aceyEngine = new AceyEngine({ 
      logger: new Logger('acey-engine'),
      useAI: true 
    });
    this.path = options.path || '/acey';
    
    // Session isolation: Map<sessionId, Set<WebSocket>>
    this.sessionClients = new Map();
    this.clientSessions = new Map(); // Map<WebSocket, sessionId>
    
    // Always attach to main HTTP server
    this.server = options.server;
    
    // Forward Acey events to WebSocket clients
    this.aceyEngine.on('overlay', (data) => {
      if (this.wss) this.broadcast({ 
        type: 'overlay', 
        data,
        sessionId: data.sessionId 
      });
    });
    
    this.aceyEngine.on('dynamicMemory', (data) => {
      if (this.wss) this.broadcast({ 
        type: 'dynamicMemory', 
        data,
        sessionId: data.sessionId 
      });
    });
  }

  start() {
    // Always create WebSocket server attached to main HTTP server
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: this.path
    });

    logger.info('Acey WebSocket server attached to main HTTP server', { path: this.path });

    this.wss.on('connection', (ws, req) => {
      logger.info('Acey WebSocket client connected', { 
        ip: req.socket.remoteAddress 
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        data: { message: 'Acey WebSocket connected' },
        timestamp: Date.now()
      }));

      // Handle client disconnect
      ws.on('close', () => {
        this.removeClientFromSession(ws);
        logger.info('Acey WebSocket client disconnected');
      });

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', { 
            error: error.message,
            data: data.toString()
          });
        }
      });

      ws.on('error', (error) => {
        logger.error('Acey WebSocket error', { error: error.message });
        this.removeClientFromSession(ws);
      });
    });
  }

  async handleMessage(ws, message) {
    const { type, sessionId = 'default', data } = message;

    // Validate session ownership for game events
    if (type === 'gameEvent') {
      if (!this.validateSessionOwnership(ws, sessionId)) {
        logger.warn('Session ownership validation failed', { 
          type, 
          sessionId, 
          clientIp: ws._socket.remoteAddress 
        });
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unauthorized session access',
          code: 'SESSION_VALIDATION_FAILED'
        }));
        return;
      }
    }

    switch (type) {
      case 'joinSession':
        // Allow clients to join a specific session
        this.addClientToSession(ws, sessionId);
        ws.send(JSON.stringify({
          type: 'sessionJoined',
          data: { sessionId },
          timestamp: Date.now()
        }));
        break;
        
      case 'gameEvent':
        await this.aceyEngine.processEvent(sessionId, data);
        break;
      
      case 'ping':
        ws.send(JSON.stringify({ 
        type: 'pong', 
        data: { timestamp: Date.now() },
        timestamp: Date.now() 
      }));
        break;
      
      default:
        logger.warn('Unknown message type', { type });
    }
  }

  broadcast(message) {
    if (!this.wss) return;

    const payload = JSON.stringify(message);
    
    // If message has sessionId, only send to clients in that session
    if (message.sessionId) {
      const sessionClients = this.sessionClients.get(message.sessionId);
      if (sessionClients) {
        sessionClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
        logger.debug('Broadcast to session', { 
          sessionId: message.sessionId, 
          clientCount: sessionClients.size 
        });
      }
    } else {
      // For messages without sessionId, send to all clients (system messages)
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
      logger.debug('Broadcast to all clients', { 
        clientCount: this.wss.clients.size 
      });
    }
  }

  // Session management methods
  addClientToSession(ws, sessionId) {
    // Remove client from any existing session first
    this.removeClientFromSession(ws);
    
    // Add to new session
    if (!this.sessionClients.has(sessionId)) {
      this.sessionClients.set(sessionId, new Set());
    }
    this.sessionClients.get(sessionId).add(ws);
    this.clientSessions.set(ws, sessionId);
    
    logger.info('Client added to session', { sessionId });
  }

  removeClientFromSession(ws) {
    const sessionId = this.clientSessions.get(ws);
    if (sessionId) {
      const sessionClients = this.sessionClients.get(sessionId);
      if (sessionClients) {
        sessionClients.delete(ws);
        if (sessionClients.size === 0) {
          this.sessionClients.delete(sessionId);
        }
      }
      this.clientSessions.delete(ws);
      logger.info('Client removed from session', { sessionId });
    }
  }

  validateSessionOwnership(ws, sessionId) {
    const clientSession = this.clientSessions.get(ws);
    return clientSession === sessionId;
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      this.aceyEngine.stop();
      logger.info('Acey WebSocket server stopped');
    }
  }
}

module.exports = { AceyWebSocket };
