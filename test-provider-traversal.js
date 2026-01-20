#!/usr/bin/env node

/**
 * Test AI Provider Chain of Responsibility pattern
 */

const FreeAIManager = require('./server/free-ai-manager');

console.log('🔗 Testing AI Provider Chain of Responsibility...\n');

// Mock providers to simulate different failure scenarios
class MockProvider {
  constructor(name, shouldFail = false, failMessage = 'Mock failure') {
    this.name = name;
    this.shouldFail = shouldFail;
    this.failMessage = failMessage;
  }
  
  isAvailable() {
    return !this.shouldFail;
  }
  
  async chat(messages, options) {
    if (this.shouldFail) {
      throw new Error(this.failMessage);
    }
    return {
      message: `Response from ${this.name}`,
      provider: this.name,
      timestamp: Date.now()
    };
  }
}

async function testProviderTraversal() {
  console.log('1️⃣ Testing provider traversal...');
  
  // Create AI manager with mock providers
  const aiManager = new FreeAIManager({
    preferredProvider: 'ollama',
    fallbackToRules: true,
    enableLocalModels: true
  });
  
  // Replace providers with mocks for testing
  aiManager.providers = {
    ollama: new MockProvider('ollama', true, 'Ollama service unavailable'),
    local: new MockProvider('local', false), // This should succeed
    rules: new MockProvider('rules', false) // This should not be reached
  };
  
  try {
    const response = await aiManager.chat([{ text: 'Hello' }]);
    
    const succeeded = response.provider === 'local';
    const traversedCorrectly = response.message.includes('local');
    
    if (succeeded && traversedCorrectly) {
      console.log('✅ Provider traversal test passed');
      console.log(`   System correctly continued from ollama → local`);
      console.log(`   Response: ${response.message}`);
      return true;
    } else {
      console.log('❌ Provider traversal test failed');
      console.log(`   Expected: local provider`);
      console.log(`   Actual: ${response.provider}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Provider traversal test failed with error:', error.message);
    return false;
  }
}

async function testAllProvidersFail() {
  console.log('2️⃣ Testing all providers fail scenario...');
  
  const aiManager = new FreeAIManager({
    preferredProvider: 'ollama',
    fallbackToRules: true,
    enableLocalModels: true
  });
  
  // All providers fail except rules (which is always available)
  aiManager.providers = {
    ollama: new MockProvider('ollama', true, 'Ollama down'),
    local: new MockProvider('local', true, 'Local models unavailable'),
    rules: new MockProvider('rules', true, 'Rules system error')
  };
  
  try {
    await aiManager.chat([{ text: 'Hello' }]);
    console.log('❌ All providers fail test failed');
    console.log('   Should have thrown error');
    return false;
  } catch (error) {
    const containsAllProvidersFailed = error.message.includes('All AI providers failed');
    const containsLastRulesError = error.message.includes('Rules system error');
    
    if (containsAllProvidersFailed && containsLastRulesError) {
      console.log('✅ All providers fail test passed');
      console.log('   Correctly threw error after trying all providers');
      console.log(`   Error: ${error.message}`);
      return true;
    } else {
      console.log('❌ All providers fail test failed');
      console.log(`   Unexpected error: ${error.message}`);
      console.log(`   Contains 'All providers failed': ${containsAllProvidersFailed}`);
      console.log(`   Contains last error: ${containsLastRulesError}`);
      return false;
    }
  }
}

async function testProviderOrder() {
  console.log('3️⃣ Testing provider priority order...');
  
  const aiManager = new FreeAIManager({
    preferredProvider: 'local', // Prefer local
    fallbackToRules: true,
    enableLocalModels: true
  });
  
  // Only ollama available, local unavailable
  aiManager.providers = {
    ollama: new MockProvider('ollama', false), // Should succeed
    local: new MockProvider('local', true, 'Local not available'),
    rules: new MockProvider('rules', false) // Should not be reached
  };
  
  try {
    const response = await aiManager.chat([{ text: 'Hello' }]);
    
    const usedOllama = response.provider === 'ollama';
    const skippedLocal = response.message.includes('ollama');
    
    if (usedOllama && skippedLocal) {
      console.log('✅ Provider priority test passed');
      console.log('   Correctly used available ollama over preferred local');
      console.log(`   Response: ${response.message}`);
      return true;
    } else {
      console.log('❌ Provider priority test failed');
      console.log(`   Expected: ollama provider`);
      console.log(`   Actual: ${response.provider}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Provider priority test failed:', error.message);
    return false;
  }
}

async function runProviderTests() {
  const tests = [
    { name: 'Provider Traversal', fn: testProviderTraversal },
    { name: 'All Providers Fail', fn: testAllProvidersFail },
    { name: 'Provider Priority Order', fn: testProviderOrder }
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
  
  console.log('\n📊 AI Provider Test Results:');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`   ${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 Chain of Responsibility pattern working correctly!');
    console.log('\n🔧 Fixed Issues:');
    console.log('   ✅ Search Traversal: System continues through provider hierarchy');
    console.log('   ✅ Provider Fallback: Tries all providers before failing');
    console.log('   ✅ Quality Preservation: Uses highest quality available provider');
    console.log('   ✅ Error Handling: Proper error aggregation and reporting');
    console.log('\n🚀 Provider Hierarchy:');
    console.log('   1. Ollama (Primary) → 2. Local Models → 3. Rules-Based');
    console.log('   System now "continues" through all available providers');
  } else {
    console.log('⚠️ Some provider traversal issues need attention.');
  }
}

runProviderTests().catch(console.error);
