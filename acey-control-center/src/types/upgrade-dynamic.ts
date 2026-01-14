/**
 * Updated TypeScript Interfaces for Dynamic Skill Store
 * Includes dynamic installation status and user information
 */

export interface Skill {
  id: string;
  name: string;
  price: number;
  description: string;
  requiredTierId: string;
  installed: boolean; // dynamic - changes after installation
  category?: 'monitoring' | 'optimization' | 'creative' | 'ops_automation' | 'analytics' | 'moderation' | 'entertainment' | 'content';
  rating?: number;
  reviews?: number;
  trialDays?: number;
  icon?: string;
  features?: string[];
  tags?: string[];
  developer?: string;
  version?: string;
  lastUpdated?: string;
}

export interface User {
  id: string;
  tierId: string;
  email?: string;
  name?: string;
  createdAt?: string;
  lastActive?: string;
}

export interface SkillInstallationResponse {
  success: boolean;
  installation?: {
    id: string;
    skillId: string;
    userId: string;
    installedAt: string;
    status: 'installed' | 'pending' | 'failed';
  };
  message?: string;
  error?: string;
}

export interface LLMOrchestrationPayload {
  userId: string;
  skillId?: string;
  tierId?: string;
  action: 'install_skill' | 'uninstall_skill' | 'upgrade' | 'downgrade';
  permissions?: string[];
  trustLevel?: number;
  datasetAccess?: string[];
}

export interface SkillStoreState {
  skills: Skill[];
  loading: boolean;
  installingId: string | null;
  error: string | null;
  refreshing: boolean;
}

export interface SkillCardProps {
  skill: Skill;
  onInstallPress: () => void;
  installing?: boolean;
  currentUserTier: string;
}
