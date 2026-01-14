/**
 * Eval/Function Usage Remover
 * Replaces dangerous eval() and Function() usage with safe alternatives
 */

class SafeEvalReplacer {
  constructor(options = {}) {
    this.options = {
      enableInDevelopment: false,
      allowMathExpressions: true,
      allowJSONParsing: true,
      customValidator: null,
      debugMode: false,
      ...options
    };
    
    this.isInitialized = false;
    this.originalEval = window.eval;
    this.originalFunction = window.Function;
    
    this.init();
  }

  init() {
    // Check if we're in development
    const isDevelopment = this.isDevelopmentEnvironment();
    
    if (isDevelopment && !this.options.enableInDevelopment) {
      if (this.options.debugMode) {
        console.log('Eval/Function usage preserved in development mode');
      }
      return;
    }
    
    this.setupSafeReplacements();
    this.isInitialized = true;
  }

  isDevelopmentEnvironment() {
    return (
      process?.env?.NODE_ENV === 'development' ||
      window.location?.hostname === 'localhost' ||
      window.location?.hostname === '127.0.0.1' ||
      window.location?.hostname === '0.0.0.0' ||
      window.location?.port === '3000' ||
      window.location?.port === '5173' ||
      window.location?.port === '8080' ||
      window.location?.href?.includes('localhost') ||
      window.location?.href?.includes('127.0.0.1')
    );
  }

  setupSafeReplacements() {
    const self = this;
    
    // Override eval with safe alternative
    window.eval = function(code) {
      return self.safeEval(code);
    };
    
    // Override Function constructor with safe alternative
    window.Function = function(...args) {
      return self.safeFunction(...args);
    };
    
    if (this.options.debugMode) {
      console.warn('Eval and Function replaced with safe alternatives');
    }
  }

  safeEval(code) {
    if (typeof code !== 'string') {
      throw new Error('Eval requires a string argument');
    }
    
    // Check for dangerous patterns
    if (this.containsDangerousCode(code)) {
      throw new Error('Dangerous code detected in eval');
    }
    
    // Allow simple math expressions
    if (this.options.allowMathExpressions && this.isMathExpression(code)) {
      return this.evaluateMathExpression(code);
    }
    
    // Allow JSON parsing
    if (this.options.allowJSONParsing && this.isJSONExpression(code)) {
      try {
        return JSON.parse(code);
      } catch (error) {
        throw new Error('Invalid JSON expression');
      }
    }
    
    // Custom validation
    if (this.options.customValidator) {
      const result = this.options.customValidator(code);
      if (result !== true) {
        throw new Error(result || 'Code validation failed');
      }
    }
    
    // If we reach here, eval is not allowed
    throw new Error('Eval usage is not allowed in production');
  }

  safeFunction(...args) {
    if (args.length === 0) {
      throw new Error('Function constructor requires arguments');
    }
    
    const lastArg = args[args.length - 1];
    const functionBody = typeof lastArg === 'string' ? lastArg : '';
    const parameters = args.slice(0, -1);
    
    // Check for dangerous patterns in function body
    if (this.containsDangerousCode(functionBody)) {
      throw new Error('Dangerous code detected in Function constructor');
    }
    
    // Custom validation
    if (this.options.customValidator) {
      const result = this.options.customValidator(functionBody);
      if (result !== true) {
        throw new Error(result || 'Function body validation failed');
      }
    }
    
    // Create safe function with limited scope
    try {
      return this.createSafeFunction(parameters, functionBody);
    } catch (error) {
      throw new Error('Function constructor usage is not allowed in production');
    }
  }

  containsDangerousCode(code) {
    const dangerousPatterns = [
      // Function access
      /constructor/i,
      /prototype/i,
      /__proto__/i,
      // Global object access
      /window\./i,
      /document\./i,
      /global\./i,
      /process\./i,
      // Dangerous methods
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      // File system access
      /require\s*\(/i,
      /import\s+/i,
      /export\s+/i,
      // Network access
      /fetch\s*\(/i,
      /XMLHttpRequest/i,
      /WebSocket/i,
      // Code execution
      /script\s*:/i,
      /data\s*:/i,
      /vbscript\s*:/i,
      // DOM manipulation
      /innerHTML\s*=/i,
      /outerHTML\s*=/i,
      /insertAdjacentHTML/i,
      // Cookie access
      /document\.cookie/i,
      // Local storage access
      /localStorage/i,
      /sessionStorage/i,
      // Location manipulation
      /location\s*=/i,
      /location\.href\s*=/i,
      /location\.replace/i,
      // Event handlers
      /on\w+\s*=/i,
      /addEventListener\s*\(/i,
      // Style injection
      /style\s*=/i,
      /cssText\s*=/i
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(code));
  }

  isMathExpression(code) {
    // Remove whitespace
    const cleaned = code.replace(/\s/g, '');
    
    // Check if it's a simple math expression
    const mathPattern = /^[\d+\-*/().\s]+$/;
    return mathPattern.test(cleaned);
  }

  evaluateMathExpression(code) {
    try {
      // Use Function constructor in a controlled way for math
      const mathFunction = new Function('return ' + code);
      return mathFunction();
    } catch (error) {
      throw new Error('Invalid math expression');
    }
  }

  isJSONExpression(code) {
    try {
      JSON.parse(code);
      return true;
    } catch (error) {
      return false;
    }
  }

  createSafeFunction(parameters, body) {
    // Create a function with limited scope
    const sandboxedCode = `
      "use strict";
      ${body}
    `;
    
    try {
      return new Function(...parameters, sandboxedCode);
    } catch (error) {
      throw new Error('Cannot create safe function');
    }
  }

  // Safe alternatives to common eval use cases
  
  // Safe JSON parsing
  static safeJSONParse(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Invalid JSON string');
    }
  }
  
  // Safe math evaluation
  static safeMathEval(expression) {
    // Only allow numbers, operators, and parentheses
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    if (sanitized !== expression) {
      throw new Error('Invalid math expression');
    }
    
    try {
      return Function('"use strict"; return (' + sanitized + ')')();
    } catch (error) {
      throw new Error('Cannot evaluate math expression');
    }
  }
  
  // Safe template string evaluation
  static safeTemplateEval(template, data) {
    if (typeof template !== 'string') {
      throw new Error('Template must be a string');
    }
    
    // Simple template replacement (no code execution)
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data.hasOwnProperty(key) ? data[key] : match;
    });
  }
  
  // Safe property access
  static safePropertyAccess(obj, path) {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      // Only allow safe property names
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(part)) {
        throw new Error('Invalid property name');
      }
      
      current = current[part];
    }
    
    return current;
  }
  
  // Restore original methods
  restore() {
    window.eval = this.originalEval;
    window.Function = this.originalFunction;
    
    if (this.options.debugMode) {
      console.log('Eval and Function restored to original');
    }
  }
  
  // Get original methods
  getOriginalEval() {
    return this.originalEval;
  }
  
  getOriginalFunction() {
    return this.originalFunction;
  }
  
  // Check if methods are overridden
  isOverridden() {
    return this.isInitialized;
  }
  
  // Cleanup
  destroy() {
    this.restore();
  }
}

// Create global instance
window.safeEvalReplacer = new SafeEvalReplacer({
  enableInDevelopment: false,
  allowMathExpressions: true,
  allowJSONParsing: true,
  debugMode: false
});

// Global convenience methods
window.safeJSONParse = SafeEvalReplacer.safeJSONParse;
window.safeMathEval = SafeEvalReplacer.safeMathEval;
window.safeTemplateEval = SafeEvalReplacer.safeTemplateEval;
window.safePropertyAccess = SafeEvalReplacer.safePropertyAccess;

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafeEvalReplacer;
}
