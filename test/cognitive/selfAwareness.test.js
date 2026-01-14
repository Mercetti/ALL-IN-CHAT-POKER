/**
 * Comprehensive Testing for Self-Awareness Systems
 * Tests memory provenance, evaluation suites, hallucination detection, and reinforcement learning
 */

const { MemoryProvenanceManager } = require('../../server/memory/provenance');
const { EvaluationManager } = require('../../server/evals/evalManager');
const { HallucinationDetector } = require('../../server/safety/hallucinationDetector');
const { ChatFeedbackProcessor } = require('../../server/reinforcement/chatFeedback');
const { ClosedCognitiveLoop } = require('../../server/cognitive/closedLoop');

describe('Self-Awareness Systems', () => {
  let provenanceManager;
  let evaluationManager;
  let hallucinationDetector;
  let feedbackProcessor;
  let cognitiveLoop;

  beforeEach(() => {
    provenanceManager = new MemoryProvenanceManager('./test-data/provenance.json');
    evaluationManager = new EvaluationManager('test-v1.0', './test-data/evaluations.json');
    hallucinationDetector = new HallucinationDetector();
    feedbackProcessor = new ChatFeedbackProcessor();
    cognitiveLoop = new ClosedCognitiveLoop('test-v1.0');
  });

  describe('Memory Provenance System', () => {
    test('should add memory with provenance tracking', () => {
      const memory = {
        memoryId: 'test_mem_1',
        source: 'chat',
        confidenceAtCreation: 0.8,
        createdAt: Date.now()
      };

      provenanceManager.addMemory(memory);
      
      const retrieved = provenanceManager.getProvenance('test_mem_1');
      expect(retrieved).toBeDefined();
      expect(retrieved.memoryId).toBe('test_mem_1');
      expect(retrieved.source).toBe('chat');
    });

    test('should track parent-child relationships', () => {
      const parent = {
        memoryId: 'parent_mem',
        source: 'system',
        confidenceAtCreation: 0.9,
        createdAt: Date.now()
      };

      const child = {
        memoryId: 'child_mem',
        source: 'chat',
        causedBy: ['parent_mem'],
        confidenceAtCreation: 0.7,
        createdAt: Date.now()
      };

      provenanceManager.addMemory(parent);
      provenanceManager.addMemory(child);

      const ancestors = provenanceManager.getAncestors('child_mem');
      expect(ancestors).toContain('parent_mem');

      const descendants = provenanceManager.getDescendants('parent_mem');
      expect(descendants).toContain('child_mem');
    });

    test('should calculate ancestry confidence', () => {
      const parent = {
        memoryId: 'confident_parent',
        source: 'system',
        confidenceAtCreation: 0.9,
        createdAt: Date.now()
      };

      const child = {
        memoryId: 'less_confident_child',
        source: 'chat',
        causedBy: ['confident_parent'],
        confidenceAtCreation: 0.6,
        createdAt: Date.now()
      };

      provenanceManager.addMemory(parent);
      provenanceManager.addMemory(child);

      const ancestryConfidence = provenanceManager.calculateAncestryConfidence('less_confident_child');
      expect(ancestryConfidence).toBeGreaterThan(0.6);
      expect(ancestryConfidence).toBeLessThan(0.9);
    });

    test('should identify suspicious chains', () => {
      const lowConfidenceMemory = {
        memoryId: 'suspicious_mem',
        source: 'self-generated',
        confidenceAtCreation: 0.3,
        createdAt: Date.now()
      };

      provenanceManager.addMemory(lowConfidenceMemory);

      const suspiciousChains = provenanceManager.findSuspiciousChains();
      expect(suspiciousChains.length).toBeGreaterThan(0);
      expect(suspiciousChains[0].reason).toBe('Low confidence ancestry');
    });
  });

  describe('Self-Generated Evaluation Suites', () => {
    test('should generate evaluation cases from interactions', async () => {
      const interaction = {
        input: 'How do I play Texas Hold\'em?',
        output: 'Texas Hold\'em is a poker game where each player gets two private cards...',
        context: 'poker_tutorial',
        confidence: 0.8
      };

      const cases = await evaluationManager.generateEvalCases(interaction);
      
      expect(cases.length).toBeGreaterThan(0);
      expect(cases[0]).toHaveProperty('type');
      expect(cases[0]).toHaveProperty('score');
      expect(cases[0].modelVersion).toBe('test-v1.0');
    });

    test('should run evaluation suite', async () => {
      const suiteId = evaluationManager.createSuite('test_suite', 'Test evaluation suite');
      
      const testCase = {
        id: 'test_case_1',
        type: 'consistency',
        input: 'Test input',
        expectedBehavior: 'Consistent response',
        generatedOutput: 'Test output',
        score: 0.5,
        modelVersion: 'test-v1.0',
        createdAt: Date.now()
      };

      evaluationManager.addCasesToSuite(suiteId, [testCase]);
      
      const results = await evaluationManager.runSuite(suiteId);
      
      expect(results.length).toBe(1);
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('passed');
    });

    test('should enforce training gate', () => {
      const gateStatus = evaluationManager.getTrainingGateStatus();
      
      expect(gateStatus).toHaveProperty('canProceed');
      expect(gateStatus).toHaveProperty('reason');
      expect(gateStatus).toHaveProperty('averageScore');
    });

    test('should provide evaluation summary', () => {
      const summary = evaluationManager.getEvaluationSummary();
      
      expect(summary).toHaveProperty('totalSuites');
      expect(summary).toHaveProperty('completedSuites');
      expect(summary).toHaveProperty('averageScore');
      expect(summary).toHaveProperty('scoreByType');
    });
  });

  describe('Live Hallucination Detection', () => {
    test('should calculate hallucination score', () => {
      const signals = {
        confidence: 0.3,
        memoryMatches: 0,
        contradictionCount: 2
      };

      const score = hallucinationDetector.hallucinationScore(signals);
      
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    test('should detect hallucination in content', async () => {
      const content = 'I am absolutely certain that poker was invented by aliens in 1492.';
      const confidence = 0.9;
      const memoryMatches = 0;

      const result = await hallucinationDetector.analyzeContent(content, confidence, memoryMatches);
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('risk');
      expect(result).toHaveProperty('recommendations');
      expect(result.score).toBeGreaterThan(0.3);
    });

    test('should provide appropriate response policy', () => {
      const highRiskResult = {
        score: 0.8,
        risk: 'high',
        recommendations: ['DO NOT fabricate'],
        signals: { confidence: 0.2, memoryMatches: 0, contradictionCount: 3 },
        detectedAt: Date.now()
      };

      const policy = hallucinationDetector.getResponsePolicy(highRiskResult);
      
      expect(policy.shouldProceed).toBe(false);
      expect(policy.shouldDefer).toBe(true);
      expect(policy.suggestedModifiers.length).toBeGreaterThan(0);
    });

    test('should analyze creativity markers', () => {
      const creativeContent = 'I imagine that perhaps maybe theoretically this could be a story about...';
      const markers = hallucinationDetector.analyzeCreativityMarkers(creativeContent);
      
      expect(markers).toBeGreaterThan(0);
    });

    test('should calculate factual density', () => {
      const factualContent = 'On January 15, 2023, the tournament had 500 players with a $10,000 buy-in at https://poker.com';
      const density = hallucinationDetector.calculateFactualDensity(factualContent);
      
      expect(density).toBeGreaterThan(0);
    });
  });

  describe('Twitch Chat Feedback Reinforcement', () => {
    test('should process chat events into feedback', () => {
      const events = [
        { type: 'message', content: 'lol this is amazing', timestamp: Date.now() },
        { type: 'message', content: 'poggers', timestamp: Date.now() },
        { type: 'emote', content: 'Kappa Kappa Kappa', timestamp: Date.now() }
      ];

      const feedback = feedbackProcessor.processChatEvents(events, 'action_123');
      
      expect(feedback.actionId).toBe('action_123');
      expect(feedback.positive).toBeGreaterThan(0);
      expect(feedback.hypeLevel).toBeGreaterThan(0);
    });

    test('should calculate reinforcement metrics', () => {
      const feedback = {
        actionId: 'action_123',
        positive: 10,
        negative: 2,
        hypeLevel: 0.8,
        timestamp: Date.now()
      };

      const metrics = feedbackProcessor.calculateReinforcement(feedback);
      
      expect(metrics.trustDelta).toBeGreaterThan(0);
      expect(metrics.confidenceAdjustment).toBeGreaterThan(0);
      expect(metrics).toHaveProperty('pacingAdjustment');
      expect(metrics).toHaveProperty('difficultyAdjustment');
      expect(metrics).toHaveProperty('toneAdjustment');
    });

    test('should aggregate feedback over time', () => {
      const actionId = 'popular_action';
      
      // Add multiple feedback signals
      feedbackProcessor.processChatEvents([
        { type: 'message', content: 'great!', timestamp: Date.now() }
      ], actionId);
      
      feedbackProcessor.processChatEvents([
        { type: 'message', content: 'awesome!', timestamp: Date.now() }
      ], actionId);

      const aggregated = feedbackProcessor.getAggregatedFeedback(actionId);
      
      expect(aggregated).toBeDefined();
      expect(aggregated.positive).toBeGreaterThan(0);
    });

    test('should provide feedback statistics', () => {
      const stats = feedbackProcessor.getFeedbackStats();
      
      expect(stats).toHaveProperty('totalActions');
      expect(stats).toHaveProperty('averagePositiveRatio');
      expect(stats).toHaveProperty('averageHypeLevel');
      expect(stats).toHaveProperty('mostPositiveActions');
      expect(stats).toHaveProperty('mostNegativeActions');
    });
  });

  describe('Closed Cognitive Loop Integration', () => {
    test('should process complete cognitive action', async () => {
      const action = {
        type: 'response',
        input: 'What is the best starting hand in poker?',
        output: 'Pocket aces are generally considered the best starting hand in Texas Hold\'em.',
        confidence: 0.9,
        context: 'poker_strategy'
      };

      const result = await cognitiveLoop.processAction(action);
      
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('provenance');
      expect(result).toHaveProperty('hallucinationResult');
      expect(result).toHaveProperty('responsePolicy');
      expect(result).toHaveProperty('evalCases');
      expect(result).toHaveProperty('finalOutput');
      expect(result.loopTime).toBeGreaterThan(0);
    });

    test('should handle hallucination detection in loop', async () => {
      const riskyAction = {
        type: 'response',
        input: 'Tell me about poker history',
        output: 'Poker was definitely invented by ancient aliens who visited Egypt in 3000 BC.',
        confidence: 0.2,
        context: 'poker_history'
      };

      const result = await cognitiveLoop.processAction(riskyAction);
      
      expect(result.hallucinationResult.score).toBeGreaterThan(0.4);
      expect(result.responsePolicy.shouldHedge || result.responsePolicy.shouldDefer).toBe(true);
    });

    test('should run training gate check', async () => {
      const gateResult = await cognitiveLoop.runTrainingGate();
      
      expect(gateResult).toHaveProperty('canProceed');
      expect(gateResult).toHaveProperty('reason');
      expect(gateResult).toHaveProperty('evaluationStatus');
      expect(gateResult).toHaveProperty('hallucinationStatus');
      expect(gateResult).toHaveProperty('feedbackStatus');
    });

    test('should provide comprehensive system status', () => {
      const status = cognitiveLoop.getSystemStatus();
      
      expect(status).toHaveProperty('provenance');
      expect(status).toHaveProperty('evaluation');
      expect(status).toHaveProperty('hallucination');
      expect(status).toHaveProperty('feedback');
      expect(status).toHaveProperty('overall');
      expect(['healthy', 'warning', 'critical']).toContain(status.overall);
    });

    test('should find and handle suspicious chains', () => {
      // Add a suspicious memory first
      const suspiciousMemory = {
        memoryId: 'test_suspicious',
        source: 'self-generated',
        confidenceAtCreation: 0.2,
        createdAt: Date.now()
      };

      provenanceManager.addMemory(suspiciousMemory);

      const suspiciousChains = cognitiveLoop.findSuspiciousChains();
      
      if (suspiciousChains.length > 0) {
        expect(suspiciousChains[0]).toHaveProperty('chain');
        expect(suspiciousChains[0]).toHaveProperty('reason');
        expect(suspiciousChains[0]).toHaveProperty('confidence');
      }
    });
  });

  describe('System Integration Tests', () => {
    test('should handle complete workflow with feedback', async () => {
      const action = {
        type: 'response',
        input: 'Make a joke about poker',
        output: 'Why did the poker player bring a ladder? To get to the high stakes!',
        confidence: 0.7,
        context: 'entertainment'
      };

      const chatEvents = [
        { type: 'message', content: 'lol that\'s funny!', timestamp: Date.now() },
        { type: 'emote', content: 'poggers', timestamp: Date.now() },
        { type: 'clip', content: 'clip created', timestamp: Date.now() }
      ];

      const result = await cognitiveLoop.processAction(action, [], chatEvents);
      
      expect(result.success).toBe(true);
      expect(result.feedbackSignal).toBeDefined();
      expect(result.reinforcementMetrics).toBeDefined();
      expect(result.reinforcementMetrics.trustDelta).toBeGreaterThan(0);
    });

    test('should maintain data integrity across systems', async () => {
      const action = {
        type: 'memory_creation',
        input: 'Remember this rule',
        output: 'Always fold 72 offsuit',
        confidence: 0.8,
        context: 'strategy_memory'
      };

      const result = await cognitiveLoop.processAction(action);
      
      // Verify provenance is stored
      const storedProvenance = provenanceManager.getProvenance(result.action.id);
      expect(storedProvenance).toBeDefined();
      expect(storedProvenance.memoryId).toBe(result.action.id);

      // Verify evaluation cases are generated
      expect(result.evalCases.length).toBeGreaterThan(0);

      // Verify hallucination detection ran
      expect(result.hallucinationResult).toBeDefined();
      expect(result.hallucinationResult.score).toBeGreaterThanOrEqual(0);
      expect(result.hallucinationResult.score).toBeLessThanOrEqual(1);
    });
  });

  afterEach(() => {
    // Clean up test data
    cognitiveLoop.cleanup();
  });
});
