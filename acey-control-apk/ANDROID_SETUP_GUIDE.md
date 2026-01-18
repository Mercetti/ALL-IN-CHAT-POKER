# Android Development Setup Guide

## 📋 Environment Status

### ✅ Verified Components
- **Node.js**: v25.2.1 ✅
- **npm**: v11.6.2 ✅
- **Expo CLI**: v54.0.21 ✅
- **Project Dependencies**: Installed ✅

### ⚠️ Missing Components
- **Android SDK**: Not found in PATH
- **Android Studio**: Not detected
- **ADB (Android Debug Bridge)**: Not found

## 🔧 Setup Instructions

### 1. Install Android Studio
1. Download Android Studio from: https://developer.android.com/studio
2. Run the installer and follow the setup wizard
3. Install Android SDK (API Level 33 or higher)
4. Install Android SDK Build-Tools
5. Install Android SDK Platform-Tools

### 2. Configure Environment Variables
Add the following to your system PATH:
```
C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools
C:\Users\%USERNAME%\AppData\Local\Android\Sdk\tools
C:\Users\%USERNAME%\AppData\Local\Android\Sdk\tools\bin
```

### 3. Verify Installation
Open Command Prompt and run:
```bash
adb version
```

### 4. Create Android Virtual Device (AVD)
1. Open Android Studio
2. Go to Tools → AVD Manager
3. Create a new virtual device (Pixel 6 or similar)
4. Select API Level 33 or higher
5. Start the emulator

## 🚀 Building the APK

### Development Build
```bash
# Start development server
npm start

# Run on Android device/emulator
npm run android
```

### Production Build
```bash
# Build APK for distribution
npx expo build:android

# Build AAB for Google Play Store
npx expo build:android --type app-bundle
```

## 📱 Testing Options

### 1. Physical Device
- Enable Developer Options on Android device
- Enable USB Debugging
- Connect device via USB
- Run `npm run android`

### 2. Android Emulator
- Start AVD from Android Studio
- Run `npm run android`

### 3. Expo Go App
- Install Expo Go app on your phone
- Scan QR code from `npm start`

## 🔧 Common Issues & Solutions

### Issue: "adb command not found"
**Solution**: Add Android SDK platform-tools to PATH

### Issue: "Failed to install APK"
**Solution**: Enable "Install from unknown sources" on Android device

### Issue: "Metro bundler failed"
**Solution**: Clear cache: `npx expo start --clear`

### Issue: "Java not found"
**Solution**: Install JDK 17 or higher and set JAVA_HOME

## 📋 Project Configuration

### app.json Configuration
```json
{
  "expo": {
    "android": {
      "package": "com.merce.aceycontrol",
      "versionCode": 1,
      "compileSdkVersion": 33,
      "targetSdkVersion": 33,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
```

### Required Permissions
- Internet (for API calls)
- Network State (for connectivity)
- Biometric Authentication (if using biometric login)

## 🎯 Build Optimization

### 1. Bundle Size Optimization
```bash
# Analyze bundle size
npx expo optimize

# Enable Hermes engine
npx expo install react-native-hermes-engine
```

### 2. Performance Settings
```javascript
// app.json
{
  "android": {
    "jsEngine": "hermes",
    "enableHermes": true
  }
}
```

## 📱 Distribution

### Google Play Store
1. Create Google Play Developer account
2. Generate signed APK/AAB
3. Upload to Google Play Console
4. Complete store listing

### Direct Distribution
1. Build APK with `npx expo build:android`
2. Share APK file directly
3. Users enable "Install from unknown sources"

## 🔍 Troubleshooting

### Check Environment
```bash
# Run environment check
.\android-setup-check.bat
```

### Clear Cache
```bash
# Clear Expo cache
npx expo start --clear

# Clear npm cache
npm cache clean --force
```

### Reset Project
```bash
# Reset to clean state
rm -rf node_modules
npm install
npx expo start --clear
```

## 📞 Support Resources

- **Expo Documentation**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/docs/getting-started
- **Android Studio Docs**: https://developer.android.com/studio

---

**Status**: Ready for Android development once Android SDK is installed! 🚀
