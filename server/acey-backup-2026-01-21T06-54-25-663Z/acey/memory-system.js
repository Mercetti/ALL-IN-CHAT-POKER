/**
 * Acey Memory System - Tiers and Storage
 * Strict separation: T0 (ephemeral), T1 (session), T2 (user summary), T3 (global)
 */

const crypto = require('crypto');

class MemorySystem {
  constructor() {
    // T0 - Ephemeral Context (RAM only, never written to disk)
    this.t0Context = {
      messages: [],
      gameActions: [],
      hypeLevel: 0,
      windowSize: 30, // seconds
      maxMessages: 50
    };

    // T1 - Session Memory (soft memory, deleted at stream end)
    this.t1Session = null;
    
    // T2 - User Summary Memory (long-term, per user)
    this.t2UserMemory = new Map(); // user_id -> UserMemory
    
    // T3 - Global Memory (locked, curated)
    this.t3Global = {
      house_rules: [
        "No real-money framing",
        "No harassment escalation",
        "No gambling pressure",
        "Safety first, always"
      ],
      community_vibe: "chaotic but friendly",
      acey_persona: {
        tone: "playful",
        style: "entertainment host",
        boundaries: "strict compliance"
      },
      banned_topics: [
        "financial advice",
        "political persuasion",
        "personal data requests",
        "harmful instructions"
      ]
    };

    // Cleanup intervals
    this.t0CleanupInterval = null;
    this.trustDecayInterval = null;
    
    this.init();
  }

  init() {
    // Clean T0 context every 10 seconds
    this.t0CleanupInterval = setInterval(() => {
      this.cleanupT0Context();
    }, 10000);

    // Trust decay every hour
    this.trustDecayInterval = setInterval(() => {
      this.applyTrustDecay();
    }, 3600000);
  }

  // T0 - EPHEMERAL CONTEXT (RAM ONLY)
  addT0Message(userId, message, timestamp = Date.now()) {
    this.t0Context.messages.push({
      userId,
      message: this.sanitizeForT0(message),
      timestamp
    });

    // Keep only recent messages
    const cutoff = timestamp - (this.t0Context.windowSize * 1000);
    this.t0Context.messages = this.t0Context.messages.filter(m => m.timestamp > cutoff);
    
    // Limit total count
    if (this.t0Context.messages.length > this.t0Context.maxMessages) {
      this.t0Context.messages = this.t0Context.messages.slice(-this.t0Context.maxMessages);
    }
  }

  addT0GameAction(action, timestamp = Date.now()) {
    this.t0Context.gameActions.push({
      action,
      timestamp
    });

    // Keep only recent actions
    const cutoff = timestamp - (this.t0Context.windowSize * 1000);
    this.t0Context.gameActions = this.t0Context.gameActions.filter(a => a.timestamp > cutoff);
  }

  updateHypeLevel(delta) {
    this.t0Context.hypeLevel = Math.max(0, Math.min(1, this.t0Context.hypeLevel + delta));
  }

  getT0Context() {
    return {
      ...this.t0Context,
      recentMessages: this.t0Context.messages.slice(-10),
      recentActions: this.t0Context.gameActions.slice(-5)
    };
  }

  cleanupT0Context() {
    const now = Date.now();
    const cutoff = now - (this.t0Context.windowSize * 1000);
    
    this.t0Context.messages = this.t0Context.messages.filter(m => m.timestamp > cutoff);
    this.t0Context.gameActions = this.t0Context.gameActions.filter(a => a.timestamp > cutoff);
    
    // Decay hype level
    this.t0Context.hypeLevel *= 0.95;
  }

  // T1 - SESSION MEMORY (SOFT MEMORY)
  createSession(sessionId, streamInfo = {}) {
    this.t1Session = {
      session_id: sessionId,
      started_at: Date.now(),
      stream_info: streamInfo,
      tone: "neutral",
      running_bits: [],
      events: [],
      participants: new Set()
    };
  }

  addT1Event(event) {
    if (!this.t1Session) return;
    
    this.t1Session.events.push({
      event: this.summarizeEvent(event),
      timestamp: Date.now()
    });

    // Keep only last 100 events
    if (this.t1Session.events.length > 100) {
      this.t1Session.events = this.t1Session.events.slice(-100);
    }
  }

  addT1RunningBit(bit) {
    if (!this.t1Session) return;
    
    const cleanBit = this.sanitizeForT1(bit);
    if (!this.t1Session.running_bits.includes(cleanBit)) {
      this.t1Session.running_bits.push(cleanBit);
    }
  }

  updateT1Tone(tone) {
    if (!this.t1Session) return;
    this.t1Session.tone = tone;
  }

  addT1Participant(userId) {
    if (!this.t1Session) return;
    this.t1Session.participants.add(userId);
  }

  summarizeSession() {
    if (!this.t1Session) return null;

    const summary = {
      session_id: this.t1Session.session_id,
      duration: Date.now() - this.t1Session.started_at,
      tone: this.t1Session.tone,
      running_bits: [...this.t1Session.running_bits],
      notable_events: this.t1Session.events.slice(-10),
      participant_count: this.t1Session.participants.size
    };

    return summary;
  }

  endSession() {
    const summary = this.summarizeSession();
    this.t1Session = null;
    return summary;
  }

  // T2 - USER SUMMARY MEMORY (LONG-TERM)
  getT2UserMemory(userId) {
    if (!this.t2UserMemory.has(userId)) {
      this.t2UserMemory.set(userId, {
        user_id: userId,
        trust_score: 0.5, // Start neutral
        style: "unknown",
        risk_level: "medium",
        notes: [],
        last_seen: new Date().toISOString(),
        session_count: 0,
        first_seen: new Date().toISOString(),
        behavior_patterns: new Map()
      });
    }
    return this.t2UserMemory.get(userId);
  }

  updateT2UserMemory(userId, updates) {
    const memory = this.getT2UserMemory(userId);
    
    // Apply updates through memory gate
    if (this.memoryWriteGate(userId, updates)) {
      Object.assign(memory, updates);
      memory.last_seen = new Date().toISOString();
    }
  }

  addT2Note(userId, note) {
    const memory = this.getT2UserMemory(userId);
    const cleanNote = this.sanitizeNote(note);
    
    if (cleanNote && this.shouldStoreNote(userId, cleanNote)) {
      memory.notes.push(cleanNote);
      
      // Keep only last 20 notes
      if (memory.notes.length > 20) {
        memory.notes = memory.notes.slice(-20);
      }
    }
  }

  // T3 - GLOBAL MEMORY (LOCKED)
  getT3Global() {
    return { ...this.t3Global };
  }

  updateT3Global(updates) {
    // Only allow manual, curated updates
    console.warn('⚠️ T3 Global memory is locked - manual update required');
    return false;
  }

  // MEMORY WRITE GATE (CRITICAL SAFETY)
  memoryWriteGate(userId, data) {
    // 1. Relevance Check
    if (!this.isRelevant(data)) {
      return false;
    }

    // 2. Pattern Check
    if (!this.hasPattern(userId, data)) {
      return false;
    }

    // 3. Safety Check
    if (!this.isSafe(data)) {
      return false;
    }

    // 4. Scope Check
    if (!this.isSummary(data)) {
      return false;
    }

    return true;
  }

  isRelevant(data) {
    // Will this matter in 30 days?
    const relevantKeys = ['trust_score', 'style', 'risk_level', 'notes', 'behavior_patterns'];
    return Object.keys(data).some(key => relevantKeys.includes(key));
  }

  hasPattern(userId, data) {
    const memory = this.getT2UserMemory(userId);
    
    // Check if this is a repeated pattern (simplified)
    if (data.style && memory.style !== data.style) {
      return memory.session_count >= 2; // Need multiple sessions to change style
    }
    
    return true;
  }

  isSafe(data) {
    // Could this harm the user?
    const dangerousPatterns = [
      /financial/i,
      /medical/i,
      /legal/i,
      /personal.*info/i,
      /contact.*info/i
    ];

    const dataStr = JSON.stringify(data).toLowerCase();
    return !dangerousPatterns.some(pattern => pattern.test(dataStr));
  }

  isSummary(data) {
    // Is this a summary, not a quote?
    if (data.notes && Array.isArray(data.notes)) {
      return data.notes.every(note => 
        typeof note === 'string' && 
        note.length < 200 && 
        !note.includes('"') && 
        !note.includes("'")
      );
    }
    
    return true;
  }

  // UTILITY METHODS
  sanitizeForT0(message) {
    // Remove sensitive info for T0
    return message
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]') // Phone numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Emails
      .slice(0, 200); // Limit length
  }

  sanitizeForT1(bit) {
    return bit
      .slice(0, 100)
      .replace(/[<>]/g, '');
  }

  sanitizeNote(note) {
    return note
      .slice(0, 150)
      .replace(/[<>"]/g, '')
      .trim();
  }

  summarizeEvent(event) {
    if (typeof event === 'string') {
      return event.slice(0, 100);
    }
    
    return JSON.stringify(event).slice(0, 100);
  }

  shouldStoreNote(userId, note) {
    const memory = this.getT2UserMemory(userId);
    
    // Check if note already exists (avoid duplicates)
    if (memory.notes.includes(note)) {
      return false;
    }
    
    // Check if we have too many recent notes
    const recentNotes = memory.notes.slice(-5);
    return recentNotes.length < 5;
  }

  // TRUST DECAY
  applyTrustDecay() {
    for (const [userId, memory] of this.t2UserMemory) {
      const daysInactive = (Date.now() - new Date(memory.last_seen).getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysInactive >= 7) {
        const decay = Math.min(0.01 * Math.floor(daysInactive / 7), 0.1);
        memory.trust_score = Math.max(0.1, memory.trust_score - decay);
      }
    }
  }

  // CLEANUP
  destroy() {
    if (this.t0CleanupInterval) {
      clearInterval(this.t0CleanupInterval);
    }
    if (this.trustDecayInterval) {
      clearInterval(this.trustDecayInterval);
    }
    
    this.t0Context = null;
    this.t1Session = null;
    this.t2UserMemory.clear();
  }
}

module.exports = MemorySystem;
