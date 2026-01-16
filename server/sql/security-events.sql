-- Security Events Table for Acey Security Observer
-- Stores all security-related events and alerts

CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,                    -- Event type (FILE_CHANGE, SYSTEM_ANOMALY, SECURITY_ALERT, etc.)
    subtype TEXT,                          -- Event subtype (modified, deleted, added, etc.)
    timestamp INTEGER NOT NULL,              -- Unix timestamp when event occurred
    severity TEXT DEFAULT 'LOW',            -- Severity level (LOW, MEDIUM, HIGH, CRITICAL)
    path TEXT,                             -- File path (for file-related events)
    details TEXT,                          -- JSON details of the event
    status TEXT DEFAULT 'ACTIVE',           -- Event status (ACTIVE, RESOLVED, IGNORED)
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    acknowledged_at INTEGER,                 -- When founder acknowledged the event
    resolved_at INTEGER,                    -- When event was resolved
    resolution_notes TEXT                   -- Notes about resolution
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(status);

-- Security Baselines Table
-- Stores system baselines for integrity checking

CREATE TABLE IF NOT EXISTS security_baselines (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    total_files INTEGER NOT NULL,
    total_size INTEGER NOT NULL,
    directories TEXT NOT NULL,              -- JSON of directory information
    file_hashes TEXT NOT NULL,              -- JSON of file hashes
    is_active BOOLEAN DEFAULT 1,           -- Whether this is the active baseline
    created_by TEXT DEFAULT 'acey',         -- Who created the baseline
    notes TEXT                             -- Additional notes
);

CREATE INDEX IF NOT EXISTS idx_security_baselines_active ON security_baselines(is_active);
CREATE INDEX IF NOT EXISTS idx_security_baselines_created_at ON security_baselines(created_at);

-- Trust Scores Table
-- Tracks trust levels for users, skills, and components

CREATE TABLE IF NOT EXISTS trust_scores (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,              -- Type of entity (user, skill, component)
    entity_id TEXT NOT NULL,               -- ID of the entity
    trust_level REAL NOT NULL DEFAULT 2.0, -- Current trust score (0-4)
    last_updated INTEGER NOT NULL,           -- When trust score was last updated
    update_reason TEXT,                     -- Reason for trust score change
    factors TEXT,                          -- JSON of factors affecting score
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_trust_scores_entity ON trust_scores(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_level ON trust_scores(trust_level);

-- Security Configuration Table
-- Stores security monitoring configuration

CREATE TABLE IF NOT EXISTS security_config (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,               -- Configuration key
    value TEXT NOT NULL,                    -- Configuration value
    description TEXT,                        -- Description of the configuration
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_by TEXT DEFAULT 'acey'           -- Who updated the configuration
);

-- Insert default security configuration
INSERT OR IGNORE INTO security_config (id, key, value, description) VALUES
    ('file_change_threshold', '10', 'Number of file changes that trigger alert in 5 minutes'),
    ('failed_login_threshold', '3', 'Number of failed logins that trigger alert in 1 minute'),
    ('unusual_process_threshold', '5', 'Number of unusual processes that trigger alert'),
    ('data_exfiltration_threshold', '104857600', 'Bytes of data transfer that trigger alert (100MB)'),
    ('monitoring_interval', '300000', 'File integrity check interval in milliseconds (5 minutes)'),
    ('metrics_interval', '60000', 'System metrics collection interval in milliseconds (1 minute)'),
    ('alert_retention_days', '90', 'Days to retain security alerts'),
    ('baseline_retention_days', '365', 'Days to retain security baselines');

-- Security Incidents Table
-- Tracks resolved security incidents for analysis

CREATE TABLE IF NOT EXISTS security_incidents (
    id TEXT PRIMARY KEY,
    incident_type TEXT NOT NULL,            -- Type of incident
    severity TEXT NOT NULL,                 -- Incident severity
    started_at INTEGER NOT NULL,             -- When incident started
    resolved_at INTEGER,                    -- When incident was resolved
    duration_minutes INTEGER,                -- Total duration in minutes
    affected_systems TEXT,                  -- JSON of affected systems
    root_cause TEXT,                       -- Analysis of root cause
    impact_assessment TEXT,                 -- JSON of impact analysis
    resolution_steps TEXT,                  -- JSON of resolution steps
    lessons_learned TEXT,                  -- Lessons from the incident
    status TEXT DEFAULT 'OPEN',            -- Incident status (OPEN, INVESTIGATING, RESOLVED, CLOSED)
    assigned_to TEXT DEFAULT 'acey',        -- Who is handling the incident
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_started_at ON security_incidents(started_at);

-- Security Alerts Table
-- Active alerts that need attention

CREATE TABLE IF NOT EXISTS security_alerts (
    id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL,               -- Type of alert
    severity TEXT NOT NULL,                 -- Alert severity
    title TEXT NOT NULL,                   -- Alert title
    message TEXT NOT NULL,                  -- Alert message
    details TEXT,                          -- JSON of alert details
    triggered_at INTEGER NOT NULL,           -- When alert was triggered
    acknowledged_at INTEGER,                -- When alert was acknowledged
    resolved_at INTEGER,                    -- When alert was resolved
    status TEXT DEFAULT 'ACTIVE',          -- Alert status (ACTIVE, ACKNOWLEDGED, RESOLVED, IGNORED)
    acknowledged_by TEXT,                   -- Who acknowledged the alert
    resolution_notes TEXT,                  -- Notes about resolution
    auto_resolved BOOLEAN DEFAULT 0,       -- Whether alert was auto-resolved
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_triggered_at ON security_alerts(triggered_at);
