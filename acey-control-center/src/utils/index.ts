/**
 * Utils Index - Exports all utility functions
 * This file wires together all existing utilities
 */

// Export existing utilities (these are already implemented)
export {
  // Auth utilities
  authenticateBiometric,
  storeSecureItem,
  getSecureItem,
  removeSecureItem,
  getOrCreateDeviceId,
  checkBiometricSupport,
  updateTrustLevel,
  getTrustLevel,
  getSecurityContext,
  requiresReauthentication,
  createAuthChallenge,
  validateAuthChallenge,
} from './auth';

export {
  // Owner permissions utilities
  createOwnerApproval,
  isApprovalValid,
  getApproval,
  expireApproval,
  createPermissionRequest,
  approvePermissionRequest,
  hasPermission,
  addActivePermission,
  getActivePermissions,
  removeActivePermission,
  cleanupExpiredPermissions,
  verifyOwner,
  getPermissionStats,
} from './ownerPermissions';

export {
  // Emergency lock utilities
  triggerEmergencyLock,
  triggerRemoteEmergencyLock,
  isEmergencyLockActive,
  getEmergencyLockDetails,
  clearEmergencyLock,
  isActionAllowedDuringEmergency,
  checkSecurityConditions,
  detectSuspiciousActivity,
  getFailedAuthAttempts,
  verifyAdminToken,
  verifyOwnerIdentity,
  getEmergencyLockStats,
  scheduleEmergencyLock,
} from './emergencyLock';

// Export new review memory utilities
export {
  storeApprovedReview,
  getApprovedReviews,
  clearApprovedReviews,
  getLearningPatterns,
  getEffectivePatterns,
  updatePatternEffectiveness,
  getReviewStats,
  getPatternsByCategory,
  searchPatterns,
  exportLearningData,
} from './reviewMemory';

// Placeholder exports for other utilities
// export * from './permissions';
// export * from './deviceTrust';
// export * from './securityAudit';
