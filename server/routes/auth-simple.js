const express = require('express');
const config = require('../config');
const logger = require('../utils/logger');
const {
  createAdminJWT,
  getAdminCookieOptions,
  verifyPassword,
} = require('../auth');

const ADMIN_LOGIN = (config.ADMIN_USERNAME || config.OWNER_LOGIN || 'admin').toLowerCase();
const ADMIN_PASSWORD = config.ADMIN_PASSWORD;
const ADMIN_HASH = config.ADMIN_PASSWORD_HASH;
const ENABLE_OWNER_BOOTSTRAP = config.ENABLE_OWNER_BOOTSTRAP !== false;

function isPasswordValid(password) {
  if (!password) return false;
  if (ADMIN_HASH) {
    return verifyPassword(password, ADMIN_HASH);
  }
  if (ADMIN_PASSWORD) {
    return password === ADMIN_PASSWORD;
  }
  return false;
}

function createSimpleAuthRouter() {
  const router = express.Router();

  // Owner/admin login endpoint
  router.post('/login', (req, res) => {
    try {
      const { username, password } = req.body || {};

      if (!username || username.toLowerCase() !== ADMIN_LOGIN) {
        return res.status(403).json({ success: false, error: 'invalid_login' });
      }
      
      if (!password) {
        return res.status(400).json({ success: false, error: 'password_required' });
      }

      if (!isPasswordValid(password)) {
        return res.status(403).json({ success: false, error: 'invalid_credentials' });
      }

      const session = createAdminJWT();
      if (typeof res.cookie === 'function') {
        res.cookie('admin_jwt', session.token, getAdminCookieOptions());
      }

      return res.json({
        success: true,
        token: session.token,
        expiresIn: session.expiresIn,
        user: {
          login: ADMIN_LOGIN,
          role: 'owner',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.auth('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Token validation endpoint
  router.post('/validate', (req, res) => {
    try {
      const { token } = req.body || {};
      
      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }
      
      // For now, accept any token for testing
      // TODO: Implement proper token validation
      res.json({
        valid: true,
        user: {
          login: 'test_user',
          role: 'admin',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.auth('Token validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Disable open registration in secured mode
  router.post('/register', (req, res) => {
    if (!ENABLE_OWNER_BOOTSTRAP) {
      return res.status(403).json({ error: 'registration_disabled' });
    }
    return res.status(400).json({ error: 'registration_not_available' });
  });

  // Logout endpoint
  router.post('/logout', (req, res) => {
    try {
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      logger.auth('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = {
  createSimpleAuthRouter,
};
