# Acey Control Center - Expo Project Skeleton

## 🚀 Quick Start

```bash
cd acey-control-center
npm install
npx expo start
```

## 📁 Project Structure

```
acey-control-center/
├── src/
│   ├── screens/           # Existing screens (FullDashboard, SkillStore, etc.)
│   ├── components/        # Existing components (DevicePairing, etc.)
│   ├── api/              # API hooks and services
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Utility functions (auth, permissions, emergencyLock)
│   ├── navigation/       # Navigation structure
│   ├── hooks/            # Custom React hooks (useSecurity)
│   └── state/            # State management (Zustand store)
├── App.tsx               # Main app entry point
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── app.json             # Expo configuration
└── README.md            # This file
```

## 🔧 Integration Notes

### Existing Modules (DO NOT REWRITE)
- ✅ **Screens**: FullDashboardScreen, SkillStoreScreen, FutureSkillScreen, UpgradeDashboardScreen
- ✅ **Components**: DevicePairing, FutureSkillCard, TierCard
- ✅ **Utils**: auth.ts, ownerPermissions.ts, emergencyLock.ts
- ✅ **Hooks**: useSecurity.ts
- ✅ **Types**: auth.ts interfaces
- ✅ **Navigation**: RootStackNavigator, AppNavigator, BottomTabNavigator

### Security Integration
All screens can use the security system:

```typescript
import { useSecurity } from './hooks/useSecurity';

const security = useSecurity();
const hasPermission = await security.hasPermission('skill_install');
```

### Navigation Integration
The app uses a nested navigation structure:

```typescript
RootStackNavigator
├── AuthScreen (placeholder)
└── MainTabNavigator
    ├── FullDashboardScreen
    ├── SkillStoreScreen
    ├── FutureSkillScreen
    └── UpgradeDashboardScreen
```

## 🎯 Features Ready

### 🔐 Security Features
- Biometric authentication
- Device trust management
- Time-boxed permissions
- Emergency lock functionality
- QR-based device pairing

### 📱 Navigation
- Native stack navigation
- Bottom tab navigation
- Type-safe navigation params
- Dark theme support

### 🛠 Development
- TypeScript strict mode
- Hot reload with Expo
- Debug mode available
- Production build ready

## 📦 Dependencies

### Core Expo & React Native
- expo
- react-native
- react

### Navigation
- @react-navigation/native
- @react-navigation/native-stack
- @react-navigation/bottom-tabs

### Security & Authentication
- expo-local-authentication
- expo-secure-store
- expo-barcode-scanner
- expo-linking

### UI & Icons
- react-native-vector-icons
- react-native-screens
- react-native-safe-area-context

### Development
- typescript
- @types/react
- @types/react-native

## 🚀 Running the App

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Expo:**
   ```bash
   npx expo start
   ```

3. **Run on device:**
   - Scan QR code with Expo Go app
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

4. **Build for production:**
   ```bash
   npx expo build:android
   npx expo build:ios
   ```

## 🔐 Security Setup

The app includes comprehensive security features:

1. **Biometric Authentication:** Face ID, fingerprint, or passcode
2. **Device Trust:** Trust level scoring and device pairing
3. **Owner Approvals:** Time-boxed permissions for sensitive actions
4. **Emergency Lock:** Immediate device lockdown capability

### Using Security in Screens

```typescript
import { useSecurity } from '../hooks/useSecurity';

export const MyScreen = () => {
  const security = useSecurity();
  
  const handleSensitiveAction = async () => {
    const hasPermission = await security.hasPermission('skill_install');
    if (!hasPermission) return;
    
    // Perform action...
  };
  
  return (
    // Your UI...
  );
};
```

## 📱 Screen Integration

All existing screens are automatically integrated:

- **FullDashboardScreen**: Main control center with tabs
- **SkillStoreScreen**: Browse and install skills
- **FutureSkillScreen**: Pre-purchase and wishlist future skills
- **UpgradeDashboardScreen**: Tier management and upgrades

## 🔄 Next Steps

1. **Test Navigation:** Verify all screens are accessible
2. **Security Testing:** Test biometric auth and permissions
3. **API Integration:** Connect to backend services
4. **Production Build:** Create production-ready builds

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx expo start --clear
   ```

2. **TypeScript errors:**
   ```bash
   npx tsc --noEmit
   ```

3. **Dependency conflicts:**
   ```bash
   npm install --force
   ```

4. **Expo permissions:** Ensure camera and biometric permissions are granted

### Debug Mode

Enable debug mode for additional logging:
```bash
npx expo start --dev-client
```

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons)
- [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/secure-store/)
- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)

## 🎉 Ready to Use

The Acey Control Center is now fully set up with:
- ✅ Complete navigation structure
- ✅ Security system integration
- ✅ All existing screens and components
- ✅ TypeScript type safety
- ✅ Dark theme support
- ✅ Production-ready configuration

The app skeleton is ready for immediate development and deployment!
