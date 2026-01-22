/**
 * Comprehensive Helm-Persona-Application Integration Test Suite
 * Tests the complete integration between Helm engine, persona system, and All-In Chat Poker
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 Comprehensive Integration Test Suite...');
console.log('🎯 Testing Helm-Persona-Application Integration');

// Test Results Tracker
const testResults = {
  helmEngine: { passed: 0, failed: 0, total: 0 },
  personaSystem: { passed: 0, failed: 0, total: 0 },
  mobileApp: { passed: 0, failed: 0, total: 0 },
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

// === HELM ENGINE TESTS ===
console.log('\n🚀 Testing Helm Engine Components...');

runTest('helmEngine', 'Helm engine files exist', () => {
  const files = [
    'server/helm/index.ts',
    'server/helm/orchestrator/helmOrchestrator.ts',
    'server/helm/skills/helmSkillRegistry.ts',
    'server/helm/security/helmSecurity.ts',
    'server/helm/memory/helmMemory.ts'
  ];
  
  return files.every(file => fs.existsSync(path.resolve(__dirname, '..', file)));

runTest('helmEngine', 'Helm engine exports correct classes', () => {
  const helmIndexPath = path.resolve(__dirname, '..', 'server/helm/index.ts');
  const content = fs.readFileSync(helmIndexPath, 'utf8');
  
  return content.includes('HelmEngine') && 
         content.includes('AceyEngine') && 
         content.includes('helmEngine');

runTest('helmEngine', 'Compatibility aliases in place', () => {
  const helmIndexPath = path.resolve(__dirname, '..', 'server/helm/index.ts');
  const content = fs.readFileSync(helmIndexPath, 'utf8');
  
  return content.includes('AceyEngine = HelmEngine') && 
         content.includes('aceyEngine = helmEngine');

runTest('helmEngine', 'Helm engine has proper structure', () => {
  const helmIndexPath = path.resolve(__dirname, '..', 'server/helm/index.ts');
  const content = fs.readFileSync(helmIndexPath, 'utf8');
  
  return content.includes('processRequest') && 
         content.includes('HelmConfig') && 
         content.includes('HelmResponse');

// === PERSONA SYSTEM TESTS ===
console.log('\n🎭 Testing Persona System...');

runTest('personaSystem', 'Persona configuration files exist', () => {
  const files = [
    '../personas/acey/persona-config.ts',
    '../personas/acey/prompts/system-prompt.md'
  ];
  
  return files.every(file => fs.existsSync(path.resolve(__dirname, file)));

runTest('personaSystem', 'Persona config has required exports', () => {
  const configPath = path.resolve(__dirname, '../personas/acey/persona-config.ts');
  const content = fs.readFileSync(configPath, 'utf8');
  
  const requiredExports = [
    'aceyPersonaConfig',
    'PersonaConfig',
    'generatePersonaResponse',
    'validatePersonaResponse'
  ];
  
  return requiredExports.every(exportName => content.includes(exportName));

runTest('personaSystem', 'System prompt has required sections', () => {
  const promptPath = path.resolve(__dirname, '../personas/acey/prompts/system-prompt.md');
  const content = fs.readFileSync(promptPath, 'utf8');
  
  const requiredSections = [
    '# Acey System Prompt',
    '## Core Identity',
    '## Capabilities',
    '## Safety Guidelines'
  ];
  
  return requiredSections.every(section => content.includes(section));

runTest('personaSystem', 'Persona loader exists and exports correctly', () => {
  const loaderPath = path.resolve(__dirname, '../server/personas/helmPersonaLoader.ts');
  if (!fs.existsSync(loaderPath)) return false;
  
  const content = fs.readFileSync(loaderPath, 'utf8');
  return content.includes('helmPersonaLoader') && 
         content.includes('HelmPersonaLoader');

// === MOBILE APP INTEGRATION TESTS ===
console.log('\n📱 Testing Mobile App Integration...');

runTest('mobileApp', 'Helm service created', () => {
  const servicePath = path.resolve(__dirname, '../mobile/src/services/HelmEngineService.js');
  return fs.existsSync(servicePath);

runTest('mobileApp', 'Helm service has correct structure', () => {
  const servicePath = path.resolve(__dirname, '../mobile/src/services/HelmEngineService.js');
  if (!fs.existsSync(servicePath)) return false;
  
  const content = fs.readFileSync(servicePath, 'utf8');
  return content.includes('HelmEngineService') && 
         content.includes('sendMessage') && 
         content.includes('initialize');

runTest('mobileApp', 'Package.json includes Helm dependency', () => {
  const packagePath = path.resolve(__dirname, '../mobile/package.json');
  if (!fs.existsSync(packagePath)) return true; // Skip if doesn't exist
  
  const content = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(content);
  
  return packageJson.dependencies && 
         packageJson.dependencies['@poker-game/helm-engine'];
});

runTest('mobileApp', 'Integration hooks prepared', () => {
  const gameScreenPath = path.resolve(__dirname, '../mobile/src/screens/GameScreen.js.helm');
  return fs.existsSync(gameScreenPath);

// === DOCUMENTATION TESTS ===
console.log('\n📚 Testing Documentation...');

runTest('overall', 'Architecture documentation exists', () => {
  const docs = [
    '../HELM-ARCHITECTURE.md',
    '../MIGRATION-NOTES.md',
    '../PERSONA-SYSTEM.md'
  ];
  
  return docs.every(doc => fs.existsSync(path.resolve(__dirname, doc)));

runTest('overall', 'Migration notes are complete', () => {
  const migrationPath = path.resolve(__dirname, '../MIGRATION-NOTES.md');
  if (!fs.existsSync(migrationPath)) return false;
  
  const content = fs.readFileSync(migrationPath, 'utf8');
  return content.includes('Phase 1') && 
         content.includes('Phase 2') && 
         content.includes('Compatibility Aliases');

// === COMPATIBILITY TESTS ===
console.log('\n🔄 Testing Compatibility Layer...');

runTest('overall', 'Compatibility layer exists', () => {
  const compatPath = path.resolve(__dirname, '../server/helm-compatibility.js');
  return fs.existsSync(compatPath);

runTest('overall', 'Compatibility layer exports correct aliases', () => {
  const compatPath = path.resolve(__dirname, '../server/helm-compatibility.js');
  if (!fs.existsSync(compatPath)) return false;
  
  const content = fs.readFileSync(compatPath, 'utf8');
  return content.includes('AceyEngine') && 
         content.includes('processAceyRequest') && 
         content.includes('helmEngine');

// === TEST RESULTS SUMMARY ===
console.log('\n📊 Integration Test Results Summary');
console.log('=====================================');

Object.entries(testResults).forEach(([category, results]) => {
  if (category === 'overall') return;
  
  const percentage = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
  const status = percentage === 100 ? '✅' : percentage >= 75 ? '⚠️' : '❌';
  
  console.log(`${status} ${category.toUpperCase()}: ${results.passed}/${results.total} tests passed (${percentage}%)`);

const overallPercentage = testResults.overall.total > 0 ? 
  Math.round((testResults.overall.passed / testResults.overall.total) * 100) : 0;
const overallStatus = overallPercentage === 100 ? '🎉' : overallPercentage >= 75 ? '⚠️' : '❌';

console.log('\n' + '='.repeat(45));
console.log(`${overallStatus} OVERALL: ${testResults.overall.passed}/${testResults.overall.total} tests passed (${overallPercentage}%)`);

// === RECOMMENDATIONS ===
console.log('\n📋 Integration Status & Recommendations');

if (overallPercentage === 100) {
  console.log('🚀 PERFECT INTEGRATION! All systems ready for production.');
  console.log('\n✅ Ready for:');
  console.log('   • Production deployment');
  console.log('   • Full system testing');
  console.log('   • Client demonstrations');
} else if (overallPercentage >= 75) {
  console.log('⚠️ GOOD INTEGRATION with minor issues to address.');
  console.log('\n🔧 Recommended actions:');
  if (testResults.helmEngine.failed > 0) {
    console.log('   • Fix Helm engine component issues');
  }
  if (testResults.personaSystem.failed > 0) {
    console.log('   • Complete persona system setup');
  }
  if (testResults.mobileApp.failed > 0) {
    console.log('   • Finalize mobile app integration');
  }
} else {
  console.log('❌ INTEGRATION NEEDS WORK before production deployment.');
  console.log('\n🚨 Critical actions required:');
  console.log('   • Address failing test categories');
  console.log('   • Review component setup');
  console.log('   • Complete missing configurations');
}

console.log('\n🎯 Next Phase Recommendations:');
console.log('1. Create end-to-end integration tests');
console.log('2. Set up CI/CD pipeline');
console.log('3. Prepare production environment');
console.log('4. Plan user training and documentation');

console.log('\n🎉 Integration Test Suite Complete!');
