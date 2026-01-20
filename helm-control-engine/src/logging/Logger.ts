export enum LogLevel { 
  CRITICAL = 0, 
  ERROR = 1, 
  WARN = 2, 
  INFO = 3, 
  DEBUG = 4 
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  skillId?: string;
}

export class Logger {
  private static logs: LogEntry[] = [];
  private static maxLogs: number = 10000;

  static log(message: string, level: LogLevel = LogLevel.INFO, context?: LogEntry): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      ...context
    };

    this.logs.push(entry);

    // Console output
    const levelName = LogLevel[level];
    const timestamp = entry.timestamp.toISOString();
    console.log(`[${timestamp}] [${levelName}] ${message}`);

    // Trim logs if needed
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  static critical(message: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'message'>): void {
    this.log(message, LogLevel.CRITICAL, context);
  }

  static error(message: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'message'>): void {
    this.log(message, LogLevel.ERROR, context);
  }

  static warn(message: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'message'>): void {
    this.log(message, LogLevel.WARN, context);
  }

  static info(message: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'message'>): void {
    this.log(message, LogLevel.INFO, context);
  }

  static debug(message: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'message'>): void {
    this.log(message, LogLevel.DEBUG, context);
  }

  static getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level <= level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }

  static getLogsByUser(userId: string, limit?: number): LogEntry[] {
    const userLogs = this.logs.filter(log => log.userId === userId);
    return limit ? userLogs.slice(-limit) : userLogs;
  }

  static getLogsBySkill(skillId: string, limit?: number): LogEntry[] {
    const skillLogs = this.logs.filter(log => log.skillId === skillId);
    return limit ? skillLogs.slice(-limit) : skillLogs;
  }

  static getLogsBySession(sessionId: string, limit?: number): LogEntry[] {
    const sessionLogs = this.logs.filter(log => log.sessionId === sessionId);
    return limit ? sessionLogs.slice(-limit) : sessionLogs;
  }

  static clearLogs(): void {
    this.logs = [];
  }

  static exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      // CSV format
      const headers = 'timestamp,level,message,userId,sessionId,skillId';
      const rows = this.logs.map(log => 
        `${log.timestamp.toISOString()},${LogLevel[log.level]},${log.message},${log.userId || ''},${log.sessionId || ''},${log.skillId || ''}`
      );
      return [headers, ...rows].join('\n');
    }
  }

  static getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    byUser: Record<string, number>;
    bySkill: Record<string, number>;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      bySkill: {} as Record<string, number>
    };

    this.logs.forEach(log => {
      const levelName = LogLevel[log.level];
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
      
      if (log.userId) {
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
      }
      
      if (log.skillId) {
        stats.bySkill[log.skillId] = (stats.bySkill[log.skillId] || 0) + 1;
      }
    });

    return stats;
  }
}

// Convenience functions for backward compatibility
export function log(message: string, level: LogLevel = LogLevel.INFO): void {
  Logger.log(message, level);
}

export function logCritical(message: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'message'>): void {
  Logger.critical(message, context);
}

export function logError(message: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'message'>): void {
  Logger.error(message, context);
}

export function logWarn(message: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'message'>): void {
  Logger.warn(message, context);
}

export function logInfo(message: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'message'>): void {
  Logger.info(message, context);
}

export function logDebug(message: string, context?: Omit<LogEntry, 'timestamp' | 'level' | 'message'>): void {
  Logger.debug(message, context);
}
