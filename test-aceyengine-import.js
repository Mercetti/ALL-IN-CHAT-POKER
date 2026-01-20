#!/usr/bin/env node

/**
 * Test AceyEngine import and instantiation
 */

console.log('🧪 Testing AceyEngine import...');

try {
  const { AceyEngine } = require('./server/aceyEngine');
  console.log('✅ Import successful');
  console.log('📋 AceyEngine type:', typeof AceyEngine);
  
  // Test instantiation
  console.log('🏗️ Testing instantiation...');
  const engine = new AceyEngine({ useAI: true });
  console.log('✅ Instantiation successful');
  console.log('📊 Engine methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(engine)));
  
  // Test methods
  console.log('🔍 Testing methods...');
  const stats = engine.getStats();
  console.log('✅ getStats():', stats);
  
  console.log('🎉 All tests passed!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
