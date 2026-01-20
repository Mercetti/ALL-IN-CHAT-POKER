import { LogLevel, LogEntry, Logger } from './Logger';

export interface PriorityRule {
  id: string;
  name: string;
  condition: (log: LogEntry) => boolean;
  priority: number; // Higher number = higher priority
  actions: ('alert' | 'escalate' | 'store' | 'forward')[];
}

export const PriorityRules: PriorityRule[] = [
  {
    id: 'critical-system-errors',
    name: 'Critical System Errors',
    condition: (log) => log.level === LogLevel.CRITICAL,
    priority: 100,
    actions: ['alert', 'escalate', 'store', 'forward']
  },
  {
    id: 'skill-failures',
    name: 'Skill Execution Failures',
    condition: (log) => 
      log.level === LogLevel.ERROR && 
      log.skillId !== undefined,
    priority: 80,
    actions: ['alert', 'store', 'forward']
  },
  {
    id: 'security-events',
    name: 'Security Related Events',
    condition: (log) => 
      log.message.toLowerCase().includes('security') ||
      log.message.toLowerCase().includes('unauthorized') ||
      log.message.toLowerCase().includes('breach'),
    priority: 90,
    actions: ['alert', 'escalate', 'store', 'forward']
  },
  {
    id: 'performance-issues',
    name: 'Performance Issues',
    condition: (log) => 
      log.message.toLowerCase().includes('timeout') ||
      log.message.toLowerCase().includes('slow') ||
      log.message.toLowerCase().includes('memory'),
    priority: 60,
    actions: ['store', 'forward']
  },
  {
    id: 'user-errors',
    name: 'User-Related Errors',
    condition: (log) => 
      log.level === LogLevel.ERROR && 
      log.userId !== undefined,
    priority: 70,
    actions: ['alert', 'store']
  },
  {
    id: 'debug-info',
    name: 'Debug Information',
    condition: (log) => log.level === LogLevel.DEBUG,
    priority: 10,
    actions: ['store']
  },
  {
    id: 'general-info',
    name: 'General Information',
    condition: (log) => log.level === LogLevel.INFO,
    priority: 20,
    actions: ['store']
  }
];

export class LogPrioritizer {
  private static alertCallbacks: Array<(log: LogEntry) => void> = [];
  private static escalationCallbacks: Array<(log: LogEntry) => void> = [];
  private static forwardCallbacks: Array<(log: LogEntry) => void> = [];

  static prioritizeLog(log: LogEntry): void {
    const applicableRules = PriorityRules
      .filter(rule => rule.condition(log))
      .sort((a, b) => b.priority - a.priority);

    if (applicableRules.length === 0) {
      // Default handling for unmatched logs
      Logger.storeLog(log);
      return;
    }

    const highestPriorityRule = applicableRules[0];
    
    highestPriorityRule.actions.forEach(action => {
      switch (action) {
        case 'alert':
          this.sendAlert(log);
          break;
        case 'escalate':
          this.escalateLog(log);
          break;
        case 'store':
          Logger.storeLog(log);
          break;
        case 'forward':
          this.forwardLog(log);
          break;
      }
    });
  }

  static sendAlert(log: LogEntry): void {
    console.log(`🚨 ALERT: [${LogLevel[log.level]}] ${log.message}`);
    
    this.alertCallbacks.forEach(callback => {
      try {
        callback(log);
      } catch (error) {
        console.error('Alert callback failed:', error);
      }
    });
  }

  static escalateLog(log: LogEntry): void {
    console.log(`⬆️ ESCALATE: [${LogLevel[log.level]}] ${log.message}`);
    
    this.escalationCallbacks.forEach(callback => {
      try {
        callback(log);
      } catch (error) {
        console.error('Escalation callback failed:', error);
      }
    });
  }

  static forwardLog(log: LogEntry): void {
    console.log(`➡️ FORWARD: [${LogLevel[log.level]}] ${log.message}`);
    
    this.forwardCallbacks.forEach(callback => {
      try {
        callback(log);
      } catch (error) {
        console.error('Forward callback failed:', error);
      }
    });
  }

  static onAlert(callback: (log: LogEntry) => void): void {
    this.alertCallbacks.push(callback);
  }

  static onEscalate(callback: (log: LogEntry) => void): void {
    this.escalationCallbacks.push(callback);
  }

  static onForward(callback: (log: LogEntry) => void): void {
    this.forwardCallbacks.push(callback);
  }

  static removeAlertCallback(callback: (log: LogEntry) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  static removeEscalateCallback(callback: (log: LogEntry) => void): void {
    const index = this.escalationCallbacks.indexOf(callback);
    if (index > -1) {
      this.escalationCallbacks.splice(index, 1);
    }
  }

  static removeForwardCallback(callback: (log: LogEntry) => void): void {
    const index = this.forwardCallbacks.indexOf(callback);
    if (index > -1) {
      this.forwardCallbacks.splice(index, 1);
    }
  }

  static getPriorityStats(): {
    totalProcessed: number;
    alerts: number;
    escalations: number;
    forwards: number;
    stored: number;
    byRule: Record<string, number>;
  } {
    const logs = Logger.getLogs();
    const stats = {
      totalProcessed: logs.length,
      alerts: 0,
      escalations: 0,
      forwards: 0,
      stored: 0,
      byRule: {} as Record<string, number>
    };

    logs.forEach(log => {
      const applicableRules = PriorityRules.filter(rule => rule.condition(log));
      
      if (applicableRules.length === 0) {
        stats.stored++;
        return;
      }

      const highestPriorityRule = applicableRules[0];
      stats.byRule[highestPriorityRule.id] = (stats.byRule[highestPriorityRule.id] || 0) + 1;

      highestPriorityRule.actions.forEach(action => {
        switch (action) {
          case 'alert':
            stats.alerts++;
            break;
          case 'escalate':
            stats.escalations++;
            break;
          case 'forward':
            stats.forwards++;
            break;
          case 'store':
            stats.stored++;
            break;
        }
      });
    });

    return stats;
  }

  static getActiveRules(): PriorityRule[] {
    return [...PriorityRules];
  }

  static addRule(rule: PriorityRule): void {
    PriorityRules.push(rule);
  }

  static removeRule(ruleId: string): boolean {
    const index = PriorityRules.findIndex(rule => rule.id === ruleId);
    if (index > -1) {
      PriorityRules.splice(index, 1);
      return true;
    }
    return false;
  }
}

// Extend Logger to include storeLog method
declare module './Logger' {
  interface Logger {
    static storeLog(log: LogEntry): void;
  }
}

Logger.storeLog = function(log: LogEntry): void {
  // This method is already implemented in the log function
  // Adding this for type compatibility
  Logger.log(log.message, log.level, log);
};

// Convenience function for backward compatibility
export function prioritizeLog(level: LogLevel, message: string, context?: Partial<LogEntry>): void {
  const log: LogEntry = {
    timestamp: new Date(),
    level,
    message,
    ...context
  };
  
  LogPrioritizer.prioritizeLog(log);
}
