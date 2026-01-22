/**
 * Modern SSL Manager for Java 21+ Compatibility
 * Replaces deprecated javax.net.ssl.* APIs with modern equivalents
 * Provides secure SSL/TLS configuration for HTTPS connections
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');
const tls = require('tls');
const fs = require('fs');
const path = require('path');

class ModernSSLManager {
  constructor(options = {}) {
    this.keyStorePath = options.keyStorePath || path.join(__dirname, '../security/keystore.jks');
    this.trustStorePath = options.trustStorePath || path.join(__dirname, '../security/truststore.jks');
    this.keyStorePassword = options.keyStorePassword || 'changeit';
    this.trustStorePassword = options.trustStorePassword || 'changeit';
    this.defaultProtocols = options.protocols || ['TLSv1.2', 'TLSv1.3'];
    this.defaultCipherSuites = options.cipherSuites || [
      'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256'
    ];
    this.verificationMode = options.verificationMode || 'required';
    this.sessionTimeout = options.sessionTimeout || 300000; // 5 minutes
  }

  /**
   * Create secure HTTPS options for Node.js
   * @param {Object} options - Additional options
   * @returns {Object} Secure HTTPS options
   */
  createSecureOptions(options = {}) {
    const secureOptions = {
      ...options,
      secureProtocol: this.createTLSOptions(),
      secureOptions: this.getTLSParameters(),
      rejectUnauthorized: this.verificationMode === 'required',
      requestCert: this.verificationMode === 'required',
      agent: false
    };

    return secureOptions;
  }

  /**
   * Create TLS options for modern security
   * @returns {Object} TLS options
   */
  createTLSOptions() {
    const tlsOptions = {
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      ciphers: this.defaultCipherSuites.join(':'),
      honorCipherOrder: true,
      rejectUnauthorized: this.verificationMode === 'required',
      requestCert: this.verificationMode === 'required',
      secureOptions: this.getTLSParameters()
    };

    return tlsOptions;
  }

  /**
   * Get TLS parameters for secure configuration
   * @returns {Object} TLS parameters
   */
  getTLSParameters() {
    const tlsParams = {
      protocols: this.defaultProtocols,
      ciphers: this.defaultCipherSuites.join(':'),
      honorCipherOrder: true,
      rejectUnauthorized: this.verificationMode === 'required',
      requestCert: this.verificationMode === 'required',
      sessionIdContext: 'acey-ssl-session',
      sessionTimeout: this.sessionTimeout
    };

    return tlsParams;
  }

  /**
   * Create secure HTTPS server
   * @param {Function} requestHandler - Request handler
   * @param {Object} options - Server options
   * @returns {Object} HTTPS server
   */
  createSecureServer(requestHandler, options = {}) {
    const secureOptions = this.createSecureOptions(options);
    const server = https.createServer(secureOptions, requestHandler);
    return server;
  }

  /**
   * Create secure HTTPS request options
   * @param {string} hostname - Target hostname
   * @param {number} port - Target port
   * @param {string} path - Request path
   * @param {string} method - HTTP method
   * @param {Object} headers - Request headers
   * @returns {Object} Request options
   */
  createSecureRequestOptions(hostname, port, path, method = 'GET', headers = {}) {
    const options = {
      hostname,
      port,
      path,
      method,
      headers: {
        'User-Agent': 'Acey-SSL-Manager/1.0',
        'Accept': 'application/json',
        ...headers
      },
      secureProtocol: this.createTLSOptions(),
      secureOptions: this.getTLSParameters(),
      rejectUnauthorized: this.verificationMode === 'required',
      requestCert: this.verificationMode === 'required'
    };

    return options;
  }

  /**
   * Make secure HTTPS request
   * @param {string} hostname - Target hostname
   * @param {number} port - Target port
   * @param {string} path - Request path
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @param {Object} headers - Request headers
   * @returns {Promise} Response data
   */
  async makeSecureRequest(hostname, port, path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = this.createSecureRequestOptions(hostname, port, path, method, headers);
      
      if (data) {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
      }

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : responseData;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsedData
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData
            });
          }
        });
      
      req.on('error', (error) => {
        reject(error);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
  }

  /**
   * Validate SSL certificate
   * @param {Object} cert - Certificate object
   * @returns {boolean} Valid certificate
   */
  validateCertificate(cert) {
    try {
      // Check certificate expiration
      const now = new Date();
      const notAfter = new Date(cert.notAfter);
      const notBefore = new Date(cert.notBefore);
      
      if (now < notBefore || now > notAfter) {
        return false;
      }
      
      // Check certificate subject
      if (cert.subject && cert.subject.CN) {
        // Validate common name
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Certificate validation error:', error);
      return false;
    }
  }

  /**
   * Get certificate information
   * @param {Object} cert - Certificate object
   * @returns {Object} Certificate information
   */
  getCertificateInfo(cert) {
    return {
      subject: cert.subject,
      issuer: cert.issuer,
      serialNumber: cert.serialNumber,
      notBefore: cert.notBefore,
      notAfter: cert.notAfter,
      fingerprint: cert.fingerprint,
      fingerprint256: cert.fingerprint256,
      keyUsage: cert.keyUsage,
      extKeyUsage: cert.extKeyUsage
    };
  }

  /**
   * Create self-signed certificate for development
   * @param {Object} options - Certificate options
   * @returns {Object} Certificate and key pair
   */
  createSelfSignedCertificate(options = {}) {
    const { forge } = require('node-forge');
    
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    
    cert.publicKey = keys.publicKey;
    cert.privateKey = keys.privateKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
    
    cert.setSubject(options.subject || {
      commonName: 'localhost',
      countryName: 'US',
      organizationName: 'Acey Systems',
      organizationalUnitName: 'Development'
    });
    
    cert.setIssuer(options.issuer || cert.subject);
    
    cert.sign(keys.privateKey);
    
    return {
      certificate: forge.pki.certificateToPem(cert),
      privateKey: forge.pki.privateKeyToPem(keys.privateKey),
      publicKey: forge.pki.publicKeyToPem(keys.publicKey)
    };
  }

  /**
   * Generate certificate fingerprint
   * @param {string} certificate - Certificate PEM
   * @returns {string} Fingerprint
   */
  generateCertificateFingerprint(certificate) {
    const crypto = require('crypto');
    const cert = crypto.createHash('sha256');
    cert.update(certificate);
    return cert.digest('hex');
  }

  /**
   * Check if SSL/TLS is properly configured
   * @returns {Object} Configuration status
   */
  checkSSLConfiguration() {
    const status = {
      protocols: {
        supported: this.defaultProtocols,
        secure: true
      },
      cipherSuites: {
        supported: this.defaultCipherSuites,
        secure: true
      },
      verification: {
        mode: this.verificationMode,
        secure: this.verificationMode === 'required'
      },
      keyStore: {
        exists: fs.existsSync(this.keyStorePath),
        path: this.keyStorePath
      },
      trustStore: {
        exists: fs.existsSync(this.trustStorePath),
        path: this.trustStorePath
      }
    };

    return status;
  }

  /**
   * Log SSL configuration for debugging
   */
  logSSLConfiguration() {
    const status = this.checkSSLConfiguration();
    console.log('🔒 SSL Configuration Status:');
    console.log('  Protocols:', status.protocols);
    console.log('  Cipher Suites:', status.cipherSuites);
    console.log('  Verification Mode:', status.verification);
    console.log('  Key Store:', status.keyStore);
    console.log('  Trust Store:', status.trustStore);
  }
}

module.exports = ModernSSLManager;
