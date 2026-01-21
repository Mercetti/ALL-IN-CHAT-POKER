/**
 * Helm Control Engine - Main Entry Point
 * Core AI orchestration engine that provides white-label AI control capabilities
 */

import { HelmOrchestrator, handleUserMessage } from './orchestrator/helmOrchestrator';
import { HelmSkillRegistry, helmSkillRegistry } from './skills/helmSkillRegistry';
import { HelmSecurity, helmSecurity } from './security/helmSecurity';
import { HelmMemory, helmMemory } from './memory/helmMemory';
import { helmPersonaLoader } from '../personas/helmPersonaLoader';

export interface HelmConfig {
  enableSecurity: boolean;
  enableMemory: boolean;
  enablePersonaSystem: boolean;
  defaultPersona: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface HelmRequest {
  id: string;
  userId: string;
  persona?: string;
  message: string;
  context?: Record<string, any>;
  timestamp: number;
}

export interface HelmResponse {
  id: string;
  success: boolean;
  content?: string;
  data?: any;
  error?: string;
  persona: string;
  metadata: {
    processingTime: number;
    skillsUsed: string[];
    securityChecks: string[];
    memoryEntries: string[];
  };
}

export class HelmEngine {
  private config: HelmConfig;
  private orchestrator: HelmOrchestrator;
  private skillRegistry: HelmSkillRegistry;
  private security: HelmSecurity;
  private memory: HelmMemory;
  private initialized: boolean = false;

  constructor(config: Partial<HelmConfig> = {}) {
    this.config = {
      enableSecurity: true,
      enableMemory: true,
      enablePersonaSystem: true,
      defaultPersona: 'acey',
      logLevel: 'info',
      ...config
    };

    this.orchestrator = new HelmOrchestrator();
    this.skillRegistry = helmSkillRegistry;
    this.security = helmSecurity;
    this.memory = helmMemory;

    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Initializing Helm Control Engine...');
    
    try {
      // Initialize core components
      if (this.config.enableSecurity) {
        console.log('🔐 Security module enabled');
      }

      if (this.config.enableMemory) {
        console.log('🧠 Memory module enabled');
      }

      if (this.config.enablePersonaSystem) {
        console.log('🎭 Persona system enabled');
        // Load default persona
        const defaultPersona = helmPersonaLoader.getPersona(this.config.defaultPersona);
        if (!defaultPersona) {
          console.warn(`⚠️ Default persona "${this.config.defaultPersona}" not found`);
        }
      }

      // Start background services
      this.startBackgroundServices();

      this.initialized = true;
      console.log('✅ Helm Control Engine initialized successfully');
      console.log(`📊 Engine Stats: ${this.getEngineStats()}`);

    } catch (error) {
      console.error('❌ Failed to initialize Helm Control Engine:', error);
      throw error;
    }
  }

  private startBackgroundServices(): void {
    // Start cleanup intervals
    if (this.config.enableMemory) {
      setInterval(() => {
        this.memory.cleanup();
      }, 5 * 60 * 1000); // Every 5 minutes
    }

    if (this.config.enableSecurity) {
      setInterval(() => {
        this.security.cleanup();
      }, 10 * 60 * 1000); // Every 10 minutes
    }

    setInterval(() => {
      this.skillRegistry.cleanup();
    }, 15 * 60 * 1000); // Every 15 minutes
  }

  // Main Processing Interface
  async processRequest(request: HelmRequest): Promise<HelmResponse> {
    if (!this.initialized) {
      throw new Error('Helm Engine not initialized');
    }

    const startTime = Date.now();
    const responseId = `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`📥 Processing request ${request.id} for user ${request.userId}`);

      // 1. Security Check
      let securityContext = null;
      let auditId = null;

      if (this.config.enableSecurity) {
        securityContext = this.security.createSecurityContext(request.userId, {
          path: '/process',
          method: 'POST'
        });

        if (!securityContext) {
          throw new Error('Invalid user or security context');
        }

        const securityResult = await this.security.enforceSecurity(securityContext);
        if (!securityResult.allowed) {
          throw new Error(`Security check failed: ${securityResult.reason}`);
        }

        auditId = securityResult.auditId;
      }

      // 2. Load Persona
      const personaName = request.persona || this.config.defaultPersona;
      const persona = this.config.enablePersonaSystem 
        ? helmPersonaLoader.getPersona(personaName)
        : null;

      if (!persona && this.config.enablePersonaSystem) {
        throw new Error(`Persona "${personaName}" not found`);
      }

      // 3. Memory Storage (input)
      let memoryEntryId = null;
      if (this.config.enableMemory) {
        memoryEntryId = this.memory.store({
          type: 'conversation',
          userId: request.userId,
          timestamp: request.timestamp,
          data: { message: request.message, context: request.context },
          metadata: { persona: personaName, requestId: request.id },
          tags: ['input', 'conversation', personaName]
        });
      }

      // 4. Process with Orchestrator
      const userMessage = {
        id: request.id,
        content: request.message,
        userId: request.userId,
        timestamp: request.timestamp,
        metadata: request.context
      };

      const user = {
        id: request.userId,
        username: request.userId,
        role: 'user', // Would be determined from user management
        permissions: ['chat'], // Would be determined from user permissions
        tier: 'creator',
        isActive: true
      };

      const orchestratorResponse = await this.orchestrator.processMessage(userMessage, user);

      // 5. Apply Persona Response Formatting
      let finalContent = orchestratorResponse.content;
      if (persona && this.config.enablePersonaSystem) {
        // Apply persona-specific formatting
        finalContent = this.formatPersonaResponse(orchestratorResponse.content, persona);
      }

      // 6. Memory Storage (output)
      if (this.config.enableMemory) {
        this.memory.store({
          type: 'conversation',
          userId: request.userId,
          timestamp: Date.now(),
          data: { response: finalContent, orchestratorResponse },
          metadata: { persona: personaName, requestId: request.id, inputId: memoryEntryId },
          tags: ['output', 'conversation', personaName]
        });

        // Add provenance
        if (memoryEntryId) {
          this.memory.addProvenance({
            parentId: memoryEntryId,
            childId: responseId,
            relationship: 'response_to',
            timestamp: Date.now(),
            metadata: { persona: personaName }
          });
        }
      }

      const processingTime = Date.now() - startTime;

      const response: HelmResponse = {
        id: responseId,
        success: true,
        content: finalContent,
        persona: personaName,
        metadata: {
          processingTime,
          skillsUsed: orchestratorResponse.metadata.skillsUsed,
          securityChecks: auditId ? [auditId] : [],
          memoryEntries: memoryEntryId ? [memoryEntryId] : []
        }
      };

      console.log(`📤 Request processed successfully in ${processingTime}ms`);
      return response;

    } catch (error) {
      console.error(`❌ Failed to process request ${request.id}:`, error);

      // Store error in memory
      if (this.config.enableMemory) {
        this.memory.store({
          type: 'system_event',
          userId: request.userId,
          timestamp: Date.now(),
          data: { error: error instanceof Error ? error.message : String(error), requestId: request.id },
          metadata: { persona: request.persona || this.config.defaultPersona },
          tags: ['error', 'system_event']
        });
      }

      return {
        id: responseId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        persona: request.persona || this.config.defaultPersona,
        metadata: {
          processingTime: Date.now() - startTime,
          skillsUsed: [],
          securityChecks: [],
          memoryEntries: []
        }
      };
    }
  }

  private formatPersonaResponse(content: string, persona: any): string {
    // Apply persona-specific formatting
    // In a real implementation, this would use the persona's response templates
    return content;
  }

  // Health and Diagnostics
  getEngineStats(): string {
    const skillStats = this.skillRegistry.getRegistryStats();
    const securityStats = this.config.enableSecurity ? this.security.getSecurityStats() : null;
    const memoryStats = this.config.enableMemory ? this.memory.getStats() : null;

    return [
      `Skills: ${skillStats.activeSkills}/${skillStats.totalSkills} active`,
      securityStats ? `Users: ${securityStats.activeUsers}/${securityStats.totalUsers} active` : '',
      memoryStats ? `Memory: ${memoryStats.totalEntries} entries` : '',
      `Status: ${this.initialized ? 'Ready' : 'Not initialized'}`
    ].filter(Boolean).join(' | ');
  }

  isHealthy(): boolean {
    return this.initialized && 
           this.skillRegistry.getRegistryStats().activeSkills > 0 &&
           (!this.config.enableSecurity || this.security.getSecurityStats().activeUsers > 0);
  }

  // Component Access
  getOrchestrator(): HelmOrchestrator {
    return this.orchestrator;
  }

  getSkillRegistry(): HelmSkillRegistry {
    return this.skillRegistry;
  }

  getSecurity(): HelmSecurity {
    return this.security;
  }

  getMemory(): HelmMemory {
    return this.memory;
  }

  // Lifecycle Management
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Helm Control Engine...');

    try {
      // Save memory state
      if (this.config.enableMemory) {
        await this.memory.save();
      }

      // Cleanup resources
      if (this.config.enableMemory) {
        this.memory.destroy();
      }

      this.initialized = false;
      console.log('✅ Helm Control Engine shutdown complete');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const helmEngine = new HelmEngine();

// Export main processing function
export async function processHelmRequest(request: HelmRequest): Promise<HelmResponse> {
  return helmEngine.processRequest(request);
}
