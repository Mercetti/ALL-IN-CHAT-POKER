/**
 * Helm Orchestrator - Simplified Version
 * Central hub for all skill routing, permissions, and responses
 */

export interface User {
  id: string;
  username: string;
  role: string;
  permissions: string[];
  tier: string;
  isActive: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  tier: string;
  category: string;
  isActive: boolean;
}

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
  previews: any[];
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
    console.log(`🎯 Processing message: ${input.content.substring(0, 50)}...`);

    // Simulate processing
    const processingTime = Date.now() - startTime;

    return {
      id: `helm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: `I understand you said: "${input.content}". This is a response from the Helm Control engine.`,
      previews: [],
      metadata: {
        skillsUsed: ['basic_chat'],
        processingTime,
        permissions: user.permissions
      }
    };

  } catch (error) {
    console.error('🚨 Helm Orchestrator error:', error);

    const processingTime = Date.now() - startTime;

    return {
      id: `helm_error_${Date.now()}`,
      content: `I encountered an error: ${error instanceof Error ? error.message : String(error)}`,
      previews: [],
      metadata: {
        skillsUsed: [],
        processingTime,
        permissions: []
      }
    };
  }
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
