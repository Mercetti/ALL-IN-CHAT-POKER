/**
 * AI Control Center Version Checker
 * Checks current version and compares with latest
 */

const fs = require('fs');
const path = require('path');

function getCurrentVersion() {
  try {
    const packagePath = path.join(__dirname, 'apps', 'ai-control-center', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return 'unknown';
  }
}

function getBuildTime() {
  try {
    const buildPath = path.join(__dirname, 'apps', 'ai-control-center', 'dist');
    if (!fs.existsSync(buildPath)) {
      return 'Not built';
    }
    
    const stats = fs.statSync(buildPath);
    return stats.mtime.toLocaleString();
  } catch (error) {
    return 'Unknown';
  }
}

function checkGitStatus() {
  const { execSync } = require('child_process');
  
  try {
    const result = execSync('git status --porcelain', { 
      cwd: path.join(__dirname, 'apps', 'ai-control-center'),
      encoding: 'utf8'
    });
    
    if (result.trim() === '') {
      return 'Clean';
    } else {
      return `Modified (${result.split('\n').length} changes)`;
    }
  } catch (error) {
    return 'Unknown';
  }
}

console.log('🔍 AI Control Center Version Check');
console.log('=' .repeat(40));

const version = getCurrentVersion();
const buildTime = getBuildTime();
const gitStatus = checkGitStatus();

console.log(`📦 Version: ${version}`);
console.log(`🕐 Built: ${buildTime}`);
console.log(`📂 Git Status: ${gitStatus}`);

if (gitStatus !== 'Clean') {
  console.log('\n⚠️  Changes detected - consider updating');
  console.log('💡 Run: update-ai-control-center.bat');
} else {
  console.log('\n✅ Up to date');
}

console.log('\n🖥️  Desktop shortcut: update-ai-control-center.bat');
console.log('🔄 Development mode: dev-ai-control-center.bat');
