#!/usr/bin/env node

const { AceyBridge } = require('./dist/server/aceyBridge');

async function testIntegration() {
  console.log('🧪 Starting AI Control Center Integration Test...\n');

  // Create bridge instance
  const bridge = new AceyBridge({
    controlCenterUrl: 'http://localhost:3001',
    aceySystemUrl: 'http://localhost:8080', // Your existing Acey system
    autoRulesEnabled: true,
    dryRunMode: false
  });

  try {
    // Connect the bridge
    await bridge.connect();
    
    // Wait for connections
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send test data
    console.log('📤 Sending test data through bridge...');
    bridge.sendTestData({
      speech: "All-in! This is an amazing test from the integration bridge!",
      intents: [
        {
          type: "memory_proposal",
          scope: "event",
          summary: "Integration test all-in moment",
          confidence: 0.9,
          ttl: "1h"
        },
        {
          type: "trust_signal",
          delta: 0.1,
          reason: "Integration test positive engagement",
          reversible: true
        }
      ]
    });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get status
    const status = bridge.getStatus();
    console.log('\n📊 Bridge Status:', status);
    
    console.log('\n✅ Integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  } finally {
    // Clean up
    bridge.disconnect();
    process.exit(0);
  }
}

// Run the test
testIntegration();
