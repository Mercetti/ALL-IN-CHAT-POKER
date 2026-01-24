/**
 * Diagnostic server to identify problematic module loading
 */

console.log('🔍 Starting diagnostic module loading...');

// Test basic Node.js modules first
console.log('✅ Testing basic modules...');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
console.log('✅ Basic Node.js modules loaded');

// Test Express
console.log('🔍 Loading Express...');
const express = require('express');
console.log('✅ Express loaded');

// Test each server module individually
const modulesToTest = [
  './server/config/env',
  './server/logger',
  './server/config',
  './server/db',
  './server/auth',
  './server/middleware',
  './server/startup',
  './server/connection-hardener'
];

for (const modulePath of modulesToTest) {
  try {
    console.log(`🔍 Loading ${modulePath}...`);
    const module = require(modulePath);
    console.log(`✅ ${modulePath} loaded`);
  } catch (error) {
    console.error(`❌ Failed to load ${modulePath}:`, error.message);
    process.exit(1);
  }
}

console.log('🎉 All core modules loaded successfully!');
console.log('🚀 Starting diagnostic server...');

const app = express();
app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Diagnostic server working' });
});

const PORT = 8081;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Diagnostic server running at http://${HOST}:${PORT}`);
});

console.log('🔍 Diagnostic server setup complete');
