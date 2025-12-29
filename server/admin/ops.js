/**
 * Admin operations utilities - core admin functionality
 */

const auth = require('../auth');
const db = require('../db');
const config = require('../config');

// Rate limiting for admin login attempts
const adminLoginAttempts = new Map();
const blockedIPs = new Map();

/**
 * Extract actor identifier (admin username) from request for audit logs
 * @param {Object} req - Express request object
 * @returns {string} - Admin username or 'admin'
 */
const getActorFromReq = (req) => {
  try {
    const payload = auth.extractJWT(req);
    if (payload && payload.adminName) return payload.adminName;
  } catch (e) {
    // ignore
  }
  if (req && req.body && req.body.adminUser) return req.body.adminUser;
  return 'admin';
};

/**
 * Check if IP is blocked due to failed login attempts
 * @param {string} ip - IP address to check
 * @returns {boolean} - Whether IP is blocked
 */
const isIPBlocked = (ip) => {
  const block = blockedIPs.get(ip);
  if (!block) return false;
  
  if (Date.now() > block.unblockTime) {
    blockedIPs.delete(ip);
    return false;
  }
  
  return true;
};

/**
 * Block IP with exponential backoff due to failed login attempts
 * @param {string} ip - IP address to block
 */
const blockIP = (ip) => {
  const existing = blockedIPs.get(ip) || { attempts: 0 };
  const attempts = existing.attempts + 1;
  const penalty = config.ADMIN_LOGIN_BASE_PENALTY_SECONDS * Math.pow(2, attempts - 1);
  const unblockTime = Date.now() + penalty * 1000;

  blockedIPs.set(ip, {
    attempts,
    unblockTime,
    blockedAt: new Date(),
  });

  const logger = require('../logger');
  logger.warn('IP blocked due to failed login attempts', {
    ip,
    attempts,
    penaltySeconds: penalty,
  });
};

/**
 * Record a login attempt and determine if it should be allowed
 * @param {string} ip - IP address of the request
 * @returns {boolean} - Whether login attempt is still allowed
 */
const recordLoginAttempt = (ip) => {
  if (isIPBlocked(ip)) return false;

  const now = Date.now();
  const windowStart = now - config.ADMIN_LOGIN_ATTEMPT_WINDOW_SECONDS * 1000;
  const attempts = adminLoginAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(t => t > windowStart);

  if (recentAttempts.length >= config.ADMIN_LOGIN_MAX_ATTEMPTS) {
    blockIP(ip);
    return false;
  }

  recentAttempts.push(now);
  adminLoginAttempts.set(ip, recentAttempts);
  return true;
};

/**
 * Check if user has premier/admin privileges for any operation
 * @param {Object} req - Express request object
 * @returns {boolean} - Whether user can act as premier
 */
const canPremierActForAny = (req) => {
  if (auth.isAdminRequest(req)) return true;
  const actor = (auth.extractUserLogin(req) || '').toLowerCase();
  if (!actor) return false;
  const role = (db.getProfile(actor)?.role || '').toLowerCase();
  return role === 'admin' || role === 'premier';
};

/**
 * Get admin session information
 * @param {Object} req - Express request object
 * @returns {Object|null} - Session info or null if not authenticated
 */
const getAdminSession = (req) => {
  try {
    const payload = auth.extractJWT(req);
    if (payload && payload.adminName) {
      return {
        adminName: payload.adminName,
        loginTime: payload.iat ? new Date(payload.iat * 1000) : null,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
};

/**
 * Validate admin credentials
 * @param {string} password - Password to validate
 * @returns {boolean} - Whether password is correct
 */
const validateAdminCredentials = (password) => {
  return password === config.ADMIN_PASSWORD;
};

/**
 * Get admin activity summary
 * @returns {Object} - Admin activity statistics
 */
const getAdminActivitySummary = () => {
  const now = Date.now();
  const windowStart = now - (24 * 60 * 60 * 1000); // 24 hours ago
  
  let totalAttempts = 0;
  let recentAttempts = 0;
  let blockedCount = 0;
  
  adminLoginAttempts.forEach((attempts, ip) => {
    totalAttempts += attempts.length;
    const recent = attempts.filter(t => t > windowStart).length;
    recentAttempts += recent;
  });
  
  blockedIPs.forEach((block, ip) => {
    if (block.unblockTime > now) blockedCount++;
  });
  
  return {
    totalLoginAttempts: totalAttempts,
    recentLoginAttempts: recentAttempts,
    currentlyBlockedIPs: blockedCount,
    activeAdminSessions: 0, // This would need session tracking implementation
  };
};

/**
 * Clear admin login history for an IP
 * @param {string} ip - IP address to clear
 * @returns {boolean} - Whether history was cleared
 */
const clearAdminLoginHistory = (ip) => {
  const cleared = adminLoginAttempts.has(ip);
  adminLoginAttempts.delete(ip);
  blockedIPs.delete(ip);
  return cleared;
};

module.exports = {
  getActorFromReq,
  isIPBlocked,
  blockIP,
  recordLoginAttempt,
  canPremierActForAny,
  getAdminSession,
  validateAdminCredentials,
  getAdminActivitySummary,
  clearAdminLoginHistory,
};
