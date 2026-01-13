/**
 * Discord Application Configuration
 * Production-safe configuration for Acey Discord integration
 */

const path = require('path');

// Environment validation
const requiredEnvVars = [
  'DISCORD_PUBLIC_KEY',
  'DISCORD_CLIENT_ID', 
  'DISCORD_CLIENT_SECRET',
  'DISCORD_REDIRECT_URI',
  'APP_BASE_URL'
];

function validateEnvironment() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required Discord environment variables: ${missing.join(', ')}`);
  }
}

// Main configuration object
const discordConfig = {
  // Discord Application Credentials
  publicKey: process.env.DISCORD_PUBLIC_KEY,
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri: process.env.DISCORD_REDIRECT_URI,
  
  // Application URLs
  baseUrl: process.env.APP_BASE_URL,
  
  // OAuth Configuration
  oauth: {
    scopes: ['identify', 'role_connections.write'],
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userUrl: 'https://discord.com/api/users/@me'
  },
  
  // API Endpoints
  endpoints: {
    interactions: '/api/interactions',
    verifyUser: '/verify-user',
    terms: '/terms',
    privacy: '/privacy',
    authDiscord: '/auth/discord',
    authCallback: '/auth/discord/callback'
  },
  
  // Database
  database: {
    path: process.env.DISCORD_DB_PATH || path.join(__dirname, '../../data/discord.db')
  },
  
  // Security
  security: {
    sessionSecret: process.env.SESSION_SECRET,
    jwtSecret: process.env.JWT_SECRET,
    interactionTimeout: 3000, // 3 seconds
    rateLimitWindow: 60000, // 1 minute
    rateLimitMax: 100 // 100 requests per minute
  },
  
  // Compliance Flags (READ-ONLY)
  compliance: {
    noRealMoney: process.env.DISCORD_COMPLIANCE_NO_REAL_MONEY !== 'false',
    entertainmentOnly: process.env.DISCORD_COMPLIANCE_ENTERTAINMENT_ONLY !== 'false',
    aiNonAuthority: process.env.DISCORD_COMPLIANCE_AI_NON_AUTHORITY !== 'false',
    noGamblingTerms: process.env.DISCORD_COMPLIANCE_NO_GAMBLING_TERMS !== 'false'
  }
};

// Validate configuration on load
if (process.env.NODE_ENV !== 'test') {
  try {
    validateEnvironment();
    console.log('✅ Discord configuration validated');
  } catch (error) {
    console.error('❌ Discord configuration error:', error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

module.exports = discordConfig;
