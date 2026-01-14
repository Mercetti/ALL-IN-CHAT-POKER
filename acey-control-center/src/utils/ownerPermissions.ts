/**
 * Time-Boxed Owner Permissions Utilities
 * Handles owner approvals, time-based permissions, and security validation
 */

import { OwnerApproval, PermissionRequest, SecurityContext, SensitiveAction } from '../types/auth';
import { storeSecureItem, getSecureItem, removeSecureItem, getSecurityContext } from './auth';

// Storage keys for owner permissions
const PERMISSION_KEYS = {
  APPROVAL_PREFIX: 'approval_',
  REQUEST_PREFIX: 'request_',
  ACTIVE_PERMISSIONS: 'active_permissions',
  OWNER_VERIFIED: 'owner_verified',
} as const;

/**
 * Create a new owner approval
 */
export const createOwnerApproval = async (
  actionId: string,
  description: string,
  actionType: SensitiveAction,
  deviceId: string,
  hoursValid: number = 4
): Promise<OwnerApproval> => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + hoursValid * 60 * 60 * 1000);
    
    const approval: OwnerApproval = {
      actionId,
      description,
      approved: true,
      expiresAt: expiresAt.toISOString(),
      approvedBy: 'owner', // In production, this would be actual owner ID
      approvedAt: now.toISOString(),
      actionType,
      deviceId,
    };

    // Store approval securely
    const approvalKey = `${PERMISSION_KEYS.APPROVAL_PREFIX}${actionId}`;
    await storeSecureItem(approvalKey, JSON.stringify(approval), {
      expiresAt: expiresAt.toISOString(),
    });

    // Add to active permissions
    await addActivePermission(actionId, actionType, expiresAt.toISOString());

    return approval;
  } catch (error) {
    console.error('Error creating owner approval:', error);
    throw new Error('Failed to create owner approval');
  }
};

/**
 * Check if an approval is still valid
 */
export const isApprovalValid = async (actionId: string): Promise<boolean> => {
  try {
    const approvalKey = `${PERMISSION_KEYS.APPROVAL_PREFIX}${actionId}`;
    const approvalData = await getSecureItem(approvalKey);
    
    if (!approvalData) return false;

    const approval: OwnerApproval = JSON.parse(approvalData);
    const now = new Date();
    const expiresAt = new Date(approval.expiresAt);

    return approval.approved && now <= expiresAt;
  } catch (error) {
    console.error('Error checking approval validity:', error);
    return false;
  }
};

/**
 * Get approval details
 */
export const getApproval = async (actionId: string): Promise<OwnerApproval | null> => {
  try {
    const approvalKey = `${PERMISSION_KEYS.APPROVAL_PREFIX}${actionId}`;
    const approvalData = await getSecureItem(approvalKey);
    
    if (!approvalData) return null;

    const approval: OwnerApproval = JSON.parse(approvalData);
    
    // Check if approval has expired
    if (!isApprovalValid(actionId)) {
      await expireApproval(approval);
      return null;
    }

    return approval;
  } catch (error) {
    console.error('Error getting approval:', error);
    return null;
  }
};

/**
 * Expire an approval immediately
 */
export const expireApproval = async (approval: OwnerApproval): Promise<OwnerApproval> => {
  try {
    const expiredApproval: OwnerApproval = {
      ...approval,
      approved: false,
    };

    // Update stored approval
    const approvalKey = `${PERMISSION_KEYS.APPROVAL_PREFIX}${approval.actionId}`;
    await storeSecureItem(approvalKey, JSON.stringify(expiredApproval));

    // Remove from active permissions
    await removeActivePermission(approval.actionId);

    return expiredApproval;
  } catch (error) {
    console.error('Error expiring approval:', error);
    throw new Error('Failed to expire approval');
  }
};

/**
 * Create a permission request
 */
export const createPermissionRequest = async (
  deviceId: string,
  action: string,
  description: string,
  hoursValid: number = 24
): Promise<PermissionRequest> => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + hoursValid * 60 * 60 * 1000);
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request: PermissionRequest = {
      id: requestId,
      deviceId,
      action,
      description,
      requestedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'pending',
    };

    // Store request
    const requestKey = `${PERMISSION_KEYS.REQUEST_PREFIX}${requestId}`;
    await storeSecureItem(requestKey, JSON.stringify(request), {
      expiresAt: expiresAt.toISOString(),
    });

    return request;
  } catch (error) {
    console.error('Error creating permission request:', error);
    throw new Error('Failed to create permission request');
  }
};

/**
 * Approve a permission request
 */
export const approvePermissionRequest = async (
  requestId: string,
  approvedBy: string
): Promise<PermissionRequest> => {
  try {
    const requestKey = `${PERMISSION_KEYS.REQUEST_PREFIX}${requestId}`;
    const requestData = await getSecureItem(requestKey);
    
    if (!requestData) {
      throw new Error('Permission request not found');
    }

    const request: PermissionRequest = JSON.parse(requestData);
    
    // Check if request has expired
    const now = new Date();
    const expiresAt = new Date(request.expiresAt);
    if (now > expiresAt) {
      throw new Error('Permission request has expired');
    }

    // Update request status
    const approvedRequest: PermissionRequest = {
      ...request,
      status: 'approved',
      approvedBy,
      approvedAt: now.toISOString(),
    };

    await storeSecureItem(requestKey, JSON.stringify(approvedRequest));

    // Create corresponding owner approval
    await createOwnerApproval(
      requestId,
      request.description,
      'llm_orchestration', // Default action type
      request.deviceId,
      4 // 4 hours validity
    );

    return approvedRequest;
  } catch (error) {
    console.error('Error approving permission request:', error);
    throw error;
  }
};

/**
 * Check if device has permission for a specific action
 */
export const hasPermission = async (
  deviceId: string,
  action: SensitiveAction,
  requireOwnerApproval: boolean = true
): Promise<boolean> => {
  try {
    // Get security context
    const securityContext = await getSecurityContext();
    
    // Check emergency lock
    if (securityContext.emergencyLockActive) {
      return false;
    }

    // Check trust level
    if (securityContext.trustLevel < 50) {
      return false;
    }

    // If owner approval is not required, check basic permissions
    if (!requireOwnerApproval) {
      return securityContext.isAuthenticated && securityContext.trustLevel >= 70;
    }

    // Check for active owner approval
    const activePermissions = await getActivePermissions();
    const hasActiveApproval = activePermissions.some(permission => 
      permission.actionType === action && 
      permission.deviceId === deviceId &&
      new Date(permission.expiresAt) > new Date()
    );

    return hasActiveApproval;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Add permission to active permissions list
 */
export const addActivePermission = async (
  actionId: string,
  actionType: SensitiveAction,
  expiresAt: string
): Promise<void> => {
  try {
    const activePermissions = await getActivePermissions();
    
    const newPermission = {
      actionId,
      actionType,
      expiresAt,
      addedAt: new Date().toISOString(),
    };

    const updatedPermissions = [...activePermissions, newPermission];
    
    // Remove expired permissions
    const validPermissions = updatedPermissions.filter(permission => 
      new Date(permission.expiresAt) > new Date()
    );

    await storeSecureItem(PERMISSION_KEYS.ACTIVE_PERMISSIONS, JSON.stringify(validPermissions));
  } catch (error) {
    console.error('Error adding active permission:', error);
    throw error;
  }
};

/**
 * Get all active permissions
 */
export const getActivePermissions = async (): Promise<any[]> => {
  try {
    const permissionsData = await getSecureItem(PERMISSION_KEYS.ACTIVE_PERMISSIONS);
    return permissionsData ? JSON.parse(permissionsData) : [];
  } catch (error) {
    console.error('Error getting active permissions:', error);
    return [];
  }
};

/**
 * Remove permission from active permissions
 */
export const removeActivePermission = async (actionId: string): Promise<void> => {
  try {
    const activePermissions = await getActivePermissions();
    const updatedPermissions = activePermissions.filter(permission => 
      permission.actionId !== actionId
    );

    await storeSecureItem(PERMISSION_KEYS.ACTIVE_PERMISSIONS, JSON.stringify(updatedPermissions));
  } catch (error) {
    console.error('Error removing active permission:', error);
    throw error;
  }
};

/**
 * Clean up expired permissions and approvals
 */
export const cleanupExpiredPermissions = async (): Promise<number> => {
  try {
    let cleanedCount = 0;
    const now = new Date();
    
    // Clean up active permissions
    const activePermissions = await getActivePermissions();
    const validPermissions = activePermissions.filter(permission => {
      const isValid = new Date(permission.expiresAt) > now;
      if (!isValid) cleanedCount++;
      return isValid;
    });

    await storeSecureItem(PERMISSION_KEYS.ACTIVE_PERMISSIONS, JSON.stringify(validPermissions));

    // Clean up expired approvals (this would be done automatically by secure storage expiration)
    // But we can also manually check and remove any that might have been missed
    const securityContext = await getSecurityContext();
    if (securityContext.deviceId) {
      // In a real implementation, we would iterate through all approval keys
      // and remove expired ones. For now, this is handled by secure storage expiration.
    }

    return cleanedCount;
  } catch (error) {
    console.error('Error cleaning up expired permissions:', error);
    return 0;
  }
};

/**
 * Verify owner identity
 */
export const verifyOwner = async (ownerId: string, verificationCode: string): Promise<boolean> => {
  try {
    // In a real implementation, this would verify against a secure backend
    // For now, we'll store a simple verification flag
    
    const verificationKey = `${PERMISSION_KEYS.OWNER_VERIFIED}_${ownerId}`;
    const isVerified = await getSecureItem(verificationKey);
    
    if (isVerified === 'true') {
      return true;
    }

    // Simulate verification process
    // In production, this would involve cryptographic verification
    const isValid = verificationCode.length > 8; // Simple validation for demo
    
    if (isValid) {
      await storeSecureItem(verificationKey, 'true', {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      });
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying owner:', error);
    return false;
  }
};

/**
 * Get permission statistics
 */
export const getPermissionStats = async (): Promise<{
  totalApprovals: number;
  activeApprovals: number;
  pendingRequests: number;
  expiredToday: number;
}> => {
  try {
    const activePermissions = await getActivePermissions();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Count active approvals
    const activeApprovals = activePermissions.filter(permission => 
      new Date(permission.expiresAt) > now
    ).length;

    // In a real implementation, we would count total approvals and pending requests
    // For now, return simulated data
    return {
      totalApprovals: activePermissions.length + 5, // Simulated total
      activeApprovals,
      pendingRequests: 2, // Simulated pending
      expiredToday: 1, // Simulated expired
    };
  } catch (error) {
    console.error('Error getting permission stats:', error);
    return {
      totalApprovals: 0,
      activeApprovals: 0,
      pendingRequests: 0,
      expiredToday: 0,
    };
  }
};
