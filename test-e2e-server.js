/**
 * Test E2E Server Setup
 * Simple script to test the E2E server manager
 */

const { testServerManager } = require('./tests/e2e/test-server-manager');

async function testE2EServer() {
  console.log('🧪 Testing E2E Server Setup...');
  
  try {
    // Test server startup
    console.log('1️⃣ Testing server startup...');
    await testServerManager.start();
    
    // Get server status
    console.log('2️⃣ Checking server status...');
    const status = testServerManager.getStatus();
    console.log('Server Status:', status);
    
    // Test server health
    console.log('3️⃣ Testing server health...');
    const isHealthy = await testServerManager.isServerHealthy();
    console.log('Server Healthy:', isHealthy);
    
    // Test server restart
    console.log('4️⃣ Testing server restart...');
    await testServerManager.restart();
    
    // Check status after restart
    const restartStatus = testServerManager.getStatus();
    console.log('Status after restart:', restartStatus);
    
    // Test server stop
    console.log('5️⃣ Testing server stop...');
    await testServerManager.stop();
    
    console.log('✅ E2E Server Setup Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ E2E Server Setup Test Failed:', error);
    process.exit(1);
  }
}

// Run the test
testE2EServer();
