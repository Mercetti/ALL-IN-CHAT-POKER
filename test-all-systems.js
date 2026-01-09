/**
 * Comprehensive AI System Test
 * Verifies all AI functions and Control Center integration
 */

const https = require('https');

// Test data
const tests = [
  {
    name: 'AI Performance Endpoint',
    url: 'https://all-in-chat-poker.fly.dev/admin/ai/performance',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'AI Cache Clear',
    url: 'https://all-in-chat-poker.fly.dev/admin/ai/cache/clear',
    method: 'POST',
    expectedStatus: 200
  },
  {
    name: 'AI Performance Reset',
    url: 'https://all-in-chat-poker.fly.dev/admin/ai/performance/reset',
    method: 'POST',
    expectedStatus: 200
  },
  {
    name: 'Ollama Models List',
    url: 'https://all-in-chat-poker.fly.dev/admin/ai/services/ollama/models',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Service Status',
    url: 'https://all-in-chat-poker.fly.dev/admin/ai/services/status',
    method: 'GET',
    expectedStatus: 200
  }
];

async function makeRequest(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'all-in-chat-poker.fly.dev',
      port: 443,
      path: test.url.replace('https://all-in-chat-poker.fly.dev', ''),
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // May need real token
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            name: test.name,
            status: res.statusCode,
            success: res.statusCode === test.expectedStatus,
            data: parsed
          });
        } catch (e) {
          resolve({
            name: test.name,
            status: res.statusCode,
            success: res.statusCode === test.expectedStatus,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        name: test.name,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });

    if (test.method === 'POST') {
      req.write('{}');
    }
    
    req.end();
  });
}

async function runAllTests() {
  console.log('🧪 Testing All AI Systems...\n');
  console.log('=' .repeat(50));
  
  const results = [];
  
  for (const test of tests) {
    console.log(`📝 Testing: ${test.name}`);
    const result = await makeRequest(test);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${test.name} - Status: ${result.status}`);
    } else {
      console.log(`❌ ${test.name} - Status: ${result.status}`);
      if (result.error) console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }
  
  // Summary
  console.log('=' .repeat(50));
  console.log('📊 Test Summary:');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  // Details
  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name} (${result.status})`);
  });
  
  return results;
}

// Test local Ollama
async function testLocalOllama() {
  console.log('\n🔧 Testing Local Ollama...');
  
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();
    
    console.log(`✅ Local Ollama - ${data.models?.length || 0} models available`);
    data.models?.forEach(model => {
      console.log(`   - ${model.name} (${(model.size / 1024 / 1024).toFixed(1)} MB)`);
    });
    
    return true;
  } catch (error) {
    console.log(`❌ Local Ollama - ${error.message}`);
    return false;
  }
}

// Test AI Control Center accessibility
async function testControlCenter() {
  console.log('\n🎛️ Testing AI Control Center...');
  
  try {
    const response = await fetch('http://localhost:5173');
    const success = response.ok;
    
    console.log(`${success ? '✅' : '❌'} AI Control Center - ${success ? 'Accessible' : 'Not accessible'}`);
    return success;
  } catch (error) {
    console.log(`❌ AI Control Center - ${error.message}`);
    return false;
  }
}

// Main test runner
async function main() {
  console.log('🚀 COMPREHENSIVE AI SYSTEM TEST');
  console.log('Testing all AI functions and Control Center integration\n');
  
  const apiResults = await runAllTests();
  const localOllamaResult = await testLocalOllama();
  const controlCenterResult = await testControlCenter();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 FINAL STATUS:');
  
  const apiSuccess = apiResults.filter(r => r.success).length === apiResults.length;
  const allSuccess = apiSuccess && localOllamaResult && controlCenterResult;
  
  if (allSuccess) {
    console.log('🎉 ALL SYSTEMS OPERATIONAL!');
    console.log('✅ AI Functions: Working');
    console.log('✅ AI Control Center: Working');
    console.log('✅ Local Ollama: Working');
    console.log('✅ Performance Monitoring: Working');
  } else {
    console.log('⚠️  SOME ISSUES DETECTED:');
    if (!apiSuccess) console.log('❌ Some API endpoints failing');
    if (!localOllamaResult) console.log('❌ Local Ollama not running');
    if (!controlCenterResult) console.log('❌ AI Control Center not accessible');
  }
  
  console.log('\n📊 System Health:');
  console.log(`   Backend API: ${apiSuccess ? '✅ Healthy' : '❌ Issues'}`);
  console.log(`   Local AI: ${localOllamaResult ? '✅ Running' : '❌ Stopped'}`);
  console.log(`   Control Center: ${controlCenterResult ? '✅ Running' : '❌ Stopped'}`);
  
  return allSuccess;
}

// Run tests
main().catch(console.error);
