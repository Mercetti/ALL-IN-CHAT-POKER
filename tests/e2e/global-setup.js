/**
 * Global Setup for Playwright E2E Tests
 * Runs once before all tests to prepare the test environment
 */

const { testServerManager } = require('./test-server-manager');

async function globalSetup(config) {
  console.log('🚀 Setting up Playwright E2E test environment...');
  
  try {
    // Start the test server
    await testServerManager.start();
    
    // You can add additional global setup tasks here:
    // - Database migrations
    // - Seed data creation
    // - Test user creation
    // - Cleanup of previous test data
    
    console.log('✅ Playwright E2E test environment ready');
  } catch (error) {
    console.error('❌ Failed to set up E2E test environment:', error);
    throw error;
  }
}

module.exports = globalSetup;
