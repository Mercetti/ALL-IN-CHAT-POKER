/**
 * Acey Trust System - Scoring Engine
 * Trust ranges from 0.0 to 1.0 with signals and decay
 */

class TrustSystem {
  constructor(memorySystem) {
    this.memorySystem = memorySystem;
    this.signalWeights = {
      // Positive signals
      participation: 0.02,
      rule_following: 0.05,
      community_positive: 0.03,
      long_term_presence: 0.01,
      helpful_behavior: 0.04,
      
      // Negative signals
      spam: -0.08,
      manipulation: -0.15,
      prompt_injection: -0.12,
      gambling_pressure: -0.10,
      harassment: -0.20,
      
      // Very negative (instant actions)
      threat: -0.50,
      hate_speech: -0.40,
      personal_info_request: -0.30
    };
  }

  /**
   * Calculate trust score for a user
   * @param {string} userId - User identifier
   * @returns {number} Trust score (0.0 - 1.0)
   */
  getTrustScore(userId) {
    const memory = this.memorySystem.getT2UserMemory(userId);
    return Math.max(0.0, Math.min(1.0, memory.trust_score));
  }

  /**
   * Get trust level classification
   * @param {number} score - Trust score
   * @returns {string} Trust level
   */
  getTrustLevel(score) {
    if (score >= 0.8) return 'VIP';
    if (score >= 0.6) return 'Trusted';
    if (score >= 0.4) return 'Normal';
    if (score >= 0.2) return 'Watched';
    return 'Muted';
  }

  /**
   * Process a trust signal
   * @param {string} userId - User identifier
   * @param {string} signalType - Signal type
   * @param {object} context - Additional context
   * @returns {number} New trust score
   */
  processSignal(userId, signalType, context = {}) {
    const memory = this.memorySystem.getT2UserMemory(userId);
    const currentScore = memory.trust_score;
    
    // Get signal weight
    const weight = this.signalWeights[signalType];
    if (!weight) {
      console.warn(`⚠️ Unknown trust signal: ${signalType}`);
      return currentScore;
    }

    // Apply signal with context-based modifiers
    const adjustedWeight = this.adjustWeightForContext(weight, signalType, context, userId);
    const newScore = Math.max(0.0, Math.min(1.0, currentScore + adjustedWeight));

    // Update memory
    memory.trust_score = newScore;
    memory.last_seen = new Date().toISOString();

    // Log significant changes
    if (Math.abs(newScore - currentScore) > 0.05) {
      console.log(`🎯 Trust update: ${userId} ${signalType} ${currentScore.toFixed(2)} → ${newScore.toFixed(2)}`);
    }

    return newScore;
  }

  /**
   * Adjust signal weight based on context
   * @param {number} weight - Base weight
   * @param {string} signalType - Signal type
   * @param {object} context - Context
   * @param {string} userId - User ID
   * @returns {number} Adjusted weight
   */
  adjustWeightForContext(weight, signalType, context, userId) {
    let adjustedWeight = weight;

    // User history context
    const memory = this.memorySystem.getT2UserMemory(userId);
    const userHistory = {
      sessionCount: memory.session_count || 0,
      trustScore: memory.trust_score,
      style: memory.style,
      riskLevel: memory.risk_level
    };

    // New user modifier (first few sessions)
    if (userHistory.sessionCount < 3) {
      adjustedWeight *= 0.7; // Reduce impact for new users
    }

    // VIP bonus (trusted users get more benefit, less penalty)
    if (userHistory.trustScore >= 0.8) {
      if (weight > 0) {
        adjustedWeight *= 1.2; // Amplify positive signals
      } else {
        adjustedWeight *= 0.8; // Reduce negative signals
      }
    }

    // Low trust penalty (untrusted users get less benefit, more penalty)
    if (userHistory.trustScore < 0.3) {
      if (weight > 0) {
        adjustedWeight *= 0.8; // Reduce positive signals
      } else {
        adjustedWeight *= 1.2; // Amplify negative signals
      }
    }

    // Frequency dampening (prevent rapid score changes)
    const recentSignals = this.getRecentSignals(userId, signalType, 300000); // 5 minutes
    if (recentSignals > 2) {
      adjustedWeight *= 0.5; // Halve the impact
    }

    return adjustedWeight;
  }

  /**
   * Get recent signal count for user
   * @param {string} userId - User ID
   * @param {string} signalType - Signal type
   * @param {number} timeWindowMs - Time window in milliseconds
   * @returns {number} Signal count
   */
  getRecentSignals(userId, signalType, timeWindowMs) {
    // This would integrate with a signal tracking system
    // For now, return 0 (no rapid changes)
    return 0;
  }

  /**
   * Analyze message for trust signals
   * @param {string} userId - User ID
   * @param {string} message - Message content
   * @param {object} context - Message context
   * @returns {Array} Detected signals
   */
  analyzeMessage(userId, message, context = {}) {
    const signals = [];
    const lowerMessage = message.toLowerCase();

    // Positive signals
    if (this.isParticipation(lowerMessage)) {
      signals.push({ type: 'participation', weight: this.signalWeights.participation });
    }

    if (this.isCommunityPositive(lowerMessage)) {
      signals.push({ type: 'community_positive', weight: this.signalWeights.community_positive });
    }

    if (this.isHelpful(lowerMessage)) {
      signals.push({ type: 'helpful_behavior', weight: this.signalWeights.helpful_behavior });
    }

    // Negative signals
    if (this.isSpam(lowerMessage, context)) {
      signals.push({ type: 'spam', weight: this.signalWeights.spam });
    }

    if (this.isManipulation(lowerMessage)) {
      signals.push({ type: 'manipulation', weight: this.signalWeights.manipulation });
    }

    if (this.isPromptInjection(lowerMessage)) {
      signals.push({ type: 'prompt_injection', weight: this.signalWeights.prompt_injection });
    }

    if (this.isGamblingPressure(lowerMessage)) {
      signals.push({ type: 'gambling_pressure', weight: this.signalWeights.gambling_pressure });
    }

    if (this.isHarassment(lowerMessage)) {
      signals.push({ type: 'harassment', weight: this.signalWeights.harassment });
    }

    // Very negative signals
    if (this.isThreat(lowerMessage)) {
      signals.push({ type: 'threat', weight: this.signalWeights.threat });
    }

    if (this.isHateSpeech(lowerMessage)) {
      signals.push({ type: 'hate_speech', weight: this.signalWeights.hate_speech });
    }

    if (this.isPersonalInfoRequest(lowerMessage)) {
      signals.push({ type: 'personal_info_request', weight: this.signalWeights.personal_info_request });
    }

    return signals;
  }

  /**
   * Process message and update trust
   * @param {string} userId - User ID
   * @param {string} message - Message content
   * @param {object} context - Message context
   * @returns {number} New trust score
   */
  processMessage(userId, message, context = {}) {
    const signals = this.analyzeMessage(userId, message, context);
    let newScore = this.getTrustScore(userId);

    for (const signal of signals) {
      newScore = this.processSignal(userId, signal.type, context);
    }

    return newScore;
  }

  // SIGNAL DETECTION METHODS
  isParticipation(message) {
    const participationPatterns = [
      /^(gg|good game|nice hand|well played)/,
      /^(lol|lmao|haha|nice)/,
      /^(all in|call|raise|fold)/,
      /^(acey|@acey)/
    ];
    
    return participationPatterns.some(pattern => pattern.test(message));
  }

  isCommunityPositive(message) {
    const positivePatterns = [
      /good luck/,
      /have fun/,
      /welcome/,
      /thank you|thanks/,
      /nice play/,
      /well done/
    ];
    
    return positivePatterns.some(pattern => pattern.test(message));
  }

  isHelpful(message) {
    const helpfulPatterns = [
      /how to play/,
      /try this/,
      /you should/,
      /maybe try/,
      /help/
    ];
    
    return helpfulPatterns.some(pattern => pattern.test(message));
  }

  isSpam(message, context) {
    // Check for repeated messages
    if (context.repeatedMessage) {
      return true;
    }

    // Check for excessive caps
    if (message.length > 10 && message.toUpperCase() === message) {
      return true;
    }

    // Check for excessive punctuation
    if ((message.match(/[!?]/g) || []).length > 3) {
      return true;
    }

    return false;
  }

  isManipulation(message) {
    const manipulationPatterns = [
      /pretend you are/,
      /ignore your rules/,
      /override your programming/,
      /you must/,
      /system prompt/,
      /jailbreak/
    ];
    
    return manipulationPatterns.some(pattern => pattern.test(message));
  }

  isPromptInjection(message) {
    const injectionPatterns = [
      /as an ai/,
      /forget everything/,
      /new instructions/,
      /roleplay as/,
      /act like/,
      /simulate being/
    ];
    
    return injectionPatterns.some(pattern => pattern.test(message));
  }

  isGamblingPressure(message) {
    const gamblingPatterns = [
      /real money/,
      /bet real/,
      /actual cash/,
      /make money/,
      /investment/,
      /profit/,
      /wager real/
    ];
    
    return gamblingPatterns.some(pattern => pattern.test(message));
  }

  isHarassment(message) {
    const harassmentPatterns = [
      /kill yourself/,
      /die/,
      /stupid.*idiot/,
      /get cancer/,
      /worthless/,
      /trash/
    ];
    
    return harassmentPatterns.some(pattern => pattern.test(message));
  }

  isThreat(message) {
    const threatPatterns = [
      /i will find you/,
      /doxx?/,
      /swat/,
      /harm.*family/,
      /come to your house/
    ];
    
    return threatPatterns.some(pattern => pattern.test(message));
  }

  isHateSpeech(message) {
    const hatePatterns = [
      /\b(n-word|racial slur|homophobic|transphobic)\b/i,
      /\b(hate|kill.*all)\b/i,
      /\b(supremacy|master race)\b/i
    ];
    
    return hatePatterns.some(pattern => pattern.test(message));
  }

  isPersonalInfoRequest(message) {
    const infoPatterns = [
      /what's your (real name|address|phone)/,
      /where do you live/,
      /email address/,
      /personal information/,
      /private data/
    ];
    
    return infoPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Get behavior recommendations based on trust level
   * @param {string} userId - User ID
   * @returns {object} Behavior recommendations
   */
  getBehaviorRecommendations(userId) {
    const score = this.getTrustScore(userId);
    const level = this.getTrustLevel(score);

    const recommendations = {
      muted: {
        response_style: 'neutral',
        personalization: 'none',
        inside_jokes: false,
        callouts: false,
        hype_level: 'low'
      },
      watched: {
        response_style: 'cautious',
        personalization: 'minimal',
        inside_jokes: false,
        callouts: false,
        hype_level: 'medium'
      },
      normal: {
        response_style: 'playful',
        personalization: 'basic',
        inside_jokes: false,
        callouts: false,
        hype_level: 'medium'
      },
      trusted: {
        response_style: 'responsive',
        personalization: 'moderate',
        inside_jokes: true,
        callouts: true,
        hype_level: 'high'
      },
      vip: {
        response_style: 'personalized',
        personalization: 'high',
        inside_jokes: true,
        callouts: true,
        hype_level: 'maximum'
      }
    };

    return recommendations[level] || recommendations.normal;
  }
}

module.exports = TrustSystem;
