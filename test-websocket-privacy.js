#!/usr/bin/env node

/**
 * Test WebSocket privacy and session isolation
 */

const WebSocket = require('ws');

console.log('🧪 Testing WebSocket Session Isolation...\n');

async function testSessionIsolation() {
  console.log('1️⃣ Testing session isolation...');
  
  const clients = [];
  const messages = [];
  
  // Connect 3 clients to different sessions
  for (let i = 0; i < 3; i++) {
    const ws = new WebSocket('ws://localhost:8080/acey');
    const sessionId = `session-${i}`;
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'joinSession',
        sessionId
      }));
    });
    
    ws.on('message', (data) => {
      messages.push({
        client: i,
        sessionId,
        data: JSON.parse(data)
      });
    });
    
    clients.push({ ws, sessionId, id: i });
  }
  
  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send game event to session 0 only
  clients[0].ws.send(JSON.stringify({
    type: 'gameEvent',
    sessionId: 'session-0',
    data: { type: 'win', player: 'player1', cards: ['A♠', 'K♠'] }
  }));
  
  // Wait for message processing
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check isolation
  const session0Messages = messages.filter(m => m.sessionId === 'session-0');
  const session1Messages = messages.filter(m => m.sessionId === 'session-1');
  
  // Session 0 should have: connected, sessionJoined, overlay (game event)
  // Session 1 should have: connected, sessionJoined (no game event)
  const session0HasGameEvent = session0Messages.some(m => m.data.type === 'overlay');
  const session1HasGameEvent = session1Messages.some(m => m.data.type === 'overlay');
  
  const isIsolated = 
    session0HasGameEvent && // Session 0 got the game event
    !session1HasGameEvent; // Session 1 didn't get the game event
  
  // Close all connections
  clients.forEach(c => c.ws.close());
  
  return isIsolated;
}

async function testSessionValidation() {
  console.log('2️⃣ Testing session validation...');
  
  const ws = new WebSocket('ws://localhost:8080/acey');
  let validationFailed = false;
  
  ws.on('open', () => {
    // Join session-0
    ws.send(JSON.stringify({
      type: 'joinSession',
      sessionId: 'session-0'
    }));
    
    // Try to send event to session-1 (not ours)
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'gameEvent',
        sessionId: 'session-1', // Wrong session
        data: { type: 'cheat', player: 'hacker' }
      }));
    }, 100);
  });
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'error' && msg.code === 'SESSION_VALIDATION_FAILED') {
      validationFailed = true;
    }
  });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  ws.close();
  
  return validationFailed;
}

async function runWebSocketTests() {
  console.log('🔗 Connecting to WebSocket server...\n');
  
  try {
    const isolationTest = await testSessionIsolation();
    const validationTest = await testSessionValidation();
    
    console.log('\n📊 WebSocket Test Results:');
    console.log(`   ${isolationTest ? '✅' : '❌'} Session Isolation`);
    console.log(`   ${validationTest ? '✅' : '❌'} Session Validation`);
    
    const passed = [isolationTest, validationTest].filter(Boolean).length;
    const total = 2;
    
    console.log(`\n🎯 Summary: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 WebSocket privacy fixes successful!');
      console.log('\n🛡️ Security Features:');
      console.log('   ✅ Session Isolation: Messages only go to intended session');
      console.log('   ✅ Session Validation: Prevents session injection attacks');
      console.log('   ✅ Privacy Protection: No cross-session data leakage');
    } else {
      console.log('⚠️ Some WebSocket issues need attention.');
    }
  } catch (error) {
    console.log('❌ WebSocket test failed:', error.message);
  }
}

runWebSocketTests().catch(console.error);
