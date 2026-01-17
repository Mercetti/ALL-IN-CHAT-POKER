export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: any;
}

export class Logger {
  private logs: LogEntry[] = [];
  private maxLogSize = 1000;

  /**
   * Log info message
   */
  log(message: string, context?: any): void {
    this.addEntry('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: any): void {
    this.addEntry('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: any, context?: any): void {
    const errorMessage = error ? `${message}: ${error.message || error}` : message;
    this.addEntry('error', errorMessage, context);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: any): void {
    this.addEntry('debug', message, context);
  }

  /**
   * Add entry to log
   */
  private addEntry(level: LogEntry['level'], message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    this.logs.push(entry);

    // Keep log size manageable
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    // Output to console for development
    if (process.env.NODE_ENV !== 'production') {
      const consoleMethod = level === 'error' ? console.error : 
                         level === 'warn' ? console.warn : 
                         console.log;
      consoleMethod(`[${level.toUpperCase()}] ${message}`, context || '');
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100, level?: LogEntry['level']): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(): Record<LogEntry['level'], number> {
    return this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<LogEntry['level'], number>);
  }

  /**
   * Export logs to file or external system
   */
  async exportLogs(): Promise<string> {
    const logData = {
      exportTime: new Date().toISOString(),
      totalEntries: this.logs.length,
      entries: this.logs
    };
    
    return JSON.stringify(logData, null, 2);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    this.log('Logs cleared');
  }

  /**
   * Get system performance metrics
   */
  getMetrics(): any {
    const last24Hours = this.logs.filter(
      log => new Date(log.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );

    return {
      totalLogs: this.logs.length,
      last24Hours: last24Hours.length,
      byLevel: this.getLogsByLevel(),
      errorRate: last24Hours.length > 0 ? 
        (last24Hours.filter(log => log.level === 'error').length / last24Hours.length * 100).toFixed(2) : 
        '0'
    };
  }
}
