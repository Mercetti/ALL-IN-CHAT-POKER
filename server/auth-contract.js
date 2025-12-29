/**
 * Consolidated auth contract helpers
 * Provides session extraction utilities without changing existing behavior
 */

const auth = require('./auth');
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

module.exports = {
  getAdminSession,
  getUserSession,
  hasAdminSession,
  hasUserSession,
};
