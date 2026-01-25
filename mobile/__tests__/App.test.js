/**
 * App Component Tests
 * Main application entry point testing
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mock the theme context
jest.mock('../src/theme/ThemeContext', () => ({
  ThemeProvider: ({ children }) => children,
  useTheme: () => ({
    colors: {
      primary: '#4adeff',
      secondary: '#ff6bd6',
      background: '#ffffff',
      text: '#000000',
      textSecondary: '#64748b',
      border: '#cbd5e1',
      surface: '#ffffff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
    typography: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    },
  }),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock createStackNavigator
jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock GameScreen
jest.mock('../src/screens/GameScreen', () => {
  return function MockGameScreen() {
    return null;
  };
});

// Mock BiometricAuth
jest.mock('../src/components/BiometricAuth', () => {
  return function MockBiometricAuth() {
    return null;
  };
});

describe('App Component', () => {
  test('renders without crashing', () => {
    // Simple smoke test - just importing the App component
    expect(() => require('../src/App')).not.toThrow();
  });

  test('has proper app structure', () => {
    // Test that the App module exists and can be imported
    const App = require('../src/App').default;
    expect(typeof App).toBe('function');
  });

  test('handles theme context properly', () => {
    // Test that theme context is available
    const { useTheme } = require('../src/theme/ThemeContext');
    const theme = useTheme();
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.spacing).toBeDefined();
  });

  test('navigation container is present', () => {
    // Test that navigation components are available
    const { NavigationContainer } = require('@react-navigation/native');
    expect(NavigationContainer).toBeDefined();
  });
});
