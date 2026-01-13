#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting AI Control Center Development Environment...\n');

// Start the AI Control Center server
const serverProcess = spawn('node', ['dist/server/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`\n📋 Server process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down AI Control Center...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down AI Control Center...');
  serverProcess.kill('SIGTERM');
});

console.log('✅ AI Control Center server starting...');
console.log('📊 Dashboard will be available at: http://localhost:3001');
console.log('🔧 Use Ctrl+C to stop the server\n');
