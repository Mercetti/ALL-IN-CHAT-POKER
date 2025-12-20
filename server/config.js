/**
 * Centralized configuration module
 * All environment variables and constants in one place
 */

module.exports = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: (process.env.NODE_ENV || 'development') === 'production',

  // Database
  DB_FILE: process.env.DB_FILE || './data/data.db',

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || '',
  ADMIN_ALLOW_LOGINS: process.env.ADMIN_ALLOW_LOGINS || 'mercetti,allinchatpokerbot',

  // JWT
  ADMIN_JWT_TTL_SECONDS: 60 * 60, // 1 hour

  // Rate limiting
  ADMIN_LOGIN_MAX_ATTEMPTS: 5,
  ADMIN_LOGIN_ATTEMPT_WINDOW_SECONDS: 15 * 60, // 15 minutes
  ADMIN_LOGIN_BASE_PENALTY_SECONDS: 30, // Base penalty for exponential backoff
  ADMIN_LOGIN_COOLDOWN_SECONDS: 60, // Initial cooldown

  // Redis (optional)
  REDIS_URL: process.env.REDIS_URL || '',

  // Game mode
  GAME_MODE: process.env.GAME_MODE || 'blackjack', // locked to blackjack for now
  STREAMER_LOGIN: process.env.STREAMER_LOGIN || 'streamer',

  // Twitch
  TWITCH_CHANNEL: process.env.TWITCH_CHANNEL || '',
  TWITCH_BOT_USERNAME: process.env.TWITCH_BOT_USERNAME || 'bot',
  TWITCH_OAUTH_TOKEN: process.env.TWITCH_OAUTH_TOKEN || '',
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID || '',
  TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET || '',
  BOT_JOIN_SECRET: process.env.BOT_JOIN_SECRET || '', // optional secret for chat-based join
  BOT_ADMIN_LOGIN: process.env.BOT_ADMIN_LOGIN || 'allinchatpokerbot',
  TWITCH_REDIRECT_URI: process.env.TWITCH_REDIRECT_URI || '',

  // Game settings
  GAME_STARTING_CHIPS: 1000,
  GAME_MIN_BET: 10,
  GAME_MAX_BET: 1000,
  GAME_HAND_EVALUATION_TIMEOUT_MS: 5000,

  // Betting
  BETTING_PHASE_DURATION_MS: 30000, // 30 seconds for betting
  VOTING_PHASE_DURATION_MS: 20000, // 20 seconds for voting on draw

  // Blackjack phases (ms)
  BJ_BETTING_DURATION_MS: parseInt(process.env.BJ_BETTING_DURATION_MS || '20000', 10),
  BJ_ACTION_DURATION_MS: parseInt(process.env.BJ_ACTION_DURATION_MS || '20000', 10),
  BJ_SETTLE_DELAY_MS: parseInt(process.env.BJ_SETTLE_DELAY_MS || '2000', 10),
  POKER_ACTION_DURATION_MS: parseInt(process.env.POKER_ACTION_DURATION_MS || '20000', 10),
  BJ_TIMER_MIN_PCT: parseFloat(process.env.BJ_TIMER_MIN_PCT || '0.7'),
  BJ_TIMER_MAX_PCT: parseFloat(process.env.BJ_TIMER_MAX_PCT || '1.2'),
  BJ_TIMER_MIN_MS: parseInt(process.env.BJ_TIMER_MIN_MS || '8000', 10),
  BJ_TIMER_MAX_MS: parseInt(process.env.BJ_TIMER_MAX_MS || '35000', 10),
  BJ_TIMEOUT_WINDOW: parseInt(process.env.BJ_TIMEOUT_WINDOW || '5', 10),
  BJ_TIMEOUT_THRESHOLD: parseInt(process.env.BJ_TIMEOUT_THRESHOLD || '2', 10),
  BJ_NEW_PLAYER_ROUNDS: parseInt(process.env.BJ_NEW_PLAYER_ROUNDS || '3', 10),
  TILT_BET_WARN_RATIO: parseFloat(process.env.TILT_BET_WARN_RATIO || '0.4'),
  TILT_BET_CLAMP_RATIO: parseFloat(process.env.TILT_BET_CLAMP_RATIO || '0.6'),
  STREAK_WINDOW: parseInt(process.env.STREAK_WINDOW || '5', 10),
  POT_GLOW_MULTIPLIER: parseInt(process.env.POT_GLOW_MULTIPLIER || '5', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // PayPal
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || '',
  PAYPAL_ENV: (process.env.PAYPAL_ENV || 'sandbox').toLowerCase(),
  
  // Ephemeral tokens
  EPHEMERAL_TOKEN_TTL_SECONDS: parseInt(process.env.EPHEMERAL_TOKEN_TTL_SECONDS || '300', 10),
  USER_JWT_TTL_SECONDS: parseInt(process.env.USER_JWT_TTL_SECONDS || `${60 * 60 * 24 * 7}`, 10), // 7 days

  // Shutdown
  SHUTDOWN_FORCE_TIMEOUT_MS: parseInt(process.env.SHUTDOWN_FORCE_TIMEOUT_MS || '10000', 10),

  // Multi-tenant (feature-flagged)
  MULTITENANT_ENABLED: (process.env.MULTITENANT_ENABLED || 'false').toLowerCase() === 'true',

  // Knowledge ingest
  KNOWLEDGE_SOURCES: process.env.KNOWLEDGE_SOURCES || [
    'https://www.python.org',
    'https://realpython.com',
    'https://www.w3schools.com',
    'https://www.geeksforgeeks.org',
    'https://devdocs.io',
    'https://www.w3.org',
    'https://webplatform.github.io/docs',
    'https://javascript.info',
    'https://www.typescriptlang.org/docs',
    'https://www.java.com/en',
    'https://angular.dev/overview',
    'https://stackoverflow.com/questions',
    'https://react.dev/learn',
    'https://vuejs.org/guide/introduction.html',
    'https://nodejs.org/docs/latest/api/',
  ].join(','),

  // AI assistance
  AI_PROVIDER: process.env.AI_PROVIDER || 'openai',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gpt-4o-mini',
  AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS || '15000', 10),
  AI_MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '1200', 10),
  OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || '',

  // Monitoring / alerts
  MONITOR_WEBHOOK_URL: process.env.MONITOR_WEBHOOK_URL || '',
};
