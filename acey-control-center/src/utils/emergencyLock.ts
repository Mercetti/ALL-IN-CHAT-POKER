/**
 * Emergency Lock Utilities
 * Handles emergency lock functionality for immediate device security
 */

import { EmergencyLock, SecurityContext } from '../types/auth';
import { storeSecureItem, getSecureItem, removeSecureItem, getSecurityContext, getOrCreateDeviceId } from './auth';

// Storage keys for emergency lock
const EMERGENCY_KEYS = {
  LOCK_STATUS: 'emergency_lock_status',
  LOCK_REASON: 'emergency_lock_reason',
  LOCK_TRIGGERED_BY: 'emergency_lock_triggered_by',
  LOCK_EXPIRES: 'emergency_lock_expires',
  REMOTE_LOCK_TOKEN: 'remote_lock_token',
} as const;

/**
 * Trigger emergency lock immediately
 */
export const triggerEmergencyLock = async (
  reason: string = 'Manual emergency lock',
  triggeredBy: string = 'device_owner',
  expiresHours: number = 24
): Promise<EmergencyLock> => {
  try {
    const deviceId = await getOrCreateDeviceId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresHours * 60 * 60 * 1000);

    const emergencyLock: EmergencyLock = {
      active: true,
      triggeredAt: now.toISOString(),
      triggeredBy,
      reason,
      requiresOwnerUnlock: true,
      expiresAt: expiresAt.toISOString(),
    };

    // Store lock status securely
    await storeSecureItem(EMERGENCY_KEYS.LOCK_STATUS, 'true', {
      requireAuth: false, // Allow access even during emergency
    });

    await storeSecureItem(EMERGENCY_KEYS.LOCK_REASON, reason);
    await storeSecureItem(EMERGENCY_KEYS.LOCK_TRIGGERED_BY, triggeredBy);
    await storeSecureItem(EMERGENCY_KEYS.LOCK_EXPIRES, expiresAt.toISOString());

    // Log the emergency lock trigger
    console.warn('EMERGENCY LOCK TRIGGERED', {
      deviceId,
      reason,
      triggeredBy,
      expiresAt: expiresAt.toISOString(),
    });

    return emergencyLock;
  } catch (error) {
    console.error('Error triggering emergency lock:', error);
    throw new Error('Failed to trigger emergency lock');
  }
};

/**
 * Trigger emergency lock remotely (for owner/admin)
 */
export const triggerRemoteEmergencyLock = async (
  targetDeviceId: string,
  reason: string,
  adminToken: string,
  expiresHours: number = 24
): Promise<EmergencyLock> => {
  try {
    // Verify admin token (in production, this would be a secure API call)
    const isValidToken = await verifyAdminToken(adminToken);
    if (!isValidToken) {
      throw new Error('Invalid admin token');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresHours * 60 * 60 * 1000);

    const emergencyLock: EmergencyLock = {
      active: true,
      triggeredAt: now.toISOString(),
      triggeredBy: `remote_admin_${adminToken.substring(0, 8)}`,
      reason: `Remote lock: ${reason}`,
      requiresOwnerUnlock: true,
      expiresAt: expiresAt.toISOString(),
    };

    // Store remote lock token for verification
    await storeSecureItem(EMERGENCY_KEYS.REMOTE_LOCK_TOKEN, adminToken);

    // Store lock status
    await storeSecureItem(EMERGENCY_KEYS.LOCK_STATUS, 'true');
    await storeSecureItem(EMERGENCY_KEYS.LOCK_REASON, emergencyLock.reason);
    await storeSecureItem(EMERGENCY_KEYS.LOCK_TRIGGERED_BY, emergencyLock.triggeredBy);
    await storeSecureItem(EMERGENCY_KEYS.LOCK_EXPIRES, expiresAt.toISOString());

    console.warn('REMOTE EMERGENCY LOCK TRIGGERED', {
      targetDeviceId,
      reason,
      expiresAt: expiresAt.toISOString(),
    });

    return emergencyLock;
  } catch (error) {
    console.error('Error triggering remote emergency lock:', error);
    throw error;
  }
};

/**
 * Check if emergency lock is active
 */
export const isEmergencyLockActive = async (): Promise<boolean> => {
  try {
    const lockStatus = await getSecureItem(EMERGENCY_KEYS.LOCK_STATUS);
    
    if (lockStatus !== 'true') {
      return false;
    }

    // Check if lock has expired
    const details = await getEmergencyLockDetails();
    if (!details) {
      return false;
    }
    const expiresAt = details.expiresAt || new Date().toISOString();
    const expirationDate = new Date(expiresAt);
    if (new Date() > expirationDate) {
      await clearEmergencyLock();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking emergency lock status:', error);
    return false;
  }
};

/**
 * Get emergency lock details
 */
export const getEmergencyLockDetails = async (): Promise<EmergencyLock | null> => {
  try {
    const isActive = await isEmergencyLockActive();
    if (!isActive) {
      return null;
    }

    const reason = await getSecureItem(EMERGENCY_KEYS.LOCK_REASON) || 'Unknown reason';
    const triggeredBy = await getSecureItem(EMERGENCY_KEYS.LOCK_TRIGGERED_BY) || 'Unknown';
    const triggeredAt = await getSecureItem(EMERGENCY_KEYS.LOCK_TRIGGERED_BY) || new Date().toISOString();
    const expiresAt = await getSecureItem(EMERGENCY_KEYS.LOCK_EXPIRES) || new Date().toISOString();

    return {
      active: true,
      triggeredAt,
      triggeredBy,
      reason,
      requiresOwnerUnlock: true,
      expiresAt,
    };
  } catch (error) {
    console.error('Error getting emergency lock details:', error);
    return null;
  }
};

/**
 * Clear emergency lock (requires owner verification)
 */
export const clearEmergencyLock = async (
  ownerId?: string,
  verificationCode?: string
): Promise<boolean> => {
  try {
    // Verify owner if provided
    if (ownerId && verificationCode) {
      const isOwnerVerified = await verifyOwnerIdentity(ownerId, verificationCode);
      if (!isOwnerVerified) {
        throw new Error('Owner verification failed');
      }
    }

    // Remove all emergency lock related items
    await removeSecureItem(EMERGENCY_KEYS.LOCK_STATUS);
    await removeSecureItem(EMERGENCY_KEYS.LOCK_REASON);
    await removeSecureItem(EMERGENCY_KEYS.LOCK_TRIGGERED_BY);
    await removeSecureItem(EMERGENCY_KEYS.LOCK_EXPIRES);
    await removeSecureItem(EMERGENCY_KEYS.REMOTE_LOCK_TOKEN);

    console.info('Emergency lock cleared');
    return true;
  } catch (error) {
    console.error('Error clearing emergency lock:', error);
    return false;
  }
};

/**
 * Check if action is allowed during emergency lock
 */
export const isActionAllowedDuringEmergency = async (
  action: string
): Promise<boolean> => {
  try {
    const isLocked = await isEmergencyLockActive();
    
    if (!isLocked) {
      return true; // No lock, all actions allowed
    }

    // Define actions allowed during emergency lock
    const allowedEmergencyActions = [
      'unlock_device',
      'emergency_contact',
      'view_lock_status',
      'owner_verification',
    ];

    return allowedEmergencyActions.includes(action);
  } catch (error) {
    console.error('Error checking emergency action allowance:', error);
    return false; // Default to blocking action
  }
};

/**
 * Auto-trigger emergency lock based on security conditions
 */
export const checkSecurityConditions = async (
  securityContext: SecurityContext
): Promise<boolean> => {
  try {
    let shouldLock = false;
    let lockReason = '';

    // Check trust level
    if (securityContext.trustLevel < 20) {
      shouldLock = true;
      lockReason = 'Trust level critically low';
    }

    // Check for suspicious activity patterns
    const suspiciousPatterns = await detectSuspiciousActivity();
    if (suspiciousPatterns.length > 0) {
      shouldLock = true;
      lockReason = `Suspicious activity detected: ${suspiciousPatterns.join(', ')}`;
    }

    // Check for failed authentication attempts
    const failedAttempts = await getFailedAuthAttempts();
    if (failedAttempts > 5) {
      shouldLock = true;
      lockReason = 'Multiple failed authentication attempts';
    }

    if (shouldLock) {
      await triggerEmergencyLock(lockReason, 'auto_security_system', 48);
      console.warn('Auto emergency lock triggered:', lockReason);
    }

    return shouldLock;
  } catch (error) {
    console.error('Error checking security conditions:', error);
    return false;
  }
};

/**
 * Detect suspicious activity patterns
 */
export const detectSuspiciousActivity = async (): Promise<string[]> => {
  try {
    const patterns: string[] = [];
    
    // In a real implementation, this would analyze various security metrics
    // For now, return empty array (no suspicious activity detected)
    
    return patterns;
  } catch (error) {
    console.error('Error detecting suspicious activity:', error);
    return [];
  }
};

/**
 * Get failed authentication attempts
 */
export const getFailedAuthAttempts = async (): Promise<number> => {
  try {
    // In a real implementation, this would count recent failed auth attempts
    // For now, return 0 (no failed attempts)
    return 0;
  } catch (error) {
    console.error('Error getting failed auth attempts:', error);
    return 0;
  }
};

/**
 * Verify admin token (simplified for demo)
 */
export const verifyAdminToken = async (token: string): Promise<boolean> => {
  try {
    // In a real implementation, this would verify against a secure backend
    // For demo purposes, accept tokens longer than 16 characters
    return token.length >= 16;
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return false;
  }
};

/**
 * Verify owner identity (simplified for demo)
 */
export const verifyOwnerIdentity = async (
  ownerId: string,
  verificationCode: string
): Promise<boolean> => {
  try {
    // In a real implementation, this would verify against secure backend
    // For demo purposes, accept verification codes longer than 8 characters
    return verificationCode.length >= 8;
  } catch (error) {
    console.error('Error verifying owner identity:', error);
    return false;
  }
};

/**
 * Get emergency lock statistics
 */
export const getEmergencyLockStats = async (): Promise<{
  isActive: boolean;
  triggeredBy: string;
  reason: string;
  triggeredAt: string;
  expiresAt: string;
  timeRemaining: number;
}> => {
  try {
    const details = await getEmergencyLockDetails();
    
    if (!details) {
      return {
        isActive: false,
        triggeredBy: '',
        reason: '',
        triggeredAt: '',
        expiresAt: '',
        timeRemaining: 0,
      };
    }

    const now = new Date();
    const expiresAt = new Date(details.expiresAt);
    const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime());

    return {
      isActive: details.active,
      triggeredBy: details.triggeredBy,
      reason: details.reason,
      triggeredAt: details.triggeredAt,
      expiresAt: details.expiresAt,
      timeRemaining: Math.floor(timeRemaining / (1000 * 60)), // Convert to minutes
    };
  } catch (error) {
    console.error('Error getting emergency lock stats:', error);
    return {
      isActive: false,
      triggeredBy: '',
      reason: '',
      triggeredAt: '',
      expiresAt: '',
      timeRemaining: 0,
    };
  }
};

/**
 * Schedule automatic emergency lock (for testing or maintenance)
 */
export const scheduleEmergencyLock = async (
  delayMinutes: number,
  reason: string
): Promise<void> => {
  try {
    const delayMs = delayMinutes * 60 * 1000;
    
    setTimeout(async () => {
      await triggerEmergencyLock(`Scheduled: ${reason}`, 'auto_scheduler', 24);
    }, delayMs);
    
    console.info(`Emergency lock scheduled in ${delayMinutes} minutes: ${reason}`);
  } catch (error) {
    console.error('Error scheduling emergency lock:', error);
  }
};
