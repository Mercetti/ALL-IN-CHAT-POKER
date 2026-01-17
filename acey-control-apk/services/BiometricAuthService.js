/**
 * Biometric Authentication Service
 * Handles biometric authentication for the Acey Control Center
 */

import * as LocalAuthentication from 'expo-local-authentication';

class BiometricAuthService {
  static async authenticate() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        // Log: Biometric hardware not available
        return false;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        // Log: No biometric credentials enrolled
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Acey Control Center',
        fallbackLabel: 'Use passcode',
      });

      return result.success;
    } catch {
      // Log: Biometric authentication failed
      return false;
    }
  }

  static async getSupportedTypes() {
    try {
      const supportedTypes = await LocalAuthentication.getSupportedAuthenticationTypesAsync();
      return supportedTypes || [];
    } catch {
      // Log: Failed to get supported authentication types
      return [];
    }
  }

  static async isAvailable() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  }
}

export default BiometricAuthService;
