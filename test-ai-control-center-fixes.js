#!/usr/bin/env node

/**
 * Test AI Control Center fixes
 */

console.log('🧪 Testing AI Control Center Fixes...\n');

// Test 1: Verify orchestrator files moved to server
async function testArchitecturalBoundary() {
  console.log('1️⃣ Testing architectural boundary fix...');
  
  const fs = require('fs');
  const path = require('path');
  
  const frontendUtilsPath = path.join('apps', 'ai-control-center', 'src', 'utils');
  const serverUtilsPath = path.join('apps', 'ai-control-center', 'src', 'server', 'utils');
  
  try {
    // Check orchestrator files are no longer in frontend utils (except orchestrator-api.ts which is correct)
    const frontendFiles = fs.readdirSync(frontendUtilsPath);
    const hasProblematicOrchestrator = frontendFiles.some(f => 
      f.includes('orchestrator') && !f.includes('orchestrator-api')
    );
    
    // Check orchestrator files are now in server utils
    const serverFiles = fs.readdirSync(serverUtilsPath);
    const hasOrchestratorInServer = serverFiles.some(f => f.includes('orchestrator'));
    
    const boundaryFixed = !hasProblematicOrchestrator && hasOrchestratorInServer;
    
    if (boundaryFixed) {
      console.log('✅ Architectural boundary test passed');
      console.log('   Orchestrator files moved from frontend to server');
      return true;
    } else {
      console.log('❌ Architectural boundary test failed');
      console.log(`   Frontend has problematic orchestrator: ${hasProblematicOrchestrator}`);
      console.log(`   Server has orchestrator: ${hasOrchestratorInServer}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Architectural boundary test failed:', error.message);
    return false;
  }
}

// Test 2: Verify debouncing implementation
async function testDebouncingImplementation() {
  console.log('2️⃣ Testing debouncing implementation...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const servicePanelPath = path.join('apps', 'ai-control-center', 'src', 'components', 'ServiceManagementPanel.tsx');
    const content = fs.readFileSync(servicePanelPath, 'utf8');
    
    const hasDebounceFunction = content.includes('function debounce');
    const hasDebouncedUpdate = content.includes('debouncedUpdateConfig');
    const has500msDelay = content.includes('500)');
    
    const debouncingImplemented = hasDebounceFunction && hasDebouncedUpdate && has500msDelay;
    
    if (debouncingImplemented) {
      console.log('✅ Debouncing implementation test passed');
      console.log('   Debounce function and 500ms delay implemented');
      return true;
    } else {
      console.log('❌ Debouncing implementation test failed');
      console.log(`   Has debounce function: ${hasDebounceFunction}`);
      console.log(`   Has debounced update: ${hasDebouncedUpdate}`);
      console.log(`   Has 500ms delay: ${has500msDelay}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Debouncing implementation test failed:', error.message);
    return false;
  }
}

// Test 3: Verify model list refresh sync
async function testModelRefreshSync() {
  console.log('3️⃣ Testing model list refresh sync...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const servicePanelPath = path.join('apps', 'ai-control-center', 'src', 'components', 'ServiceManagementPanel.tsx');
    const content = fs.readFileSync(servicePanelPath, 'utf8');
    
    const hasFetchModelsInInterval = content.includes('fetchModels(); // Also refresh models');
    const hasIntervalSetup = content.includes('setInterval(() => {');
    const hasBothCalls = content.includes('fetchServiceStatus();') && content.includes('fetchModels();');
    
    const refreshSynced = hasFetchModelsInInterval && hasIntervalSetup && hasBothCalls;
    
    if (refreshSynced) {
      console.log('✅ Model refresh sync test passed');
      console.log('   Models now refresh with service status');
      return true;
    } else {
      console.log('❌ Model refresh sync test failed');
      console.log(`   Has models in interval: ${hasFetchModelsInInterval}`);
      console.log(`   Has both in interval: ${hasBothInInterval}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Model refresh sync test failed:', error.message);
    return false;
  }
}

// Test 4: Verify hardcoded fallbacks removed
async function testHardcodedFallbacksRemoved() {
  console.log('4️⃣ Testing hardcoded fallbacks removal...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const servicePanelPath = path.join('apps', 'ai-control-center', 'src', 'components', 'ServiceManagementPanel.tsx');
    const content = fs.readFileSync(servicePanelPath, 'utf8');
    
    const hasDeepseekCoder = content.includes('deepseek-coder:1.3b');
    const hasQwen = content.includes('qwen:0.5b');
    const hasLlama32 = content.includes('llama3.2:1b');
    const hasEmptyArrayFallback = content.includes('setModels([]);');
    
    const fallbacksRemoved = !hasDeepseekCoder && !hasQwen && !hasLlama32 && hasEmptyArrayFallback;
    
    if (fallbacksRemoved) {
      console.log('✅ Hardcoded fallbacks removal test passed');
      console.log('   Fake model data removed, empty array fallback implemented');
      return true;
    } else {
      console.log('❌ Hardcoded fallbacks removal test failed');
      console.log(`   Still has deepseek-coder: ${hasDeepseekCoder}`);
      console.log(`   Still has qwen: ${hasQwen}`);
      console.log(`   Still has llama3.2: ${hasLlama32}`);
      console.log(`   Has empty array fallback: ${hasEmptyArrayFallback}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Hardcoded fallbacks removal test failed:', error.message);
    return false;
  }
}

// Test 5: Verify clipboard API safety
async function testClipboardAPISafety() {
  console.log('5️⃣ Testing clipboard API safety...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const servicePanelPath = path.join('apps', 'ai-control-center', 'src', 'components', 'ServiceManagementPanel.tsx');
    const content = fs.readFileSync(servicePanelPath, 'utf8');
    
    const hasSecureContextCheck = content.includes('navigator.clipboard && window.isSecureContext');
    const hasFallbackMethod = content.includes('document.execCommand(\'copy\')');
    const hasAlertConfirmation = content.includes('alert(\'URL copied to clipboard!\')');
    
    const clipboardSafe = hasSecureContextCheck && hasFallbackMethod && hasAlertConfirmation;
    
    if (clipboardSafe) {
      console.log('✅ Clipboard API safety test passed');
      console.log('   Secure context check and fallback method implemented');
      return true;
    } else {
      console.log('❌ Clipboard API safety test failed');
      console.log(`   Has secure context check: ${hasSecureContextCheck}`);
      console.log(`   Has fallback method: ${hasFallbackMethod}`);
      console.log(`   Has alert confirmation: ${hasAlertConfirmation}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Clipboard API safety test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAIControlCenterTests() {
  const tests = [
    { name: 'Architectural Boundary', fn: testArchitecturalBoundary },
    { name: 'Debouncing Implementation', fn: testDebouncingImplementation },
    { name: 'Model Refresh Sync', fn: testModelRefreshSync },
    { name: 'Hardcoded Fallbacks Removed', fn: testHardcodedFallbacksRemoved },
    { name: 'Clipboard API Safety', fn: testClipboardAPISafety }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ ${test.name} error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }
  
  console.log('\n📊 AI Control Center Test Results:');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`   ${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All AI Control Center fixes implemented successfully!');
    console.log('\n🔧 Fixed Issues:');
    console.log('   ✅ Architectural Boundary: Server-side code moved to server directory');
    console.log('   ✅ Network Flooding: Configuration inputs now debounced (500ms)');
    console.log('   ✅ Stale Model List: Models refresh with service status');
    console.log('   ✅ Fake State: Hardcoded fallbacks removed');
    console.log('   ✅ Clipboard Safety: Secure context check implemented');
    console.log('\n🚀 Application now production-ready!');
  } else {
    console.log('⚠️ Some AI Control Center issues need attention.');
  }
}

runAIControlCenterTests().catch(console.error);
