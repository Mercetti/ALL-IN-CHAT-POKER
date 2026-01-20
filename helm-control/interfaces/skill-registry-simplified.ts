/**
 * Helm Control Skill Registry v2 - Simplified Interface
 * TypeScript interfaces for JSON template consumption
 */

export interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  permissions: Array<"owner" | "admin" | "developer" | "creator" | "user">;
  learningBoundaries: {
    autoImprove: boolean;
    locked: string[];
  };
  loggingPriority: "critical" | "info" | "debug";
  orchestrationFallback: string[];
  integration: string[];
  metadata: {
    author: string;
    lastUpdated: string;
  };
}

export interface SkillRegistry {
  engineName: string;
  version: string;
  skills: Skill[];
}

export interface SkillRegistryTemplate {
  engineName: string;
  version: string;
  skills: Skill[];
  schema: {
    version: string;
    requiredFields: string[];
    optionalFields: string[];
    validationRules: Record<string, string>;
  };
  deployment: {
    engineName: string;
    version: string;
    compatibility: {
      node: string;
      memory: string;
      storage: string;
    };
    installation: {
      steps: string[];
      estimatedTime: string;
    };
  };
}

// Example registry instantiation from JSON template
export const createSkillRegistry = (jsonTemplate: any): SkillRegistry => {
  return {
    engineName: jsonTemplate.engineName,
    version: jsonTemplate.version,
    skills: jsonTemplate.skills.map((skill: any) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      version: skill.version,
      permissions: skill.permissions,
      learningBoundaries: skill.learningBoundaries,
      loggingPriority: skill.loggingPriority,
      orchestrationFallback: skill.orchestrationFallback,
      integration: skill.integration,
      metadata: skill.metadata
    }))
  };
};

// Skill validation
export const validateSkill = (skill: Skill): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!skill.id || skill.id.trim() === '') {
    errors.push('Skill ID is required');
  }
  
  if (!skill.name || skill.name.trim() === '') {
    errors.push('Skill name is required');
  }
  
  if (!skill.version || skill.version.trim() === '') {
    errors.push('Version is required');
  }
  
  if (!skill.permissions || skill.permissions.length === 0) {
    errors.push('At least one permission is required');
  }
  
  const validPermissions = ['owner', 'admin', 'developer', 'creator', 'user'];
  const invalidPermissions = skill.permissions.filter(p => !validPermissions.includes(p));
  if (invalidPermissions.length > 0) {
    errors.push(`Invalid permissions: ${invalidPermissions.join(', ')}`);
  }
  
  const validLoggingPriorities = ['critical', 'info', 'debug'];
  if (!validLoggingPriorities.includes(skill.loggingPriority)) {
    errors.push(`Invalid logging priority: ${skill.loggingPriority}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Permission checking
export const checkSkillPermission = (
  skill: Skill, 
  userRole: string, 
  userTier: string
): { allowed: boolean; reason?: string } => {
  const roleHierarchy = ['owner', 'admin', 'developer', 'creator', 'user'];
  const tierHierarchy = ['enterprise', 'pro', 'free'];
  
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const skillRoleIndex = roleHierarchy.indexOf(skill.permissions[0]);
  
  if (userRoleIndex === -1 || skillRoleIndex === -1) {
    return { allowed: false, reason: 'Invalid role or permission' };
  }
  
  if (userRoleIndex > skillRoleIndex) {
    return { allowed: false, reason: `Role ${userRole} not allowed for skill ${skill.name}` };
  }
  
  return { allowed: true };
};

// Learning boundary enforcement
export const enforceLearningBoundaries = (
  skill: Skill, 
  action: string, 
  data?: any
): { allowed: boolean; reason?: string } => {
  if (skill.learningBoundaries.locked.includes(action)) {
    return { 
      allowed: false, 
      reason: `Action ${action} is locked for skill ${skill.name}` 
    };
  }
  
  if (!skill.learningBoundaries.autoImprove && data) {
    return { 
      allowed: false, 
      reason: `Skill ${skill.name} does not allow learning/improvement` 
    };
  }
  
  return { allowed: true };
};

// Orchestration fallback handling
export const selectOrchestrationLLM = (
  skill: Skill, 
  primaryLLM: string, 
  fallbackLLMs: string[]
): string => {
  if (skill.orchestrationFallback.includes(primaryLLM)) {
    return primaryLLM;
  }
  
  // Return first available fallback
  for (const fallback of skill.orchestrationFallback) {
    if (fallbackLLMs.includes(fallback)) {
      return fallback;
    }
  }
  
  return primaryLLM; // Fallback to primary if no fallbacks available
};
