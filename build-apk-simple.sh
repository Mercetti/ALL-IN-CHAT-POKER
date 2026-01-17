#!/bin/bash

echo "🏗️ Creating Simple React Native APK Build Script"
echo "=========================================="

# Navigate to mobile directory
cd mobile

# Try to create a simple APK using available tools
echo "📱 Attempting APK build..."

# Method 1: Try using React Native CLI directly
if [ -f "android/gradlew" ]; then
    echo "🔧 Found gradlew, attempting build..."
    cd android
    ./gradlew assembleDebug
    if [ $? -eq 0 ]; then
        echo "✅ APK built successfully!"
        echo "📍 Location: android/app/build/outputs/apk/debug/app-debug.apk"
        
        # Copy to dist directory
        mkdir -p ../../dist
        cp app/build/outputs/apk/debug/app-debug.apk ../../dist/acey-control-center.apk
        echo "📋 APK copied to dist/acey-control-center.apk"
        
        # Get file size
        SIZE=$(du -h ../../dist/acey-control-center.apk | cut -f1)
        echo "📊 File size: $SIZE"
    else
        echo "❌ Gradle build failed"
    fi
else
    echo "⚠️  No gradlew found - React Native project incomplete"
    echo "💡 Recommendation: Use Expo.dev for APK generation"
    echo "🌐 Visit: https://expo.dev"
    echo "📱 Upload project to Expo.dev for automatic APK building"
fi

echo "🎯 APK Build Process Complete!"
