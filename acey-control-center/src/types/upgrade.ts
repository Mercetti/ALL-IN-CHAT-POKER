/**
 * TypeScript Interfaces for Upgrade System
 * Strong typing for tiers, skills, and upgrade flows
 */

export interface Tier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
  billing: 'monthly' | 'annual';
  target: 'observer' | 'creator' | 'agency' | 'enterprise';
}

export interface User {
  id: string;
  tierId: string;
}

export interface Skill {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'monitoring' | 'optimization' | 'creative' | 'ops_automation' | 'analysis';
  requiredTierId: string;
  installed: boolean;
  icon?: string;
  rating?: number;
  reviews?: number;
  trialDays?: number;
}

export interface UpgradePromptProps {
  requiredTierId: string;
  featureName?: string;
  onUpgrade: () => void;
  onCancel: () => void;
  visible: boolean;
}

export interface FeatureTooltipProps {
  title: string;
  description: string;
  visible: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export interface TierCardProps {
  tier: Tier;
  onUpgradePress: () => void;
  compact?: boolean;
}

export interface SkillCardProps {
  skill: Skill;
  onInstallPress: () => void;
  currentTierId: string;
  compact?: boolean;
}

export interface UpgradeConfirmationParams {
  tierId?: string;
  skillId?: string;
  fromFeature?: string;
}

export interface UpgradeFlowStep {
  title: string;
  subtitle?: string;
  body?: string;
  primaryButton: string;
  secondaryButton?: string;
  showTrial?: boolean;
  trialDays?: number;
  price?: number;
  features?: string[];
}

export interface SubscriptionResponse {
  success: boolean;
  subscription?: {
    id: string;
    tierId: string;
    status: 'active' | 'trialing' | 'past_due';
    currentPeriodEnd: number;
    trialEnd?: number;
  };
  error?: string;
}

export interface SkillInstallationResponse {
  success: boolean;
  installation?: {
    id: string;
    skillId: string;
    status: 'installed' | 'pending' | 'failed';
    installedAt: number;
  };
  error?: string;
}

export interface UpgradeAnalytics {
  flowStarted: string;
  flowCompleted?: string;
  abandonedAt?: string;
  triggerFeature?: string;
  userTier?: string;
  targetTier?: string;
  conversionTime?: number;
}
