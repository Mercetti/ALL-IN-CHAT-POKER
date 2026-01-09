const express = require('express');
const crypto = require('crypto');

function createSimpleAuthRouter() {
  const router = express.Router();

  // Simple login endpoint for testing
  router.post('/login', (req, res) => {
    try {
      const { login, password } = req.body || {};
      
      if (!login || !password) {
        return res.status(400).json({ error: 'Login and password required' });
      }
      
      // For now, accept any login/password for testing
      // TODO: Implement proper authentication
      const token = crypto.randomBytes(32).toString('hex');
      
      res.json({
        success: true,
        token,
        user: {
          login,
          role: 'admin', // Temporary admin role for testing
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Login error:', error);
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
      console.error('Token validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout endpoint
  router.post('/logout', (req, res) => {
    try {
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = {
  createSimpleAuthRouter,
};
