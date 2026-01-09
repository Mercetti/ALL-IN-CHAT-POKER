/**
 * Ollama CPU Configuration
 * Optimizes Ollama requests for CPU-only operation
 */

const config = require('./config');

class OllamaCPUConfig {
  constructor() {
    this.cpuOptimizedOptions = {
      // CPU-specific settings
      num_predict: 20,        // Reduced for faster CPU processing
      num_ctx: 1024,         // Smaller context window
      temperature: 0.7,       // Lower temperature for faster processing
      top_p: 0.9,            // Faster sampling
      repeat_penalty: 1.1,    // Prevent repetition
      
      // CPU optimization flags
      use_mmap: true,         // Use memory mapping
      use_mlock: false,       // Don't lock memory (CPU-friendly)
      embedding_only: false,  // Full model, not just embeddings
      f16_kv: true,           // Use half precision for speed
      
      // Request optimization
      num_batch: 512,         // Smaller batch size for CPU
      num_gpu: 0,             // Force CPU usage
      num_thread: 4,          // Limit threads (adjust based on your CPU cores)
      
      // Timeout settings
      timeout: 30000,         // 30 second timeout
      request_timeout: 25000  // 25 second request timeout
    };
  }

  /**
   * Get CPU-optimized options for a specific model
   */
  getOptimizedOptions(model = 'deepseek-coder:1.3b') {
    const options = { ...this.cpuOptimizedOptions };
    
    // Model-specific optimizations
    switch (model) {
      case 'deepseek-coder:1.3b':
        options.num_predict = 15;
        options.num_ctx = 512;
        options.num_thread = 2;
        break;
        
      case 'qwen:0.5b':
        options.num_predict = 25;
        options.num_ctx = 1024;
        options.num_thread = 2;
        break;
        
      case 'llama3.2:1b':
        options.num_predict = 20;
        options.num_ctx = 768;
        options.num_thread = 3;
        break;
        
      case 'tinyllama:latest':
        options.num_predict = 30;
        options.num_ctx = 1024;
        options.num_thread = 2;
        break;
    }
    
    return options;
  }

  /**
   * Apply CPU optimization to Ollama request
   */
  optimizeRequest(requestOptions) {
    const optimized = { ...requestOptions };
    
    // Override with CPU-optimized settings
    const cpuOptions = this.getOptimizedOptions(optimized.model);
    
    // Merge options, preserving user settings where appropriate
    return {
      ...optimized,
      ...cpuOptions,
      // Preserve critical user settings
      model: optimized.model,
      messages: optimized.messages,
      
      // CPU-specific overrides
      options: {
        ...optimized.options,
        ...cpuOptions,
        num_gpu: 0,  // Force CPU
        use_mlock: false,  // Don't lock memory
      }
    };
  }

  /**
   * Get system resource recommendations
   */
  getResourceRecommendations() {
    return {
      memory: 'At least 2GB RAM available',
      cpu: '4+ CPU cores recommended',
      threads: 'Limit to 2-4 threads',
      context: 'Use smaller context windows (512-1024)',
      tokens: 'Limit to 15-30 tokens per response'
    };
  }
}

module.exports = new OllamaCPUConfig();
