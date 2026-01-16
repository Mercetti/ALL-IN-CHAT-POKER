/**
 * Watchdog
 * Monitors skill health and restarts failed components
 */

import { AceyStabilityModule } from "./acey-stability";

export class Watchdog {
  private intervalId?: NodeJS.Timeout;
  private running: boolean = false;

  constructor(private acey: AceyStabilityModule) {}

  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.intervalId = setInterval(async () => {
      await this.checkSystemHealth();
    }, 5000); // Check every 5 seconds
    
    console.log('Watchdog started');
  }

  stop(): void {
    if (!this.running) return;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.running = false;
    
    console.log('Watchdog stopped');
  }

  forceStop(): void {
    // Emergency stop - no graceful shutdown
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.running = false;
    
    console.log('Watchdog force stopped');
  }

  private async checkSystemHealth(): Promise<void> {
    try {
      // Check skill health
      await this.acey.checkSkillsHealth();
      
      // Check overall system health
      if (!this.acey.isSystemHealthy()) {
        console.warn('System health check failed');
        // This would trigger alerts and potentially emergency procedures
      }
      
    } catch (error: any) {
      console.error('Watchdog health check failed:', error.message);
      
      // If watchdog fails, we might need to restart the entire system
      if (error.message.includes('critical')) {
        console.error('Critical watchdog error - triggering emergency restart');
        await this.acey.emergencyStop();
      }
    }
  }

  // Get watchdog status
  getStatus(): any {
    return {
      running: this.running,
      intervalActive: !!this.intervalId,
      lastCheck: new Date().toISOString()
    };
  }
}
