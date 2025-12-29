const assert = require('assert');
const { describe, it } = require('node:test');

describe('config validation', () => {
  it('validateConfig passes with valid configuration', () => {
    const { validateConfig } = require('../server/config.validate');
    
    // This should pass with current config
    const result = validateConfig();
    assert.strictEqual(result.valid, true);
    assert.ok(Array.isArray(result.errors));
    assert.ok(Array.isArray(result.warnings));
  });

  it('validateConfig checks required production configs', () => {
    // Temporarily set production mode to test validation
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    // Clear required configs to trigger validation errors
    const originalJwtSecret = process.env.JWT_SECRET;
    const originalAdminPassword = process.env.ADMIN_PASSWORD;
    delete process.env.JWT_SECRET;
    delete process.env.ADMIN_PASSWORD;

    try {
      // Re-import to pick up new environment
      delete require.cache[require.resolve('../server/config')];
      delete require.cache[require.resolve('../server/config.validate')];
      
      const { validateConfig } = require('../server/config.validate');
      
      assert.throws(() => {
        validateConfig();
      }, /Configuration validation failed/);
    } finally {
      // Restore environment
      process.env.NODE_ENV = originalNodeEnv;
      if (originalJwtSecret) process.env.JWT_SECRET = originalJwtSecret;
      if (originalAdminPassword) process.env.ADMIN_PASSWORD = originalAdminPassword;
      
      // Clear cache again to restore original config
      delete require.cache[require.resolve('../server/config')];
      delete require.cache[require.resolve('../server/config.validate')];
    }
  });

  it('validateConfig validates port range', () => {
    const originalPort = process.env.PORT;
    process.env.PORT = '99999'; // Invalid port > 65535

    try {
      delete require.cache[require.resolve('../server/config')];
      delete require.cache[require.resolve('../server/config.validate')];
      
      const { validateConfig } = require('../server/config.validate');
      
      assert.throws(() => {
        validateConfig();
      }, /PORT must be an integer between 1 and 65535/);
    } finally {
      process.env.PORT = originalPort;
      delete require.cache[require.resolve('../server/config')];
      delete require.cache[require.resolve('../server/config.validate')];
    }
  });
});
