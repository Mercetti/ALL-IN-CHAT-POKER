/**
 * Discord System Integration
 * Main entry point for Discord Application backend
 * Integrates all Discord routes and middleware
 */

const discordConfig = require('./config/discord');
const DiscordStorage = require('./db/storage');
const { createSignatureMiddleware, rawBodyParser } = require('./utils/verifyDiscordSignature');

// Route handlers
const { createInteractionsRouter } = require('./routes/interactions');
const { createDiscordOAuthRouter } = require('./routes/auth-discord');
const { createVerifyUserRouter } = require('./routes/verify-user');
const { createTermsRouter } = require('./routes/terms');
const { createPrivacyRouter } = require('./routes/privacy');

// Initialize storage
let discordStorage;
try {
  discordStorage = new DiscordStorage(discordConfig.database.path);
} catch (error) {
  console.error('❌ Failed to initialize Discord storage:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Cleanup function for graceful shutdown
function cleanup() {
  if (discordStorage) {
    discordStorage.close();
    console.log('🧹 Discord storage closed');
  }
}

// Register cleanup on process exit
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

/**
 * Register Discord routes with Express app
 * @param {object} app - Express application instance
 */
function registerDiscordRoutes(app) {
  // Static legal routes (no auth required)
  app.get('/terms', createTermsRouter());
  app.get('/privacy', createPrivacyRouter());

  // Discord interactions endpoint with signature verification
  app.use(
    discordConfig.endpoints.interactions,
    rawBodyParser(),
    createSignatureMiddleware(discordConfig.publicKey),
    createInteractionsRouter(discordConfig)
  );

  // Discord OAuth routes (for linked roles)
  app.use('/auth/discord', createDiscordOAuthRouter(discordConfig, discordStorage));

  // Discord linked roles verification
  app.get(discordConfig.endpoints.verifyUser, createVerifyUserRouter(discordConfig, discordStorage));

  // Discord auth success page
  app.get('/discord-auth-success', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Discord Auth Success</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #4CAF50; font-size: 24px; }
        </style>
      </head>
      <body>
        <h1 class="success">✅ Discord Authentication Successful!</h1>
        <p>Your Discord account has been linked successfully.</p>
        <p>You can now close this window and return to Discord.</p>
        <script>
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
      </html>
    `);

  console.log('✅ Discord routes registered');
  console.log(`📋 Interactions: ${discordConfig.endpoints.interactions}`);
  console.log(`🔍 Verify User: ${discordConfig.endpoints.verifyUser}`);
  console.log(`📄 Terms: ${discordConfig.endpoints.terms}`);
  console.log(`🔒 Privacy: ${discordConfig.endpoints.privacy}`);
}

/**
 * Get Discord storage instance
 * @returns {DiscordStorage} Storage instance
 */
function getDiscordStorage() {
  return discordStorage;
}

/**
 * Get Discord configuration
 * @returns {object} Discord configuration
 */
function getDiscordConfig() {
  return discordConfig;
}

module.exports = {
  registerDiscordRoutes,
  getDiscordStorage,
  getDiscordConfig,
  cleanup
};
