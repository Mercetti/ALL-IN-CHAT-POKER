import { SkillRegistry } from './SkillRegistry';

export interface PermissionEntry {
  skillId: string;
  allowedRoles: string[];
  requiredTier?: 'Pro' | 'Creator+' | 'Enterprise';
  maxUsagePerDay?: number;
  requiresApproval?: boolean;
}

export const PermissionMatrix: PermissionEntry[] = [
  { skillId: 'audioMaestro', allowedRoles: ['owner', 'user'], maxUsagePerDay: 50 },
  { skillId: 'graphicsWizard', allowedRoles: ['owner', 'user'], maxUsagePerDay: 30 },
  { skillId: 'codeHelper', allowedRoles: ['owner'], requiredTier: 'Creator+', maxUsagePerDay: 100 },
  { skillId: 'contentOptimizer', allowedRoles: ['owner', 'dev'], requiredTier: 'Creator+', maxUsagePerDay: 25 },
  { skillId: 'dataAnalyzer', allowedRoles: ['owner'], requiredTier: 'Enterprise', maxUsagePerDay: 10, requiresApproval: true },
  { skillId: 'workflowAutomator', allowedRoles: ['owner'], requiredTier: 'Enterprise', maxUsagePerDay: 5, requiresApproval: true },
];

export function hasPermission(skillId: string, userRole: string, userTier?: string): boolean {
  const permission = PermissionMatrix.find(p => p.skillId === skillId);
  if (!permission) return false;
  
  // Check role access
  if (!permission.allowedRoles.includes(userRole)) return false;
  
  // Check tier requirement
  if (permission.requiredTier && userTier) {
    const tierHierarchy = { 'Pro': 1, 'Creator+': 2, 'Enterprise': 3 };
    const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy];
    const requiredTierLevel = tierHierarchy[permission.requiredTier];
    
    if (userTierLevel < requiredTierLevel) return false;
  }
  
  return true;
}

export function canUseSkill(skillId: string, userRole: string, userTier?: string, currentUsage?: number): {
  canUse: boolean;
  reason?: string;
} {
  if (!hasPermission(skillId, userRole, userTier)) {
    return { canUse: false, reason: 'Insufficient permissions or tier' };
  }
  
  const permission = PermissionMatrix.find(p => p.skillId === skillId);
  if (!permission) return { canUse: false, reason: 'Skill not found in permission matrix' };
  
  if (permission.maxUsagePerDay && currentUsage && currentUsage >= permission.maxUsagePerDay) {
    return { canUse: false, reason: `Daily usage limit of ${permission.maxUsagePerDay} reached` };
  }
  
  if (permission.requiresApproval) {
    return { canUse: false, reason: 'This skill requires approval before use' };
  }
  
  return { canUse: true };
}

export function getSkillPermissions(skillId: string): PermissionEntry | undefined {
  return PermissionMatrix.find(p => p.skillId === skillId);
}

export function getUserPermissions(userRole: string, userTier?: string): PermissionEntry[] {
  return PermissionMatrix.filter(permission => {
    if (!permission.allowedRoles.includes(userRole)) return false;
    
    if (permission.requiredTier && userTier) {
      const tierHierarchy = { 'Pro': 1, 'Creator+': 2, 'Enterprise': 3 };
      const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy];
      const requiredTierLevel = tierHierarchy[permission.requiredTier];
      
      return userTierLevel >= requiredTierLevel;
    }
    
    return true;
  });
}
