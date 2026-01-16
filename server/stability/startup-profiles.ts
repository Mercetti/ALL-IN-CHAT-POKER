/**
 * Startup Profiles
 * Cold/warm boot configurations for mode-specific skill loading
 */

export interface StartupProfile {
  name: string;
  mode: string;
  description: string;
  startupOrder: string[];
  preStartupChecks: string[];
  postStartupActions: string[];
  resourceReservations: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  timeoutMs: number;
  fallbackMode?: string;
}

export const STARTUP_PROFILES: Record<string, StartupProfile> = {
  'safe': {
    name: 'Safe Mode',
    mode: 'SAFE',
    description: 'Emergency fallback - monitoring and alerts only',
    startupOrder: [
      'logger',
      'stability-watchdog',
      'resource-monitor',
      'alerts'
    ],
    preStartupChecks: [
      'check-disk-space',
      'verify-log-access',
      'test-alert-system'
    ],
    postStartupActions: [
      'enable-safe-mode-banner',
      'disable-non-essential-timers',
      'set-resource-limits'
    ],
    resourceReservations: {
      cpu: 15,
      memory: 256,
      gpu: 0
    },
    timeoutMs: 5000,
    fallbackMode: 'OFF'
  },

  'minimal': {
    name: 'Minimal Mode',
    mode: 'MINIMAL',
    description: 'Website + game health monitoring',
    startupOrder: [
      'logger',
      'resource-monitor',
      'stability-watchdog',
      'stream-ops',
      'health-monitor'
    ],
    preStartupChecks: [
      'check-network-connectivity',
      'verify-game-connection',
      'test-health-endpoints'
    ],
    postStartupActions: [
      'enable-basic-monitoring',
      'start-health-checks',
      'initialize-alert-routing'
    ],
    resourceReservations: {
      cpu: 25,
      memory: 512,
      gpu: 5
    },
    timeoutMs: 10000,
    fallbackMode: 'SAFE'
  },

  'creator': {
    name: 'Creator Mode',
    mode: 'CREATOR',
    description: 'Code, audio, and graphics generation tools',
    startupOrder: [
      'logger',
      'resource-monitor',
      'stability-watchdog',
      'code-helper',
      'audio-maestro',
      'graphics-wizard',
      'llm-validator'
    ],
    preStartupChecks: [
      'check-llm-connectivity',
      'verify-gpu-drivers',
      'test-code-generation',
      'validate-audio-devices'
    ],
    postStartupActions: [
      'enable-creative-tools',
      'warm-up-models',
      'initialize-workspace',
      'start-generation-cache'
    ],
    resourceReservations: {
      cpu: 50,
      memory: 2048,
      gpu: 40
    },
    timeoutMs: 15000,
    fallbackMode: 'MINIMAL'
  },

  'full': {
    name: 'Full Mode',
    mode: 'FULL',
    description: 'Complete system with learning and analytics',
    startupOrder: [
      'logger',
      'resource-monitor',
      'stability-watchdog',
      'code-helper',
      'audio-maestro',
      'graphics-wizard',
      'finance-engine',
      'analytics',
      'learning-engine',
      'fine-tuner',
      'llm-validator',
      'rollback-manager'
    ],
    preStartupChecks: [
      'check-all-external-apis',
      'verify-database-connections',
      'test-learning-pipeline',
      'validate-financial-modules',
      'check-disk-space-for-learning'
    ],
    postStartupActions: [
      'enable-all-features',
      'start-learning-cycles',
      'initialize-analytics-tracking',
      'warm-up-all-models',
      'enable-auto-backups'
    ],
    resourceReservations: {
      cpu: 75,
      memory: 4096,
      gpu: 70
    },
    timeoutMs: 30000,
    fallbackMode: 'CREATOR'
  },

  'offline': {
    name: 'Offline Mode',
    mode: 'OFFLINE',
    description: 'Logs, replay, and audit only',
    startupOrder: [
      'logger',
      'replay-engine',
      'audit-system',
      'log-viewer'
    ],
    preStartupChecks: [
      'verify-log-files',
      'check-replay-data',
      'test-audit-exports'
    ],
    postStartupActions: [
      'disable-network-features',
      'enable-offline-browsing',
      'initialize-replay-index',
      'start-log-compression'
    ],
    resourceReservations: {
      cpu: 10,
      memory: 128,
      gpu: 0
    },
    timeoutMs: 3000,
    fallbackMode: 'SAFE'
  }
};

export class ProfileManager {
  private currentProfile: string = 'safe';
  private startupHistory: Array<{profile: string, timestamp: string, success: boolean, duration: number}> = [];

  constructor() {
    this.loadLastProfile();
  }

  // Get current profile
  getCurrentProfile(): string {
    return this.currentProfile;
  }

  // Get profile by name
  getProfile(name: string): StartupProfile | null {
    return STARTUP_PROFILES[name] || null;
  }

  // Get all available profiles
  getAvailableProfiles(): Array<{name: string, description: string, current: boolean}> {
    return Object.entries(STARTUP_PROFILES).map(([name, profile]) => ({
      name,
      description: profile.description,
      current: name === this.currentProfile
    }));
  }

  // Execute startup profile
  async executeStartup(profileName: string): Promise<boolean> {
    const profile = STARTUP_PROFILES[profileName];
    if (!profile) {
      console.error(`ProfileManager: Profile ${profileName} not found`);
      return false;
    }

    console.log(`ProfileManager: Starting ${profile.name} profile`);
    const startTime = Date.now();

    try {
      // Step 1: Pre-startup checks
      if (!await this.executePreStartupChecks(profile)) {
        console.error(`ProfileManager: Pre-startup checks failed for ${profileName}`);
        await this.fallbackToProfile(profile.fallbackMode || 'safe');
        return false;
      }

      // Step 2: Resource reservation
      if (!await this.reserveResources(profile.resourceReservations)) {
        console.error(`ProfileManager: Resource reservation failed for ${profileName}`);
        await this.fallbackToProfile(profile.fallbackMode || 'safe');
        return false;
      }

      // Step 3: Sequential startup
      if (!await this.executeStartupSequence(profile)) {
        console.error(`ProfileManager: Startup sequence failed for ${profileName}`);
        await this.fallbackToProfile(profile.fallbackMode || 'safe');
        return false;
      }

      // Step 4: Post-startup actions
      await this.executePostStartupActions(profile);

      const duration = Date.now() - startTime;
      this.recordStartup(profileName, true, duration);
      this.currentProfile = profileName;
      this.saveCurrentProfile();

      console.log(`ProfileManager: ${profile.name} profile started successfully in ${duration}ms`);
      return true;

    } catch (error: any) {
      console.error(`ProfileManager: Startup failed for ${profileName} - ${error.message}`);
      await this.fallbackToProfile(profile.fallbackMode || 'safe');
      
      const duration = Date.now() - startTime;
      this.recordStartup(profileName, false, duration);
      return false;
    }
  }

  // Execute pre-startup checks
  private async executePreStartupChecks(profile: StartupProfile): Promise<boolean> {
    console.log(`ProfileManager: Executing ${profile.preStartupChecks.length} pre-startup checks`);

    for (const check of profile.preStartupChecks) {
      try {
        const result = await this.performCheck(check);
        if (!result) {
          console.error(`ProfileManager: Pre-startup check failed: ${check}`);
          return false;
        }
      } catch (error: any) {
        console.error(`ProfileManager: Pre-startup check error: ${check} - ${error.message}`);
        return false;
      }
    }

    return true;
  }

  // Execute startup sequence
  private async executeStartupSequence(profile: StartupProfile): Promise<boolean> {
    console.log(`ProfileManager: Starting ${profile.startupOrder.length} components in order`);

    for (const component of profile.startupOrder) {
      try {
        console.log(`ProfileManager: Starting component: ${component}`);
        const success = await this.startComponent(component, profile.timeoutMs);
        
        if (!success) {
          console.error(`ProfileManager: Failed to start component: ${component}`);
          return false;
        }
      } catch (error: any) {
        console.error(`ProfileManager: Component startup error: ${component} - ${error.message}`);
        return false;
      }
    }

    return true;
  }

  // Execute post-startup actions
  private async executePostStartupActions(profile: StartupProfile): Promise<void> {
    console.log(`ProfileManager: Executing ${profile.postStartupActions.length} post-startup actions`);

    for (const action of profile.postStartupActions) {
      try {
        await this.performAction(action);
      } catch (error: any) {
        console.warn(`ProfileManager: Post-startup action warning: ${action} - ${error.message}`);
      }
    }
  }

  // Reserve system resources
  private async reserveResources(reservations: {cpu: number, memory: number, gpu: number}): Promise<boolean> {
    console.log(`ProfileManager: Reserving resources - CPU: ${reservations.cpu}%, Memory: ${reservations.memory}MB, GPU: ${reservations.gpu}%`);
    
    // In real implementation, would check actual system resources
    const currentResources = this.getCurrentResources();
    
    if (currentResources.cpu < reservations.cpu || 
        currentResources.memory < reservations.memory || 
        currentResources.gpu < reservations.gpu) {
      console.warn('ProfileManager: Insufficient resources for profile');
      return false;
    }

    return true;
  }

  // Perform individual check (placeholder)
  private async performCheck(checkName: string): Promise<boolean> {
    console.log(`ProfileManager: Performing check: ${checkName}`);
    
    // In real implementation, would perform actual checks
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  // Start individual component (placeholder)
  private async startComponent(componentName: string, timeoutMs: number): Promise<boolean> {
    console.log(`ProfileManager: Starting component: ${componentName} (timeout: ${timeoutMs}ms)`);
    
    // In real implementation, would start actual component
    await new Promise(resolve => setTimeout(resolve, 200));
    return true;
  }

  // Perform individual action (placeholder)
  private async performAction(actionName: string): Promise<void> {
    console.log(`ProfileManager: Performing action: ${actionName}`);
    
    // In real implementation, would perform actual action
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Get current system resources (placeholder)
  private getCurrentResources(): {cpu: number, memory: number, gpu: number} {
    return {
      cpu: 80,
      memory: 8192,
      gpu: 100
    };
  }

  // Fallback to safer profile
  private async fallbackToProfile(profileName?: string): Promise<void> {
    if (!profileName) return;
    
    console.log(`ProfileManager: Falling back to ${profileName} profile`);
    await this.executeStartup(profileName);
  }

  // Record startup attempt
  private recordStartup(profileName: string, success: boolean, duration: number): void {
    this.startupHistory.push({
      profile: profileName,
      timestamp: new Date().toISOString(),
      success,
      duration
    });

    // Keep only last 50 startup records
    if (this.startupHistory.length > 50) {
      this.startupHistory = this.startupHistory.slice(-50);
    }
  }

  // Save current profile
  private saveCurrentProfile(): void {
    // In real implementation, would save to file or database
    console.log(`ProfileManager: Saving current profile: ${this.currentProfile}`);
  }

  // Load last profile
  private loadLastProfile(): void {
    // In real implementation, would load from file or database
    console.log(`ProfileManager: Loading last profile - defaulting to safe`);
    this.currentProfile = 'safe';
  }

  // Get startup statistics
  getStartupStats(): any {
    const successCount = this.startupHistory.filter(h => h.success).length;
    const failureCount = this.startupHistory.filter(h => !h.success).length;
    const avgDuration = this.startupHistory.reduce((sum, h) => sum + h.duration, 0) / this.startupHistory.length || 0;

    return {
      currentProfile: this.currentProfile,
      totalStartups: this.startupHistory.length,
      successCount,
      failureCount,
      successRate: this.startupHistory.length > 0 ? (successCount / this.startupHistory.length) * 100 : 0,
      averageDuration: Math.round(avgDuration),
      lastStartup: this.startupHistory[this.startupHistory.length - 1],
      profileCounts: this.getProfileCounts()
    };
  }

  // Get startup counts by profile
  private getProfileCounts(): Record<string, number> {
    return this.startupHistory.reduce((acc, entry) => {
      acc[entry.profile] = (acc[entry.profile] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
