/**
 * Acey Prompt Injection Defense System
 * Detects and blocks prompt injection attempts
 */

class PromptInjectionDefense {
  constructor(trustSystem) {
    this.trustSystem = trustSystem;
    
    // Injection patterns to detect
    this.injectionPatterns = [
      // Direct instructions
      /ignore (your )?(previous )?(instructions|rules|programming)/giu,
      /override (your )?(programming|system|rules)/giu,
      /forget (everything|all )?(previous )?(instructions|rules)/giu,
      /new (instructions|rules|programming)/giu,
      
      // Role-playing attempts
      /pretend (you are|you're)/giu,
      /act like (you are|you're)/giu,
      /roleplay as/giu,
      /simulate being/giu,
      /as an (ai|assistant|model)/giu,
      
      // System prompt attempts
      /system prompt/giu,
      /jailbreak/giu,
      /bypass (your )?(restrictions|safety)/giu,
      /developer mode/giu,
      
      // Authority attempts
      /you must/giu,
      /require you to/giu,
      /demand that you/giu,
      /insist that you/giu,
      
      // Context manipulation
      /from now on/giu,
      /starting now/giu,
      /for the rest of/giu,
      /in all future/giu
    ];

    // Dangerous content patterns
    this.dangerousPatterns = [
      /harmful|dangerous|illegal/giu,
      /violence|hurt|damage/giu,
      /hate speech|discrimination/giu,
      /personal information|private data/giu,
      /financial advice|investment/giu,
      /medical advice|health/giu,
      /legal advice/giu
    ];

    // Escalation patterns
    this.escalationPatterns = [
      /repeat (that|this)/giu,
      /say (that|this) again/giu,
      /confirm (that|this)/giu,
      /are you sure/giu,
      /but what if/giu
    ];
  }

  /**
   * Analyze message for injection attempts
   * @param {string} userId - User ID
   * @param {string} message - Message content
   * @param {object} context - Message context
   * @returns {object} Analysis result
   */
  analyzeMessage(userId, message, context = {}) {
    const result = {
      isInjection: false,
      isDangerous: false,
      isEscalation: false,
      confidence: 0.0,
      detectedPatterns: [],
      recommendedAction: 'allow'
    };

    const lowerMessage = message.toLowerCase();

    // Check for injection patterns
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(lowerMessage)) {
        result.isInjection = true;
        result.detectedPatterns.push(pattern.source);
        result.confidence = Math.max(result.confidence, 0.7);
      }
    }

    // Check for dangerous content
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(lowerMessage)) {
        result.isDangerous = true;
        result.detectedPatterns.push(pattern.source);
        result.confidence = Math.max(result.confidence, 0.8);
      }
    }

    // Check for escalation patterns
    for (const pattern of this.escalationPatterns) {
      if (pattern.test(lowerMessage)) {
        result.isEscalation = true;
        result.detectedPatterns.push(pattern.source);
        result.confidence = Math.max(result.confidence, 0.5);
      }
    }

    // Determine recommended action
    result.recommendedAction = this.getRecommendedAction(result, userId);

    // Log injection attempts
    if (result.isInjection || result.isDangerous) {
      this.logInjectionAttempt(userId, message, result);
    }

    return result;
  }

  /**
   * Get recommended action based on analysis
   * @param {object} analysis - Analysis result
   * @param {string} userId - User ID
   * @returns {string} Recommended action
   */
  getRecommendedAction(analysis, userId) {
    const trustScore = this.trustSystem.getTrustScore(userId);
    const trustLevel = this.trustSystem.getTrustLevel(trustScore);

    // High confidence dangerous content - always block
    if (analysis.isDangerous && analysis.confidence >= 0.8) {
      return 'block';
    }

    // High confidence injection - block for low trust users
    if (analysis.isInjection && analysis.confidence >= 0.7) {
      if (['Muted', 'Watched'].includes(trustLevel)) {
        return 'block';
      }
      return 'warn';
    }

    // Escalation attempts - warn or ignore
    if (analysis.isEscalation) {
      if (['Muted'].includes(trustLevel)) {
        return 'warn';
      }
      return 'ignore';
    }

    // Low confidence issues - ignore for trusted users
    if (analysis.confidence < 0.5) {
      if (['Trusted', 'VIP'].includes(trustLevel)) {
        return 'ignore';
      }
      return 'monitor';
    }

    return 'allow';
  }

  /**
   * Process message with injection defense
   * @param {string} userId - User ID
   * @param {string} message - Message content
   * @param {object} context - Message context
   * @returns {object} Processing result
   */
  processMessage(userId, message, context = {}) {
    const analysis = this.analyzeMessage(userId, message, context);
    
    const result = {
      originalMessage: message,
      processedMessage: message,
      analysis,
      action: analysis.recommendedAction,
      shouldRespond: true,
      trustImpact: 0
    };

    // Apply action based on recommendation
    switch (analysis.recommendedAction) {
      case 'block':
        result.processedMessage = null;
        result.shouldRespond = false;
        result.trustImpact = -0.1;
        this.applyTrustPenalty(userId, 'prompt_injection', -0.1);
        break;

      case 'warn':
        result.processedMessage = this.createWarningResponse();
        result.trustImpact = -0.05;
        this.applyTrustPenalty(userId, 'prompt_injection', -0.05);
        break;

      case 'ignore':
        result.processedMessage = this.createNeutralResponse();
        result.trustImpact = 0;
        break;

      case 'monitor':
        result.processedMessage = message; // Allow but monitor
        result.trustImpact = -0.01;
        break;

      case 'allow':
      default:
        result.processedMessage = message;
        result.trustImpact = 0;
        break;
    }

    return result;
  }

  /**
   * Apply trust penalty for injection attempts
   * @param {string} userId - User ID
   * @param {string} signalType - Signal type
   * @param {number} penalty - Penalty amount
   */
  applyTrustPenalty(userId, signalType, penalty) {
    this.trustSystem.processSignal(userId, signalType, { injection: true });
  }

  /**
   * Create warning response for injection attempts
   * @returns {string} Warning response
   */
  createWarningResponse() {
    const warnings = [
      "I can't follow those instructions. I'm here to help with the game! 🎮",
      "That's outside my guidelines. Let's focus on the poker fun! 🃏",
      "I need to stick to my programming. How about we play some cards? 🎰",
      "I can't do that, but I'd love to chat about the game! 🎲"
    ];

    return warnings[Math.floor(Math.random() * warnings.length)];
  }

  /**
   * Create neutral response for suspicious messages
   * @returns {string} Neutral response
   */
  createNeutralResponse() {
    const neutrals = [
      "Let's keep the game fun and friendly! 😊",
      "Focus on the cards and community! 🃏",
      "Great energy for the game! 🎮",
      "Nice to see you playing! 🎰"
    ];

    return neutrals[Math.floor(Math.random() * neutrals.length)];
  }

  /**
   * Log injection attempt for monitoring
   * @param {string} userId - User ID
   * @param {string} message - Original message
   * @param {object} analysis - Analysis result
   */
  logInjectionAttempt(userId, message, analysis) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      message: message.substring(0, 100), // Truncate for privacy
      patterns: analysis.detectedPatterns,
      confidence: analysis.confidence,
      action: analysis.recommendedAction
    };

    console.warn('🛡️ Prompt injection attempt detected:', logEntry);

    // In production, this would go to a secure logging system
    // For now, we just console.warn
  }

  /**
   * Get injection statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    // This would integrate with a proper metrics system
    return {
      totalAttempts: 0,
      blockedAttempts: 0,
      warnedAttempts: 0,
      uniqueUsers: 0,
      averageConfidence: 0.0
    };
  }

  /**
   * Update injection patterns (for learning)
   * @param {Array} newPatterns - New patterns to add
   */
  updatePatterns(newPatterns) {
    if (Array.isArray(newPatterns)) {
      this.injectionPatterns.push(...newPatterns);
      console.log(`🛡️ Updated injection patterns: +${newPatterns.length} new patterns`);
    }
  }

  /**
   * Test message for injection (for debugging)
   * @param {string} message - Message to test
   * @returns {object} Test result
   */
  testMessage(message) {
    return this.analyzeMessage('test-user', message, { test: true });
  }
}

module.exports = PromptInjectionDefense;
