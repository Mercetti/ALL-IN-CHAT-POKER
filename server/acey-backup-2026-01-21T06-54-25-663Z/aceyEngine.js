const EventEmitter = require('events');

class AceyEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.logger = options.logger || console;
    this.useAI = options.useAI !== false;
    this.sessions = new Map();
    this.memorySnapshots = [];
    this.startTime = Date.now();
    this.overlayConfig = null;
    this.logger.info?.('AceyEngine ready', { useAI: this.useAI });
  }

  getSession(sessionId = 'default') {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        chat: [],
        events: [],
        createdAt: Date.now()
      });
    }
    return this.sessions.get(sessionId);
  }

  addChatMessage(payload = {}) {
    const sessionId = payload.sessionId || 'default';
    const session = this.getSession(sessionId);
    session.chat.push({
      text: payload.text || '',
      from: payload.from || 'player',
      timestamp: Date.now()
    });

    this.emitOverlay(sessionId, {
      type: 'chat',
      text: payload.text,
      from: payload.from || 'player'
    });
  }

  addGameEvent(sessionId = 'default', payload = {}) {
    return this.processEvent(sessionId, payload);
  }

  processEvent(sessionId = 'default', payload = {}) {
    const session = this.getSession(sessionId);
    session.events.push({ ...payload, timestamp: Date.now() });

    if (payload.type === 'win' || payload.type === 'lose') {
      const tone = payload.type === 'win' ? 'excited' : 'supportive';
      const prefix = payload.type === 'win' ? 'Nice hit' : 'Tough break';
      const text = `${prefix} ${payload.player || 'player'}!`;

      this.emitOverlay(sessionId, {
        type: 'message',
        text,
        tone,
        winnings: payload.winnings || 0,
        player: payload.player
      });
    }
  }

  emitOverlay(sessionId, data) {
    this.emit('overlay', {
      sessionId,
      ...data,
      timestamp: Date.now()
    });
  }

  captureMemory(snapshot) {
    this.memorySnapshots.push({
      ...snapshot,
      timestamp: Date.now()
    });
    this.emit('dynamicMemory', snapshot);
  }

  /**
   * Get current state of all sessions
   */
  getCurrentState() {
    const state = {
      sessions: {},
      timestamp: Date.now(),
      totalSessions: this.sessions.size
    };

    this.sessions.forEach((session, sessionId) => {
      state.sessions[sessionId] = {
        chat: session.chat,
        events: session.events,
        createdAt: session.createdAt,
        lastActivity: Math.max(
          ...session.chat.map(c => c.timestamp),
          ...session.events.map(e => e.timestamp)
        ) || session.createdAt
      };
    });

    return state;
  }

  /**
   * Get player information
   */
  getPlayerInfo(playerId) {
    // Search through all sessions for player data
    for (const [sessionId, session] of this.sessions) {
      const playerEvents = session.events.filter(e => e.player === playerId);
      const playerChats = session.chat.filter(c => c.from === playerId);
      
      if (playerEvents.length > 0 || playerChats.length > 0) {
        return {
          playerId,
          sessionId,
          events: playerEvents,
          chats: playerChats,
          totalWins: playerEvents.filter(e => e.type === 'win').length,
          totalLosses: playerEvents.filter(e => e.type === 'lose').length,
          lastSeen: Math.max(
            ...playerEvents.map(e => e.timestamp),
            ...playerChats.map(c => c.timestamp)
          )
        };
      }
    }

    return null;
  }

  /**
   * Update overlay configuration
   */
  updateOverlayConfig(config) {
    this.overlayConfig = {
      ...this.overlayConfig,
      ...config,
      updatedAt: Date.now()
    };

    this.emit('overlayConfigUpdated', {
      config: this.overlayConfig,
      timestamp: Date.now()
    });

    return this.overlayConfig;
  }

  /**
   * Get engine statistics
   */
  getStats() {
    const now = Date.now();
    const totalEvents = Array.from(this.sessions.values())
      .reduce((total, session) => total + session.events.length, 0);
    
    const totalChats = Array.from(this.sessions.values())
      .reduce((total, session) => total + session.chat.length, 0);

    return {
      uptime: now - (this.startTime || now),
      totalSessions: this.sessions.size,
      totalEvents,
      totalChats,
      memorySnapshots: this.memorySnapshots.length,
      overlayConfig: this.overlayConfig || null
    };
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId,
      chatCount: session.chat.length,
      eventCount: session.events.length,
      createdAt: session.createdAt,
      lastActivity: Math.max(
        ...session.chat.map(c => c.timestamp),
        ...session.events.map(e => e.timestamp)
      ) || session.createdAt
    };
  }

  /**
   * Get all session statistics
   */
  getAllSessionStats() {
    const stats = {};
    this.sessions.forEach((session, sessionId) => {
      stats[sessionId] = this.getSessionStats(sessionId);
    return stats;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const now = Date.now();
    const stats = this.getStats();
    
    return {
      status: 'healthy',
      timestamp: now,
      uptime: stats.uptime,
      memoryUsage: process.memoryUsage(),
      sessionCount: stats.totalSessions,
      eventCount: stats.totalEvents,
      chatCount: stats.totalChats
    };
  }

  stop() {
    this.sessions.clear();
    this.memorySnapshots = [];
    this.overlayConfig = null;
  }
}

// Create and export a default instance
const defaultInstance = new AceyEngine({ useAI: true });

// Export both the class and a default instance
module.exports = {
  AceyEngine,
  defaultInstance,
  // Export static methods for testing
  getStats: defaultInstance.getStats.bind(defaultInstance),
  healthCheck: defaultInstance.healthCheck.bind(defaultInstance),
  getCurrentState: defaultInstance.getCurrentState.bind(defaultInstance),
  getPlayerInfo: defaultInstance.getPlayerInfo.bind(defaultInstance),
  updateOverlayConfig: defaultInstance.updateOverlayConfig.bind(defaultInstance)
};