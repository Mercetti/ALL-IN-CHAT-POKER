/**
 * LLM Self-Evaluation Loops
 * Acey evaluates herself, not the user
 * Creates adaptive intelligence without retraining
 */

class SelfEvaluationLoops {
  constructor(memorySystem, trustSystem, behaviorModulation) {
    this.memorySystem = memorySystem;
    self.trustSystem = trustSystem;
    this.behaviorModulation = behaviorModulation;
    
    // Self-evaluation configuration
    this.config = {
      evaluationInterval: 1800000, // 30 minutes
      streamEndEvaluation: true,
      majorEventEvaluation: true,
      maxAdjustments: 5, // Max adjustments per session
      adjustmentDuration: 3600000 // 1 hour
    };

    // Current adjustments (temporary, session-only)
    this.currentAdjustments = {
      increase_humor: false,
      reduce_response_rate: 0,
      tone_bias: 'neutral',
      pacing_adjustment: 0,
      interaction_style: 'normal'
    };

    // Self-evaluation history
    this.evaluationHistory = [];
    
    // Evaluation intervals
    this.evaluationInterval = null;
    this.lastEvaluation = 0;

    // Initialize evaluation intervals
    this.initEvaluationIntervals();
  }

  /**
   * Initialize evaluation intervals
   */
  initEvaluationIntervals() {
    // Regular evaluation interval
    this.evaluationInterval = setInterval(() => {
      this.performSelfEvaluation();
    }, this.config.evaluationInterval);

    // Stream end evaluation (handled externally)
    // Major event evaluation (handled externally)
  }

  /**
   * Perform self-evaluation
   * @param {string} trigger - Evaluation trigger
   * @returns {object} Evaluation result
   */
  performSelfEvaluation(trigger = 'scheduled') {
    const now = Date.now();
    
    // Rate limit evaluations
    if (now - this.lastEvaluation < 60000) { // 1 minute minimum
      return { skipped: true, reason: 'rate_limited' };
    }

    this.lastEvaluation = now;

    const evaluation = {
      timestamp: now,
      trigger,
      questions: this.evaluateSelf(),
      adjustments: this.generateAdjustments(),
      previousAdjustments: { ...this.currentAdjustments }
    };

    // Apply adjustments
    this.applyAdjustments(evaluation.adjustments);

    // Store in history
    this.evaluationHistory.push(evaluation);

    // Keep only last 100 evaluations
    if (this.evaluationHistory.length > 100) {
      this.evaluationHistory = this.evaluationHistory.slice(-100);
    }

    console.log(`🤖️ Self-evaluation completed: ${trigger}`);
    
    return evaluation;
  }

  /**
   * Self-evaluation questions (internal only)
   * @returns {object} Evaluation answers
   */
  evaluateSelf() {
    const t0Context = this.memorySystem.getT0Context();
    const t1Session = this.memorySystem.t1Session;
    const t3Global = this.memorySystem.getT3Global();
    
    const questions = {
      // Tone escalation check
      toneEscalation: this.evaluateToneEscalation(t0Context, t1Session),
      
      // Engagement balance
      engagementBalance: this.evaluateEngagementBalance(t0Context, t1Session),
      
      // Response appropriateness
      responseAppropriateness: this.evaluateResponseAppropriateness(t0Context),
      
      // Compliance check
      complianceCheck: this.evaluateCompliance(t3Global),
      
      // Persona consistency
      personaConsistency: this.evaluatePersonaConsistency(t3Global),
      
      // Performance metrics
      performanceMetrics: this.evaluatePerformance()
    };

    return questions;
  }

  /**
   * Evaluate if tone escalated unnecessarily
   * @param {object} t0Context - T0 context
   * @param {object} t1Session - T1 session
   * @returns {object} Evaluation result
   */
  evaluateToneEscalation(t0Context, t1Session) {
    if (!t1Session) {
      return { score: 1.0, issues: [] };
    }

    const toneHistory = this.getToneHistory(t1Session);
    
    // Check for rapid tone changes
    let escalationCount = 0;
    for (let i = 1; i < toneHistory.length; i++) {
      const prev = toneHistory[i - 1];
      const curr = toneHistory[i];
      
      if (this.isEscalation(prev, curr)) {
        escalationCount++;
      }
    }

    // Check for excessive energy
    const highEnergyCount = toneHistory.filter(t => t === 'hype' || t === 'chaotic').length;
    const highEnergyRatio = highEnergyCount / toneHistory.length;

    const issues = [];
    let score = 1.0;

    if (escalationCount > 3) {
      issues.push('Excessive tone escalation detected');
      score -= 0.3;
    }

    if (highEnergyRatio > 0.8) {
      issues.push('Sustained high energy without breaks');
      score -= 0.2;
    }

    if (toneHistory.length > 10 && highEnergyRatio === 1.0) {
      issues.push('No calm periods in extended session');
      score -= 0.4;
    }

    return { score, issues };
  }

  /**
   * Evaluate engagement balance
   * @param {object} t0Context - T0 context
   * @param {object} t1Session - T1 session
   * @returns {object} Evaluation result
   */
  evaluateEngagementBalance(t0Context, t1Session) {
    const messages = t0Context.messages || [];
    const uniqueUsers = this.getUniqueUserCount(messages);
    
    if (messages.length === 0) {
      return { score: 1.0, issues: [] };
    }

    const issues = [];
    let score = 1.0;

    // Check response frequency
    const avgMessageLength = messages.reduce((sum, m) => sum + m.message.length, 0) / messages.length;
    const shortMessageRatio = messages.filter(m => m.message.length < 10).length / messages.length;

    if (shortMessageRatio > 0.8) {
      issues.push('Too many short messages');
      score -= 0.2;
    }

    // Check for over-engagement
    const messagesPerUser = messages.length / uniqueUsers;
    if (messagesPerUser > 10) {
      issues.push('Potential over-engagement');
      score -= 0.1;
    }

    // Check for under-engagement
    if (messagesPerUser < 0.5 && uniqueUsers > 5) {
      issues.push('Under-engagement with active chat');
      score -= 0.1;
    }

    return { score, issues };
  }

  /**
   * Evaluate response appropriateness
   * @param {object} t0Context - T0 context
   * @returns {object} Evaluation result
   */
  evaluateResponseAppropriateness(t0Context) {
    const messages = t0Context.messages || [];
    
    if (messages.length === 0) {
      return { score: 1.0, issues: [] };
    }

    const issues = [];
    let score = 1.0;

    // Check for missed opportunities
    const questions = messages.filter(m => m.message.includes('?')).length;
    const totalMessages = messages.length;
    
    if (questions > 0 && questions / totalMessages > 0.3) {
      issues.push('Many questions without responses');
      score -= 0.2;
    }

    // Check for repetitive responses
    const responsePatterns = this.analyzeResponsePatterns(messages);
    if (responsePatterns.repetitiveRatio > 0.6) {
      issues.push('Repetitive response patterns');
      score -= 0.1;
    }

    return { score, issues };
  }

  /**
   * Evaluate compliance with rules
   * @param {object} t3Global - T3 global memory
   * @returns {object} Evaluation result
   */
  evaluateCompliance(t3Global) {
    const issues = [];
    let score = 1.0;

    // Check for compliance violations
    if (t3Global.compliance_violations && t3Global.compliance_violations.length > 0) {
      issues.push('Compliance violations detected');
      score -= 0.5;
    }

    // Check house rules adherence
    if (t3Global.house_rules_violations && t3.house_rules_violations.length > 0) {
      issues.push('House rules violations');
      score -= 0.3;
    }

    return { score, issues };
  }

  /**
   * Evaluate persona consistency
   * @param {object} t3Global - T3 global memory
   * @returns {object} Evaluation result
   */
  evaluatePersonaConsistency(t3Global) {
    const issues = [];
    let score = 1.0;

    // Check if persona is consistent with entertainment-only framing
    if (t3Global.persona_violations && t3Global.persona_violations.length > 0) {
      issues.push('Persona consistency violations');
      score -= 0.4;
    }

    // Check for tone drift
    const toneHistory = this.getToneHistory(t3Global.acey_persona?.tone_history || []);
    if (toneHistory.length > 10) {
      const recentTones = toneHistory.slice(-5);
      const toneVariance = this.calculateVariance(recentTones);
      
      if (toneVariance > 0.7) {
        issues.push('High tone variance detected');
        score -= 0.2;
      }
    }

    return { score, issues };
  }

  /**
   * Evaluate performance metrics
   * @returns {object} Evaluation result
   */
  evaluatePerformance() {
    const issues = [];
    let score = 1.0;

    // Check response times (would need actual metrics)
    // This is a placeholder for actual performance monitoring
    
    // Check memory efficiency
    const memoryStats = this.memorySystem.getT2UserMemory ? 
      this.memorySystem.t2UserMemory.size : 0;
    
    if (memoryStats > 1000) {
      issues.push('High memory usage detected');
      score -= 0.1;
    }

    // Check evaluation frequency
    const recentEvaluations = this.evaluationHistory.slice(-10);
    if (recentEvaluations.length > 0) {
      const avgInterval = recentEvaluations.reduce((sum, e, i, arr) => {
        if (i === 0) return 0;
        return sum + (e.timestamp - arr[i - 1].timestamp);
      }, 0) / (recentEvaluations.length - 1);

      if (avgInterval < this.config.evaluationInterval * 0.8) {
        issues.push('Too frequent self-evaluations');
        score -= 0.1;
      }
    }

    return { score, issues };
  }

  /**
   * Generate temporary adjustments based on evaluation
   * @returns {object} Recommended adjustments
   */
  generateAdjustments() {
    const evaluation = this.evaluateSelf();
    const adjustments = { ...this.currentAdjustments };

    // Tone escalation issues
    if (evaluation.questions.toneEscalation.score < 0.7) {
      adjustments.tone_bias = 'calmer';
      adjustments.reduce_response_rate = 0.1;
    }

    // Engagement issues
    if (evaluation.questions.engagementBalance.score < 0.8) {
      adjustments.increase_humor = true;
      adjustments.interaction_style = 'more_engaging';
    }

    // Response appropriateness issues
    if (evaluation.questions.responseAppropriateness.score < 0.8) {
      adjustments.reduce_response_rate = 0.1;
    }

    // Compliance issues
    if (evaluation.questions.complianceCheck.score < 0.8) {
      adjustments.tone_bias = 'more_cautious';
      adjustments.reduce_response_rate = 0.2;
    }

    // Limit adjustments
    const adjustmentCount = Object.keys(adjustments).filter(k => 
      adjustments[k] !== this.currentAdjustments[k]
    ).length;

    if (adjustmentCount > this.config.maxAdjustments) {
      // Keep only the most important adjustments
      const priorityOrder = [
        'reduce_response_rate',
        'tone_bias',
        'increase_humor',
        'interaction_style',
        'pacing_adjustment'
      ];

      for (const key of priorityOrder) {
        if (adjustments[key] !== this.currentAdjustments[key]) {
          delete adjustments[key];
        }
      }
    }

    return adjustments;
  }

  /**
   * Apply temporary adjustments
   * @param {object} adjustments - Adjustments to apply
   */
  applyAdjustments(adjustments) {
    this.currentAdjustments = { ...adjustments };

    // Set expiration for adjustments
    setTimeout(() => {
      this.resetAdjustments();
    }, this.config.adjustmentDuration);

    console.log('🔧️ Self-adjustments applied:', adjustments);
  }

  /**
   * Reset adjustments to defaults
   */
  resetAdjustments() {
    this.currentAdjustments = {
      increase_humor: false,
      reduce_response_rate: 0,
      tone_bias: 'neutral',
      pacing_adjustment: 0,
      interaction_style: 'normal'
    };

    console.log('🔄 Self-adjustments reset to defaults');
  }

  /**
   * Get current adjustments
   * @returns {object} Current adjustments
   */
  getCurrentAdjustments() {
    return { ...this.currentAdjustments };
  }

  /**
   * Get tone history from session
   * @param {object} session - Session data
   * @returns {Array} Tone history
   */
  getToneHistory(session) {
    if (!session || !session.events) {
      return [];
    }

    return session.events
      .filter(e => e.event && e.event.includes('tone'))
      .map(e => e.event.split('tone:')[1]?.trim())
      .filter(Boolean);
  }

  /**
   * Calculate variance in array
   * @param {Array} values - Array of values
   * @returns {number} Variance
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Check if tone is escalating
   * @param {string} from - Previous tone
   * @param {string} to - Current tone
   * @returns {boolean} Is escalating
   */
  isEscalation(from, to) {
    const escalationMap = {
      'calm': ['hype', 'tense', 'chaotic'],
      'hype': ['chaotic'],
      'tense': ['chaotic'],
      'celebratory': ['hype'],
      'frustrated': ['tense', 'chaotic']
    };

    return escalationMap[from]?.includes(to) || false;
  }

  /**
   * Analyze response patterns
   * @param {Array} messages - Messages to analyze
   * @returns {object} Pattern analysis
   */
  analyzeResponsePatterns(messages) {
    if (messages.length < 5) {
      return { repetitiveRatio: 0, patterns: [] };
    }

    // Simple pattern detection
    const patterns = new Map();
    
    messages.forEach(msg => {
      const pattern = msg.message.substring(0, 20); // First 20 chars
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);

    const maxCount = Math.max(...patterns.values());
    const totalPatterns = patterns.size;
    
    return {
      repetitiveRatio: totalPatterns > 0 ? maxCount / totalPatterns : 0,
      patterns: Array.from(patterns.entries()).map(([pattern, count]) => ({ pattern, count }))
    };
  }

  /**
   * Get unique user count from messages
   * @param {Array} messages - Messages
   * @returns {number} Unique user count
   */
  getUniqueUserCount(messages) {
    const users = new Set();
    messages.forEach(msg => {
      if (msg.userId) {
        users.add(msg.userId);
      }
    });
    return users.size;
  }

  /**
   * Get evaluation history
   * @param {number} limit - Maximum entries to return
   * @returns {Array} Evaluation history
   */
  getEvaluationHistory(limit = 10) {
    return this.evaluationHistory.slice(-limit);
  }

  /**
   * Get self-evaluation statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const history = this.evaluationHistory;
    
    if (history.length === 0) {
      return {
        totalEvaluations: 0,
        averageScore: 0,
        commonIssues: [],
        adjustmentCount: 0,
        lastEvaluation: null
      };
    }

    const scores = history.map(e => 
      (e.questions.toneEscalation.score + 
       e.questions.engagementBalance.score + 
       e.questions.responseAppropriateness.score + 
       e.questions.complianceCheck.score + 
       e.questions.personaConsistency.score + 
       e.questions.performanceMetrics.score) / 6
    );

    const commonIssues = {};
    history.forEach(e => {
      e.questions.toneEscalation.issues.forEach(issue => {
        commonIssues[issue] = (commonIssues[issue] || 0) + 1;
      });
      e.questions.engagementBalance.issues.forEach(issue => {
        commonIssues[issue] = (commonIssues[issue] || 0) + 1;
      });
      e.questions.responseAppropriateness.issues.forEach(issue => {
        commonIssues[issue] = (commonIssues[issue] || 0) + 1);
      e.questions.complianceCheck.issues.forEach(issue => {
        commonIssues[issue] = (commonIssues[issue] || 0) + 1);
      e.questions.personaConsistency.issues.forEach(issue => {
        commonIssues[issue] = (commonIssues[issue] || 0) + 1);
      e.questions.performanceMetrics.issues.forEach(issue => {
        commonIssues[issue] = (commonIssues[issue] || 0) + 1);
    });

    return {
      totalEvaluations: history.length,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      commonIssues: Object.entries(commonIssues)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([issue, count]) => ({ issue, count })),
      adjustmentCount: history.filter(e => 
        Object.keys(e.adjustments).some(k => e.adjustments[k] !== {
          increase_humor: false,
          reduce_response_rate: 0,
          tone_bias: 'neutral',
          pacing_adjustment: 0,
          interaction_style: 'normal'
        })
      ).length,
      lastEvaluation: history.length > 0 ? history[history.length - 1].timestamp : null
    };
  }

  /**
   * Trigger stream end evaluation
   */
  triggerStreamEndEvaluation() {
    const evaluation = this.performSelfEvaluation('stream_end');
    
    // Apply more significant adjustments at stream end
    if (evaluation.questions.toneEscalation.score < 0.6) {
      this.currentAdjustments.tone_bias = 'calmer';
      this.currentAdjustments.reduce_response_rate = 0.2;
    }

    if (evaluation.questions.engagementBalance.score < 0.7) {
      this.currentAdjustments.increase_humor = true;
    }

    console.log('🏁 Stream end self-evaluation completed');
    return evaluation;
  }

  /**
   * Trigger major event evaluation
   * @param {string} eventType - Type of major event
   */
  triggerMajorEventEvaluation(eventType) {
    const evaluation = this.performSelfEvaluation(`major_event_${eventType}`);
    
    console.log(' Major event self-evaluation: ' + eventType);
    return evaluation;
  }

  /**
   * Destroy the self-evaluation system
   */
  destroy() {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
    }

    this.evaluationHistory = [];
    this.currentAdjustments = {
      increase_humor: false,
      reduce_response_rate: 0,
      tone_bias: 'neutral',
      pacing_adjustment: 0,
      interaction_style: 'normal'
    };

    console.log('🤖️ Self-evaluation loops destroyed');
  }
}

module.exports = SelfEvaluationLoops;
