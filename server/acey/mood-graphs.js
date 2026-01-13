/**
 * Audience Mood Graphs (Non-Personal)
 * Shows room energy without spying on people
 * No user IDs, no emotional labels, only aggregate signals
 */

class AudienceMoodGraphs {
  constructor(memorySystem, emotionInference) {
    this.memorySystem = memorySystem;
    this.emotionInference = emotionInference;
    
    // Mood metrics configuration
    this.config = {
      updateRate: 5000, // 5 seconds
      rollingWindow: 60000, // 1 minute rolling average
      maxHistoryPoints: 100, // Max history points to keep
      alertThresholds: {
        energy: 0.8,
        chaos: 0.7,
        tension: 0.6,
        engagement: 0.9
      }
    };

    // Current mood metrics
    this.currentMetrics = {
      energy: 0.5,
      chaos: 0.5,
      tension: 0.5,
      engagement: 0.5
    };

    // Historical data (for graphs)
    this.history = {
      timestamps: [],
      energy: [],
      chaos: [],
      tension: [],
      engagement: []
    };

    // Recent signals cache
    this.recentSignals = [];

    // Update interval
    this.updateInterval = null;

    // Initialize
    this.init();
  }

  /**
   * Initialize mood monitoring
   */
  init() {
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, this.config.updateRate);

    console.log('📊 Audience Mood Graphs initialized');
  }

  /**
   * Update mood metrics from T0 signals
   */
  updateMetrics() {
    const now = Date.now();
    
    // Get T0 context signals
    const signals = this.extractT0Signals();
    
    // Calculate new metrics
    const newMetrics = this.calculateMoodMetrics(signals);
    
    // Update current metrics with smoothing
    this.currentMetrics = {
      energy: this.smoothMetric(this.currentMetrics.energy, newMetrics.energy),
      chaos: this.smoothMetric(this.currentMetrics.chaos, newMetrics.chaos),
      tension: this.smoothMetric(this.currentMetrics.tension, newMetrics.tension),
      engagement: this.smoothMetric(this.currentMetrics.engagement, newMetrics.engagement)
    };

    // Add to history
    this.addToHistory(now, this.currentMetrics);
    
    // Store recent signals
    this.recentSignals.push({
      timestamp: now,
      signals,
      metrics: this.currentMetrics
    });

    // Keep recent signals limited
    if (this.recentSignals.length > 20) {
      this.recentSignals = this.recentSignals.slice(-20);
    }

    // Check for alerts
    this.checkAlerts();
  }

  /**
   * Extract signals from T0 context
   * @returns {object} Extracted signals
   */
  extractT0Signals() {
    const t0Context = this.memorySystem.getT0Context();
    const messages = t0Context.messages || [];
    const actions = t0Context.gameActions || [];
    
    if (messages.length === 0) {
      return {
        messageRate: 0,
        emoteDensity: 0,
        capsRatio: 0,
        repetitionVelocity: 0,
        timeSinceLastEvent: Infinity,
        uniqueUsers: 0,
        avgMessageLength: 0,
        questionRatio: 0,
        exclamationRatio: 0
      };
    }

    const timeWindow = this.config.rollingWindow;
    const recentMessages = messages.filter(m => now - m.timestamp < timeWindow);
    
    return {
      messageRate: recentMessages.length / (timeWindow / 1000), // per second
      emoteDensity: this.calculateEmoteDensity(recentMessages),
      capsRatio: this.calculateCapsRatio(recentMessages),
      repetitionVelocity: this.calculateRepetitionVelocity(recentMessages),
      timeSinceLastEvent: this.getTimeSinceLastEvent(actions),
      uniqueUsers: this.getUniqueUserCount(recentMessages),
      avgMessageLength: this.getAverageMessageLength(recentMessages),
      questionRatio: this.getQuestionRatio(recentMessages),
      exclamationRatio: this.getExclamationRatio(recentMessages)
    };
  }

  /**
   * Calculate mood metrics from signals
   * @param {object} signals - Extracted signals
   * @returns {object} Mood metrics
   */
  calculateMoodMetrics(signals) {
    // Energy: High message rate + emotes + exclamation
    const energyScore = Math.min(1.0, (
      (signals.messageRate / 10) * 0.4 + // Normalize to 0-1
      signals.emoteDensity * 0.3 +
      signals.exclamationRatio * 0.3
    ));

    // Chaos: High caps ratio + repetition + message rate variance
    const chaosScore = Math.min(1.0, (
      signals.capsRatio * 0.4 +
      signals.repetitionVelocity * 0.3 +
      (signals.messageRate > 5 ? 0.3 : 0)
    ));

    // Tension: High question ratio + low engagement + time since event
    const tensionScore = Math.min(1.0, (
      signals.questionRatio * 0.3 +
      (signals.engagement < 0.3 ? 0.4 : 0) +
      (signals.timeSinceLastEvent < 30000 ? 0.3 : 0)
    ));

    // Engagement: Message rate + unique users + avg length
    const engagementScore = Math.min(1.0, (
      (signals.messageRate / 5) * 0.4 + // Normalize to 0-1
      (signals.uniqueUsers / 10) * 0.3 + // Normalize to 0-1
      (signals.avgMessageLength / 50) * 0.3 // Normalize to 0-1
    ));

    return {
      energy: energyScore,
      chaos: chaosScore,
      tension: tensionScore,
      engagement: engagementScore
    };
  }

  /**
   * Smooth metric to prevent jitter
   * @param {number} current - Current value
   * @param {number} newValue - New value
   * @returns {number} Smoothed value
   */
  smoothMetric(current, newValue) {
    const smoothingFactor = 0.3; // 30% new, 70% old
    return current * (1 - smoothingFactor) + newValue * smoothingFactor;
  }

  /**
   * Add metrics to history
   * @param {number} timestamp - Timestamp
   * @param {object} metrics - Current metrics
   */
  addToHistory(timestamp, metrics) {
    this.history.timestamps.push(timestamp);
    this.history.energy.push(metrics.energy);
    this.history.chaos.push(metrics.chaos);
    this.history.tension.push(metrics.tension);
    this.history.engagement.push(metrics.engagement);

    // Keep history limited
    if (this.history.timestamps.length > this.config.maxHistoryPoints) {
      this.history.timestamps = this.history.timestamps.slice(-this.config.maxHistoryPoints);
      this.history.energy = this.history.energy.slice(-this.config.maxHistoryPoints);
      this.history.chaos = this.history.chaos.slice(-this.config.maxHistoryPoints);
      this.history.tension = this.history.tension.slice(-this.config.maxHistoryPoints);
      this.history.engagement = this.history.engagement.slice(-this.config.maxHistoryPoints);
    }
  }

  /**
   * Calculate emote density
   * @param {Array} messages - Messages
   * @returns {number} Emote density (0-1)
   */
  calculateEmoteDensity(messages) {
    if (messages.length === 0) return 0;
    
    const emoteCount = messages.reduce((count, msg) => {
      const emotes = (msg.message.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
      return count + emotes;
    }, 0);

    const totalChars = messages.reduce((sum, msg) => sum + msg.message.length, 0);
    return totalChars > 0 ? Math.min(1.0, emoteCount / totalChars * 10) : 0;
  }

  /**
   * Calculate caps ratio
   * @param {Array} messages - Messages
   * @returns {number} Caps ratio (0-1)
   */
  calculateCapsRatio(messages) {
    if (messages.length === 0) return 0;
    
    const totalChars = messages.reduce((sum, msg) => sum + msg.message.length, 0);
    const capsChars = messages.reduce((sum, msg) => {
      return sum + (msg.message.match(/[A-Z]/gu) || []).length;
    }, 0);

    return totalChars > 0 ? capsChars / totalChars : 0;
  }

  /**
   * Calculate repetition velocity
   * @param {Array} messages - Messages
   * @returns {number} Repetition velocity (0-1)
   */
  calculateRepetitionVelocity(messages) {
    if (messages.length < 5) return 0;
    
    const phraseMap = new Map();
    
    messages.forEach(msg => {
      const words = msg.message.toLowerCase().split(/\s+/);
      for (let i = 0; i <= words.length - 2; i++) {
        const phrase = words.slice(i, i + 2).join(' ');
        phraseMap.set(phrase, (phraseMap.get(phrase) || 0) + 1);
      }
    });

    const maxRepeats = Math.max(...phraseMap.values());
    return maxRepeats > 2 ? Math.min(1.0, maxRepeats / 5) : 0;
  }

  /**
   * Get time since last event
   * @param {Array} actions - Game actions
   * @returns {number} Time since last event (seconds)
   */
  getTimeSinceLastEvent(actions) {
    if (actions.length === 0) return Infinity;
    
    const lastEvent = Math.max(...actions.map(a => a.timestamp));
    return (Date.now() - lastEvent) / 1000;
  }

  /**
   * Get unique user count
   * @param {Array} messages - Messages
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
   * Get average message length
   * @param {Array} messages - Messages
   * @returns {number} Average message length
   */
  getAverageMessageLength(messages) {
    if (messages.length === 0) return 0;
    
    const totalLength = messages.reduce((sum, msg) => sum + msg.message.length, 0);
    return totalLength / messages.length;
  }

  /**
   * Get question ratio
   * @param {Array} messages - Messages
   * @returns {number} Question ratio (0-1)
   */
  getQuestionRatio(messages) {
    if (messages.length === 0) return 0;
    
    const questionCount = messages.filter(msg => msg.message.includes('?')).length;
    return questionCount / messages.length;
  }

  /**
   * Get exclamation ratio
   * @param {Array} messages - Messages
   * @returns {number} Exclamation ratio (0-1)
   */
  getExclamationRatio(messages) {
    if (messages.length === 0) return 0;
    
    const exclamationCount = messages.filter(msg => msg.message.includes('!')).length;
    return exclamationCount / messages.length;
  }

  /**
   * Check for mood alerts
   */
  checkAlerts() {
    const alerts = [];
    
    if (this.currentMetrics.energy > this.config.alertThresholds.energy) {
      alerts.push({
        type: 'high_energy',
        level: 'warning',
        message: 'High energy detected',
        value: this.currentMetrics.energy
      });
    }

    if (this.currentMetrics.chaos > this.config.alertThresholds.chaos) {
      alerts.push({
        type: 'high_chaos',
        level: 'warning',
        message: 'High chaos detected',
        value: this.currentMetrics.chaos
      });
    }

    if (this.currentMetrics.tension > this.config.alertThresholds.tension) {
      alerts.push({
        type: 'high_tension',
        level: 'warning',
        message: 'High tension detected',
        value: this.currentMetrics.tension
      });
    }

    if (this.currentMetrics.engagement > this.config.alertThresholds.engagement) {
      alerts.push({
        type: 'high_engagement',
        level: 'info',
        message: 'High engagement detected',
        value: this.currentMetrics.engagement
      });
    }

    // Emit alerts if any
    if (alerts.length > 0) {
      // TODO: Emit to streamer dashboard
      console.log('🚨 Mood alerts:', alerts);
    }
  }

  /**
   * Get current mood metrics
   * @returns {object} Current metrics
   */
  getCurrentMetrics() {
    return {
      ...this.currentMetrics,
      timestamp: Date.now(),
      atmosphere: this.emotionInference.getCurrentAtmosphere()
    };
  }

  /**
   * Get mood history for graphs
   * @param {number} points - Number of points to return
   * @returns {object} Graph data
   */
  getGraphHistory(points = 50) {
    const start = Math.max(0, this.history.timestamps.length - points);
    
    return {
      timestamps: this.history.timestamps.slice(start),
      energy: this.history.energy.slice(start),
      chaos: this.history.chaos.slice(start),
      tension: this.history.tension.slice(start),
      engagement: this.history.engagement.slice(start)
    };
  }

  /**
   * Get mood recommendations for streamer
   * @returns {object} Recommendations
   */
  getRecommendations() {
    const recommendations = [];
    
    if (this.currentMetrics.energy > 0.8) {
      recommendations.push({
        type: 'hype',
        message: 'High energy - good time for exciting content',
        priority: 'high'
      });
    }

    if (this.currentMetrics.chaos > 0.7) {
      recommendations.push({
        type: 'structure',
        message: 'High chaos - consider more structured content',
        priority: 'high'
      });
    }

    if (this.currentMetrics.tension > 0.6) {
      recommendations.push({
        type: 'de-escalate',
        message: 'High tension - consider calming content',
        priority: 'medium'
      });
    }

    if (this.currentMetrics.engagement < 0.3) {
      recommendations.push({
        type: 'engage',
        message: 'Low engagement - try interactive content',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Get mood statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const history = this.history;
    
    if (history.energy.length === 0) {
      return {
        current: this.currentMetrics,
        averages: this.currentMetrics,
        peaks: this.currentMetrics,
        valleys: this.currentMetrics,
        trend: 'stable'
      };
    }

    const averages = {
      energy: history.energy.reduce((sum, val) => sum + val, 0) / history.energy.length,
      chaos: history.chaos.reduce((sum, val) => sum + val, 0) / history.chaos.length,
      tension: history.tension.reduce((sum, val) => sum + val, 0) / history.tension.length,
      engagement: history.engagement.reduce((sum, val) => sum + val, 0) / history.engagement.length
    };

    const peaks = {
      energy: Math.max(...history.energy),
      chaos: Math.max(...history.chaos),
      tension: Math.max(...history.tension),
      engagement: Math.max(...history.engagement)
    };

    const valleys = {
      energy: Math.min(...history.energy),
      chaos: Math.min(...history.chaos),
      tension: Math.min(...history.tension),
      engagement: Math.min(...history.engagement)
    };

    // Calculate trend
    const recent = history.energy.slice(-10);
    const older = history.energy.slice(-20, -10);
    let trend = 'stable';
    
    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
      
      if (recentAvg > olderAvg + 0.1) trend = 'rising';
      else if (recentAvg < olderAvg - 0.1) trend = 'falling';
    }

    return {
      current: this.currentMetrics,
      averages,
      peaks,
      valleys,
      trend,
      dataPoints: history.energy.length,
      lastUpdate: Date.now()
    };
  }

  /**
   * Reset mood metrics
   */
  reset() {
    this.currentMetrics = {
      energy: 0.5,
      chaos: 0.5,
      tension: 0.5,
      engagement: 0.5
    };

    this.history = {
      timestamps: [],
      energy: [],
      chaos: [],
      tension: [],
      engagement: []
    };

    this.recentSignals = [];

    console.log('📊 Mood metrics reset');
  }

  /**
   * Destroy mood monitoring
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.reset();
    console.log('📊 Audience Mood Graphs destroyed');
  }
}

module.exports = AudienceMoodGraphs;
