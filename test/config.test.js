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
    const fs = require('fs');
    const path = require('path');
    
    // Temporarily rename .env file to prevent it from being loaded
    const envPath = path.resolve(__dirname, '../.env');
    const envBackupPath = path.resolve(__dirname, '../.env.backup');
    let envFileExists = false;
    
    if (fs.existsSync(envPath)) {
      fs.renameSync(envPath, envBackupPath);
      envFileExists = true;
    }
    
    // Temporarily set production mode to test validation
    const originalNodeEnv = process.env.NODE_ENV;
    const originalJwtSecret = process.env.JWT_SECRET;
    const originalAdminPassword = process.env.ADMIN_PASSWORD;
    const originalAllowInsecure = process.env.ALLOW_INSECURE_DEFAULTS;
    
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_INSECURE_DEFAULTS = 'false';
    delete process.env.JWT_SECRET;
    delete process.env.ADMIN_PASSWORD;

    try {
      // Clear all require caches to force fresh config loading
      Object.keys(require.cache).forEach(key => {
        if (key.includes('config')) {
          delete require.cache[key];
        }
      });
      
      const { validateConfig } = require('../server/config.validate');
      
      assert.throws(() => {
        validateConfig();
      }, /Configuration validation failed/);
    } finally {
      // Restore environment
      process.env.NODE_ENV = originalNodeEnv;
      process.env.ALLOW_INSECURE_DEFAULTS = originalAllowInsecure;
      if (originalJwtSecret) process.env.JWT_SECRET = originalJwtSecret;
      if (originalAdminPassword) process.env.ADMIN_PASSWORD = originalAdminPassword;
      
      // Restore .env file if it existed
      if (envFileExists) {
        fs.renameSync(envBackupPath, envPath);
      }
      
      // Clear cache again to restore original config
      Object.keys(require.cache).forEach(key => {
        if (key.includes('config')) {
          delete require.cache[key];
        }
      });
    }
  });

  it('validateConfig validates port range', () => {
    const originalPort = process.env.PORT;
    process.env.PORT = '99999'; // Invalid port > 65535

    try {
      // Clear all require caches to force fresh config loading
      Object.keys(require.cache).forEach(key => {
        if (key.includes('config')) {
          delete require.cache[key];
        }
      });
      
      const { validateConfig } = require('../server/config.validate');
      
      assert.throws(() => {
        validateConfig();
      }, /PORT must be an integer between 1 and 65535/);
    } finally {
      process.env.PORT = originalPort;
      // Clear cache again to restore original config
      Object.keys(require.cache).forEach(key => {
        if (key.includes('config')) {
          delete require.cache[key];
        }
      });
    }
  });
});
