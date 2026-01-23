const path = require('path');
const { Router } = require('express');
const { getAdminSession } = require('../auth-contract');

function createAdminRouter({ auth, middleware, config, logger, rateLimit, db, tmiClient, blockedIPs, adminLoginAttempts, recentErrors, recentSlowRequests, recentSocketDisconnects, lastTmiReconnectAt, getCriticalHashes, recordLoginAttempt }) {
  const router = Router();

  // Admin-only pages
  router.get('/admin-chat.html', auth.requireAdmin, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'admin-chat.html'));

  router.get('/admin-chat', auth.requireAdmin, (_req, res) => {
    res.redirect('/admin-chat.html');

  router.get('/admin-code.html', auth.requireAdmin, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'admin-code.html'));

  router.get('/admin-code', auth.requireAdmin, (_req, res) => {
    res.redirect('/admin-code.html');

  // CSRF token
  router.get('/csrf', auth.requireAdmin, (req, res) => {
    const token = middleware.issueCsrfCookie(res, { auth, config });
    res.json({ token });

  // Admin login with rate limiting and DB-backed authentication
  router.post('/login', rateLimit('admin-login', 60 * 1000, 5), (req, res) => {
    try {
      const ip = req.ip;
      const { username, password } = req.body || {};

      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'password required' });
      }
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'username required' });
      }

      // Basic IP rate limiting
      if (!recordLoginAttempt(ip)) {
        logger.warn('Admin login attempt blocked - rate limited', { ip, username });
        return res.status(429).json({ error: 'too many attempts, try again later' });
      }

      // Fetch admin user from DB
      const adminUser = db.getAdminUser(username);
      if (!adminUser) {
        db.recordAdminLoginAttempt({ login: username, ip, success: 0, reason: 'user_not_found' });
        logger.warn('Admin login failed - user not found', { ip, username });
        return res.status(401).json({ error: 'invalid_credentials' });
      }

      // Check account status and lockout
      if (adminUser.status !== 'active') {
        db.recordAdminLoginAttempt({ login: username, ip, success: 0, reason: 'account_inactive' });
        logger.warn('Admin login failed - account inactive', { ip, username, status: adminUser.status });
        return res.status(403).json({ error: 'account_disabled' });
      }

      const now = new Date();
      if (adminUser.locked_until && new Date(adminUser.locked_until) > now) {
        db.recordAdminLoginAttempt({ login: username, ip, success: 0, reason: 'account_locked' });
        logger.warn('Admin login failed - account locked', { ip, username, lockedUntil: adminUser.locked_until });
        return res.status(423).json({ error: 'account_locked' });
      }

      // Verify password
      const passwordValid = auth.verifyPassword(password, adminUser.password_hash);
      if (!passwordValid) {
        db.incrementAdminFailedAttempts(username);
        db.recordAdminLoginAttempt({ login: username, ip, success: 0, reason: 'invalid_password' });

        // Apply lockout if threshold exceeded
        const recentFailures = db.countRecentAdminLoginFailures(username, 900); // 15 min window
        if (recentFailures >= (config.ADMIN_LOGIN_MAX_ATTEMPTS || 5)) {
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
          db.setAdminLockedUntil(username, lockUntil);
          logger.warn('Admin account locked due to repeated failures', { ip, username, recentFailures, lockedUntil: lockUntil.toISOString() });
        }

        logger.warn('Admin login failed - invalid password', { ip, username });
        return res.status(401).json({ error: 'invalid_credentials' });
      }

      // Success: reset failures, update last login, record attempt, issue JWT/CSRF
      db.resetAdminFailedAttempts(username);
      db.markAdminLoginSuccess(username);
      db.recordAdminLoginAttempt({ login: username, ip, success: 1 });
      db.logAdminUserAction({ actor_login: username, action: 'login', details: { ip } });

      logger.info('Admin login successful', { ip, username });
      const jwtData = auth.createAdminJWT({ adminName: username, role: adminUser.role });
      const cookieOptions = auth.getAdminCookieOptions();
      const csrfToken = middleware.issueCsrfCookie(res, { auth, config });

      res.cookie('admin_jwt', jwtData.token, cookieOptions);
      res.json({
        success: true,
        token: jwtData.token,
        csrfToken,
        expiresIn: jwtData.expiresIn,
        user: {
          login: adminUser.login,
          displayName: adminUser.display_name,
          role: adminUser.role,
        },
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

  // Ephemeral admin token
  router.post('/token', rateLimit('admin-token', 60 * 1000, 5), auth.requireAdmin, (req, res) => {
    const ttl = (req.body && Number(req.body.ttl)) || config.EPHEMERAL_TOKEN_TTL_SECONDS;
    if (!Number.isInteger(ttl) || ttl <= 0 || ttl > 60 * 60 * 24) {
      return res.status(400).json({ error: 'invalid ttl' });
    }
    const token = db.createToken('admin_overlay', req.ip, ttl);
    logger.info('Ephemeral token created', { ip: req.ip, ttl });
    res.json({ token, ttl });

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

  // Refresh cosmetics catalog
  router.post('/refresh-cosmetics', auth.requireAdmin, async (req, res) => {
    try {
      logger.info('Admin refreshing cosmetics catalog', { admin: getAdminSession(req)?.login });
      
      // Clear existing cosmetics and reseed
      db.db.prepare('DELETE FROM cosmetics').run();
      
      const { COSMETIC_CATALOG } = require('../cosmetic-catalog');
      db.seedCosmetics(COSMETIC_CATALOG);
      
      res.json({ 
        success: true, 
        message: 'Cosmetics catalog refreshed',
        count: COSMETIC_CATALOG.length 
      });
    } catch (error) {
      logger.error('Failed to refresh cosmetics catalog', { error: error.message });
      res.status(500).json({ error: 'Failed to refresh cosmetics catalog' });
    }
  });

  return router;
}

module.exports = { createAdminRouter };
