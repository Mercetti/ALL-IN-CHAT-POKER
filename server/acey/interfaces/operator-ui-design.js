/**
 * Operator UI Design and Components
 * This is your cockpit - not chat, not streamer view
 * Shows what Acey is thinking and lets you control it
 */

// Operator UI Component Specifications
const OperatorUIComponents = {
  
  /**
   * Memory Panel Component
   * Shows proposed memories with controls
   */
  MemoryPanel: {
    name: 'MemoryPanel',
    description: 'Controls memory proposals and storage',
    
    props: {
      pendingProposals: {
        type: 'Array',
        required: true,
        description: 'Array of pending memory proposals'
      },
      onApprove: {
        type: 'Function',
        required: true,
        description: 'Callback for approving memory'
      },
      onReject: {
        type: 'Function', 
        required: true,
        description: 'Callback for rejecting memory'
      },
      onSimulate: {
        type: 'Function',
        required: false,
        description: 'Callback for simulating memory effect'
      }
    },

    template: `
      <div class="memory-panel">
        <div class="panel-header">
          <h3>🧠 Memory Proposals</h3>
          <div class="panel-controls">
            <button @click="toggleAutoApprove" :class="{ active: autoApprove }">
              {{ autoApprove ? 'Auto-Approve ON' : 'Auto-Approve OFF' }}
            </button>
            <button @click="lockMemory" :class="{ active: memoryLocked }">
              🔒 {{ memoryLocked ? 'Locked' : 'Unlocked' }}
            </button>
          </div>
        </div>

        <div class="proposals-list">
          <div v-for="proposal in pendingProposals" 
               :key="proposal.id" 
               class="proposal-card"
               :class="{ 
                 'high-confidence': proposal.confidence > 0.8,
                 'low-confidence': proposal.confidence < 0.5,
                 'global-scope': proposal.scope === 'global'
               }">

            <div class="proposal-header">
              <span class="proposal-type">{{ proposal.scope.toUpperCase() }}</span>
              <span class="confidence-score">{{ Math.round(proposal.confidence * 100) }}%</span>
              <span class="proposal-ttl">TTL: {{ proposal.ttl }}</span>
            </div>

            <div class="proposal-content">
              <h4>{{ proposal.summary }}</h4>
              <p class="justification">{{ proposal.justification }}</p>
              
              <div class="proposal-metadata">
                <span class="impact" :class="proposal.impact">{{ proposal.impact }}</span>
                <span class="privacy">{{ proposal.privacy }}</span>
                <span class="event-type">{{ proposal.eventType }}</span>
              </div>
            </div>

            <div class="proposal-actions">
              <button @click="approveProposal(proposal)" class="btn-approve">
                ✅ Approve
              </button>
              <button @click="simulateProposal(proposal)" class="btn-simulate">
                🧪 Simulate
              </button>
              <button @click="rejectProposal(proposal)" class="btn-reject">
                ❌ Reject
              </button>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <div class="stats">
            <span>Pending: {{ pendingProposals.length }}</span>
            <span>Approved Today: {{ approvedCount }}</span>
            <span>Rejected Today: {{ rejectedCount }}</span>
          </div>
        </div>
      </div>
    `,

    styles: `
      .memory-panel {
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 16px;
        color: #fff;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #333;
      }

      .proposal-card {
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
      }

      .proposal-card.high-confidence {
        border-color: #4CAF50;
        box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
      }

      .proposal-card.low-confidence {
        border-color: #FF9800;
        box-shadow: 0 0 10px rgba(255, 152, 0, 0.3);
      }

      .proposal-card.global-scope {
        border-color: #2196F3;
        box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
      }

      .confidence-score {
        background: #4CAF50;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
      }

      .btn-approve { background: #4CAF50; color: white; }
      .btn-simulate { background: #2196F3; color: white; }
      .btn-reject { background: #f44336; color: white; }
    `
  },

  /**
   * Trust + Moderation Panel Component
   * Shows trust deltas and moderation suggestions
   */
  TrustModerationPanel: {
    name: 'TrustModerationPanel',
    description: 'Controls trust signals and moderation actions',

    props: {
      trustSignals: { type: 'Array', required: true },
      moderationSuggestions: { type: 'Array', required: true },
      onApplyTrust: { type: 'Function', required: true },
      onApplyModeration: { type: 'Function', required: true }
    },

    template: `
      <div class="trust-moderation-panel">
        <div class="panel-section">
          <h3>🛡️ Trust Signals</h3>
          <div class="signals-grid">
            <div v-for="signal in trustSignals" 
                 :key="signal.id"
                 class="signal-card"
                 :class="signal.category">

              <div class="signal-header">
                <span class="user-id">{{ signal.userId }}</span>
                <span class="delta" :class="{ positive: signal.delta > 0, negative: signal.delta < 0 }">
                  {{ signal.delta > 0 ? '+' : '' }}{{ signal.delta }}
                </span>
              </div>

              <div class="signal-content">
                <p>{{ signal.reason }}</p>
                <div class="signal-meta">
                  <span class="category">{{ signal.category }}</span>
                  <span class="source">{{ signal.source }}</span>
                  <span class="decay">{{ signal.decayRate }}</span>
                </div>
              </div>

              <div class="signal-actions">
                <button @click="applyTrustSignal(signal)" class="btn-apply">
                  Apply
                </button>
                <button @click="throttleSignal(signal)" class="btn-throttle">
                  Throttle
                </button>
                <button @click="ignoreSignal(signal)" class="btn-ignore">
                  Ignore
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h3>⚖️ Moderation Suggestions</h3>
          <div class="suggestions-list">
            <div v-for="suggestion in moderationSuggestions"
                 :key="suggestion.id"
                 class="suggestion-card"
                 :class="suggestion.severity">

              <div class="suggestion-header">
                <span class="user-id">{{ suggestion.userId }}</span>
                <span class="severity">{{ suggestion.severity.toUpperCase() }}</span>
                <span class="action">{{ suggestion.action.replace('_', ' ') }}</span>
              </div>

              <div class="suggestion-content">
                <p>{{ suggestion.justification }}</p>
                <div class="evidence-list" v-if="suggestion.evidence.length">
                  <strong>Evidence:</strong>
                  <ul>
                    <li v-for="evidence in suggestion.evidence" :key="evidence">
                      {{ evidence }}
                    </li>
                  </ul>
                </div>
              </div>

              <div class="suggestion-actions">
                <button @click="applyModeration(suggestion)" class="btn-apply-moderation">
                  Apply {{ suggestion.duration }}
                </button>
                <button @click="escalateSuggestion(suggestion)" class="btn-escalate">
                  Escalate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },

  /**
   * Persona Monitor Component
   * Read-only view of current persona state
   */
  PersonaMonitor: {
    name: 'PersonaMonitor',
    description: 'Displays current persona mode and drift',

    props: {
      currentPersona: { type: 'Object', required: true },
      personaHistory: { type: 'Array', required: true },
      driftIndicator: { type: 'Number', required: true }
    },

    template: `
      <div class="persona-monitor">
        <div class="persona-display">
          <h3>🎭 Current Persona</h3>
          <div class="persona-card" :class="currentPersona.mode.toLowerCase()">
            <div class="persona-name">{{ currentPersona.displayName }}</div>
            <div class="persona-description">{{ currentPersona.description }}</div>
            
            <div class="persona-traits">
              <div class="trait" v-for="(value, key) in currentPersona.traits" :key="key">
                <span class="trait-name">{{ key }}:</span>
                <span class="trait-value">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="drift-indicator">
          <h4>📊 Drift Indicator</h4>
          <div class="drift-meter">
            <div class="drift-bar" :style="{ width: driftIndicator + '%' }"></div>
          </div>
          <span class="drift-label">{{ Math.round(driftIndicator) }}% drift</span>
        </div>

        <div class="persona-history">
          <h4>📜 Recent Changes</h4>
          <div class="history-timeline">
            <div v-for="change in personaHistory.slice(-5)" 
                 :key="change.timestamp"
                 class="history-item">
              <span class="time">{{ formatTime(change.timestamp) }}</span>
              <span class="change">{{ change.from }} → {{ change.to }}</span>
              <span class="reason">{{ change.reason }}</span>
            </div>
          </div>
        </div>
      </div>
    `
  },

  /**
   * Mood + Engagement Graphs Component
   * Shows aggregate chat signals without user data
   */
  MoodEngagementGraphs: {
    name: 'MoodEngagementGraphs',
    description: 'Displays mood and engagement metrics',

    props: {
      moodData: { type: 'Object', required: true },
      engagementData: { type: 'Object', required: true },
      realtime: { type: 'Boolean', default: true }
    },

    template: `
      <div class="mood-engagement-graphs">
        <div class="graph-section">
          <h3>📈 Mood Metrics</h3>
          <div class="mood-axes">
            <div class="axis" v-for="(value, axis) in moodData.current" :key="axis">
              <div class="axis-label">{{ axis.charAt(0).toUpperCase() + axis.slice(1) }}</div>
              <div class="axis-bar">
                <div class="axis-fill" :style="{ width: (value * 100) + '%' }"></div>
              </div>
              <div class="axis-value">{{ Math.round(value * 100) }}%</div>
            </div>
          </div>
        </div>

        <div class="graph-section">
          <h3>⚡ Engagement</h3>
          <div class="engagement-chart">
            <canvas ref="engagementCanvas" width="400" height="200"></canvas>
          </div>
        </div>

        <div class="graph-section">
          <h3>🔥 Activity Timeline</h3>
          <div class="activity-timeline">
            <div class="timeline-events">
              <div v-for="event in recentEvents" 
                   :key="event.timestamp"
                   class="timeline-event"
                   :class="event.type"
                   :style="{ left: calculateTimelinePosition(event.timestamp) + '%' }">
                <div class="event-dot"></div>
                <div class="event-tooltip">{{ event.type }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },

  /**
   * Simulation & Training Controls Component
   * Controls for testing and training modes
   */
  SimulationTrainingControls: {
    name: 'SimulationTrainingControls',
    description: 'Controls for simulation and training',

    props: {
      isTrainingMode: { type: 'Boolean', required: true },
      simulationHistory: { type: 'Array', required: true },
      onToggleTraining: { type: 'Function', required: true },
      onRunSimulation: { type: 'Function', required: true },
      onCompareOutputs: { type: 'Function', required: true }
    },

    template: `
      <div class="simulation-training-controls">
        <div class="control-section">
          <h3>🧪 Training Mode</h3>
          <div class="training-toggle">
            <label class="toggle-switch">
              <input type="checkbox" v-model="trainingEnabled" @change="toggleTraining">
              <span class="slider"></span>
            </label>
            <span>{{ trainingEnabled ? 'Training ON' : 'Training OFF' }}</span>
          </div>
        </div>

        <div class="control-section">
          <h3>🎮 Simulation Controls</h3>
          <div class="simulation-controls">
            <button @click="runReplay" class="btn-replay">
              🔄 Run Replay
            </button>
            <button @click="compareOutputs" class="btn-compare">
              ⚖️ Compare Outputs
            </button>
            <button @click="viewDiffs" class="btn-diffs">
              📋 View Diffs
            </button>
          </div>
        </div>

        <div class="control-section">
          <h3>📊 Simulation History</h3>
          <div class="simulation-history">
            <div v-for="sim in simulationHistory.slice(-10)" 
                 :key="sim.id"
                 class="sim-item">
              <span class="sim-time">{{ formatTime(sim.timestamp) }}</span>
              <span class="sim-type">{{ sim.type }}</span>
              <span class="sim-result" :class="sim.result">{{ sim.result }}</span>
            </div>
          </div>
        </div>
      </div>
    `
  },

  /**
   * Safety & Audit Panel Component
   * Shows safety metrics and audit logs
   */
  SafetyAuditPanel: {
    name: 'SafetyAuditPanel',
    description: 'Displays safety metrics and audit information',

    props: {
      safetyMetrics: { type: 'Object', required: true },
      auditLog: { type: 'Array', required: true },
      onExportAudit: { type: 'Function', required: true }
    },

    template: `
      <div class="safety-audit-panel">
        <div class="metrics-section">
          <h3>🛡️ Safety Metrics</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">{{ safetyMetrics.memoryWrites }}</div>
              <div class="metric-label">Memory Writes</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ safetyMetrics.denials }}</div>
              <div class="metric-label">Denials</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ safetyMetrics.shadowBans }}</div>
              <div class="metric-label">Shadow Bans</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ safetyMetrics.overrides }}</div>
              <div class="metric-label">Overrides</div>
            </div>
          </div>
        </div>

        <div class="audit-section">
          <h3>📋 Audit Log</h3>
          <div class="audit-controls">
            <button @click="exportAudit('json')" class="btn-export">
              📄 Export JSON
            </button>
            <button @click="exportAudit('csv')" class="btn-export">
              📊 Export CSV
            </button>
            <button @click="clearAuditLog" class="btn-clear">
              🗑️ Clear Log
            </button>
          </div>
          
          <div class="audit-log">
            <div v-for="entry in auditLog.slice(-50)" 
                 :key="entry.id"
                 class="audit-entry"
                 :class="entry.severity">
              <span class="entry-time">{{ formatTime(entry.timestamp) }}</span>
              <span class="entry-type">{{ entry.type }}</span>
              <span class="entry-description">{{ entry.description }}</span>
            </div>
          </div>
        </div>
      </div>
    `
  }
};

// Operator UI Layout Configuration
const OperatorUILayout = {
  type: 'dashboard',
  layout: 'grid',
  grid: {
    rows: 3,
    columns: 4,
    gap: '16px'
  },
  
  components: [
    {
      component: 'MemoryPanel',
      position: { row: 0, col: 0, width: 2, height: 2 },
      title: 'Memory Control'
    },
    {
      component: 'TrustModerationPanel', 
      position: { row: 0, col: 2, width: 2, height: 2 },
      title: 'Trust & Moderation'
    },
    {
      component: 'PersonaMonitor',
      position: { row: 2, col: 0, width: 1, height: 1 },
      title: 'Persona Monitor'
    },
    {
      component: 'MoodEngagementGraphs',
      position: { row: 2, col: 1, width: 2, height: 1 },
      title: 'Mood & Engagement'
    },
    {
      component: 'SimulationTrainingControls',
      position: { row: 2, col: 3, width: 1, height: 1 },
      title: 'Simulation'
    },
    {
      component: 'SafetyAuditPanel',
      position: { row: 0, col: 0, width: 4, height: 1 },
      title: 'Safety & Audit',
      overlay: true
    }
  ],

  realTimeConnections: [
    { from: 'MemoryPanel', to: 'SafetyAuditPanel', event: 'memoryAction' },
    { from: 'TrustModerationPanel', to: 'SafetyAuditPanel', event: 'moderationAction' },
    { from: 'MoodEngagementGraphs', to: 'PersonaMonitor', event: 'moodChange' },
    { from: 'SimulationTrainingControls', to: 'MemoryPanel', event: 'simulationResult' }
  ]
};

// Operator UI State Management
const OperatorUIState = {
  state: {
    // Memory state
    pendingProposals: [],
    memoryLocked: false,
    autoApprove: false,
    
    // Trust state
    trustSignals: [],
    moderationSuggestions: [],
    trustThrottled: false,
    
    // Persona state
    currentPersona: null,
    personaHistory: [],
    driftIndicator: 0,
    
    // Mood state
    moodData: { current: {}, history: [] },
    engagementData: { realtime: [], aggregated: [] },
    
    // Simulation state
    isTrainingMode: false,
    simulationHistory: [],
    comparisonResults: [],
    
    // Safety state
    safetyMetrics: {},
    auditLog: [],
    
    // UI state
    activePanel: 'MemoryPanel',
    notifications: [],
    filters: {}
  },

  mutations: {
    ADD_PENDING_PROPOSAL(state, proposal) {
      state.pendingProposals.push(proposal);
    },
    
    APPROVE_PROPOSAL(state, proposalId) {
      const index = state.pendingProposals.findIndex(p => p.id === proposalId);
      if (index !== -1) {
        state.pendingProposals.splice(index, 1);
        state.auditLog.push({
          id: Date.now(),
          timestamp: Date.now(),
          type: 'memory_approved',
          description: `Memory proposal ${proposalId} approved`,
          severity: 'info'
        });
      }
    },
    
    REJECT_PROPOSAL(state, proposalId) {
      const index = state.pendingProposals.findIndex(p => p.id === proposalId);
      if (index !== -1) {
        state.pendingProposals.splice(index, 1);
        state.auditLog.push({
          id: Date.now(),
          timestamp: Date.now(),
          type: 'memory_rejected',
          description: `Memory proposal ${proposalId} rejected`,
          severity: 'warning'
        });
      }
    },
    
    UPDATE_PERSONA(state, persona) {
      state.currentPersona = persona;
      state.personaHistory.push({
        timestamp: Date.now(),
        persona: persona.mode,
        reason: persona.reason || 'automatic'
      });
    },
    
    ADD_TRUST_SIGNAL(state, signal) {
      state.trustSignals.push(signal);
    },
    
    ADD_MODERATION_SUGGESTION(state, suggestion) {
      state.moderationSuggestions.push(suggestion);
    }
  },

  actions: {
    async approveProposal({ commit }, proposalId) {
      // API call to approve proposal
      commit('APPROVE_PROPOSAL', proposalId);
    },
    
    async rejectProposal({ commit }, proposalId) {
      // API call to reject proposal
      commit('REJECT_PROPOSAL', proposalId);
    },
    
    async simulateProposal({ commit }, proposal) {
      // API call to simulate proposal effect
      const result = await api.simulateMemory(proposal);
      return result;
    },
    
    async applyTrustSignal({ commit }, signal) {
      // API call to apply trust signal
      await api.applyTrustSignal(signal);
      commit('ADD_TRUST_SIGNAL', signal);
    }
  }
};

module.exports = {
  OperatorUIComponents,
  OperatorUILayout,
  OperatorUIState
};
