/**
 * AI Code Quality Guardian
 * Integrates with AI coding systems to prevent orphaned code and maintain clean code standards
 */

class AICodeQualityGuardian {
  constructor() {
    this.rules = {
      duplicateDetection: true,
      serverListenCheck: true,
      moduleOrganization: true,
      importCleanup: true,
      refactoringDiscipline: true
    };
    
    this.functionRegistry = new Set();
    this.routeRegistry = new Map();
    this.importRegistry = new Set();
  }

  /**
   * Analyzes existing codebase before AI makes changes
   */
  async analyzeCodebase(filePath = 'server.js') {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    
    this.scanExistingFunctions(content);
    this.scanExistingRoutes(content);
    this.scanExistingImports(content);
    
    return {
      functionCount: this.functionRegistry.size,
      routeCount: this.routeRegistry.size,
      importCount: this.importRegistry.size,
      hasServerListen: content.includes('server.listen'),
      codeStructure: this.analyzeStructure(content)
    };
  }

  /**
   * Scans for existing function definitions
   */
  scanExistingFunctions(content) {
    const functionMatches = content.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g) || [];
    functionMatches.forEach(match => {
      const funcName = match.replace(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/, '$1');
      this.functionRegistry.add(funcName);
    });
  }

  /**
   * Scans for existing route definitions
   */
  scanExistingRoutes(content) {
    const routeMatches = content.match(/app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g) || [];
    routeMatches.forEach(match => {
      const routeMatch = match.match(/app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (routeMatch) {
        const method = routeMatch[1].toUpperCase();
        const path = routeMatch[2];
        this.routeRegistry.set(`${method}:${path}`, match);
      }
    });
  }

  /**
   * Scans for existing imports
   */
  scanExistingImports(content) {
    const importMatches = content.match(/const\s+.*=\s*require\(['"`]([^'"`]+)['"`]\)/g) || [];
    importMatches.forEach(match => {
      const pathMatch = match.match(/require\(['"`]([^'"`]+)['"`]\)/);
      if (pathMatch) {
        this.importRegistry.add(pathMatch[1]);
      }
    });
  }

  /**
   * Analyzes code structure for quality metrics
   */
  analyzeStructure(content) {
    const lines = content.split('\n');
    return {
      totalLines: lines.length,
      hasMultipleServerListen: (content.match(/server\.listen/g) || []).length > 1,
      hasConsoleStatements: content.includes('console.'),
      hasTodoComments: content.includes('TODO') || content.includes('FIXME'),
      complexity: this.calculateComplexity(content)
    };
  }

  /**
   * Validates AI-generated code before insertion
   */
  validateGeneratedCode(code, context = {}) {
    const issues = [];
    
    // Check for duplicate functions
    const newFunctions = this.extractFunctions(code);
    newFunctions.forEach(funcName => {
      if (this.functionRegistry.has(funcName)) {
        issues.push({
          type: 'duplicate-function',
          message: `Function '${funcName}' already exists`,
          suggestion: `Rename function or remove existing version`
        });
      }
    });

    // Check for duplicate routes
    const newRoutes = this.extractRoutes(code);
    newRoutes.forEach(route => {
      const routeKey = `${route.method}:${route.path}`;
      if (this.routeRegistry.has(routeKey)) {
        issues.push({
          type: 'duplicate-route',
          message: `Route ${routeKey} already exists`,
          suggestion: `Update existing route or use different path`
        });
      }
    });

    // Check for additional server.listen calls
    const serverListenMatches = code.match(/server\.listen/g);
    if (serverListenMatches && serverListenMatches.length > 0) {
      issues.push({
        type: 'server-listen',
        message: 'server.listen() call detected',
        suggestion: 'Remove server.listen() - should only be called once at end of file'
      });
    }

    // Check for orphaned code patterns
    if (this.looksLikeOrphanedCode(code, context)) {
      issues.push({
        type: 'orphaned-code',
        message: 'Code appears to be orphaned (function definitions without proper integration)',
        suggestion: 'Move to appropriate module or integrate properly with existing code'
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions: this.generateSuggestions(code, issues)
    };
  }

  /**
   * Extracts function names from code
   */
  extractFunctions(code) {
    const matches = code.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g) || [];
    return matches.map(match => match.replace(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/, '$1'));
  }

  /**
   * Extracts route definitions from code
   */
  extractRoutes(code) {
    const matches = code.match(/app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g) || [];
    return matches.map(match => {
      const routeMatch = match.match(/app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/);
      return {
        method: routeMatch[1].toUpperCase(),
        path: routeMatch[2]
      };
    });
  }

  /**
   * Detects if code looks like orphaned code
   */
  looksLikeOrphanedCode(code, context) {
    // Heuristics for detecting orphaned code
    const indicators = [
      /function\s+\w+.*\{[\s\S]*?\}/, // Standalone function definitions
      /const\s+\w+\s*=\s*function/, // Function expressions
      /app\.(get|post|put|delete)/, // Route definitions
      /process\.on\(/, // Event handlers
      /setInterval\(/, // Timers
    ];

    const hasFunctionDefinitions = indicators.some(pattern => pattern.test(code));
    const lacksIntegration = !code.includes('module.exports') && !code.includes('exports');
    const isLargeBlock = code.split('\n').length > 10;

    return hasFunctionDefinitions && (lacksIntegration || isLargeBlock);
  }

  /**
   * Calculates code complexity
   */
  calculateComplexity(content) {
    const complexityIndicators = [
      /if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g
    ];

    let complexity = 1;
    complexityIndicators.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  /**
   * Generates improvement suggestions for AI
   */
  generateSuggestions(code, issues) {
    const suggestions = [];

    if (issues.some(i => i.type === 'duplicate-function')) {
      suggestions.push({
        action: 'refactor-to-module',
        description: 'Consider moving duplicate functions to separate modules',
        example: `
// Instead of duplicate functions, create:
// server/game-actions/poker-actions.js
module.exports = {
  pokerFoldAction,
  pokerCallAction,
  pokerRaiseAction
};

// Then in server.js:
const { pokerFoldAction, pokerCallAction, pokerRaiseAction } = require('./game-actions/poker-actions');
        `
      });
    }

    if (issues.some(i => i.type === 'orphaned-code')) {
      suggestions.push({
        action: 'integrate-properly',
        description: 'Integrate code with existing structure or move to appropriate module',
        example: `
// Proper integration pattern:
// 1. Move to module file
// 2. Export properly
// 3. Import in main file
// 4. Use in appropriate context
        `
      });
    }

    return suggestions;
  }

  /**
   * Provides AI with coding guidelines
   */
  getCodingGuidelines() {
    return {
      structure: {
        serverFile: {
          maxLines: 300,
          singleServerListen: true,
          moduleImports: 'top',
          routes: 'grouped by feature',
          errorHandling: 'centralized'
        },
        modules: {
          naming: 'kebab-case',
          exports: 'explicit',
          dependencies: 'minimal',
          singleResponsibility: true
        }
      },
      patterns: {
        refactoring: 'always delete old code when moving to modules',
        duplication: 'never duplicate functions or routes',
        imports: 'remove unused imports',
        logging: 'use logger instead of console',
        configuration: 'no hardcoded values'
      },
      validation: {
        beforeInsert: 'always validate with validateGeneratedCode()',
        afterInsert: 'update registries',
        periodic: 'run cleanup scripts weekly'
      }
    };
  }

  /**
   * Updates registries after successful code insertion
   */
  updateRegistries(addedCode) {
    const newFunctions = this.extractFunctions(addedCode);
    newFunctions.forEach(funcName => this.functionRegistry.add(funcName));

    const newRoutes = this.extractRoutes(addedCode);
    newRoutes.forEach(route => {
      const routeKey = `${route.method}:${route.path}`;
      this.routeRegistry.set(routeKey, addedCode);
    });
  }

  /**
   * Generates cleanup suggestions for existing codebase
   */
  generateCleanupSuggestions() {
    return {
      immediate: [
        'Remove duplicate server.listen() calls',
        'Consolidate duplicate function definitions',
        'Move standalone functions to modules',
        'Remove unused imports',
        'Replace console.log with logger'
      ],
      structural: [
        'Split large files (>300 lines) into modules',
        'Group related routes together',
        'Create dedicated modules for game logic',
        'Separate configuration from code'
      ],
      preventive: [
        'Set up pre-commit hooks for duplicate detection',
        'Configure ESLint rules for code quality',
        'Implement automated testing for refactoring',
        'Schedule regular cleanup sprints'
      ]
    };
  }
}

module.exports = AICodeQualityGuardian;
