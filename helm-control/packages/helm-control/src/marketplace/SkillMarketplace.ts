/**
 * Skill Marketplace - Skill Registry and Validation
 * Manages skill submission, validation, and signature enforcement
 */

import crypto from 'crypto'
import { HelmSkillManifest, SkillManifestValidator } from './SkillManifest'

export interface MarketplaceConfig {
  publicKey: string
  privateKey?: string
  validationRules: {
    maxMemoryPerSkill: number
    maxCpuPerSkill: number
    maxExecutionTime: number
    allowedCategories: string[]
    requiredPermissions: string[]
  }
}

export interface SkillSubmission {
  manifest: HelmSkillManifest
  code: string
  documentation: string
  tests: string
  submitted_by: string
  submitted_at: string
}

export class SkillMarketplace {
  private config: MarketplaceConfig
  private skills: Map<string, HelmSkillManifest> = new Map()
  private submissions: Map<string, SkillSubmission> = new Map()

  constructor(config: MarketplaceConfig) {
    this.config = config
  }

  /**
   * Submit skill for marketplace review
   */
  async submitSkill(submission: SkillSubmission): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    // Validate manifest
    const manifestValidation = SkillManifestValidator.validateManifest(submission.manifest)
    if (!manifestValidation.valid) {
      errors.push(...manifestValidation.errors)
    }

    // Validate category
    if (!this.config.validationRules.allowedCategories.includes(submission.manifest.category)) {
      errors.push(`Category '${submission.manifest.category}' is not allowed`)
    }

    // Validate resource limits
    if (submission.manifest.resource_limits.max_memory > this.config.validationRules.maxMemoryPerSkill) {
      errors.push(`Memory limit exceeds maximum allowed`)
    }

    if (submission.manifest.resource_limits.max_cpu > this.config.validationRules.maxCpuPerSkill) {
      errors.push(`CPU limit exceeds maximum allowed`)
    }

    if (submission.manifest.resource_limits.max_execution_time > this.config.validationRules.maxExecutionTime) {
      errors.push(`Execution time exceeds maximum allowed`)
    }

    // Validate required permissions
    const requiredPerms = this.config.validationRules.requiredPermissions
    const skillPerms = submission.manifest.permissions_required.map(p => p.id)
    const hasRequiredPerms = requiredPerms.every(perm => skillPerms.includes(perm))
    if (!hasRequiredPerms) {
      errors.push(`Missing required permissions: ${requiredPerms.filter(p => !skillPerms.includes(p)).join(', ')}`)
    }

    // Check for duplicate skill ID
    if (this.skills.has(submission.manifest.skill_id)) {
      errors.push(`Skill ID '${submission.manifest.skill_id}' already exists`)
    }

    if (errors.length > 0) {
      return { success: false, errors }
    }

    // Store submission for review
    const submissionId = `${submission.manifest.skill_id}-${Date.now()}`
    this.submissions.set(submissionId, submission)

    return { success: true, errors: [] }
  }

  /**
   * Approve and publish skill
   */
  async approveSkill(submissionId: string): Promise<HelmSkillManifest> {
    const submission = this.submissions.get(submissionId)
    if (!submission) {
      throw new Error('Submission not found')
    }

    // Sign the manifest
    const signedManifest = this.signManifest(submission.manifest)

    // Add to marketplace
    this.skills.set(signedManifest.skill_id, signedManifest)

    // Remove from submissions
    this.submissions.delete(submissionId)

    return signedManifest
  }

  /**
   * Reject skill submission
   */
  rejectSkill(submissionId: string, reason: string): void {
    if (!this.submissions.has(submissionId)) {
      throw new Error('Submission not found')
    }

    this.submissions.delete(submissionId)
    console.log(`Skill submission ${submissionId} rejected: ${reason}`)
  }

  /**
   * Get skill manifest
   */
  getSkill(skillId: string): HelmSkillManifest | undefined {
    return this.skills.get(skillId)
  }

  /**
   * List all published skills
   */
  listSkills(filter?: {
    category?: string
    tier?: string
    publisher?: string
  }): HelmSkillManifest[] {
    let skills = Array.from(this.skills.values())

    if (filter) {
      if (filter.category) {
        skills = skills.filter(skill => skill.category === filter.category)
      }
      if (filter.tier) {
        skills = skills.filter(skill => skill.tier_required === filter.tier)
      }
      if (filter.publisher) {
        skills = skills.filter(skill => skill.publisher === filter.publisher)
      }
    }

    return skills
  }

  /**
   * Verify skill signature before loading
   */
  verifySkillSignature(skill: HelmSkillManifest): boolean {
    try {
      const verificationData = JSON.stringify({
        skill_id: skill.skill_id,
        version: skill.version,
        publisher: skill.publisher,
        permissions_required: skill.permissions_required,
        tier_required: skill.tier_required,
        execution_mode: skill.execution_mode,
        resource_limits: skill.resource_limits
      })

      const verifier = crypto.createVerify('RSA-SHA256')
      verifier.update(verificationData)
      
      return verifier.verify(this.config.publicKey, skill.signature, 'base64')
    } catch (error) {
      return false
    }
  }

  /**
   * Load skill with signature verification
   */
  loadSkill(skillId: string): HelmSkillManifest | null {
    const skill = this.skills.get(skillId)
    if (!skill) {
      return null
    }

    if (!this.verifySkillSignature(skill)) {
      throw new Error(`Untrusted Helm skill blocked: ${skillId}`)
    }

    return skill
  }

  /**
   * Sign skill manifest
   */
  private signManifest(manifest: HelmSkillManifest): HelmSkillManifest {
    if (!this.config.privateKey) {
      throw new Error('Private key required for signing manifests')
    }

    const signingData = JSON.stringify({
      skill_id: manifest.skill_id,
      version: manifest.version,
      publisher: manifest.publisher,
      permissions_required: manifest.permissions_required,
      tier_required: manifest.tier_required,
      execution_mode: manifest.execution_mode,
      resource_limits: manifest.resource_limits
    })

    const signer = crypto.createSign('RSA-SHA256')
    signer.update(signingData)
    const signature = signer.sign(this.config.privateKey, 'base64')

    return {
      ...manifest,
      signature,
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Get pending submissions
   */
  getPendingSubmissions(): SkillSubmission[] {
    return Array.from(this.submissions.values())
  }

  /**
   * Get marketplace statistics
   */
  getStatistics(): {
    totalSkills: number
    pendingSubmissions: number
    skillsByCategory: Record<string, number>
    skillsByTier: Record<string, number>
    topPublishers: Array<{ publisher: string; count: number }>
  } {
    const skills = Array.from(this.skills.values())
    const submissions = Array.from(this.submissions.values())

    const skillsByCategory: Record<string, number> = {}
    const skillsByTier: Record<string, number> = {}
    const publisherCount: Record<string, number> = {}

    skills.forEach(skill => {
      skillsByCategory[skill.category] = (skillsByCategory[skill.category] || 0) + 1
      skillsByTier[skill.tier_required] = (skillsByTier[skill.tier_required] || 0) + 1
      publisherCount[skill.publisher] = (publisherCount[skill.publisher] || 0) + 1
    })

    const topPublishers = Object.entries(publisherCount)
      .map(([publisher, count]) => ({ publisher, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalSkills: skills.length,
      pendingSubmissions: submissions.length,
      skillsByCategory,
      skillsByTier,
      topPublishers
    }
  }

  /**
   * Create marketplace for testing
   */
  static createTestMarketplace(): SkillMarketplace {
    const testConfig: MarketplaceConfig = {
      publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA12345678901234567890
12345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9wIDAQAB
-----END PUBLIC KEY-----`,
      privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1234567890123456
7890123456789012345678901234567890123456789012345678901234567890123456
7890123456789012345678901234567890123456789012345678901234567890123456789
0123456789012345678901234567890123456789012345678901234567890123456789012
3456789012345678901234567890123456789012345678901234567890123456789012345
6789012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678901
2345678901234567890123456789012345678901234567890123456789012345678901234
56789wIDAQABAoIBAQC1234567890123456789012345678901234567890123456789012
3456789012345678901234567890123456789012345678901234567890123456789012345
6789012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678901
2345678901234567890123456789012345678901234567890123456789012345678901234567
8901234567890123456789012345678901234567890123456789012345678901234567890123
456789012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678901234
56789AoGBAP1234567890123456789012345678901234567890123456789012345678901
2345678901234567890123456789012345678901234567890123456789012345678901234567
8901234567890123456789012345678901234567890123456789012345678901234567890123
4567890123456789012345678901234567890123456789012345678901234567890123456789
0123456789012345678901234567890123456789012345678901234567890123456789012345
6789012345678901234567890123456789012345678901234567890123456789012345678901
23456789AoGBAP1234567890123456789012345678901234567890123456789012345678901
2345678901234567890123456789012345678901234567890123456789012345678901234567
8901234567890123456789012345678901234567890123456789012345678901234567890123
4567890123456789012345678901234567890123456789012345678901234567890123456789
0123456789012345678901234567890123456789012345678901234567890123456789012345
6789012345678901234567890123456789012345678901234567890123456789012345678901
23456789AoGAP1234567890123456789012345678901234567890123456789012345678901
2345678901234567890123456789012345678901234567890123456789012345678901234567
8901234567890123456789012345678901234567890123456789012345678901234567890123
4567890123456789012345678901234567890123456789012345678901234567890123456789
0123456789012345678901234567890123456789012345678901234567890123456789012345
6789012345678901234567890123456789012345678901234567890123456789012345678901
23456789CgYAP1234567890123456789012345678901234567890123456789012345678901
2345678901234567890123456789012345678901234567890123456789012345678901234567
8901234567890123456789012345678901234567890123456789012345678901234567890123
4567890123456789012345678901234567890123456789012345678901234567890123456789
0123456789012345678901234567890123456789012345678901234567890123456789012345
6789012345678901234567890123456789012345678901234567890123456789012345678901
23456789
-----END PRIVATE KEY-----`,
      validationRules: {
        maxMemoryPerSkill: 512 * 1024 * 1024, // 512MB
        maxCpuPerSkill: 80, // 80%
        maxExecutionTime: 60000, // 1 minute
        allowedCategories: ['utility', 'gaming', 'analytics', 'monitoring', 'communication'],
        requiredPermissions: ['basic.read']
      }
    }

    return new SkillMarketplace(testConfig)
  }
}
