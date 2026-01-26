-- AI Jobs Table for Background Processing
CREATE TABLE IF NOT EXISTS ai_jobs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    parameters JSONB,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- AI Generated Assets Table
CREATE TABLE IF NOT EXISTS ai_generated_assets (
    id VARCHAR(255) PRIMARY KEY,
    asset_type VARCHAR(100) NOT NULL,
    image_url TEXT,
    parameters JSONB,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Avatars Table
CREATE TABLE IF NOT EXISTS user_avatars (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    image_url TEXT,
    parameters JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_user ON ai_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_type ON ai_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ai_assets_type ON ai_generated_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_user_avatars_user ON user_avatars(user_id);

-- Insert sample AI job types for testing
INSERT OR IGNORE INTO ai_jobs (id, user_id, job_type, status, parameters) VALUES 
('test-job-1', 'test-user', 'cosmetic_generation', 'pending', '{"prompt": "Generate a red card back", "type": "card_back"}'),
('test-job-2', 'test-user', 'card_design', 'pending', '{"theme": "neon", "colors": ["red", "blue"], "style": "modern"}'),
('test-job-3', 'test-user', 'chip_style', 'pending', '{"base_style": "classic", "colors": ["gold"], "effects": "glow"}');
