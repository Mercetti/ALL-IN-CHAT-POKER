/**
 * Configuration validation utilities
 * Validates required and optional configuration values
 */

const config = require('./config');
const Logger = require('./logger');

const logger = new Logger('config.validate');
const SHOULD_LOG =
  (process.env.NODE_ENV || 'development') !== 'test'
  || (process.env.SUPPRESS_CONFIG_LOGS || '').toLowerCase() === 'false';

function validateConfig() {
  const errors = [];
  const warnings = [];

  // Required security configs in production
  if (config.IS_PRODUCTION) {
    const productionIssues = [];
    if (!config.JWT_SECRET || config.JWT_SECRET === 'your-secret-key-change-in-production') {
      productionIssues.push('JWT_SECRET must be set to a secure value in production');
    }
    if (!config.ADMIN_PASSWORD || config.ADMIN_PASSWORD === 'admin123') {
      productionIssues.push('ADMIN_PASSWORD must be set to a secure value in production');
    }
    if (productionIssues.length) {
      errors.push(...productionIssues);
    }
  }

  // Optional but recommended configs
  if (!config.TWITCH_CLIENT_ID && !config.IS_PRODUCTION) {
    warnings.push('TWITCH_CLIENT_ID not set - Twitch integration will be disabled');
  }
  if (!config.TWITCH_CLIENT_SECRET && !config.IS_PRODUCTION) {
    warnings.push('TWITCH_CLIENT_SECRET not set - Twitch integration will be disabled');
  }
  if (!config.OPENAI_API_KEY && !config.IS_PRODUCTION) {
    warnings.push('OPENAI_API_KEY not set - AI features will be disabled');
  }

  // Port validation
  if (!Number.isInteger(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    errors.push('PORT must be an integer between 1 and 65535');
  }

  // Database file validation
  if (!config.DB_FILE || typeof config.DB_FILE !== 'string') {
    errors.push('DB_FILE must be a valid file path string');
  }

  // JWT TTL validation
  if (config.USER_JWT_TTL_SECONDS && (!Number.isInteger(config.USER_JWT_TTL_SECONDS) || config.USER_JWT_TTL_SECONDS < 1)) {
    errors.push('USER_JWT_TTL_SECONDS must be a positive integer');
  }
  if (config.EPHEMERAL_TOKEN_TTL_SECONDS && (!Number.isInteger(config.EPHEMERAL_TOKEN_TTL_SECONDS) || config.EPHEMERAL_TOKEN_TTL_SECONDS < 1)) {
    errors.push('EPHEMERAL_TOKEN_TTL_SECONDS must be a positive integer');
  }

  // Log results
  if (errors.length > 0) {
    if (SHOULD_LOG) logger.error('Configuration validation failed', { errors });
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }

  if (warnings.length > 0 && SHOULD_LOG) {
    logger.warn('Configuration validation warnings', { warnings });
  }

  if (SHOULD_LOG) {
    logger.info('Configuration validation passed', {
      port: config.PORT,
      environment: config.NODE_ENV,
      production: config.IS_PRODUCTION,
      features: {
        twitch: !!(config.TWITCH_CLIENT_ID && config.TWITCH_CLIENT_SECRET),
        ai: !!(config.OPENAI_API_KEY || config.AI_PROVIDER === 'ollama'),
      },
    });
  }

  return {
    valid: true,
    errors,
    warnings,
  };
}

module.exports = {
  validateConfig,
};
