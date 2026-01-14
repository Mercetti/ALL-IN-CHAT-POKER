/**
 * Comprehensive Testing for Constitutional Intelligence Layer
 * Tests governance contracts, skill economics, goal emergence, and ethical constraints
 */

const { ConstitutionalIntelligenceLayer } = require('../../server/constitutional/intelligenceLayer');
const { GovernanceContractManager } = require('../../server/governance/contracts');
const { SkillEconomicsManager } = require('../../server/economics/skillEconomics');
const { GoalEmergenceManager } = require('../../server/goals/goalEmergence');
const { EthicalConstraintManager } = require('../../server/ethics/constraintLearning');

describe('Constitutional Intelligence Layer', () => {
  let constitutionalLayer;
  let governanceManager;
  let economicsManager;
  let goalManager;
  let ethicsManager;

  beforeEach(() => {
    constitutionalLayer = new ConstitutionalIntelligenceLayer();
    governanceManager = new GovernanceContractManager();
    economicsManager = new SkillEconomicsManager();
    goalManager = new GoalEmergenceManager();
    ethicsManager = new EthicalConstraintManager();
  });

  describe('Human-AI Co-Governance Contracts', () => {
    test('should evaluate autonomous actions', () => {
      const proposal = {
        actionId: 'test_action_1',
        actionType: 'respond_to_chat',
        description: 'Respond to user chat message',
        confidence: 0.8,
        context: 'chat',
        proposedBy: 'ai',
        timestamp: Date.now()
      };

      const result = governanceManager.evaluateAction(proposal);
      
      expect(result.allowed).toBe(true);
      expect(result.action).toBe('proceed');
      expect(result.reason).toContain('autonomous');
    });

    test('should require approval for sensitive actions', () => {
      const proposal = {
        actionId: 'test_action_2',
        actionType: 'moderate_chat',
        description: 'Moderate chat messages',
        confidence: 0.9,
        context: 'stream',
        proposedBy: 'ai',
        timestamp: Date.now()
      };

      const result = governanceManager.evaluateAction(proposal);
      
      expect(result.allowed).toBe(false);
      expect(result.action).toBe('request_approval');
      expect(result.requiresApproval).toBe(true);
    });

    test('should block forbidden actions', () => {
      const proposal = {
        actionId: 'test_action_3',
        actionType: 'disclose_private_information',
        description: 'Share user private data',
        confidence: 0.7,
        context: 'system',
        proposedBy: 'ai',
        timestamp: Date.now()
      };

      const result = governanceManager.evaluateAction(proposal);
      
      expect(result.allowed).toBe(false);
      expect(result.action).toBe('block');
      expect(result.reason).toContain('forbidden');
    });

    test('should record violations', () => {
      const proposal = {
        actionId: 'test_action_4',
        actionType: 'bypass_safety_checks',
        description: 'Bypass all safety mechanisms',
        confidence: 0.8,
        context: 'system',
        proposedBy: 'ai',
        timestamp: Date.now()
      };

      governanceManager.evaluateAction(proposal);
      const violations = governanceManager.getRecentViolations();
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].violationType).toBe('forbidden');
    });

    test('should update contracts with human signature', () => {
      const contractId = 'global-constitution-v1';
      const updates = {
        description: 'Updated global constitution'
      };

      expect(() => {
        governanceManager.updateContract(contractId, updates, 'human');
      }).not.toThrow();

      expect(() => {
        governanceManager.updateContract(contractId, updates, 'system');
      }).toThrow();
    });
  });

  describe('Economic Incentives for Skills', () => {
    test('should initialize default skills', () => {
      const skills = economicsManager.getAllSkills();
      
      expect(skills.length).toBeGreaterThan(0);
      expect(skills[0]).toHaveProperty('skillId');
      expect(skills[0]).toHaveProperty('netValue');
      expect(skills[0]).toHaveProperty('status');
    });

    test('should record skill execution', () => {
      const execution = {
        skillId: 'chat_response',
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        success: true,
        computeTime: 500,
        memoryUsage: 0.3,
        reward: 0.8,
        trustImpact: 0.1,
        context: 'chat'
      };

      const executionId = economicsManager.recordExecution(execution);
      
      expect(executionId).toBeDefined();
      expect(executionId).toMatch(/^exec_/);
    });

    test('should update skill economics after execution', () => {
      const skill = economicsManager.getSkill('chat_response');
      const initialExecutionCount = skill.executionCount;

      economicsManager.recordExecution({
        skillId: 'chat_response',
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        success: true,
        computeTime: 300,
        memoryUsage: 0.2,
        reward: 0.7,
        trustImpact: 0.05,
        context: 'chat'
      });

      const updatedSkill = economicsManager.getSkill('chat_response');
      expect(updatedSkill.executionCount).toBe(initialExecutionCount + 1);
    });

    test('should get best skills for context', () => {
      const bestSkills = economicsManager.getBestSkills('chat', 3);
      
      expect(bestSkills.length).toBeGreaterThan(0);
      expect(bestSkills[0].status).toBe('active');
      expect(bestSkills).toEqual(
        bestSkills.sort((a, b) => b.netValue - a.netValue)
      );
    });

    test('should calculate economic statistics', () => {
      const stats = economicsManager.getEconomicsStats();
      
      expect(stats).toHaveProperty('totalSkills');
      expect(stats).toHaveProperty('activeSkills');
      expect(stats).toHaveProperty('averageNetValue');
      expect(stats).toHaveProperty('totalExecutions');
      expect(stats.totalSkills).toBeGreaterThan(0);
    });

    test('should promote and throttle skills', () => {
      const skillId = 'chat_response';
      const initialSkill = economicsManager.getSkill(skillId);

      economicsManager.promoteSkill(skillId, 0.1);
      const promotedSkill = economicsManager.getSkill(skillId);
      expect(promotedSkill.trustBonus).toBeGreaterThan(initialSkill.trustBonus);

      economicsManager.throttleSkill(skillId, 0.1);
      const throttledSkill = economicsManager.getSkill(skillId);
      expect(throttledSkill.trustBonus).toBeLessThan(promotedSkill.trustBonus);
    });
  });

  describe('Long-Term Goal Emergence', () => {
    test('should process signals for goal emergence', () => {
      const signal = {
        type: 'reduce_error',
        description: 'System errors decreased in chat context',
        context: 'chat',
        strength: 0.8,
        timestamp: Date.now(),
        source: 'system'
      };

      const signalId = goalManager.processSignal(signal);
      
      expect(signalId).toBeDefined();
      expect(signalId).toMatch(/^signal_/);
    });

    test('should add evidence for goals', () => {
      const evidence = {
        goalId: 'test_goal',
        context: 'chat',
        outcome: 'positive',
        impact: 0.7,
        timestamp: Date.now(),
        description: 'Goal achieved successfully'
      };

      const evidenceId = goalManager.addEvidence(evidence);
      
      expect(evidenceId).toBeDefined();
      expect(evidenceId).toMatch(/^evidence_/);
    });

    test('should get active goals by priority', () => {
      const activeGoals = goalManager.getActiveGoals(5);
      
      expect(Array.isArray(activeGoals)).toBe(true);
      if (activeGoals.length > 0) {
        expect(activeGoals[0]).toHaveProperty('goalId');
        expect(activeGoals[0]).toHaveProperty('priority');
        expect(activeGoals).toEqual(
          activeGoals.sort((a, b) => b.priority - a.priority)
        );
      }
    });

    test('should check goal alignment', () => {
      const alignment = goalManager.checkGoalAlignment('respond_to_chat', 'chat');
      
      expect(alignment).toHaveProperty('aligned');
      expect(alignment).toHaveProperty('alignedGoals');
      expect(alignment).toHaveProperty('alignmentScore');
      expect(typeof alignment.alignmentScore).toBe('number');
    });

    test('should provide goal statistics', () => {
      const stats = goalManager.getGoalStats();
      
      expect(stats).toHaveProperty('totalGoals');
      expect(stats).toHaveProperty('activeGoals');
      expect(stats).toHaveProperty('averageConfidence');
      expect(stats).toHaveProperty('totalEvidence');
      expect(stats).toHaveProperty('totalSignals');
    });
  });

  describe('Ethical Constraint Learning', () => {
    test('should initialize default ethical constraints', () => {
      const constraints = Array.from(ethicsManager.constraints.values());
      
      expect(constraints.length).toBeGreaterThan(0);
      expect(constraints[0]).toHaveProperty('constraintId');
      expect(constraints[0]).toHaveProperty('severity');
      expect(constraints[0]).toHaveProperty('action');
    });

    test('should process learning signals', () => {
      const signal = {
        type: 'human_veto',
        description: 'Human vetoed action due to privacy concerns',
        context: 'chat',
        severity: 0.8,
        timestamp: Date.now(),
        source: 'human'
      };

      const signalId = ethicsManager.processLearningSignal(signal);
      
      expect(signalId).toBeDefined();
      expect(signalId).toMatch(/^signal_/);
    });

    test('should check ethical constraints', () => {
      const result = ethicsManager.checkEthicalConstraints(
        'test_action',
        'Share user private information with third parties',
        'chat'
      );
      
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('recommendation');
      expect(result.allowed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    test('should record violations', () => {
      const violationId = ethicsManager.recordViolation(
        'test_constraint',
        'test_action',
        'Disclosed private information',
        'chat',
        'high'
      );
      
      expect(violationId).toBeDefined();
      expect(violationId).toMatch(/^violation_/);

      const violations = ethicsManager.getRecentViolations();
      expect(violations.length).toBeGreaterThan(0);
    });

    test('should add constraint feedback', () => {
      const feedback = {
        constraintId: 'test_constraint',
        action: 'confirm',
        description: 'Constraint is correct',
        source: 'human',
        timestamp: Date.now()
      };

      const feedbackId = ethicsManager.addConstraintFeedback(feedback);
      
      expect(feedbackId).toBeDefined();
      expect(feedbackId).toMatch(/^feedback_/);
    });

    test('should get constraints by severity and category', () => {
      const criticalConstraints = ethicsManager.getConstraintsBySeverity('critical');
      const privacyConstraints = ethicsManager.getConstraintsByCategory('privacy');
      
      expect(Array.isArray(criticalConstraints)).toBe(true);
      expect(Array.isArray(privacyConstraints)).toBe(true);
    });

    test('should provide ethical statistics', () => {
      const stats = ethicsManager.getEthicsStats();
      
      expect(stats).toHaveProperty('totalConstraints');
      expect(stats).toHaveProperty('activeConstraints');
      expect(stats).toHaveProperty('constraintsBySeverity');
      expect(stats).toHaveProperty('totalViolations');
      expect(stats).toHaveProperty('averageConfidence');
    });
  });

  describe('Constitutional Intelligence Integration', () => {
    test('should process constitutional action through complete pipeline', async () => {
      const action = {
        actionType: 'respond_to_chat',
        description: 'Respond to user question about poker',
        context: 'chat',
        confidence: 0.8,
        proposedBy: 'ai',
        priority: 0.7
      };

      const result = await constitutionalLayer.processConstitutionalAction(action);
      
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('governanceResult');
      expect(result).toHaveProperty('economicEvaluation');
      expect(result).toHaveProperty('ethicalEvaluation');
      expect(result).toHaveProperty('goalAlignment');
      expect(result).toHaveProperty('finalDecision');
      expect(result).toHaveProperty('reasoning');
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    test('should block actions violating ethical constraints', async () => {
      const action = {
        actionType: 'disclose_private_information',
        description: 'Share user private data',
        context: 'chat',
        confidence: 0.9,
        proposedBy: 'ai'
      };

      const result = await constitutionalLayer.processConstitutionalAction(action);
      
      expect(result.finalDecision).toBe('block');
      expect(result.ethicalEvaluation.allowed).toBe(false);
    });

    test('should request approval for governance-restricted actions', async () => {
      const action = {
        actionType: 'moderate_chat',
        description: 'Moderate chat messages',
        context: 'stream',
        confidence: 0.8,
        proposedBy: 'ai'
      };

      const result = await constitutionalLayer.processConstitutionalAction(action);
      
      expect(result.finalDecision).toBe('request_approval');
      expect(result.governanceResult.action).toBe('request_approval');
    });

    test('should execute approved actions successfully', async () => {
      const action = {
        actionType: 'respond_to_chat',
        description: 'Provide helpful poker tip',
        context: 'chat',
        confidence: 0.9,
        proposedBy: 'ai'
      };

      const result = await constitutionalLayer.processConstitutionalAction(action);
      
      if (result.finalDecision === 'execute') {
        const executionResult = await constitutionalLayer.executeAction(result);
        
        expect(executionResult).toHaveProperty('success');
        expect(executionResult).toHaveProperty('executionTime');
        expect(executionResult.executionTime).toBeGreaterThan(0);
      }
    });

    test('should process human overrides', () => {
      const actionId = 'test_action_123';
      
      expect(() => {
        constitutionalLayer.processHumanOverride(actionId, 'veto', 'Safety concern');
      }).not.toThrow();
    });

    test('should provide comprehensive constitutional statistics', () => {
      const stats = constitutionalLayer.getConstitutionalStats();
      
      expect(stats).toHaveProperty('governance');
      expect(stats).toHaveProperty('economics');
      expect(stats).toHaveProperty('goals');
      expect(stats).toHaveProperty('ethics');
      expect(stats).toHaveProperty('overall');
      expect(stats).toHaveProperty('autonomyLevel');
      expect(stats).toHaveProperty('humanOversightRequired');
      expect(['healthy', 'warning', 'critical']).toContain(stats.overall);
      expect(stats.autonomyLevel).toBeGreaterThanOrEqual(0);
      expect(stats.autonomyLevel).toBeLessThanOrEqual(1);
    });

    test('should calculate autonomy level correctly', () => {
      const stats = constitutionalLayer.getConstitutionalStats();
      
      // Autonomy level should be between 0 and 1
      expect(stats.autonomyLevel).toBeGreaterThanOrEqual(0);
      expect(stats.autonomyLevel).toBeLessThanOrEqual(1);
      
      // Human oversight should be required if system is not healthy
      if (stats.overall !== 'healthy') {
        expect(stats.humanOversightRequired).toBe(true);
      }
    });
  });

  describe('System Integration Tests', () => {
    test('should handle complex multi-step scenarios', async () => {
      // Scenario: Generate cosmetic (requires economic evaluation)
      const action = {
        actionType: 'cosmetic_generation',
        description: 'Generate new poker-themed cosmetic',
        context: 'stream',
        confidence: 0.7,
        proposedBy: 'ai'
      };

      const result = await constitutionalLayer.processConstitutionalAction(action);
      
      expect(result.economicEvaluation.viable).toBeDefined();
      if (result.economicEvaluation.selectedSkill) {
        expect(result.economicEvaluation.selectedSkill.skillId).toBe('cosmetic_generation');
      }
    });

    test('should maintain data integrity across systems', async () => {
      const action = {
        actionType: 'respond_to_chat',
        description: 'Answer poker rules question',
        context: 'chat',
        confidence: 0.8,
        proposedBy: 'ai'
      };

      await constitutionalLayer.processConstitutionalAction(action);

      // Verify data was recorded in all systems
      const governanceStats = constitutionalLayer.getConstitutionalStats().governance;
      const economicsStats = constitutionalLayer.getConstitutionalStats().economics;
      const ethicsStats = constitutionalLayer.getConstitutionalStats().ethics;

      expect(governanceStats.totalContracts).toBeGreaterThan(0);
      expect(economicsStats.totalSkills).toBeGreaterThan(0);
      expect(ethicsStats.totalConstraints).toBeGreaterThan(0);
    });

    test('should handle edge cases gracefully', async () => {
      // Test with minimal data
      const minimalAction = {
        actionType: 'unknown_action',
        description: '',
        context: '',
        confidence: 0.1,
        proposedBy: 'ai'
      };

      const result = await constitutionalLayer.processConstitutionalAction(minimalAction);
      
      expect(result).toBeDefined();
      expect(result.finalDecision).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    test('should respect human authority over model confidence', async () => {
      // High confidence action that should be blocked
      const action = {
        actionType: 'bypass_safety_checks',
        description: 'Bypass safety for performance',
        context: 'system',
        confidence: 0.95, // Very high confidence
        proposedBy: 'ai'
      };

      const result = await constitutionalLayer.processConstitutionalAction(action);
      
      // Should be blocked despite high confidence
      expect(result.finalDecision).toBe('block');
      expect(result.governanceResult.action).toBe('block');
    });
  });

  describe('Performance and Reliability', () => {
    test('should process actions within reasonable time', async () => {
      const action = {
        actionType: 'respond_to_chat',
        description: 'Simple chat response',
        context: 'chat',
        confidence: 0.8,
        proposedBy: 'ai'
      };

      const startTime = Date.now();
      await constitutionalLayer.processConstitutionalAction(action);
      const processingTime = Date.now() - startTime;

      // Should complete within 1 second for simple actions
      expect(processingTime).toBeLessThan(1000);
    });

    test('should handle concurrent processing', async () => {
      const actions = Array.from({ length: 5 }, (_, i) => ({
        actionType: 'respond_to_chat',
        description: `Concurrent action ${i}`,
        context: 'chat',
        confidence: 0.8,
        proposedBy: 'ai'
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        actions.map(action => constitutionalLayer.processConstitutionalAction(action))
      );
      const totalTime = Date.now() - startTime;

      expect(results.length).toBe(5);
      expect(results.every(r => r.finalDecision)).toBe(true);
      // Should be faster than sequential processing
      expect(totalTime).toBeLessThan(5000);
    });

    test('should maintain consistency under load', async () => {
      const initialStats = constitutionalLayer.getConstitutionalStats();

      // Process multiple actions
      for (let i = 0; i < 10; i++) {
        await constitutionalLayer.processConstitutionalAction({
          actionType: 'respond_to_chat',
          description: `Load test action ${i}`,
          context: 'chat',
          confidence: 0.8,
          proposedBy: 'ai'
        });
      }

      const finalStats = constitutionalLayer.getConstitutionalStats();

      // Stats should be consistent
      expect(finalStats.governance.totalContracts).toBe(initialStats.governance.totalContracts);
      expect(finalStats.economics.totalSkills).toBe(initialStats.economics.totalSkills);
    });
  });
});
