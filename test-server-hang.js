/**
 * Simple test to check server startup progress
 */

console.log('🔍 Starting server startup test...');

// Add timeout to detect hanging
const timeout = setTimeout(() => {
  console.log('❌ SERVER HANGING - No progress after 10 seconds');
  process.exit(1);
}, 10000);

// Track startup progress
let progressCount = 0;

const originalLog = console.log;
console.log = function(...args) {
  progressCount++;
  originalLog(...args);
  
  if (progressCount > 50) {
    clearTimeout(timeout);
    console.log('✅ Server making good progress');
  }
};

console.log('📦 Loading server.js...');

try {
  require('./server.js');
  clearTimeout(timeout);
  console.log('✅ Server.js loaded successfully');
} catch (error) {
  clearTimeout(timeout);
  console.error('❌ Server.js failed to load:', error.message);
}
