/**
 * In-App Upgrade UX Copy and Components
 * Ready-to-use text and flows for seamless upgrade experiences
 */

export interface UpgradeUXCopy {
  tierOverview: {
    header: string;
    description: string;
    upgradeButton: string;
  };
  tierCards: {
    'creator-plus': {
      name: string;
      price: string;
      description: string;
    };
    'pro': {
      name: string;
      price: string;
      description: string;
    };
    'enterprise': {
      name: string;
      price: string;
      description: string;
    };
  };
  skillUpgrade: {
    header: string;
    installButton: string;
  };
  upgradePrompt: {
    title: string;
    body: string;
    upgradeButton: string;
    cancelButton: string;
  };
  confirmation: {
    title: string;
    confirmButton: string;
    successMessage: string;
  };
  tooltips: {
    autoRules: string;
    skillStore: string;
    simulations: string;
    complianceExports: string;
    multiDeviceQuorum: string;
    hardwareKeys: string;
  };
}

export const upgradeUXCopy: UpgradeUXCopy = {
  tierOverview: {
    header: "Unlock Acey's full power",
    description: "Upgrade your tier to gain more control, automation, and skills. Your subscription determines which features Acey can safely operate.",
    upgradeButton: "Upgrade Now →"
  },
  tierCards: {
    'creator-plus': {
      name: "Creator+",
      price: "$9/mo",
      description: "Approve actions from your mobile, view full audit timelines, and get offline access."
    },
    'pro': {
      name: "Pro", 
      price: "$29/mo",
      description: "Enable auto-rules, run simulations, install Skill Store modules, and unlock multi-device approvals."
    },
    'enterprise': {
      name: "Enterprise",
      price: "$99+/mo",
      description: "Scale across multiple tenants, secure hardware keys, full compliance exports, and advanced incident dashboards."
    }
  },
  skillUpgrade: {
    header: "Enhance Acey with Skills",
    installButton: "Install Skill →"
  },
  upgradePrompt: {
    title: "Feature Locked",
    body: "This feature requires {tier}. Upgrade to unlock automation, simulations, and the Skill Store.",
    upgradeButton: "Upgrade Now →",
    cancelButton: "Maybe Later"
  },
  confirmation: {
    title: "Confirm Upgrade",
    confirmButton: "Confirm Upgrade",
    successMessage: "You've unlocked {tierName}! Acey can now help you do even more."
  },
  tooltips: {
    autoRules: "Acey can suggest or perform actions automatically, with your approval and trust control.",
    skillStore: "Add new abilities to Acey safely. Each skill is tested and permission-gated.",
    simulations: "Test potential actions safely before execution. See what would happen without making changes.",
    complianceExports: "Generate investor-ready reports and audit trails for compliance and due diligence.",
    multiDeviceQuorum: "Require multiple device confirmations for critical actions. No single point of failure.",
    hardwareKeys: "Use physical security keys (YubiKey/FIDO2) for the most sensitive operations."
  }
};

/**
 * Upgrade UX Component Templates
 */

export interface SkillCardCopy {
  name: string;
  price: string;
  description: string;
  requirements: string;
  category: string;
}

export const skillCardExamples: Record<string, SkillCardCopy> = {
  'stream-ops-pro': {
    name: "Acey Stream Ops Pro",
    price: "$15/mo",
    description: "Monitor your stream, detect issues early, and approve fixes safely.",
    requirements: "Requires Pro tier or higher",
    category: "Monitoring"
  },
  'audio-optimizer': {
    name: "Audio Quality Optimizer",
    price: "$18/mo",
    description: "Automatically optimize audio settings for the best stream quality.",
    requirements: "Requires Pro tier or higher",
    category: "Optimization"
  },
  'hype-engine': {
    name: "Hype Engine Pro",
    price: "$12/mo",
    description: "Generate engaging content and timing suggestions for maximum viewer engagement.",
    requirements: "Requires Creator+ tier or higher",
    category: "Creative"
  },
  'auto-moderator': {
    name: "Auto Moderator Pro",
    price: "$35/mo",
    description: "Advanced content moderation with custom rules and human oversight.",
    requirements: "Requires Pro tier or higher",
    category: "Ops Automation"
  }
};

/**
 * Upgrade Trigger Messages
 */

export interface UpgradeTrigger {
  trigger: string;
  userStory: string;
  featureName: string;
  requiredTier: string;
  unlocks: string[];
}

export const upgradeTriggers: UpgradeTrigger[] = [
  {
    trigger: "mobile_approval_request",
    userStory: "I want to approve things from my phone.",
    featureName: "Mobile Approvals",
    requiredTier: "Creator+",
    unlocks: [
      "Mobile approvals",
      "Full audit timeline (7 days)",
      "Emergency lock",
      "Offline read-only mode"
    ]
  },
  {
    trigger: "auto_rule_suggestion",
    userStory: "Acey keeps suggesting things — I want her to handle this automatically.",
    featureName: "Auto-Rules",
    requiredTier: "Pro",
    unlocks: [
      "Auto-rules (permission-gated)",
      "Simulation engine",
      "Skill Store access",
      "Multi-device quorum unlock"
    ]
  },
  {
    trigger: "skill_install_attempt",
    userStory: "I want to install skills to enhance Acey's capabilities.",
    featureName: "Skill Store",
    requiredTier: "Pro",
    unlocks: [
      "Skill Store access",
      "Skill installation",
      "Skill management",
      "Skill analytics"
    ]
  },
  {
    trigger: "compliance_export_request",
    userStory: "I need to generate compliance reports for my organization.",
    featureName: "Compliance Exports",
    requiredTier: "Pro",
    unlocks: [
      "Basic compliance exports",
      "Audit reports",
      "Incident summaries",
      "Data usage declarations"
    ]
  },
  {
    trigger: "multi_tenant_need",
    userStory: "This is working — I need guarantees and separation.",
    featureName: "Multi-Tenant Isolation",
    requiredTier: "Enterprise",
    unlocks: [
      "Multi-tenant isolation",
      "Cloud clustering",
      "Hardware key support",
      "Advanced compliance exports",
      "Custom governance rules"
    ]
  }
];

/**
 * Upgrade Flow Templates
 */

export interface UpgradeFlowStep {
  title: string;
  subtitle?: string;
  body?: string;
  primaryButton: string;
  secondaryButton?: string;
  showTrial?: boolean;
  trialDays?: number;
}

export const upgradeFlows: Record<string, UpgradeFlowStep[]> = {
  'creator-plus': [
    {
      title: "Unlock Mobile Control",
      subtitle: "Creator+ - $9/month",
      body: "Approve actions from anywhere, get full audit access, and never lose control of your stream.",
      primaryButton: "Start Free Trial",
      secondaryButton: "Learn More",
      showTrial: true,
      trialDays: 7
    },
    {
      title: "Confirm Your Upgrade",
      subtitle: "7-day free trial, then $9/month",
      body: "Get instant access to mobile approvals, 7-day audit timeline, and emergency lock features.",
      primaryButton: "Start Trial",
      secondaryButton: "Cancel"
    },
    {
      title: "Welcome to Creator+!",
      subtitle: "Your trial has started",
      body: "You now have mobile control and extended audit access. Acey is ready to help you stream safer.",
      primaryButton: "Get Started"
    }
  ],
  'pro': [
    {
      title: "Unlock Automation & Skills",
      subtitle: "Pro - $29/month",
      body: "Enable auto-rules, run simulations, install skills, and unlock multi-device approvals.",
      primaryButton: "Upgrade Now",
      secondaryButton: "Compare Plans"
    },
    {
      title: "Confirm Your Upgrade",
      subtitle: "$29/month billed monthly",
      body: "Get instant access to auto-rules, simulations, Skill Store, and advanced approval workflows.",
      primaryButton: "Confirm Upgrade",
      secondaryButton: "Cancel"
    },
    {
      title: "Welcome to Pro!",
      subtitle: "Your upgrade is complete",
      body: "You now have access to automation, simulations, and the Skill Store. Acey is ready to work smarter for you.",
      primaryButton: "Explore Features"
    }
  ],
  'enterprise': [
    {
      title: "Scale with Confidence",
      subtitle: "Enterprise - Custom Pricing",
      body: "Multi-tenant isolation, hardware security, advanced compliance, and dedicated support.",
      primaryButton: "Contact Sales",
      secondaryButton: "Learn More"
    }
  ]
};

/**
 * Feature Explanations
 */

export interface FeatureExplanation {
  name: string;
  shortDescription: string;
  longDescription: string;
  benefits: string[];
  requirements: string[];
  examples: string[];
}

export const featureExplanations: Record<string, FeatureExplanation> = {
  'auto-rules': {
    name: "Auto-Rules",
    shortDescription: "Automated actions with human oversight",
    longDescription: "Acey can suggest and perform actions automatically based on patterns you approve. Every action still requires your approval and builds trust over time.",
    benefits: [
      "Reduce manual effort for routine tasks",
      "Faster response to common issues",
      "Consistent decision-making",
      "Learns from your preferences"
    ],
    requirements: [
      "Pro tier or higher",
      "Trust score of 3+",
      "Human approval for critical actions"
    ],
    examples: [
      "Auto-restart stream on technical issues",
      "Suggest optimal settings based on time of day",
      "Alert on performance degradation patterns"
    ]
  },
  'skill-store': {
    name: "Skill Store",
    shortDescription: "Add new abilities to Acey safely",
    longDescription: "Install tested, permission-gated skills to enhance Acey's capabilities. Each skill is reviewed for security and operates in a sandboxed environment.",
    benefits: [
      "Extend Acey's capabilities without coding",
      "Community-vetted and tested skills",
      "Permission-gated for safety",
      "Pay only for skills you use"
    ],
    requirements: [
      "Pro tier or higher",
      "Skill compatibility check",
      "Permission review"
    ],
    examples: [
      "Stream Ops Pro - $15/mo",
      "Audio Quality Optimizer - $18/mo",
      "Hype Engine Pro - $12/mo"
    ]
  },
  'simulations': {
    name: "Simulations",
    shortDescription: "Test actions safely before execution",
    longDescription: "Run 'what-if' scenarios to see what would happen without making actual changes. Perfect for testing new rules or skills.",
    benefits: [
      "Test changes without risk",
      "Validate auto-rules before deployment",
      "Train Acey on historical data",
      "Build confidence in automation"
    ],
    requirements: [
      "Pro tier or higher",
      "Historical data access",
      "Simulation quota"
    ],
    examples: [
      "Simulate stream issues from last week",
      "Test new auto-rule on past data",
      "Validate skill behavior before install"
    ]
  },
  'compliance-exports': {
    name: "Compliance Exports",
    shortDescription: "Investor-ready reports and audit trails",
    longDescription: "Generate professional compliance reports, audit timelines, and investor summaries. All data is redacted for safety and formatted for enterprise requirements.",
    benefits: [
      "Investor-ready documentation",
      "Compliance with regulations",
      "Audit trail transparency",
      "Risk assessment reports"
    ],
    requirements: [
      "Pro tier or higher",
      "Data retention compliance",
      "Export quota"
    ],
    examples: [
      "Monthly incident reports",
      "Quarterly compliance summaries",
      "Investor due diligence packages"
    ]
  }
};

/**
 * Helper Functions for Dynamic Copy
 */

export class UpgradeUXHelper {
  /**
   * Get tier card copy
   */
  static getTierCardCopy(tierId: string): SkillCardCopy | null {
    const tier = upgradeUXCopy.tierCards[tierId as keyof typeof upgradeUXCopy.tierCards];
    if (!tier) return null;

    return {
      name: tier.name,
      price: tier.price,
      description: tier.description,
      requirements: tierId === 'creator-plus' ? 'Requires Free tier' : 'Requires Creator+ tier or higher',
      category: 'Subscription'
    };
  }

  /**
   * Get upgrade prompt copy with dynamic tier
   */
  static getUpgradePromptCopy(requiredTier: string): typeof upgradeUXCopy.upgradePrompt {
    return {
      ...upgradeUXCopy.upgradePrompt,
      body: upgradeUXCopy.upgradePrompt.body.replace('{tier}', requiredTier)
    };
  }

  /**
   * Get success message with dynamic tier name
   */
  static getSuccessMessage(tierName: string): string {
    return upgradeUXCopy.confirmation.successMessage.replace('{tierName}', tierName);
  }

  /**
   * Get skill card with tier compatibility
   */
  static getSkillCardWithCompatibility(skillId: string, currentTier: string): SkillCardCopy & { compatible: boolean; upgradeRequired?: string } {
    const skill = skillCardExamples[skillId];
    if (!skill) {
      throw new Error(`Skill ${skillId} not found`);
    }

    const compatible = this.checkSkillCompatibility(skill, currentTier);
    
    return {
      ...skill,
      compatible: compatible.compatible,
      upgradeRequired: compatible.upgradeRequired
    };
  }

  /**
   * Check skill compatibility with tier
   */
  private static checkSkillCompatibility(skill: SkillCardCopy, currentTier: string): { compatible: boolean; upgradeRequired?: string } {
    if (currentTier === 'free') {
      return { compatible: false, upgradeRequired: 'Creator+' };
    }
    
    if (currentTier === 'creator-plus' && skill.category === 'Ops Automation') {
      return { compatible: false, upgradeRequired: 'Pro' };
    }
    
    return { compatible: true };
  }

  /**
   * Get upgrade trigger by feature
   */
  static getUpgradeTrigger(featureName: string): UpgradeTrigger | null {
    return upgradeTriggers.find(trigger => trigger.featureName === featureName) || null;
  }

  /**
   * Get feature explanation
   */
  static getFeatureExplanation(featureId: string): FeatureExplanation | null {
    return featureExplanations[featureId] || null;
  }

  /**
   * Format upgrade flow steps
   */
  static getUpgradeFlow(tierId: string): UpgradeFlowStep[] {
    return upgradeFlows[tierId] || [];
  }

  /**
   * Generate contextual upgrade message
   */
  static generateContextualMessage(trigger: string, userContext: any): string {
    const upgradeTrigger = this.getUpgradeTrigger(trigger);
    if (!upgradeTrigger) return "";

    const messages = [
      `Ready to ${upgradeTrigger.userStory.toLowerCase()}?`,
      `"${upgradeTrigger.userStory}"`,
      `Unlock ${upgradeTrigger.featureName} to ${upgradeTrigger.userStory.toLowerCase()}`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }
}

export default UpgradeUXHelper;
