/**
 * Acey White-Label Pricing Tiers
 * Business logic for tier-based feature access and billing
 */

const ACEY_PRICING_TIERS = {
  // Tier 1 - Core (Starter)
  core: {
    name: "Acey Core",
    target: "Small platforms, indie marketplaces, early creator networks",
    pricing: {
      monthly: { min: 499, max: 999 },
      billing: "monthly"
    },
    features: {
      whiteLabelUI: true,
      partnerRevenueTracking: true,
      automatedMonthlyPayouts: true,
      basicTrustScoring: true,
      manualApprovalGates: true,
      csvPdfExports: true
    },
    limits: {
      tenants: 1,
      payoutFrequency: "monthly",
      investorDashboards: false,
      disputeAutomation: false,
      multiCurrency: false,
      partnerSelfServe: false
    },
    valueProp: "Replace spreadsheets and manual payouts with AI-assisted clarity."
  },

  // Tier 2 - Pro (Growth)
  pro: {
    name: "Acey Pro",
    target: "Mid-size platforms, Twitch-adjacent tools, SaaS revenue-share products",
    pricing: {
      monthly: { min: 2500, max: 5000 },
      billing: "monthly"
    },
    features: {
      whiteLabelUI: true,
      partnerRevenueTracking: true,
      automatedMonthlyPayouts: true,
      basicTrustScoring: true,
      manualApprovalGates: true,
      csvPdfExports: true,
      multiCurrencyHandling: true,
      automatedPartnerStatements: true,
      disputeWorkflows: true,
      trustScoreAutomation: true,
      revenueForecasting: true,
      partnerSelfServeDashboards: true,
      mobilePayoutApprovalUI: true
    },
    limits: {
      tenants: 3,
      investorDashboards: "limited",
      cloudLLMInference: true,
      customModelFineTuning: false
    },
    valueProp: "Operate partner ecosystems like a financial institution — without the overhead."
  },

  // Tier 3 - Enterprise (Governance)
  enterprise: {
    name: "Acey Enterprise",
    target: "Large platforms, creator economies, regulated or investor-heavy orgs",
    pricing: {
      monthly: { min: 10000, max: null },
      billing: "custom"
    },
    features: {
      whiteLabelUI: true,
      partnerRevenueTracking: true,
      automatedMonthlyPayouts: true,
      basicTrustScoring: true,
      manualApprovalGates: true,
      csvPdfExports: true,
      multiCurrencyHandling: true,
      automatedPartnerStatements: true,
      disputeWorkflows: true,
      trustScoreAutomation: true,
      revenueForecasting: true,
      partnerSelfServeDashboards: true,
      mobilePayoutApprovalUI: true,
      fullWhiteLabel: true,
      unlimitedTenants: true,
      investorLiveDashboards: true,
      automatedTrustRiskAnalytics: true,
      legalReviewSummaries: true,
      socStyleAuditExports: true,
      roleBasedPermissions: true,
      selfHostedOrHybridDeployment: true
    },
    limits: {
      tenants: "unlimited",
      investorDashboards: "unlimited",
      customModelFineTuning: true,
      dedicatedComplianceSupport: true,
      sguarantees: true
    },
    valueProp: "AI-governed financial infrastructure you can put in front of investors."
  }
};

// Add-ons for Enterprise tier
const ENTERPRISE_ADDONS = {
  customModelFineTuning: {
    name: "Custom Model Fine-Tuning",
    pricing: "custom",
    description: "Train Acey on your specific domain and workflows"
  },
  dedicatedComplianceSupport: {
    name: "Dedicated Compliance Support",
    pricing: "custom",
    description: "SLA-backed compliance and regulatory guidance"
  },
  sguarantees: {
    name: "SLA Guarantees",
    pricing: "custom",
    description: "99.9% uptime and response time guarantees"
  }
};

class TierManager {
  constructor() {
    this.tiers = ACEY_PRICING_TIERS;
    this.addons = ENTERPRISE_ADDONS;
  }

  // Get tier by name
  getTier(tierName) {
    return this.tiers[tierName.toLowerCase()];
  }

  // Check if feature is available for tier
  hasFeature(tierName, feature) {
    const tier = this.getTier(tierName);
    return tier && tier.features[feature] === true;
  }

  // Check if tier exceeds limits
  exceedsLimit(tierName, limitType, currentValue) {
    const tier = this.getTier(tierName);
    if (!tier || !tier.limits[limitType]) return false;
    
    const limit = tier.limits[limitType];
    if (typeof limit === 'number') {
      return currentValue > limit;
    }
    return false;
  }

  // Calculate monthly cost
  calculateMonthlyCost(tierName, quantity = 1, addons = []) {
    const tier = this.getTier(tierName);
    if (!tier) return null;

    let baseCost = quantity * (tier.pricing.monthly.min + tier.pricing.monthly.max) / 2;
    
    // Add enterprise add-ons
    let addonCost = 0;
    if (tierName === 'enterprise') {
      addons.forEach(addon => {
        if (this.addons[addon]) {
          addonCost += this.addons[addon].pricing === 'custom' ? 0 : 5000; // Placeholder
        }
      });
    }

    return {
      baseCost,
      addonCost,
      totalCost: baseCost + addonCost,
      currency: 'USD',
      billing: tier.pricing.billing
    };
  }

  // Get upgrade path
  getUpgradePath(currentTier) {
    const tiers = Object.keys(this.tiers);
    const currentIndex = tiers.indexOf(currentTier.toLowerCase());
    
    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
      return null;
    }

    return tiers.slice(currentIndex + 1).map(tier => ({
      tier,
      name: this.tiers[tier].name,
      additionalFeatures: this.getAdditionalFeatures(currentTier, tier),
      costIncrease: this.calculateCostIncrease(currentTier, tier)
    }));
  }

  // Get additional features when upgrading
  getAdditionalFeatures(fromTier, toTier) {
    const from = this.getTier(fromTier);
    const to = this.getTier(toTier);
    
    if (!from || !to) return [];
    
    return Object.keys(to.features).filter(feature => !from.features[feature]);
  }

  // Calculate cost increase for upgrade
  calculateCostIncrease(fromTier, toTier) {
    const fromCost = this.calculateMonthlyCost(fromTier);
    const toCost = this.calculateMonthlyCost(toTier);
    
    if (!fromCost || !toCost) return null;
    
    return {
      from: fromCost.baseCost,
      to: toCost.baseCost,
      increase: toCost.baseCost - fromCost.baseCost,
      percentage: ((toCost.baseCost - fromCost.baseCost) / fromCost.baseCost * 100).toFixed(1)
    };
  }

  // Validate tier access to skill
  canAccessSkill(tierName, skillTier) {
    const tierHierarchy = ['core', 'pro', 'enterprise'];
    const tierIndex = tierHierarchy.indexOf(tierName.toLowerCase());
    const skillIndex = tierHierarchy.indexOf(skillTier.toLowerCase());
    
    return tierIndex >= skillIndex;
  }
}

module.exports = {
  ACEY_PRICING_TIERS,
  ENTERPRISE_ADDONS,
  TierManager
};
