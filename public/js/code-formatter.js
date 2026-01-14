/**
 * Code Formatting and Linting Rules
 * Standardizes code formatting and enforces consistent coding standards
 */

class CodeFormatter {
  constructor(options = {}) {
    this.options = {
      enableAutoFormatting: true,
      enableLinting: true,
      enableRealTimeValidation: true,
      maxLineLength: 100,
      indentSize: 2,
      indentType: 'spaces', // 'spaces' or 'tabs'
      enableSemicolons: true,
      enableTrailingCommas: true,
      quoteStyle: 'single', // 'single' or 'double'
      enableBracketSpacing: true,
      enableArrowFunctions: true,
      enableTemplateLiterals: true,
      enableDestructuring: true,
      enableAsyncAwait: true,
      ...options
    };
    
    this.lintingRules = new Map();
    this.formattingRules = new Map();
    this.validationResults = new Map();
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    this.setupLintingRules();
    this.setupFormattingRules();
    this.setupValidation();
    this.isInitialized = true;
  }

  setupLintingRules() {
    // JavaScript linting rules
    this.lintingRules.set('no-console', {
      description: 'Disallow console statements in production',
      severity: 'warning',
      check: (code) => /console\.(log|warn|error|debug|info)/.test(code),
      fix: (code) => code.replace(/console\.(log|warn|error|debug|info)\([^)]*\);?\s*/g, '')
    });
    
    this.lintingRules.set('no-unused-vars', {
      description: 'Disallow unused variables',
      severity: 'error',
      check: (code) => this.checkUnusedVariables(code),
      fix: (code) => this.removeUnusedVariables(code)
    });
    
    this.lintingRules.set('no-undef', {
      description: 'Disallow undeclared variables',
      severity: 'error',
      check: (code) => this.checkUndefinedVariables(code),
      fix: (code) => this.declareUndefinedVariables(code)
    });
    
    this.lintingRules.set('prefer-const', {
      description: 'Prefer const over let for variables that are not reassigned',
      severity: 'warning',
      check: (code) => this.checkPreferConst(code),
      fix: (code) => this.convertToConst(code)
    });
    
    this.lintingRules.set('no-var', {
      description: 'Disallow var keyword, use let or const instead',
      severity: 'error',
      check: (code) => /\bvar\b/.test(code),
      fix: (code) => code.replace(/\bvar\b/g, 'const')
    });
    
    this.lintingRules.set('eqeqeq', {
      description: 'Require === and !== instead of == and !=',
      severity: 'error',
      check: (code) => /==(?!=)|!=(?=)/.test(code),
      fix: (code) => code.replace(/==/g, '===').replace(/!=/g, '!==')
    });
    
    this.lintingRules.set('no-trailing-spaces', {
      description: 'Disallow trailing spaces at end of lines',
      severity: 'warning',
      check: (code) => /[ \t]+$/gm.test(code),
      fix: (code) => code.replace(/[ \t]+$/gm, '')
    });
    
    this.lintingRules.set('no-multiple-empty-lines', {
      description: 'Disallow multiple empty lines',
      severity: 'warning',
      check: (code) => /\n{3,}/.test(code),
      fix: (code) => code.replace(/\n{3,}/g, '\n\n')
    });
    
    this.lintingRules.set('object-curly-spacing', {
      description: 'Require spaces inside curly braces',
      severity: 'warning',
      check: (code) => /{[^ ]|[^ ]}/.test(code),
      fix: (code) => code.replace(/{([^ ])/g, '{ $1').replace(/([^ ])}/g, '$1 }')
    });
    
    this.lintingRules.set('array-bracket-spacing', {
      description: 'Require spaces inside array brackets',
      severity: 'warning',
      check: (code) => /\[[^ ]|[^ ]\]/.test(code),
      fix: (code) => code.replace(/\[([^ ])/g, '[ $1').replace(/([^ ])\]/g, '$1 ]')
    });
    
    this.lintingRules.set('comma-dangle', {
      description: 'Require trailing commas in multiline objects/arrays',
      severity: 'warning',
      check: (code) => this.checkTrailingCommas(code),
      fix: (code) => this.addTrailingCommas(code)
    });
  }

  setupFormattingRules() {
    // Code formatting rules
    this.formattingRules.set('indentation', {
      description: 'Use consistent indentation',
      apply: (code) => this.formatIndentation(code)
    });
    
    this.formattingRules.set('line-length', {
      description: 'Limit line length',
      apply: (code) => this.formatLineLength(code)
    });
    
    this.formattingRules.set('quotes', {
      description: 'Use consistent quote style',
      apply: (code) => this.formatQuotes(code)
    });
    
    this.formattingRules.set('semicolons', {
      description: 'Add semicolons where required',
      apply: (code) => this.formatSemicolons(code)
    });
    
    this.formattingRules.set('bracket-spacing', {
      description: 'Add spaces around brackets',
      apply: (code) => this.formatBracketSpacing(code)
    });
    
    this.formattingRules.set('function-spacing', {
      description: 'Add spaces around function keywords',
      apply: (code) => this.formatFunctionSpacing(code)
    });
    
    this.formattingRules.set('operator-spacing', {
      description: 'Add spaces around operators',
      apply: (code) => this.formatOperatorSpacing(code)
    });
    
    this.formattingRules.set('object-property-spacing', {
      description: 'Add spaces around object properties',
      apply: (code) => this.formatObjectPropertySpacing(code)
    });
  }

  setupValidation() {
    if (this.options.enableRealTimeValidation) {
      this.setupRealTimeValidation();
    }
  }

  setupRealTimeValidation() {
    // Monitor for code changes in development
    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.tagName === 'SCRIPT' && node.textContent) {
                this.validateCode(node.textContent);
              }
            });
          }
        });
      });
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Linting methods
  
  checkUnusedVariables(code) {
    const variables = this.extractVariables(code);
    const usedVariables = this.extractUsedVariables(code);
    
    return variables.filter(variable => !usedVariables.includes(variable));
  }

  extractVariables(code) {
    const variables = [];
    const patterns = [
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }

  extractUsedVariables(code) {
    const usedVariables = [];
    const pattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    let match;
    
    while ((match = pattern.exec(code)) !== null) {
      usedVariables.push(match[1]);
    }
    
    return usedVariables;
  }

  checkUndefinedVariables(code) {
    const usedVariables = this.extractUsedVariables(code);
    const declaredVariables = this.extractVariables(code);
    const globalVariables = ['window', 'document', 'console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'];
    
    return usedVariables.filter(variable => 
      !declaredVariables.includes(variable) && 
      !globalVariables.includes(variable)
    );
  }

  checkPreferConst(code) {
    const constCandidates = [];
    const pattern = /let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;
    
    while ((match = pattern.exec(code)) !== null) {
      const variableName = match[1];
      const reassignments = code.match(new RegExp(`\\b${variableName}\\s*=`, 'g'));
      
      if (!reassignments || reassignments.length === 0) {
        constCandidates.push(variableName);
      }
    }
    
    return constCandidates;
  }

  convertToConst(code) {
    return code.replace(/\blet\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, (match, variableName) => {
      const reassignments = code.match(new RegExp(`\\b${variableName}\\s*=`, 'g'));
      if (!reassignments || reassignments.length === 0) {
        return `const ${variableName}`;
      }
      return match;
    });
  }

  removeUnusedVariables(code) {
    const unusedVars = this.checkUnusedVariables(code);
    let formattedCode = code;
    
    for (const variable of unusedVars) {
      // Remove variable declarations
      formattedCode = formattedCode.replace(
        new RegExp(`(?:const|let|var)\\s+${variable}\\s*=\\s*[^;]+;?\\s*`, 'g'),
        ''
      );
    }
    
    return formattedCode;
  }

  declareUndefinedVariables(code) {
    const undefinedVars = this.checkUndefinedVariables(code);
    let formattedCode = code;
    
    for (const variable of undefinedVars) {
      // Add variable declaration at the beginning
      formattedCode = `let ${variable};\n${formattedCode}`;
    }
    
    return formattedCode;
  }

  checkTrailingCommas(code) {
    const multilineObjects = code.match(/\{[^}]*\n[^}]*\}/g) || [];
    const multilineArrays = code.match(/\[[^\]]*\n[^\]]*\]/g) || [];
    
    const issues = [];
    
    [...multilineObjects, ...multilineArrays].forEach(item => {
      if (!item.trim().endsWith(',')) {
        issues.push(item);
      }
    });
    
    return issues;
  }

  addTrailingCommas(code) {
    return code
      .replace(/(\n\s*)([}\]])/g, ',$1$2')
      .replace(/,(\s*[}\]])/g, '$1');
  }

  // Formatting methods
  
  formatIndentation(code) {
    const lines = code.split('\n');
    const indentChar = this.options.indentType === 'spaces' ? ' ' : '\t';
    const indentSize = this.options.indentType === 'spaces' ? this.options.indentSize : 1;
    
    let formattedLines = [];
    let currentIndent = 0;
    
    for (let line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        formattedLines.push('');
        continue;
      }
      
      // Decrease indent for closing braces
      if (trimmedLine.startsWith('}') || trimmedLine.startsWith(']') || trimmedLine.startsWith(')')) {
        currentIndent = Math.max(0, currentIndent - 1);
      }
      
      // Apply indentation
      const indent = indentChar.repeat(currentIndent * indentSize);
      formattedLines.push(indent + trimmedLine);
      
      // Increase indent for opening braces
      if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[') || trimmedLine.endsWith('(')) {
        currentIndent++;
      }
    }
    
    return formattedLines.join('\n');
  }

  formatLineLength(code) {
    const lines = code.split('\n');
    const formattedLines = [];
    
    for (let line of lines) {
      if (line.length <= this.options.maxLineLength) {
        formattedLines.push(line);
        continue;
      }
      
      // Break long lines at logical points
      const formattedLine = this.breakLongLine(line);
      formattedLines.push(...formattedLine);
    }
    
    return formattedLines.join('\n');
  }

  breakLongLine(line) {
    const breakPoints = [
      /,\s*/,
      /\s+(?:const|let|var|function|if|else|for|while|do|switch|case|return|try|catch|finally)\s+/,
      /\s+(?:&&|\|\||\+\+|--|===|!==|==|!=|<=|>=|<|>|\+|-|\*|\/|%)\s+/,
      /\s+\.\s+/,
      /\s+=>\s+/
    ];
    
    for (const breakpoint of breakPoints) {
      if (breakpoint.test(line)) {
        return line.split(breakpoint).map((part, index) => {
          if (index === 0) return part;
          return '  ' + part.trim();
        });
      }
    }
    
    // If no good break points, force break at max length
    const lines = [];
    let remainingLine = line;
    
    while (remainingLine.length > this.options.maxLineLength) {
      const breakIndex = remainingLine.lastIndexOf(' ', this.options.maxLineLength);
      if (breakIndex === -1) break;
      
      lines.push(remainingLine.substring(0, breakIndex));
      remainingLine = '  ' + remainingLine.substring(breakIndex + 1);
    }
    
    lines.push(remainingLine);
    return lines;
  }

  formatQuotes(code) {
    if (this.options.quoteStyle === 'single') {
      return code.replace(/"/g, "'").replace(/'([^']*')/g, (match) => {
        return match.includes("'") ? match : match.replace(/'/g, '"');
      });
    } else {
      return code.replace(/'/g, '"').replace(/"([^"]*")/g, (match) => {
        return match.includes('"') ? match : match.replace(/"/g, "'");
      });
    }
  }

  formatSemicolons(code) {
    if (this.options.enableSemicolons) {
      // Add missing semicolons
      return code
        .replace(/([^;\s])\s*\n/g, '$1;\n')
        .replace(/([^;\s])\s*$/gm, '$1;');
    } else {
      // Remove unnecessary semicolons
      return code.replace(/;\s*\n/g, '\n').replace(/;\s*$/gm, '');
    }
  }

  formatBracketSpacing(code) {
    if (this.options.enableBracketSpacing) {
      return code
        .replace(/{([^ ])/g, '{ $1')
        .replace(/([^ ])}/g, '$1 }')
        .replace(/\[([^ ])/g, '[ $1')
        .replace(/([^ ])\]/g, '$1 ]')
        .replace(/\(([^ ])/g, '( $1')
        .replace(/([^ ])\)/g, '$1 )');
    } else {
      return code
        .replace(/{\s+/g, '{')
        .replace(/\s+}/g, '}')
        .replace(/\[\s+/g, '[')
        .replace(/\s+\]/g, ']')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')');
    }
  }

  formatFunctionSpacing(code) {
    return code
      .replace(/function\s*\(/g, 'function (')
      .replace(/\)\s*{/g, ') {')
      .replace(/=>\s*{/g, '=> {');
  }

  formatOperatorSpacing(code) {
    return code
      .replace(/([=!<>]=?)\s*=/g, '$1 =')
      .replace(/([=!<>]=?)\s*([^=])/g, '$1 $2')
      .replace(/([^=!<>])\s*([=!<>]=?)/g, '$1 $2')
      .replace(/([+\-*/%])\s*=/g, '$1 =')
      .replace(/([+\-*/%])\s*([^=])/g, '$1 $2')
      .replace(/([^+\-*/%])\s*([+\-*/%])/g, '$1 $2');
  }

  formatObjectPropertySpacing(code) {
    return code
      .replace(/({)\s*([a-zA-Z_$])/g, '$1 $2')
      .replace(/([a-zA-Z0-9_$])\s*(:)/g, '$1 $2')
      .replace(/(:)\s*([a-zA-Z_$])/g, '$1 $2');
  }

  // Public API methods
  
  lint(code) {
    const issues = [];
    
    for (const [name, rule] of this.lintingRules) {
      if (rule.check(code)) {
        issues.push({
          rule: name,
          description: rule.description,
          severity: rule.severity,
          fixable: typeof rule.fix === 'function'
        });
      }
    }
    
    return issues;
  }

  format(code) {
    let formattedCode = code;
    
    for (const [name, rule] of this.formattingRules) {
      formattedCode = rule.apply(formattedCode);
    }
    
    return formattedCode;
  }

  fixLintingIssues(code) {
    let fixedCode = code;
    
    for (const [name, rule] of this.lintingRules) {
      if (rule.check(code) && typeof rule.fix === 'function') {
        fixedCode = rule.fix(fixedCode);
      }
    }
    
    return fixedCode;
  }

  validateCode(code) {
    const lintingIssues = this.lint(code);
    const formattedCode = this.format(code);
    
    const validation = {
      originalCode: code,
      formattedCode,
      lintingIssues,
      isValid: lintingIssues.filter(issue => issue.severity === 'error').length === 0,
      timestamp: new Date().toISOString()
    };
    
    this.validationResults.set(code, validation);
    
    if (this.options.enableLogging) {
      console.log('Code validation result:', validation);
    }
    
    return validation;
  }

  getValidationResult(code) {
    return this.validationResults.get(code);
  }

  getAllValidationResults() {
    return Array.from(this.validationResults.values());
  }

  // Configuration methods
  
  addLintingRule(name, rule) {
    this.lintingRules.set(name, rule);
  }

  addFormattingRule(name, rule) {
    this.formattingRules.set(name, rule);
  }

  removeLintingRule(name) {
    this.lintingRules.delete(name);
  }

  removeFormattingRule(name) {
    this.formattingRules.delete(name);
  }

  getLintingRules() {
    return Object.fromEntries(this.lintingRules);
  }

  getFormattingRules() {
    return Object.fromEntries(this.formattingRules);
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  // Export configuration
  
  exportConfiguration() {
    return {
      options: this.options,
      lintingRules: this.getLintingRules(),
      formattingRules: this.getFormattingRules()
    };
  }

  importConfiguration(config) {
    if (config.options) {
      this.updateOptions(config.options);
    }
    
    if (config.lintingRules) {
      for (const [name, rule] of Object.entries(config.lintingRules)) {
        this.addLintingRule(name, rule);
      }
    }
    
    if (config.formattingRules) {
      for (const [name, rule] of Object.entries(config.formattingRules)) {
        this.addFormattingRule(name, rule);
      }
    }
  }

  // Cleanup
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.lintingRules.clear();
    this.formattingRules.clear();
    this.validationResults.clear();
  }
}

// Create global instance
window.codeFormatter = new CodeFormatter({
  enableAutoFormatting: true,
  enableLinting: true,
  enableRealTimeValidation: true,
  maxLineLength: 100,
  indentSize: 2,
  indentType: 'spaces',
  enableSemicolons: true,
  enableTrailingCommas: true,
  quoteStyle: 'single',
  enableBracketSpacing: true,
  enableArrowFunctions: true,
  enableTemplateLiterals: true,
  enableDestructuring: true,
  enableAsyncAwait: true,
  enableLogging: true
});

// Global convenience methods
window.lintCode = (code) => window.codeFormatter.lint(code);
window.formatCode = (code) => window.codeFormatter.format(code);
window.fixCode = (code) => window.codeFormatter.fixLintingIssues(code);
window.validateCode = (code) => window.codeFormatter.validateCode(code);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CodeFormatter;
}
