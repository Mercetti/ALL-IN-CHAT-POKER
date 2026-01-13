/**
 * Shadow-Ban Intelligence System
 * Reduces disruption without confrontation, bans, or callouts
 * Acey becomes selectively inattentive to disruptive users
 */

class ShadowBanIntelligence {
  constructor(trustSystem, memorySystem) {
    this.trustSystem = trustSystem;
    this.memorySystem = memorySystem;
    
    // Shadow-ban configuration
    this.config = {
      trustThreshold: 0.3, // Below this triggers shadow-ban
      decayDuration: 3600000, // 1 hour to decay
      maxShadowBans: 50, // Maximum concurrent shadow-bans
      signals: {
        promptInjection: 0.8,
        spamVelocity: 0.6,
        repeatedRulePushes: 0.5,
        attentionSeeking: 0.4,
        harassment: 0.9
      }
    };

    // Shadow-banned users
    this.shadowBannedUsers = new Map(); // userId -> shadow-ban data
    
    // Shadow-ban effects
    this.effects = {
      chatReading: {
        priority: 0.1, // Very low priority
        maxMessages: 2,
        timeWindow: 10000 // 10 seconds
      },
      reactions: {
        responseRate: 0.1, // Rarely respond
        maxResponses: 1,
        cooldown: 60000 // 1 minute between responses
      },
      gameInfluence: {
        inputWeight: 0.0, // Ignore game inputs
        effectOnOthers: 0.0 // No influence on game state
      },
      memory: {
        writePermission: false, // No memory writes
        readPermission: true // Can read existing memory
      }
    };

    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupShadowBans();
    }, 300000); // Every 5 minutes
  }

  /**
   * Check if user should be shadow-banned
   * @param {string} userId - User ID
   * @returns {boolean} Should be shadow-banned
   */
  shouldShadowBan(userId) {
    // Check if already shadow-banned
    if (this.shadowBannedUsers.has(userId)) {
      return true;
    }

    // Check trust score
    const trustScore = this.trustSystem.getTrustScore(userId);
    if (trustScore >= this.config.trustThreshold) {
      return false;
    }

    // Calculate disruption score
    const disruptionScore = this.calculateDisruptionScore(userId);
    
    // Check if disruption score exceeds threshold
    if (disruptionScore >= 0.7) {
      return true;
    }

    return false;
  }

  /**
   * Calculate disruption score for user
   * @param {string} userId - User ID
   * @returns {number} Disruption score (0-1)
   */
  calculateDisruptionScore(userId) {
    const memory = this.memorySystem.getT2UserMemory(userId);
    const trustScore = this.trustSystem.getTrustScore(userId);
    
    let score = 0;

    // Trust score factor (lower trust = higher disruption)
    if (trustScore < 0.2) {
      score += 0.3;
    } else if (trustScore < 0.3) {
      score += 0.2;
    }

    // Behavioral patterns from memory
    if (memory.behavior_patterns) {
      const patterns = memory.behavior_patterns;
      
      // Prompt injection attempts
      if (patterns.prompt_injection) {
        score += this.config.signals.promptInjection * patterns.prompt_injection;
      }

      // Spam velocity
      if (patterns.spam_frequency) {
        score += this.config.signals.spamVelocity * Math.min(patterns.spam_frequency / 10, 1);
      }

      // Rule pushing
      if (patterns.rule_pushing) {
        score += this.config.signals.repeatedRulePushes * patterns.rule_pushing;
      }

      // Attention seeking
      if (patterns.attention_seeking) {
        score += this.config.signals.attentionSeeking * patterns.attention_seeking;
      }

      // Harassment
      if (patterns.harassment) {
        score += this.config.signals.harassment * patterns.harassment;
      }
    }

    // Recent activity analysis
    const recentActivity = this.analyzeRecentActivity(userId);
    score += recentActivity;

    return Math.min(score, 1.0);
  }

  /**
   * Analyze recent activity for disruption patterns
   * @param {string} userId - User ID
   * @returns {number} Activity disruption score
   */
  analyzeRecentActivity(userId) {
    const t0Context = this.memorySystem.getT0Context();
    const messages = t0Context.messages || [];
    
    const userMessages = messages.filter(m => m.userId === userId);
    
    if (userMessages.length === 0) {
      return 0;
    }

    let activityScore = 0;

    // Message frequency
    const recentMessages = userMessages.filter(m => Date.now() - m.timestamp < 60000); // 1 minute
    const messageRate = recentMessages.length / 60; // per second

    if (messageRate > 2) {
      activityScore += 0.2;
    } else if (messageRate > 1) {
      activityScore += 0.1;
    }

    // Repeated content
    const contentMap = new Map();
    recentMessages.forEach(msg => {
      const content = msg.message.toLowerCase().trim();
      contentMap.set(content, (contentMap.get(content) || 0) + 1);
    });

    const maxRepeats = Math.max(...contentMap.values());
    if (maxRepeats >= 3) {
      activityScore += 0.2;
    } else if (maxRepeats >= 2) {
      activityScore += 0.1;
    }

    // All caps messages
    const allCapsCount = recentMessages.filter(msg => 
      msg.message === msg.message.toUpperCase() && msg.message.length > 5
    ).length;

    if (allCapsCount > recentMessages.length * 0.5) {
      activityScore += 0.1;
    }

    return Math.min(activityScore, 0.5);
  }

  /**
   * Apply shadow-ban to user
   * @param {string} userId - User ID
   * @returns {object} Shadow-ban data
   */
  applyShadowBan(userId) {
    if (this.shadowBannedUsers.size >= this.config.maxShadowBans) {
      console.warn('⚠️ Maximum shadow-bans reached, cannot add:', userId);
      return null;
    }

    const shadowBanData = {
      userId,
      appliedAt: Date.now(),
      expiresAt: Date.now() + this.config.decayDuration,
      originalTrustScore: this.trustSystem.getTrustScore(userId),
      disruptionScore: this.calculateDisruptionScore(userId),
      effects: { ...this.effects },
      decayCount: 0,
      lastActivity: Date.now()
    };

    this.shadowBannedUsers.set(userId, shadowBanData);

    console.log(`🌑️ Shadow-ban applied: ${userId} (disruption: ${shadowBanData.disruptionScore.toFixed(2)})`);
    
    return shadowBanData;
  }

  /**
   * Remove shadow-ban from user
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  removeShadowBan(userId) {
    const shadowBanData = this.shadowBannedUsers.get(userId);
    
    if (!shadowBanData) {
      return false;
    }

    this.shadowBannedUsers.delete(userId);
    
    console.log(`✅ Shadow-ban removed: ${userId}`);
    
    return true;
  }

  /**
   * Check if user is shadow-banned
   * @param {string} userId - User ID
   * @returns {boolean} Shadow-ban status
   */
  isShadowBanned(userId) {
    const shadowBanData = this.shadowBannedUsers.get(userId);
    
    if (!shadowBanData) {
      return false;
    }

    // Check if expired
    if (Date.now() > shadowBanData.expiresAt) {
      this.shadowBannedUsers.delete(userId);
      return false;
    }

    return true;
  }

  /**
   * Get shadow-ban data for user
   * @param {string} userId - User ID
   * @returns {object|null} Shadow-ban data
   */
  getShadowBanData(userId) {
    const data = this.shadowBannedUsers.get(userId);
    
    if (!data) {
      return null;
    }

    // Update last activity
    data.lastActivity = Date.now();

    return data;
  }

  /**
   * Process message from potentially shadow-banned user
   * @param {string} userId - User ID
   * @param {string} message - Message content
   * @param {object} context - Message context
   * @returns {object} Processing result
   */
  processMessage(userId, message, context = {}) {
    const shadowBanData = this.getShadowBanData(userId);
    
    if (!shadowBanData) {
      return { processed: true, priority: 1.0, shouldRespond: true };
    }

    // Update last activity
    shadowBanData.lastActivity = Date.now();

    // Apply shadow-ban effects
    const result = {
      processed: true,
      priority: shadowBanData.effects.chatReading.priority,
      shouldRespond: this.shouldRespond(shadowBanData),
      responseDelay: this.getResponseDelay(shadowBanData),
      memoryWriteAllowed: shadowBanData.effects.memory.writePermission,
      gameInfluence: shadowBanData.effects.gameInfluence.inputWeight
    };

    // Check for clean behavior (escape condition)
    if (this.isCleanBehavior(userId, message)) {
      shadowBanData.decayCount++;
      
      // Remove shadow-ban after enough clean behavior
      if (shadowBanData.decayCount >= 5) {
        this.removeShadowBan(userId);
        result.escaped = true;
      }
    }

    return result;
  }

  /**
   * Check if user behavior is clean (for escape condition)
   * @param {string} userId - User ID
   * @param {string} message - Message content
   * @returns {boolean} Clean behavior
   */
  isCleanBehavior(userId, message) {
    const shadowBanData = this.getShadowBanData(userId);
    if (!shadowBanData) return true;

    const timeSinceBan = Date.now() - shadowBanData.appliedAt;
    
    // Must be shadow-banned for at least 30 minutes
    if (timeSinceBan < 30 * 60 * 1000) {
      return false;
    }

    // Check for clean message indicators
    const cleanIndicators = [
      message.length < 50, // Short message
      message === message.toLowerCase(), // No caps
      !message.includes('!!!'), // No excessive punctuation
      !message.includes('?'), // No questions
      !message.includes('!'), // No exclamations
      !message.includes('@acey') // No direct mentions
    ];

    const cleanScore = cleanIndicators.filter(Boolean).length / cleanIndicators.length;
    
    return cleanScore >= 0.8;
  }

  /**
   * Check if Acey should respond to user
   * @param {object} shadowBanData - Shadow-ban data
   * @returns {boolean} Should respond
   */
  shouldRespond(shadowBanData) {
    const timeSinceLastResponse = Date.now() - (shadowBanData.lastResponse || 0);
    
    // Check cooldown
    if (timeSinceLastResponse < shadowBanData.effects.reactions.cooldown) {
      return false;
    }

    // Check response limit
    const responseCount = shadowBanData.responseCount || 0;
    if (responseCount >= shadowBanData.effects.reactions.maxResponses) {
      return false;
    }

    // Random chance based on response rate
    const random = Math.random();
    return random < shadowBanData.effects.reactions.responseRate;
  }

  /**
   * Get response delay for shadow-banned user
   * @param {object} shadowBanData - Shadow-ban data
   * @returns {number} Delay in milliseconds
   */
  getResponseDelay(shadowBanData) {
    // Add random delay for shadow-banned users
    return Math.random() * 3000 + 1000; // 1-4 seconds
  }

  /**
   * Update response count for user
   * @param {string} userId - User ID
   */
  updateResponseCount(userId) {
    const shadowBanData = this.shadowBannedUsers.get(userId);
    if (shadowBanData) {
      shadowBanData.lastResponse = Date.now();
      shadowBanData.responseCount = (shadowBanData.responseCount || 0) + 1;
    }
  }

  /**
   * Get message priority for user
   * @param {string} userId - User ID
   * @returns {number} Message priority (0-1)
   */
  getMessagePriority(userId) {
    const shadowBanData = this.getShadowBanData(userId);
    
    if (!shadowBanData) {
      return 1.0; // Normal priority
    }

    return shadowBanData.effects.chatReading.priority;
  }

  /**
   * Check if user input should affect game
   * @param {string} userId - User ID
   * @returns {number} Input weight (0-1)
   */
  getGameInfluenceWeight(userId) {
    const shadowBanData = this.getShadowBanData(userId);
    
    if (!shadowBanData) {
      return 1.0; // Normal influence
    }

    return shadowBanData.effects.gameInfluence.inputWeight;
  }

  /**
   * Check if user can write to memory
   * @param {string} userId - User ID
   * @returns {boolean} Write permission
   */
  getMemoryWritePermission(userId) {
    const shadowBanData = this.getShadowBanData(userId);
    
    if (!shadowBanData) {
      return true; // Normal permission
    }

    return shadowBanData.effects.memory.writePermission;
  }

  /**
   * Get all shadow-banned users
   * @returns {Array} Shadow-banned users data
   */
  getShadowBannedUsers() {
    const users = [];
    
    for (const [userId, data] of this.shadowBannedUsers) {
      users.push({
        userId,
        appliedAt: data.appliedAt,
        expiresAt: data.expiresAt,
        disruptionScore: data.disruptionScore,
        originalTrustScore: data.originalTrustScore,
        decayCount: data.decayCount,
        lastActivity: data.lastActivity,
        timeRemaining: Math.max(0, data.expiresAt - Date.now())
      });
    }

    return users;
  }

  /**
   * Cleanup expired shadow-bans
   */
  cleanupShadowBans() {
    const now = Date.now();
    const expired = [];

    for (const [userId, data] of this.shadowBannedUsers) {
      if (now > data.expiresAt) {
        expired.push(userId);
      }
    }

    expired.forEach(userId => {
      this.removeShadowBan(userId);
    });

    if (expired.length > 0) {
      console.log(`🧹 Cleaned up ${expired.length} expired shadow-bans`);
    }
  }

  /**
   * Get shadow-ban statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const users = this.getShadowBannedUsers();
    
    return {
      totalShadowBans: users.length,
      averageDisruptionScore: users.length > 0 ? 
        users.reduce((sum, u) => sum + u.disruptionScore, 0) / users.length : 0,
      averageOriginalTrust: users.length > 0 ? 
        users.reduce((sum, u) => sum + u.originalTrustScore, 0) / users.length : 0,
      averageDecayCount: users.length > 0 ? 
        users.reduce((sum, u) => sum + u.decayCount, 0) / users.length : 0,
      oldestBan: users.length > 0 ? Math.min(...users.map(u => u.appliedAt)) : null,
      newestBan: users.length > 0 ? Math.max(...users.map(u => u.appliedAt)) : null
    };
  }

  /**
   * Test shadow-ban functionality
   * @param {string} userId - Test user ID
   * @returns {object} Test result
   */
  testShadowBan(userId) {
    return {
      shouldShadowBan: this.shouldShadowBan(userId),
      disruptionScore: this.calculateDisruptionScore(userId),
      isShadowBanned: this.isShadowBan(userId),
      shadowBanData: this.getShadowBanData(userId)
    };
  }

  /**
   * Destroy the shadow-ban system
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.shadowBannedUsers.clear();
    console.log('🌑️ Shadow-ban intelligence destroyed');
  }
}

module.exports = ShadowBanIntelligence;
