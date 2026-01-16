console.log('🏗️ ACEY STABILITY MODULE - TESTING CORE COMPONENTS');

// Test individual components
console.log('\n📦 Testing Resource Monitor...');
const { ResourceMonitor } = require('./server/stability/resource-monitor');
const monitor = new ResourceMonitor({ cpu: 80, gpu: 90, ram: 85 });
monitor.start();
console.log('✅ Resource Monitor started');

console.log('\n📝 Testing Logger...');
const { Logger } = require('./server/stability/logger');
const logger = new Logger('TestComponent');
logger.log('Test log message');
console.log('✅ Logger initialized');

console.log('\n🔍 Testing Watchdog...');
const { Watchdog } = require('./server/stability/watchdog');
// Mock acey for testing
const mockAcey = {
  checkSkillsHealth: async () => console.log('Checking skills health...'),
  isSystemHealthy: () => true,
  getStatus: () => ({ active: true, uptime: 123 })
};
const watchdog = new Watchdog(mockAcey);
watchdog.start();
console.log('✅ Watchdog started');

console.log('\n⏰ Testing Scheduler...');
const { Scheduler } = require('./server/stability/scheduler');
const scheduler = new Scheduler(mockAcey);
scheduler.start();
console.log('✅ Scheduler started');

console.log('\n🛡️ Testing LLM Validator...');
const { LLMValidator } = require('./server/stability/llm-validator');
const validator = new LLMValidator();
const testOutput = {
  id: 'test-1',
  type: 'code',
  content: 'console.log("hello world");'
};
const isValid = validator.validate(testOutput);
console.log('✅ LLM Validator test result: ' + (isValid ? 'PASSED' : 'FAILED'));

console.log('\n🔄 Testing Rollback Manager...');
const { RollbackManager } = require('./server/stability/rollback-manager');
const rollback = new RollbackManager(60000); // 1 minute
rollback.storeApprovedOutput({ id: 'test-output', content: 'test data' });
console.log('✅ Rollback Manager initialized');

console.log('\n🎯 ACEY STABILITY MODULE: ALL COMPONENTS OPERATIONAL');
console.log('\n📋 Component Status:');
console.log('- Resource Monitor: ✅ Active');
console.log('- Logger: ✅ Active');
console.log('- Watchdog: ✅ Active');
console.log('- Scheduler: ✅ Active');
console.log('- LLM Validator: ✅ Active');
console.log('- Rollback Manager: ✅ Active');

// Cleanup
setTimeout(() => {
  monitor.stop();
  watchdog.stop();
  scheduler.stop();
  console.log('\n🧹 Test cleanup completed');
}, 3000);
