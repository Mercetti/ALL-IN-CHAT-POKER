/**
 * Acey Engine Cleanup Script
 * Safely removes old Acey engine code after Helm Control migration
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting Acey Engine Cleanup...');

// Create backup directory
const backupDir = path.resolve(__dirname, 'acey-backup-' + new Date().toISOString().replace(/[:.]/g, '-'));
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`✅ Created backup directory: ${backupDir}`);
}

// Files to remove (with backup)
const filesToRemove = [
  'acey-example.js',
  'acey-service-controller.js', 
  'acey-tts.js',
  'acey-websocket.js',
  'aceyEngine.js',
  'aceyPhrases.js'
];

// Directories to remove (with backup)
const dirsToRemove = [
  'acey'
];

// Function to backup file or directory
function backupAndRemove(itemPath, isDirectory = false) {
  const fullPath = path.resolve(__dirname, itemPath);
  const backupPath = path.join(backupDir, itemPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ ${itemPath} not found, skipping`);
    return;
  }
  
  try {
    // Create backup
    if (isDirectory) {
      // Recursively copy directory
      copyDirectory(fullPath, backupPath);
      console.log(`✅ Backed up directory: ${itemPath}`);
      
      // Remove original directory
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`🗑️ Removed directory: ${itemPath}`);
    } else {
      // Copy file
      fs.copyFileSync(fullPath, backupPath);
      console.log(`✅ Backed up file: ${itemPath}`);
      
      // Remove original file
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Removed file: ${itemPath}`);
    }
  } catch (error) {
    console.error(`❌ Failed to remove ${itemPath}:`, error.message);
  }
}

// Function to recursively copy directory
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Remove files
console.log('\n📁 Removing old Acey engine files...');
filesToRemove.forEach(file => {
  backupAndRemove(file, false);
});

// Remove directories
console.log('\n📂 Removing old Acey engine directories...');
dirsToRemove.forEach(dir => {
  backupAndRemove(dir, true);
});

// Check for any remaining references
console.log('\n🔍 Checking for remaining references...');

// Function to search for references in a directory
function searchForReferences(searchDir, searchTerm) {
  const results = [];
  
  if (!fs.existsSync(searchDir)) {
    return results;
  }
  
  const entries = fs.readdirSync(searchDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(searchDir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('node_modules') && !entry.name.startsWith('.')) {
      results.push(...searchForReferences(fullPath, searchTerm));
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts') || entry.name.endsWith('.json'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(searchTerm)) {
          results.push({
            file: fullPath,
            matches: content.split('\n').filter((line, index) => 
              line.includes(searchTerm) && !line.trim().startsWith('//')
            ).map(line => line.trim())
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }
  
  return results;
}

// Search for remaining references
const searchTerms = ['aceyEngine', 'AceyEngine', 'acey-service-controller'];
const serverDir = path.resolve(__dirname, '..');

searchTerms.forEach(term => {
  const references = searchForReferences(serverDir, term);
  if (references.length > 0) {
    console.log(`\n⚠️ Found ${references.length} references to "${term}":`);
    references.forEach(ref => {
      const relativePath = path.relative(serverDir, ref.file);
      console.log(`   📄 ${relativePath}:`);
      ref.matches.slice(0, 3).forEach(match => {
        console.log(`      "${match}"`);
      });
      if (ref.matches.length > 3) {
        console.log(`      ... and ${ref.matches.length - 3} more`);
      }
    });
  }
});

// Update compatibility layer to remove aliases
console.log('\n🔄 Updating compatibility layer...');
const compatPath = path.resolve(__dirname, 'helm-compatibility.js');
if (fs.existsSync(compatPath)) {
  try {
    let content = fs.readFileSync(compatPath, 'utf8');
    
    // Remove compatibility aliases
    content = content.replace(/\/\/ Export compatibility aliases[\s\S]*?exports\.helmPersonaLoader = helmPersonaLoader;/g, '');
    content = content.replace(/module\.exports = \{[\s\S]*?\};/g, '');
    content = content.replace(/exports\.[A-Za-z]* = [A-Za-z]*;/g, '');
    
    // Keep only direct Helm exports
    const newContent = `/**
 * Helm Engine - Direct Exports
 * Use these imports for new code
 */

// Import Helm components
const { helmEngine, processHelmRequest, HelmEngine } = require('./helm/index');
const { helmPersonaLoader } = require('./personas/helmPersonaLoader');

// Export direct Helm components
module.exports = {
  helmEngine,
  processHelmRequest,
  HelmEngine,
  helmPersonaLoader
};

// Also export as ES6 modules for TypeScript compatibility
exports.helmEngine = helmEngine;
exports.processHelmRequest = processHelmRequest;
exports.HelmEngine = HelmEngine;
exports.helmPersonaLoader = helmPersonaLoader;
`;

    fs.writeFileSync(compatPath, newContent);
    console.log('✅ Updated compatibility layer - removed aliases');
  } catch (error) {
    console.error('❌ Failed to update compatibility layer:', error.message);
  }
}

// Cleanup summary
console.log('\n📊 Cleanup Summary:');
console.log(`✅ Backed up files to: ${backupDir}`);
console.log(`🗑️ Removed ${filesToRemove.length} files`);
console.log(`🗑️ Removed ${dirsToRemove.length} directories`);
console.log('🔄 Updated compatibility layer');

console.log('\n🎉 Acey Engine Cleanup Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Review any remaining references found above');
console.log('2. Update any remaining imports to use Helm components');
console.log('3. Test the system to ensure everything works');
console.log('4. Deploy production version of Helm Control architecture');

console.log('\n💡 Note: All removed files are backed up and can be restored if needed');
