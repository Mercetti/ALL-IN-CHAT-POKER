const Logger = require('./logger');
const logger = new Logger('AI');

// AI response validation
const parseAIResponse = (response) => {
  try {
    return JSON.parse(response);
  } catch (error) {
    logger.warn('AI response not valid JSON', { 
      response: response?.substring(0, 200), 
      error: error.message 
    });
    
    // Try to extract JSON from response
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        logger.warn('Failed to extract JSON from response');
      }
    }
    
    // Return structured fallback
    return {
      type: 'fallback_response',
      message: response,
      timestamp: new Date().toISOString()
    };
  }
};
const config = require('./config');
const TunnelOptimizer = require('./tunnel-optimizer');
const FreeAIManager = require('./free-ai-manager');
const AICache = require('./ai-cache');
const AIPerformanceMonitor = require('./ai-performance-monitor');
const resilienceManager = require('./resilience-manager');

// Initialize AI systems
if (process.env.NODE_ENV !== 'test') {
  const aiCache = new AICache({ maxSize: 1000, ttl: 1800000 });
  const performanceMonitor = new AIPerformanceMonitor();
} // Added closing brace here

// Initialize AI manager
const aiManager = new FreeAIManager({
  preferredProvider: config.AI_PROVIDER || 'ollama',
  fallbackToRules: true,
  enableLocalModels: true
});

// Initialize tunnel optimizer
const optimizer = new TunnelOptimizer();

// Model selection function
function selectModelForContext(messages = [], options = {}) {
  const userMessage = messages[messages.length - 1]?.content || '';
  const systemMessage = messages[0]?.content || '';
  
  // Available models that fit in 8.6GB RAM
  const availableModels = ['deepseek-coder:1.3b', 'qwen:0.5b', 'llama3.2:1b', 'tinyllama:latest', 'llama3.2:latest'];
  
  // Audio/creative contexts - use smaller, more creative models
  if (systemMessage.includes('audio engineer') || 
      systemMessage.includes('composer') ||
      userMessage.includes('music') ||
      userMessage.includes('sound') ||
      options.context === 'audio') {
    return 'qwen:0.5b'; // Best for creative tasks
  }
  
  // Coding/technical contexts - use deepseek-coder
  if (userMessage.includes('code') ||
      userMessage.includes('function') ||
      userMessage.includes('debug') ||
      userMessage.includes('error') ||
      systemMessage.includes('coding') ||
      options.context === 'coding') {
    return 'deepseek-coder:1.3b';
  }
  
  // Personality/creative contexts
  if (systemMessage.includes('flirty') ||
      systemMessage.includes('savage') ||
      systemMessage.includes('playful') ||
      options.context === 'personality') {
    return 'qwen:0.5b';
  }
  
  // Default - use configured model (ensure it's available)
  const defaultModel = config.OLLAMA_MODEL || 'deepseek-coder:1.3b';
  return availableModels.includes(defaultModel) ? defaultModel : 'deepseek-coder:1.3b';
}

// Start performance monitoring
if (process.env.NODE_ENV !== 'test' && performanceMonitor) {
  performanceMonitor.on('slow-response', (data) => {
    logger.warn('Slow AI response detected', data);
  });
  performanceMonitor.on('high-error-rate', (data) => {
    logger.error('High AI error rate detected', data);
  });
  performanceMonitor.on('recommendations', (recommendations) => {
    logger.info('AI Performance Recommendations:', recommendations);
  });
}

function assertProvider() {
  // Always available with free AI manager
  return aiManager.currentProvider?.name || 'rules';
}

async function chat(messages = [], options = {}) {
  const startTime = Date.now();
  
  try {
    // Use resilience manager for circuit breaker protection
    return await resilienceManager.executeWithCircuitBreaker('ai', async () => {
      // Check cache first
      const cachedResponse = aiCache.get(messages, options);
      if (cachedResponse) {
        performanceMonitor.recordRequest(startTime, Date.now(), options.model || 'unknown', true, true);
        return cachedResponse;
      }

      // Context-aware model selection with load balancing
      const selectedModel = selectModelForContext(messages, options);
      
      // Optimize options for tunnel if needed
      const optimizedOptions = optimizer.optimizeAIRequest({
        ...options,
        model: selectedModel
      });
      
      // Use AI manager with optimized options and retry logic
      const response = await resilienceManager.executeWithRetry('ai', async () => {
        return await aiManager.chat(messages, optimizedOptions);
      }, 3, 1000);
      
      // Cache the response
      aiCache.set(messages, optimizedOptions, response);
      
      // Record performance metrics
      performanceMonitor.recordRequest(startTime, Date.now(), selectedModel, true, false);
      
      return response;
    }, resilienceManager.fallbackResponses.get('ai')?.chat);
    
  } catch (error) {
    // Record error metrics
    performanceMonitor.recordRequest(startTime, Date.now(), options.model || 'unknown', false, false);
    
    // Return fallback response instead of throwing
    const fallback = resilienceManager.fallbackResponses.get('ai');
    if (fallback && fallback.chat) {
      logger.warn('AI chat failed, using fallback', { error: error.message });
      return fallback.chat;
    }
    
    throw error;
  }
}

// ======================
// Unified AI Interface
// ======================
function getUnifiedAI() {
  return {
    generateResponse: async (prompt, options) => {
      const messages = [
        { role: 'system', content: options.systemPrompt || '' },
        { role: 'user', content: prompt }
      ];
      
      const response = await chat(messages, {
        model: options.model,
        maxTokens: options.maxTokens,
        temperature: options.temperature
      });
      
      return response;
    }
  };
}

module.exports = {
  chat,
  getUnifiedAI,
  getAICacheStats: () => aiCache.getStats(),
  getAIPerformanceReport: () => performanceMonitor.getReport(),
  getTunnelStatus: () => optimizer.getTunnelStatus(),
  clearAICache: () => aiCache.clear(),
  resetAIPerformanceMetrics: () => performanceMonitor.resetMetrics(),
  getResilienceStatus: () => resilienceManager.getResilienceStatus(),
  getHealthStatus: () => resilienceManager.getAllHealthChecks()
};
