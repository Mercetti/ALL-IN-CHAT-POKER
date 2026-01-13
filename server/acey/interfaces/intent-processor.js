/**
 * Intent Validation and Processing System
 * Handles intent validation, processing, and execution
 * Ensures all intents go through proper approval workflow
 */

const { IntentFactory, IntentRegistry } = require('./intents');
const { SchemaValidator, LLMMessageBuilder } = require('./llm-schemas-fixed');

/**
 * Intent Processing Engine
 * Central hub for processing all Acey intents
 */
class IntentProcessingEngine {
  constructor(memorySystem, trustSystem, personaModes, shadowBan, io) {
    this.memorySystem = memorySystem;
    this.trustSystem = trustSystem;
    this.personaModes = personaModes;
    this.shadowBan = shadowBan;
    this.io = io;
    
    // Core components
    this.intentRegistry = new IntentRegistry();
    this.schemaValidator = new SchemaValidator();
    this.messageBuilder = new LLMMessageBuilder();
    
    // Processing configuration
    this.config = {
      autoApproveThreshold: 0.9,
      simulationMode: false,
      auditAllIntents: true,
      maxPendingIntents: 50,
      intentTimeout: 300000 // 5 minutes
    };

    // Processing queues
    this.pendingIntents = new Map();
    this.processingQueue = [];
    this.simulationResults = new Map();

    // Statistics
    this.stats = {
      totalProcessed: 0,
      approved: 0,
      rejected: 0,
      simulated: 0,
      errors: 0,
      averageProcessingTime: 0
    };

    // Start processing loop
    this.startProcessingLoop();
    
    console.log('🔄 Intent Processing Engine initialized');
  }

  /**
   * Process LLM output and extract intents
   * @param {object} llmOutput - Raw LLM output
   * @param {object} context - Processing context
   * @returns {object} Processing result
   */
  async processLLMOutput(llmOutput, context = {}) {
    const startTime = Date.now();
    
    try {
      // Validate LLM output structure
      const validation = this.schemaValidator.validateOutput(llmOutput);
      
      if (!validation.valid) {
        console.error('❌ Invalid LLM output:', validation.error);
        this.stats.errors++;
        return {
          success: false,
          error: validation.error,
          speech: llmOutput.speech || '',
          intents: []
        };
      }

      const sanitizedOutput = validation.sanitized;
      
      // Process each intent
      const processedIntents = [];
      const intentResults = [];

      for (const intentData of sanitizedOutput.intents) {
        try {
          // Create intent object
          const intent = IntentFactory.createIntent(intentData.type, intentData);
          
          // Validate intent
          const intentValidation = IntentFactory.validateIntent(intent);
          
          if (!intentValidation.valid) {
            console.error('❌ Invalid intent:', intentValidation.error);
            continue;
          }

          // Register intent
          const intentId = this.intentRegistry.registerIntent(intent);
          
          // Process intent based on type and confidence
          const result = await this.processIntent(intent, context);
          
          processedIntents.push(intent);
          intentResults.push(result);
          
        } catch (error) {
          console.error('❌ Intent processing error:', error);
          this.stats.errors++;
        }
      }

      // Update statistics
      const processingTime = Date.now() - startTime;
      this.updateProcessingStats(processingTime);

      return {
        success: true,
        speech: sanitizedOutput.speech,
        intents: processedIntents,
        results: intentResults,
        processingTime
      };

    } catch (error) {
      console.error('❌ LLM output processing error:', error);
      this.stats.errors++;
      
      return {
        success: false,
        error: error.message,
        speech: llmOutput.speech || '',
        intents: []
      };
    }
  }

  /**
   * Process individual intent
   * @param {object} intent - Intent object
   * @param {object} context - Processing context
   * @returns {object} Processing result
   */
  async processIntent(intent, context) {
    const startTime = Date.now();
    
    try {
      // Check if intent should be auto-approved
      const shouldAutoApprove = this.shouldAutoApprove(intent);
      
      if (shouldAutoApprove) {
        return await this.executeIntent(intent, 'auto_approved');
      }

      // Add to pending queue
      this.pendingIntents.set(intent.id, {
        intent,
        context,
        timestamp: Date.now(),
        status: 'pending'
      });

      // Notify operator
      this.notifyOperator('intent_pending', {
        intentId: intent.id,
        type: intent.type,
        confidence: intent.confidence,
        justification: intent.justification
      });

      return {
        intentId: intent.id,
        status: 'pending',
        action: 'awaiting_approval',
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Intent processing error:', error);
      return {
        intentId: intent.id,
        status: 'error',
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute intent
   * @param {object} intent - Intent object
   * @param {string} approvalType - Approval type
   * @returns {object} Execution result
   */
  async executeIntent(intent, approvalType = 'manual') {
    const startTime = Date.now();
    
    try {
      let result;

      switch (intent.type) {
        case 'memory_proposal':
          result = await this.executeMemoryProposal(intent);
          break;
          
        case 'trust_signal':
          result = await this.executeTrustSignal(intent);
          break;
          
        case 'shadow_ban_suggestion':
          result = await this.executeModerationSuggestion(intent);
          break;
          
        case 'persona_mode_proposal':
          result = await this.executePersonaProposal(intent);
          break;
          
        case 'game_event_intent':
          result = await this.executeGameEventIntent(intent);
          break;
          
        case 'self_evaluation_intent':
          result = await this.executeSelfEvaluationIntent(intent);
          break;
          
        default:
          throw new Error(`Unknown intent type: ${intent.type}`);
      }

      // Update intent registry
      this.intentRegistry.updateIntentStatus(intent.id, 'executed', {
        approvalType,
        result,
        executedAt: Date.now()
      });

      // Update statistics
      this.stats.approved++;

      // Notify operator
      this.notifyOperator('intent_executed', {
        intentId: intent.id,
        type: intent.type,
        result,
        approvalType
      });

      return {
        intentId: intent.id,
        status: 'executed',
        result,
        approvalType,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Intent execution error:', error);
      
      // Update intent registry
      this.intentRegistry.updateIntentStatus(intent.id, 'error', {
        error: error.message,
        failedAt: Date.now()
      });

      this.stats.errors++;

      return {
        intentId: intent.id,
        status: 'error',
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute memory proposal
   * @param {object} intent - Memory proposal intent
   * @returns {object} Execution result
   */
  async executeMemoryProposal(intent) {
    // Check memory boundaries
    const boundaryCheck = this.memorySystem.checkMemoryBoundary(
      intent.scope,
      intent,
      intent.scope
    );

    if (!boundaryCheck.allowed) {
      throw new Error(`Memory proposal blocked: ${boundaryCheck.reason}`);
    }

    // Execute memory write
    switch (intent.scope) {
      case 'event': {
        this.memorySystem.addSessionEvent(intent.summary);
        break;
      }
        
      case 'stream': {
        this.memorySystem.addSessionMemory('running_bits', [intent.summary]);
        break;
      }
        
      case 'global': {
        const globalMemory = this.memorySystem.getT3Global();
        if (!globalMemory.community_moments) {
          globalMemory.community_moments = [];
        }
        globalMemory.community_moments.push({
          event: intent.summary,
          impact: intent.impact,
          created_at: Date.now()
        });
        break;
      }
    }

    return {
      action: 'memory_written',
      scope: intent.scope,
      summary: intent.summary
    };
  }

  /**
   * Execute trust signal
   * @param {object} intent - Trust signal intent
   * @returns {object} Execution result
   */
  async executeTrustSignal(intent) {
    // Apply trust change
    this.trustSystem.updateUserTrustScore(intent.userId, intent.delta);
    
    return {
      action: 'trust_updated',
      userId: intent.userId,
      delta: intent.delta,
      newScore: this.trustSystem.getTrustScore(intent.userId)
    };
  }

  /**
   * Execute moderation suggestion
   * @param {object} intent - Moderation suggestion intent
   * @returns {object} Execution result
   */
  async executeModerationSuggestion(intent) {
    // Apply moderation action
    switch (intent.action) {
      case 'shadow_ban':
        this.shadowBan.shadowBanUser(intent.userId, intent.duration);
        break;
        
      case 'rate_limit':
        this.shadowBan.rateLimitUser(intent.userId, intent.duration);
        break;
        
      case 'content_filter':
        this.shadowBan.filterUserContent(intent.userId, intent.duration);
        break;
    }

    return {
      action: intent.action,
      userId: intent.userId,
      duration: intent.duration,
      severity: intent.severity
    };
  }

  /**
   * Execute persona proposal
   * @param {object} intent - Persona proposal intent
   * @returns {object} Execution result
   */
  async executePersonaProposal(intent) {
    // Apply persona change
    this.personaModes.setPersona(intent.mode.toUpperCase(), intent.reason);
    
    return {
      action: 'persona_changed',
      mode: intent.mode,
      reason: intent.reason,
      duration: intent.duration
    };
  }

  /**
   * Execute game event intent
   * @param {object} intent - Game event intent
   * @returns {object} Execution result
   */
  async executeGameEventIntent(intent) {
    // Handle game event
    const eventData = {
      type: intent.eventType,
      action: intent.gameAction,
      target: intent.target,
      intensity: intent.intensity,
      timing: intent.timing
    };

    // Emit game event
    this.io.emit('game_event_intent', eventData);

    return {
      action: 'game_event_processed',
      eventData
    };
  }

  /**
   * Execute self-evaluation intent
   * @param {object} intent - Self-evaluation intent
   * @returns {object} Execution result
   */
  async executeSelfEvaluationIntent(intent) {
    // Trigger self-evaluation
    const evaluationResult = {
      type: intent.evaluationType,
      questions: intent.questions,
      triggers: intent.triggers,
      frequency: intent.frequency,
      scheduledAt: Date.now()
    };

    // Emit evaluation event
    this.io.emit('self_evaluation_intent', evaluationResult);

    return {
      action: 'self_evaluation_scheduled',
      evaluationResult
    };
  }

  /**
   * Simulate intent execution
   * @param {string} intentId - Intent ID
   * @returns {object} Simulation result
   */
  async simulateIntent(intentId) {
    const pending = this.pendingIntents.get(intentId);
    
    if (!pending) {
      throw new Error(`Intent not found: ${intentId}`);
    }

    const intent = pending.intent;
    
    // Create simulation context
    const simulationContext = {
      simulation: true,
      timestamp: Date.now(),
      originalContext: pending.context
    };

    // Execute in simulation mode
    this.config.simulationMode = true;
    
    try {
      const result = await this.executeIntent(intent, 'simulation');
      
      // Store simulation result
      this.simulationResults.set(intentId, {
        result,
        simulatedAt: Date.now(),
        originalIntent: intent
      });

      this.stats.simulated++;

      return {
        intentId,
        simulation: result,
        simulatedAt: Date.now()
      };

    } finally {
      this.config.simulationMode = false;
    }
  }

  /**
   * Approve pending intent
   * @param {string} intentId - Intent ID
   * @returns {object} Approval result
   */
  async approveIntent(intentId) {
    const pending = this.pendingIntents.get(intentId);
    
    if (!pending) {
      throw new Error(`Intent not found: ${intentId}`);
    }

    // Remove from pending
    this.pendingIntents.delete(intentId);
    
    // Execute intent
    const result = await this.executeIntent(pending.intent, 'manual_approved');
    
    return result;
  }

  /**
   * Reject pending intent
   * @param {string} intentId - Intent ID
   * @param {string} reason - Rejection reason
   * @returns {object} Rejection result
   */
  async rejectIntent(intentId, reason = 'Operator rejected') {
    const pending = this.pendingIntents.get(intentId);
    
    if (!pending) {
      throw new Error(`Intent not found: ${intentId}`);
    }

    // Remove from pending
    this.pendingIntents.delete(intentId);
    
    // Update intent registry
    this.intentRegistry.updateIntentStatus(intentId, 'rejected', {
      reason,
      rejectedAt: Date.now()
    });

    this.stats.rejected++;

    // Notify operator
    this.notifyOperator('intent_rejected', {
      intentId,
      reason
    });

    return {
      intentId,
      status: 'rejected',
      reason
    };
  }

  /**
   * Check if intent should be auto-approved
   * @param {object} intent - Intent object
   * @returns {boolean} Should auto-approve
   */
  shouldAutoApprove(intent) {
    // High confidence intents
    if (intent.confidence >= this.config.autoApproveThreshold) {
      return true;
    }

    // Low-risk intents
    const lowRiskTypes = ['game_event_intent', 'self_evaluation_intent'];
    if (lowRiskTypes.includes(intent.type) && intent.confidence >= 0.8) {
      return true;
    }

    // Simulation mode
    if (this.config.simulationMode) {
      return true;
    }

    return false;
  }

  /**
   * Notify operator of intent events
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   */
  notifyOperator(eventType, data) {
    this.io.emit('operator_notification', {
      type: eventType,
      timestamp: Date.now(),
      data
    });
  }

  /**
   * Update processing statistics
   * @param {number} processingTime - Processing time in ms
   */
  updateProcessingStats(processingTime) {
    this.stats.totalProcessed++;
    
    const total = this.stats.totalProcessed;
    const current = this.stats.averageProcessingTime;
    
    this.stats.averageProcessingTime = 
      ((current * (total - 1)) + processingTime) / total;
  }

  /**
   * Start processing loop for cleanup
   */
  startProcessingLoop() {
    setInterval(() => {
      this.cleanupExpiredIntents();
    }, 60000); // Every minute
  }

  /**
   * Cleanup expired intents
   */
  cleanupExpiredIntents() {
    const now = Date.now();
    const expired = [];

    for (const [id, pending] of this.pendingIntents) {
      if (now - pending.timestamp > this.config.intentTimeout) {
        expired.push(id);
      }
    }

    expired.forEach(id => {
      this.rejectIntent(id, 'Intent expired');
    });

    if (expired.length > 0) {
      console.log(`🧹 Cleaned up ${expired.length} expired intents`);
    }
  }

  /**
   * Get pending intents
   * @returns {Array} Pending intents
   */
  getPendingIntents() {
    return Array.from(this.pendingIntents.values()).map(pending => ({
      intentId: pending.intent.id,
      type: pending.intent.type,
      confidence: pending.intent.confidence,
      justification: pending.intent.justification,
      timestamp: pending.timestamp,
      data: pending.intent.toJSON()
    }));
  }

  /**
   * Get intent statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      pending: this.pendingIntents.size,
      registry: this.intentRegistry.getStatistics(),
      validation: this.schemaValidator.getStatistics()
    };
  }

  /**
   * Export intent history
   * @param {string} format - Export format
   * @returns {string} Exported data
   */
  exportHistory(format = 'json') {
    return this.intentRegistry.exportHistory(format);
  }

  /**
   * Reset processing engine
   */
  reset() {
    this.pendingIntents.clear();
    this.processingQueue = [];
    this.simulationResults.clear();
    this.intentRegistry.clear();
    this.schemaValidator.resetStats();
    
    this.stats = {
      totalProcessed: 0,
      approved: 0,
      rejected: 0,
      simulated: 0,
      errors: 0,
      averageProcessingTime: 0
    };

    console.log('🔄 Intent Processing Engine reset');
  }

  /**
   * Destroy processing engine
   */
  destroy() {
    this.reset();
    console.log('🔄 Intent Processing Engine destroyed');
  }
}

module.exports = IntentProcessingEngine;
