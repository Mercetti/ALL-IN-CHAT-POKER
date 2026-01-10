import { useState, useEffect } from 'react';
import './AceyFeedbackAnalyzer.css';

interface FeedbackAnalysis {
  id: string;
  feedbackId: string;
  category: string;
  originalFeedback: string;
  aceyAnalysis: {
    priority: string;
    impact: string;
    recommendation: string;
    communityValue: string;
    aceyInsight: string;
    playerImpact: string;
    developmentPriority: string;
    communityAlignment: string;
  };
  aceyScoring: {
    technicalFeasibility: number;
    playerDemand: number;
    communityBenefit: number;
    implementationComplexity: number;
    overallScore: number;
  };
  generatedBy: string;
  timestamp: string;
  context: {
    currentTime: string;
    playerCount: number;
    communityImpact: string;
    systemStatus: string;
    recentFeedback: string;
  };
}

interface TopSuggestion {
  id: string;
  title: string;
  category: string;
  description: string;
  demand: string;
  communityValue: string;
  technicalFeasibility: string;
  playerCount: number;
  aceyNote: string;
  implementationComplexity: number;
  priorityScore: number;
}

interface TopSuggestionsResponse {
  suggestions: TopSuggestion[];
  totalSuggestions: number;
  analysisDate: string;
  generatedBy: string;
  aceySummary: {
    topPriority: string;
    communityFocus: string;
    technicalFeasibility: string;
    playerEngagement: string;
    developmentRecommendation: string;
  };
}

export default function AceyFeedbackAnalyzer() {
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<FeedbackAnalysis | null>(null);
  const [topSuggestions, setTopSuggestions] = useState<TopSuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('feature_request');

  useEffect(() => {
    loadTopSuggestions();
  }, []);

  const loadTopSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/admin/ai/player/suggestions/top');
      const data = await response.json();
      if (data.success) {
        setTopSuggestions(data.data);
      }
    } catch (error) {
      console.error('Failed to load top suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFeedback = async () => {
    if (!feedbackText.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch('/admin/ai/player/feedback/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedbackText,
          category: feedbackCategory,
          urgency: 'medium',
          playerCount: 127,
          communityImpact: 'medium'
        })
      });
      const data = await response.json();
      if (data.success) {
        setFeedbackAnalysis(data.data);
      }
    } catch (error) {
      console.error('Failed to analyze feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return '#00ff88';
    if (score >= 7.0) return '#ffaa00';
    return '#ff4444';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#00ff88';
      default: return '#888';
    }
  };

  if (loading && !topSuggestions) {
    return (
      <div className="acey-feedback-analyzer">
        <div className="loading">
          <div className="loading-spinner">🤖</div>
          <p>Acey is analyzing player feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="acey-feedback-analyzer">
      <header className="acey-header">
        <h1>
          <span className="icon">🤖</span>
          Acey Player Feedback Analyzer
        </h1>
        <p className="subtitle">
          AI-powered analysis of player suggestions and community feedback
        </p>
      </header>

      {topSuggestions && (
        <div className="top-suggestions">
          <h2>🏆 Top Player Suggestions</h2>
          <div className="acey-summary">
            <div className="summary-card">
              <h3>🎯 Acey's Analysis</h3>
              <p><strong>Top Priority:</strong> {topSuggestions.aceySummary.topPriority}</p>
              <p><strong>Community Focus:</strong> {topSuggestions.aceySummary.communityFocus}</p>
              <p><strong>Technical Feasibility:</strong> {topSuggestions.aceySummary.technicalFeasibility}</p>
              <p><strong>Player Engagement:</strong> {topSuggestions.aceySummary.playerEngagement}</p>
              <p><strong>Development Recommendation:</strong> {topSuggestions.aceySummary.developmentRecommendation}</p>
            </div>
          </div>
          
          <div className="suggestions-grid">
            {topSuggestions.suggestions.slice(0, 5).map((suggestion, index) => (
              <div key={suggestion.id} className="suggestion-card">
                <div className="suggestion-header">
                  <h3>{suggestion.title}</h3>
                  <div className="suggestion-meta">
                    <span className="rank">#{index + 1}</span>
                    <span 
                      className="score" 
                      style={{ backgroundColor: getScoreColor(suggestion.priorityScore) }}
                    >
                      {suggestion.priorityScore.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="suggestion-content">
                  <p className="description">{suggestion.description}</p>
                  <div className="suggestion-details">
                    <div className="detail-item">
                      <span className="label">Demand:</span>
                      <span className="value">{suggestion.demand}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Players:</span>
                      <span className="value">{suggestion.playerCount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Complexity:</span>
                      <span className="value">{suggestion.implementationComplexity}/10</span>
                    </div>
                  </div>
                  <div className="acey-note">
                    <span className="note-icon">💡</span>
                    <p>{suggestion.aceyNote}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="feedback-analyzer">
        <h2>🔍 Analyze Player Feedback</h2>
        <div className="analyzer-form">
          <div className="form-group">
            <label>Feedback Category:</label>
            <select 
              value={feedbackCategory}
              onChange={(e) => setFeedbackCategory(e.target.value)}
              className="category-select"
            >
              <option value="feature_request">Feature Request</option>
              <option value="bug_report">Bug Report</option>
              <option value="improvement_suggestion">Improvement Suggestion</option>
              <option value="cosmetic_request">Cosmetic Request</option>
              <option value="community_feedback">Community Feedback</option>
            </select>
          </div>
          <div className="form-group">
            <label>Player Feedback:</label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter player feedback to analyze..."
              className="feedback-textarea"
              rows={4}
            />
          </div>
          <button 
            className="analyze-btn"
            onClick={analyzeFeedback}
            disabled={loading || !feedbackText.trim()}
          >
            {loading ? 'Analyzing...' : '🤖 Analyze with Acey'}
          </button>
        </div>
      </div>

      {feedbackAnalysis && (
        <div className="analysis-results">
          <h2>📊 Acey's Analysis Results</h2>
          <div className="analysis-card">
            <div className="analysis-header">
              <h3>{feedbackAnalysis.category.replace('_', ' ').toUpperCase()} Analysis</h3>
              <span className="generated-by">
                Generated by {feedbackAnalysis.generatedBy}
              </span>
            </div>
            
            <div className="analysis-content">
              <div className="analysis-section">
                <h4>⚠️ Priority Assessment</h4>
                <div className="priority-indicator" style={{ backgroundColor: getPriorityColor(feedbackAnalysis.aceyAnalysis.priority) }}>
                  {feedbackAnalysis.aceyAnalysis.priority}
                </div>
                <p>{feedbackAnalysis.aceyAnalysis.priority}</p>
              </div>
              
              <div className="analysis-section">
                <h4>💡 Recommendation</h4>
                <p>{feedbackAnalysis.aceyAnalysis.recommendation}</p>
              </div>
              
              <div className="analysis-section">
                <h4>🎮 Player Impact</h4>
                <p>{feedbackAnalysis.aceyAnalysis.playerImpact}</p>
              </div>
              
              <div className="analysis-section">
                <h4>🌍 Community Value</h4>
                <p>{feedbackAnalysis.aceyAnalysis.communityValue}</p>
              </div>
              
              <div className="analysis-section">
                <h4>🧠 Acey's Insight</h4>
                <p>{feedbackAnalysis.aceyAnalysis.aceyInsight}</p>
              </div>
              
              <div className="analysis-section">
                <h4>📈 Scoring Breakdown</h4>
                <div className="score-grid">
                  <div className="score-item">
                    <span className="score-label">Technical Feasibility</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${feedbackAnalysis.aceyScoring.technicalFeasibility * 10}%` }}
                      />
                    </div>
                    <span className="score-value">{feedbackAnalysis.aceyScoring.technicalFeasibility.toFixed(1)}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Player Demand</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${feedbackAnalysis.aceyScoring.playerDemand * 10}%` }}
                      />
                    </div>
                    <span className="score-value">{feedbackAnalysis.aceyScoring.playerDemand.toFixed(1)}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Community Benefit</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${feedbackAnalysis.aceyScoring.communityBenefit * 10}%` }}
                      />
                    </div>
                    <span className="score-value">{feedbackAnalysis.aceyScoring.communityBenefit.toFixed(1)}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Implementation Complexity</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${feedbackAnalysis.aceyScoring.implementationComplexity * 10}%` }}
                      />
                    </div>
                    <span className="score-value">{feedbackAnalysis.aceyScoring.implementationComplexity.toFixed(1)}</span>
                  </div>
                </div>
                <div className="overall-score">
                  <span className="score-label">Overall Score:</span>
                  <span 
                    className="score-value overall"
                    style={{ color: getScoreColor(feedbackAnalysis.aceyScoring.overallScore) }}
                  >
                    {feedbackAnalysis.aceyScoring.overallScore.toFixed(1)}/10
                  </span>
                </div>
              </div>
            </div>
            
            <div className="analysis-footer">
              <div className="context-info">
                <h4>📊 Analysis Context</h4>
                <div className="context-grid">
                  <div className="context-item">
                    <span className="label">Analysis Time:</span>
                    <span className="value">{feedbackAnalysis.context.currentTime}</span>
                  </div>
                  <div className="context-item">
                    <span className="label">Player Count:</span>
                    <span className="value">{feedbackAnalysis.context.playerCount}</span>
                  </div>
                  <div className="context-item">
                    <span className="label">System Status:</span>
                    <span className="value">{feedbackAnalysis.context.systemStatus}</span>
                  </div>
                  <div className="context-item">
                    <span className="label">Community Impact:</span>
                    <span className="value">{feedbackAnalysis.context.communityImpact}</span>
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
