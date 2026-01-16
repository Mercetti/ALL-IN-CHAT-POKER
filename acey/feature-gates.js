/**
 * Acey Feature Gates - Control System for Unstable Features
 * Ensures only stable features are enabled by default
 */

class FeatureGates {
  constructor() {
    // Feature definitions with stability status and requirements
    this.features = {
      // Core stable features (enabled by default)
      chat: {
        enabled: true,
        stable: true,
        description: "Basic chat interaction",
        requiredMode: ["LITE", "LIVE", "BUILD", "DEMO"],
        dependencies: []
      },
      status: {
        enabled: true,
        stable: true,
        description: "System status monitoring",
        requiredMode: ["LITE", "LIVE", "BUILD", "DEMO", "OFFLINE"],
        dependencies: []
      },
      control: {
        enabled: true,
        stable: true,
        description: "Start/stop controls",
        requiredMode: ["LITE", "LIVE", "BUILD", "DEMO"],
        dependencies: []
      },

      // Advanced features (disabled by default until stable)
      autonomous: {
        enabled: false,
        stable: false,
        description: "Autonomous decision making",
        requiredMode: ["FULL"],
        dependencies: ["learning", "fileWrites"],
        reason: "Requires extensive testing and safety validation"
      },
      learning: {
        enabled: false,
        stable: false,
        description: "Machine learning and adaptation",
        requiredMode: ["BUILD", "FULL"],
        dependencies: ["fileWrites"],
        reason: "Memory growth and resource impact concerns"
      },
      fileWrites: {
        enabled: false,
        stable: false,
        description: "File system modifications",
        requiredMode: ["BUILD", "FULL"],
        dependencies: [],
        reason: "Safety and data integrity validation needed"
      },
      backgroundTasks: {
        enabled: false,
        stable: false,
        description: "Background processing and monitoring",
        requiredMode: ["FULL"],
        dependencies: ["learning"],
        reason: "Resource consumption and stability testing required"
      },
      financialOps: {
        enabled: false,
        stable: false,
        description: "Financial operations and payouts",
        requiredMode: ["BUILD", "FULL"],
        dependencies: ["fileWrites"],
        reason: "Security and compliance validation in progress"
      },
      audioGeneration: {
        enabled: false,
        stable: false,
        description: "Local audio generation",
        requiredMode: ["BUILD", "FULL"],
        dependencies: [],
        reason: "Performance impact and resource management testing"
      },

      // Demo-safe features (enabled in demo mode)
      demoAudio: {
        enabled: true,
        stable: true,
        description: "Demo audio orchestration",
        requiredMode: ["DEMO"],
        dependencies: [],
        reason: "Uses external audio engine, safe for demos"
      },
      narration: {
        enabled: true,
        stable: true,
        description: "Demo narration and explanations",
        requiredMode: ["DEMO"],
        dependencies: [],
        reason: "Read-only, safe for demonstrations"
      }
    };

    this.currentMode = "OFFLINE";
    this.featureHistory = [];
  }

  // Check if feature is enabled in current mode
  isFeatureEnabled(featureName) {
    const feature = this.features[featureName];
    if (!feature) {
      return false;
    }

    // Check if feature is globally enabled
    if (!feature.enabled) {
      return false;
    }

    // Check if current mode supports this feature
    if (!feature.requiredMode.includes(this.currentMode)) {
      return false;
    }

    // Check dependencies
    for (const dep of feature.dependencies) {
      if (!this.isFeatureEnabled(dep)) {
        return false;
      }
    }

    return true;
  }

  // Enable a feature (with safety checks)
  enableFeature(featureName, force = false) {
    const feature = this.features[featureName];
    if (!feature) {
      return {
        success: false,
        message: `Feature '${featureName}' not found`,
        type: "error"
      };
    }

    // Safety check: don't enable unstable features without force
    if (!feature.stable && !force) {
      return {
        success: false,
        message: `Feature '${featureName}' is marked as unstable. Use force=true to enable.`,
        type: "warning",
        reason: feature.reason
      };
    }

    // Check dependencies
    const missingDeps = feature.dependencies.filter(dep => !this.isFeatureEnabled(dep));
    if (missingDeps.length > 0) {
      return {
        success: false,
        message: `Feature '${featureName}' requires dependencies: ${missingDeps.join(", ")}`,
        type: "error"
      };
    }

    feature.enabled = true;
    this.recordFeatureChange(featureName, "enabled", force);

    return {
      success: true,
      message: `Feature '${featureName}' enabled successfully`,
      type: "success"
    };
  }

  // Disable a feature
  disableFeature(featureName) {
    const feature = this.features[featureName];
    if (!feature) {
      return {
        success: false,
        message: `Feature '${featureName}' not found`,
        type: "error"
      };
    }

    // Check if other features depend on this one
    const dependentFeatures = Object.keys(this.features)
      .filter(name => this.features[name].dependencies.includes(featureName))
      .filter(name => this.isFeatureEnabled(name));

    if (dependentFeatures.length > 0) {
      return {
        success: false,
        message: `Cannot disable '${featureName}' - required by: ${dependentFeatures.join(", ")}`,
        type: "error"
      };
    }

    feature.enabled = false;
    this.recordFeatureChange(featureName, "disabled", false);

    return {
      success: true,
      message: `Feature '${featureName}' disabled successfully`,
      type: "success"
    };
  }

  // Set operating mode
  setMode(mode) {
    const validModes = ["OFFLINE", "LITE", "LIVE", "BUILD", "FULL", "DEMO"];
    if (!validModes.includes(mode)) {
      return {
        success: false,
        message: `Invalid mode '${mode}'. Valid modes: ${validModes.join(", ")}`,
        type: "error"
      };
    }

    const previousMode = this.currentMode;
    this.currentMode = mode;

    // Auto-enable/disable features based on mode
    this.updateFeaturesForMode(mode);

    return {
      success: true,
      message: `Mode changed from ${previousMode} to ${mode}`,
      type: "success",
      previousMode,
      newMode: mode
    };
  }

  // Update feature states based on mode
  updateFeaturesForMode(mode) {
    Object.keys(this.features).forEach(featureName => {
      const feature = this.features[featureName];
      const shouldBeEnabled = feature.requiredMode.includes(mode) && feature.enabled;
      
      // Only auto-enable stable features
      if (shouldBeEnabled && feature.stable) {
        this.enableFeature(featureName);
      }
    });
  }

  // Get feature status report
  getFeatureStatus() {
    const status = {
      mode: this.currentMode,
      features: {},
      summary: {
        total: Object.keys(this.features).length,
        enabled: 0,
        disabled: 0,
        stable: 0,
        unstable: 0
      }
    };

    Object.keys(this.features).forEach(featureName => {
      const feature = this.features[featureName];
      const enabled = this.isFeatureEnabled(featureName);
      
      status.features[featureName] = {
        enabled,
        stable: feature.stable,
        description: feature.description,
        dependencies: feature.dependencies,
        requiredMode: feature.requiredMode,
        reason: feature.reason || null
      };

      if (enabled) status.summary.enabled++;
      else status.summary.disabled++;
      
      if (feature.stable) status.summary.stable++;
      else status.summary.unstable++;
    });

    return status;
  }

  // Get unstable features with reasons
  getUnstableFeatures() {
    return Object.keys(this.features)
      .filter(name => !this.features[name].stable)
      .map(name => ({
        name,
        description: this.features[name].description,
        reason: this.features[name].reason,
        dependencies: this.features[name].dependencies
      }));
  }

  // Record feature changes for audit
  recordFeatureChange(featureName, action, forced) {
    this.featureHistory.push({
      feature: featureName,
      action,
      forced,
      mode: this.currentMode,
      timestamp: new Date().toISOString()
    });

    // Keep history limited to last 100 changes
    if (this.featureHistory.length > 100) {
      this.featureHistory = this.featureHistory.slice(-100);
    }
  }

  // Get feature change history
  getFeatureHistory(limit = 20) {
    return this.featureHistory.slice(-limit);
  }

  // Safety check: ensure no unstable features are enabled
  safetyCheck() {
    const unstableEnabled = Object.keys(this.features)
      .filter(name => !this.features[name].stable && this.isFeatureEnabled(name));

    if (unstableEnabled.length > 0) {
      return {
        safe: false,
        message: "Unstable features are enabled",
        unstableFeatures: unstableEnabled,
        recommendation: "Disable unstable features or use DEMO mode"
      };
    }

    return {
      safe: true,
      message: "All enabled features are stable"
    };
  }
}

module.exports = FeatureGates;
