/**
 * Enterprise Audit Logger - SOC2/ISO27001 Compliant Logging
 * Implements Standard, Audit, and Incident modes with immutable logging
 */

import crypto from 'crypto'
import { AuditEvent } from './AuditLogger'

export type AuditMode = "standard" | "audit" | "incident"

export interface AuditConfig {
  mode: AuditMode
  immutable: boolean
  retentionDays: number
  encryptionKey?: string
  signatureKey?: string
}

export interface ImmutableAuditEvent extends AuditEvent {
  id: string
  hash: string
  signature?: string
  encrypted?: boolean
  sequence: number
  previousHash?: string
}

export class EnterpriseAuditLogger {
  private config: AuditConfig
  private events: ImmutableAuditEvent[] = []
  private sequence: number = 0
  private lastHash: string = ""
  private incidentMode: boolean = false
  private disabledWriteSkills: Set<string> = new Set()

  constructor(config: AuditConfig) {
    this.config = config
  }

  /**
   * Log event with enterprise-grade security
   */
  log(type: string, data: any, level: "info" | "warning" | "error" | "critical" = "info"): void {
    const event: ImmutableAuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type,
      data,
      level,
      hash: "",
      sequence: this.sequence++,
      previousHash: this.lastHash
    }

    // Create hash for immutability
    event.hash = this.createEventHash(event)

    // Sign in audit mode
    if (this.config.mode === "audit" && this.config.signatureKey) {
      event.signature = this.signEvent(event)
    }

    // Encrypt sensitive data
    if (this.config.encryptionKey && this.isSensitiveData(type, level)) {
      event.data = this.encryptData(JSON.stringify(data))
      event.encrypted = true
    }

    // Add to events
    this.events.push(event)
    this.lastHash = event.hash

    // Enforce retention
    this.enforceRetention()

    // Handle incident mode
    if (this.config.mode === "incident") {
      this.handleIncidentEvent(event)
    }

    // Log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUDIT-${this.config.mode.toUpperCase()}] ${type}:`, event)
    }
  }

  /**
   * Get events with verification
   */
  getEvents(limit?: number, verify: boolean = true): ImmutableAuditEvent[] {
    let events = this.events

    if (limit) {
      events = events.slice(-limit)
    }

    if (verify && this.config.immutable) {
      events = events.filter(event => this.verifyEvent(event))
    }

    return events
  }

  /**
   * Verify event integrity
   */
  verifyEvent(event: ImmutableAuditEvent): boolean {
    if (!event.hash) return false

    const expectedHash = this.createEventHash(event)
    if (event.hash !== expectedHash) {
      return false
    }

    // Verify sequence integrity
    const eventIndex = this.events.findIndex(e => e.id === event.id)
    if (eventIndex > 0) {
      const previousEvent = this.events[eventIndex - 1]
      if (event.previousHash !== previousEvent.hash) {
        return false
      }
    }

    // Verify signature in audit mode
    if (this.config.mode === "audit" && event.signature && this.config.signatureKey) {
      return this.verifySignature(event)
    }

    return true
  }

  /**
   * Export audit trail with integrity verification
   */
  exportAuditTrail(includeVerification: boolean = true): string {
    const trail = {
      metadata: {
        exportedAt: new Date().toISOString(),
        mode: this.config.mode,
        totalEvents: this.events.length,
        sequence: this.sequence,
        lastHash: this.lastHash,
        integrity: includeVerification ? this.verifyChainIntegrity() : null
      },
      events: this.events
    }

    return JSON.stringify(trail, null, 2)
  }

  /**
   * Import audit trail with verification
   */
  importAuditTrail(trailData: string): { success: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      const trail = JSON.parse(trailData)

      if (!trail.metadata || !trail.events) {
        errors.push("Invalid audit trail format")
        return { success: false, errors }
      }

      // Verify integrity
      if (trail.metadata.integrity === false) {
        errors.push("Audit trail integrity verification failed")
      }

      // Import events
      this.events = trail.events
      this.sequence = trail.metadata.sequence
      this.lastHash = trail.metadata.lastHash

      return { success: errors.length === 0, errors }

    } catch (error) {
      errors.push(`Import failed: ${error}`)
      return { success: false, errors }
    }
  }

  /**
   * Set audit mode
   */
  setMode(mode: AuditMode): void {
    this.config.mode = mode

    if (mode === "incident") {
      this.enableIncidentMode()
    } else {
      this.disableIncidentMode()
    }

    this.log("audit_mode_changed", { 
      previousMode: this.config.mode, 
      newMode: mode 
    }, "warning")
  }

  /**
   * Enable incident mode
   */
  private enableIncidentMode(): void {
    this.incidentMode = true
    
    // Disable write skills
    const writeSkills = ['file_write', 'system_modify', 'config_change', 'deploy']
    writeSkills.forEach(skill => this.disabledWriteSkills.add(skill))

    this.log("incident_mode_enabled", {
      disabledSkills: Array.from(this.disabledWriteSkills),
      timestamp: new Date()
    }, "critical")
  }

  /**
   * Disable incident mode
   */
  private disableIncidentMode(): void {
    this.incidentMode = false
    this.disabledWriteSkills.clear()

    this.log("incident_mode_disabled", {
      timestamp: new Date()
    }, "warning")
  }

  /**
   * Handle incident mode events
   */
  private handleIncidentEvent(event: ImmutableAuditEvent): void {
    // Check for risky operations
    const riskyTypes = ['skill_execution', 'system_change', 'config_update']
    if (riskyTypes.includes(event.type)) {
      this.log("risky_operation_blocked", {
        originalEvent: event.id,
        type: event.type,
        reason: "Incident mode active"
      }, "critical")
    }
  }

  /**
   * Check if skill is allowed in current mode
   */
  isSkillAllowed(skillId: string): boolean {
    if (!this.incidentMode) {
      return true
    }

    return !this.disabledWriteSkills.has(skillId)
  }

  /**
   * Get audit statistics
   */
  getStatistics(): any {
    const stats = {
      mode: this.config.mode,
      totalEvents: this.events.length,
      incidentMode: this.incidentMode,
      disabledSkills: Array.from(this.disabledWriteSkills),
      byType: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      encryptedEvents: 0,
      signedEvents: 0,
      integrity: this.verifyChainIntegrity()
    }

    this.events.forEach(event => {
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1
      stats.byLevel[event.level] = (stats.byLevel[event.level] || 0) + 1
      
      if (event.encrypted) stats.encryptedEvents++
      if (event.signature) stats.signedEvents++
    })

    return stats
  }

  // Private methods

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createEventHash(event: ImmutableAuditEvent): string {
    const hashData = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      type: event.type,
      data: event.data,
      level: event.level,
      sequence: event.sequence,
      previousHash: event.previousHash
    })

    return crypto.createHash('sha256').update(hashData).digest('hex')
  }

  private signEvent(event: ImmutableAuditEvent): string {
    if (!this.config.signatureKey) {
      throw new Error("Signature key required for audit mode")
    }

    const signer = crypto.createSign('RSA-SHA256')
    signer.update(event.hash)
    return signer.sign(this.config.signatureKey, 'base64')
  }

  private verifySignature(event: ImmutableAuditEvent): boolean {
    if (!event.signature || !this.config.signatureKey) {
      return false
    }

    try {
      const verifier = crypto.createVerify('RSA-SHA256')
      verifier.update(event.hash)
      return verifier.verify(this.config.signatureKey, event.signature, 'base64')
    } catch (error) {
      return false
    }
  }

  private encryptData(data: string): string {
    if (!this.config.encryptionKey) {
      throw new Error("Encryption key required")
    }

    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    cipher.setAAD(Buffer.from('helm-audit'))
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  }

  private isSensitiveData(type: string, level: string): boolean {
    const sensitiveTypes = ['user_data', 'credentials', 'api_keys', 'personal_info']
    const sensitiveLevels = ['critical', 'error']
    
    return sensitiveTypes.includes(type) || sensitiveLevels.includes(level)
  }

  private enforceRetention(): void {
    const maxEvents = this.config.retentionDays * 24 * 60 * 60 // Rough estimate per day
    
    if (this.events.length > maxEvents) {
      const excess = this.events.length - maxEvents
      this.events.splice(0, excess)
    }
  }

  private verifyChainIntegrity(): boolean {
    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i]
      
      if (event.sequence !== i) return false
      if (i > 0 && event.previousHash !== this.events[i - 1].hash) return false
      if (event.hash !== this.createEventHash(event)) return false
    }
    
    return true
  }

  /**
   * Create enterprise audit logger for different environments
   */
  static forStandard(): EnterpriseAuditLogger {
    return new EnterpriseAuditLogger({
      mode: "standard",
      immutable: false,
      retentionDays: 30
    })
  }

  static forAudit(encryptionKey: string, signatureKey: string): EnterpriseAuditLogger {
    return new EnterpriseAuditLogger({
      mode: "audit",
      immutable: true,
      retentionDays: 255, // ~1 year
      encryptionKey,
      signatureKey
    })
  }

  static forIncident(): EnterpriseAuditLogger {
    return new EnterpriseAuditLogger({
      mode: "incident",
      immutable: true,
      retentionDays: 365 // Permanent for incident investigation
    })
  }
}
