/**
 * Environment Variable Schema Validation
 * Validates and provides defaults for environment variables
 */

const Joi = require('joi');

// Define the schema for environment variables
const envSchema = Joi.object({
  // Server Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Application environment'),
  
  PORT: Joi.number()
    .port()
    .default(8080)
    .description('Server port'),
  
  HOST: Joi.string()
    .ip()
    .default('0.0.0.0')
    .description('Server host'),
  
  // Database Configuration
  DATABASE_URL: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: 'test',
      then: Joi.optional(),
      otherwise: Joi.string().required()
    })
    .description('Database connection URL'),
  
  DATABASE_HOST: Joi.string()
    .default('localhost')
    .description('Database host'),
  
  DATABASE_PORT: Joi.number()
    .port()
    .default(5432)
    .description('Database port'),
  
  DATABASE_NAME: Joi.string()
    .default('poker_game')
    .description('Database name'),
  
  DATABASE_USER: Joi.string()
    .default('postgres')
    .description('Database user'),
  
  DATABASE_PASSWORD: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.when('DATABASE_URL', {
        is: Joi.string().regex(/^postgresql:/),
        then: Joi.string().required(),
        otherwise: Joi.string().optional()
      }),
      otherwise: Joi.string().optional()
    })
    .description('Database password'),
  
  // Security Configuration
  JWT_SECRET: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().min(32).required(),
      otherwise: Joi.string().default('dev-secret-key-change-in-production')
    })
    .description('JWT secret key'),
  
  SESSION_SECRET: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().min(32).required(),
      otherwise: Joi.string().default('dev-session-secret-change-in-production')
    })
    .description('Session secret key'),
  
  BCRYPT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(12)
    .description('BCrypt salt rounds'),
  
  // CORS Configuration
  CORS_ORIGIN: Joi.string()
    .default('http://localhost:5173')
    .description('CORS allowed origin'),
  
  CORS_CREDENTIALS: Joi.boolean()
    .default(true)
    .description('CORS allow credentials'),
  
  // Logging Configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info')
    .description('Logging level'),
  
  LOG_FILE: Joi.string()
    .default('./logs/app.log')
    .description('Log file path'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .default(900000)
    .description('Rate limit window in milliseconds'),
  
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(1)
    .default(100)
    .description('Maximum requests per window'),
  
  // File Upload Configuration
  MAX_FILE_SIZE: Joi.string()
    .default('10mb')
    .description('Maximum file upload size'),
  
  UPLOAD_DIR: Joi.string()
    .default('./uploads')
    .description('Upload directory'),
  
  // External Services
  TWITCH_CLIENT_ID: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    })
    .description('Twitch client ID'),
  
  TWITCH_CLIENT_SECRET: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    })
    .description('Twitch client secret'),
  
  OPENAI_API_KEY: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    })
    .description('OpenAI API key'),
  
  // Cache Configuration
  REDIS_URL: Joi.string()
    .uri()
    .optional()
    .description('Redis connection URL'),
  
  CACHE_TTL: Joi.number()
    .integer()
    .min(60)
    .default(3600)
    .description('Cache TTL in seconds'),
  
  // Performance Configuration
  ENABLE_PERFORMANCE_MONITORING: Joi.boolean()
    .default(true)
    .description('Enable performance monitoring'),
  
  ENABLE_METRICS: Joi.boolean()
    .default(false)
    .description('Enable metrics collection'),
  
  // Feature Flags
  ENABLE_AUDIO_SYSTEM: Joi.boolean()
    .default(true)
    .description('Enable audio system'),
  
  ENABLE_AI_FEATURES: Joi.boolean()
    .default(true)
    .description('Enable AI features'),
  
  ENABLE_WEBSOCKET: Joi.boolean()
    .default(true)
    .description('Enable WebSocket'),
  
  // Development Configuration
  ENABLE_SWAGGER: Joi.boolean()
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    })
    .description('Enable Swagger documentation'),
  
  ENABLE_DEBUG_ROUTES: Joi.boolean()
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    })
    .description('Enable debug routes'),
  
  // Monitoring and Health
  HEALTH_CHECK_INTERVAL: Joi.number()
    .integer()
    .min(10000)
    .default(30000)
    .description('Health check interval in milliseconds'),
  
  METRICS_PORT: Joi.number()
    .port()
    .default(9090)
    .description('Metrics port'),
  
  // SSL/TLS Configuration
  SSL_CERT_PATH: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.optional(),
      otherwise: Joi.optional()
    })
    .description('SSL certificate path'),
  
  SSL_KEY_PATH: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.optional(),
      otherwise: Joi.optional()
    })
    .description('SSL key path'),
  
  // Backup Configuration
  ENABLE_AUTO_BACKUP: Joi.boolean()
    .default(false)
    .description('Enable automatic backups'),
  
  BACKUP_INTERVAL_HOURS: Joi.number()
    .integer()
    .min(1)
    .default(24)
    .description('Backup interval in hours'),
  
  BACKUP_RETENTION_DAYS: Joi.number()
    .integer()
    .min(1)
    .default(30)
    .description('Backup retention period in days')
}).unknown(true); // Allow unknown variables for flexibility

/**
 * Validate and process environment variables
 * @param {Object} env - Environment variables (defaults to process.env)
 * @returns {Object} Validated and processed environment variables
 */
function validateEnv(env = process.env) {
  const { error, value } = envSchema.validate(env, {
    stripUnknown: true,
    convert: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = `Environment variable validation failed:\n${error.details.map(detail => `  - ${detail.path.join('.')}: ${detail.message}`).join('\n')}`;
    throw new Error(errorMessage);
  }

  // Add derived values
  const validatedEnv = {
    ...value,
    // Derived values
    IS_DEVELOPMENT: value.NODE_ENV === 'development',
    IS_PRODUCTION: value.NODE_ENV === 'production',
    IS_TEST: value.NODE_ENV === 'test',
    
    // Database connection string (if not provided)
    DATABASE_CONNECTION_STRING: value.DATABASE_URL || `postgresql://${value.DATABASE_USER}:${value.DATABASE_PASSWORD || ''}@${value.DATABASE_HOST}:${value.DATABASE_PORT}/${value.DATABASE_NAME}`,
    
    // Server URL
    SERVER_URL: value.NODE_ENV === 'production' ? `https://${value.HOST}` : `http://${value.HOST}:${value.PORT}`,
    
    // CORS origins array
    CORS_ORIGINS: value.CORS_ORIGIN ? value.CORS_ORIGIN.split(',').map(origin => origin.trim()) : [],
    
    // File size in bytes
    MAX_FILE_SIZE_BYTES: parseFileSize(value.MAX_FILE_SIZE),
    
    // Rate limit configuration
    RATE_LIMIT_CONFIG: {
      windowMs: value.RATE_LIMIT_WINDOW_MS,
      max: value.RATE_LIMIT_MAX_REQUESTS,
      message: 'Too many requests from this IP, please try again later.'
    }
  };

  return validatedEnv;
}

/**
 * Parse file size string to bytes
 * @param {string} sizeStr - File size string (e.g., '10mb', '1gb')
 * @returns {number} Size in bytes
 */
function parseFileSize(sizeStr) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  if (!match) {
    throw new Error(`Invalid file size format: ${sizeStr}`);
  }
  
  const [, size, unit] = match;
  return Math.floor(parseFloat(size) * units[unit]);
}

/**
 * Get environment variable with validation
 * @param {string} key - Environment variable key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Environment variable value
 */
function getEnvVar(key, defaultValue = undefined) {
  return process.env[key] !== undefined ? process.env[key] : defaultValue;
}

/**
 * Check if required environment variables are present
 * @param {string[]} requiredVars - Array of required variable names
 * @returns {Object} Validation result
 */
function checkRequiredEnvVars(requiredVars = []) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    isValid: missing.length === 0,
    missing,
    present: requiredVars.filter(varName => process.env[varName])
  };
}

/**
 * Generate .env.example file content
 * @returns {string} .env.example content
 */
function generateEnvExample() {
  const exampleLines = [];
  
  Object.keys(envSchema.describe().keys).forEach(key => {
    const rule = envSchema.extract(key);
    const description = rule.describe().flags.description || '';
    const defaultValue = rule.describe().flags.default;
    
    exampleLines.push(`# ${description}`);
    if (defaultValue !== undefined) {
      exampleLines.push(`${key}=${defaultValue}`);
    } else {
      exampleLines.push(`${key}=`);
    }
    exampleLines.push('');
  });
  
  return exampleLines.join('\n');
}

module.exports = {
  validateEnv,
  getEnvVar,
  checkRequiredEnvVars,
  generateEnvExample,
  envSchema
};
