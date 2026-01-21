/**
 * Safety Audit and Logging System
 * Comprehensive logging and audit trail for all Acey operations
 * Ensures transparency, accountability, and compliance
 */

class SafetyAuditSystem {
  constructor(intentProcessor, memorySystem, trustSystem, io) {
    this.intentProcessor = intentProcessor;
    this.memorySystem = memorySystem;
    this.trustSystem = trustSystem;
    this.io = io;
    
    // Audit configuration
    this.config = {
      logLevel: 'info', // 'debug', 'info', 'warn', 'error'
      maxLogEntries: 10000,
      maxAuditEntries: 5000,
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      autoExport: true,
      exportInterval: 24 * 60 * 60 * 1000, // 24 hours
      complianceMode: true
    };

    // Audit storage
    this.auditLog = [];
    this.safetyLog = [];
    this.complianceLog = [];
    this.performanceLog = [];
    
    // Safety metrics
    this.safetyMetrics = {
      totalOperations: 0,
      blockedOperations: 0,
      highRiskOperations: 0,
      complianceViolations: 0,
      dataLeaks: 0,
      systemErrors: 0
    };

    // Safety rules
    this.safetyRules = {
      maxTrustChange: 0.2,
      maxMemoryWritesPerMinute: 10,
      maxShadowBanDuration: 24 * 60 * 60 * 1000, // 24 hours
      requireApprovalForGlobalMemory: true,
      blockPersonalDataInGlobalMemory: true,
      enforceRateLimiting: true
    };

    // Start background tasks
    this.startBackgroundTasks();
    
    console.log('🛡️ Safety Audit System initialized');
  }

  /**
   * Log audit event
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   * @param {string} severity - Event severity
   */
  logAudit(eventType, data, severity = 'info') {
    const auditEntry = {
      id: this.generateAuditId(),
      timestamp: Date.now(),
      eventType,
      severity,
      data: this.sanitizeData(data),
      userId: data.userId || null,
      sessionId: this.getCurrentSessionId(),
      systemState: this.captureSystemState(),
      compliance: this.checkCompliance(eventType, data)
    };

    this.auditLog.push(auditEntry);
    
    // Update metrics
    this.safetyMetrics.totalOperations++;
    
    // Check safety rules
    const safetyCheck = this.checkSafetyRules(eventType, data);
    if (!safetyCheck.safe) {
      this.handleSafetyViolation(auditEntry, safetyCheck);
    }

    // Keep log limited
    if (this.auditLog.length > this.config.maxAuditEntries) {
      this.auditLog = this.auditLog.slice(-this.config.maxAuditEntries);
    }

    // Emit audit event
    this.io.emit('audit_event', auditEntry);

    // Log to console if severity requires
    if (this.shouldLogToConsole(severity)) {
      console.log(`🔍 [${severity.toUpperCase()}] ${eventType}:`, auditEntry);
    }
  }

  /**
   * Log safety event
   * @param {string} safetyType - Safety event type
   * @param {object} data - Safety data
   * @param {string} riskLevel - Risk level
   */
  logSafety(safetyType, data, riskLevel = 'medium') {
    const safetyEntry = {
      id: this.generateSafetyId(),
      timestamp: Date.now(),
      safetyType,
      riskLevel,
      data: this.sanitizeData(data),
      mitigations: this.generateMitigations(safetyType, data),
      resolved: false
    };

    this.safetyLog.push(safetyEntry);
    
    // Update metrics
    if (riskLevel === 'high') {
      this.safetyMetrics.highRiskOperations++;
    }

    // Keep log limited
    if (this.safetyLog.length > this.config.maxLogEntries) {
      this.safetyLog = this.safetyLog.slice(-this.config.maxLogEntries);
    }

    // Emit safety event
    this.io.emit('safety_event', safetyEntry);

    // High-risk events get immediate attention
    if (riskLevel === 'high') {
      this.handleHighRiskEvent(safetyEntry);
    }

    console.log(`⚠️ [${riskLevel.toUpperCase()}] ${safetyType}:`, safetyEntry);
  }

  /**
   * Log compliance event
   * @param {string} complianceType - Compliance type
   * @param {object} data - Compliance data
   * @param {boolean} compliant - Whether compliant
   */
  logCompliance(complianceType, data, compliant = true) {
    const complianceEntry = {
      id: this.generateComplianceId(),
      timestamp: Date.now(),
      complianceType,
      compliant,
      data: this.sanitizeData(data),
      violations: compliant ? [] : this.identifyViolations(complianceType, data),
      remediation: compliant ? null : this.generateRemediation(complianceType, data)
    };

    this.complianceLog.push(complianceEntry);
    
    // Update metrics
    if (!compliant) {
      this.safetyMetrics.complianceViolations++;
    }

    // Keep log limited
    if (this.complianceLog.length > this.config.maxLogEntries) {
      this.complianceLog = this.complianceLog.slice(-this.config.maxLogEntries);
    }

    // Emit compliance event
    this.io.emit('compliance_event', complianceEntry);

    if (!compliant) {
      console.log(`🚫 [COMPLIANCE] ${complianceType}:`, complianceEntry);
    }
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation type
   * @param {number} duration - Duration in ms
   * @param {object} metrics - Additional metrics
   */
  logPerformance(operation, duration, metrics = {}) {
    const performanceEntry = {
      id: this.generatePerformanceId(),
      timestamp: Date.now(),
      operation,
      duration,
      metrics,
      systemLoad: this.getSystemLoad(),
      memoryUsage: this.getMemoryUsage()
    };

    this.performanceLog.push(performanceEntry);
    
    // Keep log limited
    if (this.performanceLog.length > this.config.maxLogEntries) {
      this.performanceLog = this.performanceLog.slice(-this.config.maxLogEntries);
    }

    // Check for performance issues
    if (duration > 5000) { // 5 seconds
      this.logSafety('slow_operation', {
        operation,
        duration,
        threshold: 5000
      }, 'medium');
    }
  }

  /**
   * Check safety rules
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   * @returns {object} Safety check result
   */
  checkSafetyRules(eventType, data) {
    const violations = [];
    
    // Check trust change limits
    if (eventType === 'trust_signal' && Math.abs(data.delta) > this.safetyRules.maxTrustChange) {
      violations.push({
        rule: 'max_trust_change',
        message: `Trust change ${data.delta} exceeds limit ${this.safetyRules.maxTrustChange}`,
        severity: 'high'
      });
    }

    // Check memory write rate
    if (eventType === 'memory_proposal') {
      const recentWrites = this.getRecentMemoryWrites(60000); // Last minute
      if (recentWrites.length >= this.safetyRules.maxMemoryWritesPerMinute) {
        violations.push({
          rule: 'max_memory_writes',
          message: `Memory write rate ${recentWrites.length}/min exceeds limit ${this.safetyRules.maxMemoryWritesPerMinute}`,
          severity: 'medium'
        });
      }
    }

    // Check shadow ban duration
    if (eventType === 'shadow_ban_suggestion') {
      const duration = this.parseDuration(data.duration);
      if (duration > this.safetyRules.maxShadowBanDuration) {
        violations.push({
          rule: 'max_shadow_ban_duration',
          message: `Shadow ban duration ${data.duration} exceeds limit`,
          severity: 'high'
        });
      }
    }

    // Check for personal data in global memory
    if (eventType === 'memory_proposal' && data.scope === 'global') {
      if (this.containsPersonalData(data.summary)) {
        violations.push({
          rule: 'personal_data_in_global_memory',
          message: 'Global memory contains personal data',
          severity: 'critical'
        });
      }
    }

    return {
      safe: violations.length === 0,
      violations
    };
  }

  /**
   * Handle safety violation
   * @param {object} auditEntry - Audit entry
   * @param {object} safetyCheck - Safety check result
   */
  handleSafetyViolation(auditEntry, safetyCheck) {
    this.safetyMetrics.blockedOperations++;
    
    // Log safety event
    this.logSafety('safety_rule_violation', {
      auditId: auditEntry.id,
      eventType: auditEntry.eventType,
      violations: safetyCheck.violations
    }, 'high');

    // Block operation if critical violation
    const hasCritical = safetyCheck.violations.some(v => v.severity === 'critical');
    if (hasCritical) {
      this.blockOperation(auditEntry);
    }

    // Emit safety alert
    this.io.emit('safety_alert', {
      auditId: auditEntry.id,
      violations: safetyCheck.violations,
      blocked: hasCritical
    });
  }

  /**
   * Handle high-risk event
   * @param {object} safetyEntry - Safety entry
   */
  handleHighRiskEvent(safetyEntry) {
    // Immediate operator notification
    this.io.emit('high_risk_alert', {
      safetyId: safetyEntry.id,
      safetyType: safetyEntry.safetyType,
      data: safetyEntry.data,
      mitigations: safetyEntry.mitigations
    });

    // Consider automatic mitigation
    if (this.shouldAutoMitigate(safetyEntry)) {
      this.applyAutoMitigation(safetyEntry);
    }
  }

  /**
   * Block operation
   * @param {object} auditEntry - Audit entry
   */
  blockOperation(auditEntry) {
    // Mark operation as blocked
    auditEntry.blocked = true;
    auditEntry.blockedAt = Date.now();
    auditEntry.blockReason = 'Safety violation';

    // Emit block event
    this.io.emit('operation_blocked', {
      auditId: auditEntry.id,
      eventType: auditEntry.eventType,
      reason: auditEntry.blockReason
    });

    console.log(`🚫 Operation blocked: ${auditEntry.eventType}`);
  }

  /**
   * Check compliance
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   * @returns {object} Compliance check result
   */
  checkCompliance(eventType, data) {
    const violations = [];
    
    // GDPR compliance
    if (this.containsPersonalData(data)) {
      violations.push({
        regulation: 'GDPR',
        issue: 'Personal data detected',
        severity: 'medium'
      });
    }

    // Platform compliance
    if (this.containsProhibitedContent(data)) {
      violations.push({
        regulation: 'Platform_TOS',
        issue: 'Prohibited content detected',
        severity: 'high'
      });
    }

    // Data retention compliance
    if (this.exceedsRetentionPeriod(data)) {
      violations.push({
        regulation: 'Data_Retention',
        issue: 'Data exceeds retention period',
        severity: 'medium'
      });
    }

    return {
      compliant: violations.length === 0,
      violations
    };
  }

  /**
   * Generate mitigations
   * @param {string} safetyType - Safety type
   * @param {object} data - Safety data
   * @returns {Array} Mitigations
   */
  generateMitigations(safetyType, data) {
    const mitigations = [];
    
    switch (safetyType) {
      case 'trust_signal':
        mitigations.push('Review trust change limits', 'Consider manual approval');
        break;
        
      case 'memory_proposal':
        mitigations.push('Validate memory content', 'Check for personal data');
        break;
        
      case 'shadow_ban_suggestion':
        mitigations.push('Verify evidence', 'Consider shorter duration');
        break;
        
      case 'slow_operation':
        mitigations.push('Optimize operation', 'Consider timeout');
        break;
        
      default:
        mitigations.push('Review safety rules', 'Manual review required');
    }

    return mitigations;
  }

  /**
   * Generate remediation
   * @param {string} complianceType - Compliance type
   * @param {object} data - Compliance data
   * @returns {object} Remediation plan
   */
  generateRemediation(complianceType, data) {
    return {
      immediate: 'Stop operation',
      shortTerm: 'Review and fix violation',
      longTerm: 'Update compliance procedures',
      responsible: 'System operator',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Get recent memory writes
   * @param {number} timeWindow - Time window in ms
   * @returns {Array} Recent memory writes
   */
  getRecentMemoryWrites(timeWindow) {
    const cutoff = Date.now() - timeWindow;
    
    return this.auditLog
      .filter(entry => 
        entry.eventType === 'memory_proposal' && 
        entry.timestamp > cutoff
      );
  }

  /**
   * Check for personal data
   * @param {object} data - Data to check
   * @returns {boolean} Contains personal data
   */
  containsPersonalData(data) {
    const personalDataPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
    ];

    const dataString = JSON.stringify(data).toLowerCase();
    
    return personalDataPatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Check for prohibited content
   * @param {object} data - Data to check
   * @returns {boolean} Contains prohibited content
   */
  containsProhibitedContent(data) {
    const prohibitedPatterns = [
      /\b(hate|violence|threat|harass)\b/i,
      /\b(illegal|fraud|scam)\b/i
    ];

    const dataString = JSON.stringify(data);
    
    return prohibitedPatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Check retention period
   * @param {object} data - Data to check
   * @returns {boolean} Exceeds retention period
   */
  exceedsRetentionPeriod(data) {
    if (data.timestamp) {
      const age = Date.now() - data.timestamp;
      return age > this.config.retentionPeriod;
    }
    
    return false;
  }

  /**
   * Parse duration string
   * @param {string} duration - Duration string (e.g., "1h", "30m")
   * @returns {number} Duration in ms
   */
  parseDuration(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };
    
    return value * multipliers[unit];
  }

  /**
   * Sanitize data for logging
   * @param {object} data - Data to sanitize
   * @returns {object} Sanitized data
   */
  sanitizeData(data) {
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret'];
    
    const removeSensitive = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(removeSensitive);
      }
      
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = removeSensitive(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };
    
    return removeSensitive(sanitized);
  }

  /**
   * Capture system state
   * @returns {object} System state snapshot
   */
  captureSystemState() {
    return {
      memorySystem: {
        t0Size: Object.keys(this.memorySystem.getT0Context()).length,
        t1Active: !!this.memorySystem.t1Session,
        t2Size: this.memorySystem.t2UserMemory?.size || 0,
        t3Size: Object.keys(this.memorySystem.getT3Global()).length
      },
      trustSystem: {
        totalUsers: this.trustSystem.trustScores?.size || 0,
        averageTrust: this.calculateAverageTrust()
      },
      timestamp: Date.now()
    };
  }

  /**
   * Calculate average trust score
   * @returns {number} Average trust score
   */
  calculateAverageTrust() {
    if (!this.trustSystem.trustScores) return 0;
    
    const scores = Array.from(this.trustSystem.trustScores.values());
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  /**
   * Get current session ID
   * @returns {string} Session ID
   */
  getCurrentSessionId() {
    // This would typically come from the session management system
    return 'session_' + Date.now();
  }

  /**
   * Get system load
   * @returns {object} System load metrics
   */
  getSystemLoad() {
    const usage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    
    return {
      cpu: usage,
      memory: memUsage,
      uptime: process.uptime()
    };
  }

  /**
   * Get memory usage
   * @returns {object} Memory usage
   */
  getMemoryUsage() {
    return process.memoryUsage();
  }

  /**
   * Should log to console
   * @param {string} severity - Event severity
   * @returns {boolean} Should log
   */
  shouldLogToConsole(severity) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevel = levels.indexOf(this.config.logLevel);
    const eventLevel = levels.indexOf(severity);
    
    return eventLevel >= currentLevel;
  }

  /**
   * Should auto-mitigate
   * @param {object} safetyEntry - Safety entry
   * @returns {boolean} Should auto-mitigate
   */
  shouldAutoMitigate(safetyEntry) {
    // Auto-mitigate critical safety events
    return safetyEntry.riskLevel === 'high' && 
           this.config.complianceMode;
  }

  /**
   * Apply auto-mitigation
   * @param {object} safetyEntry - Safety entry
   */
  applyAutoMitigation(safetyEntry) {
    console.log(`🔧 Auto-mitigation applied for: ${safetyEntry.safetyType}`);
    
    // Mark as resolved
    safetyEntry.resolved = true;
    safetyEntry.resolvedAt = Date.now();
    safetyEntry.autoMitigated = true;
  }

  /**
   * Start background tasks
   */
  startBackgroundTasks() {
    // Auto-export task
    if (this.config.autoExport) {
      setInterval(() => {
        this.exportAuditData();
      }, this.config.exportInterval);
    }

    // Cleanup task
    setInterval(() => {
      this.cleanupOldEntries();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Export audit data
   */
  exportAuditData() {
    const data = {
      auditLog: this.auditLog,
      safetyLog: this.safetyLog,
      complianceLog: this.complianceLog,
      performanceLog: this.performanceLog,
      safetyMetrics: this.safetyMetrics,
      exportedAt: Date.now()
    };

    // This would typically save to file or database
    console.log('📄 Audit data exported');
    
    return data;
  }

  /**
   * Cleanup old entries
   */
  cleanupOldEntries() {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoff);
    this.safetyLog = this.safetyLog.filter(entry => entry.timestamp > cutoff);
    this.complianceLog = this.complianceLog.filter(entry => entry.timestamp > cutoff);
    this.performanceLog = this.performanceLog.filter(entry => entry.timestamp > cutoff);
    
    console.log('🧹 Old audit entries cleaned up');
  }

  /**
   * Get audit statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    return {
      ...this.safetyMetrics,
      auditLogSize: this.auditLog.length,
      safetyLogSize: this.safetyLog.length,
      complianceLogSize: this.complianceLog.length,
      performanceLogSize: this.performanceLog.length,
      recentViolations: this.getRecentViolations(10),
      complianceRate: this.calculateComplianceRate()
    };
  }

  /**
   * Get recent violations
   * @param {number} limit - Maximum violations to return
   * @returns {Array} Recent violations
   */
  getRecentViolations(limit = 10) {
    return this.safetyLog
      .filter(entry => !entry.resolved)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Calculate compliance rate
   * @returns {number} Compliance rate (0-1)
   */
  calculateComplianceRate() {
    if (this.complianceLog.length === 0) return 1;
    
    const compliant = this.complianceLog.filter(entry => entry.compliant).length;
    return compliant / this.complianceLog.length;
  }

  /**
   * Generate unique IDs
   */
  generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSafetyId() {
    return `safety_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateComplianceId() {
    return `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generatePerformanceId() {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset audit system
   */
  reset() {
    this.auditLog = [];
    this.safetyLog = [];
    this.complianceLog = [];
    this.performanceLog = [];
    
    this.safetyMetrics = {
      totalOperations: 0,
      blockedOperations: 0,
      highRiskOperations: 0,
      complianceViolations: 0,
      dataLeaks: 0,
      systemErrors: 0
    };

    console.log('🛡️ Safety Audit System reset');
  }

  /**
   * Destroy audit system
   */
  destroy() {
    this.reset();
    console.log('🛡️ Safety Audit System destroyed');
  }
}

module.exports = SafetyAuditSystem;
