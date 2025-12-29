/**
 * Free AI Provider Manager
 * Supports multiple free AI options: Ollama, Local Models, and Rule-Based AI
 */

const fetch = global.fetch;
const config = require('./config');

// Simple logger fallback for when logger module isn't available
const logger = {
  info: (message, meta) => console.log(`[FreeAI] ${message}`, meta || ''),
  warn: (message, meta) => console.warn(`[FreeAI] ${message}`, meta || ''),
  error: (message, meta) => console.error(`[FreeAI] ${message}`, meta || '')
};

class FreeAIManager {
  constructor(options = {}) {
    this.options = {
      preferredProvider: options.preferredProvider || 'ollama',
      fallbackToRules: options.fallbackToRules !== false,
      enableLocalModels: options.enableLocalModels !== false,
      ...options
    };
    
    this.providers = {
      ollama: new OllamaProvider(),
      local: new LocalModelProvider(),
      rules: new RuleBasedProvider()
    };
    
    this.currentProvider = null;
    this.init();
  }

  init() {
    // Try to initialize preferred provider
    this.currentProvider = this.getAvailableProvider();
    
    if (!this.currentProvider) {
      logger.warn('No AI provider available, falling back to rule-based responses');
      this.currentProvider = this.providers.rules;
    }
    
    logger.info('Free AI Manager initialized', { 
      provider: this.currentProvider.name,
      availableProviders: this.getAvailableProviders()
    });
  }

  /**
   * Get available AI provider
   */
  getAvailableProvider() {
    const providers = this.getAvailableProviders();
    
    // Try preferred provider first
    if (providers.includes(this.options.preferredProvider)) {
      return this.providers[this.options.preferredProvider];
    }
    
    // Try any available provider
    for (const providerName of providers) {
      if (this.providers[providerName]) {
        return this.providers[providerName];
      }
    }
    
    return null;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders() {
    const available = [];
    
    // Check Ollama
    if (this.providers.ollama.isAvailable()) {
      available.push('ollama');
    }
    
    // Check local models
    if (this.options.enableLocalModels && this.providers.local.isAvailable()) {
      available.push('local');
    }
    
    // Rules are always available
    available.push('rules');
    
    return available;
  }

  /**
   * Chat with AI using available provider
   */
  async chat(messages = [], options = {}) {
    try {
      if (!this.currentProvider) {
        throw new Error('No AI provider available');
      }
      
      const response = await this.currentProvider.chat(messages, options);
      return response;
    } catch (error) {
      logger.error('AI chat failed', { 
        provider: this.currentProvider.name, 
        error: error.message 
      });
      
      // Try fallback provider
      if (this.options.fallbackToRules && this.currentProvider.name !== 'rules') {
        logger.info('Falling back to rule-based responses');
        return await this.providers.rules.chat(messages, options);
      }
      
      throw error;
    }
  }

  /**
   * Switch provider
   */
  switchProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    
    if (!this.getAvailableProviders().includes(providerName)) {
      throw new Error(`Provider not available: ${providerName}`);
    }
    
    this.currentProvider = this.providers[providerName];
    logger.info('Switched AI provider', { provider: providerName });
  }

  /**
   * Get provider status
   */
  getStatus() {
    return {
      current: this.currentProvider?.name || 'none',
      available: this.getAvailableProviders(),
      providers: Object.keys(this.providers).map(name => ({
        name,
        available: this.providers[name].isAvailable(),
        status: this.providers[name].getStatus()
      }))
    };
  }
}

/**
 * Ollama Provider - Free local AI models
 */
class OllamaProvider {
  constructor() {
    this.name = 'ollama';
    this.host = config.OLLAMA_HOST || 'http://127.0.0.1:11434';
    this.defaultModel = config.OLLAMA_MODEL || 'llama3.2';
  }

  isAvailable() {
    // Check if Ollama is running
    return this.checkOllamaStatus();
  }

  async checkOllamaStatus() {
    try {
      const response = await fetch(`${this.host}/api/tags`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async chat(messages = [], options = {}) {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || 1000;
    const temperature = options.temperature || 0.7;

    const response = await fetch(`${this.host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages,
        options: { 
          temperature, 
          num_predict: maxTokens,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = await response.json();
    return data?.message?.content || '';
  }

  getStatus() {
    return {
      host: this.host,
      defaultModel: this.defaultModel,
      running: this.isAvailable()
    };
  }
}

/**
 * Local Model Provider - Free offline models
 */
class LocalModelProvider {
  constructor() {
    this.name = 'local';
    this.models = new Map();
    this.loadLocalModels();
  }

  isAvailable() {
    return this.models.size > 0;
  }

  loadLocalModels() {
    // Load simple rule-based models for now
    // In a real implementation, this would load actual local ML models
    this.models.set('basic-chat', {
      responses: {
        greeting: ['Hey there! Ready to play some poker?', 'Hi! How can I help with the game?'],
        strategy: ['Focus on position and pot odds', 'Consider your hand strength carefully'],
        encouragement: ['Nice play!', 'Good decision!', 'Well done!'],
        consolation: ['Tough hand, better luck next time!', 'That\'s poker for you!']
      }
    });
  }

  async chat(messages = [], options = {}) {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const response = this.generateResponse(lastMessage);
    return response;
  }

  generateResponse(message) {
    const lowerMessage = message.toLowerCase();
    const model = this.models.get('basic-chat');
    
    // Simple pattern matching
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
      return model.responses.greeting[Math.floor(Math.random() * model.responses.greeting.length)];
    }
    
    if (lowerMessage.includes('strategy') || lowerMessage.includes('how to')) {
      return model.responses.strategy[Math.floor(Math.random() * model.responses.strategy.length)];
    }
    
    if (lowerMessage.includes('win') || lowerMessage.includes('nice')) {
      return model.responses.encouragement[Math.floor(Math.random() * model.responses.encouragement.length)];
    }
    
    if (lowerMessage.includes('lose') || lowerMessage.includes('bad')) {
      return model.responses.consolation[Math.floor(Math.random() * model.responses.consolation.length)];
    }
    
    // Default response
    return "I'm here to help with the poker game! Ask me about strategy or just chat!";
  }

  getStatus() {
    return {
      modelsLoaded: this.models.size,
      availableModels: Array.from(this.models.keys())
    };
  }
}

/**
 * Rule-Based Provider - Always available fallback
 */
class RuleBasedProvider {
  constructor() {
    this.name = 'rules';
    this.responses = {
      greeting: [
        "Hey there! Welcome to the poker stream! 🎰",
        "Hi! Ready to talk poker or blackjack? 🃏",
        "Hello! I'm your poker assistant! What's up?"
      ],
      strategy: [
        "Focus on position and pot odds for better decisions!",
        "Consider your hand strength and the community cards.",
        "Patience is key - wait for the right moment!"
      ],
      encouragement: [
        "Nice play! Well done! 🎉",
        "Great decision! Keep it up! 👏",
        "Excellent move! You're on fire! 🔥"
      ],
      consolation: [
        "Tough hand, but that's poker! Better luck next time! 💪",
        "Don't worry about one hand - variance happens! 🍀",
        "Stay focused and you'll get 'em next time! 🎯"
      ],
      gameInfo: [
        "The pot is building up nicely!",
        "Players are getting ready for the next round.",
        "The action is heating up at the table!"
      ],
      general: [
        "I'm here to help with poker questions!",
        "Ask me about strategy or just chat!",
        "Let's talk poker! What's on your mind?"
      ]
    };
  }

  isAvailable() {
    return true; // Always available
  }

  async chat(messages = [], options = {}) {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const response = this.generateResponse(lastMessage);
    return response;
  }

  generateResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Pattern matching for responses
    if (lowerMessage.match(/^(hi|hello|hey|what's up|yo)/)) {
      return this.getRandomResponse('greeting');
    }
    
    if (lowerMessage.includes('strategy') || lowerMessage.includes('how to') || lowerMessage.includes('should i')) {
      return this.getRandomResponse('strategy');
    }
    
    if (lowerMessage.includes('win') || lowerMessage.includes('nice') || lowerMessage.includes('good')) {
      return this.getRandomResponse('encouragement');
    }
    
    if (lowerMessage.includes('lose') || lowerMessage.includes('bad') || lowerMessage.includes('tough')) {
      return this.getRandomResponse('consolation');
    }
    
    if (lowerMessage.includes('pot') || lowerMessage.includes('players') || lowerMessage.includes('round')) {
      return this.getRandomResponse('gameInfo');
    }
    
    return this.getRandomResponse('general');
  }

  getRandomResponse(category) {
    const responses = this.responses[category] || this.responses.general;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getStatus() {
    return {
      alwaysAvailable: true,
      responseCategories: Object.keys(this.responses)
    };
  }
}

module.exports = FreeAIManager;
