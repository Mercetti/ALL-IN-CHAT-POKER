/**
 * Acey Operating Modes
 * Hard-gated system states with mutually exclusive operation
 */

export enum AceyMode {
  OFF = 'OFF',           // Acey not running at all
  SAFE = 'SAFE',         // Monitoring + alerts only
  MINIMAL = 'MINIMAL',   // Website + game health
  CREATOR = 'CREATOR',   // Code / audio / graphics
  FULL = 'FULL',         // Learning + finance + analytics
  OFFLINE = 'OFFLINE'     // Logs + replay only
}

export interface ModeConfig {
  mode: AceyMode;
  description: string;
  allowedSkills: string[];
  disabledFeatures: string[];
  resourceLimits: {
    maxCPU?: number;
    maxMemory?: number;
    maxGPU?: number;
  };
  autoTriggers?: string[];
}

export const MODE_CONFIGS: Record<AceyMode, ModeConfig> = {
  [AceyMode.OFF]: {
    mode: AceyMode.OFF,
    description: 'Acey not running at all',
    allowedSkills: [],
    disabledFeatures: ['all'],
    resourceLimits: {}
  },
  
  [AceyMode.SAFE]: {
    mode: AceyMode.SAFE,
    description: 'Emergency fallback - monitoring + alerts only',
    allowedSkills: ['stability-watchdog', 'logger', 'alerts'],
    disabledFeatures: ['learning', 'fine-tuning', 'graphics', 'audio', 'code-generation', 'analytics'],
    resourceLimits: {
      maxCPU: 30,
      maxMemory: 512,
      maxGPU: 0
    },
    autoTriggers: ['cpu-threshold', 'memory-leak', 'skill-crash-loop', 'manual-toggle']
  },
  
  [AceyMode.MINIMAL]: {
    mode: AceyMode.MINIMAL,
    description: 'Website + game health only',
    allowedSkills: ['stream-ops', 'health-monitor', 'logger'],
    disabledFeatures: ['learning', 'fine-tuning', 'graphics', 'audio', 'analytics', 'finance'],
    resourceLimits: {
      maxCPU: 50,
      maxMemory: 1024,
      maxGPU: 10
    }
  },
  
  [AceyMode.CREATOR]: {
    mode: AceyMode.CREATOR,
    description: 'Code / audio / graphics helpers',
    allowedSkills: ['code-helper', 'audio-maestro', 'graphics-wizard', 'logger', 'stability-watchdog'],
    disabledFeatures: ['learning', 'fine-tuning', 'analytics', 'finance'],
    resourceLimits: {
      maxCPU: 70,
      maxMemory: 2048,
      maxGPU: 50
    }
  },
  
  [AceyMode.FULL]: {
    mode: AceyMode.FULL,
    description: 'Learning + finance + analytics',
    allowedSkills: ['all'], // All skills allowed
    disabledFeatures: [],
    resourceLimits: {
      maxCPU: 85,
      maxMemory: 4096,
      maxGPU: 80
    }
  },
  
  [AceyMode.OFFLINE]: {
    mode: AceyMode.OFFLINE,
    description: 'Logs + replay only',
    allowedSkills: ['replay-engine', 'logger', 'audit'],
    disabledFeatures: ['all-active', 'llm-calls', 'generation', 'network'],
    resourceLimits: {
      maxCPU: 20,
      maxMemory: 256,
      maxGPU: 0
    }
  }
};

export class ModeManager {
  private currentMode: AceyMode = AceyMode.OFF;
  private modeHistory: Array<{mode: AceyMode, timestamp: string, reason?: string}> = [];
  
  constructor() {
    this.loadModeFromStorage();
  }

  // Get current mode
  getCurrentMode(): AceyMode {
    return this.currentMode;
  }

  // Get mode config
  getModeConfig(mode?: AceyMode): ModeConfig {
    return MODE_CONFIGS[mode || this.currentMode];
  }

  // Switch to new mode
  async switchMode(newMode: AceyMode, reason?: string): Promise<boolean> {
    if (newMode === this.currentMode) {
      console.log(`ModeManager: Already in ${newMode} mode`);
      return true;
    }

    const oldConfig = this.getModeConfig();
    const newConfig = MODE_CONFIGS[newMode];

    console.log(`ModeManager: Switching from ${this.currentMode} to ${newMode} - ${reason || 'manual'}`);

    // Validate mode switch
    if (!this.validateModeSwitch(newMode)) {
      console.error(`ModeManager: Cannot switch to ${newMode} - validation failed`);
      return false;
    }

    // Record mode change
    this.modeHistory.push({
      mode: this.currentMode,
      timestamp: new Date().toISOString(),
      reason: reason || 'manual'
    });

    // Execute mode transition
    try {
      await this.executeModeTransition(oldConfig, newConfig);
      this.currentMode = newMode;
      this.saveModeToStorage();
      
      console.log(`ModeManager: Successfully switched to ${newMode} mode`);
      return true;
      
    } catch (error: any) {
      console.error(`ModeManager: Mode switch failed - ${error.message}`);
      return false;
    }
  }

  // Validate mode switch
  private validateModeSwitch(newMode: AceyMode): boolean {
    const newConfig = MODE_CONFIGS[newMode];
    
    // Check resource constraints for FULL mode
    if (newMode === AceyMode.FULL) {
      // Would check current system resources
      const currentResources = this.getCurrentResources();
      if (currentResources.cpu > 80 || currentResources.memory > 3500) {
        console.warn('ModeManager: Insufficient resources for FULL mode');
        return false;
      }
    }

    // SAFE mode can always be activated (emergency override)
    if (newMode === AceyMode.SAFE) {
      return true;
    }

    return true;
  }

  // Execute mode transition
  private async executeModeTransition(oldConfig: ModeConfig, newConfig: ModeConfig): Promise<void> {
    console.log(`ModeManager: Transitioning - disabling: ${oldConfig.disabledFeatures.join(', ')}`);
    console.log(`ModeManager: Transitioning - enabling skills: ${newConfig.allowedSkills.join(', ')}`);

    // This would interface with the stability module to:
    // 1. Disable skills not in newConfig.allowedSkills
    // 2. Enable skills in newConfig.allowedSkills
    // 3. Apply resource limits
    // 4. Configure feature flags
    
    // Placeholder for actual implementation
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate transition time
  }

  // Get current system resources (placeholder)
  private getCurrentResources(): {cpu: number, memory: number, gpu: number} {
    return {
      cpu: 45, // Would get actual CPU usage
      memory: 2048, // Would get actual memory usage
      gpu: 25 // Would get actual GPU usage
    };
  }

  // Auto-trigger SAFE mode
  async triggerSafeMode(reason: string): Promise<void> {
    console.log(`ModeManager: Auto-triggering SAFE mode - ${reason}`);
    await this.switchMode(AceyMode.SAFE, `auto-safe: ${reason}`);
  }

  // Check if feature is allowed in current mode
  isFeatureAllowed(feature: string): boolean {
    const config = this.getModeConfig();
    return !config.disabledFeatures.includes(feature) && !config.disabledFeatures.includes('all');
  }

  // Check if skill is allowed in current mode
  isSkillAllowed(skillName: string): boolean {
    const config = this.getModeConfig();
    return config.allowedSkills.includes('all') || config.allowedSkills.includes(skillName);
  }

  // Get mode history
  getModeHistory(): Array<{mode: AceyMode, timestamp: string, reason?: string}> {
    return [...this.modeHistory];
  }

  // Save mode to storage
  private saveModeToStorage(): void {
    // In real implementation, would save to file or database
    console.log(`ModeManager: Saving mode ${this.currentMode} to storage`);
  }

  // Load mode from storage
  private loadModeFromStorage(): void {
    // In real implementation, would load from file or database
    console.log(`ModeManager: Loading mode from storage - defaulting to OFF`);
    this.currentMode = AceyMode.OFF;
  }

  // Get available modes
  getAvailableModes(): Array<{mode: AceyMode, description: string, current: boolean}> {
    return Object.values(AceyMode).map(mode => ({
      mode,
      description: MODE_CONFIGS[mode].description,
      current: mode === this.currentMode
    }));
  }

  // Get mode statistics
  getModeStats(): any {
    const modeCounts = this.modeHistory.reduce((acc, entry) => {
      acc[entry.mode] = (acc[entry.mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      currentMode: this.currentMode,
      totalSwitches: this.modeHistory.length,
      modeCounts,
      lastSwitch: this.modeHistory[this.modeHistory.length - 1]?.timestamp,
      uptimeByMode: this.calculateUptimeByMode()
    };
  }

  // Calculate uptime by mode (placeholder)
  private calculateUptimeByMode(): Record<string, number> {
    // In real implementation, would calculate actual time spent in each mode
    return {
      [AceyMode.OFF]: 0,
      [AceyMode.SAFE]: 0,
      [AceyMode.MINIMAL]: 0,
      [AceyMode.CREATOR]: 0,
      [AceyMode.FULL]: 0,
      [AceyMode.OFFLINE]: 0
    };
  }
}
