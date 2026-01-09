#!/usr/bin/env node

/**
 * Duplicate Function Detection Script
 * Scans server.js for duplicate function definitions and other code quality issues
 */

const fs = require('fs');
const path = require('path');

function checkDuplicates() {
  const serverPath = path.join(__dirname, '../server.js');
  const content = fs.readFileSync(serverPath, 'utf8');
  
  const issues = [];
  
  // Check for multiple server.listen calls
  const listenMatches = content.match(/server\.listen/g);
  if (listenMatches && listenMatches.length > 1) {
    issues.push({
      type: 'duplicate-server-listen',
      message: `Found ${listenMatches.length} server.listen() calls (should be 1)`,
      severity: 'error'
    });
  }
  
  // Check for duplicate function definitions
  const functionMatches = content.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
  if (functionMatches) {
    const functionNames = functionMatches.map(f => f.replace('function ', ''));
    const duplicates = functionNames.filter((name, index) => functionNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      issues.push({
        type: 'duplicate-functions',
        message: `Duplicate functions found: ${duplicates.join(', ')}`,
        severity: 'error'
      });
    }
  }
  
  // Check for duplicate route definitions
  const routeMatches = content.match(/app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g);
  if (routeMatches) {
    const routes = routeMatches.map(r => {
      const match = r.match(/app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/);
      return `${match[1].toUpperCase()}:${match[2]}`;
    });
    
    const duplicateRoutes = routes.filter((route, index) => routes.indexOf(route) !== index);
    if (duplicateRoutes.length > 0) {
      issues.push({
        type: 'duplicate-routes',
        message: `Duplicate routes found: ${duplicateRoutes.join(', ')}`,
        severity: 'warning'
      });
    }
  }
  
  // Check for orphaned code after server.listen
  const listenIndex = content.lastIndexOf('server.listen');
  const afterListen = content.substring(listenIndex);
  const remainingCode = afterListen.replace(/server\.listen[^}]+}\);?/, '').trim();
  
  if (remainingCode.length > 50) { // Allow for small trailing whitespace
    issues.push({
      type: 'orphaned-code',
      message: 'Code found after server.listen() - possible orphaned code',
      severity: 'warning'
    });
  }
  
  // Report results
  console.log('\n🔍 Code Quality Check Results:');
  console.log('================================');
  
  if (issues.length === 0) {
    console.log('✅ No code quality issues found!');
  } else {
    issues.forEach(issue => {
      const icon = issue.severity === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${issue.message}`);
    });
    
    const errors = issues.filter(i => i.severity === 'error').length;
    if (errors > 0) {
      console.log(`\n❌ Found ${errors} error(s) that should be fixed before deployment`);
      process.exit(1);
    } else {
      console.log(`\n⚠️ Found ${issues.length} warning(s) - consider addressing these`);
    }
  }
}

if (require.main === module) {
  checkDuplicates();
}

module.exports = { checkDuplicates };
