/**
 * Wireframe UI Layouts for Operator Dashboard
 * This is not for chat or viewers - this is your control deck
 * React + Tailwind + Recharts + WebSockets + Zustand
 */

// ===== DASHBOARD LAYOUT OVERVIEW =====
export interface DashboardLayout {
  type: 'grid';
  grid: {
    rows: 3;
    columns: 4;
    gap: string;
  };
  components: DashboardComponent[];
}

export interface DashboardComponent {
  id: string;
  type: 'memory-queue' | 'trust-moderation' | 'persona-monitor' | 'stream-monitor' | 'simulation' | 'audit';
  position: {
    row: number;
    col: number;
    width: number;
    height: number;
  };
  title: string;
  resizable?: boolean;
  collapsible?: boolean;
}

// ===== MEMORY QUEUE PANEL =====
export interface MemoryQueuePanel {
  id: 'memory-queue';
  type: 'memory-queue';
  title: 'Memory Queue';
  
  // State
  pendingProposals: MemoryProposal[];
  autoApprove: boolean;
  memoryLocked: boolean;
  approvedCount: number;
  rejectedCount: number;
  
  // Actions
  onApprove: (proposalId: string) => void;
  onReject: (proposalId: string, reason: string) => void;
  onSimulate: (proposalId: string) => void;
  onLockMemory: () => void;
  onToggleAutoApprove: () => void;
}

export interface MemoryProposal {
  id: string;
  type: 'memory_proposal';
  scope: 'event' | 'stream' | 'global';
  summary: string;
  confidence: number;
  justification: string;
  impact: 'low' | 'medium' | 'high';
  privacy: 'public' | 'private' | 'sensitive';
  ttl: string;
  timestamp: number;
  userId?: string;
}

// ===== TRUST & MODERATION PANEL =====
export interface TrustModerationPanel {
  id: 'trust-moderation';
  type: 'trust-moderation';
  title: 'Trust & Moderation';
  
  // State
  trustSignals: TrustSignal[];
  moderationSuggestions: ModerationSuggestion[];
  trustThrottled: boolean;
  
  // Actions
  onApplyTrust: (signal: TrustSignal) => void;
  onThrottleTrust: (signal: TrustSignal) => void;
  onIgnoreTrust: (signal: TrustSignal) => void;
  onApplyModeration: (suggestion: ModerationSuggestion) => void;
  onEscalateModeration: (suggestion: ModerationSuggestion) => void;
}

export interface TrustSignal {
  id: string;
  type: 'trust_signal';
  userId: string;
  delta: number;
  reason: string;
  category: 'positive' | 'negative' | 'neutral';
  source: string;
  reversible: boolean;
  timestamp: number;
}

export interface ModerationSuggestion {
  id: string;
  type: 'shadow_ban_suggestion';
  userId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'shadow_ban' | 'rate_limit' | 'content_filter';
  justification: string;
  duration: string;
  evidence: string[];
  timestamp: number;
}

// ===== PERSONA MONITOR (READ-ONLY) =====
export interface PersonaMonitor {
  id: 'persona-monitor';
  type: 'persona-monitor';
  title: 'Persona Monitor';
  
  // State (read-only)
  currentPersona: PersonaState;
  personaHistory: PersonaChange[];
  driftIndicator: number;
  stabilityScore: number;
  
  // No editing capabilities
}

export interface PersonaState {
  mode: 'calm' | 'hype' | 'neutral' | 'chaos' | 'commentator';
  displayName: string;
  description: string;
  traits: Record<string, string>;
  locked: boolean;
  lastChange: number;
}

export interface PersonaChange {
  timestamp: number;
  from: string;
  to: string;
  reason: string;
  triggeredBy: 'automatic' | 'manual' | 'system';
}

// ===== STREAM MONITOR =====
export interface StreamMonitor {
  id: 'stream-monitor';
  type: 'stream-monitor';
  title: 'Live Stream Monitor';
  
  // State
  chatVelocity: number;
  hypeIndex: number;
  engagementLevel: number;
  moodAxes: MoodAxes;
  recentEvents: StreamEvent[];
  streamMetrics: StreamMetrics;
}

export interface MoodAxes {
  energy: number;
  chaos: number;
  tension: number;
  engagement: number;
}

export interface StreamEvent {
  id: string;
  type: 'all_in' | 'big_win' | 'chat_burst' | 'hype_peak';
  timestamp: number;
  data: Record<string, unknown>;
  intensity: 'low' | 'medium' | 'high';
}

export interface StreamMetrics {
  viewers: number;
  messagesPerMinute: number;
  activeUsers: number;
  averageMessageLength: number;
  emoteDensity: number;
}

// ===== SIMULATION PANEL =====
export interface SimulationPanel {
  id: 'simulation';
  type: 'simulation';
  title: 'Simulation & Training';
  
  // State
  isSimulationMode: boolean;
  simulationHistory: SimulationSession[];
  comparisonResults: ComparisonResult[];
  replayBuffer: ReplayEvent[];
  
  // Actions
  onStartSimulation: (options: SimulationOptions) => void;
  onEndSimulation: () => void;
  onStartReplay: (events: ReplayEvent[]) => void;
  onCompareOutputs: (baseline: any[], comparison: any[]) => void;
  onViewDiffs: (comparisonId: string) => void;
}

export interface SimulationSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  options: SimulationOptions;
  intents: SimulatedIntent[];
  results: SimulationResult[];
  metrics: SimulationMetrics;
}

export interface SimulationOptions {
  dryRun: boolean;
  recordIntents: boolean;
  compareWithBaseline: boolean;
  maxIntents: number;
}

export interface SimulatedIntent {
  id: string;
  type: string;
  originalIntent: any;
  simulatedResult: any;
  simulatedAt: number;
}

export interface SimulationResult {
  intentId: string;
  status: 'simulated' | 'error';
  result: any;
  processingTime: number;
}

export interface SimulationMetrics {
  totalIntents: number;
  approved: number;
  rejected: number;
  errors: number;
  averageProcessingTime: number;
}

export interface ComparisonResult {
  id: string;
  timestamp: number;
  baseline: any[];
  comparison: any[];
  differences: ComparisonDiff[];
  similarity: number;
  summary: ComparisonSummary;
}

export interface ComparisonDiff {
  index: number;
  field: string;
  baseline: any;
  comparison: any;
  type: 'value_mismatch' | 'type_mismatch' | 'missing_field';
}

export interface ComparisonSummary {
  totalComparisons: number;
  identical: number;
  similar: number;
  different: number;
  overallSimilarity: number;
}

export interface ReplayEvent {
  type: 'llm_output' | 'intent_processed' | 'game_event';
  timestamp: number;
  data: any;
  originalResult?: any;
}

// ===== AUDIT PANEL =====
export interface AuditPanel {
  id: 'audit';
  type: 'audit';
  title: 'Audit & Export';
  
  // State
  safetyMetrics: SafetyMetrics;
  auditLog: AuditEntry[];
  exportFormats: string[];
  
  // Actions
  onExportAudit: (format: string) => void;
  onClearAuditLog: () => void;
  onFilterLog: (filters: AuditFilters) => void;
  onViewDetails: (entryId: string) => void;
}

export interface SafetyMetrics {
  totalOperations: number;
  blockedOperations: number;
  highRiskOperations: number;
  complianceViolations: number;
  dataLeaks: number;
  systemErrors: number;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  eventType: string;
  severity: 'info' | 'warn' | 'error';
  data: Record<string, unknown>;
  userId?: string;
  resolved: boolean;
}

export interface AuditFilters {
  severity: string[];
  eventType: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  userId?: string;
}

// ===== DASHBOARD CONFIGURATION =====
export const DASHBOARD_LAYOUT: DashboardLayout = {
  type: 'grid',
  grid: {
    rows: 3,
    columns: 4,
    gap: '1rem'
  },
  components: [
    {
      id: 'memory-queue',
      type: 'memory-queue',
      position: { row: 0, col: 0, width: 2, height: 2 },
      title: 'Memory Queue',
      resizable: true,
      collapsible: false
    },
    {
      id: 'stream-monitor',
      type: 'stream-monitor',
      position: { row: 0, col: 2, width: 2, height: 2 },
      title: 'Live Stream Monitor',
      resizable: true,
      collapsible: false
    },
    {
      id: 'trust-moderation',
      type: 'trust-moderation',
      position: { row: 2, col: 0, width: 2, height: 1 },
      title: 'Trust & Moderation',
      resizable: true,
      collapsible: true
    },
    {
      id: 'persona-monitor',
      type: 'persona-monitor',
      position: { row: 2, col: 2, width: 1, height: 1 },
      title: 'Persona Monitor',
      resizable: false,
      collapsible: true
    },
    {
      id: 'simulation',
      type: 'simulation',
      position: { row: 2, col: 3, width: 1, height: 1 },
      title: 'Simulation & Training',
      resizable: true,
      collapsible: true
    },
    {
      id: 'audit',
      type: 'audit',
      position: { row: 0, col: 0, width: 4, height: 1 },
      title: 'Audit & Export',
      resizable: false,
      collapsible: true,
      overlay: true
    }
  ]
};

// ===== REACT COMPONENT PROPS =====
export interface DashboardProps {
  layout: DashboardLayout;
  components: {
    memoryQueue: MemoryQueuePanel;
    trustModeration: TrustModerationPanel;
    personaMonitor: PersonaMonitor;
    streamMonitor: StreamMonitor;
    simulation: SimulationPanel;
    audit: AuditPanel;
  };
  onOperatorCommand: (command: OperatorCommand) => void;
  isConnected: boolean;
}

export interface OperatorCommand {
  type: 'approve_intent' | 'reject_intent' | 'simulate_intent' | 'lock_memory' | 'unlock_memory' | 'start_simulation' | 'end_simulation';
  intentId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// ===== WIREFRAME COMPONENTS =====

// Memory Queue Component
export const MemoryQueueWireframe = `
<div className="memory-queue-panel bg-gray-900 border border-gray-800 rounded-lg p-4">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-semibold text-white">🧠 Memory Queue</h3>
    <div className="flex gap-2">
      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
        Auto-Approve: OFF
      </button>
      <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm">
        🔒 Memory Locked
      </button>
    </div>
  </div>
  
  <div className="space-y-2 max-h-96 overflow-y-auto">
    <!-- Memory Proposal Card -->
    <div className="bg-gray-800 border border-green-500 rounded p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">STREAM</span>
          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">85%</span>
          <span className="text-gray-400 text-xs">TTL: 7d</span>
        </div>
      </div>
      
      <h4 className="text-white font-medium mb-1">Exciting all-in moment</h4>
      <p className="text-gray-300 text-sm mb-2">
        High energy all-in play triggered chat excitement and engagement spike
      </p>
      
      <div className="flex gap-2 mb-2">
        <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">HIGH</span>
        <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">PUBLIC</span>
      </div>
      
      <div className="flex gap-2">
        <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">
          ✅ Approve
        </button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
          🧪 Simulate
        </button>
        <button className="px-3 py-1 bg-red-600 text-white rounded text-sm">
          ❌ Reject
        </button>
      </div>
    </div>
  </div>
  
  <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-sm">
    <span className="text-gray-400">Pending: 3</span>
    <span className="text-gray-400">Approved Today: 12</span>
    <span className="text-gray-400">Rejected Today: 2</span>
  </div>
</div>
`;

// Trust & Moderation Component
export const TrustModerationWireframe = `
<div className="trust-moderation-panel bg-gray-900 border border-gray-800 rounded-lg p-4">
  <div className="grid grid-cols-2 gap-4">
    <!-- Trust Signals Section -->
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">🛡️ Trust Signals</h3>
      
      <div className="space-y-2">
        <!-- Trust Signal Card -->
        <div className="bg-gray-800 border border-blue-500 rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-400 font-mono text-sm">user123</span>
            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">+0.05</span>
          </div>
          
          <p className="text-gray-300 text-sm mb-2">
            Positive engagement during exciting gameplay
          </p>
          
          <div className="flex gap-2 mb-2">
            <span className="text-gray-400 text-xs">positive</span>
            <span className="text-gray-400 text-xs">ai_suggestion</span>
          </div>
          
          <div className="flex gap-2">
            <button className="px-2 py-1 bg-green-600 text-white rounded text-xs">
              Apply
            </button>
            <button className="px-2 py-1 bg-yellow-600 text-white rounded text-xs">
              Throttle
            </button>
            <button className="px-2 py-1 bg-gray-600 text-white rounded text-xs">
              Ignore
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Moderation Section -->
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">⚖️ Moderation</h3>
      
      <div className="space-y-2">
        <!-- Moderation Suggestion Card -->
        <div className="bg-gray-800 border border-orange-500 rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-orange-400 font-mono text-sm">user456</span>
            <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">MEDIUM</span>
            <span className="text-gray-400 text-xs">shadow_ban</span>
          </div>
          
          <p className="text-gray-300 text-sm mb-2">
            Repeated spam messages detected, evidence shows pattern of disruption
          </p>
          
          <div className="bg-gray-700 rounded p-2 mb-2">
            <div className="text-xs text-gray-400 mb-1">Evidence:</div>
            <ul className="text-xs text-gray-300 list-disc list-inside">
              <li>Multiple rapid messages</li>
              <li>Repetitive content</li>
              <li>Other users complaining</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <button className="px-2 py-1 bg-orange-600 text-white rounded text-xs">
              Apply 1h
            </button>
            <button className="px-2 py-1 bg-red-600 text-white rounded text-xs">
              Escalate
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;

// Persona Monitor Component (Read-Only)
export const PersonaMonitorWireframe = `
<div className="persona-monitor bg-gray-900 border border-gray-800 rounded-lg p-4">
  <h3 className="text-lg font-semibold text-white mb-4">🎭 Persona Monitor</h3>
  
  <div className="bg-gray-800 border border-purple-500 rounded p-4 mb-4">
    <div className="flex justify-between items-center mb-3">
      <div>
        <h4 className="text-xl font-bold text-purple-400">NEUTRAL</h4>
        <p className="text-gray-300 text-sm">Balanced, professional, welcoming</p>
      </div>
      <div className="text-right">
        <div className="text-xs text-gray-400 mb-1">Locked</div>
        <div className="text-xs text-gray-400">Stable</div>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-gray-400">Formality:</span>
        <span className="text-white ml-2">Medium</span>
      </div>
      <div>
        <span className="text-gray-400">Energy:</span>
        <span className="text-white ml-2">Medium</span>
      </div>
      <div>
        <span className="text-gray-400">Humor:</span>
        <span className="text-white ml-2">Low</span>
      </div>
      <div>
        <span className="text-gray-400">Pacing:</span>
        <span className="text-white ml-2">Steady</span>
      </div>
    </div>
  </div>
  
  <div className="mb-4">
    <h4 className="text-white font-medium mb-2">📊 Drift Indicator</h4>
    <div className="bg-gray-800 rounded-full h-4 mb-2">
      <div className="bg-green-500 h-4 rounded-full" style="width: 15%"></div>
    </div>
    <span className="text-gray-400 text-sm">15% drift - Stable</span>
  </div>
  
  <div>
    <h4 className="text-white font-medium mb-2">📜 Recent Changes</h4>
    <div className="space-y-1 text-sm">
      <div className="flex justify-between text-gray-300">
        <span>2:34 PM</span>
        <span>NEUTRAL → HYPE</span>
        <span>High energy detected</span>
      </div>
      <div className="flex justify-between text-gray-300">
        <span>1:15 PM</span>
        <span>CALM → NEUTRAL</span>
        <span>Energy normalized</span>
      </div>
    </div>
  </div>
</div>
`;

// Stream Monitor Component
export const StreamMonitorWireframe = `
<div className="stream-monitor bg-gray-900 border border-gray-800 rounded-lg p-4">
  <h3 className="text-lg font-semibold text-white mb-4">📊 Live Stream Monitor</h3>
  
  <div className="grid grid-cols-2 gap-4 mb-4">
    <div>
      <h4 className="text-white font-medium mb-3">📈 Mood Metrics</h4>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Energy</span>
            <span className="text-green-400">75%</span>
          </div>
          <div className="bg-gray-800 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style="width: 75%"></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Chaos</span>
            <span className="text-yellow-400">30%</span>
          </div>
          <div className="bg-gray-800 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style="width: 30%"></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Tension</span>
            <span className="text-orange-400">45%</span>
          </div>
          <div className="bg-gray-800 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full" style="width: 45%"></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Engagement</span>
            <span className="text-blue-400">85%</span>
          </div>
          <div className="bg-gray-800 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style="width: 85%"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div>
      <h4 className="text-white font-medium mb-3">⚡ Activity Timeline</h4>
      <div className="bg-gray-800 rounded h-32 relative">
        <!-- Event markers -->
        <div className="absolute top-4 left-8 w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="absolute top-12 left-24 w-2 h-2 bg-orange-500 rounded-full"></div>
        <div className="absolute top-20 left-40 w-2 h-2 bg-red-500 rounded-full"></div>
        <div className="absolute top-8 left-56 w-2 h-2 bg-blue-500 rounded-full"></div>
        
        <!-- Timeline line -->
        <div className="absolute top-0 left-0 right-0 h-px bg-gray-600"></div>
        
        <!-- Labels -->
        <div className="absolute top-2 left-4 text-xs text-gray-400">All-in</div>
        <div className="absolute top-10 left-20 text-xs text-gray-400">Chat burst</div>
        <div className="absolute top-18 left-36 text-xs text-gray-400">Tension spike</div>
        <div className="absolute top-6 left-52 text-xs text-gray-400">Hype peak</div>
      </div>
    </div>
  </div>
  
  <div className="grid grid-cols-3 gap-4 text-sm">
    <div className="bg-gray-800 rounded p-3 text-center">
      <div className="text-2xl font-bold text-green-400">24</div>
      <div className="text-gray-400">Chat/min</div>
    </div>
    <div className="bg-gray-800 rounded p-3 text-center">
      <div className="text-2xl font-bold text-orange-400">82%</div>
      <div className="text-gray-400">Hype Index</div>
    </div>
    <div className="bg-gray-800 rounded p-3 text-center">
      <div className="text-2xl font-bold text-blue-400">156</div>
      <div className="text-gray-400">Active Users</div>
    </div>
  </div>
</div>
`;

// Simulation Panel Component
export const SimulationPanelWireframe = `
<div className="simulation-panel bg-gray-900 border border-gray-800 rounded-lg p-4">
  <h3 className="text-lg font-semibold text-white mb-4">🧪 Simulation & Training</h3>
  
  <div className="mb-4">
    <div className="flex items-center gap-4 mb-2">
      <label className="flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        <span className="text-white">Training Mode</span>
      </label>
      <span className="text-gray-400 text-sm">OFF</span>
    </div>
  </div>
  
  <div className="grid grid-cols-2 gap-4 mb-4">
    <div>
      <h4 className="text-white font-medium mb-2">🎮 Simulation Controls</h4>
      <div className="flex gap-2">
        <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
          🔄 Run Replay
        </button>
        <button className="px-3 py-2 bg-purple-600 text-white rounded text-sm">
          ⚖️ Compare Outputs
        </button>
        <button className="px-3 py-2 bg-gray-600 text-white rounded text-sm">
          📋 View Diffs
        </button>
      </div>
    </div>
    
    <div>
      <h4 className="text-white font-medium mb-2">📊 Simulation History</h4>
      <div className="bg-gray-800 rounded p-2 max-h-32 overflow-y-auto text-sm">
        <div className="flex justify-between text-gray-300 mb-1">
          <span>2:45 PM</span>
          <span>memory_test</span>
          <span className="text-green-400">✓</span>
        </div>
        <div className="flex justify-between text-gray-300 mb-1">
          <span>2:30 PM</span>
          <span>trust_test</span>
          <span className="text-green-400">✓</span>
        </div>
        <div className="flex justify-between text-gray-300 mb-1">
          <span>2:15 PM</span>
          <span>persona_test</span>
          <span className="text-yellow-400">⚠</span>
        </div>
      </div>
    </div>
  </div>
  
  <div>
    <h4 className="text-white font-medium mb-2">📈 Comparison Results</h4>
    <div className="bg-gray-800 rounded p-3">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-400">Overall Similarity:</span>
        <span className="text-green-400">87%</span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-gray-400">Identical:</span>
          <span className="text-green-400">12</span>
        </div>
        <div>
          <span className="text-gray-400">Similar:</span>
          <span className="text-yellow-400">3</span>
        </div>
        <div>
          <span className="text-gray-400">Different:</span>
          <span className="text-red-400">1</span>
        </div>
      </div>
    </div>
  </div>
</div>
`;

// Audit Panel Component
export const AuditPanelWireframe = `
<div className="audit-panel bg-gray-900 border border-gray-800 rounded-lg p-4">
  <h3 className="text-lg font-semibold text-white mb-4">🧾 Audit & Export</h3>
  
  <div className="grid grid-cols-4 gap-4 mb-4">
    <div className="bg-gray-800 rounded p-3 text-center">
      <div className="text-2xl font-bold text-blue-400">1,247</div>
      <div className="text-gray-400 text-sm">Total Ops</div>
    </div>
    <div className="bg-gray-800 rounded p-3 text-center">
      <div className="text-2xl font-bold text-green-400">23</div>
      <div className="text-gray-400 text-sm">Blocked</div>
    </div>
    <div className="bg-gray-800 rounded p-3 text-center">
      <div className="text-2xl font-bold text-orange-400">5</div>
      <div className="text-gray-400 text-sm">Violations</div>
    </div>
    <div className="bg-gray-800 rounded p-3 text-center">
      <div className="text-2xl font-bold text-red-400">2</div>
      <div className="text-gray-400 text-sm">Errors</div>
    </div>
  </div>
  
  <div className="mb-4">
    <div className="flex gap-2 mb-2">
      <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
        📄 Export JSON
      </button>
      <button className="px-3 py-2 bg-green-600 text-white rounded text-sm">
        📊 Export CSV
      </button>
      <button className="px-3 py-2 bg-red-600 text-white rounded text-sm">
        🗑️ Clear Log
      </button>
    </div>
  </div>
  
  <div>
    <h4 className="text-white font-medium mb-2">📋 Audit Log</h4>
    <div className="bg-gray-800 rounded p-2 max-h-48 overflow-y-auto text-sm">
      <div className="space-y-1">
        <div className="flex justify-between text-gray-300 p-2 bg-gray-700 rounded">
          <span className="text-green-400">✓</span>
          <span>memory_approved</span>
          <span>2:45:23 PM</span>
        </div>
        <div className="flex justify-between text-gray-300 p-2 bg-gray-700 rounded">
          <span className="text-yellow-400">⚠</span>
          <span>safety_violation</span>
          <span>2:44:15 PM</span>
        </div>
        <div className="flex justify-between text-gray-300 p-2 bg-gray-700 rounded">
          <span className="text-green-400">✓</span>
          <span>trust_updated</span>
          <span>2:43:02 PM</span>
        </div>
        <div className="flex justify-between text-gray-300 p-2 bg-gray-700 rounded">
          <span className="text-red-400">✗</span>
          <span>llm_error</span>
          <span>2:42:18 PM</span>
        </div>
      </div>
    </div>
  </div>
</div>
`;

// ===== EXPORT ALL WIREFRAMES =====
export {
  DASHBOARD_LAYOUT,
  MemoryQueueWireframe,
  TrustModerationWireframe,
  PersonaMonitorWireframe,
  StreamMonitorWireframe,
  SimulationPanelWireframe,
  AuditPanelWireframe
};
