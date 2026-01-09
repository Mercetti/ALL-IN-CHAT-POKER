/**
 * Ollama Hybrid GPU + CPU Configuration
 * Optimizes for balanced GPU and CPU usage
 */

const config = require('./config');

class OllamaHybridConfig {
  constructor() {
    this.hybridOptions = {
      // Hybrid settings - use GPU for heavy lifting, CPU for lighter tasks
      num_predict: 25,        // Balanced token count
      num_ctx: 2048,         // Medium context window
      temperature: 0.8,       // Balanced creativity
      top_p: 0.9,            // Good sampling
      repeat_penalty: 1.1,    // Prevent repetition
      
      // GPU + CPU hybrid settings
      use_mmap: true,         // Use memory mapping
      use_mlock: false,       // Don't lock memory (CPU-friendly)
      f16_kv: true,           // Use half precision for GPU efficiency
      embedding_only: false,  // Full model capability
      
      // Smart resource allocation
      num_gpu: 1,             // Use 1 GPU layer (adjust based on your GPU)
      num_gpu_layers: -1,     // Auto-detect optimal GPU layers
      num_thread: 6,          // Use more threads for CPU (adjust based on cores)
      num_batch: 1024,        // Larger batch for GPU efficiency
      
      // Performance settings
      timeout: 45000,         // 45 second timeout
      request_timeout: 40000, // 40 second request timeout
      
      // Memory management
      gpu_memory_utilization: 0.6, // Use 60% of GPU memory
      cpu_memory_utilization: 0.4  // Use 40% of CPU memory
    };
  }

  /**
   * Get optimized options for specific model and context
   */
  getOptimizedOptions(model = 'deepseek-coder:1.3b', context = 'general') {
    const options = { ...this.hybridOptions };
    
    // Model-specific optimizations
    switch (model) {
      case 'deepseek-coder:1.3b':
        options.num_predict = 20;
        options.num_ctx = 1536;
        options.num_gpu_layers = 8;  // More GPU layers for coding
        options.num_thread = 4;
        options.temperature = 0.7;    // More focused for coding
        break;
        
      case 'qwen:0.5b':
        options.num_predict = 30;
        options.num_ctx = 2048;
        options.num_gpu_layers = 4;  // Fewer GPU layers (smaller model)
        options.num_thread = 6;      // More CPU threads
        options.temperature = 0.9;    // More creative
        break;
        
      case 'llama3.2:1b':
        options.num_predict = 25;
        options.num_ctx = 1792;
        options.num_gpu_layers = 6;  // Balanced GPU usage
        options.num_thread = 5;
        options.temperature = 0.8;
        break;
        
      case 'tinyllama:latest':
        options.num_predict = 35;
        options.num_ctx = 1024;
        options.num_gpu_layers = 2;  // Minimal GPU (tiny model)
        options.num_thread = 8;      // More CPU threads
        options.temperature = 0.9;
        break;
    }
    
    // Context-specific adjustments
    switch (context) {
      case 'coding':
        options.num_predict = 15;
        options.temperature = 0.6;
        options.num_gpu_layers = Math.max(options.num_gpu_layers, 8);
        break;
        
      case 'personality':
        options.num_predict = 30;
        options.temperature = 0.9;
        options.num_gpu_layers = Math.min(options.num_gpu_layers, 4);
        options.num_thread = Math.max(options.num_thread, 6);
        break;
        
      case 'audio':
        options.num_predict = 25;
        options.temperature = 0.8;
        options.num_gpu_layers = 6;
        break;
        
      case 'fast':
        options.num_predict = 10;
        options.num_ctx = 512;
        options.num_gpu_layers = 2;
        options.num_thread = 8;
        break;
    }
    
    return options;
  }

  /**
   * Apply hybrid optimization to Ollama request
   */
  optimizeRequest(requestOptions, context = 'general') {
    const optimized = { ...requestOptions };
    
    // Get context-aware hybrid settings
    const hybridOptions = this.getOptimizedOptions(optimized.model, context);
    
    return {
      ...optimized,
      ...hybridOptions,
      // Preserve critical user settings
      model: optimized.model,
      messages: optimized.messages,
      
      // Hybrid-specific overrides
      options: {
        ...optimized.options,
        ...hybridOptions,
        // Smart GPU/CPU balance
        num_gpu: hybridOptions.num_gpu,
        num_gpu_layers: hybridOptions.num_gpu_layers,
        num_thread: hybridOptions.num_thread,
        
        // Memory optimization
        use_mlock: false,           // Don't lock memory
        use_mmap: true,             // Use memory mapping
        f16_kv: true,               // Half precision for GPU
        
        // Performance tuning
        gpu_memory_utilization: hybridOptions.gpu_memory_utilization,
        cpu_memory_utilization: hybridOptions.cpu_memory_utilization
      }
    };
  }

  /**
   * Get system resource recommendations for hybrid mode
   */
  getResourceRecommendations() {
    return {
      memory: '4GB+ RAM recommended (2GB for models, 2GB for system)',
      gpu: 'Any GPU with 2GB+ VRAM recommended',
      cpu: '6+ CPU cores recommended',
      threads: 'Use 4-8 threads for CPU processing',
      context: 'Medium context windows (1024-2048)',
      tokens: 'Balanced token count (15-30 per response)',
      gpu_layers: 'Auto-detect or 4-8 GPU layers',
      memory_split: '60% GPU / 40% CPU memory utilization'
    };
  }

  /**
   * Monitor system performance and adjust settings
   */
  adaptToSystemLoad(systemLoad) {
    const adapted = { ...this.hybridOptions };
    
    if (systemLoad.cpu > 0.8) {
      // High CPU load - use more GPU
      adapted.num_gpu_layers = Math.min(adapted.num_gpu_layers + 2, 12);
      adapted.num_thread = Math.max(adapted.num_thread - 2, 2);
    }
    
    if (systemLoad.gpu > 0.8) {
      // High GPU load - use more CPU
      adapted.num_gpu_layers = Math.max(adapted.num_gpu_layers - 2, 2);
      adapted.num_thread = Math.min(adapted.num_thread + 2, 8);
    }
    
    if (systemLoad.memory > 0.8) {
      // High memory usage - reduce context and batch size
      adapted.num_ctx = Math.max(adapted.num_ctx - 256, 512);
      adapted.num_batch = Math.max(adapted.num_batch - 128, 256);
    }
    
    return adapted;
  }
}

module.exports = new OllamaHybridConfig();
