/**
 * Project Size Audit Tool
 * Generates comprehensive size report for Helm/Acey optimization
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 HELM / ACEY PROJECT — SIZE AUDIT');
console.log('=====================================');

function getDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;
    
    function traverse(currentPath) {
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

function categorizeDirectory(dirName) {
    const name = dirName.toLowerCase();
    
    // Frontend
    if (name.includes('public') || name.includes('static') || name.includes('assets') || name.includes('ui') || name.includes('client')) {
        return 'frontend';
    }
    
    // Backend
    if (name.includes('server') || name.includes('api') || name.includes('backend')) {
        return 'backend';
    }
    
    // AI
    if (name.includes('helm') || name.includes('acey') || name.includes('ai') || name.includes('model') || name.includes('skill')) {
        return 'ai';
    }
    
    // Assets
    if (name.includes('assets') || name.includes('media') || name.includes('images') || name.includes('audio') || name.includes('video')) {
        return 'assets';
    }
    
    // Logs
    if (name.includes('log') || name.includes('audit')) {
        return 'logs';
    }
    
    // Build
    if (name.includes('build') || name.includes('dist') || name.includes('out') || name.includes('.next') || name.includes('.vite')) {
        return 'build';
    }
    
    // Cache
    if (name.includes('cache') || name.includes('temp') || name.includes('.cache')) {
        return 'cache';
    }
    
    return 'other';
}

// Main audit
const projectRoot = process.cwd();
const directories = fs.readdirSync(projectRoot).filter(item => {
    const itemPath = path.join(projectRoot, item);
    return fs.statSync(itemPath).isDirectory();
});

const auditResults = {
    frontend: { size: 0, count: 0, items: [] },
    backend: { size: 0, count: 0, items: [] },
    ai: { size: 0, count: 0, items: [] },
    assets: { size: 0, count: 0, items: [] },
    logs: { size: 0, count: 0, items: [] },
    build: { size: 0, count: 0, items: [] },
    cache: { size: 0, count: 0, items: [] },
    other: { size: 0, count: 0, items: [] }
};

console.log('\n📊 SCANNING DIRECTORIES...');

directories.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    const { size, fileCount } = getDirectorySize(dirPath);
    const category = categorizeDirectory(dir);
    
    auditResults[category].size += size;
    auditResults[category].count += fileCount;
    auditResults[category].items.push({
        name: dir,
        size: size,
        fileCount: fileCount
    });
    
    console.log(`  📁 ${dir}: ${formatBytes(size)} (${fileCount} files)`);
});

console.log('\n📋 SIZE REPORT BY CATEGORY');
console.log('==========================');

Object.entries(auditResults).forEach(([category, data]) => {
    if (data.size > 0) {
        console.log(`\n🏷️  ${category.toUpperCase()}:`);
        console.log(`   Total Size: ${formatBytes(data.size)}`);
        console.log(`   File Count: ${data.count}`);
        console.log(`   Directories: ${data.items.length}`);
        
        // Show top 3 largest items in category
        data.items.sort((a, b) => b.size - a.size);
        data.items.slice(0, 3).forEach((item, index) => {
            console.log(`     ${index + 1}. ${item.name}: ${formatBytes(item.size)}`);
        });
        
        if (data.items.length > 3) {
            console.log(`     ... and ${data.items.length - 3} more`);
        }
    }
});

// Summary
const totalSize = Object.values(auditResults).reduce((sum, cat) => sum + cat.size, 0);
const totalFiles = Object.values(auditResults).reduce((sum, cat) => sum + cat.count, 0);

console.log('\n🎯 PROJECT SUMMARY');
console.log('==================');
console.log(`Total Size: ${formatBytes(totalSize)}`);
console.log(`Total Files: ${totalFiles}`);
console.log(`Total Directories: ${directories.length}`);

// Optimization recommendations
console.log('\n💡 OPTIMIZATION RECOMMENDATIONS');
console.log('==============================');

if (auditResults.build.size > 100 * 1024 * 1024) { // > 100MB
    console.log('🚨 BUILD: Large build artifacts detected - consider .dockerignore exclusions');
}

if (auditResults.cache.size > 50 * 1024 * 1024) { // > 50MB
    console.log('🚨 CACHE: Large cache directories - exclude from production');
}

if (auditResults.logs.size > 20 * 1024 * 1024) { // > 20MB
    console.log('🚨 LOGS: Consider log rotation and retention policies');
}

if (auditResults.frontend.size > 50 * 1024 * 1024) { // > 50MB
    console.log('🚨 FRONTEND: Large frontend - check for AI data in bundles');
}

if (auditResults.ai.size > 500 * 1024 * 1024) { // > 500MB
    console.log('🚨 AI: Large AI assets - ensure server-side only');
}

console.log('\n✅ AUDIT COMPLETE');
console.log('Ready for Phase 2 optimization');
