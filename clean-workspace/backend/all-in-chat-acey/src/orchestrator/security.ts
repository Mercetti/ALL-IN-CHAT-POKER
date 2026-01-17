import { Logger } from '../utils/logger';

export type SecurityMode = 'Green' | 'Yellow' | 'Red';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  action: string;
  role: string;
  mode: SecurityMode;
  blocked: boolean;
  reason?: string;
}

export class SecurityModule {
  private mode: SecurityMode = 'Green';
  private logger: Logger;
  private events: SecurityEvent[] = [];

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Set security mode
   */
  setMode(mode: SecurityMode): void {
    const previousMode = this.mode;
    this.mode = mode;
    
    this.logEvent({
      action: 'mode_change',
      role: 'system',
      mode,
      blocked: false,
      reason: `Changed from ${previousMode} to ${mode}`,
      id: this.generateEventId(),
      timestamp: new Date().toISOString()
    });

    this.logger.log(`Security mode changed: ${mode}`);
  }

  /**
   * Get current security mode
   */
  getMode(): SecurityMode {
    return this.mode;
  }

  /**
   * Monitor an action and decide if it should be blocked
   */
  monitorAction(action: string, role: string): void {
    const isBlocked = this.shouldBlockAction(action, role);
    
    this.logEvent({
      action,
      role,
      mode: this.mode,
      blocked: isBlocked,
      reason: isBlocked ? this.getBlockReason(action, role) : undefined,
      id: this.generateEventId(),
      timestamp: new Date().toISOString()
    });

    if (isBlocked) {
      const errorMessage = `Action blocked in ${this.mode} mode: ${action} by ${role}`;
      this.logger.warn(errorMessage);
      throw new Error(errorMessage);
    }

    this.logger.log(`Action permitted: ${action} by ${role}`);
  }

  /**
   * Check if action should be blocked based on current mode
   */
  private shouldBlockAction(action: string, role: string): boolean {
    switch (this.mode) {
      case 'Red':
        // Block all actions except view-only
        return !action.startsWith('view_') && !action.startsWith('get_');
      
      case 'Yellow':
        // Block high-risk actions
        const highRiskActions = [
          'execute_skill:Partner Payout',
          'execute_skill:Code Helper',
          'system_modify',
          'user_delete',
          'data_export'
        ];
        return highRiskActions.includes(action) && role !== 'owner';
      
      case 'Green':
      default:
        // Allow all actions with normal validation
        return false;
    }
  }

  /**
   * Get reason for blocking action
   */
  private getBlockReason(action: string, role: string): string {
    switch (this.mode) {
      case 'Red':
        return 'System is in lockdown - only view operations allowed';
      case 'Yellow':
        return 'Elevated caution - high-risk actions require owner approval';
      default:
        return 'Unknown reason';
    }
  }

  /**
   * Log security event
   */
  private logEvent(event: SecurityEvent): void {
    const fullEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date().toISOString()
    };
    
    this.events.push(fullEvent);
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const last24Hours = this.events.filter(
      e => new Date(e.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );

    const blockedActions = last24Hours.filter(e => e.blocked).length;
    const totalActions = last24Hours.length;

    return {
      currentMode: this.mode,
      totalEvents: this.events.length,
      last24Hours: {
        total: totalActions,
        blocked: blockedActions,
        blockedPercentage: totalActions > 0 ? (blockedActions / totalActions * 100).toFixed(1) : '0'
      },
      eventsByMode: this.getEventsByMode(),
      topBlockedActions: this.getTopBlockedActions()
    };
  }

  /**
   * Get events grouped by mode
   */
  private getEventsByMode(): Record<SecurityMode, number> {
    return this.events.reduce((acc, event) => {
      acc[event.mode] = (acc[event.mode] || 0) + 1;
      return acc;
    }, {} as Record<SecurityMode, number>);
  }

  /**
   * Get most commonly blocked actions
   */
  private getTopBlockedActions(): Array<{action: string, count: number}> {
    const blockedActions = this.events.filter(e => e.blocked);
    const actionCounts = blockedActions.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Emergency lockdown
   */
  emergencyLockdown(reason: string): void {
    this.setMode('Red');
    this.logger.warn(`EMERGENCY LOCKDOWN: ${reason}`);
    
    // Log emergency event
    this.logEvent({
      action: 'emergency_lockdown',
      role: 'system',
      mode: 'Red',
      blocked: false,
      reason,
      id: this.generateEventId(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if role can perform action in current mode
   */
  canPerformAction(action: string, role: string): boolean {
    try {
      this.monitorAction(action, role);
      return true;
    } catch {
      return false;
    }
  }
}
