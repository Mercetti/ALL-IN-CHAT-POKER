# 📱 Acey Control Center - Mobile App

Secure mobile governance console for the Acey AI system. Provides read-only visibility and controlled approval capabilities for AI operations.

## 🎯 Purpose

The Acey Control Center mobile app serves as a **governance console, not a controller**. It allows authorized users to:

- **Monitor** system status and health in real-time
- **Approve** or **reject** pending AI actions
- **View** logs and audit trails
- **Send** intent-based commands (with approval requirements)
- **Receive** critical notifications

## 🏗️ Architecture

```
Mobile App (Expo) → API Gateway → Backend Services → Acey AI
     ↓                    ↓              ↓            ↓
  Local Cache        Auth Layer    Business Logic   LLM Core
  Offline Mode       Permission    Approval Queue  Intent Processing
  Push Notifications  Validation    Command Queue   Risk Assessment
```

## 📱 Features

### Core Functionality
- **📊 Dashboard**: Real-time system status and health monitoring
- **✅ Approvals**: Review and approve/reject pending AI actions
- **📋 Logs**: View system logs with filtering and search
- **⚙️ Commands**: Send intent-based commands with approval workflow

### Mobile-Specific Features
- **📱 Tablet Support**: Responsive layout for tablets and phones
- **🔐 Device Trust**: Secure device registration and permissions
- **📴 Offline Mode**: Read-only access when offline with cached data
- **🔔 Push Notifications**: Critical alerts for approvals and errors
- **🌙 Dark Theme**: Optimized for low-light environments

### Security & Governance
- **🔒 Authentication**: PIN-based authentication with device registration
- **🛡️ Permissions**: Role-based access control (viewer, operator, controller)
- **📝 Audit Trail**: Complete logging of all actions and approvals
- **⚠️ Risk Assessment**: Automatic risk scoring for AI actions

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Expo CLI
- Android/iOS development environment (for device testing)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

3. **Run on device**:
   ```bash
   # Android
   npm run android
   
   # iOS  
   npm run ios
   
   # Web (for testing)
   npm run web
   ```

4. **Scan QR code** with Expo Go app or use device/emulator

## 📂 Project Structure

```
acey-control-center/
├── src/
│   ├── screens/           # Main app screens
│   │   ├── DashboardScreen.tsx
│   │   ├── ApprovalsScreen.tsx
│   │   ├── LogsScreen.tsx
│   │   └── CommandsScreen.tsx
│   ├── components/        # Reusable UI components
│   │   ├── StatusCard.tsx
│   │   ├── ApprovalItem.tsx
│   │   └── LogRow.tsx
│   ├── services/          # API and business logic
│   │   ├── api.ts          # HTTP client and endpoints
│   │   ├── auth.ts         # Authentication service
│   │   ├── websocket.ts    # Real-time communication
│   │   ├── notifications.ts # Push notifications
│   │   └── offlineCache.ts # Offline data storage
│   ├── state/             # State management
│   │   └── aceyStore.ts   # Zustand store
│   ├── types/             # TypeScript definitions
│   │   ├── api.ts          # API response types
│   │   └── models.ts       # Domain models
│   ├── utils/             # Utility functions
│   │   ├── deviceTrust.ts  # Device security
│   │   └── permissions.ts  # Permission management
│   ├── hooks/             # React hooks
│   │   └── useResponsive.ts # Responsive layout
│   └── navigation/        # Navigation setup
│       └── AppNavigator.tsx
├── App.tsx                # Root component
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## 🔧 Configuration

### Environment Setup

1. **Backend URL**: Update `BASE_URL` in `src/services/api.ts`
2. **Push Notifications**: Configure Expo project ID in `app.json`
3. **Authentication**: Set up device trust policies

### API Endpoints

The mobile app connects to these backend endpoints:

- `GET /mobile/status` - System status
- `GET /mobile/approvals` - Pending approvals
- `POST /mobile/approve` - Process approval
- `POST /mobile/command` - Send command
- `GET /mobile/logs` - System logs

## 🔐 Security Model

### Device Trust
- Each device requires registration and approval
- Device IDs are cryptographically generated
- Permissions are assigned per device
- Revocation support for lost/stolen devices

### Permission Levels
- **Viewer**: Read-only access to status and logs
- **Operator**: Can approve actions and view all data  
- **Controller**: Can send commands and approve actions
- **Admin**: Full administrative access

### Data Protection
- All API calls use JWT authentication
- Sensitive data is encrypted at rest
- Audit logging for all administrative actions
- Automatic session timeout

## 📱 Responsive Design

### Phone Layout (< 768px)
- Single column navigation
- Bottom tab navigation
- Full-screen screens
- Touch-optimized controls

### Tablet Layout (≥ 768px)
- Side-by-side dashboard and logs
- Master-detail views for approvals
- Larger touch targets
- Landscape orientation support

## 📴 Offline Mode

When offline, the app provides:

- **Cached Status**: Last known system status
- **Cached Logs**: Previously loaded log entries  
- **Read-Only Mode**: No actions can be taken
- **Clear Indicators**: Visual offline status indicators
- **Auto-Sync**: Data refreshes when connection restored

## 🔔 Push Notifications

### Notification Types
- **Approval Required**: New action needs approval
- **Critical Errors**: System errors requiring attention
- **Security Alerts**: Suspicious activity detected
- **System Status**: Major status changes

### Quiet Hours
- Configurable quiet hours
- Emergency alerts still delivered
- Do-not-disturb respect
- Custom notification sounds

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing Checklist
- [ ] Authentication flow
- [ ] Dashboard loading and refresh
- [ ] Approval workflow
- [ ] Command sending
- [ ] Offline mode behavior
- [ ] Push notifications
- [ ] Tablet layout
- [ ] Error handling

## 🚀 Deployment

### Development
```bash
expo start --dev-client
```

### Staging
```bash
expo build:android --release-channel staging
expo build:ios --release-channel staging
```

### Production
```bash
expo build:android --release-channel production
expo build:ios --release-channel production
```

### App Store Distribution
- Google Play Store (Android)
- Apple App Store (iOS)
- Enterprise distribution available

## 📊 Monitoring

### Analytics
- User engagement metrics
- Feature usage statistics
- Performance monitoring
- Crash reporting

### Health Checks
- API response times
- Error rates
- Notification delivery
- Offline mode usage

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use conventional commits
3. Add tests for new features
4. Update documentation
5. Test on multiple screen sizes

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For technical support:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting guide

---

**⚠️ Important**: This app provides governance controls, not direct AI access. All actions go through proper approval workflows and audit trails.
