/**
 * Helm Control - Public Type Definitions
 */

export type HelmEnvironment = "hosted" | "enterprise" | "development";
export type HelmTier = "free" | "creator" | "creator+" | "enterprise";

// Export concrete types for direct use
export type PersonaDefinition = PersonaDefinitionInterface;
export type SkillManifest = SkillManifestInterface;
export type HelmSession = HelmSessionInterface;

export interface HelmConfig {
  apiKey: string;
  environment: HelmEnvironment;
  endpoint?: string;
  telemetry?: boolean;
  tier?: HelmTier;
  permissions?: string[];
}

export interface HelmClientConfig {
  apiKey: string;
  environment: HelmEnvironment;
  endpoint?: string;
  telemetry?: boolean;
  tier?: HelmTier;
  permissions?: string[];
}

export interface HelmPublicTypes {
  // Core client types
  HelmClient: HelmClientInterface;
  HelmSession: HelmSessionInterface;
  HelmEvents: HelmEventsInterface;
  
  // Persona types
  PersonaDefinition: PersonaDefinitionInterface;
  PersonaConfig: PersonaConfigInterface;
  
  // Skill types
  SkillManifest: SkillManifestInterface;
  SkillCapability: SkillCapabilityInterface;
  SkillPermission: SkillPermissionInterface;
  
  // Permission types
  AccessLevel: AccessLevelType;
  PermissionContext: PermissionContextInterface;
  TierLevel: HelmTier;
  
  // Stability types
  StabilityMetrics: StabilityMetricsInterface;
  StabilityState: StabilityStateType;
  HealthStatus: HealthStatusType;
  
  // Audit types
  AuditEvent: AuditEventInterface;
  AuditLevel: AuditLevelType;
  ComplianceSignal: ComplianceSignalInterface;
}

// Core Client Types
export interface HelmClientInterface {
  loadPersona(persona: PersonaDefinitionInterface): Promise<void>;
  startSession(context?: object): HelmSessionInterface;
  listSkills(): SkillManifestInterface[];
  invokeSkill(skillId: string, input: unknown): Promise<unknown>;
  getStatus(): HelmClientStatus;
  shutdown(): Promise<void>;
}

export interface HelmClientConfig {
  apiKey: string;
  environment: HelmEnvironment;
  endpoint?: string;
  telemetry?: boolean;
}

export interface HelmClientStatus {
  initialized: boolean;
  personaLoaded: boolean;
  activeSessions: number;
  availableSkills: number;
  stabilityState: StabilityStateType;
  lastHeartbeat: Date;
}

export interface HelmSessionInterface {
  send(message: string): void;
  on(event: string, handler: Function): void;
  end(): void;
  getContext(): object;
  isActive(): boolean;
}

export interface HelmSessionConfig {
  domain: string;
  userId?: string;
  channel?: string;
  context?: object;
}

export interface HelmSessionEvent {
  type: string;
  data: unknown;
  timestamp: Date;
  sessionId: string;
}

export interface HelmEventsInterface {
  on(event: string, handler: HelmEventHandler): void;
  off(event: string, handler: HelmEventHandler): void;
  emit(event: string, data: unknown): void;
}

export type HelmEventHandler = (event: HelmSessionEvent) => void;
export type HelmEventType = "response" | "error" | "degraded" | "shutdown";

// Persona Types
export interface PersonaDefinitionInterface {
  id: string;
  name: string;
  tone: string;
  domain: string;
  safetyProfile: string;
  allowedSkills: string[];
  configuration?: PersonaConfigInterface;
}

export interface PersonaConfigInterface {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  responseStyle?: string;
  constraints?: string[];
}

// Skill Types
export interface SkillManifestInterface {
  id: string;
  name: string;
  description: string;
  version: string;
  permissions: SkillPermissionInterface[];
  tier: HelmTier;
  entry: string;
  capabilities: SkillCapabilityInterface[];
  category: string;
  isActive: boolean;
}

export interface SkillCapabilityInterface {
  id: string;
  name: string;
  description: string;
  inputSchema?: object;
  outputSchema?: object;
  requiresApproval?: boolean;
}

export interface SkillPermissionInterface {
  action: string;
  resource: string;
  conditions?: string[];
}

// Permission Types
export type AccessLevelType = "read" | "execute" | "admin" | "owner";

export interface PermissionContextInterface {
  userId: string;
  tier: HelmTier;
  sessionId: string;
  skillId?: string;
  action: string;
  resource: string;
  timestamp: Date;
}

// Stability Types
export interface StabilityMetricsInterface {
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  errorRate: number;
  responseTime: number;
  uptime: number;
}

export type StabilityStateType = "normal" | "degraded" | "minimal" | "safe" | "shutdown";

export type HealthStatusType = "healthy" | "warning" | "critical" | "offline";

// Audit Types
export interface AuditEventInterface {
  id: string;
  type: string;
  level: AuditLevelType;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  skillId?: string;
  action: string;
  resource: string;
  result: "success" | "failure" | "denied";
  metadata?: object;
}

export type AuditLevelType = "info" | "warning" | "error" | "critical";

export interface ComplianceSignalInterface {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  instanceId: string;
  skillUsage: object;
  stabilityMetrics: StabilityMetricsInterface;
  versionHash: string;
  licenseStatus: "valid" | "expired" | "revoked";
}
