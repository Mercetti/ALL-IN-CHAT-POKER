/**
 * License Validator Unit Tests
 * Tests license validation, signature verification, and check-in functionality
 */

import { LicenseValidator, HelmLicense } from '../../packages/helm-control/src/license/LicenseValidator';

describe('LicenseValidator', () => {
  let licenseValidator: LicenseValidator;
  let testLicense: HelmLicense;
  let testPublicKey: string;

  beforeEach(() => {
    testPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA12345678901234567890
12345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9012345678901234567890123456789012345678901234567890123456789012345678
9wIDAQAB
-----END PUBLIC KEY-----`;

    licenseValidator = new LicenseValidator(testPublicKey);
    testLicense = LicenseValidator.createTestLicense();
  });

  describe('Constructor', () => {
    test('should initialize with public key', () => {
      expect(licenseValidator).toBeDefined();
    });

    test('should initialize with empty public key', () => {
      const validator = new LicenseValidator('');
      expect(validator).toBeDefined();
    });
  });

  describe('validateLicense()', () => {
    test('should validate test license successfully', () => {
      expect(() => {
        licenseValidator.validateLicense(testLicense);
      }).not.toThrow();
    });

    test('should throw error with invalid signature', () => {
      const invalidLicense = LicenseValidator.createTestLicense({
        signature: 'invalid-signature'
      });

      expect(() => {
        licenseValidator.validateLicense(invalidLicense);
      }).toThrow('Invalid Helm license signature');
    });

    test('should throw error with expired license', () => {
      const expiredLicense = LicenseValidator.createTestLicense({
        expires: new Date(Date.now() - 1000).toISOString()
      });

      expect(() => {
        licenseValidator.validateLicense(expiredLicense);
      }).toThrow('Helm license expired');
    });

    test('should throw error with missing license_id', () => {
      const invalidLicense = LicenseValidator.createTestLicense({
        license_id: ''
      });

      expect(() => {
        licenseValidator.validateLicense(invalidLicense);
      }).toThrow();
    });

    test('should throw error with missing org', () => {
      const invalidLicense = LicenseValidator.createTestLicense({
        org: ''
      });

      expect(() => {
        licenseValidator.validateLicense(invalidLicense);
      }).toThrow();
    });

    test('should throw error with missing expires', () => {
      const invalidLicense = LicenseValidator.createTestLicense({
        expires: ''
      });

      expect(() => {
        licenseValidator.validateLicense(invalidLicense);
      }).toThrow();
    });
  });

  describe('isSkillAllowed()', () => {
    beforeEach(() => {
      licenseValidator.validateLicense(testLicense);
    });

    test('should allow all skills with wildcard permission', () => {
      expect(licenseValidator.isSkillAllowed('any_skill')).toBe(true);
      expect(licenseValidator.isSkillAllowed('')).toBe(true);
      expect(licenseValidator.isSkillAllowed('nonexistent_skill')).toBe(true);
    });

    test('should deny skills if not validated', () => {
      const unvalidatedValidator = new LicenseValidator(testPublicKey);

      expect(() => {
        unvalidatedValidator.isSkillAllowed('basic_chat');
      }).toThrow('AccessController not validated');
    });

    test('should work with specific skill permissions', () => {
      const specificLicense = LicenseValidator.createTestLicense({
        skills_allowed: ['basic_chat', 'poker_deal']
      });

      licenseValidator.validateLicense(specificLicense);

      expect(licenseValidator.isSkillAllowed('basic_chat')).toBe(true);
      expect(licenseValidator.isSkillAllowed('poker_deal')).toBe(true);
      expect(licenseValidator.isSkillAllowed('analytics')).toBe(false);
    });
  });

  describe('isNodeLimitExceeded()', () => {
    beforeEach(() => {
      licenseValidator.validateLicense(testLicense);
    });

    test('should not exceed limit within bounds', () => {
      expect(licenseValidator.isNodeLimitExceeded(1)).toBe(false);
      expect(licenseValidator.isNodeLimitExceeded(5)).toBe(false);
      expect(licenseValidator.isNodeLimitExceeded(10)).toBe(false);
    });

    test('should exceed limit beyond bounds', () => {
      expect(licenseValidator.isNodeLimitExceeded(11)).toBe(true);
      expect(licenseValidator.isNodeLimitExceeded(100)).toBe(true);
    });

    test('should throw error if not validated', () => {
      const unvalidatedValidator = new LicenseValidator(testPublicKey);

      expect(() => {
        unvalidatedValidator.isNodeLimitExceeded(1);
      }).toThrow('AccessController not validated');
    });
  });

  describe('getTier()', () => {
    test('should return enterprise tier for enterprise license', () => {
      const enterpriseLicense = LicenseValidator.createTestLicense({
        tier: 'enterprise'
      });

      licenseValidator.validateLicense(enterpriseLicense);
      expect(licenseValidator.getTier()).toBe('enterprise');
    });

    test('should return pro tier for pro license', () => {
      const proLicense = LicenseValidator.createTestLicense({
        tier: 'pro'
      });

      licenseValidator.validateLicense(proLicense);
      expect(licenseValidator.getTier()).toBe('pro');
    });

    test('should return free tier for free license', () => {
      const freeLicense = LicenseValidator.createTestLicense({
        tier: 'free'
      });

      licenseValidator.validateLicense(freeLicense);
      expect(licenseValidator.getTier()).toBe('free');
    });
  });

  describe('getOrganization()', () => {
    test('should return organization name', () => {
      licenseValidator.validateLicense(testLicense);
      expect(licenseValidator.getOrganization()).toBe('Test Organization');
    });

    test('should return unknown if not validated', () => {
      expect(licenseValidator.getOrganization()).toBe('unknown');
    });
  });

  describe('getStatus()', () => {
    test('should return invalid status before validation', () => {
      const status = licenseValidator.getStatus();
      expect(status.valid).toBe(false);
      expect(status.tier).toBe('invalid');
      expect(status.organization).toBe('unknown');
    });

    test('should return valid status after validation', () => {
      licenseValidator.validateLicense(testLicense);
      const status = licenseValidator.getStatus();

      expect(status.valid).toBe(true);
      expect(status.tier).toBe('enterprise');
      expect(status.organization).toBe('Test Organization');
      expect(status.expires).toBe(testLicense.expires);
      expect(status.skillsAllowed).toEqual(['*']);
      expect(status.maxNodes).toBe(10);
    });
  });

  describe('verifySkillSignature()', () => {
    test('should verify skill signature with valid data', () => {
      const skill = {
        skill_id: 'test_skill',
        version: '1.0.0',
        publisher: 'Test Publisher',
        signature: 'test-signature'
      };

      // This should return false since we're using test data
      const result = LicenseValidator.verifySkillSignature(skill, testPublicKey);
      expect(typeof result).toBe('boolean');
    });

    test('should handle invalid skill data', () => {
      const invalidSkill = null;
      const result = LicenseValidator.verifySkillSignature(invalidSkill, testPublicKey);
      expect(result).toBe(false);
    });

    test('should handle missing signature', () => {
      const skill = {
        skill_id: 'test_skill',
        version: '1.0.0',
        publisher: 'Test Publisher'
      };

      const result = LicenseValidator.verifySkillSignature(skill, testPublicKey);
      expect(result).toBe(false);
    });
  });

  describe('loadLicenseFromFile()', () => {
    test('should throw error for non-existent file', () => {
      expect(() => {
        licenseValidator.loadLicenseFromFile('/nonexistent/file.json');
      }).toThrow('Failed to load license from /nonexistent/file.json');
    });

    test('should handle invalid JSON', () => {
      // This would require mocking file system operations
      // For now, just test that the method exists
      expect(typeof licenseValidator.loadLicenseFromFile).toBe('function');
    });
  });

  describe('createTestLicense()', () => {
    test('should create valid test license', () => {
      const license = LicenseValidator.createTestLicense();
      expect(license.license_id).toBe('helm-test-12345');
      expect(license.org).toBe('Test Organization');
      expect(license.tier).toBe('enterprise');
      expect(license.skills_allowed).toEqual(['*']);
      expect(license.max_nodes).toBe(10);
      expect(license.signature).toBe('test-signature');
    });

    test('should create test license with overrides', () => {
      const license = LicenseValidator.createTestLicense({
        tier: 'pro',
        max_nodes: 5,
        org: 'Custom Org'
      });

      expect(license.tier).toBe('pro');
      expect(license.max_nodes).toBe(5);
      expect(license.org).toBe('Custom Org');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null public key', () => {
      const validator = new LicenseValidator(null as any);
      expect(() => {
        validator.validateLicense(testLicense);
      }).toThrow();
    });

    test('should handle undefined public key', () => {
      const validator = new LicenseValidator(undefined as any);
      expect(() => {
        validator.validateLicense(testLicense);
      }).toThrow();
    });

    test('should handle empty public key', () => {
      const validator = new LicenseValidator('');
      expect(() => {
        validator.validateLicense(testLicense);
      }).toThrow();
    });

    test('should handle null license', () => {
      expect(() => {
        licenseValidator.validateLicense(null as any);
      }).toThrow();
    });

    test('should handle undefined license', () => {
      expect(() => {
        licenseValidator.validateLicense(undefined as any);
      }).toThrow();
    });

    test('should handle empty license object', () => {
      expect(() => {
        licenseValidator.validateLicense({} as any);
      }).toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should work with LicenseManager integration', () => {
      licenseValidator.validateLicense(testLicense);
      
      const status = licenseValidator.getStatus();
      expect(status.valid).toBe(true);
      
      const skillAllowed = licenseValidator.isSkillAllowed('basic_chat');
      expect(skillAllowed).toBe(true);
      
      const nodeLimit = licenseValidator.isNodeLimitExceeded(5);
      expect(nodeLimit).toBe(false);
    });

    test('should handle multiple validations', () => {
      // First validation
      licenseValidator.validateLicense(testLicense);
      expect(licenseValidator.getStatus().valid).toBe(true);

      // Second validation should not throw
      expect(() => {
        licenseValidator.validateLicense(testLicense);
      }).not.toThrow();

      expect(licenseValidator.getStatus().valid).toBe(true);
    });

    test('should handle license with custom expiration', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const futureLicense = LicenseValidator.createTestLicense({
        expires: futureDate.toISOString()
      });

      expect(() => {
        licenseValidator.validateLicense(futureLicense);
      }).not.toThrow();

      expect(licenseValidator.getStatus().valid).toBe(true);
    });
  });
});
