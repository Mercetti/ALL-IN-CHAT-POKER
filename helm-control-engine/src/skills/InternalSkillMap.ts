export interface InternalSkill {
  id: string;
  name: string;
  description: string;
  access: 'owner' | 'dev';
  learningLocked: boolean;
}

export const InternalSkillMap: InternalSkill[] = [
  // Hidden skills that LLM uses internally
  { 
    id: 'orchestratorLogic', 
    name: 'Orchestrator Logic', 
    description: 'Coordinates all skill execution and manages dependencies', 
    access: 'dev', 
    learningLocked: true 
  },
  { 
    id: 'feedbackProcessor', 
    name: 'Feedback Processor', 
    description: 'Processes user feedback and tags memory for learning', 
    access: 'dev', 
    learningLocked: false 
  },
  { 
    id: 'safetyValidator', 
    name: 'Safety Validator', 
    description: 'Validates skill execution against safety constraints', 
    access: 'owner', 
    learningLocked: true 
  },
  { 
    id: 'performanceMonitor', 
    name: 'Performance Monitor', 
    description: 'Monitors skill performance and resource usage', 
    access: 'dev', 
    learningLocked: false 
  },
  { 
    id: 'memoryManager', 
    name: 'Memory Manager', 
    description: 'Manages persistent memory and learning data', 
    access: 'owner', 
    learningLocked: true 
  },
  { 
    id: 'escalationHandler', 
    name: 'Escalation Handler', 
    description: 'Handles error escalation and emergency procedures', 
    access: 'owner', 
    learningLocked: true 
  },
];

export function getInternalSkillById(id: string): InternalSkill | undefined {
  return InternalSkillMap.find(skill => skill.id === id);
}

export function getInternalSkillsByAccess(access: InternalSkill['access']): InternalSkill[] {
  return InternalSkillMap.filter(skill => skill.access === access);
}

export function getLearningLockedSkills(): InternalSkill[] {
  return InternalSkillMap.filter(skill => skill.learningLocked);
}

export function getLearningUnlockedSkills(): InternalSkill[] {
  return InternalSkillMap.filter(skill => !skill.learningLocked);
}
