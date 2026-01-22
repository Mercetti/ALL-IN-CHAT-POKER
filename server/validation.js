/**
 * Input validation and sanitization utilities
 */

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean}
 */
function validateUsername(username) {
  if (typeof username !== 'string') return false;
  const cleaned = username.trim();
  // Allow alphanumeric, underscore, hyphen; 3-20 characters
  return /^[a-zA-Z0-9_-]{3,20}$/.test(cleaned);
}

/**
 * Validate IP address
 * @param {string} ip - IP to validate
 * @returns {boolean}
 */
function validateIP(ip) {
  if (typeof ip !== 'string') return false;
  // Simple IPv4 or IPv6 validation
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  const ipv6 = /^([\da-f]{0,4}:){2,7}[\da-f]{0,4}$/i.test(ip);
  return ipv4 || ipv6;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean}
 */
function validatePassword(password) {
  if (typeof password !== 'string') return false;
  // Min 8 chars, at least one uppercase, one lowercase, one number
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

/**
 * Validate Twitch login name
 * @param {string} login - Twitch login to validate
 * @returns {boolean}
 */
function validateTwitchLogin(login) {
  if (typeof login !== 'string') return false;
  const cleaned = login.trim().toLowerCase();
  // Twitch usernames: 4-25 chars, alphanumeric + underscore
  return /^[a-z0-9_]{4,25}$/.test(cleaned);
}

/**
 * Validate a number is within range
 * @param {any} value - Value to validate
 * @param {number} min - Minimum (inclusive)
 * @param {number} max - Maximum (inclusive)
 * @returns {boolean}
 */
function validateNumber(value, min = -Infinity, max = Infinity) {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Sanitize string (remove HTML/special chars)
 * @param {string} str - String to sanitize
 * @returns {string}
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 1000); // Limit length
}

/**
 * Sanitize a URL (simple allowlist for http/https)
 * @param {string} url
 * @returns {string}
 */
function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return '';
  return trimmed.substring(0, 1000);
}

/**
 * Validate object properties against schema
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Schema object: { key: validator_function }
 * @returns {boolean}
 */
function validateObject(obj, schema) {
  if (typeof obj !== 'object' || obj === null) return false;
  return Object.entries(schema).every(([key, validator]) => {
    return validator(obj[key]);
}

module.exports = {
  validateUsername,
  validateIP,
  validatePassword,
  validateTwitchLogin,
  validateNumber,
  sanitizeString,
  sanitizeUrl,
  validateObject,
};
