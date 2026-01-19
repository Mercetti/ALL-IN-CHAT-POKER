// Simple test to verify AI manager scoping fix
const { initializeAIManager, aiManager } = require('../server/ai');

// Test that aiManager is accessible after initialization
console.log('Testing AI Manager scoping fix...');

// Initialize AI manager
initializeAIManager();

// Test that we can access aiManager
if (aiManager && aiManager.currentProvider) {
  console.log('✅ SUCCESS: aiManager is properly scoped and accessible');
  console.log(`   Provider: ${aiManager.currentProvider.name}`);
  console.log('   This confirms the scoping issue has been fixed!');
} else {
  console.log('❌ FAILED: aiManager is not accessible');
  console.log('   This indicates the scoping fix did not work');
}

console.log('Test completed.');
