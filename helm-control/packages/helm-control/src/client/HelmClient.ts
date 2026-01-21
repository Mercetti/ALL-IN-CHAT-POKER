/**
 * Helm Client - Core SDK Client
 * Engine-level infrastructure for safe AI operators
 */

import { AccessController } from "../permissions/AccessController"
import { SkillRegistry } from "../skills/SkillRegistry"
import { StabilityMonitor } from "../stability/StabilityMonitor"
import { AuditLogger } from "../audit/AuditLogger"
import { LicenseManager } from "../license/LicenseManager"
import { HelmSession } from "./HelmSession"

export class HelmClient {
  private access: AccessController
  private skills: SkillRegistry
  private stability: StabilityMonitor
  private audit: AuditLogger
  private license: LicenseManager

  constructor(private config: {
    apiKey: string
    environment: "hosted" | "enterprise"
    endpoint?: string
    telemetry?: boolean
    licensePath?: string
  }) {
    // Initialize license manager
    if (config.environment === "enterprise" && config.licensePath) {
      this.license = LicenseManager.forEnterprise(config.licensePath, "test-public-key")
    } else {
      this.license = LicenseManager.forHosted(config.apiKey)
    }

    this.access = new AccessController(config)
    this.skills = new SkillRegistry()
    this.stability = new StabilityMonitor()
    this.audit = new AuditLogger(config.telemetry)
  }

  startSession(context: Record<string, unknown> = {}) {
    this.access.validate()
    return new HelmSession(context, this.skills, this.stability, this.audit)
  }

  listSkills() {
    return this.skills.listPublic()
  }

  shutdown() {
    this.stability.shutdown()
    this.audit.flush()
  }
}
