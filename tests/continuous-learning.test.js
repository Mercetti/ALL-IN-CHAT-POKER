/**
 * Test Continuous Learning System
 */

const AudioCodingOrchestrator = require('../server/audioCodingOrchestrator');
const { TaskType } = require('../server/utils/learningSchema');

// Mock the AI system for testing
jest.mock('../server/ai', () => ({
  getUnifiedAI: () => ({
    generateResponse: jest.fn().mockResolvedValue('Mock AI response for testing')
  })
}));

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

  it('should initialize correctly', () => {
    expect(orchestrator).toBeDefined();
    expect(orchestrator.learningEnabled).toBe(true);
    
    const stats = orchestrator.getStats();
    expect(stats.totalTasks).toBe(0);
    expect(stats.completedTasks).toBe(0);
  });

  it('should add tasks to queue', () => {
    const task = orchestrator.addTask(TaskType.CHAT, 'Hello, how are you?');
    
    expect(task).toBeDefined();
    expect(task.taskType).toBe(TaskType.CHAT);
    expect(task.prompt).toBe('Hello, how are you?');
    
    const stats = orchestrator.getStats();
    expect(stats.totalTasks).toBe(1);
    expect(stats.queueLength).toBe(1);
  });

  it('should get learning statistics', () => {
    const stats = orchestrator.getLearningStats();
    
    expect(typeof stats).toBe('object');
    expect(stats).toHaveProperty('chat');
    expect(stats).toHaveProperty('coding');
    expect(stats).toHaveProperty('graphics');
    expect(stats).toHaveProperty('cosmetic');
  });

  it('should export learning data', () => {
    const data = orchestrator.exportLearningData(TaskType.CHAT, 'json');
    
    // Should return null if no data exists yet
    expect(data === null || typeof data === 'string').toBe(true);
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

  it('should handle different task types', () => {
    const chatTask = orchestrator.addTask(TaskType.CHAT, 'Chat message');
    const codingTask = orchestrator.addTask(TaskType.CODING, 'Write code', { language: 'javascript' });
    const audioTask = orchestrator.addTask(TaskType.AUDIO, 'Generate sound');
    
    expect(chatTask.taskType).toBe(TaskType.CHAT);
    expect(codingTask.taskType).toBe(TaskType.CODING);
    expect(audioTask.taskType).toBe(TaskType.AUDIO);
    
    const stats = orchestrator.getStats();
    expect(stats.totalTasks).toBe(3);
    expect(stats.queueLength).toBe(3);
  });

  it('should validate task types', () => {
    expect(() => {
      orchestrator.addTask('invalid_type', 'test');
    }).toThrow();
  });
});
