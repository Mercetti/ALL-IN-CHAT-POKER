/**
 * Resource Monitor
 * Monitors CPU, GPU, RAM usage and triggers throttling
 */

export interface ResourceThresholds {
  cpu: number;     // percentage
  gpu: number;     // percentage  
  ram: number;     // percentage
}

export interface ResourceUsage {
  cpu: number;
  gpu: number;
  ram: number;
  disk: number;
  exceedsThresholds: boolean;
}

export class ResourceMonitor {
  private thresholds: ResourceThresholds;
  private monitoring: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(thresholds: ResourceThresholds) {
    this.thresholds = thresholds;
  }

  start(): void {
    if (this.monitoring) return;
    
    this.monitoring = true;
    this.intervalId = setInterval(() => {
      this.checkResources();
    }, 5000); // Check every 5 seconds
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.monitoring = false;
  }

  getCurrentUsage(): ResourceUsage {
    // Stub implementation - replace with actual system calls
    const usage = this.getSystemMetrics();
    usage.exceedsThresholds = this.checkThresholds(usage);
    return usage;
  }

  private getSystemMetrics(): ResourceUsage {
    // Placeholder - would use actual system monitoring libraries
    // For now, return mock data
    return {
      cpu: Math.random() * 100,
      gpu: Math.random() * 100,
      ram: Math.random() * 100,
      disk: Math.random() * 100,
      exceedsThresholds: false
    };
  }

  private checkThresholds(usage: ResourceUsage): boolean {
    return (
      usage.cpu > this.thresholds.cpu ||
      usage.gpu > this.thresholds.gpu ||
      usage.ram > this.thresholds.ram
    );
  }

  private checkResources(): void {
    const usage = this.getCurrentUsage();
    
    if (usage.exceedsThresholds) {
      console.warn(`Resource thresholds exceeded: CPU ${usage.cpu.toFixed(1)}%, GPU ${usage.gpu.toFixed(1)}%, RAM ${usage.ram.toFixed(1)}%`);
      
      // This would trigger callbacks to stability module
      if (usage.cpu > 90 || usage.ram > 90) {
        console.error('CRITICAL: Resource usage at dangerous levels');
      }
    }
  }

  // Get detailed system information
  getDetailedInfo(): any {
    return {
      current: this.getCurrentUsage(),
      thresholds: this.thresholds,
      monitoring: this.monitoring,
      timestamp: new Date().toISOString()
    };
  }
}
