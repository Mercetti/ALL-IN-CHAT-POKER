/**
 * Acey Orchestrator: Core Architecture
 * Central hub for all skill routing, permissions, and responses
 */

import { User, Skill } from '../types/upgrade';
import { detectIntent, Intent } from './intentRouter';
import { checkPermissions, SkillLockedError } from './permissionGate';
import { dispatchToSkills } from './toolDispatcher';
import { generatePreviews, Preview } from './previewGenerator';
import { composeResponse } from './responseComposer';
import { logLearningData } from './learningFeedback';

export interface UserMessage {
  id: string;
  content: string;
  userId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface OrchestratorResponse {
  id: string;
  content: string;
  previews: Preview[];
  metadata: {
    skillsUsed: string[];
    processingTime: number;
    permissions: string[];
  };
  learningData?: any;
}

export interface Preview {
  type: 'image' | 'audio' | 'code' | 'link_review' | 'text';
  src: string;
  actions: string[];
  metadata?: Record<string, any>;
}

/**
 * Main orchestrator entry point
 */
export async function handleUserMessage(
  input: UserMessage,
  user: User
): Promise<OrchestratorResponse> {
  const startTime = Date.now();
  
  try {
    // 1. Intent Detection
    const intent = await detectIntent(input.content);
    console.log(`🎯 Intent detected: ${intent.type}`);
    
    // 2. Skill Mapping
    const requiredSkills = mapIntentToSkills(intent);
    console.log(`🔗 Required skills: ${requiredSkills.join(', ')}`);
    
    // 3. Permission Check (Hard Backend Enforcement)
    const permissions = await checkPermissions(user, requiredSkills);
    console.log(`🔐 Permissions verified: ${permissions.join(', ')}`);
    
    // 4. Skill Dispatch
    const result = await dispatchToSkills(intent, input, user);
    console.log(`🚀 Skills executed: ${result.skillsUsed.join(', ')}`);
    
    // 5. Preview Generation
    const previews = await generatePreviews(result);
    console.log(`👁️ Previews generated: ${previews.length}`);
    
    // 6. Response Composition
    const response = await composeResponse(result, previews);
    console.log(`💬 Response composed`);
    
    // 7. Learning Data Logging
    const learningData = await logLearningData(result, user);
    console.log(`🧠 Learning data logged`);
    
    const processingTime = Date.now() - startTime;
    
    return {
      id: input.id,
      content: response.content,
      previews: response.previews,
      metadata: {
        skillsUsed: result.skillsUsed,
        processingTime,
        permissions
      },
      learningData
    };
    
  } catch (error) {
    if (error instanceof SkillLockedError) {
      return {
        id: input.id,
        content: `🔒 **${error.skill}** is locked. ${error.reason}`,
        previews: [],
        metadata: {
          skillsUsed: [],
          processingTime: Date.now() - startTime,
          permissions: []
        }
      };
    }
    
    console.error('❌ Orchestrator error:', error);
    throw error;
  }
}

/**
 * Maps intents to required skills
 */
function mapIntentToSkills(intent: any): string[] {
  const skillMap: Record<string, string[]> = {
    'code_help': ['code_helper'],
    'generate_image': ['graphics_wizard'],
    'generate_audio': ['audio_maestro'],
    'review_link': ['link_review'],
    'start_game': ['ai_cohost_games'],
    'chat_interaction': ['ai_cohost_games'],
    'stream_monitoring': ['stream_ops'],
    'error_detection': ['stream_ops']
  };
  
  return skillMap[intent.type] || [];
}

/**
 * Skill Registration System
 */
export interface SkillRegistration {
  id: string;
  name: string;
  tier: string;
  intents: string[];
  module: string;
  permissions: string[];
}

const registeredSkills: SkillRegistration[] = [];

export function registerSkill(skill: SkillRegistration): void {
  registeredSkills.push(skill);
  console.log(`✅ Skill registered: ${skill.name} (${skill.tier})`);
}

export function getRegisteredSkills(): SkillRegistration[] {
  return [...registeredSkills];
}

export function getSkillById(id: string): SkillRegistration | undefined {
  return registeredSkills.find(skill => skill.id === id);
}

// Auto-register built-in skills
registerSkill({
  id: 'code_helper',
  name: 'Code Helper Pro',
  tier: 'Pro',
  intents: ['code_help'],
  module: 'modules/code',
  permissions: ['code_analysis']
});

registerSkill({
  id: 'graphics_wizard',
  name: 'Graphics Wizard',
  tier: 'Creator+',
  intents: ['generate_image'],
  module: 'modules/graphics',
  permissions: ['image_generation']
});

registerSkill({
  id: 'audio_maestro',
  name: 'Audio Maestro',
  tier: 'Creator+',
  intents: ['generate_audio'],
  module: 'modules/audio',
  permissions: ['audio_generation']
});

registerSkill({
  id: 'link_review',
  name: 'Link Review Pro',
  tier: 'Pro',
  intents: ['review_link'],
  module: 'modules/link-review',
  permissions: ['content_analysis']
});

registerSkill({
  id: 'stream_ops',
  name: 'Stream Ops Pro',
  tier: 'Pro',
  intents: ['stream_monitoring', 'error_detection'],
  module: 'modules/streaming',
  permissions: ['stream_access']
});

registerSkill({
  id: 'ai_cohost_games',
  name: 'AI Co-host Games',
  tier: 'Creator+',
  intents: ['start_game', 'chat_interaction'],
  module: 'modules/games',
  permissions: ['game_hosting']
});

export default {
  handleUserMessage,
  registerSkill,
  getRegisteredSkills,
  getSkillById
};
