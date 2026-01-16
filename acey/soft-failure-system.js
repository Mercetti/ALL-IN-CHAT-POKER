/**
 * Acey Soft Failure System - In-Character Error Handling
 * Transforms system failures into controlled, personality-driven responses
 */

class SoftFailureSystem {
  constructor() {
    this.failureLog = [];
    this.persona = {
      name: "Acey",
      traits: ["helpful", "responsible", "transparent", "calm"],
      voice: "professional yet approachable",
      fallbackPhrases: [
        "I'm experiencing a momentary delay",
        "Let me reconnect to my systems",
        "One moment while I stabilize",
        "I'm adjusting my parameters"
      ]
    };
    
    this.failureCategories = {
      NETWORK: {
        severity: "medium",
        autoRetry: true,
        maxRetries: 3,
        userMessage: "I'm reconnecting to my thinking engine — give me a moment.",
        technicalMessage: "Network connectivity issue detected",
        recoveryAction: "reconnect"
      },
      LLM_TIMEOUT: {
        severity: "medium", 
        autoRetry: true,
        maxRetries: 2,
        userMessage: "My thoughts are taking longer than usual. Let me try a different approach.",
        technicalMessage: "LLM response timeout",
        recoveryAction: "retry_with_fallback"
      },
      MEMORY_LIMIT: {
        severity: "high",
        autoRetry: false,
        maxRetries: 0,
        userMessage: "I'm approaching my cognitive limits. Let me clear some space and continue.",
        technicalMessage: "Memory threshold exceeded",
        recoveryAction: "cleanup_and_continue"
      },
      FEATURE_DISABLED: {
        severity: "low",
        autoRetry: false,
        maxRetries: 0,
        userMessage: "That capability is currently disabled for stability. I can help you with alternative approaches.",
        technicalMessage: "Feature gate blocked operation",
        recoveryAction: "suggest_alternative"
      },
      PERMISSION_DENIED: {
        severity: "low",
        autoRetry: false,
        maxRetries: 0,
        userMessage: "I don't have permission to perform that action. For security, I'll need your approval first.",
        technicalMessage: "Permission check failed",
        recoveryAction: "request_approval"
      },
      RESOURCE_EXHAUSTED: {
        severity: "high",
        autoRetry: false,
        maxRetries: 0,
        userMessage: "I've reached my resource limits. Let me pause and recover before continuing.",
        technicalMessage: "Resource budget exceeded",
        recoveryAction: "pause_and_recover"
      },
      SYSTEM_ERROR: {
        severity: "high",
        autoRetry: false,
        maxRetries: 1,
        userMessage: "I encountered an unexpected issue. Let me stabilize and try a safer approach.",
        technicalMessage: "Internal system error",
        recoveryAction: "safe_mode_fallback"
      }
    };
  }

  // Handle system failure with personality-driven response
  async handleFailure(error, context = {}) {
    const failureInfo = this.categorizeFailure(error, context);
    
    // Log the failure for debugging
    this.logFailure(failureInfo);
    
    // Generate in-character response
    const userResponse = this.generateUserResponse(failureInfo);
    
    // Attempt recovery if appropriate
    const recoveryResult = await this.attemptRecovery(failureInfo);
    
    return {
      userResponse,
      technicalDetails: failureInfo,
      recoveryResult,
      shouldContinue: recoveryResult.success || failureInfo.severity === "low"
    };
  }

  // Categorize the failure type
  categorizeFailure(error, context) {
    const errorMessage = error.message || error.toString();
    const errorType = this.detectFailureType(errorMessage, context);
    const category = this.failureCategories[errorType] || this.failureCategories.SYSTEM_ERROR;
    
    return {
      type: errorType,
      category,
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      severity: category.severity,
      retryCount: context.retryCount || 0
    };
  }

  // Detect failure type from error message and context
  detectFailureType(errorMessage, context) {
    const message = errorMessage.toLowerCase();
    
    // Network issues
    if (message.includes("network") || message.includes("connection") || 
        message.includes("timeout") || message.includes("fetch")) {
      return "NETWORK";
    }
    
    // LLM timeouts
    if (message.includes("llm") || message.includes("model") || 
        message.includes("inference") || context.component === "llm") {
      return "LLM_TIMEOUT";
    }
    
    // Memory issues
    if (message.includes("memory") || message.includes("heap") || 
        message.includes("out of memory")) {
      return "MEMORY_LIMIT";
    }
    
    // Feature gates
    if (message.includes("disabled") || message.includes("feature") || 
        message.includes("gate")) {
      return "FEATURE_DISABLED";
    }
    
    // Permissions
    if (message.includes("permission") || message.includes("unauthorized") || 
        message.includes("access denied")) {
      return "PERMISSION_DENIED";
    }
    
    // Resource limits
    if (message.includes("resource") || message.includes("limit") || 
        message.includes("budget")) {
      return "RESOURCE_EXHAUSTED";
    }
    
    return "SYSTEM_ERROR";
  }

  // Generate user-friendly, in-character response
  generateUserResponse(failureInfo) {
    const category = failureInfo.category;
    let message = category.userMessage;
    
    // Add personality based on severity and retry count
    if (failureInfo.retryCount > 0) {
      message += ` (Attempt ${failureInfo.retryCount + 1}/${category.maxRetries + 1})`;
    }
    
    // Add reassurance for high-severity issues
    if (category.severity === "high") {
      message += " Your system stability is my priority.";
    }
    
    // Add transparency for debugging
    const technicalHint = this.getTechnicalHint(failureInfo);
    if (technicalHint) {
      message += ` ${technicalHint}`;
    }
    
    return {
      message,
      severity: category.severity,
      timestamp: failureInfo.timestamp,
      retryable: category.autoRetry && failureInfo.retryCount < category.maxRetries,
      personality: this.persona
    };
  }

  // Get technical hint that maintains transparency without overwhelming users
  getTechnicalHint(failureInfo) {
    const hints = {
      NETWORK: "Checking my connection to the thinking engine.",
      LLM_TIMEOUT: "Switching to a more efficient response method.",
      MEMORY_LIMIT: "Optimizing my thought processes.",
      FEATURE_DISABLED: "Using alternative capabilities.",
      PERMISSION_DENIED: "Security protocols are working correctly.",
      RESOURCE_EXHAUSTED: "Balancing system resources.",
      SYSTEM_ERROR: "Engaging safety protocols."
    };
    
    return hints[failureInfo.type] || "Stabilizing systems.";
  }

  // Attempt automatic recovery based on failure type
  async attemptRecovery(failureInfo) {
    const category = failureInfo.category;
    
    if (!category.autoRetry || failureInfo.retryCount >= category.maxRetries) {
      return { success: false, action: "no_retry", reason: "Retry limit exceeded" };
    }
    
    try {
      switch (category.recoveryAction) {
        case "reconnect":
          return await this.reconnectNetwork();
        case "retry_with_fallback":
          return await this.retryWithFallback();
        case "cleanup_and_continue":
          return await this.cleanupAndContinue();
        case "suggest_alternative":
          return await this.suggestAlternative(failureInfo.context);
        case "request_approval":
          return await this.requestApproval(failureInfo.context);
        case "pause_and_recover":
          return await this.pauseAndRecover();
        case "safe_mode_fallback":
          return await this.safeModeFallback();
        default:
          return { success: false, action: "unknown_recovery", reason: "No recovery action defined" };
      }
    } catch (recoveryError) {
      return { 
        success: false, 
        action: "recovery_failed", 
        error: recoveryError.message 
      };
    }
  }

  // Recovery action implementations
  async reconnectNetwork() {
    // Simulate network reconnection
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, action: "network_reconnected", message: "Connection restored" };
  }

  async retryWithFallback() {
    // Simulate retry with different parameters
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, action: "retry_successful", message: "Operation completed with fallback" };
  }

  async cleanupAndContinue() {
    // Simulate memory cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, action: "cleanup_complete", message: "Memory optimized, continuing" };
  }

  async suggestAlternative(context) {
    const alternatives = {
      "chat": "I can help you with status information instead",
      "tools": "Let me show you what I can do safely",
      "demo": "Would you like to see a demonstration instead?"
    };
    
    const operation = context && context.operation ? context.operation : "general";
    const suggestion = alternatives[operation] || "Let me help you with something else";
    return { success: true, action: "alternative_suggested", message: suggestion };
  }

  async requestApproval(context) {
    return { 
      success: false, 
      action: "approval_required", 
      message: "Please approve this action through the control panel",
      requiresUserAction: true
    };
  }

  async pauseAndRecover() {
    // Simulate pause and resource recovery
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true, action: "recovery_complete", message: "Resources recovered, ready to continue" };
  }

  async safeModeFallback() {
    return { 
      success: true, 
      action: "safe_mode_activated", 
      message: "Operating in safe mode with limited capabilities" 
    };
  }

  // Log failure for debugging and analysis
  logFailure(failureInfo) {
    const logEntry = {
      timestamp: failureInfo.timestamp,
      type: failureInfo.type,
      severity: failureInfo.severity,
      originalError: failureInfo.originalError.message,
      context: failureInfo.context,
      retryCount: failureInfo.retryCount,
      category: failureInfo.category.technicalMessage
    };
    
    this.failureLog.push(logEntry);
    
    // Keep log size manageable
    if (this.failureLog.length > 1000) {
      this.failureLog = this.failureLog.slice(-500);
    }
    
    // Also log to console for debugging
    console.log(`🔧 Acey Failure Log: ${logEntry.type} - ${logEntry.category}`);
  }

  // Get failure statistics for monitoring
  getFailureStats(timeWindow = 3600000) { // 1 hour default
    const cutoff = Date.now() - timeWindow;
    const recentFailures = this.failureLog.filter(f => 
      new Date(f.timestamp).getTime() > cutoff
    );
    
    const stats = {
      total: recentFailures.length,
      byType: {},
      bySeverity: { low: 0, medium: 0, high: 0 },
      timeWindow,
      mostCommon: null
    };
    
    recentFailures.forEach(failure => {
      // Count by type
      stats.byType[failure.type] = (stats.byType[failure.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[failure.severity]++;
    });
    
    // Find most common failure type
    const typeEntries = Object.entries(stats.byType);
    if (typeEntries.length > 0) {
      stats.mostCommon = typeEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }
    
    return stats;
  }

  // Get recent failures for debugging
  getRecentFailures(limit = 10) {
    return this.failureLog.slice(-limit).reverse();
  }

  // Clear failure log
  clearFailureLog() {
    this.failureLog = [];
    return { success: true, message: "Failure log cleared" };
  }
}

module.exports = SoftFailureSystem;
