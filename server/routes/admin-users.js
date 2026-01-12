const { Router } = require('express');

function createAdminUsersRouter({ auth, db, logger, validateBody }) {
  const router = Router();

  // List admin users (admin-only)
  router.get('/admin/users', auth.requireAdmin, (req, res) => {
    try {
      const { status, limit } = req.query;
      const users = db.listAdminUsers({ status, limit: Number(limit) || 200 });
      res.json({ success: true, users });
    } catch (err) {
      logger.error('Failed to list admin users', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Get single admin user (admin-only)
  router.get('/admin/users/:login', auth.requireAdmin, (req, res) => {
    try {
      const { login } = req.params;
      const user = db.getAdminUser(login);
      if (!user) return res.status(404).json({ error: 'not_found' });
      // Exclude password hash from response
      const { password_hash, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (err) {
      logger.error('Failed to get admin user', { error: err.message, login: req.params.login });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Create admin user (admin-only)
  router.post('/admin/users', auth.requireAdmin, (req, res) => {
    try {
      const { login, display_name, email, password, role = 'admin', status = 'active' } = req.body;
      if (!validateBody({ login, password }, { login: 'string', password: 'string' })) {
        return res.status(400).json({ error: 'invalid_payload' });
      }

      const actor = auth.extractJWT(req)?.adminName || 'unknown';
      const password_hash = auth.hashPassword(password);

      const existing = db.getAdminUser(login);
      if (existing) return res.status(409).json({ error: 'user_exists' });

      const newUser = db.createAdminUser({
        login,
        display_name,
        email,
        password_hash,
        role,
        status,
        created_by: actor,
      });

      db.logAdminUserAction({
        actor_login: actor,
        target_login: login,
        action: 'create',
        details: { role, status },
      });

      const { password_hash: _, ...safeUser } = newUser;
      logger.info('Admin user created', { actor, target: login, role, status });
      res.json({ success: true, user: safeUser });
    } catch (err) {
      logger.error('Failed to create admin user', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Update admin user (admin-only)
  router.put('/admin/users/:login', auth.requireAdmin, (req, res) => {
    try {
      const { login } = req.params;
      const updates = req.body;
      const allowed = ['display_name', 'email', 'role', 'status', 'password'];
      const filtered = {};

      allowed.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          filtered[key] = updates[key];
        }
      });

      if (Object.keys(filtered).length === 0) {
        return res.status(400).json({ error: 'no_valid_updates' });
      }

      // If password is being updated, hash it
      if (filtered.password) {
        filtered.password_hash = auth.hashPassword(filtered.password);
        delete filtered.password;
      }

      const actor = auth.extractJWT(req)?.adminName || 'unknown';
      filtered.updated_by = actor;

      const updatedUser = db.updateAdminUser(login, filtered);
      if (!updatedUser) return res.status(404).json({ error: 'not_found' });

      db.logAdminUserAction({
        actor_login: actor,
        target_login: login,
        action: 'update',
        details: filtered,
      });

      const { password_hash: _, ...safeUser } = updatedUser;
      logger.info('Admin user updated', { actor, target: login, updates: Object.keys(filtered) });
      res.json({ success: true, user: safeUser });
    } catch (err) {
      logger.error('Failed to update admin user', { error: err.message, login: req.params.login });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Disable/enable admin user (admin-only)
  router.patch('/admin/users/:login/status', auth.requireAdmin, (req, res) => {
    try {
      const { login } = req.params;
      const { status } = req.body;
      if (!['active', 'disabled'].includes(status)) {
        return res.status(400).json({ error: 'invalid_status' });
      }

      const actor = auth.extractJWT(req)?.adminName || 'unknown';
      const updatedUser = db.updateAdminUser(login, { status, updated_by: actor });
      if (!updatedUser) return res.status(404).json({ error: 'not_found' });

      db.logAdminUserAction({
        actor_login: actor,
        target_login: login,
        action: status === 'active' ? 'enable' : 'disable',
        details: { status },
      });

      const { password_hash: _, ...safeUser } = updatedUser;
      logger.info('Admin user status changed', { actor, target: login, status });
      res.json({ success: true, user: safeUser });
    } catch (err) {
      logger.error('Failed to change admin user status', { error: err.message, login: req.params.login });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Reset admin user lockout (admin-only)
  router.post('/admin/users/:login/unlock', auth.requireAdmin, (req, res) => {
    try {
      const { login } = req.params;
      const actor = auth.extractJWT(req)?.adminName || 'unknown';

      db.resetAdminFailedAttempts(login);
      db.setAdminLockedUntil(login, null);
      db.logAdminUserAction({
        actor_login: actor,
        target_login: login,
        action: 'unlock',
        details: {},
      });

      logger.info('Admin user unlocked', { actor, target: login });
      res.json({ success: true });
    } catch (err) {
      logger.error('Failed to unlock admin user', { error: err.message, login: req.params.login });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // List admin audit logs (admin-only)
  router.get('/admin/audit', auth.requireAdmin, (req, res) => {
    try {
      const { limit } = req.query;
      const logs = db.listAdminAuditLogs(Number(limit) || 200);
      res.json({ success: true, logs });
    } catch (err) {
      logger.error('Failed to list admin audit logs', { error: err.message });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // Get recent login attempts for a user (admin-only)
  router.get('/admin/users/:login/login-attempts', auth.requireAdmin, (req, res) => {
    try {
      const { login } = req.params;
      const { limit } = req.query;
      const attempts = db.getRecentAdminLoginAttempts(login, Number(limit) || 20);
      res.json({ success: true, attempts });
    } catch (err) {
      logger.error('Failed to get login attempts', { error: err.message, login: req.params.login });
      res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
}

module.exports = { createAdminUsersRouter };
