/**
 * Helm Client - Core SDK Client
 * Primary interface for Helm Control SDK
 */

import { 
  HelmClientConfig, 
  HelmClientStatus, 
  HelmEnvironment, 
  HelmTier,
  PersonaDefinition,
  SkillManifest
} from '../types/public';
import { HelmSession } from './HelmSession';
import { HelmEvents } from './HelmEvents';
import { PersonaLoader } from '../persona/PersonaLoader';
import { SkillRegistry } from '../skills/SkillRegistry';
import { SkillExecutor } from '../skills/SkillExecutor';
import { AccessController } from '../permissions/AccessController';
import { StabilityMonitor } from '../stability/StabilityMonitor';
import { AuditLogger } from '../audit/AuditLogger';

export class HelmClient {
  private config: HelmClientConfig;
  private events: HelmEvents;
  private personaLoader: PersonaLoader;
  private skillRegistry: SkillRegistry;
  private skillExecutor: SkillExecutor;
  private accessController: AccessController;
  private stabilityMonitor: StabilityMonitor;
  private auditLogger: AuditLogger;
  private sessions: Map<string, HelmSession> = new Map();
  private initialized: boolean = false;
  private currentPersona: PersonaDefinition | null = null;
  private instanceId: string;

  constructor(config: HelmClientConfig) {
    this.config = config;
    this.instanceId = this.generateInstanceId();
    this.events = new HelmEvents();
    this.personaLoader = new PersonaLoader(config);
    this.skillRegistry = new SkillRegistry(config);
    this.skillExecutor = new SkillExecutor(config);
    this.accessController = new AccessController(config);
    this.stabilityMonitor = new StabilityMonitor(config);
    this.auditLogger = new AuditLogger(config);

    this.initialize();
  }

  /**
   * Initialize the Helm client
   */
  private async initialize(): Promise<void> {
    try {
      // Validate API key and environment
      await this.validateConfiguration();
      
      // Initialize core systems
      await this.accessController.initialize();
      await this.skillRegistry.initialize();
      await this.stabilityMonitor.initialize();
      await this.auditLogger.initialize();
      
      // Start monitoring
      this.stabilityMonitor.start();
      
      this.initialized = true;
      this.events.emit('initialized', { instanceId: this.instanceId });
      
      if (this.config.telemetry) {
        this.startTelemetry();
      }

    } catch (error) {
      this.events.emit('error', { type: 'initialization_failed', error });
      throw error;
    }
  }

  /**
   * Load a persona for the client
   */
  async loadPersona(persona: PersonaDefinition): Promise<void> {
    this.ensureInitialized();
    
    try {
      // Validate persona permissions
      const hasPermission = await this.accessController.checkPersonaAccess(persona);
      if (!hasPermission) {
        throw new Error(`Insufficient permissions to load persona: ${persona.id}`);
      }

      // Load persona
      this.currentPersona = await this.personaLoader.load(persona);
      
      // Update skill registry with persona-specific skills
      await this.skillRegistry.updatePersonaSkills(persona.allowedSkills);
      
      this.events.emit('persona_loaded', { persona: persona.id });
      this.auditLogger.log('persona_loaded', {
        personaId: persona.id,
        userId: this.config.apiKey.substring(0, 8),
        timestamp: new Date()
      });

    } catch (error) {
      this.events.emit('error', { type: 'persona_load_failed', persona: persona.id, error });
      throw error;
    }
  }

  /**
   * Start a new Helm session
   */
  startSession(context?: any): HelmSession {
    this.ensureInitialized();
    
    const sessionId = this.generateSessionId();
    const session = new HelmSession(sessionId, context, {
      client: this,
      persona: this.currentPersona,
      skillRegistry: this.skillRegistry,
      skillExecutor: this.skillExecutor,
      accessController: this.accessController,
      auditLogger: this.auditLogger
    });

    this.sessions.set(sessionId, session);
    
    this.events.emit('session_started', { sessionId, context });
    this.auditLogger.log('session_started', {
      sessionId,
      context,
      timestamp: new Date()
    });

    return session;
  }

  /**
   * List available skills
   */
  listSkills(): SkillManifest[] {
    this.ensureInitialized();
    return this.skillRegistry.getAvailableSkills();
  }

  /**
   * Invoke a skill directly
   */
  async invokeSkill(skillId: string, input: unknown): Promise<unknown> {
    this.ensureInitialized();
    
    try {
      // Check permissions
      const hasPermission = await this.accessController.checkSkillAccess(skillId);
      if (!hasPermission) {
        throw new Error(`Insufficient permissions to invoke skill: ${skillId}`);
      }

      // Check stability
      const stabilityState = this.stabilityMonitor.getCurrentState();
      if (stabilityState === 'shutdown' || stabilityState === 'safe') {
        throw new Error(`Helm is not available in ${stabilityState} state`);
      }

      // Execute skill
      const result = await this.skillExecutor.execute(skillId, input, {
        sessionId: 'direct',
        persona: this.currentPersona,
        permissions: this.config.permissions || []
      });

      this.events.emit('skill_invoked', { skillId, result });
      this.auditLogger.log('skill_invoked', {
        skillId,
        input,
        result,
        timestamp: new Date()
      });

      return result;

    } catch (error) {
      this.events.emit('error', { type: 'skill_invocation_failed', skillId, error });
      throw error;
    }
  }

  /**
   * Get current client status
   */
  getStatus(): HelmClientStatus {
    return {
      initialized: this.initialized,
      personaLoaded: !!this.currentPersona,
      activeSessions: this.sessions.size,
      availableSkills: this.skillRegistry.getAvailableSkills().length,
      stabilityState: this.stabilityMonitor.getCurrentState(),
      lastHeartbeat: this.stabilityMonitor.getLastHeartbeat()
    };
  }

  /**
   * Shutdown the Helm client
   */
  async shutdown(): Promise<void> {
    try {
      // End all sessions
      for (const session of this.sessions.values()) {
        await session.end();
      }
      this.sessions.clear();

      // Stop monitoring
      this.stabilityMonitor.stop();

      // Cleanup
      await this.auditLogger.log('client_shutdown', {
        instanceId: this.instanceId,
        timestamp: new Date()
      });

      this.events.emit('shutdown', { instanceId: this.instanceId });
      this.initialized = false;

    } catch (error) {
      this.events.emit('error', { type: 'shutdown_failed', error });
      throw error;
    }
  }

  /**
   * Get events interface
   */
  getEvents(): HelmEvents {
    return this.events;
  }

  /**
   * Get current persona
   */
  getCurrentPersona(): PersonaDefinition | null {
    return this.currentPersona;
  }

  /**
   * Get instance ID
   */
  getInstanceId(): string {
    return this.instanceId;
  }

  // Private methods

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Helm client is not initialized');
    }
  }

  private async validateConfiguration(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('API key is required');
    }

    if (!this.config.environment) {
      throw new Error('Environment is required');
    }

    // Validate API key format
    const apiKeyPattern = /^pk_[a-zA-Z0-9]{32,}$/;
    if (!apiKeyPattern.test(this.config.apiKey)) {
      throw new Error('Invalid API key format');
    }

    // For enterprise mode, validate additional requirements
    if (this.config.environment === 'enterprise') {
      await this.validateEnterpriseSetup();
    }
  }

  private async validateEnterpriseSetup(): Promise<void> {
    // Check for mandatory enterprise requirements
    const requiredEnvVars = ['HELM_LICENSE_KEY', 'HELM_INSTANCE_ID'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Enterprise mode requires ${envVar}`);
      }
    }
  }

  private generateInstanceId(): string {
    return `helm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startTelemetry(): void {
    // Start periodic telemetry collection
    setInterval(() => {
      const metrics = this.stabilityMonitor.getMetrics();
      this.events.emit('telemetry', metrics);
    }, 30000); // Every 30 seconds
  }
}

export type { HelmClientConfig, HelmClientStatus, HelmEnvironment, HelmTier };
