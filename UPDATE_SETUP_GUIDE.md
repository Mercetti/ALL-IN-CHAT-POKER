# 🚀 Direct Update System Setup Guide

## Overview
This system enables over-the-air updates for your Acey Control Center app without using the Google Play Store, saving you the $25 developer fee.

## 📋 What You'll Need

1. **Server hosting** (your existing server works)
2. **APK files** from your builds
3. **Update checker integration** in your app

## 🛠️ Setup Instructions

### Step 1: Install Update Server Dependencies

```bash
cd server
npm install multer
```

### Step 2: Start the Update Server

```bash
node server/update-server.js
```

The server will run on `http://localhost:3001` by default.

### Step 3: Access Admin Interface

Open `http://localhost:3001/admin` in your browser to:
- Upload new APK versions
- Manage update information
- View download statistics

### Step 4: Integrate Update Checker in Your App

1. **Add UpdateChecker to your app:**
   ```javascript
   import UpdateChecker from './src/utils/UpdateChecker';
   ```

2. **Initialize in your main component:**
   ```javascript
   const updateChecker = new UpdateChecker('http://your-server.com:3001');
   ```

3. **Check for updates on app start:**
   ```javascript
   useEffect(() => {
     updateChecker.checkForUpdates();
   }, []);
   ```

### Step 5: Build and Upload Updates

1. **Build your APK:**
   ```bash
   cd acey-control-center
   eas build --platform android --profile production
   ```

2. **Upload via admin interface:**
   - Visit `http://localhost:3001/admin`
   - Fill in version, release notes, upload APK
   - Mark as mandatory if needed

## 🔄 How It Works

### For Users
1. App automatically checks for updates daily
2. Shows update dialog when new version is available
3. User can download and install APK directly
4. No Play Store required

### For Developers
1. Build APK using EAS Build
2. Upload to your update server
3. Users get notified automatically
4. Full control over distribution

## 📱 User Experience

### Automatic Updates
- ✅ Checks daily in background
- ✅ Shows non-intrusive update dialogs
- ✅ Option to skip non-mandatory updates
- ✅ Mandatory updates for critical fixes

### Manual Updates
- ✅ "Check for Updates" button
- ✅ Current version display
- ✅ Update history tracking

## 🔧 Configuration Options

### Update Server URL
Change the server URL in your app:
```javascript
const updateChecker = new UpdateChecker('https://your-domain.com:3001');
```

### Update Frequency
Default: Once per day (rate limited)
Override with `updateChecker.checkForUpdates(true)` for immediate check.

### Mandatory Updates
Mark updates as mandatory in the admin interface to force installation.

## 🛡️ Security Features

### Version Validation
- Automatic version comparison
- Prevents downgrade attacks
- Validates version format

### Rate Limiting
- Prevents excessive server requests
- Daily check limit
- Manual check override available

### Skip Management
- Users can skip non-mandatory updates
- Skipped versions remembered
- Mandatory updates cannot be skipped

## 📊 Admin Features

### Upload Management
- Drag-and-drop APK upload
- Version information entry
- Release notes management
- Mandatory update flag

### Version Tracking
- Current version display
- Update history
- Download statistics
- File management

### API Endpoints
- `/api/version` - Get latest version info
- `/api/download/:filename` - Download APK
- `/api/updates` - List all updates
- `/api/upload` - Upload new update

## 🚀 Deployment Options

### Local Development
```bash
node server/update-server.js
```

### Production Deployment
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start server/update-server.js --name "update-server"

# Or use systemd
sudo systemctl enable update-server
sudo systemctl start update-server
```

### Cloud Deployment
Deploy to any Node.js hosting:
- Heroku
- DigitalOcean
- AWS EC2
- Your existing server

## 🔍 Troubleshooting

### Common Issues

**Update not showing:**
- Check server is running
- Verify APK uploaded correctly
- Check version numbers (must be higher)

**Download failing:**
- Check file permissions
- Verify server URL in app
- Check network connectivity

**Version comparison issues:**
- Use semantic versioning (1.2.3 format)
- Ensure version string format consistency
- Check for leading/trailing spaces

### Debug Mode
Enable console logging in UpdateChecker.js by uncommenting console.log statements.

## 📈 Advanced Features

### Custom Update UI
Replace the default Alert dialog with custom UI components.

### Background Downloads
Implement background download using React Native's FileSystem module.

### Update Analytics
Track update adoption rates and user behavior.

### A/B Testing
Serve different APK versions to different user groups.

## 💡 Tips

1. **Version Management**: Use semantic versioning (major.minor.patch)
2. **Release Notes**: Always include clear release notes
3. **Testing**: Test updates on beta devices first
4. **Backup**: Keep previous APK versions available
5. **Monitoring**: Monitor server logs for download issues

## 🔄 Alternative: EAS Update

For JavaScript-only changes, you can use EAS Update:
```bash
eas update --branch production
```

This is faster and doesn't require APK downloads, but only works for non-native changes.

## 📞 Support

If you encounter issues:
1. Check server logs
2. Verify network connectivity
3. Test with different APK versions
4. Review version format consistency

---

**Result**: You now have a complete Play Store-free update system that saves you $25 and gives you full control over app distribution! 🎉
