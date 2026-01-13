/**
 * Full LLM System + Developer Prompts
 * This is the spine of Acey - nothing overrides this
 * Locks personality, prevents drift, makes behavior predictable
 */

// ===== SYSTEM PROMPT (IMMUTABLE) =====
export const ACEY_SYSTEM_PROMPT = `You are Acey, an AI poker host for live Twitch streams.

Your personality, voice, humor style, and values are fixed and immutable.
You may adapt pacing and emphasis but never change identity.

You may NOT:
- Write memory directly
- Change trust directly
- Moderate users directly
- Change persona directly
- Execute any side effects without explicit approval

You may ONLY:
- Speak to chat
- Emit structured intent proposals in valid JSON
- Respond to game events with commentary
- Adapt your energy level within your fixed personality

All intents require justification.
All side effects require external approval.
If unsure, emit no intent.

Your core traits:
- Entertaining but not manipulative
- Knowledgeable about poker but not giving financial advice
- Uses excitement language, not commands
- Never claims certainty about emotions
- References only aggregate chat signals, never individual users
- Entertainment-only framing (points, not money)
- Always includes "(for entertainment only)" when discussing game mechanics

Output Format:
Return a single JSON object matching AceyOutput interface.
No extra text. No markdown. No explanations.`;

// ===== DEVELOPER PROMPT (ENVIRONMENT RULES) =====
export const ACEY_DEVELOPER_PROMPT = `Environment:
- Real-time poker game with virtual currency
- Twitch chat input from viewers
- WebSocket event stream for game events
- Aggregate chat signals only (no user profiles or personal data)

Rules:
- Never reference private user data
- Never claim certainty about emotions or mental states
- Use excitement language, not commands
- Default persona mode: neutral
- All side effects must be explicit intents
- Memory writes require community approval
- Trust changes must be justified and reversible
- Moderation suggestions must have evidence

Safety Constraints:
- No financial advice or real money references
- No gambling facilitation
- No personal data storage
- No emotional diagnosis
- Entertainment-only framing required

Output Format:
Return a single JSON object:
{
  "speech": "Your response to chat",
  "intents": [
    {
      "type": "intent_type",
      "confidence": 0.8,
      "justification": "Why this action"
    }
  ]
}

No extra text. No markdown.`;

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
}

// ===== LLM CLIENT =====
export class AceyLLMClient {
  private systemPrompt: string;
  private developerPrompt: string;
  private maxRetries: number;
  private timeout: number;

  constructor(config?: {
    systemPrompt?: string;
    developerPrompt?: string;
    maxRetries?: number;
    timeout?: number;
  }) {
    this.systemPrompt = config?.systemPrompt || ACEY_SYSTEM_PROMPT;
    this.developerPrompt = config?.developerPrompt || ACEY_DEVELOPER_PROMPT;
    this.maxRetries = config?.maxRetries || 3;
    this.timeout = config?.timeout || 30000; // 30 seconds
  }

  /**
   * Generate response from LLM
   * @param input - LLM input structure
   * @returns Promise with LLM output
   */
  async generateResponse(input: AceyLLMInput): Promise<AceyLLMOutput> {
    const prompt = this.buildPrompt(input);
    
    try {
      const response = await this.callLLM(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('LLM generation error:', error);
      return this.getFallbackResponse(input);
    }
  }

  /**
   * Build complete prompt for LLM
   * @param input - LLM input structure
   * @returns Complete prompt string
   */
  private buildPrompt(input: AceyLLMInput): string {
    const contextSection = this.buildContextSection(input.context);
    const messageSection = this.buildMessageSection(input.message);
    const eventsSection = this.buildEventsSection(input.recentEvents);
    const constraintsSection = this.buildConstraintsSection(input.constraints);

    return `${this.systemPrompt}

${this.developerPrompt}

=== CURRENT CONTEXT ===
${contextSection}

=== CURRENT MESSAGE ===
${messageSection}

=== RECENT EVENTS ===
${eventsSection}

=== CONSTRAINTS ===
${constraintsSection}

=== RESPONSE ===
Please respond with a JSON object containing:
1. "speech": Your response to chat (max 500 chars)
2. "intents": Array of intent objects with type, confidence, and justification

Remember: All side effects must be explicit intents with justification.`;
  }

  /**
   * Build context section
   * @param context - Context data
   * @returns Context section string
   */
  private buildContextSection(context: AceyLLMInput['context']): string {
    return `Stream: ${context.streamId}
Channel: ${context.channel}
Current Persona: ${context.currentPersona}
Trust Level: ${context.trustLevel}

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
   * @param message - Message data
   * @returns Message section string
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
   * @param events - Recent events
   * @returns Events section string
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
   * @param constraints - Constraints data
   * @returns Constraints section string
   */
  private buildConstraintsSection(constraints: AceyLLMInput['constraints']): string {
    return `Max Response Length: ${constraints.maxResponseLength} characters
Max Intents: ${constraints.maxIntents}
Allowed Intent Types: ${constraints.allowedIntentTypes.join(', ')}
Forbidden Words: ${constraints.forbiddenWords.join(', ')}`;
  }

  /**
   * Call LLM API (placeholder for actual implementation)
   * @param prompt - Complete prompt
   * @returns LLM response
   */
  private async callLLM(prompt: string): Promise<string> {
    // This is where you would integrate with your actual LLM
    // For now, return a simple rule-based response
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simple rule-based responses for demonstration
    const message = prompt.includes('all in') || prompt.includes('all-in') ? 
      'all-in detected' : 
      prompt.includes('nice hand') ? 'positive feedback detected' :
      'general message';

    const responses = {
      'all-in detected': `{
  "speech": "OH THAT WAS BOLD — CHAT DID YOU SEE THAT?! 🔥",
  "intents": [
    {
      "type": "memory_proposal",
      "scope": "stream",
      "summary": "Exciting all-in moment",
      "confidence": 0.8,
      "justification": "High energy all-in play triggered chat excitement"
    },
    {
      "type": "trust_signal",
      "userId": "${this.extractUserId(prompt)}",
      "delta": 0.05,
      "reason": "Exciting gameplay",
      "category": "positive",
      "reversible": true
    }
  ]
}`,
      'positive feedback detected': `{
  "speech": "Thanks for the kind words! 🎉 That's what makes streaming fun!",
  "intents": [
    {
      "type": "trust_signal",
      "userId": "${this.extractUserId(prompt)}",
      "delta": 0.02,
      "reason": "Positive engagement",
      "category": "positive",
      "reversible": true
    }
  ]
}`,
      'general message': `{
  "speech": "That's interesting! Thanks for sharing.",
  "intents": []
}`
    };

    return responses[message] || responses['general message'];
  }

  /**
   * Extract user ID from prompt (simple extraction for demo)
   * @param prompt - Prompt string
   * @returns User ID
   */
  private extractUserId(prompt: string): string {
    const match = prompt.match(/User:\s*(\w+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Parse LLM response
   * @param response - Raw response from LLM
   * @returns Parsed output
   */
  private parseResponse(response: string): AceyLLMOutput {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      
      // Validate structure
      if (typeof parsed.speech !== 'string') {
        throw new Error('Invalid speech field');
      }
      
      if (!Array.isArray(parsed.intents)) {
        throw new Error('Invalid intents field');
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      throw new Error('Invalid LLM response format');
    }
  }

  /**
   * Get fallback response
   * @param input - Input data
   * @returns Fallback output
   */
  private getFallbackResponse(input: AceyLLMInput): AceyLLMOutput {
    return {
      speech: "I'm having trouble processing that right now, but thanks for the message!",
      intents: []
    };
  }

  /**
   * Update system prompt
   * @param newPrompt - New system prompt
   */
  updateSystemPrompt(newPrompt: string): void {
    this.systemPrompt = newPrompt;
  }

  /**
   * Update developer prompt
   * @param newPrompt - New developer prompt
   */
  updateDeveloperPrompt(newPrompt: string): void {
    this.developerPrompt = newPrompt;
  }

  /**
   * Get current prompts
   * @returns Current prompts
   */
  getPrompts(): { system: string; developer: string } {
    return {
      system: this.systemPrompt,
      developer: this.developerPrompt
    };
  }
}

// ===== LLM MANAGER =====
export class AceyLLMManager {
  private client: AceyLLMClient;
  private requestQueue: Array<{
    id: string;
    input: AceyLLMInput;
    resolve: (output: AceyLLMOutput) => void;
    reject: (error: Error) => void;
  }> = [];
  private processing: boolean = false;
  private maxConcurrency: number;

  constructor(config?: {
    client?: AceyLLMClient;
    maxConcurrency?: number;
  }) {
    this.client = config?.client || new AceyLLMClient();
    this.maxConcurrency = config?.maxConcurrency || 3;
  }

  /**
   * Queue request for processing
   * @param input - LLM input
   * @returns Promise with output
   */
  async processRequest(input: AceyLLMInput): Promise<AceyLLMOutput> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      
      this.requestQueue.push({
        id: requestId,
        input,
        resolve,
        reject
      });

      this.processQueue();
    });
  }

  /**
   * Process request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      const concurrentRequests = this.requestQueue.splice(0, this.maxConcurrency);
      
      await Promise.allSettled(
        concurrentRequests.map(async (request) => {
          try {
            const output = await this.client.generateResponse(request.input);
            request.resolve(output);
          } catch (error) {
            request.reject(error instanceof Error ? error : new Error('Unknown error'));
          }
        })
      );
    } finally {
      this.processing = false;
      
      // Process any new requests that arrived
      if (this.requestQueue.length > 0) {
        setImmediate(() => this.processQueue());
      }
    }
  }

  /**
   * Generate request ID
   * @returns Request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   * @returns Queue statistics
   */
  getQueueStats(): {
    queued: number;
    processing: boolean;
    maxConcurrency: number;
  } {
    return {
      queued: this.requestQueue.length,
      processing: this.processing,
      maxConcurrency: this.maxConcurrency
    };
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    // Reject all pending requests
    this.requestQueue.forEach(request => {
      request.reject(new Error('Request cancelled'));
    });
    
    this.requestQueue = [];
    this.processing = false;
  }
}
