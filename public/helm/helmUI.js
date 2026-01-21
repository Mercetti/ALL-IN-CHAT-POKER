/**
 * Helm UI JavaScript
 * Frontend interface for Helm WebSocket communication
 */

// Connect to Helm WebSocket server
const socket = io();

function log(message) {
  const output = document.getElementById('output');
  if (output) {
    output.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${message}</div>`;
  }
}

function sendChat(tone) {
  const messages = {
    professional: "I'm here to help with professional assistance and guidance.",
    casual: "Hey! How can I help you today?",
    acey: "Hello! I'm Acey, your AI control assistant. What can I help you with?"
  };
  
  socket.emit('chat', {
    type: 'chat',
    content: messages[tone] || messages['acey'],
    persona: tone || 'acey',
    timestamp: Date.now()
  });
  
  log(`Sent ${tone} chat: ${messages[tone] || messages['acey']}`);
}

function simulateWin() {
  socket.emit('game_event', {
    type: 'game_event',
    event: { action: 'win', player: 'tester', amount: 100 },
    channel: 'test-channel',
    timestamp: Date.now()
  });
  log('Simulated win event');
}

function simulateLoss() {
  socket.emit('game_event', {
    type: 'game_event',
    event: { action: 'lose', player: 'tester', amount: 50 },
    channel: 'test-channel',
    timestamp: Date.now()
  });
  log('Simulated loss event');
}

function testTTS() {
  // This will use the Helm engine's TTS functionality
  socket.emit('chat', {
    type: 'helm_request',
    request: {
      id: `tts-${Date.now()}`,
      userId: 'tester',
      persona: 'acey',
      message: 'Please say this text out loud: Testing Helm text to speech functionality',
      timestamp: Date.now(),
      context: { action: 'tts_test' }
    }
  });
  log('Requested TTS from Helm engine');
}

function switchPersona(persona) {
  socket.emit('chat', {
    type: 'persona_switch',
    persona: persona,
    timestamp: Date.now()
  });
  log(`Switched to ${persona} persona`);
}

function getStatus() {
  socket.emit('chat', {
    type: 'status',
    timestamp: Date.now()
  });
  log('Requested status from Helm engine');
}

// Listen for Helm responses
socket.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    log(`Helm: ${message.content || message.message || JSON.stringify(message)}`);
  } catch (error) {
    log(`Helm: ${data}`);
  }
});

// Listen for game events
socket.on('game_event', (data) => {
  log(`Game Event: ${JSON.stringify(data)}`);
});

// Listen for system status
socket.on('system_status', (data) => {
  log(`System Status: ${JSON.stringify(data)}`);
});

// Connection status
socket.on('connect', () => {
  log('Connected to Helm WebSocket server');
});

socket.on('disconnect', () => {
  log('Disconnected from Helm WebSocket server');
});

socket.on('connect_error', (error) => {
  log(`Connection error: ${error.message}`);
});

// Export functions for external use
window.HelmUI = {
  sendChat,
  simulateWin,
  simulateLoss,
  testTTS,
  switchPersona,
  getStatus,
  socket
};
