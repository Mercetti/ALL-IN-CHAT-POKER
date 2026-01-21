/**
 * Skill Manifest - Marketplace Skill Metadata
 * Defines skill structure for marketplace validation and signing
 */

export interface Permission {
  id: string
  name: string
  description: string
  risk_level: "low" | "medium" | "high"
  required_tier: "free" | "pro" | "enterprise"
}

export interface HelmSkillManifest {
  skill_id: string
  version: string
  publisher: string
  permissions_required: Permission[]
  tier_required: "free" | "pro" | "enterprise"
  execution_mode: "read" | "write" | "deploy"
  description: string
  category: string
  tags: string[]
  resource_limits: {
    max_memory: number
    max_cpu: number
    max_execution_time: number
  }
  dependencies: string[]
  signature: string
  created_at: string
  updated_at: string
}

export class SkillManifestValidator {
  /**
   * Validate skill manifest structure
   */
  static validateManifest(manifest: HelmSkillManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!manifest.skill_id || typeof manifest.skill_id !== 'string') {
      errors.push('skill_id is required and must be a string')
    }

    if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      errors.push('version is required and must be in format x.y.z')
    }

    if (!manifest.publisher || typeof manifest.publisher !== 'string') {
      errors.push('publisher is required and must be a string')
    }

    if (!manifest.description || typeof manifest.description !== 'string') {
      errors.push('description is required and must be a string')
    }

    if (!manifest.category || typeof manifest.category !== 'string') {
      errors.push('category is required and must be a string')
    }

    if (!Array.isArray(manifest.permissions_required)) {
      errors.push('permissions_required must be an array')
    } else {
      manifest.permissions_required.forEach((perm, index) => {
        if (!perm.id || typeof perm.id !== 'string') {
          errors.push(`permissions_required[${index}].id is required`)
        }
        if (!perm.name || typeof perm.name !== 'string') {
          errors.push(`permissions_required[${index}].name is required`)
        }
        if (!['low', 'medium', 'high'].includes(perm.risk_level)) {
          errors.push(`permissions_required[${index}].risk_level must be low, medium, or high`)
        }
        if (!['free', 'pro', 'enterprise'].includes(perm.required_tier)) {
          errors.push(`permissions_required[${index}].required_tier must be free, pro, or enterprise`)
        }
      })
    }

    if (!['free', 'pro', 'enterprise'].includes(manifest.tier_required)) {
      errors.push('tier_required must be free, pro, or enterprise')
    }

    if (!['read', 'write', 'deploy'].includes(manifest.execution_mode)) {
      errors.push('execution_mode must be read, write, or deploy')
    }

    if (!Array.isArray(manifest.tags)) {
      errors.push('tags must be an array')
    }

    // Resource limits validation
    if (!manifest.resource_limits || typeof manifest.resource_limits !== 'object') {
      errors.push('resource_limits is required and must be an object')
    } else {
      if (typeof manifest.resource_limits.max_memory !== 'number' || manifest.resource_limits.max_memory <= 0) {
        errors.push('resource_limits.max_memory must be a positive number')
      }
      if (typeof manifest.resource_limits.max_cpu !== 'number' || manifest.resource_limits.max_cpu <= 0) {
        errors.push('resource_limits.max_cpu must be a positive number')
      }
      if (typeof manifest.resource_limits.max_execution_time !== 'number' || manifest.resource_limits.max_execution_time <= 0) {
        errors.push('resource_limits.max_execution_time must be a positive number')
      }
    }

    if (!Array.isArray(manifest.dependencies)) {
      errors.push('dependencies must be an array')
    }

    if (!manifest.signature || typeof manifest.signature !== 'string') {
      errors.push('signature is required and must be a string')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate skill permissions against user tier
   */
  static validatePermissions(manifest: HelmSkillManifest, userTier: string): boolean {
    // Check if user tier meets skill requirements
    const tierHierarchy = { free: 0, pro: 1, enterprise: 2 }
    const userLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0
    const requiredLevel = tierHierarchy[manifest.tier_required]

    if (userLevel < requiredLevel) {
      return false
    }

    // Check individual permissions
    return manifest.permissions_required.every(perm => {
      const permLevel = tierHierarchy[perm.required_tier]
      return userLevel >= permLevel
    })
  }

  /**
   * Check resource usage compliance
   */
  static validateResourceUsage(manifest: HelmSkillManifest, availableResources: {
    memory: number
    cpu: number
    execution_time: number
  }): boolean {
    const limits = manifest.resource_limits

    return (
      limits.max_memory <= availableResources.memory &&
      limits.max_cpu <= availableResources.cpu &&
      limits.max_execution_time <= availableResources.execution_time
    )
  }

  /**
   * Create skill manifest template
   */
  static createTemplate(overrides: Partial<HelmSkillManifest> = {}): HelmSkillManifest {
    return {
      skill_id: 'com.example.skill',
      version: '1.0.0',
      publisher: 'Example Corp',
      permissions_required: [
        {
          id: 'basic.read',
          name: 'Basic Read Access',
          description: 'Read basic system information',
          risk_level: 'low',
          required_tier: 'free'
        }
      ],
      tier_required: 'free',
      execution_mode: 'read',
      description: 'Example skill for demonstration',
      category: 'utility',
      tags: ['example', 'demo'],
      resource_limits: {
        max_memory: 128 * 1024 * 1024, // 128MB
        max_cpu: 50, // 50%
        max_execution_time: 30000 // 30 seconds
      },
      dependencies: [],
      signature: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    }
  }
}
