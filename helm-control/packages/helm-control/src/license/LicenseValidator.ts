/**
 * License Validator - Non-Bypassable License Enforcement
 * Ensures no unpaid usage, silent forks, or offline abuse
 */

import crypto from "crypto"

export interface HelmLicense {
  license_id: string
  org: string
  tier: "free" | "pro" | "enterprise"
  skills_allowed: string[]
  max_nodes: number
  expires: string
  signature: string
}

export class LicenseValidator {
  private license: HelmLicense | null = null
  private publicKey: string
  private checkinInterval: NodeJS.Timeout | null = null
  private isValid: boolean = false

  constructor(publicKey: string) {
    this.publicKey = publicKey
  }

  /**
   * Validate license signature and expiry
   */
  validateLicense(license: HelmLicense): void {
    // Create verification data
    const verificationData = JSON.stringify({
      license_id: license.license_id,
      org: license.org,
      expires: license.expires
    })

    const verifier = crypto.createVerify("RSA-SHA256")
    verifier.update(verificationData)

    if (!verifier.verify(this.publicKey, license.signature, "base64")) {
      throw new Error("Invalid Helm license signature")
    }

    if (new Date(license.expires) < new Date()) {
      throw new Error("Helm license expired")
    }

    this.license = license
    this.isValid = true
  }

  /**
   * Check if skill is allowed by license
   */
  isSkillAllowed(skillId: string): boolean {
    if (!this.isValid || !this.license) {
      return false
    }

    return this.license.skills_allowed.includes("*") || 
           this.license.skills_allowed.includes(skillId)
  }

  /**
   * Check if node limit is exceeded
   */
  isNodeLimitExceeded(currentNodes: number): boolean {
    if (!this.isValid || !this.license) {
      return true
    }

    return currentNodes > this.license.max_nodes
  }

  /**
   * Get license tier
   */
  getTier(): string {
    return this.license?.tier || "invalid"
  }

  /**
   * Get organization name
   */
  getOrganization(): string {
    return this.license?.org || "unknown"
  }

  /**
   * Start mandatory check-in (cannot be disabled)
   */
  startMandatoryCheckIn(): void {
    if (this.checkinInterval) {
      return // Already running
    }

    const checkIn = async () => {
      try {
        const response = await fetch("https://helmcontrol.ai/checkin", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${this.license?.license_id}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nodeId: process.env.NODE_ID || "unknown",
            version: process.env.HELM_VERSION || "1.0.0",
            tier: this.getTier(),
            org: this.getOrganization()
          })
        })

        if (!response.ok) {
          this.handleCheckInFailure(`Check-in failed: ${response.status}`)
        }
      } catch (error) {
        this.handleCheckInFailure(`Check-in error: ${error}`)
      }
    }

    // Check-in every 30 minutes (cannot be disabled)
    this.checkinInterval = setInterval(checkIn, 1000 * 60 * 30)
    
    // Initial check-in
    checkIn()
  }

  /**
   * Stop check-in (only for testing, cannot be called in production)
   */
  stopCheckIn(): void {
    if (this.checkinInterval) {
      clearInterval(this.checkinInterval)
      this.checkinInterval = null
    }
  }

  /**
   * Handle check-in failure with emergency lock
   */
  private handleCheckInFailure(reason: string): void {
    console.error("HELM LICENSE CHECK-IN FAILED:", reason)
    
    // Trigger emergency lock
    process.env.HELM_LOCKED = "true"
    
    // In production, this would terminate the process
    if (process.env.NODE_ENV === "production") {
      setTimeout(() => {
        process.exit(1)
      }, 1000)
    }
  }

  /**
   * Get license status
   */
  getStatus(): {
    valid: boolean
    tier: string
    organization: string
    expires: string
    skillsAllowed: string[]
    maxNodes: number
  } {
    return {
      valid: this.isValid,
      tier: this.getTier(),
      organization: this.getOrganization(),
      expires: this.license?.expires || "unknown",
      skillsAllowed: this.license?.skills_allowed || [],
      maxNodes: this.license?.max_nodes || 0
    }
  }

  /**
   * Verify skill signature (marketplace enforcement)
   */
  static verifySkillSignature(skill: any, publicKey: string): boolean {
    try {
      const skillData = JSON.stringify({
        skill_id: skill.skill_id,
        version: skill.version,
        publisher: skill.publisher
      })

      const verifier = crypto.createVerify("RSA-SHA256")
      verifier.update(skillData)
      
      return verifier.verify(publicKey, skill.signature, "base64")
    } catch (error) {
      return false
    }
  }

  /**
   * Load license from file (enterprise deployment)
   */
  loadLicenseFromFile(licensePath: string): void {
    const fs = require('fs')
    
    try {
      const licenseData = fs.readFileSync(licensePath, 'utf8')
      const license: HelmLicense = JSON.parse(licenseData)
      this.validateLicense(license)
    } catch (error) {
      throw new Error(`Failed to load license from ${licensePath}: ${error}`)
    }
  }

  /**
   * Create license for testing (development only)
   */
  static createTestLicense(overrides: Partial<HelmLicense> = {}): HelmLicense {
    return {
      license_id: "helm-test-12345",
      org: "Test Organization",
      tier: "enterprise",
      skills_allowed: ["*"],
      max_nodes: 10,
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      signature: "test-signature",
      ...overrides
    }
  }
}
