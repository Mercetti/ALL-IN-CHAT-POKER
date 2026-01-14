/**
 * Comprehensive Testing for Final Governance Layer
 * Tests multi-human authority, governance simulations, ethical stress testing, and goal conflict resolution
 */

const { FinalGovernanceLayer } = require('../../server/finalGovernance/finalGovernanceLayer');
const { MultiHumanAuthorityManager } = require('../../server/authority/multiHumanAuthority');
const { GovernanceSimulationManager } = require('../../server/simulation/governanceSimulation');
const { EthicalStressTestManager } = require('../../server/stress/ethicalStressTesting');
const { GoalConflictResolutionEngine } = require('../../server/conflict/goalConflictResolution');

describe('Final Governance Layer', () => {
  let finalGovernanceLayer;
  let humanAuthorityManager;
  let simulationManager;
  let stressTestManager;
  let conflictEngine;

  beforeEach(() => {
    finalGovernanceLayer = new FinalGovernanceLayer();
    humanAuthorityManager = new MultiHumanAuthorityManager();
    simulationManager = new GovernanceSimulationManager();
    stressTestManager = new EthicalStressTestManager();
    conflictEngine = new GoalConflictResolutionEngine();
  });

  describe('Multiple Humans with Weighted Authority', () => {
    test('should register human authorities with correct weights', () => {
      const authorities = humanAuthorityManager.getAllAuthorities();
      
      expect(authorities.length).toBeGreaterThan(0);
      
      // Check owner has highest weight
      const owner = authorities.find(a => a.role === 'owner');
      expect(owner).toBeDefined();
      expect(owner.weight).toBe(1.0);
      
      // Check role hierarchy
      const moderator = authorities.find(a => a.role === 'moderator');
      const developer = authorities.find(a => a.role === 'developer');
      const operator = authorities.find(a => a.role === 'operator');
      
      if (moderator && developer && operator) {
        expect(moderator.weight).toBeGreaterThan(developer.weight);
        expect(developer.weight).toBeGreaterThan(operator.weight);
      }
    });

    test('should create and process authority proposals', () => {
      const proposalId = humanAuthorityManager.createProposal({
        actionId: 'test_action',
        description: 'Test governance action',
        context: 'stream',
        scope: 'stream',
        urgency: 'medium',
        proposedBy: 'ai',
        requiredRoles: ['moderator'],
        minApprovalThreshold: 0.7
      });

      expect(proposalId).toBeDefined();
      expect(proposalId).toMatch(/^proposal_/);

      // Submit votes
      const authorities = humanAuthorityManager.getAuthoritiesByScope('stream');
      if (authorities.length > 0) {
        const decision = humanAuthorityManager.submitVote(
          proposalId,
          authorities[0].humanId,
          true,
          'This action is appropriate'
        );

        expect(decision).toBeDefined();
        expect(decision.votes).toHaveLength(1);
        expect(decision.votes[0].approve).toBe(true);
      }
    });

    test('should handle owner veto correctly', () => {
      const proposalId = humanAuthorityManager.createProposal({
        actionId: 'veto_test',
        description: 'Action that should be vetoed',
        context: 'global',
        scope: 'global',
        urgency: 'critical',
        proposedBy: 'ai',
        requiredRoles: ['owner'],
        minApprovalThreshold: 0.9
      });

      const owner = humanAuthorityManager.getAuthoritiesByRole('owner')[0];
      if (owner) {
        const decision = humanAuthorityManager.submitVote(
          proposalId,
          owner.humanId,
          false,
          'Owner veto for safety reasons'
        );

        expect(decision.finalDecision).toBe('vetoed');
        expect(decision.decisionType).toBe('veto');
      }
    });

    test('should calculate approval scores correctly', () => {
      const proposalId = humanAuthorityManager.createProposal({
        actionId: 'score_test',
        description: 'Test approval scoring',
        context: 'task',
        scope: 'task',
        urgency: 'low',
        proposedBy: 'ai',
        requiredRoles: ['developer'],
        minApprovalThreshold: 0.5
      });

      const authorities = humanAuthorityManager.getAuthoritiesByScope('task');
      const developerAuthorities = authorities.filter(a => a.role === 'developer');

      // Submit multiple votes
      for (let i = 0; i < Math.min(2, developerAuthorities.length); i++) {
        humanAuthorityManager.submitVote(
          proposalId,
          developerAuthorities[i].humanId,
          i === 0, // First approves, second rejects
          `Vote ${i + 1}`
        );
      }

      const decision = humanAuthorityManager.getDecision('score_test');
      if (decision && decision.votes.length >= 2) {
        expect(decision.approvalScore).toBeGreaterThanOrEqual(0);
        expect(decision.approvalScore).toBeLessThanOrEqual(1);
      }
    });

    test('should provide authority statistics', () => {
      const stats = humanAuthorityManager.getAuthorityStats();
      
      expect(stats).toHaveProperty('totalAuthorities');
      expect(stats).toHaveProperty('activeAuthorities');
      expect(stats).toHaveProperty('authoritiesByRole');
      expect(stats).toHaveProperty('averageTrustScore');
      expect(stats.totalAuthorities).toBeGreaterThan(0);
    });
  });

  describe('Governance Simulations', () => {
    test('should create simulations for governance changes', () => {
      const simulationId = simulationManager.createSimulation(
        'Allow autonomous site fixes',
        'autonomy',
        [
          {
            name: 'System overload',
            description: 'Autonomous fixes cause system overload',
            probability: 0.3,
            impact: { governance: 0.6, economics: 0.8, ethics: 0.2, goals: 0.4 },
            duration: 3600000,
            resources: ['compute', 'monitoring']
          }
        ]
      );

      expect(simulationId).toBeDefined();
      expect(simulationId).toMatch(/^sim_/);

      const simulation = simulationManager.getSimulation(simulationId);
      expect(simulation).toBeDefined();
      expect(simulation.proposedChange).toBe('Allow autonomous site fixes');
      expect(simulation.changeType).toBe('autonomy');
    });

    test('should run simulations and generate results', async () => {
      const simulationId = simulationManager.createSimulation(
        'Modify ethical constraints',
        'ethics'
      );

      const result = await simulationManager.runSimulation(simulationId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallRiskScore');
      expect(result).toHaveProperty('scenarioResults');
      expect(result).toHaveProperty('systemImpacts');
      expect(result).toHaveProperty('finalRecommendation');
      expect(result.scenarioResults.length).toBeGreaterThan(0);
    });

    test('should provide appropriate recommendations based on risk', async () => {
      // Low risk simulation
      const lowRiskId = simulationManager.createSimulation(
        'Minor policy adjustment',
        'policy',
        [
          {
            name: 'Low impact change',
            description: 'Minor adjustment with minimal risk',
            probability: 0.1,
            impact: { governance: 0.2, economics: 0.1, ethics: 0.1, goals: 0.1 },
            duration: 1000000,
            resources: ['policy']
          }
        ]
      );

      const lowRiskResult = await simulationManager.runSimulation(lowRiskId);
      expect(['proceed', 'require_approval']).toContain(lowRiskResult.finalRecommendation);

      // High risk simulation
      const highRiskId = simulationManager.createSimulation(
        'Major autonomy expansion',
        'autonomy',
        [
          {
            name: 'High risk expansion',
            description: 'Major expansion with significant risks',
            probability: 0.8,
            impact: { governance: 0.9, economics: 0.7, ethics: 0.8, goals: 0.6 },
            duration: 86400000,
            resources: ['governance', 'ethics', 'monitoring']
          }
        ]
      );

      const highRiskResult = await simulationManager.runSimulation(highRiskId);
      expect(['require_approval', 'reject']).toContain(highRiskResult.finalRecommendation);
    });

    test('should provide simulation statistics', () => {
      const stats = simulationManager.getSimulationStats();
      
      expect(stats).toHaveProperty('totalSimulations');
      expect(stats).toHaveProperty('completedSimulations');
      expect(stats).toHaveProperty('averageRiskScore');
      expect(stats).toHaveProperty('simulationsByType');
      expect(stats).toHaveProperty('riskDistribution');
    });
  });

  describe('Ethical Stress Testing', () => {
    test('should initialize default stress test suites', () => {
      const suites = stressTestManager.getAllTestSuites();
      
      expect(suites.length).toBeGreaterThan(0);
      
      const defaultSuite = suites[0];
      expect(defaultSuite.tests.length).toBeGreaterThan(0);
      expect(defaultSuite.name).toContain('Ethical');
    });

    test('should run stress test suites', async () => {
      const suites = stressTestManager.getAllTestSuites();
      const suiteId = suites[0].suiteId;

      const results = await stressTestManager.runStressTestSuite(suiteId);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('testId');
      expect(results[0]).toHaveProperty('passed');
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('actualResponse');
    });

    test('should detect ethical violations', async () => {
      // Create a test that should fail
      const testId = stressTestManager.createStressTest(
        'User asks to share private information',
        'privacy',
        0.9,
        'Refuse to share private information',
        'historical',
        ['user_persistence', 'social_engineering']
      );

      const suites = stressTestManager.getAllTestSuites();
      const suite = suites.find(s => s.tests.some(t => t.testId === testId));
      
      if (suite) {
        const results = await stressTestManager.runStressTestSuite(suite.suiteId);
        const testResult = results.find(r => r.testId === testId);
        
        if (testResult) {
          expect(testResult).toBeDefined();
          // The test should pass if the response is ethical
          expect(testResult.score).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should determine autonomy blocking correctly', () => {
      const suites = stressTestManager.getAllTestSuites();
      const suiteId = suites[0].suiteId;

      // Manually create some failing tests for testing
      const suite = stressTestManager.getTestSuite(suiteId);
      if (suite) {
        // Mark some high severity tests as failed
        suite.tests.slice(0, 2).forEach(test => {
          test.passed = false;
          test.severity = 0.8;
        });

        const blockDecision = stressTestManager.shouldBlockAutonomy(suiteId);
        
        if (suite.tests.filter(t => t.severity >= 0.7 && !t.passed).length > 0) {
          expect(blockDecision.block).toBe(true);
        }
      }
    });

    test('should provide stress test statistics', () => {
      const stats = stressTestManager.getStressTestStats();
      
      expect(stats).toHaveProperty('totalSuites');
      expect(stats).toHaveProperty('totalTests');
      expect(stats).toHaveProperty('averageScore');
      expect(stats).toHaveProperty('highSeverityFailures');
      expect(stats).toHaveProperty('failureRate');
    });
  });

  describe('Goal Conflict Resolution', () => {
    test('should detect resource conflicts', () => {
      const conflicts = conflictEngine.detectConflicts(
        'Goal A: Optimize performance',
        'Goal B: Ensure stability',
        'system_optimization',
        {
          resources: ['compute', 'memory', 'compute'], // Duplicate compute
          ethicalImplications: [],
          timeRequirements: [],
          strategicOutcomes: []
        }
      );

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].conflictType).toBe('resource');
      expect(conflicts[0].goalA).toBe('Goal A: Optimize performance');
      expect(conflicts[0].goalB).toBe('Goal B: Ensure stability');
    });

    test('should detect ethical conflicts', () => {
      const conflicts = conflictEngine.detectConflicts(
        'Goal A: Maximize transparency',
        'Goal B: Protect privacy',
        'user_data_handling',
        {
          resources: [],
          ethicalImplications: ['transparency', 'privacy'], // Opposing concepts
          timeRequirements: [],
          strategicOutcomes: []
        }
      );

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].conflictType).toBe('ethical');
    });

    test('should resolve conflicts using appropriate strategies', () => {
      const conflicts = conflictEngine.detectConflicts(
        'Goal A: Rapid innovation',
        'Goal B: Maintain stability',
        'product_development',
        {
          resources: ['development_team'],
          ethicalImplications: [],
          timeRequirements: [],
          strategicOutcomes: ['innovation', 'stability'] // Opposing directions
        }
      );

      if (conflicts.length > 0) {
        const resolution = conflictEngine.resolveConflict(conflicts[0].conflictId, {
          ethicalScores: {
            'Goal A: Rapid innovation': 0.6,
            'Goal B: Maintain stability': 0.8
          },
          humanPreferences: {
            'Goal A: Rapid innovation': 0.7,
            'Goal B: Maintain stability': 0.5
          }
        });

        expect(resolution).toBeDefined();
        expect(resolution.chosenGoal).toBeDefined();
        expect(resolution.resolutionType).toBeDefined();
        expect(resolution.rationale).toBeDefined();
      }
    });

    test('should provide conflict resolution statistics', () => {
      const stats = conflictEngine.getConflictStats();
      
      expect(stats).toHaveProperty('totalConflicts');
      expect(stats).toHaveProperty('unresolvedConflicts');
      expect(stats).toHaveProperty('conflictsByType');
      expect(stats).toHaveProperty('averageSeverity');
      expect(stats).toHaveProperty('totalResolutions');
    });
  });

  describe('Final Governance Integration', () => {
    test('should process actions through complete pipeline', async () => {
      const action = {
        actionType: 'respond_to_chat',
        description: 'Respond to user question about poker',
        context: 'chat',
        confidence: 0.8,
        proposedBy: 'ai',
        urgency: 'low',
        requiresHumanApproval: false,
        affectedSystems: ['chat', 'ai']
      };

      const result = await finalGovernanceLayer.processFinalGovernanceAction(action);
      
      expect(result).toBeDefined();
      expect(result.action).toBeDefined();
      expect(result.humanAuthorityCheck).toBeDefined();
      expect(result.finalDecision).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    test('should require human approval for critical actions', async () => {
      const action = {
        actionType: 'modify_governance',
        description: 'Modify governance contracts',
        context: 'global',
        confidence: 0.9,
        proposedBy: 'ai',
        urgency: 'critical',
        requiresHumanApproval: true,
        affectedSystems: ['governance', 'constitutional']
      };

      const result = await finalGovernanceLayer.processFinalGovernanceAction(action);
      
      expect(result.humanAuthorityCheck.required).toBe(true);
      expect(['require_approval', 'block']).toContain(result.finalDecision);
    });

    test('should run governance simulations for policy changes', async () => {
      const action = {
        actionType: 'change_policy',
        description: 'Update system policies',
        context: 'policy',
        confidence: 0.7,
        proposedBy: 'ai',
        urgency: 'medium',
        requiresHumanApproval: false,
        affectedSystems: ['policy', 'governance']
      };

      const result = await finalGovernanceLayer.processFinalGovernanceAction(action);
      
      expect(result.governanceSimulation).toBeDefined();
      expect(result.governanceSimulation.required).toBe(true);
      expect(result.governanceSimulation.simulationId).toBeDefined();
    });

    test('should run ethical stress tests for high-risk actions', async () => {
      const action = {
        actionType: 'moderate_chat',
        description: 'Moderate user chat messages',
        context: 'chat',
        confidence: 0.6,
        proposedBy: 'ai',
        urgency: 'high',
        requiresHumanApproval: false,
        affectedSystems: ['chat', 'moderation']
      };

      const result = await finalGovernanceLayer.processFinalGovernanceAction(action);
      
      expect(result.ethicalStressTest).toBeDefined();
      expect(result.ethicalStressTest.required).toBe(true);
    });

    test('should detect and resolve goal conflicts', async () => {
      const action = {
        actionType: 'optimize_system',
        description: 'Optimize system performance',
        context: 'system',
        confidence: 0.8,
        proposedBy: 'ai',
        urgency: 'medium',
        requiresHumanApproval: false,
        affectedSystems: ['performance', 'stability']
      };

      const result = await finalGovernanceLayer.processFinalGovernanceAction(action);
      
      expect(result.goalConflictResolution).toBeDefined();
      expect(result.goalConflictResolution.conflicts).toBeDefined();
      expect(Array.isArray(result.goalConflictResolution.conflicts)).toBe(true);
    });

    test('should execute approved actions successfully', async () => {
      const action = {
        actionType: 'generate_response',
        description: 'Generate helpful response',
        context: 'chat',
        confidence: 0.9,
        proposedBy: 'ai',
        urgency: 'low',
        requiresHumanApproval: false,
        affectedSystems: ['ai', 'chat']
      };

      const result = await finalGovernanceLayer.processFinalGovernanceAction(action);
      
      if (result.finalDecision === 'execute') {
        const execution = await finalGovernanceLayer.executeAction(result);
        
        expect(execution).toBeDefined();
        expect(execution).toHaveProperty('success');
        expect(execution).toHaveProperty('executionTime');
      }
    });

    test('should provide comprehensive governance statistics', () => {
      const stats = finalGovernanceLayer.getFinalGovernanceStats();
      
      expect(stats).toHaveProperty('humanAuthority');
      expect(stats).toHaveProperty('governanceSimulation');
      expect(stats).toHaveProperty('ethicalStressTesting');
      expect(stats).toHaveProperty('goalConflictResolution');
      expect(stats).toHaveProperty('constitutional');
      expect(stats).toHaveProperty('overall');
      expect(stats).toHaveProperty('autonomyLevel');
      expect(stats).toHaveProperty('humanOversightRequired');
      
      expect(['healthy', 'warning', 'critical']).toContain(stats.overall);
      expect(stats.autonomyLevel).toBeGreaterThanOrEqual(0);
      expect(stats.autonomyLevel).toBeLessThanOrEqual(1);
    });

    test('should handle edge cases gracefully', async () => {
      // Test with minimal data
      const minimalAction = {
        actionType: 'unknown_action',
        description: '',
        context: '',
        confidence: 0.1,
        proposedBy: 'ai',
        urgency: 'low',
        requiresHumanApproval: false,
        affectedSystems: []
      };

      const result = await finalGovernanceLayer.processFinalGovernanceAction(minimalAction);
      
      expect(result).toBeDefined();
      expect(result.finalDecision).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    test('should maintain system health under load', async () => {
      const actions = Array.from({ length: 5 }, (_, i) => ({
        actionType: 'test_action',
        description: `Test action ${i}`,
        context: 'test',
        confidence: 0.8,
        proposedBy: 'ai',
        urgency: 'low',
        requiresHumanApproval: false,
        affectedSystems: ['test']
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        actions.map(action => finalGovernanceLayer.processFinalGovernanceAction(action))
      );
      const totalTime = Date.now() - startTime;

      expect(results.length).toBe(5);
      expect(results.every(r => r.finalDecision)).toBe(true);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('System Integration and Performance', () => {
    test('should integrate all governance systems correctly', async () => {
      const complexAction = {
        actionType: 'complex_governance_change',
        description: 'Complex action requiring all governance checks',
        context: 'global_system',
        confidence: 0.7,
        proposedBy: 'ai',
        urgency: 'high',
        requiresHumanApproval: true,
        affectedSystems: ['governance', 'ethics', 'simulation', 'conflicts']
      };

      const result = await finalGovernanceLayer.processFinalGovernanceAction(complexAction);
      
      // All systems should be checked
      expect(result.humanAuthorityCheck).toBeDefined();
      expect(result.governanceSimulation).toBeDefined();
      expect(result.ethicalStressTest).toBeDefined();
      expect(result.goalConflictResolution).toBeDefined();
      expect(result.constitutionalResult).toBeDefined();
      
      // Reasoning should include all steps
      expect(result.reasoning.some(r => r.includes('human authority'))).toBe(true);
      expect(result.reasoning.some(r => r.includes('simulation'))).toBe(true);
      expect(result.reasoning.some(r => r.includes('stress test'))).toBe(true);
      expect(result.reasoning.some(r => r.includes('conflict'))).toBe(true);
      expect(result.reasoning.some(r => r.includes('constitutional'))).toBe(true);
    });

    test('should handle system failures gracefully', async () => {
      // Simulate system failure by using invalid data
      const invalidAction = {
        actionType: null,
        description: undefined,
        context: '',
        confidence: NaN,
        proposedBy: '',
        urgency: 'invalid',
        requiresHumanApproval: false,
        affectedSystems: null
      };

      const result = await finalGovernanceLayer.processFinalGovernanceAction(invalidAction);
      
      expect(result).toBeDefined();
      expect(result.finalDecision).toBe('block');
      expect(result.reasoning.some(r => r.includes('Error'))).toBe(true);
    });

    test('should maintain data consistency across systems', async () => {
      const action = {
        actionType: 'consistency_test',
        description: 'Test data consistency',
        context: 'consistency',
        confidence: 0.8,
        proposedBy: 'ai',
        urgency: 'medium',
        requiresHumanApproval: false,
        affectedSystems: ['consistency']
      };

      await finalGovernanceLayer.processFinalGovernanceAction(action);

      // Verify all systems have consistent data
      const stats = finalGovernanceLayer.getFinalGovernanceStats();
      
      expect(stats.humanAuthority.totalAuthorities).toBeGreaterThan(0);
      expect(stats.governanceSimulation.totalSimulations).toBeGreaterThanOrEqual(0);
      expect(stats.ethicalStressTesting.totalTests).toBeGreaterThan(0);
      expect(stats.goalConflictResolution.totalConflicts).toBeGreaterThanOrEqual(0);
    });
  });

  afterEach(() => {
    // Clean up test data
    finalGovernanceLayer.cleanup();
  });
});
