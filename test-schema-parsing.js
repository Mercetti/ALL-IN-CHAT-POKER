#!/usr/bin/env node

/**
 * Test schema parsing
 */

console.log('🧪 Testing Schema Parsing...');

try {
  const fs = require('fs');
  const schemaPath = './server/financial/database-schema.sql';
  
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('✅ Schema file read');
  
  // Test different splitting methods
  console.log('\n🔍 Testing splitting methods...');
  
  // Method 1: Simple split
  const statements1 = schema.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);
  console.log(`Method 1: Found ${statements1.length} statements`);
  
  // Method 2: Split on semicolon + newline
  const statements2 = schema.split(/;\s*\n/).map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);
  console.log(`Method 2: Found ${statements2.length} statements`);
  
  // Method 3: Split on semicolon + optional whitespace
  const statements3 = schema.split(/;\s*/).map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);
  console.log(`Method 3: Found ${statements3.length} statements`);
  
  // Check for CREATE TABLE statements
  const createTableStatements1 = statements1.filter(stmt => stmt.toUpperCase().includes('CREATE TABLE'));
  const createTableStatements2 = statements2.filter(stmt => stmt.toUpperCase().includes('CREATE TABLE'));
  const createTableStatements3 = statements3.filter(stmt => stmt.toUpperCase().includes('CREATE TABLE'));
  
  console.log(`Method 1: Found ${createTableStatements1.length} CREATE TABLE statements`);
  console.log(`Method 2: Found ${createTableStatements2.length} CREATE TABLE statements`);
  console.log(`Method 3: Found ${createTableStatements3.length} CREATE TABLE statements`);
  
  // Show first few statements from method 3
  console.log('\n🔍 First 5 statements from Method 3:');
  statements3.slice(0, 5).forEach((stmt, i) => {
    console.log(`${i + 1}: ${stmt.substring(0, 50)}...`);
  });
  
  // Show CREATE TABLE statements from method 3
  console.log('\n🔍 CREATE TABLE statements from Method 3:');
  createTableStatements3.forEach((stmt, i) => {
    console.log(`${i + 1}: ${stmt.substring(0, 50)}...`);
  });
  
} catch (error) {
  console.error('❌ Schema parsing test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
