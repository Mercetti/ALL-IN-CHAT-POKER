/**
 * Advanced Acey Intelligence Integration
 * Combines all advanced modules with the existing memory/trust system
 */

const EmotionInference = require('./emotion-inference');
const CommunityVoting = require('./community-voting');
const ShadowBanIntelligence = require('./shadow-ban');
const SelfEvaluationLoops = require('./self-evaluation');
const TrustDrivenPacing = require('./trust-pacing');

class AdvancedAceyIntelligence {
  constructor(memorySystem, trustSystem, behaviorModulation, io) {
    this.memorySystem = memorySystem;
    this.trustSystem = trustSystem;
    this.behaviorModulation = behaviorModulation;
    this.io = io;

    // Initialize all advanced modules
    this.emotionInference = new EmotionInference(memorySystem);
    this.communityVoting = new CommunityVoting(memorySystem, io);
    this.shadowBanIntelligence = new ShadowBanIntelligence(trustSystem, memorySystem);
    this.selfEvaluationLoops = new SelfEvaluationLoops(memorySystem, trustSystem, behaviorModulation);
    this.trustDrivenPacing = new TrustDrivenPacing(trustSystem, this.emotionInference, memorySystem);

    // Integration state
    this.integrationState = {
      active: true,
      lastUpdate: Date.now(),
      moduleStatus: {
        emotionInference: 'active',
        communityVoting: 'active',
        shadowBanIntelligence: 'active',
        selfEvaluationLoops: 'active',
        trustDrivenPacing: 'active'
      }
    };

    console.log('🧠 Advanced Acey Intelligence initialized');
  }

  /**
   * Process message through all advanced systems
   * @param {string} userId - User ID
   * @param {string} message - Message content
   * @param {object} context - Message context
   * @returns {object} Processing result
   */
  processMessage(userId, message, context = {}) {
    if (!this.integrationState.active) {
      return { processed: true, shouldRespond: true };
    }

    const result = {
      originalMessage: message,
      processedMessage: message,
      shouldRespond: true,
      priority: 1.0,
      responseDelay: 0,
      memoryWriteAllowed: true,
      gameInfluence: 1.0,
      presentation: {},
      shadowBanned: false,
      injectionDetected: false
    };

    try {
      // 1. Shadow-ban check (first - affects everything else)
      const shadowBanResult = this.shadowBanIntelligence.processMessage(userId, message, context);
      
      if (shadowBanResult.processed === false) {
        result.shouldRespond = false;
        result.shadowBanned = true;
        return result;
      }

      // Apply shadow-ban effects
      result.priority = shadowBanResult.priority || 1.0;
      result.shouldRespond = shadowBanResult.shouldRespond || true;
      result.responseDelay = shadowBanResult.responseDelay || 0;
      result.memoryWriteAllowed = shadowBanResult.memoryWriteAllowed || true;
      result.gameInfluence = shadowBanResult.gameInfluence || 1.0;
      result.shadowBanned = this.shadowBanIntelligence.isShadowBanned(userId);

      // 2. Process through base memory/trust system
      const baseResult = this.memorySystem.processMessage(userId, message, context);
      
      if (baseResult.shouldRespond === false) {
        result.shouldRespond = false;
        return result;
      }

      // 3. Get presentation settings
      result.presentation = this.trustDrivenPacing.getGamePresentation(userId);

      // 4. Update pacing based on current conditions
      this.trustDrivenPacing.updatePacing(userId);

      // 5. Trigger self-evaluation if needed
      if (Math.random() < 0.01) { // 1% chance per message
        this.selfEvaluationLoops.performSelfEvaluation('random_trigger');
      }

      result.processed = true;

    } catch (error) {
      console.error('❌ Advanced processing error:', error);
      result.shouldRespond = false;
    }

    return result;
  }

  /**
   * Modulate response through all advanced systems
   * @param {string} userId - User ID
   * @param {string} baseResponse - Base response
   * @param {object} context - Response context
   * @returns {string} Modulated response
   */
  modulateResponse(userId, baseResponse, context = {}) {
    if (!this.integrationState.active) {
      return baseResponse;
    }

    try {
      // 1. Base behavior modulation
      let response = this.behaviorModulation.modulateResponse(userId, baseResponse, context);

      // 2. Apply self-evaluation adjustments
      const adjustments = this.selfEvaluationLoops.getCurrentAdjustments();
      
      if (adjustments.increase_humor) {
        response = this.addHumor(response);
      }
      
      if (adjustments.reduce_response_rate > 0 && Math.random() < adjustments.reduce_response_rate) {
        response = null; // Skip response
      }
      
      if (adjustments.tone_bias === 'calmer') {
        response = this.calmTone(response);
      } else if (adjustments.tone_bias === 'more_cautious') {
        response = this.cautiousTone(response);
      }

      // 3. Apply pacing-based adjustments
      const pacing = this.trustDrivenPacing.getCurrentPacing();
      const energyLevel = this.trustDrivenPacing.getEnergyLevel(userId);
      
      if (energyLevel === 'high' && pacing.speedMultiplier > 1.2) {
        response = this.energizeResponse(response);
      } else if (energyLevel === 'low') {
        response = this.softenResponse(response);
      }

      return response;

    } catch (error) {
      console.error('❌ Response modulation error:', error);
      return baseResponse;
    }
  }

  /**
   * Handle game events through advanced systems
   * @param {string} userId - User ID (optional)
   * @param {object} gameEvent - Game event data
   * @returns {object} Processed game event
   */
  processGameEvent(userId = null, gameEvent) {
    if (!this.integrationState.active) {
      return gameEvent;
    }

    try {
      // 1. Apply hype to event
      const hypedEvent = this.trustDrivenPacing.applyHypeToGameEvent(userId, gameEvent);

      // 2. Add to T0 context
      this.memorySystem.addT0GameAction(gameEvent.type);

      // 3. Update hype level
      if (gameEvent.type === 'win') {
        this.memorySystem.updateHypeLevel(0.2);
      } else if (gameEvent.type === 'loss') {
        this.memorySystem.updateHypeLevel(-0.1);
      }

      // 4. Trigger self-evaluation for major events
      if (gameEvent.major) {
        this.selfEvaluationLoops.triggerMajorEventEvaluation(gameEvent.type);
      }

      return hypedEvent;

    } catch (error) {
      console.error('❌ Game event processing error:', error);
      return gameEvent;
    }
  }

  /**
   * Start stream session with advanced features
   * @param {string} sessionId - Session ID
   * @param {object} streamInfo - Stream information
   */
  startStreamSession(sessionId, streamInfo = {}) {
    // Start base session
    this.memorySystem.startSession(sessionId, streamInfo);

    // Reset pacing
    this.trustDrivenPacing.resetPacing();

    // Enable all modules
    this.integrationState.active = true;
    this.integrationState.lastUpdate = Date.now();

    console.log(`🎮 Advanced stream session started: ${sessionId}`);
  }

  /**
   * End stream session with advanced cleanup
   * @returns {object} Session summary
   */
  endStreamSession() {
    // Perform stream end self-evaluation
    const evaluation = this.selfEvaluationLoops.triggerStreamEndEvaluation();

    // End base session
    const summary = this.memorySystem.endSession();

    // Propose community votes for notable moments
    if (summary && summary.notable_events) {
      summary.notable_events.forEach((event, index) => {
        if (index < 3) { // Limit to top 3 events
          this.communityVoting.proposeVote(
            event,
            'community_moment',
            { session_id: summary.session_id }
          );
        }
      });
    }

    // Update integration state
    this.integrationState.active = false;
    this.integrationState.lastUpdate = Date.now();

    console.log('🏁 Advanced stream session ended');

    return {
      ...summary,
      selfEvaluation: evaluation,
      communityVotes: this.communityVoting.getActiveVotes()
    };
  }

  /**
   * Handle community vote
   * @param {string} voteId - Vote ID
   * @param {string} userId - User ID
   * @param {string} voteType - Vote type
   * @returns {object} Vote result
   */
  handleCommunityVote(voteId, userId, voteType) {
    return this.communityVoting.handleVote(voteId, userId, voteType);
  }

  /**
   * Get comprehensive system statistics
   * @returns {object} System statistics
   */
  getSystemStatistics() {
    return {
      integration: {
        active: this.integrationState.active,
        lastUpdate: this.integrationState.lastUpdate,
        moduleStatus: this.integrationState.moduleStatus
      },
      emotionInference: {
        currentAtmosphere: this.emotionInference.getCurrentAtmosphere(),
        atmosphereHistory: this.emotionInference.getAtmosphereHistory(5),
        currentSignals: this.emotionInference.getCurrentSignals()
      },
      communityVoting: this.communityVoting.getStatistics(),
      shadowBanIntelligence: this.shadowBanIntelligence.getStatistics(),
      selfEvaluationLoops: this.selfEvaluationLoops.getStatistics(),
      trustDrivenPacing: this.trustDrivenPacing.getPacingStatistics(),
      memorySystem: this.memorySystem.getT2UserMemory ? 
        this.memorySystem.t2UserMemory.size : 0,
      trustSystem: this.trustSystem.getStatistics()
    };
  }

  /**
   * Get system health status
   * @returns {object} Health status
   */
  getSystemHealth() {
    const health = {
      status: 'healthy',
      issues: [],
      recommendations: []
    };

    // Check module health
    Object.entries(this.integrationState.moduleStatus).forEach(([module, status]) => {
      if (status !== 'active') {
        health.issues.push(`${module} is ${status}`);
        health.status = 'degraded';
      }
    });

    // Check shadow-ban ratio
    const shadowBanStats = this.shadowBanIntelligence.getStatistics();
    if (shadowBanStats.totalShadowBans > 20) {
      health.issues.push('High shadow-ban count detected');
      health.recommendations.push('Review community behavior patterns');
    }

    // Check evaluation frequency
    const evalStats = this.selfEvaluationLoops.getStatistics();
    if (evalStats.totalEvaluations > 100) {
      health.recommendations.push('Consider reducing evaluation frequency');
    }

    return health;
  }

  /**
   * Apply temporary adjustments
   * @param {object} adjustments - Adjustments to apply
   * @param {number} duration - Duration in milliseconds
   */
  applyTemporaryAdjustments(adjustments, duration = 300000) {
    // Apply pacing adjustments
    if (adjustments.pacing) {
      this.trustDrivenPacing.setTemporaryPacing(adjustments.pacing, duration);
    }

    // Apply self-evaluation adjustments
    if (adjustments.selfEvaluation) {
      this.selfEvaluationLoops.applyAdjustments(adjustments.selfEvaluation);
    }

    console.log(`🔧 Temporary adjustments applied for ${duration/1000}s`);
  }

  /**
   * Reset all advanced systems
   */
  resetAllSystems() {
    // Reset pacing
    this.trustDrivenPacing.resetPacing();

    // Reset self-evaluation
    this.selfEvaluationLoops.resetAdjustments();

    // Cancel all votes
    const activeVotes = this.communityVoting.getActiveVotes();
    activeVotes.forEach(vote => {
      this.communityVoting.cancelVote(vote.id);
    });

    console.log('🔄 All advanced systems reset');
  }

  // Helper methods for response modification
  addHumor(response) {
    const humorAdditions = [' 😄', ' 😂', ' 😉', ' 😊'];
    const addition = humorAdditions[Math.floor(Math.random() * humorAdditions.length)];
    return response + addition;
  }

  calmTone(response) {
    return response.replace(/[!]/gu, '.').replace(/[🔥⚡💥]/gu, '✨');
  }

  cautiousTone(response) {
    return response.replace(/always/giu, 'usually').replace(/never/giu, 'rarely');
  }

  energizeResponse(response) {
    return response + ' 🔥';
  }

  softenResponse(response) {
    return response.replace(/[!]/gu, '.').replace(/[🔥⚡]/gu, '');
  }

  /**
   * Destroy all advanced systems
   */
  destroy() {
    this.emotionInference.destroy();
    this.communityVoting.destroy();
    this.shadowBanIntelligence.destroy();
    this.selfEvaluationLoops.destroy();
    this.trustDrivenPacing.destroy();

    this.integrationState.active = false;
    this.integrationState.lastUpdate = Date.now();

    console.log('🧠 Advanced Acey Intelligence destroyed');
  }
}

module.exports = AdvancedAceyIntelligence;
