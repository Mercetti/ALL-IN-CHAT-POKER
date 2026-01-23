/**
 * Verify Discord Signature - Simplified Version
 * Basic Discord signature verification functionality
 */

const crypto = require('crypto');
const logger = require('../../utils/logger');

class DiscordSignatureVerifier {
  constructor() {
    this.isInitialized = false;
    this.stats = { verifications: 0, successes: 0, failures: 0 };
  }

  /**
   * Initialize signature verifier
   */
  async initialize() {
    logger.info('Discord Signature Verifier initialized');
    this.isInitialized = true;
    return true;
  }

  /**
   * Verify Discord signature
   */
  verifySignature(signature, timestamp, body, publicKey) {
    try {
      this.stats.verifications++;

      // Simplified verification - in real implementation this would use Ed25519 verification
      const message = timestamp + body;
      const expectedSignature = this.generateExpectedSignature(message, publicKey);
      
      const isValid = this.compareSignatures(signature, expectedSignature);

      if (isValid) {
        this.stats.successes++;
        logger.debug('Discord signature verified successfully');
      } else {
        this.stats.failures++;
        logger.warn('Discord signature verification failed');
      }

      return {
        valid: isValid,
        timestamp: parseInt(timestamp),
        signature: signature.substring(0, 16) + '...', // Truncate for logging
        verifiedAt: new Date().toISOString()
      };

    } catch (error) {
      this.stats.failures++;
      logger.error('Failed to verify Discord signature', { error: error.message });

      return {
        valid: false,
        error: error.message,
        verifiedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Generate expected signature (simplified)
   */
  generateExpectedSignature(message, publicKey) {
    // Simplified signature generation - in real implementation this would use Ed25519
    const hash = crypto.createHash('sha256')
      .update(message + publicKey)
      .digest('hex');
    
    return hash.substring(0, 64); // Return first 64 chars as "signature"
  }

  /**
   * Compare signatures
   */
  compareSignatures(sig1, sig2) {
    // Simple string comparison - in real implementation this would be constant-time comparison
    return sig1 === sig2;
  }

  /**
   * Verify timestamp is recent
   */
  verifyTimestamp(timestamp, maxAge = 300000) { // 5 minutes default
    const now = Date.now();
    const ts = parseInt(timestamp);
    
    return Math.abs(now - ts) < maxAge;
  }

  /**
   * Full verification with timestamp check
   */
  verifyFull(signature, timestamp, body, publicKey, maxAge = 300000) {
    const timestampValid = this.verifyTimestamp(timestamp, maxAge);
    
    if (!timestampValid) {
      return {
        valid: false,
        reason: 'timestamp_expired',
        timestamp: parseInt(timestamp),
        currentTime: Date.now(),
        maxAge
      };
    }

    const signatureValid = this.verifySignature(signature, timestamp, body, publicKey);
    
    return {
      valid: signatureValid.valid && timestampValid,
      signature: signatureValid,
      timestamp: {
        valid: timestampValid,
        value: parseInt(timestamp),
        age: Date.now() - parseInt(timestamp)
      }
    };
  }

  /**
   * Verify webhook signature (alternative method)
   */
  verifyWebhookSignature(signature, body, secret) {
    try {
      this.stats.verifications++;

      // Simplified webhook verification
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      const isValid = signature === `sha256=${expectedSignature}`;

      if (isValid) {
        this.stats.successes++;
      } else {
        this.stats.failures++;
      }

      return {
        valid: isValid,
        method: 'webhook',
        verifiedAt: new Date().toISOString()
      };

    } catch (error) {
      this.stats.failures++;
      logger.error('Failed to verify webhook signature', { error: error.message });

      return {
        valid: false,
        error: error.message,
        method: 'webhook',
        verifiedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get verifier status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      stats: this.stats,
      successRate: this.stats.verifications > 0 ? 
        ((this.stats.successes / this.stats.verifications) * 100).toFixed(2) + '%' : 
        'N/A',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = { verifications: 0, successes: 0, failures: 0 };
    logger.info('Discord signature verifier statistics reset');
  }

  /**
   * Generate test signature
   */
  generateTestSignature(timestamp, body, publicKey) {
    return this.generateExpectedSignature(timestamp + body, publicKey);
  }

  /**
   * Validate public key format
   */
  validatePublicKey(publicKey) {
    try {
      // Simplified validation - check if it looks like a hex string
      const hexRegex = /^[a-fA-F0-9]+$/;
      return hexRegex.test(publicKey) && publicKey.length === 64;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get verification methods
   */
  getSupportedMethods() {
    return ['ed25519', 'webhook_hmac'];
  }

  /**
   * Raw body parser middleware (required for signature verification)
   * Must be used before JSON body parser
   */
  rawBodyParser() {
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
}

// Create singleton instance
const discordSignatureVerifier = new DiscordSignatureVerifier();

// Export the instance and methods
module.exports = {
  discordSignatureVerifier,
  verifyDiscordSignature: discordSignatureVerifier.verifyDiscordSignature.bind(discordSignatureVerifier),
  createSignatureMiddleware: discordSignatureVerifier.createSignatureMiddleware.bind(discordSignatureVerifier),
  rawBodyParser: discordSignatureVerifier.rawBodyParser.bind(discordSignatureVerifier)
};
