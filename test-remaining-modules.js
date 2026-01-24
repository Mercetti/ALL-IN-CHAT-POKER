/**
 * Test remaining modules from server.js
 */

console.log('🔍 Testing remaining server.js modules...');

// Test the remaining modules from server.js
const remainingModules = [
  './server/payout-store',
  './server/utils/performance-monitor',
  './server/routes/admin-ai-control',
  './server/routes/admin-ai-control-simple',
  './server/routes/admin-ai-learning',
  './server/routes/admin',
  './server/routes/auth',
  './server/stability/founder-assistant',
  './server/stability/replay-engine',
  './server/stability/cognitive-throttling',
  './server/stability/mobile-api-controller',
  './server/financial/financial-integration',
  './server/acey-service-controller',
  './server/routes/public',
  './server/routes/logging',
  './server/routes/dataset.js',
  './server/routes/simulation.js'
];

for (const modulePath of remainingModules) {
  try {
    console.log(`📦 Loading ${modulePath}...`);
    const startTime = Date.now();
    const module = require(modulePath);
    const loadTime = Date.now() - startTime;
    console.log(`✅ ${modulePath} loaded (${loadTime}ms)`);
  } catch (error) {
    console.error(`❌ Failed to load ${modulePath}:`, error.message);
    process.exit(1);
  }
}

console.log('\n🎉 All remaining modules loaded successfully!');
console.log('🚀 All server.js modules can load individually');
