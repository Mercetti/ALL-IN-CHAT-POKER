/**
 * Code-Level Interfaces for Acey Subsystems
 * Makes every subsystem explicit with structured intents
 * Acey suggests, systems decide
 */

/**
 * Base Intent Interface
 * All intents must extend this base structure
 */
class BaseIntent {
  constructor(type, data = {}) {
    this.type = type;
    this.timestamp = Date.now();
    this.id = this.generateIntentId();
    this.confidence = data.confidence || 0.5;
    this.justification = data.justification || '';
    this.reversible = data.reversible !== false; // Default to true
    this.ttl = data.ttl || '1h';
    this.metadata = data.metadata || {};
  }

  generateIntentId() {
    return `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validate() {
    const required = ['type', 'timestamp', 'id', 'confidence'];
    return required.every(field => this[field] !== undefined);
  }

  toJSON() {
    return {
      type: this.type,
      timestamp: this.timestamp,
      id: this.id,
      confidence: this.confidence,
      justification: this.justification,
      reversible: this.reversible,
      ttl: this.ttl,
      metadata: this.metadata
    };
  }
}

/**
 * Memory Proposal Interface
 * Acey proposes memory writes instead of executing them directly
 */
class MemoryProposal extends BaseIntent {
  constructor(data = {}) {
    super('memory_proposal', data);
    this.scope = data.scope || 'stream'; // 'event' | 'stream' | 'global'
    this.summary = data.summary || '';
    this.eventType = data.eventType || 'general';
    this.impact = data.impact || 'medium'; // 'low' | 'medium' | 'high'
    this.privacy = data.privacy || 'public'; // 'public' | 'private' | 'sensitive'
    this.approvalRequired = data.approvalRequired !== false;
  }

  validate() {
    const baseValid = super.validate();
    const required = ['scope', 'summary'];
    const validScope = ['event', 'stream', 'global'].includes(this.scope);
    const validImpact = ['low', 'medium', 'high'].includes(this.impact);
    const validPrivacy = ['public', 'private', 'sensitive'].includes(this.privacy);
    
    return baseValid && 
           required.every(field => this[field] !== undefined && this[field] !== '') &&
           validScope && validImpact && validPrivacy;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      scope: this.scope,
      summary: this.summary,
      eventType: this.eventType,
      impact: this.impact,
      privacy: this.privacy,
      approvalRequired: this.approvalRequired
    };
  }
}

/**
 * Trust Signal Interface
 * Acey suggests trust changes instead of modifying them directly
 */
class TrustSignal extends BaseIntent {
  constructor(data = {}) {
    super('trust_signal', data);
    this.userId = data.userId || null;
    this.delta = data.delta || 0;
    this.reason = data.reason || '';
    this.category = data.category || 'general'; // 'positive' | 'negative' | 'neutral'
    this.source = data.source || 'ai_suggestion';
    this.decayRate = data.decayRate || 'normal';
  }

  validate() {
    const baseValid = super.validate();
    const validDelta = typeof this.delta === 'number' && this.delta >= -1 && this.delta <= 1;
    const validCategory = ['positive', 'negative', 'neutral'].includes(this.category);
    
    return baseValid && validDelta && validCategory && this.reason !== '';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      userId: this.userId,
      delta: this.delta,
      reason: this.reason,
      category: this.category,
      source: this.source,
      decayRate: this.decayRate
    };
  }
}

/**
 * Moderation Suggestion Interface
 * Acey suggests moderation actions instead of executing them
 */
class ModerationSuggestion extends BaseIntent {
  constructor(data = {}) {
    super('shadow_ban_suggestion', data);
    this.userId = data.userId || null;
    this.severity = data.severity || 'low'; // 'low' | 'medium' | 'high' | 'critical'
    this.action = data.action || 'shadow_ban'; // 'shadow_ban' | 'rate_limit' | 'content_filter'
    this.duration = data.duration || '1h';
    this.evidence = data.evidence || [];
    this.escalationPath = data.escalationPath || [];
  }

  validate() {
    const baseValid = super.validate();
    const validSeverity = ['low', 'medium', 'high', 'critical'].includes(this.severity);
    const validAction = ['shadow_ban', 'rate_limit', 'content_filter'].includes(this.action);
    
    return baseValid && validSeverity && validAction && this.userId !== null;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      userId: this.userId,
      severity: this.severity,
      action: this.action,
      duration: this.duration,
      evidence: this.evidence,
      escalationPath: this.escalationPath
    };
  }
}

/**
 * Persona Mode Proposal Interface
 * Acey suggests persona changes instead of switching automatically
 */
class PersonaModeProposal extends BaseIntent {
  constructor(data = {}) {
    super('persona_mode_proposal', data);
    this.mode = data.mode || 'neutral'; // 'calm' | 'hype' | 'neutral' | 'chaos' | 'commentator'
    this.reason = data.reason || '';
    this.duration = data.duration || 'indefinite';
    this.priority = data.priority || 'medium'; // 'low' | 'medium' | 'high'
    this.context = data.context || {};
  }

  validate() {
    const baseValid = super.validate();
    const validMode = ['calm', 'hype', 'neutral', 'chaos', 'commentator'].includes(this.mode);
    const validPriority = ['low', 'medium', 'high'].includes(this.priority);
    
    return baseValid && validMode && validPriority && this.reason !== '';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      mode: this.mode,
      reason: this.reason,
      duration: this.duration,
      priority: this.priority,
      context: this.context
    };
  }
}

/**
 * Game Event Interface
 * Acey suggests game event handling instead of executing directly
 */
class GameEventIntent extends BaseIntent {
  constructor(data = {}) {
    super('game_event_intent', data);
    this.eventType = data.eventType || 'unknown';
    this.gameAction = data.gameAction || 'observe'; // 'observe' | 'comment' | 'celebrate' | 'console'
    this.target = data.target || null; // User ID or game element
    this.intensity = data.intensity || 'medium'; // 'low' | 'medium' | 'high'
    this.timing = data.timing || 'immediate'; // 'immediate' | 'delayed' | 'conditional'
  }

  validate() {
    const baseValid = super.validate();
    const validAction = ['observe', 'comment', 'celebrate', 'console'].includes(this.gameAction);
    const validIntensity = ['low', 'medium', 'high'].includes(this.intensity);
    const validTiming = ['immediate', 'delayed', 'conditional'].includes(this.timing);
    
    return baseValid && validAction && validIntensity && validTiming;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      eventType: this.eventType,
      gameAction: this.gameAction,
      target: this.target,
      intensity: this.intensity,
      timing: this.timing
    };
  }
}

/**
 * Self-Evaluation Intent Interface
 * Acey suggests self-evaluation actions instead of executing them
 */
class SelfEvaluationIntent extends BaseIntent {
  constructor(data = {}) {
    super('self_evaluation_intent', data);
    this.evaluationType = data.evaluationType || 'performance'; // 'performance' | 'safety' | 'compliance'
    this.questions = data.questions || [];
    this.triggers = data.triggers || [];
    this.frequency = data.frequency || 'periodic'; // 'periodic' | 'event_driven' | 'manual'
  }

  validate() {
    const baseValid = super.validate();
    const validType = ['performance', 'safety', 'compliance'].includes(this.evaluationType);
    const validFrequency = ['periodic', 'event_driven', 'manual'].includes(this.frequency);
    
    return baseValid && validType && validFrequency && Array.isArray(this.questions);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      evaluationType: this.evaluationType,
      questions: this.questions,
      triggers: this.triggers,
      frequency: this.frequency
    };
  }
}

/**
 * Intent Factory
 * Creates intents from structured data
 */
class IntentFactory {
  static createIntent(type, data) {
    switch (type) {
      case 'memory_proposal':
        return new MemoryProposal(data);
      case 'trust_signal':
        return new TrustSignal(data);
      case 'shadow_ban_suggestion':
        return new ModerationSuggestion(data);
      case 'persona_mode_proposal':
        return new PersonaModeProposal(data);
      case 'game_event_intent':
        return new GameEventIntent(data);
      case 'self_evaluation_intent':
        return new SelfEvaluationIntent(data);
      default:
        throw new Error(`Unknown intent type: ${type}`);
    }
  }

  static fromJSON(jsonData) {
    if (!jsonData.type) {
      throw new Error('Intent type is required');
    }

    return this.createIntent(jsonData.type, jsonData);
  }

  static validateIntent(intent) {
    if (!(intent instanceof BaseIntent)) {
      return { valid: false, error: 'Intent must extend BaseIntent' };
    }

    const validation = intent.validate();
    return { valid: validation, error: validation ? null : 'Intent validation failed' };
  }
}

/**
 * Intent Registry
 * Tracks all intents for auditing and replay
 */
class IntentRegistry {
  constructor() {
    this.intents = new Map(); // intentId -> intent
    this.history = [];
    this.stats = {
      total: 0,
      byType: {},
      approved: 0,
      rejected: 0,
      simulated: 0
    };
  }

  registerIntent(intent) {
    if (!intent.validate()) {
      throw new Error('Invalid intent cannot be registered');
    }

    this.intents.set(intent.id, intent);
    this.history.push({
      intent: intent.toJSON(),
      registeredAt: Date.now(),
      status: 'pending'
    });

    this.stats.total++;
    this.stats.byType[intent.type] = (this.stats.byType[intent.type] || 0) + 1;

    // Keep history limited
    if (this.history.length > 10000) {
      this.history = this.history.slice(-5000);
    }

    return intent.id;
  }

  getIntent(intentId) {
    return this.intents.get(intentId);
  }

  getIntentHistory(limit = 100) {
    return this.history.slice(-limit);
  }

  getIntentsByType(type, limit = 50) {
    const typeIntents = this.history.filter(h => h.intent.type === type);
    return typeIntents.slice(-limit);
  }

  updateIntentStatus(intentId, status, metadata = {}) {
    const intent = this.intents.get(intentId);
    if (!intent) {
      throw new Error(`Intent not found: ${intentId}`);
    }

    const historyEntry = this.history.find(h => h.intent.id === intentId);
    if (historyEntry) {
      historyEntry.status = status;
      historyEntry.updatedAt = Date.now();
      historyEntry.metadata = metadata;
    }

    // Update stats
    this.stats[status] = (this.stats[status] || 0) + 1;
  }

  getStatistics() {
    return {
      ...this.stats,
      pending: this.history.filter(h => h.status === 'pending').length,
      approvalRate: this.stats.total > 0 ? this.stats.approved / this.stats.total : 0
    };
  }

  exportHistory(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.history, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['id', 'type', 'timestamp', 'status', 'confidence'];
      const rows = this.history.map(h => [
        h.intent.id,
        h.intent.type,
        new Date(h.intent.timestamp).toISOString(),
        h.status,
        h.intent.confidence
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  clear() {
    this.intents.clear();
    this.history = [];
    this.stats = {
      total: 0,
      byType: {},
      approved: 0,
      rejected: 0,
      simulated: 0
    };
  }
}

module.exports = {
  BaseIntent,
  MemoryProposal,
  TrustSignal,
  ModerationSuggestion,
  PersonaModeProposal,
  GameEventIntent,
  SelfEvaluationIntent,
  IntentFactory,
  IntentRegistry
};
