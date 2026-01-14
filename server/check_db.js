const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'data.db');

try {
  const db = new Database(DB_PATH);
  const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'').all();
  console.log('Existing tables:', tables.map(t => t.name).join(', '));
  
  // Check if users table exists
  const usersTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  console.log('Users table exists:', !!usersTable);
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
