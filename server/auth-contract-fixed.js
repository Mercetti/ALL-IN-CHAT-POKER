/**
 * Consolidated auth contract helpers
 * Provides session extraction utilities without changing existing behavior
 * Includes new requireOwner export
 */

const auth = require('./auth-fixed');
const db = require('./db');

/**
 * Get admin session from request (Express or Socket.IO)
 * Returns null if not authenticated, otherwise returns admin profile
 * @param {Object} req - Express request or Socket.IO handshake
 * @returns {Object|null} - Admin profile or null
 */
function getAdminSession(req) {
  if (!auth.isAdminRequest(req)) {
    return null;
  }
  const login = auth.extractUserLogin(req);
  if (!login) {
    return null;
  }
  const profile = db.getProfile(login);
  if (!profile || (profile.role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return profile;
}

/**
 * Get user session from request (Express or Socket.IO)
 * Returns null if not authenticated, otherwise returns user profile
 * @param {Object} req - Express request or Socket.IO handshake
 * @returns {Object|null} - User profile or null
 */
function getUserSession(req) {
  const login = auth.extractUserLogin(req);
  if (!login) {
    return null;
  }
  const profile = db.getProfile(login);
  if (!profile) {
    return null;
  }
  return profile;
}

/**
 * Check if request has a valid admin session
 * @param {Object} req - Express request or Socket.IO handshake
 * @returns {boolean}
 */
function hasAdminSession(req) {
  return getAdminSession(req) !== null;
}

/**
 * Check if request has a valid user session
 * @param {Object} req - Express request or Socket.IO handshake
 * @returns {boolean}
 */
function hasUserSession(req) {
  return getUserSession(req) !== null;
}

/**
 * Middleware to require admin session
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function requireAdmin(req, res, next) {
  const adminSession = getAdminSession(req);
  if (!adminSession) {
    return res.status(401).json({ 
      success: false, 
      error: 'Admin authentication required' 
    });
  }
  req.adminSession = adminSession;
  next();
}

/**
 * Middleware to require user session
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function requireUser(req, res, next) {
  const userSession = getUserSession(req);
  if (!userSession) {
    return res.status(401).json({ 
      success: false, 
      error: 'User authentication required' 
    });
  }
  req.userSession = userSession;
  next();
}

module.exports = {
  getAdminSession,
  getUserSession,
  hasAdminSession,
  hasUserSession,
  requireAdmin,
  requireUser,
  // Export all auth functions for consistency
  ...auth
};
