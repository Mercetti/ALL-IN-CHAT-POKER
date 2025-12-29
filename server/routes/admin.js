const path = require('path');
const { Router } = require('express');
const { getAdminSession } = require('../auth-contract');

function createAdminRouter({ auth, middleware, config, logger, rateLimit, db, tmiClient, blockedIPs, adminLoginAttempts, recentErrors, recentSlowRequests, recentSocketDisconnects, lastTmiReconnectAt, getCriticalHashes, recordLoginAttempt }) {
  const router = Router();

  // Admin-only pages
  router.get('/admin-chat.html', auth.requireAdmin, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'admin-chat.html'));
  });

  router.get('/admin-chat', auth.requireAdmin, (_req, res) => {
    res.redirect('/admin-chat.html');
  });

  router.get('/admin-code.html', auth.requireAdmin, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'admin-code.html'));
  });

  router.get('/admin-code', auth.requireAdmin, (_req, res) => {
    res.redirect('/admin-code.html');
  });

  // CSRF token
  router.get('/csrf', auth.requireAdmin, (req, res) => {
    const token = middleware.issueCsrfCookie(res, { auth, config });
    res.json({ token });
  });

  // Admin login with rate limiting
  router.post('/login', rateLimit('admin-login', 60 * 1000, 5), (req, res) => {
    try {
      const ip = req.ip;
      const { password } = req.body || {};

      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'password required' });
      }

      if (!recordLoginAttempt(ip)) {
        logger.warn('Login attempt blocked - rate limited', { ip });
        return res.status(429).json({ error: 'too many attempts, try again later' });
      }

      if (password !== config.ADMIN_PASSWORD) {
        logger.warn('Failed login attempt', { ip });
        return res.status(401).json({ error: 'invalid password' });
      }

      logger.info('Admin login successful', { ip });
      const jwtData = auth.createAdminJWT();
      const cookieOptions = auth.getAdminCookieOptions();
      const csrfToken = middleware.issueCsrfCookie(res, { auth, config });

      res.cookie('admin_jwt', jwtData.token, cookieOptions);
      res.json({
        success: true,
        token: jwtData.token,
        csrfToken,
        expiresIn: jwtData.expiresIn,
      });
    } catch (err) {
      logger.error('Error in admin login', { error: err.message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  // Admin logout
  router.post('/logout', (req, res) => {
    const cookieOptions = auth.getAdminCookieOptions();
    res.clearCookie('admin_jwt', cookieOptions);
    res.clearCookie('csrf_token', middleware.getCsrfCookieOptions({ auth, config }));
    res.json({ success: true });
  });

  // Ephemeral admin token
  router.post('/token', rateLimit('admin-token', 60 * 1000, 5), auth.requireAdmin, (req, res) => {
    const ttl = (req.body && Number(req.body.ttl)) || config.EPHEMERAL_TOKEN_TTL_SECONDS;
    if (!Number.isInteger(ttl) || ttl <= 0 || ttl > 60 * 60 * 24) {
      return res.status(400).json({ error: 'invalid ttl' });
    }
    const token = db.createToken('admin_overlay', req.ip, ttl);
    logger.info('Ephemeral token created', { ip: req.ip, ttl });
    res.json({ token, ttl });
  });

  // Security snapshot
  router.get('/security-snapshot', auth.requireAdmin, (req, res) => {
    const adminSession = getAdminSession(req);
    const botChannels = (tmiClient && typeof tmiClient.getChannels === 'function') ? tmiClient.getChannels() : [];
    const botConnected = !!(tmiClient && typeof tmiClient.readyState === 'function' ? tmiClient.readyState() === 'OPEN' : botChannels.length);
    const snapshot = {
      rateLimits: {
        blockedIps: Array.from(blockedIPs?.keys ? blockedIPs.keys() : []),
        loginAttempts: adminLoginAttempts.size,
      },
      errors: recentErrors.slice(-20),
      slow: recentSlowRequests.slice(-20),
      socketDisconnects: recentSocketDisconnects.slice(-20),
      bot: { connected: botConnected, channels: botChannels, lastReconnectAt: lastTmiReconnectAt },
      integrity: getCriticalHashes(),
      headers: {
        csp: true,
        hsts: config.IS_PRODUCTION,
        cors: '*',
      },
      admin: adminSession ? {
        login: adminSession.login,
        role: adminSession.role,
      } : null,
    };
    res.json({ snapshot });
  });

  return router;
}

module.exports = { createAdminRouter };
