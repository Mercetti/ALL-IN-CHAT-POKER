/**
 * Backend AI Model Selection Test
 * Tests the context-aware model selection in the backend
 */

const https = require('https');

function testBackendAI() {
  return new Promise((resolve, reject) => {
    const testData = {
      context: 'coding',
      message: 'Write a Python function to check if a number is prime'
    };

    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'all-in-chat-poker.fly.dev',
      port: 443,
      path: '/api/ai/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(postData);
    req.end();
  });
}

async function runBackendTest() {
  console.log('🔀 Testing Backend AI Model Selection...\n');
  
  try {
    const response = await testBackendAI();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

runBackendTest();
