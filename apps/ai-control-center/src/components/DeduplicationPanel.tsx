import React, { useState, useEffect } from 'react';
import {
  detectDuplicates,
  removeDuplicates,
  mergeDuplicates,
  smartCleanup,
  aiCleanup,
  fetchCosmeticSets
} from '../services/api';
import './DeduplicationPanel.css';

interface DuplicateGroup {
  group: string;
  similarity: number;
  items: Array<{
    id: string;
    name: string;
    similarity: number;
  }>;
  recommendation: 'review' | 'merge' | 'remove';
}

interface DeduplicationResult {
  duplicates: DuplicateGroup[];
  totalGroups: number;
  totalDuplicates: number;
  potentialSavings: number;
  removed?: string[];
  kept?: string[];
  spaceSaved?: string;
  moneySaved?: number;
  merged?: Array<{
    from: string[];
    into: string;
    newName: string;
  }>;
  cleaned?: any[];
  qualityImproved?: number;
}

export default function DeduplicationPanel() {
  const [cosmetics, setCosmetics] = useState<any[]>([]);
  const [deduplicationResult, setDeduplicationResult] = useState<DeduplicationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detect' | 'actions' | 'ai-cleanup'>('detect');
  const [aiCleanupResult, setAiCleanupResult] = useState<any>(null);

  useEffect(() => {
    loadCosmetics();
  }, []);

  const loadCosmetics = async () => {
    try {
      const data = await fetchCosmeticSets();
      if (data.success) {
        setCosmetics(data.data.sets);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cosmetics');
    }
  };

  const handleDetectDuplicates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await detectDuplicates(cosmetics);
      if (result.success) {
        setDeduplicationResult(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect duplicates');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (!deduplicationResult) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await removeDuplicates(cosmetics);
      if (result.success) {
        setDeduplicationResult(result.data);
        await loadCosmetics(); // Refresh the list
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove duplicates');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeDuplicates = async () => {
    if (!deduplicationResult) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await mergeDuplicates(cosmetics);
      if (result.success) {
        setDeduplicationResult(result.data);
        await loadCosmetics(); // Refresh the list
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge duplicates');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartCleanup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await smartCleanup(cosmetics);
      if (result.success) {
        setDeduplicationResult(result.data);
        await loadCosmetics(); // Refresh the list
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform smart cleanup');
    } finally {
      setLoading(false);
    }
  };

  const handleAiCleanup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await aiCleanup(cosmetics);
      if (result.success) {
        setAiCleanupResult(result.data);
        await loadCosmetics(); // Refresh the list
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform AI cleanup');
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return '#ff4444'; // High similarity - red
    if (similarity >= 0.8) return '#ffaa00'; // Medium similarity - orange
    return '#00ff88'; // Low similarity - green
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'merge': return '🔀 Merge';
      case 'remove': return '🗑️ Remove';
      case 'review': return '👁️ Review';
      default: return recommendation;
    }
  };

  return (
    <div className="deduplication-panel">
      <header className="panel-header">
        <h1>🔄 Cosmetics Deduplication</h1>
        <p>Identify and manage duplicate or similar cosmetic items to optimize storage and costs</p>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="tab-nav">
        <button 
          className={`tab-btn ${activeTab === 'detect' ? 'active' : ''}`}
          onClick={() => setActiveTab('detect')}
        >
          🔍 Detect Duplicates
        </button>
        <button 
          className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          ⚡ Quick Actions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ai-cleanup' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-cleanup')}
        >
          🤖 AI Cleanup
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'detect' && (
          <div className="detect-section">
            <div className="action-bar">
              <button 
                className="primary-btn" 
                onClick={handleDetectDuplicates}
                disabled={loading || cosmetics.length === 0}
              >
                {loading ? '🔍 Scanning...' : '🔍 Detect Duplicates'}
              </button>
              <span className="cosmetic-count">
                {cosmetics.length} cosmetics loaded
              </span>
            </div>

            {deduplicationResult && (
              <div className="results-summary">
                <h2>📊 Detection Results</h2>
                <div className="summary-grid">
                  <div className="summary-card">
                    <h3>{deduplicationResult.totalGroups}</h3>
                    <p>Duplicate Groups</p>
                  </div>
                  <div className="summary-card">
                    <h3>{deduplicationResult.totalDuplicates}</h3>
                    <p>Duplicate Items</p>
                  </div>
                  <div className="summary-card">
                    <h3>${deduplicationResult.potentialSavings.toFixed(2)}</h3>
                    <p>Potential Savings</p>
                  </div>
                </div>
              </div>
            )}

            {deduplicationResult?.duplicates && (
              <div className="duplicate-groups">
                <h2>🔄 Duplicate Groups</h2>
                {deduplicationResult.duplicates.map((group, index) => (
                  <div key={index} className="duplicate-group">
                    <div className="group-header">
                      <h3>{group.group}</h3>
                      <div className="group-stats">
                        <span 
                          className="similarity-score"
                          style={{ color: getSimilarityColor(group.similarity) }}
                        >
                          {(group.similarity * 100).toFixed(1)}% similar
                        </span>
                        <span className="recommendation-badge">
                          {getRecommendationBadge(group.recommendation)}
                        </span>
                      </div>
                    </div>
                    <div className="group-items">
                      {group.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="duplicate-item">
                          <div className="item-info">
                            <h4>{item.name}</h4>
                            <p>ID: {item.id}</p>
                            <p>Similarity: {(item.similarity * 100).toFixed(1)}%</p>
                          </div>
                          <div className="item-preview">
                            <img 
                              src={`/uploads/cosmetics/${item.id}_preview.png`}
                              alt={item.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/placeholder.png';
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="actions-section">
            <h2>⚡ Quick Deduplication Actions</h2>
            <div className="action-grid">
              <div className="action-card">
                <h3>🔍 Detect Duplicates</h3>
                <p>Scan for similar items using AI analysis</p>
                <button 
                  className="primary-btn"
                  onClick={handleDetectDuplicates}
                  disabled={loading}
                >
                  {loading ? 'Scanning...' : 'Detect'}
                </button>
              </div>

              <div className="action-card">
                <h3>🗑️ Remove Duplicates</h3>
                <p>Permanently remove duplicate items</p>
                <button 
                  className="danger-btn"
                  onClick={handleRemoveDuplicates}
                  disabled={loading || !deduplicationResult}
                >
                  {loading ? 'Removing...' : 'Remove'}
                </button>
              </div>

              <div className="action-card">
                <h3>🔀 Merge Duplicates</h3>
                <p>Merge similar items into enhanced versions</p>
                <button 
                  className="warning-btn"
                  onClick={handleMergeDuplicates}
                  disabled={loading || !deduplicationResult}
                >
                  {loading ? 'Merging...' : 'Merge'}
                </button>
              </div>

              <div className="action-card">
                <h3>🧹 Smart Cleanup</h3>
                <p>AI-powered optimization of entire collection</p>
                <button 
                  className="primary-btn"
                  onClick={handleSmartCleanup}
                  disabled={loading}
                >
                  {loading ? 'Cleaning...' : 'Smart Cleanup'}
                </button>
              </div>
            </div>

            {deduplicationResult && (
              <div className="action-results">
                <h3>📈 Last Action Results</h3>
                <div className="results-grid">
                  {deduplicationResult.spaceSaved && (
                    <div className="result-item">
                      <span className="result-label">Space Saved:</span>
                      <span className="result-value">{deduplicationResult.spaceSaved}</span>
                    </div>
                  )}
                  {deduplicationResult.moneySaved && (
                    <div className="result-item">
                      <span className="result-label">Money Saved:</span>
                      <span className="result-value">${deduplicationResult.moneySaved.toFixed(2)}</span>
                    </div>
                  )}
                  {deduplicationResult.qualityImproved && (
                    <div className="result-item">
                      <span className="result-label">Quality Improved:</span>
                      <span className="result-value">+{deduplicationResult.qualityImproved}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai-cleanup' && (
          <div className="ai-cleanup-section">
            <div className="cleanup-intro">
              <h2>🤖 AI-Powered Cleanup</h2>
              <p>Advanced AI analysis to optimize your cosmetic collection with intelligent recommendations and automated improvements</p>
              <button 
                className="primary-btn large-btn"
                onClick={handleAiCleanup}
                disabled={loading}
              >
                {loading ? '🤖 AI Processing...' : '🤖 Start AI Cleanup'}
              </button>
            </div>

            {aiCleanupResult && (
              <div className="ai-results">
                <h3>🎯 AI Cleanup Results</h3>
                
                <div className="ai-summary">
                  <p>{aiCleanupResult.report.summary}</p>
                </div>

                <div className="ai-metrics">
                  <h4>📊 Performance Metrics</h4>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <h4>{aiCleanupResult.result.metrics.spaceSaved}</h4>
                      <p>Space Saved</p>
                    </div>
                    <div className="metric-card">
                      <h4>${aiCleanupResult.result.metrics.moneySaved.toFixed(2)}</h4>
                      <p>Money Saved</p>
                    </div>
                    <div className="metric-card">
                      <h4>{aiCleanupResult.result.metrics.processingTime}</h4>
                      <p>Processing Time</p>
                    </div>
                  </div>
                </div>

                <div className="improvements">
                  <h4>📈 Quality Improvements</h4>
                  <div className="improvement-bars">
                    <div className="improvement-item">
                      <span>Quality</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${aiCleanupResult.result.improvements.quality}%` }}
                        />
                      </div>
                      <span>+{aiCleanupResult.result.improvements.quality}%</span>
                    </div>
                    <div className="improvement-item">
                      <span>Consistency</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${aiCleanupResult.result.improvements.consistency}%` }}
                        />
                      </div>
                      <span>+{aiCleanupResult.result.improvements.consistency}%</span>
                    </div>
                    <div className="improvement-item">
                      <span>Variety</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${aiCleanupResult.result.improvements.variety}%` }}
                        />
                      </div>
                      <span>+{aiCleanupResult.result.improvements.variety}%</span>
                    </div>
                  </div>
                </div>

                <div className="recommendations">
                  <h4>💡 AI Recommendations</h4>
                  <ul>
                    {aiCleanupResult.report.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                  <p className="next-run">
                    Next scheduled cleanup: {new Date(aiCleanupResult.report.nextRun).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
