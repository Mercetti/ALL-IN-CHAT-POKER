/**
 * Trust-Driven Game Difficulty and Hype Pacing System
 * Affects presentation, not outcomes
 * Makes the game feel alive without unfairness
 */

class TrustDrivenPacing {
  constructor(trustSystem, emotionInference, memorySystem) {
    this.trustSystem = trustSystem;
    this.emotionInference = emotionInference;
    this.memorySystem = memorySystem;
    
    // Pacing configuration
    this.config = {
      minTrustForFastPacing: 0.6,
      hypeThreshold: 0.7,
      chaosThreshold: 0.3,
      maxSpeedMultiplier: 2.0,
      minSpeedMultiplier: 0.5,
      baseRoundTime: 30000, // 30 seconds
      minRoundTime: 15000, // 15 seconds
      maxRoundTime: 120000 // 2 minutes
    };

    // Current pacing state
    this.currentPacing = {
      speedMultiplier: 1.0,
      roundTime: this.config.baseRoundTime,
      commentaryLevel: 'normal',
      presentationStyle: 'standard',
      energyLevel: 'medium'
    };

    // Hype configuration
    this.hypeEffects = {
      calm: {
        pacing: 'slow',
        commentary: 'minimal',
        presentation: 'subtle',
        energy: 'low'
      },
      hype: {
        pacing: 'fast',
        commentary: 'frequent',
        presentation: 'energetic',
        energy: 'high'
      },
      tense: {
        pacing: 'steady',
        commentary: 'cautious',
        presentation: 'focused',
        energy: 'medium'
      },
      chaotic: {
        pacing: 'controlled',
        commentary: 'minimal',
        presentation: 'structured',
        energy: 'medium'
      },
      frustrated: {
        pacing: 'steady',
        commentary: 'reassuring',
        presentation: 'supportive',
        energy: 'medium'
      },
      celebratory: {
        pacing: 'dynamic',
        commentary: 'enthusiastic',
        presentation: 'excited',
        energy: 'high'
      }
    };

    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredAdjustments();
    }, 300000); // 5 minutes
  }

  /**
   * Calculate optimal pacing based on trust and atmosphere
   * @param {string} userId - User ID (optional, for user-specific pacing)
   * @returns {object} Pacing configuration
   */
  calculateOptimalPacing(userId = null) {
    // Get average trust score (or user-specific if provided)
    let avgTrustScore;
    
    if (userId) {
      avgTrustScore = this.trustSystem.getTrustScore(userId);
    } else {
      // Calculate average trust from all users
      const trustScores = [];
      const userMemories = this.memorySystem.t2UserMemory || new Map();
      
      for (const [id, memory] of userMemories) {
        trustScores.push(memory.trust_score || 0.5);
      }
      
      avgTrustScore = trustScores.length > 0 ? 
        trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length : 0.5;
    }

    // Get current atmospheric state
    const atmosphere = this.emotionInference.getCurrentAtmosphere();
    
    // Calculate pacing based on trust and atmosphere
    let pacing = { ...this.currentPacing };

    // Trust-based adjustments
    if (avgTrustScore >= this.config.minTrustForFastPacing && 
        (atmosphere === 'hype' || atmosphere === 'celebratory')) {
      pacing.speedMultiplier = Math.min(
        this.config.maxSpeedMultiplier,
        1.0 + (avgTrustScore - 0.6) * 0.5
      );
      pacing.roundTime = Math.max(
        this.config.minRoundTime,
        this.config.baseRoundTime * (1.2 - avgTrustScore * 0.3)
      );
      pacing.commentaryLevel = 'high';
      pacing.presentationStyle = 'energetic';
    } else if (avgTrustScore < this.config.chaosThreshold) {
      pacing.speedMultiplier = this.config.minSpeedMultiplier;
      pacing.roundTime = Math.min(
        this.config.maxRoundTime,
        this.config.baseRoundTime * 1.5
      );
      pacing.commentaryLevel = 'minimal';
      pacing.presentationStyle = 'subtle';
    } else {
      pacing.speedMultiplier = 1.0;
      pacing.roundTime = this.config.baseRoundTime;
      pacing.commentaryLevel = 'normal';
      pacing.presentationStyle = 'standard';
    }

    // Atmosphere-based adjustments
    if (atmosphere === 'chaotic') {
      pacing.speedMultiplier *= 0.8; // Slow down in chaos
      pacing.roundTime *= 1.2; // Give more time
      pacing.commentaryLevel = 'minimal';
    } else if (atmosphere === 'tense') {
      pacing.speedMultiplier *= 0.9;
      pacing.commentaryLevel = 'cautious';
    } else if (atmosphere === 'celebratory') {
      pacing.speedMultiplier *= 1.1;
      pacing.commentaryLevel = 'enthusiastic';
    } else if (atmosphere === 'calm') {
      pacing.speedMultiplier *= 0.9;
      pacing.commentaryLevel = 'minimal';
    }

    // Apply limits
    pacing.speedMultiplier = Math.max(
      this.config.minSpeedMultiplier,
      Math.min(this.config.maxSpeedMultiplier, pacing.speedMultiplier)
    );
    pacing.roundTime = Math.max(
      this.config.minRoundTime,
      Math.min(this.config.maxRoundTime, pacing.roundTime)
    );

    return pacing;
  }

  /**
   * Get hype level for presentation
   * @param {string} userId - User ID (optional)
   * @returns {string} Hype level
   */
  getHypeLevel(userId = null) {
    const avgTrustScore = userId ? 
      this.trustSystem.getTrustScore(userId) : 
      this.getAverageTrustScore();
    
    const atmosphere = this.emotionInference.getCurrentAtmosphere();
    
    // Combine trust and atmosphere for hype level
    const hypeScore = (avgTrustScore * 0.6) + (atmosphere === 'hype' ? 0.4 : 0);
    
    if (hypeScore >= 0.8) return 'maximum';
    if (hypeScore >= 0.6) return 'high';
    if (hypeScore >= 0.4) return 'medium';
    if (hypeScore >= 0.2) return 'low';
    return 'minimal';
  }

  /**
   * Get average trust score from all users
   * @returns {number} Average trust score
   */
  getAverageTrustScore() {
    const trustScores = [];
    const userMemories = this.memorySystem.t2UserMemory || new Map();
    
    for (const [id, memory] of userMemories) {
      trustScores.push(memory.trust_score || 0.5);
    }
    
    return trustScores.length > 0 ? 
      trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length : 0.5;
  }

  /**
   * Update pacing based on current conditions
   * @param {string} userId - User ID (optional)
   */
  updatePacing(userId = null) {
    const newPacing = this.calculateOptimalPacing(userId);
    
    // Check if significant change
    const speedChange = Math.abs(newPacing.speedMultiplier - this.currentPacing.speedMultiplier);
    const timeChange = Math.abs(newPacing.roundTime - this.currentPacing.roundTime);
    
    if (speedChange > 0.1 || timeChange > 5000) {
      this.currentPacing = newPacing;
      console.log(`⚡️ Pacing updated: speed=${newPacing.speedMultiplier.toFixed(2)}x, time=${newPacing.roundTime/1000}s`);
    }
  }

  /**
   * Get current pacing configuration
   * @returns {object} Current pacing
   */
  getCurrentPacing() {
    return { ...this.currentPacing };
  }

  /**
   * Get presentation style for user
   * @param {string} userId - User ID (optional)
   * @returns {object} Presentation style
   */
  getPresentationStyle(userId = null) {
    const trustScore = userId ? 
      this.trustSystem.getTrustScore(userId) : 
      this.getAverageTrustScore();
    
    const atmosphere = this.emotionInference.getCurrentAtmosphere();
    
    const recommendations = this.behaviorModulation.getResponseStyle(userId);
    
    // Combine factors for presentation style
    let presentationStyle = recommendations.responseStyle || 'neutral';
    
    // Adjust based on trust
    if (trustScore >= 0.8) {
      presentationStyle = 'personalized';
    } else if (trustScore < 0.3) {
      presentationStyle = 'formal';
    }
    
    // Adjust based on atmosphere
    if (atmosphere === 'celebratory') {
      presentationStyle = 'excited';
    } else if (atmosphere === 'calm') {
      presentationStyle = 'gentle';
    } else if (atmosphere === 'tense') {
      presentationStyle = 'focused';
    }
    
    return presentationStyle;
  }

  /**
   * Get commentary level for user
   * @param {string} userId - User ID (optional)
   * @returns {string} Commentary level
   */
  getCommentaryLevel(userId = null) {
    const trustScore = userId ? 
      this.trustScore.getTrustScore(userId) : 
      this.getAverageTrustScore();
    
    const atmosphere = this.emotionInference.getCurrentAtmosphere();
    
    // Combine factors for commentary level
    let commentaryLevel = 'normal';
    
    // Adjust based on trust
    if (trustScore >= 0.8) {
      commentaryLevel = 'frequent';
    } else if (trustScore < 0.3) {
      commentaryLevel = 'minimal';
    }
    
    // Adjust based on atmosphere
    if (atmosphere === 'hype' || atmosphere === 'celebratory') {
      commentaryLevel = 'high';
    } else if (atmosphere === 'calm') {
      commentaryLevel = 'low';
    } else if (atmosphere === 'tense') {
      commentaryLevel = 'cautious';
    }
    
    return commentaryLevel;
  }

  /**
   * Get energy level for user
   * @param {string} userId - User ID (optional)
   * @returns {string} Energy level
   */
  getEnergyLevel(userId = null) {
    const trustScore = userId ? 
      this.trustSystem.getTrustScore(userId) : 
      this.getAverageTrustScore();
    
    const atmosphere = this.emotionInference.getCurrentAtmosphere();
    
    // Combine factors for energy level
    let energyLevel = 'medium';
    
    // Adjust based on trust
    if (trustScore >= 0.8) {
      energyLevel = 'high';
    } else if (trustScore < 0.3) {
      energyLevel = 'low';
    }
    
    // Adjust based on atmosphere
    if (atmosphere === 'hype' || atmosphere === 'celebratory') {
      energyLevel = 'maximum';
    } else if (atmosphere === 'calm') {
      energyLevel = 'low';
    } else if (atmosphere === 'tense') {
      energyLevel = 'medium';
    }
    
    return energyLevel;
  }

  /**
   * Apply hype to game events
   * @param {string} userId - User ID (optional)
   * @param {object} gameEvent - Game event data
   * @returns {object} Modified game event
   */
  applyHypeToGameEvent(userId = null, gameEvent) {
    const hypeLevel = this.getHypeLevel(userId);
    
    // Modify event based on hype level
    const modifiedEvent = { ...gameEvent };
    
    switch (hypeLevel) {
      case 'maximum':
        modifiedEvent.hype = 'epic';
        modifiedEvent.celebration = true;
        modifiedEvent.visualEffects = ['sparkles', 'confetti', 'rainbow'];
        break;
      case 'high':
        modifiedEvent.type = 'highlight';
        modifiedEvent.acknowledged = true;
        modifiedEvent.visualEffects = ['glow', 'pulse'];
        break;
      case 'medium':
        modifiedEvent.type = 'normal';
        modifiedEvent.acknowledged = true;
        break;
      case 'low':
        modifiedEvent.type = 'subtle';
        modifiedEvent.acknowledged = false;
        break;
      case 'minimal':
        modifiedEvent.type = 'background';
        modifiedEvent.acknowledged = false;
        break;
    }
    
    return modifiedEvent;
  }

  /**
   * Get feedback intensity for user
   * @param {string} userId - User ID (optional)
   * @returns {object} Feedback configuration
   */
  getFeedbackIntensity(userId = null) {
    const trustScore = userId ? 
      this.trustSystem.getTrustScore(userId) : 
      this.getAverageTrustScore();
    
    const atmosphere = this.emotionInference.getCurrentAtmosphere();
    
    // Calculate feedback intensity
    let intensity = 'normal';
    
    // Adjust based on trust
    if (trustScore >= 0.8) {
      intensity = 'personalized';
    } else if (trustScore < 0.3) {
      intensity = 'minimal';
    }
    
    // Adjust based on atmosphere
    if (atmosphere === 'celebratory') {
      intensity = 'excited';
    } else if (atmosphere === 'hype') {
      intensity = 'energetic';
    } else if (atmosphere === 'calm') {
      intensity = 'gentle';
    }
    
    return intensity;
  }

  /**
   * Get all current pacing statistics
   * @returns {object} Pacing statistics
   */
  getPacingStatistics() {
    const avgTrust = this.getAverageTrustScore();
    const atmosphere = this.emotionInference.getCurrentAtmosphere();
    
    return {
      current: this.currentPacing,
      averageTrust: avgTrust,
      currentAtmosphere: atmosphere,
      trustDistribution: this.trustSystem.getStatistics(),
      atmosphereHistory: this.emotionInference.getAtmosphereHistory(5),
      adjustmentCount: this.currentPacing.speedMultiplier !== 1.0 || 
                       this.currentPacing.roundTime !== this.config.baseRoundTime,
      lastUpdate: Date.now()
    };
  }

  /**
   * Cleanup expired adjustments
   */
  cleanupExpiredAdjustments() {
    const now = Date.now();
    const expireTime = this.config.adjustmentDuration;
    
    if (this.currentPacing.speedMultiplier !== 1.0 && 
        this.lastUpdate && 
        (now - this.lastUpdate) > expireTime) {
      this.resetPacing();
    }
  }

  /**
   * Reset pacing to defaults
   */
  resetPacing() {
    this.currentPacing = {
      speedMultiplier: 1.0,
      roundTime: this.config.baseRoundTime,
      commentaryLevel: 'normal',
      presentationStyle: 'standard',
      energyLevel: 'medium'
    };
    
    console.log('🔄 Pacing reset to defaults');
  }

  /**
   * Set temporary pacing override
   * @param {object} pacing - Pacing configuration
   * @param {number} duration - Duration in milliseconds
   */
  setTemporaryPacing(pacing, duration = 300000) {
    const oldPacing = { ...this.currentPacing };
    
    this.currentPacing = { ...pacing };
    
    // Reset after duration
    setTimeout(() => {
      this.currentPacing = oldPacing;
    }, duration);
    
    console.log(`⏃️ Temporary pacing applied: speed=${pacing.speedMultiplier}x for ${duration/1000}s`);
  }

  /**
   * Get recommended game presentation for current conditions
   * @returns {object} Game presentation settings
   */
  getGamePresentation() {
    const avgTrust = this.getAverageTrustScore();
    const atmosphere = this.emotionInference.getCurrentAtmosphere();
    
    const presentation = {
      pacing: this.currentPacing,
      trustLevel: avgTrust >= 0.6 ? 'trusted' : 'normal',
      atmosphere: atmosphere,
      hypeLevel: this.getHypeLevel(),
      presentationStyle: this.getPresentationStyle(),
      commentaryLevel: this.getCommentaryLevel(),
      energyLevel: this.getEnergyLevel(),
      visualEffects: this.getVisualEffects()
    };

    return presentation;
  }

  /**
   * Get visual effects for current conditions
   * @returns {Array} Visual effects
   */
  getVisualEffects() {
    const atmosphere = this.emotionInference.getCurrentAtmosphere();
    const hypeLevel = this.getHypeLevel();
    
    const effects = [];
    
    // Base effects
    effects.push('standard');
    
    // Add atmospheric effects
    if (atmosphere === 'celebratory') {
      effects.push('confetti');
    } else if (atmosphere === 'hype') {
      effects.push('sparkles');
    } else if (atmosphere === 'chaotic') {
      effects.push('warning');
    }
    
    // Add hype effects
    if (hypeLevel === 'maximum') {
      effects.push('rainbow');
      effects.push('confetti');
      effects.push('pulse');
    } else if (hypeLevel === 'high') {
      effects.push('glow');
    } else if (hypeLevel === 'low') {
      effects.push('dim');
    }
    
    return effects;
  }

  /**
   * Destroy the pacing system
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.resetPacing();
    
    console.log('⚡️ Trust-driven pacing system destroyed');
  }
}

module.exports = TrustDrivenPacing;
