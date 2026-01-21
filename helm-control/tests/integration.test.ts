/**
 * Helm Control Integration Tests
 * Tests complete SDK workflow end-to-end
 */

import { HelmClient } from '../packages/helm-control/src/client/HelmClient'
import { LicenseValidator } from '../packages/helm-control/src/license/LicenseValidator'
import { LicenseManager } from '../packages/helm-control/src/license/LicenseManager'

describe('Helm Control Integration Tests', () => {
  let helmClient: HelmClient
  let licenseValidator: LicenseValidator

  beforeAll(() => {
    // Setup test environment
    process.env.NODE_ENV = 'test'
  })

  describe('Basic SDK Workflow', () => {
    test('should initialize HelmClient with valid config', () => {
      const config = {
        apiKey: 'pk_test_12345678901234567890123456789012',
        environment: 'hosted' as const,
        telemetry: false
      }

      expect(() => {
        helmClient = new HelmClient(config)
      }).not.toThrow()

      expect(helmClient).toBeDefined()
    })

    test('should start session and send message', async () => {
      const session = helmClient.startSession({
        domain: 'test',
        userId: 'test-user'
      })

      expect(session).toBeDefined()

      const response = await session.send('Hello, test message')
      expect(response).toBeDefined()
      expect(response.response).toBe('Handled by persona + skills')

      session.end()
    })

    test('should list available skills', () => {
      const skills = helmClient.listSkills()
      expect(Array.isArray(skills)).toBe(true)
      expect(skills.length).toBeGreaterThan(0)
      
      // Check for default skills
      const skillIds = skills.map(skill => skill.id)
      expect(skillIds).toContain('basic_chat')
      expect(skillIds).toContain('poker_deal')
    })

    test('should shutdown cleanly', () => {
      expect(() => {
        helmClient.shutdown()
      }).not.toThrow()
    })
  })

  describe('License Enforcement', () => {
    const testPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA12345678901234567890
12345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9wIDAQAB
-----END PUBLIC KEY-----`

    beforeEach(() => {
      licenseValidator = new LicenseValidator(testPublicKey)
    })

    test('should validate test license', () => {
      const testLicense = LicenseValidator.createTestLicense()
      
      expect(() => {
        licenseValidator.validateLicense(testLicense)
      }).not.toThrow()
    })

    test('should reject invalid signature', () => {
      const invalidLicense = LicenseValidator.createTestLicense({
        signature: 'invalid-signature'
      })

      expect(() => {
        licenseValidator.validateLicense(invalidLicense)
      }).toThrow('Invalid Helm license signature')
    })

    test('should reject expired license', () => {
      const expiredLicense = LicenseValidator.createTestLicense({
        expires: new Date(Date.now() - 1000).toISOString()
      })

      expect(() => {
        licenseValidator.validateLicense(expiredLicense)
      }).toThrow('Helm license expired')
    })

    test('should check skill permissions', () => {
      const testLicense = LicenseValidator.createTestLicense({
        skills_allowed: ['basic_chat', 'poker_deal']
      })
      
      licenseValidator.validateLicense(testLicense)

      expect(licenseValidator.isSkillAllowed('basic_chat')).toBe(true)
      expect(licenseValidator.isSkillAllowed('poker_deal')).toBe(true)
      expect(licenseValidator.isSkillAllowed('analytics')).toBe(false)
    })

    test('should enforce node limits', () => {
      const testLicense = LicenseValidator.createTestLicense({
        max_nodes: 2
      })
      
      licenseValidator.validateLicense(testLicense)

      expect(licenseValidator.isNodeLimitExceeded(1)).toBe(false)
      expect(licenseValidator.isNodeLimitExceeded(2)).toBe(false)
      expect(licenseValidator.isNodeLimitExceeded(3)).toBe(true)
    })
  })

  describe('License Manager Integration', () => {
    test('should initialize with license object', async () => {
      const testLicense = LicenseValidator.createTestLicense()
      const licenseManager = new LicenseManager('test-key', { checkinRequired: false })

      await expect(licenseManager.initialize(testLicense)).resolves.not.toThrow()
      
      const status = licenseManager.getLicenseInfo()
      expect(status.valid).toBe(true)
      expect(status.tier).toBe('enterprise')
    })

    test('should enforce skill permissions', async () => {
      const testLicense = LicenseValidator.createTestLicense({
        skills_allowed: ['basic_chat']
      })
      const licenseManager = new LicenseManager('test-key', { checkinRequired: false })

      await licenseManager.initialize(testLicense)

      expect(licenseManager.canExecuteSkill('basic_chat')).toBe(true)
      expect(licenseManager.canExecuteSkill('analytics')).toBe(false)
    })
  })

  describe('Error Handling', () => {
    test('should handle invalid API key format', () => {
      const invalidConfig = {
        apiKey: 'invalid-key',
        environment: 'hosted' as const,
        telemetry: false
      }

      expect(() => {
        new HelmClient(invalidConfig)
      }).toThrow('Invalid API key format')
    })

    test('should handle missing environment', () => {
      const invalidConfig = {
        apiKey: 'pk_live_12345678901234567890123456789012',
        environment: undefined as any,
        telemetry: false
      }

      expect(() => {
        new HelmClient(invalidConfig)
      }).toThrow('Environment required')
    })
  })

  describe('Module Integration', () => {
    test('should integrate all modules correctly', async () => {
      const config = {
        apiKey: 'pk_test_12345678901234567890123456789012',
        environment: 'hosted' as const,
        telemetry: true
      }

      const helm = new HelmClient(config)
      const session = helm.startSession({
        domain: 'integration-test',
        userId: 'test-user-123'
      })

      // Test full workflow
      const skills = helm.listSkills()
      expect(skills.length).toBeGreaterThan(0)

      const response = await session.send('Integration test message')
      expect(response).toBeDefined()

      // Test skill execution
      const skillResponse = await session.send('!basic_chat')
      expect(skillResponse).toBeDefined()

      session.end()
      helm.shutdown()

      // Verify no errors thrown
      expect(true).toBe(true)
    })
  })
})
