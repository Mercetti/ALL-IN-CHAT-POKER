#!/bin/bash

# Acey Control Center - Play Store Deployment Script
# This script builds and prepares the app for Play Store submission

echo "🚀 Starting Acey Control Center Play Store Deployment..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Login to Expo (if not already logged in)
echo "🔐 Checking Expo login..."
eas whoami || {
    echo "Please login to Expo:"
    eas login
}

# Build for Android production
echo "🔨 Building Android APK for Play Store..."
eas build --platform android --profile production

echo "✅ Build complete!"
echo ""
echo "📱 Next Steps:"
echo "1. Download the APK from the link above"
echo "2. Test the APK thoroughly"
echo "3. Upload to Google Play Console"
echo "4. Complete store listing and publish"
echo ""
echo "🔗 Google Play Console: https://play.google.com/console"
