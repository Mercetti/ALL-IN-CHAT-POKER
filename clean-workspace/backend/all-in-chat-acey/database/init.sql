-- Acey Backend Database Initialization Script
-- Production-ready with proper indexing and constraints

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS acey;
USE acey;

-- Users table with proper indexing
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    tier VARCHAR(50) NOT NULL DEFAULT 'Free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_tier (tier),
    INDEX idx_users_created_at (created_at),
    INDEX idx_users_last_login (last_login)
);

-- Roles table for role-based access control
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_roles_name (name)
);

-- Tiers table for subscription management
CREATE TABLE IF NOT EXISTS tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    features JSON,
    skill_limit INTEGER DEFAULT 10,
    api_limit INTEGER DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tiers_name (name),
    INDEX idx_tiers_price (price)
);

-- Skills table for skill management
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    tier_required VARCHAR(50) NOT NULL DEFAULT 'Free',
    requires_approval BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_skills_name (name),
    INDEX idx_skills_category (category),
    INDEX idx_skills_tier_required (tier_required),
    INDEX idx_skills_is_active (is_active),
    INDEX idx_skills_usage_count (usage_count),
    INDEX idx_skills_created_at (created_at)
);

-- User skill permissions
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE KEY unique_user_skill (user_id, skill_id),
    INDEX idx_user_skills_user_id (user_id),
    INDEX idx_user_skills_skill_id (skill_id),
    INDEX idx_user_skills_granted_at (granted_at),
    INDEX idx_user_skills_expires_at (expires_at)
);

-- Partners table for partner management
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    trust_score DECIMAL(3,2) DEFAULT 5.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    pending_earnings DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partners_user_id (user_id),
    INDEX idx_partners_business_name (business_name),
    INDEX idx_partners_trust_score (trust_score),
    INDEX idx_partners_created_at (created_at)
);

-- Payouts table for partner payouts
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    estimated_delivery TIMESTAMP,
    transaction_id VARCHAR(255),
    notes TEXT,
    INDEX idx_payouts_partner_id (partner_id),
    INDEX idx_payouts_status (status),
    INDEX idx_payouts_created_at (created_at),
    INDEX idx_payouts_processed_at (processed_at)
);

-- Investors table for investor management
CREATE TABLE IF NOT EXISTS investors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    investment_amount DECIMAL(12,2) NOT NULL,
    equity_percentage DECIMAL(5,2),
    investment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_investors_user_id (user_id),
    INDEX idx_investors_investment_amount (investment_amount),
    INDEX idx_investors_investment_date (investment_date)
);

-- Security events table for audit logging
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    blocked BOOLEAN DEFAULT FALSE,
    reason TEXT,
    severity VARCHAR(20) DEFAULT 'low',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_security_events_user_id (user_id),
    INDEX idx_security_events_action (action),
    INDEX idx_security_events_created_at (created_at),
    INDEX idx_security_events_severity (severity),
    INDEX idx_security_events_blocked (blocked)
);

-- Audit logs table for comprehensive logging
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_table_name (table_name),
    INDEX idx_audit_logs_created_at (created_at),
    INDEX idx_audit_logs_record_id (record_id)
);

-- Dataset entries for AI training
CREATE TABLE IF NOT EXISTS dataset_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    input_data JSON NOT NULL,
    output_data JSON,
    feedback_score DECIMAL(3,2),
    feedback_text TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    INDEX idx_dataset_entries_skill_id (skill_id),
    INDEX idx_dataset_entries_status (status),
    INDEX idx_dataset_entries_created_at (created_at),
    INDEX idx_dataset_entries_feedback_score (feedback_score)
);

-- API keys for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions JSON,
    last_used TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_api_keys_user_id (user_id),
    INDEX idx_api_keys_key_hash (key_hash),
    INDEX idx_api_keys_is_active (is_active),
    INDEX idx_api_keys_expires_at (expires_at)
);

-- System metrics for monitoring
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    tags JSON,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_system_metrics_name (metric_name),
    INDEX idx_system_metrics_recorded_at (recorded_at),
    INDEX idx_system_metrics_name_recorded_at (metric_name, recorded_at)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    data JSON,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_priority (priority),
    INDEX idx_notifications_read_at (read_at),
    INDEX idx_notifications_created_at (created_at)
);

-- Mesh instances for multi-instance coordination
CREATE TABLE IF NOT EXISTS mesh_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'online',
    capabilities JSON,
    trust_score DECIMAL(3,2) DEFAULT 5.00,
    version VARCHAR(50),
    metadata JSON,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mesh_instances_instance_id (instance_id),
    INDEX idx_mesh_instances_status (status),
    INDEX idx_mesh_instances_last_sync (last_sync)
);

-- Mesh messages for inter-instance communication
CREATE TABLE IF NOT EXISTS mesh_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255) UNIQUE NOT NULL,
    from_instance VARCHAR(255) NOT NULL,
    to_instance VARCHAR(255) NOT NULL,
    message_type VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    encrypted BOOLEAN DEFAULT TRUE,
    signature VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    INDEX idx_mesh_messages_message_id (message_id),
    INDEX idx_mesh_messages_from_instance (from_instance),
    INDEX idx_mesh_messages_to_instance (to_instance),
    INDEX idx_mesh_messages_type (message_type),
    INDEX idx_mesh_messages_status (status),
    INDEX idx_mesh_messages_created_at (created_at)
);

-- Insert default data
INSERT IGNORE INTO roles (name, description, permissions) VALUES
('owner', 'System owner with full access', '{"all": true}'),
('dev', 'Developer with system access', '{"skills": ["read", "write"], "users": ["read"], "security": ["read"]}'),
('streamer', 'Content creator', '{"skills": ["read", "execute"], "analytics": ["read"]}'),
('user', 'Regular user', '{"skills": ["read", "execute"], "profile": ["read", "write"]}'),
('partner', 'Business partner', '{"payouts": ["read", "write"], "analytics": ["read"]}'),
('investor', 'Investor', '{"analytics": ["read"], "reports": ["read"]}');

INSERT IGNORE INTO tiers (name, price, features, skill_limit, api_limit) VALUES
('Free', 0.00, '{"skills": ["basic"], "support": "community"}', 5, 100),
('Pro', 29.99, '{"skills": ["advanced"], "support": "email", "analytics": true}', 20, 1000),
('Creator+', 99.99, '{"skills": ["all"], "support": "priority", "analytics": true, "api": true}', 100, 10000),
('Enterprise', 499.99, '{"skills": ["all"], "support": "24/7", "analytics": true, "api": true, "custom": true}', -1, -1);

-- Create triggers for audit logging
DELIMITER //
CREATE TRIGGER audit_users_insert AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (NEW.id, 'INSERT', 'users', NEW.id, JSON_OBJECT(
        'email', NEW.email,
        'role', NEW.role,
        'tier', NEW.tier,
        'created_at', NEW.created_at
    ));
END//

CREATE TRIGGER audit_users_update AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (NEW.id, 'UPDATE', 'users', NEW.id, JSON_OBJECT(
        'email', OLD.email,
        'role', OLD.role,
        'tier', OLD.tier,
        'updated_at', OLD.updated_at
    ), JSON_OBJECT(
        'email', NEW.email,
        'role', NEW.role,
        'tier', NEW.tier,
        'updated_at', NEW.updated_at
    ));
END//

DELIMITER ;

-- Create views for common queries
CREATE OR REPLACE VIEW user_summary AS
SELECT 
    u.id,
    u.email,
    u.role,
    u.tier,
    u.created_at,
    u.last_login,
    COUNT(DISTINCT us.skill_id) as skill_count,
    COALESCE(p.total_earnings, 0) as total_earnings
FROM users u
LEFT JOIN user_skills us ON u.id = us.user_id AND us.is_active = TRUE
LEFT JOIN partners p ON u.id = p.user_id
GROUP BY u.id, u.email, u.role, u.tier, u.created_at, u.last_login;

CREATE OR REPLACE VIEW skill_performance AS
SELECT 
    s.id,
    s.name,
    s.category,
    s.tier_required,
    s.usage_count,
    s.revenue_generated,
    COUNT(DISTINCT us.user_id) as active_users,
    AVG(de.feedback_score) as avg_feedback_score
FROM skills s
LEFT JOIN user_skills us ON s.id = us.skill_id AND us.is_active = TRUE
LEFT JOIN dataset_entries de ON s.id = de.skill_id AND de.feedback_score IS NOT NULL
GROUP BY s.id, s.name, s.category, s.tier_required, s.usage_count, s.revenue_generated;

-- Performance optimization: Create composite indexes for common query patterns
CREATE INDEX idx_users_role_tier ON users(role, tier);
CREATE INDEX idx_security_events_user_created ON security_events(user_id, created_at);
CREATE INDEX idx_audit_logs_user_action_created ON audit_logs(user_id, action, created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_mesh_messages_pending ON mesh_messages(status, created_at) WHERE status = 'pending';

-- Set up database configuration for performance
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL innodb_log_file_size = 268435456; -- 256MB
SET GLOBAL innodb_flush_log_at_trx_commit = 2;
SET GLOBAL sync_binlog = 0;

-- Create database user for application
CREATE USER IF NOT EXISTS 'acey_app'@'%' IDENTIFIED BY 'secure_password_123';
GRANT SELECT, INSERT, UPDATE, DELETE ON acey.* TO 'acey_app'@'%';
FLUSH PRIVILEGES;

-- Final verification
SELECT 'Database initialization completed successfully' as status;
