/**
 * Security Hook for Acey Control Center
 * Integrates biometric authentication, device trust, and emergency lock
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  authenticateBiometric, 
  getSecurityContext, 
  requiresReauthentication,
  isEmergencyLockActive,
  getTrustLevel,
  getOrCreateDeviceId
} from '../utils/auth';
import { 
  hasPermission, 
  createOwnerApproval,
  isApprovalValid,
  getPermissionStats
} from '../utils/ownerPermissions';
import { 
  triggerEmergencyLock,
  isActionAllowedDuringEmergency,
  getEmergencyLockStats
} from '../utils/emergencyLock';
import { SensitiveAction, SecurityContext } from '../types/auth';

interface UseSecurityReturn {
  // Authentication
  isAuthenticated: boolean;
  authenticate: (prompt?: string) => Promise<boolean>;
  requiresReauth: boolean;
  
  // Device Trust
  deviceId: string;
  trustLevel: number;
  updateTrustLevel: (level: number, reason?: string) => Promise<void>;
  
  // Permissions
  hasPermission: (action: SensitiveAction) => Promise<boolean>;
  requestPermission: (action: SensitiveAction, description: string) => Promise<boolean>;
  getApprovalStatus: (actionId: string) => Promise<boolean>;
  
  // Emergency Lock
  isEmergencyLocked: boolean;
  triggerEmergencyLock: (reason?: string) => Promise<void>;
  isActionAllowed: (action: string) => Promise<boolean>;
  
  // Security Context
  securityContext: SecurityContext | null;
  loading: boolean;
  error: string | null;
  
  // Statistics
  getStats: () => Promise<{
    permissions: any;
    emergencyLock: any;
  }>;
}

export const useSecurity = (): UseSecurityReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [securityContext, setSecurityContext] = useState<SecurityContext | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmergencyLocked, setIsEmergencyLocked] = useState(false);
  const [trustLevel, setTrustLevelState] = useState(50);
  const [deviceId, setDeviceId] = useState('');

  // Initialize security context
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        setLoading(true);
        setError(null);

        const context = await getSecurityContext();
        const emergencyLocked = await isEmergencyLockActive();
        const trust = await getTrustLevel();
        const device = await getOrCreateDeviceId();

        setSecurityContext(context);
        setIsAuthenticated(context.isAuthenticated);
        setIsEmergencyLocked(emergencyLocked);
        setTrustLevelState(trust);
        setDeviceId(device);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Security initialization failed';
        setError(errorMessage);
        console.error('Security initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeSecurity();
  }, []);

  // Authenticate with biometrics
  const authenticate = useCallback(async (prompt?: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await authenticateBiometric(prompt);
      setIsAuthenticated(success);
      
      if (!success) {
        setError('Biometric authentication failed');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication error';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Check if re-authentication is required
  const requiresReauth = useCallback(async (): Promise<boolean> => {
    try {
      if (!securityContext) return true;
      return await requiresReauthentication(securityContext.lastBiometricAuth);
    } catch (err) {
      console.error('Error checking re-auth requirement:', err);
      return true;
    }
  }, [securityContext]);

  // Update trust level
  const updateTrustLevel = useCallback(async (level: number, reason?: string): Promise<void> => {
    try {
      setError(null);
      // This would call the actual updateTrustLevel function from auth.ts
      // For now, just update local state
      setTrustLevelState(level);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update trust level';
      setError(errorMessage);
    }
  }, []);

  // Check permission for sensitive action
  const hasPermissionForAction = useCallback(async (action: SensitiveAction): Promise<boolean> => {
    try {
      setError(null);
      
      // Check emergency lock first
      if (isEmergencyLocked) {
        const allowed = await isActionAllowedDuringEmergency(action);
        if (!allowed) {
          setError('Action not allowed during emergency lock');
          return false;
        }
      }

      // Check permission using owner permissions
      const hasPermission = await hasPermission(deviceId, action, true);
      
      if (!hasPermission) {
        setError('Permission denied for this action');
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Permission check failed';
      setError(errorMessage);
      return false;
    }
  }, [isEmergencyLocked, deviceId]);

  // Request permission for sensitive action
  const requestPermission = useCallback(async (
    action: SensitiveAction, 
    description: string
  ): Promise<boolean> => {
    try {
      setError(null);

      // First authenticate user
      const authSuccess = await authenticate(`Authenticate to ${action}`);
      if (!authSuccess) {
        return false;
      }

      // Create owner approval (in production, this would send to actual owner)
      const actionId = `${action}_${Date.now()}`;
      await createOwnerApproval(actionId, description, action, deviceId, 4);

      Alert.alert(
        'Permission Requested',
        `${description}\n\nThis action requires owner approval and will expire in 4 hours.`,
        [{ text: 'OK' }]
      );

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Permission request failed';
      setError(errorMessage);
      return false;
    }
  }, [deviceId, authenticate]);

  // Get approval status
  const getApprovalStatus = useCallback(async (actionId: string): Promise<boolean> => {
    try {
      return await isApprovalValid(actionId);
    } catch (err) {
      console.error('Error checking approval status:', err);
      return false;
    }
  }, []);

  // Trigger emergency lock
  const triggerEmergencyLockAction = useCallback(async (reason?: string): Promise<void> => {
    try {
      setError(null);
      
      // Confirm with user
      Alert.alert(
        'Emergency Lock',
        'This will immediately lock the device and require owner verification to unlock. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Lock Device', 
            style: 'destructive',
            onPress: async () => {
              await triggerEmergencyLock(reason || 'Manual emergency lock');
              setIsEmergencyLocked(true);
              Alert.alert('Device Locked', 'Emergency lock has been activated. Owner verification required to unlock.');
            }
          }
        ]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger emergency lock';
      setError(errorMessage);
    }
  }, []);

  // Check if action is allowed
  const isActionAllowed = useCallback(async (action: string): Promise<boolean> => {
    try {
      return await isActionAllowedDuringEmergency(action);
    } catch (err) {
      console.error('Error checking action allowance:', err);
      return false;
    }
  }, []);

  // Get security statistics
  const getStats = useCallback(async () => {
    try {
      const [permissionStats, emergencyStats] = await Promise.all([
        getPermissionStats(),
        getEmergencyLockStats()
      ]);

      return {
        permissions: permissionStats,
        emergencyLock: emergencyStats
      };
    } catch (err) {
      console.error('Error getting security stats:', err);
      return {
        permissions: { totalApprovals: 0, activeApprovals: 0, pendingRequests: 0, expiredToday: 0 },
        emergencyLock: { isActive: false, triggeredBy: '', reason: '', triggeredAt: '', expiresAt: '', timeRemaining: 0 }
      };
    }
  }, []);

  return {
    // Authentication
    isAuthenticated,
    authenticate,
    requiresReauth,
    
    // Device Trust
    deviceId,
    trustLevel,
    updateTrustLevel,
    
    // Permissions
    hasPermission: hasPermissionForAction,
    requestPermission,
    getApprovalStatus,
    
    // Emergency Lock
    isEmergencyLocked,
    triggerEmergencyLock: triggerEmergencyLockAction,
    isActionAllowed,
    
    // Security Context
    securityContext,
    loading,
    error,
    
    // Statistics
    getStats
  };
};

/**
 * Higher-order component for protecting sensitive actions
 */
export const withSecurity = <P extends object>(
  Component: React.ComponentType<P>,
  requiredAction?: SensitiveAction
) => {
  return React.forwardRef<any, P>((props: P, ref: React.Ref<any>) => {
    const security = useSecurity();
    
    const handleAction = useCallback(async (action: () => void) => {
      if (requiredAction) {
        const hasPermission = await security.hasPermission(requiredAction);
        if (!hasPermission) {
          Alert.alert('Permission Denied', 'You do not have permission to perform this action.');
          return;
        }
      }
      
      const needsReauth = await security.requiresReauth();
      if (needsReauth) {
        const authenticated = await security.authenticate('Authentication required for this action');
        if (!authenticated) {
          return;
        }
      }
      
      action();
    }, [security, requiredAction]);
    
    return React.createElement(Component, { ...props, ref } as any);
  });
};

/**
 * Hook for protecting specific actions
 */
export const useSecureAction = (action: SensitiveAction) => {
  const security = useSecurity();

  const executeSecureAction = useCallback(async (
    actionFunction: () => void,
    options?: { skipAuth?: boolean }
  ) => {
    // Check emergency lock
    if (security.isEmergencyLocked) {
      const allowed = await security.isActionAllowed(action);
      if (!allowed) {
        Alert.alert('Action Blocked', 'This action is not allowed during emergency lock.');
        return;
      }
    }

    // Check permission
    const hasPermission = await security.hasPermission(action);
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'You do not have permission to perform this action.');
      return;
    }

    // Check re-authentication
    if (!options?.skipAuth) {
      const needsReauth = await security.requiresReauth();
      if (needsReauth) {
        const authenticated = await security.authenticate('Authentication required for this action');
        if (!authenticated) {
          return;
        }
      }
    }

    // Execute action
    try {
      actionFunction();
    } catch (error) {
      console.error('Secure action execution error:', error);
      Alert.alert('Action Failed', 'An error occurred while performing this action.');
    }
  }, [security, action]);

  return {
    executeSecureAction,
    isAllowed: security.hasPermission(action),
    isLocked: security.isEmergencyLocked
  };
};
