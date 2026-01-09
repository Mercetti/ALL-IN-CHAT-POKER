/**
 * Acey WebSocket Bridge
 * Handles WebSocket connections for Acey overlay
 */

const WebSocket = require('ws');
const Logger = require('./logger');
const { AceyEngine } = require('./aceyEngine');

const logger = new Logger('acey-websocket');

class AceyWebSocket {
  constructor(options = {}) {
    this.wss = null;
    this.aceyEngine = new AceyEngine({ 
      logger: new Logger('acey-engine'),
      useAI: true 
    });
    this.port = options.port || 8081;
    
    // Only start WebSocket server if not on Fly.io
    this.isLocal = process.env.NODE_ENV !== 'production' || !process.env.FLY_APP_NAME;
    
    // Forward Acey events to WebSocket clients
    this.aceyEngine.on('overlay', (data) => {
      if (this.wss) this.broadcast(data);
    });
    
    this.aceyEngine.on('dynamicMemory', (data) => {
      if (this.wss) this.broadcast({ type: 'dynamicMemory', data });
    });
  }

  start() {
    // Don't start WebSocket server on Fly.io
    if (!this.isLocal) {
      Logger('acey-websocket').info('WebSocket server disabled on Fly.io');
      return;
    }
    this.wss = new WebSocket.Server({ 
      port: this.port,
      path: '/acey'
    });

    this.wss.on('connection', (ws, req) => {
      logger.info('Acey WebSocket client connected', { 
        ip: req.socket.remoteAddress 
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Acey WebSocket connected',
        timestamp: Date.now()
      }));

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

      ws.on('close', () => {
        logger.info('Acey WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        logger.error('Acey WebSocket error', { error: error.message });
      });
    });

    logger.info('Acey WebSocket server started', { port: this.port });
  }

  async handleMessage(ws, message) {
    const { type, sessionId = 'default', data } = message;

    switch (type) {
      case 'gameEvent':
        await this.aceyEngine.processEvent(sessionId, data);
        break;
      
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      
      default:
        logger.warn('Unknown message type', { type });
    }
  }

  broadcast(message) {
    if (!this.wss) return;

    const payload = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
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
