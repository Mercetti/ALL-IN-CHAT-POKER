/**
 * 🚀 HELM WEBSOCKET SERVER
 * 
 * Dedicated WebSocket service for Helm Control
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8081;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['https://helm-control.fly.dev', 'https://helm-api.fly.dev'],
  credentials: true
}));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔌 WebSocket client connected');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Helm WebSocket Service',
    timestamp: new Date().toISOString()
  }));
  
  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received:', data);
      
      // Echo back for demo
      ws.send(JSON.stringify({
        type: 'echo',
        data: data,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Health check endpoint
app.get('/ws/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'helm-websocket',
    timestamp: new Date().toISOString(),
    connections: wss.clients.size
  });
});

// Status endpoint
app.get('/ws/status', (req, res) => {
  res.json({
    service: 'helm-websocket',
    status: 'running',
    version: '1.0.0',
    connections: wss.clients.size,
    uptime: process.uptime()
  });
});

// Broadcast function for real-time updates
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Simulate real-time updates
setInterval(() => {
  broadcast({
    type: 'system-update',
    data: {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      timestamp: new Date().toISOString()
    }
  });
}, 5000); // Every 5 seconds

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Helm WebSocket Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/ws/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
});

module.exports = { app, server, wss, broadcast };
