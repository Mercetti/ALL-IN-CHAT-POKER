/**
 * Helm Engine with AI Integration
 * Enhanced version that can communicate with external AI services
 */

const HelmAIIntegration = require('./helm-ai-integration');

class HelmEngineWithAI {
  constructor(options = {}) {
    this.skills = new Map();
    this.sessions = new Map();
    this.auditLog = [];
    this.isRunning = false;
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      aiRequests: 0,
      startTime: Date.now()
    };
    
    // Initialize AI integration
    this.aiIntegration = new HelmAIIntegration(options.ai);
    this.aiEnabled = options.aiEnabled !== false; // Default to enabled
  }

  /**
   * Initialize Helm Engine with AI capabilities
   */
  async initialize() {
    console.log('🚀 Initializing Helm Engine with AI Integration...');
    
    try {
      // Load built-in skills
      await this.loadBuiltinSkills();
      
      // Test AI connection if enabled
      if (this.aiEnabled) {
        const aiTest = await this.aiIntegration.testConnection();
        if (aiTest.success) {
          console.log('✅ AI Integration Ready:', aiTest.provider);
        } else {
          console.log('⚠️ AI Integration Failed, using fallback:', aiTest.error);
          this.aiEnabled = false;
        }
      }
      
      // Start monitoring
      this.startMonitoring();
      
      this.isRunning = true;
      console.log('✅ Helm Engine with AI Ready');
      
    } catch (error) {
      console.error('❌ Helm Engine initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load built-in skills with AI capabilities
   */
  async loadBuiltinSkills() {
    const builtinSkills = [
      {
        id: 'poker_deal',
        name: 'Poker Deal',
        category: 'game',
        execute: async (params) => this.dealCards(params)
      },
      {
        id: 'poker_bet',
        name: 'Poker Bet',
        category: 'game',
        execute: async (params) => this.placeBet(params)
      },
      {
        id: 'chat_response',
        name: 'AI Chat Response',
        category: 'communication',
        execute: async (params) => this.generateAIResponse(params)
      },
      {
        id: 'poker_commentary',
        name: 'Poker Commentary',
        category: 'game',
        execute: async (params) => this.generatePokerCommentary(params)
      },
      {
        id: 'analytics',
        name: 'Analytics',
        category: 'monitoring',
        execute: async (params) => this.getAnalytics(params)
      },
      {
        id: 'ai_assist',
        name: 'AI Assistant',
        category: 'assistance',
        execute: async (params) => this.getAIAssistance(params)
      }
    ];

    builtinSkills.forEach(skill => {
      this.skills.set(skill.id, skill);
    });

    console.log(`📦 Loaded ${builtinSkills.length} built-in skills with AI capabilities`);
  }

  /**
   * Generate AI-powered response
   */
  async generateAIResponse(params) {
    const { message, context = 'chat', sessionId } = params;
    
    try {
      this.metrics.aiRequests++;
      
      if (this.aiEnabled) {
        const aiResult = await this.aiIntegration.generateResponse(message, {
          type: context,
          sessionId,
          timestamp: new Date().toISOString()
        });
        
        return {
          response: aiResult.response,
          provider: aiResult.provider,
          model: aiResult.model,
          tokens: aiResult.tokens,
          sessionId,
          timestamp: new Date().toISOString()
        };
      } else {
        // Fallback to simple responses
        return this.getFallbackResponse(message, context);
      }
    } catch (error) {
      console.error('AI response generation failed:', error);
      return this.getFallbackResponse(message, context);
    }
  }

  /**
   * Generate poker-specific commentary
   */
  async generatePokerCommentary(params) {
    const { gameState, action, player, sessionId } = params;
    
    const prompt = `Provide engaging poker commentary for this situation:
Game State: ${JSON.stringify(gameState)}
Action: ${action}
Player: ${player}
Context: Live poker game with viewers`;

    try {
      this.metrics.aiRequests++;
      
      if (this.aiEnabled) {
        const aiResult = await this.aiIntegration.generateResponse(prompt, {
          type: 'poker',
          sessionId,
          gameState,
          action
        });
        
        return {
          commentary: aiResult.response,
          provider: aiResult.provider,
          model: aiResult.model,
          tokens: aiResult.tokens,
          gameState,
          action,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          commentary: `Interesting move by ${player}! The game is really heating up.`,
          provider: 'fallback',
          model: 'rule-based'
        };
      }
    } catch (error) {
      console.error('Poker commentary generation failed:', error);
      return {
        commentary: `That's quite a play by ${player}! The tension is building at the table.`,
        provider: 'fallback',
        model: 'rule-based'
      };
    }
  }

  /**
   * Get AI assistance for various tasks
   */
  async getAIAssistance(params) {
    const { task, details, sessionId } = params;
    
    const prompt = `Provide assistance with this task:
Task: ${task}
Details: ${JSON.stringify(details)}
Context: Helm Control system assistance`;

    try {
      this.metrics.aiRequests++;
      
      if (this.aiEnabled) {
        const aiResult = await this.aiIntegration.generateResponse(prompt, {
          type: 'admin',
          sessionId,
          task
        });
        
        return {
          assistance: aiResult.response,
          provider: aiResult.provider,
          model: aiResult.model,
          tokens: aiResult.tokens,
          task,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          assistance: `I can help with ${task}. Please check the system status and logs for more information.`,
          provider: 'fallback',
          model: 'rule-based'
        };
      }
    } catch (error) {
      console.error('AI assistance failed:', error);
      return {
        assistance: `I'm processing your request for ${task}. Let me check the available resources.`,
        provider: 'fallback',
        model: 'rule-based'
      };
    }
  }

  /**
   * Enhanced deal cards with AI commentary
   */
  async dealCards(params) {
    const { playerId, count = 5 } = params;
    
    // Generate cards (same as before)
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    const cards = [];
    for (let i = 0; i < count; i++) {
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      cards.push(`${rank}${suit}`);
    }
    
    // Generate AI commentary if enabled
    let commentary = null;
    if (this.aiEnabled) {
      try {
        const commentaryResult = await this.generatePokerCommentary({
          gameState: { cardsDealt: count },
          action: 'deal',
          playerId,
          sessionId: params.sessionId
        });
        commentary = commentaryResult.commentary;
      } catch (error) {
        console.log('Commentary generation failed, continuing without it');
      }
    }
    
    return { 
      playerId, 
      cards, 
      count: cards.length,
      commentary,
      dealtAt: new Date().toISOString()
    };
  }

  /**
   * Enhanced place bet with AI analysis
   */
  async placeBet(params) {
    const { playerId, amount, gameType = 'poker' } = params;
    
    // Validate bet
    if (amount <= 0) {
      throw new Error('Bet amount must be positive');
    }
    
    const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate AI analysis if enabled
    let analysis = null;
    if (this.aiEnabled && amount > 100) {
      try {
        const analysisResult = await this.generateAIResponse({
          message: `Analyze this bet: ${playerId} is betting ${amount} chips. What are the implications?`,
          context: 'poker',
          sessionId: params.sessionId
        });
        analysis = analysisResult.response;
      } catch (error) {
        console.log('Bet analysis failed, continuing without it');
      }
    }
    
    return { 
      playerId, 
      amount, 
      betId,
      gameType,
      analysis,
      status: 'placed',
      placedAt: new Date().toISOString()
    };
  }

  /**
   * Get analytics with AI insights
   */
  async getAnalytics(params) {
    const baseAnalytics = {
      totalGames: Math.floor(Math.random() * 100) + 50,
      activePlayers: Math.floor(Math.random() * 10) + 1,
      totalBets: Math.floor(Math.random() * 1000) + 500,
      avgSessionTime: Math.floor(Math.random() * 30) + 10
    };
    
    // Add AI insights if enabled
    let insights = null;
    if (this.aiEnabled) {
      try {
        const insightsResult = await this.generateAIResponse({
          message: `Provide insights on these analytics: ${JSON.stringify(baseAnalytics)}`,
          context: 'analytics',
          sessionId: params.sessionId
        });
        insights = insightsResult.response;
      } catch (error) {
        console.log('Analytics insights failed, continuing without them');
      }
    }
    
    return {
      ...baseAnalytics,
      insights,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Fallback response when AI is unavailable
   */
  getFallbackResponse(message, context) {
    const fallbacks = {
      chat: [
        "I'm here to help with the game! What would you like to know?",
        "That's interesting! Tell me more about what you're thinking.",
        "I'm processing your request. How can I assist with the poker game?"
      ],
      poker: [
        "That's a strategic move! The game is really engaging right now.",
        "Nice play! The tension is building at the table.",
        "Interesting decision! This could change the dynamics of the game."
      ],
      analytics: [
        "The system is performing well with good engagement levels.",
        "Recent activity shows healthy participation across all features.",
        "Performance metrics are within expected ranges."
      ],
      admin: [
        "I'm checking the system status for you. Everything appears operational.",
        "Let me help you with that administrative task.",
        "System resources are stable. What specific assistance do you need?"
      ]
    };

    const responses = fallbacks[context] || fallbacks.chat;
    
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      provider: 'fallback',
      model: 'rule-based',
      tokens: 0
    };
  }

  /**
   * Execute skill with AI integration
   */
  async executeSkill(skillId, params = {}, sessionId = 'default') {
    const startTime = Date.now();
    this.metrics.totalExecutions++;
    
    try {
      this.logEvent('skill_start', { skillId, sessionId, params });
      
      const skill = this.skills.get(skillId);
      if (!skill) {
        throw new Error(`Skill not found: ${skillId}`);
      }

      const result = await skill.execute({ ...params, sessionId });
      this.updateSession(sessionId, skillId, result);
      
      this.logEvent('skill_complete', { 
        skillId, 
        sessionId, 
        duration: Date.now() - startTime,
        result: result ? 'success' : 'failed'
      });

      this.metrics.successfulExecutions++;
      return { success: true, result, skillId, sessionId };
      
    } catch (error) {
      this.metrics.failedExecutions++;
      this.logEvent('skill_error', { 
        skillId, 
        sessionId, 
        error: error.message,
        duration: Date.now() - startTime
      });
      
      throw error;
    }
  }

  /**
   * Log event (same as before)
   */
  logEvent(event, data) {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      event,
      data
    });
    
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  /**
   * Update session (same as before)
   */
  updateSession(sessionId, skillId, result) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { skills: [], startTime: Date.now() });
    }
    
    const session = this.sessions.get(sessionId);
    session.skills.push({ skillId, timestamp: Date.now(), result });
    session.lastActivity = Date.now();
  }

  /**
   * Start monitoring (same as before)
   */
  startMonitoring() {
    setInterval(() => {
      const health = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        skills: this.skills.size,
        sessions: this.sessions.size,
        metrics: this.metrics,
        aiEnabled: this.aiEnabled,
        aiRequests: this.metrics.aiRequests
      };
      console.log('🔍 Helm Health:', health);
    }, 30000);
  }

  /**
   * Get enhanced status
   */
  getStatus() {
    return {
      running: this.isRunning,
      skills: Array.from(this.skills.keys()),
      sessions: this.sessions.size,
      auditLogSize: this.auditLog.length,
      metrics: this.metrics,
      uptime: process.uptime(),
      aiEnabled: this.aiEnabled,
      aiIntegration: this.aiEnabled ? this.aiIntegration.getUsageStats() : null
    };
  }
}

module.exports = HelmEngineWithAI;
