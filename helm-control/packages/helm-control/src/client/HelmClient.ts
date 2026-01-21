/**
 * Helm Client - Core SDK Client
 * Engine-level infrastructure for safe AI operators
 */

import { AccessController } from "../permissions/AccessController"
import { SkillRegistry } from "../skills/SkillRegistry"
import { StabilityMonitor } from "../stability/StabilityMonitor"
import { AuditLogger } from "../audit/AuditLogger"
import { HelmSession } from "./HelmSession"

export class HelmClient {
  private access: AccessController
  private skills: SkillRegistry
  private stability: StabilityMonitor
  private audit: AuditLogger

  constructor(private config: {
    apiKey: string
    environment: "hosted" | "enterprise"
    endpoint?: string
    telemetry?: boolean
  }) {
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
