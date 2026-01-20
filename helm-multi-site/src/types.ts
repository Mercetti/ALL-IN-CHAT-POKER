export type SkillStatus = 'inactive' | 'training' | 'active';

export interface SkillModule {
  name: string;
  description: string;
  phase: number;
  dependencies?: string[];
  status: SkillStatus;
  allowedOperations: string[];
  safetyConstraints: string[];
}

export interface Phase {
  number: number;
  name: string;
  skills: string[];
  trainingEnvironment: string;
  testSites: string[];
  escalationRules: string[];
}

export interface ActionLog {
  timestamp: string;
  site: string;
  skill: string;
  action: string;
  status: 'success' | 'warning' | 'error';
  details?: string;
}

export interface SiteConfig {
  id: string;
  name: string;
  url: string;
  environment: 'development' | 'staging' | 'production';
  activeSkills: string[];
  permissions: {
    owner: string[];
    developers: string[];
    readonly: string[];
  };
  health: {
    status: 'healthy' | 'warning' | 'error';
    lastCheck: string;
    metrics: {
      uptime: number;
      responseTime: number;
      errorRate: number;
    };
  };
}

export interface SkillTier {
  name: string;
  price: number;
  duration: number; // days
  features: string[];
  skills: string[];
}

export interface NotificationConfig {
  id: string;
  type: 'skill_change' | 'log_alert' | 'demo_update' | 'financial' | 'system';
  title: string;
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  recipients: string[]; // owner, developers, readonly
}

export interface FinancialMetrics {
  siteId: string;
  period: string;
  revenue: number;
  costs: number;
  profit: number;
  partnerPayouts: {
    partnerId: string;
    amount: number;
    status: 'pending' | 'paid' | 'failed';
  }[];
}
