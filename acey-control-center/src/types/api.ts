// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Authentication Types
export interface LoginRequest {
  deviceId: string;
  pin: string;
}

export interface LoginResponse {
  token: string;
  permissions: string[];
  expiresAt: number;
  deviceId: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  deviceId: string | null;
  permissions: string[];
  expiresAt: number | null;
}

// Status Types
export interface SystemStatus {
  aceyOnline: boolean;
  currentTask: string;
  cognitiveLoad: 'low' | 'standard' | 'high' | 'unknown';
  activeModel: string;
  lastHeartbeat: number;
  uptime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface HealthCheck {
  status: 'healthy' | 'warning' | 'critical';
  checks: {
    database: 'pass' | 'fail';
    api: 'pass' | 'fail';
    websocket: 'pass' | 'fail';
    storage: 'pass' | 'fail';
  };
  timestamp: number;
}

// Log Types
export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: number;
  source?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  stackTrace?: string;
}

export interface LogFilter {
  level?: LogEntry['level'][];
  source?: string;
  startTime?: number;
  endTime?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  hasMore: boolean;
}

// Approval Types
export interface Approval {
  approvalId: string;
  action: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  timestamp: number;
  requestedBy?: string;
  expiresAt?: number;
  context?: Record<string, any>;
  status?: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface ApprovalRequest {
  action: string;
  risk: Approval['risk'];
  reason: string;
  context?: Record<string, any>;
  expiresAt?: number;
}

export interface ApprovalsResponse {
  pending: Approval[];
  total: number;
}

export interface ApprovalResponse {
  approved: boolean;
  approvalId: string;
  processedBy: string;
  processedAt: number;
  reason?: string;
}

// Command Types
export interface Command {
  intent: string;
  params?: Record<string, any>;
  source: 'mobile' | 'web' | 'api';
  timestamp: number;
  userId?: string;
  requiresApproval?: boolean;
  approvalId?: string;
}

export interface CommandRequest {
  intent: string;
  params?: Record<string, any>;
}

export interface CommandResponse {
  success?: boolean;
  requiresApproval?: boolean;
  approvalId?: string;
  message?: string;
  error?: string;
  commandId?: string;
  result?: any;
}

// Device Types
export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  version: string;
  isTrusted: boolean;
  lastSeen: number;
  permissions: string[];
}

export interface DeviceRegistration {
  deviceId: string;
  platform: string;
  version: string;
  capabilities: string[];
}

// Notification Types
export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'default' | 'high' | 'max';
  sound?: string;
  vibrate?: boolean | number[];
}

export interface NotificationSettings {
  enabled: boolean;
  approvalRequired: boolean;
  criticalErrors: boolean;
  securityAlerts: boolean;
  systemStatus: boolean;
  quietHours?: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Cache Types
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheConfig {
  duration: number;
  maxSize?: number;
  strategy?: 'lru' | 'fifo' | 'none';
}

// UI Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  error?: string;
  timestamp?: number;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
