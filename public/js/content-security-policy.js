/**
 * Content Security Policy (CSP) Implementation
 * Implements CSP headers and inline script handling
 */

class ContentSecurityPolicy {
  constructor(options = {}) {
    this.options = {
      enableCSP: true,
      reportOnly: false,
      enableNonce: true,
      enableHash: true,
      reportEndpoint: null,
      policies: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "data:", "https:"],
        'font-src': ["'self'", "https:"],
        'connect-src': ["'self'", "https:", "wss:", "ws:"],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'child-src': ["'none'"],
        'frame-src': ["'none'"],
        'worker-src': ["'self'"],
        'manifest-src': ["'self'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': []
      },
      customPolicies: {},
      ...options
    };
    
    this.nonces = new Set();
    this.hashes = new Map();
    this.violations = [];
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    if (!this.options.enableCSP) {
      return;
    }
    
    this.setupCSPHeaders();
    this.setupInlineHandling();
    this.setupViolationReporting();
    this.isInitialized = true;
  }

  setupCSPHeaders() {
    // This would typically be done on the server side
    // For client-side, we'll create a meta tag approach
    this.createCSPMetaTag();
  }

  createCSPMetaTag() {
    const policies = { ...this.options.policies, ...this.options.customPolicies };
    const cspString = this.buildCSPString(policies);
    
    // Create or update CSP meta tag
    let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!cspMeta) {
      cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      document.head.appendChild(cspMeta);
    }
    
    cspMeta.content = cspString;
    
    // Add report-only meta tag if enabled
    if (this.options.reportOnly) {
      let reportMeta = document.querySelector('meta[http-equiv="Content-Security-Policy-Report-Only"]');
      
      if (!reportMeta) {
        reportMeta = document.createElement('meta');
        reportMeta.httpEquiv = 'Content-Security-Policy-Report-Only';
        document.head.appendChild(reportMeta);
      }
      
      reportMeta.content = cspString;
    }
  }

  buildCSPString(policies) {
    const policyStrings = [];
    
    for (const [directive, values] of Object.entries(policies)) {
      if (values && values.length > 0) {
        policyStrings.push(`${directive} ${values.join(' ')}`);
      }
    }
    
    return policyStrings.join('; ');
  }

  setupInlineHandling() {
    // Handle inline scripts with nonces
    if (this.options.enableNonce) {
      this.processInlineScripts();
    }
    
    // Handle inline styles with hashes
    if (this.options.enableHash) {
      this.processInlineStyles();
    }
  }

  processInlineScripts() {
    const scripts = document.querySelectorAll('script:not([src]):not([nonce])');
    
    scripts.forEach(script => {
      const content = script.textContent || script.innerText;
      if (content.trim()) {
        const nonce = this.generateNonce();
        script.setAttribute('nonce', nonce);
        this.nonces.add(nonce);
      }
    });
  }

  processInlineStyles() {
    const styles = document.querySelectorAll('style:not([nonce])');
    
    styles.forEach(style => {
      const content = style.textContent || style.innerText;
      if (content.trim()) {
        const hash = this.generateHash(content);
        this.hashes.set('style', hash);
        
        // Update CSP to include the hash
        this.addHashToPolicy('style-src', `'sha256-${hash}'`);
      }
    });
  }

  generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  generateHash(content) {
    // Simple hash implementation (in production, use SHA-256)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  setupViolationReporting() {
    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleViolation(event);
    });
    
    // Setup report endpoint if specified
    if (this.options.reportEndpoint) {
      this.setupReportEndpoint();
    }
  }

  handleViolation(event) {
    const violation = {
      timestamp: new Date().toISOString(),
      blocked: event.blocked,
      documentURI: event.documentURI,
      referrer: event.referrer,
      violatedDirective: event.violatedDirective,
      effectiveDirective: event.effectiveDirective,
      originalPolicy: event.originalPolicy,
      disposition: event.disposition,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      statusCode: event.statusCode,
      sample: event.sample
    };
    
    this.violations.push(violation);
    
    // Log violation
    console.warn('CSP Violation:', violation);
    
    // Send to report endpoint if configured
    if (this.options.reportEndpoint) {
      this.sendViolationReport(violation);
    }
  }

  setupReportEndpoint() {
    // This would typically be handled by the server
    // For client-side, we'll use fetch if available
    if (typeof fetch !== 'undefined') {
      // Setup is ready, reports will be sent when violations occur
    }
  }

  sendViolationReport(violation) {
    if (typeof fetch !== 'undefined') {
      fetch(this.options.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'csp-report': {
            ...violation,
            'userAgent': navigator.userAgent,
            'timestamp': Date.now()
          }
        })
      }).catch(error => {
        console.error('Failed to send CSP violation report:', error);
      });
    }
  }

  // Public API methods
  
  addPolicy(directive, values) {
    if (Array.isArray(values)) {
      this.options.policies[directive] = values;
      this.updateCSPMetaTag();
    }
  }

  removePolicy(directive) {
    delete this.options.policies[directive];
    this.updateCSPMetaTag();
  }

  addHashToPolicy(directive, hash) {
    if (!this.options.policies[directive]) {
      this.options.policies[directive] = [];
    }
    
    if (!this.options.policies[directive].includes(hash)) {
      this.options.policies[directive].push(hash);
      this.updateCSPMetaTag();
    }
  }

  addNonceToPolicy(directive) {
    if (!this.options.policies[directive]) {
      this.options.policies[directive] = [];
    }
    
    // Add nonce placeholder (will be replaced with actual nonce)
    if (!this.options.policies[directive].includes("'nonce-")) {
      this.options.policies[directive].push("'nonce-");
      this.updateCSPMetaTag();
    }
  }

  updateCSPMetaTag() {
    const policies = { ...this.options.policies, ...this.options.customPolicies };
    const cspString = this.buildCSPString(policies);
    
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      cspMeta.content = cspString;
    }
  }

  generateNonceForScript(script) {
    const nonce = this.generateNonce();
    script.setAttribute('nonce', nonce);
    this.nonces.add(nonce);
    return nonce;
  }

  getViolations() {
    return [...this.violations];
  }

  clearViolations() {
    this.violations = [];
  }

  // Preset configurations
  
  static createStrictPolicy() {
    return new ContentSecurityPolicy({
      policies: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'", "data:"],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'child-src': ["'none'"],
        'frame-src': ["'none'"],
        'worker-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"]
      }
    });
  }
  
  static createDevelopmentPolicy() {
    return new ContentSecurityPolicy({
      policies: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "data:", "https:"],
        'font-src': ["'self'", "https:"],
        'connect-src': ["'self'", "https:", "wss:", "ws:"],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'child-src': ["'none'"],
        'frame-src': ["'none'"],
        'worker-src': ["'self'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"]
      }
    });
  }
  
  static createProductionPolicy() {
    return new ContentSecurityPolicy({
      policies: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'", "data:", "https:"],
        'font-src': ["'self'", "https:"],
        'connect-src': ["'self'", "https:", "wss:", "ws:"],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'child-src': ["'none'"],
        'frame-src': ["'none'"],
        'worker-src': ["'self'"],
        'manifest-src': ["'self'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': []
      }
    });
  }
}

// Create global instance based on environment
const isDevelopment = (
  process?.env?.NODE_ENV === 'development' ||
  window.location?.hostname === 'localhost' ||
  window.location?.hostname === '127.0.0.1' ||
  window.location?.port === '3000' ||
  window.location?.port === '5173' ||
  window.location?.port === '8080'
);

window.contentSecurityPolicy = isDevelopment 
  ? ContentSecurityPolicy.createDevelopmentPolicy()
  : ContentSecurityPolicy.createProductionPolicy();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentSecurityPolicy;
}
