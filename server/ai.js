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
  // Use free AI manager - no OpenAI required!
  return await freeAI.chat(messages, options);
}

module.exports = {
  chat,
};
