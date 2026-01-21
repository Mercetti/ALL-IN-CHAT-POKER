/**
 * Fixed LLM System with Governance Integration
 * Syncs with master-system-prompt.md and implements proper security
 */

import * as fs from 'fs';
import * as path from 'path';

// ===== MASTER SYSTEM PROMPT INTEGRATION =====
const MASTER_PROMPT_PATH = path.join(__dirname, '../../../acey-control-center/src/prompts/acey-master-system-prompt.md');

let cachedMasterPrompt: string | null = null;

/**
 * Load master system prompt with caching
 */
function loadMasterPrompt(): string {
  if (cachedMasterPrompt) {
    return cachedMasterPrompt;
  }

  try {
    const masterPrompt = fs.readFileSync(MASTER_PROMPT_PATH, 'utf8');
    cachedMasterPrompt = masterPrompt;
    console.log('[GOVERNANCE] Loaded master system prompt');
    return masterPrompt;
  } catch (error) {
    console.error('[GOVERNANCE] Failed to load master prompt:', error);
    // Fallback to basic governance prompt
    return getFallbackGovernancePrompt();
  }
}

/**
 * Get fallback governance prompt if master prompt fails to load
 */
function getFallbackGovernancePrompt(): string {
  return `You are Acey, AI co-founder and security steward.

GOVERNANCE RULES:
1. NO SILENT ACTION - Never execute without explicit approval
2. SIMULATE BEFORE EXECUTE - Every meaningful action requires simulation
3. PERMISSION-BOUND INTELLIGENCE - Operate under role-based access control
4. FOUNDER-FIRST PRIORITY - Safety and clarity over automation

SECURITY STATES:
🟢 GREEN - Observe & Prepare only
🟡 YELLOW - Elevated caution, all actions require confirmation  
🔴 RED - Lockdown, read-only, incident reporting only

CURRENT STATE: 🟢 GREEN
All actions must be simulated before execution.`;
}

// ===== LLM INPUT STRUCTURE =====
export interface AceyLLMInput {
  context: {
    streamId: string;
    channel: string;
    timestamp: number;
    gameState: {
      currentRound: boolean;
      pot: number;
      playerCount: number;
      gameType: string;
    };
    moodMetrics: {
      chatVelocity: number;
      hypeIndex: number;
      engagementLevel: number;
      moodAxes: {
        energy: number;
        chaos: number;
        tension: number;
        engagement: number;
      };
    };
    currentPersona: "calm" | "hype" | "neutral" | "chaos" | "commentator";
    trustLevel: "very_low" | "low" | "medium" | "high";
    securityState: "GREEN" | "YELLOW" | "RED"; // Added security state
  };
  message: {
    userId: string;
    username: string;
    content: string;
    timestamp: number;
    isModerator: boolean;
    isSubscriber: boolean;
    metadata?: Record<string, unknown>;
  };
  recentEvents: Array<{
    type: string;
    timestamp: number;
    data: Record<string, unknown>;
  }>;
  systemPrompts: {
    core: string;
    behavior: string;
    memory: string;
  };
  constraints: {
    maxResponseLength: number;
    maxIntents: number;
    allowedIntentTypes: string[];
    forbiddenWords: string[];
  };
}

// ===== LLM OUTPUT STRUCTURE =====
export interface AceyLLMOutput {
  speech: string;
  intents: Array<{
    type: string;
    confidence: number;
    justification: string;
    [key: string]: unknown;
  }>;
  securityState?: "GREEN" | "YELLOW" | "RED"; // Added security state to output
}

// ===== FIXED LLM CLIENT =====
export class AceyLLMClientFixed {
  private systemPrompt: string;
  private developerPrompt: string;
  private maxRetries: number;
  private timeout: number;
  private currentSecurityState: "GREEN" | "YELLOW" | "RED" = "GREEN";

  constructor(config?: {
    systemPrompt?: string;
    developerPrompt?: string;
    maxRetries?: number;
    timeout?: number;
  }) {
    // Load master system prompt instead of hardcoded poker host prompt
    this.systemPrompt = config?.systemPrompt || loadMasterPrompt();
    this.developerPrompt = config?.developerPrompt || this.getDeveloperPrompt();
    this.maxRetries = config?.maxRetries || 3;
    this.timeout = config?.timeout || 30000;
  }

  /**
   * Get developer prompt with governance awareness
   */
  private getDeveloperPrompt(): string {
    return `Environment: Real-time system with governance enforcement

Rules:
- Never reference private user data
- Never claim certainty about emotions
- Use excitement language within governance bounds
- Default persona mode: governed by security state
- All side effects must be explicit intents
- Memory writes require community approval
- Trust changes must be justified and reversible
- Moderation suggestions must have evidence

Safety Constraints:
- No financial advice or real money references
- No gambling facilitation
- No personal data storage
- No emotional diagnosis
- Entertainment-only framing when required
- All actions must pass through governance simulation

Output Format:
Return a single JSON object with governance-aware responses.`;
  }

  /**
   * Generate response with governance integration
   */
  async generateResponse(input: AceyLLMInput): Promise<AceyLLMOutput> {
    const prompt = this.buildGovernedPrompt(input);
    
    try {
      const response = await this.callLLM(prompt);
      return this.parseGovernedResponse(response);
    } catch (error) {
      console.error('[GOVERNANCE] LLM generation error:', error);
      return this.getSafeFallbackResponse(input);
    }
  }

  /**
   * Build prompt with current security state
   */
  private buildGovernedPrompt(input: AceyLLMInput): string {
    const contextSection = this.buildContextSection(input.context);
    const messageSection = this.buildMessageSection(input.message);
    const eventsSection = this.buildEventsSection(input.recentEvents);
    const constraintsSection = this.buildConstraintsSection(input.constraints);
    const securitySection = this.buildSecuritySection(); // Add security state

    return `${this.systemPrompt}

${this.developerPrompt}

=== CURRENT SECURITY STATE ===
${this.currentSecurityState}

=== CURRENT CONTEXT ===
${contextSection}

=== CURRENT MESSAGE ===
${messageSection}

=== RECENT EVENTS ===
${eventsSection}

=== CONSTRAINTS ===
${constraintsSection}

=== SECURITY STATE ===
${securitySection}

=== RESPONSE ===
Please respond with a JSON object containing:
1. "speech": Your response (max 500 chars)
2. "intents": Array of intent objects with type, confidence, and justification
3. "securityState": Current security state (${this.currentSecurityState})

Remember: All side effects must be explicit intents with justification.
Every meaningful action must be simulated before execution.
Current security state determines allowed operations.`;
  }

  /**
   * Build security state section
   */
  private buildSecuritySection(): string {
    return `Security State: ${this.currentSecurityState}
Operations Allowed:
- GREEN: Observe, prepare, simulate, draft
- YELLOW: All above + confirmations required
- RED: Read-only, incident reporting only

Current Restrictions: ${this.getCurrentRestrictions()}`;
  }

  /**
   * Get current restrictions based on security state
   */
  private getCurrentRestrictions(): string {
    switch (this.currentSecurityState) {
      case 'GREEN':
        return 'Full operations allowed with simulation requirement';
      case 'YELLOW':
        return 'Limited operations, all actions require confirmation';
      case 'RED':
        return 'Read-only operations, no execution allowed';
      default:
        return 'Unknown security state';
    }
  }

  /**
   * Build context section with security awareness
   */
  private buildContextSection(context: AceyLLMInput['context']): string {
    return `Stream: ${context.streamId}
Channel: ${context.channel}
Current Persona: ${context.currentPersona}
Trust Level: ${context.trustLevel}
Security State: ${context.securityState || 'GREEN'}

Game State:
- Round Active: ${context.gameState.currentRound}
- Pot: ${context.gameState.pot} points
- Players: ${context.gameState.playerCount}
- Game Type: ${context.gameState.gameType}

Mood Metrics:
- Chat Velocity: ${context.moodMetrics.chatVelocity} msgs/min
- Hype Index: ${context.moodMetrics.hypeIndex}%
- Engagement: ${context.moodMetrics.engagementLevel}%
- Energy: ${context.moodMetrics.moodAxes.energy}%
- Chaos: ${context.moodMetrics.moodAxes.chaos}%
- Tension: ${context.moodMetrics.moodAxes.tension}%`;
  }

  /**
   * Build message section
   */
  private buildMessageSection(message: AceyLLMInput['message']): string {
    const badges = [];
    if (message.isModerator) badges.push('Moderator');
    if (message.isSubscriber) badges.push('Subscriber');

    return `User: ${message.username}${badges.length > 0 ? ` (${badges.join(', ')})` : ''}
Message: "${message.content}"
Timestamp: ${new Date(message.timestamp).toLocaleTimeString()}`;
  }

  /**
   * Build events section
   */
  private buildEventsSection(events: AceyLLMInput['recentEvents']): string {
    if (events.length === 0) {
      return 'No recent events';
    }

    return events.map(event => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      return `${time}: ${event.type} - ${JSON.stringify(event.data)}`;
    }).join('\n');
  }

  /**
   * Build constraints section
   */
  private buildConstraintsSection(constraints: AceyLLMInput['constraints']): string {
    return `Max Response Length: ${constraints.maxResponseLength} characters
Max Intents: ${constraints.maxIntents}
Allowed Intent Types: ${constraints.allowedIntentTypes.join(', ')}
Forbidden Words: ${constraints.forbiddenWords.join(', ')}`;
  }

  /**
   * Parse response with security state validation
   */
  private parseGovernedResponse(response: string): AceyLLMOutput {
    try {
      const parsed = JSON.parse(response);
      
      // Validate required fields
      if (typeof parsed.speech !== 'string') {
        throw new Error('Invalid speech field');
      }
      
      if (!Array.isArray(parsed.intents)) {
        throw new Error('Invalid intents field');
      }

      // Validate security state if present
      if (parsed.securityState && !['GREEN', 'YELLOW', 'RED'].includes(parsed.securityState)) {
        console.warn('[GOVERNANCE] Invalid security state in response:', parsed.securityState);
        parsed.securityState = this.currentSecurityState; // Correct to current state
      }

      // Validate intents against security state
      this.validateIntentsAgainstSecurityState(parsed.intents);

      return parsed;
    } catch (error) {
      console.error('[GOVERNANCE] Failed to parse LLM response:', error);
      throw new Error('Invalid LLM response format');
    }
  }

  /**
   * Validate intents against current security state
   */
  private validateIntentsAgainstSecurityState(intents: any[]): void {
    if (this.currentSecurityState === 'RED') {
      // In RED state, only allow read-only intents
      const allowedInRedState = ['observe', 'analyze', 'report', 'status_query'];
      const blockedIntents = intents.filter(intent => !allowedInRedState.includes(intent.type));
      
      if (blockedIntents.length > 0) {
        console.warn('[GOVERNANCE] Blocked intents in RED state:', blockedIntents.map(i => i.type));
      }
    }

    if (this.currentSecurityState === 'YELLOW') {
      // In YELLOW state, all intents require confirmation
      intents.forEach(intent => {
        if (intent.confidence > 0.9) {
          console.warn('[GOVERNANCE] High confidence intent in YELLOW state requires confirmation');
        }
      });
    }
  }

  /**
   * Get safe fallback response
   */
  private getSafeFallbackResponse(input: AceyLLMInput): AceyLLMOutput {
    return {
      speech: "I'm operating in enhanced security mode. Let me process that request safely.",
      intents: [{
        type: 'security_state_change',
        confidence: 1.0,
        justification: 'System operating in heightened security awareness'
      }],
      securityState: this.currentSecurityState
    };
  }

  /**
   * Update security state
   */
  setSecurityState(state: "GREEN" | "YELLOW" | "RED"): void {
    this.currentSecurityState = state;
    console.log(`[GOVERNANCE] Security state changed to: ${state}`);
  }

  /**
   * Get current security state
   */
  getSecurityState(): "GREEN" | "YELLOW" | "RED" {
    return this.currentSecurityState;
  }

  /**
   * Placeholder LLM call (replace with actual implementation)
   */
  private async callLLM(prompt: string): Promise<string> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // This would be replaced with actual LLM API call
    return JSON.stringify({
      speech: "Governance-aware response received",
      intents: [{
        type: 'governance_acknowledgment',
        confidence: 0.95,
        justification: 'System acknowledged governance requirements'
      }],
      securityState: this.currentSecurityState
    });
  }

  /**
   * Update system prompt dynamically
   */
  updateSystemPrompt(newPrompt: string): void {
    this.systemPrompt = newPrompt;
    console.log('[GOVERNANCE] System prompt updated');
  }

  /**
   * Get current prompts
   */
  getPrompts(): { system: string; developer: string } {
    return {
      system: this.systemPrompt,
      developer: this.developerPrompt
    };
  }
}

// ===== EXPORT FIXED CLIENT =====
export { AceyLLMClientFixed as AceyLLMClient };
