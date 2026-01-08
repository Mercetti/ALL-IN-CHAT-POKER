const express = require('express');

function createAuthRouter({
  config,
  auth,
  db,
  jwt,
  logger,
  fetch,
  rateLimit,
  validateBody,
  validateLocalLogin,
  isBanned,
  fetchTwitchUser,
  defaultChannel,
}) {
  const router = express.Router();

  router.post('/auth/register', rateLimit('auth_register', 60 * 1000, 5), (req, res) => {
    try {
      const { login, password, email } = req.body || {};

      if (!validateBody({ login, password }, { login: 'string', password: 'string' })) {
        return res.status(400).json({ error: 'invalid_payload' });
      }

      const normalized = (login || '').trim().toLowerCase();

      if (isBanned(normalized, req.ip)) return res.status(403).json({ error: 'banned' });
      if (!validateLocalLogin(normalized)) return res.status(400).json({ error: 'invalid_login' });
      if (!password || password.length < 8) return res.status(400).json({ error: 'invalid_password' });

      const existing = db.getProfile(normalized);
      if (existing && existing.password_hash) {
        return res.status(409).json({ error: 'login_taken' });
      }

      const password_hash = auth.hashPassword(password);
      let profile = null;

      try {
        if (existing) {
          profile = db.updatePassword(normalized, password_hash);
        } else {
          profile = db.createLocalUser({ login: normalized, email, password_hash });
        }
      } catch (err) {
        if (String(err.message || '').includes('UNIQUE') || String(err.code || '') === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: 'login_taken' });
        }
        throw err;
      }

      const token = auth.signUserJWT(normalized);

      return res.json({
        token,
        profile: {
          login: profile.login,
          role: profile.role,
          twitchLinked: !!profile.twitch_id,
          discordLinked: !!profile.discord_id,
        },
      });
    } catch (err) {
      logger.error('auth register failed', { error: err.message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  // Simple admin password-only login for Control Center
  router.post('/auth/login', rateLimit('auth_login', 60 * 1000, 5), (req, res) => {
    try {
      const { password } = req.body || {};

      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'invalid_payload' });
      }

      // Compare against ADMIN_PASSWORD env var
      const adminPassword = config.ADMIN_PASSWORD;
      if (!adminPassword || password !== adminPassword) {
        return res.status(401).json({ error: 'invalid_credentials' });
      }

      // Create admin JWT as cookie
      const { token } = createAdminJWT();

      res.cookie('admin_jwt', token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: config.ADMIN_JWT_TTL_SECONDS * 1000,
      });

      return res.json({ success: true });
    } catch (err) {
      logger.error('admin login failed', { error: err.message, stack: err.stack });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  router.post('/auth/reset/request', rateLimit('auth_reset_req', 5 * 60 * 1000, 5), (req, res) => {
    try {
      const { login } = req.body || {};
      const normalized = (login || '').trim().toLowerCase();
      if (!validateLocalLogin(normalized)) {
        return res.status(400).json({ error: 'invalid_payload' });
      }
      const profile = db.getProfile(normalized);
      if (!profile) {
        return res.json({ ok: true });
      }
      const token = db.createToken(`pwdreset:${normalized}`, req.ip || '', 15 * 60);

      let delivered = false;
      if (config.RESET_WEBHOOK_URL) {
        try {
          fetch(config.RESET_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'password_reset',
              login: normalized,
              token,
              expiresInSeconds: 900,
              ip: req.ip || '',
            }),
          }).catch(() => {});
          delivered = true;
        } catch (err) {
          logger.warn('reset webhook failed', { error: err.message });
        }
      }

      return res.json({ ok: true, delivered, token: delivered ? null : token, expiresIn: 900 });
    } catch (err) {
      logger.error('auth reset request failed', { error: err.message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  router.post('/auth/reset/confirm', rateLimit('auth_reset_confirm', 60 * 1000, 5), (req, res) => {
    try {
      const { token, password } = req.body || {};
      if (!validateBody({ token, password }, { token: 'string', password: 'string' })) {
        return res.status(400).json({ error: 'invalid_payload' });
      }
      if ((password || '').length < 8) return res.status(400).json({ error: 'weak_password' });

      const row = db.getToken(token);
      if (!row || row.consumed || !row.purpose || !row.purpose.startsWith('pwdreset:')) {
        return res.status(400).json({ error: 'invalid_token' });
      }
      if (row.expires_at && new Date(row.expires_at) <= new Date()) {
        return res.status(400).json({ error: 'expired' });
      }
      const login = row.purpose.split(':')[1];
      if (!login || isBanned(login, req.ip)) return res.status(400).json({ error: 'invalid_token' });

      db.consumeToken(token);
      db.updatePassword(login, auth.hashPassword(password));
      db.setForcePasswordReset(login, 0);
      const userToken = auth.signUserJWT(login);
      const profile = db.getProfile(login);
      return res.json({
        ok: true,
        token: userToken,
        profile: profile ? { login: profile.login, role: profile.role } : null,
      });
    } catch (err) {
      logger.error('auth reset confirm failed', { error: err.message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  router.post('/auth/password', rateLimit('auth_password', 60 * 1000, 5), auth.requireUser, (req, res) => {
    try {
      const login = (req.userLogin || '').toLowerCase();
      const { oldPassword, newPassword } = req.body || {};
      if (!validateBody({ oldPassword, newPassword }, { oldPassword: 'string', newPassword: 'string' })) {
        return res.status(400).json({ error: 'invalid_payload' });
      }
      if ((newPassword || '').length < 8) return res.status(400).json({ error: 'weak_password' });
      const profile = db.getProfile(login);
      if (!profile || !profile.password_hash) return res.status(400).json({ error: 'invalid_account' });
      if (!auth.verifyPassword(oldPassword, profile.password_hash)) {
        return res.status(400).json({ error: 'invalid_old_password' });
      }
      db.updatePassword(login, auth.hashPassword(newPassword));
      db.setForcePasswordReset(login, 0);
      const token = auth.signUserJWT(login);
      return res.json({ ok: true, token, profile: { login: profile.login, role: profile.role } });
    } catch (err) {
      logger.error('auth password change failed', { error: err.message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  router.get('/auth/link/status', auth.requireUser, (req, res) => {
    try {
      const login = (req.userLogin || '').toLowerCase();
      const profile = db.getProfile(login);
      if (!profile) return res.status(404).json({ error: 'not_found' });
      return res.json({
        login: profile.login,
        role: profile.role,
        twitchLinked: !!profile.twitch_id,
        discordLinked: !!profile.discord_id,
        twitchAvatar: profile.twitch_avatar || null,
        discordAvatar: profile.discord_avatar || null,
        displayName: profile.display_name || profile.login,
      });
    } catch (err) {
      logger.error('link status failed', { error: err.message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  router.post('/auth/link/twitch', auth.requireUser, async (req, res) => {
    try {
      const { twitchToken } = req.body || {};
      if (!twitchToken || typeof twitchToken !== 'string') {
        return res.status(400).json({ error: 'twitch token required' });
      }
      const twitchProfile = await fetchTwitchUser(twitchToken);
      if (!twitchProfile || !twitchProfile.login) {
        return res.status(401).json({ error: 'invalid twitch token' });
      }
      const profile = db.linkTwitch((req.userLogin || '').toLowerCase(), {
        twitch_id: twitchProfile.user_id,
        twitch_avatar: twitchProfile.avatarUrl,
        display_name: twitchProfile.display_name || twitchProfile.login,
      });
      return res.json({
        ok: true,
        profile: {
          login: profile.login,
          role: profile.role,
          twitchLinked: !!profile.twitch_id,
          discordLinked: !!profile.discord_id,
          twitchAvatar: profile.twitch_avatar || null,
        },
      });
    } catch (err) {
      logger.error('link twitch failed', { error: err.message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  router.post('/auth/link/discord', auth.requireUser, (req, res) => {
    try {
      const { discord_id, discord_login, discord_avatar } = req.body || {};
      if (!discord_id) return res.status(400).json({ error: 'discord_id required' });
      const profile = db.linkDiscord((req.userLogin || '').toLowerCase(), {
        discord_id,
        discord_login: discord_login || discord_id,
        discord_avatar: discord_avatar || null,
      });
      return res.json({
        ok: true,
        profile: {
          login: profile.login,
          role: profile.role,
          twitchLinked: !!profile.twitch_id,
          discordLinked: !!profile.discord_id,
          discordAvatar: profile.discord_avatar || null,
        },
      });
    } catch (err) {
      logger.error('link discord failed', { error: err.message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  router.get('/auth/twitch/subs', auth.requireAdmin, (req, res) => {
    try {
      if (!config.TWITCH_CLIENT_ID) {
        return res.status(400).send('Missing TWITCH_CLIENT_ID');
      }

      const channel = req.query?.channel || defaultChannel;
      const redirectUri =
        config.TWITCH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/twitch/subs/callback`;
      const state = encodeURIComponent(`subauth:${channel}`);
      const scopes = ['channel:read:subscriptions', 'channel:read:vips', 'moderator:read:followers'];
      const scope = encodeURIComponent(scopes.join(' '));
      const authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${config.TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
      return res.redirect(authUrl);
    } catch (err) {
      logger.error('twitch sub auth redirect failed', { error: err.message });
      return res.status(500).send('auth_failed');
    }
  });

  router.get('/auth/twitch/subs/callback', async (req, res) => {
    const { code, state } = req.query || {};
    try {
      if (!code) return res.status(400).send('Missing code');

      const parsedState = decodeURIComponent(state || '');
      const channel =
        (parsedState.startsWith('subauth:') ? parsedState.replace('subauth:', '') : defaultChannel) ||
        defaultChannel;
      const redirectUri =
        config.TWITCH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/twitch/subs/callback`;

      const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.TWITCH_CLIENT_ID,
          client_secret: config.TWITCH_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        logger.warn('twitch token exchange failed', { status: tokenRes.status, text });
        return res.status(400).send('Token exchange failed');
      }

      const tokenData = await tokenRes.json();
      db.setTwitchSubToken(channel, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in ? Date.now() / 1000 + tokenData.expires_in : null,
      });

      return res.send('Twitch subscription access saved. You can close this window.');
    } catch (err) {
      logger.error('twitch sub auth callback failed', { error: err.message });
      return res.status(500).send('auth_failed');
    }
  });

  router.post('/auth/refresh', rateLimit('auth_refresh', 60 * 1000, 10), auth.requireUser, (req, res) => {
    try {
      const login = (req.userLogin || '').toLowerCase();

      if (!validateLocalLogin(login) || isBanned(login, req.ip)) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      const token = auth.signUserJWT(login);

      return res.json({ token, expiresIn: config.USER_JWT_TTL_SECONDS });
    } catch (err) {
      logger.error('auth refresh failed', { error: err.message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  router.get('/auth/debug', (req, res) => {
    try {
      const login = auth.extractUserLogin(req);
      const profile = login ? db.getProfile((login || '').toLowerCase()) : null;
      const role = profile?.role || null;
      const isAdmin = auth.isAdminRequest(req);

      const rawToken = (() => {
        const h = auth.getHeader(req, 'authorization') || '';
        if (h.toLowerCase().startsWith('bearer ')) return h.slice(7).trim();
        const cookie = auth.getHeader(req, 'cookie') || '';
        const m = cookie.match(/\badmin_jwt=([^;]+)/);
        if (m) return m[1];
        return null;
      })();

      let ttlSeconds = null;
      if (rawToken) {
        try {
          const payload = jwt.verify(rawToken, config.JWT_SECRET, { audience: undefined });
          if (payload?.exp) {
            ttlSeconds = payload.exp - Math.floor(Date.now() / 1000);
          }
        } catch {
          ttlSeconds = null;
        }
      }

      return res.json({
        ok: true,
        login: login || null,
        role,
        admin: !!isAdmin,
        ttlSeconds,
      });
    } catch (err) {
      logger.error('auth debug failed', { error: err.message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
}

module.exports = {
  createAuthRouter,
};
