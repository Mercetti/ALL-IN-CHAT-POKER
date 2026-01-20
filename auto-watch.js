/**
 * Automated File Watcher with Real-time Syntax Checking
 * Prevents errors by checking files as you save them
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const chokidar = require('chokidar');

class AutoWatcher {
  constructor() {
    this.watchedFiles = ['server.js', 'server/**/*.js'];
    this.debounceTime = 1000; // 1 second debounce
    this.timers = new Map();
    this.isWatching = false;
  }

  checkFile(filePath) {
    try {
      // Validate and sanitize file path
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
      }
      
      // Prevent path traversal
      const resolvedPath = path.resolve(filePath);
      const normalizedPath = path.normalize(resolvedPath);
      
      // Ensure file is within expected bounds
      if (!normalizedPath.startsWith(process.cwd())) {
        throw new Error('File path outside project bounds');
      }
      
      // Safe syntax check using spawnSync with arguments array
      const result = spawnSync('node', ['-c', normalizedPath], { 
        stdio: 'pipe',
        timeout: 5000,
        encoding: 'utf8'
      });
      
      if (result.status !== 0) {
        throw new Error(`Syntax check failed: ${result.stderr}`);
      }
      
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
    
    // Use chokidar for robust glob-based file watching
    const watcher = chokidar.watch(this.watchedFiles, {
      cwd: __dirname,
      ignoreInitial: false,
      persistent: true
    });
    
    // Handle file changes
    watcher.on('change', (filePath) => {
      const fullPath = path.join(__dirname, filePath);
      const timerId = filePath;
      
      // Clear existing timer
      if (this.timers.has(timerId)) {
        clearTimeout(this.timers.get(timerId));
      }
      
      // Set new timer with debounce
      const timer = setTimeout(() => {
        console.log(`\n🔄 File changed: ${filePath}`);
        this.checkFile(fullPath);
        console.log('---');
      }, this.debounceTime);
      
      this.timers.set(timerId, timer);
    });
    
    // Handle errors
    watcher.on('error', (error) => {
      console.error('❌ Watcher error:', error);
    });
    
    // Initial check for all files
    console.log('🔍 Initial syntax check...');
    this.watchedFiles.forEach(pattern => {
      const files = require('glob').sync(pattern, { cwd: __dirname });
      files.forEach(file => {
        const fullPath = path.join(__dirname, file);
        this.checkFile(fullPath);
      });
    });
    
    // Store watcher reference for cleanup
    this.watcher = watcher;
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping file watcher...');
      this.stopWatching();
      process.exit(0);
    });
  }

  stopWatching() {
    if (!this.isWatching) return;
    
    this.isWatching = false;
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Close file watcher
    if (this.watcher) {
      this.watcher.close();
    }
    
    console.log('✅ File watcher stopped');
  }
}

// Auto-start if run directly
if (require.main === module) {
  const watcher = new AutoWatcher();
  watcher.startWatching();
}

module.exports = AutoWatcher;
