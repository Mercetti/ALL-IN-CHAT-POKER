/**
 * Helm Control Skill Registry v2
 * Core orchestration engine for skill management, permissions, and execution
 */

export interface SkillMetadata {
  // Core identification
  id: string;
  name: string;
  version: string;
  description: string;
  category: SkillCategory;
  
  // Version management
  changelog: string[];
  lastUpdated: string;
  compatibility: string[]; // Compatible Helm Control versions
  
  // Permission matrix
  permissions: {
    owner: boolean;
    admin: boolean;
    user: boolean;
    userTiers?: string[]; // ['free', 'pro', 'enterprise']
  };
  
  // Learning boundaries
  learning: {
    autoImprove: boolean;
    locked: boolean;
    dataRetention: 'session' | 'persistent' | 'none';
    feedbackEnabled: boolean;
  };
  
  // Logging configuration
  logging: {
    priority: 'critical' | 'info' | 'debug';
    level: 'minimal' | 'standard' | 'verbose';
    auditTrail: boolean;
  };
  
  // LLM orchestration
  llm: {
    required: boolean;
    fallbackOptions: string[];
    contextSize: 'small' | 'medium' | 'large';
    temperature: number;
  };
  
  // Execution context
  execution: {
    allowedIn: ('helm-control' | 'all-in-chat-poker' | 'both')[];
    isolationLevel: 'strict' | 'sandboxed' | 'integrated';
    resourceLimits: {
      memory: number; // MB
      cpu: number; // percentage
      timeout: number; // seconds
    };
  };
  
  // Dependencies and compatibility
  dependencies: string[];
  conflicts: string[];
  requires: string[]; // Required system capabilities
  
  // Health and monitoring
  health: {
    heartbeatInterval: number; // seconds
    failureThreshold: number; // consecutive failures
    autoRestart: boolean;
  };
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface SkillExecutionRequest {
  skillId: string;
  userId: string;
  userTier: string;
  context: Record<string, any>;
  parameters: Record<string, any>;
  permissions: string[];
  requestId: string;
}

export interface SkillExecutionResult {
  success: boolean;
  skillId: string;
  requestId: string;
  result: any;
  error?: string;
  executionTime: number;
  resourcesUsed: {
    memory: number;
    cpu: number;
    duration: number;
  };
  auditLog: AuditEntry[];
}

export interface AuditEntry {
  timestamp: string;
  level: 'critical' | 'info' | 'debug';
  action: string;
  userId: string;
  skillId: string;
  details: Record<string, any>;
}

export interface PermissionPolicy {
  skillId: string;
  userId: string;
  userTier: string;
  grantedPermissions: string[];
  restrictions: string[];
  expires?: string;
  grantedBy: string;
  grantedAt: string;
}

export interface SkillRegistry {
  // Core registry methods
  registerSkill(skill: SkillMetadata): Promise<boolean>;
  unregisterSkill(skillId: string): Promise<boolean>;
  getSkill(skillId: string): Promise<SkillMetadata | null>;
  listSkills(category?: string, userTier?: string): Promise<SkillMetadata[]>;
  
  // Permission management
  checkPermission(skillId: string, userId: string, userTier: string): Promise<boolean>;
  grantPermission(policy: PermissionPolicy): Promise<boolean>;
  revokePermission(skillId: string, userId: string): Promise<boolean>;
  
  // Execution management
  executeSkill(request: SkillExecutionRequest): Promise<SkillExecutionResult>;
  getExecutionHistory(skillId: string, userId?: string): Promise<SkillExecutionResult[]>;
  
  // Health and monitoring
  getSkillHealth(skillId: string): Promise<SkillHealth>;
  getAllHealth(): Promise<Record<string, SkillHealth>>;
  
  // Learning and updates
  updateSkill(skillId: string, updates: Partial<SkillMetadata>): Promise<boolean>;
  getSkillAnalytics(skillId: string): Promise<SkillAnalytics>;
}

export interface SkillHealth {
  skillId: string;
  status: 'healthy' | 'degraded' | 'failed' | 'executing';
  lastHeartbeat: string;
  consecutiveFailures: number;
  uptime: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface SkillAnalytics {
  skillId: string;
  usage: {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    errorBreakdown: Record<string, number>;
  };
  users: {
    uniqueUsers: number;
    userTiers: Record<string, number>;
    mostActiveUsers: string[];
  };
  performance: {
    resourceUsage: ResourceUsage;
    bottlenecks: string[];
    recommendations: string[];
  };
}

export interface ResourceUsage {
  memory: {
    average: number;
    peak: number;
    limit: number;
  };
  cpu: {
    average: number;
    peak: number;
    limit: number;
  };
  network: {
    requests: number;
    bandwidth: number;
  };
}

// Skill categories for Helm Control
export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'code-generation',
    name: 'Code Generation',
    description: 'AI-powered code creation and modification',
    icon: '💻'
  },
  {
    id: 'audio',
    name: 'Audio Processing',
    description: 'Audio generation, processing, and management',
    icon: '🎵'
  },
  {
    id: 'graphics',
    name: 'Graphics & Media',
    description: 'Image generation, video processing, and media management',
    icon: '🎨'
  },
  {
    id: 'web-management',
    name: 'Web Management',
    description: 'Website deployment, monitoring, and optimization',
    icon: '🌐'
  },
  {
    id: 'analytics',
    name: 'Analytics & Reporting',
    description: 'Data analysis, reporting, and insights',
    icon: '📊'
  },
  {
    id: 'partner-system',
    name: 'Partner Integration',
    description: 'Third-party service integrations and APIs',
    icon: '🤝'
  },
  {
    id: 'financial',
    name: 'Financial Operations',
    description: 'Payment processing, financial calculations, and compliance',
    icon: '💰'
  },
  {
    id: 'multi-site',
    name: 'Multi-Site Management',
    description: 'Managing multiple websites and deployments',
    icon: '🌍'
  },
  {
    id: 'security',
    name: 'Security & Compliance',
    description: 'Security monitoring, compliance checks, and access control',
    icon: '🔒'
  },
  {
    id: 'white-label',
    name: 'White-Label Solutions',
    description: 'Branding, customization, and white-label deployment',
    icon: '🏷️'
  },
  {
    id: 'orchestration',
    name: 'Orchestration',
    description: 'Internal orchestration and system management',
    icon: '🎼'
  },
  {
    id: 'memory',
    name: 'Memory Management',
    description: 'Data storage, retrieval, and memory optimization',
    icon: '🧠'
  },
  {
    id: 'self-healing',
    name: 'Self-Healing',
    description: 'System recovery, error correction, and maintenance',
    icon: '🔧'
  }
];

// Permission levels
export const PERMISSION_LEVELS = {
  OWNER: 'owner',
  ADMIN: 'admin', 
  USER: 'user',
  GUEST: 'guest'
} as const;

// User tiers
export const USER_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
  DEVELOPER: 'developer'
} as const;

// Execution contexts
export const EXECUTION_CONTEXTS = {
  HELM_CONTROL: 'helm-control',
  ALL_IN_CHAT_POKER: 'all-in-chat-poker',
  BOTH: 'both'
} as const;

// Learning boundaries
export const LEARNING_BOUNDARIES = {
  AUTO_IMPROVE: 'auto-improve',
  LOCKED: 'locked',
  SESSION_ONLY: 'session-only',
  PERSISTENT: 'persistent'
} as const;

// Logging priorities
export const LOGGING_PRIORITIES = {
  CRITICAL: 'critical',
  INFO: 'info',
  DEBUG: 'debug'
} as const;
