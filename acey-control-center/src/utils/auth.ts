/**
 * Secure Authentication and Biometric Helper Utilities
 * Handles biometric authentication, secure storage, and device trust
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { BiometricAuthResult, Device, SecurityContext, AuthChallenge } from '../types/auth';

// Secure storage keys
const SECURE_KEYS = {
  DEVICE_ID: 'device_id',
  TRUST_LEVEL: 'trust_level',
  OWNER_TOKEN: 'owner_token',
  EMERGENCY_LOCK: 'emergency_lock',
  LAST_BIOMETRIC_AUTH: 'last_biometric_auth',
  SESSION_EXPIRES: 'session_expires',
  DEVICE_PAIRING: 'device_pairing',
  SECURITY_CONFIG: 'security_config',
} as const;

/**
 * Check if biometric authentication is available and enrolled
 */
export const checkBiometricSupport = async (): Promise<BiometricAuthResult> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return {
        success: false,
        error: 'Biometric hardware not available',
        method: 'none',
        supported: false,
        enrolled: false,
      };
    }

    const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    const method = supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) ||
                   supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) 
                   ? 'biometric' : 'passcode';

    return {
      success: hasHardware && isEnrolled,
      method,
      supported: hasHardware,
      enrolled: isEnrolled,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'none',
      supported: false,
      enrolled: false,
    };
  }
};

/**
 * Authenticate using biometrics or device passcode
 */
export const authenticateBiometric = async (promptMessage?: string): Promise<boolean> => {
  try {
    const biometricCheck = await checkBiometricSupport();
    
    if (!biometricCheck.supported || !biometricCheck.enrolled) {
      console.log('Biometric not supported or not enrolled');
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Authenticate to approve this action',
      fallbackLabel: 'Use device passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      requireConfirmation: true,
    });

    // Store last successful authentication time
    if (result.success) {
      await storeSecureItem(SECURE_KEYS.LAST_BIOMETRIC_AUTH, Date.now().toString());
    }

    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

/**
 * Store data securely in device keychain
 */
export const storeSecureItem = async (
  key: string, 
  value: string, 
  options?: {
    requireAuth?: boolean;
    expiresAt?: string;
  }
): Promise<void> => {
  try {
    const secureOptions: SecureStore.SecureStoreOptions = {
      keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
    };

    // If expiration is set, store with expiration metadata
    if (options?.expiresAt) {
      const itemWithExpiration = JSON.stringify({
        value,
        expiresAt: options.expiresAt,
        requireAuth: options.requireAuth || false,
      });
      await SecureStore.setItemAsync(key, itemWithExpiration, secureOptions);
    } else {
      await SecureStore.setItemAsync(key, value, secureOptions);
    }
  } catch (error) {
    console.error('Error storing secure item:', error);
    throw new Error('Failed to store secure data');
  }
};

/**
 * Retrieve data from secure storage
 */
export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    const item = await SecureStore.getItemAsync(key);
    
    if (!item) return null;

    // Check if item has expiration metadata
    try {
      const parsedItem = JSON.parse(item);
      if (parsedItem.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(parsedItem.expiresAt);
        
        if (now > expiresAt) {
          // Item has expired, remove it and return null
          await removeSecureItem(key);
          return null;
        }
        
        // Check if authentication is required
        if (parsedItem.requireAuth) {
          const isAuthenticated = await authenticateBiometric('Authentication required to access secure data');
          if (!isAuthenticated) {
            throw new Error('Authentication required');
          }
        }
        
        return parsedItem.value;
      }
    } catch {
      // Item is not JSON, return as-is
      return item;
    }
    
    return item;
  } catch (error) {
    console.error('Error retrieving secure item:', error);
    return null;
  }
};

/**
 * Remove item from secure storage
 */
export const removeSecureItem = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error removing secure item:', error);
    throw new Error('Failed to remove secure data');
  }
};

/**
 * Get or create device ID
 */
export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await getSecureItem(SECURE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await storeSecureItem(SECURE_KEYS.DEVICE_ID, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting/creating device ID:', error);
    throw new Error('Failed to initialize device');
  }
};

/**
 * Update device trust level
 */
export const updateTrustLevel = async (newLevel: number, reason?: string): Promise<void> => {
  try {
    const deviceId = await getOrCreateDeviceId();
    const currentLevel = await getTrustLevel();
    
    if (newLevel < 0 || newLevel > 100) {
      throw new Error('Trust level must be between 0 and 100');
    }
    
    // Only allow trust level to increase through normal means
    if (newLevel < currentLevel && reason !== 'security_breach') {
      throw new Error('Trust level can only be decreased by owner action');
    }
    
    await storeSecureItem(SECURE_KEYS.TRUST_LEVEL, newLevel.toString());
    
    // Log trust level change
    console.log(`Trust level updated for device ${deviceId}: ${currentLevel} -> ${newLevel}`, { reason });
  } catch (error) {
    console.error('Error updating trust level:', error);
    throw error;
  }
};

/**
 * Get current device trust level
 */
export const getTrustLevel = async (): Promise<number> => {
  try {
    const trustLevel = await getSecureItem(SECURE_KEYS.TRUST_LEVEL);
    return trustLevel ? parseInt(trustLevel, 10) : 50; // Default trust level
  } catch (error) {
    console.error('Error getting trust level:', error);
    return 0;
  }
};

/**
 * Check if emergency lock is active
 */
export const isEmergencyLockActive = async (): Promise<boolean> => {
  try {
    const lockStatus = await getSecureItem(SECURE_KEYS.EMERGENCY_LOCK);
    return lockStatus === 'true';
  } catch (error) {
    console.error('Error checking emergency lock:', error);
    return false;
  }
};

/**
 * Trigger emergency lock
 */
export const triggerEmergencyLock = async (reason?: string): Promise<void> => {
  try {
    const deviceId = await getOrCreateDeviceId();
    const lockData = JSON.stringify({
      active: true,
      triggeredAt: new Date().toISOString(),
      triggeredBy: deviceId,
      reason: reason || 'Manual emergency lock',
      requiresOwnerUnlock: true,
    });
    
    await storeSecureItem(SECURE_KEYS.EMERGENCY_LOCK, lockData);
    console.log('Emergency lock triggered for device:', deviceId);
  } catch (error) {
    console.error('Error triggering emergency lock:', error);
    throw new Error('Failed to trigger emergency lock');
  }
};

/**
 * Get current security context
 */
export const getSecurityContext = async (): Promise<SecurityContext> => {
  try {
    const deviceId = await getOrCreateDeviceId();
    const trustLevel = await getTrustLevel();
    const emergencyLockActive = await isEmergencyLockActive();
    const lastBiometricAuth = await getSecureItem(SECURE_KEYS.LAST_BIOMETRIC_AUTH);
    const sessionExpires = await getSecureItem(SECURE_KEYS.SESSION_EXPIRES);
    
    return {
      isAuthenticated: !!lastBiometricAuth,
      deviceId,
      trustLevel,
      permissions: [], // Would be populated based on current session
      sessionExpiresAt: sessionExpires || '',
      emergencyLockActive,
      lastBiometricAuth: lastBiometricAuth || '',
    };
  } catch (error) {
    console.error('Error getting security context:', error);
    throw new Error('Failed to get security context');
  }
};

/**
 * Check if re-authentication is required
 */
export const requiresReauthentication = async (lastAuthTime?: string): Promise<boolean> => {
  try {
    const lastAuth = lastAuthTime || await getSecureItem(SECURE_KEYS.LAST_BIOMETRIC_AUTH);
    
    if (!lastAuth) return true;
    
    const lastAuthDate = new Date(parseInt(lastAuth, 10));
    const now = new Date();
    const timeDiff = now.getTime() - lastAuthDate.getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return timeDiff > fiveMinutes;
  } catch (error) {
    console.error('Error checking re-authentication requirement:', error);
    return true; // Default to requiring auth
  }
};

/**
 * Create authentication challenge
 */
export const createAuthChallenge = (
  type: 'biometric' | 'passcode' | 'owner_approval',
  reason: string,
  expiresInMinutes: number = 5
): AuthChallenge => {
  return {
    type,
    reason,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString(),
    attempts: 0,
    maxAttempts: 3,
  };
};

/**
 * Validate authentication challenge
 */
export const validateAuthChallenge = async (challenge: AuthChallenge): Promise<boolean> => {
  try {
    const now = new Date();
    const expiresAt = new Date(challenge.expiresAt);
    
    if (now > expiresAt) {
      return false; // Challenge expired
    }
    
    if (challenge.attempts >= challenge.maxAttempts) {
      return false; // Too many attempts
    }
    
    switch (challenge.type) {
      case 'biometric':
        return await authenticateBiometric(challenge.reason);
      case 'passcode':
        // Would implement device passcode authentication
        return false;
      case 'owner_approval':
        // Would implement owner approval flow
        return false;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error validating auth challenge:', error);
    return false;
  }
};
