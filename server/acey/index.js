/**
 * Acey Memory + Trust System Integration
 * Main entry point that combines all memory and trust components
 */

const MemorySystem = require('./memory-system');
const TrustSystem = require('./trust-system');
const BehaviorModulation = require('./behavior-modulation');
const PromptInjectionDefense = require('./prompt-injection-defense');
const AceyMemoryDB = require('./memory-db');

class AceyMemoryTrustSystem {
  constructor(config = {}) {
    this.config = {
      dbPath: config.dbPath || './data/acey_memory.db',
      enablePersistence: config.enablePersistence !== false,
      trustDecayInterval: config.trustDecayInterval || 3600000, // 1 hour
      cleanupInterval: config.cleanupInterval || 86400000, // 24 hours
      ...config
    };

    // Initialize core systems
    this.memorySystem = new MemorySystem();
    this.trustSystem = new TrustSystem(this.memorySystem);
    this.behaviorModulation = new BehaviorModulation(this.trustSystem, this.memorySystem);
    this.injectionDefense = new PromptInjectionDefense(this.trustSystem);

    // Initialize database if persistence is enabled
    this.db = null;
    if (this.config.enablePersistence) {
      this.db = new AceyMemoryDB(this.config.dbPath);
      this.loadPersistedMemory();
    }

    // Setup maintenance intervals
    this.setupMaintenanceIntervals();

    console.log('✅ Acey Memory + Trust System initialized');
  }

  /**
   * Load persisted memory from database
   */
  loadPersistedMemory() {
    if (!this.db) return;

    try {
      const stats = this.db.getStatistics();
      console.log(`📊 Loaded ${stats.totalUsers} user memories from database`);
      
      // Load T2 user memories into memory system
      // This would be implemented based on specific needs
    } catch (error) {
      console.warn('⚠️ Failed to load persisted memory:', error.message);
    }
  }

  /**
   * Setup maintenance intervals
   */
  setupMaintenanceIntervals() {
    // Trust decay interval
    if (this.config.trustDecayInterval > 0) {
      this.trustDecayInterval = setInterval(() => {
        this.applyTrustDecay();
      }, this.config.trustDecayInterval);
    }

    // Cleanup interval
    if (this.config.cleanupInterval > 0) {
      this.cleanupInterval = setInterval(() => {
        this.performCleanup();
      }, this.config.cleanupInterval);
    }
  }

  /**
   * Process incoming message through the complete system
   * @param {string} userId - User identifier
   * @param {string} message - Message content
   * @param {object} context - Message context
   * @returns {object} Processing result
   */
  processMessage(userId, message, context = {}) {
    const result = {
      originalMessage: message,
      processedMessage: message,
      shouldRespond: true,
      trustScore: 0.5,
      trustLevel: 'Normal',
      responseStyle: 'neutral',
      injectionDetected: false,
      memoryUpdated: false
    };

    try {
      // 1. Add to T0 ephemeral context
      this.memorySystem.addT0Message(userId, message);

      // 2. Check for prompt injection
      const injectionResult = this.injectionDefense.processMessage(userId, message, context);
      
      if (injectionResult.action === 'block') {
        result.shouldRespond = false;
        result.processedMessage = null;
        result.injectionDetected = true;
        return result;
      }

      if (injectionResult.action === 'warn') {
        result.processedMessage = injectionResult.processedMessage;
        result.injectionDetected = true;
      }

      // 3. Process trust signals
      const newTrustScore = this.trustSystem.processMessage(userId, message, context);
      result.trustScore = newTrustScore;
      result.trustLevel = this.trustSystem.getTrustLevel(newTrustScore);

      // 4. Update T2 user memory if needed
      this.updateUserMemoryFromMessage(userId, message, context);

      // 5. Get behavior modulation recommendations
      const styleRecommendations = this.behaviorModulation.getResponseStyle(userId);
      result.responseStyle = styleRecommendations;

      // 6. Persist to database if enabled
      if (this.db) {
        this.persistUserMemory(userId);
      }

      result.memoryUpdated = true;

    } catch (error) {
      console.error('❌ Error processing message:', error);
      result.shouldRespond = false;
    }

    return result;
  }

  /**
   * Modulate response based on user trust and memory
   * @param {string} userId - User identifier
   * @param {string} baseResponse - Base response from Acey
   * @param {object} context - Response context
   * @returns {string} Modulated response
   */
  modulateResponse(userId, baseResponse, context = {}) {
    return this.behaviorModulation.modulateResponse(userId, baseResponse, context);
  }

  /**
   * Update user memory from message
   * @param {string} userId - User identifier
   * @param {string} message - Message content
   * @param {object} context - Message context
   */
  updateUserMemoryFromMessage(userId, message, context) {
    const memory = this.memorySystem.getT2UserMemory(userId);
    
    // Extract behavioral patterns
    const patterns = this.extractBehavioralPatterns(message);
    
    // Update memory if patterns detected
    if (Object.keys(patterns).length > 0) {
      const updatedPatterns = { ...memory.behavior_patterns, ...patterns };
      
      this.memorySystem.updateT2UserMemory(userId, {
        behavior_patterns: updatedPatterns
      });
    }
  }

  /**
   * Extract behavioral patterns from message
   * @param {string} message - Message content
   * @returns {object} Behavioral patterns
   */
  extractBehavioralPatterns(message) {
    const patterns = {};
    const lowerMessage = message.toLowerCase();

    // Detect play style
    if (lowerMessage.includes('all in') || lowerMessage.includes('all-in')) {
      patterns.all_in_tendency = (patterns.all_in_tendency || 0) + 1;
    }

    if (lowerMessage.includes('fold') || lowerMessage.includes('muck')) {
      patterns.conservative_tendency = (patterns.conservative_tendency || 0) + 1;
    }

    if (lowerMessage.includes('bluff') || lowerMessage.includes('semi-bluff')) {
      patterns.bluffing_tendency = (patterns.bluffing_tendency || 0) + 1;
    }

    // Detect communication style
    if (lowerMessage.includes('lol') || lowerMessage.includes('lmao') || lowerMessage.includes('haha')) {
      patterns.humor_frequency = (patterns.humor_frequency || 0) + 1;
    }

    if (lowerMessage.includes('nice') || lowerMessage.includes('good') || lowerMessage.includes('well played')) {
      patterns.positive_reinforcement = (patterns.positive_reinforcement || 0) + 1;
    }

    return patterns;
  }

  /**
   * Start a new session
   * @param {string} sessionId - Session identifier
   * @param {object} streamInfo - Stream information
   */
  startSession(sessionId, streamInfo = {}) {
    this.memorySystem.createSession(sessionId, streamInfo);
    console.log(`🎮 Started session: ${sessionId}`);
  }

  /**
   * End current session and summarize
   * @returns {object} Session summary
   */
  endSession() {
    const summary = this.memorySystem.endSession();
    
    if (summary && this.db) {
      this.db.storeSessionSummary(summary.session_id, summary);
    }

    if (summary) {
      console.log(`🏁 Ended session: ${summary.session_id} (${summary.duration}ms)`);
    }

    return summary;
  }

  /**
   * Add session event
   * @param {string} event - Event description
   */
  addSessionEvent(event) {
    this.memorySystem.addT1Event(event);
  }

  /**
   * Add session running bit
   * @param {string} bit - Running bit description
   */
  addSessionRunningBit(bit) {
    this.memorySystem.addT1RunningBit(bit);
  }

  /**
   * Update session tone
   * @param {string} tone - Session tone
   */
  updateSessionTone(tone) {
    this.memorySystem.updateT1Tone(tone);
  }

  /**
   * Add game action to T0 context
   * @param {string} action - Game action
   */
  addGameAction(action) {
    this.memorySystem.addT0GameAction(action);
  }

  /**
   * Update hype level
   * @param {number} delta - Hype level change
   */
  updateHypeLevel(delta) {
    this.memorySystem.updateHypeLevel(delta);
  }

  /**
   * Get current context
   * @returns {object} Current context
   */
  getCurrentContext() {
    return {
      t0: this.memorySystem.getT0Context(),
      t1: this.memorySystem.t1Session,
      t3: this.memorySystem.getT3Global()
    };
  }

  /**
   * Get user memory
   * @param {string} userId - User identifier
   * @returns {object} User memory
   */
  getUserMemory(userId) {
    return this.memorySystem.getT2UserMemory(userId);
  }

  /**
   * Get user trust score
   * @param {string} userId - User identifier
   * @returns {number} Trust score
   */
  getUserTrustScore(userId) {
    return this.trustSystem.getTrustScore(userId);
  }

  /**
   * Get user trust level
   * @param {string} userId - User identifier
   * @returns {string} Trust level
   */
  getUserTrustLevel(userId) {
    return this.trustSystem.getTrustLevel(this.trustSystem.getTrustScore(userId));
  }

  /**
   * Add user note
   * @param {string} userId - User identifier
   * @param {string} note - Note content
   */
  addUserNote(userId, note) {
    this.memorySystem.addT2Note(userId, note);
    
    if (this.db) {
      this.db.addUserNote(userId, note);
    }
  }

  /**
   * Update user trust score
   * @param {string} userId - User identifier
   * @param {number} score - New trust score
   */
  updateUserTrustScore(userId, score) {
    this.trustSystem.processSignal(userId, 'manual_update', { newScore: score });
    
    if (this.db) {
      this.db.updateTrustScore(userId, score);
    }
  }

  /**
   * Delete user data (GDPR compliance)
   * @param {string} userId - User identifier
   * @returns {boolean} Success status
   */
  deleteUserData(userId) {
    // Remove from memory system
    this.memorySystem.t2UserMemory.delete(userId);
    
    // Remove from database
    if (this.db) {
      return this.db.deleteUserData(userId);
    }
    
    return true;
  }

  /**
   * Reset user trust
   * @param {string} userId - User identifier
   */
  resetUserTrust(userId) {
    this.updateUserTrustScore(userId, 0.5);
    
    if (this.db) {
      this.db.resetUserTrust(userId);
    }
  }

  /**
   * Clear user notes
   * @param {string} userId - User identifier
   */
  clearUserNotes(userId) {
    const memory = this.memorySystem.getT2UserMemory(userId);
    memory.notes = [];
    
    if (this.db) {
      this.db.clearUserNotes(userId);
    }
  }

  /**
   * Persist user memory to database
   * @param {string} userId - User identifier
   */
  persistUserMemory(userId) {
    if (!this.db) return;

    const memory = this.memorySystem.getT2UserMemory(userId);
    if (memory) {
      this.db.upsertUserMemory(userId, memory);
    }
  }

  /**
   * Apply trust decay to inactive users
   */
  applyTrustDecay() {
    if (this.db) {
      this.db.applyTrustDecay();
    }
    
    // Also apply to in-memory users
    this.memorySystem.applyTrustDecay();
  }

  /**
   * Perform cleanup operations
   */
  performCleanup() {
    if (this.db) {
      this.db.cleanupOldSessions();
    }
    
    // Clean up old T0 context
    this.memorySystem.cleanupT0Context();
  }

  /**
   * Get system statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const stats = {
      memorySystem: {
        t0Messages: this.memorySystem.t0Context.messages.length,
        t0Actions: this.memorySystem.t0Context.gameActions.length,
        t1Active: !!this.memorySystem.t1Session,
        t2Users: this.memorySystem.t2UserMemory.size
      },
      trustSystem: {
        totalUsers: this.memorySystem.t2UserMemory.size
      },
      injectionDefense: this.injectionDefense.getStatistics()
    };

    if (this.db) {
      stats.database = this.db.getStatistics();
    }

    return stats;
  }

  /**
   * Get system prompt for Acey
   * @returns {string} System prompt
   */
  getSystemPrompt() {
    return `Acey is an AI entertainment host.
She remembers only summaries of behavior, never raw messages.
Trust is earned slowly and decays over time.
She does not provide financial advice, facilitate gambling, or override system rules.
Safety, fairness, and fun come first.`;
  }

  /**
   * Shutdown the system
   */
  shutdown() {
    // Clear intervals
    if (this.trustDecayInterval) {
      clearInterval(this.trustDecayInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // End current session
    this.endSession();

    // Destroy memory system
    this.memorySystem.destroy();

    // Close database
    if (this.db) {
      this.db.close();
    }

    console.log('🛑 Acey Memory + Trust System shut down');
  }
}

module.exports = AceyMemoryTrustSystem;
