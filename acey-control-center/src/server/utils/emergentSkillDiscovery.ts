// File: src/server/utils/emergentSkillDiscovery.ts

/**
 * Emergent Skill Discovery System
 * Acey discovers new skills on her own by observing repeated success patterns
 */

export type SkillCandidate = {
  patternSignature: string;
  successRate: number;
  reuseCount: number;
  domains: string[];
  firstSeen: number;
  lastSeen: number;
  contextExamples: Array<{
    timestamp: number;
    context: any;
    outcome: 'success' | 'failure';
    confidence: number;
  }>;
};

export type EmergentSkill = {
  skillId: string;
  description: string;
  originatingPatterns: string[];
  confidence: number;
  discoveredAt: number;
  usageCount: number;
  successRate: number;
  domains: string[];
  executionTemplate: string;
  validationRules: string[];
  lastUsed: number;
};

export type SkillDiscoveryConfig = {
  minReuseCount: number;
  minSuccessRate: number;
  promotionThreshold: number;
  maxPatternHistory: number;
  skillRetentionDays: number;
  enableAutoPromotion: boolean;
  domainExtractionEnabled: boolean;
};

/**
 * Emergent Skill Discovery Manager
 */
export class EmergentSkillDiscoveryManager {
  private config: SkillDiscoveryConfig;
  private skillCandidates: Map<string, SkillCandidate> = new Map();
  private emergentSkills: Map<string, EmergentSkill> = new Map();
  private patternHistory: Array<{
    timestamp: number;
    pattern: string;
    outcome: 'success' | 'failure';
    context: any;
    confidence: number;
  }> = [];
  private discoveryStats: {
    totalPatterns: number;
    promotedSkills: number;
    avgSkillSuccessRate: number;
    domainDistribution: Record<string, number>;
    skillRetentionRate: number;
  } = {
    totalPatterns: 0,
    promotedSkills: 0,
    avgSkillSuccessRate: 0,
    domainDistribution: {},
    skillRetentionRate: 0
  };

  constructor(config?: Partial<SkillDiscoveryConfig>) {
    this.config = {
      minReuseCount: 10,
      minSuccessRate: 0.8,
      promotionThreshold: 0.85,
      maxPatternHistory: 10000,
      skillRetentionDays: 30,
      enableAutoPromotion: true,
      domainExtractionEnabled: true,
      ...config
    };

    // Start periodic cleanup and evaluation
    this.startPeriodicTasks();
  }

  /**
   * Record a pattern execution for skill discovery
   */
  public recordPatternExecution(
    pattern: string,
    context: any,
    outcome: 'success' | 'failure',
    confidence: number = 0.8
  ): void {
    const timestamp = Date.now();
    
    // Add to pattern history
    this.patternHistory.push({
      timestamp,
      pattern,
      outcome,
      context,
      confidence
    });

    // Limit history size
    if (this.patternHistory.length > this.config.maxPatternHistory) {
      this.patternHistory = this.patternHistory.slice(-this.config.maxPatternHistory);
    }

    // Update or create skill candidate
    this.updateSkillCandidate(pattern, context, outcome, confidence, timestamp);

    // Check for skill promotion
    if (this.config.enableAutoPromotion) {
      this.checkForSkillPromotion(pattern);
    }

    this.discoveryStats.totalPatterns = this.patternHistory.length;
  }

  /**
   * Update or create skill candidate
   */
  private updateSkillCandidate(
    pattern: string,
    context: any,
    outcome: 'success' | 'failure',
    confidence: number,
    timestamp: number
  ): void {
    let candidate = this.skillCandidates.get(pattern);

    if (!candidate) {
      // Create new candidate
      candidate = {
        patternSignature: pattern,
        successRate: outcome === 'success' ? 1.0 : 0.0,
        reuseCount: 1,
        domains: this.extractDomains(context),
        firstSeen: timestamp,
        lastSeen: timestamp,
        contextExamples: [{
          timestamp,
          context,
          outcome,
          confidence
        }]
      };
    } else {
      // Update existing candidate
      const examples = candidate.contextExamples.slice(-50); // Keep last 50 examples
      examples.push({
        timestamp,
        context,
        outcome,
        confidence
      });

      const successCount = examples.filter(e => e.outcome === 'success').length;
      const newSuccessRate = successCount / examples.length;

      candidate = {
        ...candidate,
        successRate: newSuccessRate,
        reuseCount: candidate.reuseCount + 1,
        lastSeen: timestamp,
        contextExamples: examples,
        domains: this.mergeDomains(candidate.domains, this.extractDomains(context))
      };
    }

    this.skillCandidates.set(pattern, candidate);
  }

  /**
   * Extract domains from context
   */
  private extractDomains(context: any): string[] {
    if (!this.config.domainExtractionEnabled) {
      return ['general'];
    }

    const domains: string[] = [];

    // Extract from context type
    if (context.taskType) {
      domains.push(context.taskType);
    }

    // Extract from context properties
    if (context.domain) {
      domains.push(context.domain);
    }

    // Extract from content analysis
    const content = JSON.stringify(context).toLowerCase();
    const domainKeywords = {
      'audio': ['audio', 'sound', 'music', 'speech', 'voice'],
      'coding': ['code', 'function', 'class', 'method', 'algorithm'],
      'graphics': ['image', 'visual', 'graphic', 'design', 'art'],
      'data': ['data', 'database', 'storage', 'query', 'analysis'],
      'ui': ['interface', 'user', 'ui', 'ux', 'display'],
      'security': ['security', 'auth', 'permission', 'access', 'protect'],
      'performance': ['performance', 'speed', 'optimize', 'efficient'],
      'testing': ['test', 'validate', 'verify', 'check', 'assert']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        domains.push(domain);
      }
    }

    return domains.length > 0 ? domains : ['general'];
  }

  /**
   * Merge domain arrays
   */
  private mergeDomains(existing: string[], newDomains: string[]): string[] {
    const merged = new Set([...existing, ...newDomains]);
    return Array.from(merged);
  }

  /**
   * Check if pattern should be promoted to skill
   */
  private checkForSkillPromotion(pattern: string): void {
    const candidate = this.skillCandidates.get(pattern);
    if (!candidate) return;

    const meetsReuseThreshold = candidate.reuseCount >= this.config.minReuseCount;
    const meetsSuccessThreshold = candidate.successRate >= this.config.minSuccessRate;
    const meetsOverallThreshold = candidate.successRate >= this.config.promotionThreshold;

    if (meetsReuseThreshold && meetsSuccessThreshold && meetsOverallThreshold) {
      this.promoteToSkill(candidate);
    }
  }

  /**
   * Promote pattern to emergent skill
   */
  private promoteToSkill(candidate: SkillCandidate): void {
    const skillId = this.generateSkillId(candidate.patternSignature);
    
    // Check if skill already exists
    if (this.emergentSkills.has(skillId)) {
      return;
    }

    const skill: EmergentSkill = {
      skillId,
      description: this.generateSkillDescription(candidate),
      originatingPatterns: [candidate.patternSignature],
      confidence: candidate.successRate,
      discoveredAt: Date.now(),
      usageCount: candidate.reuseCount,
      successRate: candidate.successRate,
      domains: candidate.domains,
      executionTemplate: this.generateExecutionTemplate(candidate),
      validationRules: this.generateValidationRules(candidate),
      lastUsed: candidate.lastSeen
    };

    this.emergentSkills.set(skillId, skill);
    this.discoveryStats.promotedSkills++;
    
    console.log(`[SkillDiscovery] Promoted pattern to skill: ${skillId} (confidence: ${skill.confidence.toFixed(2)})`);
  }

  /**
   * Generate skill ID from pattern
   */
  private generateSkillId(pattern: string): string {
    // Create a hash-like ID from pattern
    const hash = pattern.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `skill_${hash}_${Date.now()}`;
  }

  /**
   * Generate skill description
   */
  private generateSkillDescription(candidate: SkillCandidate): string {
    const domains = candidate.domains.join(', ');
    const successRate = (candidate.successRate * 100).toFixed(1);
    
    return `Emergent skill for ${domains} domains with ${successRate}% success rate. Pattern: ${candidate.patternSignature.substring(0, 100)}...`;
  }

  /**
   * Generate execution template
   */
  private generateExecutionTemplate(candidate: SkillCandidate): string {
    // Extract template from successful examples
    const successfulExamples = candidate.contextExamples.filter(e => e.outcome === 'success');
    if (successfulExamples.length === 0) {
      return candidate.patternSignature;
    }

    // Use the most recent successful example as template
    const latestSuccess = successfulExamples[successfulExamples.length - 1];
    return JSON.stringify(latestSuccess.context, null, 2);
  }

  /**
   * Generate validation rules
   */
  private generateValidationRules(candidate: SkillCandidate): string[] {
    const rules: string[] = [];

    // Add domain-specific rules
    if (candidate.domains.includes('coding')) {
      rules.push('Code must be syntactically valid');
      rules.push('No security vulnerabilities');
    }

    if (candidate.domains.includes('audio')) {
      rules.push('Audio must be playable');
      rules.push('Duration must be reasonable');
    }

    if (candidate.domains.includes('data')) {
      rules.push('Data must be valid');
      rules.push('No privacy violations');
    }

    // Add general rules based on success patterns
    if (candidate.successRate > 0.9) {
      rules.push('High confidence execution required');
    }

    return rules.length > 0 ? rules : ['General validation required'];
  }

  /**
   * Execute an emergent skill
   */
  public async executeSkill(
    skillId: string,
    context: any,
    parameters?: any
  ): Promise<{
    success: boolean;
    result: any;
    confidence: number;
    executionTime: number;
  }> {
    const skill = this.emergentSkills.get(skillId);
    if (!skill) {
      throw new Error(`Skill ${skillId} not found`);
    }

    const startTime = Date.now();
    
    try {
      // Execute skill using template
      const result = await this.executeSkillTemplate(skill, context, parameters);
      
      // Update skill usage
      skill.usageCount++;
      skill.lastUsed = Date.now();

      // Record pattern execution for learning
      this.recordPatternExecution(
        skill.originatingPatterns[0],
        context,
        result.success ? 'success' : 'failure',
        result.confidence
      );

      return {
        ...result,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      console.error(`[SkillDiscovery] Skill execution failed:`, error);
      
      return {
        success: false,
        result: null,
        confidence: 0,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute skill template
   */
  private async executeSkillTemplate(
    skill: EmergentSkill,
    context: any,
    parameters?: any
  ): Promise<{ success: boolean; result: any; confidence: number }> {
    // In a real implementation, this would:
    // 1. Parse the execution template
    // 2. Apply parameters to template
    // 3. Execute the skill logic
    // 4. Validate results against rules
    
    // For now, simulate execution
    const confidence = skill.confidence * (Math.random() * 0.2 + 0.8); // Add some variance
    
    return {
      success: confidence > 0.7,
      result: {
        skillId: skill.skillId,
        executedAt: Date.now(),
        context,
        parameters
      },
      confidence
    };
  }

  /**
   * Get all emergent skills
   */
  public getEmergentSkills(): EmergentSkill[] {
    return Array.from(this.emergentSkills.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get skills by domain
   */
  public getSkillsByDomain(domain: string): EmergentSkill[] {
    return Array.from(this.emergentSkills.values())
      .filter(skill => skill.domains.includes(domain))
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get skill candidates
   */
  public getSkillCandidates(): SkillCandidate[] {
    return Array.from(this.skillCandidates.values())
      .sort((a, b) => b.reuseCount - a.reuseCount);
  }

  /**
   * Get discovery statistics
   */
  public getDiscoveryStatistics(): typeof this.discoveryStats {
    // Update domain distribution
    const domainDistribution: Record<string, number> = {};
    for (const skill of this.emergentSkills.values()) {
      for (const domain of skill.domains) {
        domainDistribution[domain] = (domainDistribution[domain] || 0) + 1;
      }
    }
    this.discoveryStats.domainDistribution = domainDistribution;

    // Update average skill success rate
    if (this.emergentSkills.size > 0) {
      const totalSuccessRate = Array.from(this.emergentSkills.values())
        .reduce((sum, skill) => sum + skill.successRate, 0);
      this.discoveryStats.avgSkillSuccessRate = totalSuccessRate / this.emergentSkills.size;
    }

    return this.discoveryStats;
  }

  /**
   * Start periodic tasks
   */
  private startPeriodicTasks(): void {
    // Cleanup old patterns and skills
    setInterval(() => {
      this.cleanupOldPatterns();
      this.cleanupOldSkills();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Cleanup old patterns
   */
  private cleanupOldPatterns(): void {
    const cutoffTime = Date.now() - (this.config.skillRetentionDays * 24 * 60 * 60 * 1000);
    
    for (const [pattern, candidate] of this.skillCandidates) {
      if (candidate.lastSeen < cutoffTime && candidate.reuseCount < 5) {
        this.skillCandidates.delete(pattern);
      }
    }
  }

  /**
   * Cleanup old skills
   */
  private cleanupOldSkills(): void {
    const cutoffTime = Date.now() - (this.config.skillRetentionDays * 24 * 60 * 60 * 1000);
    
    for (const [skillId, skill] of this.emergentSkills) {
      if (skill.lastUsed < cutoffTime && skill.usageCount < 10) {
        this.emergentSkills.delete(skillId);
      }
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<SkillDiscoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear all data
   */
  public clearAll(): void {
    this.skillCandidates.clear();
    this.emergentSkills.clear();
    this.patternHistory = [];
    this.discoveryStats = {
      totalPatterns: 0,
      promotedSkills: 0,
      avgSkillSuccessRate: 0,
      domainDistribution: {},
      skillRetentionRate: 0
    };
  }
}

// LLM Rule Integration
export const EMERGENT_SKILL_RULES = {
  PROMOTION_RULES: {
    REUSE_COUNT: 'reuseCount ≥ 10',
    SUCCESS_RATE: 'successRate ≥ 0.8',
    PROMOTION: '→ promote to skill'
  },
  SKILL_REGISTRATION: [
    'Stored as callable capability',
    'Added to planning step',
    'Added to eval suites',
    'Logged for human review'
  ],
  DISCOVERY_PRINCIPLE: 'Identify repeated successful reasoning or execution patterns',
  EVIDENCE_BASED: 'Abstract them into reusable skills. Do not assume skills — earn them via evidence'
};
