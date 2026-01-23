/**
 * Minimal test server to isolate startup issues
 */

const express = require('express');
const app = express();

console.log('🔍 Starting minimal test server...');

// Basic middleware
app.use(express.json());

// Simple route
app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal server working' });
});

const PORT = 8080;
const HOST = '0.0.0.0';

console.log(`🚀 Starting minimal server on ${HOST}:${PORT}`);

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Minimal server running at http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down minimal server...');
  server.close(() => {
    console.log('✅ Minimal server stopped');
    process.exit(0);
  });
});

console.log('🔍 Minimal test server setup complete');
