// Database Schema for Acey LLM Orchestrator
// SOC-lite compliant, investor-ready, and scalable

export interface User {
  id: string;
  email: string;
  role: 'owner' | 'dev' | 'user' | 'partner' | 'investor';
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  permissions: string[];
  trustScore: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  metadata?: any;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'code' | 'audio' | 'graphics' | 'link' | 'payout' | 'analytics';
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  requiresApproval: boolean;
  isActive: boolean;
  usageCount: number;
  averageRating: number;
  revenueGenerated: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  accessGranted: boolean;
  grantedAt: string;
  expiresAt?: string;
  trialPeriod: boolean;
}

export interface Payout {
  id: string;
  partnerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'ready_for_approval' | 'approved' | 'processing' | 'paid' | 'failed';
  method: 'paypal' | 'bank_transfer' | 'crypto';
  processingFee: number;
  approvedBy?: string;
  approvedAt?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetEntry {
  id: string;
  skillId: string;
  userId: string;
  input: any;
  output: any;
  confidence: number;
  approved: boolean;
  feedback?: string;
  rating?: number;
  createdAt: string;
  trainingVersion?: string;
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  mode: 'Green' | 'Yellow' | 'Red';
  blocked: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  beforeState?: any;
  afterState?: any;
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  approvedBy?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  metadata?: any;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  permissions: string[];
  lastUsedAt: string;
  usageCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface SystemMetrics {
  id: string;
  metricType: 'performance' | 'usage' | 'revenue' | 'security' | 'error_rate';
  value: number;
  unit: string;
  timestamp: string;
  metadata?: any;
}

export interface Partner {
  id: string;
  userId: string;
  businessName: string;
  contactEmail: string;
  payoutMethod: 'paypal' | 'bank_transfer' | 'crypto';
  taxRegion: string;
  trustScore: number;
  totalEarnings: number;
  pendingEarnings: number;
  status: 'active' | 'suspended' | 'terminated';
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  amount: number;
  currency: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'security' | 'billing' | 'feature';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: any;
}

// SQL Migration Templates
export const migrations = {
  // Initial schema setup
  '001_create_users_table': `
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner', 'dev', 'user', 'partner', 'investor')),
      tier TEXT NOT NULL CHECK (tier IN ('Free', 'Pro', 'Creator+', 'Enterprise')),
      permissions TEXT NOT NULL,
      trustScore INTEGER DEFAULT 100,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastLoginAt DATETIME,
      isActive BOOLEAN DEFAULT 1,
      metadata TEXT
    );
    
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_role ON users(role);
    CREATE INDEX idx_users_tier ON users(tier);
    CREATE INDEX idx_users_created_at ON users(createdAt);
  `,

  '002_create_skills_table': `
    CREATE TABLE skills (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('code', 'audio', 'graphics', 'link', 'payout', 'analytics')),
      tier TEXT NOT NULL CHECK (tier IN ('Free', 'Pro', 'Creator+', 'Enterprise')),
      requiresApproval BOOLEAN DEFAULT 0,
      isActive BOOLEAN DEFAULT 1,
      usageCount INTEGER DEFAULT 0,
      averageRating REAL DEFAULT 0,
      revenueGenerated DECIMAL(12,2) DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX idx_skills_category ON skills(category);
    CREATE INDEX idx_skills_tier ON skills(tier);
    CREATE INDEX idx_skills_active ON skills(isActive);
  `,

  '003_create_user_skills_table': `
    CREATE TABLE user_skills (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      skillId TEXT NOT NULL,
      accessGranted BOOLEAN DEFAULT 0,
      grantedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME,
      trialPeriod BOOLEAN DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (skillId) REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(userId, skillId)
    );
    
    CREATE INDEX idx_user_skills_user ON user_skills(userId);
    CREATE INDEX idx_user_skills_skill ON user_skills(skillId);
    CREATE INDEX idx_user_skills_access ON user_skills(accessGranted);
  `,

  '004_create_payouts_table': `
    CREATE TABLE payouts (
      id TEXT PRIMARY KEY,
      partnerId TEXT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT NOT NULL CHECK (status IN ('pending', 'ready_for_approval', 'approved', 'processing', 'paid', 'failed')),
      method TEXT DEFAULT 'paypal',
      processingFee DECIMAL(8,2) DEFAULT 0,
      approvedBy TEXT,
      approvedAt DATETIME,
      processedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (partnerId) REFERENCES partners(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_payouts_partner ON payouts(partnerId);
    CREATE INDEX idx_payouts_status ON payouts(status);
    CREATE INDEX idx_payouts_created_at ON payouts(createdAt);
  `,

  '005_create_partners_table': `
    CREATE TABLE partners (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      businessName TEXT NOT NULL,
      contactEmail TEXT NOT NULL,
      payoutMethod TEXT DEFAULT 'paypal',
      taxRegion TEXT DEFAULT 'US',
      trustScore INTEGER DEFAULT 100,
      totalEarnings DECIMAL(12,2) DEFAULT 0,
      pendingEarnings DECIMAL(12,2) DEFAULT 0,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_partners_user ON partners(userId);
    CREATE INDEX idx_partners_status ON partners(status);
    CREATE INDEX idx_partners_trust ON partners(trustScore);
  `,

  '006_create_dataset_table': `
    CREATE TABLE dataset (
      id TEXT PRIMARY KEY,
      skillId TEXT NOT NULL,
      userId TEXT NOT NULL,
      input TEXT,
      output TEXT,
      confidence REAL DEFAULT 0,
      approved BOOLEAN DEFAULT 0,
      feedback TEXT,
      rating INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      trainingVersion TEXT,
      FOREIGN KEY (skillId) REFERENCES skills(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_dataset_skill ON dataset(skillId);
    CREATE INDEX idx_dataset_user ON dataset(userId);
    CREATE INDEX idx_dataset_approved ON dataset(approved);
    CREATE INDEX idx_dataset_created_at ON dataset(createdAt);
  `,

  '007_create_security_events_table': `
    CREATE TABLE security_events (
      id TEXT PRIMARY KEY,
      userId TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      mode TEXT NOT NULL CHECK (mode IN ('Green', 'Yellow', 'Red')),
      blocked BOOLEAN DEFAULT 0,
      reason TEXT,
      severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
      confidence REAL DEFAULT 0,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_security_events_user ON security_events(userId);
    CREATE INDEX idx_security_events_action ON security_events(action);
    CREATE INDEX idx_security_events_mode ON security_events(mode);
    CREATE INDEX idx_security_events_created_at ON security_events(createdAt);
  `,

  '008_create_audit_logs_table': `
    CREATE TABLE audit_logs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      action TEXT NOT NULL,
      resource TEXT,
      beforeState TEXT,
      afterState TEXT,
      riskLevel TEXT CHECK (riskLevel IN ('low', 'medium', 'high')),
      requiresApproval BOOLEAN DEFAULT 0,
      approvedBy TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_audit_logs_user ON audit_logs(userId);
    CREATE INDEX idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX idx_audit_logs_risk_level ON audit_logs(riskLevel);
    CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
  `,

  '009_create_api_keys_table': `
    CREATE TABLE api_keys (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      permissions TEXT NOT NULL,
      lastUsedAt DATETIME,
      usageCount INTEGER DEFAULT 0,
      isActive BOOLEAN DEFAULT 1,
      expiresAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_api_keys_user ON api_keys(userId);
    CREATE INDEX idx_api_keys_active ON api_keys(isActive);
    CREATE INDEX idx_api_keys_expires_at ON api_keys(expiresAt);
  `,

  '010_create_system_metrics_table': `
    CREATE TABLE system_metrics (
      id TEXT PRIMARY KEY,
      metricType TEXT NOT NULL CHECK (metricType IN ('performance', 'usage', 'revenue', 'security', 'error_rate')),
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT
    );
    
    CREATE INDEX idx_system_metrics_type ON system_metrics(metricType);
    CREATE INDEX idx_system_metrics_timestamp ON system_metrics(timestamp);
  `,

  '011_create_subscriptions_table': `
    CREATE TABLE subscriptions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      tier TEXT NOT NULL CHECK (tier IN ('Free', 'Pro', 'Creator+', 'Enterprise')),
      status TEXT DEFAULT 'active',
      startDate DATETIME NOT NULL,
      endDate DATETIME,
      nextBillingDate DATETIME,
      amount DECIMAL(10,2) NOT NULL,
      currency TEXT DEFAULT 'USD',
      autoRenew BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_subscriptions_user ON subscriptions(userId);
    CREATE INDEX idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX idx_subscriptions_next_billing ON subscriptions(nextBillingDate);
  `,

  '012_create_notifications_table': `
    CREATE TABLE notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'security', 'billing', 'feature')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME,
      metadata TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_notifications_user ON notifications(userId);
    CREATE INDEX idx_notifications_type ON notifications(type);
    CREATE INDEX idx_notifications_read ON notifications(read);
    CREATE INDEX idx_notifications_created_at ON notifications(createdAt);
  `
};

// Export for use in migration scripts
export default migrations;
