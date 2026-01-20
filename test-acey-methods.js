#!/usr/bin/env node

/**
 * Direct test of AceyEngine methods
 * Tests getStats() and healthCheck() methods directly
 */

const { AceyEngine, defaultInstance, getStats, healthCheck, getCurrentState, getPlayerInfo, updateOverlayConfig } = require('./server/aceyEngine');

console.log('🧪 Testing AceyEngine methods directly...');

async function testMethods() {
  try {
    // Test getStats()
    console.log('📊 Testing getStats()...');
    const stats = getStats();
    console.log('✅ getStats() result:', stats);
    
    // Test healthCheck()
    console.log('🏥 Testing healthCheck()...');
    const health = await healthCheck();
    console.log('✅ healthCheck() result:', health);
    
    // Test getCurrentState()
    console.log('📋 Testing getCurrentState()...');
    const state = getCurrentState();
    console.log('✅ getCurrentState() result:', state);
    
    // Test getPlayerInfo()
    console.log('👤 Testing getPlayerInfo()...');
    const playerInfo = defaultInstance.getPlayerInfo('test-player');
    console.log('✅ getPlayerInfo() result:', playerInfo);
    
    // Test updateOverlayConfig()
    console.log('⚙️ Testing updateOverlayConfig()...');
    const config = defaultInstance.updateOverlayConfig({ theme: 'dark' });
    console.log('✅ updateOverlayConfig() result:', config);
    
    console.log('🎉 All methods are working correctly!');
    return true;
    
  } catch (error) {
    console.error('❌ Method test failed:', error.message);
    return false;
  }
}

// Run the test
testMethods().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test script failed:', error.message);
  process.exit(1);
});
