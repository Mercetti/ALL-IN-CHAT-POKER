/**
 * Security Observer Skill for Acey
 * Acts as SOC-lite AI analyst monitoring system security and integrity
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class SecurityObserverSkill extends EventEmitter {
  constructor(aceyContext) {
    super();
    this.acey = aceyContext;
    this.name = 'SecurityObserver';
    this.description = 'SOC-lite AI analyst for system security monitoring';
    this.version = '1.0.0';
    
    // Security state tracking
    this.fileHashes = new Map();
    this.systemBaseline = null;
    this.alertThresholds = {
      fileChanges: 10, // Alert if more than 10 files change in 5 minutes
      failedLogins: 3, // Alert if 3 failed logins in 1 minute
      unusualProcesses: 5, // Alert if 5 unusual processes detected
      dataExfiltration: 100 * 1024 * 1024 // Alert if 100MB+ transferred
    };
    
    // Monitoring state
    this.monitoring = {
      fileChanges: new Map(), // timestamp -> count
      securityEvents: [],
      systemMetrics: new Map(),
      trustScores: new Map()
    };
    
    this.initialize();
  }

  /**
   * Initialize security monitoring
   */
  async initialize() {
    try {
      // Create baseline of current system state
      await this.createSystemBaseline();
      
      // Start monitoring intervals
      this.startMonitoring();
      
      this.acey.logger.info('Security Observer initialized', {
        baselineFiles: this.fileHashes.size,
        monitoringActive: true
      });
      
    } catch (error) {
      this.acey.logger.error('Security Observer initialization failed', { error: error.message });
    }
  }

  /**
   * Create system baseline for comparison
   */
  async createSystemBaseline() {
    const projectDir = process.cwd();
    const criticalDirs = [
      'server',
      'src',
      'acey-control-center',
      'apps',
      'public'
    ];
    
    this.systemBaseline = {
      timestamp: Date.now(),
      directories: {},
      totalFiles: 0,
      totalSize: 0
    };
    
    for (const dir of criticalDirs) {
      const dirPath = path.join(projectDir, dir);
      if (fs.existsSync(dirPath)) {
        const dirInfo = await this.scanDirectory(dirPath);
        this.systemBaseline.directories[dir] = dirInfo;
        this.systemBaseline.totalFiles += dirInfo.fileCount;
        this.systemBaseline.totalSize += dirInfo.totalSize;
      }
    }
    
    // Store file hashes for integrity checking
    this.storeFileHashes(this.systemBaseline);
  }

  /**
   * Scan directory and return file information
   */
  async scanDirectory(dirPath) {
    const files = [];
    let totalSize = 0;
    
    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          // Skip node_modules and other common ignore patterns
          if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
            scan(itemPath);
          }
        } else {
          const fileInfo = {
            path: itemPath,
            size: stats.size,
            modified: stats.mtime.getTime(),
            hash: this.calculateFileHash(itemPath)
          };
          
          files.push(fileInfo);
          totalSize += stats.size;
        }
      }
    };
    
    scan(dirPath);
    
    return {
      path: dirPath,
      fileCount: files.length,
      totalSize,
      files
    };
  }

  /**
   * Store file hashes for integrity monitoring
   */
  storeFileHashes(baseline) {
    this.fileHashes.clear();
    
    for (const [dirName, dirInfo] of Object.entries(baseline.directories)) {
      for (const file of dirInfo.files) {
        const relativePath = path.relative(process.cwd(), file.path);
        this.fileHashes.set(relativePath, {
          hash: file.hash,
          size: file.size,
          modified: file.modified,
          lastChecked: Date.now()
        });
      }
    }
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring() {
    // File integrity monitoring (every 5 minutes)
    setInterval(() => {
      this.checkFileIntegrity();
    }, 5 * 60 * 1000);
    
    // System metrics monitoring (every minute)
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60 * 1000);
    
    // Security event processing (every 30 seconds)
    setInterval(() => {
      this.processSecurityEvents();
    }, 30 * 1000);
  }

  /**
   * Check file integrity against baseline
   */
  async checkFileIntegrity() {
    const changes = [];
    const now = Date.now();
    
    // Check existing files
    for (const [relativePath, baselineInfo] of this.fileHashes) {
      const fullPath = path.join(process.cwd(), relativePath);
      
      if (fs.existsSync(fullPath)) {
        const currentHash = this.calculateFileHash(fullPath);
        const stats = fs.statSync(fullPath);
        
        if (currentHash !== baselineInfo.hash) {
          changes.push({
            type: 'modified',
            path: relativePath,
            previousHash: baselineInfo.hash,
            currentHash,
            modified: stats.mtime.getTime()
          });
        }
      } else {
        changes.push({
          type: 'deleted',
          path: relativePath,
          lastSeen: baselineInfo.modified
        });
      }
    }
    
    // Check for new files
    const projectDir = process.cwd();
    for (const [dirName, dirInfo] of Object.entries(this.systemBaseline.directories)) {
      const dirPath = path.join(projectDir, dirName);
      if (fs.existsSync(dirPath)) {
        const currentFiles = await this.scanDirectory(dirPath);
        
        for (const file of currentFiles.files) {
          const relativePath = path.relative(process.cwd(), file.path);
          if (!this.fileHashes.has(relativePath)) {
            changes.push({
              type: 'added',
              path: relativePath,
              hash: file.hash,
              size: file.size,
              created: file.modified
            });
          }
        }
      }
    }
    
    // Process changes
    if (changes.length > 0) {
      await this.handleFileChanges(changes);
    }
  }

  /**
   * Handle detected file changes
   */
  async handleFileChanges(changes) {
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    
    // Count changes in time window
    const recentChanges = changes.filter(change => 
      now - change.modified < timeWindow
    );
    
    // Update monitoring state
    this.monitoring.fileChanges.set(now, recentChanges.length);
    
    // Check threshold
    const totalRecentChanges = Array.from(this.monitoring.fileChanges.values())
      .reduce((sum, count) => sum + count, 0);
    
    if (totalRecentChanges > this.alertThresholds.fileChanges) {
      await this.triggerSecurityAlert({
        type: 'MASS_FILE_CHANGE',
        severity: 'HIGH',
        details: {
          changeCount: totalRecentChanges,
          timeWindow: '5 minutes',
          changes: changes.slice(0, 10) // First 10 changes
        }
      });
    }
    
    // Log all changes
    for (const change of changes) {
      this.logSecurityEvent({
        type: 'FILE_CHANGE',
        subtype: change.type,
        path: change.path,
        timestamp: change.modified || change.created || now,
        details: change
      });
    }
  }

  /**
   * Collect system metrics for anomaly detection
   */
  collectSystemMetrics() {
    const metrics = {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      openFiles: this.getOpenFileCount(),
      networkConnections: this.getNetworkConnectionCount()
    };
    
    this.monitoring.systemMetrics.set(metrics.timestamp, metrics);
    
    // Keep only last hour of metrics
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [timestamp] of this.monitoring.systemMetrics) {
      if (timestamp < oneHourAgo) {
        this.monitoring.systemMetrics.delete(timestamp);
      }
    }
    
    // Check for anomalies
    this.detectAnomalies(metrics);
  }

  /**
   * Detect anomalies in system metrics
   */
  detectAnomalies(currentMetrics) {
    const metricsArray = Array.from(this.monitoring.systemMetrics.values());
    
    if (metricsArray.length < 10) return; // Need baseline
    
    // Calculate baselines
    const memoryBaseline = this.calculateBaseline(metricsArray, m => m.memory.heapUsed);
    const cpuBaseline = this.calculateBaseline(metricsArray, m => m.cpu.user);
    
    // Check current against baseline
    const memoryAnomaly = Math.abs(currentMetrics.memory.heapUsed - memoryBaseline.mean) > memoryBaseline.stdDev * 2;
    const cpuAnomaly = Math.abs(currentMetrics.cpu.user - cpuBaseline.mean) > cpuBaseline.stdDev * 2;
    
    if (memoryAnomaly || cpuAnomaly) {
      this.logSecurityEvent({
        type: 'SYSTEM_ANOMALY',
        timestamp: currentMetrics.timestamp,
        details: {
          memoryAnomaly,
          cpuAnomaly,
          currentMemory: currentMetrics.memory.heapUsed,
          currentCpu: currentMetrics.cpu.user,
          memoryBaseline,
          cpuBaseline
        }
      });
    }
  }

  /**
   * Calculate baseline statistics
   */
  calculateBaseline(data, extractor) {
    const values = data.map(extractor);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev, count: values.length };
  }

  /**
   * Process security events and determine escalation
   */
  async processSecurityEvents() {
    const events = this.monitoring.securityEvents.splice(0); // Clear array
    
    if (events.length === 0) return;
    
    // Group events by type
    const eventGroups = this.groupEventsByType(events);
    
    // Analyze each group
    for (const [type, groupEvents] of Object.entries(eventGroups)) {
      await this.analyzeEventGroup(type, groupEvents);
    }
  }

  /**
   * Group events by type for analysis
   */
  groupEventsByType(events) {
    const groups = {};
    
    for (const event of events) {
      if (!groups[event.type]) {
        groups[event.type] = [];
      }
      groups[event.type].push(event);
    }
    
    return groups;
  }

  /**
   * Analyze group of security events
   */
  async analyzeEventGroup(type, events) {
    switch (type) {
      case 'FILE_CHANGE':
        await this.analyzeFileChanges(events);
        break;
        
      case 'SYSTEM_ANOMALY':
        await this.analyzeSystemAnomalies(events);
        break;
        
      case 'UNAUTHORIZED_ACCESS':
        await this.analyzeUnauthorizedAccess(events);
        break;
        
      default:
        this.acey.logger.warn('Unknown security event type', { type, eventCount: events.length });
    }
  }

  /**
   * Analyze file change events
   */
  async analyzeFileChanges(events) {
    const modifications = events.filter(e => e.subtype === 'modified');
    const deletions = events.filter(e => e.subtype === 'deleted');
    const additions = events.filter(e => e.subtype === 'added');
    
    // Check for suspicious patterns
    if (deletions.length > 0) {
      await this.triggerSecurityAlert({
        type: 'FILE_DELETIONS',
        severity: 'MEDIUM',
        details: {
          deletionCount: deletions.length,
          files: deletions.map(e => e.path)
        }
      });
    }
    
    // Check for rapid modifications
    const recentModifications = modifications.filter(e => 
      Date.now() - e.timestamp < 60 * 1000 // Last minute
    );
    
    if (recentModifications.length > 5) {
      await this.triggerSecurityAlert({
        type: 'RAPID_FILE_MODIFICATION',
        severity: 'HIGH',
        details: {
          modificationCount: recentModifications.length,
          timeWindow: '1 minute',
          files: recentModifications.map(e => e.path)
        }
      });
    }
  }

  /**
   * Analyze system anomaly events
   */
  async analyzeSystemAnomalies(events) {
    const recentAnomalies = events.filter(e => 
      Date.now() - e.timestamp < 10 * 60 * 1000 // Last 10 minutes
    );
    
    if (recentAnomalies.length >= 3) {
      await this.triggerSecurityAlert({
        type: 'REPEATED_SYSTEM_ANOMALIES',
        severity: 'HIGH',
        details: {
          anomalyCount: recentAnomalies.length,
          timeWindow: '10 minutes',
          anomalies: recentAnomalies
        }
      });
    }
  }

  /**
   * Trigger security alert
   */
  async triggerSecurityAlert(alert) {
    const alertEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...alert,
      status: 'ACTIVE'
    };
    
    // Log the alert
    this.logSecurityEvent({
      type: 'SECURITY_ALERT',
      timestamp: alertEvent.timestamp,
      details: alertEvent
    });
    
    // Emit for other components
    this.emit('securityAlert', alertEvent);
    
    // Notify founder
    await this.notifyFounder(alertEvent);
    
    this.acey.logger.warn('Security alert triggered', alertEvent);
  }

  /**
   * Notify founder of security alert
   */
  async notifyFounder(alert) {
    const message = `🚨 Security Alert: ${alert.type}\n\n` +
      `Severity: ${alert.severity}\n` +
      `Time: ${new Date(alert.timestamp).toISOString()}\n\n` +
      `Details: ${JSON.stringify(alert.details, null, 2)}`;
    
    // Send through Acey's notification system
    if (this.acey.notify) {
      await this.acey.notify({
        type: 'SECURITY_ALERT',
        priority: 'HIGH',
        message,
        alert
      });
    }
    
    // Also log to security events table
    await this.logSecurityEvent({
      type: 'FOUNDER_NOTIFICATION',
      timestamp: Date.now(),
      details: { alertId: alert.id, message }
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(event) {
    // Add to in-memory events
    this.monitoring.securityEvents.push({
      ...event,
      id: crypto.randomUUID(),
      loggedAt: Date.now()
    });
    
    // Also log to database if available
    if (this.acey.db && this.acey.db.db) {
      try {
        const stmt = this.acey.db.db.prepare(`
          INSERT INTO security_events (id, type, timestamp, details, severity)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          event.id || crypto.randomUUID(),
          event.type,
          event.timestamp || Date.now(),
          JSON.stringify(event.details || {}),
          event.severity || 'LOW'
        );
      } catch (error) {
        this.acey.logger.error('Failed to log security event to database', { error: error.message });
      }
    }
  }

  /**
   * Calculate file hash for integrity checking
   */
  calculateFileHash(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      this.acey.logger.error('Failed to calculate file hash', { filePath, error: error.message });
      return null;
    }
  }

  /**
   * Get open file count (simplified)
   */
  getOpenFileCount() {
    try {
      return Object.keys(this.acey.db?.db?.open || {}).length || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get network connection count (simplified)
   */
  getNetworkConnectionCount() {
    // This would require system-level access in production
    // For now, return a placeholder
    return 0;
  }

  /**
   * Get security status report
   */
  async getSecurityStatus() {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;
    
    const recentEvents = this.monitoring.securityEvents.filter(e => e.timestamp > lastHour);
    const recentAlerts = recentEvents.filter(e => e.type === 'SECURITY_ALERT');
    
    return {
      monitoring: {
        active: true,
        baselineFiles: this.fileHashes.size,
        lastBaselineUpdate: this.systemBaseline?.timestamp,
        eventsLastHour: recentEvents.length,
        alertsLastHour: recentAlerts.length
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      trust: {
        currentLevel: this.acey.trustLevel || 2,
        recentViolations: recentEvents.filter(e => e.severity === 'HIGH').length
      }
    };
  }

  /**
   * Process user request
   */
  async processRequest(request, context = {}) {
    const lowerRequest = request.toLowerCase();
    
    if (lowerRequest.includes('status') || lowerRequest.includes('monitoring')) {
      const status = await this.getSecurityStatus();
      return {
        success: true,
        status,
        message: `Security monitoring active: ${status.monitoring.eventsLastHour} events in last hour`
      };
    }
    
    if (lowerRequest.includes('baseline') || lowerRequest.includes('update')) {
      await this.createSystemBaseline();
      return {
        success: true,
        message: `Security baseline updated with ${this.fileHashes.size} files`
      };
    }
    
    if (lowerRequest.includes('alert') || lowerRequest.includes('incident')) {
      const recentAlerts = this.monitoring.securityEvents
        .filter(e => e.type === 'SECURITY_ALERT')
        .slice(-5); // Last 5 alerts
      
      return {
        success: true,
        alerts: recentAlerts,
        message: `Found ${recentAlerts.length} recent security alerts`
      };
    }
    
    return {
      success: false,
      message: 'Available commands: status, baseline update, alerts'
    };
  }

  /**
   * Get skill information
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      capabilities: [
        'File integrity monitoring',
        'System anomaly detection',
        'Security event logging',
        'Automated alerting',
        'Baseline management',
        'Trust score monitoring'
      ],
      commands: {
        'status': 'Get current security monitoring status',
        'baseline update': 'Update security baseline with current files',
        'alerts': 'Show recent security alerts'
      }
    };
  }
}

module.exports = SecurityObserverSkill;
