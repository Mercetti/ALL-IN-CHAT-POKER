/**
 * Acey SOC-Lite Policy Framework
 * Enterprise trust and compliance without over-engineering
 */

const SOC_LITE_POLICIES = {
  version: "1.0.0",
  framework: "SOC-Lite",
  lastUpdated: "2026-01-15",
  
  // 3.1 Access Control Policy
  accessControl: {
    name: "Role-Based Access Control (RBAC)",
    description: "Least-privilege enforcement with role boundaries",
    roles: {
      owner: {
        permissions: [
          "approve_payouts",
          "modify_partner_rules", 
          "export_financial_data",
          "view_all_reports",
          "manage_users",
          "system_configuration"
        ],
        level: "full"
      },
      finance: {
        permissions: [
          "view_reports",
          "prepare_payouts",
          "export_financial_data",
          "flag_anomalies"
        ],
        level: "financial"
      },
      legal: {
        permissions: [
          "view_audit_logs",
          "export_compliance_reports",
          "review_legal_summaries"
        ],
        level: "compliance"
      },
      developer: {
        permissions: [
          "view_system_logs",
          "manage_integrations",
          "configure_apis"
        ],
        level: "technical"
      },
      partner: {
        permissions: [
          "view_own_earnings",
          "view_own_statements",
          "update_payout_method"
        ],
        level: "self"
      },
      viewer: {
        permissions: [
          "view_public_stats",
          "view_anonymous_reports"
        ],
        level: "read-only"
      }
    },
    enforcement: {
      principle: "Least privilege",
      authentication: "Multi-factor for privileged roles",
      sessionTimeout: "15 minutes for privileged access",
      auditAllActions: true
    }
  },

  // 3.2 Data Handling Policy
  dataHandling: {
    name: "Tenant-Isolated Data Management",
    principles: {
      isolation: "Each tenant's data is cryptographically isolated",
      encryption: {
        atRest: "AES-256 encryption for all stored data",
        inTransit: "TLS 1.3 for all network communications",
        keyManagement: "Separate keys per tenant"
      },
      retention: {
        financialData: "7 years (IRS requirement)",
        auditLogs: "10 years (enterprise standard)",
        userProfiles: "Until account deletion"
      },
      crossTenantLearning: {
        allowed: false,
        note: "No cross-tenant model training or data sharing"
      }
    },
    deployment: {
      cloud: "Multi-tenant with logical isolation",
      onPremise: "Available for Enterprise tier",
      hybrid: "Available for Enterprise tier"
    }
  },

  // 3.3 AI Usage Policy
  aiUsage: {
    name: "Governed AI Operations",
    allowedOperations: [
      "summarize_financial_data",
      "flag_anomalies",
      "generate_reports",
      "prepare_payout_batches",
      "create_draft_documents"
    ],
    forbiddenOperations: [
      "execute_payments",
      "modify_contracts",
      "provide_legal_advice",
      "override_human_approvals",
      "access_cross_tenant_data"
    ],
    outputRequirements: {
      schemaValidation: true,
      confidenceScoring: true,
      humanReviewable: true,
      explainable: true
    },
    monitoring: {
      allInteractionsLogged: true,
      anomalyDetection: true,
      humanEscalation: true
    }
  },

  // 3.4 Audit & Logging Policy
  auditLogging: {
    name: "Immutable Audit Trail",
    requirements: {
      immutability: "Append-only logs with cryptographic hashes",
      timestamping: "UTC timestamps with millisecond precision",
      actorAttribution: "User ID, role, and IP address for all actions",
      dataIntegrity: "SHA-256 hashes for log integrity verification"
    },
    logCategories: {
      authentication: "All login attempts, failures, and role changes",
      financial: "All revenue events, payout preparations, and approvals",
      system: "All configuration changes and system events",
      ai: "All AI interactions and decisions"
    },
    retention: {
      activeLogs: "90 days hot storage",
      archivedLogs: "10 years cold storage",
      exportFormat: "JSON, CSV, and PDF with digital signatures"
    }
  },

  // 3.5 Incident Response (Lite)
  incidentResponse: {
    name: "Automated Anomaly Detection with Manual Intervention",
    detection: {
      automated: true,
      types: [
        "unusual_revenue_spikes",
        "failed_payment_attempts",
        "unauthorized_access_attempts",
        "ai_output_anomalies",
        "data_integrity_violations"
      ],
      thresholds: {
        revenueSpike: "3x normal 30-day average",
        failedAttempts: "5+ failed logins in 5 minutes",
        aiAnomaly: "Confidence score below 0.7"
      }
    },
    response: {
      automatedActions: [
        "immediate_alert_notification",
        "temporary_account_lock",
        "enhanced_monitoring",
        "evidence_preservation"
      ],
      requiredManualActions: [
        "incident_classification",
        "remediation_approval",
        "post_incident_review",
        "stakeholder_communication"
      ],
      escalation: {
        level1: "System admin (5 minutes)",
        level2: "Security lead (15 minutes)",
        level3: "Executive team (1 hour)"
      }
    }
  },

  // 3.6 Change Management
  changeManagement: {
    name: "Controlled System Evolution",
    requirements: {
      versionedPrompts: "All AI prompts versioned with change tracking",
      versionedSchemas: "All data schemas versioned with migration paths",
      replayableDecisions: "Ability to replay decisions with previous versions",
      humanApprovalGates: "All changes require human approval"
    },
    process: {
      development: "Feature branch with code review",
      testing: "Automated and manual testing in isolated environment",
      staging: "Production-like environment with real data (anonymized)",
      deployment: "Blue-green deployment with rollback capability"
    },
    documentation: {
      changeLogs: "Detailed change logs for all modifications",
      impactAnalysis: "Risk assessment for all changes",
      rollbackProcedures: "Documented rollback procedures"
    }
  }
};

// Policy compliance checker
class SOCLiteComplianceChecker {
  constructor() {
    this.policies = SOC_LITE_POLICIES;
  }

  // Check if user has permission for action
  hasPermission(userRole, action) {
    const role = this.policies.accessControl.roles[userRole.toLowerCase()];
    if (!role) return false;
    
    return role.permissions.includes(action);
  }

  // Validate AI operation
  validateAIOperation(operation) {
    const allowed = this.policies.aiUsage.allowedOperations;
    const forbidden = this.policies.aiUsage.forbiddenOperations;
    
    if (forbidden.includes(operation)) {
      return { allowed: false, reason: "Operation explicitly forbidden" };
    }
    
    if (!allowed.includes(operation)) {
      return { allowed: false, reason: "Operation not in allowed list" };
    }
    
    return { allowed: true };
  }

  // Check data handling compliance
  checkDataHandling(operation, dataType) {
    const policy = this.policies.dataHandling;
    
    // Check cross-tenant operations
    if (operation === 'cross_tenant_access') {
      return { compliant: false, reason: "Cross-tenant data access forbidden" };
    }
    
    // Check encryption requirements
    if (dataType === 'sensitive' && operation !== 'encrypted') {
      return { compliant: false, reason: "Sensitive data must be encrypted" };
    }
    
    return { compliant: true };
  }

  // Generate compliance report
  generateComplianceReport() {
    return {
      framework: this.policies.framework,
      version: this.policies.version,
      lastUpdated: this.policies.lastUpdated,
      policies: Object.keys(this.policies).map(key => ({
        name: this.policies[key].name,
        status: "implemented",
        lastReviewed: this.policies.lastUpdated
      })),
      complianceScore: 95, // Placeholder - would calculate from actual checks
      recommendations: [
        "Implement multi-factor authentication for all privileged roles",
        "Conduct quarterly penetration testing",
        "Establish incident response runbooks",
        "Implement automated compliance monitoring"
      ]
    };
  }

  // Export SOC-style report
  exportSOCReport(format = 'json') {
    const report = this.generateComplianceReport();
    
    if (format === 'csv') {
      return this.convertToCSV(report);
    }
    
    if (format === 'pdf') {
      return this.convertToPDF(report);
    }
    
    return report;
  }

  convertToCSV(report) {
    const headers = 'Policy,Status,Last Reviewed\n';
    const rows = report.policies.map(p => 
      `${p.name},${p.status},${p.lastReviewed}`
    ).join('\n');
    
    return headers + rows;
  }

  convertToPDF(report) {
    // Placeholder for PDF generation
    return {
      type: 'pdf',
      content: 'PDF generation would be implemented here',
      metadata: {
        framework: report.framework,
        version: report.version,
        generated: new Date().toISOString()
      }
    };
  }
}

module.exports = {
  SOC_LITE_POLICIES,
  SOCLiteComplianceChecker
};
