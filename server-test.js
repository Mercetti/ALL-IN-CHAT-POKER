const express = require('express');
const { createAdminAILearningRoutes } = require('./server/routes/admin-ai-learning');

console.log('Starting minimal server test...');

const app = express();
const deps = {
  auth: { requireAdmin: (req, res, next) => next() },
  unifiedAI: {},
  sendMonitorAlert: () => {},
  performanceMonitor: {},
  logger: { info: () => {}, error: () => {} }
};

try {
  const result = createAdminAILearningRoutes(app, deps);
  console.log('✅ Function executed successfully');
  console.log('Server would start normally');
  process.exit(0);
} catch (error) {
  console.error('❌ Function failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
