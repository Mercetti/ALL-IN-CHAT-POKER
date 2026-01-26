// Smart AI Router - Routes requests to optimal models (optimized for user's system)
class AIRouter {
  constructor() {
    this.endpoints = {
      'deepseek': process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
      'qwen': process.env.OLLAMA_HOST || 'http://127.0.0.1:11434', 
      'tinyllama': process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'
    };
    
    this.modelMapping = {
      // Code & Technical - DeepSeek Coder
      'code': 'deepseek',
      'programming': 'deepseek',
      'technical': 'deepseek',
      'debug': 'deepseek',
      'generate code': 'deepseek',
      'help me code': 'deepseek',
      
      // Fast & Lightweight - Qwen 0.5b
      'quick': 'qwen',
      'simple': 'qwen', 
      'basic': 'qwen',
      'lightweight': 'qwen',
      'fast': 'qwen',
      'short': 'qwen',
      
      // General & Creative - TinyLlama (fallback)
      'chat': 'tinyllama',
      'creative': 'tinyllama',
      'story': 'tinyllama',
      'cosmetic': 'tinyllama',
      'generate': 'tinyllama',
      'create': 'tinyllama',
      'design': 'tinyllama'
    };
  }

  // Route request to optimal model based on context
  routeRequest(prompt, context = '') {
    const lowerPrompt = prompt.toLowerCase();
    const lowerContext = context.toLowerCase();
    
    // Check for specific keywords
    for (const [keyword, model] of Object.entries(this.modelMapping)) {
      if (lowerPrompt.includes(keyword) || lowerContext.includes(keyword)) {
        return {
          model: model,
          endpoint: this.endpoints[model],
          reason: `Matched keyword: ${keyword}`
        };
      }
    }
    
    // Default to tinyllama for general use
    return {
      model: 'tinyllama',
      endpoint: this.endpoints.tinyllama,
      reason: 'Default model for general use'
    };
  }

  // Get available models with their specializations
  getAvailableModels() {
    return {
      'deepseek-coder:1.3b': {
        gateway: this.endpoints.deepseek,
        specialty: 'Code generation, technical tasks, debugging',
        speed: 'fast',
        quality: 'high',
        useCase: 'Best for programming and technical help'
      },
      'qwen:0.5b': {
        gateway: this.endpoints.qwen,
        specialty: 'Fast responses, lightweight tasks, quick queries',
        speed: 'very fast',
        quality: 'medium',
        useCase: 'Perfect for quick questions and simple tasks'
      },
      'tinyllama:latest': {
        gateway: this.endpoints.tinyllama,
        specialty: 'General chat, creative tasks, cosmetic generation',
        speed: 'fast',
        quality: 'good',
        useCase: 'Great for general purpose and creative work'
      }
    };
  }
}

module.exports = AIRouter;
