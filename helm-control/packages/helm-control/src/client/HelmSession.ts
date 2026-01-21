/**
 * Helm Session - Session Management
 * Manages individual user sessions with context and events
 */

import { 
  HelmSessionInterface, 
  HelmSessionConfig, 
  HelmSessionEvent,
  PersonaDefinition,
  SkillManifest
} from '../types/public';

export interface SessionDependencies {
  client: any;
  persona: PersonaDefinition | null;
  skillRegistry: any;
  skillExecutor: any;
  accessController: any;
  auditLogger: any;
}

export class HelmSession implements HelmSessionInterface {
  private sessionId: string;
  private context: any;
  private dependencies: SessionDependencies;
  private _isActive: boolean = true;
  private eventHandlers: Map<string, Function[]> = new Map();
  private createdAt: Date;
  private lastActivity: Date;

  constructor(sessionId: string, context: any, dependencies: SessionDependencies) {
    this.sessionId = sessionId;
    this.context = context || {};
    this.dependencies = dependencies;
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  /**
   * Send a message to the session
   */
  send(message: string): void {
    if (!this._isActive) {
      throw new Error('Session is not active');
    }

    this.lastActivity = new Date();
    
    // Process the message through the persona and skills
    this.processMessage(message);
  }

  /**
   * Register event handler
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event handler
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const sessionEvent: HelmSessionEvent = {
        type: event,
        data,
        timestamp: new Date(),
        sessionId: this.sessionId
      };
      
      handlers.forEach(handler => {
        try {
          handler(sessionEvent);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      });
    }
  }

  /**
   * End the session
   */
  async end(): Promise<void> {
    if (!this._isActive) {
      return;
    }

    this._isActive = false;
    
    // Log session end
    await this.dependencies.auditLogger.log('session_ended', {
      sessionId: this.sessionId,
      duration: Date.now() - this.createdAt.getTime(),
      timestamp: new Date()
    });

    // Emit end event
    this.emit('ended', { sessionId: this.sessionId });

    // Cleanup
    this.eventHandlers.clear();
  }

  /**
   * Get session context
   */
  getContext(): any {
    return { ...this.context };
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this._isActive;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get session metadata
   */
  getMetadata(): any {
    return {
      sessionId: this.sessionId,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      isActive: this._isActive,
      context: this.context,
      persona: this.dependencies.persona?.id
    };
  }

  /**
   * Process incoming message
   */
  private async processMessage(message: string): Promise<void> {
    try {
      // Log message
      await this.dependencies.auditLogger.log('message_received', {
        sessionId: this.sessionId,
        message,
        timestamp: new Date()
      });

      // Check if message contains skill invocation
      const skillInvocation = this.parseSkillInvocation(message);
      
      if (skillInvocation) {
        await this.handleSkillInvocation(skillInvocation);
      } else {
        await this.handleChatMessage(message);
      }

    } catch (error) {
      this.emit('error', { type: 'message_processing_failed', error, message });
      await this.dependencies.auditLogger.log('message_processing_failed', {
        sessionId: this.sessionId,
        message,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Parse skill invocation from message
   */
  private parseSkillInvocation(message: string): { skillId: string; input: any } | null {
    // Simple pattern: !skillname [args]
    const skillPattern = /^!(\w+)(?:\s+(.+))?$/;
    const match = message.match(skillPattern);
    
    if (match) {
      return {
        skillId: match[1],
        input: match[2] || {}
      };
    }
    
    return null;
  }

  /**
   * Handle skill invocation
   */
  private async handleSkillInvocation(invocation: { skillId: string; input: any }): Promise<void> {
    try {
      // Check permissions
      const hasPermission = await this.dependencies.accessController.checkSkillAccess(
        invocation.skillId,
        this.sessionId
      );
      
      if (!hasPermission) {
        throw new Error(`Insufficient permissions for skill: ${invocation.skillId}`);
      }

      // Execute skill
      const result = await this.dependencies.skillExecutor.execute(
        invocation.skillId,
        invocation.input,
        {
          sessionId: this.sessionId,
          persona: this.dependencies.persona,
          context: this.context
        }
      );

      // Emit response
      this.emit('response', {
        type: 'skill_response',
        skillId: invocation.skillId,
        result,
        message: `Skill ${invocation.skillId} executed successfully`
      });

      // Log skill execution
      await this.dependencies.auditLogger.log('skill_executed', {
        sessionId: this.sessionId,
        skillId: invocation.skillId,
        input: invocation.input,
        result,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('error', { type: 'skill_execution_failed', skillId: invocation.skillId, error });
      throw error;
    }
  }

  /**
   * Handle regular chat message
   */
  private async handleChatMessage(message: string): Promise<void> {
    try {
      // Process through persona if available
      if (this.dependencies.persona) {
        const response = await this.processPersonaResponse(message);
        
        this.emit('response', {
          type: 'chat_response',
          message: response,
          persona: this.dependencies.persona.id
        });
      } else {
        // Default response when no persona loaded
        this.emit('response', {
          type: 'chat_response',
          message: 'No persona loaded. Please load a persona first.',
          persona: null
        });
      }

    } catch (error) {
      this.emit('error', { type: 'chat_processing_failed', error });
      throw error;
    }
  }

  /**
   * Process message through persona
   */
  private async processPersonaResponse(message: string): Promise<string> {
    // This would integrate with the persona's LLM processing
    // For now, return a simple response
    const persona = this.dependencies.persona;
    
    if (persona) {
      return `[${persona.name}] I understand you said: "${message}". This is a placeholder response.`;
    }
    
    return 'No persona available to process message.';
  }

  /**
   * Update session context
   */
  updateContext(updates: any): void {
    this.context = { ...this.context, ...updates };
    this.lastActivity = new Date();
    
    this.emit('context_updated', { context: this.context });
  }

  /**
   * Get session statistics
   */
  getStatistics(): any {
    return {
      sessionId: this.sessionId,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      duration: Date.now() - this.createdAt.getTime(),
      isActive: this._isActive,
      eventHandlers: this.eventHandlers.size,
      contextKeys: Object.keys(this.context).length
    };
  }
}
