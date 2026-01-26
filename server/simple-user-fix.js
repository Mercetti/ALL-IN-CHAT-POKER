// Simple user creation bypass for PostgreSQL
const { Pool } = require('pg');

async function createSimpleUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    
    // Create profiles table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        login VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        chips INTEGER DEFAULT 1000,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        settings TEXT,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    
    // Check if mercetti exists
    const existingUser = await client.query(
      'SELECT login FROM profiles WHERE login = $1',
      ['mercetti']
    );
    
    if (existingUser.rows.length === 0) {
      // Create mercetti user with a simple password hash
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('mercetti123', 10);
      
      await client.query(`
        INSERT INTO profiles (login, email, password_hash, role, chips) 
        VALUES ($1, $2, $3, $4, $5)
      `, ['mercetti', 'mercetti@example.com', passwordHash, 'owner', 10000]);
      
      console.log('✅ Created mercetti user successfully');
    } else {
      console.log('ℹ️ mercetti user already exists');
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Failed to create user:', error);
    return false;
  } finally {
    await pool.end();
  }
}

module.exports = { createSimpleUser };
