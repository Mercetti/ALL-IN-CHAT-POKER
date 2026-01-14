/**
 * Authentication and Device Trust TypeScript Interfaces
 * Defines types for secure authentication, device pairing, and permissions
 */

export interface Device {
  id: string;
  name: string;
  paired: boolean;
  trustLevel: number; // 0-100
  lastActive: string; // ISO timestamp
  ownerVerified: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: string; // iOS, Android, etc.
  version: string;
}

export interface OwnerApproval {
  actionId: string;
  description: string;
  approved: boolean;
  expiresAt: string; // ISO timestamp for time-boxed permissions
  approvedBy: string; // Owner ID
  approvedAt: string; // ISO timestamp
  actionType: 'skill_install' | 'tier_upgrade' | 'llm_orchestration' | 'emergency_action' | 'device_pairing';
  deviceId: string; // Device that requested approval
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  method: 'biometric' | 'passcode' | 'none';
  supported: boolean;
  enrolled: boolean;
}

export interface SecureStorageItem {
  key: string;
  value: string;
  requiresAuth: boolean;
  expiresAt?: string;
}

export interface EmergencyLock {
  active: boolean;
  triggeredAt: string;
  triggeredBy: string; // Device ID or remote trigger
  reason: string;
  requiresOwnerUnlock: boolean;
  expiresAt?: string;
}

export interface DevicePairingRequest {
  deviceId: string;
  deviceName: string;
  qrCode: string;
  expiresAt: string;
  requestedBy: string;
  trustLevel: number;
}

export interface AuthSession {
  id: string;
  deviceId: string;
  authenticatedAt: string;
  expiresAt: string;
  requiresReauth: boolean;
  lastActivity: string;
  permissions: string[];
}

export interface SecurityConfig {
  requireBiometricForSensitive: boolean;
  sessionTimeoutMinutes: number;
  maxDevicesPerOwner: number;
  emergencyLockEnabled: boolean;
  timeBoxedApprovalHours: number;
  minimumTrustLevel: number;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  deviceId: string;
  action: string;
  result: 'success' | 'failure' | 'blocked';
  details: string;
  requiresAttention: boolean;
}

export interface TrustLevelUpdate {
  deviceId: string;
  oldLevel: number;
  newLevel: number;
  reason: string;
  updatedBy: string;
  updatedAt: string;
}

export interface PermissionRequest {
  id: string;
  deviceId: string;
  action: string;
  description: string;
  requestedAt: string;
  expiresAt: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  approvedBy?: string;
  approvedAt?: string;
}

// Type guards and utility types
export type SensitiveAction = 'skill_install' | 'tier_upgrade' | 'llm_orchestration' | 'emergency_action' | 'device_pairing';

export interface SecurityContext {
  isAuthenticated: boolean;
  deviceId: string;
  trustLevel: number;
  permissions: string[];
  sessionExpiresAt: string;
  emergencyLockActive: boolean;
  lastBiometricAuth: string;
}

export interface AuthChallenge {
  type: 'biometric' | 'passcode' | 'owner_approval';
  reason: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
}
