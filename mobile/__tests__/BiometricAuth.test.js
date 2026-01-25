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
  const mockOnSuccess = jest.fn();
  const mockOnFailure = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders biometric auth prompt', () => {
    render(
      <BiometricAuth
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
        onCancel={mockOnCancel}
      />
    );

    // Should render biometric authentication interface
    expect(screen.getByText(/authenticate/i)).toBeTruthy();
  });

  test('handles successful biometric authentication', async () => {
    render(
      <BiometricAuth
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
        onCancel={mockOnCancel}
      />
    );

    // Simulate successful authentication
    const authenticateButton = screen.getByText(/authenticate/i);
    fireEvent.press(authenticateButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('handles biometric authentication failure', async () => {
    // Mock failure
    const { ReactNativeBiometrics } = require('react-native-biometrics');
    ReactNativeBiometrics.createSignature.mockRejectedValueOnce(new Error('Authentication failed'));

    render(
      <BiometricAuth
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
        onCancel={mockOnCancel}
      />
    );

    const authenticateButton = screen.getByText(/authenticate/i);
    fireEvent.press(authenticateButton);

    await waitFor(() => {
      expect(mockOnFailure).toHaveBeenCalledWith('Authentication failed');
    });
  });

  test('handles cancellation', () => {
    render(
      <BiometricAuth
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.press(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('displays appropriate biometric type', () => {
    render(
      <BiometricAuth
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
        onCancel={mockOnCancel}
      />
    );

    // Should show the available biometric type
    expect(screen.getByText(/touchid|faceid|fingerprint/i)).toBeTruthy();
  });

  test('handles unavailable biometric sensor', async () => {
    // Mock unavailable sensor
    const { ReactNativeBiometrics } = require('react-native-biometrics');
    ReactNativeBiometrics.isSensorAvailable.mockResolvedValueOnce({ 
      available: false, 
      biometryType: null 
    });

    render(
      <BiometricAuth
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(mockOnFailure).toHaveBeenCalledWith('Biometric authentication not available');
    });
  });

  test('properly stores authentication credentials', async () => {
    render(
      <BiometricAuth
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
        onCancel={mockOnCancel}
      />
    );

    const authenticateButton = screen.getByText(/authenticate/i);
    fireEvent.press(authenticateButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    // Verify keychain operations
    const { setInternetCredentials } = require('react-native-keychain');
    expect(setInternetCredentials).toHaveBeenCalled();
  });
});
