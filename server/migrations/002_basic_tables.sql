-- Basic tables needed for the security system

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_login INTEGER,
  is_active BOOLEAN DEFAULT 1
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  version TEXT,
  is_trusted BOOLEAN DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_seen INTEGER DEFAULT (strftime('%s', 'now')),
  capabilities TEXT DEFAULT '[]', -- JSON array
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Insert default owner user
INSERT OR IGNORE INTO users (id, login, password_hash, role) VALUES 
  ('owner_1', 'mercetti', 'hashed_password_here', 'owner');

-- Insert default system state values
INSERT OR IGNORE INTO system_state (key, value) VALUES 
  ('mode', 'NORMAL'),
  ('auto_rules_enabled', 'true'),
  ('emergency_lock', 'false'),
  ('last_integrity_check', strftime('%s', 'now')),
  ('active_model', 'default'),
  ('trust_threshold', '0.5');
