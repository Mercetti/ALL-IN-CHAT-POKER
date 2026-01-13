/**
 * Enhanced AI Orchestrator with Continuous Learning Integration
 */

const Logger = require('./logger');
const { getUnifiedAI } = require('./ai');
const ContinuousLearningLoop = require('./utils/continuousLearning');
const { TaskType, AceyOutput, AceyTask, isAutoApproved } = require('./utils/learningSchema');

const logger = new Logger('ai-orchestrator');

class AudioCodingOrchestrator {
  constructor(options = {}) {
    this.unifiedAI = getUnifiedAI();
    this.learningEnabled = options.learningEnabled !== false;
    this.autoApprove = options.autoApprove !== false;
    
    // Initialize continuous learning
    if (this.learningEnabled) {
      this.continuousLearning = new ContinuousLearningLoop(this, {
        datasetDir: options.datasetDir,
        fineTuneBatchSize: options.fineTuneBatchSize || 50,
        autoFineTune: options.autoFineTune || false,
        enabled: options.continuousLearningEnabled !== false
      });
    }
    
    // Task queue and processing
    this.taskQueue = [];
    this.processing = false;
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      approvedTasks: 0,
      rejectedTasks: 0,
      averageProcessingTime: 0
    };
  }

  /**
   * Process a single task
   */
  async processTask(task) {
    const startTime = Date.now();
    
    try {
      logger.info(`Processing ${task.taskType} task: ${task.id}`);
      
      let result;
      switch (task.taskType) {
        case TaskType.AUDIO:
          result = await this.processAudioTask(task);
          break;
        case TaskType.CODING:
          result = await this.processCodingTask(task);
          break;
        case TaskType.GRAPHICS:
          result = await this.processGraphicsTask(task);
          break;
        case TaskType.CHAT:
          result = await this.processChatTask(task);
          break;
        case TaskType.COSMETIC:
          result = await this.processCosmeticTask(task);
          break;
        case TaskType.ADMIN:
          result = await this.processAdminTask(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.taskType}`);
      }

      const processingTime = Date.now() - startTime;
      
      // Create AceyOutput
      const output = new AceyOutput({
        taskType: task.taskType,
        content: result.content,
        metadata: result.metadata || {},
        confidence: result.confidence || 0.8,
        processingTime: processingTime
      });

      // Auto-approval logic
      const approved = this.autoApprove ? isAutoApproved(output, task.taskType) : false;
      output.approved = approved;

      // Update statistics
      this.updateStats(approved, processingTime);

      // Feed to continuous learning if enabled
      if (this.learningEnabled && this.continuousLearning) {
        this.continuousLearning.processOutput(
          task.taskType,
          task.prompt,
          output.toJSON(),
          approved,
          {
            taskId: task.id,
            parameters: task.parameters,
            processingTime: processingTime
          }
        );
      }

      logger.info(`Task ${task.id} completed, approved: ${approved}`);
      return output;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error(`Task ${task.id} failed:`, error);
      
      // Create error output
      const errorOutput = new AceyOutput({
        taskType: task.taskType,
        content: { error: error.message },
        metadata: { error: true },
        confidence: 0,
        processingTime: processingTime,
        approved: false
      });

      // Still log to learning system for analysis
      if (this.learningEnabled && this.continuousLearning) {
        this.continuousLearning.processOutput(
          task.taskType,
          task.prompt,
          errorOutput.toJSON(),
          false,
          { error: error.message, processingTime }
        );
      }

      throw error;
    }
  }

  /**
   * Process audio generation task
   */
  async processAudioTask(task) {
    const prompt = `Generate audio for poker game: ${task.prompt}`;
    
    const response = await this.unifiedAI.generateResponse(prompt, {
      systemPrompt: 'You are an audio generation AI for a poker game. Generate audio descriptions and parameters.',
      maxTokens: 500,
      temperature: 0.7
    });

    return {
      content: {
        type: 'audio_description',
        description: response,
        parameters: task.parameters || {}
      },
      confidence: 0.8,
      metadata: { taskType: 'audio' }
    };
  }

  /**
   * Process coding task
   */
  async processCodingTask(task) {
    const prompt = `Code task for poker game: ${task.prompt}`;
    
    const response = await this.unifiedAI.generateResponse(prompt, {
      systemPrompt: 'You are a coding assistant for a poker game. Provide clean, functional code.',
      maxTokens: 2000,
      temperature: 0.3
    });

    return {
      content: {
        type: 'code',
        language: task.parameters?.language || 'javascript',
        code: response,
        description: task.parameters?.description || ''
      },
      confidence: 0.9,
      metadata: { taskType: 'coding', language: task.parameters?.language }
    };
  }

  /**
   * Process graphics task
   */
  async processGraphicsTask(task) {
    const prompt = `Generate graphics description for poker game: ${task.prompt}`;
    
    const response = await this.unifiedAI.generateResponse(prompt, {
      systemPrompt: 'You are a graphics designer for a poker game. Describe visual elements and designs.',
      maxTokens: 800,
      temperature: 0.8
    });

    return {
      content: {
        type: 'graphics_description',
        description: response,
        style: task.parameters?.style || 'modern',
        format: task.parameters?.format || 'png'
      },
      confidence: 0.7,
      metadata: { taskType: 'graphics' }
    };
  }

  /**
   * Process chat task
   */
  async processChatTask(task) {
    const response = await this.unifiedAI.generateResponse(task.prompt, {
      systemPrompt: 'You are Acey, the friendly poker game AI assistant. Be helpful and engaging.',
      maxTokens: 300,
      temperature: 0.9
    });

    return {
      content: {
        type: 'chat_response',
        message: response,
        persona: 'acey'
      },
      confidence: 0.8,
      metadata: { taskType: 'chat' }
    };
  }

  /**
   * Process cosmetic generation task
   */
  async processCosmeticTask(task) {
    const prompt = `Generate cosmetic item for poker game: ${task.prompt}`;
    
    const response = await this.unifiedAI.generateResponse(prompt, {
      systemPrompt: 'You are a cosmetic designer for a poker game. Create item descriptions and attributes.',
      maxTokens: 600,
      temperature: 0.7
    });

    return {
      content: {
        type: 'cosmetic_item',
        description: response,
        rarity: task.parameters?.rarity || 'common',
        category: task.parameters?.category || 'general'
      },
      confidence: 0.75,
      metadata: { taskType: 'cosmetic' }
    };
  }

  /**
   * Process admin task
   */
  async processAdminTask(task) {
    const prompt = `Admin task for poker game management: ${task.prompt}`;
    
    const response = await this.unifiedAI.generateResponse(prompt, {
      systemPrompt: 'You are an admin assistant for poker game management. Provide actionable insights and recommendations.',
      maxTokens: 1000,
      temperature: 0.5
    });

    return {
      content: {
        type: 'admin_response',
        analysis: response,
        recommendations: [],
        priority: task.parameters?.priority || 'normal'
      },
      confidence: 0.85,
      metadata: { taskType: 'admin' }
    };
  }

  /**
   * Process batch of tasks
   */
  async runBatch(tasks) {
    logger.info(`Processing batch of ${tasks.length} tasks`);
    const results = [];
    
    for (const task of tasks) {
      try {
        const result = await this.processTask(task);
        results.push(result);
      } catch (error) {
        logger.error(`Batch task failed:`, error);
        // Continue processing other tasks
      }
    }
    
    logger.info(`Batch completed: ${results.length}/${tasks.length} successful`);
    return results;
  }

  /**
   * Add task to queue
   */
  addTask(taskType, prompt, parameters = {}) {
    // Validate task type
    if (!Object.values(TaskType).includes(taskType)) {
      throw new Error(`Invalid task type: ${taskType}`);
    }
    
    const task = new AceyTask({
      taskType,
      prompt,
      parameters,
      priority: parameters.priority || 'normal'
    });
    
    this.taskQueue.push(task);
    this.stats.totalTasks++;
    
    logger.info(`Added ${taskType} task to queue: ${task.id}`);
    return task;
  }

  /**
   * Process all queued tasks
   */
  async processQueue() {
    if (this.processing) {
      logger.warn('Queue already being processed');
      return [];
    }
    
    this.processing = true;
    const results = [];
    
    try {
      while (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        try {
          const result = await this.processTask(task);
          results.push(result);
        } catch (error) {
          logger.error(`Queue task failed:`, error);
        }
      }
    } finally {
      this.processing = false;
    }
    
    return results;
  }

  /**
   * Update statistics
   */
  updateStats(approved, processingTime) {
    this.stats.completedTasks++;
    
    if (approved) {
      this.stats.approvedTasks++;
    } else {
      this.stats.rejectedTasks++;
    }
    
    // Update average processing time
    const totalTime = this.stats.averageProcessingTime * (this.stats.completedTasks - 1) + processingTime;
    this.stats.averageProcessingTime = totalTime / this.stats.completedTasks;
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.taskQueue.length,
      processing: this.processing,
      learningEnabled: this.learningEnabled
    };
  }

  /**
   * Get learning statistics
   */
  getLearningStats() {
    if (this.learningEnabled && this.continuousLearning) {
      return this.continuousLearning.getDatasetStats();
    }
    return {};
  }

  /**
   * Configure continuous learning
   */
  configureLearning(options) {
    if (this.learningEnabled && this.continuousLearning) {
      if (options.enabled !== undefined) {
        this.continuousLearning.setEnabled(options.enabled);
      }
      
      if (options.autoFineTune !== undefined) {
        this.continuousLearning.setAutoFineTune(options.autoFineTune, options.batchSize);
      }
    }
  }

  /**
   * Export learning data
   */
  exportLearningData(taskType, format = 'jsonl') {
    if (this.learningEnabled && this.continuousLearning) {
      return this.continuousLearning.exportDataset(taskType, format);
    }
    return null;
  }
}

module.exports = AudioCodingOrchestrator;
