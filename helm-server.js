const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const HelmSmallLLMEngine = require('./helm-small-llm-engine');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize Helm Small LLM Engine
const helmEngine = new HelmSmallLLMEngine();

// CORS Middleware
app.use(cors({
  origin: ['http://localhost:8082', 'http://localhost:3000', 'http://127.0.0.1:8082', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
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

// Helm API Routes
app.get('/helm/status', (req, res) => {
  res.json(helmEngine.getStatus());
});

app.post('/helm/skill/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    const { params, sessionId } = req.body;
    
    const result = await helmEngine.executeSkill(skillId, params || {}, sessionId || 'default');
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/helm/audit', (req, res) => {
  res.json({
    logs: helmEngine.auditLog,
    total: helmEngine.auditLog.length
  });
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

// Initialize Helm and start server
async function startServer() {
  try {
    console.log('🚀 Initializing Helm Small LLM Engine...');
    await helmEngine.initialize();
    console.log('✅ Helm Small LLM Engine ready!');
    
    const PORT = process.env.PORT || 3001; // Use 3001 to avoid conflict with poker game
    server.listen(PORT, () => {
      console.log(`🚀 Helm Control Server running on port ${PORT}`);
      console.log(`📱 Access the Helm UI at: http://localhost:${PORT}/helm`);
      console.log(`🏠 Main site at: http://localhost:${PORT}`);
      console.log(`🤖 Small LLMs ready: TinyLlama, Phi, Qwen, DeepSeek-Coder`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize Helm:', error);
    process.exit(1);
  }
}

startServer();
