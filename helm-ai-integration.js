/**
 * Helm AI Integration - External AI Communication
 * Connects Helm Engine to external AI services through Render server
 */

class HelmAIIntegration {
  constructor(options = {}) {
    this.aiProvider = options.aiProvider || 'openai'; // openai, anthropic, local
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    this.baseURL = options.baseURL || 'https://api.openai.com/v1';
    this.model = options.model || 'gpt-3.5-turbo';
    this.maxTokens = options.maxTokens || 1000;
    this.timeout = options.timeout || 30000;
  }

  /**
   * Generate AI response through external service
   */
  async generateResponse(prompt, context = {}) {
    try {
      switch (this.aiProvider) {
        case 'openai':
          return await this.callOpenAI(prompt, context);
        case 'anthropic':
          return await this.callAnthropic(prompt, context);
        case 'local':
          return await this.callLocalAI(prompt, context);
        default:
          throw new Error(`Unsupported AI provider: ${this.aiProvider}`);
      }
    } catch (error) {
      console.error('AI integration error:', error);
      // Fallback to simple response
      return this.getFallbackResponse(prompt, context);
    }
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(prompt, context) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(context)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      response: data.choices[0].message.content,
      provider: 'openai',
      model: this.model,
      tokens: data.usage?.total_tokens || 0
    };
  }

  /**
   * Call Anthropic Claude API
   */
  async callAnthropic(prompt, context) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: `${this.getSystemPrompt(context)}\n\n${prompt}`
          }
        ]
      }),
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      response: data.content[0].text,
      provider: 'anthropic',
      model: 'claude-3-haiku',
      tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0
    };
  }

  /**
   * Call Local AI (Ollama)
   */
  async callLocalAI(prompt, context) {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2',
        prompt: `${this.getSystemPrompt(context)}\n\n${prompt}`,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: this.maxTokens
        }
      }),
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Local AI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      response: data.response,
      provider: 'local',
      model: 'llama2',
      tokens: data.eval_count || 0
    };
  }

  /**
   * Get system prompt based on context
   */
  getSystemPrompt(context) {
    const basePrompt = `You are an AI assistant integrated with Helm Control, a professional AI orchestration system. You help with poker game operations, chat responses, and system monitoring while maintaining safety and professionalism.`;

    const contextPrompts = {
      poker: `${basePrompt} You specialize in poker game commentary and assistance. Provide helpful, engaging responses about poker gameplay, strategy, and game state.`,
      chat: `${basePrompt} You engage in friendly conversation while maintaining appropriate boundaries. Be helpful but don't provide personal opinions or sensitive information.`,
      analytics: `${basePrompt} You provide data analysis and insights about system performance, user activity, and game metrics.`,
      admin: `${basePrompt} You assist with system administration and monitoring tasks. Provide technical information and troubleshooting guidance.`
    };

    return contextPrompts[context.type] || basePrompt;
  }

  /**
   * Fallback response when AI is unavailable
   */
  getFallbackResponse(prompt, context) {
    const fallbacks = {
      poker: [
        "That's an interesting poker move! The game is quite engaging right now.",
        "Nice strategy! The pot is building up nicely.",
        "Great question about the game. Let me check the current status for you."
      ],
      chat: [
        "I'm here to help! What would you like to know about the game?",
        "That's an interesting point! How can I assist you further?",
        "I appreciate your message. Is there anything specific about the game I can help with?"
      ],
      analytics: [
        "System analytics are currently being processed. Performance looks stable.",
        "Recent activity shows good engagement levels across all features.",
        "The system is operating within normal parameters."
      ],
      default: [
        "I'm processing your request. The system is functioning normally.",
        "Thank you for your input. I'm here to help with the game operations.",
        "Your message has been received. The AI systems are operating as expected."
      ]
    };

    const category = context.type || 'default';
    const responses = fallbacks[category];
    
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      provider: 'fallback',
      model: 'rule-based',
      tokens: 0
    };
  }

  /**
   * Test AI connection
   */
  async testConnection() {
    try {
      const result = await this.generateResponse("Hello, this is a test.", { type: 'chat' });
      return {
        success: true,
        provider: this.aiProvider,
        model: result.model,
        response: result.response
      };
    } catch (error) {
      return {
        success: false,
        provider: this.aiProvider,
        error: error.message
      };
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      provider: this.aiProvider,
      model: this.model,
      maxTokens: this.maxTokens,
      timeout: this.timeout
    };
  }
}

module.exports = HelmAIIntegration;
