/**
 * Helm Control Skill Definitions v2
 * All previously defined skills with proper metadata and permissions
 */

import { SkillMetadata } from '../interfaces/skill-registry-v2';

export const HELM_CONTROL_SKILLS: SkillMetadata[] = [
  // ===== CODE GENERATION =====
  {
    id: 'code-generation',
    name: 'Code Generation Engine',
    version: '2.0.0',
    description: 'AI-powered code creation, modification, and optimization',
    category: { id: 'code-generation', name: 'Code Generation', description: 'AI-powered code creation and modification', icon: '💻' },
    changelog: [
      'v2.0.0: Complete refactor for Helm Control integration',
      'v1.5.0: Added multi-language support',
      'v1.0.0: Initial release'
    ],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: true,
      user: false
    },
    learning: {
      autoImprove: true,
      locked: false,
      dataRetention: 'persistent',
      feedbackEnabled: true
    },
    logging: {
      priority: 'info',
      level: 'standard',
      auditTrail: true
    },
    llm: {
      required: true,
      fallbackOptions: ['template-based', 'manual-override'],
      contextSize: 'large',
      temperature: 0.7
    },
    execution: {
      allowedIn: ['helm-control'],
      isolationLevel: 'sandboxed',
      resourceLimits: {
        memory: 1024,
        cpu: 50,
        timeout: 300
      }
    },
    dependencies: ['llm-router', 'template-engine'],
    conflicts: [],
    requires: ['code-execution', 'file-system'],
    health: {
      heartbeatInterval: 30,
      failureThreshold: 3,
      autoRestart: true
    }
  },

  // ===== AUDIO PROCESSING =====
  {
    id: 'audio-processor',
    name: 'Audio Processing Suite',
    version: '2.0.0',
    description: 'Audio generation, processing, mixing, and management',
    category: { id: 'audio', name: 'Audio Processing', description: 'Audio generation, processing, and management', icon: '🎵' },
    changelog: [
      'v2.0.0: Helm Control integration with isolation',
      'v1.8.0: Added real-time processing',
      'v1.5.0: Multi-format support',
      'v1.0.0: Basic audio generation'
    ],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: true,
      user: true,
      userTiers: ['pro', 'enterprise']
    },
    learning: {
      autoImprove: true,
      locked: false,
      dataRetention: 'session',
      feedbackEnabled: true
    },
    logging: {
      priority: 'info',
      level: 'standard',
      auditTrail: true
    },
    llm: {
      required: true,
      fallbackOptions: ['preset-templates', 'manual-mixing'],
      contextSize: 'medium',
      temperature: 0.8
    },
    execution: {
      allowedIn: ['helm-control', 'all-in-chat-poker'],
      isolationLevel: 'integrated',
      resourceLimits: {
        memory: 2048,
        cpu: 75,
        timeout: 600
      }
    },
    dependencies: ['audio-codecs', 'llm-router'],
    conflicts: [],
    requires: ['audio-hardware', 'storage'],
    health: {
      heartbeatInterval: 15,
      failureThreshold: 5,
      autoRestart: true
    }
  },

  // ===== GRAPHICS & MEDIA =====
  {
    id: 'graphics-engine',
    name: 'Graphics & Media Engine',
    version: '2.0.0',
    description: 'Image generation, video processing, and media management',
    category: { id: 'graphics', name: 'Graphics & Media', description: 'Image generation, video processing, and media management', icon: '🎨' },
    changelog: [
      'v2.0.0: Complete rewrite for Helm Control',
      'v1.6.0: Added video processing',
      'v1.4.0: Multi-format image support',
      'v1.0.0: Basic image generation'
    ],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: true,
      user: true,
      userTiers: ['pro', 'enterprise']
    },
    learning: {
      autoImprove: false,
      locked: true,
      dataRetention: 'none',
      feedbackEnabled: false
    },
    logging: {
      priority: 'debug',
      level: 'verbose',
      auditTrail: true
    },
    llm: {
      required: true,
      fallbackOptions: ['template-library', 'manual-creation'],
      contextSize: 'large',
      temperature: 0.9
    },
    execution: {
      allowedIn: ['helm-control', 'all-in-chat-poker'],
      isolationLevel: 'sandboxed',
      resourceLimits: {
        memory: 4096,
        cpu: 80,
        timeout: 900
      }
    },
    dependencies: ['image-processor', 'video-encoder', 'llm-router'],
    conflicts: [],
    requires: ['gpu-acceleration', 'large-storage'],
    health: {
      heartbeatInterval: 45,
      failureThreshold: 3,
      autoRestart: true
    }
  },

  // ===== WEB MANAGEMENT =====
  {
    id: 'web-manager',
    name: 'Web Management System',
    version: '2.0.0',
    description: 'Website deployment, monitoring, and optimization',
    category: { id: 'web-management', name: 'Web Management', description: 'Website deployment, monitoring, and optimization', icon: '🌐' },
    changelog: [
      'v2.0.0: Helm Control integration with security',
      'v1.7.0: Added multi-site support',
      'v1.5.0: Automated deployment',
      'v1.0.0: Basic monitoring'
    ],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: true,
      user: false
    },
    learning: {
      autoImprove: true,
      locked: false,
      dataRetention: 'persistent',
      feedbackEnabled: true
    },
    logging: {
      priority: 'critical',
      level: 'standard',
      auditTrail: true
    },
    llm: {
      required: false,
      fallbackOptions: ['manual-override', 'emergency-rollback'],
      contextSize: 'small',
      temperature: 0.3
    },
    execution: {
      allowedIn: ['helm-control'],
      isolationLevel: 'strict',
      resourceLimits: {
        memory: 512,
        cpu: 25,
        timeout: 180
      }
    },
    dependencies: ['deployment-engine', 'monitoring-suite'],
    conflicts: ['manual-deployment'],
    requires: ['ssh-access', 'domain-control'],
    health: {
      heartbeatInterval: 60,
      failureThreshold: 2,
      autoRestart: true
    }
  },

  // ===== ANALYTICS =====
  {
    id: 'analytics-engine',
    name: 'Analytics & Reporting Engine',
    version: '2.0.0',
    description: 'Data analysis, reporting, and insights generation',
    category: { id: 'analytics', name: 'Analytics & Reporting', description: 'Data analysis, reporting, and insights', icon: '📊' },
    changelog: [
      'v2.0.0: Helm Control integration with privacy',
      'v1.8.0: Real-time analytics',
      'v1.5.0: Custom reports',
      'v1.0.0: Basic analytics'
    ],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: true,
      user: true,
      userTiers: ['pro', 'enterprise']
    },
    learning: {
      autoImprove: true,
      locked: false,
      dataRetention: 'persistent',
      feedbackEnabled: true
    },
    logging: {
      priority: 'info',
      level: 'standard',
      auditTrail: true
    },
    llm: {
      required: true,
      fallbackOptions: ['statistical-analysis', 'manual-reports'],
      contextSize: 'medium',
      temperature: 0.5
    },
    execution: {
      allowedIn: ['helm-control', 'all-in-chat-poker'],
      isolationLevel: 'integrated',
      resourceLimits: {
        memory: 1536,
        cpu: 60,
        timeout: 300
      }
    },
    dependencies: ['data-processor', 'report-generator', 'llm-router'],
    conflicts: [],
    requires: ['database-access', 'data-retention'],
    health: {
      heartbeatInterval: 30,
      failureThreshold: 3,
      autoRestart: true
    }
  },

  // ===== PARTNER SYSTEM =====
  {
    id: 'partner-integration',
    name: 'Partner Integration System',
    version: '2.0.0',
    description: 'Third-party service integrations and API management',
    category: { id: 'partner-system', name: 'Partner Integration', description: 'Third-party service integrations and APIs', icon: '🤝' },
    changelog: [
      'v2.0.0: Helm Control security integration',
      'v1.6.0: Added OAuth support',
      'v1.4.0: Multi-platform support',
      'v1.0.0: Basic API integration'
    ],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: true,
      user: false
    },
    learning: {
      autoImprove: false,
      locked: true,
      dataRetention: 'session',
      feedbackEnabled: false
    },
    logging: {
      priority: 'critical',
      level: 'standard',
      auditTrail: true
    },
    llm: {
      required: false,
      fallbackOptions: ['manual-configuration', 'emergency-disable'],
      contextSize: 'small',
      temperature: 0.1
    },
    execution: {
      allowedIn: ['helm-control'],
      isolationLevel: 'strict',
      resourceLimits: {
        memory: 256,
        cpu: 20,
        timeout: 120
      }
    },
    dependencies: ['api-gateway', 'auth-manager'],
    conflicts: ['direct-api-access'],
    requires: ['external-credentials', 'rate-limiting'],
    health: {
      heartbeatInterval: 90,
      failureThreshold: 2,
      autoRestart: true
    }
  },

  // ===== FINANCIAL OPERATIONS =====
  {
    id: 'financial-processor',
    name: 'Financial Operations Processor',
    version: '2.0.0',
    description: 'Payment processing, financial calculations, and compliance',
    category: { id: 'financial', name: 'Financial Operations', description: 'Payment processing, financial calculations, and compliance', icon: '💰' },
    changelog: [
      'v2.0.0: Complete security overhaul for Helm Control',
      'v1.9.0: Added compliance reporting',
      'v1.7.0: Multi-currency support',
      'v1.5.0: Basic payment processing'
    ],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: false,
      user: false
    },
    learning: {
      autoImprove: false,
      locked: true,
      dataRetention: 'persistent',
      feedbackEnabled: false
    },
    logging: {
      priority: 'critical',
      level: 'verbose',
      auditTrail: true
    },
    llm: {
      required: false,
      fallbackOptions: ['manual-approval', 'emergency-freeze'],
      contextSize: 'small',
      temperature: 0.0
    },
    execution: {
      allowedIn: ['helm-control'],
      isolationLevel: 'strict',
      resourceLimits: {
        memory: 512,
        cpu: 30,
        timeout: 300
      }
    },
    dependencies: ['payment-gateway', 'compliance-engine'],
    conflicts: ['direct-payment'],
    requires: ['financial-licenses', 'audit-trail'],
    health: {
      heartbeatInterval: 30,
      failureThreshold: 1,
      autoRestart: false
    }
  },

  // ===== MULTI-SITE MANAGEMENT =====
  {
    id: 'multi-site-manager',
    name: 'Multi-Site Management System',
    version: '2.0.0',
    description: 'Managing multiple websites and deployments',
    category: { id: 'multi-site', name: 'Multi-Site Management', description: 'Managing multiple websites and deployments', icon: '🌍' },
    changelog: [
      'v2.0.0: Helm Control integration with isolation',
      'v1.8.0: Added bulk operations',
      'v1.6.0: Cross-site synchronization',
      'v1.4.0: Multi-site dashboard',
      'v1.0.0: Basic multi-site support'
    ],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: true,
      user: false
    },
    learning: {
      autoImprove: true,
      locked: false,
      dataRetention: 'persistent',
      feedbackEnabled: true
    },
    logging: {
      priority: 'info',
      level: 'standard',
      auditTrail: true
    },
    llm: {
      required: true,
      fallbackOptions: ['manual-configuration', 'template-deployment'],
      contextSize: 'medium',
      temperature: 0.4
    },
    execution: {
      allowedIn: ['helm-control'],
      isolationLevel: 'sandboxed',
      resourceLimits: {
        memory: 1024,
        cpu: 40,
        timeout: 600
      }
    },
    dependencies: ['web-manager', 'analytics-engine'],
    conflicts: ['single-site-mode'],
    requires: ['domain-portfolio', 'ssl-management'],
    health: {
      heartbeatInterval: 60,
      failureThreshold: 3,
      autoRestart: true
    }
  },

  // ===== SECURITY & COMPLIANCE =====
  {
    id: 'security-monitor',
    name: 'Security & Compliance Monitor',
    version: '2.0.0',
    description: 'Security monitoring, compliance checks, and access control',
    category: { id: 'security', name: 'Security & Compliance', description: 'Security monitoring, compliance checks, and access control', icon: '🔒' },
    changelog: [
      'v2.0.0: Complete rewrite for Helm Control architecture',
      'v1.9.0: Added threat detection',
      'v1.7.0: Compliance automation',
      'v1.5.0: Real-time monitoring',
      'v1.0.0: Basic security checks'
    ],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: true,
      user: false
    },
    learning: {
      autoImprove: true,
      locked: false,
      dataRetention: 'persistent',
      feedbackEnabled: true
    },
    logging: {
      priority: 'critical',
      level: 'verbose',
      auditTrail: true
    },
    llm: {
      required: true,
      fallbackOptions: ['rule-based', 'manual-intervention'],
      contextSize: 'large',
      temperature: 0.2
    },
    execution: {
      allowedIn: ['helm-control'],
      isolationLevel: 'strict',
      resourceLimits: {
        memory: 768,
        cpu: 35,
        timeout: 180
      }
    },
    dependencies: ['threat-detector', 'compliance-engine', 'audit-system'],
    conflicts: [],
    requires: ['security-licenses', 'log-access'],
    health: {
      heartbeatInterval: 15,
      failureThreshold: 1,
      autoRestart: true
    }
  },

  // ===== WHITE-LABEL SOLUTIONS =====
  {
    id: 'white-label-engine',
    name: 'White-Label Solutions Engine',
    version: '2.0.0',
    description: 'Branding, customization, and white-label deployment',
    category: { id: 'white-label', name: 'White-Label Solutions', description: 'Branding, customization, and white-label deployment', icon: '🏷️' },
    changelog: [
      'v2.0.0: Helm Control integration with isolation',
      'v1.6.0: Added theme customization',
      'v1.4.0: Brand management',
      'v1.2.0: Basic white-labeling',
      'v1.0.0: Initial release'
    ],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: true,
      user: false
    },
    learning: {
      autoImprove: false,
      locked: true,
      dataRetention: 'none',
      feedbackEnabled: false
    },
    logging: {
      priority: 'info',
      level: 'standard',
      auditTrail: true
    },
    llm: {
      required: false,
      fallbackOptions: ['manual-configuration', 'template-based'],
      contextSize: 'small',
      temperature: 0.3
    },
    execution: {
      allowedIn: ['helm-control'],
      isolationLevel: 'sandboxed',
      resourceLimits: {
        memory: 512,
        cpu: 25,
        timeout: 300
      }
    },
    dependencies: ['theme-engine', 'brand-manager'],
    conflicts: [],
    requires: ['branding-assets', 'custom-domains'],
    health: {
      heartbeatInterval: 45,
      failureThreshold: 2,
      autoRestart: true
    }
  }
];

// ===== INTERNAL HELM CONTROL SKILLS =====

export const INTERNAL_HELM_SKILLS: SkillMetadata[] = [
  // Orchestration
  {
    id: 'helm-orchestrator',
    name: 'Helm Orchestrator',
    version: '2.0.0',
    description: 'Internal orchestration and system management',
    category: { id: 'orchestration', name: 'Orchestration', description: 'Internal orchestration and system management', icon: '🎼' },
    changelog: ['v2.0.0: Core Helm Control orchestration'],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: false,
      user: false
    },
    learning: {
      autoImprove: true,
      locked: false,
      dataRetention: 'persistent',
      feedbackEnabled: true
    },
    logging: {
      priority: 'critical',
      level: 'verbose',
      auditTrail: true
    },
    llm: {
      required: true,
      fallbackOptions: ['rule-based', 'manual-override'],
      contextSize: 'large',
      temperature: 0.1
    },
    execution: {
      allowedIn: ['helm-control'],
      isolationLevel: 'integrated',
      resourceLimits: {
        memory: 2048,
        cpu: 60,
        timeout: 600
      }
    },
    dependencies: ['skill-registry', 'permission-manager'],
    conflicts: [],
    requires: ['system-access'],
    health: {
      heartbeatInterval: 10,
      failureThreshold: 1,
      autoRestart: true
    }
  },

  // Memory Management
  {
    id: 'memory-manager',
    name: 'Memory Management System',
    version: '2.0.0',
    description: 'Data storage, retrieval, and memory optimization',
    category: { id: 'memory', name: 'Memory Management', description: 'Data storage, retrieval, and memory optimization', icon: '🧠' },
    changelog: ['v2.0.0: Helm Control memory isolation'],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: false,
      user: false
    },
    learning: {
      autoImprove: true,
      locked: false,
      dataRetention: 'persistent',
      feedbackEnabled: true
    },
    logging: {
      priority: 'info',
      level: 'standard',
      auditTrail: true
    },
    llm: {
      required: false,
      fallbackOptions: ['manual-cleanup', 'emergency-purge'],
      contextSize: 'small',
      temperature: 0.0
    },
    execution: {
      allowedIn: ['helm-control'],
      isolationLevel: 'integrated',
      resourceLimits: {
        memory: 1024,
        cpu: 30,
        timeout: 300
      }
    },
    dependencies: ['storage-engine', 'cache-manager'],
    conflicts: [],
    requires: ['file-system', 'database-access'],
    health: {
      heartbeatInterval: 30,
      failureThreshold: 2,
      autoRestart: true
    }
  },

  // Self-Healing
  {
    id: 'self-healing',
    name: 'Self-Healing System',
    version: '2.0.0',
    description: 'System recovery, error correction, and maintenance',
    category: { id: 'self-healing', name: 'Self-Healing', description: 'System recovery, error correction, and maintenance', icon: '🔧' },
    changelog: ['v2.0.0: Helm Control integration with isolation'],
    lastUpdated: '2026-01-20T01:00:00Z',
    compatibility: ['helm-control-v2.0.0+'],
    permissions: {
      owner: true,
      admin: false,
      user: false
    },
    learning: {
      autoImprove: true,
      locked: false,
      dataRetention: 'persistent',
      feedbackEnabled: true
    },
    logging: {
      priority: 'critical',
      level: 'verbose',
      auditTrail: true
    },
    llm: {
      required: true,
      fallbackOptions: ['manual-recovery', 'emergency-restart'],
      contextSize: 'medium',
      temperature: 0.3
    },
    execution: {
      allowedIn: ['helm-control'],
      isolationLevel: 'integrated',
      resourceLimits: {
        memory: 1536,
        cpu: 50,
        timeout: 900
      }
    },
    dependencies: ['health-monitor', 'error-recovery'],
    conflicts: [],
    requires: ['system-restart', 'log-access'],
    health: {
      heartbeatInterval: 20,
      failureThreshold: 1,
      autoRestart: true
    }
  }
];
