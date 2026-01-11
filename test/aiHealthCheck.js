const { UnifiedAISystem } = require('../server/unified-ai');

async function testAIServices() {
  const ai = new UnifiedAISystem();
  const health = await ai.checkHealth();
  if (!health.ollama || !health.database) {
    throw new Error('AI services unhealthy: ' + JSON.stringify(health));
  }
}

module.exports = testAIServices;
