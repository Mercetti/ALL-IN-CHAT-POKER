const EventEmitter = require('events');

class AceyEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.logger = options.logger || console;
    this.useAI = options.useAI !== false;
    this.sessions = new Map();
    this.memorySnapshots = [];
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

  stop() {
    this.sessions.clear();
    this.memorySnapshots = [];
  }
}

module.exports = AceyEngine;