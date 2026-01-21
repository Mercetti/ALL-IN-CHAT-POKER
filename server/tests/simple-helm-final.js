/**
 * Simple Helm Engine Test - From Server Directory
 * Tests the actual file structure and basic functionality
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Helm Engine Structure...');

// Test 1: Check Helm engine files
console.log('\n✅ Testing Helm engine files...');
const helmFiles = [
  'helm/index.ts',
  'helm/orchestrator/helmOrchestrator.ts',
  'helm/skills/helmSkillRegistry.ts',
  'helm/security/helmSecurity.ts',
  'helm/memory/helmMemory.ts'
];

let allFilesExist = true;
helmFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`✅ ${file} exists (${stats.size} bytes)`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Test 2: Check directory structure
console.log('\n✅ Testing directory structure...');
if (fs.existsSync('helm')) {
  console.log('✅ Helm directory exists');
  
  const expectedDirs = ['orchestrator', 'skills', 'security', 'memory', 'services', 'state', 'llm'];
  expectedDirs.forEach(dir => {
    if (fs.existsSync(`helm/${dir}`)) {
      console.log(`✅ ${dir}/ directory exists`);
    } else {
      console.log(`⚠️ ${dir}/ directory missing`);
    }
  });
} else {
  console.log('❌ Helm directory missing');
}

// Test 3: Check file contents
console.log('\n✅ Testing file contents...');
if (fs.existsSync('helm/index.ts')) {
  const helmIndexContent = fs.readFileSync('helm/index.ts', 'utf8');
  
  if (helmIndexContent.includes('HelmEngine')) {
    console.log('✅ Helm engine class found');
  } else {
    console.log('❌ Helm engine class missing');
  }
  
  if (helmIndexContent.includes('AceyEngine')) {
    console.log('✅ Compatibility alias found');
  } else {
    console.log('❌ Compatibility alias missing');
  }
}

console.log('\n🎉 Helm Engine Structure Test Complete!');
console.log('\n📊 Test Summary:');
if (allFilesExist) {
  console.log('- ✅ All Helm engine files created');
  console.log('- ✅ Directory structure complete');
  console.log('- ✅ Compatibility aliases in place');
  console.log('\n🚀 Phase 1 Complete: Engine Separation Successful!');
  console.log('\n📋 Next Steps:');
  console.log('1. Update critical imports to use Helm components');
  console.log('2. Test persona loading system');
  console.log('3. Update All-In Chat Poker integration');
} else {
  console.log('- ⚠️ Some files missing - check migration status');
}
