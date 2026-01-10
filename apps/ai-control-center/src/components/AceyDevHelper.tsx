import { useState, useEffect } from 'react';
import './AceyDevHelper.css';

interface WorkflowAnalysis {
  id: string;
  action: string;
  aceyAnalysis: {
    risk: string;
    recommendation: string;
    safetyChecks: string[];
    impact: string;
    playerImpact: string;
    optimalTiming: string;
    automatedChecks: string[];
  };
  generatedBy: string;
  timestamp: string;
  context: {
    currentTime: string;
    playerCount: string;
    systemStatus: string;
    lastDeploy: string;
    environment: string;
  };
}

interface DevStatus {
  currentEnvironment: string;
  developmentMode: string;
  playerCount: number;
  systemHealth: string;
  lastDeploy: string;
  recommendedActions: Array<{
    action: string;
    priority: string;
    description: string;
    aceyNote: string;
  }>;
  aceyRecommendations: {
    deploymentStrategy: string;
    developmentPace: string;
    riskMitigation: string;
    playerExperience: string;
  };
  generatedBy: string;
  timestamp: string;
}

export default function AceyDevHelper() {
  const [workflowAnalysis, setWorkflowAnalysis] = useState<WorkflowAnalysis | null>(null);
  const [devStatus, setDevStatus] = useState<DevStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');

  useEffect(() => {
    loadDevStatus();
  }, []);

  const loadDevStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/admin/ai/development/status');
      const data = await response.json();
      if (data.success) {
        setDevStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to load development status:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWorkflow = async (action: string) => {
    try {
      setLoading(true);
      setSelectedAction(action);
      const response = await fetch('/admin/ai/development/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          context: 'development_workflow_analysis',
          changes: [],
          priority: 'medium'
        })
      });
      const data = await response.json();
      if (data.success) {
        setWorkflowAnalysis(data.data);
      }
    } catch (error) {
      console.error('Failed to analyze workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#00ff88';
      default: return '#888';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#00ff88';
      default: return '#888';
    }
  };

  if (loading && !devStatus) {
    return (
      <div className="acey-dev-helper">
        <div className="loading">
          <div className="loading-spinner">🤖</div>
          <p>Acey is analyzing development workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="acey-dev-helper">
      <header className="acey-header">
        <h1>
          <span className="icon">🤖</span>
          Acey Development Workflow Manager
        </h1>
        <p className="subtitle">
          AI-powered development workflow analysis and recommendations
        </p>
      </header>

      {devStatus && (
        <div className="status-overview">
          <h2>📊 Current Development Status</h2>
          <div className="status-grid">
            <div className="status-card">
              <h3>Environment</h3>
              <p className="status-value">{devStatus.currentEnvironment}</p>
            </div>
            <div className="status-card">
              <h3>Development Mode</h3>
              <p className="status-value">{devStatus.developmentMode}</p>
            </div>
            <div className="status-card">
              <h3>Active Players</h3>
              <p className="status-value">{devStatus.playerCount}</p>
            </div>
            <div className="status-card">
              <h3>System Health</h3>
              <p className="status-value">{devStatus.systemHealth}</p>
            </div>
          </div>
        </div>
      )}

      {devStatus && (
        <div className="acey-recommendations">
          <h2>🧠 Acey's Recommendations</h2>
          <div className="recommendation-grid">
            <div className="recommendation-card">
              <h3>📈 Development Strategy</h3>
              <p>{devStatus.aceyRecommendations.deploymentStrategy}</p>
            </div>
            <div className="recommendation-card">
              <h3>⚡ Development Pace</h3>
              <p>{devStatus.aceyRecommendations.developmentPace}</p>
            </div>
            <div className="recommendation-card">
              <h3>🛡️ Risk Mitigation</h3>
              <p>{devStatus.aceyRecommendations.riskMitigation}</p>
            </div>
            <div className="recommendation-card">
              <h3>🎮 Player Experience</h3>
              <p>{devStatus.aceyRecommendations.playerExperience}</p>
            </div>
          </div>
        </div>
      )}

      {devStatus && (
        <div className="recommended-actions">
          <h2>🎯 Recommended Actions</h2>
          <div className="actions-list">
            {devStatus.recommendedActions.map((action, index) => (
              <div key={index} className="action-item">
                <div className="action-header">
                  <h3>{action.action.replace('_', ' ').toUpperCase()}</h3>
                  <span 
                    className="priority" 
                    style={{ color: getPriorityColor(action.priority) }}
                  >
                    {action.priority.toUpperCase()}
                  </span>
                </div>
                <p className="action-description">{action.description}</p>
                <div className="acey-note">
                  <span className="note-icon">💡</span>
                  <p>{action.aceyNote}</p>
                </div>
                <button 
                  className="action-btn"
                  onClick={() => analyzeWorkflow(action.action)}
                  disabled={loading}
                >
                  {loading && selectedAction === action.action ? 'Analyzing...' : 'Analyze with Acey'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {workflowAnalysis && (
        <div className="workflow-analysis">
          <h2>🔍 Acey's Workflow Analysis</h2>
          <div className="analysis-card">
            <div className="analysis-header">
              <h3>{workflowAnalysis.action.toUpperCase()} Analysis</h3>
              <span className="generated-by">
                Generated by {workflowAnalysis.generatedBy}
              </span>
            </div>
            
            <div className="analysis-content">
              <div className="analysis-section">
                <h4>⚠️ Risk Assessment</h4>
                <div className="risk-indicator" style={{ backgroundColor: getRiskColor(workflowAnalysis.aceyAnalysis.risk) }}>
                  {workflowAnalysis.aceyAnalysis.risk.toUpperCase()}
                </div>
                <p>{workflowAnalysis.aceyAnalysis.risk}</p>
              </div>
              
              <div className="analysis-section">
                <h4>💡 Recommendation</h4>
                <p>{workflowAnalysis.aceyAnalysis.recommendation}</p>
              </div>
              
              <div className="analysis-section">
                <h4>🎮 Player Impact</h4>
                <p>{workflowAnalysis.aceyAnalysis.playerImpact}</p>
              </div>
              
              <div className="analysis-section">
                <h4>⏰ Optimal Timing</h4>
                <p>{workflowAnalysis.aceyAnalysis.optimalTiming}</p>
              </div>
              
              <div className="analysis-section">
                <h4>🛡️ Safety Checks</h4>
                <ul>
                  {workflowAnalysis.aceyAnalysis.safetyChecks.map((check, index) => (
                    <li key={index}>{check}</li>
                  ))}
                </ul>
              </div>
              
              <div className="analysis-section">
                <h4>🤖 Automated Checks</h4>
                <ul>
                  {workflowAnalysis.aceyAnalysis.automatedChecks.map((check, index) => (
                    <li key={index}>{check}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="analysis-footer">
              <div className="context-info">
                <h4>📊 Context</h4>
                <div className="context-grid">
                  <div className="context-item">
                    <span className="label">Current Time:</span>
                    <span className="value">{workflowAnalysis.context.currentTime}</span>
                  </div>
                  <div className="context-item">
                    <span className="label">Player Count:</span>
                    <span className="value">{workflowAnalysis.context.playerCount}</span>
                  </div>
                  <div className="context-item">
                    <span className="label">System Status:</span>
                    <span className="value">{workflowAnalysis.context.systemStatus}</span>
                  </div>
                  <div className="context-item">
                    <span className="label">Environment:</span>
                    <span className="value">{workflowAnalysis.context.environment}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
