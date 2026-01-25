/**
 * BiometricAuth Component Tests
 * Authentication functionality testing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import BiometricAuth from '../src/components/BiometricAuth';

// Mock React Native biometric modules
jest.mock('react-native-biometrics', () => ({
  isSensorAvailable: jest.fn(() => Promise.resolve({ available: true, biometryType: 'TouchID' })),
  createKeys: jest.fn(() => Promise.resolve({ publicKey: 'mock-public-key' })),
  createSignature: jest.fn(() => Promise.resolve({ success: true, signature: 'mock-signature' })),
}));

jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: 'test-user', password: 'test-token' })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
}));

// Mock theme context
jest.mock('../src/theme/ThemeContext', () => ({
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

describe('BiometricAuth Component', () => {
  test('renders biometric auth prompt', () => {
    render(
      <BiometricAuth
        onAuthenticationSuccess={jest.fn()}
        onAuthenticationFailure={jest.fn()}
      />
    );

    // Should render biometric authentication interface
    expect(screen.getByText('Biometric Authentication')).toBeTruthy();
    expect(screen.getByText('Authenticate')).toBeTruthy();
  });

  test('displays available biometric method', async () => {
    render(
      <BiometricAuth
        onAuthenticationSuccess={jest.fn()}
        onAuthenticationFailure={jest.fn()}
      />
    );

    // Should show the available biometric type (Face ID or Fingerprint)
    // Wait for the component to check biometric availability
    await waitFor(() => {
      expect(screen.getByText(/Available: (Face ID|Fingerprint)/)).toBeTruthy();
    }, { timeout: 1000 });
  });

  test('handles authentication button press', () => {
    const mockOnSuccess = jest.fn();
    
    render(
      <BiometricAuth 
        onAuthenticationSuccess={mockOnSuccess}
        onAuthenticationFailure={jest.fn()}
      />
    );
    
    const authenticateButton = screen.getByText('Authenticate');
    fireEvent.press(authenticateButton);
    
    // Should show authenticating state
    expect(screen.getByText('Authenticating...')).toBeTruthy();
  });

  test('renders without crashing', () => {
    render(
      <BiometricAuth
        onAuthenticationSuccess={jest.fn()}
        onAuthenticationFailure={jest.fn()}
      />
    );
    
    // Component should render without errors
    expect(screen.getByText('Biometric Authentication')).toBeTruthy();
  });
});
