export type SkillType = 'Code' | 'Graphics' | 'Audio' | 'Analytics';

export interface SkillStore {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  enabled: boolean;
  usageCount: number;
  lastUsed?: Date;
  tier?: 'free' | 'pro' | 'enterprise';
}

export interface SkillUsage {
  skillId: string;
  timestamp: Date;
  success: boolean;
  duration: number;
  outputSize?: number;
}

export interface LearningData {
  id: string;
  skill: SkillType;
  content: string | ArrayBuffer;
  metadata?: Record<string, any>;
  timestamp: Date;
  approvedForLearning: boolean;
  userId?: string;
  sessionId?: string;
}
