const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️ Building Acey Control Center APK for Android...');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('android/app/build')) {
    execSync('rmdir /s /q android\\app\\build', { stdio: 'inherit' });
  }
  
  // Build APK
  console.log('📱 Building Android APK...');
  execSync('cd android && gradlew assembleDebug', { stdio: 'inherit' });
  
  // Check if APK was created
  const apkPath = 'android/app/build/outputs/apk/debug/app-debug.apk';
  if (fs.existsSync(apkPath)) {
    console.log('✅ APK built successfully!');
    console.log('📍 Location: ' + apkPath);
    console.log('📊 Size: ' + (fs.statSync(apkPath).size / 1024 / 1024).toFixed(2) + ' MB');
    
    // Create output directory
    const outputDir = 'dist';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    // Copy APK to output directory
    const outputApk = path.join(outputDir, 'acey-control-center.apk');
    fs.copyFileSync(apkPath, outputApk);
    console.log('📋 APK copied to: ' + outputApk);
    
  } else {
    console.error('❌ APK build failed - no APK file found');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
