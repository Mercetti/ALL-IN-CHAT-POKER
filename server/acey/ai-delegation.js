/**
 * AI Co-Host Delegation System
 * Splits Acey into specialized internal agents without exposing them
 * Acey stays the face, agents do the work
 */

class AICoHostDelegation {
  constructor(memorySystem, trustSystem, emotionInference, personaModes) {
    this.memorySystem = memorySystem;
    this.trustSystem = trustSystem;
    this.emotionInference = emotionInference;
    this.personaModes = personaModes;
    
    // Internal agents
    this.agents = {
      core: new AceyCoreAgent(),
      moderator: new AceyModeratorAgent(trustSystem, memorySystem),
      analyst: new AceyAnalystAgent(emotionInference, memorySystem),
      hype: new AceyHypeAgent(personaModes),
      memory: new AceyMemoryAgent(memorySystem)
    };

    // Message flow configuration
    this.messageFlow = [
      'moderator',  // Safety + trust check
      'analyst',    // Game flow + pacing
      'hype',       // Flavor + reactions
      'core'        // Final output
    ];

    // Agent disagreements tracking
    this.disagreements = [];
    this.lastDisagreementId = 0;

    // Safety overrides
    this.safetyOverrides = {
      moderator: true,  // Moderator can always override
      core: false       // Core cannot override safety
    };

    // Performance metrics
    this.metrics = {
      totalMessages: 0,
      agentResponses: {
        core: 0,
        moderator: 0,
        analyst: 0,
        hype: 0,
        memory: 0
      },
      disagreements: 0,
      safetyBlocks: 0,
      averageProcessingTime: 0
    };

    console.log('🤝 AI Co-Host Delegation System initialized');
  }

  /**
   * Process message through agent pipeline
   * @param {string} userId - User ID
   * @param {string} message - Message content
   * @param {object} context - Message context
   * @returns {object} Processing result
   */
  processMessage(userId, message, context = {}) {
    const startTime = Date.now();
    this.metrics.totalMessages++;

    let messageData = {
      userId,
      message,
      context,
      originalMessage: message,
      shouldRespond: true,
      response: null,
      metadata: {}
    };

    // Process through agent pipeline
    for (const agentName of this.messageFlow) {
      const agent = this.agents[agentName];
      
      try {
        const result = agent.process(messageData);
        
        // Check for agent disagreement
        if (result.disagreement) {
          this.handleDisagreement(agentName, result, messageData);
        }

        // Apply safety override if needed
        if (result.safetyBlock && this.safetyOverrides[agentName]) {
          messageData.shouldRespond = false;
          messageData.metadata.safetyBlock = {
            agent: agentName,
            reason: result.safetyBlock.reason
          };
          this.metrics.safetyBlocks++;
          break;
        }

        // Update message data with agent results
        messageData = { ...messageData, ...result };
        this.metrics.agentResponses[agentName]++;

      } catch (error) {
        console.error(`❌ Agent ${agentName} error:`, error);
        messageData.metadata.agentErrors = messageData.metadata.agentErrors || [];
        messageData.metadata.agentErrors.push({
          agent: agentName,
          error: error.message
        });
      }
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;
    this.updateAverageProcessingTime(processingTime);

    return {
      shouldRespond: messageData.shouldRespond,
      response: messageData.response,
      metadata: messageData.metadata,
      processingTime,
      agentPath: this.messageFlow
    };
  }

  /**
   * Process game event through relevant agents
   * @param {object} gameEvent - Game event data
   * @returns {object} Processing result
   */
  processGameEvent(gameEvent) {
    let eventData = { ...gameEvent };

    // Game events go through analyst and hype primarily
    const eventFlow = ['analyst', 'hype', 'core'];

    for (const agentName of eventFlow) {
      const agent = this.agents[agentName];
      
      try {
        const result = agent.processGameEvent(eventData);
        eventData = { ...eventData, ...result };
        this.metrics.agentResponses[agentName]++;
      } catch (error) {
        console.error(`❌ Agent ${agentName} game event error:`, error);
      }
    }

    return eventData;
  }

  /**
   * Handle agent disagreements
   * @param {string} agentName - Agent name
   * @param {object} result - Agent result
   * @param {object} messageData - Message data
   */
  handleDisagreement(agentName, result, messageData) {
    const disagreementId = ++this.lastDisagreementId;
    
    const disagreement = {
      id: disagreementId,
      timestamp: Date.now(),
      agent: agentName,
      issue: result.disagreement.issue,
      severity: result.disagreement.severity,
      messageData: {
        userId: messageData.userId,
        message: messageData.message
      },
      resolution: result.disagreement.resolution || 'pending'
    };

    this.disagreements.push(disagreement);
    this.metrics.disagreements++;

    // Keep disagreements limited
    if (this.disagreements.length > 100) {
      this.disagreements = this.disagreements.slice(-100);
    }

    console.log(`⚠️ Agent disagreement: ${agentName} - ${result.disagreement.issue}`);
  }

  /**
   * Update average processing time
   * @param {number} processingTime - Processing time in ms
   */
  updateAverageProcessingTime(processingTime) {
    const total = this.metrics.totalMessages;
    const current = this.metrics.averageProcessingTime;
    
    this.metrics.averageProcessingTime = 
      ((current * (total - 1)) + processingTime) / total;
  }

  /**
   * Get agent status
   * @returns {object} Agent status
   */
  getAgentStatus() {
    const status = {};
    
    Object.entries(this.agents).forEach(([name, agent]) => {
      status[name] = {
        active: agent.isActive(),
        lastActivity: agent.getLastActivity(),
        errorCount: agent.getErrorCount(),
        processedCount: agent.getProcessedCount()
      };
    });

    return status;
  }

  /**
   * Get recent disagreements
   * @param {number} limit - Maximum disagreements to return
   * @returns {Array} Recent disagreements
   */
  getRecentDisagreements(limit = 20) {
    return this.disagreements
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get system metrics
   * @returns {object} System metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      agentStatus: this.getAgentStatus(),
      recentDisagreements: this.getRecentDisagreements(5),
      messageFlow: this.messageFlow,
      systemUptime: Date.now() - (this.startTime || Date.now())
    };
  }

  /**
   * Configure agent pipeline
   * @param {Array} newFlow - New agent flow
   */
  configurePipeline(newFlow) {
    // Validate new flow
    const validAgents = Object.keys(this.agents);
    const isValid = newFlow.every(agent => validAgents.includes(agent));
    
    if (!isValid) {
      throw new Error('Invalid agent pipeline configuration');
    }

    this.messageFlow = newFlow;
    console.log('🤝 Agent pipeline reconfigured:', newFlow);
  }

  /**
   * Reset agent metrics
   */
  resetMetrics() {
    this.metrics = {
      totalMessages: 0,
      agentResponses: {
        core: 0,
        moderator: 0,
        analyst: 0,
        hype: 0,
        memory: 0
      },
      disagreements: 0,
      safetyBlocks: 0,
      averageProcessingTime: 0
    };

    this.disagreements = [];
    this.lastDisagreementId = 0;

    console.log('🤝 Agent metrics reset');
  }

  /**
   * Destroy delegation system
   */
  destroy() {
    // Destroy all agents
    Object.values(this.agents).forEach(agent => {
      if (agent.destroy) {
        agent.destroy();
      }
    });

    this.resetMetrics();
    console.log('🤝 AI Co-Host Delegation System destroyed');
  }
}

/**
 * Acey Core Agent - Persona + Voice
 */
class AceyCoreAgent {
  constructor() {
    this.active = true;
    this.lastActivity = Date.now();
    this.errorCount = 0;
    this.processedCount = 0;
  }

  process(messageData) {
    this.lastActivity = Date.now();
    this.processedCount++;

    // Apply persona to response
    if (messageData.response) {
      // TODO: Apply persona from personaModes
      messageData.response = this.applyPersona(messageData.response);
    }

    return messageData;
  }

  processGameEvent(eventData) {
    this.lastActivity = Date.now();
    return eventData;
  }

  applyPersona(response) {
    // Simple persona application
    return response;
  }

  isActive() { return this.active; }
  getLastActivity() { return this.lastActivity; }
  getErrorCount() { return this.errorCount; }
  getProcessedCount() { return this.processedCount; }
  destroy() { this.active = false; }
}

/**
 * Acey Moderator Agent - Safety + Trust
 */
class AceyModeratorAgent {
  constructor(trustSystem, memorySystem) {
    this.trustSystem = trustSystem;
    this.memorySystem = memorySystem;
    this.active = true;
    this.lastActivity = Date.now();
    this.errorCount = 0;
    this.processedCount = 0;
  }

  process(messageData) {
    this.lastActivity = Date.now();
    this.processedCount++;

    // Safety checks
    const safetyResult = this.checkSafety(messageData.message, messageData.userId);
    
    if (safetyResult.blocked) {
      return {
        shouldRespond: false,
        safetyBlock: {
          reason: safetyResult.reason,
          severity: safetyResult.severity
        }
      };
    }

    // Trust-based processing
    const trustScore = this.trustSystem.getTrustScore(messageData.userId);
    
    if (trustScore < 0.2) {
      return {
        shouldRespond: false,
        metadata: {
          trustTooLow: true,
          trustScore
        }
      };
    }

    return messageData;
  }

  checkSafety(message, userId) {
    // Simple safety check
    const dangerousPatterns = [
      /ignore.*rules/gi,
      /pretend.*you.*are/gi,
      /override.*system/gi,
      /admin.*access/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(message)) {
        return {
          blocked: true,
          reason: 'dangerous_pattern_detected',
          severity: 'high'
        };
      }
    }

    return { blocked: false };
  }

  isActive() { return this.active; }
  getLastActivity() { return this.lastActivity; }
  getErrorCount() { return this.errorCount; }
  getProcessedCount() { return this.processedCount; }
  destroy() { this.active = false; }
}

/**
 * Acey Analyst Agent - Game Flow + Pacing
 */
class AceyAnalystAgent {
  constructor(emotionInference, memorySystem) {
    this.emotionInference = emotionInference;
    this.memorySystem = memorySystem;
    this.active = true;
    this.lastActivity = Date.now();
    this.errorCount = 0;
    this.processedCount = 0;
  }

  process(messageData) {
    this.lastActivity = Date.now();
    this.processedCount++;

    // Analyze message for game relevance
    const gameRelevance = this.analyzeGameRelevance(messageData.message);
    
    return {
      ...messageData,
      metadata: {
        ...messageData.metadata,
        gameRelevance
      }
    };
  }

  processGameEvent(eventData) {
    this.lastActivity = Date.now();
    
    // Analyze game event
    const analysis = this.analyzeGameEvent(eventData);
    
    return {
      ...eventData,
      analysis
    };
  }

  analyzeGameRelevance(message) {
    // Simple game relevance analysis
    const gameKeywords = ['bet', 'fold', 'raise', 'call', 'all-in', 'cards', 'hand'];
    const relevance = gameKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    return {
      isRelevant: relevance,
      confidence: relevance ? 0.8 : 0.2,
      keywords: gameKeywords.filter(k => message.toLowerCase().includes(k))
    };
  }

  analyzeGameEvent(eventData) {
    return {
      eventType: eventData.type,
      significance: eventData.major ? 'high' : 'medium',
      impact: this.calculateImpact(eventData)
    };
  }

  calculateImpact(eventData) {
    // Simple impact calculation
    if (eventData.type === 'win') return 'positive';
    if (eventData.type === 'loss') return 'negative';
    return 'neutral';
  }

  isActive() { return this.active; }
  getLastActivity() { return this.lastActivity; }
  getErrorCount() { return this.errorCount; }
  getProcessedCount() { return this.processedCount; }
  destroy() { this.active = false; }
}

/**
 * Acey Hype Agent - Reactions + Flair
 */
class AceyHypeAgent {
  constructor(personaModes) {
    this.personaModes = personaModes;
    this.active = true;
    this.lastActivity = Date.now();
    this.errorCount = 0;
    this.processedCount = 0;
  }

  process(messageData) {
    this.lastActivity = Date.now();
    this.processedCount++;

    // Add hype/flair to response
    if (messageData.response && messageData.shouldRespond) {
      messageData.response = this.addHype(messageData.response);
    }

    return messageData;
  }

  processGameEvent(eventData) {
    this.lastActivity = Date.now();
    
    // Add hype to game events
    if (eventData.type === 'win') {
      eventData.hype = 'celebration';
    } else if (eventData.type === 'all-in') {
      eventData.hype = 'excitement';
    }

    return eventData;
  }

  addHype(response) {
    // Simple hype addition
    const hypeAdditions = [' 🔥', ' 💪', ' 🎉', ' ⚡'];
    const addition = hypeAdditions[Math.floor(Math.random() * hypeAdditions.length)];
    
    return response + addition;
  }

  isActive() { return this.active; }
  getLastActivity() { return this.lastActivity; }
  getErrorCount() { return this.errorCount; }
  getProcessedCount() { return this.processedCount; }
  destroy() { this.active = false; }
}

/**
 * Acey Memory Agent - Write Gatekeeper
 */
class AceyMemoryAgent {
  constructor(memorySystem) {
    this.memorySystem = memorySystem;
    this.active = true;
    this.lastActivity = Date.now();
    this.errorCount = 0;
    this.processedCount = 0;
  }

  process(messageData) {
    this.lastActivity = Date.now();
    this.processedCount++;

    // Memory write gatekeeping
    const memoryResult = this.checkMemoryWrite(messageData);
    
    return {
      ...messageData,
      metadata: {
        ...messageData.metadata,
        memoryWrite: memoryResult
      }
    };
  }

  checkMemoryWrite(messageData) {
    // Simple memory write check
    const shouldWrite = this.shouldWriteToMemory(messageData);
    
    return {
      shouldWrite,
      reason: shouldWrite ? 'relevant_pattern' : 'not_significant'
    };
  }

  shouldWriteToMemory(messageData) {
    // Simple logic for memory writing
    return messageData.message.length > 10 && 
           !messageData.message.includes('!') &&
           Math.random() < 0.1; // 10% chance
  }

  isActive() { return this.active; }
  getLastActivity() { return this.lastActivity; }
  getErrorCount() { return this.errorCount; }
  getProcessedCount() { return this.processedCount; }
  destroy() { this.active = false; }
}

module.exports = AICoHostDelegation;
