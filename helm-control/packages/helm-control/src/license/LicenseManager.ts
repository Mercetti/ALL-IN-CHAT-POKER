/**
 * License Manager - Central License Management
 * Integrates license validation with Helm Control runtime
 */

import { LicenseValidator, HelmLicense } from './LicenseValidator'

// Emergency lock function
function emergencyLock(reason: string) {
  process.env.HELM_LOCKED = "true"
  console.error("HELM LOCK:", reason)
}

export class LicenseManager {
  private validator: LicenseValidator
  private checkinRequired: boolean = true
  private currentNodes: number = 1

  constructor(publicKey: string, options: {
    checkinRequired?: boolean
    currentNodes?: number
  } = {}) {
    this.validator = new LicenseValidator(publicKey)
    this.checkinRequired = options.checkinRequired ?? true
    this.currentNodes = options.currentNodes ?? 1
  }

  /**
   * Initialize license system (called on Helm startup)
   */
  async initialize(licenseSource: string | HelmLicense): Promise<void> {
    try {
      // Load license
      if (typeof licenseSource === 'string') {
        // License file path (enterprise deployment)
        this.validator.loadLicenseFromFile(licenseSource)
      } else {
        // License object (hosted deployment)
        this.validator.validateLicense(licenseSource)
      }

      // Validate node limits
      if (this.validator.isNodeLimitExceeded(this.currentNodes)) {
        throw new Error(`Node limit exceeded: ${this.currentNodes}/${this.validator.getTier()}`)
      }

      // Start mandatory check-in
      if (this.checkinRequired) {
        this.validator.startMandatoryCheckIn()
      }

      console.log(`✅ Helm license validated: ${this.validator.getOrganization()} (${this.validator.getTier()})`)

    } catch (error) {
      emergencyLock(`License validation failed: ${error}`)
      throw error
    }
  }

  /**
   * Check skill permission before execution
   */
  canExecuteSkill(skillId: string): boolean {
    if (!this.validator.isSkillAllowed(skillId)) {
      console.warn(`🚫 Skill ${skillId} not allowed by license`)
      return false
    }
    return true
  }

  /**
   * Get license information for display
   */
  getLicenseInfo() {
    return this.validator.getStatus()
  }

  /**
   * Update node count (for dynamic scaling)
   */
  updateNodeCount(count: number): void {
    this.currentNodes = count
    
    if (this.validator.isNodeLimitExceeded(count)) {
      emergencyLock(`Node limit exceeded: ${count}`)
    }
  }

  /**
   * Shutdown license manager
   */
  shutdown(): void {
    this.validator.stopCheckIn()
  }

  /**
   * Create license manager for hosted environment
   */
  static forHosted(apiKey: string): LicenseManager {
    // In hosted environment, license is validated server-side
    // This creates a lightweight client-side manager
    return new LicenseManager("", { checkinRequired: false })
  }

  /**
   * Create license manager for enterprise environment
   */
  static forEnterprise(licensePath: string, publicKey: string): LicenseManager {
    return new LicenseManager(publicKey, { 
      checkinRequired: true,
      currentNodes: parseInt(process.env.NODE_COUNT || "1")
    })
  }
}
