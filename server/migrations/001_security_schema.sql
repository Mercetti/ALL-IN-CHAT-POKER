-- Security Schema Migration
-- Creates tables for unlock ceremony, incident management, and audit logging

-- Unlock Requests Table
CREATE TABLE IF NOT EXISTS unlock_requests (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  reason TEXT,
  stage TEXT NOT NULL DEFAULT 'BIOMETRIC_PENDING',
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  results TEXT, -- JSON string of integrity check results
  rehydration_result TEXT, -- JSON string of rehydration results
  completed_at INTEGER,
  FOREIGN KEY (device_id) REFERENCES devices (device_id),
  FOREIGN KEY (owner_id) REFERENCES users (id)
);

-- Create indexes for unlock_requests
CREATE INDEX IF NOT EXISTS idx_unlock_requests_status ON unlock_requests (status);
CREATE INDEX IF NOT EXISTS idx_unlock_requests_device ON unlock_requests (device_id);
CREATE INDEX IF NOT EXISTS idx_unlock_requests_owner ON unlock_requests (owner_id);
CREATE INDEX IF NOT EXISTS idx_unlock_requests_created_at ON unlock_requests (created_at);

-- Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  trigger TEXT NOT NULL,
  affected_systems TEXT NOT NULL, -- JSON array
  root_cause TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'MITIGATED', 'RESOLVED')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  description TEXT,
  created_by TEXT NOT NULL,
  actions_taken TEXT DEFAULT '[]', -- JSON array
  learning_enabled BOOLEAN DEFAULT FALSE,
  resolution TEXT,
  FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Create indexes for incidents
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents (severity);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents (created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_created_by ON incidents (created_by);

-- Incident Learning Table
CREATE TABLE IF NOT EXISTS incident_learning (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT NOT NULL,
  resolution TEXT NOT NULL,
  trigger TEXT NOT NULL,
  affected_systems TEXT NOT NULL, -- JSON array
  created_at INTEGER NOT NULL,
  learning_timestamp INTEGER NOT NULL,
  applied_at INTEGER DEFAULT NULL,
  effectiveness_score REAL,
  FOREIGN KEY (incident_id) REFERENCES incidents (id)
);

-- Create indexes for incident learning
CREATE INDEX IF NOT EXISTS idx_incident_learning_incident ON incident_learning (incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_learning_timestamp ON incident_learning (learning_timestamp);

-- Enhanced Audit Events Table (extends existing)
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  time INTEGER NOT NULL,
  type TEXT NOT NULL,
  summary TEXT NOT NULL,
  trust_impact REAL DEFAULT 0,
  metadata TEXT DEFAULT '{}', -- JSON object
  user_id TEXT,
  device_id TEXT,
  session_id TEXT,
  parent_event_id TEXT,
  child_event_ids TEXT DEFAULT '[]', -- JSON array
  severity TEXT NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  category TEXT NOT NULL DEFAULT 'SYSTEM' CHECK (category IN ('SYSTEM', 'USER', 'AI', 'SECURITY', 'ERROR', 'SUCCESS')),
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (device_id) REFERENCES devices (device_id)
);

-- Create indexes for audit_events
CREATE INDEX IF NOT EXISTS idx_audit_events_time ON audit_events (time);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events (type);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_events (severity);
CREATE INDEX IF NOT EXISTS idx_audit_events_category ON audit_events (category);
CREATE INDEX IF NOT EXISTS idx_audit_events_user ON audit_events (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_device ON audit_events (device_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_metadata ON audit_events (metadata); -- For JSON queries

-- Security Events Table (for security-specific events)
CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN (
    'login_attempt',
    'permission_denied',
    'suspicious_activity',
    'data_access',
    'config_change',
    'biometric_failure',
    'unlock_attempt',
    'incident_triggered'
  )),
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  user_id TEXT,
  device_id TEXT,
  ip_address TEXT,
  description TEXT NOT NULL,
  details TEXT DEFAULT '{}', -- JSON object
  timestamp INTEGER NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by TEXT,
  resolved_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (device_id) REFERENCES devices (device_id)
);

-- Create indexes for security_events
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events (type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events (severity);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events (timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events (resolved);

-- Device Trust Table (extends existing devices table)
CREATE TABLE IF NOT EXISTS device_trust (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL UNIQUE,
  trust_score REAL DEFAULT 0.5,
  last_seen INTEGER NOT NULL,
  capabilities TEXT DEFAULT '[]', -- JSON array
  security_flags TEXT DEFAULT '{}', -- JSON object
  risk_level TEXT DEFAULT 'MEDIUM' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  is_compromised BOOLEAN DEFAULT FALSE,
  compromised_at INTEGER,
  FOREIGN KEY (device_id) REFERENCES devices (device_id)
);

-- Create indexes for device_trust
CREATE INDEX IF NOT EXISTS idx_device_trust_device ON device_trust (device_id);
CREATE INDEX IF NOT EXISTS idx_device_trust_score ON device_trust (trust_score);
CREATE INDEX IF NOT EXISTS idx_device_trust_compromised ON device_trust (is_compromised);

-- System State Table
CREATE TABLE IF NOT EXISTS system_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_by TEXT,
  FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Insert default system state values
INSERT OR IGNORE INTO system_state (key, value) VALUES 
  ('mode', 'NORMAL'),
  ('auto_rules_enabled', 'true'),
  ('emergency_lock', 'false'),
  ('last_integrity_check', strftime('%s', 'now')),
  ('active_model', 'default'),
  ('trust_threshold', '0.5');

-- Pending Operations Table
CREATE TABLE IF NOT EXISTS pending_operations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  description TEXT NOT NULL,
  metadata TEXT DEFAULT '{}', -- JSON object
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED')),
  result TEXT,
  FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Create indexes for pending_operations
CREATE INDEX IF NOT EXISTS idx_pending_operations_status ON pending_operations (status);
CREATE INDEX IF NOT EXISTS idx_pending_operations_risk ON pending_operations (risk_level);
CREATE INDEX IF NOT EXISTS idx_pending_operations_expires ON pending_operations (expires_at);

-- Compliance Reports Table
CREATE TABLE IF NOT EXISTS compliance_reports (
  id TEXT PRIMARY KEY,
  generated_at INTEGER NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  summary TEXT NOT NULL, -- JSON object with summary stats
  findings TEXT DEFAULT '[]', -- JSON array of findings
  recommendations TEXT DEFAULT '[]', -- JSON array of recommendations
  status TEXT NOT NULL CHECK (status IN ('COMPLIANT', 'NON_COMPLIANT', 'REQUIRES_REVIEW')),
  generated_by TEXT NOT NULL,
  FOREIGN KEY (generated_by) REFERENCES users (id)
);

-- Create indexes for compliance_reports
CREATE INDEX IF NOT EXISTS idx_compliance_reports_period ON compliance_reports (period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports (status);

-- Security Metrics Table
CREATE TABLE IF NOT EXISTS security_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  trust_score REAL DEFAULT 0.5,
  active_threats INTEGER DEFAULT 0,
  blocked_attempts INTEGER DEFAULT 0,
  successful_authentications INTEGER DEFAULT 0,
  biometric_success_rate REAL DEFAULT 0.0,
  incident_count INTEGER DEFAULT 0,
  average_resolution_time INTEGER DEFAULT 0,
  policy_violations INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create indexes for security_metrics
CREATE INDEX IF NOT EXISTS idx_security_metrics_timestamp ON security_metrics (timestamp);

-- Views for common queries
CREATE VIEW IF NOT EXISTS v_active_incidents AS
SELECT 
  id,
  severity,
  trigger,
  affected_systems,
  created_at,
  updated_at,
  description,
  created_by,
  actions_taken
FROM incidents 
WHERE status = 'OPEN'
ORDER BY severity DESC, created_at DESC;

CREATE VIEW IF NOT EXISTS v_recent_security_events AS
SELECT 
  id,
  type,
  severity,
  description,
  timestamp,
  resolved,
  user_id,
  device_id
FROM security_events 
WHERE timestamp > (strftime('%s', 'now', '-24 hours'))
ORDER BY timestamp DESC;

CREATE VIEW IF NOT EXISTS v_device_trust_status AS
SELECT 
  d.device_id,
  d.platform,
  d.is_trusted,
  dt.trust_score,
  dt.risk_level,
  dt.is_compromised,
  dt.last_seen,
  dt.capabilities
FROM devices d
LEFT JOIN device_trust dt ON d.device_id = dt.device_id;

-- Triggers for automatic cleanup
CREATE TRIGGER IF NOT EXISTS cleanup_expired_unlock_requests
AFTER INSERT ON unlock_requests
BEGIN
  DELETE FROM unlock_requests 
  WHERE status = 'PENDING' AND expires_at < strftime('%s', 'now');
END;

CREATE TRIGGER IF NOTIGGER cleanup_expired_pending_operations
AFTER INSERT ON pending_operations
BEGIN
  UPDATE pending_operations 
  SET status = 'EXPIRED' 
  WHERE status = 'PENDING' AND expires_at < strftime('%s', 'now');
END;

-- Trigger to update audit trail timestamp
CREATE TRIGGER IF NOT EXISTS update_audit_events_timestamp
AFTER UPDATE ON audit_events
BEGIN
  UPDATE audit_events SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

-- Trigger to log system state changes
CREATE TRIGGER IF NOT EXISTS log_system_state_changes
AFTER UPDATE ON system_state
BEGIN
  INSERT INTO audit_events (
    id, time, type, summary, trust_impact, metadata, category
  ) VALUES (
    'state_change_' || strftime('%s_%f', 'now'),
    strftime('%s', 'now'),
    'SYSTEM_STATE_CHANGE',
    'System state changed: ' || OLD.key || ' -> ' || NEW.key,
    0,
    json_object(
      'old_value', OLD.value,
      'new_value', NEW.value,
      'changed_by', NEW.updated_by
    ),
    'SYSTEM'
  );
END;
