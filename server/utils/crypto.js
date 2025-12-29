/**
 * Cryptographic utility functions for sensitive data handling
 */

const crypto = require('crypto');

/**
 * Derive encryption key from JWT_SECRET
 * @returns {Buffer} - Derived key for encryption
 */
const deriveSensitiveKey = () => crypto.createHash('sha256').update(process.env.JWT_SECRET || 'fallback-secret').digest();

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param {string} value - Data to encrypt
 * @returns {Object} - Encrypted data with IV
 */
const encryptSensitive = (value) => {
  if (!value) return { data: null, iv: null };
  
  const key = deriveSensitiveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return { data: Buffer.concat([enc, tag]), iv };
};

/**
 * Decrypt sensitive data using AES-256-GCM
 * @param {Buffer} data - Encrypted data
 * @param {Buffer} iv - Initialization vector
 * @returns {string|null} - Decrypted data or null if failed
 */
const decryptSensitive = (data, iv) => {
  if (!data || !iv) return null;
  
  try {
    const key = deriveSensitiveKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    
    // Split tag from encrypted data (last 16 bytes are the auth tag)
    const tag = data.slice(data.length - 16);
    const enc = data.slice(0, data.length - 16);
    
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    
    return dec.toString('utf8');
  } catch (error) {
    return null;
  }
};

/**
 * Generate HMAC signature for checkout verification
 * @param {string} login - User login
 * @param {string} packId - Package ID
 * @param {string} orderId - Order ID
 * @returns {string} - HMAC signature
 */
const signCheckout = (login, packId, orderId) => {
  const h = crypto.createHmac('sha256', process.env.CHECKOUT_SIGNING_SECRET);
  h.update(`${login}:${packId}:${orderId}`);
  return h.digest('hex');
};

/**
 * Verify checkout signature
 * @param {string} login - User login
 * @param {string} packId - Package ID
 * @param {string} orderId - Order ID
 * @param {string} signature - Signature to verify
 * @returns {boolean} - Whether signature is valid
 */
const verifyCheckoutSignature = (login, packId, orderId, signature) => {
  const expectedSignature = signCheckout(login, packId, orderId);
  return signature === expectedSignature;
};

/**
 * Generate random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Hex-encoded token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash password using bcrypt-like approach with crypto
 * @param {string} password - Password to hash
 * @param {string} salt - Salt value
 * @returns {string} - Hashed password
 */
const hashPassword = (password, salt) => {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
};

module.exports = {
  deriveSensitiveKey,
  encryptSensitive,
  decryptSensitive,
  signCheckout,
  verifyCheckoutSignature,
  generateToken,
  hashPassword,
};
