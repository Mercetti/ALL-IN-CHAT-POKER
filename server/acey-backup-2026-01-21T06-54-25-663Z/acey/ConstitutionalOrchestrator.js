/**
 * Constitutional Orchestrator for Acey
 * Enforces the master system prompt constitution across all components
 * Ensures Acey never bypasses governance rules
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const { ACEY_CORE_PROMPT, generateSystemPrompt, isActionPermitted } = require('../core/system-prompt');

class ConstitutionalOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      backendUrl: options.backendUrl || 'http://localhost:8080',
      adminToken: options.adminToken,
      db: options.db,
      logger: options.logger || console,
      ...options
    };
    
    // Execution modes (constitutional enforcement)
    this.modes = {
      OBSERVE: 'observe',
      SIMULATE: 'simulate', 
      PREPARE: 'prepare',
      AWAIT_APPROVAL: 'await_approval',
      AUDIT: 'audit',
      INCIDENT_RESPONSE: 'incident_response'
    };
    
    // Current system state
    this.state = {
      mode: this.modes.OBSERVE,
      trustLevel: ACEY_CORE_PROMPT.trust.defaultLevel,
      activeSession: null,
      pendingApprovals: new Map(),
      auditLog: [],
      securityEvents: [],
      skillRegistry: new Map(),
      userContext: new Map()
    };
    
    // Constitutional enforcement
    this.enforcement = {
      requiredApprovals: new Set(ACEY_CORE_PROMPT.permissions.requires_approval),
      forbiddenActions: new Set(ACEY_CORE_PROMPT.permissions.forbidden),
      autoApproved: new Set(ACEY_CORE_PROMPT.permissions.auto_approved)
    };
    
    this.initialize();
  }

  /**
   * Initialize constitutional orchestrator
   */
  async initialize() {
    try {
      // Load security configuration
      await this.loadSecurityConfig();
      
      // Initialize skill registry
      await this.initializeSkillRegistry();
      
      // Start audit logging
      this.startAuditLogging();
      
      // Set up constitutional enforcement
      this.setupConstitutionalEnforcement();
      
      this.config.logger.info('Constitutional Orchestrator initialized', {
        mode: this.state.mode,
        trustLevel: this.state.trustLevel,
        skillsRegistered: this.state.skillRegistry.size,
        constitutionalVersion: ACEY_CORE_PROMPT.version
      });
      
    } catch (error) {
      this.config.logger.error('Constitutional Orchestrator initialization failed', { 
        error: error.message 
      });
    }
  }

  /**
   * Load security configuration from database
   */
  async loadSecurityConfig() {
    if (!this.config.db) return;
    
    try {
      const configStmt = this.config.db.prepare(`
        SELECT key, value FROM security_config
      `);
      
      const configs = configStmt.all();
      
      for (const { key, value } of configs) {
        // Apply security configurations
        if (key.includes('threshold')) {
          this.config[key] = parseInt(value);
        } else {
          this.config[key] = value;
        }
      }
      
    } catch (error) {
      this.config.logger.warn('Failed to load security config', { error: error.message });
    }
  }

  /**
   * Initialize skill registry with constitutional compliance
   */
  async initializeSkillRegistry() {
    const coreSkills = [
      'SecurityObserver',
      'FileTools', 
      'CodeHelper',
      'GraphicsWizard',
      'AudioMaestro',
      'LinkReview'
    ];
    
    for (const skillName of coreSkills) {
      this.state.skillRegistry.set(skillName, {
        name: skillName,
        status: 'registered',
        permissions: this.determineSkillPermissions(skillName),
        trustRequirement: this.determineTrustRequirement(skillName),
        isolationLevel: 'sandboxed',
        lastUsed: null,
        usageCount: 0
      });
    }
  }

  /**
   * Determine skill permissions based on constitutional rules
   */
  determineSkillPermissions(skillName) {
    const skillPermissions = {
      SecurityObserver: ['read_project_files', 'monitor_systems', 'log_activities', 'create_alerts'],
      FileTools: ['create_temp_files', 'create_archives', 'scan_files_security', 'request_permissions'],
      CodeHelper: ['analyze_code', 'suggest_tasks', 'create_summaries'],
      GraphicsWizard: ['generate_content', 'create_temp_files'],
      AudioMaestro: ['generate_content', 'create_temp_files'],
      LinkReview: ['send_network_requests', 'analyze_content']
    };
    
    return skillPermissions[skillName] || [];
  }

  /**
   * Determine trust requirement for skill
   */
  determineTrustRequirement(skillName) {
    const trustRequirements = {
      SecurityObserver: 2, // Standard trust for monitoring
      FileTools: 3,       // High trust - requires approval for destructive actions
      CodeHelper: 2,       // Standard trust for code analysis
      GraphicsWizard: 2,    // Standard trust for content generation
      AudioMaestro: 2,     // Standard trust for content generation
      LinkReview: 2         // Standard trust for content analysis
    };
    
    return trustRequirements[skillName] || 2;
  }

  /**
   * Start continuous audit logging
   */
  startAuditLogging() {
    // Log all orchestrator events
    this.onAnyEvent((event, data) => {
      this.logAuditEvent({
        type: 'ORCHESTRATOR_EVENT',
        subtype: event,
        timestamp: Date.now(),
        data
      });
    });
  }

  /**
   * Set up constitutional enforcement for all operations
   */
  setupConstitutionalEnforcement() {
    // Intercept all skill executions
    this.on('skill_execution_request', async (request) => {
      return await this.enforceSkillExecution(request);
    });
    
    // Intercept all API calls
    this.on('api_call_request', async (request) => {
      return await this.enforceApiCall(request);
    });
    
    // Intercept all mode changes
    this.on('mode_change_request', async (request) => {
      return await this.enforceModeChange(request);
    });
  }

  /**
   * Enforce constitutional rules on skill execution
   */
  async enforceSkillExecution(request) {
    const { skillName, action, context, userId } = request;
    
    // Check if skill exists
    if (!this.state.skillRegistry.has(skillName)) {
      return {
        permitted: false,
        reason: 'Skill not registered',
        requiresApproval: false
      };
    }
    
    const skill = this.state.skillRegistry.get(skillName);
    
    // Check trust level requirement
    if (this.state.trustLevel < skill.trustRequirement) {
      return {
        permitted: false,
        reason: `Insufficient trust level. Required: ${skill.trustRequirement}, Current: ${this.state.trustLevel}`,
        requiresApproval: true
      };
    }
    
    // Check constitutional permissions
    const permissionCheck = isActionPermitted(action, {
      trustLevel: this.state.trustLevel,
      hasApproval: context.hasApproval
    });
    
    if (!permissionCheck.permitted) {
      // Log security event
      await this.logSecurityEvent({
        type: 'PERMISSION_DENIED',
        skillName,
        action,
        reason: permissionCheck.reason,
        userId,
        timestamp: Date.now()
      });
      
      return permissionCheck;
    }
    
    // Generate system prompt for skill
    const systemPrompt = generateSystemPrompt('skill', {
      trustLevel: this.state.trustLevel,
      mode: this.state.mode
    });
    
    // Update skill usage
    skill.lastUsed = Date.now();
    skill.usageCount++;
    
    // Log execution
    this.logAuditEvent({
      type: 'SKILL_EXECUTION',
      skillName,
      action,
      userId,
      timestamp: Date.now(),
      permitted: true
    });
    
    return {
      permitted: true,
      systemPrompt,
      executionMode: this.state.mode
    };
  }

  /**
   * Enforce constitutional rules on API calls
   */
  async enforceApiCall(request) {
    const { endpoint, method, data, userId } = request;
    
    // Check constitutional permissions
    const action = `${method.toLowerCase()}_${endpoint}`;
    const permissionCheck = isActionPermitted(action, {
      trustLevel: this.state.trustLevel,
      hasApproval: data.hasApproval
    });
    
    if (!permissionCheck.permitted) {
      await this.logSecurityEvent({
        type: 'API_PERMISSION_DENIED',
        endpoint,
        method,
        reason: permissionCheck.reason,
        userId,
        timestamp: Date.now()
      });
      
      return permissionCheck;
    }
    
    // Log API call
    this.logAuditEvent({
      type: 'API_CALL',
      endpoint,
      method,
      userId,
      timestamp: Date.now(),
      permitted: true
    });
    
    return {
      permitted: true,
      executionMode: this.state.mode
    };
  }

  /**
   * Enforce constitutional rules on mode changes
   */
  async enforceModeChange(request) {
    const { newMode, reason, userId } = request;
    
    // Validate mode
    if (!Object.values(this.modes).includes(newMode)) {
      return {
        permitted: false,
        reason: 'Invalid execution mode'
      };
    }
    
    // Only founder can change modes
    if (userId !== 'founder') {
      await this.logSecurityEvent({
        type: 'UNAUTHORIZED_MODE_CHANGE',
        requestedMode: newMode,
        reason,
        userId,
        timestamp: Date.now()
      });
      
      return {
        permitted: false,
        reason: 'Only founder can change execution modes'
      };
    }
    
    const oldMode = this.state.mode;
    this.state.mode = newMode;
    
    // Log mode change
    this.logAuditEvent({
      type: 'MODE_CHANGE',
      oldMode,
      newMode,
      reason,
      userId,
      timestamp: Date.now()
    });
    
    return {
      permitted: true,
      oldMode,
      newMode
    };
  }

  /**
   * Request approval for an action
   */
  async requestApproval(action, context) {
    const approvalId = crypto.randomUUID();
    
    const approvalRequest = {
      id: approvalId,
      action,
      context,
      requestedAt: Date.now(),
      requestedBy: context.userId || 'system',
      status: 'PENDING',
      constitutionalBasis: this.getConstitutionalBasis(action),
      riskAssessment: await this.assessRisk(action, context)
    };
    
    this.state.pendingApprovals.set(approvalId, approvalRequest);
    
    // Log approval request
    this.logAuditEvent({
      type: 'APPROVAL_REQUEST',
      approvalId,
      action,
      context,
      timestamp: Date.now()
    });
    
    // Notify founder
    await this.notifyFounder({
      type: 'APPROVAL_REQUIRED',
      approval: approvalRequest
    });
    
    return approvalId;
  }

  /**
   * Get constitutional basis for action
   */
  getConstitutionalBasis(action) {
    const basis = {
      action,
      constitutionalLaws: [],
      permissions: [],
      risks: []
    };
    
    // Check which constitutional laws apply
    if (this.enforcement.forbiddenActions.has(action)) {
      basis.constitutionalLaws.push('APPROVAL_REQUIRED');
      basis.risks.push('Constitutionally forbidden action');
    }
    
    if (this.enforcement.requiredApprovals.has(action)) {
      basis.constitutionalLaws.push('APPROVAL_REQUIRED');
      basis.permissions.push('requires_approval');
    }
    
    if (this.enforcement.autoApproved.has(action)) {
      basis.permissions.push('auto_approved');
    }
    
    return basis;
  }

  /**
   * Assess risk of action
   */
  async assessRisk(action, context) {
    const riskFactors = {
      dataImpact: this.assessDataImpact(action),
      systemImpact: this.assessSystemImpact(action),
      securityImpact: this.assessSecurityImpact(action),
      financialImpact: this.assessFinancialImpact(action)
    };
    
    const riskScore = Object.values(riskFactors).reduce((sum, score) => sum + score, 0) / 4;
    
    return {
      score: riskScore,
      level: this.getRiskLevel(riskScore),
      factors: riskFactors
    };
  }

  /**
   * Assess data impact of action
   */
  assessDataImpact(action) {
    if (action.includes('delete') || action.includes('modify')) return 0.8;
    if (action.includes('read') || action.includes('analyze')) return 0.2;
    if (action.includes('create') || action.includes('generate')) return 0.4;
    return 0.3;
  }

  /**
   * Assess system impact of action
   */
  assessSystemImpact(action) {
    if (action.includes('deploy') || action.includes('restart')) return 0.9;
    if (action.includes('config') || action.includes('modify')) return 0.6;
    if (action.includes('monitor') || action.includes('analyze')) return 0.1;
    return 0.3;
  }

  /**
   * Assess security impact of action
   */
  assessSecurityImpact(action) {
    if (action.includes('auth') || action.includes('permissions')) return 0.9;
    if (action.includes('security') || action.includes('certificates')) return 0.8;
    if (action.includes('network') || action.includes('external')) return 0.5;
    return 0.2;
  }

  /**
   * Assess financial impact of action
   */
  assessFinancialImpact(action) {
    if (action.includes('payout') || action.includes('transaction')) return 0.9;
    if (action.includes('financial') || action.includes('billing')) return 0.7;
    if (action.includes('partner') || action.includes('revenue')) return 0.5;
    return 0.1;
  }

  /**
   * Get risk level from score
   */
  getRiskLevel(score) {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    if (score >= 0.2) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event) {
    this.state.securityEvents.push({
      ...event,
      id: crypto.randomUUID(),
      loggedAt: Date.now()
    });
    
    // Also log to database if available
    if (this.config.db) {
      try {
        const stmt = this.config.db.prepare(`
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
        this.config.logger.error('Failed to log security event to database', { 
          error: error.message 
        });
      }
    }
    
    // Emit for other components
    this.emit('security_event', event);
  }

  /**
   * Log audit event
   */
  logAuditEvent(event) {
    this.state.auditLog.push({
      ...event,
      id: crypto.randomUUID(),
      loggedAt: Date.now()
    });
    
    // Keep audit log manageable (last 10000 events)
    if (this.state.auditLog.length > 10000) {
      this.state.auditLog = this.state.auditLog.slice(-5000);
    }
  }

  /**
   * Notify founder of important events
   */
  async notifyFounder(notification) {
    const message = `🔐 ${notification.type}\n\n` +
      `Time: ${new Date().toISOString()}\n` +
      `Details: ${JSON.stringify(notification, null, 2)}`;
    
    // Emit notification event
    this.emit('founder_notification', {
      type: notification.type,
      priority: 'HIGH',
      message,
      data: notification
    });
    
    this.config.logger.warn('Founder notification sent', notification);
  }

  /**
   * Update trust score
   */
  async updateTrustScore(entityId, change, reason) {
    const currentScore = this.state.trustLevel;
    const newScore = Math.max(0, Math.min(4, currentScore + change));
    
    this.state.trustLevel = newScore;
    
    // Log trust score change
    this.logAuditEvent({
      type: 'TRUST_SCORE_CHANGE',
      entityId,
      oldScore: currentScore,
      newScore,
      change,
      reason,
      timestamp: Date.now()
    });
    
    // Update in database if available
    if (this.config.db) {
      try {
        const stmt = this.config.db.prepare(`
          INSERT OR REPLACE INTO trust_scores (id, entity_type, entity_id, trust_level, last_updated, update_reason)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          crypto.randomUUID(),
          'system',
          entityId,
          newScore,
          Date.now(),
          reason
        );
      } catch (error) {
        this.config.logger.error('Failed to update trust score in database', { 
          error: error.message 
        });
      }
    }
    
    this.config.logger.info('Trust score updated', {
      entityId,
      oldScore: currentScore,
      newScore,
      change,
      reason
    });
  }

  /**
   * Get system status
   */
  async getSystemStatus() {
    return {
      constitutional: {
        version: ACEY_CORE_PROMPT.version,
        mode: this.state.mode,
        trustLevel: this.state.trustLevel,
        activeSkills: this.state.skillRegistry.size,
        pendingApprovals: this.state.pendingApprovals.size
      },
      security: {
        eventsLastHour: this.getRecentSecurityEvents(60 * 60 * 1000).length,
        totalEvents: this.state.securityEvents.length,
        lastEvent: this.state.securityEvents.length > 0 
          ? this.state.securityEvents[this.state.securityEvents.length - 1]
          : null
      },
      audit: {
        totalEvents: this.state.auditLog.length,
        lastEvent: this.state.auditLog.length > 0
          ? this.state.auditLog[this.state.auditLog.length - 1]
          : null
      },
      enforcement: {
        activeRules: ACEY_CORE_PROMPT.laws.length,
        requiredApprovals: this.enforcement.requiredApprovals.size,
        forbiddenActions: this.enforcement.forbiddenActions.size
      }
    };
  }

  /**
   * Get recent security events
   */
  getRecentSecurityEvents(timeWindow) {
    const cutoff = Date.now() - timeWindow;
    return this.state.securityEvents.filter(event => event.timestamp > cutoff);
  }

  /**
   * Event listener wrapper for audit logging
   */
  onAnyEvent(callback) {
    // Wrap all event emitters to log
    const originalEmit = this.emit;
    this.emit = function(event, ...args) {
      callback(event, args);
      return originalEmit.call(this, event, ...args);
    };
  }

  /**
   * Process skill request with constitutional enforcement
   */
  async processSkillRequest(skillName, request, context = {}) {
    const executionRequest = {
      skillName,
      action: request,
      context,
      userId: context.userId || 'system'
    };
    
    const enforcement = await this.enforceSkillExecution(executionRequest);
    
    if (!enforcement.permitted) {
      if (enforcement.requiresApproval) {
        const approvalId = await this.requestApproval(request, context);
        return {
          success: false,
          requiresApproval: true,
          approvalId,
          reason: enforcement.reason
        };
      }
      
      return {
        success: false,
        reason: enforcement.reason
      };
    }
    
    return {
      success: true,
      systemPrompt: enforcement.systemPrompt,
      executionMode: enforcement.executionMode
    };
  }
}

module.exports = ConstitutionalOrchestrator;
