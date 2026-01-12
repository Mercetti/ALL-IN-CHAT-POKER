const { Router } = require('express');

function createPlayersRouter({ auth, db, logger, validateBody, fetch, config }) {
  const router = Router();

  // Helper: fetch Twitch user profile by access token
  async function fetchTwitchUser(accessToken) {
    try {
      const res = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Client-ID': config.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.data?.[0] || null;
    } catch {
      return null;
    }
  }

  // Register local player (mandatory)
  router.post('/players/register', async (req, res) => {
    try {
      const { login, password, email } = req.body || {};
      if (!validateBody({ login, password }, { login: 'string', password: 'string' })) {
        return res.status(400).json({ error: 'invalid_payload' });
      }
      const normalized = login.trim().toLowerCase();
      if (normalized.length < 3 || normalized.length > 24) {
        return res.status(400).json({ error: 'invalid_login' });
      }
      if (!password || password.length < 8) {
        return res.status(400).json({ error: 'invalid_password' });
      }

      const existing = db.getProfile(normalized);
      if (existing) {
        return res.status(409).json({ error: 'login_taken' });
      }

      const password_hash = auth.hashPassword(password);
      const profile = db.createLocalUser({ login: normalized, email, password_hash });

      const token = auth.signUserJWT(normalized);
      logger.info('Player registered', { login: normalized, ip: req.ip });
      res.json({
        success: true,
        token,
        profile: {
          login: profile.login,
          email: profile.email,
          role: profile.role,
          twitchLinked: !!profile.twitch_id,
          discordLinked: !!profile.discord_id,
        },
      });
    } catch (err) {
      logger.error('Player registration failed', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Login local player
  router.post('/players/login', async (req, res) => {
    try {
      const { login, password } = req.body || {};
      if (!validateBody({ login, password }, { login: 'string', password: 'string' })) {
        return res.status(400).json({ error: 'invalid_payload' });
      }
      const normalized = login.trim().toLowerCase();

      const profile = db.getProfile(normalized);
      if (!profile || !profile.password_hash) {
        return res.status(401).json({ error: 'invalid_credentials' });
      }

      const passwordValid = auth.verifyPassword(password, profile.password_hash);
      if (!passwordValid) {
        logger.warn('Player login failed', { login: normalized, ip: req.ip });
        return res.status(401).json({ error: 'invalid_credentials' });
      }

      const token = auth.signUserJWT(normalized);
      logger.info('Player logged in', { login: normalized, ip: req.ip });
      res.json({
        success: true,
        token,
        profile: {
          login: profile.login,
          email: profile.email,
          role: profile.role,
          twitchLinked: !!profile.twitch_id,
          discordLinked: !!profile.discord_id,
        },
      });
    } catch (err) {
      logger.error('Player login failed', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Link Twitch account (optional)
  router.post('/players/link-twitch', auth.requireUser, async (req, res) => {
    try {
      const { accessToken } = req.body || {};
      if (!accessToken || typeof accessToken !== 'string') {
        return res.status(400).json({ error: 'access_token_required' });
      }

      const twitchUser = await fetchTwitchUser(accessToken);
      if (!twitchUser) {
        return res.status(400).json({ error: 'invalid_twitch_token' });
      }

      const login = auth.extractUserLogin(req);
      const existingByTwitch = db.getProfileByTwitchId(twitchUser.id);
      if (existingByTwitch && existingByTwitch.login !== login) {
        return res.status(409).json({ error: 'twitch_already_linked' });
      }

      const updated = db.linkTwitch(login, {
        twitch_id: twitchUser.id,
        twitch_avatar: twitchUser.profile_image_url,
        display_name: twitchUser.display_name,
      });

      logger.info('Twitch account linked', { login, twitchId: twitchUser.id, ip: req.ip });
      res.json({
        success: true,
        profile: {
          login: updated.login,
          email: updated.email,
          role: updated.role,
          twitchLinked: !!updated.twitch_id,
          discordLinked: !!updated.discord_id,
        },
      });
    } catch (err) {
      logger.error('Twitch link failed', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Unlink Twitch account
  router.post('/players/unlink-twitch', auth.requireUser, (req, res) => {
    try {
      const login = auth.extractUserLogin(req);
      const updated = db.linkTwitch(login, { twitch_id: null, twitch_avatar: null, display_name: null });
      logger.info('Twitch account unlinked', { login, ip: req.ip });
      res.json({
        success: true,
        profile: {
          login: updated.login,
          email: updated.email,
          role: updated.role,
          twitchLinked: !!updated.twitch_id,
          discordLinked: !!updated.discord_id,
        },
      });
    } catch (err) {
      logger.error('Twitch unlink failed', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Get current player profile
  router.get('/players/me', auth.requireUser, (req, res) => {
    try {
      const login = auth.extractUserLogin(req);
      const profile = db.getProfile(login);
      if (!profile) return res.status(404).json({ error: 'not_found' });
      res.json({
        success: true,
        profile: {
          login: profile.login,
          email: profile.email,
          role: profile.role,
          display_name: profile.display_name,
          twitchLinked: !!profile.twitch_id,
          discordLinked: !!profile.discord_id,
        },
      });
    } catch (err) {
      logger.error('Get profile failed', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Update player profile (email, display_name)
  router.put('/players/me', auth.requireUser, (req, res) => {
    try {
      const login = auth.extractUserLogin(req);
      const { email, display_name } = req.body || {};
      const updates = {};
      if (email !== undefined) updates.email = email;
      if (display_name !== undefined) updates.display_name = display_name;

      const updated = db.updateProfile(login, updates);
      if (!updated) return res.status(404).json({ error: 'not_found' });

      logger.info('Player profile updated', { login, updates: Object.keys(updates), ip: req.ip });
      res.json({
        success: true,
        profile: {
          login: updated.login,
          email: updated.email,
          role: updated.role,
          display_name: updated.display_name,
          twitchLinked: !!updated.twitch_id,
          discordLinked: !!updated.discord_id,
        },
      });
    } catch (err) {
      logger.error('Profile update failed', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Change password
  router.put('/players/me/password', auth.requireUser, (req, res) => {
    try {
      const login = auth.extractUserLogin(req);
      const { currentPassword, newPassword } = req.body || {};
      if (!validateBody({ currentPassword, newPassword }, { currentPassword: 'string', newPassword: 'string' })) {
        return res.status(400).json({ error: 'invalid_payload' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'invalid_password' });
      }

      const profile = db.getProfile(login);
      if (!profile || !profile.password_hash) {
        return res.status(404).json({ error: 'not_found' });
      }

      const currentValid = auth.verifyPassword(currentPassword, profile.password_hash);
      if (!currentValid) {
        return res.status(401).json({ error: 'invalid_current_password' });
      }

      const newPasswordHash = auth.hashPassword(newPassword);
      const updated = db.updatePassword(login, newPasswordHash);

      logger.info('Player password changed', { login, ip: req.ip });
      res.json({
        success: true,
        profile: {
          login: updated.login,
          email: updated.email,
          role: updated.role,
          twitchLinked: !!updated.twitch_id,
          discordLinked: !!updated.discord_id,
        },
      });
    } catch (err) {
      logger.error('Password change failed', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Admin: List players (with optional filters)
  router.get('/admin/players', auth.requireAdmin, (req, res) => {
    try {
      const { status, limit = 200, offset = 0 } = req.query;
      let query = 'SELECT login, email, display_name, role, twitch_id, discord_id, created_at, updated_at FROM profiles';
      const params = [];
      const clauses = [];

      if (status === 'banned') {
        clauses.push('role = ?');
        params.push('banned');
      } else if (status === 'linked') {
        clauses.push('(twitch_id IS NOT NULL OR discord_id IS NOT NULL)');
      } else {
        clauses.push('role != ?');
        params.push('admin');
      }

      query += ' WHERE ' + clauses.join(' AND ');
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset));

      const stmt = db.db.prepare(query);
      const players = stmt.all(...params);
      res.json({ success: true, players });
    } catch (err) {
      logger.error('List players failed', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Admin: Ban player
  router.post('/admin/players/:login/ban', auth.requireAdmin, (req, res) => {
    try {
      const { login } = req.params;
      const { reason } = req.body || {};
      const actor = auth.extractJWT(req)?.adminName || 'unknown';

      const updated = db.updateProfile(login, { role: 'banned' });
      if (!updated) return res.status(404).json({ error: 'not_found' });

      logger.warn('Player banned', { actor, target: login, reason, ip: req.ip });
      res.json({ success: true, player: { login: updated.login, role: updated.role } });
    } catch (err) {
      logger.error('Ban player failed', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Admin: Unban player
  router.post('/admin/players/:login/unban', auth.requireAdmin, (req, res) => {
    try {
      const { login } = req.params;
      const { reason } = req.body || {};
      const actor = auth.extractJWT(req)?.adminName || 'unknown';

      const updated = db.updateProfile(login, { role: 'player' });
      if (!updated) return res.status(404).json({ error: 'not_found' });

      logger.info('Player unbanned', { actor, target: login, reason, ip: req.ip });
      res.json({ success: true, player: { login: updated.login, role: updated.role } });
    } catch (err) {
      logger.error('Unban player failed', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
}

module.exports = { createPlayersRouter };
