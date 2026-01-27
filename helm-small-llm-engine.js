/**
 * Helm Small LLM Engine
 * Efficient AI capabilities with lightweight local language models under 1GB
 */

const HelmAIIntegration = require('./helm-ai-integration');
const fs = require('fs').promises;
const path = require('path');

class HelmSmallLLMEngine {
  constructor() {
    this.skills = new Map();
    this.sessions = new Map();
    this.auditLog = [];
    this.isRunning = false;
    this.learningEnabled = true;
    this.learningPath = 'D:\\AceyLearning\\helm';
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      aiRequests: 0,
      learningEvents: 0,
      startTime: Date.now()
    };
    
    // Initialize with small models
    this.models = {
      fast: 'tinyllama',            // Fastest, smallest
      balanced: 'phi',                // Good balance of speed/quality
      efficient: 'qwen:0.5b',        // Most efficient
      coding: 'deepseek-coder:1.3b'  // Coding specialist
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
      
      // Initialize learning system
      await this.initializeLearning();
      
      // Load AI-enhanced skills optimized for small models
      await this.loadSkills();
      this.startMonitoring();
      this.isRunning = true;
      
      console.log('✅ Helm with Small LLMs Ready');
      console.log('🧠 Intelligent Learning System Active');
      
    } catch (error) {
      console.error('❌ Helm Small LLM initialization failed:', error);
      throw error;
    }
  }

  async checkAvailableModels() {
    const models = [];
    
    // Test connection to Ollama first
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) {
        throw new Error('Ollama not responding');
      }
      
      const data = await response.json();
      const availableModels = data.models.map(m => m.name);
      
      for (const [name, model] of Object.entries(this.models)) {
        if (availableModels.includes(model)) {
          models.push(name);
          console.log(`✅ Model ${model} is available`);
        } else {
          console.log(`⚠️ Model ${model} not found in Ollama`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check Ollama models:', error.message);
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
        id: 'code_analysis',
        name: 'Code Analysis',
        category: 'development',
        execute: (params) => this.analyzeCode(params)
      },
      {
        id: 'create_content',
        name: 'Creative Content',
        category: 'creative',
        execute: (params) => this.createContent(params)
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

  async analyzeCode(params) {
    const { code, language = 'javascript', task = 'analyze' } = params;
    
    // Switch to coding model
    const originalModel = this.currentModel;
    this.switchModel('coding');
    
    const prompt = `Code ${task} for ${language}:
\`\`\`${language}
${code}
\`\`\`

Provide ${task} in under 100 words. Focus on clarity and best practices.`;

    try {
      this.metrics.aiRequests++;
      const result = await this.aiIntegration.generateResponse(prompt, {
        type: 'coding',
        sessionId: params.sessionId
      });
      
      // Switch back to original model
      this.switchModel(originalModel === this.models.fast ? 'fast' : originalModel);
      
      return {
        analysis: result.response,
        provider: result.provider,
        model: result.model,
        language,
        task
      };
    } catch (error) {
      console.error('Code analysis failed:', error);
      // Switch back to original model
      this.switchModel(originalModel === this.models.fast ? 'fast' : originalModel);
      return {
        analysis: `Code analysis unavailable for ${language}. Check syntax and structure.`,
        provider: 'fallback'
      };
    }
  }

  async createContent(params) {
    const { type = 'logo', description, style = 'modern', format = 'text' } = params;
    
    // Use the balanced model for creative tasks
    const originalModel = this.currentModel;
    this.switchModel('balanced');
    
    const prompt = `Create ${type} design: ${description}
Style: ${style}
Format: ${format}

Generate detailed ${type} with visual elements, colors, and composition. Be creative and specific.`;

    try {
      this.metrics.aiRequests++;
      const result = await this.aiIntegration.generateResponse(prompt, {
        type: 'creative',
        sessionId: params.sessionId
      });
      
      // Switch back to original model
      this.switchModel(originalModel === this.models.fast ? 'fast' : originalModel);
      
      return {
        content: result.response,
        type,
        style,
        format,
        provider: result.provider,
        model: result.model
      };
    } catch (error) {
      console.error('Content creation failed:', error);
      // Switch back to original model
      this.switchModel(originalModel === this.models.fast ? 'fast' : originalModel);
      return {
        content: `Creative ${type} generation unavailable. Try a different description.`,
        provider: 'fallback'
      };
    }
  }

  getFallbackResponse(message, context) {
    const fallbacks = {
      poker: [
        "Great poker action! Keep playing smart!",
        "Nice move! The game is exciting!",
        "Good strategy! Stay focused!"
      ],
      chat: [
        "I'm here to help with your Helm system!",
        "Let me assist you with your request.",
        "How can I support your Helm experience?"
      ],
      creative: [
        "Creative generation in progress...",
        "Working on your creative request!",
        "Designing something special for you!"
      ],
      code: [
        "Code analysis complete!",
        "Reviewing your code structure...",
        "Optimization suggestions ready!"
      ]
    };
    
    const category = context?.category || 'chat';
    const responses = fallbacks[category] || fallbacks.chat;
    return responses[Math.floor(Math.random() * responses.length)];
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
      
      const executionTime = Date.now() - startTime;
      
      this.logEvent('skill_complete', { 
        skillId, 
        sessionId, 
        duration: executionTime
      });

      // Learn from successful execution
      await this.learnFromExecution(skillId, params, result, true, executionTime);

      this.metrics.successfulExecutions++;
      return { success: true, result, skillId, sessionId };
      
    } catch (error) {
      this.metrics.failedExecutions++;
      const executionTime = Date.now() - startTime;
      
      this.logEvent('skill_error', { 
        skillId, 
        sessionId, 
        error: error.message,
        duration: executionTime
      });
      
      // Learn from error
      await this.learnFromError(error, { skillId, params, sessionId });
      
      return { 
        success: false, 
        error: error.message, 
        skillId, 
        sessionId 
      };
    }
  }

  async learnFromExecution(skillId, params, result, success, executionTime) {
    if (!this.learningEnabled) return;

    try {
      // Quality assessment
      const quality = this.assessQuality(result, success, executionTime);
      
      // Only learn from high-quality executions
      if (quality < 0.7) return;

      const learningData = {
        timestamp: new Date().toISOString(),
        skillId,
        params: this.sanitizeParams(params),
        result: this.sanitizeResult(result),
        success,
        executionTime,
        quality,
        model: this.currentModel,
        confidence: this.calculateConfidence(result, success)
      };

      // Store in appropriate learning dataset
      await this.storeLearningData(skillId, learningData);
      
      this.metrics.learningEvents++;
      console.log(`🧠 Learned from ${skillId} execution (quality: ${quality.toFixed(2)})`);
      
    } catch (error) {
      console.error('❌ Learning failed:', error);
    }
  }

  async learnFromError(error, context) {
    if (!this.learningEnabled) return;

    try {
      const errorLearning = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        context: this.sanitizeParams(context),
        skillId: context?.skillId,
        model: this.currentModel,
        severity: this.assessErrorSeverity(error)
      };

      const errorPath = path.join(this.learningPath, 'errors', 'errors.jsonl');
      const line = JSON.stringify(errorLearning) + '\n';
      await fs.appendFile(errorPath, line);
      
      console.log(`🧠 Learned from error: ${error.message}`);
      
    } catch (writeError) {
      console.error('❌ Failed to store error learning:', writeError);
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
      uptime: process.uptime(),
      learning: this.getLearningStats()
    };
  }

  // ===== LEARNING HELPER METHODS =====

  async initializeLearning() {
    try {
      // Create learning directories
      await fs.mkdir(this.learningPath, { recursive: true });
      await fs.mkdir(path.join(this.learningPath, 'skills'), { recursive: true });
      await fs.mkdir(path.join(this.learningPath, 'errors'), { recursive: true });
      await fs.mkdir(path.join(this.learningPath, 'performance'), { recursive: true });
      await fs.mkdir(path.join(this.learningPath, 'patterns'), { recursive: true });
      
      console.log('🧠 Learning directories created');
    } catch (error) {
      console.error('❌ Failed to initialize learning:', error);
    }
  }

  assessQuality(result, success, executionTime) {
    if (!success) return 0.1;
    
    let quality = 0.5; // Base quality for success
    
    // Speed bonus (faster is better)
    if (executionTime < 1000) quality += 0.2;
    else if (executionTime < 3000) quality += 0.1;
    
    // Content quality
    if (result?.content) {
      const contentLength = result.content.length;
      if (contentLength > 50 && contentLength < 1000) quality += 0.2;
      if (result.content.includes('error') || result.content.includes('failed')) quality -= 0.3;
    }
    
    // Response structure
    if (result?.type || result?.analysis || result?.response) quality += 0.1;
    
    return Math.min(1.0, Math.max(0.1, quality));
  }

  calculateConfidence(result, success) {
    if (!success) return 0.1;
    
    let confidence = 0.7; // Base confidence
    
    if (result?.provider === 'local') confidence += 0.1;
    if (result?.model) confidence += 0.1;
    if (result?.content && result.content.length > 100) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  sanitizeParams(params) {
    const sanitized = { ...params };
    
    // Remove sensitive data
    delete sanitized.sessionId;
    delete sanitized.userId;
    delete sanitized.apiKey;
    delete sanitized.token;
    
    // Limit size
    const jsonStr = JSON.stringify(sanitized);
    if (jsonStr.length > 1000) {
      return { message: sanitized.message?.substring(0, 200) + '...' };
    }
    
    return sanitized;
  }

  sanitizeResult(result) {
    const sanitized = { ...result };
    
    // Keep only relevant fields
    const relevant = {
      content: sanitized.content,
      response: sanitized.response,
      analysis: sanitized.analysis,
      type: sanitized.type,
      success: sanitized.success
    };
    
    // Limit content size
    Object.keys(relevant).forEach(key => {
      if (typeof relevant[key] === 'string' && relevant[key].length > 500) {
        relevant[key] = relevant[key].substring(0, 500) + '...';
      }
    });
    
    return relevant;
  }

  async storeLearningData(skillId, learningData) {
    const datasetPath = path.join(this.learningPath, 'skills', `${skillId}.jsonl`);
    
    try {
      const line = JSON.stringify(learningData) + '\n';
      await fs.appendFile(datasetPath, line);
    } catch (error) {
      console.error(`❌ Failed to store learning data for ${skillId}:`, error);
    }
  }

  assessErrorSeverity(error) {
    if (error.message.includes('timeout')) return 'medium';
    if (error.message.includes('model')) return 'high';
    if (error.message.includes('network')) return 'medium';
    return 'low';
  }

  getLearningStats() {
    return {
      enabled: this.learningEnabled,
      path: this.learningPath,
      events: this.metrics.learningEvents,
      quality: this.metrics.successfulExecutions / Math.max(1, this.metrics.totalExecutions),
      suggestions: this.recentSuggestions?.length || 0
    };
  }

  // ===== ADVANCED AI LEARNING =====

  async analyzeUsagePatterns() {
    if (!this.learningEnabled) return [];

    try {
      const patterns = [];
      const skillUsage = {};

      // Analyze skill usage patterns
      this.auditLog.forEach(entry => {
        if (entry.event === 'skill_complete') {
          const skillId = entry.data.skillId;
          skillUsage[skillId] = (skillUsage[skillId] || 0) + 1;
        }
      });

      // Identify frequently used skill combinations
      const combinations = this.findSkillCombinations();
      
      // Generate insights
      if (skillUsage['simple_chat'] > 10) {
        patterns.push({
          type: 'usage',
          insight: 'High chat usage detected',
          suggestion: 'Consider adding specialized chat skills for different domains',
          priority: 'medium'
        });
      }

      if (combinations.length > 0) {
        patterns.push({
          type: 'workflow',
          insight: 'Common skill patterns detected',
          suggestion: `Create combined skill: ${combinations[0].join(' + ')}`,
          priority: 'high'
        });
      }

      return patterns;
    } catch (error) {
      console.error('❌ Pattern analysis failed:', error);
      return [];
    }
  }

  findSkillCombinations() {
    const sessions = {};
    
    this.auditLog.forEach(entry => {
      if (entry.event === 'skill_complete') {
        const sessionId = entry.data.sessionId;
        const skillId = entry.data.skillId;
        
        if (!sessions[sessionId]) {
          sessions[sessionId] = [];
        }
        sessions[sessionId].push(skillId);
      }
    });

    // Find common combinations
    const combinations = {};
    Object.values(sessions).forEach(skills => {
      for (let i = 0; i < skills.length - 1; i++) {
        const combo = `${skills[i]}+${skills[i + 1]}`;
        combinations[combo] = (combinations[combo] || 0) + 1;
      }
    });

    return Object.keys(combinations)
      .filter(combo => combinations[combo] > 3)
      .map(combo => combo.split('+'));
  }

  async suggestNewSkills() {
    if (!this.learningEnabled) return [];

    try {
      const suggestions = [];
      const patterns = await this.analyzeUsagePatterns();

      // Analyze failed requests for missing skills
      const failedRequests = this.auditLog
        .filter(entry => entry.event === 'skill_error')
        .map(entry => entry.data);

      const commonErrors = this.groupErrors(failedRequests);

      // Generate skill suggestions based on errors
      if (commonErrors['logo'] > 3) {
        suggestions.push({
          type: 'new_skill',
          name: 'Advanced Logo Generator',
          description: 'Enhanced logo creation with multiple styles and formats',
          parameters: ['style', 'format', 'industry', 'colors'],
          confidence: 0.85,
          priority: 'high'
        });
      }

      if (commonErrors['code'] > 2) {
        suggestions.push({
          type: 'new_skill',
          name: 'Code Refactoring Assistant',
          description: 'Automated code improvement and optimization suggestions',
          parameters: ['language', 'framework', 'optimization_type'],
          confidence: 0.78,
          priority: 'medium'
        });
      }

      // Suggest workflow improvements
      patterns.forEach(pattern => {
        if (pattern.type === 'workflow') {
          suggestions.push({
            type: 'workflow_improvement',
            name: `Combined Skill: ${pattern.suggestion}`,
            description: 'Automatically execute commonly used skill sequences',
            confidence: 0.72,
            priority: pattern.priority
          });
        }
      });

      // Store suggestions
      await this.storeSuggestions(suggestions);
      this.recentSuggestions = suggestions;

      return suggestions;
    } catch (error) {
      console.error('❌ Skill suggestion failed:', error);
      return [];
    }
  }

  groupErrors(errors) {
    const grouped = {};
    
    errors.forEach(error => {
      const errorType = this.categorizeError(error.error);
      grouped[errorType] = (grouped[errorType] || 0) + 1;
    });

    return grouped;
  }

  categorizeError(errorMessage) {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('logo') || lowerError.includes('design')) return 'logo';
    if (lowerError.includes('code') || lowerError.includes('function')) return 'code';
    if (lowerError.includes('poker') || lowerError.includes('game')) return 'poker';
    if (lowerError.includes('chat') || lowerError.includes('message')) return 'chat';
    
    return 'general';
  }

  async storeSuggestions(suggestions) {
    try {
      const suggestionsPath = path.join(this.learningPath, 'suggestions.jsonl');
      const data = {
        timestamp: new Date().toISOString(),
        suggestions,
        model: this.currentModel
      };
      
      const line = JSON.stringify(data) + '\n';
      await fs.appendFile(suggestionsPath, line);
    } catch (error) {
      console.error('❌ Failed to store suggestions:', error);
    }
  }

  async optimizeWorkflows() {
    if (!this.learningEnabled) return [];

    try {
      const optimizations = [];
      
      // Analyze execution times
      const skillPerformance = this.analyzeSkillPerformance();
      
      // Find slow skills
      Object.entries(skillPerformance).forEach(([skillId, perf]) => {
        if (perf.averageTime > 5000) { // 5 seconds
          optimizations.push({
            type: 'performance',
            skill: skillId,
            issue: 'Slow execution detected',
            suggestion: `Optimize ${skillId} - average time: ${perf.averageTime}ms`,
            potentialImprovement: '30-50% faster with caching',
            priority: 'high'
          });
        }
        
        if (perf.successRate < 0.8) {
          optimizations.push({
            type: 'reliability',
            skill: skillId,
            issue: 'Low success rate',
            suggestion: `Improve error handling in ${skillId} - success rate: ${(perf.successRate * 100).toFixed(1)}%`,
            potentialImprovement: '95%+ success rate',
            priority: 'medium'
          });
        }
      });

      // Model optimization suggestions
      const modelUsage = this.analyzeModelUsage();
      if (modelUsage.efficient < 0.6) {
        optimizations.push({
          type: 'model_optimization',
          issue: 'Suboptimal model selection',
          suggestion: 'Implement smarter model routing based on task complexity',
          potentialImprovement: '40% faster responses',
          priority: 'high'
        });
      }

      return optimizations;
    } catch (error) {
      console.error('❌ Workflow optimization failed:', error);
      return [];
    }
  }

  analyzeSkillPerformance() {
    const performance = {};
    const skillStats = {};

    this.auditLog.forEach(entry => {
      if (entry.event === 'skill_complete' || entry.event === 'skill_error') {
        const skillId = entry.data.skillId;
        const duration = entry.data.duration || 0;
        const success = entry.event === 'skill_complete';

        if (!skillStats[skillId]) {
          skillStats[skillId] = { totalTime: 0, count: 0, successCount: 0 };
        }

        skillStats[skillId].totalTime += duration;
        skillStats[skillId].count++;
        if (success) skillStats[skillId].successCount++;
      }
    });

    Object.entries(skillStats).forEach(([skillId, stats]) => {
      performance[skillId] = {
        averageTime: stats.totalTime / stats.count,
        successRate: stats.successCount / stats.count,
        totalExecutions: stats.count
      };
    });

    return performance;
  }

  analyzeModelUsage() {
    const usage = { efficient: 0, total: 0 };
    
    this.auditLog.forEach(entry => {
      if (entry.event === 'skill_complete') {
        usage.total++;
        // Consider efficient if execution time < 3 seconds
        if (entry.data.duration < 3000) {
          usage.efficient++;
        }
      }
    });

    return {
      efficient: usage.total > 0 ? usage.efficient / usage.total : 0,
      total: usage.total
    };
  }

  async generateImprovements() {
    if (!this.learningEnabled) return {};

    try {
      const [patterns, suggestions, optimizations] = await Promise.all([
        this.analyzeUsagePatterns(),
        this.suggestNewSkills(),
        this.optimizeWorkflows()
      ]);

      return {
        timestamp: new Date().toISOString(),
        patterns,
        suggestions,
        optimizations,
        summary: {
          totalInsights: patterns.length + suggestions.length + optimizations.length,
          highPriorityItems: [...suggestions, ...optimizations].filter(item => item.priority === 'high').length,
          learningEvents: this.metrics.learningEvents,
          systemQuality: this.metrics.successfulExecutions / Math.max(1, this.metrics.totalExecutions)
        }
      };
    } catch (error) {
      console.error('❌ Improvement generation failed:', error);
      return {};
    }
  }

  async learnFromUserBehavior(sessionData) {
    if (!this.learningEnabled) return;

    try {
      const behaviorData = {
        timestamp: new Date().toISOString(),
        sessionId: sessionData.sessionId,
        skillSequence: sessionData.skills?.map(s => s.skillId) || [],
        totalTime: sessionData.totalTime || 0,
        successRate: this.calculateSessionSuccessRate(sessionData),
        userSatisfaction: this.estimateUserSatisfaction(sessionData)
      };

      const behaviorPath = path.join(this.learningPath, 'patterns', 'user_behavior.jsonl');
      const line = JSON.stringify(behaviorData) + '\n';
      await fs.appendFile(behaviorPath, line);

      // Trigger adaptive learning
      await this.adaptToUserBehavior(behaviorData);
    } catch (error) {
      console.error('❌ User behavior learning failed:', error);
    }
  }

  calculateSessionSuccessRate(sessionData) {
    if (!sessionData.skills || sessionData.skills.length === 0) return 0;
    
    const successfulSkills = sessionData.skills.filter(skill => 
      skill.result && skill.result.success !== false
    ).length;
    
    return successfulSkills / sessionData.skills.length;
  }

  estimateUserSatisfaction(sessionData) {
    let satisfaction = 0.5; // Base satisfaction
    
    // Factor in success rate
    const successRate = this.calculateSessionSuccessRate(sessionData);
    satisfaction += successRate * 0.3;
    
    // Factor in response time
    if (sessionData.totalTime < 10000) satisfaction += 0.2; // Fast session
    
    // Factor in skill variety
    if (sessionData.skills && sessionData.skills.length > 3) satisfaction += 0.1;
    
    return Math.min(1.0, Math.max(0.1, satisfaction));
  }

  async adaptToUserBehavior(behaviorData) {
    try {
      // Adaptive model selection based on user preferences
      if (behaviorData.userSatisfaction > 0.8) {
        // User is satisfied - continue current approach
        console.log('🧠 User satisfaction high - maintaining current strategy');
      } else if (behaviorData.userSatisfaction < 0.5) {
        // User is dissatisfied - suggest improvements
        console.log('🧠 User satisfaction low - generating improvements');
        await this.generateImprovements();
      }

      // Learn skill preferences
      const skillPreferences = this.analyzeSkillPreferences(behaviorData.skillSequence);
      await this.storeSkillPreferences(skillPreferences);
    } catch (error) {
      console.error('❌ Adaptive learning failed:', error);
    }
  }

  analyzeSkillPreferences(skillSequence) {
    const preferences = {};
    
    skillSequence.forEach((skillId, index) => {
      if (!preferences[skillId]) {
        preferences[skillId] = { count: 0, positions: [] };
      }
      preferences[skillId].count++;
      preferences[skillId].positions.push(index);
    });

    return preferences;
  }

  async storeSkillPreferences(preferences) {
    try {
      const preferencesPath = path.join(this.learningPath, 'patterns', 'skill_preferences.jsonl');
      const data = {
        timestamp: new Date().toISOString(),
        preferences,
        model: this.currentModel
      };
      
      const line = JSON.stringify(data) + '\n';
      await fs.appendFile(preferencesPath, line);
    } catch (error) {
      console.error('❌ Failed to store skill preferences:', error);
    }
  }
}

module.exports = HelmSmallLLMEngine;
