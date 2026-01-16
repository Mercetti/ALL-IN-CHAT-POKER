/**
 * Acey Performance Budget - Resource Management & Graceful Degradation
 * Sets hard limits and degrades performance instead of crashing
 */

class PerformanceBudget {
  constructor() {
    // Default budgets by mode
    this.budgets = {
      OFFLINE: {
        maxMemory: 64,      // MB
        maxThreads: 1,
        maxTokens: 500,
        maxCpuPercent: 5,
        maxNetworkRequests: 10,
        maxFileOperations: 0
      },
      LITE: {
        maxMemory: 256,     // MB
        maxThreads: 2,
        maxTokens: 1500,
        maxCpuPercent: 25,
        maxNetworkRequests: 50,
        maxFileOperations: 5
      },
      DEMO: {
        maxMemory: 128,     // MB - demo mode is lightweight
        maxThreads: 2,
        maxTokens: 1000,
        maxCpuPercent: 15,
        maxNetworkRequests: 20,
        maxFileOperations: 0  // No file writes in demo
      },
      LIVE: {
        maxMemory: 512,     // MB
        maxThreads: 4,
        maxTokens: 3000,
        maxCpuPercent: 50,
        maxNetworkRequests: 200,
        maxFileOperations: 20
      },
      BUILD: {
        maxMemory: 1024,    // MB - build mode needs more resources
        maxThreads: 6,
        maxTokens: 5000,
        maxCpuPercent: 75,
        maxNetworkRequests: 500,
        maxFileOperations: 100
      },
      FULL: {
        maxMemory: 2048,    // MB - full operation mode
        maxThreads: 8,
        maxTokens: 8000,
        maxCpuPercent: 85,
        maxNetworkRequests: 1000,
        maxFileOperations: 200
      }
    };

    this.currentMode = "OFFLINE";
    this.currentUsage = {
      memory: 0,
      threads: 0,
      tokens: 0,
      cpuPercent: 0,
      networkRequests: 0,
      fileOperations: 0
    };

    this.degradationLevels = {
      NORMAL: { multiplier: 1.0, description: "Full performance" },
      REDUCED: { multiplier: 0.7, description: "Reduced performance" },
      MINIMAL: { multiplier: 0.4, description: "Minimal functionality" },
      SAFE: { multiplier: 0.2, description: "Safe mode only" }
    };

    this.currentLevel = "NORMAL";
    this.violations = [];
    this.lastCheck = Date.now();
  }

  // Set operating mode and adjust budgets
  setMode(mode) {
    if (!this.budgets[mode]) {
      return {
        success: false,
        message: `Invalid mode: ${mode}`,
        validModes: Object.keys(this.budgets)
      };
    }

    const previousMode = this.currentMode;
    this.currentMode = mode;
    
    // Reset usage counters for mode change
    this.currentUsage = {
      memory: 0,
      threads: 0,
      tokens: 0,
      cpuPercent: 0,
      networkRequests: 0,
      fileOperations: 0
    };

    return {
      success: true,
      message: `Mode changed from ${previousMode} to ${mode}`,
      previousMode,
      newMode: mode,
      budget: this.budgets[mode]
    };
  }

  // Check if operation is within budget
  checkBudget(operation, amount = 1) {
    const budget = this.budgets[this.currentMode];
    const current = this.currentUsage;
    
    switch (operation) {
      case "memory":
        return current.memory + amount <= budget.maxMemory;
      case "threads":
        return current.threads + amount <= budget.maxThreads;
      case "tokens":
        return current.tokens + amount <= budget.maxTokens;
      case "cpu":
        return current.cpuPercent <= budget.maxCpuPercent;
      case "network":
        return current.networkRequests + amount <= budget.maxNetworkRequests;
      case "file":
        return current.fileOperations + amount <= budget.maxFileOperations;
      default:
        return false;
    }
  }

  // Attempt to allocate resources with graceful degradation
  allocateResource(operation, amount = 1, priority = "normal") {
    // Check if within budget
    if (this.checkBudget(operation, amount)) {
      this.currentUsage[operation] += amount;
      return {
        success: true,
        allocated: amount,
        remaining: this.getRemaining(operation),
        level: this.currentLevel
      };
    }

    // Budget exceeded - attempt graceful degradation
    return this.handleBudgetExceeded(operation, amount, priority);
  }

  // Handle budget exceeded with degradation
  handleBudgetExceeded(operation, amount, priority) {
    const budget = this.budgets[this.currentMode];
    const current = this.currentUsage;
    
    // Log violation
    this.logViolation(operation, amount, current[operation], budget[`max${operation.charAt(0).toUpperCase() + operation.slice(1)}`]);

    // Check if we can degrade performance
    const degradationResult = this.attemptDegradation(operation, amount, priority);
    
    if (degradationResult.canDegrade) {
      return {
        success: true,
        allocated: degradationResult.allocatable,
        degraded: true,
        level: degradationResult.newLevel,
        message: `Resource allocated with degraded performance (${degradationResult.newLevel})`
      };
    }

    // Cannot allocate even with degradation
    return {
      success: false,
      allocated: 0,
      rejected: true,
      level: this.currentLevel,
      message: `Resource budget exceeded and cannot be degraded further`,
      suggestion: this.getSuggestion(operation, priority)
    };
  }

  // Attempt performance degradation
  attemptDegradation(operation, amount, priority) {
    const levels = ["NORMAL", "REDUCED", "MINIMAL", "SAFE"];
    const currentIndex = levels.indexOf(this.currentLevel);
    
    // Try to find a degradation level that works
    for (let i = currentIndex + 1; i < levels.length; i++) {
      const level = levels[i];
      const multiplier = this.degradationLevels[level].multiplier;
      const adjustedAmount = Math.floor(amount * multiplier);
      
      if (this.checkBudget(operation, adjustedAmount)) {
        this.currentLevel = level;
        return {
          canDegrade: true,
          allocatable: adjustedAmount,
          newLevel: level,
          multiplier
        };
      }
    }

    return { canDegrade: false };
  }

  // Release resources back to budget
  releaseResource(operation, amount = 1) {
    if (this.currentUsage[operation] >= amount) {
      this.currentUsage[operation] -= amount;
      
      // Check if we can improve performance level
      this.checkPerformanceImprovement();
      
      return {
        success: true,
        released: amount,
        remaining: this.getRemaining(operation),
        level: this.currentLevel
      };
    }

    return {
      success: false,
      message: "Cannot release more resources than currently allocated"
    };
  }

  // Check if we can improve performance level
  checkPerformanceImprovement() {
    const levels = ["SAFE", "MINIMAL", "REDUCED", "NORMAL"];
    const currentIndex = levels.indexOf(this.currentLevel);
    
    // Try to improve to a better level
    for (let i = currentIndex - 1; i >= 0; i--) {
      const level = levels[i];
      if (this.canOperateAtLevel(level)) {
        this.currentLevel = level;
        return {
          improved: true,
          newLevel: level,
          message: `Performance improved to ${level} level`
        };
      }
    }

    return { improved: false };
  }

  // Check if we can operate at a given performance level
  canOperateAtLevel(level) {
    const multiplier = this.degradationLevels[level].multiplier;
    const budget = this.budgets[this.currentMode];
    
    // Check if current usage is within the level's limits
    return Object.keys(this.currentUsage).every(key => {
      const maxKey = `max${key.charAt(0).toUpperCase() + key.slice(1)}`;
      const adjustedBudget = budget[maxKey] * multiplier;
      return this.currentUsage[key] <= adjustedBudget;
    });
  }

  // Get remaining budget for a resource
  getRemaining(operation) {
    const budget = this.budgets[this.currentMode];
    const maxKey = `max${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
    return budget[maxKey] - this.currentUsage[operation];
  }

  // Get suggestion for failed allocation
  getSuggestion(operation, priorityArg) {
    const priority = priorityArg || "normal";
    const suggestions = {
      high: [
        "Consider upgrading to FULL mode for more resources",
        "Pause non-essential operations",
        "Use SAFE mode for critical operations only"
      ],
      normal: [
        "Wait for resources to become available",
        "Try again with reduced parameters",
        "Consider using a different approach"
      ],
      low: [
        "Operation can be deferred",
        "Use cached results if available",
        "Skip non-critical features"
      ]
    };

    const prioritySuggestions = suggestions[priority] || suggestions.normal;
    return prioritySuggestions[Math.floor(Math.random() * prioritySuggestions.length)];
  }

  // Log budget violations for monitoring
  logViolation(operation, requested, current, max) {
    const violation = {
      timestamp: new Date().toISOString(),
      operation,
      requested,
      current,
      max,
      mode: this.currentMode,
      level: this.currentLevel,
      severity: current > max * 1.5 ? "critical" : "warning"
    };

    this.violations.push(violation);
    
    // Keep violations list manageable
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-500);
    }

    console.log(`⚠️ Performance Budget Violation: ${operation} - ${current}/${max}`);
  }

  // Get current performance status
  getPerformanceStatus() {
    const budget = this.budgets[this.currentMode];
    const usage = this.currentUsage;
    
    return {
      mode: this.currentMode,
      level: this.currentLevel,
      levelDescription: this.degradationLevels[this.currentLevel].description,
      resources: {
        memory: { used: usage.memory, max: budget.maxMemory, percent: (usage.memory / budget.maxMemory * 100).toFixed(1) },
        threads: { used: usage.threads, max: budget.maxThreads, percent: (usage.threads / budget.maxThreads * 100).toFixed(1) },
        tokens: { used: usage.tokens, max: budget.maxTokens, percent: (usage.tokens / budget.maxTokens * 100).toFixed(1) },
        cpu: { used: usage.cpuPercent, max: budget.maxCpuPercent, percent: (usage.cpuPercent / budget.maxCpuPercent * 100).toFixed(1) },
        network: { used: usage.networkRequests, max: budget.maxNetworkRequests, percent: (usage.networkRequests / budget.maxNetworkRequests * 100).toFixed(1) },
        files: { used: usage.fileOperations, max: budget.maxFileOperations, percent: budget.maxFileOperations > 0 ? (usage.fileOperations / budget.maxFileOperations * 100).toFixed(1) : 0 }
      },
      violations: this.violations.slice(-10),
      health: this.calculateHealthScore()
    };
  }

  // Calculate overall health score
  calculateHealthScore() {
    const budget = this.budgets[this.currentMode];
    let totalScore = 0;
    let resourceCount = 0;

    Object.keys(this.currentUsage).forEach(key => {
      const maxKey = `max${key.charAt(0).toUpperCase() + key.slice(1)}`;
      const max = budget[maxKey];
      if (max > 0) {
        const usage = this.currentUsage[key];
        const score = Math.max(0, 100 - (usage / max * 100));
        totalScore += score;
        resourceCount++;
      }
    });

    const averageScore = resourceCount > 0 ? totalScore / resourceCount : 100;
    
    // Apply degradation penalty
    const levelMultiplier = this.degradationLevels[this.currentLevel].multiplier;
    const finalScore = averageScore * levelMultiplier;

    return {
      score: Math.round(finalScore),
      level: this.currentLevel,
      status: finalScore > 80 ? "healthy" : finalScore > 50 ? "warning" : "critical"
    };
  }

  // Get recent violations
  getRecentViolations(limit = 20) {
    return this.violations.slice(-limit).reverse();
  }

  // Clear violation log
  clearViolations() {
    this.violations = [];
    return { success: true, message: "Violation log cleared" };
  }

  // Force performance level (for emergencies)
  forceLevel(level) {
    if (!this.degradationLevels[level]) {
      return {
        success: false,
        message: `Invalid level: ${level}`,
        validLevels: Object.keys(this.degradationLevels)
      };
    }

    const previousLevel = this.currentLevel;
    this.currentLevel = level;

    return {
      success: true,
      message: `Performance level forced from ${previousLevel} to ${level}`,
      previousLevel,
      newLevel: level,
      description: this.degradationLevels[level].description
    };
  }
}

module.exports = PerformanceBudget;
