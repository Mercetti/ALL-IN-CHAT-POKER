const { createAdminAILearningRoutes } = require('./server/routes/admin-ai-learning');
const express = require('express');

console.log('Testing function...');

const app = express();
const deps = {
  auth: {},
  unifiedAI: {},
  sendMonitorAlert: () => {},
  performanceMonitor: {},
  logger: { info: () => {}, error: () => {} }
};

try {
  const result = createAdminAILearningRoutes(app, deps);
  console.log('✅ Function executed successfully');
  console.log('Result type:', typeof result);
  process.exit(0);
} catch (error) {
  console.error('❌ Function failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
