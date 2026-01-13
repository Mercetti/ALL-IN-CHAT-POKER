/**
 * Poker Coach Component
 * AI-powered poker coaching and analysis system
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PokerCoach.css';

const PokerCoach = ({
  gameState,
  playerHand,
  communityCards,
  potSize,
  betAmount,
  position,
  opponents,
  onAdvice,
  onAnalysis,
  enabled = true,
  variant = 'default',
  className = '',
  style = {},
  ...props
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAdvice, setCurrentAdvice] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [coachSettings, setCoachSettings] = useState({
    skillLevel: 'intermediate',
    adviceType: 'all',
    showProbability: true,
    showOdds: true,
    showPosition: true,
    showTells: true,
    autoAnalyze: false,
    soundEnabled: false
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('advice');
  const analysisRef = useRef(null);

  // AI Analysis Engine
  const analyzeGameState = useCallback(async () => {
    if (!enabled || !gameState || !playerHand) return null;

    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis (in real implementation, this would call an AI service)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const analysis = {
        timestamp: Date.now(),
        handStrength: calculateHandStrength(playerHand, communityCards),
        potOdds: calculatePotOdds(potSize, betAmount),
        positionAdvantage: calculatePositionAdvantage(position, opponents.length),
        opponentAnalysis: analyzeOpponents(opponents),
        recommendedAction: getRecommendedAction(playerHand, communityCards, potSize, betAmount, position),
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        reasoning: generateReasoning(playerHand, communityCards, potSize, betAmount, position)
      };

      setCurrentAdvice(analysis);
      setAnalysisHistory(prev => [analysis, ...prev.slice(0, 9)]); // Keep last 10 analyses
      
      if (onAdvice) onAdvice(analysis);
      if (onAnalysis) onAnalysis(analysis);
      
      return analysis;
    } catch (error) {
      console.error('AI Analysis failed:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [enabled, gameState, playerHand, communityCards, potSize, betAmount, position, opponents, onAdvice, onAnalysis]);

  // Auto-analyze when game state changes
  useEffect(() => {
    if (coachSettings.autoAnalyze && enabled && gameState) {
      analyzeGameState();
    }
  }, [gameState, coachSettings.autoAnalyze, enabled, analyzeGameState]);

  // Calculate hand strength (simplified)
  const calculateHandStrength = (hand, community) => {
    if (!hand || hand.length !== 2) return 0;
    
    // Simplified hand strength calculation
    const allCards = [...hand, ...(community || [])];
    let strength = 0;
    
    // Check for pairs, three of a kind, etc.
    const ranks = allCards.map(card => card.rank);
    const rankCounts = {};
    ranks.forEach(rank => {
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });
    
    Object.values(rankCounts).forEach(count => {
      if (count === 2) strength += 30;
      if (count === 3) strength += 60;
      if (count === 4) strength += 90;
    });
    
    // Add base strength for high cards
    const highCards = ranks.filter(rank => ['A', 'K', 'Q', 'J'].includes(rank));
    strength += highCards.length * 10;
    
    return Math.min(strength, 100);
  };

  // Calculate pot odds
  const calculatePotOdds = (pot, bet) => {
    if (!bet || bet === 0) return 0;
    return Math.round((bet / (pot + bet)) * 100);
  };

  // Calculate position advantage
  const calculatePositionAdvantage = (pos, opponentCount) => {
    const positionScore = (opponentCount - pos) / opponentCount * 50;
    return Math.round(positionScore);
  };

  // Analyze opponents (simplified)
  const analyzeOpponents = (opps) => {
    return opps.map(opp => ({
      id: opp.id,
      name: opp.name,
      tendency: opp.tendency || 'unknown',
      aggression: opp.aggression || 50,
      vpip: opp.vpip || 20, // Voluntarily Put In Pot
      pfr: opp.pfr || 15, // Pre-Flop Raise
      notes: opp.notes || ''
    }));
  };

  // Get recommended action
  const getRecommendedAction = (hand, community, pot, bet, pos) => {
    const strength = calculateHandStrength(hand, community);
    const potOdds = calculatePotOdds(pot, bet);
    const positionAdv = calculatePositionAdvantage(pos, 6); // Assume 6 players max
    
    // Simple decision logic
    if (strength >= 70) return { action: 'raise', confidence: 0.8 };
    if (strength >= 50 && potOdds < 30) return { action: 'call', confidence: 0.7 };
    if (strength >= 30 && positionAdv > 30) return { action: 'call', confidence: 0.6 };
    return { action: 'fold', confidence: 0.8 };
  };

  // Generate reasoning
  const generateReasoning = (hand, community, pot, bet, pos) => {
    const strength = calculateHandStrength(hand, community);
    const potOdds = calculatePotOdds(pot, bet);
    
    let reasoning = `Hand strength: ${strength}/100. `;
    reasoning += `Pot odds: ${potOdds}%. `;
    reasoning += `Position: ${pos === 0 ? 'Early' : pos === 1 ? 'Middle' : 'Late'}. `;
    
    if (strength >= 70) {
      reasoning += 'Strong hand - consider raising for value.';
    } else if (strength >= 50) {
      reasoning += 'Moderate hand - call if pot odds are favorable.';
    } else {
      reasoning += 'Weak hand - fold unless pot odds are very favorable.';
    }
    
    return reasoning;
  };

  const handleManualAnalysis = () => {
    analyzeGameState();
  };

  const getCoachClasses = () => {
    const classes = [
      'poker-coach',
      `poker-coach--${variant}`,
      !enabled && 'poker-coach--disabled',
      isExpanded && 'poker-coach--expanded',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderAdviceTab = () => {
    if (!currentAdvice) {
      return (
        <div className="poker-coach__empty">
          <div className="poker-coach__empty-icon">🤔</div>
          <div className="poker-coach__empty-text">
            No analysis available. Click "Analyze" to get AI advice.
          </div>
        </div>
      );
    }

    return (
      <div className="poker-coach__advice">
        <div className="poker-coach__recommendation">
          <div className="poker-coach__action">
            Recommended: <span className={`poker-coach__action--${currentAdvice.recommendedAction.action}`}>
              {currentAdvice.recommendedAction.action.toUpperCase()}
            </span>
          </div>
          <div className="poker-coach__confidence">
            Confidence: {Math.round(currentAdvice.confidence * 100)}%
          </div>
        </div>

        <div className="poker-coach__metrics">
          {coachSettings.showProbability && (
            <div className="poker-coach__metric">
              <span className="poker-coach__metric-label">Hand Strength:</span>
              <span className="poker-coach__metric-value">{currentAdvice.handStrength}/100</span>
            </div>
          )}
          
          {coachSettings.showOdds && (
            <div className="poker-coach__metric">
              <span className="poker-coach__metric-label">Pot Odds:</span>
              <span className="poker-coach__metric-value">{currentAdvice.potOdds}%</span>
            </div>
          )}
          
          {coachSettings.showPosition && (
            <div className="poker-coach__metric">
              <span className="poker-coach__metric-label">Position:</span>
              <span className="poker-coach__metric-value">{position === 0 ? 'Early' : position === 1 ? 'Middle' : 'Late'}</span>
            </div>
          )}
        </div>

        <div className="poker-coach__reasoning">
          <div className="poker-coach__reasoning-title">AI Reasoning:</div>
          <div className="poker-coach__reasoning-text">
            {currentAdvice.reasoning}
          </div>
        </div>

        {coachSettings.showTells && currentAdvice.opponentAnalysis && (
          <div className="poker-coach__opponents">
            <div className="poker-coach__opponents-title">Opponent Analysis:</div>
            <div className="poker-coach__opponents-list">
              {currentAdvice.opponentAnalysis.map(opp => (
                <div key={opp.id} className="poker-coach__opponent">
                  <span className="poker-coach__opponent-name">{opp.name}</span>
                  <span className="poker-coach__opponent-tendency">{opp.tendency}</span>
                  <span className="poker-coach__opponent-aggression">Aggression: {opp.aggression}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (analysisHistory.length === 0) {
      return (
        <div className="poker-coach__empty">
          <div className="poker-coach__empty-icon">📊</div>
          <div className="poker-coach__empty-text">
            No analysis history yet. Start analyzing hands to see your progress.
          </div>
        </div>
      );
    }

    return (
      <div className="poker-coach__history">
        <div className="poker-coach__history-list">
          {analysisHistory.map((analysis, index) => (
            <div key={analysis.timestamp} className="poker-coach__history-item">
              <div className="poker-coach__history-time">
                {new Date(analysis.timestamp).toLocaleTimeString()}
              </div>
              <div className="poker-coach__history-action">
                {analysis.recommendedAction.action}
              </div>
              <div className="poker-coach__history-confidence">
                {Math.round(analysis.confidence * 100)}%
              </div>
              <div className="poker-coach__history-strength">
                {analysis.handStrength}/100
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => {
    return (
      <div className="poker-coach__settings">
        <div className="poker-coach__setting">
          <label className="poker-coach__setting-label">Skill Level:</label>
          <select
            className="poker-coach__setting-select"
            value={coachSettings.skillLevel}
            onChange={(e) => setCoachSettings(prev => ({ ...prev, skillLevel: e.target.value }))}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="professional">Professional</option>
          </select>
        </div>

        <div className="poker-coach__setting">
          <label className="poker-coach__setting-label">Advice Type:</label>
          <select
            className="poker-coach__setting-select"
            value={coachSettings.adviceType}
            onChange={(e) => setCoachSettings(prev => ({ ...prev, adviceType: e.target.value }))}
          >
            <option value="all">All Advice</option>
            <option value="conservative">Conservative</option>
            <option value="aggressive">Aggressive</option>
            <option value="mathematical">Mathematical</option>
          </select>
        </div>

        <div className="poker-coach__settings-group">
          <div className="poker-coach__setting-checkbox">
            <input
              type="checkbox"
              id="show-probability"
              checked={coachSettings.showProbability}
              onChange={(e) => setCoachSettings(prev => ({ ...prev, showProbability: e.target.checked }))}
            />
            <label htmlFor="show-probability" className="poker-coach__setting-checkbox-label">
              Show Probability
            </label>
          </div>

          <div className="poker-coach__setting-checkbox">
            <input
              type="checkbox"
              id="show-odds"
              checked={coachSettings.showOdds}
              onChange={(e) => setCoachSettings(prev => ({ ...prev, showOdds: e.target.checked }))}
            />
            <label htmlFor="show-odds" className="poker-coach__setting-checkbox-label">
              Show Odds
            </label>
          </div>

          <div className="poker-coach__setting-checkbox">
            <input
              type="checkbox"
              id="show-position"
              checked={coachSettings.showPosition}
              onChange={(e) => setCoachSettings(prev => ({ ...prev, showPosition: e.target.checked }))}
            />
            <label htmlFor="show-position" className="poker-coach__setting-checkbox-label">
              Show Position
            </label>
          </div>

          <div className="poker-coach__setting-checkbox">
            <input
              type="checkbox"
              id="show-tells"
              checked={coachSettings.showTells}
              onChange={(e) => setCoachSettings(prev => ({ ...prev, showTells: e.target.checked }))}
            />
            <label htmlFor="show-tells" className="poker-coach__setting-checkbox-label">
              Show Opponent Tells
            </label>
          </div>

          <div className="poker-coach__setting-checkbox">
            <input
              type="checkbox"
              id="auto-analyze"
              checked={coachSettings.autoAnalyze}
              onChange={(e) => setCoachSettings(prev => ({ ...prev, autoAnalyze: e.target.checked }))}
            />
            <label htmlFor="auto-analyze" className="poker-coach__setting-checkbox-label">
              Auto-Analyze
            </label>
          </div>

          <div className="poker-coach__setting-checkbox">
            <input
              type="checkbox"
              id="sound-enabled"
              checked={coachSettings.soundEnabled}
              onChange={(e) => setCoachSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
            />
            <label htmlFor="sound-enabled" className="poker-coach__setting-checkbox-label">
              Sound Effects
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={analysisRef}
      className={getCoachClasses()}
      style={style}
      {...props}
    >
      {/* Header */}
      <div className="poker-coach__header">
        <div className="poker-coach__title">
          <span className="poker-coach__title-icon">🤖</span>
          <span className="poker-coach__title-text">AI Poker Coach</span>
          {isAnalyzing && (
            <span className="poker-coach__analyzing">Analyzing...</span>
          )}
        </div>
        
        <div className="poker-coach__controls">
          <button
            className="poker-coach__analyze-btn"
            onClick={handleManualAnalysis}
            disabled={isAnalyzing || !enabled}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
          
          <button
            className={`poker-coach__toggle-btn ${isExpanded ? 'poker-coach__toggle-btn--expanded' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="poker-coach__content">
          {/* Tabs */}
          <div className="poker-coach__tabs">
            <button
              className={`poker-coach__tab ${activeTab === 'advice' ? 'poker-coach__tab--active' : ''}`}
              onClick={() => setActiveTab('advice')}
            >
              Advice
            </button>
            <button
              className={`poker-coach__tab ${activeTab === 'history' ? 'poker-coach__tab--active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
            <button
              className={`poker-coach__tab ${activeTab === 'settings' ? 'poker-coach__tab--active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="poker-coach__tab-content">
            {activeTab === 'advice' && renderAdviceTab()}
            {activeTab === 'history' && renderHistoryTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </div>
        </div>
      )}
    </div>
  );
};

// Poker Coach Settings Component
export const PokerCoachSettings = ({
  settings,
  onSettingsChange,
  className = '',
  style = {},
  ...props
}) => {
  const [localSettings, setLocalSettings] = useState(settings || {
    skillLevel: 'intermediate',
    adviceType: 'all',
    showProbability: true,
    showOdds: true,
    showPosition: true,
    showTells: true,
    autoAnalyze: false,
    soundEnabled: false,
    notificationEnabled: true,
    voiceEnabled: false,
    language: 'en'
  });

  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    if (onSettingsChange) onSettingsChange(newSettings);
  };

  return (
    <div className={`poker-coach-settings ${className}`} style={style} {...props}>
      <div className="poker-coach-settings__section">
        <h3 className="poker-coach-settings__section-title">General Settings</h3>
        
        <div className="poker-coach-settings__setting">
          <label className="poker-coach-settings__label">Skill Level:</label>
          <select
            className="poker-coach-settings__select"
            value={localSettings.skillLevel}
            onChange={(e) => handleSettingChange('skillLevel', e.target.value)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="professional">Professional</option>
          </select>
        </div>

        <div className="poker-coach-settings__setting">
          <label className="poker-coach-settings__label">Advice Type:</label>
          <select
            className="poker-coach-settings__select"
            value={localSettings.adviceType}
            onChange={(e) => handleSettingChange('adviceType', e.target.value)}
          >
            <option value="all">All Advice</option>
            <option value="conservative">Conservative</option>
            <option value="aggressive">Aggressive</option>
            <option value="mathematical">Mathematical</option>
          </select>
        </div>

        <div className="poker-coach-settings__setting">
          <label className="poker-coach-settings__label">Language:</label>
          <select
            className="poker-coach-settings__select"
            value={localSettings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
            <option value="ru">Русский</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </div>

      <div className="poker-coach-settings__section">
        <h3 className="poker-coach-settings__section-title">Display Options</h3>
        
        <div className="poker-coach-settings__checkboxes">
          <label className="poker-coach-settings__checkbox">
            <input
              type="checkbox"
              checked={localSettings.showProbability}
              onChange={(e) => handleSettingChange('showProbability', e.target.checked)}
            />
            <span>Show Probability</span>
          </label>

          <label className="poker-coach-settings__checkbox">
            <input
              type="checkbox"
              checked={localSettings.showOdds}
              onChange={(e) => handleSettingChange('showOdds', e.target.checked)}
            />
            <span>Show Odds</span>
          </label>

          <label className="poker-coach-settings__checkbox">
            <input
              type="checkbox"
              checked={localSettings.showPosition}
              onChange={(e) => handleSettingChange('showPosition', e.target.checked)}
            />
            <span>Show Position</span>
          </label>

          <label className="poker-coach-settings__checkbox">
            <input
              type="checkbox"
              checked={localSettings.showTells}
              onChange={(e) => handleSettingChange('showTells', e.target.checked)}
            />
            <span>Show Opponent Tells</span>
          </label>
        </div>
      </div>

      <div className="poker-coach-settings__section">
        <h3 className="poker-coach-settings__section-title">Behavior</h3>
        
        <div className="poker-coach-settings__checkboxes">
          <label className="poker-coach-settings__checkbox">
            <input
              type="checkbox"
              checked={localSettings.autoAnalyze}
              onChange={(e) => handleSettingChange('autoAnalyze', e.target.checked)}
            />
            <span>Auto-Analyze</span>
          </label>

          <label className="poker-coach-settings__checkbox">
            <input
              type="checkbox"
              checked={localSettings.notificationEnabled}
              onChange={(e) => handleSettingChange('notificationEnabled', e.target.checked)}
            />
            <span>Notifications</span>
          </label>

          <label className="poker-coach-settings__checkbox">
            <input
              type="checkbox"
              checked={localSettings.soundEnabled}
              onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
            />
            <span>Sound Effects</span>
          </label>

          <label className="poker-coach-settings__checkbox">
            <input
              type="checkbox"
              checked={localSettings.voiceEnabled}
              onChange={(e) => handleSettingChange('voiceEnabled', e.target.checked)}
            />
            <span>Voice Assistant</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// Poker Coach Statistics Component
export const PokerCoachStats = ({
  stats,
  className = '',
  style = {},
  ...props
}) => {
  const defaultStats = {
    totalAnalyses: 0,
    correctPredictions: 0,
    averageConfidence: 0,
    mostRecommendedAction: 'fold',
    improvementRate: 0,
    sessionDuration: 0,
    handsAnalyzed: 0,
    winRate: 0
  };

  const coachStats = { ...defaultStats, ...stats };

  return (
    <div className={`poker-coach-stats ${className}`} style={style} {...props}>
      <div className="poker-coach-stats__header">
        <h3 className="poker-coach-stats__title">Coach Statistics</h3>
      </div>

      <div className="poker-coach-stats__grid">
        <div className="poker-coach-stats__stat">
          <div className="poker-coach-stats__stat-value">{coachStats.totalAnalyses}</div>
          <div className="poker-coach-stats__stat-label">Total Analyses</div>
        </div>

        <div className="poker-coach-stats__stat">
          <div className="poker-coach-stats__stat-value">{Math.round(coachStats.correctPredictions)}%</div>
          <div className="poker-coach-stats__stat-label">Accuracy</div>
        </div>

        <div className="poker-coach-stats__stat">
          <div className="poker-coach-stats__stat-value">{Math.round(coachStats.averageConfidence)}%</div>
          <div className="poker-coach-stats__stat-label">Avg Confidence</div>
        </div>

        <div className="poker-coach-stats__stat">
          <div className="poker-coach-stats__stat-value">{coachStats.mostRecommendedAction.toUpperCase()}</div>
          <div className="poker-coach-stats__stat-label">Top Action</div>
        </div>

        <div className="poker-coach-stats__stat">
          <div className="poker-coach-stats__stat-value">+{Math.round(coachStats.improvementRate)}%</div>
          <div className="poker-coach-stats__stat-label">Improvement</div>
        </div>

        <div className="poker-coach-stats__stat">
          <div className="poker-coach-stats__stat-value">{coachStats.handsAnalyzed}</div>
          <div className="poker-coach-stats__stat-label">Hands Analyzed</div>
        </div>

        <div className="poker-coach-stats__stat">
          <div className="poker-coach-stats__stat-value">{Math.round(coachStats.winRate)}%</div>
          <div className="poker-coach-stats__stat-label">Win Rate</div>
        </div>

        <div className="poker-coach-stats__stat">
          <div className="poker-coach-stats__stat-value">{Math.round(coachStats.sessionDuration / 60)}m</div>
          <div className="poker-coach-stats__stat-label">Session Time</div>
        </div>
      </div>
    </div>
  );
};

export default PokerCoach;
