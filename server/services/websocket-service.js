/**
 * WebSocket Service - Simplified Version
 * Basic WebSocket service functionality
 */

const logger = require('../utils/logger');

class WebSocketService {
  constructor(options = {}) {
    this.options = options;
    this.isInitialized = false;
    this.clients = new Map();
    this.rooms = new Map();
    this.stats = { connections: 0, messages: 0, rooms: 0, errors: 0 };
  }

  /**
   * Initialize WebSocket service
   */
  async initialize() {
    logger.info('WebSocket Service initialized');
    this.isInitialized = true;
    return true;
  }

  /**
   * Add client
   */
  addClient(clientId, socket) {
    try {
      const client = {
        id: clientId,
        socket: socket,
        connectedAt: new Date(),
        lastActivity: new Date(),
        rooms: new Set(),
        messages: 0
      };

      this.clients.set(clientId, client);
      this.stats.connections++;

      logger.info('WebSocket client added', { clientId });

      return {
        success: true,
        client
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to add WebSocket client', { clientId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove client
   */
  removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (!client) {
      return { success: false, message: 'Client not found' };
    }

    try {
      client.rooms.forEach(room => {
        this.leaveRoom(clientId, room);
      });

      this.clients.delete(clientId);
      this.stats.connections--;

      logger.info('WebSocket client removed', { clientId });

      return {
        success: true,
        message: 'Client removed successfully'
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to remove WebSocket client', { clientId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Join room
   */
  joinRoom(clientId, room) {
    const client = this.clients.get(clientId);
    if (!client) {
      return { success: false, message: 'Client not found' };
    }

    try {
      client.rooms.add(room);
      client.lastActivity = new Date();

      if (!this.rooms.has(room)) {
        this.rooms.set(room, new Set());
        this.stats.rooms++;
      }

      this.rooms.get(room).add(clientId);

      logger.debug('Client joined room', { clientId, room });

      return {
        success: true,
        room,
        members: this.rooms.get(room).size
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to join room', { clientId, room, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Leave room
   */
  leaveRoom(clientId, room) {
    const client = this.clients.get(clientId);
    if (!client || !client.rooms.has(room)) {
      return { success: false, message: 'Client not in room' };
    }

    try {
      client.rooms.delete(room);
      client.lastActivity = new Date();

      const roomClients = this.rooms.get(room);
      if (roomClients) {
        roomClients.delete(clientId);

        if (roomClients.size === 0) {
          this.rooms.delete(room);
          this.stats.rooms--;
        }
      }

      logger.debug('Client left room', { clientId, room });

      return {
        success: true,
        room
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to leave room', { clientId, room, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send message to client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) {
      return { success: false, message: 'Client not found' };
    }

    try {
      this.stats.messages++;
      client.messages++;
      client.lastActivity = new Date();

      const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: message,
        timestamp: new Date().toISOString()
      };

      client.socket.send(JSON.stringify(messageData));

      return {
        success: true,
        messageId: messageData.id
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to send message to client', { clientId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send message to room
   */
  sendToRoom(room, message) {
    const roomClients = this.rooms.get(room);
    if (!roomClients || roomClients.size === 0) {
      return { success: false, message: 'Room not found or empty' };
    }

    try {
      this.stats.messages++;
      const results = [];

      roomClients.forEach(clientId => {
        const result = this.sendToClient(clientId, message);
        results.push({ clientId, result });
      });

      return {
        success: true,
        room,
        sent: results.filter(r => r.result.success).length,
        failed: results.filter(r => !r.result.success).length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to send message to room', { room, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(message) {
    try {
      this.stats.messages++;
      const results = [];

      this.clients.forEach((client, clientId) => {
        const result = this.sendToClient(clientId, message);
        results.push({ clientId, result });
      });

      return {
        success: true,
        sent: results.filter(r => r.result.success).length,
        failed: results.filter(r => !r.result.success).length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to broadcast message', { error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      stats: this.stats,
      clients: this.clients.size,
      rooms: this.rooms.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get client info
   */
  getClient(clientId) {
    return this.clients.get(clientId);
  }

  /**
   * Get room info
   */
  getRoom(room) {
    const roomClients = this.rooms.get(room);
    return {
      room,
      clients: roomClients ? Array.from(roomClients) : [],
      size: roomClients ? roomClients.size : 0
    };
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService;
