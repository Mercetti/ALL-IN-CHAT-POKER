#!/usr/bin/env node

/**
 * Debug WebSocket session isolation
 */

const WebSocket = require('ws');

console.log('🔍 Debugging WebSocket Session Isolation...\n');

async function debugSessionIsolation() {
  const clients = [];
  const messages = [];
  
  // Connect 2 clients to different sessions
  for (let i = 0; i < 2; i++) {
    const ws = new WebSocket('ws://localhost:8080/acey');
    const sessionId = `session-${i}`;
    
    ws.on('open', () => {
      console.log(`Client ${i} connected, joining session ${sessionId}`);
      ws.send(JSON.stringify({
        type: 'joinSession',
        sessionId
      }));
    });
    
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      console.log(`Client ${i} received:`, msg);
      messages.push({
        client: i,
        sessionId,
        data: msg
      });
    });
    
    ws.on('error', (error) => {
      console.log(`Client ${i} error:`, error.message);
    });
    
    ws.on('close', () => {
      console.log(`Client ${i} disconnected`);
    });
    
    clients.push({ ws, sessionId, id: i });
  }
  
  // Wait for connections and session joins
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\nSending game event to session-0 only...');
  
  // Send game event to session 0 only
  clients[0].ws.send(JSON.stringify({
    type: 'gameEvent',
    sessionId: 'session-0',
    data: { type: 'win', player: 'player1', cards: ['A♠', 'K♠'] }
  }));
  
  // Wait for message processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\nMessage analysis:');
  console.log('Total messages received:', messages.length);
  
  messages.forEach(msg => {
    console.log(`Client ${msg.client} (${msg.sessionId}):`, msg.data.type);
  });
  
  // Check isolation
  const session0Messages = messages.filter(m => m.sessionId === 'session-0');
  const session1Messages = messages.filter(m => m.sessionId === 'session-1');
  
  console.log('\nSession 0 messages:', session0Messages.length);
  console.log('Session 1 messages:', session1Messages.length);
  
  const isIsolated = 
    session0Messages.length > 0 && // Session 0 got the message
    session1Messages.length === 0; // Session 1 didn't get it
  
  console.log('Isolation test:', isIsolated ? 'PASSED' : 'FAILED');
  
  // Close all connections
  clients.forEach(c => c.ws.close());
  
  return isIsolated;
}

debugSessionIsolation().catch(console.error);
