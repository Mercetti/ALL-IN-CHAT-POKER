/**
 * Safe Cleanup Analysis Tool
 * Identifies files that can be safely removed
 */

const fs = require('fs');
const path = require('path');

function analyzeCleanup() {
    console.log('🔍 ANALYZING SAFE CLEANUP CANDIDATES...');
    
    const candidates = [];
    const protected = [];
    
    function scanDirectory(dir, relativePath = '') {
        try {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const relativeItemPath = path.join(relativePath, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    // Check if directory is safe to delete
                    if (isSafeToDelete(itemPath, item)) {
                        candidates.push({
                            path: relativeItemPath,
                            type: 'directory',
                            size: getDirectorySize(itemPath).size
                        });
                    } else {
                        protected.push(relativeItemPath);
                        scanDirectory(itemPath, relativeItemPath);
                    }
                } else {
                    // Check if file is safe to delete
                    if (isSafeToDelete(itemPath, item)) {
                        candidates.push({
                            path: relativeItemPath,
                            type: 'file',
                            size: stat.size
                        });
                    } else {
                        protected.push(relativeItemPath);
                    }
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }
    
    function isSafeToDelete(filePath, name) {
        const safePatterns = [
            /^test-/, /^debug-/, /^temp/, /^tmp/,
            /\.tmp$/, /\.bak$/, /~$/,
            /demo-recording-/, /legacy-demo-/,
            /duplicate-/, /backup-/, /old-/,
            /-mock-data\./, /-test-data\./,
            /mock-\./
        ];
        
        const protectedPatterns = [
            /helm/, /acey/, /skill/, /permission/,
            /stability/, /watchdog/, /kill-/,
            /engine/, /orchestrator/, /security/
        ];
        
        // Never delete protected files
        for (const pattern of protectedPatterns) {
            if (pattern.test(name.toLowerCase())) {
                return false;
            }
        }
        
        // Check if matches safe patterns
        for (const pattern of safePatterns) {
            if (pattern.test(name.toLowerCase())) {
                return true;
            }
        }
        
        return false;
    }
    
    function getDirectorySize(dirPath) {
        let totalSize = 0;
        
        function traverse(currentPath) {
            try {
                const items = fs.readdirSync(currentPath);
                
                for (const item of items) {
                    const itemPath = path.join(currentPath, item);
                    const stat = fs.statSync(itemPath);
                    
                    if (stat.isDirectory()) {
                        traverse(itemPath);
                    } else {
                        totalSize += stat.size;
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        }
        
        traverse(dirPath);
        return { size: totalSize };
    }
    
    // Start analysis
    scanDirectory(process.cwd());
    
    // Sort candidates by size (largest first)
    candidates.sort((a, b) => b.size - a.size);
    
    // Calculate totals
    const totalCandidateSize = candidates.reduce((sum, item) => sum + item.size, 0);
    const totalCandidateCount = candidates.length;
    
    console.log('\n📋 CLEANUP ANALYSIS RESULTS:');
    console.log('==========================');
    console.log(`Safe to delete: ${totalCandidateCount} items`);
    console.log(`Total size: ${formatBytes(totalCandidateSize)}`);
    
    console.log('\n🗑️  TOP 10 LARGEST CANDIDATES:');
    candidates.slice(0, 10).forEach((item, index) => {
        console.log(`${index + 1}. ${item.path} (${item.type}): ${formatBytes(item.size)}`);
    });
    
    if (candidates.length > 10) {
        console.log(`... and ${candidates.length - 10} more items`);
    }
    
    console.log(`\n🛡️  PROTECTED ITEMS: ${protected.length}`);
    
    return {
        candidates,
        totalSize: totalCandidateSize,
        totalCount: totalCandidateCount
    };
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run analysis
module.exports = { analyzeCleanup, formatBytes };

if (require.main === module) {
    analyzeCleanup();
}