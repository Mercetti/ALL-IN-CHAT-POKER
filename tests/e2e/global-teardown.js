/**
 * Global Teardown for Playwright E2E Tests
 * Runs once after all tests to clean up the test environment
 */

const { testServerManager } = require('./test-server-manager');

async function globalTeardown(config) {
  console.log('🧹 Cleaning up Playwright E2E test environment...');
  
  try {
    // Stop the test server
    await testServerManager.stop();
    
    // You can add additional global cleanup tasks here:
    // - Database cleanup
    // - Test data removal
    // - Temporary file cleanup
    // - Resource deallocation
    
    console.log('✅ Playwright E2E test environment cleaned up');
  } catch (error) {
    console.error('❌ Failed to clean up E2E test environment:', error);
    // Don't throw error here to avoid masking test failures
  }
}

module.exports = globalTeardown;
