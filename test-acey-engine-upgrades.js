#!/usr/bin/env node

/**
 * Test AceyEngine API upgrades
 */

const AceyEngine = require('./server/aceyEngine');

// Debug: Check available methods
console.log('AceyEngine methods:', Object.getOwnPropertyNames(AceyEngine.prototype));

console.log('🧪 Testing AceyEngine API Upgrades...\n');

// Test 1: Basic functionality
async function testBasicFunctionality() {
  console.log('1️⃣ Testing basic functionality...');
  
  const engine = new AceyEngine({ useAI: true });
  
  // Test session creation
  const session = engine.getSession('test-session');
  
  // Test chat message
  engine.addChatMessage({
    sessionId: 'test-session',
    text: 'Hello from test',
    from: 'test-player'
  });
  
  // Test game event
  engine.processEvent('test-session', {
    type: 'win',
    player: 'test-player',
    winnings: 100
  });
  
  const hasSession = engine.sessions.has('test-session');
  const hasChat = session.chat.length > 0;
  const hasEvent = session.events.length > 0;
  
  if (hasSession && hasChat && hasEvent) {
    console.log('✅ Basic functionality test passed');
    return { engine, success: true };
  } else {
    console.log('❌ Basic functionality test failed');
    return { engine, success: false };
  }
}

// Test 2: New API methods
async function testNewAPIMethods(engine) {
  console.log('2️⃣ Testing new API methods...');
  
  try {
    // Test getCurrentState
    const currentState = engine.getCurrentState();
    const hasState = currentState && currentState.sessions && currentState.sessions['test-session'];
    
    // Test getPlayerInfo
    const playerInfo = engine.getPlayerInfo('test-player');
    const hasPlayerInfo = playerInfo && playerInfo.playerId === 'test-player';
    
    // Test updateOverlayConfig
    const config = engine.updateOverlayConfig({ theme: 'dark' });
    const hasConfig = config && config.theme === 'dark';
    
    // Test getStats
    const stats = engine.getStats();
    const hasStats = stats && stats.totalSessions > 0;
    
    // Test getSessionStats
    const sessionStats = engine.getSessionStats('test-session');
    const hasSessionStats = sessionStats && sessionStats.sessionId === 'test-session';
    
    // Test getAllSessionStats
    const allStats = engine.getAllSessionStats();
    const hasAllStats = allStats && allStats['test-session'];
    
    // Test healthCheck
    const health = await engine.healthCheck();
    const hasHealth = health && health.status === 'healthy';
    
    if (hasState && hasPlayerInfo && hasConfig && hasStats && hasSessionStats && hasAllStats && hasHealth) {
      console.log('✅ New API methods test passed');
      console.log('   All new methods are working correctly');
      return true;
    } else {
      console.log('❌ New API methods test failed');
      console.log('   Missing methods:', {
        getCurrentState: hasState,
        getPlayerInfo: hasPlayerInfo,
        updateOverlayConfig: hasConfig,
        getStats: hasStats,
        getSessionStats: hasSessionStats,
        getAllSessionStats: hasAllStats,
        healthCheck: hasHealth
      });
      return false;
    }
  } catch (error) {
    console.log('❌ New API methods test failed with error:', error.message);
    return false;
  }
}

// Test 3: Enhanced WebSocket compatibility
async function testEnhancedCompatibility(engine) {
  console.log('3️⃣ Testing enhanced WebSocket compatibility...');
  
  try {
    // Simulate enhanced WebSocket calls
    const state = await engine.getCurrentState();
    const playerInfo = await engine.getPlayerInfo('test-player');
    const config = await engine.updateOverlayConfig({ showCards: true });
    const stats = engine.getStats();
    const health = await engine.healthCheck();
    
    const hasRequiredMethods = 
      typeof engine.getCurrentState === 'function' &&
      typeof engine.getPlayerInfo === 'function' &&
      typeof engine.updateOverlayConfig === 'function' &&
      typeof engine.getStats === 'function' &&
      typeof engine.healthCheck === 'function';
    
    const hasValidResponses = 
      state && state.sessions &&
      playerInfo && playerInfo.playerId &&
      config && config.showCards &&
      stats && stats.totalSessions >= 0 &&
      health && health.status;
    
    if (hasRequiredMethods && hasValidResponses) {
      console.log('✅ Enhanced WebSocket compatibility test passed');
      console.log('   All required methods available and returning valid data');
      return true;
    } else {
      console.log('❌ Enhanced WebSocket compatibility test failed');
      console.log('   Methods available:', hasRequiredMethods);
      console.log('   Valid responses:', hasValidResponses);
      return false;
    }
  } catch (error) {
    console.log('❌ Enhanced WebSocket compatibility test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAceyEngineTests() {
  const tests = [
    { name: 'Basic Functionality', fn: testBasicFunctionality },
    { name: 'New API Methods', fn: testNewAPIMethods },
    { name: 'Enhanced WebSocket Compatibility', fn: testEnhancedCompatibility }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      let result;
      if (test.name === 'Basic Functionality') {
        result = await test.fn();
        // Pass engine to next tests
        if (result.success) {
          results.push({ name: test.name, passed: true });
          // Continue with engine for other tests
          const apiResult = await testNewAPIMethods(result.engine);
          results.push({ name: 'New API Methods', passed: apiResult });
          const compatResult = await testEnhancedCompatibility(result.engine);
          results.push({ name: 'Enhanced WebSocket Compatibility', passed: compatResult });
          break;
        }
      } else {
        result = await test.fn();
        results.push({ name: test.name, passed: result });
      }
    } catch (error) {
      console.log(`❌ ${test.name} error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }
  
  console.log('\n📊 AceyEngine Test Results:');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`   ${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 AceyEngine API upgrades successful!');
    console.log('\n🔧 Upgraded Features:');
    console.log('   ✅ State Management: getCurrentState() returns complete session data');
    console.log('   ✅ Player Tracking: getPlayerInfo() provides detailed player stats');
    console.log('   ✅ Configuration: updateOverlayConfig() manages overlay settings');
    console.log('   ✅ Statistics: getStats() provides engine metrics');
    console.log('   ✅ Health Monitoring: healthCheck() ensures system status');
    console.log('   ✅ Session Analytics: getSessionStats() tracks individual sessions');
    console.log('\n🚀 Enhanced WebSocket can now be activated!');
  } else {
    console.log('⚠️ Some AceyEngine upgrades need attention.');
  }
}

// Run tests
runAceyEngineTests().catch(console.error);
