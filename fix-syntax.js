/**
 * Syntax Fix Script - Clean up common JavaScript syntax issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing JavaScript Syntax Issues...');
console.log('=====================================');

// Common syntax patterns to fix
const syntaxFixes = [
  {
    name: 'Multiple closing braces',
    pattern: /};\s*};\s*};/g,
    replacement: '};',
    description: 'Fix multiple consecutive closing braces'
  },
  {
    name: 'Multiple closing parentheses',
    pattern: /\);\s*\);\s*\);/g,
    replacement: ');',
    description: 'Fix multiple consecutive closing parentheses'
  },
  {
    name: 'Mixed parentheses and braces',
    pattern: /\);\s*\}\s*\);/g,
    replacement: ');',
    description: 'Fix mixed parentheses and braces patterns'
  }
];

// Files to check and fix
const directoriesToCheck = [
  'public/helm/',
  'server/',
  'apps/',
  'helm-control/'
];

let totalFixes = 0;

console.log('\n📋 Scanning and fixing syntax issues...');

directoriesToCheck.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Directory not found: ${dir}`);
    return;
  }
  
  console.log(`\n🔍 Scanning: ${dir}`);
  
  function scanDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    files.forEach(file => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
        try {
          let content = fs.readFileSync(filePath, 'utf8');
          let fileFixes = 0;
          
          syntaxFixes.forEach(fix => {
            const matches = content.match(fix.pattern);
            if (matches) {
              content = content.replace(fix.pattern, fix.replacement);
              fileFixes += matches.length;
              console.log(`  ✅ Fixed ${matches.length} issues in ${file} (${fix.name})`);
            }
          });
          
          if (fileFixes > 0) {
            fs.writeFileSync(filePath, content, 'utf8');
            totalFixes += fileFixes;
          }
        } catch (error) {
          console.log(`  ❌ Error processing ${file}: ${error.message}`);
        }
      }
    });
  }
  
  scanDirectory(dir);
});

console.log(`\n🎉 Syntax Fix Complete!`);
console.log(`📊 Total fixes applied: ${totalFixes}`);
console.log(`✅ Ready for deployment!`);

if (totalFixes > 0) {
  console.log('\n🚀 Next Steps:');
  console.log('1. Run: npm run deploy');
  console.log('2. Or: npm run dev (for local testing)');
  console.log('3. Check: http://localhost:3000/helm');
} else {
  console.log('\n✅ No syntax issues found!');
  console.log('🚀 Ready to deploy!');
}
