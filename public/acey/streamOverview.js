import { speakBrowser, playServerTTS } from './aceyTTS.js';
import { aceyPhrases } from './aceyPhrases.js';

function choice(arr = []) {
  return arr[Math.floor(Math.random() * arr.length)] || '';
}

export class StreamOverview {
  constructor(session, ws, userIsUltra, options = {}) {
    this.session = session || { memory: [], dynamicMemory: [] };
    this.ws = ws;
    this.userIsUltra = Boolean(userIsUltra);

    this.streakThreshold = options.streakThreshold ?? 2;
    this.trashTalkThreshold = options.trashTalkThreshold ?? 3;
    this.summaryInterval = options.summaryInterval ?? 5 * 60 * 1000;
    this.lastSummaryTime = Date.now();

    this.summaryTimer = setInterval(() => this.periodicSummary(), this.summaryInterval);
  }

  destroy() {
    clearInterval(this.summaryTimer);
  }

  checkPeakEvent(event = {}) {
    if (!event || typeof event !== 'object') return;

    if (event.type === 'win') {
      const streak = this.getConsecutiveWins(event.player);
      if (streak >= this.streakThreshold) {
        this.sendOverlay(`${event.player} is on a hot streak! ${streak} wins in a row! 🔥`, 'playful', 'peak');
      }
    }

    if (event.type === 'specialCard') {
      this.sendOverlay(`Whoa, ${event.player} just pulled the ${event.card}! 😲`, 'playful', 'peak');
    }

    if (event.type === 'trashTalk') {
      const count = this.getTrashTalkCount(event.user);
      if (count >= this.trashTalkThreshold) {
        this.sendOverlay(`Careful ${event.user} 😏 you’re pushing your luck!`, 'savage', 'peak');
      }
    }
  }

  periodicSummary() {
    const now = Date.now();
    if (now - this.lastSummaryTime < this.summaryInterval) return;
    this.lastSummaryTime = now;

    const events = this.session.memory || [];
    const chatEvents = events.filter((e) => e.type === 'chat');
    const userCounts = {};
    chatEvents.forEach((e) => {
      if (!e.user) return;
      userCounts[e.user] = (userCounts[e.user] || 0) + 1;
    });
    const topChatters = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([user]) => user);

    const wins = events.filter((e) => e.type === 'win');
    const losses = events.filter((e) => e.type === 'loss');
    const streaks = this.detectAllStreaks();

    let summary = `Stream Update: ${wins.length} hands won, ${losses.length} hands lost. `;
    if (topChatters.length) summary += `Top chatters: ${topChatters.join(', ')}. `;
    if (streaks.length) {
      summary += streaks.map((s) => `${s.player} has a streak of ${s.count} wins!`).join(' ');
    }

    if (Array.isArray(this.session.dynamicMemory) && this.session.dynamicMemory.length) {
      const randomPhrase = choice(this.session.dynamicMemory);
      if (randomPhrase?.text) {
        summary += ` Quote from chat: "${randomPhrase.text}" 😉`;
      }
    }

    this.sendOverlay(summary.trim(), 'playful', 'summary');
  }

  sendOverlay(text, tone = 'playful', type = 'message') {
    if (!text) return;

    if (this.ws && typeof this.ws.send === 'function') {
      this.ws.send(JSON.stringify({ source: 'acey', text, tone, type }));
    }

    if (type === 'peak' || type === 'summary') {
      this.playVoice(text, tone);
    }
  }

  playVoice(text, tone) {
    if (!text) return;
    if (this.userIsUltra) playServerTTS(text, { tone });
    else speakBrowser(text);
  }

  getConsecutiveWins(player) {
    const events = this.session.memory || [];
    let count = 0;
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const entry = events[i];
      if (entry.type === 'win' && entry.player === player) count += 1;
      else if (entry.type === 'win') break;
    }
    return count;
  }

  detectAllStreaks() {
    const events = this.session.memory || [];
    const streaks = {};
    let lastPlayer = null;
    let streakCount = 0;

    events.forEach((e) => {
      if (e.type === 'win') {
        if (e.player === lastPlayer) streakCount += 1;
        else streakCount = 1;
        lastPlayer = e.player;
        streaks[e.player] = Math.max(streaks[e.player] || 0, streakCount);
      }
    });

    return Object.entries(streaks).map(([player, count]) => ({ player, count }));
  }

  getTrashTalkCount(user) {
    const events = this.session.memory || [];
    return events.filter((e) => e.type === 'trashTalk' && e.user === user).length;
  }

  static generateResponse(text = '') {
    const lower = text.toLowerCase();
    if (lower.includes('win')) return choice(aceyPhrases.flirty);
    if (lower.includes('lose') || lower.includes('trash')) return choice(aceyPhrases.savage);
    return choice(aceyPhrases.playful);
  }
}
