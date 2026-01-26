/**
 * Helm Small LLM Engine
 * Efficient AI capabilities with lightweight local language models under 1GB
 */

const HelmAIIntegration = require('./helm-ai-integration');

class HelmSmallLLMEngine {
  constructor() {
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
    
    // Initialize with small models
    this.models = {
      fast: 'tinyllama',      // Fastest, smallest
      balanced: 'phi',          // Good balance of speed/quality
      efficient: 'qwen:1.5-0.5b'  // Most efficient
    };
    
    this.currentModel = this.models.fast; // Start with fastest
    
    this.aiIntegration = new HelmAIIntegration({
      aiProvider: 'local',
      baseURL: 'http://localhost:11434',
      model: this.currentModel,
      maxTokens: 500, // Smaller token limit for speed
      timeout: 15000  // Faster timeout
    });
  }

  async initialize() {
    console.log('🚀 Initializing Helm with Small LLMs...');
    
    try {
      // Test small models availability
      const availableModels = await this.checkAvailableModels();
      
      if (availableModels.length === 0) {
        console.error('❌ No small models available. Make sure Ollama is running:');
        console.error('   1. Install Ollama: https://ollama.ai');
        console.error('   2. Run: ollama serve');
        console.error('   3. Download small models:');
        console.error('      ollama pull tinyllama');
        console.error('      ollama pull phi');
        console.error('      ollama pull qwen:1.5-0.5b');
        throw new Error('No small LLMs available');
      }
      
      console.log('✅ Available models:', availableModels.join(', '));
      console.log('✅ Using model:', this.currentModel);
      
      // Load AI-enhanced skills optimized for small models
      await this.loadSkills();
      this.startMonitoring();
      this.isRunning = true;
      
      console.log('✅ Helm with Small LLMs Ready');
      
    } catch (error) {
      console.error('❌ Helm Small LLM initialization failed:', error);
      throw error;
    }
  }

  async checkAvailableModels() {
    const models = [];
    
    for (const [name, model] of Object.entries(this.models)) {
      try {
        const testResult = await this.aiIntegration.generateResponse('test', {
          type: 'test',
          sessionId: 'test'
        });
        
        if (testResult.success) {
          models.push(name);
        }
      } catch (error) {
        console.log(`⚠️ Model ${model} not available: ${error.message}`);
      }
    }
    
    return models;
  }

  async loadSkills() {
    const skills = [
      {
        id: 'quick_commentary',
        name: 'Quick AI Commentary',
        category: 'game',
        execute: (params) => this.generateQuickCommentary(params)
      },
      {
        id: 'simple_chat',
        name: 'Simple AI Chat',
        category: 'communication',
        execute: (params) => this.generateSimpleChat(params)
      },
      {
        id: 'basic_analysis',
        name: 'Basic Game Analysis',
        category: 'analytics',
        execute: (params) => this.generateBasicAnalysis(params)
      },
      {
        id: 'quick_assist',
        name: 'Quick Player Assist',
        category: 'assistance',
        execute: (params) => this.generateQuickAssist(params)
      },
      {
        id: 'poker_deal',
        name: 'Poker Deal',
        category: 'game',
        execute: (params) => this.dealCards(params)
      },
      {
        id: 'poker_bet',
        name: 'Poker Bet',
        category: 'game',
        execute: (params) => this.placeBet(params)
      }
    ];

    skills.forEach(skill => this.skills.set(skill.id, skill));
    console.log(`📦 Loaded ${skills.length} small LLM-optimized skills`);
  }

  async generateQuickCommentary(params) {
    const { gameState, action, player } = params;
    
    const prompt = `Brief poker commentary (under 50 words):
Player: ${player}
Action: ${action}
Pot: ${gameState?.pot || 'Unknown'}

Keep it short and exciting!`;

    try {
      this.metrics.aiRequests++;
      const result = await this.aiIntegration.generateResponse(prompt, {
        type: 'poker',
        sessionId: params.sessionId
      });
      
      return {
        commentary: result.response,
        provider: result.provider,
        model: result.model,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Quick commentary failed:', error);
      return {
        commentary: `Nice move by ${player}! Great action!`,
        provider: 'fallback'
      };
    }
  }

  async generateSimpleChat(params) {
    const { message, context = 'chat' } = params;
    
    try {
      this.metrics.aiRequests++;
      const result = await this.aiIntegration.generateResponse(message, {
        type: context,
        sessionId: params.sessionId
      });
      
      return {
        response: result.response,
        provider: result.provider,
        model: result.model,
        tokens: result.tokens
      };
    } catch (error) {
      console.error('Simple chat failed:', error);
      return this.getFallbackResponse(message, context);
    }
  }

  async generateBasicAnalysis(params) {
    const { gameState, playerActions } = params;
    
    const prompt = `Quick poker analysis (under 75 words):
Game: ${JSON.stringify(gameState)}
Actions: ${playerActions?.slice(0, 2).join(', ') || 'None'}

Key insights only!`;

    try {
      this.metrics.aiRequests++;
      const result = await this.aiIntegration.generateResponse(prompt, {
        type: 'analytics',
        sessionId: params.sessionId
      });
      
      return {
        analysis: result.response,
        provider: result.provider,
        model: result.model
      };
    } catch (error) {
      console.error('Basic analysis failed:', error);
      return {
        analysis: 'Game shows active play. Monitor betting patterns.',
        provider: 'fallback'
      };
    }
  }

  async generateQuickAssist(params) {
    const { question } = params;
    
    const prompt = `Brief poker advice (under 60 words):
Question: ${question}

Keep it simple and actionable!`;

    try {
      this.metrics.aiRequests++;
      const result = await this.aiIntegration.generateResponse(prompt, {
        type: 'assistance',
        sessionId: params.sessionId
      });
      
      return {
        advice: result.response,
        provider: result.provider,
        model: result.model
      };
    } catch (error) {
      console.error('Quick assist failed:', error);
      return {
        advice: 'Consider position and pot odds. Good luck!',
        provider: 'fallback'
      };
    }
  }

  async dealCards(params) {
    const { playerId, count = 5 } = params;
    
    // Generate cards
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    const cards = [];
    for (let i = 0; i < count; i++) {
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      cards.push(`${rank}${suit}`);
    }
    
    // Generate quick commentary
    let commentary = null;
    try {
      const commentaryResult = await this.generateQuickCommentary({
        gameState: { action: 'deal' },
        action: 'dealt cards',
        playerId,
        sessionId: params.sessionId
      });
      commentary = commentaryResult.commentary;
    } catch (error) {
      console.log('Deal commentary failed, continuing without it');
    }
    
    return { 
      playerId, 
      cards, 
      count: cards.length,
      commentary,
      dealtAt: new Date().toISOString()
    };
  }

  async placeBet(params) {
    const { playerId, amount, gameType = 'poker' } = params;
    
    if (amount <= 0) {
      throw new Error('Bet amount must be positive');
    }
    
    const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      playerId, 
      amount, 
      betId,
      gameType,
      status: 'placed',
      placedAt: new Date().toISOString()
    };
  }

  getFallbackResponse(message, context) {
    const fallbacks = {
      poker: [
        "Great poker action! Keep playing smart!",
        "Nice move! The game is exciting!",
        "Good strategy! Stay focused!"
      ],
      chat: [
        "I'm here to help with the game!",
        "That's interesting about poker!",
        "Great question about the game!"
      ],
      analytics: [
        "Game looks active and engaging!",
        "Players are making good moves!",
        "The pot is building up nicely!"
      ],
      assistance: [
        "Play smart and have fun!",
        "Consider your position carefully!",
        "Good luck at the tables!"
      ]
    };

    const responses = fallbacks[context] || fallbacks.chat;
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      provider: 'fallback',
      model: 'rule-based'
    };
  }

  // Switch between models for different tasks
  switchModel(modelName) {
    if (this.models[modelName]) {
      this.currentModel = this.models[modelName];
      this.aiIntegration.model = this.currentModel;
      console.log(`🔄 Switched to model: ${this.currentModel}`);
      return true;
    }
    return false;
  }

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
        duration: Date.now() - startTime
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

  updateSession(sessionId, skillId, result) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { skills: [], startTime: Date.now() });
    }
    
    const session = this.sessions.get(sessionId);
    session.skills.push({ skillId, timestamp: Date.now(), result });
    session.lastActivity = Date.now();
  }

  startMonitoring() {
    setInterval(() => {
      const health = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        skills: this.skills.size,
        sessions: this.sessions.size,
        metrics: this.metrics,
        llmStatus: 'connected',
        currentModel: this.currentModel,
        availableModels: Object.values(this.models),
        timestamp: new Date().toISOString()
      };
      console.log('🔍 Helm + Small LLM Health:', health);
    }, 30000);
  }

  getStatus() {
    return {
      running: this.isRunning,
      skills: Array.from(this.skills.keys()),
      sessions: this.sessions.size,
      auditLogSize: this.auditLog.length,
      metrics: this.metrics,
      llmProvider: 'local',
      currentModel: this.currentModel,
      availableModels: Object.values(this.models),
      uptime: process.uptime()
    };
  }
}

module.exports = HelmSmallLLMEngine;
