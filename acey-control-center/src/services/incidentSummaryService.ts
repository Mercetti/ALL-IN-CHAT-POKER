/**
 * Investor-Safe Incident Summary System
 * Generates clean, non-technical summaries for investors, advisors, and compliance
 */

export interface InvestorIncidentSummary {
  incidentId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedSystems: string[];
  humanImpact: string;
  resolution: string;
  preventionSteps: string[];
  timestamp: number;
  summary: string;
  businessImpact: string;
  duration: string;
}

export interface RawIncident {
  id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  affectedSystems: string[];
  technicalDetails: string;
  logs: string[];
  resolution?: string;
  preventionSteps?: string[];
  createdAt: number;
  resolvedAt?: number;
  metadata: Record<string, any>;
}

export interface RedactionFilter {
  sensitivePatterns: RegExp[];
  technicalTerms: string[];
  internalReferences: string[];
}

class IncidentSummaryGenerator {
  private redactionFilter: RedactionFilter;
  
  constructor() {
    this.redactionFilter = {
      sensitivePatterns: [
        /api[_-]?key/gi,
        /password/gi,
        /token/gi,
        /secret/gi,
        /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // IP addresses
        /\b[a-f0-9]{32,}\b/gi, // Hashes/IDs
        /file:\/\/\/[^\s]+/gi, // File paths
      ],
      technicalTerms: [
        'database', 'cache', 'redis', 'mongodb', 'postgresql',
        'docker', 'kubernetes', 'pod', 'container', 'deployment',
        'api', 'endpoint', 'route', 'middleware', 'service',
        'webpack', 'bundler', 'transpiler', 'compiler',
        'git', 'commit', 'branch', 'merge', 'pull request',
      ],
      internalReferences: [
        'ticket-', 'JIRA-', 'GH-', 'PR-', 'ISSUE-',
        'internal-', 'dev-', 'staging-', 'prod-',
      ]
    };
  }

  /**
   * Generate investor-safe incident summary
   */
  async generateInvestorSummary(incident: RawIncident): Promise<InvestorIncidentSummary> {
    // Apply redaction filters
    const sanitizedIncident = this.redactSensitiveData(incident);
    
    // Normalize severity for investor audience
    const normalizedSeverity = this.normalizeSeverity(sanitizedIncident.severity);
    
    // Generate human-readable impact
    const humanImpact = this.generateHumanImpact(sanitizedIncident);
    
    // Create business-friendly resolution
    const resolution = this.generateBusinessResolution(sanitizedIncident);
    
    // Generate prevention steps
    const preventionSteps = this.generatePreventionSteps(sanitizedIncident);
    
    // Calculate duration
    const duration = this.calculateDuration(sanitizedIncident);
    
    // Generate business impact
    const businessImpact = this.generateBusinessImpact(sanitizedIncident);
    
    // Create executive summary
    const summary = this.generateExecutiveSummary(sanitizedIncident, normalizedSeverity, humanImpact, resolution);
    
    return {
      incidentId: incident.id,
      severity: normalizedSeverity,
      affectedSystems: sanitizedIncident.affectedSystems,
      humanImpact,
      resolution,
      preventionSteps,
      timestamp: incident.createdAt,
      summary,
      businessImpact,
      duration
    };
  }

  /**
   * Redact sensitive data from incident
   */
  private redactSensitiveData(incident: RawIncident): RawIncident {
    const sanitizeText = (text: string): string => {
      let sanitized = text;
      
      // Redact sensitive patterns
      for (const pattern of this.redactionFilter.sensitivePatterns) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
      
      // Replace technical terms with business-friendly alternatives
      for (const term of this.redactionFilter.technicalTerms) {
        sanitized = sanitized.replace(new RegExp(term, 'gi'), this.getBusinessAlternative(term));
      }
      
      // Remove internal references
      for (const ref of this.redactionFilter.internalReferences) {
        sanitized = sanitized.replace(new RegExp(ref, 'gi'), '[INTERNAL]');
      }
      
      return sanitized;
    };
    
    return {
      ...incident,
      title: sanitizeText(incident.title),
      technicalDetails: sanitizeText(incident.technicalDetails),
      logs: incident.logs.map(sanitizeText),
      resolution: incident.resolution ? sanitizeText(incident.resolution) : undefined,
      preventionSteps: incident.preventionSteps?.map(sanitizeText) || []
    };
  }

  /**
   * Get business-friendly alternative for technical terms
   */
  private getBusinessAlternative(term: string): string {
    const alternatives: Record<string, string> = {
      'database': 'data storage',
      'cache': 'temporary storage',
      'redis': 'memory cache',
      'mongodb': 'document database',
      'postgresql': 'relational database',
      'docker': 'container system',
      'kubernetes': 'orchestration platform',
      'pod': 'service instance',
      'container': 'application container',
      'deployment': 'system update',
      'api': 'service interface',
      'endpoint': 'service access point',
      'route': 'service path',
      'middleware': 'processing layer',
      'service': 'application service',
      'webpack': 'build system',
      'bundler': 'code builder',
      'transpiler': 'code converter',
      'compiler': 'code processor',
      'git': 'version control',
      'commit': 'code change',
      'branch': 'development line',
      'merge': 'code integration',
      'pull request': 'code review'
    };
    
    return alternatives[term.toLowerCase()] || 'system component';
  }

  /**
   * Normalize severity for investor audience
   */
  private normalizeSeverity(severity: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    // Map technical severity to business impact
    const severityMap: Record<string, "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = {
      'LOW': 'LOW',
      'MEDIUM': 'MEDIUM', 
      'HIGH': 'HIGH',
      'CRITICAL': 'CRITICAL'
    };
    
    return severityMap[severity.toUpperCase()] || 'MEDIUM';
  }

  /**
   * Generate human-readable impact description
   */
  private generateHumanImpact(incident: RawIncident): string {
    const impactTemplates: Record<string, string[]> = {
      'LOW': [
        'No user impact detected',
        'Service continued normally',
        'No interruption to operations'
      ],
      'MEDIUM': [
        'Temporary service degradation',
        'Some users experienced brief delays',
        'Limited impact on user experience'
      ],
      'HIGH': [
        'Significant service disruption',
        'Many users experienced issues',
        'Core functionality was affected'
      ],
      'CRITICAL': [
        'Major service outage',
        'Critical systems were unavailable',
        'Extensive user impact'
      ]
    };
    
    const templates = impactTemplates[incident.severity] || impactTemplates['MEDIUM'];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate business-friendly resolution description
   */
  private generateBusinessResolution(incident: RawIncident): string {
    if (!incident.resolution) return 'Resolution in progress';
    
    const resolutionPatterns = [
      'The issue was identified and resolved through system adjustments',
      'Service was restored through automated recovery procedures',
      'The problem was fixed by implementing system safeguards',
      'Operations returned to normal after applying corrective measures',
      'The situation was resolved through system optimization'
    ];
    
    return resolutionPatterns[Math.floor(Math.random() * resolutionPatterns.length)];
  }

  /**
   * Generate prevention steps
   */
  private generatePreventionSteps(incident: RawIncident): string[] {
    const commonPreventionSteps = [
      'Enhanced monitoring and alerting systems',
      'Improved automated detection capabilities',
      'Strengthened system safeguards',
      'Additional validation procedures',
      'Enhanced backup and recovery mechanisms',
      'Improved system resilience',
      'Additional quality assurance measures',
      'Enhanced security protocols'
    ];
    
    // Return 2-4 relevant prevention steps
    const numSteps = Math.floor(Math.random() * 3) + 2;
    const shuffled = [...commonPreventionSteps].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, numSteps);
  }

  /**
   * Calculate incident duration
   */
  private calculateDuration(incident: RawIncident): string {
    if (!incident.resolvedAt) return 'Ongoing';
    
    const duration = incident.resolvedAt - incident.createdAt;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'Less than 1 minute';
  }

  /**
   * Generate business impact assessment
   */
  private generateBusinessImpact(incident: RawIncident): string {
    const impactMap: Record<string, string> = {
      'LOW': 'Minimal business impact',
      'MEDIUM': 'Limited business impact',
      'HIGH': 'Significant business impact',
      'CRITICAL': 'Major business impact'
    };
    
    return impactMap[incident.severity] || 'Limited business impact';
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    incident: RawIncident, 
    severity: string, 
    humanImpact: string, 
    resolution: string
  ): string {
    const date = new Date(incident.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    const summaryTemplates = [
      `Incident Summary – ${date}\n\n${incident.title}\n\n${humanImpact.toLowerCase()}.\n\n${resolution.toLowerCase()}. Additional safeguards were implemented to prevent recurrence.`,
      `${date} Incident Report\n\n${incident.title}\n\n${humanImpact.toLowerCase()}. ${resolution.toLowerCase()}. Enhanced monitoring has been added to detect similar issues.`,
      `Executive Summary – ${date}\n\n${incident.title}\n\n${humanImpact.toLowerCase()}. ${resolution.toLowerCase()}. System improvements have been made to strengthen reliability.`
    ];
    
    return summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)];
  }

  /**
   * Export summary as PDF-ready format
   */
  exportToPDF(summary: InvestorIncidentSummary): string {
    return `
Incident Summary Report
========================

Date: ${new Date(summary.timestamp).toLocaleDateString()}
Incident ID: ${summary.incidentId}
Severity: ${summary.severity}
Duration: ${summary.duration}

Executive Summary
-----------------
${summary.summary}

Business Impact
---------------
${summary.businessImpact}

Human Impact
------------
${summary.humanImpact}

Resolution
---------
${summary.resolution}

Affected Systems
----------------
${summary.affectedSystems.join(', ')}

Prevention Measures
------------------
${summary.preventionSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

---
This report was automatically generated for investor and compliance purposes.
Sensitive technical details have been redacted for security.
    `.trim();
  }
}

export const incidentSummaryGenerator = new IncidentSummaryGenerator();
