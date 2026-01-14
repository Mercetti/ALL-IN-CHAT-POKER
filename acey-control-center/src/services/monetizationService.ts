/**
 * Acey Monetization System
 * Ethical, scalable, non-gambling revenue model
 */

import axios from 'axios';
import { UserAccess } from './authService';
import { sendUserNotification, sendOwnerNotification } from './notificationService';

const BASE_URL = 'http://localhost:8080/api';

export interface SkillPricing {
  skillId: string;
  name: string;
  price: number;
  tier: string;
  trialDays: number;
  features: string[];
}

export interface ControlPlan {
  id: string;
  name: string;
  target: 'solo' | 'creator' | 'agency' | 'enterprise';
  pricing: {
    monthly: number;
    annual: number;
    currency: 'USD' | 'EUR';
  };
  features: {
    localModel: boolean;
    manualApprovals: boolean;
    autoRules: boolean;
    analytics: boolean;
    mobileControl: boolean;
    multiTenant: boolean;
    skillStore: boolean;
    clustering: boolean;
    complianceExports: boolean;
    prioritySupport: boolean;
  };
  limits: {
    maxUsers: number;
    maxSkills: number;
    maxMemoryGB: number;
    monthlyActions: number;
    apiCallsPerHour: number;
  };
}

export interface SkillListing {
  id: string;
  name: string;
  description: string;
  author: string;
  pricing: {
    type: 'one_time' | 'monthly' | 'annual';
    amount: number;
    currency: string;
    trialDays?: number;
  };
  category: string;
  trustRequired: number;
  revenueShare: number; // Percentage split (70/30 = 70 to developer)
  downloads: number;
  rating: number;
  reviews: number;
  status: 'draft' | 'pending' | 'approved' | 'published' | 'suspended';
}

export interface ComputePlan {
  id: string;
  name: string;
  type: 'managed' | 'bring_your_own';
  pricing: {
    hourly: number;
    monthlyCap?: number;
  };
  features: {
    autoScaling: boolean;
    loadBalancing: boolean;
    monitoring: boolean;
    backups: boolean;
  };
  limits: {
    maxConcurrent: number;
    memoryPerInstance: number;
    storageGB: number;
    bandwidthGB: number;
  };
}

export interface CompliancePackage {
  id: string;
  name: string;
  pricing: {
    oneTime: number;
    monthly?: number;
  };
  features: {
    auditExports: boolean;
    incidentReports: boolean;
    governanceReports: boolean;
    investorDocs: boolean;
    dataDeclarations: boolean;
    customFormats: boolean;
  };
  delivery: 'instant' | 'manual';
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEnd?: number;
  usage: {
    actionsUsed: number;
    apiCallsUsed: number;
    memoryUsed: number;
    skillsInstalled: number;
  };
  addons: {
    skills: string[];
    compute: string[];
    compliance: string[];
  };
}

class MonetizationService {
  private controlPlans: Map<string, ControlPlan> = new Map();
  private skillListings = new Map<string, SkillListing>();
  private computePlans = new Map<string, ComputePlan>();
  private compliancePackages = new Map<string, CompliancePackage>();
  private subscriptions = new Map<string, Subscription>();

  constructor() {
    this.initializeControlPlans();
    this.initializeComputePlans();
    this.initializeCompliancePackages();
  }

  /**
   * Initialize control plans
   */
  private initializeControlPlans(): void {
    const plans: ControlPlan[] = [
      {
        id: 'solo',
        name: 'Solo',
        target: 'solo',
        pricing: { monthly: 29, annual: 290, currency: 'USD' },
        features: {
          localModel: true,
          manualApprovals: true,
          autoRules: false,
          analytics: false,
          mobileControl: true,
          multiTenant: false,
          skillStore: false,
          clustering: false,
          complianceExports: false,
          prioritySupport: false
        },
        limits: {
          maxUsers: 1,
          maxSkills: 5,
          maxMemoryGB: 2,
          monthlyActions: 1000,
          apiCallsPerHour: 100
        }
      },
      {
        id: 'creator-plus',
        name: 'Creator+',
        target: 'creator',
        pricing: { monthly: 99, annual: 990, currency: 'USD' },
        features: {
          localModel: true,
          manualApprovals: true,
          autoRules: true,
          analytics: true,
          mobileControl: true,
          multiTenant: false,
          skillStore: true,
          clustering: false,
          complianceExports: false,
          prioritySupport: true
        },
        limits: {
          maxUsers: 3,
          maxSkills: 20,
          maxMemoryGB: 8,
          monthlyActions: 10000,
          apiCallsPerHour: 500
        }
      },
      {
        id: 'pro',
        name: 'Pro',
        target: 'agency',
        pricing: { monthly: 499, annual: 4990, currency: 'USD' },
        features: {
          localModel: true,
          manualApprovals: true,
          autoRules: true,
          analytics: true,
          mobileControl: true,
          multiTenant: true,
          skillStore: true,
          clustering: false,
          complianceExports: true,
          prioritySupport: true
        },
        limits: {
          maxUsers: 10,
          maxSkills: 100,
          maxMemoryGB: 32,
          monthlyActions: 100000,
          apiCallsPerHour: 2000
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        target: 'enterprise',
        pricing: { monthly: 1999, annual: 19990, currency: 'USD' },
        features: {
          localModel: true,
          manualApprovals: true,
          autoRules: true,
          analytics: true,
          mobileControl: true,
          multiTenant: true,
          skillStore: true,
          clustering: true,
          complianceExports: true,
          prioritySupport: true
        },
        limits: {
          maxUsers: -1, // Unlimited
          maxSkills: -1,
          maxMemoryGB: 256,
          monthlyActions: -1,
          apiCallsPerHour: -1
        }
      }
    ];

    plans.forEach(plan => this.controlPlans.set(plan.id, plan));
  }

  /**
   * Initialize compute plans
   */
  private initializeComputePlans(): void {
    const plans: ComputePlan[] = [
      {
        id: 'bring-your-own',
        name: 'Bring Your Own LLM',
        type: 'bring_your_own',
        pricing: { hourly: 0, monthlyCap: 0 },
        features: {
          autoScaling: false,
          loadBalancing: false,
          monitoring: true,
          backups: false
        },
        limits: {
          maxConcurrent: 5,
          memoryPerInstance: 4,
          storageGB: 10,
          bandwidthGB: 100
        }
      },
      {
        id: 'managed-basic',
        name: 'Managed Basic',
        type: 'managed',
        pricing: { hourly: 0.50, monthlyCap: 200 },
        features: {
          autoScaling: true,
          loadBalancing: true,
          monitoring: true,
          backups: true
        },
        limits: {
          maxConcurrent: 10,
          memoryPerInstance: 8,
          storageGB: 50,
          bandwidthGB: 500
        }
      },
      {
        id: 'managed-pro',
        name: 'Managed Pro',
        type: 'managed',
        pricing: { hourly: 2.00, monthlyCap: 1000 },
        features: {
          autoScaling: true,
          loadBalancing: true,
          monitoring: true,
          backups: true
        },
        limits: {
          maxConcurrent: 50,
          memoryPerInstance: 16,
          storageGB: 200,
          bandwidthGB: 2000
        }
      }
    ];

    plans.forEach(plan => this.computePlans.set(plan.id, plan));
  }

  /**
   * Initialize compliance packages
   */
  private initializeCompliancePackages(): void {
    const packages: CompliancePackage[] = [
      {
        id: 'compliance-basic',
        name: 'Basic Compliance',
        pricing: { oneTime: 499 },
        features: {
          auditExports: true,
          incidentReports: true,
          governanceReports: false,
          investorDocs: false,
          dataDeclarations: true,
          customFormats: false
        },
        delivery: 'instant'
      },
      {
        id: 'compliance-pro',
        name: 'Pro Compliance',
        pricing: { oneTime: 1499, monthly: 199 },
        features: {
          auditExports: true,
          incidentReports: true,
          governanceReports: true,
          investorDocs: true,
          dataDeclarations: true,
          customFormats: true
        },
        delivery: 'instant'
      },
      {
        id: 'compliance-enterprise',
        name: 'Enterprise Compliance',
        pricing: { oneTime: 4999, monthly: 499 },
        features: {
          auditExports: true,
          incidentReports: true,
          governanceReports: true,
          investorDocs: true,
          dataDeclarations: true,
          customFormats: true
        },
        delivery: 'manual'
      }
    ];

    packages.forEach(pkg => this.compliancePackages.set(pkg.id, pkg));
  }

  /**
   * Get available control plans
   */
  getControlPlans(): ControlPlan[] {
    return Array.from(this.controlPlans.values());
  }

  /**
   * Get control plan by ID
   */
  getControlPlan(planId: string): ControlPlan | null {
    return this.controlPlans.get(planId) || null;
  }

  /**
   * Create subscription
   */
  async createSubscription(
    tenantId: string,
    planId: string,
    trialDays: number = 14
  ): Promise<Subscription> {
    const plan = this.controlPlans.get(planId);
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    const subscriptionId = this.generateSubscriptionId();
    const now = Date.now();
    const trialEnd = now + (trialDays * 24 * 60 * 60 * 1000);

    const subscription: Subscription = {
      id: subscriptionId,
      tenantId,
      planId,
      status: 'trialing',
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      cancelAtPeriodEnd: false,
      trialEnd,
      usage: {
        actionsUsed: 0,
        apiCallsUsed: 0,
        memoryUsed: 0,
        skillsInstalled: 0
      },
      addons: {
        skills: [],
        compute: [],
        compliance: []
      }
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Get subscription for tenant
   */
  getSubscription(tenantId: string): Subscription | null {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.tenantId === tenantId && subscription.status === 'active') {
        return subscription;
      }
    }
    return null;
  }

  /**
   * Check if tenant can perform action
   */
  canPerformAction(tenantId: string, action: string): { allowed: boolean; reason?: string } {
    const subscription = this.getSubscription(tenantId);
    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' };
    }

    const plan = this.controlPlans.get(subscription.planId);
    if (!plan) {
      return { allowed: false, reason: 'Invalid plan' };
    }

    // Check action limits
    switch (action) {
      case 'install_skill':
        if (plan.features.skillStore === false) {
          return { allowed: false, reason: 'Skill store not included in plan' };
        }
        if (plan.limits.maxSkills > 0 && subscription.usage.skillsInstalled >= plan.limits.maxSkills) {
          return { allowed: false, reason: 'Skill limit reached' };
        }
        break;

      case 'auto_rules':
        if (plan.features.autoRules === false) {
          return { allowed: false, reason: 'Auto rules not included in plan' };
        }
        break;

      case 'compliance_export':
        if (plan.features.complianceExports === false) {
          return { allowed: false, reason: 'Compliance exports not included in plan' };
        }
        break;

      case 'clustering':
        if (plan.features.clustering === false) {
          return { allowed: false, reason: 'Clustering not included in plan' };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Record usage
   */
  recordUsage(tenantId: string, usage: Partial<Subscription['usage']>): void {
    const subscription = this.getSubscription(tenantId);
    if (!subscription) return;

    Object.assign(subscription.usage, usage);
    this.subscriptions.set(subscription.id, subscription);
  }

  /**
   * Get compute plans
   */
  getComputePlans(): ComputePlan[] {
    return Array.from(this.computePlans.values());
  }

  /**
   * Get compliance packages
   */
  getCompliancePackages(): CompliancePackage[] {
    return Array.from(this.compliancePackages.values());
  }

  /**
   * Calculate monthly revenue
   */
  calculateMonthlyRevenue(): {
    subscriptions: number;
    skills: number;
    compute: number;
    compliance: number;
    total: number;
  } {
    let subscriptions = 0;
    let skills = 0;
    let compute = 0;
    let compliance = 0;

    for (const subscription of this.subscriptions.values()) {
      if (subscription.status === 'active') {
        const plan = this.controlPlans.get(subscription.planId);
        if (plan) {
          subscriptions += plan.pricing.monthly;
        }

        // Add addon revenue
        for (const skillId of subscription.addons.skills) {
          const skill = this.skillListings.get(skillId);
          if (skill && skill.pricing.type === 'monthly') {
            skills += skill.pricing.amount * (skill.revenueShare / 100);
          }
        }

        for (const computeId of subscription.addons.compute) {
          const computePlan = this.computePlans.get(computeId);
          if (computePlan) {
            compute += computePlan.pricing.monthlyCap || computePlan.pricing.hourly * 730; // 730 hours/month
          }
        }

        for (const complianceId of subscription.addons.compliance) {
          const compliancePkg = this.compliancePackages.get(complianceId);
          if (compliancePkg && compliancePkg.pricing.monthly) {
            compliance += compliancePkg.pricing.monthly;
          }
        }
      }
    }

    const total = subscriptions + skills + compute + compliance;

    return {
      subscriptions: Math.round(subscriptions * 100) / 100,
      skills: Math.round(skills * 100) / 100,
      compute: Math.round(compute * 100) / 100,
      compliance: Math.round(compliance * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  /**
   * Generate pricing page data
   */
  generatePricingPage(): {
    plans: ControlPlan[];
    features: string[];
    comparison: Array<ControlPlan & { popular?: boolean }>;
  } {
    const plans = this.getControlPlans();
    
    // Get all unique features
    const features = Array.from(new Set(
      plans.flatMap(plan => Object.keys(plan.features).filter(key => plan.features[key as keyof typeof plan.features]))
    ));

    // Add popular flag to Creator+ plan
    const comparison = plans.map(plan => ({
      ...plan,
      popular: plan.id === 'creator-plus'
    }));

    return {
      plans,
      features,
      comparison
    };
  }

  /**
   * Private helper methods
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export async function getSkillPricing(): Promise<SkillPricing[]> {
  try {
    const { data } = await axios.get(`${BASE_URL}/skills/pricing`);
    return data;
  } catch (error) {
    console.error('Error fetching skill pricing:', error);
    // Fallback pricing
    return [
      {
        skillId: 'code',
        name: 'Code Helper',
        price: 0,
        tier: 'Free',
        trialDays: 0,
        features: ['Basic code analysis', 'Bug detection', 'Syntax help']
      },
      {
        skillId: 'link',
        name: 'Link Review Pro',
        price: 15,
        tier: 'Pro',
        trialDays: 7,
        features: ['Advanced link analysis', 'Security scanning', 'Content summary']
      },
      {
        skillId: 'audio',
        name: 'Audio Maestro',
        price: 35,
        tier: 'Creator+',
        trialDays: 7,
        features: ['Custom audio generation', 'Voice synthesis', 'Music creation']
      },
      {
        skillId: 'graphics',
        name: 'Graphics Wizard',
        price: 35,
        tier: 'Creator+',
        trialDays: 7,
        features: ['Image generation', 'Style transfer', 'Brand assets']
      }
    ];
  }
}

export async function startTrial(userToken: string, skillId: string): Promise<UserAccess> {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/user/start-trial`,
      { skillId },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    return data;
  } catch (error) {
    console.error('Error starting trial:', error);
    throw error;
  }
}

export const monetizationService = new MonetizationService();

// Additional notification functions
export async function unlockSkill(userToken: string, skillName: string, username: string, ownerToken: string) {
  const { data } = await axios.post(
    `${BASE_URL}/user/unlock-skill`,
    { skillName },
    { headers: { Authorization: `Bearer ${userToken}` } }
  );

  // Notify user
  sendUserNotification('Skill Unlocked', `You've unlocked ${skillName}!`);

  // Notify owner/dev
  sendOwnerNotification(ownerToken, 'User Skill Unlock', `${username} unlocked ${skillName}.`);

  return data; // updated access info
}

export async function getAllUsersWithTrials() {
  try {
    const { data } = await axios.get(`${BASE_URL}/admin/users-with-trials`);
    return data;
  } catch (error) {
    console.error('Failed to fetch users with trials:', error);
    // Mock data for demo
    return [
      {
        userId: 'user123',
        username: 'demo_user',
        userToken: 'mock_token',
        trials: [
          { skillName: 'code_helper', expiresInHours: 12 },
          { skillName: 'audio_maestro', expiresInHours: 48 }
        ]
      }
    ];
  }
}

export async function logAccessAttempt(userToken: string, skillName: string, username: string, ownerToken: string) {
  sendOwnerNotification(ownerToken, 'Locked Skill Attempt', `${username} attempted to access locked skill ${skillName}.`);
}

export async function checkTrialExpirationsForOwner(ownerToken: string, userList: { username: string; trials: { skillName: string; expiresInHours: number }[] }[]) {
  userList.forEach(user => {
    user.trials.forEach(trial => {
      if (trial.expiresInHours <= 24) {
        sendOwnerNotification(ownerToken, 'Trial Expiring', `${user.username}'s trial for ${trial.skillName} expires in ${trial.expiresInHours} hours.`);
      }
    });
  });
}

export async function checkTrialExpirations(userToken: string, trials: { skillName: string; expiresInHours: number }[]) {
  trials.forEach(trial => {
    if (trial.expiresInHours <= 24) {
      sendUserNotification(
        'Trial Ending Soon',
        `Your trial for ${trial.skillName} ends in ${trial.expiresInHours} hours. Upgrade to continue using it.` 
      );
    }
  });
}

export async function getUserAccess(userToken: string) {
  const { data } = await axios.get(
    `${BASE_URL}/user/access`,
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  return data;
}

export async function getApprovedOutputs(ownerToken: string) {
  const { data } = await axios.get(
    `${BASE_URL}/admin/approved-outputs`,
    { headers: { Authorization: `Bearer ${ownerToken}` } }
  );
  return data;
}
