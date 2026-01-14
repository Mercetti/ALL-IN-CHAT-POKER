/**
 * Code Documentation System
 * Automatically generates and manages inline documentation for complex functions
 */

class CodeDocumentationGenerator {
  constructor(options = {}) {
    this.options = {
      enableAutoGeneration: true,
      enableTypeInference: true,
      enableExampleGeneration: true,
      enableComplexityAnalysis: true,
      complexityThreshold: 10, // Cyclomatic complexity threshold
      minFunctionLength: 15, // Minimum lines for documentation
      enableLogging: true,
      ...options
    };
    
    this.documentedFunctions = new Map();
    this.complexityCache = new Map();
    this.typeCache = new Map();
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    this.setupFunctionInterception();
    this.analyzeExistingCode();
    this.isInitialized = true;
  }

  setupFunctionInterception() {
    // Intercept function definitions to automatically document them
    const originalFunction = window.Function;
    const self = this;
    
    window.Function = function(...args) {
      const func = originalFunction.apply(this, args);
      
      // Auto-document complex functions
      if (self.options.enableAutoGeneration) {
        setTimeout(() => {
          self.analyzeFunction(func, args.join(','));
        }, 0);
      }
      
      return func;
    };
  }

  analyzeExistingCode() {
    // Analyze existing functions in the global scope
    const globalFunctions = this.getGlobalFunctions();
    
    for (const [name, func] of globalFunctions) {
      if (typeof func === 'function') {
        this.analyzeFunction(func, name);
      }
    }
  }

  getGlobalFunctions() {
    const functions = new Map();
    
    for (const key in window) {
      if (typeof window[key] === 'function' && key !== 'Function') {
        functions.set(key, window[key]);
      }
    }
    
    return functions;
  }

  analyzeFunction(func, name) {
    if (this.documentedFunctions.has(func)) {
      return; // Already documented
    }
    
    const analysis = this.performComplexityAnalysis(func);
    
    if (analysis.complexity >= this.options.complexityThreshold || 
        analysis.lineCount >= this.options.minFunctionLength) {
      
      const documentation = this.generateDocumentation(func, name, analysis);
      this.documentedFunctions.set(func, documentation);
      
      if (this.options.enableLogging) {
        console.log(`Generated documentation for ${name}:`, documentation);
      }
    }
  }

  performComplexityAnalysis(func) {
    if (this.complexityCache.has(func)) {
      return this.complexityCache.get(func);
    }
    
    const source = func.toString();
    const analysis = {
      complexity: this.calculateCyclomaticComplexity(source),
      lineCount: this.countLines(source),
      parameterCount: this.getParameterCount(source),
      hasLoops: /for|while|do\s+while/.test(source),
      hasConditionals: /if|else|switch|case/.test(source),
      hasTryCatch: /try|catch/.test(source),
      hasRecursion: this.hasRecursion(source, func.name),
      nestingDepth: this.calculateNestingDepth(source),
      cognitiveComplexity: this.calculateCognitiveComplexity(source)
    };
    
    this.complexityCache.set(func, analysis);
    return analysis;
  }

  calculateCyclomaticComplexity(source) {
    let complexity = 1; // Base complexity
    
    // Count decision points
    const decisionPoints = source.match(/\b(if|else|for|while|do|switch|case|catch|\?\s*:|\&\&|\|\|)\b/g);
    if (decisionPoints) {
      complexity += decisionPoints.length;
    }
    
    return complexity;
  }

  countLines(source) {
    return source.split('\n').length;
  }

  getParameterCount(source) {
    const match = source.match(/function\s*\(([^)]*)\)/);
    if (match) {
      return match[1].split(',').filter(p => p.trim()).length;
    }
    return 0;
  }

  hasRecursion(source, functionName) {
    return new RegExp(`\\b${functionName}\\s*\\(`).test(source);
  }

  calculateNestingDepth(source) {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }
    
    return maxDepth;
  }

  calculateCognitiveComplexity(source) {
    let complexity = 0;
    let nestingLevel = 0;
    
    const tokens = source.split(/\s+/);
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // Increment for decision points
      if (['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch'].includes(token)) {
        complexity += 1 + nestingLevel;
        if (['if', 'for', 'while', 'do', 'switch', 'catch'].includes(token)) {
          nestingLevel++;
        }
      }
      
      // Decrement nesting level
      if (token === '}' && i > 0 && tokens[i-1] === '{') {
        nestingLevel--;
      }
    }
    
    return complexity;
  }

  generateDocumentation(func, name, analysis) {
    const documentation = {
      name: name || 'anonymous',
      description: this.generateDescription(func, analysis),
      parameters: this.inferParameters(func),
      returns: this.inferReturnType(func),
      examples: this.generateExamples(func, name),
      complexity: analysis,
      tags: this.generateTags(analysis),
      bestPractices: this.generateBestPractices(analysis),
      performance: this.analyzePerformance(func),
      security: this.analyzeSecurity(func),
      timestamp: new Date().toISOString()
    };
    
    return documentation;
  }

  generateDescription(func, analysis) {
    const descriptions = [];
    
    if (analysis.complexity > 15) {
      descriptions.push('Complex function with multiple decision points');
    } else if (analysis.complexity > 10) {
      descriptions.push('Moderately complex function');
    }
    
    if (analysis.hasLoops) {
      descriptions.push('Contains iteration logic');
    }
    
    if (analysis.hasConditionals) {
      descriptions.push('Contains conditional logic');
    }
    
    if (analysis.hasTryCatch) {
      descriptions.push('Includes error handling');
    }
    
    if (analysis.hasRecursion) {
      descriptions.push('Uses recursive approach');
    }
    
    if (analysis.parameterCount > 3) {
      descriptions.push('Multiple parameters');
    }
    
    return descriptions.join('. ') || 'Function with standard logic';
  }

  inferParameters(func) {
    const source = func.toString();
    const paramMatch = source.match(/function\s*\(([^)]*)\)/);
    
    if (!paramMatch) {
      return [];
    }
    
    const paramString = paramMatch[1];
    const params = paramString.split(',').map(param => {
      const cleanParam = param.trim();
      const type = this.inferParameterType(cleanParam, source);
      
      return {
        name: cleanParam,
        type: type,
        description: this.generateParameterDescription(cleanParam, source),
        optional: cleanParam.includes('=') || cleanParam.includes('...')
      };
    });
    
    return params;
  }

  inferParameterType(paramName, source) {
    // Simple type inference based on usage patterns
    const patterns = {
      'string': new RegExp(`\\b${paramName}\\s*[+]|\\b${paramName}\\s*\\.`, 'g'),
      'number': new RegExp(`\\b${paramName}\\s*[+\\-*/]|\\b${paramName}\\s*>|\\b${paramName}\\s*<`, 'g'),
      'boolean': new RegExp(`\\b${paramName}\\s*[&|!]|\\b${paramName}\\s*===|\\b${paramName}\\s*!==`, 'g'),
      'array': new RegExp(`\\b${paramName}\\s*\\[|\\b${paramName}\\.forEach|\\b${paramName}\\.map`, 'g'),
      'object': new RegExp(`\\b${paramName}\\s*\\.|\\b${paramName}\\s*{`, 'g')
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(source)) {
        return type;
      }
    }
    
    return 'any';
  }

  generateParameterDescription(paramName, source) {
    // Generate description based on parameter usage
    if (paramName.toLowerCase().includes('callback')) {
      return 'Callback function to be executed';
    }
    
    if (paramName.toLowerCase().includes('options')) {
      return 'Configuration options object';
    }
    
    if (paramName.toLowerCase().includes('data')) {
      return 'Data to be processed';
    }
    
    if (paramName.toLowerCase().includes('element')) {
      return 'DOM element reference';
    }
    
    return 'Function parameter';
  }

  inferReturnType(func) {
    const source = func.toString();
    
    // Look for return statements
    const returnMatches = source.match(/return\s+([^;]+)/g);
    
    if (!returnMatches) {
      return { type: 'void', description: 'No return value' };
    }
    
    // Analyze return values
    const returnTypes = new Set();
    
    for (const match of returnMatches) {
      const returnValue = match.replace(/return\s+/, '');
      
      if (returnValue.includes('"') || returnValue.includes("'")) {
        returnTypes.add('string');
      } else if (returnValue.match(/^\d+$/)) {
        returnTypes.add('number');
      } else if (returnValue.includes('true') || returnValue.includes('false')) {
        returnTypes.add('boolean');
      } else if (returnValue.includes('[')) {
        returnTypes.add('array');
      } else if (returnValue.includes('{')) {
        returnTypes.add('object');
      } else if (returnValue.includes('new')) {
        returnTypes.add('object');
      } else if (returnValue.includes('Promise')) {
        returnTypes.add('Promise');
      }
    }
    
    const type = returnTypes.size === 1 ? 
      Array.from(returnTypes)[0] : 
      returnTypes.size > 1 ? 'mixed' : 'unknown';
    
    return {
      type,
      description: `Returns ${type}${returnTypes.size > 1 ? ' or other types' : ''}`
    };
  }

  generateExamples(func, name) {
    const examples = [];
    const analysis = this.performComplexityAnalysis(func);
    
    // Generate basic usage example
    const params = this.inferParameters(func);
    const paramNames = params.map(p => p.name).join(', ');
    
    examples.push({
      title: 'Basic Usage',
      code: `${name}(${paramNames});`,
      description: 'Basic function call example'
    });
    
    // Generate error handling example if function has try-catch
    if (analysis.hasTryCatch) {
      examples.push({
        title: 'Error Handling',
        code: `try {\n  ${name}(${paramNames});\n} catch (error) {\n  console.error('Error:', error);\n}`,
        description: 'Example with error handling'
      });
    }
    
    // Generate async example if function returns Promise
    const returnType = this.inferReturnType(func);
    if (returnType.type === 'Promise') {
      examples.push({
        title: 'Async Usage',
        code: `await ${name}(${paramNames});`,
        description: 'Async function call example'
      });
    }
    
    return examples;
  }

  generateTags(analysis) {
    const tags = [];
    
    if (analysis.complexity > 15) {
      tags.push('complex');
    }
    
    if (analysis.hasLoops) {
      tags.push('iteration');
    }
    
    if (analysis.hasConditionals) {
      tags.push('conditional');
    }
    
    if (analysis.hasTryCatch) {
      tags.push('error-handling');
    }
    
    if (analysis.hasRecursion) {
      tags.push('recursive');
    }
    
    if (analysis.parameterCount > 3) {
      tags.push('multi-parameter');
    }
    
    if (analysis.nestingDepth > 3) {
      tags.push('deeply-nested');
    }
    
    return tags;
  }

  generateBestPractices(analysis) {
    const practices = [];
    
    if (analysis.complexity > 15) {
      practices.push('Consider breaking this function into smaller functions');
    }
    
    if (analysis.parameterCount > 5) {
      practices.push('Consider using an options object instead of multiple parameters');
    }
    
    if (analysis.nestingDepth > 4) {
      practices.push('Consider reducing nesting depth with early returns');
    }
    
    if (analysis.hasLoops && !analysis.hasTryCatch) {
      practices.push('Consider adding error handling for loop operations');
    }
    
    if (analysis.cognitiveComplexity > 15) {
      practices.push('Consider simplifying logic to improve readability');
    }
    
    return practices;
  }

  analyzePerformance(func) {
    const analysis = this.performComplexityAnalysis(func);
    const performance = {
      complexity: analysis.complexity,
      efficiency: this.calculateEfficiency(analysis),
      recommendations: []
    };
    
    // Performance recommendations
    if (analysis.hasLoops && analysis.complexity > 10) {
      performance.recommendations.push('Consider optimizing loop logic');
    }
    
    if (analysis.hasRecursion) {
      performance.recommendations.push('Consider iterative approach for better performance');
    }
    
    if (analysis.nestingDepth > 3) {
      performance.recommendations.push('Deep nesting may impact performance');
    }
    
    return performance;
  }

  calculateEfficiency(analysis) {
    let efficiency = 100;
    
    // Deduct points for complexity factors
    efficiency -= analysis.complexity * 2;
    efficiency -= analysis.nestingDepth * 5;
    efficiency -= analysis.parameterCount * 3;
    
    if (analysis.hasRecursion) {
      efficiency -= 10;
    }
    
    return Math.max(0, Math.min(100, efficiency));
  }

  analyzeSecurity(func) {
    const source = func.toString();
    const security = {
      risks: [],
      recommendations: []
    };
    
    // Check for potential security issues
    if (source.includes('eval') || source.includes('Function')) {
      security.risks.push('Dynamic code execution');
      security.recommendations.push('Avoid eval() and Function() constructor');
    }
    
    if (source.includes('innerHTML')) {
      security.risks.push('XSS vulnerability');
      security.recommendations.push('Use safe DOM manipulation methods');
    }
    
    if (source.includes('localStorage') || source.includes('sessionStorage')) {
      security.risks.push('Sensitive data storage');
      security.recommendations.push('Ensure sensitive data is encrypted');
    }
    
    if (source.match(/password|token|secret|key/i)) {
      security.risks.push('Sensitive data handling');
      security.recommendations.push('Ensure proper handling of sensitive data');
    }
    
    return security;
  }

  // Public API methods
  
  getDocumentation(funcOrName) {
    if (typeof funcOrName === 'string') {
      // Find function by name
      for (const [func, doc] of this.documentedFunctions) {
        if (doc.name === funcOrName) {
          return doc;
        }
      }
    } else {
      return this.documentedFunctions.get(funcOrName);
    }
    
    return null;
  }
  
  getAllDocumentation() {
    return Array.from(this.documentedFunctions.values());
  }
  
  generateMarkdown(doc) {
    let markdown = `# ${doc.name}\n\n`;
    
    markdown += `**Description:** ${doc.description}\n\n`;
    
    if (doc.parameters.length > 0) {
      markdown += '## Parameters\n\n';
      for (const param of doc.parameters) {
        markdown += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
      }
      markdown += '\n';
    }
    
    markdown += `**Returns:** ${doc.returns.type} - ${doc.returns.description}\n\n`;
    
    if (doc.examples.length > 0) {
      markdown += '## Examples\n\n';
      for (const example of doc.examples) {
        markdown += `### ${example.title}\n\n`;
        markdown += `${example.description}\n\n`;
        markdown += '```javascript\n';
        markdown += example.code;
        markdown += '\n```\n\n';
      }
    }
    
    if (doc.complexity) {
      markdown += '## Complexity Analysis\n\n';
      markdown += `- **Cyclomatic Complexity:** ${doc.complexity.complexity}\n`;
      markdown += `- **Line Count:** ${doc.complexity.lineCount}\n`;
      markdown += `- **Parameter Count:** ${doc.complexity.parameterCount}\n`;
      markdown += `- **Nesting Depth:** ${doc.complexity.nestingDepth}\n`;
      markdown += `- **Cognitive Complexity:** ${doc.complexity.cognitiveComplexity}\n\n`;
    }
    
    if (doc.tags.length > 0) {
      markdown += `**Tags:** ${doc.tags.join(', ')}\n\n`;
    }
    
    if (doc.bestPractices.length > 0) {
      markdown += '## Best Practices\n\n';
      for (const practice of doc.bestPractices) {
        markdown += `- ${practice}\n`;
      }
      markdown += '\n';
    }
    
    return markdown;
  }
  
  exportDocumentation(format = 'json') {
    const docs = this.getAllDocumentation();
    
    switch (format) {
      case 'json':
        return JSON.stringify(docs, null, 2);
      case 'markdown':
        return docs.map(doc => this.generateMarkdown(doc)).join('\n---\n\n');
      default:
        return docs;
    }
  }
  
  // Cleanup
  
  destroy() {
    this.documentedFunctions.clear();
    this.complexityCache.clear();
    this.typeCache.clear();
  }
}

// Create global instance
window.codeDocumentationGenerator = new CodeDocumentationGenerator({
  enableAutoGeneration: true,
  enableTypeInference: true,
  enableExampleGeneration: true,
  enableComplexityAnalysis: true,
  complexityThreshold: 10,
  minFunctionLength: 15,
  enableLogging: true
});

// Global convenience methods
window.getFunctionDocumentation = (funcOrName) => 
  window.codeDocumentationGenerator.getDocumentation(funcOrName);

window.getAllDocumentation = () => 
  window.codeDocumentationGenerator.getAllDocumentation();

window.exportDocumentation = (format) => 
  window.codeDocumentationGenerator.exportDocumentation(format);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CodeDocumentationGenerator;
}
