-- ACEY FINANCIAL OPERATIONS SYSTEM - DATABASE SCHEMA
-- Audit-safe, append-only financial tracking system
-- Core Safety Rules: Acey CANNOT send money or trigger payouts
-- Only collect revenue data, calculate payouts, prepare batches, detect anomalies

-- ========================================
-- 1. FINANCIAL EVENTS TABLE (Append-only audit trail)
-- ========================================
CREATE TABLE IF NOT EXISTS financial_events (
    id TEXT PRIMARY KEY,                    -- Unique event identifier
    event_type TEXT NOT NULL,               -- 'revenue', 'expense', 'adjustment'
    event_category TEXT NOT NULL,           -- 'streaming', 'donations', 'ads', 'fees'
    amount_cents INTEGER NOT NULL,          -- Amount in cents (to avoid floating point)
    currency TEXT DEFAULT 'USD',           -- Currency code
    partner_id TEXT,                         -- Partner identifier (nullable for system events)
    partner_name TEXT,                       -- Partner display name
    event_date INTEGER NOT NULL,            -- Unix timestamp
    event_date_iso TEXT NOT NULL,           -- ISO 8601 date string
    description TEXT NOT NULL,               -- Human-readable description
    metadata TEXT,                          -- Additional JSON metadata
    source_system TEXT NOT NULL,           -- 'twitch', 'paypal', 'stripe', 'manual'
    reference_id TEXT,                      -- External reference (transaction ID, etc.)
    status TEXT DEFAULT 'confirmed',        -- 'pending', 'confirmed', 'rejected'
    created_at INTEGER NOT NULL,           -- Creation timestamp
    created_by TEXT NOT NULL,              -- Who created this event
    -- Audit fields
    audit_hash TEXT NOT NULL,               -- SHA-256 hash of event data for integrity
    audit_signature TEXT,                    -- Digital signature for high-value events
    audit_version INTEGER DEFAULT 1         -- Schema version for audit compatibility
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_events_date ON financial_events(event_date);
CREATE INDEX IF NOT EXISTS idx_financial_events_partner ON financial_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_financial_events_type ON financial_events(event_type);
CREATE INDEX IF NOT EXISTS idx_financial_events_status ON financial_events(status);

-- ========================================
-- 2. PARTNER PROFILES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS partner_profiles (
    partner_id TEXT PRIMARY KEY,            -- Unique partner identifier
    partner_name TEXT NOT NULL,             -- Display name
    partner_email TEXT,                     -- Contact email
    partner_type TEXT NOT NULL,             -- 'streamer', 'affiliate', 'sponsor', 'vendor'
    status TEXT DEFAULT 'active',          -- 'active', 'inactive', 'suspended'
    created_at INTEGER NOT NULL,           -- When partner was added
    updated_at INTEGER NOT NULL,           -- Last update timestamp
    -- Financial configuration
    revenue_share_percent INTEGER DEFAULT 0, -- Revenue share percentage (0-100)
    minimum_payout_cents INTEGER DEFAULT 10000, -- Minimum payout amount ($100)
    payout_frequency TEXT DEFAULT 'monthly', -- 'weekly', 'monthly', 'quarterly'
    -- Payout preferences (stored elsewhere for security)
    payout_method TEXT DEFAULT 'paypal',   -- 'paypal', 'bank_transfer', 'crypto'
    payout_currency TEXT DEFAULT 'USD',    -- Preferred payout currency
    -- Contact and verification
    verified_at INTEGER,                    -- When partner was verified
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    notes TEXT,                             -- Internal notes
    -- Audit fields
    audit_hash TEXT NOT NULL,               -- SHA-256 hash of profile data
    created_by TEXT NOT NULL               -- Who created this profile
);

-- ========================================
-- 3. MONTHLY LEDGERS TABLE (Calculated, not editable)
-- ========================================
CREATE TABLE IF NOT EXISTS monthly_ledgers (
    id TEXT PRIMARY KEY,                    -- Unique ledger identifier
    ledger_month TEXT NOT NULL,             -- YYYY-MM format
    partner_id TEXT NOT NULL,               -- Partner identifier
    total_revenue_cents INTEGER NOT NULL,   -- Total revenue for the month
    total_expenses_cents INTEGER DEFAULT 0, -- Total expenses for the month
    net_revenue_cents INTEGER NOT NULL,     -- Net revenue after expenses
    payout_cents INTEGER NOT NULL,          -- Calculated payout amount
    payout_status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'paid', 'rejected'
    events_count INTEGER DEFAULT 0,         -- Number of financial events
    created_at INTEGER NOT NULL,           -- When ledger was created
    updated_at INTEGER NOT NULL,           -- When ledger was last updated
    -- Calculated fields
    revenue_share_percent INTEGER NOT NULL, -- Revenue share percentage
    minimum_payout_met INTEGER DEFAULT 0,   -- Whether minimum payout threshold met
    -- Audit fields
    calculation_hash TEXT NOT NULL,         -- Hash of calculation inputs
    calculation_version INTEGER DEFAULT 1, -- Calculation algorithm version
    created_by TEXT NOT NULL               -- Who triggered calculation
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_ledgers_month ON monthly_ledgers(ledger_month);
CREATE INDEX IF NOT EXISTS idx_monthly_ledgers_partner ON monthly_ledgers(partner_id);
CREATE INDEX IF NOT EXISTS idx_monthly_ledgers_status ON monthly_ledgers(payout_status);

-- ========================================
-- 4. PAYOUT BATCHES TABLE (Await founder approval)
-- ========================================
CREATE TABLE IF NOT EXISTS payout_batches (
    batch_id TEXT PRIMARY KEY,              -- Unique batch identifier
    batch_name TEXT NOT NULL,               -- Human-readable batch name
    batch_month TEXT NOT NULL,               -- YYYY-MM format
    total_partners INTEGER NOT NULL,        -- Number of partners in batch
    total_amount_cents INTEGER NOT NULL,    -- Total payout amount in cents
    currency TEXT DEFAULT 'USD',           -- Currency
    status TEXT DEFAULT 'pending',          -- 'pending', 'approved', 'rejected', 'processing', 'completed'
    created_at INTEGER NOT NULL,           -- When batch was created
    updated_at INTEGER NOT NULL,           -- When batch was last updated
    -- Approval workflow
    requested_by TEXT NOT NULL,            -- Who requested the batch
    approved_by TEXT,                       -- Who approved the batch (if approved)
    approved_at INTEGER,                    -- When batch was approved
    rejection_reason TEXT,                  -- Reason for rejection (if rejected)
    -- Processing information
    processing_started_at INTEGER,         -- When processing started
    processing_completed_at INTEGER,        -- When processing completed
    processing_method TEXT DEFAULT 'paypal', -- 'paypal', 'bank_transfer', 'crypto'
    processing_reference TEXT,              -- External processing reference
    -- Audit fields
    batch_hash TEXT NOT NULL,               -- Hash of all ledger data in batch
    approval_hash TEXT,                      -- Hash of approval data
    created_by TEXT NOT NULL               -- Who created the batch
);

-- ========================================
-- 5. FINANCIAL FLAGS TABLE (Anomaly detection)
-- ========================================
CREATE TABLE IF NOT EXISTS financial_flags (
    flag_id TEXT PRIMARY KEY,               -- Unique flag identifier
    flag_type TEXT NOT NULL,                 -- 'anomaly', 'compliance', 'threshold', 'manual'
    flag_severity TEXT NOT NULL,             -- 'low', 'medium', 'high', 'critical'
    flag_title TEXT NOT NULL,               -- Short description
    flag_description TEXT NOT NULL,         -- Detailed description
    affected_entity_type TEXT NOT NULL,     -- 'partner', 'ledger', 'batch', 'event'
    affected_entity_id TEXT NOT NULL,       -- ID of affected entity
    flag_date INTEGER NOT NULL,             -- When flag was raised
    flag_status TEXT DEFAULT 'active',      -- 'active', 'resolved', 'ignored'
    resolution_notes TEXT,                  -- How the flag was resolved
    resolved_at INTEGER,                    -- When flag was resolved
    resolved_by TEXT,                       -- Who resolved the flag
    -- Detection information
    detection_rule TEXT,                    -- Rule that triggered the flag
    detection_threshold TEXT,               -- Threshold that was exceeded
    actual_value TEXT,                      -- Actual value that triggered flag
    expected_value TEXT,                    -- Expected/normal value range
    -- Audit fields
    created_at INTEGER NOT NULL,           -- When flag was created
    created_by TEXT NOT NULL               -- Who created the flag
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_flags_status ON financial_flags(flag_status);
CREATE INDEX IF NOT EXISTS idx_financial_flags_severity ON financial_flags(flag_severity);
CREATE INDEX IF NOT EXISTS idx_financial_flags_entity ON financial_flags(affected_entity_type, affected_entity_id);

-- ========================================
-- 6. AUDIT LOG TABLE (Comprehensive audit trail)
-- ========================================
CREATE TABLE IF NOT EXISTS financial_audit_log (
    log_id TEXT PRIMARY KEY,                -- Unique log identifier
    action_type TEXT NOT NULL,              -- 'create', 'update', 'delete', 'approve', 'reject'
    table_name TEXT NOT NULL,               -- Which table was affected
    record_id TEXT NOT NULL,                -- Which record was affected
    old_values TEXT,                        -- JSON of old values (for updates)
    new_values TEXT,                        -- JSON of new values
    action_date INTEGER NOT NULL,           -- When action occurred
    action_by TEXT NOT NULL,                -- Who performed the action
    action_ip TEXT,                         -- IP address of action
    user_agent TEXT,                        -- Browser/client info
    session_id TEXT,                        -- Session identifier
    -- Security fields
    authentication_method TEXT,             -- How user was authenticated
    authorization_level TEXT,               -- User's authorization level
    -- System fields
    created_at INTEGER NOT NULL,           -- When log entry was created
    log_hash TEXT NOT NULL                  -- Hash of log entry for integrity
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_audit_date ON financial_audit_log(action_date);
CREATE INDEX IF NOT EXISTS idx_financial_audit_table ON financial_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_financial_audit_record ON financial_audit_log(record_id);

-- ========================================
-- 7. SYSTEM CONFIGURATION TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS financial_system_config (
    config_key TEXT PRIMARY KEY,            -- Configuration key
    config_value TEXT NOT NULL,             -- Configuration value
    config_type TEXT NOT NULL,              -- 'string', 'number', 'boolean', 'json'
    description TEXT NOT NULL,               -- Human-readable description
    is_sensitive INTEGER DEFAULT 0,        -- Whether value is sensitive (encrypted)
    created_at INTEGER NOT NULL,           -- When config was created
    updated_at INTEGER NOT NULL,           -- When config was last updated
    updated_by TEXT NOT NULL               -- Who updated the config
);

-- Insert default configuration
INSERT OR REPLACE INTO financial_system_config VALUES 
    ('payout_minimum_cents', '10000', 'number', 'Minimum payout amount in cents ($100)', 0, strftime('%s', 'now'), strftime('%s', 'now'), 'system'),
    ('payout_frequency', 'monthly', 'string', 'Default payout frequency', 0, strftime('%s', 'now'), strftime('%s', 'now'), 'system'),
    ('default_revenue_share', '50', 'number', 'Default revenue share percentage', 0, strftime('%s', 'now'), strftime('%s', 'now'), 'system'),
    ('anomaly_threshold_multiplier', '2.0', 'number', 'Anomaly detection threshold multiplier', 0, strftime('%s', 'now'), strftime('%s', 'now'), 'system'),
    ('audit_retention_days', '2555', 'number', 'How many days to retain audit logs (7 years)', 0, strftime('%s', 'now'), strftime('%s', 'now'), 'system');

-- ========================================
-- 8. TRIGGERS AND CONSTRAINTS
-- ========================================

-- Ensure financial_events is append-only
CREATE TRIGGER IF NOT EXISTS prevent_financial_events_update
BEFORE UPDATE ON financial_events
BEGIN
    SELECT RAISE(FAIL, 'Financial events table is append-only - updates not allowed');
END;

-- Ensure monthly_ledgers are calculated (not manually editable)
CREATE TRIGGER IF NOT EXISTS prevent_monthly_ledgers_manual_insert
BEFORE INSERT ON monthly_ledgers
WHEN NEW.created_by != 'system'
BEGIN
    SELECT RAISE(FAIL, 'Monthly ledgers can only be created by system calculations');
END;

-- Ensure payout_batches require proper approval
CREATE TRIGGER IF NOT EXISTS validate_payout_batch_approval
BEFORE UPDATE ON monthly_ledgers
WHEN NEW.payout_status = 'approved' AND OLD.payout_status != 'approved'
BEGIN
    SELECT RAISE(FAIL, 'Payout approval requires proper approval workflow');
END;

-- ========================================
-- 9. VIEWS FOR COMMON QUERIES
-- ========================================

-- Partner revenue summary view
CREATE VIEW IF NOT EXISTS partner_revenue_summary AS
SELECT 
    p.partner_id,
    p.partner_name,
    p.partner_type,
    p.status,
    COALESCE(SUM(CASE WHEN fe.event_type = 'revenue' THEN fe.amount_cents ELSE 0 END), 0) as total_revenue_cents,
    COALESCE(SUM(CASE WHEN fe.event_type = 'expense' THEN fe.amount_cents ELSE 0 END), 0) as total_expenses_cents,
    COALESCE(SUM(fe.amount_cents), 0) as net_revenue_cents,
    COUNT(fe.id) as total_events,
    MAX(fe.event_date) as last_event_date
FROM partner_profiles p
LEFT JOIN financial_events fe ON p.partner_id = fe.partner_id
WHERE p.status = 'active'
GROUP BY p.partner_id, p.partner_name, p.partner_type, p.status;

-- Monthly financial summary view
CREATE VIEW IF NOT EXISTS monthly_financial_summary AS
SELECT 
    strftime('%Y-%m', datetime(fe.event_date, 'unixepoch')) as month,
    SUM(CASE WHEN fe.event_type = 'revenue' THEN fe.amount_cents ELSE 0 END) as total_revenue_cents,
    SUM(CASE WHEN fe.event_type = 'expense' THEN fe.amount_cents ELSE 0 END) as total_expenses_cents,
    SUM(fe.amount_cents) as net_revenue_cents,
    COUNT(DISTINCT fe.partner_id) as active_partners,
    COUNT(fe.id) as total_events
FROM financial_events fe
GROUP BY strftime('%Y-%m', datetime(fe.event_date, 'unixepoch'))
ORDER BY month DESC;

-- ========================================
-- 10. SAMPLE DATA (for development/testing)
-- ========================================

-- Insert sample partner profiles
INSERT OR REPLACE INTO partner_profiles VALUES
    ('partner_001', 'TestStreamer', 'streamer@test.com', 'streamer', 'active', strftime('%s', 'now'), strftime('%s', 'now'), 50, 10000, 'monthly', 'paypal', 'USD', strftime('%s', 'now'), 'verified', NULL, 'Test streamer account', sha256('partner_001'), 'system'),
    ('partner_002', 'TestAffiliate', 'affiliate@test.com', 'affiliate', 'active', strftime('%s', 'now'), strftime('%s', 'now'), 30, 5000, 'monthly', 'paypal', 'USD', strftime('%s', 'now'), 'verified', NULL, 'Test affiliate account', sha256('partner_002', 'system');

-- Insert sample financial events
INSERT OR REPLACE INTO financial_events VALUES
    ('event_001', 'revenue', 'streaming', 50000, 'USD', 'partner_001', 'TestStreamer', strftime('%s', 'now'), strftime('%Y-%m-%d', 'now'), 'Monthly streaming revenue', '{"platform": "twitch", "subs": 100, "bits": 500}', 'twitch', 'txn_001', 'confirmed', strftime('%s', 'now'), 'system', sha256('event_001'), NULL, 1),
    ('event_002', 'revenue', 'donations', 25000, 'USD', 'partner_001', 'TestStreamer', strftime('%s', 'now'), strftime('%Y-%m-%d', 'now'), 'Donation revenue', '{"platform": "paypal", "donations": 5}', 'paypal', 'don_001', 'confirmed', strftime('%s', 'now'), 'system', sha256('event_002'), NULL, 1);

-- ========================================
-- SCHEMA VERSION AND MIGRATION TRACKING
-- ========================================
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at INTEGER NOT NULL,
    applied_by TEXT NOT NULL
);

INSERT OR REPLACE INTO schema_migrations VALUES 
    (1, 'Initial ACEY Financial Operations System schema', strftime('%s', 'now'), 'system');
