const Logger = require('./logger');
const config = require('./config');
const FreeAIManager = require('./free-ai-manager');
const fetch = global.fetch;

const logger = new Logger('ai');

// Initialize free AI manager
const freeAI = new FreeAIManager({
  preferredProvider: config.AI_PROVIDER || 'ollama',
  fallbackToRules: true,
  enableLocalModels: false
});

function assertProvider() {
  // Always available with free AI manager
  return freeAI.currentProvider?.name || 'rules';
}

async function chat(messages = [], options = {}) {
  // Context-aware model selection
  const selectedModel = selectModelForContext(messages, options);
  
  // Use free AI manager with selected model
  const aiOptions = {
    ...options,
    model: selectedModel
  };
  
  return await freeAI.chat(messages, aiOptions);
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
};
