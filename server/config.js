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
  GAME_MODE: process.env.GAME_MODE || 'poker', // 'poker' (default) or 'blackjack' (future expansion)
  STREAMER_LOGIN: process.env.STREAMER_LOGIN || 'streamer',

  // Twitch
  TWITCH_CHANNEL: process.env.TWITCH_CHANNEL || '',
  TWITCH_BOT_USERNAME: process.env.TWITCH_BOT_USERNAME || 'bot',
  TWITCH_OAUTH_TOKEN: process.env.TWITCH_OAUTH_TOKEN || '',
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID || '',
  TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET || '',

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

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Ephemeral tokens
  EPHEMERAL_TOKEN_TTL_SECONDS: parseInt(process.env.EPHEMERAL_TOKEN_TTL_SECONDS || '300', 10),
  USER_JWT_TTL_SECONDS: parseInt(process.env.USER_JWT_TTL_SECONDS || `${60 * 60 * 24 * 7}`, 10), // 7 days

  // Shutdown
  SHUTDOWN_FORCE_TIMEOUT_MS: parseInt(process.env.SHUTDOWN_FORCE_TIMEOUT_MS || '10000', 10),
};
