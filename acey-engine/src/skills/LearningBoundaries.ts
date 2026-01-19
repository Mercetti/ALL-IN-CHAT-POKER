export interface LearningBoundary {
  skillId: string;
  canImprove: boolean;
  learningRate?: number;
  maxLearningPerDay?: number;
  requiresHumanValidation?: boolean;
  learningDataRetention?: number; // days
}

export const LearningBoundaries: LearningBoundary[] = [
  { 
    skillId: 'audioMaestro', 
    canImprove: true, 
    learningRate: 0.1, 
    maxLearningPerDay: 10,
    requiresHumanValidation: false,
    learningDataRetention: 90
  },
  { 
    skillId: 'graphicsWizard', 
    canImprove: true, 
    learningRate: 0.15, 
    maxLearningPerDay: 8,
    requiresHumanValidation: false,
    learningDataRetention: 90
  },
  { 
    skillId: 'codeHelper', 
    canImprove: false, 
    learningRate: 0, 
    maxLearningPerDay: 0,
    requiresHumanValidation: true,
    learningDataRetention: 30
  },
  { 
    skillId: 'contentOptimizer', 
    canImprove: true, 
    learningRate: 0.2, 
    maxLearningPerDay: 15,
    requiresHumanValidation: false,
    learningDataRetention: 60
  },
  { 
    skillId: 'dataAnalyzer', 
    canImprove: true, 
    learningRate: 0.25, 
    maxLearningPerDay: 5,
    requiresHumanValidation: true,
    learningDataRetention: 180
  },
  { 
    skillId: 'workflowAutomator', 
    canImprove: true, 
    learningRate: 0.3, 
    maxLearningPerDay: 3,
    requiresHumanValidation: true,
    learningDataRetention: 365
  },
];

export function canSkillLearn(skillId: string): boolean {
  const boundary = LearningBoundaries.find(b => b.skillId === skillId);
  return boundary?.canImprove ?? false;
}

export function getLearningBoundary(skillId: string): LearningBoundary | undefined {
  return LearningBoundaries.find(b => b.skillId === skillId);
}

export function getLearnableSkills(): LearningBoundary[] {
  return LearningBoundaries.filter(b => b.canImprove);
}

export function getSkillsRequiringValidation(): LearningBoundary[] {
  return LearningBoundaries.filter(b => b.requiresHumanValidation === true);
}

export function shouldLimitLearning(skillId: string, currentLearningCount: number): boolean {
  const boundary = getLearningBoundary(skillId);
  if (!boundary || !boundary.canImprove) return true;
  
  return boundary.maxLearningPerDay ? 
    currentLearningCount >= boundary.maxLearningPerDay : 
    false;
}

export function getLearningDataRetentionDays(skillId: string): number {
  const boundary = getLearningBoundary(skillId);
  return boundary?.learningDataRetention ?? 30;
}

export function isLearningRateLimited(skillId: string): boolean {
  const boundary = getLearningBoundary(skillId);
  return boundary?.learningRate !== undefined && boundary.learningRate > 0;
}
