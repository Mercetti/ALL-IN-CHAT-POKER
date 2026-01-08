/**
 * Authentication utilities and middleware
 */

const jwt = require('jsonwebtoken');
const config = require('./config');
const db = require('./db');
const Logger = require('./logger');
const crypto = require('crypto');

const logger = new Logger('auth');
const adminAllowList = (config.ADMIN_ALLOW_LOGINS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);
const adminAllowEmails = (config.ADMIN_ALLOW_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

function verifyJwtWithOptionalAudience(token, expectedAud) {
  const payload = jwt.verify(token, config.JWT_SECRET);
  if (payload && payload.aud && expectedAud) {
    const aud = payload.aud;
    const ok = Array.isArray(aud) ? aud.includes(expectedAud) : aud === expectedAud;
    if (!ok) {
    throw new Error('invalid_audience');
    }
  }
  return payload;
}

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

  // 3. Query parameter (deprecated)
  // Disabled by default in production; can be re-enabled explicitly.
  const allowQuery = !config.IS_PRODUCTION || config.ALLOW_ADMIN_QUERY_TOKEN;
  if (allowQuery && req && req.query && req.query.token) return req.query.token;

  return null;
}

/**
 * Extract JWT from cookie
 * @param {Object} req - Express request or Socket.IO handshake
 * @returns {Object|null} - JWT payload or null
 */
function extractJWT(req) {
  // First try Authorization header (Bearer token)
  const authHeader = getHeader(req, 'authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      return verifyJwtWithOptionalAudience(authHeader.slice(7), 'admin');
    } catch (e) {
      logger.debug('JWT verification failed (Bearer)', { error: e.message });
    }
  }

  // Fallback to cookie
  const cookie = getHeader(req, 'cookie');
  if (!cookie) return null;

  const match = cookie.match(/\badmin_jwt=([^;]+)/);
  if (!match) return null;

  try {
    return verifyJwtWithOptionalAudience(match[1], 'admin');
  } catch (e) {
    logger.debug('JWT verification failed (cookie)', { error: e.message });
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

    // Allow streamer/roles to act as admin when presenting a valid user JWT
    // Disabled by default in production; can be re-enabled explicitly.
    const allowUserJwtFallback = !config.IS_PRODUCTION || config.ALLOW_USER_JWT_ADMIN_FALLBACK;
    if (!allowUserJwtFallback) return false;

    const userToken =
      extractAdminToken(req) ||
      (req && req.handshake && req.handshake.auth && req.handshake.auth.token) ||
      (req && req.auth && req.auth.token) ||
      (req && req.headers && (req.headers.authorization || req.headers.Authorization));

    if (userToken) {
      const bearer = typeof userToken === 'string' && userToken.toLowerCase().startsWith('bearer ')
        ? userToken.slice(7).trim()
        : userToken;
      try {
        const payload = verifyJwtWithOptionalAudience(bearer, 'user');
        const user = payload && payload.user ? payload.user.toLowerCase() : null;
        if (user && config.STREAMER_LOGIN && user === config.STREAMER_LOGIN.toLowerCase()) return true;
        if (user && config.BOT_ADMIN_LOGIN && user === config.BOT_ADMIN_LOGIN.toLowerCase()) return true;
        if (user && adminAllowList.includes(user)) return true;
        if (user) {
          const profile = db.getProfile(user);
          const role = (profile && profile.role || '').toLowerCase();
          if (role === 'streamer' || role === 'admin') return true;
          const email = (profile && profile.email || '').toLowerCase();
          if (email && adminAllowEmails.includes(email)) return true;
        }
      } catch (e) {
        // ignore
      }
    }
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
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: expiresInSeconds, audience: 'admin' });
}

/**
 * Sign user JWT token
 * @param {string} login
 * @param {number} expiresInSeconds
 * @returns {string}
 */
function signUserJWT(login, expiresInSeconds = config.USER_JWT_TTL_SECONDS) {
  return jwt.sign({ user: login }, config.JWT_SECRET, { expiresIn: expiresInSeconds, audience: 'user' });
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

function getUserRole(req) {
  const login = extractUserLogin(req);
  if (!login) return null;
  try {
    const profile = db.getProfile((login || '').toLowerCase());
    const primaryRole = (profile?.role || '').toLowerCase() || null;
    
    // Check for additional roles
    const additionalRoles = Array.isArray(profile?.roles) ? profile.roles : [];
    const allRoles = [primaryRole, ...additionalRoles].filter(Boolean);
    
    // Return the primary role for compatibility, but could return array if needed
    return primaryRole;
  } catch {
    return null;
  }
}

// New function to check if user has any of the allowed roles
function hasAnyRole(req, allowedRoles) {
  const login = extractUserLogin(req);
  if (!login) return false;
  try {
    const profile = db.getProfile((login || '').toLowerCase());
    const primaryRole = (profile?.role || '').toLowerCase() || null;
    const additionalRoles = Array.isArray(profile?.roles) ? profile.roles : [];
    const allRoles = [primaryRole, ...additionalRoles].filter(Boolean).map(r => r.toLowerCase());
    
    return allowedRoles.some(role => allRoles.includes(role));
  } catch {
    return false;
  }
}

function requireAdminOrRole(roles = []) {
  const allowed = (Array.isArray(roles) ? roles : [roles])
    .map(r => (r || '').toLowerCase())
    .filter(Boolean);
  return (req, res, next) => {
    if (isAdminRequest(req)) return next();
    if (hasAnyRole(req, allowed)) {
      req.userLogin = req.userLogin || extractUserLogin(req);
      return next();
    }
    logger.warn('Unauthorized admin/role access attempt', { ip: req.ip, role: getUserRole(req) });
    return res.status(403).json({ error: 'not authorized' });
  };
}

/**
 * Extract a user login from request headers or query
 * @param {Object} req
 * @returns {string|null}
 */
function extractUserLogin(req) {
  // Check for user JWT cookie first (for server-side page access)
  const cookie = getHeader(req, 'cookie');
  if (cookie) {
    const match = cookie.match(/\buser_jwt=([^;]+)/);
    if (match) {
      try {
        const decoded = verifyJwtWithOptionalAudience(match[1], 'user');
        if (decoded && decoded.user) {
          return decoded.user;
        }
      } catch (e) {
        logger.debug('User JWT verification failed (cookie)', { error: e.message });
      }
    }
  }

  // Socket.IO auth payload: { token }
  if (req && req.auth && typeof req.auth.token === 'string') {
    try {
      const decoded = verifyJwtWithOptionalAudience(req.auth.token, 'user');
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
      const decoded = verifyJwtWithOptionalAudience(token, 'user');
      if (decoded && decoded.user) {
        return decoded.user;
      }
    } catch (e) {
      logger.debug('User JWT verification failed', { error: e.message });
    }
  }

  return null;
}

function requireUser(req, res, next) {
  try {
    const login = extractUserLogin(req);
    if (!login) return res.status(401).json({ error: 'unauthorized' });
    req.userLogin = login;
    return next();
  } catch (err) {
    logger.warn('User auth failed', { error: err.message });
    return res.status(401).json({ error: 'unauthorized' });
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !password) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
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
  requireAdminOrRole,
  extractUserLogin,
  requireUser,
  hashPassword,
  verifyPassword,
};
