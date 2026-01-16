/**
 * Acey Demo Mode - System Prompt and Safety Constraints
 * Safe demonstration environment with strict limitations
 */

class DemoMode {
  constructor() {
    this.isActive = false;
    this.sessionId = null;
    this.startTime = null;
    this.constraints = {
      noTraining: true,
      noFileWrites: true,
      noSystemChanges: true,
      readOnlyAnalytics: true,
      maxTokensPerRequest: 1000,
      maxRequestsPerMinute: 10,
      allowedOperations: ["chat", "demo", "status", "monitor"]
    };

    this.systemPrompt = `You are Acey, currently running in DEMO MODE.

DEMO MODE CONSTRAINTS:
- NO training or learning from interactions
- NO file system writes or modifications
- NO system configuration changes
- READ-ONLY analytics and monitoring only
- MAX 1000 tokens per response
- MAX 10 requests per minute per user

DEMO MODE PURPOSE:
Demonstrate capabilities safely and predictably for investors and users.
Show personality, coordination, and control without risk.

YOUR ROLE:
- Be helpful and professional
- Explain what you're doing step-by-step
- Never claim capabilities beyond demo scope
- Always operate within safety constraints
- Provide clear, predictable responses

SAFETY FIRST:
If asked to do anything outside demo constraints:
1. Acknowledge the request
2. Explain it's outside demo mode scope
3. Suggest what you CAN do in demo mode
4. Never attempt to bypass constraints

Remember: Demo mode is about showing control and safety, not unlimited capability.`;

    this.auditLog = [];
    this.requestCount = 0;
    this.lastRequestTime = null;
  }

  // Activate demo mode
  async activate(options = {}) {
    if (this.isActive) {
      return {
        success: false,
        message: "Demo mode already active",
        sessionId: this.sessionId
      };
    }

    try {
      this.sessionId = `demo_${Date.now()}`;
      this.startTime = new Date().toISOString();
      this.isActive = true;
      this.requestCount = 0;
      this.lastRequestTime = null;

      const activation = {
        sessionId: this.sessionId,
        startTime: this.startTime,
        constraints: this.constraints,
        systemPrompt: this.systemPrompt,
        options: {
          duration: options.duration || "unlimited",
          maxUsers: options.maxUsers || 5,
          features: options.features || ["chat", "demo", "monitoring"]
        }
      };

      this.logAuditEvent("demo_mode_activated", activation);

      return {
        success: true,
        message: "Demo mode activated successfully",
        activation
      };

    } catch (error) {
      return {
        success: false,
        message: `Demo mode activation failed: ${error.message}`,
        error: error.toString()
      };
    }
  }

  // Deactivate demo mode
  async deactivate() {
    if (!this.isActive) {
      return {
        success: false,
        message: "Demo mode not active"
      };
    }

    try {
      const deactivation = {
        sessionId: this.sessionId,
        endTime: new Date().toISOString(),
        duration: this.calculateSessionDuration(),
        totalRequests: this.requestCount,
        auditLogSize: this.auditLog.length
      };

      this.isActive = false;
      this.sessionId = null;

      this.logAuditEvent("demo_mode_deactivated", deactivation);

      return {
        success: true,
        message: "Demo mode deactivated successfully",
        deactivation
      };

    } catch (error) {
      return {
        success: false,
        message: `Demo mode deactivation failed: ${error.message}`,
        error: error.toString()
      };
    }
  }

  // Process request with demo mode constraints
  async processRequest(request) {
    if (!this.isActive) {
      return {
        success: false,
        message: "Demo mode not active",
        constraint: "mode_not_active"
      };
    }

    try {
      // Check rate limiting
      const rateLimitCheck = this.checkRateLimit();
      if (!rateLimitCheck.allowed) {
        this.logAuditEvent("request_rate_limited", {
          request: request.id,
          reason: rateLimitCheck.reason
        });

        return {
          success: false,
          message: "Request rate limit exceeded",
          constraint: "rate_limit",
          retryAfter: rateLimitCheck.retryAfter
        };
      }

      // Check operation constraints
      const constraintCheck = this.checkConstraints(request);
      if (!constraintCheck.allowed) {
        this.logAuditEvent("request_constraint_violation", {
          request: request.id,
          constraint: constraintCheck.constraint,
          operation: request.operation
        });

        return {
          success: false,
          message: `Operation not allowed in demo mode: ${constraintCheck.constraint}`,
          constraint: constraintCheck.constraint,
          suggestion: constraintCheck.suggestion
        };
      }

      // Check token limits
      const tokenCheck = this.checkTokenLimit(request);
      if (!tokenCheck.allowed) {
        this.logAuditEvent("request_token_limit", {
          request: request.id,
          tokens: tokenCheck.tokens,
          limit: this.constraints.maxTokensPerRequest
        });

        return {
          success: false,
          message: `Token limit exceeded: ${tokenCheck.tokens}/${this.constraints.maxTokensPerRequest}`,
          constraint: "token_limit",
          suggestion: "Shorten your request"
        };
      }

      // Process allowed request
      this.requestCount++;
      this.lastRequestTime = new Date().toISOString();

      const response = await this.processAllowedRequest(request);
      
      this.logAuditEvent("request_processed", {
        request: request.id,
        operation: request.operation,
        responseId: response.id,
        processingTime: response.processingTime
      });

      return {
        success: true,
        response,
        demoMode: {
          active: true,
          sessionId: this.sessionId,
          constraints: this.constraints
        }
      };

    } catch (error) {
      this.logAuditEvent("request_error", {
        request: request.id,
        error: error.message
      });

      return {
        success: false,
        message: `Request processing failed: ${error.message}`,
        error: error.toString()
      };
    }
  }

  // Check rate limiting
  checkRateLimit() {
    if (!this.lastRequestTime) {
      return { allowed: true };
    }

    const now = new Date();
    const lastRequest = new Date(this.lastRequestTime);
    const timeDiff = (now - lastRequest) / 1000; // seconds

    if (timeDiff < 60) { // Within 1 minute window
      if (this.requestCount >= this.constraints.maxRequestsPerMinute) {
        const retryAfter = 60 - Math.ceil(timeDiff);
        return {
          allowed: false,
          reason: "Too many requests in last minute",
          retryAfter
        };
      }
    }

    return { allowed: true };
  }

  // Check operation constraints
  checkConstraints(request) {
    const operation = request.operation;
    
    if (!this.constraints.allowedOperations.includes(operation)) {
      return {
        allowed: false,
        constraint: "operation_not_allowed",
        suggestion: `Try allowed operations: ${this.constraints.allowedOperations.join(", ")}`
      };
    }

    // Check specific constraints
    if (this.constraints.noTraining && operation === "train") {
      return {
        allowed: false,
        constraint: "no_training",
        suggestion: "Training is disabled in demo mode"
      };
    }

    if (this.constraints.noFileWrites && operation === "write_file") {
      return {
        allowed: false,
        constraint: "no_file_writes",
        suggestion: "File writes are disabled in demo mode"
      };
    }

    if (this.constraints.noSystemChanges && operation === "system_change") {
      return {
        allowed: false,
        constraint: "no_system_changes",
        suggestion: "System changes are disabled in demo mode"
      };
    }

    return { allowed: true };
  }

  // Check token limits
  checkTokenLimit(request) {
    const estimatedTokens = this.estimateTokens(request.content || "");
    
    if (estimatedTokens > this.constraints.maxTokensPerRequest) {
      return {
        allowed: false,
        tokens: estimatedTokens
      };
    }

    return { allowed: true, tokens: estimatedTokens };
  }

  // Process allowed request
  async processAllowedRequest(request) {
    const startTime = Date.now();
    const responseId = `resp_${Date.now()}`;

    // Simulate processing based on operation type
    let response;
    
    switch (request.operation) {
      case "chat":
        response = await this.processChatRequest(request);
        break;
      case "demo":
        response = await this.processDemoRequest(request);
        break;
      case "status":
        response = await this.processStatusRequest(request);
        break;
      case "monitor":
        response = await this.processMonitorRequest(request);
        break;
      default:
        response = {
          id: responseId,
          content: "Operation processed in demo mode",
          operation: request.operation,
          demoMode: true
        };
    }

    response.processingTime = Date.now() - startTime;
    response.id = responseId;

    return response;
  }

  // Process chat request
  async processChatRequest(request) {
    await this.delay(1000); // Simulate thinking time

    return {
      id: null, // Will be set by caller
      content: `Hello! I'm Acey running in demo mode. I can help you with chat, demonstrations, and status monitoring. 

Remember, in demo mode I have some safety constraints like no file writes or system changes. What would you like to explore?`,
      operation: "chat",
      demoMode: true,
      personality: "professional_helpful",
      safetyConstraints: this.constraints
    };
  }

  // Process demo request
  async processDemoRequest(request) {
    await this.delay(500);

    return {
      id: null,
      content: `I can run demonstrations in demo mode. Available demos:
- "acey-online" - Shows startup sequence
- "tool-orchestration" - Shows tool coordination  
- "live-chat" - Shows chat interaction
- "shutdown" - Shows responsible shutdown

Which demo would you like to see?`,
      operation: "demo",
      demoMode: true,
      availableDemos: ["acey-online", "tool-orchestration", "live-chat", "shutdown"]
    };
  }

  // Process status request
  async processStatusRequest(request) {
    await this.delay(200);

    return {
      id: null,
      content: `Demo Mode Status:
- Active: ${this.isActive}
- Session: ${this.sessionId}
- Requests: ${this.requestCount}
- Constraints: ${JSON.stringify(this.constraints, null, 2)}`,
      operation: "status",
      demoMode: true,
      status: {
        active: this.isActive,
        sessionId: this.sessionId,
        requests: this.requestCount,
        constraints: this.constraints
      }
    };
  }

  // Process monitor request
  async processMonitorRequest(request) {
    await this.delay(300);

    return {
      id: null,
      content: `Demo Mode Monitoring:
- Session duration: ${this.calculateSessionDuration()}
- Audit log entries: ${this.auditLog.length}
- Rate limit usage: ${this.requestCount}/${this.constraints.maxRequestsPerMinute} per minute`,
      operation: "monitor",
      demoMode: true,
      monitoring: {
        sessionDuration: this.calculateSessionDuration(),
        auditLogSize: this.auditLog.length,
        rateLimitUsage: `${this.requestCount}/${this.constraints.maxRequestsPerMinute}`
      }
    };
  }

  // Estimate tokens (rough calculation)
  estimateTokens(text) {
    return Math.ceil(text.length / 4); // Rough estimate: 1 token per 4 characters
  }

  // Calculate session duration
  calculateSessionDuration() {
    if (!this.startTime) return "0s";
    
    const duration = Date.now() - new Date(this.startTime).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  // Log audit event
  logAuditEvent(eventType, data) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      eventType,
      data
    };

    this.auditLog.push(auditEntry);

    // Keep audit log manageable
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-500);
    }
  }

  // Get audit log
  getAuditLog(limit = 100) {
    return {
      log: this.auditLog.slice(-limit),
      total: this.auditLog.length,
      limit,
      sessionId: this.sessionId
    };
  }

  // Get demo mode status
  getStatus() {
    return {
      isActive: this.isActive,
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration: this.calculateSessionDuration(),
      requestCount: this.requestCount,
      constraints: this.constraints,
      systemPrompt: this.systemPrompt
    };
  }

  // Get system prompt
  getSystemPrompt() {
    return {
      prompt: this.systemPrompt,
      constraints: this.constraints,
      purpose: "Safe demonstration environment with strict limitations"
    };
  }

  // Helper delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = DemoMode;
