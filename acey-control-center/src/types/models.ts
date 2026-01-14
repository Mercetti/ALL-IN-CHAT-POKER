import { Approval } from './api';

export interface User {
  id: string;
  login: string;
  email?: string;
  role: 'admin' | 'operator' | 'viewer';
  permissions: string[];
  createdAt: number;
  lastActive: number;
  deviceId?: string;
  isActive: boolean;
}

export interface Device {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  version: string;
  isTrusted: boolean;
  lastSeen: number;
  permissions: string[];
  owner: string;
  capabilities: string[];
}

export interface Session {
  sessionId: string;
  userId: string;
  deviceId: string;
  loginTime: number;
  lastActivity: number;
  isActive: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface Intent {
  intentId: string;
  type: string;
  action: string;
  params: Record<string, any>;
  source: 'mobile' | 'web' | 'api' | 'system';
  requestedBy: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requiresApproval: boolean;
  approvalId?: string;
  result?: any;
  error?: string;
  processingTime?: number;
}

export interface ApprovalQueue {
  queueId: string;
  name: string;
  description: string;
  items: Approval[];
  maxItems: number;
  processingOrder: 'fifo' | 'priority' | 'risk';
  autoApproveThreshold?: number;
  escalationRules?: EscalationRule[];
}

export interface EscalationRule {
  condition: 'time' | 'risk' | 'count';
  threshold: number;
  action: 'notify' | 'escalate' | 'auto_approve' | 'auto_reject';
  target?: string;
  delay?: number;
}

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
  processes: {
    running: number;
    sleeping: number;
    zombie: number;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  checks: HealthCheck[];
  lastCheck: number;
  uptime: number;
  version: string;
  environment: 'development' | 'staging' | 'production';
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration: number;
  timestamp: number;
  details?: Record<string, any>;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  tags?: string[];
  stackTrace?: string;
}

export interface LogFilter {
  levels: LogEntry['level'][];
  sources: string[];
  timeRange: {
    start: number;
    end: number;
  };
  users: string[];
  search: string;
  tags: string[];
  limit: number;
  offset: number;
  sortBy: 'timestamp' | 'level' | 'source';
  sortOrder: 'asc' | 'desc';
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
  userId?: string;
  deviceId?: string;
  expiresAt?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'system' | 'approval' | 'security' | 'performance' | 'user';
}

export interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  categories: {
    system: boolean;
    approval: boolean;
    security: boolean;
    performance: boolean;
    user: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
  };
  push: boolean;
  email: boolean;
  inApp: boolean;
}

export interface CommandTemplate {
  templateId: string;
  name: string;
  description: string;
  intent: string;
  parameters: CommandParameter[];
  requiredPermissions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  category: string;
  examples: CommandExample[];
  enabled: boolean;
}

export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ValidationRule[];
  options?: string[];
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'enum' | 'custom';
  value?: any;
  message: string;
}

export interface CommandExample {
  name: string;
  description: string;
  parameters: Record<string, any>;
  expectedResult?: string;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  sessionId?: string;
}

export interface SecurityEvent {
  eventId: string;
  type: 'login_attempt' | 'permission_denied' | 'suspicious_activity' | 'data_access' | 'config_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  deviceId?: string;
  ipAddress?: string;
  description: string;
  details: Record<string, any>;
  timestamp: number;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
}

export interface Configuration {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  category: string;
  isSecret: boolean;
  isRequired: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
  lastModified: number;
  modifiedBy: string;
}

export interface Backup {
  backupId: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed';
  size: number;
  location: string;
  createdAt: number;
  completedAt?: number;
  createdBy: string;
  retention: number; // days
  isEncrypted: boolean;
  checksum?: string;
}

export interface Deployment {
  deploymentId: string;
  version: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  environment: 'development' | 'staging' | 'production';
  startedAt: number;
  completedAt?: number;
  duration?: number;
  deployedBy: string;
  rollbackVersion?: string;
  healthChecks: HealthCheck[];
  rollbackReason?: string;
}
