/**
 * Jest Setup File
 * Global test configuration and mocks
 */

/* eslint-disable */
import 'react-native-gesture-handler/jestSetup';

// Set up React Native globals
global.__DEV__ = true;

// Mock React Native core modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: jest.fn((obj) => obj.ios || obj.default),
      isPad: false,
      isTVOS: false,
      isTV: false,
    },
    Dimensions: {
      get: jest.fn(() => ({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((style) => style),
      compose: jest.fn((style1, style2) => ({ ...style1, ...style2 })),
    },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    FlatList: 'FlatList',
    Image: 'Image',
    TextInput: 'TextInput',
    ActivityIndicator: 'ActivityIndicator',
    StatusBar: 'StatusBar',
    SafeAreaView: 'SafeAreaView',
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
  };
});

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
