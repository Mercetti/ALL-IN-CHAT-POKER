/**
 * Continuous Learning Manager
 * Watches orchestrator outputs and appends approved tasks to dataset
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../logger');

const logger = new Logger('continuous-learning');

class ContinuousLearningLoop {
  constructor(orchestrator, options = {}) {
    this.orchestrator = orchestrator;
    this.datasetDir = options.datasetDir || path.join(__dirname, '../../data/dataset');
    this.fineTuneBatchSize = options.fineTuneBatchSize || 50;
    this.autoFineTune = options.autoFineTune || false;
    this.enabled = options.enabled !== false;

    // Create dataset directory if it doesn't exist
    if (!fs.existsSync(this.datasetDir)) {
      fs.mkdirSync(this.datasetDir, { recursive: true });
      logger.info(`Created dataset directory: ${this.datasetDir}`);
    }

    // Initialize dataset files for different task types
    this.initializeDatasets();
  }

  /**
   * Initialize dataset files for all task types
   */
  initializeDatasets() {
    const taskTypes = ['audio', 'coding', 'graphics', 'chat', 'cosmetic'];
    
    taskTypes.forEach(taskType => {
      const filePath = path.join(this.datasetDir, `acey_${taskType}.jsonl`);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
        logger.info(`Initialized dataset file for ${taskType}: ${filePath}`);
      }
    });
  }

  /**
   * Process a single output and append approved results to dataset
   */
  processOutput(taskType, prompt, output, approved = false, metadata = {}) {
    if (!this.enabled) {
      logger.debug('Continuous learning is disabled');
      return;
    }

    if (!approved) {
      logger.debug(`Output not approved for ${taskType}, skipping dataset update`);
      return;
    }

    try {
      const filePath = path.join(this.datasetDir, `acey_${taskType}.jsonl`);
      const timestamp = new Date().toISOString();
      
      const datasetEntry = {
        input: prompt,
        output: output,
        timestamp: timestamp,
        taskType: taskType,
        metadata: {
          ...metadata,
          version: '1.0',
          source: 'continuous-learning'
        }
      };

      const jsonLine = JSON.stringify(datasetEntry) + '\n';
      fs.appendFileSync(filePath, jsonLine);
      
      logger.info(`Added approved ${taskType} output to dataset`);
      
      if (this.autoFineTune) {
        this.checkFineTune(taskType);
      }
    } catch (error) {
      logger.error('Failed to process output for continuous learning:', error);
    }
  }

  /**
   * Check if enough new data exists for fine-tuning
   */
  checkFineTune(taskType) {
    try {
      const filePath = path.join(this.datasetDir, `acey_${taskType}.jsonl`);
      
      if (!fs.existsSync(filePath)) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      
      if (lines.length >= this.fineTuneBatchSize) {
        logger.info(`Triggering fine-tune for ${taskType} with ${lines.length} samples`);
        this.runFineTune(taskType, filePath);
      }
    } catch (error) {
      logger.error('Failed to check fine-tune threshold:', error);
    }
  }

  /**
   * Run fine-tune process (adapt to your LLM)
   */
  async runFineTune(taskType, datasetFile) {
    try {
      logger.info(`Starting fine-tuning for ${taskType} on dataset: ${datasetFile}`);
      
      // This is a placeholder - integrate with your actual LLM fine-tuning
      // For example, with OpenAI, Anthropic, or local models
      
      const fineTuneConfig = {
        model: 'acey-v2',
        training_file: datasetFile,
        task_type: taskType,
        batch_size: this.fineTuneBatchSize
      };

      // Simulate fine-tuning process
      logger.info('Fine-tuning configuration:', fineTuneConfig);
      
      // Here you would call your actual fine-tuning API
      // const result = await yourLLMProvider.fineTune(fineTuneConfig);
      
      logger.info(`Fine-tuning completed for ${taskType}`);
      
      // Create a backup of the dataset before clearing
      const backupFile = datasetFile.replace('.jsonl', `_backup_${Date.now()}.jsonl`);
      fs.copyFileSync(datasetFile, backupFile);
      
      // Clear the dataset after successful fine-tuning
      fs.writeFileSync(datasetFile, '');
      
      logger.info(`Dataset backed up to ${backupFile} and cleared for new data`);
      
    } catch (error) {
      logger.error('Fine-tuning failed:', error);
    }
  }

  /**
   * Process batch outputs
   */
  processBatch(tasks) {
    if (!this.enabled) return;
    
    logger.info(`Processing batch of ${tasks.length} tasks for continuous learning`);
    
    tasks.forEach(task => {
      this.processOutput(
        task.taskType, 
        task.prompt, 
        task.output, 
        task.approved, 
        task.metadata
      );
  }

  /**
   * Get dataset statistics
   */
  getDatasetStats() {
    const stats = {};
    
    try {
      const taskTypes = ['audio', 'coding', 'graphics', 'chat', 'cosmetic'];
      
      taskTypes.forEach(taskType => {
        const filePath = path.join(this.datasetDir, `acey_${taskType}.jsonl`);
        
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n').filter(Boolean);
          
          stats[taskType] = {
            samples: lines.length,
            filePath: filePath,
            lastModified: fs.statSync(filePath).mtime
          };
        } else {
          stats[taskType] = {
            samples: 0,
            filePath: filePath,
            lastModified: null
          };
        }
      });
      
      return stats;
    } catch (error) {
      logger.error('Failed to get dataset statistics:', error);
      return {};
    }
  }

  /**
   * Enable or disable continuous learning
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    logger.info(`Continuous learning ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Configure auto fine-tuning
   */
  setAutoFineTune(autoFineTune, batchSize = null) {
    this.autoFineTune = autoFineTune;
    if (batchSize) {
      this.fineTuneBatchSize = batchSize;
    }
    logger.info(`Auto fine-tune ${autoFineTune ? 'enabled' : 'disabled'}, batch size: ${this.fineTuneBatchSize}`);
  }

  /**
   * Export dataset for external use
   */
  exportDataset(taskType, format = 'jsonl') {
    try {
      const filePath = path.join(this.datasetDir, `acey_${taskType}.jsonl`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (format === 'json') {
        const lines = content.split('\n').filter(Boolean);
        const jsonData = lines.map(line => JSON.parse(line));
        return JSON.stringify(jsonData, null, 2);
      }
      
      return content;
    } catch (error) {
      logger.error(`Failed to export dataset for ${taskType}:`, error);
      return null;
    }
  }

  /**
   * Clear dataset for a specific task type
   */
  clearDataset(taskType) {
    try {
      const filePath = path.join(this.datasetDir, `acey_${taskType}.jsonl`);
      
      if (fs.existsSync(filePath)) {
        // Create backup before clearing
        const backupFile = filePath.replace('.jsonl', `_backup_${Date.now()}.jsonl`);
        fs.copyFileSync(filePath, backupFile);
        
        fs.writeFileSync(filePath, '');
        logger.info(`Cleared dataset for ${taskType}, backup saved to ${backupFile}`);
      }
    } catch (error) {
      logger.error(`Failed to clear dataset for ${taskType}:`, error);
    }
  }
}

module.exports = ContinuousLearningLoop;
