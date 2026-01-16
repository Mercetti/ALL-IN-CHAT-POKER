/**
 * Acey Operating Modes - User Control Through Mode Selection
 * Live, Build, Offline modes give users control and clarity
 */

class OperatingModes {
  constructor() {
    this.currentMode = "OFFLINE";
    this.previousMode = null;
    this.modeHistory = [];
    
    this.modes = {
      OFFLINE: {
        name: "Offline Mode",
        icon: "🔴",
        description: "Everything off - complete privacy and resource freedom",
        features: {
          chat: false,
          llm: false,
          tools: false,
          websocket: false,
          monitoring: false,
          audio: false,
          learning: false,
          fileOps: false
        },
        resourceLimits: {
          memory: 64,
          threads: 1,
          tokens: 0,
          cpu: 5
        },
        useCase: "When you need maximum privacy or system resources",
        transitions: ["LITE", "DEMO"]
      },
      
      LITE: {
        name: "Lite Mode",
        icon: "🟡",
        description: "Basic assistance with minimal resource usage",
        features: {
          chat: true,
          llm: true,
          tools: false,
          websocket: true,
          monitoring: true,
          audio: false,
          learning: false,
          fileOps: false
        },
        resourceLimits: {
          memory: 256,
          threads: 2,
          tokens: 1500,
          cpu: 25
        },
        useCase: "Everyday assistance and basic monitoring",
        transitions: ["OFFLINE", "LIVE", "BUILD", "DEMO"]
      },
      
      LIVE: {
        name: "Live Mode",
        icon: "🟢",
        description: "Full Twitch integration and real-time interaction",
        features: {
          chat: true,
          llm: true,
          tools: true,
          websocket: true,
          monitoring: true,
          audio: true,
          learning: false,
          fileOps: true
        },
        resourceLimits: {
          memory: 512,
          threads: 4,
          tokens: 3000,
          cpu: 50
        },
        useCase: "Streaming, live events, real-time audience interaction",
        transitions: ["LITE", "BUILD", "DEMO"]
      },
      
      BUILD: {
        name: "Build Mode",
        icon: "🔵",
        description: "Development tools and system management",
        features: {
          chat: true,
          llm: true,
          tools: true,
          websocket: true,
          monitoring: true,
          audio: true,
          learning: true,
          fileOps: true
        },
        resourceLimits: {
          memory: 1024,
          threads: 6,
          tokens: 5000,
          cpu: 75
        },
        useCase: "Development, testing, system configuration",
        transitions: ["LITE", "LIVE", "DEMO"]
      },
      
      DEMO: {
        name: "Demo Mode",
        icon: "🎬",
        description: "Safe demonstration with predefined scenarios",
        features: {
          chat: true,
          llm: true,
          tools: false,
          websocket: true,
          monitoring: true,
          audio: true,
          learning: false,
          fileOps: false
        },
        resourceLimits: {
          memory: 128,
          threads: 2,
          tokens: 1000,
          cpu: 15
        },
        useCase: "Investor demos, presentations, safe testing",
        transitions: ["OFFLINE", "LITE", "LIVE", "BUILD"]
      }
    };

    this.modeTransitionRules = {
      // Emergency transitions (always allowed)
      emergency: {
        from: ["LIVE", "BUILD", "DEMO", "LITE"],
        to: "OFFLINE",
        reason: "Emergency shutdown",
        instant: true
      },
      
      // Safe transitions (require validation)
      safe: {
        from: ["LIVE", "BUILD"],
        to: ["LITE", "DEMO"],
        reason: "Resource reduction",
        validation: "check_resources"
      },
      
      // Upgrade transitions (require availability)
      upgrade: {
        from: ["OFFLINE", "LITE"],
        to: ["LIVE", "BUILD", "DEMO"],
        reason: "Capability increase",
        validation: "check_availability"
      }
    };
  }

  // Get current mode information
  getCurrentMode() {
    return {
      mode: this.currentMode,
      config: this.modes[this.currentMode],
      history: this.modeHistory.slice(-5),
      canTransitionTo: this.getValidTransitions(this.currentMode)
    };
  }

  // Get all available modes
  getAllModes() {
    return Object.keys(this.modes).map(modeKey => ({
      id: modeKey,
      ...this.modes[modeKey],
      current: modeKey === this.currentMode,
      available: this.canTransitionTo(this.currentMode, modeKey)
    }));
  }

  // Check if transition is valid
  canTransitionTo(fromMode, toMode) {
    const fromConfig = this.modes[fromMode];
    if (!fromConfig) return false;
    
    return fromConfig.transitions.includes(toMode);
  }

  // Get valid transitions for current mode
  getValidTransitions(mode) {
    const config = this.modes[mode];
    return config ? config.transitions : [];
  }

  // Switch to new mode
  async switchMode(newMode, options = {}) {
    // Validate mode exists
    if (!this.modes[newMode]) {
      return {
        success: false,
        message: `Invalid mode: ${newMode}`,
        availableModes: Object.keys(this.modes)
      };
    }

    // Check if transition is allowed
    if (!this.canTransitionTo(this.currentMode, newMode)) {
      return {
        success: false,
        message: `Cannot transition from ${this.currentMode} to ${newMode}`,
        validTransitions: this.getValidTransitions(this.currentMode)
      };
    }

    // Check for emergency transition
    const isEmergency = options.emergency || newMode === "OFFLINE";
    
    try {
      // Execute mode transition
      const transitionResult = await this.executeTransition(this.currentMode, newMode, isEmergency);
      
      if (transitionResult.success) {
        // Update mode history
        this.modeHistory.push({
          from: this.currentMode,
          to: newMode,
          timestamp: new Date().toISOString(),
          reason: options.reason || "User request",
          emergency: isEmergency
        });

        // Update current mode
        this.previousMode = this.currentMode;
        this.currentMode = newMode;

        return {
          success: true,
          previousMode: this.previousMode,
          currentMode: this.currentMode,
          config: this.modes[this.currentMode],
          transition: transitionResult,
          message: `Successfully switched to ${this.modes[newMode].name}`
        };
      } else {
        return transitionResult;
      }
    } catch (error) {
      return {
        success: false,
        message: `Mode transition failed: ${error.message}`,
        error: error.toString()
      };
    }
  }

  // Execute the actual mode transition
  async executeTransition(fromMode, toMode, isEmergency) {
    const fromConfig = this.modes[fromMode];
    const toConfig = this.modes[toMode];

    try {
      // Step 1: Shutdown current mode features
      const shutdownResult = await this.shutdownModeFeatures(fromMode, isEmergency);
      if (!shutdownResult.success && !isEmergency) {
        return shutdownResult;
      }

      // Step 2: Prepare new mode
      const prepareResult = await this.prepareMode(toMode);
      if (!prepareResult.success) {
        return prepareResult;
      }

      // Step 3: Start new mode features
      const startupResult = await this.startupModeFeatures(toMode);
      if (!startupResult.success) {
        return startupResult;
      }

      return {
        success: true,
        steps: [
          { action: "shutdown", result: shutdownResult },
          { action: "prepare", result: prepareResult },
          { action: "startup", result: startupResult }
        ],
        message: `Transition from ${fromConfig.name} to ${toConfig.name} completed`
      };
    } catch (error) {
      return {
        success: false,
        message: `Transition execution failed: ${error.message}`,
        error: error.toString()
      };
    }
  }

  // Shutdown features for current mode
  async shutdownModeFeatures(mode, isEmergency = false) {
    const config = this.modes[mode];
    const shutdownSteps = [];

    // Define shutdown order (reverse of startup)
    const shutdownOrder = [
      "chat", "tools", "audio", "learning", "fileOps", 
      "websocket", "monitoring", "llm"
    ];

    for (const feature of shutdownOrder) {
      if (config.features[feature]) {
        try {
          const result = await this.shutdownFeature(feature, isEmergency);
          shutdownSteps.push({ feature, result });
        } catch (error) {
          if (!isEmergency) {
            return {
              success: false,
              message: `Failed to shutdown ${feature}: ${error.message}`,
              partialResults: shutdownSteps
            };
          }
        }
      }
    }

    return {
      success: true,
      steps: shutdownSteps,
      message: `All features for ${config.name} shut down`
    };
  }

  // Prepare for new mode
  async prepareMode(mode) {
    const config = this.modes[mode];
    
    try {
      // Validate resource availability
      const resourceCheck = await this.checkResourceAvailability(mode);
      if (!resourceCheck.isAvailable) {
        return {
          success: false,
          message: `Insufficient resources for ${config.name}`,
          resourceCheck
        };
      }

      // Pre-allocate resources
      const allocationResult = await this.allocateResources(mode);
      if (!allocationResult.success) {
        return allocationResult;
      }

      return {
        success: true,
        resourceCheck,
        allocationResult,
        message: `${config.name} preparation complete`
      };
    } catch (error) {
      return {
        success: false,
        message: `Mode preparation failed: ${error.message}`
      };
    }
  }

  // Startup features for new mode
  async startupModeFeatures(mode) {
    const config = this.modes[mode];
    const startupSteps = [];

    // Define startup order
    const startupOrder = [
      "llm", "monitoring", "websocket", "fileOps", 
      "learning", "audio", "tools", "chat"
    ];

    for (const feature of startupOrder) {
      if (config.features[feature]) {
        try {
          const result = await this.startupFeature(feature);
          startupSteps.push({ feature, result });
        } catch (error) {
          return {
            success: false,
            message: `Failed to startup ${feature}: ${error.message}`,
            partialResults: startupSteps
          };
        }
      }
    }

    return {
      success: true,
      steps: startupSteps,
      message: `All features for ${config.name} started successfully`
    };
  }

  // Individual feature shutdown
  async shutdownFeature(feature, isEmergency) {
    // Simulate feature shutdown
    await new Promise(resolve => setTimeout(resolve, isEmergency ? 100 : 500));
    
    return {
      success: true,
      feature,
      emergency: isEmergency,
      message: `${feature} shut down${isEmergency ? " (emergency)" : ""}`
    };
  }

  // Individual feature startup
  async startupFeature(feature) {
    // Simulate feature startup
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      feature,
      message: `${feature} started successfully`
    };
  }

  // Check resource availability
  async checkResourceAvailability(mode) {
    const config = this.modes[mode];
    
    // Simulate resource checking
    const available = {
      memory: 2048, // Available MB
      threads: 8,
      tokens: 10000,
      cpu: 100 // Percentage
    };

    const required = config.resourceLimits;
    
    return {
      isAvailable: 
        available.memory >= required.memory &&
        available.threads >= required.threads &&
        available.tokens >= required.tokens &&
        available.cpu >= required.cpu,
      available,
      required,
      deficits: {
        memory: Math.max(0, required.memory - available.memory),
        threads: Math.max(0, required.threads - available.threads),
        tokens: Math.max(0, required.tokens - available.tokens),
        cpu: Math.max(0, required.cpu - available.cpu)
      }
    };
  }

  // Allocate resources for mode
  async allocateResources(mode) {
    const config = this.modes[mode];
    
    // Simulate resource allocation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      allocated: config.resourceLimits,
      message: `Resources allocated for ${config.name}`
    };
  }

  // Emergency mode switch
  async emergencySwitch(targetMode = "OFFLINE") {
    return this.switchMode(targetMode, { 
      emergency: true, 
      reason: "Emergency shutdown" 
    });
  }

  // Get mode recommendations based on context
  getModeRecommendation(context) {
    const recommendations = {
      streaming: {
        mode: "LIVE",
        reason: "Live mode provides real-time chat integration and audience interaction",
        confidence: 0.9
      },
      development: {
        mode: "BUILD", 
        reason: "Build mode offers development tools and system management capabilities",
        confidence: 0.85
      },
      presentation: {
        mode: "DEMO",
        reason: "Demo mode is safe and predictable for presentations",
        confidence: 0.95
      },
      casual: {
        mode: "LITE",
        reason: "Lite mode provides basic assistance with minimal resource usage",
        confidence: 0.8
      },
      privacy: {
        mode: "OFFLINE",
        reason: "Offline mode ensures complete privacy and no resource usage",
        confidence: 1.0
      }
    };

    return recommendations[context] || {
      mode: "LITE",
      reason: "Lite mode is a good default for general use",
      confidence: 0.7
    };
  }

  // Get mode statistics
  getModeStats() {
    const stats = {
      currentMode: this.currentMode,
      totalTransitions: this.modeHistory.length,
      modeUsage: {},
      averageSessionTime: 0,
      mostUsedMode: null
    };

    // Calculate mode usage
    Object.keys(this.modes).forEach(mode => {
      stats.modeUsage[mode] = this.modeHistory.filter(h => h.to === mode).length;
    });

    // Find most used mode
    const usageEntries = Object.entries(stats.modeUsage);
    if (usageEntries.length > 0) {
      stats.mostUsedMode = usageEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }

    return stats;
  }

  // Reset mode history
  resetHistory() {
    this.modeHistory = [];
    return { success: true, message: "Mode history cleared" };
  }
}

module.exports = OperatingModes;
