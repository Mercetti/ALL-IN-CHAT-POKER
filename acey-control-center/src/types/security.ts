// 🔐 ACEY SECURITY EVENT API CONTRACTS
// Type definitions for security events and actions

export interface SecurityEvent {
  id: string;
  timestamp: string; // ISO8601
  category: 'file' | 'model' | 'financial' | 'permission' | 'dataset' | 'partner';
  severity: 'low' | 'medium' | 'high';
  description: string;
  detected_by: 'acey';
  confidence: number; // 0-1
  recommended_actions: ActionProposal[];
  requires_approval: boolean;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface ActionProposal {
  action_id: string;
  description: string;
  reversible: boolean;
  scope: string[];
  estimated_risk: 'low' | 'medium' | 'high';
  simulation_result?: SimulationResult;
}

export interface SimulationResult {
  expected_outcome: string;
  failure_modes: string[];
  rollback_path: string;
  security_implications: string;
  confidence_score: number;
}

export interface SecurityMode {
  current: 'green' | 'yellow' | 'red';
  last_changed: string;
  changed_by: string;
  reason: string;
}

export interface ApprovalRequest {
  id: string;
  event_id: string;
  action_proposal: ActionProposal;
  requested_by: 'acey';
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}

export interface SecurityStats {
  total_events: number;
  unresolved_events: number;
  pending_approvals: number;
  events_by_severity: {
    low: number;
    medium: number;
    high: number;
  };
  events_by_category: {
    file: number;
    model: number;
    financial: number;
    permission: number;
    dataset: number;
    partner: number;
  };
  avg_resolution_time: number; // minutes
}

// API Route Contracts
export interface SecurityAPI {
  // Events
  'GET /security/events': SecurityEvent[];
  'GET /security/events/:id': SecurityEvent;
  'POST /security/events': SecurityEvent;
  'PUT /security/events/:id': SecurityEvent;
  
  // Simulations
  'POST /security/simulate': SimulationResult;
  
  // Approvals
  'GET /security/approvals': ApprovalRequest[];
  'POST /security/approve': { approval_id: string; approved: boolean; reason?: string };
  'POST /security/dismiss': { event_id: string; reason: string };
  
  // Emergency
  'POST /security/emergency-lock': SecurityMode;
  'POST /security/resume': SecurityMode;
  
  // Status
  'GET /security/status': SecurityMode;
  'GET /security/stats': SecurityStats;
}

// Permission checks for all routes
export interface SecurityContext {
  user_role: 'founder' | 'acey' | 'partner' | 'investor' | 'system';
  trust_score: number;
  device_id?: string;
  session_age: number;
  mode: 'live' | 'simulation';
  permissions: string[];
}

// Legacy Security and Governance Types

export interface UnlockRequest {
  id: string;
  device_id: string;
  owner_id: string;
  reason: string;
  stage: UnlockStage;
  status: UnlockStatus;
  created_at: number;
  expires_at: number;
  results?: IntegrityCheckResult[];
  rehydration_result?: RehydrationResult;
}

export type UnlockStage = 
  | 'BIOMETRIC_PENDING'
  | 'TIME_DELAY_PENDING'
  | 'DESKTOP_CONFIRMATION_PENDING'
  | 'INTEGRITY_CHECK_PENDING'
  | 'REHYDRATION_PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'INTEGRITY_CHECK_FAILED';

export type UnlockStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface IntegrityCheckResult {
  name: string;
  passed: boolean;
  details: string;
  timestamp?: number;
}

export interface RehydrationResult {
  mode: string;
  timestamp: number;
  actions: string[];
  warnings: string[];
  errors: string[];
}

export interface Incident {
  id: string;
  severity: IncidentSeverity;
  trigger: string;
  affected_systems: string[];
  root_cause?: string;
  status: IncidentStatus;
  created_at: number;
  updated_at: number;
  description: string;
  created_by: string;
  actions_taken: IncidentAction[];
  learning_enabled: boolean;
  resolution?: string;
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'MITIGATED' | 'RESOLVED';

export interface IncidentAction {
  action: string;
  timestamp: number;
  user: string;
  biometric_verified: boolean;
  result?: ActionResult;
}

export interface ActionResult {
  action: string;
  trust_impact: number;
  severity: string;
  details?: any;
}

export interface IncidentActionDefinition {
  name: string;
  description: string;
  risk: ApprovalRisk;
  icon: string;
  effect: string;
}

export type ApprovalRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
  timestamp: number;
}

export interface BiometricRequirement {
  risk: ApprovalRisk;
  requiresBiometric: boolean;
  requiresCooldown?: boolean;
  cooldownPeriod?: number;
}

export type PermissionScope = 
  | 'AUTO_FIX_UI'
  | 'AUDIO_GENERATION'
  | 'DEPLOY_CODE'
  | 'AUTO_RULE_APPROVAL'
  | 'SYSTEM_UNLOCK'
  | 'MODEL_FINE_TUNE'
  | 'CHAT_MODERATION'
  | 'CONTENT_GENERATION';

export interface TimedPermission {
  id: string;
  scope: PermissionScope;
  grantedBy: string;
  grantedAt: number;
  expiresAt: number;
  renewable: boolean;
  isActive: boolean;
  description: string;
  riskLevel: ApprovalRisk;
}

export interface PermissionGrant {
  scope: PermissionScope;
  expiresInHours: number;
  renewable?: boolean;
  reason?: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  permission?: TimedPermission;
  reason?: string;
  expiredAt?: number;
}

export interface AuditEvent {
  id: string;
  time: number;
  type: AuditEventType;
  summary: string;
  trustImpact: number;
  metadata: Record<string, any>;
  userId?: string;
  deviceId?: string;
  sessionId?: string;
  parentEventId?: string;
  childEventIds?: string[];
  severity: AuditSeverity;
  category: AuditCategory;
}

export type AuditEventType = 
  | 'LLM_CALL'
  | 'APPROVAL'
  | 'AUTO_RULE'
  | 'ERROR'
  | 'DEPLOY'
  | 'PERMISSION_GRANT'
  | 'BIOMETRIC_AUTH'
  | 'SYSTEM_LOCK'
  | 'MODEL_UPDATE'
  | 'INCIDENT_CREATED'
  | 'INCIDENT_STATUS_CHANGE'
  | 'INCIDENT_ACTION'
  | 'INCIDENT_RESOLVED'
  | 'OWNER_UNLOCK';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuditCategory = 'SYSTEM' | 'USER' | 'AI' | 'SECURITY' | 'ERROR' | 'SUCCESS';

export interface TimelineFilter {
  startTime?: number;
  endTime?: number;
  eventTypes?: AuditEventType[];
  severity?: AuditSeverity[];
  categories?: AuditCategory[];
  userId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ReplaySession {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  events: AuditEvent[];
  mode: ReplayMode;
  createdAt: number;
  createdBy: string;
}

export type ReplayMode = 'READ_ONLY' | 'SIMULATED' | 'DIFF';

export interface ReplayContext {
  currentTime: number;
  selectedEvent?: AuditEvent;
  mode: ReplayMode;
  playbackSpeed: number;
  isPlaying: boolean;
  filters: TimelineFilter;
}

export interface SimulationResult {
  originalEvent: AuditEvent;
  simulatedEvent: AuditEvent;
  differences: Array<{
    field: string;
    original: any;
    simulated: any;
    impact: string;
  }>;
  overallImpact: 'NONE' | 'MINOR' | 'MODERATE' | 'MAJOR';
}

export interface DeviceTrustInfo {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  version: string;
  isTrusted: boolean;
  lastSeen: number;
  permissions: string[];
  owner: string;
  capabilities: string[];
  trustScore: number;
}

export interface SecurityEvent {
  eventId: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
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

export type SecurityEventType = 
  | 'login_attempt'
  | 'permission_denied'
  | 'suspicious_activity'
  | 'data_access'
  | 'config_change'
  | 'biometric_failure'
  | 'unlock_attempt'
  | 'incident_triggered';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface EmergencyLockConfig {
  trigger: EmergencyTrigger;
  autoLock: boolean;
  requireUnlock: boolean;
  notifyOwner: boolean;
  preserveState: boolean;
}

export type EmergencyTrigger = 
  | 'trust_collapse'
  | 'model_corruption'
  | 'security_breach'
  | 'manual_owner'
  | 'system_error'
  | 'incident_threshold';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  enabled: boolean;
  severity: SecuritySeverity;
  autoAction?: string;
}

export interface SecurityRule {
  condition: string;
  threshold?: number;
  action: string;
  cooldown?: number;
  enabled: boolean;
}

export interface AuditTrail {
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
  riskLevel: SecuritySeverity;
}

export interface ComplianceReport {
  id: string;
  generatedAt: number;
  period: {
    start: number;
    end: number;
  };
  summary: {
    totalEvents: number;
    securityEvents: number;
    incidents: number;
    violations: number;
  };
  findings: ComplianceFinding[];
  recommendations: string[];
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'REQUIRES_REVIEW';
}

export interface ComplianceFinding {
  type: string;
  severity: SecuritySeverity;
  description: string;
  evidence: string[];
  impact: string;
  remediation: string;
}

export interface SecurityMetrics {
  timestamp: number;
  trustScore: number;
  activeThreats: number;
  blockedAttempts: number;
  successfulAuthentications: number;
  biometricSuccessRate: number;
  incidentCount: number;
  averageResolutionTime: number;
  policyViolations: number;
}
