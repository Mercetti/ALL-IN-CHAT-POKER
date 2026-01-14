import { GeneratedOutput, SkillType } from '../types/skills';

export const aceyLearningDataset: GeneratedOutput[] = [];

// Memory management functions
export const addToMemory = (output: GeneratedOutput): void => {
  aceyLearningDataset.push(output);
  console.log(`[Memory] Added to memory: ${output.skill} - ${output.id}`);
};

export const updateFeedback = (id: string, feedback: 'approve' | 'needs_improvement', trustScore: number): void => {
  const pattern = aceyLearningDataset.find(p => p.id === id);
  if (pattern) {
    pattern.feedback = feedback;
    pattern.trustScore = trustScore;
    console.log(`[Memory] Updated feedback for ${id}: ${feedback} (trust: ${trustScore})`);
  }
};

export const getMemoryStats = () => {
  const total = aceyLearningDataset.length;
  const approved = aceyLearningDataset.filter(p => p.feedback === 'approve').length;
  const needsImprovement = aceyLearningDataset.filter(p => p.feedback === 'needs_improvement').length;
  const averageTrustScore = total > 0 ? 
    aceyLearningDataset.reduce((sum, p) => sum + (p.trustScore || 0), 0) / total : 0;

  const skillsBreakdown = aceyLearningDataset.reduce((acc, p) => {
    acc[p.skill] = (acc[p.skill] || 0) + 1;
    return acc;
  }, {} as Record<SkillType, number>);

  const contentTypeBreakdown = aceyLearningDataset.reduce((acc, p) => {
    const type = p.contentType || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    approved,
    needsImprovement,
    approvalRate: total > 0 ? (approved / total) * 100 : 0,
    averageTrustScore,
    skillsBreakdown,
    contentTypeBreakdown,
    recentActivity: aceyLearningDataset.slice(-5).map(p => ({
      skill: p.skill,
      timestamp: new Date(p.timestamp).toLocaleString(),
      feedback: p.feedback || 'No feedback'
    }))
  };
};

export const clearMemory = (): void => {
  aceyLearningDataset.length = 0;
  console.log('[Memory] Memory cleared');
};
