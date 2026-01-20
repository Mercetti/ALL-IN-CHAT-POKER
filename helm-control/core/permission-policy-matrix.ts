/**
 * Helm Control Permission Policy Matrix
 * Defines who can trigger each skill and under what conditions
 */

import { PermissionPolicy, PERMISSION_LEVELS, USER_TIERS, EXECUTION_CONTEXTS } from '../interfaces/skill-registry-v2';

export interface PermissionMatrix {
  skillId: string;
  allowedRoles: string[];
  allowedTiers: string[];
  allowedContexts: string[];
  restrictions: string[];
  approvalRequired: boolean;
  auditLevel: 'minimal' | 'standard' | 'verbose';
}

export const HELM_PERMISSION_MATRIX: PermissionMatrix[] = [
  // ===== CODE GENERATION =====
  {
    skillId: 'code-generation',
    allowedRoles: [PERMISSION_LEVELS.OWNER, PERMISSION_LEVELS.ADMIN],
    allowedTiers: [USER_TIERS.PRO, USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL],
    restrictions: [
      'No direct production deployment without approval',
      'Code execution requires sandbox isolation',
      'No access to production databases'
    ],
    approvalRequired: true,
    auditLevel: 'verbose'
  },

  // ===== AUDIO PROCESSING =====
  {
    skillId: 'audio-processor',
    allowedRoles: [PERMISSION_LEVELS.OWNER, PERMISSION_LEVELS.ADMIN, PERMISSION_LEVELS.USER],
    allowedTiers: [USER_TIERS.PRO, USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL, EXECUTION_CONTEXTS.ALL_IN_CHAT_POKER],
    restrictions: [
      'Commercial audio requires enterprise tier',
      'No redistribution of copyrighted material',
      'Processing limits apply per tier'
    ],
    approvalRequired: false,
    auditLevel: 'standard'
  },

  // ===== GRAPHICS & MEDIA =====
  {
    skillId: 'graphics-engine',
    allowedRoles: [PERMISSION_LEVELS.OWNER, PERMISSION_LEVELS.ADMIN, PERMISSION_LEVELS.USER],
    allowedTiers: [USER_TIERS.PRO, USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL, EXECUTION_CONTEXTS.ALL_IN_CHAT_POKER],
    restrictions: [
      'High-resolution output requires enterprise tier',
      'No generation of copyrighted characters',
      'Resource limits enforced per tier'
    ],
    approvalRequired: false,
    auditLevel: 'standard'
  },

  // ===== WEB MANAGEMENT =====
  {
    skillId: 'web-manager',
    allowedRoles: [PERMISSION_LEVELS.OWNER, PERMISSION_LEVELS.ADMIN],
    allowedTiers: [USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL],
    restrictions: [
      'Production changes require owner approval',
      'No access to critical infrastructure',
      'Changes limited to assigned domains'
    ],
    approvalRequired: true,
    auditLevel: 'verbose'
  },

  // ===== ANALYTICS =====
  {
    skillId: 'analytics-engine',
    allowedRoles: [PERMISSION_LEVELS.OWNER, PERMISSION_LEVELS.ADMIN, PERMISSION_LEVELS.USER],
    allowedTiers: [USER_TIERS.PRO, USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL, EXECUTION_CONTEXTS.ALL_IN_CHAT_POKER],
    restrictions: [
      'No access to other tenant data',
      'PII data requires special handling',
      'Export limits apply per tier'
    ],
    approvalRequired: false,
    auditLevel: 'standard'
  },

  // ===== PARTNER INTEGRATION =====
  {
    skillId: 'partner-integration',
    allowedRoles: [PERMISSION_LEVELS.OWNER, PERMISSION_LEVELS.ADMIN],
    allowedTiers: [USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL],
    restrictions: [
      'External API keys require owner approval',
      'No sharing of credentials between tenants',
      'Rate limiting enforced'
    ],
    approvalRequired: true,
    auditLevel: 'verbose'
  },

  // ===== FINANCIAL OPERATIONS =====
  {
    skillId: 'financial-processor',
    allowedRoles: [PERMISSION_LEVELS.OWNER],
    allowedTiers: [USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL],
    restrictions: [
      'Dual approval required for all transactions',
      'No automatic payouts without verification',
      'Compliance reporting mandatory'
    ],
    approvalRequired: true,
    auditLevel: 'verbose'
  },

  // ===== MULTI-SITE MANAGEMENT =====
  {
    skillId: 'multi-site-manager',
    allowedRoles: [PERMISSION_LEVELS.OWNER, PERMISSION_LEVELS.ADMIN],
    allowedTiers: [USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL],
    restrictions: [
      'Cross-site operations require approval',
      'No access to unrelated sites',
      'Changes limited to managed domains'
    ],
    approvalRequired: true,
    auditLevel: 'standard'
  },

  // ===== SECURITY & COMPLIANCE =====
  {
    skillId: 'security-monitor',
    allowedRoles: [PERMISSION_LEVELS.OWNER, PERMISSION_LEVELS.ADMIN],
    allowedTiers: [USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL],
    restrictions: [
      'Security policy changes require owner approval',
      'No modification of audit logs',
      'Compliance data read-only'
    ],
    approvalRequired: true,
    auditLevel: 'verbose'
  },

  // ===== WHITE-LABEL SOLUTIONS =====
  {
    skillId: 'white-label-engine',
    allowedRoles: [PERMISSION_LEVELS.OWNER],
    allowedTiers: [USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL],
    restrictions: [
      'Brand assets require verification',
      'No removal of Helm Control branding',
      'License validation required'
    ],
    approvalRequired: true,
    auditLevel: 'verbose'
  },

  // ===== INTERNAL HELM CONTROL SKILLS =====
  
  // Orchestration
  {
    skillId: 'helm-orchestrator',
    allowedRoles: [PERMISSION_LEVELS.OWNER],
    allowedTiers: [USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL],
    restrictions: [
      'Core system modifications require owner approval',
      'No access to user data',
      'System-wide changes require verification'
    ],
    approvalRequired: true,
    auditLevel: 'verbose'
  },

  // Memory Management
  {
    skillId: 'memory-manager',
    allowedRoles: [PERMISSION_LEVELS.OWNER, PERMISSION_LEVELS.ADMIN],
    allowedTiers: [USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL],
    restrictions: [
      'Data deletion requires owner approval',
      'No access to encrypted user data',
      'Backup policies must be maintained'
    ],
    approvalRequired: false,
    auditLevel: 'standard'
  },

  // Self-Healing
  {
    skillId: 'self-healing',
    allowedRoles: [PERMISSION_LEVELS.OWNER, PERMISSION_LEVELS.ADMIN],
    allowedTiers: [USER_TIERS.ENTERPRISE],
    allowedContexts: [EXECUTION_CONTEXTS.HELM_CONTROL],
    restrictions: [
      'Critical system changes require approval',
      'No modification of core security settings',
      'Recovery actions must be logged'
    ],
    approvalRequired: false,
    auditLevel: 'verbose'
  }
];

export class PermissionPolicyManager {
  private matrix: Map<string, PermissionMatrix> = new Map();

  constructor() {
    HELM_PERMISSION_MATRIX.forEach(entry => {
      this.matrix.set(entry.skillId, entry);
    });
  }

  /**
   * Check if a user can execute a skill
   */
  canExecuteSkill(
    skillId: string, 
    userRole: string, 
    userTier: string, 
    context: string
  ): { allowed: boolean; reason?: string; restrictions?: string[] } {
    const policy = this.matrix.get(skillId);
    if (!policy) {
      return { allowed: false, reason: 'Skill not found in permission matrix' };
    }

    // Check role
    if (!policy.allowedRoles.includes(userRole)) {
      return { 
        allowed: false, 
        reason: `Role ${userRole} not allowed for skill ${skillId}` 
      };
    }

    // Check tier
    if (!policy.allowedTiers.includes(userTier)) {
      return { 
        allowed: false, 
        reason: `Tier ${userTier} not allowed for skill ${skillId}` 
      };
    }

    // Check context
    if (!policy.allowedContexts.includes(context)) {
      return { 
        allowed: false, 
        reason: `Context ${context} not allowed for skill ${skillId}` 
      };
    }

    return { 
      allowed: true, 
      restrictions: policy.restrictions 
    };
  }

  /**
   * Get approval requirements for a skill
   */
  getApprovalRequirements(skillId: string): {
    requiresApproval: boolean;
    approvers: string[];
    auditLevel: string;
  } | null {
    const policy = this.matrix.get(skillId);
    if (!policy) return null;

    return {
      requiresApproval: policy.approvalRequired,
      approvers: policy.approvalRequired ? [PERMISSION_LEVELS.OWNER] : [],
      auditLevel: policy.auditLevel
    };
  }

  /**
   * Get all skills a user can access
   */
  getAccessibleSkills(userRole: string, userTier: string): string[] {
    const accessibleSkills: string[] = [];

    for (const [skillId, policy] of this.matrix) {
      if (policy.allowedRoles.includes(userRole) && policy.allowedTiers.includes(userTier)) {
        accessibleSkills.push(skillId);
      }
    }

    return accessibleSkills;
  }

  /**
   * Get audit requirements for a skill execution
   */
  getAuditRequirements(skillId: string): {
    level: string;
    logTypes: string[];
    retention: string;
  } | null {
    const policy = this.matrix.get(skillId);
    if (!policy) return null;

    return {
      level: policy.auditLevel,
      logTypes: this.getAuditLogTypes(policy.auditLevel),
      retention: this.getAuditRetention(policy.auditLevel)
    };
  }

  private getAuditLogTypes(level: string): string[] {
    switch (level) {
      case 'minimal':
        return ['execution', 'error'];
      case 'standard':
        return ['execution', 'error', 'permission', 'resource'];
      case 'verbose':
        return ['execution', 'error', 'permission', 'resource', 'system', 'security'];
      default:
        return ['execution', 'error'];
    }
  }

  private getAuditRetention(level: string): string {
    switch (level) {
      case 'minimal':
        return '30 days';
      case 'standard':
        return '1 year';
      case 'verbose':
        return '7 years';
      default:
        return '1 year';
    }
  }
}
