/**
 * Discord Signature Verification Utility
 * Required for all Discord interaction endpoints
 * Uses Ed25519 signature verification with tweetnacl
 */

const nacl = require('tweetnacl');

/**
 * Verify Discord request signature
 * @param {string} signature - X-Signature-Ed25519 header
 * @param {string} timestamp - X-Signature-Timestamp header  
 * @param {string} body - Raw request body
 * @param {string} publicKey - Discord application public key
 * @returns {boolean} - True if signature is valid
 */
function verifyDiscordSignature(signature, timestamp, body, publicKey) {
  try {
    // Validate inputs
    if (!signature || !timestamp || !body || !publicKey) {
      console.error('❌ Missing signature verification parameters');
      return false;
    }
    
    // Convert public key from hex to Uint8Array
    const publicKeyBytes = Buffer.from(publicKey, 'hex');
    
    // Create message to verify: timestamp + body
    const message = Buffer.from(timestamp + body);
    
    // Convert signature from hex to Uint8Array
    const signatureBytes = Buffer.from(signature, 'hex');
    
    // Verify signature using nacl
    const isValid = nacl.sign.detached.verify(
      message,
      signatureBytes,
      publicKeyBytes
    );
    
    if (!isValid) {
      console.warn('⚠️ Invalid Discord signature detected');
    }
    
    return isValid;
    
  } catch (error) {
    console.error('❌ Signature verification error:', error.message);
    return false;
  }
}

/**
 * Express middleware for Discord signature verification
 * @param {string} publicKey - Discord application public key
 * @returns {Function} Express middleware function
 */
function createSignatureMiddleware(publicKey) {
  return (req, res, next) => {
    const signature = req.header('X-Signature-Ed25519');
    const timestamp = req.header('X-Signature-Timestamp');
    const body = req.rawBody || JSON.stringify(req.body);
    
    if (!verifyDiscordSignature(signature, timestamp, body, publicKey)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    next();
  };
}

/**
 * Raw body parser middleware (required for signature verification)
 * Must be used before JSON body parser
 */
function rawBodyParser() {
  return (req, res, next) => {
    const chunks = [];
    
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      req.rawBody = Buffer.concat(chunks).toString('utf8');
      next();
    });
    
    req.on('error', error => {
      console.error('❌ Raw body parser error:', error);
      res.status(400).json({ error: 'Invalid request body' });
    });
  };
}

module.exports = {
  verifyDiscordSignature,
  createSignatureMiddleware,
  rawBodyParser
};
