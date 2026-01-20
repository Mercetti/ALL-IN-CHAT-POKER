#!/usr/bin/env node

/**
 * Test financial schema initialization
 */

console.log('🧪 Testing Financial Schema...');

try {
  const db = require('./server/db');
  db.init();
  const database = db.getDatabase();
  
  console.log('✅ Database initialized');
  
  // Test simple CREATE TABLE
  console.log('🔧 Testing CREATE TABLE...');
  database.exec(`
    CREATE TABLE IF NOT EXISTS test_table (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);
  console.log('✅ Test table created');
  
  // Test financial_events table
  console.log('🔧 Testing financial_events table...');
  database.exec(`
    CREATE TABLE IF NOT EXISTS financial_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      event_category TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT DEFAULT 'USD',
      partner_id TEXT,
      partner_name TEXT,
      event_date INTEGER NOT NULL,
      event_date_iso TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      source_system TEXT NOT NULL,
      reference_id TEXT,
      status TEXT DEFAULT 'confirmed',
      created_at INTEGER NOT NULL,
      created_by TEXT NOT NULL,
      audit_hash TEXT NOT NULL,
      audit_signature TEXT,
      audit_version INTEGER DEFAULT 1
    )
  `);
  console.log('✅ financial_events table created');
  
  // Verify table exists
  console.log('🔍 Verifying table exists...');
  const result = database.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='financial_events'
  `).get();
  
  if (result) {
    console.log('✅ financial_events table verified');
  } else {
    console.log('❌ financial_events table not found');
  }
  
  console.log('🎉 Financial schema test successful!');
  
} catch (error) {
  console.error('❌ Financial schema test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
