/**
 * Authentication utilities and middleware
 */

const jwt = require('jsonwebtoken');
const config = require('./config');
const Logger = require('./logger');

const logger = new Logger('auth');

/**
 * Read a header from either an Express request or a Socket.IO handshake
 * @param {Object} req
 * @param {string} name
 * @returns {string}
 */
function getHeader(req, name) {
  if (!req) return '';
  if (typeof req.get === 'function') return req.get(name) || '';

  const headers = req.headers || (req.request && req.request.headers) || {};
  return headers[name.toLowerCase()] || headers[name] || '';
}

/**
 * Extract admin token from request (multiple methods)
 * @param {Object} req - Express request or Socket.IO handshake
 * @returns {string|null} - Token or null
 */
function extractAdminToken(req) {
  // 1. Authorization header: Bearer <token>
  const authHeader = getHeader(req, 'authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 2. x-admin-token header
  const headerToken = getHeader(req, 'x-admin-token');
  if (headerToken) return headerToken;

  // 3. Query parameter (deprecated but supported)
  if (req && req.query && req.query.token) return req.query.token;

  return null;
}

/**
 * Extract JWT from cookie
 * @param {Object} req - Express request or Socket.IO handshake
 * @returns {Object|null} - JWT payload or null
 */
function extractJWT(req) {
  const cookie = getHeader(req, 'cookie');
  if (!cookie) return null;

  const match = cookie.match(/\badmin_jwt=([^;]+)/);
  if (!match) return null;

  try {
    return jwt.verify(match[1], config.JWT_SECRET);
  } catch (e) {
    logger.debug('JWT verification failed', { error: e.message });
    return null;
  }
}

/**
 * Check if request is authorized as admin
 * @param {Object} req - Express request or Socket.IO handshake
 * @returns {boolean}
 */
function isAdminRequest(req) {
  try {
    // Check JWT cookie first (most secure)
    const jwtPayload = extractJWT(req);
    if (jwtPayload && jwtPayload.admin) return true;

    // Check permanent token
    const token = extractAdminToken(req);
    if (config.ADMIN_TOKEN && token === config.ADMIN_TOKEN) return true;
  } catch (err) {
    logger.debug('Admin check failed', { error: err.message });
  }

  return false;
}

/**
 * Sign JWT token
 * @param {Object} payload - Token payload
 * @param {number} expiresInSeconds - Token TTL
 * @returns {string} - Signed JWT
 */
function signJWT(payload, expiresInSeconds = config.ADMIN_JWT_TTL_SECONDS) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: expiresInSeconds });
}

/**
 * Sign user JWT token
 * @param {string} login
 * @param {number} expiresInSeconds
 * @returns {string}
 */
function signUserJWT(login, expiresInSeconds = config.USER_JWT_TTL_SECONDS) {
  return jwt.sign({ user: login }, config.JWT_SECRET, { expiresIn: expiresInSeconds });
}

/**
 * Create admin JWT response
 * @returns {Object} - Token info with expiry
 */
function createAdminJWT() {
  const expiresInSeconds = config.ADMIN_JWT_TTL_SECONDS;
  const token = signJWT({ admin: true }, expiresInSeconds);
  return {
    token,
    expiresIn: expiresInSeconds,
    expiresAt: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
}

/**
 * Get cookie options for admin JWT
 * @returns {Object}
 */
function getAdminCookieOptions() {
  const expiresInSeconds = config.ADMIN_JWT_TTL_SECONDS;
  return {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    secure: config.IS_PRODUCTION,
    maxAge: expiresInSeconds * 1000,
  };
}

/**
 * Middleware: Check admin authorization
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
function requireAdmin(req, res, next) {
  if (!isAdminRequest(req)) {
    logger.warn('Unauthorized admin access attempt', { ip: req.ip });
    return res.status(403).json({ error: 'not authorized' });
  }
  next();
}

/**
 * Extract a user login from request headers or query
 * @param {Object} req
 * @returns {string|null}
 */
function extractUserLogin(req) {
  // Socket.IO auth payload: { token }
  if (req && req.auth && typeof req.auth.token === 'string') {
    try {
      const decoded = jwt.verify(req.auth.token, config.JWT_SECRET);
      if (decoded && decoded.user) {
        return decoded.user;
      }
    } catch (e) {
      logger.debug('User JWT verification failed (socket auth)', { error: e.message });
    }
  }

  // User JWT via Authorization: Bearer
  const authHeader = getHeader(req, 'authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (decoded && decoded.user) {
        return decoded.user;
      }
    } catch (e) {
      logger.debug('User JWT verification failed', { error: e.message });
    }
  }

  return null;
}

module.exports = {
  getHeader,
  extractAdminToken,
  extractJWT,
  isAdminRequest,
  signJWT,
  signUserJWT,
  createAdminJWT,
  getAdminCookieOptions,
  requireAdmin,
  extractUserLogin,
};
