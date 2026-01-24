/**
 * Jest Setup File
 * Global test configuration and mocks
 */

/* eslint-disable */
import 'react-native-gesture-handler/jestSetup';

// Set up React Native globals
global.__DEV__ = true;

// Mock React Native modules
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  Version: '14.0',
  select: (obj) => obj.ios || obj.default,
  isPad: false,
  isTVOS: false,
  isTV: false,
}));

jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({
    width: 375,
    height: 667,
    scale: 2,
    fontScale: 1,
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
  generateSafeAnimationCount: jest.fn(),
  getNativeAnimationModule: jest.fn(),
  startAnimation: jest.fn(),
  stopAnimation: jest.fn(),
}));

// Mock console methods for testing
global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock alert for testing
global.alert = jest.fn();

// Mock setTimeout for testing
global.setTimeout = jest.fn();

// Mock Device for testing
jest.mock('react-native-device-info', () => ({
  Platform: {
    OS: 'ios',
    Version: '14.0',
  },
}));

// Mock AsyncStorage for testing
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  ...jest.requireActual('expo-notifications'),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  addNotificationReceivedListener: jest.fn(() => jest.fn()),
  addNotificationResponseReceivedListener: jest.fn(() => jest.fn()),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  ...jest.requireActual('expo-local-authentication'),
  supportedAuthenticationTypesAsync: jest.fn(() => 
    Promise.resolve(['fingerprint', 'facial'])
  ),
  authenticateAsync: jest.fn(() => 
    Promise.resolve({ success: true })
  ),
}));

// Mock expo-shortcuts (package doesn't exist, commented out)
// jest.mock('expo-shortcuts', () => ({
//   ...require.requireActual('expo-shortcuts'),
//   setShortcutsAsync: jest.fn(() => Promise.resolve()),
// }));

// Silence warning about react-test-renderer
jest.mock('react-test-renderer', () => ({
  ...jest.requireActual('react-test-renderer'),
}));

// Global test utilities
global.testUtils = {
  // Helper for waiting for async operations
  waitFor: (callback, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = callback();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, timeout);
    });
  },
  
  // Helper for creating mock props
  createMockProps: (overrides = {}) => ({
    onPress: jest.fn(),
    onLongPress: jest.fn(),
    style: {},
    ...overrides,
  }),
  
  // Helper for theme testing
  createMockTheme: (overrides = {}) => ({
    colors: {
      primary: '#4adeff',
      secondary: '#ff6bd6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#030712',
      surface: '#ffffff',
      text: '#ffffff',
      textSecondary: '#64748b',
      border: '#cbd5e1',
      ...overrides.colors,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      ...overrides.spacing,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      ...overrides.borderRadius,
    },
  }),
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});
