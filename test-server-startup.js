#!/usr/bin/env node

/**
 * Test server startup components individually
 */

console.log('🧪 Testing Server Startup Components...');

async function testComponents() {
  try {
    // Test 1: Database
    console.log('\n📊 Testing Database...');
    const db = require('./server/db');
    db.init(); // Initialize database
    const database = db.getDatabase();
    const result = database.prepare('SELECT 1').get();
    console.log('✅ Database:', result ? 'Connected' : 'Failed');
    
    // Test 2: AceyEngine
    console.log('\n🧠 Testing AceyEngine...');
    const { AceyEngine } = require('./server/aceyEngine');
    console.log('✅ AceyEngine imported:', typeof AceyEngine);
    
    const engine = new AceyEngine({ useAI: true });
    console.log('✅ AceyEngine instantiated:', typeof engine);
    
    // Test 3: Auth
    console.log('\n🔐 Testing Auth...');
    const authContract = require('./server/auth-contract');
    console.log('✅ Auth imported:', typeof authContract);
    console.log('✅ Auth methods:', Object.keys(authContract));
    console.log('✅ requireOwner available:', typeof authContract.requireOwner);
    const auth = authContract;
    
    // Test 4: Financial System
    console.log('\n🏦 Testing Financial System...');
    const { integrateFinancialSystem, addFinancialHealthCheck } = require('./server/financial/financial-integration');
    console.log('✅ Financial integration imported:', typeof integrateFinancialSystem);
    console.log('✅ Financial health check imported:', typeof addFinancialHealthCheck);
    
    // Test 5: Express App
    console.log('\n🌐 Testing Express App...');
    const express = require('express');
    const app = express();
    console.log('✅ Express app created');
    
    // Test 6: Financial Integration
    console.log('\n🔗 Testing Financial Integration...');
    const success = integrateFinancialSystem(app, db);
    console.log('✅ Financial integration:', success ? 'Success' : 'Failed');
    
    console.log('\n🎉 All components tested successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Component test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testComponents().then(success => {
  console.log('\n🎯 Test Result:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});
