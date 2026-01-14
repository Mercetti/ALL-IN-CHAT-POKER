// File: src/server/utils/memoryCorruptionDetection.ts

/**
 * Memory Corruption Detection System
 * Acey detects when stored memory becomes unreliable over time
 */

export type MemoryHealth = {
  memoryId: string;
  contradictionRate: number;
  usageFailureRate: number;
  ageDecay: number;
  provenanceWeakness: number;
  corruptionScore: number; // 0–1
  lastAssessed: number;
  quarantineStatus: 'healthy' | 'decayed' | 'quarantined';
  assessmentHistory: Array<{
    timestamp: number;
    score: number;
    reason: string;
  }>;
};

export type MemoryProvenance = {
  source: 'user_input' | 'model_output' | 'fine_tune' | 'imported';
  confidence: number;
  timestamp: number;
  validationLevel: 'none' | 'basic' | 'thorough' | 'verified';
  chainOfTrust: string[];
};

export type CorruptionDetectionConfig = {
  healthyThreshold: number;
  decayThreshold: number;
  quarantineThreshold: number;
  assessmentIntervalMs: number;
  maxHistoryEntries: number;
  enableAutoQuarantine: boolean;
};

/**
 * Memory Corruption Detector
 */
export class MemoryCorruptionDetector {
  private config: CorruptionDetectionConfig;
  private memoryHealth: Map<string, MemoryHealth> = new Map();
  private memoryProvenance: Map<string, MemoryProvenance> = new Map();
  private assessmentTimer: NodeJS.Timeout | null = null;
  private corruptionStats: {
    totalAssessments: number;
    quarantinedMemories: number;
    avgCorruptionScore: number;
    contradictionRate: number;
    ageDecayRate: number;
  } = {
    totalAssessments: 0,
    quarantinedMemories: 0,
    avgCorruptionScore: 0,
    contradictionRate: 0,
    ageDecayRate: 0
  };

  constructor(config?: Partial<CorruptionDetectionConfig>) {
    this.config = {
      healthyThreshold: 0.4,
      decayThreshold: 0.7,
      quarantineThreshold: 0.7,
      assessmentIntervalMs: 60000, // 1 minute
      maxHistoryEntries: 50,
      enableAutoQuarantine: true,
      ...config
    };

    this.startPeriodicAssessment();
  }

  /**
   * Register a memory for corruption monitoring
   */
  public registerMemory(
    memoryId: string,
    content: any,
    provenance: MemoryProvenance
  ): void {
    // Store provenance
    this.memoryProvenance.set(memoryId, provenance);

    // Initialize health assessment
    const initialHealth: MemoryHealth = {
      memoryId,
      contradictionRate: 0,
      usageFailureRate: 0,
      ageDecay: 0,
      provenanceWeakness: this.calculateProvenanceWeakness(provenance),
      corruptionScore: 0,
      lastAssessed: Date.now(),
      quarantineStatus: 'healthy',
      assessmentHistory: [{
        timestamp: Date.now(),
        score: 0,
        reason: 'Initial registration'
      }]
    };

    this.memoryHealth.set(memoryId, initialHealth);
    console.log(`[MemoryCorruption] Registered memory ${memoryId} for monitoring`);
  }

  /**
   * Assess memory health and detect corruption
   */
  public async assessMemoryHealth(memoryId: string, currentContext?: any): Promise<MemoryHealth> {
    const health = this.memoryHealth.get(memoryId);
    const provenance = this.memoryProvenance.get(memoryId);

    if (!health || !provenance) {
      throw new Error(`Memory ${memoryId} not registered for monitoring`);
    }

    console.log(`[MemoryCorruption] Assessing health for memory ${memoryId}`);

    // Calculate individual health metrics
    const contradictionRate = await this.detectContradictions(memoryId, currentContext);
    const usageFailureRate = this.calculateUsageFailureRate(memoryId);
    const ageDecay = this.calculateAgeDecay(memoryId, provenance);
    const provenanceWeakness = this.calculateProvenanceWeakness(provenance);

    // Calculate overall corruption score
    const corruptionScore = this.calculateCorruptionScore(
      contradictionRate,
      usageFailureRate,
      ageDecay,
      provenanceWeakness
    );

    // Determine quarantine status
    const quarantineStatus = this.determineQuarantineStatus(corruptionScore);

    // Update health record
    const updatedHealth: MemoryHealth = {
      ...health,
      contradictionRate,
      usageFailureRate,
      ageDecay,
      provenanceWeakness,
      corruptionScore,
      lastAssessed: Date.now(),
      quarantineStatus,
      assessmentHistory: [
        ...health.assessmentHistory.slice(-this.config.maxHistoryEntries + 1),
        {
          timestamp: Date.now(),
          score: corruptionScore,
          reason: this.getAssessmentReason(corruptionScore, quarantineStatus)
        }
      ]
    };

    this.memoryHealth.set(memoryId, updatedHealth);
    this.updateStats(updatedHealth);

    // Auto-quarantine if enabled and threshold exceeded
    if (this.config.enableAutoQuarantine && quarantineStatus === 'quarantined') {
      await this.quarantineMemory(memoryId, 'Auto-quarantine due to high corruption score');
    }

    console.log(`[MemoryCorruption] Assessment complete: score=${corruptionScore.toFixed(3)}, status=${quarantineStatus}`);

    return updatedHealth;
  }

  /**
   * Detect contradictions in memory
   */
  private async detectContradictions(memoryId: string, currentContext?: any): Promise<number> {
    const health = this.memoryHealth.get(memoryId);
    if (!health) return 0;

    // In a real implementation, this would:
    // 1. Compare memory content with current context
    // 2. Check for logical inconsistencies
    // 3. Verify against external knowledge bases
    // 4. Cross-reference with related memories

    // For now, simulate contradiction detection
    const contradictions = [
      this.checkTemporalConsistency(memoryId),
      this.checkLogicalConsistency(memoryId),
      this.checkFactualConsistency(memoryId, currentContext)
    ];

    const contradictionCount = contradictions.filter(c => c).length;
    return Math.min(1.0, contradictionCount / contradictions.length);
  }

  /**
   * Check temporal consistency
   */
  private checkTemporalConsistency(memoryId: string): boolean {
    const provenance = this.memoryProvenance.get(memoryId);
    if (!provenance) return false;

    const age = Date.now() - provenance.timestamp;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Old memories may have temporal issues
    return age > maxAge;
  }

  /**
   * Check logical consistency
   */
  private checkLogicalConsistency(memoryId: string): boolean {
    const health = this.memoryHealth.get(memoryId);
    if (!health) return false;

    // Check if usage failures indicate logical issues
    return health.usageFailureRate > 0.5;
  }

  /**
   * Check factual consistency
   */
  private checkFactualConsistency(memoryId: string, currentContext?: any): boolean {
    // In a real implementation, this would verify facts against external sources
    // For now, simulate based on provenance confidence
    const provenance = this.memoryProvenance.get(memoryId);
    return provenance ? provenance.confidence < 0.7 : false;
  }

  /**
   * Calculate usage failure rate
   */
  private calculateUsageFailureRate(memoryId: string): number {
    const health = this.memoryHealth.get(memoryId);
    if (!health) return 0;

    // In a real implementation, this would track actual usage failures
    // For now, simulate based on age and previous failures
    const failureCount = health.assessmentHistory.filter(h => h.score > 0.5).length;
    return Math.min(1.0, failureCount / Math.max(1, health.assessmentHistory.length));
  }

  /**
   * Calculate age decay
   */
  private calculateAgeDecay(memoryId: string, provenance: MemoryProvenance): number {
    const age = Date.now() - provenance.timestamp;
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days

    // Linear decay based on age
    return Math.min(1.0, age / maxAge);
  }

  /**
   * Calculate provenance weakness
   */
  private calculateProvenanceWeakness(provenance: MemoryProvenance): number {
    let weakness = 0;

    // Source reliability
    const sourceWeights = {
      'verified': 0,
      'thorough': 0.1,
      'basic': 0.3,
      'none': 0.6
    };
    weakness += sourceWeights[provenance.validationLevel] || 0.5;

    // Confidence level
    weakness += (1 - provenance.confidence) * 0.3;

    // Chain of trust length
    weakness += Math.min(0.3, provenance.chainOfTrust.length * 0.05);

    return Math.min(1.0, weakness);
  }

  /**
   * Calculate overall corruption score
   */
  private calculateCorruptionScore(
    contradictionRate: number,
    usageFailureRate: number,
    ageDecay: number,
    provenanceWeakness: number
  ): number {
    // Weighted combination of factors
    const weights = {
      contradiction: 0.4,
      usageFailure: 0.2,
      age: 0.2,
      provenance: 0.2
    };

    return Math.min(1.0,
      contradictionRate * weights.contradiction +
      usageFailureRate * weights.usageFailure +
      ageDecay * weights.age +
      provenanceWeakness * weights.provenance
    );
  }

  /**
   * Determine quarantine status
   */
  private determineQuarantineStatus(corruptionScore: number): MemoryHealth['quarantineStatus'] {
    if (corruptionScore >= this.config.quarantineThreshold) {
      return 'quarantined';
    } else if (corruptionScore >= this.config.decayThreshold) {
      return 'decayed';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get assessment reason
   */
  private getAssessmentReason(score: number, status: MemoryHealth['quarantineStatus']): string {
    if (status === 'quarantined') {
      return `High corruption score (${score.toFixed(3)}) exceeds quarantine threshold`;
    } else if (status === 'decayed') {
      return `Moderate corruption score (${score.toFixed(3)}) indicates decay`;
    } else {
      return `Low corruption score (${score.toFixed(3)}) indicates healthy memory`;
    }
  }

  /**
   * Quarantine a memory
   */
  public async quarantineMemory(memoryId: string, reason: string): Promise<void> {
    const health = this.memoryHealth.get(memoryId);
    if (!health) return;

    health.quarantineStatus = 'quarantined';
    health.assessmentHistory.push({
      timestamp: Date.now(),
      score: health.corruptionScore,
      reason: `Quarantined: ${reason}`
    });

    this.corruptionStats.quarantinedMemories++;
    console.log(`[MemoryCorruption] Quarantined memory ${memoryId}: ${reason}`);
  }

  /**
   * Get memory health status
   */
  public getMemoryHealth(memoryId: string): MemoryHealth | null {
    return this.memoryHealth.get(memoryId) || null;
  }

  /**
   * Get all memories by quarantine status
   */
  public getMemoriesByStatus(status: MemoryHealth['quarantineStatus']): MemoryHealth[] {
    return Array.from(this.memoryHealth.values())
      .filter(health => health.quarantineStatus === status);
  }

  /**
   * Get corruption statistics
   */
  public getCorruptionStatistics(): typeof this.corruptionStats & {
    healthyCount: number;
    decayedCount: number;
    quarantinedCount: number;
    avgAge: number;
  } {
    const allHealth = Array.from(this.memoryHealth.values());
    
    const healthyCount = allHealth.filter(h => h.quarantineStatus === 'healthy').length;
    const decayedCount = allHealth.filter(h => h.quarantineStatus === 'decayed').length;
    const quarantinedCount = allHealth.filter(h => h.quarantineStatus === 'quarantined').length;

    const avgAge = allHealth.length > 0
      ? allHealth.reduce((sum, h) => {
          const provenance = this.memoryProvenance.get(h.memoryId);
          return sum + (provenance ? Date.now() - provenance.timestamp : 0);
        }, 0) / allHealth.length
      : 0;

    return {
      ...this.corruptionStats,
      healthyCount,
      decayedCount,
      quarantinedCount,
      avgAge
    };
  }

  /**
   * Start periodic assessment
   */
  private startPeriodicAssessment(): void {
    this.assessmentTimer = setInterval(async () => {
      await this.performPeriodicAssessment();
    }, this.config.assessmentIntervalMs);
  }

  /**
   * Perform periodic assessment of all memories
   */
  private async performPeriodicAssessment(): Promise<void> {
    const memoryIds = Array.from(this.memoryHealth.keys());
    
    for (const memoryId of memoryIds) {
      try {
        await this.assessMemoryHealth(memoryId);
      } catch (error) {
        console.error(`[MemoryCorruption] Failed to assess memory ${memoryId}:`, error);
      }
    }
  }

  /**
   * Update statistics
   */
  private updateStats(health: MemoryHealth): void {
    this.corruptionStats.totalAssessments++;
    
    const totalScore = this.corruptionStats.avgCorruptionScore * (this.corruptionStats.totalAssessments - 1) + health.corruptionScore;
    this.corruptionStats.avgCorruptionScore = totalScore / this.corruptionStats.totalAssessments;

    this.corruptionStats.contradictionRate = (this.corruptionStats.contradictionRate * (this.corruptionStats.totalAssessments - 1) + health.contradictionRate) / this.corruptionStats.totalAssessments;
    this.corruptionStats.ageDecayRate = (this.corruptionStats.ageDecayRate * (this.corruptionStats.totalAssessments - 1) + health.ageDecay) / this.corruptionStats.totalAssessments;
  }

  /**
   * Stop periodic assessment
   */
  public stopPeriodicAssessment(): void {
    if (this.assessmentTimer) {
      clearInterval(this.assessmentTimer);
      this.assessmentTimer = null;
    }
  }

  /**
   * Remove memory from monitoring
   */
  public removeMemory(memoryId: string): boolean {
    const removed = this.memoryHealth.delete(memoryId);
    this.memoryProvenance.delete(memoryId);
    return removed;
  }

  /**
   * Clear all monitoring data
   */
  public clearAll(): void {
    this.memoryHealth.clear();
    this.memoryProvenance.clear();
    this.corruptionStats = {
      totalAssessments: 0,
      quarantinedMemories: 0,
      avgCorruptionScore: 0,
      contradictionRate: 0,
      ageDecayRate: 0
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CorruptionDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timer if interval changed
    if (newConfig.assessmentIntervalMs && this.assessmentTimer) {
      this.stopPeriodicAssessment();
      this.startPeriodicAssessment();
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopPeriodicAssessment();
    this.clearAll();
  }
}

// LLM Rule Integration
export const MEMORY_CORRUPTION_RULES = {
  CONTINUOUS_REASSESS: 'Continuously reassess stored memories',
  NEVER_TRUST_BLINDLY: 'Never trust memory blindly',
  PREFER_RECENT: 'Prefer recent, corroborated, high-provenance data',
  QUARANTINE_RULES: {
    HEALTHY: 'score < 0.4 → healthy',
    DECAY: 'score 0.4–0.7 → decay trust',
    QUARANTINE: 'score > 0.7 → quarantine memory'
  },
  QUARANTINE_EFFECTS: [
    'Excluded from training',
    'Excluded from reasoning',
    'Still preserved for audit'
  ]
};
