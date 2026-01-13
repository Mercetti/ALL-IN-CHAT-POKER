/**
 * Schema definitions for Continuous Learning System
 */

/**
 * Task types that Acey can handle
 */
const TaskType = {
  AUDIO: 'audio',
  CODING: 'coding', 
  GRAPHICS: 'graphics',
  CHAT: 'chat',
  COSMETIC: 'cosmetic',
  ADMIN: 'admin'
};

/**
 * Acey output structure
 */
class AceyOutput {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.taskType = data.taskType;
    this.content = data.content;
    this.metadata = data.metadata || {};
    this.confidence = data.confidence || 0.5;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.approved = data.approved || false;
    this.processingTime = data.processingTime || 0;
  }

  generateId() {
    return `acey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      taskType: this.taskType,
      content: this.content,
      metadata: this.metadata,
      confidence: this.confidence,
      timestamp: this.timestamp,
      approved: this.approved,
      processingTime: this.processingTime
    };
  }
}

/**
 * Task definition for orchestrator
 */
class AceyTask {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.taskType = data.taskType;
    this.prompt = data.prompt;
    this.parameters = data.parameters || {};
    this.priority = data.priority || 'normal';
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.metadata = data.metadata || {};
  }

  generateId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      taskType: this.taskType,
      prompt: this.prompt,
      parameters: this.parameters,
      priority: this.priority,
      status: this.status,
      createdAt: this.createdAt,
      metadata: this.metadata
    };
  }
}

/**
 * Dataset entry structure
 */
class DatasetEntry {
  constructor(data) {
    this.input = data.input;
    this.output = data.output;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.taskType = data.taskType;
    this.metadata = data.metadata || {};
    this.version = data.version || '1.0';
    this.source = data.source || 'continuous-learning';
  }

  toJSON() {
    return {
      input: this.input,
      output: this.output,
      timestamp: this.timestamp,
      taskType: this.taskType,
      metadata: this.metadata,
      version: this.version,
      source: this.source
    };
  }
}

/**
 * Fine-tuning configuration
 */
class FineTuneConfig {
  constructor(data) {
    this.model = data.model || 'acey-v2';
    this.trainingFile = data.trainingFile;
    this.taskType = data.taskType;
    this.batchSize = data.batchSize || 50;
    this.epochs = data.epochs || 3;
    this.learningRate = data.learningRate || 0.0001;
    this.validationSplit = data.validationSplit || 0.2;
  }

  toJSON() {
    return {
      model: this.model,
      training_file: this.trainingFile,
      task_type: this.taskType,
      batch_size: this.batchSize,
      epochs: this.epochs,
      learning_rate: this.learningRate,
      validation_split: this.validationSplit
    };
  }
}

/**
 * Learning statistics
 */
class LearningStats {
  constructor() {
    this.totalSamples = 0;
    this.approvedSamples = 0;
    this.rejectedSamples = 0;
    this.taskTypeStats = {};
    this.lastFineTune = null;
    this.datasetSize = 0;
  }

  updateFromDataset(stats) {
    this.taskTypeStats = stats;
    this.datasetSize = Object.values(stats).reduce((sum, stat) => sum + stat.samples, 0);
    this.totalSamples = this.datasetSize;
  }

  toJSON() {
    return {
      total_samples: this.totalSamples,
      approved_samples: this.approvedSamples,
      rejected_samples: this.rejectedSamples,
      task_type_stats: this.taskTypeStats,
      last_fine_tune: this.lastFineTune,
      dataset_size: this.datasetSize
    };
  }
}

/**
 * Validation rules for outputs
 */
const ValidationRules = {
  // Minimum confidence threshold for auto-approval
  MIN_CONFIDENCE: 0.7,
  
  // Maximum processing time (seconds)
  MAX_PROCESSING_TIME: 30,
  
  // Required fields for different task types
  REQUIRED_FIELDS: {
    [TaskType.AUDIO]: ['content', 'format'],
    [TaskType.CODING]: ['content', 'language'],
    [TaskType.GRAPHICS]: ['content', 'format'],
    [TaskType.CHAT]: ['content'],
    [TaskType.COSMETIC]: ['content', 'type']
  },
  
  // Content validation patterns
  CONTENT_PATTERNS: {
    [TaskType.CODING]: /^[\s\S]*$/i, // Any code content
    [TaskType.CHAT]: /^.{1,1000}$/i, // Reasonable length chat
    [TaskType.AUDIO]: /^.{10,}$/i, // Minimum audio data
    [TaskType.GRAPHICS]: /^.{10,}$/i, // Minimum image data
    [TaskType.COSMETIC]: /^.{10,}$/i // Minimum cosmetic data
  }
};

/**
 * Auto-approval checker
 */
function isAutoApproved(output, taskType) {
  // Check confidence threshold
  if (output.confidence < ValidationRules.MIN_CONFIDENCE) {
    return false;
  }
  
  // Check processing time
  if (output.processingTime > ValidationRules.MAX_PROCESSING_TIME) {
    return false;
  }
  
  // Check required fields
  const requiredFields = ValidationRules.REQUIRED_FIELDS[taskType];
  if (requiredFields) {
    for (const field of requiredFields) {
      if (!output.content[field]) {
        return false;
      }
    }
  }
  
  // Check content pattern
  const pattern = ValidationRules.CONTENT_PATTERNS[taskType];
  if (pattern && output.content) {
    const contentStr = typeof output.content === 'string' 
      ? output.content 
      : JSON.stringify(output.content);
    
    if (!pattern.test(contentStr)) {
      return false;
    }
  }
  
  return true;
}

module.exports = {
  TaskType,
  AceyOutput,
  AceyTask,
  DatasetEntry,
  FineTuneConfig,
  LearningStats,
  ValidationRules,
  isAutoApproved
};
