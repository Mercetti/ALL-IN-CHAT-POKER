#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Database file path
const DB_PATH = path.join(__dirname, '..', 'data', 'data.db');

// Migration file path
const MIGRATION_FILE = path.join(__dirname, '001_security_schema.sql');

async function runMigration() {
  try {
    console.log('🔧 Running security schema migration...');
    
    // Check if database file exists
    if (!fs.existsSync(DB_PATH)) {
      console.log('❌ Database file not found at:', DB_PATH);
      console.log('📝 Creating database file...');
      fs.writeFileSync(DB_PATH, '');
    }
    
    // Check if migration file exists
    if (!fs.existsSync(MIGRATION_FILE)) {
      console.log('❌ Migration file not found at:', MIGRATION_FILE);
      process.exit(1);
    }
    
    // Read migration SQL
    const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf8');
    
    // Open database and execute migration
    console.log('📝 Executing migration SQL...');
    const db = new Database(DB_PATH);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Execute migration directly without transaction
    try {
      db.exec(migrationSQL);
      console.log('✅ Security schema migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      db.close();
      process.exit(1);
    }
    
    // Verify tables were created
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    
    const securityTables = [
      'unlock_requests',
      'incidents', 
      'incident_learning',
      'security_events',
      'device_trust',
      'system_state',
      'pending_operations',
      'compliance_reports',
      'security_metrics'
    ];
    
    console.log('\n📊 Created security tables:');
    securityTables.forEach(table => {
      if (tables.some(t => t.name === table)) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} (not found)`);
      }
    });
    
    // Verify views were created
    const views = db.prepare("SELECT name FROM sqlite_master WHERE type='view'").all();
    
    const securityViews = [
      'v_active_incidents',
      'v_recent_security_events',
      'v_device_trust_status'
    ];
    
    console.log('\n👁 Created security views:');
    securityViews.forEach(view => {
      if (views.some(v => v.name === view)) {
        console.log(`  ✅ ${view}`);
      } else {
        console.log(`  ❌ ${view} (not found)`);
      }
    });
    
    console.log('\n🎯 Security schema setup complete!');
    console.log('📱 The mobile app can now connect to the enhanced backend.');
    console.log('🔐 All security features are ready for testing.');
    
    db.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
