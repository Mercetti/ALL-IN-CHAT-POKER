/**
 * Production configuration validation and management
 * Ensures all required production settings are properly configured
 * Enhanced with hardening and resilience features
 */

const crypto = require('crypto');
const config = require('./config');

class ProductionConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.requiredEnvVars = [
      'JWT_SECRET',
      'ADMIN_PASSWORD',
      'ADMIN_TOKEN',
    ];
    
    this.optionalEnvVars = [
      'TWITCH_CLIENT_ID',
      'TWITCH_CLIENT_SECRET',
      'OPENAI_API_KEY',
      'REDIS_URL',
      'LOG_LEVEL'
    ];
  }

  validate() {
    this.errors = [];
    this.warnings = [];
    
    if (config.IS_PRODUCTION) {
      this.validateProductionRequirements();
      this.validateSecuritySettings();
      this.validateDatabaseSettings();
      this.validateServiceIntegrations();
      this.validatePerformanceSettings();
    } else {
      this.validateDevelopmentSettings();
    }
    
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      environment: config.NODE_ENV,
      isProduction: config.IS_PRODUCTION
    };
  }

  validateProductionRequirements() {
    // Check required environment variables
    this.requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        this.errors.push(`${envVar} is required in production`);
      } else if (this.isWeakSecret(process.env[envVar])) {
        this.errors.push(`${envVar} appears to be using a weak/default value`);
      }
    });

    // Check for secure defaults
    if (config.ALLOW_INSECURE_DEFAULTS) {
      this.errors.push('ALLOW_INSECURE_DEFAULTS must be false in production');
    }

    // Check owner bootstrap
    if (config.ENABLE_OWNER_BOOTSTRAP) {
      this.warnings.push('ENABLE_OWNER_BOOTSTRAP should be false in production');
    }

    // Check admin login enforcement
    if (!config.ENFORCE_ADMIN_CSRF) {
      this.warnings.push('ENFORCE_ADMIN_CSRF should be true in production');
    }
  }

  validateSecuritySettings() {
    // JWT Secret validation
    if (config.JWT_SECRET) {
      if (config.JWT_SECRET.length < 32) {
        this.errors.push('JWT_SECRET must be at least 32 characters long');
      }
      
      if (config.JWT_SECRET === 'your-secret-key-change-in-production') {
        this.errors.push('JWT_SECRET is still using the default value');
      }
      
      if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/.test(config.JWT_SECRET)) {
        this.warnings.push('JWT_SECRET contains unusual characters');
      }
    }

    // Admin password validation
    if (config.ADMIN_PASSWORD) {
      if (config.ADMIN_PASSWORD.length < 12) {
        this.errors.push('ADMIN_PASSWORD must be at least 12 characters long');
      }
      
      if (config.ADMIN_PASSWORD === 'admin123') {
        this.errors.push('ADMIN_PASSWORD is still using the default value');
      }
      
      if (!this.isStrongPassword(config.ADMIN_PASSWORD)) {
        this.warnings.push('ADMIN_PASSWORD should include uppercase, lowercase, numbers, and symbols');
      }
    }

    // Admin token validation
    if (config.ADMIN_TOKEN) {
      if (config.ADMIN_TOKEN.length < 20) {
        this.warnings.push('ADMIN_TOKEN should be at least 20 characters long');
      }
    }
  }

  validateDatabaseSettings() {
    // Database file validation
    if (config.DB_FILE) {
      if (config.DB_FILE === './data/data.db') {
        this.warnings.push('Consider using an absolute path for DB_FILE in production');
      }
      
      if (!config.DB_FILE.startsWith('/')) {
        this.warnings.push('DB_FILE should use an absolute path in production');
      }
    }
  }

  validateServiceIntegrations() {
    // Optional service warnings
    this.optionalEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        this.warnings.push(`${envVar} is not set - related features will be disabled`);
      }
    });
  }

  validatePerformanceSettings() {
    // Port validation
    if (config.PORT < 1 || config.PORT > 65535) {
      this.errors.push('PORT must be between 1 and 65535');
    }
    
    if (config.PORT < 1024) {
      this.warnings.push('PORT is below 1024 - may require elevated privileges');
    }

    // Node version check
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      this.errors.push(`Node.js version ${nodeVersion} is not supported - requires 18.0.0 or higher`);
    }
  }

  validateDevelopmentSettings() {
    // Development-specific validations
    if (config.ENFORCE_ADMIN_CSRF) {
      this.warnings.push('CSRF enforcement is enabled in development - may cause testing issues');
    }
    
    if (!config.ALLOW_INSECURE_DEFAULTS) {
      this.warnings.push('Insecure defaults are disabled in development - may limit functionality');
    }
  }

  isWeakSecret(secret) {
    const weakPatterns = [
      /^(test|dev|development|default|change|your)/i,
      /^(123|password|admin|secret)/i,
      /^(abc|qwerty|letmein)/i,
      /^(a{5,}|b{5,}|c{5,})/i
    ];
    
    return weakPatterns.some(pattern => pattern.test(secret));
  }

  isStrongPassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    
    return [hasUpperCase, hasLowerCase, hasNumbers, hasNonalphas].filter(Boolean).length >= 3;
  }

  generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  generateSecurePassword(length = 16) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  printValidationReport() {
    const validation = this.validate();
    
    console.log('\n🔍 Configuration Validation Report');
    console.log('=====================================');
    console.log(`Environment: ${validation.environment}`);
    console.log(`Valid: ${validation.isValid ? '✅' : '❌'}`);
    
    if (validation.errors.length > 0) {
      console.log('\n❌ Errors:');
      validation.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      validation.warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }
    
    if (validation.isValid && validation.warnings.length === 0) {
      console.log('\n✅ Configuration is production-ready!');
    }
    
    console.log('=====================================\n');
    
    return validation;
  }

  generateProductionEnvTemplate() {
    const template = {
      JWT_SECRET: this.generateSecureSecret(),
      ADMIN_PASSWORD: this.generateSecurePassword(),
      ADMIN_TOKEN: this.generateSecureSecret(32),
      SUPABASE_URL: 'https://your-project.supabase.co',
      SUPABASE_ANON_KEY: 'your-supabase-anon-key',
      TWITCH_CLIENT_ID: 'your-twitch-client-id',
      TWITCH_CLIENT_SECRET: 'your-twitch-client-secret',
      OPENAI_API_KEY: 'your-openai-api-key',
      REDIS_URL: 'redis://localhost:6379',
      LOG_LEVEL: 'info',
      NODE_ENV: 'production',
      PORT: '3000',
      DB_FILE: '/opt/data/data.db',
      CORS_ALLOWED_ORIGINS: 'https://yourdomain.com',
      ENFORCE_ADMIN_CSRF: 'true',
      ALLOW_INSECURE_DEFAULTS: 'false',
      ENABLE_OWNER_BOOTSTRAP: 'false'
    };
    
    let envContent = '# Production Environment Variables\n';
    envContent += '# Copy this file to .env and update the values\n\n';
    
    Object.entries(template).forEach(([key, value]) => {
      envContent += `${key}=${value}\n`;
    });
    
    return envContent;
  }
}

module.exports = ProductionConfigValidator;
