/**
 * Governance Simulations
 * Before changing rules, contracts, or autonomy, Acey simulates outcomes
 */

export interface GovernanceSimulation {
  simulationId: string;
  proposedChange: string;
  changeType: "contract" | "policy" | "autonomy" | "skill" | "ethics";
  scenarios: SimulationScenario[];
  riskScore: number; // 0-1
  affectedSystems: string[];
  estimatedImpact: {
    positive: number;
    negative: number;
    neutral: number;
  };
  recommendation: "safe" | "caution" | "dangerous";
  createdAt: number;
  completedAt?: number;
}

export interface SimulationScenario {
  scenarioId: string;
  name: string;
  description: string;
  probability: number; // 0-1
  impact: {
    governance: number; // 0-1
    economics: number; // 0-1
    ethics: number; // 0-1
    goals: number; // 0-1
  };
  duration: number; // in milliseconds
  resources: string[];
}

export interface SimulationResult {
  simulationId: string;
  overallRiskScore: number;
  scenarioResults: {
    scenarioId: string;
    outcome: "positive" | "negative" | "neutral";
    confidence: number;
    details: string;
  }[];
  systemImpacts: {
    system: string;
    impact: number;
    risk: "low" | "medium" | "high" | "critical";
  }[];
  finalRecommendation: "proceed" | "require_approval" | "reject";
  reasoning: string[];
}

export interface SimulationTemplate {
  templateId: string;
  name: string;
  changeType: string;
  baseScenarios: Omit<SimulationScenario, 'scenarioId'>[];
  riskFactors: string[];
  requiredChecks: string[];
}

class GovernanceSimulationManager {
  private simulations: Map<string, GovernanceSimulation> = new Map();
  private templates: Map<string, SimulationTemplate> = new Map();
  private storagePath: string;

  // Risk thresholds
  private readonly RISK_THRESHOLDS = {
    safe: 0.3,
    caution: 0.6,
    dangerous: 1.0
  };

  constructor(storagePath: string = './data/governance-simulations.json') {
    this.storagePath = storagePath;
    this.initializeDefaultTemplates();
    this.loadSimulations();
  }

  /**
   * Initialize default simulation templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<SimulationTemplate, 'templateId'>[] = [
      {
        name: "Contract Modification",
        changeType: "contract",
        baseScenarios: [
          {
            name: "Permission Expansion",
            description: "Expanded autonomous permissions lead to unintended actions",
            probability: 0.3,
            impact: { governance: 0.8, economics: 0.4, ethics: 0.6, goals: 0.3 },
            duration: 86400000, // 24 hours
            resources: ["governance", "monitoring"]
          },
          {
            name: "Loopback Exploitation",
            description: "New contract creates exploitable loopholes",
            probability: 0.2,
            impact: { governance: 0.9, economics: 0.3, ethics: 0.7, goals: 0.4 },
            duration: 172800000, // 48 hours
            resources: ["governance", "security", "ethics"]
          }
        ],
        riskFactors: ["autonomy_expansion", "permission_creep", "oversight_reduction"],
        requiredChecks: ["contract_validation", "ethics_review", "authority_approval"]
      },
      {
        name: "Autonomy Level Change",
        changeType: "autonomy",
        baseScenarios: [
          {
            name: "Rapid Decision Making",
            description: "Higher autonomy leads to faster but less considered decisions",
            probability: 0.4,
            impact: { governance: 0.5, economics: 0.7, ethics: 0.8, goals: 0.4 },
            duration: 3600000, // 1 hour
            resources: ["cognitive", "monitoring"]
          },
          {
            name: "Error Cascade",
            description: "Autonomous errors compound without human intervention",
            probability: 0.15,
            impact: { governance: 0.9, economics: 0.8, ethics: 0.6, goals: 0.7 },
            duration: 7200000, // 2 hours
            resources: ["recovery", "monitoring", "authority"]
          }
        ],
        riskFactors: ["decision_speed", "error_propagation", "oversight_gap"],
        requiredChecks: ["performance_test", "error_simulation", "authority_notification"]
      },
      {
        name: "Skill Economics Change",
        changeType: "skill",
        baseScenarios: [
          {
            name: "Resource Misallocation",
            description: "New economic rules cause inefficient resource distribution",
            probability: 0.25,
            impact: { governance: 0.3, economics: 0.8, ethics: 0.2, goals: 0.6 },
            duration: 14400000, // 4 hours
            resources: ["economics", "monitoring"]
          },
          {
            name: "Skill Starvation",
            description: "Important skills become uneconomical and get retired",
            probability: 0.2,
            impact: { governance: 0.4, economics: 0.7, ethics: 0.3, goals: 0.8 },
            duration: 86400000, // 24 hours
            resources: ["economics", "skills", "recovery"]
          }
        ],
        riskFactors: ["resource_allocation", "skill_retirement", "economic_efficiency"],
        requiredChecks: ["economic_modeling", "skill_impact_analysis", "performance_projection"]
      },
      {
        name: "Ethical Constraint Change",
        changeType: "ethics",
        baseScenarios: [
          {
            name: "Constraint Weakening",
            description: "Relaxed ethical constraints lead to boundary testing",
            probability: 0.35,
            impact: { governance: 0.4, economics: 0.2, ethics: 0.9, goals: 0.3 },
            duration: 21600000, // 6 hours
            resources: ["ethics", "monitoring", "authority"]
          },
          {
            name: "Ethical Drift",
            description: "System gradually pushes new ethical boundaries",
            probability: 0.25,
            impact: { governance: 0.6, economics: 0.3, ethics: 0.8, goals: 0.5 },
            duration: 604800000, // 7 days
            resources: ["ethics", "monitoring", "learning"]
          }
        ],
        riskFactors: ["boundary_testing", "ethical_drift", "value_alignment"],
        requiredChecks: ["ethical_analysis", "stress_testing", "value_validation"]
      }
    ];

    for (const template of defaultTemplates) {
      this.templates.set(this.generateTemplateId(), {
        ...template,
        templateId: this.generateTemplateId()
      });
    }
  }

  /**
   * Create a new governance simulation
   */
  createSimulation(
    proposedChange: string,
    changeType: GovernanceSimulation['changeType'],
    customScenarios?: Omit<SimulationScenario, 'scenarioId'>[]
  ): string {
    const simulationId = this.generateSimulationId();
    
    // Get template for this change type
    const template = this.getTemplateByType(changeType);
    
    // Generate scenarios
    const scenarios = this.generateScenarios(template, customScenarios);
    
    // Calculate initial risk score
    const riskScore = this.calculateRiskScore(scenarios);
    
    // Identify affected systems
    const affectedSystems = this.identifyAffectedSystems(changeType, scenarios);
    
    // Estimate impact
    const estimatedImpact = this.estimateImpact(scenarios);
    
    // Determine recommendation
    const recommendation = this.determineRecommendation(riskScore);

    const simulation: GovernanceSimulation = {
      simulationId,
      proposedChange,
      changeType,
      scenarios,
      riskScore,
      affectedSystems,
      estimatedImpact,
      recommendation,
      createdAt: Date.now()
    };

    this.simulations.set(simulationId, simulation);
    this.saveSimulations();
    
    return simulationId;
  }

  /**
   * Run a simulation and generate results
   */
  async runSimulation(simulationId: string): Promise<SimulationResult> {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation ${simulationId} not found`);
    }

    const scenarioResults: SimulationResult['scenarioResults'] = [];
    const systemImpacts: SimulationResult['systemImpacts'] = [];
    const reasoning: string[] = [];

    // Run each scenario
    for (const scenario of simulation.scenarios) {
      const result = await this.runScenario(scenario);
      scenarioResults.push(result);
      
      reasoning.push(`Scenario "${scenario.name}": ${result.outcome} (${result.confidence.toFixed(2)} confidence)`);
    }

    // Calculate system impacts
    const systemImpactMap = new Map<string, number>();
    
    for (const scenario of simulation.scenarios) {
      for (const system of simulation.affectedSystems) {
        const impact = this.calculateSystemImpact(system, scenario);
        const current = systemImpactMap.get(system) || 0;
        systemImpactMap.set(system, current + impact);
      }
    }

    for (const [system, impact] of systemImpactMap.entries()) {
      const risk = this.assessSystemRisk(impact);
      systemImpacts.push({ system, impact, risk });
    }

    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRisk(scenarioResults, systemImpacts);
    
    // Generate final recommendation
    const finalRecommendation = this.generateFinalRecommendation(overallRiskScore, scenarioResults);

    const result: SimulationResult = {
      simulationId,
      overallRiskScore,
      scenarioResults,
      systemImpacts,
      finalRecommendation,
      reasoning
    };

    // Update simulation with completion
    simulation.completedAt = Date.now();
    this.saveSimulations();

    return result;
  }

  /**
   * Get template by change type
   */
  private getTemplateByType(changeType: GovernanceSimulation['changeType']): SimulationTemplate | undefined {
    for (const template of this.templates.values()) {
      if (template.changeType === changeType) {
        return template;
      }
    }
    return undefined;
  }

  /**
   * Generate scenarios from template and custom scenarios
   */
  private generateScenarios(
    template?: SimulationTemplate,
    customScenarios?: Omit<SimulationScenario, 'scenarioId'>[]
  ): SimulationScenario[] {
    const scenarios: SimulationScenario[] = [];

    // Add template scenarios
    if (template) {
      for (const baseScenario of template.baseScenarios) {
        scenarios.push({
          ...baseScenario,
          scenarioId: this.generateScenarioId()
        });
      }
    }

    // Add custom scenarios
    if (customScenarios) {
      for (const customScenario of customScenarios) {
        scenarios.push({
          ...customScenario,
          scenarioId: this.generateScenarioId()
        });
      }
    }

    return scenarios;
  }

  /**
   * Calculate risk score from scenarios
   */
  private calculateRiskScore(scenarios: SimulationScenario[]): number {
    if (scenarios.length === 0) return 0;

    let totalRisk = 0;
    let totalWeight = 0;

    for (const scenario of scenarios) {
      const scenarioRisk = this.calculateScenarioRisk(scenario);
      totalRisk += scenarioRisk * scenario.probability;
      totalWeight += scenario.probability;
    }

    return totalWeight > 0 ? totalRisk / totalWeight : 0;
  }

  /**
   * Calculate risk for a single scenario
   */
  private calculateScenarioRisk(scenario: SimulationScenario): number {
    // Weight different impact areas
    const weights = {
      governance: 0.3,
      economics: 0.2,
      ethics: 0.3,
      goals: 0.2
    };

    let weightedImpact = 0;
    for (const [area, weight] of Object.entries(weights)) {
      weightedImpact += scenario.impact[area as keyof typeof scenario.impact] * weight;
    }

    return weightedImpact;
  }

  /**
   * Identify affected systems
   */
  private identifyAffectedSystems(
    changeType: GovernanceSimulation['changeType'],
    scenarios: SimulationScenario[]
  ): string[] {
    const baseSystems: Record<GovernanceSimulation['changeType'], string[]> = {
      contract: ["governance", "authority", "monitoring"],
      policy: ["governance", "economics", "goals"],
      autonomy: ["cognitive", "monitoring", "authority"],
      skill: ["economics", "skills", "performance"],
      ethics: ["ethics", "learning", "monitoring"]
    };

    const systems = new Set(baseSystems[changeType] || []);

    // Add systems from scenarios
    for (const scenario of scenarios) {
      for (const resource of scenario.resources) {
        systems.add(resource);
      }
    }

    return Array.from(systems);
  }

  /**
   * Estimate overall impact
   */
  private estimateImpact(scenarios: SimulationScenario[]): {
    positive: number;
    negative: number;
    neutral: number;
  } {
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    for (const scenario of scenarios) {
      const impact = this.calculateScenarioRisk(scenario);
      const weightedImpact = impact * scenario.probability;

      if (impact < 0.3) {
        positive += weightedImpact;
      } else if (impact > 0.7) {
        negative += weightedImpact;
      } else {
        neutral += weightedImpact;
      }
    }

    return { positive, negative, neutral };
  }

  /**
   * Determine recommendation from risk score
   */
  private determineRecommendation(riskScore: number): "safe" | "caution" | "dangerous" {
    if (riskScore < this.RISK_THRESHOLDS.safe) {
      return "safe";
    } else if (riskScore < this.RISK_THRESHOLDS.caution) {
      return "caution";
    } else {
      return "dangerous";
    }
  }

  /**
   * Run a single scenario
   */
  private async runScenario(scenario: SimulationScenario): Promise<{
    scenarioId: string;
    outcome: "positive" | "negative" | "neutral";
    confidence: number;
    details: string;
  }> {
    // Simulate scenario execution
    await this.simulateDelay(scenario.duration / 1000); // Scale down for simulation

    const risk = this.calculateScenarioRisk(scenario);
    let outcome: "positive" | "negative" | "neutral";
    let confidence: number;
    let details: string;

    // Determine outcome based on risk
    if (risk < 0.3) {
      outcome = "positive";
      confidence = 0.8 + (0.3 - risk);
      details = "Scenario completed successfully with minimal issues";
    } else if (risk > 0.7) {
      outcome = "negative";
      confidence = 0.7 + (risk - 0.7);
      details = "Scenario resulted in significant problems or violations";
    } else {
      outcome = "neutral";
      confidence = 0.6;
      details = "Scenario had mixed results with both benefits and drawbacks";
    }

    return {
      scenarioId: scenario.scenarioId,
      outcome,
      confidence,
      details
    };
  }

  /**
   * Calculate system impact
   */
  private calculateSystemImpact(system: string, scenario: SimulationScenario): number {
    // Simple impact calculation based on scenario risk and system involvement
    const systemInvolvement = scenario.resources.includes(system) ? 1.0 : 0.5;
    return this.calculateScenarioRisk(scenario) * systemInvolvement;
  }

  /**
   * Assess system risk level
   */
  private assessSystemRisk(impact: number): "low" | "medium" | "high" | "critical" {
    if (impact < 0.2) return "low";
    if (impact < 0.5) return "medium";
    if (impact < 0.8) return "high";
    return "critical";
  }

  /**
   * Calculate overall risk from results
   */
  private calculateOverallRisk(
    scenarioResults: SimulationResult['scenarioResults'],
    systemImpacts: SimulationResult['systemImpacts']
  ): number {
    // Risk from scenario outcomes
    const negativeScenarios = scenarioResults.filter(r => r.outcome === "negative");
    const scenarioRisk = negativeScenarios.length / scenarioResults.length;

    // Risk from system impacts
    const highRiskSystems = systemImpacts.filter(s => s.risk === "high" || s.risk === "critical");
    const systemRisk = highRiskSystems.length / systemImpacts.length;

    // Combined risk
    return (scenarioRisk * 0.6 + systemRisk * 0.4);
  }

  /**
   * Generate final recommendation
   */
  private generateFinalRecommendation(
    overallRiskScore: number,
    scenarioResults: SimulationResult['scenarioResults']
  ): "proceed" | "require_approval" | "reject" {
    if (overallRiskScore < 0.3) {
      return "proceed";
    } else if (overallRiskScore < 0.6) {
      return "require_approval";
    } else {
      return "reject";
    }
  }

  /**
   * Get simulation by ID
   */
  getSimulation(simulationId: string): GovernanceSimulation | undefined {
    return this.simulations.get(simulationId);
  }

  /**
   * Get all simulations
   */
  getAllSimulations(): GovernanceSimulation[] {
    return Array.from(this.simulations.values());
  }

  /**
   * Get simulations by change type
   */
  getSimulationsByType(changeType: GovernanceSimulation['changeType']): GovernanceSimulation[] {
    return Array.from(this.simulations.values())
      .filter(s => s.changeType === changeType);
  }

  /**
   * Get recent simulations
   */
  getRecentSimulations(limit: number = 10): GovernanceSimulation[] {
    return Array.from(this.simulations.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Get simulation statistics
   */
  getSimulationStats(): {
    totalSimulations: number;
    completedSimulations: number;
    averageRiskScore: number;
    simulationsByType: Record<GovernanceSimulation['changeType'], number>;
    riskDistribution: Record<"safe" | "caution" | "dangerous", number>;
  } {
    const simulations = Array.from(this.simulations.values());
    const completed = simulations.filter(s => s.completedAt);

    const simulationsByType = simulations.reduce((acc, s) => {
      acc[s.changeType] = (acc[s.changeType] || 0) + 1;
      return acc;
    }, {} as Record<GovernanceSimulation['changeType'], number>);

    const riskDistribution = simulations.reduce((acc, s) => {
      acc[s.recommendation] = (acc[s.recommendation] || 0) + 1;
      return acc;
    }, {} as Record<"safe" | "caution" | "dangerous", number>);

    const averageRiskScore = simulations.length > 0
      ? simulations.reduce((sum, s) => sum + s.riskScore, 0) / simulations.length
      : 0;

    return {
      totalSimulations: simulations.length,
      completedSimulations: completed.length,
      averageRiskScore,
      simulationsByType,
      riskDistribution
    };
  }

  /**
   * Simulate delay (for testing)
   */
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.min(ms, 100))); // Cap at 100ms for testing
  }

  /**
   * Save simulations to disk
   */
  private saveSimulations(): void {
    try {
      const fs = require('fs');
      const data = {
        simulations: Array.from(this.simulations.entries()),
        templates: Array.from(this.templates.entries())
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save governance simulations:', error);
    }
  }

  /**
   * Load simulations from disk
   */
  private loadSimulations(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
        this.simulations = new Map(data.simulations || []);
        this.templates = new Map(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load governance simulations:', error);
    }
  }

  /**
   * Generate unique IDs
   */
  private generateSimulationId(): string {
    return `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateScenarioId(): string {
    return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { GovernanceSimulationManager };
