// AI Model Selector - Frontend model routing
class AIModelSelector {
  constructor() {
    this.models = {
      'llama2:latest': {
        name: 'Llama2 7B',
        description: 'General purpose, great for chat and creative tasks',
        speed: 'Medium',
        quality: 'High',
        useCases: ['Chat', 'Cosmetic Generation', 'Creative Writing'],
        gateway: 'llama2-gateway'
      },
      'qwen:0.5b': {
        name: 'Qwen 0.5B',
        description: 'Ultra-fast responses, perfect for quick queries',
        speed: 'Very Fast',
        quality: 'Medium',
        useCases: ['Quick Questions', 'Simple Tasks', 'Lightweight Chat'],
        gateway: 'qwen-gateway'
      },
      'deepseek-coder:1.3b': {
        name: 'DeepSeek Coder 1.3B',
        description: 'Specialized for code generation and technical tasks',
        speed: 'Fast',
        quality: 'High',
        useCases: ['Code Generation', 'Technical Help', 'Debugging'],
        gateway: 'deepseek-gateway'
      },
      'llama3.2:latest': {
        name: 'Llama3.2 3.2B',
        description: 'Advanced reasoning, best for complex analysis',
        speed: 'Slow',
        quality: 'Very High',
        useCases: ['Complex Analysis', 'Research', 'Strategic Thinking'],
        gateway: 'llama3-gateway'
      }
    };
    
    this.selectedModel = 'llama2:latest';
    this.autoMode = true;
  }

  // Auto-select best model based on task type
  autoSelectModel(taskType, prompt) {
    const taskLower = taskType.toLowerCase();
    const promptLower = prompt.toLowerCase();
    
    if (taskLower.includes('code') || promptLower.includes('code') || promptLower.includes('programming')) {
      this.selectedModel = 'deepseek-coder:1.3b';
    } else if (taskLower.includes('quick') || taskLower.includes('simple') || promptLower.length < 50) {
      this.selectedModel = 'qwen:0.5b';
    } else if (taskLower.includes('complex') || taskLower.includes('analysis') || promptLower.length > 200) {
      this.selectedModel = 'llama3.2:latest';
    } else {
      this.selectedModel = 'llama2:latest';
    }
    
    return this.selectedModel;
  }

  // Get current model info
  getCurrentModel() {
    return this.models[this.selectedModel];
  }

  // Manual model selection
  selectModel(modelName) {
    if (this.models[modelName]) {
      this.selectedModel = modelName;
      return true;
    }
    return false;
  }

  // Create model selection UI
  createModelSelectorUI() {
    return `
      <div class="ai-model-selector">
        <h3>🤖 AI Model Selection</h3>
        <div class="model-options">
          ${Object.entries(this.models).map(([key, model]) => `
            <div class="model-option ${key === this.selectedModel ? 'selected' : ''}" 
                 onclick="aiModelSelector.selectModel('${key}')">
              <div class="model-header">
                <h4>${model.name}</h4>
                <span class="speed-indicator speed-${model.speed.toLowerCase()}">${model.speed}</span>
              </div>
              <p>${model.description}</p>
              <div class="use-cases">
                <strong>Best for:</strong> ${model.useCases.join(', ')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="auto-mode-toggle">
          <label>
            <input type="checkbox" ${this.autoMode ? 'checked' : ''} 
                   onchange="aiModelSelector.toggleAutoMode(this.checked)">
            Auto-select best model based on task
          </label>
        </div>
        <div class="current-selection">
          <strong>Currently selected:</strong> ${this.getCurrentModel().name}
        </div>
      </div>
    `;
  }

  // Toggle auto mode
  toggleAutoMode(enabled) {
    this.autoMode = enabled;
  }
}

// Initialize for global use
window.aiModelSelector = new AIModelSelector();
