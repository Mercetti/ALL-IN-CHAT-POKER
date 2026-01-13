/**
 * Test Continuous Learning System
 */

const AudioCodingOrchestrator = require('../server/audioCodingOrchestrator');
const { TaskType } = require('../server/utils/learningSchema');

describe('Continuous Learning System', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new AudioCodingOrchestrator({
      learningEnabled: true,
      autoApprove: false,
      continuousLearningEnabled: true,
      autoFineTune: false,
      fineTuneBatchSize: 5 // Small batch for testing
    });
  });

  it('should process a chat task and add to learning dataset', async () => {
    const task = orchestrator.addTask(TaskType.CHAT, 'Hello, how are you?');
    const result = await orchestrator.processTask(task);

    expect(result).toBeDefined();
    expect(result.taskType).toBe(TaskType.CHAT);
    expect(result.content).toBeDefined();
    expect(result.approved).toBe(false); // Auto-approve disabled

    // Check learning stats
    const stats = orchestrator.getStats();
    expect(stats.completedTasks).toBe(1);
    expect(stats.approvedTasks).toBe(0);
    expect(stats.rejectedTasks).toBe(1);
  });

  it('should process batch tasks correctly', async () => {
    const tasks = [
      { taskType: TaskType.CHAT, prompt: 'Task 1' },
      { taskType: TaskType.CHAT, prompt: 'Task 2' },
      { taskType: TaskType.CODING, prompt: 'Write a function', parameters: { language: 'javascript' } }
    ];

    const taskObjects = tasks.map(t => orchestrator.addTask(t.taskType, t.prompt, t.parameters || {}));
    const results = await orchestrator.runBatch(taskObjects);

    expect(results).toHaveLength(3);
    expect(results[0].taskType).toBe(TaskType.CHAT);
    expect(results[2].taskType).toBe(TaskType.CODING);

    const stats = orchestrator.getStats();
    expect(stats.completedTasks).toBe(3);
  });

  it('should handle auto-approval correctly', async () => {
    const autoApproveOrchestrator = new AudioCodingOrchestrator({
      learningEnabled: true,
      autoApprove: true,
      continuousLearningEnabled: true
    });

    const task = autoApproveOrchestrator.addTask(TaskType.CHAT, 'Simple test');
    const result = await autoApproveOrchestrator.processTask(task);

    // Should be auto-approved if confidence is high enough
    expect(result.approved).toBeDefined();
  });

  it('should export learning data', () => {
    const data = orchestrator.exportLearningData(TaskType.CHAT, 'json');
    
    // Should return null if no data exists yet
    expect(data === null || typeof data === 'string').toBe(true);
  });

  it('should get learning statistics', () => {
    const stats = orchestrator.getLearningStats();
    
    expect(typeof stats).toBe('object');
    expect(stats).toHaveProperty('chat');
    expect(stats).toHaveProperty('coding');
    expect(stats).toHaveProperty('graphics');
    expect(stats).toHaveProperty('cosmetic');
  });

  it('should configure learning settings', () => {
    orchestrator.configureLearning({
      enabled: true,
      autoFineTune: true,
      batchSize: 10
    });

    const stats = orchestrator.getStats();
    expect(stats.learningEnabled).toBe(true);
  });
});
