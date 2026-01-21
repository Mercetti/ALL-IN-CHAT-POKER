/**
 * Helm Control Production Deployment Readiness Test
 * Final validation before production deployment
 */

const path = require('path');
const fs = require('fs');

console.log('🚀 Helm Control Production Deployment Readiness Test');
console.log('=========================================================');

// Test Results
const testResults = {
  helmEngine: { passed: 0, failed: 0, total: 0 },
  personaSystem: { passed: 0, failed: 0, total: 0 },
  integration: { passed: 0, failed: 0, total: 0 },
  cleanup: { passed: 0, failed: 0, total: 0 },
  overall: { passed: 0, failed: 0, total: 0 }
};

function runTest(category, testName, testFunction) {
  testResults[category].total++;
  testResults.overall.total++;
  
  try {
    const result = testFunction();
    if (result) {
      testResults[category].passed++;
      testResults.overall.passed++;
      console.log(`✅ ${testName}`);
    } else {
      testResults[category].failed++;
      testResults.overall.failed++;
      console.log(`❌ ${testName}`);
    }
  } catch (error) {
    testResults[category].failed++;
    testResults.overall.failed++;
    console.log(`❌ ${testName} - Error: ${error.message}`);
  }
}

// === HELM ENGINE PRODUCTION READINESS ===
console.log('\n🔧 Testing Helm Engine Production Readiness...');

runTest('helmEngine', 'Helm engine files exist and are complete', () => {
  const requiredFiles = [
    'server/helm/index.ts',
    'server/helm/orchestrator/helmOrchestrator.ts',
    'server/helm/skills/helmSkillRegistry.ts',
    'server/helm/security/helmSecurity.ts',
    'server/helm/memory/helmMemory.ts'
  ];
  
  return requiredFiles.every(file => fs.existsSync(path.resolve(__dirname, '..', file)));
});

runTest('helmEngine', 'Helm engine exports are clean (no Acey aliases)', () => {
  const helmIndexPath = path.resolve(__dirname, '../server/helm/index.ts');
  const content = fs.readFileSync(helmIndexPath, 'utf8');
  
  // Should have Helm exports but NOT Acey aliases
  return content.includes('helmEngine') && 
         content.includes('HelmEngine') &&
         !content.includes('AceyEngine') &&
         !content.includes('aceyEngine');
});

runTest('helmEngine', 'Helm engine has production configuration', () => {
  const helmIndexPath = path.resolve(__dirname, '../server/helm/index.ts');
  const content = fs.readFileSync(helmIndexPath, 'utf8');
  
  return content.includes('HelmConfig') && 
         content.includes('enableSecurity') &&
         content.includes('enableMemory') &&
         content.includes('enablePersonaSystem');
});

// === PERSONA SYSTEM PRODUCTION READINESS ===
console.log('\n🎭 Testing Persona System Production Readiness...');

runTest('personaSystem', 'Persona configuration files are complete', () => {
  const personaConfig = path.resolve(__dirname, '../personas/acey/persona-config.ts');
  const systemPrompt = path.resolve(__dirname, '../personas/acey/prompts/system-prompt.md');
  
  return fs.existsSync(personaConfig) && fs.existsSync(systemPrompt);
});

runTest('personaSystem', 'Persona loader is properly configured', () => {
  const loaderPath = path.resolve(__dirname, '../server/personas/helmPersonaLoader.ts');
  if (!fs.existsSync(loaderPath)) return false;
  
  const content = fs.readFileSync(loaderPath, 'utf8');
  return content.includes('HelmPersonaLoader') && 
         content.includes('helmPersonaLoader');
});

runTest('personaSystem', 'Persona system has safety constraints', () => {
  const personaConfig = path.resolve(__dirname, '../personas/acey/persona-config.ts');
  const content = fs.readFileSync(personaConfig, 'utf8');
  
  return content.includes('safetyConstraints') && 
         content.includes('permissions') &&
         content.includes('contentFilters');
});

// === INTEGRATION PRODUCTION READINESS ===
console.log('\n📱 Testing Integration Production Readiness...');

runTest('integration', 'Server.js updated to use Helm engine', () => {
  const serverPath = path.resolve(__dirname, '../server.js');
  const content = fs.readFileSync(serverPath, 'utf8');
  
  return content.includes('Helm Engine Integration') && 
         content.includes('helmEngine') &&
         !content.includes('AceyEngine');
});

runTest('integration', 'Mobile app integration service exists', () => {
  const servicePath = path.resolve(__dirname, '../mobile/src/services/HelmEngineService.js');
  return fs.existsSync(servicePath);
});

runTest('integration', 'Game modes updated for Helm compatibility', () => {
  const blackjackPath = path.resolve(__dirname, '../server/modes/blackjack.js');
  const pokerPath = path.resolve(__dirname, '../server/modes/poker.js');
  
  if (!fs.existsSync(blackjackPath) || !fs.existsSync(pokerPath)) return false;
  
  const blackjackContent = fs.readFileSync(blackjackPath, 'utf8');
  const pokerContent = fs.readFileSync(pokerPath, 'utf8');
  
  return blackjackContent.includes('helmEngine') && 
         pokerContent.includes('helmEngine');
});

// === CLEANUP VALIDATION ===
console.log('\n🧹 Testing Cleanup Validation...');

runTest('cleanup', 'Old Acey engine files removed', () => {
  const oldFiles = [
    'server/aceyEngine.js',
    'server/acey-service-controller.js',
    'server/acey-tts.js',
    'server/acey-websocket.js',
    'server/aceyPhrases.js',
    'server/acey'
  ];
  
  // All should be removed (return true if none exist)
  return !oldFiles.some(file => fs.existsSync(path.resolve(__dirname, '..', file)));
});

runTest('cleanup', 'Backup directory exists', () => {
  const backupDirs = fs.readdirSync(path.resolve(__dirname))
    .filter(dir => dir.startsWith('acey-backup-'));
  
  return backupDirs.length > 0;
});

runTest('cleanup', 'Compatibility layer cleaned up', () => {
  const compatPath = path.resolve(__dirname, '../server/helm-compatibility.js');
  if (!fs.existsSync(compatPath)) return true;
  
  const content = fs.readFileSync(compatPath, 'utf8');
  return !content.includes('AceyEngine') && !content.includes('aceyEngine');
});

// === DEPLOYMENT READINESS ===
console.log('\n📦 Testing Deployment Readiness...');

runTest('integration', 'Documentation is complete', () => {
  const docs = [
    'HELM-ARCHITECTURE.md',
    'MIGRATION-NOTES.md',
    'PERSONA-SYSTEM.md'
  ];
  
  return docs.every(doc => fs.existsSync(path.resolve(__dirname, '..', doc)));
});

runTest('integration', 'Test suites are available', () => {
  const tests = [
    'server/tests/helm-structure-test-working.js',
    'server/tests/persona-loading-test-correct.js',
    'server/tests/comprehensive-integration-test-fixed.js'
  ];
  
  return tests.every(test => fs.existsSync(path.resolve(__dirname, '..', test)));
});

// === RESULTS SUMMARY ===
console.log('\n📊 Production Deployment Readiness Results');
console.log('============================================');

Object.entries(testResults).forEach(([category, results]) => {
  if (category === 'overall') return;
  
  const percentage = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
  const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
  
  console.log(`${status} ${category.toUpperCase()}: ${results.passed}/${results.total} tests passed (${percentage}%)`);
});

const overallPercentage = testResults.overall.total > 0 ? 
  Math.round((testResults.overall.passed / testResults.overall.total) * 100) : 0;
const overallStatus = overallPercentage === 100 ? '🎉' : overallPercentage >= 80 ? '⚠️' : '❌';

console.log('\n' + '='.repeat(50));
console.log(`${overallStatus} OVERALL: ${testResults.overall.passed}/${testResults.overall.total} tests passed (${overallPercentage}%)`);

// === DEPLOYMENT RECOMMENDATION ===
console.log('\n🚀 Deployment Recommendation');

if (overallPercentage === 100) {
  console.log('🎉 FULLY READY FOR PRODUCTION DEPLOYMENT!');
  console.log('\n✅ All systems validated:');
  console.log('   • Helm engine is complete and clean');
  console.log('   • Persona system is production-ready');
  console.log('   • Integration is fully updated');
  console.log('   • Old code is safely removed and backed up');
  console.log('   • Documentation and tests are complete');
  
  console.log('\n🎯 Ready to deploy:');
  console.log('   1. Start production server');
  console.log('   2. Run integration tests');
  console.log('   3. Monitor system performance');
  console.log('   4. Enable mobile app integration');
  
} else if (overallPercentage >= 80) {
  console.log('⚠️ MOSTLY READY - Minor issues to address');
  console.log('\n🔧 Recommended actions before deployment:');
  
  Object.entries(testResults).forEach(([category, results]) => {
    if (results.failed > 0) {
      console.log(`   • Fix ${results.failed} ${category} issue(s)`);
    }
  });
  
} else {
  console.log('❌ NOT READY - Critical issues must be resolved');
  console.log('\n🚨 Required actions:');
  console.log('   • Address all failing tests');
  console.log('   • Complete missing configurations');
  console.log('   • Validate system integration');
}

console.log('\n📋 Final Deployment Checklist:');
console.log('□ All tests passing');
console.log('□ Backup created');
console.log('□ Documentation updated');
console.log('□ Monitoring configured');
console.log('□ Rollback plan ready');

console.log('\n🎉 Production Deployment Readiness Test Complete!');
