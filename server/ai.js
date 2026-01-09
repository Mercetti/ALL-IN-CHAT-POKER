const Logger = require('./logger');
const config = require('./config');
const FreeAIManager = require('./free-ai-manager');
const TunnelOptimizer = require('./tunnel-optimizer');
const AICache = require('./ai-cache');
const AIPerformanceMonitor = require('./ai-performance-monitor');
const fetch = global.fetch;

const logger = new Logger('ai');

// Initialize AI systems
const freeAI = new FreeAIManager({
  preferredProvider: config.AI_PROVIDER || 'ollama',
  fallbackToRules: true,
  enableLocalModels: false
});

const tunnelOptimizer = new TunnelOptimizer();
const aiCache = new AICache({ maxSize: 500, ttl: 300000 });
const performanceMonitor = new AIPerformanceMonitor();

// Start performance monitoring
performanceMonitor.on('slow-response', (data) => {
  logger.warn('Slow AI response detected', data);
});

performanceMonitor.on('high-error-rate', (data) => {
  logger.error('High AI error rate detected', data);
});

performanceMonitor.on('recommendations', (recommendations) => {
  logger.info('AI Performance Recommendations:', recommendations);
});

function assertProvider() {
  // Always available with free AI manager
  return freeAI.currentProvider?.name || 'rules';
}

async function chat(messages = [], options = {}) {
  const startTime = Date.now();
  
  try {
    // Check cache first
    const cachedResponse = aiCache.get(messages, options);
    if (cachedResponse) {
      performanceMonitor.recordRequest(startTime, Date.now(), options.model || 'unknown', true, true);
      return cachedResponse;
    }

    // Context-aware model selection with load balancing
    const selectedModel = selectModelForContext(messages, options);
    
    // Optimize options for tunnel if needed
    const optimizedOptions = tunnelOptimizer.optimizeAIRequest({
      ...options,
      model: selectedModel
    });
    
    // Use free AI manager with optimized options
    const response = await freeAI.chat(messages, optimizedOptions);
    
    // Cache the response
    aiCache.set(messages, optimizedOptions, response);
    
    // Record performance metrics
    performanceMonitor.recordRequest(startTime, Date.now(), selectedModel, true, false);
    
    return response;
    
  } catch (error) {
    // Record error metrics
    performanceMonitor.recordRequest(startTime, Date.now(), options.model || 'unknown', false, false);
    throw error;
  }
}

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

module.exports = {
  chat,
  getAICacheStats: () => aiCache.getStats(),
  getAIPerformanceReport: () => performanceMonitor.getReport(),
  getTunnelStatus: () => tunnelOptimizer.getTunnelStatus(),
  clearAICache: () => aiCache.clear(),
  resetAIPerformanceMetrics: () => performanceMonitor.resetMetrics()
};
