# All-In Chat Poker Mobile App

## 📱 React Native Mobile Application

### 🎯 Overview

Professional streaming poker and blackjack game optimized for mobile devices with React Native.

### 🚀 Features

- **🎮 Poker & Blackjack Games**: Full game functionality
- **📱 Mobile-Optimized UI**: Touch gestures, responsive design
- **🏆 Tournaments**: Join and create tournaments
- **👥 Player Profiles**: Stats and customization
- **💬 Chat Integration**: Real-time chat functionality
- **🎨 UI Consistency**: Uses unified design system

### 🛠️ Tech Stack

- **React Native**: Cross-platform mobile framework
- **React Navigation**: Navigation and routing
- **Expo**: Development platform and build tools
- **TypeScript**: Type safety and better DX
- **Metro**: Fast bundler for React Native

### 📁 Project Structure

```
mobile/
├── src/
│   ├── App.js                 # Main app component
│   ├── components/           # Reusable UI components
│   ├── screens/              # Screen components
│   ├── styles/               # Styling and themes
│   ├── utils/                # Utility functions
│   ├── services/             # API and data services
│   └── hooks/                # Custom React hooks
├── package.json               # Dependencies and scripts
├── metro.config.js            # Metro bundler configuration
├── babel.config.js             # Babel configuration
├── index.js                 # App entry point
└── README.md                 # This file
```

### 🚀 Getting Started

#### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI
- React Native development environment

#### Installation

```bash
# Clone the repository
git clone https://github.com/merce/all-in-chat-poker.git
cd all-in-chat-poker-game/mobile

# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

#### Development Scripts

```bash
# Start development server
npm run start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### 📱 Platform-Specific Features

#### iOS Features

- Face ID / Touch ID authentication
- Apple Pay integration
- Push notifications with rich content
- Dynamic Island support (iOS 16+)
- Background app refresh
- Universal Links for deep linking

#### Android Features

- Biometric authentication (fingerprint, face)
- Google Pay integration
- Push notifications with channels
- App shortcuts and widgets
- Adaptive icons for different screen densities
- Picture-in-Picture support

### 🏪 App Store Submission

#### Google Play Store

- Target API level 30+
- Support for various screen sizes
- Content rating and privacy policy
- App signing and release management

#### Apple App Store

- iOS 13+ target
- App Store Connect integration
- TestFlight beta testing
- App privacy and data handling

### 🔧 Development Workflow

1. **Setup Development Environment**
   - Install React Native CLI
   - Configure Android Studio / Xcode
   - Set up simulators and devices

2. **Component Development**
   - Port existing web components to React Native
   - Implement mobile-specific gestures and interactions
   - Add platform-specific features

3. **Testing & QA**
   - Unit tests with Jest
   - Integration testing on devices
   - Performance optimization

4. **Build & Deploy**
   - Create production builds
   - Submit to app stores
   - Monitor performance and crashes

### 📚 Documentation

- Component documentation in `/src/components/`
- API documentation in `/src/services/`
- Style guide in `/src/styles/`
- Platform-specific guides

### 🤝 Contributing

1. Follow React Native and Expo best practices
2. Use TypeScript for type safety
3. Test on multiple devices
4. Follow the established design system
5. Submit pull requests for new features

---

**Status**: 🔄 Development in Progress
**Next**: Port existing mobile components and implement platform features
