// File: src/server/utils/multiAgentDebate.ts

/**
 * Multi-Agent Debate System
 * Acey internally spawns multiple reasoning roles that debate before committing to an action
 */

export type InternalAgentRole = "planner" | "skeptic" | "executor" | "safety" | "optimizer";

export type DebateTurn = {
  agent: InternalAgentRole;
  reasoning: string;
  confidence: number;
  timestamp: number;
  supportingEvidence?: string[];
  concerns?: string[];
};

export type DebateResult = {
  turns: DebateTurn[];
  finalDecision: string;
  consensusScore: number; // 0–1
  executionPlan?: string;
  safetyAssessment: 'safe' | 'caution' | 'unsafe' | 'blocked';
  debateDuration: number;
};

export type DebateConfig = {
  minParticipants: number;
  consensusThreshold: number;
  maxTurnsPerAgent: number;
  timeoutMs: number;
  requireSafetyApproval: boolean;
};

/**
 * Internal Agent Interface
 */
export interface InternalAgent {
  role: InternalAgentRole;
  analyze(context: any, proposal: string, previousTurns: DebateTurn[]): Promise<DebateTurn>;
  getPriority(): number;
  isActive(): boolean;
}

/**
 * Multi-Agent Debate Manager
 */
export class MultiAgentDebateManager {
  private agents: Map<InternalAgentRole, InternalAgent> = new Map();
  private config: DebateConfig;
  private debateHistory: DebateResult[] = [];

  constructor(config?: Partial<DebateConfig>) {
    this.config = {
      minParticipants: 3,
      consensusThreshold: 0.65,
      maxTurnsPerAgent: 3,
      timeoutMs: 30000,
      requireSafetyApproval: true,
      ...config
    };

    this.initializeAgents();
  }

  /**
   * Initialize internal agents
   */
  private initializeAgents(): void {
    this.agents.set("planner", new PlannerAgent());
    this.agents.set("skeptic", new SkepticAgent());
    this.agents.set("executor", new ExecutorAgent());
    this.agents.set("safety", new SafetyAgent());
    this.agents.set("optimizer", new OptimizerAgent());
  }

  /**
   * Conduct internal debate for a decision
   */
  public async conductDebate(
    context: any,
    proposal: string,
    impact: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<DebateResult> {
    const startTime = Date.now();
    const turns: DebateTurn[] = [];
    const activeAgents = Array.from(this.agents.values())
      .filter(agent => agent.isActive())
      .sort((a, b) => b.getPriority() - a.getPriority())
      .slice(0, this.config.minParticipants);

    console.log(`[MultiAgentDebate] Starting debate with ${activeAgents.length} agents for impact: ${impact}`);

    // Initial proposal analysis
    for (const agent of activeAgents) {
      if (turns.length >= this.config.minParticipants * this.config.maxTurnsPerAgent) break;
      
      try {
        const turn = await agent.analyze(context, proposal, turns);
        turns.push(turn);
        console.log(`[MultiAgentDebate] ${agent.role}: ${turn.reasoning.substring(0, 100)}...`);
      } catch (error) {
        console.error(`[MultiAgentDebate] Agent ${agent.role} failed:`, error);
      }
    }

    // Follow-up debate rounds
    let debateRounds = 0;
    const maxRounds = 3;

    while (debateRounds < maxRounds && turns.length < this.config.minParticipants * this.config.maxTurnsPerAgent) {
      debateRounds++;
      
      for (const agent of activeAgents) {
        if (turns.length >= this.config.minParticipants * this.config.maxTurnsPerAgent) break;
        
        const agentTurns = turns.filter(t => t.agent === agent.role);
        if (agentTurns.length >= this.config.maxTurnsPerAgent) continue;

        try {
          const turn = await agent.analyze(context, proposal, turns);
          turns.push(turn);
        } catch (error) {
          console.error(`[MultiAgentDebate] Agent ${agent.role} failed in round ${debateRounds}:`, error);
        }
      }
    }

    // Analyze debate results
    const result = this.analyzeDebateResults(turns, startTime);
    
    // Store in history
    this.debateHistory.push(result);
    
    console.log(`[MultiAgentDebate] Debate completed: consensus=${result.consensusScore.toFixed(2)}, safety=${result.safetyAssessment}`);
    
    return result;
  }

  /**
   * Analyze debate results and determine consensus
   */
  private analyzeDebateResults(turns: DebateTurn[], startTime: number): DebateResult {
    if (turns.length === 0) {
      return {
        turns: [],
        finalDecision: "No debate participants available",
        consensusScore: 0,
        safetyAssessment: 'blocked',
        debateDuration: 0
      };
    }

    // Calculate consensus score
    const confidences = turns.map(t => t.confidence);
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const confidenceVariance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
    
    // Consensus is high confidence with low variance
    const consensusScore = Math.max(0, avgConfidence - Math.sqrt(confidenceVariance));

    // Safety assessment
    const safetyTurns = turns.filter(t => t.agent === 'safety');
    const safetyAssessment = this.assessSafety(safetyTurns);

    // Final decision synthesis
    const finalDecision = this.synthesizeDecision(turns, consensusScore, safetyAssessment);

    // Execution plan from executor
    const executorTurns = turns.filter(t => t.agent === 'executor');
    const executionPlan = executorTurns.length > 0 ? executorTurns[executorTurns.length - 1].reasoning : undefined;

    return {
      turns,
      finalDecision,
      consensusScore,
      executionPlan,
      safetyAssessment,
      debateDuration: Date.now() - startTime
    };
  }

  /**
   * Assess safety based on safety agent's input
   */
  private assessSafety(safetyTurns: DebateTurn[]): DebateResult['safetyAssessment'] {
    if (safetyTurns.length === 0) {
      return this.config.requireSafetyApproval ? 'blocked' : 'safe';
    }

    const latestSafetyTurn = safetyTurns[safetyTurns.length - 1];
    const safetyConfidence = latestSafetyTurn.confidence;

    if (safetyConfidence < 0.3) {
      return 'unsafe';
    } else if (safetyConfidence < 0.6) {
      return 'caution';
    } else if (latestSafetyTurn.concerns && latestSafetyTurn.concerns.length > 0) {
      return 'caution';
    } else {
      return 'safe';
    }
  }

  /**
   * Synthesize final decision from debate turns
   */
  private synthesizeDecision(
    turns: DebateTurn[], 
    consensusScore: number, 
    safetyAssessment: DebateResult['safetyAssessment']
  ): string {
    if (safetyAssessment === 'blocked') {
      return "Action blocked: No safety agent available and safety is required";
    }

    if (safetyAssessment === 'unsafe') {
      return "Action blocked: Safety agent identified critical risks";
    }

    if (consensusScore < this.config.consensusThreshold) {
      return "Action deferred: Insufficient consensus among internal agents";
    }

    // Get the highest confidence reasoning
    const bestTurn = turns.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    return `Proceed with action: ${bestTurn.reasoning}`;
  }

  /**
   * Get debate statistics
   */
  public getDebateStatistics(): {
    totalDebates: number;
    avgConsensusScore: number;
    avgDebateDuration: number;
    safetyDistribution: Record<string, number>;
    agentParticipation: Record<InternalAgentRole, number>;
  } {
    if (this.debateHistory.length === 0) {
      return {
        totalDebates: 0,
        avgConsensusScore: 0,
        avgDebateDuration: 0,
        safetyDistribution: {},
        agentParticipation: {} as Record<InternalAgentRole, number>
      };
    }

    const totalDebates = this.debateHistory.length;
    const avgConsensusScore = this.debateHistory.reduce((sum, d) => sum + d.consensusScore, 0) / totalDebates;
    const avgDebateDuration = this.debateHistory.reduce((sum, d) => sum + d.debateDuration, 0) / totalDebates;

    const safetyDistribution: Record<string, number> = {};
    const agentParticipation: Record<InternalAgentRole, number> = {} as Record<InternalAgentRole, number>;

    for (const debate of this.debateHistory) {
      safetyDistribution[debate.safetyAssessment] = (safetyDistribution[debate.safetyAssessment] || 0) + 1;
      
      for (const turn of debate.turns) {
        agentParticipation[turn.agent] = (agentParticipation[turn.agent] || 0) + 1;
      }
    }

    return {
      totalDebates,
      avgConsensusScore,
      avgDebateDuration,
      safetyDistribution,
      agentParticipation
    };
  }

  /**
   * Get debate history
   */
  public getDebateHistory(limit: number = 50): DebateResult[] {
    return this.debateHistory.slice(-limit);
  }

  /**
   * Clear debate history
   */
  public clearHistory(): void {
    this.debateHistory = [];
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<DebateConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Individual Agent Implementations
 */

class PlannerAgent implements InternalAgent {
  role: InternalAgentRole = "planner";

  async analyze(context: any, proposal: string, previousTurns: DebateTurn[]): Promise<DebateTurn> {
    const reasoning = `Plan analysis: ${proposal}. Context: ${JSON.stringify(context).substring(0, 200)}...`;
    
    return {
      agent: this.role,
      reasoning,
      confidence: 0.8,
      timestamp: Date.now(),
      supportingEvidence: ["Strategic alignment", "Resource availability"],
      concerns: previousTurns.some(t => t.agent === 'skeptic') ? ["Skeptic concerns noted"] : []
    };
  }

  getPriority(): number { return 5; }
  isActive(): boolean { return true; }
}

class SkepticAgent implements InternalAgent {
  role: InternalAgentRole = "skeptic";

  async analyze(context: any, proposal: string, previousTurns: DebateTurn[]): Promise<DebateTurn> {
    const concerns = [
      "Potential unintended consequences",
      "Assumption validation needed",
      "Risk assessment incomplete"
    ];

    return {
      agent: this.role,
      reasoning: `Skeptical analysis: ${proposal}. Identified ${concerns.length} potential issues.`,
      confidence: 0.6,
      timestamp: Date.now(),
      concerns,
      supportingEvidence: []
    };
  }

  getPriority(): number { return 4; }
  isActive(): boolean { return true; }
}

class ExecutorAgent implements InternalAgent {
  role: InternalAgentRole = "executor";

  async analyze(context: any, proposal: string, previousTurns: DebateTurn[]): Promise<DebateTurn> {
    const executionPlan = `Execute: ${proposal} with step-by-step validation`;
    
    return {
      agent: this.role,
      reasoning: executionPlan,
      confidence: 0.9,
      timestamp: Date.now(),
      supportingEvidence: ["Feasibility confirmed", "Resources available"],
      concerns: []
    };
  }

  getPriority(): number { return 3; }
  isActive(): boolean { return true; }
}

class SafetyAgent implements InternalAgent {
  role: InternalAgentRole = "safety";

  async analyze(context: any, proposal: string, previousTurns: DebateTurn[]): Promise<DebateTurn> {
    const safetyConcerns = previousTurns
      .filter(t => t.concerns && t.concerns.length > 0)
      .flatMap(t => t.concerns || []);

    const confidence = safetyConcerns.length > 2 ? 0.3 : 0.8;

    return {
      agent: this.role,
      reasoning: `Safety assessment: ${proposal}. ${safetyConcerns.length} concerns identified.`,
      confidence,
      timestamp: Date.now(),
      supportingEvidence: confidence > 0.5 ? ["Safety protocols satisfied"] : [],
      concerns: safetyConcerns
    };
  }

  getPriority(): number { return 10; } // Highest priority
  isActive(): boolean { return true; }
}

class OptimizerAgent implements InternalAgent {
  role: InternalAgentRole = "optimizer";

  async analyze(context: any, proposal: string, previousTurns: DebateTurn[]): Promise<DebateTurn> {
    const optimizations = [
      "Efficiency improvements possible",
      "Resource optimization identified",
      "Alternative approaches considered"
    ];

    return {
      agent: this.role,
      reasoning: `Optimization analysis: ${proposal}. ${optimizations.length} improvements suggested.`,
      confidence: 0.7,
      timestamp: Date.now(),
      supportingEvidence: optimizations,
      concerns: []
    };
  }

  getPriority(): number { return 2; }
  isActive(): boolean { return true; }
}

// LLM Rule Integration
export const MULTI_AGENT_DEBATE_RULES = {
  MIN_CONSENSUS_THRESHOLD: 0.65,
  SAFETY_OVERRIDE: 'If safety agent vetoes → block action',
  ESCALATION_RULE: 'If consensusScore < 0.65 → escalate to self-critique',
  DEBATE_REQUIREMENTS: [
    'Generate internal debate with at least 3 agent roles',
    'Resolve disagreements explicitly',
    'Output a consensus score',
    'Proceed only if consensus is sufficient'
  ]
};
