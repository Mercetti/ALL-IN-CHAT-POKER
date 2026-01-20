export interface Skill {
  id: string;
  name: string;
  tier: 'Pro' | 'Creator+' | 'Enterprise';
  version: string;
  description: string;
  execute: (...args: any[]) => Promise<any>;
  lastUpdated: Date;
  feedbackScores?: number[];
}

export const SkillRegistry: Skill[] = [
  // Starter skills placeholders
  {
    id: 'audioMaestro',
    name: 'Audio Maestro',
    tier: 'Pro',
    version: 'v1.0',
    description: 'Generates audio content and voice effects',
    execute: async () => { /* LLM to fill */ return; },
    lastUpdated: new Date(),
    feedbackScores: [],
  },
  {
    id: 'graphicsWizard',
    name: 'Graphics Wizard',
    tier: 'Pro',
    version: 'v1.0',
    description: 'Generates custom graphics and cosmetics',
    execute: async () => { /* LLM to fill */ return; },
    lastUpdated: new Date(),
    feedbackScores: [],
  },
  {
    id: 'codeHelper',
    name: 'Code Helper',
    tier: 'Creator+',
    version: 'v1.0',
    description: 'Generates code snippets and validates logic',
    execute: async () => { /* LLM to fill */ return; },
    lastUpdated: new Date(),
    feedbackScores: [],
  },
  {
    id: 'contentOptimizer',
    name: 'Content Optimizer',
    tier: 'Creator+',
    version: 'v1.0',
    description: 'Optimizes content for SEO and engagement',
    execute: async () => { /* LLM to fill */ return; },
    lastUpdated: new Date(),
    feedbackScores: [],
  },
  {
    id: 'dataAnalyzer',
    name: 'Data Analyzer',
    tier: 'Enterprise',
    version: 'v1.0',
    description: 'Analyzes complex datasets and generates insights',
    execute: async () => { /* LLM to fill */ return; },
    lastUpdated: new Date(),
    feedbackScores: [],
  },
  {
    id: 'workflowAutomator',
    name: 'Workflow Automator',
    tier: 'Enterprise',
    version: 'v1.0',
    description: 'Automates complex workflows and processes',
    execute: async () => { /* LLM to fill */ return; },
    lastUpdated: new Date(),
    feedbackScores: [],
  },
];

export function getSkillById(id: string): Skill | undefined {
  return SkillRegistry.find(skill => skill.id === id);
}

export function getSkillsByTier(tier: Skill['tier']): Skill[] {
  return SkillRegistry.filter(skill => skill.tier === tier);
}

export function addSkill(skill: Omit<Skill, 'lastUpdated'>): void {
  SkillRegistry.push({
    ...skill,
    lastUpdated: new Date(),
  });
}

export function updateSkillFeedback(skillId: string, score: number): void {
  const skill = getSkillById(skillId);
  if (skill) {
    if (!skill.feedbackScores) {
      skill.feedbackScores = [];
    }
    skill.feedbackScores.push(score);
    skill.lastUpdated = new Date();
  }
}
