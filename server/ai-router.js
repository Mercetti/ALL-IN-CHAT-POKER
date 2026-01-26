// Smart AI Router - Routes requests to optimal models
class AIRouter {
  constructor() {
    this.endpoints = {
      'llama2': process.env.LLAMA2_GATEWAY || 'http://127.0.0.1:11434',
      'qwen': process.env.QWEN_GATEWAY || 'http://127.0.0.1:11434', 
      'deepseek': process.env.DEEPSEEK_GATEWAY || 'http://127.0.0.1:11434',
      'llama3': process.env.LLAMA3_GATEWAY || 'http://127.0.0.1:11434'
    };
    
    this.modelMapping = {
      // Chat & Creative
      'chat': 'llama2',
      'creative': 'llama2',
      'story': 'llama2',
      'cosmetic': 'llama2',
      
      // Fast & Lightweight
      'quick': 'qwen',
      'simple': 'qwen', 
      'basic': 'qwen',
      'lightweight': 'qwen',
      
      // Code & Technical
      'code': 'deepseek',
      'programming': 'deepseek',
      'technical': 'deepseek',
      'debug': 'deepseek',
      
      // Complex Reasoning
      'analysis': 'llama3',
      'complex': 'llama3',
      'reasoning': 'llama3',
      'research': 'llama3'
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
    
    // Default to llama2 for general use
    return {
      model: 'llama2',
      endpoint: this.endpoints.llama2,
      reason: 'Default model for general use'
    };
  }

  // Get available models with their specializations
  getAvailableModels() {
    return {
      'llama2:latest': {
        gateway: this.endpoints.llama2,
        specialty: 'General chat, creative tasks, cosmetic generation',
        speed: 'medium',
        quality: 'high'
      },
      'qwen:0.5b': {
        gateway: this.endpoints.qwen,
        specialty: 'Fast responses, lightweight tasks, quick queries',
        speed: 'very fast',
        quality: 'medium'
      },
      'deepseek-coder:1.3b': {
        gateway: this.endpoints.deepseek,
        specialty: 'Code generation, technical tasks, debugging',
        speed: 'fast',
        quality: 'high'
      },
      'llama3.2:latest': {
        gateway: this.endpoints.llama3,
        specialty: 'Complex reasoning, analysis, research tasks',
        speed: 'slow',
        quality: 'very high'
      }
    };
  }
}

module.exports = AIRouter;
