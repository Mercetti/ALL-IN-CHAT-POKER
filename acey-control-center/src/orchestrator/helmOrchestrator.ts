/**
 * Helm Orchestrator: Core Architecture
 * Central hub for all skill routing, permissions, and responses
 * 
 * This is the Helm Control engine - white-label and enterprise-ready
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
 * Main Helm orchestrator entry point
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
    const learningData = await logLearningData(input, intent, result);
    console.log(`📚 Learning data logged`);
    
    const processingTime = Date.now() - startTime;
    
    return {
      id: `helm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: response.content,
      previews: response.previews || previews,
      metadata: {
        skillsUsed: result.skillsUsed,
        processingTime,
        permissions
      },
      learningData
    };
    
  } catch (error) {
    console.error('🚨 Helm Orchestrator error:', error);
    
    if (error instanceof SkillLockedError) {
      return {
        id: `helm_error_${Date.now()}`,
        content: `⚠️ ${error.message}`,
        previews: [],
        metadata: {
          skillsUsed: [],
          processingTime: Date.now() - startTime,
          permissions: []
        }
      };
    }
    
    throw error;
  }
}

/**
 * Map intent to required skills
 */
function mapIntentToSkills(intent: Intent): string[] {
  const skillMap: Record<string, string[]> = {
    'generate_audio': ['audio_maestro'],
    'generate_image': ['graphics_wizard'],
    'generate_code': ['code_helper'],
    'optimize_content': ['content_optimizer'],
    'analyze_data': ['data_analyzer'],
    'automate_workflow': ['workflow_automator'],
    'general_chat': [],
    'system_status': ['system_monitor'],
    'help': ['help_system']
  };
  
  return skillMap[intent.type] || [];
}

/**
 * Helm Orchestrator Class for advanced usage
 */
export class HelmOrchestrator {
  private version: string = '1.0.0';
  private initialized: boolean = false;
  
  constructor(private config?: Record<string, any>) {
    this.initialize();
  }
  
  private initialize(): void {
    if (this.initialized) return;
    
    console.log('🚀 Initializing Helm Orchestrator...');
    // Initialize subsystems here
    this.initialized = true;
    console.log('✅ Helm Orchestrator initialized');
  }
  
  async processMessage(input: UserMessage, user: User): Promise<OrchestratorResponse> {
    return handleUserMessage(input, user);
  }
  
  getVersion(): string {
    return this.version;
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
}

// TEMPORARY COMPATIBILITY ALIAS - Remove after migration complete
export const AceyOrchestrator = HelmOrchestrator;
export const handleAceyMessage = handleUserMessage;
