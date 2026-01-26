#!/usr/bin/env node

/**
 * Render Deployment Verification Script
 * Tests all services and provides deployment status
 */

const https = require('https');
const http = require('http');

// Configuration
const SERVICES = {
  main: {
    name: 'all-in-chat-poker',
    url: 'https://all-in-chat-poker.onrender.com',
    healthPath: '/health',
    expectedStatus: 200
  },
  // Note: Workers don't have HTTP endpoints, so we can't test them directly
  bot: {
    name: 'poker-bot',
    type: 'worker',
    status: 'running'
  },
  aiWorker: {
    name: 'poker-ai-worker', 
    type: 'worker',
    status: 'running'
  }
};

const TEST_TIMEOUT = 10000; // 10 seconds

/**
 * Test HTTP endpoint
 */
async function testEndpoint(service) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = service.url + service.healthPath;
    
    const request = url.startsWith('https') ? https : http;
    
    const req = request.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        resolve({
          name: service.name,
          status: 'success',
          statusCode: res.statusCode,
          responseTime,
          data: data ? JSON.parse(data) : null,
          url
        });
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      
      resolve({
        name: service.name,
        status: 'error',
        error: error.message,
        responseTime,
        url
      });
    });
    
    req.setTimeout(TEST_TIMEOUT, () => {
      req.destroy();
      resolve({
        name: service.name,
        status: 'timeout',
        error: `Request timed out after ${TEST_TIMEOUT}ms`,
        responseTime: TEST_TIMEOUT,
        url
      });
    });
  });
}

/**
 * Test worker service (simulated)
 */
async function testWorker(service) {
  return new Promise((resolve) => {
    // Workers don't have HTTP endpoints, so we simulate the test
    setTimeout(() => {
      resolve({
        name: service.name,
        type: 'worker',
        status: 'simulated',
        message: 'Worker service (no HTTP endpoint - check Render dashboard)',
        expectedStatus: 'running'
      });
    }, 1000);
  });
}

/**
 * Print service status
 */
function printServiceStatus(result) {
  const status = result.status === 'success' ? '✅' : 
                result.status === 'error' ? '❌' : 
                result.status === 'timeout' ? '⏰' : 'ℹ️';
  
  console.log(`\n${status} ${result.name}`);
  console.log(`   URL: ${result.url || 'N/A'}`);
  
  if (result.statusCode) {
    console.log(`   Status Code: ${result.statusCode}`);
  }
  
  if (result.responseTime) {
    console.log(`   Response Time: ${result.responseTime}ms`);
  }
  
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
  
  if (result.data) {
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
  }
  
  if (result.message) {
    console.log(`   ${result.message}`);
  }
}

/**
 * Print summary
 */
function printSummary(results) {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 RENDER DEPLOYMENT SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error' || r.status === 'timeout').length;
  const workers = results.filter(r => r.type === 'worker').length;
  
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ℹ️  Workers: ${workers} (check dashboard)`);
  
  if (successful > 0) {
    console.log(`\n🎉 Main service is running!`);
    console.log(`   🌐 URL: https://all-in-chat-poker.onrender.com`);
    console.log(`   🔍 Health: https://all-in-chat-poker.onrender.com/health`);
  }
  
  if (failed > 0) {
    console.log(`\n⚠️  Some services failed. Check:`);
    console.log(`   📋 Render dashboard logs`);
    console.log(`   🔧 Environment variables`);
    console.log(`   📦 Build process`);
  }
  
  console.log(`\n📈 Performance:`);
  results.forEach(result => {
    if (result.responseTime) {
      const status = result.responseTime < 1000 ? '🟢' : 
                    result.responseTime < 3000 ? '🟡' : '🔴';
      console.log(`   ${status} ${result.name}: ${result.responseTime}ms`);
    }
  });
  
  console.log(`\n🔧 Next Steps:`);
  if (successful > 0) {
    console.log(`   1. Test the game at https://all-in-chat-poker.onrender.com`);
    console.log(`   2. Check bot status in Render dashboard`);
    console.log(`   3. Monitor AI worker performance`);
  } else {
    console.log(`   1. Check Render dashboard for errors`);
    console.log(`   2. Verify environment variables`);
    console.log(`   3. Review build logs`);
  }
}

/**
 * Main test function
 */
async function runDeploymentTests() {
  console.log('🚀 Testing Render Deployment...');
  console.log('⏰ Testing services (timeout: 10s each)');
  
  const results = [];
  
  // Test main web service
  console.log(`\n🌐 Testing web service...`);
  const mainResult = await testEndpoint(SERVICES.main);
  results.push(mainResult);
  printServiceStatus(mainResult);
  
  // Test worker services (simulated)
  console.log(`\n🤖 Testing worker services...`);
  const botResult = await testWorker(SERVICES.bot);
  results.push(botResult);
  printServiceStatus(botResult);
  
  const aiWorkerResult = await testWorker(SERVICES.aiWorker);
  results.push(aiWorkerResult);
  printServiceStatus(aiWorkerResult);
  
  // Print summary
  printSummary(results);
}

/**
 * Handle command line arguments
 */
function handleArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Render Deployment Test Tool

Usage: node test-render-deployment.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Show detailed output
  
Examples:
  node test-render-deployment.js
  node test-render-deployment.js --verbose
    `);
    process.exit(0);
  }
  
  return args.includes('--verbose') || args.includes('-v');
}

// Run the tests
if (require.main === module) {
  const verbose = handleArgs();
  
  console.log('🎯 Render Deployment Verification Tool');
  console.log('='.repeat(50));
  
  runDeploymentTests().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testEndpoint,
  testWorker,
  runDeploymentTests
};
