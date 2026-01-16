/**
 * Auto Scheduler Module for Acey
 * Phase 7: Live Auto-Cycle Scheduling
 * 
 * This module provides automated scheduling of Acey's execution cycles
 * with owner control, real-time updates, and comprehensive monitoring
 */

import { EventEmitter } from 'events';
import { AceyExecutionPack, ExecutionResult } from './index';

export interface SchedulerConfig {
  intervalMs: number;
  enableAutoStart: boolean;
  enableNotifications: boolean;
  enableEmergencyMode: boolean;
  maxConsecutiveFailures: number;
  healthCheckInterval: number;
  logRetentionDays: number;
}

export interface SchedulerStatus {
  isRunning: boolean;
  isPaused: boolean;
  currentCycle: number;
  totalCycles: number;
  intervalMs: number;
  lastCycleTime: string;
  nextCycleTime: string;
  consecutiveFailures: number;
  uptime: string;
  performance: {
    avgCycleTime: number;
    successRate: number;
    errorRate: number;
  };
  alerts: Array<{
    type: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

export interface CycleMetrics {
  cycleNumber: number;
  startTime: string;
  endTime: string;
  duration: number;
  success: boolean;
  skillsExecuted: number;
  skillsSucceeded: number;
  devicesSynced: number;
  proposalsGenerated: number;
  revenueGenerated: number;
  learningEntriesCollected: number;
  errors: string[];
  warnings: string[];
  systemHealth: 'excellent' | 'good' | 'poor' | 'critical';
}

export class AutoScheduler extends EventEmitter {
  private pack: AceyExecutionPack;
  private config: SchedulerConfig;
  private timer: NodeJS.Timeout | null = null;
  private healthTimer: NodeJS.Timeout | null = null;
  
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private currentCycle: number = 0;
  private totalCycles: number = 0;
  private consecutiveFailures: number = 0;
  private startTime: string = '';
  
  private cycleHistory: CycleMetrics[] = [];
  private alerts: Array<{
    type: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
  }> = [];

  constructor(pack: AceyExecutionPack, config: Partial<SchedulerConfig> = {}) {
    super();
    this.pack = pack;
    this.config = {
      intervalMs: 60000, // default 60 seconds
      enableAutoStart: false,
      enableNotifications: true,
      enableEmergencyMode: true,
      maxConsecutiveFailures: 3,
      healthCheckInterval: 30000, // 30 seconds
      logRetentionDays: 7,
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize the scheduler
   */
  private async initialize(): Promise<void> {
    try {
      console.log('⏰ Initializing Acey Auto Scheduler...');
      
      this.startTime = new Date().toISOString();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Auto-start if enabled
      if (this.config.enableAutoStart) {
        setTimeout(() => this.start(), 1000);
      }

      console.log('✅ Auto Scheduler initialized');
      console.log(`⏱️ Cycle interval: ${this.config.intervalMs}ms`);
      console.log(`🚀 Auto-start: ${this.config.enableAutoStart ? 'Enabled' : 'Disabled'}`);
      console.log(`🔔 Notifications: ${this.config.enableNotifications ? 'Enabled' : 'Disabled'}`);

    } catch (error) {
      console.error('❌ Failed to initialize scheduler:', error);
      this.addAlert('error', `Scheduler initialization failed: ${error}`);
    }
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen to execution pack events
    this.pack.on('cycleCompleted', (result: ExecutionResult) => {
      this.handleCycleCompleted(result);
    });

    this.pack.on('cycleError', (result: ExecutionResult) => {
      this.handleCycleError(result);
    });

    this.pack.on('emergencyMode', (data: any) => {
      this.handleEmergencyMode(data);
    });
  }

  /**
   * Start the auto scheduler
   */
  start(): void {
    if (this.isRunning && !this.isPaused) {
      console.log('⚠️ Auto scheduler is already running');
      return;
    }

    console.log('🚀 Starting Acey Auto Scheduler...');
    this.isRunning = true;
    this.isPaused = false;

    // Start the cycle timer
    this.timer = setInterval(async () => {
      if (!this.isPaused) {
        await this.runCycle();
      }
    }, this.config.intervalMs);

    // Run first cycle immediately
    this.runCycle().catch(error => {
      console.error('Initial cycle failed:', error);
    });

    this.addAlert('info', 'Auto scheduler started');
    this.emit('started', {
      timestamp: new Date().toISOString(),
      intervalMs: this.config.intervalMs
    });

    console.log('✅ Auto scheduler started');
    console.log(`⏱️ Cycle interval: ${this.config.intervalMs}ms`);
    console.log(`📊 Next cycle: ${new Date(Date.now() + this.config.intervalMs).toLocaleString()}`);
  }

  /**
   * Stop the auto scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Auto scheduler is not running');
      return;
    }

    console.log('🛑 Stopping Acey Auto Scheduler...');
    
    this.isRunning = false;
    this.isPaused = false;

    // Clear timers
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.addAlert('info', 'Auto scheduler stopped');
    this.emit('stopped', {
      timestamp: new Date().toISOString(),
      totalCycles: this.totalCycles,
      finalCycle: this.currentCycle
    });

    console.log('✅ Auto scheduler stopped');
    console.log(`📊 Total cycles completed: ${this.totalCycles}`);
  }

  /**
   * Pause the auto scheduler
   */
  pause(): void {
    if (!this.isRunning) {
      console.log('⚠️ Auto scheduler is not running');
      return;
    }

    console.log('⏸️ Pausing Acey Auto Scheduler...');
    this.isPaused = true;

    this.addAlert('info', 'Auto scheduler paused');
    this.emit('paused', {
      timestamp: new Date().toISOString(),
      currentCycle: this.currentCycle
    });

    console.log('✅ Auto scheduler paused');
  }

  /**
   * Resume the auto scheduler
   */
  resume(): void {
    if (!this.isRunning) {
      console.log('⚠️ Auto scheduler is not running');
      return;
    }

    if (!this.isPaused) {
      console.log('⚠️ Auto scheduler is not paused');
      return;
    }

    console.log('▶️ Resuming Acey Auto Scheduler...');
    this.isPaused = false;

    this.addAlert('info', 'Auto scheduler resumed');
    this.emit('resumed', {
      timestamp: new Date().toISOString(),
      currentCycle: this.currentCycle
    });

    console.log('✅ Auto scheduler resumed');
  }

  /**
   * Run a single cycle
   */
  private async runCycle(): Promise<void> {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    const cycleStart = Date.now();
    this.currentCycle++;

    console.log(`🔄 Running Auto Cycle #${this.currentCycle}`);
    console.log('=====================================\n');

    const cycleMetrics: CycleMetrics = {
      cycleNumber: this.currentCycle,
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0,
      success: false,
      skillsExecuted: 0,
      skillsSucceeded: 0,
      devicesSynced: 0,
      proposalsGenerated: 0,
      revenueGenerated: 0,
      learningEntriesCollected: 0,
      errors: [],
      warnings: [],
      systemHealth: 'excellent'
    };

    try {
      // Run the full execution pack cycle
      const result = await this.pack.runFullCycle();
      
      // Update cycle metrics
      cycleMetrics.endTime = new Date().toISOString();
      cycleMetrics.duration = Date.now() - cycleStart;
      cycleMetrics.success = result.success;
      cycleMetrics.skillsExecuted = result.metrics.skillsExecuted;
      cycleMetrics.skillsSucceeded = result.metrics.skillsSucceeded;
      cycleMetrics.devicesSynced = result.metrics.devicesSynced;
      cycleMetrics.proposalsGenerated = result.metrics.proposalsGenerated;
      cycleMetrics.revenueGenerated = result.metrics.revenueGenerated;
      cycleMetrics.learningEntriesCollected = result.metrics.learningEntriesCollected;
      cycleMetrics.systemHealth = result.metrics.systemHealth;
      
      if (result.errors) {
        cycleMetrics.errors = result.errors;
      }
      
      if (result.warnings) {
        cycleMetrics.warnings = result.warnings;
      }

      // Handle success
      if (result.success) {
        this.consecutiveFailures = 0;
        this.totalCycles++;
        
        console.log(`✅ Cycle #${this.currentCycle} completed successfully`);
        console.log(`📊 Duration: ${cycleMetrics.duration}ms`);
        console.log(`🎯 Skills: ${cycleMetrics.skillsExecuted} executed, ${cycleMetrics.skillsSucceeded} succeeded`);
        console.log(`📱 Devices: ${cycleMetrics.devicesSynced} synced`);
        console.log(`💡 Proposals: ${cycleMetrics.proposalsGenerated} generated`);
        console.log(`💰 Revenue: $${cycleMetrics.revenueGenerated}`);
        console.log(`📚 Learning: ${cycleMetrics.learningEntriesCollected} entries`);
        
        // Send notifications for important events
        if (this.config.enableNotifications) {
          this.sendCycleNotifications(cycleMetrics);
        }
      }

    } catch (error) {
      cycleMetrics.success = false;
      cycleMetrics.endTime = new Date().toISOString();
      cycleMetrics.duration = Date.now() - cycleStart;
      cycleMetrics.errors.push(error instanceof Error ? error.message : String(error));
      
      this.consecutiveFailures++;
      
      console.error(`❌ Cycle #${this.currentCycle} failed:`, error);
      
      // Handle consecutive failures
      if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
        this.handleConsecutiveFailures();
      }
      
      this.addAlert('error', `Cycle #${this.currentCycle} failed: ${error}`);
    }

    // Store cycle metrics
    this.cycleHistory.push(cycleMetrics);
    
    // Clean old cycle history
    this.cleanOldCycles();
    
    // Update status
    this.updateStatus();
    
    console.log(`⏱️ Cycle completed in ${cycleMetrics.duration}ms`);
    console.log(`📊 Total cycles: ${this.totalCycles}`);
    console.log(`🔄 Next cycle: ${new Date(Date.now() + this.config.intervalMs).toLocaleString()}`);
    console.log('=====================================\n');

    this.emit('cycleCompleted', cycleMetrics);
  }

  /**
   * Handle cycle completion
   */
  private handleCycleCompleted(result: ExecutionResult): void {
    // This is handled in runCycle method
    console.log('📊 Cycle completion event received');
  }

  /**
   * Handle cycle error
   */
  private handleCycleError(result: ExecutionResult): void {
    console.error('❌ Cycle error event received:', result.errors);
    
    if (this.config.enableNotifications) {
      this.sendErrorNotification(result);
    }
  }

  /**
   * Handle emergency mode
   */
  private handleEmergencyMode(data: any): void {
    console.log('🚨 Emergency mode event received:', data);
    
    this.addAlert('critical', `Emergency mode activated: ${data.enabled ? 'ON' : 'OFF'}`);
    
    if (this.config.enableNotifications) {
      this.sendEmergencyNotification(data);
    }
  }

  /**
   * Handle consecutive failures
   */
  private handleConsecutiveFailures(): void {
    console.log(`🚨 ${this.consecutiveFailures} consecutive failures detected`);
    
    if (this.config.enableEmergencyMode) {
      console.log('🚨 Enabling emergency mode due to consecutive failures');
      this.pack.enableEmergencyMode();
    }
    
    // Pause scheduler to prevent further failures
    this.pause();
    
    this.addAlert('critical', `Scheduler paused due to ${this.consecutiveFailures} consecutive failures`);
  }

  /**
   * Send cycle notifications
   */
  private sendCycleNotifications(metrics: CycleMetrics): void {
    // New skill proposals
    if (metrics.proposalsGenerated > 0) {
      console.log(`🔔 Notification: ${metrics.proposalsGenerated} new skill proposals generated`);
      this.addAlert('info', `${metrics.proposalsGenerated} new skill proposals generated`);
    }

    // Simulation failures
    if (metrics.skillsExecuted > 0 && metrics.skillsSucceeded < metrics.skillsExecuted) {
      const failures = metrics.skillsExecuted - metrics.skillsSucceeded;
      console.log(`🔔 Notification: ${failures} skill simulation failures detected`);
      this.addAlert('warning', `${failures} skill simulation failures detected`);
    }

    // Device desync
    if (metrics.devicesSynced === 0) {
      console.log('🔔 Notification: No devices synchronized');
      this.addAlert('warning', 'No devices synchronized in this cycle');
    }

    // Financial anomalies
    if (metrics.revenueGenerated > 1000) { // High revenue spike
      console.log(`🔔 Notification: High revenue generated: $${metrics.revenueGenerated}`);
      this.addAlert('info', `High revenue generated: $${metrics.revenueGenerated}`);
    }

    // System health issues
    if (metrics.systemHealth === 'critical' || metrics.systemHealth === 'poor') {
      console.log(`🔔 Notification: System health is ${metrics.systemHealth}`);
      this.addAlert('error', `System health is ${metrics.systemHealth}`);
    }
  }

  /**
   * Send error notification
   */
  private sendErrorNotification(result: ExecutionResult): void {
    console.log('🚨 Error notification sent:', result.errors);
    this.addAlert('error', `Cycle error: ${result.errors?.join(', ')}`);
  }

  /**
   * Send emergency notification
   */
  private sendEmergencyNotification(data: any): void {
    console.log('🚨 Emergency notification sent:', data);
    this.addAlert('critical', `Emergency mode: ${data.enabled ? 'ACTIVATED' : 'DEACTIVATED'}`);
  }

  /**
   * Add alert
   */
  private addAlert(type: 'info' | 'warning' | 'error' | 'critical', message: string): void {
    const alert = {
      type,
      message,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    this.emit('alert', alert);
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    const uptime = Date.now() - new Date(this.startTime).getTime();
    const uptimeHours = uptime / (1000 * 60 * 60);
    
    // Check for long uptime without restart
    if (uptimeHours > 24) {
      this.addAlert('info', `Scheduler uptime: ${uptimeHours.toFixed(1)} hours`);
    }
    
    // Check for high alert count
    const recentAlerts = this.alerts.filter(alert => 
      Date.now() - new Date(alert.timestamp).getTime() < 60000 // Last minute
    );
    
    if (recentAlerts.length > 5) {
      this.addAlert('warning', 'High alert frequency detected');
    }
  }

  /**
   * Clean old cycle history
   */
  private cleanOldCycles(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.logRetentionDays);
    
    this.cycleHistory = this.cycleHistory.filter(cycle => 
      new Date(cycle.startTime) > cutoffDate
    );
  }

  /**
   * Update status
   */
  private updateStatus(): void {
    const status = this.getStatus();
    this.emit('statusUpdate', status);
  }

  /**
   * Set interval
   */
  setIntervalMs(ms: number): void {
    console.log(`⏱️ Updating cycle interval to ${ms}ms`);
    
    this.config.intervalMs = ms;
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
    
    this.addAlert('info', `Cycle interval updated to ${ms}ms`);
  }

  /**
   * Get current status
   */
  getStatus(): SchedulerStatus {
    const now = new Date();
    const uptime = Date.now() - new Date(this.startTime).getTime();
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    // Calculate performance metrics
    const recentCycles = this.cycleHistory.slice(-10); // Last 10 cycles
    const avgCycleTime = recentCycles.length > 0 
      ? recentCycles.reduce((sum, cycle) => sum + cycle.duration, 0) / recentCycles.length
      : 0;
    
    const successRate = recentCycles.length > 0
      ? recentCycles.filter(cycle => cycle.success).length / recentCycles.length
      : 0;
    
    const errorRate = 1 - successRate;
    
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentCycle: this.currentCycle,
      totalCycles: this.totalCycles,
      intervalMs: this.config.intervalMs,
      lastCycleTime: this.cycleHistory.length > 0 ? this.cycleHistory[this.cycleHistory.length - 1].endTime : '',
      nextCycleTime: this.isRunning && !this.isPaused 
        ? new Date(Date.now() + this.config.intervalMs).toISOString()
        : '',
      consecutiveFailures: this.consecutiveFailures,
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      performance: {
        avgCycleTime,
        successRate,
        errorRate
      },
      alerts: this.alerts.slice(-20) // Last 20 alerts
    };
  }

  /**
   * Get cycle history
   */
  getCycleHistory(limit?: number): CycleMetrics[] {
    if (limit) {
      return this.cycleHistory.slice(-limit);
    }
    return this.cycleHistory;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 20): Array<{
    type: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
  }> {
    return this.alerts.slice(-limit);
  }

  /**
   * Generate scheduler report
   */
  generateReport(): string {
    const status = this.getStatus();
    const recentCycles = this.getCycleHistory(10);
    
    const report = `
# Acey Auto Scheduler Report

## Current Status
- Generated: ${new Date().toISOString()}
- Running: ${status.isRunning ? '✅ Yes' : '❌ No'}
- Paused: ${status.isPaused ? '⏸️ Yes' : '▶️ No'}
- Current Cycle: #${status.currentCycle}
- Total Cycles: ${status.totalCycles}
- Interval: ${status.intervalMs}ms (${status.intervalMs / 1000}s)
- Uptime: ${status.uptime}

## Performance Metrics
- Average Cycle Time: ${status.performance.avgCycleTime.toFixed(0)}ms
- Success Rate: ${(status.performance.successRate * 100).toFixed(1)}%
- Error Rate: ${(status.performance.errorRate * 100).toFixed(1)}%
- Consecutive Failures: ${status.consecutiveFailures}

## Recent Cycles (Last 10)
${recentCycles.map(cycle => `
### Cycle #${cycle.cycleNumber}
- Time: ${cycle.startTime}
- Duration: ${cycle.duration}ms
- Status: ${cycle.success ? '✅ Success' : '❌ Failed'}
- Skills: ${cycle.skillsExecuted} executed, ${cycle.skillsSucceeded} succeeded
- Devices: ${cycle.devicesSynced} synced
- Proposals: ${cycle.proposalsGenerated} generated
- Revenue: $${cycle.revenueGenerated}
- Learning: ${cycle.learningEntriesCollected} entries
- Health: ${cycle.systemHealth}
${cycle.errors.length > 0 ? `- Errors: ${cycle.errors.join(', ')}` : ''}
${cycle.warnings.length > 0 ? `- Warnings: ${cycle.warnings.join(', ')}` : ''}
`).join('\n')}

## Recent Alerts
${status.alerts.slice(-10).map(alert => 
  `- ${alert.type.toUpperCase()}: ${alert.message} (${new Date(alert.timestamp).toLocaleString()})`
).join('\n')}

## Configuration
- Auto Start: ${this.config.enableAutoStart ? 'Enabled' : 'Disabled'}
- Notifications: ${this.config.enableNotifications ? 'Enabled' : 'Disabled'}
- Emergency Mode: ${this.config.enableEmergencyMode ? 'Enabled' : 'Disabled'}
- Max Consecutive Failures: ${this.config.maxConsecutiveFailures}
- Health Check Interval: ${this.config.healthCheckInterval}ms
- Log Retention: ${this.config.logRetentionDays} days

## Recommendations
${this.generateRecommendations()}

---
*Report generated automatically by Acey Auto Scheduler*
    `.trim();
    
    console.log('📄 Scheduler report generated');
    return report;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string {
    const recommendations: string[] = [];
    const status = this.getStatus();
    
    // Performance recommendations
    if (status.performance.avgCycleTime > 30000) {
      recommendations.push('- Consider increasing cycle interval to reduce system load');
    }
    
    if (status.performance.successRate < 0.9) {
      recommendations.push('- Review error logs and address common failure patterns');
    }
    
    // Health recommendations
    if (status.consecutiveFailures > 0) {
      recommendations.push('- Investigate and resolve consecutive failure issues');
    }
    
    // Alert recommendations
    const recentAlerts = this.alerts.filter(alert => 
      Date.now() - new Date(alert.timestamp).getTime() < 3600000 // Last hour
    );
    
    if (recentAlerts.length > 10) {
      recommendations.push('- High alert frequency detected - review system health');
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : '- System operating normally';
  }

  /**
   * Shutdown the scheduler
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Acey Auto Scheduler...');
    
    // Stop scheduler
    this.stop();
    
    // Stop health monitoring
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    
    // Generate final report
    this.generateReport();
    
    // Shutdown execution pack
    await this.pack.shutdown();
    
    this.emit('shutdown', {
      timestamp: new Date().toISOString(),
      totalCycles: this.totalCycles,
      uptime: this.getStatus().uptime
    });
    
    console.log('✅ Auto Scheduler shutdown complete');
  }
}

export default AutoScheduler;
