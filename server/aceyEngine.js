const EventEmitter = require('events');
const Logger = require('./logger');
const { aceyPhrases } = require('./aceyPhrases');

const BLOCKLIST = ['idiot', 'stupid', 'hate', 'kill'];

const PEAK_STREAK_THRESHOLD = 2;
const TRASH_TALK_THRESHOLD = 3;
const SUMMARY_INTERVAL_MS = 5 * 60 * 1000;
const MAX_MEMORY_ITEMS = 500;
const MAX_DYNAMIC_PER_TONE = 50;

function randomChoice(arr = []) {
  return arr[Math.floor(Math.random() * arr.length)] || '';
}

function sanitize(text = '') {
  let sanitized = text.replace(/\s+/g, ' ').trim();
  BLOCKLIST.forEach((word) => {
    const pattern = new RegExp(word, 'ig');
    sanitized = sanitized.replace(pattern, '');
  });
  return sanitized.trim();
}

function normalize(text = '') {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

class AceyEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.logger = options.logger || new Logger('acey-engine');
    this.summaryInterval = options.summaryInterval || SUMMARY_INTERVAL_MS;
    this.sessions = new Map();
    this.summaryTimer = setInterval(() => this.tickSummaries(), 60 * 1000).unref?.();
  }

  stop() {
    clearInterval(this.summaryTimer);
  }

  getSession(sessionId = 'default') {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        memory: [],
        dynamicMemory: [],
        moodCounters: { trashTalk: 0, positiveEvents: 0 },
        trashTalkByUser: new Map(),
        lastSummaryAt: Date.now(),
      });
    }
    return this.sessions.get(sessionId);
  }

  addChatMessage(sessionId, payload = {}) {
    const session = this.getSession(sessionId);
    const text = sanitize(payload.text || '');
    if (!text) return;
    const tone = this.detectTone(text);
    const entry = {
      type: 'chat',
      text,
      tone,
      user: payload.user || 'anonymous',
      timestamp: Date.now(),
    };
    this.addMemory(session, entry);

    if (tone === 'savage') {
      const current = session.trashTalkByUser.get(entry.user) || 0;
      session.trashTalkByUser.set(entry.user, current + 1);
      session.moodCounters.trashTalk += 1;
      if (current + 1 >= TRASH_TALK_THRESHOLD) {
        this.emitOverlay(session, `Careful ${entry.user} 😏 you’re pushing your luck!`, 'savage', 'peak');
      }
    } else {
      session.moodCounters.positiveEvents += 1;
    }

    if (this.isNovelPhrase(session, text)) {
      const learned = { text, tone, source: 'chat', timestamp: Date.now() };
      this.addDynamicPhrase(session, learned);
    }

    this.emit('memory', { sessionId, memory: entry });
  }

  addGameEvent(sessionId, event = {}) {
    const session = this.getSession(sessionId);
    const entry = { ...event, timestamp: Date.now() };
    this.addMemory(session, entry);
    this.emit('memory', { sessionId, memory: entry });

    if (event.type === 'win') {
      const streak = this.getConsecutiveWins(session, event.player);
      if (streak >= PEAK_STREAK_THRESHOLD) {
        this.emitOverlay(session, `${event.player} is on a hot streak! ${streak} wins in a row! 🔥`, 'playful', 'peak');
      }
      const dealerLine = this.formatDealerLine('win', event.player);
      if (dealerLine) this.emitOverlay(session, dealerLine, 'playful', 'message');
    }

    if (event.type === 'lose') {
      const dealerLine = this.formatDealerLine('lose', event.player);
      if (dealerLine) this.emitOverlay(session, dealerLine, 'savage', 'message');
    }

    if (event.type === 'specialCard') {
      const dealerLine = this.formatDealerLine('specialCard', event.player, event.card);
      if (dealerLine) this.emitOverlay(session, dealerLine, 'playful', 'peak');
      const learned = {
        text: `Whoa, {player} just pulled ${event.card}!`,
        tone: 'playful',
        source: 'game',
        timestamp: Date.now(),
      };
      this.addDynamicPhrase(session, learned);
    }
  }

  emitOverlay(session, text, tone = 'playful', type = 'message') {
    if (!text) return;
    this.emit('overlay', {
      sessionId: session.id,
      payload: {
        source: 'acey',
        text,
        tone,
        type,
      },
    });
  }

  addMemory(session, entry) {
    session.memory.push(entry);
    if (session.memory.length > MAX_MEMORY_ITEMS) {
      session.memory.shift();
    }
  }

  isNovelPhrase(session, text) {
    const normalized = normalize(text);
    if (!normalized) return false;
    return !session.dynamicMemory.some((p) => normalize(p.text) === normalized);
  }

  addDynamicPhrase(session, phrase) {
    if (!phrase.text) return;
    session.dynamicMemory.push(phrase);
    this.enforceDynamicLimit(session, phrase.tone);
    this.emit('dynamicMemory', { sessionId: session.id, dynamicMemory: phrase });
  }

  enforceDynamicLimit(session, tone) {
    const items = session.dynamicMemory.filter((p) => p.tone === tone);
    if (items.length <= MAX_DYNAMIC_PER_TONE) return;
    const overflow = items.length - MAX_DYNAMIC_PER_TONE;
    for (let i = 0; i < overflow; i += 1) {
      const index = session.dynamicMemory.findIndex((p) => p.tone === tone);
      if (index >= 0) session.dynamicMemory.splice(index, 1);
    }
  }

  detectTone(text = '') {
    const lower = text.toLowerCase();
    if (/\b(win|nice|gg|love|hot)\b/.test(lower)) return 'flirty';
    if (/\b(lose|noob|trash|suck|bad)\b/.test(lower)) return 'savage';
    return 'playful';
  }

  formatDealerLine(type, player = '', card = '') {
    const pool = aceyPhrases.dealer?.[type];
    if (!pool || !pool.length) return null;
    return randomChoice(pool)
      .replace(/{player}/g, player || 'Player')
      .replace(/{card}/g, card || 'a wild card');
  }

  getConsecutiveWins(session, player) {
    if (!player) return 0;
    let count = 0;
    for (let i = session.memory.length - 1; i >= 0; i -= 1) {
      const entry = session.memory[i];
      if (entry.type === 'win' && entry.player === player) count += 1;
      else if (entry.type === 'win') break;
    }
    return count;
  }

  tickSummaries() {
    const now = Date.now();
    this.sessions.forEach((session) => {
      if (now - session.lastSummaryAt >= this.summaryInterval) {
        session.lastSummaryAt = now;
        const summary = this.buildSummary(session);
        if (summary) this.emitOverlay(session, summary, 'playful', 'summary');
      }
    });
  }

  buildSummary(session) {
    const wins = session.memory.filter((e) => e.type === 'win');
    const losses = session.memory.filter((e) => e.type === 'loss');
    const chatEvents = session.memory.filter((e) => e.type === 'chat');
    const userCounts = {};
    chatEvents.forEach((e) => {
      if (!e.user) return;
      userCounts[e.user] = (userCounts[e.user] || 0) + 1;
    });
    const topChatters = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([user]) => user);

    const streaks = this.detectAllStreaks(session);

    let summary = `Stream Update: ${wins.length} hands won, ${losses.length} hands lost.`;
    if (topChatters.length) summary += ` Top chatters: ${topChatters.join(', ')}.`;
    if (streaks.length) {
      summary += ` ${streaks.map((s) => `${s.player} has a streak of ${s.count} wins!`).join(' ')}`;
    }

    if (session.dynamicMemory.length) {
      const quote = randomChoice(session.dynamicMemory);
      if (quote?.text) summary += ` Quote from chat: "${quote.text}" 😉`;
    }

    return summary;
  }

  detectAllStreaks(session) {
    const streaks = {};
    let lastPlayer = null;
    let streakCount = 0;
    session.memory.forEach((entry) => {
      if (entry.type === 'win') {
        if (entry.player === lastPlayer) streakCount += 1;
        else streakCount = 1;
        lastPlayer = entry.player;
        streaks[entry.player] = Math.max(streaks[entry.player] || 0, streakCount);
      }
    });
    return Object.entries(streaks).map(([player, count]) => ({ player, count }));
  }
}

module.exports = {
  AceyEngine,
};
