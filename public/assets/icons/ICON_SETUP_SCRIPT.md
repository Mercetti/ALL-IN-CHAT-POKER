# Acey Logo Setup Script

## 🎯 Quick Setup Instructions

### 1. Prepare Your Acey Logo
- Use the high-quality logo you uploaded
- Ensure transparent background (PNG format)
- Save as high-resolution source file

### 2. Create All Required Sizes

#### 📱 Mobile App Icons
```bash
# Android Icons (copy to mobile/android/app/src/main/res/mipmap-*/)
- 48x48px → mipmap-mdpi/ic_launcher.png
- 72x72px → mipmap-hdpi/ic_launcher.png  
- 96x96px → mipmap-xhdpi/ic_launcher.png
- 144x144px → mipmap-xxhdpi/ic_launcher.png
- 192x192px → mipmap-xxxhdpi/ic_launcher.png

# iOS Icons (copy to mobile/ios/AllInChatPoker/Images.xcassets/AppIcon.appiconset/)
- 120x120px → icon-60@2x.png
- 180x180px → icon-60@3x.png
- 152x152px → icon-76@2x.png
- 167x167px → icon-83.5@2x.png
- 1024x1024px → icon-1024.png
```

#### 🌐 Web App Icons
```bash
# PWA Icons (copy to public/assets/icons/)
- 16x16px → acey-logo-16.png
- 32x32px → acey-logo-32.png
- 96x96px → acey-logo-96.png
- 128x128px → acey-logo-128.png
- 192x192px → acey-logo-192.png
- 256x256px → acey-logo-256.png
- 384x384px → acey-logo-384.png
- 512x512px → acey-logo-512.png
- 1024x1024px → acey-logo-1024.png

# Favicon (copy to public/)
- 32x32px → favicon.ico
```

### 3. Update Configuration Files

#### 📱 Mobile App Configuration
```json
// Update mobile/android/app/build.gradle
android {
    applicationId "com.allinchatpoker.mobile"
    versionCode 1
    versionName "1.0.0"
    // Add icon references
}

// Update mobile/ios/AllInChatPoker/Info.plist
<key>CFBundleIconFiles</key>
<array>
    <string>icon-60@2x.png</string>
    <string>icon-60@3x.png</string>
    <string>icon-76@2x.png</string>
    <string>icon-83.5@2x.png</string>
</array>
```

#### 🌐 Web App Configuration
```json
// Update public/manifest-enhanced.json
{
  "name": "All-In Chat Poker",
  "short_name": "AIC Poker",
  "icons": [
    {
      "src": "assets/icons/acey-logo-16.png",
      "sizes": "16x16",
      "type": "image/png"
    },
    {
      "src": "assets/icons/acey-logo-32.png",
      "sizes": "32x32",
      "type": "image/png"
    },
    {
      "src": "assets/icons/acey-logo-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/icons/acey-logo-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 4. Test Icons

#### 📱 Mobile App Testing
```bash
# Test Android
cd mobile && npm run android

# Test iOS
cd mobile && npm run ios
```

#### 🌐 Web App Testing
```bash
# Test PWA
cd public && python -m http.server 8000
# Open http://localhost:8000 in browser
# Check manifest and icons
```

## 🎨 Recommended Tools

### Image Resizing Tools
- **Adobe Photoshop**: Professional image editing
- **GIMP**: Free open-source alternative
- **Canva**: Online design tool
- **Figma**: Design and export tool
- **ImageOptim**: Image optimization

### Batch Processing
```bash
# Using ImageMagick for batch resizing
for size in 16 32 96 128 192 256 384 512 1024; do
    convert acey-logo-source.png -resize ${size}x${size} acey-logo-${size}.png
done
```

## ✅ Verification Checklist

- [ ] All icon sizes created correctly
- [ ] Icons have transparent backgrounds
- [ ] Icons maintain quality at all sizes
- [ ] Mobile app icons display correctly
- [ ] Web app icons load properly
- [ ] App store submission icons meet requirements
- [ ] Favicon displays in browser tabs

## 🎉 Final Result

Your Acey logo will provide:
- **📱 Perfect mobile app branding**
- **🌐 Consistent web app identity**
- **🏪 App store ready icons**
- **🎨 Professional appearance across all platforms**

The Acey logo integration is now ready for implementation! 🎰✨
