/**
 * Environment Configuration
 * Centralized environment variable management with validation
 */

const { validateEnv } = require('../env-schema');
const logger = require('../logger');

let envConfig = null;

/**
 * Get validated environment configuration
 * @returns {Object} Validated environment variables
 */
function getEnvConfig() {
  if (!envConfig) {
    try {
      envConfig = validateEnv();
      logger.info('Environment configuration loaded successfully', {
        nodeEnv: envConfig.NODE_ENV,
        port: envConfig.PORT,
        host: envConfig.HOST
      });
    } catch (error) {
      logger.error('Failed to load environment configuration', { error: error.message });
      throw error;
    }
  }
  return envConfig;
}

/**
 * Reload environment configuration
 * @returns {Object} Freshly validated environment variables
 */
function reloadEnvConfig() {
  envConfig = null;
  return getEnvConfig();
}

/**
 * Get specific environment variable
 * @param {string} key - Environment variable key
 * @returns {*} Environment variable value
 */
function getEnv(key) {
  return getEnvConfig()[key];
}

/**
 * Check if running in development mode
 * @returns {boolean} True if in development
 */
function isDevelopment() {
  return getEnvConfig().IS_DEVELOPMENT;
}

/**
 * Check if running in production mode
 * @returns {boolean} True if in production
 */
function isProduction() {
  return getEnvConfig().IS_PRODUCTION;
}

/**
 * Check if running in test mode
 * @returns {boolean} True if in test mode
 */
function isTest() {
  return getEnvConfig().IS_TEST;
}

/**
 * Get database configuration
 * @returns {Object} Database configuration
 */
function getDatabaseConfig() {
  const config = getEnvConfig();
  return {
    url: config.DATABASE_CONNECTION_STRING,
    host: config.DATABASE_HOST,
    port: config.DATABASE_PORT,
    name: config.DATABASE_NAME,
    user: config.DATABASE_USER,
    password: config.DATABASE_PASSWORD,
    ssl: config.IS_PRODUCTION ? { rejectUnauthorized: false } : false
  };
}

/**
 * Get server configuration
 * @returns {Object} Server configuration
 */
function getServerConfig() {
  const config = getEnvConfig();
  return {
    port: config.PORT,
    host: config.HOST,
    env: config.NODE_ENV,
    url: config.SERVER_URL
  };
}

/**
 * Get security configuration
 * @returns {Object} Security configuration
 */
function getSecurityConfig() {
  const config = getEnvConfig();
  return {
    jwtSecret: config.JWT_SECRET,
    sessionSecret: config.SESSION_SECRET,
    bcryptRounds: config.BCRYPT_ROUNDS,
    corsOrigin: config.CORS_ORIGINS,
    corsCredentials: config.CORS_CREDENTIALS
  };
}

/**
 * Get logging configuration
 * @returns {Object} Logging configuration
 */
function getLoggingConfig() {
  const config = getEnvConfig();
  return {
    level: config.LOG_LEVEL,
    file: config.LOG_FILE,
    enablePerformanceMonitoring: config.ENABLE_PERFORMANCE_MONITORING,
    enableMetrics: config.ENABLE_METRICS
  };
}

/**
 * Get rate limiting configuration
 * @returns {Object} Rate limiting configuration
 */
function getRateLimitConfig() {
  return getEnvConfig().RATE_LIMIT_CONFIG;
}

/**
 * Get feature flags
 * @returns {Object} Feature flags
 */
function getFeatureFlags() {
  const config = getEnvConfig();
  return {
    audioSystem: config.ENABLE_AUDIO_SYSTEM,
    aiFeatures: config.ENABLE_AI_FEATURES,
    websocket: config.ENABLE_WEBSOCKET,
    swagger: config.ENABLE_SWAGGER,
    debugRoutes: config.ENABLE_DEBUG_ROUTES
  };
}

/**
 * Get external service configuration
 * @returns {Object} External service configuration
 */
function getExternalServicesConfig() {
  const config = getEnvConfig();
  return {
    twitch: {
      clientId: config.TWITCH_CLIENT_ID,
      clientSecret: config.TWITCH_CLIENT_SECRET
    },
    openai: {
      apiKey: config.OPENAI_API_KEY
    },
    redis: {
      url: config.REDIS_URL,
      ttl: config.CACHE_TTL
    }
  };
}

/**
 * Get file upload configuration
 * @returns {Object} File upload configuration
 */
function getFileUploadConfig() {
  const config = getEnvConfig();
  return {
    maxFileSize: config.MAX_FILE_SIZE_BYTES,
    uploadDir: config.UPLOAD_DIR
  };
}

/**
 * Get health check configuration
 * @returns {Object} Health check configuration
 */
function getHealthCheckConfig() {
  const config = getEnvConfig();
  return {
    interval: config.HEALTH_CHECK_INTERVAL,
    metricsPort: config.METRICS_PORT
  };
}

/**
 * Get backup configuration
 * @returns {Object} Backup configuration
 */
function getBackupConfig() {
  const config = getEnvConfig();
  return {
    enabled: config.ENABLE_AUTO_BACKUP,
    intervalHours: config.BACKUP_INTERVAL_HOURS,
    retentionDays: config.BACKUP_RETENTION_DAYS
  };
}

/**
 * Validate critical environment variables on startup
 * @returns {boolean} True if all critical variables are valid
 */
function validateCriticalEnvVars() {
  const config = getEnvConfig();
  const criticalVars = ['NODE_ENV', 'PORT', 'HOST'];
  const missing = criticalVars.filter(varName => !config[varName]);
  
  if (missing.length > 0) {
    logger.error('Critical environment variables missing', { missing });
    return false;
  }
  
  // Validate production-specific requirements
  if (config.IS_PRODUCTION) {
    const productionRequired = ['JWT_SECRET', 'SESSION_SECRET'];
    const missingProduction = productionRequired.filter(varName => !config[varName]);
    
    // Only require DATABASE_PASSWORD if using PostgreSQL
    if (config.DATABASE_URL && config.DATABASE_URL.startsWith('postgresql:')) {
      productionRequired.push('DATABASE_PASSWORD');
    }
    
    if (missingProduction.length > 0) {
      logger.error('Production environment variables missing', { missing: missingProduction });
      return false;
    }
  }
  
  return true;
}

module.exports = {
  getEnvConfig,
  reloadEnvConfig,
  getEnv,
  isDevelopment,
  isProduction,
  isTest,
  getDatabaseConfig,
  getServerConfig,
  getSecurityConfig,
  getLoggingConfig,
  getRateLimitConfig,
  getFeatureFlags,
  getExternalServicesConfig,
  getFileUploadConfig,
  getHealthCheckConfig,
  getBackupConfig,
  validateCriticalEnvVars
};
