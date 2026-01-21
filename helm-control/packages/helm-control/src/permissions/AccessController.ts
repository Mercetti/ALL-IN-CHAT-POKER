/**
 * Access Controller - Permission Enforcement
 * Enforces tier-based access and skill permissions
 */

export interface AccessConfig {
  apiKey: string
  environment: "hosted" | "enterprise"
  endpoint?: string
  telemetry?: boolean
}

export class AccessController {
  private config: AccessConfig
  private validated: boolean = false

  constructor(config: AccessConfig) {
    this.config = config
  }

  validate(): void {
    if (!this.config.apiKey) {
      throw new Error("API key required")
    }
    
    if (!this.config.environment) {
      throw new Error("Environment required")
    }

    // Validate API key format
    const apiKeyPattern = /^pk_[a-zA-Z0-9]{32,}$/
    if (!apiKeyPattern.test(this.config.apiKey)) {
      throw new Error("Invalid API key format")
    }

    this.validated = true
  }

  checkSkillAccess(skillId: string, sessionId?: string): boolean {
    if (!this.validated) {
      throw new Error("AccessController not validated")
    }

    // Basic skill access logic - expand as needed
    const allowedSkills = [
      'basic_chat',
      'poker_deal',
      'poker_bet',
      'analytics',
      'monitoring'
    ]

    return allowedSkills.includes(skillId)
  }

  checkPersonaAccess(persona: any): boolean {
    if (!this.validated) {
      throw new Error("AccessController not validated")
    }

    // Basic persona validation
    return persona && typeof persona === 'object' && persona.id
  }

  getTier(): string {
    // Extract tier from API key or config
    if (this.config.apiKey.startsWith('pk_live_')) {
      return 'enterprise'
    } else if (this.config.apiKey.startsWith('pk_test_')) {
      return 'creator'
    }
    return 'free'
  }
}
