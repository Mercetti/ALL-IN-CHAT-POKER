/**
 * Central Logging System
 * Provides structured logging for all stability components
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private componentName: string;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // Keep last 1000 logs in memory

  constructor(componentName: string) {
    this.componentName = componentName;
  }

  log(message: string, data?: any): void {
    this.addLog(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    this.addLog(LogLevel.DEBUG, message, data);
  }

  warn(message: string, data?: any): void {
    this.addLog(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error, data?: any): void {
    this.addLog(LogLevel.ERROR, message, data, error);
  }

  critical(message: string, error?: Error, data?: any): void {
    this.addLog(LogLevel.CRITICAL, message, data, error);
  }

  private addLog(level: LogLevel, message: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.componentName,
      message,
      data,
      error
    };

    // Add to memory buffer
    this.logs.push(entry);

    // Trim if too many logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console with formatting
    this.outputToConsole(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelStr = LogLevel[entry.level].padEnd(6);
    const prefix = `[${timestamp}] [${levelStr}] [${entry.component}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.log(prefix, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(prefix, entry.message, entry.data);
        if (entry.error) {
          console.error(prefix, 'Error details:', entry.error);
        }
        break;
    }
  }

  // Get recent logs
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Get logs by component
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  // Get error logs
  getErrorLogs(): LogEntry[] {
    return this.logs.filter(log => log.level >= LogLevel.ERROR);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    console.log(`[${this.componentName}] Logs cleared`);
  }

  // Export logs to file (placeholder)
  async exportLogs(filePath?: string): Promise<void> {
    const logData = {
      component: this.componentName,
      exportTime: new Date().toISOString(),
      logCount: this.logs.length,
      logs: this.logs
    };

    // In real implementation, this would write to file
    console.log(`[${this.componentName}] Exporting ${this.logs.length} logs to ${filePath || 'default location'}`);
    
    // Placeholder for file writing
    // await fs.writeFile(filePath, JSON.stringify(logData, null, 2));
  }

  // Get log statistics
  getLogStats(): any {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
      timeRange: {
        earliest: null as string | null,
        latest: null as string | null
      }
    };

    // Calculate statistics
    for (const log of this.logs) {
      const levelName = LogLevel[log.level];
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
      stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1;
      
      if (!stats.timeRange.earliest || log.timestamp < stats.timeRange.earliest) {
        stats.timeRange.earliest = log.timestamp;
      }
      if (!stats.timeRange.latest || log.timestamp > stats.timeRange.latest) {
        stats.timeRange.latest = log.timestamp;
      }
    }

    return stats;
  }

  // Set log level filter
  setLogLevel(level: LogLevel): void {
    // This would filter logs in real implementation
    console.log(`[${this.componentName}] Log level set to: ${LogLevel[level]}`);
  }
}
