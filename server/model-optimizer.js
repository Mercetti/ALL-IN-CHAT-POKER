/**
 * Model Optimization Manager
 * Handles model quantization and performance optimization
 */

const fetch = global.fetch;
const config = require('./config');
const Logger = require('./logger');

const logger = new Logger('model-optimizer');

class ModelOptimizer {
  constructor() {
    this.quantizedModels = new Map();
    this.performanceCache = new Map();
    this.optimizationStrategies = {
      fast: { maxTokens: 20, temperature: 0.7, priority: 'speed' },
      balanced: { maxTokens: 30, temperature: 0.8, priority: 'balanced' },
      quality: { maxTokens: 50, temperature: 0.9, priority: 'quality' }
    };
  }

  /**
   * Get optimized model configuration based on context and load
   */
  getOptimizedModel(context, currentLoad = 0) {
    const baseModel = this.selectBaseModel(context);
    const strategy = this.selectStrategy(context, currentLoad);
    
    return {
      model: this.getQuantizedVersion(baseModel),
      options: this.optimizationStrategies[strategy],
      strategy,
      estimatedTime: this.estimateResponseTime(baseModel, strategy)
    };
  }

  /**
   * Select base model for context
   */
  selectBaseModel(context) {
    const contextMap = {
      coding: 'deepseek-coder:1.3b',
      personality: 'qwen:0.5b',
      audio: 'qwen:0.5b',
      general: 'deepseek-coder:1.3b'
    };
    
    return contextMap[context] || 'deepseek-coder:1.3b';
  }

  /**
   * Select optimization strategy based on load and context
   */
  selectStrategy(context, load) {
    if (load > 0.8) return 'fast'; // High load - prioritize speed
    if (context === 'coding') return 'balanced'; // Coding needs balance
    if (context === 'personality') return 'fast'; // Personality can be fast
    return 'balanced'; // Default balanced approach
  }

  /**
   * Get quantized version of model
   */
  getQuantizedVersion(baseModel) {
    // Map to quantized versions if available
    const quantizedMap = {
      'deepseek-coder:1.3b': 'deepseek-coder:1.3b-q4_K_M',
      'qwen:0.5b': 'qwen:0.5b-q4_K_M',
      'llama3.2:1b': 'llama3.2:1b-q4_K_M'
    };
    
    return quantizedMap[baseModel] || baseModel;
  }

  /**
   * Estimate response time based on model and strategy
   */
  estimateResponseTime(model, strategy) {
    const baseTimes = {
      'deepseek-coder:1.3b': 3000,
      'qwen:0.5b': 1500,
      'llama3.2:1b': 2000
    };
    
    const strategyMultipliers = {
      fast: 0.5,
      balanced: 1.0,
      quality: 1.5
    };
    
    const baseTime = baseTimes[model] || 2000;
    return baseTime * strategyMultipliers[strategy];
  }

  /**
   * Check if quantized models are available
   */
  async checkQuantizedModels() {
    try {
      const response = await fetch(`${config.OLLAMA_HOST}/api/tags`);
      const data = await response.json();
      const availableModels = data.models.map(m => m.name);
      
      const quantizedAvailable = [];
      for (const [base, quantized] of Object.entries(this.getQuantizedVersions())) {
        if (availableModels.includes(quantized)) {
          quantizedAvailable.push({ base, quantized, available: true });
        } else {
          quantizedAvailable.push({ base, quantized, available: false });
        }
      }
      
      return quantizedAvailable;
    } catch (error) {
      logger.error('Failed to check quantized models', error);
      return [];
    }
  }

  /**
   * Get all quantized model mappings
   */
  getQuantizedVersions() {
    return {
      'deepseek-coder:1.3b': 'deepseek-coder:1.3b-q4_K_M',
      'qwen:0.5b': 'qwen:0.5b-q4_K_M',
      'llama3.2:1b': 'llama3.2:1b-q4_K_M',
      'tinyllama:latest': 'tinyllama:latest-q4_K_M'
    };
  }

  /**
   * Pull quantized models if not available
   */
  async pullQuantizedModels() {
    const quantizedVersions = this.getQuantizedVersions();
    const results = [];
    
    for (const [base, quantized] of Object.entries(quantizedVersions)) {
      try {
        logger.info(`Pulling quantized model: ${quantized}`);
        const response = await fetch(`${config.OLLAMA_HOST}/api/pull`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: quantized })
        });
        
        results.push({ model: quantized, success: response.ok });
      } catch (error) {
        logger.error(`Failed to pull ${quantized}`, error);
        results.push({ model: quantized, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

module.exports = ModelOptimizer;
