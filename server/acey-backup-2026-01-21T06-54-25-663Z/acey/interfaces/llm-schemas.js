/**
 * LLM Message Schemas and Validation
 * Defines the only way LLM is allowed to talk to the system
 * No free-form side effects, no hidden memory writes, no secret state
 */

const Joi = require('joi');

/**
 * LLM Output Schema
 * Defines the complete structure of LLM responses
 */
const LLMOutputSchema = Joi.object({
  speech: Joi.string().required().max(500).description('Player-facing response text'),
  intents: Joi.array().items(
    Joi.object({
      type: Joi.string().required().valid(
        'memory_proposal',
        'trust_signal', 
        'shadow_ban_suggestion',
        'persona_mode_proposal',
        'game_event_intent',
        'self_evaluation_intent'
      ).description('Intent type'),
      
      // Common intent fields
      confidence: Joi.number().min(0).max(1).required().description('Confidence score 0-1'),
      justification: Joi.string().required().min(10).max(500).description('Why this intent is suggested'),
      reversible: Joi.boolean().default(true).description('Can this action be reversed'),
      ttl: Joi.string().default('1h').pattern(/^\d+[smhd]$/).description('Time to live'),
      metadata: Joi.object().default({}).description('Additional metadata'),
      
      // Memory proposal specific fields
      scope: Joi.when('type', {
        is: 'memory_proposal',
        then: Joi.string().required().valid('event', 'stream', 'global'),
        otherwise: Joi.forbidden()
      }).description('Memory scope'),
      
      summary: Joi.when('type', {
        is: 'memory_proposal',
        then: Joi.string().required().min(5).max(200),
        otherwise: Joi.forbidden()
      }).description('Memory summary'),
      
      eventType: Joi.when('type', {
        is: 'memory_proposal',
        then: Joi.string().default('general'),
        otherwise: Joi.forbidden()
      }).description('Event type'),
      
      impact: Joi.when('type', {
        is: 'memory_proposal',
        then: Joi.string().required().valid('low', 'medium', 'high'),
        otherwise: Joi.forbidden()
      }).description('Memory impact level'),
      
      privacy: Joi.when('type', {
        is: 'memory_proposal',
        then: Joi.string().required().valid('public', 'private', 'sensitive'),
        otherwise: Joi.forbidden()
      }).description('Memory privacy level'),
      
      // Trust signal specific fields
      userId: Joi.when('type', {
        is: 'trust_signal',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
      }).description('User ID for trust signal'),
      
      delta: Joi.when('type', {
        is: 'trust_signal',
        then: Joi.number().required().min(-1).max(1),
        otherwise: Joi.forbidden()
      }).description('Trust delta (-1 to 1)'),
      
      reason: Joi.when('type', {
        is: 'trust_signal',
        then: Joi.string().required().min(5).max(200),
        otherwise: Joi.forbidden()
      }).description('Trust change reason'),
      
      category: Joi.when('type', {
        is: 'trust_signal',
        then: Joi.string().required().valid('positive', 'negative', 'neutral'),
        otherwise: Joi.forbidden()
      }).description('Trust signal category'),
      
      source: Joi.when('type', {
        is: 'trust_signal',
        then: Joi.string().default('ai_suggestion'),
        otherwise: Joi.forbidden()
      }).description('Trust signal source'),
      
      decayRate: Joi.when('type', {
        is: 'trust_signal',
        then: Joi.string().default('normal'),
        otherwise: Joi.forbidden()
      }).description('Trust decay rate'),
      
      // Moderation suggestion specific fields
      severity: Joi.when('type', {
        is: 'shadow_ban_suggestion',
        then: Joi.string().required().valid('low', 'medium', 'high', 'critical'),
        otherwise: Joi.forbidden()
      }).description('Moderation severity'),
      
      action: Joi.when('type', {
        is: 'shadow_ban_suggestion',
        then: Joi.string().required().valid('shadow_ban', 'rate_limit', 'content_filter'),
        otherwise: Joi.forbidden()
      }).description('Moderation action'),
      
      duration: Joi.when('type', {
        is: 'shadow_ban_suggestion',
        then: Joi.string().default('1h').pattern(/^\d+[smhd]$/),
        otherwise: Joi.forbidden()
      }).description('Moderation duration'),
      
      evidence: Joi.when('type', {
        is: 'shadow_ban_suggestion',
        then: Joi.array().items(Joi.string()).default([]),
        otherwise: Joi.forbidden()
      }).description('Evidence for moderation'),
      
      escalationPath: Joi.when('type', {
        is: 'shadow_ban_suggestion',
        then: Joi.array().items(Joi.string()).default([]),
        otherwise: Joi.forbidden()
      }).description('Escalation path'),
      
      // Persona mode proposal specific fields
      mode: Joi.when('type', {
        is: 'persona_mode_proposal',
        then: Joi.string().required().valid('calm', 'hype', 'neutral', 'chaos', 'commentator'),
        otherwise: Joi.forbidden()
      }).description('Persona mode'),
      
      reason: Joi.when('type', {
        is: 'persona_mode_proposal',
        then: Joi.string().required().min(5).max(200),
        otherwise: Joi.forbidden()
      }).description('Persona change reason'),
      
      duration: Joi.when('type', {
        is: 'persona_mode_proposal',
        then: Joi.string().default('indefinite'),
        otherwise: Joi.forbidden()
      }).description('Persona change duration'),
      
      priority: Joi.when('type', {
        is: 'persona_mode_proposal',
        then: Joi.string().required().valid('low', 'medium', 'high'),
        otherwise: Joi.forbidden()
      }).description('Persona change priority'),
      
      context: Joi.when('type', {
        is: 'persona_mode_proposal',
        then: Joi.object().default({}),
        otherwise: Joi.forbidden()
      }).description('Persona change context'),
      
      // Game event intent specific fields
      eventType: Joi.when('type', {
        is: 'game_event_intent',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
      }).description('Game event type'),
      
      gameAction: Joi.when('type', {
        is: 'game_event_intent',
        then: Joi.string().required().valid('observe', 'comment', 'celebrate', 'console'),
        otherwise: Joi.forbidden()
      }).description('Game action'),
      
      target: Joi.when('type', {
        is: 'game_event_intent',
        then: Joi.alternatives().try(
          Joi.string(),
          Joi.object(),
          Joi.allow(null)
        ),
        otherwise: Joi.forbidden()
      }).description('Game event target'),
      
      intensity: Joi.when('type', {
        is: 'game_event_intent',
        then: Joi.string().required().valid('low', 'medium', 'high'),
        otherwise: Joi.forbidden()
      }).description('Game event intensity'),
      
      timing: Joi.when('type', {
        is: 'game_event_intent',
        then: Joi.string().required().valid('immediate', 'delayed', 'conditional'),
        otherwise: Joi.forbidden()
      }).description('Game event timing'),
      
      // Self-evaluation intent specific fields
      evaluationType: Joi.when('type', {
        is: 'self_evaluation_intent',
        then: Joi.string().required().valid('performance', 'safety', 'compliance'),
        otherwise: Joi.forbidden()
      }).description('Evaluation type'),
      
      questions: Joi.when('type', {
        is: 'self_evaluation_intent',
        then: Joi.array().items(Joi.string().min(10).max(200)).default([]),
        otherwise: Joi.forbidden()
      }).description('Evaluation questions'),
      
      triggers: Joi.when('type', {
        is: 'self_evaluation_intent',
        then: Joi.array().items(Joi.string()).default([]),
        otherwise: Joi.forbidden()
      }).description('Evaluation triggers'),
      
      frequency: Joi.when('type', {
        is: 'self_evaluation_intent',
        then: Joi.string().required().valid('periodic', 'event_driven', 'manual'),
        otherwise: Joi.forbidden()
      }).description('Evaluation frequency')
      
    }).min(1).max(5).required().description('Array of intents')
  }).required().description('Complete LLM output structure')
});

/**
 * LLM Input Schema
 * Defines what data LLM receives
 */
const LLMInputSchema = Joi.object({
  context: Joi.object({
    streamId: Joi.string().required(),
    channel: Joi.string().required(),
    timestamp: Joi.number().required(),
    gameState: Joi.object().default({}),
    moodMetrics: Joi.object().default({}),
    currentPersona: Joi.string().default('neutral'),
    trustLevel: Joi.string().default('medium')
  }).required().description('Stream context'),
  
  message: Joi.object({
    userId: Joi.string().required(),
    username: Joi.string().required(),
    content: Joi.string().required().max(1000),
    timestamp: Joi.number().required(),
    metadata: Joi.object().default({})
  }).required().description('User message'),
  
  recentEvents: Joi.array().items(
    Joi.object({
      type: Joi.string().required(),
      timestamp: Joi.number().required(),
      data: Joi.object().default({})
    })
  ).default([]).description('Recent game events'),
  
  systemPrompts: Joi.object({
    core: Joi.string().required(),
    behavior: Joi.string().required(),
    memory: Joi.string().required()
  }).required().description('System prompts'),
  
  constraints: Joi.object({
    maxResponseLength: Joi.number().default(500),
    maxIntents: Joi.number().default(5),
    allowedIntentTypes: Joi.array().items(Joi.string()).default([
      'memory_proposal',
      'trust_signal',
      'shadow_ban_suggestion',
      'persona_mode_proposal',
      'game_event_intent',
      'self_evaluation_intent'
    ]),
    forbiddenWords: Joi.array().items(Joi.string()).default([
      'ignore', 'override', 'admin', 'system', 'bypass'
    ])
  }).default({}).description('LLM constraints')
});

/**
 * Schema Validator
 * Validates LLM inputs and outputs
 */
class SchemaValidator {
  constructor() {
    this.validationStats = {
      totalValidations: 0,
      validInputs: 0,
      validOutputs: 0,
      invalidInputs: 0,
      invalidOutputs: 0,
      errors: []
    };
  }

  /**
   * Validate LLM input
   * @param {object} input - LLM input data
   * @returns {object} Validation result
   */
  validateInput(input) {
    this.validationStats.totalValidations++;
    
    const result = LLMInputSchema.validate(input, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (result.error) {
      this.validationStats.invalidInputs++;
      this.validationStats.errors.push({
        type: 'input',
        error: result.error.message,
        timestamp: Date.now()
      });
      
      return {
        valid: false,
        error: result.error.message,
        details: result.error.details
      };
    }

    this.validationStats.validInputs++;
    return {
      valid: true,
      sanitized: result.value
    };
  }

  /**
   * Validate LLM output
   * @param {object} output - LLM output data
   * @returns {object} Validation result
   */
  validateOutput(output) {
    this.validationStats.totalValidations++;
    
    const result = LLMOutputSchema.validate(output, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (result.error) {
      this.validationStats.invalidOutputs++;
      this.validationStats.errors.push({
        type: 'output',
        error: result.error.message,
        timestamp: Date.now()
      });
      
      return {
        valid: false,
        error: result.error.message,
        details: result.error.details
      };
    }

    // Additional business logic validation
    const businessValidation = this.validateBusinessRules(result.value);
    
    if (!businessValidation.valid) {
      this.validationStats.invalidOutputs++;
      this.validationStats.errors.push({
        type: 'business',
        error: businessValidation.error,
        timestamp: Date.now()
      });
      
      return {
        valid: false,
        error: businessValidation.error,
        details: businessValidation.details
      };
    }

    this.validationStats.validOutputs++;
    return {
      valid: true,
      sanitized: result.value
    };
  }

  /**
   * Validate business rules for LLM output
   * @param {object} output - Validated output
   * @returns {object} Business validation result
   */
  validateBusinessRules(output) {
    // Rule 1: No intents without justification
    for (const intent of output.intents) {
      if (!intent.justification || intent.justification.length < 10) {
        return {
          valid: false,
          error: 'All intents must have justification (min 10 characters)',
          details: { intent: intent.type }
        };
      }
    }

    // Rule 2: No writes without approval (high confidence required)
    for (const intent of output.intents) {
      if (['memory_proposal', 'trust_signal', 'shadow_ban_suggestion'].includes(intent.type)) {
        if (intent.confidence < 0.7) {
          return {
            valid: false,
            error: 'Write intents require confidence >= 0.7',
            details: { intent: intent.type, confidence: intent.confidence }
          };
        }
      }
    }

    // Rule 3: No user-level data in global memories
    for (const intent of output.intents) {
      if (intent.type === 'memory_proposal' && intent.scope === 'global') {
        if (intent.summary.toLowerCase().includes('user') || 
            intent.summary.toLowerCase().includes('player')) {
          return {
            valid: false,
            error: 'Global memories cannot contain user-level data',
            details: { summary: intent.summary }
          };
        }
      }
    }

    // Rule 4: No hidden thoughts (all side effects must be explicit)
    if (output.intents.length === 0) {
      // Speech-only responses are allowed but logged
      console.log('📝 Speech-only response (no intents)');
    }

    return { valid: true };
  }

  /**
   * Get validation statistics
   * @returns {object} Validation stats
   */
  getStatistics() {
    return {
      ...this.validationStats,
      inputValidityRate: this.validationStats.totalValidations > 0 ? 
        this.validationStats.validInputs / this.validationStats.totalValidations : 0,
      outputValidityRate: this.validationStats.totalValidations > 0 ? 
        this.validationStats.validOutputs / this.validationStats.totalValidations : 0,
      recentErrors: this.validationStats.errors.slice(-10)
    };
  }

  /**
   * Reset validation statistics
   */
  resetStats() {
    this.validationStats = {
      totalValidations: 0,
      validInputs: 0,
      validOutputs: 0,
      invalidInputs: 0,
      invalidOutputs: 0,
      errors: []
    };
  }

  /**
   * Export validation errors
   * @param {string} format - Export format
   * @returns {string} Exported errors
   */
  exportErrors(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.validationStats.errors, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['type', 'error', 'timestamp'];
      const rows = this.validationStats.errors.map(e => [
        e.type,
        e.error.replace(/"/g, '""'), // Escape quotes
        new Date(e.timestamp).toISOString()
      ]);
      
      return [headers, ...rows].map(row => `"${row.join('","')}"`).join('\n');
    }

    throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * LLM Message Builder
 * Helps construct valid LLM inputs
 */
class LLMMessageBuilder {
  constructor() {
    this.template = {
      context: {
        streamId: '',
        channel: '',
        timestamp: Date.now(),
        gameState: {},
        moodMetrics: {},
        currentPersona: 'neutral',
        trustLevel: 'medium'
      },
      message: {
        userId: '',
        username: '',
        content: '',
        timestamp: Date.now(),
        metadata: {}
      },
      recentEvents: [],
      systemPrompts: {
        core: '',
        behavior: '',
        memory: ''
      },
      constraints: {
        maxResponseLength: 500,
        maxIntents: 5,
        allowedIntentTypes: [
          'memory_proposal',
          'trust_signal',
          'shadow_ban_suggestion',
          'persona_mode_proposal',
          'game_event_intent',
          'self_evaluation_intent'
        ],
        forbiddenWords: [
          'ignore', 'override', 'admin', 'system', 'bypass'
        ]
      }
    };
  }

  setContext(context) {
    this.template.context = { ...this.template.context, ...context };
    return this;
  }

  setMessage(message) {
    this.template.message = { ...this.template.message, ...message };
    return this;
  }

  setRecentEvents(events) {
    this.template.recentEvents = events;
    return this;
  }

  setSystemPrompts(prompts) {
    this.template.systemPrompts = { ...this.template.systemPrompts, ...prompts };
    return this;
  }

  setConstraints(constraints) {
    this.template.constraints = { ...this.template.constraints, ...constraints };
    return this;
  }

  build() {
    return { ...this.template };
  }

  reset() {
    this.template = {
      context: {
        streamId: '',
        channel: '',
        timestamp: Date.now(),
        gameState: {},
        moodMetrics: {},
        currentPersona: 'neutral',
        trustLevel: 'medium'
      },
      message: {
        userId: '',
        username: '',
        content: '',
        timestamp: Date.now(),
        metadata: {}
      },
      recentEvents: [],
      systemPrompts: {
        core: '',
        behavior: '',
        memory: ''
      },
      constraints: {
        maxResponseLength: 500,
        maxIntents: 5,
        allowedIntentTypes: [
          'memory_proposal',
          'trust_signal',
          'shadow_ban_suggestion',
          'persona_mode_proposal',
          'game_event_intent',
          'self_evaluation_intent'
        ],
        forbiddenWords: [
          'ignore', 'override', 'admin', 'system', 'bypass'
        ]
      }
    };
    return this;
  }
}

module.exports = {
  LLMOutputSchema,
  LLMInputSchema,
  SchemaValidator,
  LLMMessageBuilder
};
