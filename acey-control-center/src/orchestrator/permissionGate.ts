/**
 * Skill Permission Gate
 * Enforces tier, purchase, and permission requirements
 */

import { User } from '../types/upgrade';
import { getSkillById } from './aceyOrchestrator';

export class SkillLockedError extends Error {
  constructor(
    public skill: string,
    public reason: string,
    public requiredTier?: string
  ) {
    super(`🔒 ${skill} is locked. ${reason}`);
    this.name = 'SkillLockedError';
  }
}

export interface PermissionCheck {
  skillId: string;
  allowed: boolean;
  reason?: string;
  requiredTier?: string;
}

/**
 * Check if user has permission to use required skills
 */
export async function checkPermissions(
  user: User,
  requiredSkills: string[]
): Promise<string[]> {
  const permissions: string[] = [];
  
  for (const skillId of requiredSkills) {
    const skill = getSkillById(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }
    
    const check = await checkSingleSkillPermission(user, skill);
    if (!check.allowed) {
      throw new SkillLockedError(
        skill.name,
        check.reason || 'Permission denied',
        check.requiredTier
      );
    }
    
    permissions.push(...skill.permissions);
  }
  
  return [...new Set(permissions)]; // Remove duplicates
}

/**
 * Check permission for a single skill
 */
async function checkSingleSkillPermission(
  user: User,
  skill: any
): Promise<PermissionCheck> {
  // Check tier requirements
  const tierHierarchy = {
    'Free': 0,
    'Pro': 1,
    'Creator+': 2,
    'Enterprise': 3
  };
  
  const userTierLevel = tierHierarchy[user.tierId as keyof typeof tierHierarchy] || 0;
  const requiredTierLevel = tierHierarchy[skill.tier as keyof typeof tierHierarchy] || 0;
  
  if (userTierLevel < requiredTierLevel) {
    return {
      skillId: skill.id,
      allowed: false,
      reason: `Requires ${skill.tier} tier or higher`,
      requiredTier: skill.tier
    };
  }
  
  // Check if skill is installed (for paid skills)
  // This would integrate with your skill installation system
  const installedSkills = await getUserInstalledSkills(user.id);
  if (!installedSkills.includes(skill.id) && skill.tier !== 'Free') {
    return {
      skillId: skill.id,
      allowed: false,
      reason: 'Skill must be installed from Skill Store'
    };
  }
  
  // Check trial access
  const hasTrialAccess = await checkTrialAccess(user.id, skill.id);
  if (!hasTrialAccess && !installedSkills.includes(skill.id)) {
    return {
      skillId: skill.id,
      allowed: false,
      reason: 'Trial period expired or not available'
    };
  }
  
  // Check enterprise overrides
  const hasEnterpriseOverride = await checkEnterpriseOverride(user.id, skill.id);
  if (hasEnterpriseOverride) {
    return {
      skillId: skill.id,
      allowed: true
    };
  }
  
  return {
    skillId: skill.id,
    allowed: true
  };
}

/**
 * Get user's installed skills
 */
async function getUserInstalledSkills(userId: string): Promise<string[]> {
  // This would integrate with your existing skill installation system
  // For now, return mock data
  try {
    // const response = await api.getInstalledSkills(userId);
    // return response.skills.map(skill => skill.id);
    
    // Mock implementation
    return ['code_helper', 'link_review']; // Example installed skills
  } catch (error) {
    console.error('Error getting installed skills:', error);
    return [];
  }
}

/**
 * Check if user has trial access to skill
 */
async function checkTrialAccess(userId: string, skillId: string): Promise<boolean> {
  // This would integrate with your trial system
  // For now, return true for demo purposes
  return true;
}

/**
 * Check enterprise override permissions
 */
async function checkEnterpriseOverride(userId: string, skillId: string): Promise<boolean> {
  // This would integrate with your enterprise permission system
  // For now, return false
  return false;
}

/**
 * Get available skills for user tier
 */
export async function getAvailableSkillsForTier(userTier: string): Promise<any[]> {
  const tierHierarchy = {
    'Free': 0,
    'Pro': 1,
    'Creator+': 2,
    'Enterprise': 3
  };
  
  const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
  const allSkills = getSkillById ? [] : []; // Would get from orchestrator
  
  return allSkills.filter((skill: any) => {
    const requiredTierLevel = tierHierarchy[skill.tier as keyof typeof tierHierarchy] || 0;
    return userTierLevel >= requiredTierLevel;
  });
}

/**
 * Check if user can access specific feature
 */
export async function canAccessFeature(
  userId: string,
  feature: string
): Promise<boolean> {
  // This would check specific feature permissions
  // For now, return true
  return true;
}

export default {
  checkPermissions,
  getAvailableSkillsForTier,
  canAccessFeature,
  SkillLockedError
};
