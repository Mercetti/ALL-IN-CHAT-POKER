const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/socket.io', express.static(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist')));

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helm route
app.get('/helm', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'helm', 'index.html'));
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected to Helm WebSocket');
  
  socket.on('chat', (data) => {
    console.log('Chat received:', data);
    // Echo back or process chat
    socket.emit('chat_response', {
      content: `Helm processed: ${data.content}`,
      persona: data.persona,
      timestamp: Date.now()
    });
  });
  
  socket.on('game_event', (data) => {
    console.log('Game event received:', data);
    // Process game events
    socket.emit('system_status', {
      event: 'processed',
      data: data,
      timestamp: Date.now()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Helm Control Server running on port ${PORT}`);
  console.log(`📱 Access the Helm UI at: http://localhost:${PORT}/helm`);
  console.log(`🏠 Main site at: http://localhost:${PORT}`);
});
