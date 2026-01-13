/**
 * Discord OAuth Authentication Routes
 * Handles Discord OAuth flow for linked roles
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

/**
 * Create Discord OAuth router
 * @param {object} config - Discord configuration
 * @param {object} storage - Discord storage instance
 * @returns {Function} Express router with OAuth routes
 */
function createDiscordOAuthRouter(config, storage) {
  const router = require('express').Router();

  // OAuth login redirect
  router.get('/auth/discord', (req, res) => {
    try {
      // Generate state parameter for security
      const state = crypto.randomBytes(16).toString('hex');
      
      // Store state in session (simplified - in production use proper session storage)
      req.session = req.session || {};
      req.session.oauth_state = state;

      // Build authorization URL
      const authUrl = new URL(config.oauth.authUrl);
      authUrl.searchParams.set('client_id', config.clientId);
      authUrl.searchParams.set('redirect_uri', config.redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', config.oauth.scopes.join(' '));
      authUrl.searchParams.set('state', state);

      res.redirect(authUrl.toString());
    } catch (error) {
      console.error('❌ OAuth redirect error:', error);
      res.status(500).send('Authentication error');
    }
  });

  // OAuth callback handler
  router.get('/auth/discord/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      const storedState = req.session?.oauth_state;

      // Validate state parameter
      if (!state || state !== storedState) {
        console.warn('⚠️ OAuth state mismatch');
        return res.status(400).send('Invalid state parameter');
      }

      // Clear state from session
      if (req.session) {
        delete req.session.oauth_state;
      }

      // Exchange code for access token
      const tokenResponse = await fetch(config.oauth.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: config.redirectUri
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();

      // Fetch user information
      const userResponse = await fetch(config.oauth.userUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error(`User fetch failed: ${userResponse.statusText}`);
      }

      const userData = await userResponse.json();

      // Store user in database
      storage.upsertUser(userData.id, userData.username);
      storage.storeOAuthTokens(
        userData.id,
        tokenData.access_token,
        tokenData.refresh_token,
        tokenData.expires_in
      );

      console.log(`✅ Discord user authenticated: ${userData.username} (${userData.id})`);

      // Redirect to success page
      res.redirect(`${config.baseUrl}/discord-auth-success`);

    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  return router;
}

module.exports = { createDiscordOAuthRouter };
