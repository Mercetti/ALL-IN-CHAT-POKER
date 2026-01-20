#!/usr/bin/env node

/**
 * Test server startup with isolated components
 */

console.log('🧪 Testing Server Startup Isolated...');

async function testServerStartup() {
  try {
    // Test 1: Basic imports
    console.log('\n📦 Testing Basic Imports...');
    const express = require('express');
    const path = require('path');
    console.log('✅ Basic imports successful');
    
    // Test 2: Database
    console.log('\n📊 Testing Database...');
    const db = require('./server/db');
    db.init();
    console.log('✅ Database initialized');
    
    // Test 3: AceyEngine
    console.log('\n🧠 Testing AceyEngine...');
    const { AceyEngine } = require('./server/aceyEngine');
    console.log('✅ AceyEngine imported:', typeof AceyEngine);
    
    const aceyEngine = new AceyEngine({ useAI: true });
    console.log('✅ AceyEngine instantiated');
    
    // Test 4: Auth
    console.log('\n🔐 Testing Auth...');
    const authContract = require('./server/auth-contract');
    console.log('✅ Auth imported');
    
    // Test 5: Financial System
    console.log('\n🏦 Testing Financial System...');
    const { integrateFinancialSystem, addFinancialHealthCheck } = require('./server/financial/financial-integration');
    console.log('✅ Financial integration imported');
    
    // Test 6: Create Express App
    console.log('\n🌐 Creating Express App...');
    const app = express();
    app.use(express.json());
    console.log('✅ Express app created');
    
    // Test 7: Financial Integration
    console.log('\n🔗 Testing Financial Integration...');
    const success = integrateFinancialSystem(app, db);
    console.log('✅ Financial integration:', success ? 'Success' : 'Failed');
    
    // Test 8: Add Health Check
    console.log('\n🏥 Adding Health Check...');
    addFinancialHealthCheck(app, db);
    console.log('✅ Health check added');
    
    // Test 9: Start Server
    console.log('\n🚀 Starting Server...');
    const server = app.listen(3000, () => {
      console.log('✅ Server started on port 3000');
      
      // Test 10: Health Check
      console.log('\n🏥 Testing Health Check...');
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/health/financial',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log('✅ Health check response:', data);
          server.close();
          console.log('🎉 All tests passed!');
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Health check failed:', error.message);
        server.close();
      });
      
      req.end();
    });
    
    server.on('error', (error) => {
      console.error('❌ Server failed to start:', error.message);
    });
    
  } catch (error) {
    console.error('❌ Server startup test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testServerStartup().then(() => {
  console.log('\n🎯 Test Result: SUCCESS');
}).catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});
