/**
 * Biometric Authentication Component
 * Platform-specific authentication for iOS/Android
 */

/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const BiometricAuth = ({ onAuthenticationSuccess, onAuthenticationFailure }) => {
  const { colors, spacing, borderRadius } = useTheme();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMethod, setAuthMethod] = useState(null);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      if (Platform.OS === 'ios') {
        const available = await checkiOSBiometrics();
        setAuthMethod(available);
      } else if (Platform.OS === 'android') {
        const available = await checkAndroidBiometrics();
        setAuthMethod(available);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking biometric availability:', error);
    }
  };

  const checkiOSBiometrics = async () => {
    try {
      // iOS biometric check would use expo-local-authentication
      // For now, return Face ID as available
      return 'Face ID';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking iOS biometrics:', error);
      return null;
    }
  };

  const checkAndroidBiometrics = async () => {
    try {
      // Android biometric check would use react-native-biometrics
      // For now, return Fingerprint as available
      return 'Fingerprint';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking Android biometrics:', error);
      return null;
    }
  };

  const authenticate = async () => {
    setIsAuthenticating(true);
    
    try {
      if (Platform.OS === 'ios') {
        await authenticateWithiOS();
      } else if (Platform.OS === 'android') {
        await authenticateWithAndroid();
      }
    } catch (error) {
      setIsAuthenticating(false);
      // eslint-disable-next-line no-console
      console.error('Authentication error:', error);
      if (onAuthenticationFailure) {
        onAuthenticationFailure(error);
      }
    }
  };

  const authenticateWithiOS = async () => {
    try {
      // iOS authentication would use expo-local-authentication
      // For demo purposes, simulate successful authentication
      setTimeout(() => {
        setIsAuthenticating(false);
        if (onAuthenticationSuccess) {
          onAuthenticationSuccess({ method: 'Face ID', success: true });
        }
      }, 2000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('iOS authentication error:', error);
    }
  };

  const authenticateWithAndroid = async () => {
    try {
      // Android authentication would use react-native-biometrics
      // For demo purposes, simulate successful authentication
      setTimeout(() => {
        setIsAuthenticating(false);
        if (onAuthenticationSuccess) {
          onAuthenticationSuccess({ method: 'Fingerprint', success: true });
        }
      }, 2000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Android authentication error:', error);
    }
  };

  return React.createElement(
    View,
    { style: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: spacing.lg,
      backgroundColor: colors.background 
    } },
    [
      React.createElement(
        Text,
        { 
          style: { 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: colors.text, 
            marginBottom: spacing.lg 
          } 
        },
        'Biometric Authentication'
      ),
      authMethod && React.createElement(
        Text,
        { 
          style: { 
            fontSize: 16, 
            color: colors.textSecondary, 
            marginBottom: spacing.md 
          } 
        },
        `Available: ${authMethod}`
      ),
      React.createElement(
        TouchableOpacity,
        {
          style: {
            backgroundColor: colors.primary,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.md,
            opacity: isAuthenticating ? 0.6 : 1,
          },
          disabled: isAuthenticating,
          onPress: authenticate
        },
        React.createElement(
          Text,
          {
            style: {
              color: colors.surface,
              fontSize: 16,
              fontWeight: '600',
            }
          },
          isAuthenticating ? 'Authenticating...' : 'Authenticate'
        )
      )
    ]
  );
};

export default BiometricAuth;
