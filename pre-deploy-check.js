/**
 * Pre-Deployment Syntax and Critical Function Checker
 * Prevents deployment with syntax errors or missing functions
 */

const fs = require('fs');
const path = require('path');

function checkSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic syntax check
    const { execSync } = require('child_process');
    const result = execSync(`node -c "${filePath}"`, { encoding: 'utf8' });
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function checkCriticalFunctions(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // List of critical functions that must exist
    const criticalFunctions = [
      'runSyntheticCheck',
      'runAssetCheck',
      'backupDb',
      'vacuumDb',
      'getCriticalHashes'
    ];
    
    const missingFunctions = [];
    
    criticalFunctions.forEach(func => {
      // Check for function definition
      const funcRegex = new RegExp(`function\\s+${func}|${func}\\s*=\\s*function|async\\s+function\\s+${func}`, 'i');
      if (!funcRegex.test(content)) {
        missingFunctions.push(func);
      }
    });
    
    return {
      success: missingFunctions.length === 0,
      missing: missingFunctions
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function checkSyntaxErrors(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Common syntax error patterns
    const errorPatterns = [
      /};\s*$/gm,  // Extra semicolon after closing brace
      /\{\s*;\s*\n/g,  // Semicolon after opening brace
      /\)\s*;\s*\n/g,  // Extra semicolon after closing parenthesis
      /\)\s*;\s*}/g,  // Semicolon before closing brace
      /,\s*;/g   // Comma followed by semicolon
    ];
    
    const issues = [];
    
    errorPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          type: `Syntax Pattern ${index + 1}`,
          pattern: pattern.toString(),
          matches: matches.length,
          locations: matches.slice(0, 3) // Show first 3 matches
        });
      }
    });
    
    return {
      success: issues.length === 0,
      issues
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function runPreDeploymentCheck() {
  console.log('🔍 Pre-Deployment Check Started');
  console.log('=' .repeat(50));
  
  const serverPath = path.join(__dirname, 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.error('❌ server.js not found');
    process.exit(1);
  }
  
  // 1. Syntax Check
  console.log('📝 Checking syntax...');
  const syntaxCheck = checkSyntax(serverPath);
  if (!syntaxCheck.success) {
    console.error('❌ Syntax Error Found:');
    console.error(syntaxCheck.error);
    process.exit(1);
  }
  console.log('✅ Syntax OK');
  
  // 2. Critical Functions Check
  console.log('🔧 Checking critical functions...');
  const functionsCheck = checkCriticalFunctions(serverPath);
  if (!functionsCheck.success) {
    console.error('❌ Missing Critical Functions:');
    functionsCheck.missing.forEach(func => console.error(`   - ${func}`));
    process.exit(1);
  }
  console.log('✅ All Critical Functions Present');
  
  // 3. Syntax Pattern Check
  console.log('🔍 Checking for syntax issues...');
  const patternCheck = checkSyntaxErrors(serverPath);
  if (!patternCheck.success) {
    console.warn('⚠️  Potential Syntax Issues:');
    patternCheck.issues.forEach(issue => {
      console.warn(`   ${issue.type}: ${issue.matches} matches`);
      issue.locations.forEach(loc => console.warn(`     ${loc.trim()}`));
    });
    console.warn('💡 Consider fixing these issues before deployment');
  } else {
    console.log('✅ No Syntax Issues Detected');
  }
  
  console.log('\n🎉 Pre-Deployment Check Passed!');
  console.log('✅ Ready for deployment');
}

// Run check if called directly
if (require.main === module) {
  runPreDeploymentCheck();
}

module.exports = {
  runPreDeploymentCheck,
  checkSyntax,
  checkCriticalFunctions,
  checkSyntaxErrors
};
