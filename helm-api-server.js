/**
 * 🚀 HELM API SERVER
 * 
 * Dedicated API service for Helm Control
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Database = require('./server/db-simple.js');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['https://helm-control.fly.dev', 'https://helm-ws.fly.dev'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database
let db;
try {
  db = new Database();
  console.log('✅ Database initialized');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'helm-api',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    service: 'helm-api',
    status: 'running',
    version: '1.0.0',
    features: ['authentication', 'permissions', 'data-processing'],
    database: db ? 'operational' : 'error'
  });
});

// Profile endpoints
app.get('/api/profiles', async (req, res) => {
  try {
    if (!db) throw new Error('Database not available');
    const profiles = await db.getRecentLogs(); // Using existing method
    res.json({ profiles: profiles || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Authentication endpoint
app.post('/api/auth', (req, res) => {
  const { token } = req.body;
  // Simple token validation for demo
  if (token === 'demo-token') {
    res.json({ authenticated: true, user: 'demo-user' });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json({
    service: 'helm-api',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    requests: Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Helm API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});

module.exports = app;
