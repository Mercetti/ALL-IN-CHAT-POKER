const { execSync } = require('child_process');

console.log('🏗️ Building Acey Control Center APK with Expo...');

try {
  // Start Expo dev server
  console.log('📱 Starting Expo development server...');
  execSync('npx expo start --web', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
