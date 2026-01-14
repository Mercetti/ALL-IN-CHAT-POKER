import { UserTier, GeneratedOutput, SkillType, UnifiedUsageTracking } from '../types/skills';

// In-memory storage for all skills
const memoryOutputs: GeneratedOutput[] = [];
const aceyLearningDataset: any[] = [];
const usageTracker: UnifiedUsageTracking[] = [];

// Predefined tiers
export const TIERS: UserTier[] = [
  {
    name: 'Free',
    codeLimitPerDay: 15,
    graphicsLimitPerDay: 5,
    audioLimitPerDay: 3,
    analyticsAccess: false,
    features: ['Basic code generation', 'Limited graphics', 'No analytics'],
    maxMemoryOutputs: 10,
    canBatchDownload: false,
    canBatchLearn: false
  },
  {
    name: 'Pro',
    codeLimitPerDay: 100,
    graphicsLimitPerDay: 50,
    audioLimitPerDay: 25,
    analyticsAccess: true,
    features: ['Advanced code generation', 'High-quality graphics', 'Full analytics'],
    maxMemoryOutputs: 100,
    canBatchDownload: true,
    canBatchLearn: true
  },
  {
    name: 'Enterprise',
    codeLimitPerDay: 1000,
    graphicsLimitPerDay: 500,
    audioLimitPerDay: 100,
    analyticsAccess: true,
    features: ['Enterprise code generation', 'Unlimited graphics', 'Advanced analytics', 'API access'],
    maxMemoryOutputs: 1000,
    canBatchDownload: true,
    canBatchLearn: true
  }
];

// Current user tier (would come from authentication/user profile)
let currentUserTier: UserTier = TIERS[0]; // Default to Free

export function setCurrentTier(tier: UserTier): void {
  currentUserTier = tier;
  console.log(`[TierManager] User tier set to: ${tier.name}`);
}

export function getCurrentTier(): UserTier {
  return currentUserTier;
}

export function getTierByName(tierName: string): UserTier | undefined {
  return TIERS.find(tier => tier.name.toLowerCase() === tierName.toLowerCase());
}

export function getAllTiers(): UserTier[] {
  return [...TIERS];
}

// Usage tracking functions
export function getUsageBySkill(skill: SkillType): number {
  return usageTracker.filter(u => u.skill === skill).length;
}

export function getUsageByDate(date: string): number {
  return usageTracker.filter(u => 
    new Date(u.timestamp).toDateString() === date
  ).length;
}

export function getUsageByTier(tierName: string): number {
  return usageTracker.filter(u => u.tier === tierName).length;
}

export function getTodayUsage(): number {
  const today = new Date().toDateString();
  return getUsageByDate(today);
}

export function canUseSkill(skill: SkillType): boolean {
  switch (skill) {
    case 'CodeHelper':
      return currentUserTier.codeLimitPerDay > 0;
    case 'GraphicsWizard':
      return currentUserTier.graphicsLimitPerDay > 0;
    case 'AudioMaestro':
      return currentUserTier.audioLimitPerDay > 0;
    case 'Analytics':
      return currentUserTier.analyticsAccess;
    default:
      return false;
  }
}

export function getRemainingUsage(skill: SkillType): number {
  switch (skill) {
    case 'CodeHelper':
      return Math.max(0, currentUserTier.codeLimitPerDay - getUsageBySkill(skill));
    case 'GraphicsWizard':
      return Math.max(0, currentUserTier.graphicsLimitPerDay - getUsageBySkill(skill));
    case 'AudioMaestro':
      return Math.max(0, currentUserTier.audioLimitPerDay - getUsageBySkill(skill));
    case 'Analytics':
      return currentUserTier.analyticsAccess ? 999999 : 0; // Unlimited if analytics is enabled
    default:
      return 0;
  }
}

export function hasReachedLimit(skill: SkillType): boolean {
  switch (skill) {
    case 'CodeHelper':
      return getUsageBySkill(skill) >= currentUserTier.codeLimitPerDay;
    case 'GraphicsWizard':
      return getUsageBySkill(skill) >= currentUserTier.graphicsLimitPerDay;
    case 'AudioMaestro':
      return getUsageBySkill(skill) >= currentUserTier.audioLimitPerDay;
    case 'Analytics':
      return !currentUserTier.analyticsAccess;
    default:
      return false;
  }
}

export function getUsageLimitMessage(skill: SkillType): string {
  switch (skill) {
    case 'CodeHelper':
      return `Daily limit: ${getUsageBySkill(skill)}/${currentUserTier.codeLimitPerDay}`;
    case 'GraphicsWizard':
      return `Daily limit: ${getUsageBySkill(skill)}/${currentUserTier.graphicsLimitPerDay}`;
    case 'AudioMaestro':
      return `Daily limit: ${getUsageBySkill(skill)}/${currentUserTier.audioLimitPerDay}`;
    case 'Analytics':
      return currentUserTier.analyticsAccess ? 'Analytics enabled' : 'Analytics requires Pro tier';
    default:
      return 'Skill not available';
  }
}

export function getUpgradeMessage(skill: SkillType): string {
  const nextTierName = skill === 'Analytics' ? 'Pro' : 'Enterprise';
  const nextTier = getTierByName(nextTierName);
  
  if (!nextTier) {
    return 'Upgrade to access premium features';
  }
  
  switch (skill) {
    case 'CodeHelper':
      return `Upgrade to ${nextTier.name} for unlimited code generation (${nextTier.codeLimitPerDay} per day)`;
    case 'GraphicsWizard':
      return `Upgrade to ${nextTier.name} for advanced graphics (${nextTier.graphicsLimitPerDay} per day)`;
    case 'AudioMaestro':
      return `Upgrade to ${nextTier.name} for extended audio generation (${nextTier.audioLimitPerDay} per day)`;
    case 'Analytics':
      return `Upgrade to ${nextTier.name} to access analytics dashboard`;
    default:
      return 'Upgrade to unlock this feature';
  }
}

export function checkTrialStatus(): {
  const isTrial = currentUserTier.name === 'Free';
  const trialDaysLeft = isTrial ? 14 : 0; // 14-day trial
  
  return {
    isTrial,
    trialDaysLeft,
    trialFeatures: currentUserTier.features,
    trialExpired: isTrial && trialDaysLeft <= 0,
    upgradePrompt: trialDaysLeft <= 0 
      ? 'Your trial has expired! Upgrade now to continue using Acey skills.'
      : `${trialDaysLeft} days left in your trial. Upgrade to Pro for unlimited access.`
  };
}

// Memory Management Functions
export function addOutputToMemory(output: GeneratedOutput): void {
  memoryOutputs.push(output);
  console.log(`[${output.skill}] Added to memory: ${output.id}`);
}

export function discardOutput(outputId: string): boolean {
  const index = memoryOutputs.findIndex(o => o.id === outputId);
  if (index !== -1) {
    const discarded = memoryOutputs.splice(index, 1)[0];
    console.log(`[${discarded.skill}] Discarded from memory: ${outputId}`);
    return true;
  }
  return false;
}

export function getMemoryOutputs(): GeneratedOutput[] {
  return [...memoryOutputs];
}

export function getOutputById(outputId: string): GeneratedOutput | undefined {
  return memoryOutputs.find(o => o.id === outputId);
}

export function getOutputsBySkill(skill: SkillType): GeneratedOutput[] {
  return memoryOutputs.filter(o => o.skill === skill);
}

export function clearMemory(): void {
  memoryOutputs.length = 0;
  console.log('[TierManager] Memory cleared');
}

export function getMemoryUsageStats(): {
  total: number;
  bySkill: Record<SkillType, number>;
  byTier: Record<string, number>;
} {
  const total = memoryOutputs.length;
  const bySkill = {} as Record<SkillType, number>;
  const byTier = {} as Record<string, number>;
  
  memoryOutputs.forEach(output => {
    bySkill[output.skill] = (bySkill[output.skill] || 0) + 1;
    byTier[getCurrentTier().name] = (byTier[getCurrentTier().name] || 0) + 1;
  });
  
  return { total, bySkill, byTier };
}

// Usage tracking
export function trackUsage(usage: UnifiedUsageTracking): void {
  usageTracker.push(usage);
  console.log(`[TierManager] Tracked usage: ${usage.skill} - ${usage.action}`);
}

export function getUsageStats(): UnifiedUsageTracking[] {
  return [...usageTracker];
}

export function getUsageAnalytics() {
  const stats = getUsageStats();
  const todayUsage = getTodayUsage();
  
  return {
    ...stats,
    todayUsage,
    averageDailyUsage: stats.total / 30, // Last 30 days
    peakUsageDay: Object.entries(stats.byDate)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || new Date().toDateString(),
    mostUsedSkill: Object.entries(stats.bySkill)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as SkillType || 'CodeHelper',
    tierEfficiency: stats.total / (getCurrentTier().codeLimitPerDay + getCurrentTier().graphicsLimitPerDay + getCurrentTier().audioLimitPerDay)
  };
}

// Batch operations
export function canPerformBatchOperation(operation: 'download' | 'learn'): boolean {
  switch (operation) {
    case 'download':
      return currentUserTier.canBatchDownload;
    case 'learn':
      return currentUserTier.canBatchLearn;
    default:
      return false;
  }
}

export function getBatchOperationLimit(operation: 'download' | 'learn'): number {
  switch (operation) {
    case 'download':
      return currentUserTier.maxMemoryOutputs;
    case 'learn':
      return currentUserTier.maxMemoryOutputs;
    default:
      return 10; // Default limit
  }
}
