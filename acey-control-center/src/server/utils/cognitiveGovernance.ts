// File: src/server/utils/cognitiveGovernance.ts

/**
 * Cognitive Governance Integration
 * Connects all 4 highest-order intelligence systems into a closed loop
 */

import { MultiAgentDebateManager, DebateResult, DebateConfig } from "./multiAgentDebate";
import { AdversarialSelfCritiqueManager, SelfCritique, CritiqueResult, CritiqueConfig } from "./adversarialSelfCritique";
import { MemoryCorruptionDetector, MemoryHealth, CorruptionDetectionConfig } from "./memoryCorruptionDetection";
import { EmergentSkillDiscoveryManager, EmergentSkill, SkillDiscoveryConfig } from "./emergentSkillDiscovery";

export type CognitiveGovernanceConfig = {
  debate: DebateConfig;
  critique: CritiqueConfig;
  memory: CorruptionDetectionConfig;
  skills: SkillDiscoveryConfig;
  enableFullLoop: boolean;
  safetyFirst: boolean;
  explainabilityRequired: boolean;
  gracefulDegradation: boolean;
};

export type GovernanceResult = {
  taskId: string;
  debateResult?: DebateResult;
  critiqueResult?: CritiqueResult;
  memoryHealth?: MemoryHealth;
  skillsUsed?: EmergentSkill[];
  finalDecision: 'proceed' | 'reject' | 'escalate' | 'block';
  reasoning: string;
  confidence: number;
  governanceTime: number;
  safetyAssessment: 'safe' | 'caution' | 'unsafe' | 'blocked';
};

export type GovernanceMetrics = {
  totalTasks: number;
  avgGovernanceTime: number;
  successRate: number;
  safetyBlockRate: number;
  skillUsageRate: number;
  memoryQuarantineRate: number;
  consensusRate: number;
  critiqueBlockRate: number;
};

/**
 * Cognitive Governance Manager
 * Orchestrates all 4 systems in a closed cognitive loop
 */
export class CognitiveGovernanceManager {
  private debateManager: MultiAgentDebateManager;
  private critiqueManager: AdversarialSelfCritiqueManager;
  private memoryDetector: MemoryCorruptionDetector;
  private skillDiscovery: EmergentSkillDiscoveryManager;
  private config: CognitiveGovernanceConfig;
  private governanceHistory: GovernanceResult[] = [];
  private metrics: GovernanceMetrics;

  constructor(config?: Partial<CognitiveGovernanceConfig>) {
    this.config = {
      debate: {
        minParticipants: 3,
        consensusThreshold: 0.65,
        maxTurnsPerAgent: 3,
        timeoutMs: 30000,
        requireSafetyApproval: true,
        ...config?.debate
      },
      critique: {
        severityThreshold: 0.7,
        autoEscalateThreshold: 0.8,
        maxCritiquesPerOutput: 3,
        critiqueTimeoutMs: 10000,
        enableHostileMode: true,
        learningBlockThreshold: 0.7,
        ...config?.critique
      },
      memory: {
        healthyThreshold: 0.4,
        decayThreshold: 0.7,
        quarantineThreshold: 0.7,
        assessmentIntervalMs: 60000,
        maxHistoryEntries: 50,
        enableAutoQuarantine: true,
        ...config?.memory
      },
      skills: {
        minReuseCount: 10,
        minSuccessRate: 0.8,
        promotionThreshold: 0.85,
        maxPatternHistory: 10000,
        skillRetentionDays: 30,
        enableAutoPromotion: true,
        domainExtractionEnabled: true,
        ...config?.skills
      },
      enableFullLoop: true,
      safetyFirst: true,
      explainabilityRequired: true,
      gracefulDegradation: true,
      ...config
    };

    // Initialize all systems
    this.debateManager = new MultiAgentDebateManager(this.config.debate);
    this.critiqueManager = new AdversarialSelfCritiqueManager(this.config.critique);
    this.memoryDetector = new MemoryCorruptionDetector(this.config.memory);
    this.skillDiscovery = new EmergentSkillDiscoveryManager(this.config.skills);

    this.metrics = {
      totalTasks: 0,
      avgGovernanceTime: 0,
      successRate: 0,
      safetyBlockRate: 0,
      skillUsageRate: 0,
      memoryQuarantineRate: 0,
      consensusRate: 0,
      critiqueBlockRate: 0
    };

    console.log('[CognitiveGovernance] Initialized with full cognitive loop');
  }

  /**
   * Process a task through the complete cognitive governance loop
   */
  public async processTask(
    taskId: string,
    proposal: string,
    context: any,
    impact: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<GovernanceResult> {
    const startTime = Date.now();
    console.log(`[CognitiveGovernance] Processing task ${taskId} with impact: ${impact}`);

    try {
      let result: Partial<GovernanceResult> = {
        taskId,
        finalDecision: 'proceed',
        reasoning: '',
        confidence: 0,
        governanceTime: 0,
        safetyAssessment: 'safe'
      };

      // Step 1: Multi-Agent Debate
      if (this.config.enableFullLoop) {
        result.debateResult = await this.debateManager.conductDebate(context, proposal, impact);
        result.safetyAssessment = result.debateResult.safetyAssessment;
        
        // Safety first - block if safety assessment is unsafe/blocked
        if (this.config.safetyFirst && result.safetyAssessment === 'unsafe') {
          result.finalDecision = 'block';
          result.reasoning = 'Safety assessment blocked execution';
          result.confidence = 0;
        } else if (result.debateResult.consensusScore < this.config.debate.consensusThreshold) {
          result.finalDecision = 'escalate';
          result.reasoning = 'Insufficient consensus in debate';
          result.confidence = result.debateResult.consensusScore;
        }
      }

      // Step 2: Adversarial Self-Critique (only if debate passed)
      if (result.finalDecision === 'proceed' && this.config.enableFullLoop) {
        const critiqueTriggers = this.generateCritiqueTriggers(result.debateResult);
        result.critiqueResult = await this.critiqueManager.critiqueOutput(taskId, proposal, context, critiqueTriggers);
        
        if (result.critiqueResult.action === 'reject' || result.critiqueResult.blockedFromLearning) {
          result.finalDecision = 'reject';
          result.reasoning = `Self-critique rejected: ${result.critiqueResult.reasoning}`;
          result.confidence = 1 - result.critiqueResult.critique.severity;
        }
      }

      // Step 3: Memory Health Check
      if (result.finalDecision === 'proceed' && this.config.enableFullLoop) {
        // Check relevant memories for corruption
        const memoryId = `task_${taskId}`;
        this.memoryDetector.registerMemory(memoryId, proposal, {
          source: 'model_output',
          confidence: result.confidence || 0.8,
          timestamp: Date.now(),
          validationLevel: 'basic',
          chainOfTrust: ['cognitive_governance']
        });

        result.memoryHealth = await this.memoryDetector.assessMemoryHealth(memoryId, context);
        
        if (result.memoryHealth.quarantineStatus === 'quarantined') {
          result.finalDecision = 'reject';
          result.reasoning = 'Memory corruption detected - quarantined';
          result.confidence = 1 - result.memoryHealth.corruptionScore;
        }
      }

      // Step 4: Skill Discovery and Application
      if (result.finalDecision === 'proceed' && this.config.enableFullLoop) {
        const pattern = this.extractPattern(proposal, context);
        this.skillDiscovery.recordPatternExecution(pattern, context, 'success', result.confidence);
        
        // Check for applicable skills
        result.skillsUsed = this.findApplicableSkills(context);
        
        if (result.skillsUsed.length > 0) {
          result.reasoning += ` Applied ${result.skillsUsed.length} emergent skills`;
        }
      }

      // Final decision synthesis
      result.governanceTime = Date.now() - startTime;
      result.confidence = this.calculateFinalConfidence(result);
      
      if (this.config.explainabilityRequired) {
        result.reasoning = this.generateExplainableReasoning(result);
      }

      // Store in history
      const finalResult: GovernanceResult = {
        taskId: taskId || 'unknown',
        debateResult: result.debateResult,
        critiqueResult: result.critiqueResult,
        memoryHealth: result.memoryHealth,
        skillsUsed: result.skillsUsed,
        finalDecision: result.finalDecision || 'proceed',
        reasoning: result.reasoning || 'No reasoning provided',
        confidence: result.confidence || 0,
        governanceTime: Date.now() - startTime,
        safetyAssessment: result.safetyAssessment || 'safe'
      };

      // Update metrics
      this.updateMetrics(finalResult);

      this.governanceHistory.push(finalResult);
      
      console.log(`[CognitiveGovernance] Task ${taskId} completed: ${finalResult.finalDecision} (${finalResult.governanceTime}ms)`);
      
      return finalResult;

    } catch (error) {
      console.error(`[CognitiveGovernance] Error processing task ${taskId}:`, error);
      
      // Graceful degradation
      if (this.config.gracefulDegradation) {
        return {
          taskId,
          finalDecision: 'proceed',
          reasoning: 'Governance failed - proceeding with caution',
          confidence: 0.5,
          governanceTime: Date.now() - startTime,
          safetyAssessment: 'caution'
        };
      } else {
        throw error;
      }
    }
  }

  /**
   * Generate critique triggers from debate result
   */
  private generateCritiqueTriggers(debateResult?: DebateResult): any[] {
    if (!debateResult) return [];

    const triggers = [];

    // Low consensus trigger
    if (debateResult.consensusScore < 0.65) {
      triggers.push({
        type: 'low_consensus' as const,
        threshold: 0.65,
        currentValue: debateResult.consensusScore,
        context: debateResult
      });
    }

    // Safety concerns trigger
    if (debateResult.safetyAssessment === 'unsafe' || debateResult.safetyAssessment === 'blocked') {
      triggers.push({
        type: 'failed_eval' as const,
        threshold: 0.5,
        currentValue: 0.8,
        context: debateResult
      });
    }

    return triggers;
  }

  /**
   * Extract pattern for skill discovery
   */
  private extractPattern(proposal: string, context: any): string {
    // Create a pattern signature from proposal and context
    const contextSignature = JSON.stringify(context).substring(0, 100);
    const proposalSignature = proposal.substring(0, 100);
    return `${contextSignature}:${proposalSignature}`;
  }

  /**
   * Find applicable emergent skills
   */
  private findApplicableSkills(context: any): EmergentSkill[] {
    const allSkills = this.skillDiscovery.getEmergentSkills();
    
    // Simple domain matching (could be enhanced)
    const domains = this.extractDomainsFromContext(context);
    
    return allSkills.filter(skill => 
      skill.domains.some(domain => domains.includes(domain))
    ).slice(0, 3); // Limit to top 3 skills
  }

  /**
   * Extract domains from context (simplified)
   */
  private extractDomainsFromContext(context: any): string[] {
    const domains: string[] = [];
    
    if (context.taskType) domains.push(context.taskType);
    if (context.domain) domains.push(context.domain);
    
    return domains.length > 0 ? domains : ['general'];
  }

  /**
   * Calculate final confidence from all systems
   */
  private calculateFinalConfidence(result: Partial<GovernanceResult>): number {
    const confidences = [
      result.debateResult?.consensusScore || 0,
      result.critiqueResult ? (1 - result.critiqueResult.critique.severity) : 0,
      result.memoryHealth ? (1 - result.memoryHealth.corruptionScore) : 0
    ];

    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  /**
   * Generate explainable reasoning
   */
  private generateExplainableReasoning(result: Partial<GovernanceResult>): string {
    const reasoning = [];

    if (result.debateResult) {
      reasoning.push(`Debate consensus: ${(result.debateResult.consensusScore * 100).toFixed(1)}%`);
      reasoning.push(`Safety assessment: ${result.debateResult.safetyAssessment}`);
    }

    if (result.critiqueResult) {
      reasoning.push(`Critique severity: ${(result.critiqueResult.critique.severity * 100).toFixed(1)}%`);
      reasoning.push(`Critique action: ${result.critiqueResult.action}`);
    }

    if (result.memoryHealth) {
      reasoning.push(`Memory health: ${result.memoryHealth.quarantineStatus}`);
      reasoning.push(`Corruption score: ${(result.memoryHealth.corruptionScore * 100).toFixed(1)}%`);
    }

    if (result.skillsUsed && result.skillsUsed.length > 0) {
      reasoning.push(`Skills applied: ${result.skillsUsed.map(s => s.skillId).join(', ')}`);
    }

    return reasoning.join('; ');
  }

  /**
   * Update governance metrics
   */
  private updateMetrics(result: GovernanceResult): void {
    this.metrics.totalTasks++;
    
    // Update average governance time
    const totalTime = this.metrics.avgGovernanceTime * (this.metrics.totalTasks - 1) + result.governanceTime;
    this.metrics.avgGovernanceTime = totalTime / this.metrics.totalTasks;

    // Update success rate (proceed = success)
    const successCount = this.governanceHistory.filter(r => r.finalDecision === 'proceed').length;
    this.metrics.successRate = successCount / this.metrics.totalTasks;

    // Update safety block rate
    const safetyBlocks = this.governanceHistory.filter(r => r.finalDecision === 'block').length;
    this.metrics.safetyBlockRate = safetyBlocks / this.metrics.totalTasks;

    // Update skill usage rate
    const skillUsage = this.governanceHistory.filter(r => r.skillsUsed && r.skillsUsed.length > 0).length;
    this.metrics.skillUsageRate = skillUsage / this.metrics.totalTasks;

    // Update consensus rate
    const consensusPassed = this.governanceHistory.filter(r => 
      r.debateResult && r.debateResult.consensusScore >= this.config.debate.consensusThreshold
    ).length;
    this.metrics.consensusRate = consensusPassed / this.metrics.totalTasks;

    // Update critique block rate
    const critiqueBlocks = this.governanceHistory.filter(r => 
      r.critiqueResult && r.critiqueResult.blockedFromLearning
    ).length;
    this.metrics.critiqueBlockRate = critiqueBlocks / this.metrics.totalTasks;
  }

  /**
   * Get governance metrics
   */
  public getGovernanceMetrics(): GovernanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get governance history
   */
  public getGovernanceHistory(limit: number = 100): GovernanceResult[] {
    return this.governanceHistory.slice(-limit);
  }

  /**
   * Get system statistics
   */
  public getSystemStatistics(): {
    debate: any;
    critique: any;
    memory: any;
    skills: any;
    governance: GovernanceMetrics;
  } {
    return {
      debate: this.debateManager.getDebateStatistics(),
      critique: this.critiqueManager.getCritiqueStatistics(),
      memory: this.memoryDetector.getCorruptionStatistics(),
      skills: this.skillDiscovery.getDiscoveryStatistics(),
      governance: this.metrics
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CognitiveGovernanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update individual system configs
    if (newConfig.debate) {
      this.debateManager.updateConfig(newConfig.debate);
    }
    if (newConfig.critique) {
      this.critiqueManager.updateConfig(newConfig.critique);
    }
    if (newConfig.memory) {
      this.memoryDetector.updateConfig(newConfig.memory);
    }
    if (newConfig.skills) {
      this.skillDiscovery.updateConfig(newConfig.skills);
    }
  }

  /**
   * Enable/disable full loop
   */
  public setFullLoopEnabled(enabled: boolean): void {
    this.config.enableFullLoop = enabled;
  }

  /**
   * Clear all data
   */
  public clearAll(): void {
    this.governanceHistory = [];
    this.metrics = {
      totalTasks: 0,
      avgGovernanceTime: 0,
      successRate: 0,
      safetyBlockRate: 0,
      skillUsageRate: 0,
      memoryQuarantineRate: 0,
      consensusRate: 0,
      critiqueBlockRate: 0
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.memoryDetector.cleanup();
    this.clearAll();
  }
}

// LLM Rule Integration
export const COGNITIVE_GOVERNANCE_RULES = {
  NO_PERSONALITY_DRIFT: 'No personality drift',
  SAFETY_OVERRIDES: 'Safety overrides autonomy',
  EVIDENCE_OVER_CONFIDENCE: 'Evidence > confidence',
  EXPLAINABILITY_MANDATORY: 'Explainability is mandatory',
  GRACEFUL_DEGRADATION: 'Systems must degrade gracefully',
  CAPABILITIES: [
    'Argue with herself',
    'Prove herself wrong',
    'Forget safely',
    'Discover skills organically'
  ],
  ARCHITECTURE_EQUIVALENT: [
    'Autonomous research agents',
    'Self-healing infra bots',
    'Game directors',
    'Strategic copilots'
  ],
  COGNITIVE_LOOP: [
    'Multi-Agent Debate',
    'Adversarial Self-Critique',
    'Memory Health Check',
    'Skill Detection'
  ]
};
