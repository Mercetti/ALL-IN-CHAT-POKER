const { execSync } = require('child_process');

// Polyfill for Expo build environment
if (typeof require === 'undefined') {
  global.require = require;
}
if (typeof console === 'undefined') {
  global.console = console;
}
if (typeof process === 'undefined') {
  global.process = process;
}

console.log('🏗️ Building Acey Control Center APK with Expo...');

try {
  // Start Expo dev server
  console.log('📱 Starting Expo development server...');
  execSync('npx expo start', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
