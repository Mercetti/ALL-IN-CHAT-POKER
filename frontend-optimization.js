/**
 * PHASE 1 COMPLETE - SIZE AUDIT RESULTS
 * 
 * PROJECT TOTAL: 5.59 GB (352,373 files)
 * 
 * CRITICAL FINDINGS:
 * 🚨 AI Category: 2.87 GB (largest - mostly control apps with node_modules)
 * 🚨 Frontend: 143.82 MB (public directory - needs bundle analysis)
 * ✅ Backend: 40.74 MB (reasonable size)
 * ✅ Build: 2.03 MB (small)
 * 
 * LARGEST CONTRIBUTORS:
 * 1. acey-control-apk: 1.86 GB (Android app with node_modules)
 * 2. apps: 722.02 MB (multiple applications)
 * 3. node_modules: 634.09 MB (development dependencies)
 * 4. mobile: 566.81 MB (React Native app)
 * 5. acey-control-center: 556.94 MB (React control center)
 * 
 * OPTIMIZATION PRIORITIES:
 * 1. Frontend bundle analysis (143.82 MB public)
 * 2. AI assets containment (2.87 GB)
 * 3. Node_modules exclusion from production
 * 4. Docker image optimization
 */

console.log('🔧 PHASE 3 - FRONTEND BUNDLE SIZE OPTIMIZATION');
console.log('==============================================');

const fs = require('fs');
const path = require('path');

// Analyze public directory structure
const publicDir = path.join(process.cwd(), 'public');
const publicItems = fs.readdirSync(publicDir);

console.log('\n📁 PUBLIC DIRECTORY ANALYSIS:');
console.log('Current size: 143.82 MB');

publicItems.forEach(item => {
    const itemPath = path.join(publicDir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
        const dirSize = getDirectorySize(itemPath);
        console.log(`  📂 ${item}/: ${formatBytes(dirSize.size)} (${dirSize.fileCount} files)`);
    } else {
        console.log(`  📄 ${item}: ${formatBytes(stat.size)}`);
    }
});

function getDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;
    
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
                    fileCount++;
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }
    
    traverse(dirPath);
    return { size: totalSize, fileCount };
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

console.log('\n🎯 FRONTEND OPTIMIZATION ACTIONS:');
console.log('==================================');

// Check for AI data in frontend
const helmDir = path.join(publicDir, 'helm');
if (fs.existsSync(helmDir)) {
    const helmSize = getDirectorySize(helmDir);
    console.log(`✅ Helm UI found: ${formatBytes(helmSize.size)}`);
    
    // Check for AI data in Helm
    const helmFiles = fs.readdirSync(helmDir);
    const aiFiles = helmFiles.filter(file => 
        file.includes('.jsonl') || 
        file.includes('model') || 
        file.includes('skill') ||
        file.includes('prompt')
    );
    
    if (aiFiles.length > 0) {
        console.log('🚨 AI FILES FOUND IN FRONTEND:');
        aiFiles.forEach(file => {
            const filePath = path.join(helmDir, file);
            const stat = fs.statSync(filePath);
            console.log(`  ❌ ${file}: ${formatBytes(stat.size)}`);
        });
    } else {
        console.log('✅ No AI files found in Helm frontend');
    }
}

console.log('\n📋 OPTIMIZATION CHECKLIST:');
console.log('□ Remove AI prompts from frontend bundles');
console.log('□ Enable dynamic imports for admin panels');
console.log('□ Move audio to streaming endpoints');
console.log('□ Ensure no model data in /public');
console.log('□ Implement code splitting for demo controls');
console.log('□ Add lazy loading for analytics views');

console.log('\n🚀 PROCEEDING WITH OPTIMIZATION...');
