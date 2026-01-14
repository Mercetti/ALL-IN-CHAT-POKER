/**
 * Acey Pricing and Entitlement System
 * Control surface & governance-based pricing, not usage-based
 */

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  billing: 'monthly' | 'annual';
  target: 'observer' | 'creator' | 'agency' | 'enterprise';
  description: string;
  features: TierFeatures;
  limits: TierLimits;
  upgradeTriggers: string[];
  color: string;
  popular?: boolean;
}

export interface TierFeatures {
  // Core Control
  readOnlyDashboards: boolean;
  liveStatusView: boolean;
  mobileControl: boolean;
  unlimitedApprovals: boolean;
  manualApprovalsOnly: boolean;
  
  // Audit & Compliance
  incidentAlerts: boolean;
  auditTimeline: boolean;
  auditReplayDays: number;
  incidentSummaries: boolean;
  complianceExports: boolean;
  investorSummaries: boolean;
  
  // Advanced Features
  autoRules: boolean;
  simulationEngine: boolean;
  skillStoreAccess: boolean;
  multiDeviceQuorum: boolean;
  hardwareKeySupport: boolean;
  
  // Enterprise Features
  multiTenant: boolean;
  cloudClustering: boolean;
  customGovernance: boolean;
  slaSupport: boolean;
  
  // Security
  emergencyLock: boolean;
  offlineReadOnly: boolean;
  timeBoxedPermissions: boolean;
  customPermissions: boolean;
}

export interface TierLimits {
  autoRules: number;
  simulations: number;
  skillInstalls: number;
  skillsPerCategory: number;
  tenants: number;
  apiCallsPerHour: number;
  auditRetentionDays: number;
  exportQuota: number;
}

export interface UpgradeTrigger {
  fromTier: string;
  toTier: string;
  trigger: string;
  userStory: string;
  unlocks: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
}

export interface SkillPricingBand {
  category: 'monitoring' | 'optimization' | 'creative' | 'ops_automation';
  minPrice: number;
  maxPrice: number;
  description: string;
  examples: string[];
}

export interface SubscriptionEntitlement {
  tenantId: string;
  tierId: string;
  features: TierFeatures;
  limits: TierLimits;
  usage: {
    autoRulesUsed: number;
    simulationsUsed: number;
    skillsInstalled: number;
    apiCallsUsed: number;
    exportsUsed: number;
  };
  upgradeSuggestions: UpgradeTrigger[];
  lastUpgradeCheck: number;
}

class PricingService {
  private tiers: Map<string, PricingTier> = new Map();
  private upgradeTriggers: UpgradeTrigger[] = [];
  private skillBands: Map<string, SkillPricingBand> = new Map();
  private entitlements = new Map<string, SubscriptionEntitlement>();

  constructor() {
    this.initializeTiers();
    this.initializeUpgradeTriggers();
    this.initializeSkillPricing();
  }

  /**
   * Initialize pricing tiers
   */
  private initializeTiers(): void {
    const tiers: PricingTier[] = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        billing: 'monthly',
        target: 'observer',
        description: 'Observer Mode - Onboarding + Trust Building',
        features: {
          // Core Control
          readOnlyDashboards: true,
          liveStatusView: true,
          mobileControl: false,
          unlimitedApprovals: false,
          manualApprovalsOnly: true,
          
          // Audit & Compliance
          incidentAlerts: true,
          auditTimeline: true,
          auditReplayDays: 1,
          incidentSummaries: false,
          complianceExports: false,
          investorSummaries: false,
          
          // Advanced Features
          autoRules: false,
          simulationEngine: false,
          skillStoreAccess: false,
          multiDeviceQuorum: false,
          hardwareKeySupport: false,
          
          // Enterprise Features
          multiTenant: false,
          cloudClustering: false,
          customGovernance: false,
          slaSupport: false,
          
          // Security
          emergencyLock: false,
          offlineReadOnly: false,
          timeBoxedPermissions: false,
          customPermissions: false
        },
        limits: {
          autoRules: 0,
          simulations: 0,
          skillInstalls: 0,
          skillsPerCategory: 0,
          tenants: 1,
          apiCallsPerHour: 100,
          auditRetentionDays: 1,
          exportQuota: 0
        },
        upgradeTriggers: [
          'I want to approve things from my phone',
          'I need more than 24h of audit data',
          'I want emergency lock capabilities'
        ],
        color: '#9E9E9E'
      },
      {
        id: 'creator-plus',
        name: 'Creator+',
        price: 9,
        billing: 'monthly',
        target: 'creator',
        description: 'Hands-On Control - For Serious Streamers',
        features: {
          // Core Control
          readOnlyDashboards: true,
          liveStatusView: true,
          mobileControl: true,
          unlimitedApprovals: true,
          manualApprovalsOnly: true,
          
          // Audit & Compliance
          incidentAlerts: true,
          auditTimeline: true,
          auditReplayDays: 7,
          incidentSummaries: true,
          complianceExports: false,
          investorSummaries: false,
          
          // Advanced Features
          autoRules: false,
          simulationEngine: false,
          skillStoreAccess: false,
          multiDeviceQuorum: false,
          hardwareKeySupport: false,
          
          // Enterprise Features
          multiTenant: false,
          cloudClustering: false,
          customGovernance: false,
          slaSupport: false,
          
          // Security
          emergencyLock: true,
          offlineReadOnly: true,
          timeBoxedPermissions: false,
          customPermissions: false
        },
        limits: {
          autoRules: 0,
          simulations: 0,
          skillInstalls: 0,
          skillsPerCategory: 0,
          tenants: 1,
          apiCallsPerHour: 500,
          auditRetentionDays: 7,
          exportQuota: 0
        },
        upgradeTriggers: [
          'Acey keeps suggesting things — I want her to handle this automatically',
          'I want to try skills before committing',
          'I need basic compliance exports'
        ],
        color: '#2196F3',
        popular: true
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29,
        billing: 'monthly',
        target: 'agency',
        description: 'Operational Autonomy - For Teams & Power Users',
        features: {
          // Core Control
          readOnlyDashboards: true,
          liveStatusView: true,
          mobileControl: true,
          unlimitedApprovals: true,
          manualApprovalsOnly: false,
          
          // Audit & Compliance
          incidentAlerts: true,
          auditTimeline: true,
          auditReplayDays: 30,
          incidentSummaries: true,
          complianceExports: true,
          investorSummaries: false,
          
          // Advanced Features
          autoRules: true,
          simulationEngine: true,
          skillStoreAccess: true,
          multiDeviceQuorum: true,
          hardwareKeySupport: false,
          
          // Enterprise Features
          multiTenant: false,
          cloudClustering: false,
          customGovernance: false,
          slaSupport: false,
          
          // Security
          emergencyLock: true,
          offlineReadOnly: true,
          timeBoxedPermissions: true,
          customPermissions: false
        },
        limits: {
          autoRules: 10,
          simulations: 20,
          skillInstalls: 10,
          skillsPerCategory: 3,
          tenants: 1,
          apiCallsPerHour: 2000,
          auditRetentionDays: 30,
          exportQuota: 10
        },
        upgradeTriggers: [
          'This is working — I need guarantees and separation',
          'I need to manage multiple teams',
          'I require hardware key security'
        ],
        color: '#FF9800'
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99,
        billing: 'monthly',
        target: 'enterprise',
        description: 'Governed Intelligence Platform - For Organizations',
        features: {
          // Core Control
          readOnlyDashboards: true,
          liveStatusView: true,
          mobileControl: true,
          unlimitedApprovals: true,
          manualApprovalsOnly: false,
          
          // Audit & Compliance
          incidentAlerts: true,
          auditTimeline: true,
          auditReplayDays: -1, // Unlimited
          incidentSummaries: true,
          complianceExports: true,
          investorSummaries: true,
          
          // Advanced Features
          autoRules: true,
          simulationEngine: true,
          skillStoreAccess: true,
          multiDeviceQuorum: true,
          hardwareKeySupport: true,
          
          // Enterprise Features
          multiTenant: true,
          cloudClustering: true,
          customGovernance: true,
          slaSupport: true,
          
          // Security
          emergencyLock: true,
          offlineReadOnly: true,
          timeBoxedPermissions: true,
          customPermissions: true
        },
        limits: {
          autoRules: -1, // Unlimited
          simulations: -1,
          skillInstalls: -1,
          skillsPerCategory: -1,
          tenants: -1,
          apiCallsPerHour: -1,
          auditRetentionDays: -1,
          exportQuota: -1
        },
        upgradeTriggers: [],
        color: '#4CAF50'
      }
    ];

    tiers.forEach(tier => this.tiers.set(tier.id, tier));
  }

  /**
   * Initialize upgrade triggers
   */
  private initializeUpgradeTriggers(): void {
    this.upgradeTriggers = [
      {
        fromTier: 'free',
        toTier: 'creator-plus',
        trigger: 'mobile_approval_request',
        userStory: 'I want to approve things from my phone.',
        unlocks: [
          'Mobile approvals',
          'Full audit timeline (7 days)',
          'Emergency lock',
          'Offline read-only mode'
        ],
        frequency: 'daily'
      },
      {
        fromTier: 'creator-plus',
        toTier: 'pro',
        trigger: 'auto_rule_suggestion',
        userStory: 'Acey keeps suggesting things — I want her to handle this automatically.',
        unlocks: [
          'Auto-rules (permission-gated)',
          'Simulation engine',
          'Skill Store access',
          'Multi-device quorum unlock'
        ],
        frequency: 'weekly'
      },
      {
        fromTier: 'pro',
        toTier: 'enterprise',
        trigger: 'multi_tenant_need',
        userStory: 'This is working — I need guarantees and separation.',
        unlocks: [
          'Multi-tenant isolation',
          'Cloud clustering',
          'Hardware key support',
          'Advanced compliance exports',
          'Custom governance rules'
        ],
        frequency: 'monthly'
      }
    ];
  }

  /**
   * Initialize skill pricing bands
   */
  private initializeSkillPricing(): void {
    const bands: SkillPricingBand[] = [
      {
        category: 'monitoring',
        minPrice: 5,
        maxPrice: 15,
        description: 'Real-time monitoring and alerting skills',
        examples: ['Stream Ops Pro', 'System Health Monitor', 'Performance Tracker']
      },
      {
        category: 'optimization',
        minPrice: 10,
        maxPrice: 25,
        description: 'Performance and efficiency optimization skills',
        examples: ['Audio Quality Optimizer', 'Resource Manager', 'Timing Optimizer']
      },
      {
        category: 'creative',
        minPrice: 5,
        maxPrice: 20,
        description: 'Creative enhancement and content generation skills',
        examples: ['Hype Engine', 'Content Assistant', 'Creative Tools']
      },
      {
        category: 'ops_automation',
        minPrice: 15,
        maxPrice: 40,
        description: 'Operational automation and workflow skills',
        examples: ['Auto Moderator', 'Stream Automation', 'Workflow Manager']
      }
    ];

    bands.forEach(band => this.skillBands.set(band.category, band));
  }

  /**
   * Get all pricing tiers
   */
  getPricingTiers(): PricingTier[] {
    return Array.from(this.tiers.values());
  }

  /**
   * Get pricing tier by ID
   */
  getPricingTier(tierId: string): PricingTier | null {
    return this.tiers.get(tierId) || null;
  }

  /**
   * Check if tenant can use feature
   */
  canUseFeature(tenantId: string, feature: keyof TierFeatures): { allowed: boolean; reason?: string; upgradeTo?: string } {
    const entitlement = this.getEntitlement(tenantId);
    if (!entitlement) {
      return { allowed: false, reason: 'No subscription found' };
    }

    const tier = this.tiers.get(entitlement.tierId);
    if (!tier) {
      return { allowed: false, reason: 'Invalid tier' };
    }

    const hasFeature = entitlement.features[feature];
    
    if (!hasFeature) {
      // Find next tier that has this feature
      const upgradeTier = this.findUpgradeForFeature(entitlement.tierId, feature);
      return { 
        allowed: false, 
        reason: `Feature not available in ${tier.name}`,
        upgradeTo: upgradeTier?.id
      };
    }

    return { allowed: true };
  }

  /**
   * Check if tenant is within limits
   */
  checkLimits(tenantId: string, limitType: keyof TierLimits, usage: number): { allowed: boolean; remaining?: number; upgradeTo?: string } {
    const entitlement = this.getEntitlement(tenantId);
    if (!entitlement) {
      return { allowed: false };
    }

    const limit = entitlement.limits[limitType];
    
    // Unlimited limits are -1
    if (limit === -1) {
      return { allowed: true, remaining: -1 };
    }

    const remaining = limit - usage;
    
    if (remaining <= 0) {
      const upgradeTier = this.findUpgradeForLimit(entitlement.tierId, limitType);
      return { 
        allowed: false, 
        remaining: 0,
        upgradeTo: upgradeTier?.id
      };
    }

    return { allowed: true, remaining };
  }

  /**
   * Get tenant entitlement
   */
  getEntitlement(tenantId: string): SubscriptionEntitlement | null {
    return this.entitlements.get(tenantId) || null;
  }

  /**
   * Create or update tenant entitlement
   */
  updateEntitlement(tenantId: string, tierId: string): SubscriptionEntitlement {
    const tier = this.tiers.get(tierId);
    if (!tier) {
      throw new Error('Invalid tier ID');
    }

    const entitlement: SubscriptionEntitlement = {
      tenantId,
      tierId,
      features: tier.features,
      limits: tier.limits,
      usage: {
        autoRulesUsed: 0,
        simulationsUsed: 0,
        skillsInstalled: 0,
        apiCallsUsed: 0,
        exportsUsed: 0
      },
      upgradeSuggestions: this.getUpgradeTriggersForTier(tierId),
      lastUpgradeCheck: Date.now()
    };

    this.entitlements.set(tenantId, entitlement);
    return entitlement;
  }

  /**
   * Record usage against limits
   */
  recordUsage(tenantId: string, usage: Partial<SubscriptionEntitlement['usage']>): void {
    const entitlement = this.entitlements.get(tenantId);
    if (!entitlement) return;

    Object.assign(entitlement.usage, usage);
    this.entitlements.set(tenantId, entitlement);
  }

  /**
   * Get upgrade suggestions for tenant
   */
  getUpgradeSuggestions(tenantId: string): UpgradeTrigger[] {
    const entitlement = this.getEntitlement(tenantId);
    if (!entitlement) return [];

    return this.upgradeTriggers.filter(trigger => trigger.fromTier === entitlement.tierId);
  }

  /**
   * Check if skill is compatible with tier
   */
  isSkillCompatible(tenantId: string, skillCategory: string, skillPrice: number): { compatible: boolean; reason?: string } {
    const entitlement = this.getEntitlement(tenantId);
    if (!entitlement) {
      return { compatible: false, reason: 'No subscription found' };
    }

    const tier = this.tiers.get(entitlement.tierId);
    if (!tier) {
      return { compatible: false, reason: 'Invalid tier' };
    }

    // Free tier cannot install skills
    if (tier.id === 'free') {
      return { compatible: false, reason: 'Skill installation requires Creator+ tier or higher' };
    }

    // Creator+ tier can only install manual-only skills
    if (tier.id === 'creator-plus' && tier.features.manualApprovalsOnly) {
      return { compatible: true, reason: 'Manual-only skills allowed' };
    }

    // Pro and Enterprise can install all skills
    return { compatible: true };
  }

  /**
   * Get skill pricing band
   */
  getSkillPricingBand(category: string): SkillPricingBand | null {
    return this.skillBands.get(category) || null;
  }

  /**
   * Get all skill pricing bands
   */
  getSkillPricingBands(): SkillPricingBand[] {
    return Array.from(this.skillBands.values());
  }

  /**
   * Calculate monthly revenue projection
   */
  calculateRevenueProjection(): {
    tiers: Array<{ name: string; subscribers: number; revenue: number }>;
    skills: Array<{ category: string; installs: number; revenue: number }>;
    total: number;
  } {
    // Mock data - in production, calculate from actual subscriptions
    const tierSubscribers = {
      free: 1000,
      'creator-plus': 150,
      pro: 45,
      enterprise: 8
    };

    const tierRevenue = Object.entries(tierSubscribers).map(([tierId, subscribers]) => {
      const tier = this.tiers.get(tierId);
      return {
        name: tier?.name || tierId,
        subscribers,
        revenue: subscribers * (tier?.price || 0)
      };
    });

    // Mock skill revenue
    const skillInstalls = {
      monitoring: 80,
      optimization: 45,
      creative: 120,
      ops_automation: 25
    };

    const skillRevenue = Object.entries(skillInstalls).map(([category, installs]) => {
      const band = this.skillBands.get(category);
      const avgPrice = band ? (band.minPrice + band.maxPrice) / 2 : 15;
      return {
        category,
        installs,
        revenue: installs * avgPrice
      };
    });

    const total = tierRevenue.reduce((sum, tier) => sum + tier.revenue, 0) +
                  skillRevenue.reduce((sum, skill) => sum + skill.revenue, 0);

    return {
      tiers: tierRevenue,
      skills: skillRevenue,
      total
    };
  }

  /**
   * Generate pricing page data
   */
  generatePricingPage(): {
    tiers: PricingTier[];
    skillBands: SkillPricingBand[];
    upgradeLadder: Array<{
      from: string;
      to: string;
      trigger: string;
      story: string;
      unlocks: string[];
    }>;
  } {
    const tiers = this.getPricingTiers();
    const skillBands = this.getSkillPricingBands();
    
    const upgradeLadder = this.upgradeTriggers.map(trigger => ({
      from: this.tiers.get(trigger.fromTier)?.name || trigger.fromTier,
      to: this.tiers.get(trigger.toTier)?.name || trigger.toTier,
      trigger: trigger.trigger,
      story: trigger.userStory,
      unlocks: trigger.unlocks
    }));

    return {
      tiers,
      skillBands,
      upgradeLadder
    };
  }

  /**
   * Private helper methods
   */
  private getUpgradeTriggersForTier(tierId: string): UpgradeTrigger[] {
    return this.upgradeTriggers.filter(trigger => trigger.fromTier === tierId);
  }

  private findUpgradeForFeature(currentTierId: string, feature: keyof TierFeatures): PricingTier | null {
    const tiers = Array.from(this.tiers.values()).sort((a, b) => a.price - b.price);
    const currentIndex = tiers.findIndex(t => t.id === currentTierId);
    
    for (let i = currentIndex + 1; i < tiers.length; i++) {
      if (tiers[i].features[feature]) {
        return tiers[i];
      }
    }
    
    return null;
  }

  private findUpgradeForLimit(currentTierId: string, limitType: keyof TierLimits): PricingTier | null {
    const tiers = Array.from(this.tiers.values()).sort((a, b) => a.price - b.price);
    const currentIndex = tiers.findIndex(t => t.id === currentTierId);
    
    for (let i = currentIndex + 1; i < tiers.length; i++) {
      if (tiers[i].limits[limitType] === -1 || tiers[i].limits[limitType] > tiers[currentIndex].limits[limitType]) {
        return tiers[i];
      }
    }
    
    return null;
  }
}

export const pricingService = new PricingService();
