/**
 * Helm Local LLM Engine
 * Advanced AI capabilities with local language models
 */

const HelmAIIntegration = require('./helm-ai-integration');

class HelmLocalLLMEngine {
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
    
    // Initialize Local LLM integration
    this.aiIntegration = new HelmAIIntegration({
      aiProvider: 'local',
      baseURL: 'http://localhost:11434',
      model: 'llama2',
      maxTokens: 1000,
      timeout: 30000
    });
  }

  async initialize() {
    console.log('🚀 Initializing Helm with Local LLM...');
    
    try {
      // Test Ollama connection
      const testResult = await this.aiIntegration.testConnection();
      if (!testResult.success) {
        console.error('❌ Ollama not available. Make sure Ollama is running:');
        console.error('   1. Install Ollama: https://ollama.ai');
        console.error('   2. Run: ollama serve');
        console.error('   3. Download model: ollama pull llama2');
        throw new Error('Local LLM not available');
      }
      
      console.log('✅ Local LLM connected:', testResult.model);
      
      // Load AI-enhanced skills
      await this.loadSkills();
      this.startMonitoring();
      this.isRunning = true;
      
      console.log('✅ Helm with Local LLM Ready');
      
    } catch (error) {
      console.error('❌ Helm Local LLM initialization failed:', error);
      throw error;
    }
  }

  async loadSkills() {
    const skills = [
      {
        id: 'poker_commentary',
        name: 'AI Poker Commentary',
        category: 'game',
        execute: (params) => this.generatePokerCommentary(params)
      },
      {
        id: 'chat_response',
        name: 'AI Chat Response',
        category: 'communication',
        execute: (params) => this.generateAIResponse(params)
      },
      {
        id: 'game_analysis',
        name: 'AI Game Analysis',
        category: 'analytics',
        execute: (params) => this.analyzeGameState(params)
      },
      {
        id: 'player_assist',
        name: 'AI Player Assistant',
        category: 'assistance',
        execute: (params) => this.assistPlayer(params)
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
    console.log(`📦 Loaded ${skills.length} AI-enhanced skills`);
  }

  async generatePokerCommentary(params) {
    const { gameState, action, player, cards } = params;
    
    const prompt = `Provide engaging poker commentary for this situation:
Player: ${player}
Action: ${action}
Cards: ${cards ? cards.join(', ') : 'Hidden'}
Pot: ${gameState?.pot || 'Unknown'}
Community: ${gameState?.community || 'None'}

Make it exciting and educational for viewers. Keep it under 100 words.`;

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
      console.error('Poker commentary failed:', error);
      return {
        commentary: `Interesting move by ${player}! The tension is building at the table.`,
        provider: 'fallback'
      };
    }
  }

  async generateAIResponse(params) {
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
      console.error('AI response failed:', error);
      return this.getFallbackResponse(message, context);
    }
  }

  async analyzeGameState(params) {
    const { gameState, playerActions, recentHands } = params;
    
    const prompt = `Analyze this poker game state and provide insights:
Game State: ${JSON.stringify(gameState)}
Recent Actions: ${playerActions?.join(', ') || 'None'}
Recent Hands: ${recentHands?.slice(0, 3).join(', ') || 'None'}

Focus on:
1. Game dynamics and player tendencies
2. Notable patterns or tells
3. Strategic recommendations
Keep analysis concise and actionable.`;

    try {
      this.metrics.aiRequests++;
      const result = await this.aiIntegration.generateResponse(prompt, {
        type: 'analytics',
        sessionId: params.sessionId
      });
      
      return {
        analysis: result.response,
        insights: this.extractInsights(result.response),
        provider: result.provider,
        model: result.model
      };
    } catch (error) {
      console.error('Game analysis failed:', error);
      return {
        analysis: 'Game analysis unavailable. Check player patterns and betting behavior.',
        insights: ['Monitor betting patterns', 'Track player tendencies'],
        provider: 'fallback'
      };
    }
  }

  async assistPlayer(params) {
    const { question, playerContext, gameState } = params;
    
    const prompt = `As a poker assistant, help with this question:
Question: ${question}
Player Context: ${playerContext}
Game State: ${JSON.stringify(gameState)}

Provide helpful, educational poker advice. Focus on strategy and decision-making.
Keep response under 150 words.`;

    try {
      this.metrics.aiRequests++;
      const result = await this.aiIntegration.generateResponse(prompt, {
        type: 'assistance',
        sessionId: params.sessionId
      });
      
      return {
        advice: result.response,
        category: this.categorizeAdvice(result.response),
        provider: result.provider,
        model: result.model
      };
    } catch (error) {
      console.error('Player assistance failed:', error);
      return {
        advice: 'Consider your position, pot odds, and opponent tendencies before making your decision.',
        category: 'general',
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
    
    // Generate AI commentary for the deal
    let commentary = null;
    try {
      const commentaryResult = await this.generatePokerCommentary({
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
    
    // Generate AI analysis for significant bets
    let analysis = null;
    if (amount > 100) {
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

  extractInsights(analysis) {
    const insights = [];
    const lines = analysis.split('\n');
    
    lines.forEach(line => {
      if (line.includes('pattern') || line.includes('tendency') || 
          line.includes('recommend') || line.includes('suggest')) {
        insights.push(line.trim());
      }
    });
    
    return insights.slice(0, 3);
  }

  categorizeAdvice(advice) {
    if (advice.toLowerCase().includes('bet') || advice.toLowerCase().includes('pot')) {
      return 'betting';
    } else if (advice.toLowerCase().includes('fold') || advice.toLowerCase().includes('check')) {
      return 'action';
    } else if (advice.toLowerCase().includes('position') || advice.toLowerCase().includes('table')) {
      return 'strategy';
    }
    return 'general';
  }

  getFallbackResponse(message, context) {
    const fallbacks = {
      poker: [
        "That's an interesting poker situation! Consider the pot odds and your position.",
        "Nice play! Think about what your opponents might be holding.",
        "Strategic move! The dynamics at the table are really developing."
      ],
      chat: [
        "I'm here to help with the poker game! What would you like to know?",
        "That's a great question about the game. Let me think about that.",
        "I'm processing your request. How can I assist with the poker action?"
      ],
      analytics: [
        "The game shows interesting patterns. Monitor betting behaviors for insights.",
        "Player tendencies are emerging. Track their actions for strategic advantages.",
        "Game dynamics are shifting. Analyze the flow for optimal decisions."
      ],
      assistance: [
        "Consider your position and the current game state before making your move.",
        "Think about pot odds and opponent tendencies when deciding your action.",
        "Review the betting patterns and adjust your strategy accordingly."
      ]
    };

    const responses = fallbacks[context] || fallbacks.chat;
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      provider: 'fallback',
      model: 'rule-based'
    };
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
        llmModel: this.aiIntegration.model,
        timestamp: new Date().toISOString()
      };
      console.log('🔍 Helm + Local LLM Health:', health);
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
      llmModel: this.aiIntegration.model,
      uptime: process.uptime()
    };
  }
}

module.exports = HelmLocalLLMEngine;
