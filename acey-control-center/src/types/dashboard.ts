/**
 * Dashboard TypeScript Interfaces
 * Centralized types for Skill Store + Upgrade Dashboard
 */

export interface User {
  id: string;
  tierId: string;
  name: string;
  email?: string;
  avatar?: string;
  subscriptionActive?: boolean;
  subscriptionEndsAt?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  price: number;
  requiredTierId: string;
  installed: boolean;
  category: 'monitoring' | 'optimization' | 'creative' | 'ops_automation';
  icon?: string;
  rating?: number;
  reviews?: number;
  trialDays?: number;
  features?: string[];
}

export interface LLMMetrics {
  skillId: string;
  trustScore: number; // 0-100
  datasetEntries: number;
  permissionsGranted: string[];
  lastUpdated: number;
  performanceMetrics?: {
    responseTime: number;
    accuracy: number;
    reliability: number;
  };
}

export interface Tier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  maxSkills?: number;
  prioritySupport?: boolean;
  billing: 'monthly' | 'annual';
}

export interface DashboardStats {
  totalSkills: number;
  installedSkills: number;
  availableSkills: number;
  totalTrustScore: number;
  totalDatasetEntries: number;
  activePermissions: string[];
}

export interface SkillInstallationResponse {
  success: boolean;
  installation?: {
    id: string;
    skillId: string;
    status: 'installed' | 'pending' | 'failed';
    installedAt: number;
  };
  unlockedFeatures?: string[];
  error?: string;
}

export interface TierUpgradeResponse {
  success: boolean;
  subscription?: {
    id: string;
    tierId: string;
    status: 'active' | 'trialing' | 'past_due';
    currentPeriodEnd: number;
    trialEnd?: number;
  };
  unlockedSkills?: Skill[];
  newPermissions?: string[];
  error?: string;
}

export interface DashboardState {
  user: User;
  skills: Skill[];
  metrics: LLMMetrics[];
  tiers: Tier[];
  stats: DashboardStats;
  loading: boolean;
  installingId: string | null;
  upgrading: boolean;
}
