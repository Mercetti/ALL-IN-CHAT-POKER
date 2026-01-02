const express = require('express');

function createPublicRouter({ config, startup, defaultChannel }) {
  const router = express.Router();

  router.get('/health', (req, res) => {
    const health = startup.getHealth();
    res.json(health);
  });

  router.get('/index.html', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.redirect(301, '/welcome.html');
  });

  router.get('/public-config.json', (req, res) => {
    const forwardedProto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const proto = forwardedProto || req.protocol || 'https';

    const redirectUriRaw = config.TWITCH_REDIRECT_URI || `${proto}://${req.get('host')}/login.html`;
    const redirectUri = (redirectUriRaw || '').trim().replace(/\\+$/, '');

    res.json({
      twitchClientId: config.TWITCH_CLIENT_ID || '',
      redirectUri,
      streamerLogin: config.STREAMER_LOGIN || '',
      botAdminLogin: config.BOT_ADMIN_LOGIN || '',
      paypalClientId: config.PAYPAL_CLIENT_ID || '',
      minBet: config.GAME_MIN_BET || 0,
      potGlowMultiplier: config.POT_GLOW_MULTIPLIER || 5,
      defaultChannel: defaultChannel,
    });
  });

  return router;
}

module.exports = {
  createPublicRouter,
};
