/**
 * React Dashboard Components for AI Control Center
 * Complete operator interface with real-time updates
 * Built with React + TypeScript + Tailwind CSS
 */

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// ===== TYPES =====
interface DashboardData {
  pendingIntents: PendingIntent[];
  systemStats: SystemStats;
  recentActivity: AuditEntry[];
  safetyAlerts: SafetyAlert[];
  streamMetrics: StreamMetrics;
}

interface PendingIntent {
  intentId: string;
  type: string;
  confidence: number;
  justification: string;
  timestamp: number;
  data: any;
}

interface SystemStats {
  totalProcessed: number;
  approved: number;
  rejected: number;
  simulated: number;
  errors: number;
  averageProcessingTime: number;
  pending: number;
}

interface AuditEntry {
  id: string;
  timestamp: number;
  category: string;
  action: string;
  details: any;
}

interface SafetyAlert {
  id: string;
  timestamp: number;
  severity: string;
  message: string;
  resolved: boolean;
}

interface StreamMetrics {
  chatVelocity: number;
  hypeIndex: number;
  engagementLevel: number;
  moodAxes: {
    energy: number;
    chaos: number;
    tension: number;
    engagement: number;
  };
}

// ===== MAIN DASHBOARD COMPONENT =====
export const AIDashboard: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [connected, setConnected] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<string>('memory');

  useEffect(() => {
    // Connect to Control Center server
    const newSocket = io('http://localhost:3001');
    
    newSocket.on('connect', () => {
      console.log('Connected to AI Control Center');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from AI Control Center');
      setConnected(false);
    });

    newSocket.on('dashboard_update', (data: DashboardData) => {
      setDashboardData(data);
    });

    newSocket.on('intent_received', (intent) => {
      console.log('Intent received:', intent);
    });

    newSocket.on('intent_approved', (approved) => {
      console.log('Intent approved:', approved);
    });

    newSocket.on('intent_rejected', (rejected) => {
      console.log('Intent rejected:', rejected);
    });

    setSocket(newSocket);

    // Request initial dashboard data
    newSocket.emit('get_dashboard');

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleOperatorCommand = useCallback((command: any) => {
    if (socket) {
      socket.emit('operator_command', command);
    }
  }, [socket]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to AI Control Center...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <p className="text-gray-400">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-400">🧠 AI Control Center</h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-400">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-gray-400">Pending:</span>
              <span className="ml-2 font-bold text-yellow-400">{dashboardData.systemStats.pending}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Approved:</span>
              <span className="ml-2 font-bold text-green-400">{dashboardData.systemStats.approved}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Rejected:</span>
              <span className="ml-2 font-bold text-red-400">{dashboardData.systemStats.rejected}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex gap-6">
          {[
            { id: 'memory', label: '🧠 Memory', icon: '🧠' },
            { id: 'trust', label: '🛡️ Trust & Safety', icon: '🛡️' },
            { id: 'persona', label: '🎭 Persona', icon: '🎭' },
            { id: 'stream', label: '📊 Stream', icon: '📊' },
            { id: 'simulation', label: '🧪 Simulation', icon: '🧪' },
            { id: 'audit', label: '🧾 Audit', icon: '🧾' }
          ].map(panel => (
            <button
              key={panel.id}
              onClick={() => setSelectedPanel(panel.id)}
              className={`py-3 px-4 border-b-2 transition-colors ${
                selectedPanel === panel.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {panel.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {selectedPanel === 'memory' && (
          <MemoryQueuePanel 
            data={dashboardData} 
            onCommand={handleOperatorCommand}
          />
        )}
        {selectedPanel === 'trust' && (
          <TrustSafetyPanel 
            data={dashboardData} 
            onCommand={handleOperatorCommand}
          />
        )}
        {selectedPanel === 'persona' && (
          <PersonaMonitorPanel 
            data={dashboardData} 
            onCommand={handleOperatorCommand}
          />
        )}
        {selectedPanel === 'stream' && (
          <StreamMonitorPanel 
            data={dashboardData} 
            onCommand={handleOperatorCommand}
          />
        )}
        {selectedPanel === 'simulation' && (
          <SimulationPanel 
            data={dashboardData} 
            onCommand={handleOperatorCommand}
          />
        )}
        {selectedPanel === 'audit' && (
          <AuditPanel 
            data={dashboardData} 
            onCommand={handleOperatorCommand}
          />
        )}
      </main>
    </div>
  );
};

// ===== MEMORY QUEUE PANEL =====
const MemoryQueuePanel: React.FC<{
  data: DashboardData;
  onCommand: (command: any) => void;
}> = ({ data, onCommand }) => {
  const [autoApprove, setAutoApprove] = useState(false);
  const [memoryLocked, setMemoryLocked] = useState(false);

  const memoryProposals = data.pendingIntents.filter(intent => 
    intent.data.intents?.some((i: any) => i.type === 'memory_proposal')
  );

  const handleApprove = (intentId: string) => {
    onCommand({ type: 'approve_intent', intentId });
  };

  const handleReject = (intentId: string, reason: string) => {
    onCommand({ type: 'reject_intent', intentId, reason });
  };

  const handleLockMemory = () => {
    const newLocked = !memoryLocked;
    setMemoryLocked(newLocked);
    onCommand({ type: newLocked ? 'lock_memory' : 'unlock_memory' });
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">🧠 Memory Queue</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setAutoApprove(!autoApprove)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                autoApprove 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
            >
              Auto-Approve: {autoApprove ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={handleLockMemory}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                memoryLocked 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
            >
              🔒 Memory {memoryLocked ? 'Locked' : 'Unlocked'}
            </button>
          </div>
        </div>
      </div>

      {/* Memory Proposals */}
      <div className="space-y-3">
        {memoryProposals.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No pending memory proposals</p>
          </div>
        ) : (
          memoryProposals.map(proposal => (
            <MemoryProposalCard
              key={proposal.intentId}
              proposal={proposal}
              onApprove={handleApprove}
              onReject={handleReject}
              locked={memoryLocked}
            />
          ))
        )}
      </div>

      {/* Statistics */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Pending:</span>
            <span className="ml-2 font-bold text-yellow-400">{memoryProposals.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Approved Today:</span>
            <span className="ml-2 font-bold text-green-400">{data.systemStats.approved}</span>
          </div>
          <div>
            <span className="text-gray-400">Rejected Today:</span>
            <span className="ml-2 font-bold text-red-400">{data.systemStats.rejected}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== MEMORY PROPOSAL CARD =====
const MemoryProposalCard: React.FC<{
  proposal: PendingIntent;
  onApprove: (intentId: string) => void;
  onReject: (intentId: string, reason: string) => void;
  locked: boolean;
}> = ({ proposal, onApprove, onReject, locked }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const memoryIntent = proposal.data.intents?.find((i: any) => i.type === 'memory_proposal');
  
  if (!memoryIntent) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-600';
    if (confidence >= 0.6) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'global': return 'bg-purple-600';
      case 'stream': return 'bg-blue-600';
      case 'event': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <span className={`px-2 py-1 text-xs rounded ${getScopeColor(memoryIntent.scope)}`}>
            {memoryIntent.scope.toUpperCase()}
          </span>
          <span className={`px-2 py-1 text-xs rounded ${getConfidenceColor(memoryIntent.confidence)}`}>
            {Math.round(memoryIntent.confidence * 100)}%
          </span>
          {memoryIntent.ttl && (
            <span className="px-2 py-1 bg-gray-600 text-xs rounded">
              TTL: {memoryIntent.ttl}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {new Date(proposal.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Content */}
      <div className="mb-3">
        <h3 className="font-medium text-white mb-2">{memoryIntent.summary}</h3>
        <p className="text-gray-300 text-sm">{memoryIntent.justification}</p>
      </div>

      {/* Metadata */}
      {memoryIntent.impact && (
        <div className="flex gap-2 mb-3">
          <span className={`px-2 py-1 text-xs rounded ${
            memoryIntent.impact === 'high' ? 'bg-red-600' :
            memoryIntent.impact === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
          }`}>
            {memoryIntent.impact.toUpperCase()}
          </span>
          {memoryIntent.privacy && (
            <span className="px-2 py-1 bg-gray-600 text-xs rounded">
              {memoryIntent.privacy}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onApprove(proposal.intentId)}
          disabled={locked}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            locked
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          ✅ Approve
        </button>
        <button
          onClick={() => setShowRejectDialog(true)}
          disabled={locked}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            locked
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          ❌ Reject
        </button>
        <button
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
        >
          🧪 Simulate
        </button>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject Memory Proposal</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full bg-gray-700 text-white rounded p-3 mb-4 resize-none"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReject(proposal.intentId, rejectReason);
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== TRUST & SAFETY PANEL =====
const TrustSafetyPanel: React.FC<{
  data: DashboardData;
  onCommand: (command: any) => void;
}> = ({ data, onCommand }) => {
  // This would show trust signals and moderation suggestions
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">🛡️ Trust & Safety</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Trust Signals</h3>
            <div className="text-gray-400">
              <p>No recent trust signals</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Moderation Suggestions</h3>
            <div className="text-gray-400">
              <p>No moderation suggestions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== PERSONA MONITOR PANEL =====
const PersonaMonitorPanel: React.FC<{
  data: DashboardData;
  onCommand: (command: any) => void;
}> = ({ data, onCommand }) => {
  const [personaLocked, setPersonaLocked] = useState(false);

  const handleLockPersona = () => {
    const newLocked = !personaLocked;
    setPersonaLocked(newLocked);
    // This would send a command to lock/unlock persona
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🎭 Persona Monitor</h2>
          <button
            onClick={handleLockPersona}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              personaLocked 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
            }`}
          >
            🔒 Persona {personaLocked ? 'Locked' : 'Unlocked'}
          </button>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-purple-400 mb-2">NEUTRAL</h3>
            <p className="text-gray-300 mb-4">Balanced, professional, welcoming</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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
            
            <div className="text-xs text-gray-400">
              ⚠️ Read-only - Changes require intent approval
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== STREAM MONITOR PANEL =====
const StreamMonitorPanel: React.FC<{
  data: DashboardData;
  onCommand: (command: any) => void;
}> = ({ data, onCommand }) => {
  const metrics = data.streamMetrics;

  const getMoodColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">📊 Stream Monitor</h2>
        
        {/* Mood Metrics */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium mb-3">📈 Mood Metrics</h3>
            <div className="space-y-3">
              {Object.entries(metrics.moodAxes).map(([mood, value]) => (
                <div key={mood}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 capitalize">{mood}:</span>
                    <span className="text-white">{value}%</span>
                  </div>
                  <div className="bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getMoodColor(value)}`}
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">⚡ Activity Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{metrics.chatVelocity}</div>
                <div className="text-gray-400 text-sm">Chat/min</div>
              </div>
              <div className="bg-gray-700 rounded p-3 text-center">
                <div className="text-2xl font-bold text-orange-400">{metrics.hypeIndex}%</div>
                <div className="text-gray-400 text-sm">Hype Index</div>
              </div>
              <div className="bg-gray-700 rounded p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{metrics.engagementLevel}%</div>
                <div className="text-gray-400 text-sm">Engagement</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== SIMULATION PANEL =====
const SimulationPanel: React.FC<{
  data: DashboardData;
  onCommand: (command: any) => void;
}> = ({ data, onCommand }) => {
  const [simulationMode, setSimulationMode] = useState(false);

  const handleToggleSimulation = () => {
    const newMode = !simulationMode;
    setSimulationMode(newMode);
    onCommand({ type: newMode ? 'start_simulation' : 'end_simulation' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">🧪 Simulation & Training</h2>
        
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={simulationMode}
                onChange={handleToggleSimulation}
                className="rounded"
              />
              <span className="text-white">Training Mode</span>
            </label>
            <span className={`text-sm ${simulationMode ? 'text-green-400' : 'text-gray-400'}`}>
              {simulationMode ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">🎮 Simulation Controls</h3>
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
                🔄 Run Replay
              </button>
              <button className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm">
                ⚖️ Compare Outputs
              </button>
              <button className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">
                📋 View Diffs
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">📊 Simulation History</h3>
            <div className="bg-gray-700 rounded p-3 max-h-32 overflow-y-auto text-sm">
              <div className="text-gray-400">
                <p>No simulation history available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== AUDIT PANEL =====
const AuditPanel: React.FC<{
  data: DashboardData;
  onCommand: (command: any) => void;
}> = ({ data, onCommand }) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  const handleExport = () => {
    // This would trigger an export
    console.log(`Exporting audit data as ${exportFormat}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">🧾 Audit & Export</h2>
        
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{data.systemStats.totalProcessed}</div>
            <div className="text-gray-400 text-sm">Total Ops</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{data.systemStats.approved}</div>
            <div className="text-gray-400 text-sm">Approved</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{data.systemStats.rejected}</div>
            <div className="text-gray-400 text-sm">Rejected</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{data.systemStats.errors}</div>
            <div className="text-gray-400 text-sm">Errors</div>
          </div>
        </div>

        {/* Export Controls */}
        <div className="mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setExportFormat('json')}
                className={`px-3 py-2 rounded text-sm ${
                  exportFormat === 'json'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                📄 JSON
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={`px-3 py-2 rounded text-sm ${
                  exportFormat === 'csv'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                📊 CSV
              </button>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              📥 Export
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-lg font-medium mb-3">📋 Recent Activity</h3>
          <div className="bg-gray-700 rounded p-3 max-h-64 overflow-y-auto">
            {data.recentActivity.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {data.recentActivity.slice(-10).map((entry, index) => (
                  <div key={entry.id} className="flex justify-between text-sm text-gray-300 p-2 bg-gray-600 rounded">
                    <span className="text-gray-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                    <span>{entry.category}.{entry.action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
