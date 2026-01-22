/**
 * Acey Emotion Inference System (Safe Version)
 * Infers chat-wide energy levels without diagnosing individuals
 * Uses environmental signals only, never personal emotional states
 */

class EmotionInference {
  constructor(memorySystem) {
    this.memorySystem = memorySystem;
    
    // Allowed atmospheric states (environmental, not personal)
    this.atmosphericStates = {
      CALM: 'calm',
      HYPE: 'hype', 
      TENSE: 'tense',
      CHAOTIC: 'chaotic',
      FRUSTRATED: 'frustrated',
      CELEBRATORY: 'celebratory'
    };

    // Signal thresholds (tunable for different stream sizes)
    this.thresholds = {
      messageRate: {
        low: 0.5,      // msgs/sec
        medium: 2.0,    // msgs/sec
        high: 5.0,      // msgs/sec
        veryHigh: 10.0  // msgs/sec
      },
      emoteFrequency: {
        low: 0.1,      // emotes per message
        medium: 0.3,    // emotes per message
        high: 0.5,      // emotes per message
        veryHigh: 0.7   // emotes per message
      },
      capitalization: {
        low: 0.1,      // % caps
        medium: 0.3,    // % caps
        high: 0.5,      // % caps
        veryHigh: 0.7   // % caps
      },
      repeatedPhrases: {
        threshold: 3,   // repetitions in window
        windowMs: 30000 // 30 seconds
      }
    };

    // Current atmospheric state
    this.currentAtmosphere = 'calm';
    this.atmosphereHistory = [];
    this.lastInference = 0;
    
    // Emotion clusters for analysis
    this.emoteClusters = {
      excitement: ['🎉', '🔥', '💥', '⚡', '🎊', '✨'],
      laughter: ['😂', '🤣', '😄', '😆'],
      shock: ['😱', '😨', '😳', '😮'],
      love: ['❤️', '💕', '💗', '💖'],
      anger: ['😠', '😡', '🤬', '💢'],
      sadness: ['😢', '😭', '💔', '😞']
    };

    // Initialize inference interval
    this.inferenceInterval = setInterval(() => {
      this.performInference();
    }, 5000); // Every 5 seconds
  }

  /**
   * Perform atmospheric inference from T0 signals
   * @returns {string} Current atmospheric state
   */
  performInference() {
    const now = Date.now();
    if (now - this.lastInference < 3000) {
      return this.currentAtmosphere; // Too recent
    }

    const t0Context = this.memorySystem.getT0Context();
    const signals = this.extractSignals(t0Context);
    
    const newState = this.inferAtmosphere(signals);
    
    // Update state if changed
    if (newState !== this.currentAtmosphere) {
      this.updateAtmosphere(newState, signals);
    }

    this.lastInference = now;
    return this.currentAtmosphere;
  }

  /**
   * Extract signals from T0 context
   * @param {object} t0Context - T0 ephemeral context
   * @returns {object} Extracted signals
   */
  extractSignals(t0Context) {
    const messages = t0Context.messages || [];
    const actions = t0Context.gameActions || [];
    
    if (messages.length === 0) {
      return {
        messageRate: 0,
        emoteFrequency: 0,
        capitalization: 0,
        repeatedPhrases: [],
        emoteClusters: this.analyzeEmoteClusters(messages),
        gameActivity: actions.length,
        timeSinceLastWin: this.getTimeSinceLastEvent(actions, 'win'),
        timeSinceLastLoss: this.getTimeSinceLastEvent(actions, 'loss'),
        uniqueUsers: this.getUniqueUserCount(messages)
      };
    }

    const timeWindow = 30000; // 30 seconds
    const recentMessages = messages.filter(m => now - m.timestamp < timeWindow);
    
    return {
      messageRate: recentMessages.length / 30, // per second
      emoteFrequency: this.calculateEmoteFrequency(recentMessages),
      capitalization: this.calculateCapitalization(recentMessages),
      repeatedPhrases: this.findRepeatedPhrases(recentMessages),
      emoteClusters: this.analyzeEmoteClusters(recentMessages),
      gameActivity: actions.length,
      timeSinceLastWin: this.getTimeSinceLastEvent(actions, 'win'),
      timeSinceLastLoss: this.getTimeSinceLastEvent(actions, 'loss'),
      uniqueUsers: this.getUniqueUserCount(recentMessages)
    };
  }

  /**
   * Calculate emote frequency from messages
   * @param {Array} messages - Recent messages
   * @returns {number} Emote frequency
   */
  calculateEmoteFrequency(messages) {
    if (messages.length === 0) return 0;
    
    const emoteCount = messages.reduce((count, msg) => {
      const emotes = (msg.message.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
      return count + emotes;
    }, 0);

    return emoteCount / messages.length;
  }

  /**
   * Calculate capitalization percentage
   * @param {Array} messages - Recent messages
   * @returns {number} Capitalization percentage
   */
  calculateCapitalization(messages) {
    if (messages.length === 0) return 0;
    
    const totalChars = messages.reduce((count, msg) => count + msg.message.length, 0);
    const capitalChars = messages.reduce((count, msg) => {
      return count + (msg.message.match(/[A-Z]/gu) || []).length;
    }, 0);

    return totalChars > 0 ? capitalChars / totalChars : 0;
  }

  /**
   * Find repeated phrases in messages
   * @param {Array} messages - Recent messages
   * @returns {Array} Repeated phrases
   */
  findRepeatedPhrases(messages) {
    const phraseMap = new Map();
    const windowMs = this.thresholds.repeatedPhrases.windowMs;
    const now = Date.now();

    // Extract phrases (3+ words)
    messages.forEach(msg => {
      const words = msg.message.toLowerCase().split(/\s+/);
      for (let i = 0; i <= words.length - 3; i++) {
        const phrase = words.slice(i, i + 3).join(' ');
        if (!phraseMap.has(phrase)) {
          phraseMap.set(phrase, []);
        }
        phraseMap.get(phrase).push(msg.timestamp);
      }
    });

    // Find repeated phrases
    const repeated = [];
    phraseMap.forEach((timestamps, phrase) => {
      if (timestamps.length >= this.thresholds.repeatedPhrases.threshold) {
        repeated.push({
          phrase,
          count: timestamps.length,
          timestamps
        });
      }
    });

    return repeated;
  }

  /**
   * Analyze emote clusters
   * @param {Array} messages - Recent messages
   * @returns {object} Emote cluster analysis
   */
  analyzeEmoteClusters(messages) {
    const clusters = {};
    
    Object.entries(this.emoteClusters).forEach(([type, emotes]) => {
      clusters[type] = 0;
      
      messages.forEach(msg => {
        emotes.forEach(emote => {
          if (msg.message.includes(emote)) {
            clusters[type]++;
          }
        });
    });

    return clusters;
  }

  /**
   * Get unique user count from messages
   * @param {Array} messages - Recent messages
   * @returns {number} Unique user count
   */
  getUniqueUserCount(messages) {
    const users = new Set();
    messages.forEach(msg => {
      if (msg.userId) {
        users.add(msg.userId);
      }
    });
    return users.size;
  }

  /**
   * Get time since last event
   * @param {Array} actions - Game actions
   * @param {string} eventType - Event type
   * @returns {number} Time since event (seconds)
   */
  getTimeSinceLastEvent(actions, eventType) {
    const eventActions = actions.filter(a => a.action && a.action.toLowerCase().includes(eventType));
    if (eventActions.length === 0) return Infinity;
    
    const lastEvent = Math.max(...eventActions.map(a => a.timestamp));
    return (Date.now() - lastEvent) / 1000;
  }

  /**
   * Infer atmospheric state from signals
   * @param {object} signals - Extracted signals
   * @returns {string} Inferred atmospheric state
   */
  inferAtmosphere(signals) {
    // Calculate signal scores
    const scores = {
      hype: 0,
      calm: 0,
      tense: 0,
      chaotic: 0,
      frustrated: 0,
      celebratory: 0
    };

    // Message rate scoring
    if (signals.messageRate >= this.thresholds.messageRate.veryHigh) {
      scores.chaotic += 3;
      scores.hype += 2;
    } else if (signals.messageRate >= this.thresholds.messageRate.high) {
      scores.hype += 2;
      scores.tense += 1;
    } else if (signals.messageRate <= this.thresholds.messageRate.low) {
      scores.calm += 2;
    }

    // Emote frequency scoring
    if (signals.emoteFrequency >= this.thresholds.emoteFrequency.veryHigh) {
      scores.hype += 2;
      scores.celebratory += 1;
    } else if (signals.emoteFrequency >= this.thresholds.emoteFrequency.high) {
      scores.hype += 1;
    }

    // Capitalization scoring
    if (signals.capitalization >= this.thresholds.capitalization.veryHigh) {
      scores.chaotic += 2;
      scores.tense += 1;
    } else if (signals.capitalization >= this.thresholds.capitalization.high) {
      scores.tense += 1;
    }

    // Repeated phrases scoring
    if (signals.repeatedPhrases.length > 0) {
      scores.chaotic += signals.repeatedPhrases.length;
    }

    // Emote cluster scoring
    if (signals.emoteClusters.excitement > 0) {
      scores.hype += signals.emoteClusters.excitement;
    }
    if (signals.emoteClusters.laughter > 0) {
      scores.celebratory += signals.emoteClusters.laughter;
    }
    if (signals.emoteClusters.anger > 0) {
      scores.tense += signals.emoteClusters.anger * 2;
      scores.frustrated += signals.emoteClusters.anger;
    }
    if (signals.emoteClusters.sadness > 0) {
      scores.frustrated += signals.emoteClusters.sadness;
    }

    // Game activity scoring
    if (signals.gameActivity > 0) {
      const recentWin = signals.timeSinceLastWin < 30;
      const recentLoss = signals.timeSinceLastLoss < 30;
      
      if (recentWin) {
        scores.celebratory += 2;
        scores.hype += 1;
      } else if (recentLoss) {
        scores.frustrated += 1;
        scores.tense += 1;
      }
    }

    // Find highest scoring state
    let maxScore = 0;
    let bestState = 'calm';

    Object.entries(scores).forEach(([state, score]) => {
      if (score > maxScore) {
        maxScore = score;
        bestState = state;
      }
    });

    return bestState;
  }

  /**
   * Update atmospheric state
   * @param {string} newState - New atmospheric state
   * @param {object} signals - Current signals
   */
  updateAtmosphere(newState, signals) {
    const oldState = this.currentAtmosphere;
    this.currentAtmosphere = newState;

    // Add to history
    this.atmosphereHistory.push({
      state: newState,
      previousState: oldState,
      timestamp: Date.now(),
      signals: {
        messageRate: signals.messageRate,
        emoteFrequency: signals.emoteFrequency,
        uniqueUsers: signals.uniqueUsers
      }
    });

    // Keep only last 50 entries
    if (this.atmosphereHistory.length > 50) {
      this.atmosphereHistory = this.atmosphereHistory.slice(-50);
    }

    // Log significant changes
    if (oldState !== newState) {
      console.log(`🌡️ Atmosphere shift: ${oldState} → ${newState}`);
    }
  }

  /**
   * Get current atmospheric state
   * @returns {string} Current atmospheric state
   */
  getCurrentAtmosphere() {
    return this.currentAtmosphere;
  }

  /**
   * Get atmosphere history
   * @param {number} limit - Maximum entries to return
   * @returns {Array} Atmosphere history
   */
  getAtmosphereHistory(limit = 10) {
    return this.atmosphereHistory.slice(-limit);
  }

  /**
   * Get behavior recommendations based on atmosphere
   * @returns {object} Behavior recommendations
   */
  getBehaviorRecommendations() {
    const recommendations = {
      calm: {
        responseStyle: 'soft',
        pacing: 'slow',
        tone: 'gentle',
        energy: 'low',
        interactionFrequency: 'minimal'
      },
      hype: {
        responseStyle: 'energetic',
        pacing: 'fast',
        tone: 'excited',
        energy: 'high',
        interactionFrequency: 'high'
      },
      tense: {
        responseStyle: 'de-escalating',
        pacing: 'steady',
        tone: 'calming',
        energy: 'medium',
        interactionFrequency: 'moderate'
      },
      chaotic: {
        responseStyle: 'structured',
        pacing: 'controlled',
        tone: 'firm',
        energy: 'medium',
        interactionFrequency: 'selective'
      },
      frustrated: {
        responseStyle: 'reassuring',
        pacing: 'steady',
        tone: 'supportive',
        energy: 'medium',
        interactionFrequency: 'moderate'
      },
      celebratory: {
        responseStyle: 'enthusiastic',
        pacing: 'dynamic',
        tone: 'joyful',
        energy: 'high',
        interactionFrequency: 'high'
      }
    };

    return recommendations[this.currentAtmosphere] || recommendations.calm;
  }

  /**
   * Get atmospheric signals for debugging
   * @returns {object} Current signals
   */
  getCurrentSignals() {
    const t0Context = this.memorySystem.getT0Context();
    return this.extractSignals(t0Context);
  }

  /**
   * Destroy the emotion inference system
   */
  destroy() {
    if (this.inferenceInterval) {
      clearInterval(this.inferenceInterval);
    }
    
    this.atmosphereHistory = [];
    this.currentAtmosphere = 'calm';
  }
}

module.exports = EmotionInference;
