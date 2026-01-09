/**
 * Automated File Watcher with Real-time Syntax Checking
 * Prevents errors by checking files as you save them
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoWatcher {
  constructor() {
    this.watchedFiles = ['server.js', 'server/**/*.js'];
    this.debounceTime = 1000; // 1 second debounce
    this.timers = new Map();
    this.isWatching = false;
  }

  checkFile(filePath) {
    try {
      // Syntax check
      execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
      
      // Check for critical functions if it's server.js
      if (filePath.includes('server.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const criticalFunctions = ['runSyntheticCheck', 'runAssetCheck', 'backupDb', 'vacuumDb'];
        
        criticalFunctions.forEach(func => {
          const funcRegex = new RegExp(`function\\s+${func}|${func}\\s*=\\s*function|async\\s+function\\s+${func}`, 'i');
          if (!funcRegex.test(content)) {
            console.warn(`⚠️  Missing critical function: ${func}`);
          }
        });
      }
      
      console.log(`✅ ${path.basename(filePath)} - Syntax OK`);
      return true;
    } catch (error) {
      console.error(`❌ ${path.basename(filePath)} - Syntax Error:`);
      console.error(error.message);
      return false;
    }
  }

  startWatching() {
    if (this.isWatching) return;
    
    console.log('👁️  Starting automated file watcher...');
    console.log('📝 Watching for syntax errors in real-time');
    console.log('⚠️  Press Ctrl+C to stop watching\n');
    
    this.isWatching = true;
    
    // Watch server.js specifically
    const serverPath = path.join(__dirname, 'server.js');
    
    fs.watchFile(serverPath, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        const timerId = `server.js`;
        
        // Clear existing timer
        if (this.timers.has(timerId)) {
          clearTimeout(this.timers.get(timerId));
        }
        
        // Set new timer with debounce
        const timer = setTimeout(() => {
          console.log(`\n🔄 File changed: server.js`);
          this.checkFile(serverPath);
          console.log('---');
        }, this.debounceTime);
        
        this.timers.set(timerId, timer);
      }
    });
    
    // Initial check
    console.log('🔍 Initial syntax check...');
    this.checkFile(serverPath);
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping file watcher...');
      this.stopWatching();
      process.exit(0);
    });
  }

  stopWatching() {
    if (!this.isWatching) return;
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Stop watching files
    fs.unwatchFile(path.join(__dirname, 'server.js'));
    
    this.isWatching = false;
    console.log('✅ File watcher stopped');
  }
}

// Start watching if run directly
if (require.main === module) {
  const watcher = new AutoWatcher();
  watcher.startWatching();
}

module.exports = AutoWatcher;
