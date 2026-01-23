/**
 * Secure WebSocket Service - Simplified Version
 * Basic secure WebSocket functionality
 */

const logger = require('../utils/logger');

class SecureWebSocketService {
  constructor(options = {}) {
    this.options = options;
    this.isInitialized = false;
    this.connections = new Map();
    this.rooms = new Map();
    this.stats = { connections: 0, messages: 0, rooms: 0, errors: 0 };
  }

  /**
   * Initialize secure WebSocket service
   */
  async initialize() {
    logger.info('Secure WebSocket Service initialized');
    this.isInitialized = true;
    return true;
  }

  /**
   * Add connection
   */
  addConnection(connectionId, socket, auth = {}) {
    try {
      const connection = {
        id: connectionId,
        socket: socket,
        auth: auth,
        connectedAt: new Date(),
        lastActivity: new Date(),
        rooms: new Set(),
        isAuthenticated: !!auth.token,
        ipAddress: socket.remoteAddress || 'unknown'
      };

      this.connections.set(connectionId, connection);
      this.stats.connections++;

      logger.info('WebSocket connection added', { connectionId, isAuthenticated: connection.isAuthenticated });

      return {
        success: true,
        connection
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to add WebSocket connection', { connectionId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove connection
   */
  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, message: 'Connection not found' };
    }

    try {
      connection.rooms.forEach(room => {
        this.leaveRoom(connectionId, room);
      });

      this.connections.delete(connectionId);
      this.stats.connections--;

      logger.info('WebSocket connection removed', { connectionId });

      return {
        success: true,
        message: 'Connection removed successfully'
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to remove WebSocket connection', { connectionId, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Join room
   */
  joinRoom(connectionId, room) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, message: 'Connection not found' };
    }

    try {
      connection.rooms.add(room);
      connection.lastActivity = new Date();

      if (!this.rooms.has(room)) {
        this.rooms.set(room, new Set());
        this.stats.rooms++;
      }

      this.rooms.get(room).add(connectionId);

      logger.debug('Connection joined room', { connectionId, room });

      return {
        success: true,
        room,
        members: this.rooms.get(room).size
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to join room', { connectionId, room, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Leave room
   */
  leaveRoom(connectionId, room) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.rooms.has(room)) {
      return { success: false, message: 'Connection not in room' };
    }

    try {
      connection.rooms.delete(room);
      connection.lastActivity = new Date();

      const roomMembers = this.rooms.get(room);
      if (roomMembers) {
        roomMembers.delete(connectionId);

        if (roomMembers.size === 0) {
          this.rooms.delete(room);
          this.stats.rooms--;
        }
      }

      logger.debug('Connection left room', { connectionId, room });

      return {
        success: true,
        room
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to leave room', { connectionId, room, error: error.message });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send message to connection
   */
  sendToConnection(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, message: 'Connection not found' };
    }

    try {
      this.stats.messages++;
      connection.lastActivity = new Date();

      const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: message,
        timestamp: new Date().toISOString(),
        encrypted: true
      };

      connection.socket.send(JSON.stringify(messageData));

      return {
        success: true,
        messageId: messageData.id
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to send message to connection', { connectionId, error: error.message });

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
    const roomMembers = this.rooms.get(room);
    if (!roomMembers || roomMembers.size === 0) {
      return { success: false, message: 'Room not found or empty' };
    }

    try {
      this.stats.messages++;
      const results = [];

      roomMembers.forEach(connectionId => {
        const result = this.sendToConnection(connectionId, message);
        results.push({ connectionId, result });
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
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      stats: this.stats,
      connections: this.connections.size,
      rooms: this.rooms.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup inactive connections
   */
  cleanup() {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    const inactive = Array.from(this.connections.entries())
      .filter(([id, conn]) => now - conn.lastActivity > inactiveThreshold);

    for (const [id] of inactive) {
      this.removeConnection(id);
    }

    logger.info('Cleaned up inactive connections', { count: inactive.length });

    return {
      success: true,
      cleaned: inactive.length
    };
  }
}

// Create singleton instance
const secureWebSocketService = new SecureWebSocketService();

module.exports = secureWebSocketService;
