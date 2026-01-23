/**
 * WebSocket Enhanced - Simplified Version
 * Enhanced WebSocket functionality
 */

const logger = require('./logger');

class WebSocketEnhanced {
  constructor(options = {}) {
    this.clients = new Map();
    this.rooms = new Map();
    this.stats = { connections: 0, messages: 0, rooms: 0 };
  }

  /**
   * Initialize enhanced WebSocket
   */
  async initialize() {
    logger.info('WebSocket Enhanced initialized');
    return true;
  }

  /**
   * Add client
   */
  addClient(clientId, socket) {
    this.clients.set(clientId, {
      socket,
      joinedAt: new Date(),
      rooms: new Set()
    });
    this.stats.connections++;
    
    logger.debug('Client added', { clientId });
  }

  /**
   * Remove client
   */
  removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from all rooms
      client.rooms.forEach(room => {
        this.leaveRoom(clientId, room);
      });
      
      this.clients.delete(clientId);
      this.stats.connections--;
      
      logger.debug('Client removed', { clientId });
    }
  }

  /**
   * Join room
   */
  joinRoom(clientId, room) {
    const client = this.clients.get(clientId);
    if (client) {
      client.rooms.add(room);
      
      if (!this.rooms.has(room)) {
        this.rooms.set(room, new Set());
        this.stats.rooms++;
      }
      
      this.rooms.get(room).add(clientId);
      
      logger.debug('Client joined room', { clientId, room });
    }
  }

  /**
   * Leave room
   */
  leaveRoom(clientId, room) {
    const client = this.clients.get(clientId);
    if (client && client.rooms.has(room)) {
      client.rooms.delete(room);
      
      const roomClients = this.rooms.get(room);
      if (roomClients) {
        roomClients.delete(clientId);
        
        if (roomClients.size === 0) {
          this.rooms.delete(room);
          this.stats.rooms--;
        }
      }
      
      logger.debug('Client left room', { clientId, room });
    }
  }

  /**
   * Send message to room
   */
  sendToRoom(room, message) {
    const roomClients = this.rooms.get(room);
    if (roomClients) {
      this.stats.messages++;
      
      roomClients.forEach(clientId => {
        const client = this.clients.get(clientId);
        if (client && client.socket) {
          try {
            client.socket.send(JSON.stringify(message));
          } catch (error) {
            logger.error('Failed to send message to client', { clientId, error: error.message });
          }
        }
      });
    }
  }

  /**
   * Get enhanced status
   */
  getStatus() {
    return {
      stats: this.stats,
      clients: this.clients.size,
      rooms: this.rooms.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = WebSocketEnhanced;
