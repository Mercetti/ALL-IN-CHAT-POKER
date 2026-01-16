/**
 * Stability Watchdog
 * Always-on guardian that runs even when Acey is OFF
 */

export interface WatchdogConfig {
  checkIntervalMs: number;
  maxRetries: number;
  escalationThresholds: {
    skillCrashes: number;
    resourceSpike: number;
    memoryLeak: number;
  };
  autoSafeMode: boolean;
}

export interface HealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  lastCheck: string;
  metrics?: any;
  error?: string;
}

export interface EscalationEvent {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  issue: string;
  timestamp: string;
  actions: string[];
  resolved: boolean;
}

export class StabilityWatchdog {
  private config: WatchdogConfig;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private escalationEvents: EscalationEvent[] = [];
  private componentRetries: Map<string, number> = new Map();
  private lastSystemSnapshot: any = null;

  constructor(config?: Partial<WatchdogConfig>) {
    this.config = {
      checkIntervalMs: 10000, // 10 seconds
      maxRetries: 3,
      escalationThresholds: {
        skillCrashes: 2,
        resourceSpike: 90,
        memoryLeak: 1024 // MB growth
      },
      autoSafeMode: true,
      ...config
    };
  }

  // Start watchdog
  start(): void {
    if (this.isRunning) {
      console.warn('StabilityWatchdog: Already running');
      return;
    }

    console.log('StabilityWatchdog: Starting always-on guardian');
    this.isRunning = true;
    
    this.intervalId = setInterval(() => {
      this.performHealthChecks();
    }, this.config.checkIntervalMs);

    // Perform initial check
    this.performHealthChecks();
  }

  // Stop watchdog
  stop(): void {
    if (!this.isRunning) {
      console.warn('StabilityWatchdog: Not running');
      return;
    }

    console.log('StabilityWatchdog: Stopping guardian');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Main health check loop
  private async performHealthChecks(): Promise<void> {
    try {
      // Check system resources
      await this.checkSystemResources();
      
      // Check component health
      await this.checkComponentHealth();
      
      // Check for memory leaks
      await this.checkMemoryLeaks();
      
      // Check for stuck processes
      await this.checkStuckProcesses();
      
      // Evaluate escalations
      await this.evaluateEscalations();
      
    } catch (error: any) {
      console.error(`StabilityWatchdog: Health check failed - ${error.message}`);
      this.createEscalation('critical', 'watchdog', `Health check failure: ${error.message}`, ['restart-watchdog']);
    }
  }

  // Check system resources
  private async checkSystemResources(): Promise<void> {
    const resources = await this.getSystemResources();
    
    this.updateHealthCheck('system', {
      component: 'system',
      status: this.getResourceStatus(resources),
      lastCheck: new Date().toISOString(),
      metrics: resources
    });

    // Check for resource spikes
    if (resources.cpu > this.config.escalationThresholds.resourceSpike) {
      this.createEscalation('high', 'system', `CPU spike: ${resources.cpu}%`, ['throttle-non-essential']);
    }

    if (resources.memory > this.config.escalationThresholds.memoryLeak) {
      this.createEscalation('medium', 'system', `Memory usage high: ${resources.memory}MB`, ['check-memory-leak']);
    }
  }

  // Check component health
  private async checkComponentHealth(): Promise<void> {
    // This would check actual component health
    const components = ['acey-engine', 'skills', 'llm-connections', 'database'];
    
    for (const component of components) {
      const isHealthy = await this.checkComponent(component);
      
      this.updateHealthCheck(component, {
        component,
        status: isHealthy ? 'healthy' : 'critical',
        lastCheck: new Date().toISOString()
      });

      if (!isHealthy) {
        this.handleComponentFailure(component);
      }
    }
  }

  // Check for memory leaks
  private async checkMemoryLeaks(): Promise<void> {
    const currentSnapshot = await this.getMemorySnapshot();
    
    if (this.lastSystemSnapshot) {
      const memoryGrowth = currentSnapshot.heapUsed - this.lastSystemSnapshot.heapUsed;
      
      if (memoryGrowth > this.config.escalationThresholds.memoryLeak * 1024 * 1024) { // Convert MB to bytes
        this.createEscalation('medium', 'system', `Memory leak detected: ${Math.round(memoryGrowth / 1024 / 1024)}MB growth`, ['restart-components', 'gc-force']);
      }
    }
    
    this.lastSystemSnapshot = currentSnapshot;
  }

  // Check for stuck processes
  private async checkStuckProcesses(): Promise<void> {
    // This would check for processes that have been running too long without progress
    const processes = await this.getRunningProcesses();
    
    for (const process of processes) {
      if (process.duration > 300000 && !process.makingProgress) { // 5 minutes
        this.createEscalation('medium', process.name, `Process stuck: ${process.name} (${Math.round(process.duration / 1000)}s)`, ['restart-process']);
      }
    }
  }

  // Handle component failure
  private handleComponentFailure(component: string): void {
    const retryCount = this.componentRetries.get(component) || 0;
    
    if (retryCount < this.config.maxRetries) {
      console.log(`StabilityWatchdog: Restarting component ${component} (attempt ${retryCount + 1})`);
      this.componentRetries.set(component, retryCount + 1);
      
      // Attempt restart
      this.restartComponent(component);
      
    } else {
      console.error(`StabilityWatchdog: Component ${component} failed after ${retryCount} retries`);
      this.createEscalation('high', component, `Component failed after ${retryCount} retries`, ['disable-component', 'escalate-to-safe']);
      
      // Reset retry count after escalation
      this.componentRetries.delete(component);
    }
  }

  // Evaluate escalations
  private async evaluateEscalations(): Promise<void> {
    const recentEscalations = this.escalationEvents.filter(e => 
      !e.resolved && (Date.now() - new Date(e.timestamp).getTime()) < 300000 // Last 5 minutes
    );

    // Check for escalation patterns
    const criticalEscalations = recentEscalations.filter(e => e.severity === 'critical');
    const highEscalations = recentEscalations.filter(e => e.severity === 'high');

    // Auto-trigger Safe Mode if needed
    if (this.config.autoSafeMode) {
      if (criticalEscalations.length > 0 || highEscalations.length >= 2) {
        await this.triggerSafeMode('Multiple critical escalations detected');
      }
    }
  }

  // Create escalation event
  private createEscalation(severity: 'low' | 'medium' | 'high' | 'critical', component: string, issue: string, actions: string[]): void {
    const escalation: EscalationEvent = {
      id: `escal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      component,
      issue,
      timestamp: new Date().toISOString(),
      actions,
      resolved: false
    };

    this.escalationEvents.push(escalation);
    console.warn(`StabilityWatchdog: ESCALATION [${severity.toUpperCase()}] ${component}: ${issue}`);

    // Keep only last 100 escalations
    if (this.escalationEvents.length > 100) {
      this.escalationEvents = this.escalationEvents.slice(-100);
    }
  }

  // Trigger Safe Mode
  private async triggerSafeMode(reason: string): Promise<void> {
    console.log(`StabilityWatchdog: Triggering Safe Mode - ${reason}`);
    
    // This would interface with the mode manager
    // await modeManager.switchMode(AceyMode.SAFE, `watchdog-auto: ${reason}`);
    
    this.createEscalation('critical', 'system', `Safe Mode triggered: ${reason}`, ['notify-founder', 'disable-non-essential']);
  }

  // Get resource status based on thresholds
  private getResourceStatus(resources: any): 'healthy' | 'warning' | 'critical' | 'offline' {
    if (resources.cpu > 95 || resources.memory > 95) return 'critical';
    if (resources.cpu > 80 || resources.memory > 85) return 'warning';
    return 'healthy';
  }

  // Update health check
  private updateHealthCheck(component: string, healthCheck: HealthCheck): void {
    this.healthChecks.set(component, healthCheck);
  }

  // Get system resources (placeholder)
  private async getSystemResources(): Promise<{cpu: number, memory: number, gpu: number}> {
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      gpu: Math.random() * 100
    };
  }

  // Get memory snapshot (placeholder)
  private async getMemorySnapshot(): Promise<{heapUsed: number, heapTotal: number}> {
    return {
      heapUsed: Math.random() * 1024 * 1024 * 1024, // Random bytes
      heapTotal: 2048 * 1024 * 1024 // 2GB
    };
  }

  // Get running processes (placeholder)
  private async getRunningProcesses(): Promise<Array<{name: string, duration: number, makingProgress: boolean}>> {
    return [];
  }

  // Check individual component (placeholder)
  private async checkComponent(component: string): Promise<boolean> {
    return Math.random() > 0.1; // 90% success rate
  }

  // Restart component (placeholder)
  private async restartComponent(component: string): Promise<void> {
    console.log(`StabilityWatchdog: Restarting component ${component}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Get current health status
  getHealthStatus(): {
    overall: 'healthy' | 'warning' | 'critical';
    components: Array<HealthCheck>;
    activeEscalations: Array<EscalationEvent>;
    uptime: number;
  } {
    const components = Array.from(this.healthChecks.values());
    const activeEscalations = this.escalationEvents.filter(e => !e.resolved);
    
    // Determine overall status
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (components.some(c => c.status === 'critical') || activeEscalations.some(e => e.severity === 'critical')) {
      overall = 'critical';
    } else if (components.some(c => c.status === 'warning') || activeEscalations.some(e => e.severity === 'high')) {
      overall = 'warning';
    }

    return {
      overall,
      components,
      activeEscalations,
      uptime: this.isRunning ? Date.now() : 0 // Placeholder
    };
  }

  // Get escalation history
  getEscalationHistory(): EscalationEvent[] {
    return [...this.escalationEvents];
  }

  // Resolve escalation
  resolveEscalation(escalationId: string): void {
    const escalation = this.escalationEvents.find(e => e.id === escalationId);
    if (escalation) {
      escalation.resolved = true;
      console.log(`StabilityWatchdog: Resolved escalation ${escalationId}`);
    }
  }

  // Get watchdog statistics
  getStats(): any {
    const resolvedEscalations = this.escalationEvents.filter(e => e.resolved);
    const activeEscalations = this.escalationEvents.filter(e => !e.resolved);
    
    return {
      isRunning: this.isRunning,
      checkInterval: this.config.checkIntervalMs,
      totalEscalations: this.escalationEvents.length,
      activeEscalations: activeEscalations.length,
      resolvedEscalations: resolvedEscalations.length,
      componentsMonitored: this.healthChecks.size,
      uptime: this.isRunning ? Date.now() : 0,
      lastCheck: new Date().toISOString()
    };
  }
}
