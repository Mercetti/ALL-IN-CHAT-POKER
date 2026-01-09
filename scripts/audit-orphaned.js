#!/usr/bin/env node

/**
 * Orphaned Code Audit Script
 * Comprehensive scan for unused functions, imports, and dead code
 */

const fs = require('fs');
const path = require('path');

function auditOrphanedCode() {
  const serverPath = path.join(__dirname, '../server.js');
  const content = fs.readFileSync(serverPath, 'utf8');
  
  const issues = [];
  
  // 1. Check for unused imports
  const imports = content.match(/const\s+.*=\s*require\(['"`]([^'"`]+)['"`]\)/g) || [];
  const unusedImports = [];
  
  imports.forEach(imp => {
    const match = imp.match(/const\s+(\{[^}]+\}|\w+)\s*=\s*require\(['"`]([^'"`]+)['"`]\)/);
    if (match) {
      const [, importName, modulePath] = match;
      
      // Simple heuristic: check if import name is used elsewhere
      const usageRegex = new RegExp(`\\b${importName.replace(/[{}]/g, '').trim()}\\b`, 'g');
      const usages = content.match(usageRegex);
      
      // Subtract the import declaration itself
      if (usages && usages.length <= 1) {
        unusedImports.push(modulePath);
      }
    }
  });
  
  if (unusedImports.length > 0) {
    issues.push({
      type: 'unused-imports',
      message: `Potentially unused imports: ${unusedImports.join(', ')}`,
      severity: 'warning'
    });
  }
  
  // 2. Check for functions defined but never called
  const functionDefs = content.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g) || [];
  const functionNames = functionDefs.map(f => f.replace(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/, '$1'));
  
  const unusedFunctions = [];
  functionNames.forEach(funcName => {
    // Skip common patterns
    if (funcName.startsWith('_') || funcName.includes('Handler') || funcName.includes('Middleware')) {
      return;
    }
    
    // Check if function is called or exported
    const callRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
    const calls = content.match(callRegex);
    
    // Subtract the function definition itself
    if (!calls || calls.length <= 1) {
      // Check if it's exported
      const exportRegex = new RegExp(`module\\.exports.*${funcName}`, 'i');
      if (!content.match(exportRegex)) {
        unusedFunctions.push(funcName);
      }
    }
  });
  
  if (unusedFunctions.length > 0) {
    issues.push({
      type: 'unused-functions',
      message: `Potentially unused functions: ${unusedFunctions.join(', ')}`,
      severity: 'info'
    });
  }
  
  // 3. Check for TODO/FIXME comments
  const todos = content.match(/\/\/\s*(TODO|FIXME|XXX|HACK):?\s*.+/g) || [];
  if (todos.length > 0) {
    issues.push({
      type: 'technical-debt',
      message: `Found ${todos.length} TODO/FIXME comments that need attention`,
      details: todos.slice(0, 5), // Show first 5
      severity: 'info'
    });
  }
  
  // 4. Check for console.log statements (should be removed in production)
  const consoleLogs = content.match(/console\.(log|warn|error|debug)\s*\(/g) || [];
  if (consoleLogs.length > 0) {
    issues.push({
      type: 'console-logs',
      message: `Found ${consoleLogs.length} console statements (consider using logger)`,
      severity: 'warning'
    });
  }
  
  // 5. Check for large file size (indicator of need for refactoring)
  const lines = content.split('\n').length;
  if (lines > 500) {
    issues.push({
      type: 'large-file',
      message: `server.js is ${lines} lines - consider splitting into modules`,
      severity: 'warning'
    });
  }
  
  // 6. Check for hardcoded values that should be in config
  const hardcodedPorts = content.match(/:\s*(8080|3000|5000|8000)/g) || [];
  const hardcodedUrls = content.match(/https?:\/\/[^\\s'"]+/g) || [];
  
  if (hardcodedPorts.length > 0 || hardcodedUrls.length > 0) {
    issues.push({
      type: 'hardcoded-values',
      message: `Found hardcoded values - consider moving to config`,
      details: [...hardcodedPorts, ...hardcodedUrls].slice(0, 3),
      severity: 'info'
    });
  }
  
  // Report results
  console.log('\n🔍 Orphaned Code Audit Results:');
  console.log('==================================');
  
  if (issues.length === 0) {
    console.log('✅ No orphaned code issues found!');
  } else {
    issues.forEach(issue => {
      const icon = issue.severity === 'error' ? '❌' : 
                   issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`\n${icon} ${issue.message}`);
      
      if (issue.details) {
        issue.details.forEach(detail => {
          console.log(`   - ${detail}`);
        });
      }
    });
    
    console.log(`\n📊 Summary: ${issues.length} issues found`);
    console.log(`   Errors: ${issues.filter(i => i.severity === 'error').length}`);
    console.log(`   Warnings: ${issues.filter(i => i.severity === 'warning').length}`);
    console.log(`   Info: ${issues.filter(i => i.severity === 'info').length}`);
  }
}

if (require.main === module) {
  auditOrphanedCode();
}

module.exports = { auditOrphanedCode };
