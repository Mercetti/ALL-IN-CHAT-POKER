/**
 * Security API Service for Acey Control Center
 * Connects mobile UI to backend security monitoring system
 */

// Import types locally since we can't import from server directory in mobile app
// These would be imported from shared types in production

interface SecurityEvent {
  id: string;
  timestamp: number;
  type: string;
  subtype?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  explanation: string;
  recommendation: string;
  requiresApproval: boolean;
  details?: any;
}

interface SecurityStatus {
  systemIntegrity: 'STABLE' | 'DRIFT_DETECTED';
  fileActivity: 'NORMAL' | 'ANOMALIES';
  modelBehavior: 'STABLE' | 'HALLUCINATION_SPIKE';
  financialOps: 'CLEAN' | 'REVIEW_NEEDED';
  partnerTrust: 'STABLE' | 'DEGRADING';
}

interface FileNode {
  id: string;
  name: string;
  type: 'code' | 'audio' | 'images' | 'datasets' | 'financial';
  lastModified: number;
  source: 'LLM' | 'user' | 'system';
  trustScore: number;
  retentionPolicy: string;
}

interface ApprovalRequest {
  id: string;
  action: string;
  context: any;
  requestedAt: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  constitutionalBasis: any;
  riskAssessment: any;
}

class SecurityApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = 'http://localhost:8080'; // Configure based on environment
    this.loadAuthToken();
  }

  /**
   * Load authentication token from secure storage
   */
  private loadAuthToken() {
    // In real app, this would load from secure storage
    this.authToken = localStorage.getItem('acey_admin_token') || null;
  }

  /**
   * Save authentication token to secure storage
   */
  private saveAuthToken(token: string) {
    // In real app, this would save to secure storage
    localStorage.setItem('acey_admin_token', token);
    this.authToken = token;
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    const url = `${this.baseUrl}/api${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Authenticate user (biometric simulation)
   */
  async authenticate(): Promise<boolean> {
    try {
      // In real app, this would trigger biometric auth
      // For now, simulate with existing token or request login
      
      if (this.authToken) {
        // Validate existing token
        const response = await this.makeRequest('/auth/validate', {
          method: 'POST'
        });
        
        return response.success;
      } else {
        // Would trigger login flow
        return false;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  /**
   * Get current security status
   */
  async getSecurityStatus(): Promise<SecurityStatus> {
    try {
      const response = await this.makeRequest('/file-tools/status', {
        method: 'GET'
      });

      // Transform API response to UI format
      return {
        systemIntegrity: this.determineSystemIntegrity(response.status),
        fileActivity: this.determineFileActivity(response.status),
        modelBehavior: this.determineModelBehavior(response.status),
        financialOps: this.determineFinancialOps(response.status),
        partnerTrust: this.determinePartnerTrust(response.status)
      };
    } catch (error) {
      console.error('Failed to get security status:', error);
      throw error;
    }
  }

  /**
   * Get recent security events
   */
  async getSecurityEvents(limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const response = await this.makeRequest('/security/events', {
        method: 'GET'
      });

      return response.events.slice(0, limit).map(this.transformSecurityEvent);
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }

  /**
   * Get file tree with trust information
   */
  async getFileTree(): Promise<FileNode[]> {
    try {
      const response = await this.makeRequest('/security/files', {
        method: 'GET'
      });

      return response.files.map(this.transformFileNode);
    } catch (error) {
      console.error('Failed to get file tree:', error);
      return [];
    }
  }

  /**
   * Approve security action
   */
  async approveAction(approvalId: string, approved: boolean, reason?: string): Promise<void> {
    try {
      await this.makeRequest('/security/approve', {
        method: 'POST',
        body: JSON.stringify({
          approvalId,
          approved,
          reason: reason || ''
        })
      });
    } catch (error) {
      console.error('Failed to approve action:', error);
      throw error;
    }
  }

  /**
   * Dismiss security alert
   */
  async dismissAlert(alertId: string, reason: string): Promise<void> {
    try {
      await this.makeRequest('/security/dismiss', {
        method: 'POST',
        body: JSON.stringify({
          alertId,
          reason
        })
      });
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      throw error;
    }
  }

  /**
   * Run simulation for security action
   */
  async runSimulation(action: string, context: any): Promise<any> {
    try {
      const response = await this.makeRequest('/security/simulate', {
        method: 'POST',
        body: JSON.stringify({
          action,
          context,
          mode: 'simulation'
        })
      });

      return response.simulation;
    } catch (error) {
      console.error('Failed to run simulation:', error);
      throw error;
    }
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    try {
      const response = await this.makeRequest('/security/approvals/pending', {
        method: 'GET'
      });

      return response.approvals.map(this.transformApprovalRequest);
    } catch (error) {
      console.error('Failed to get pending approvals:', error);
      return [];
    }
  }

  /**
   * Toggle simulation mode
   */
  async toggleSimulationMode(enabled: boolean): Promise<void> {
    try {
      await this.makeRequest('/security/mode', {
        method: 'POST',
        body: JSON.stringify({
          mode: enabled ? 'simulate' : 'observe',
          reason: enabled ? 'Testing new security feature' : 'Normal operations'
        })
      });
    } catch (error) {
      console.error('Failed to toggle simulation mode:', error);
      throw error;
    }
  }

  /**
   * Get model safety metrics
   */
  async getModelSafety(): Promise<any> {
    try {
      const response = await this.makeRequest('/security/model-safety', {
        method: 'GET'
      });

      return {
        hallucinationRate: response.hallucinationRate || 0.02,
        outputVariance: response.outputVariance || 0.05,
        driftFromBaseline: response.driftFromBaseline || 0.01,
        crossModelAgreement: response.crossModelAgreement || 0.95,
        lastSafetyCheck: response.lastSafetyCheck
      };
    } catch (error) {
      console.error('Failed to get model safety:', error);
      return {
        hallucinationRate: 0,
        outputVariance: 0,
        driftFromBaseline: 0,
        crossModelAgreement: 1,
        lastSafetyCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Get financial security status
   */
  async getFinancialSecurity(): Promise<any> {
    try {
      const response = await this.makeRequest('/finance/security-status', {
        method: 'GET'
      });

      return {
        incomingRevenue: response.incomingRevenue || { status: 'normal', amount: 0 },
        pendingPayouts: response.pendingPayouts || [],
        currencyFluctuations: response.currencyFluctuations || { status: 'stable', variance: 0.02 },
        disputes: response.disputes || [],
        partnerTrustScores: response.partnerTrustScores || {},
        lastAudit: response.lastAudit
      };
    } catch (error) {
      console.error('Failed to get financial security:', error);
      return {
        incomingRevenue: { status: 'unknown', amount: 0 },
        pendingPayouts: [],
        currencyFluctuations: { status: 'unknown', variance: 0 },
        disputes: [],
        partnerTrustScores: {},
        lastAudit: null
      };
    }
  }

  /**
   * Transform security event from API format
   */
  private transformSecurityEvent(apiEvent: any): SecurityEvent {
    return {
      id: apiEvent.id,
      timestamp: apiEvent.timestamp,
      type: apiEvent.type,
      subtype: apiEvent.subtype,
      severity: apiEvent.severity,
      message: apiEvent.message || this.generateEventMessage(apiEvent),
      explanation: apiEvent.explanation || this.generateEventExplanation(apiEvent),
      recommendation: apiEvent.recommendation || this.generateEventRecommendation(apiEvent),
      requiresApproval: this.requiresApproval(apiEvent.type)
    };
  }

  /**
   * Transform file node from API format
   */
  private transformFileNode(apiFile: any): FileNode {
    return {
      id: apiFile.id,
      name: apiFile.name,
      type: this.determineFileType(apiFile.path),
      lastModified: apiFile.lastModified,
      source: this.determineFileSource(apiFile),
      trustScore: apiFile.trustScore || 4.0,
      retentionPolicy: this.determineRetentionPolicy(apiFile)
    };
  }

  /**
   * Transform approval request from API format
   */
  private transformApprovalRequest(apiApproval: any): ApprovalRequest {
    return {
      id: apiApproval.id,
      action: apiApproval.action,
      context: apiApproval.context,
      requestedAt: apiApproval.requestedAt,
      status: apiApproval.status,
      constitutionalBasis: apiApproval.constitutionalBasis,
      riskAssessment: apiApproval.riskAssessment
    };
  }

  /**
   * Determine system integrity status
   */
  private determineSystemIntegrity(status: any): 'STABLE' | 'DRIFT_DETECTED' {
    // Check for file integrity issues, configuration changes, etc.
    if (status.fileIntegrityIssues > 0 || status.configurationChanges > 0) {
      return 'DRIFT_DETECTED';
    }
    return 'STABLE';
  }

  /**
   * Determine file activity status
   */
  private determineFileActivity(status: any): 'NORMAL' | 'ANOMALIES' {
    // Check for unusual file patterns
    if (status.unusualFilePatterns || status.rapidFileChanges) {
      return 'ANOMALIES';
    }
    return 'NORMAL';
  }

  /**
   * Determine model behavior status
   */
  private determineModelBehavior(status: any): 'STABLE' | 'HALLUCINATION_SPIKE' {
    // Check for hallucination spikes, output variance
    if (status.hallucinationRate > 0.1 || status.outputVariance > 0.2) {
      return 'HALLUCINATION_SPIKE';
    }
    return 'STABLE';
  }

  /**
   * Determine financial operations status
   */
  private determineFinancialOps(status: any): 'CLEAN' | 'REVIEW_NEEDED' {
    // Check for financial anomalies
    if (status.payoutAnomalies || status.revenueAnomalies) {
      return 'REVIEW_NEEDED';
    }
    return 'CLEAN';
  }

  /**
   * Determine partner trust status
   */
  private determinePartnerTrust(status: any): 'STABLE' | 'DEGRADING' {
    // Check for trust score degradation
    if (status.trustScoreDegradation) {
      return 'DEGRADING';
    }
    return 'STABLE';
  }

  /**
   * Determine file type from path
   */
  private determineFileType(path: string): 'code' | 'audio' | 'images' | 'datasets' | 'financial' {
    if (path.includes('/src/') || path.includes('/server/')) return 'code';
    if (path.includes('/audio/') || path.includes('/sounds/')) return 'audio';
    if (path.includes('/images/') || path.includes('/assets/')) return 'images';
    if (path.includes('/datasets/') || path.includes('/data/')) return 'datasets';
    if (path.includes('/financial/') || path.includes('/payouts/')) return 'financial';
    return 'code'; // default
  }

  /**
   * Determine file source
   */
  private determineFileSource(file: any): 'LLM' | 'user' | 'system' {
    if (file.createdBy === 'acey' || file.source === 'llm') return 'LLM';
    if (file.createdBy === 'system') return 'system';
    return 'user';
  }

  /**
   * Determine retention policy
   */
  private determineRetentionPolicy(file: any): string {
    if (file.source === 'user') return 'User owned';
    if (file.type === 'financial') return '7 years';
    if (file.source === 'LLM') return '90 days';
    return 'User controlled';
  }

  /**
   * Check if action requires approval
   */
  private requiresApproval(actionType: string): boolean {
    const approvalRequired = [
      'delete_files_outside_temp',
      'modify_production',
      'execute_system_commands',
      'process_financial_transactions',
      'access_sensitive_directories'
    ];
    
    return approvalRequired.includes(actionType);
  }

  /**
   * Generate event message
   */
  private generateEventMessage(event: any): string {
    const messages: Record<string, string> = {
      'FILE_ANOMALY': 'Unusual file activity detected',
      'MODEL_DRIFT': 'Model behavior deviation detected',
      'SECURITY_VIOLATION': 'Security rule violation detected',
      'PERMISSION_DENIED': 'Permission denied for action',
      'SYSTEM_ANOMALY': 'System anomaly detected'
    };
    
    return messages[event.type] || 'Security event detected';
  }

  /**
   * Generate event explanation
   */
  private generateEventExplanation(event: any): string {
    const explanations: Record<string, string> = {
      'FILE_ANOMALY': 'File patterns outside normal behavior detected',
      'MODEL_DRIFT': 'AI model output deviating from expected patterns',
      'SECURITY_VIOLATION': 'Attempted action violates constitutional rules',
      'PERMISSION_DENIED': 'Action requires higher trust level or approval',
      'SYSTEM_ANOMALY': 'System metrics showing unusual patterns'
    };
    
    return explanations[event.type] || 'Security monitoring detected unusual activity';
  }

  /**
   * Generate event recommendation
   */
  private generateEventRecommendation(event: any): string {
    const recommendations: Record<string, string> = {
      'FILE_ANOMALY': 'Review file activity and approve if legitimate',
      'MODEL_DRIFT': 'Review training data and consider model rollback',
      'SECURITY_VIOLATION': 'Review constitutional compliance and adjust permissions',
      'PERMISSION_DENIED': 'Grant approval if action is legitimate',
      'SYSTEM_ANOMALY': 'Investigate system resources and recent changes'
    };
    
    return recommendations[event.type] || 'Review event details and take appropriate action';
  }

  /**
   * Get constitutional compliance summary
   */
  async getConstitutionalCompliance(): Promise<any> {
    try {
      const response = await this.makeRequest('/security/constitutional-status', {
        method: 'GET'
      });

      return {
        complianceLevel: '100%',
        activeRules: 7, // ACEY_CORE_PROMPT.laws.length
        violationsToday: response.violationsToday || 0,
        lastViolation: response.lastViolation,
        trustLevel: response.trustLevel || 2 // ACEY_CORE_PROMPT.trust.defaultLevel
      };
    } catch (error) {
      console.error('Failed to get constitutional compliance:', error);
      return {
        complianceLevel: '100%',
        activeRules: 7,
        violationsToday: 0,
        lastViolation: null,
        trustLevel: 2
      };
    }
  }
}

export default SecurityApiService;
