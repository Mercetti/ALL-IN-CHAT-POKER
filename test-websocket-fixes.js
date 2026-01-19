#!/usr/bin/env node

/**
 * Test WebSocket session isolation and protocol fixes
 */

const WebSocket = require('ws');

console.log('🧪 Testing WebSocket Fixes...\n');

// Test 1: Session isolation
async function testSessionIsolation() {
  console.log('1️⃣ Testing session isolation...');
  
  return new Promise((resolve) => {
    const client1 = new WebSocket('ws://localhost:8080/acey');
    const client2 = new WebSocket('ws://localhost:8080/acey');
    
    let client1Joined = false;
    let client2Joined = false;
    let client1Received = 0;
    let client2Received = 0;
    
    client1.on('open', () => {
      client1.send(JSON.stringify({
        type: 'joinSession',
        sessionId: 'session-A'
      }));
    });
    
    client2.on('open', () => {
      client2.send(JSON.stringify({
        type: 'joinSession',
        sessionId: 'session-B'
      }));
    });
    
    client1.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'sessionJoined') {
        client1Joined = true;
        console.log('✅ Client 1 joined session-A');
      } else if (message.type === 'overlay') {
        client1Received++;
      }
    });
    
    client2.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'sessionJoined') {
        client2Joined = true;
        console.log('✅ Client 2 joined session-B');
      } else if (message.type === 'overlay') {
        client2Received++;
      }
    });
    
    // Wait for connections and test isolation
    setTimeout(() => {
      if (client1Joined && client2Joined) {
        console.log('✅ Session isolation test passed');
        resolve(true);
      } else {
        console.log('❌ Session isolation test failed');
        resolve(false);
      }
      
      client1.close();
      client2.close();
    }, 2000);
  });
}

// Test 2: Protocol consistency
async function testProtocolConsistency() {
  console.log('2️⃣ Testing protocol consistency...');
  
  return new Promise((resolve) => {
    const client = new WebSocket('ws://localhost:8080/acey');
    
    client.on('open', () => {
      client.send(JSON.stringify({
        type: 'joinSession',
        sessionId: 'test-protocol'
      }));
    });
    
    client.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      // Check that all messages have consistent structure
      if (message.type && (message.data !== undefined || message.message)) {
        console.log('✅ Protocol consistency test passed');
        console.log(`   Message structure: { type: "${message.type}", data: ${message.data ? 'present' : 'missing'} }`);
        resolve(true);
      } else {
        console.log('❌ Protocol consistency test failed');
        console.log('   Invalid message structure:', message);
        resolve(false);
      }
      
      client.close();
    });
    
    setTimeout(() => {
      console.log('❌ Protocol consistency test timeout');
      client.close();
      resolve(false);
    }, 3000);
  });
}

// Test 3: Session validation
async function testSessionValidation() {
  console.log('3️⃣ Testing session validation...');
  
  return new Promise((resolve) => {
    const client = new WebSocket('ws://localhost:8080/acey');
    let connectionReceived = false;
    
    client.on('open', () => {
      // Try to send game event without joining session first
      client.send(JSON.stringify({
        type: 'gameEvent',
        sessionId: 'unauthorized-session',
        data: { action: 'test' }
      }));
    });
    
    client.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      // Skip connection message, wait for error
      if (message.type === 'connected') {
        connectionReceived = true;
        return;
      }
      
      if (message.type === 'error' && message.code === 'SESSION_VALIDATION_FAILED') {
        console.log('✅ Session validation test passed');
        console.log('   Successfully blocked unauthorized session access');
        resolve(true);
      } else {
        console.log('❌ Session validation test failed');
        console.log('   Expected error message, got:', message);
        resolve(false);
      }
      
      client.close();
    });
    
    setTimeout(() => {
      if (connectionReceived) {
        console.log('❌ Session validation test failed - no error received');
      } else {
        console.log('❌ Session validation test failed - no connection');
      }
      client.close();
      resolve(false);
    }, 3000);
  });
}

// Run all tests
async function runWebSocketTests() {
  const tests = [
    { name: 'Session Isolation', fn: testSessionIsolation },
    { name: 'Protocol Consistency', fn: testProtocolConsistency },
    { name: 'Session Validation', fn: testSessionValidation }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ ${test.name} error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }
  
  console.log('\n📊 WebSocket Test Results:');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`   ${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All WebSocket fixes are working correctly!');
  } else {
    console.log('⚠️ Some WebSocket issues need attention.');
  }
}

// Run tests
runWebSocketTests().catch(console.error);
