/**
 * Biometric Authentication Component
 * Platform-specific authentication for iOS/Android
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import * as LocalAuthentication from 'expo-local-authentication';

const BiometricAuth = ({ onAuthSuccess, onAuthError }) => {
  const theme = useTheme();
  const [isSupported, setIsSupported] = useState(false);
  const [availableMethods, setAvailableMethods] = useState([]);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setIsSupported(supported.length > 0);
      setAvailableMethods(supported);
    } catch (error) {
      console.error('Biometric check failed:', error);
      setIsSupported(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your poker account',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onAuthSuccess?.(result);
      } else {
        onAuthError?.(new Error('Biometric authentication failed'));
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      onAuthError?.(error);
    }
  };

  if (!isSupported) {
    return null;
  }

  const getMethodIcon = (method) => {
    switch (method) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return '👆';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return '👤';
      case LocalAuthentication.AuthenticationType.IRIS:
        return '👁';
      default:
        return '🔐';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Secure Authentication</Text>
      <Text style={styles.subtitle}>Use biometric authentication to quickly access your account</Text>
      
      <View style={styles.methodsContainer}>
        {availableMethods.map((method, index) => (
          <View key={index} style={styles.methodItem}>
            <Text style={styles.methodIcon}>{getMethodIcon(method)}</Text>
            <Text style={styles.methodName}>
              {method === LocalAuthentication.AuthenticationType.FINGERPRINT && 'Fingerprint'}
              {method === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION && 'Face ID'}
              {method === LocalAuthentication.AuthenticationType.IRIS && 'Iris Scan'}
              {method || 'Biometric'}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.authButton}
        onPress={handleBiometricAuth}
      >
        <Text style={styles.authButtonText}>Authenticate</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  methodsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  methodItem: {
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  methodIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  methodName: {
    fontSize: 12,
    color: theme.colors.text,
  },
  authButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BiometricAuth;
