/**
 * Better diagnostic to find the hanging issue
 */

console.log('🔍 Starting server diagnostic...');

// Track the first few lines of output to see where it gets stuck
const outputLines = [];
const maxLines = 100;

const originalLog = console.log;
console.log = function(...args) {
  const line = args.join(' ');
  outputLines.push(line);
  
  if (outputLines.length <= maxLines) {
    originalLog(...args);
  }
  
  // If we see database initialization, that's where the issue likely is
  if (line.includes('Database initialization failed')) {
    originalLog('❌ FOUND THE ISSUE: Database initialization failed');
    originalLog('Last 10 lines before error:');
    outputLines.slice(-10).forEach((l, i) => originalLog(`${i+1}. ${l}`));
    process.exit(1);
  }
};

// Add timeout to detect hanging
setTimeout(() => {
  originalLog('❌ SERVER HANGING - Last 20 lines:');
  outputLines.slice(-20).forEach((l, i) => originalLog(`${i+1}. ${l}`));
  process.exit(1);
}, 15000);

try {
  require('./server.js');
  originalLog('✅ Server loaded successfully');
} catch (error) {
  originalLog('❌ Server failed:', error.message);
  originalLog('Last 10 lines before error:');
  outputLines.slice(-10).forEach((l, i) => originalLog(`${i+1}. ${l}`));
}
