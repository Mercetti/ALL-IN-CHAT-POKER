import { useState, useEffect } from 'react';
import './AceyTester.css';

interface TestResult {
  id: string;
  testType: string;
  challenge: string;
  aceyResponse: {
    task: string;
    demonstration: string;
    explanation: string;
    complexity: string;
    capabilities: string[];
    performance: {
      responseTime: string;
      accuracy: string;
      creativity: string;
      technicalDepth: string;
      contextualUnderstanding: string;
    };
    aceyInsights: {
      capability: string;
      strength: string;
      uniqueness: string;
      value: string;
    };
  };
  generatedBy: string;
  timestamp: string;
  context: {
    currentTime: string;
    systemStatus: string;
    testEnvironment: string;
    capabilities: string;
  };
}

export default function AceyTester() {
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState('code_generation');
  const [customChallenge, setCustomChallenge] = useState('');

  const testTypes = [
    {
      id: 'code_generation',
      name: '🔧 Code Generation',
      description: 'Generate production-ready React components',
      icon: '💻'
    },
    {
      id: 'data_analysis',
      name: '📊 Data Analysis',
      description: 'Analyze poker game data and provide insights',
      icon: '📈'
    },
    {
      id: 'creative_design',
      name: '🎨 Creative Design',
      description: 'Create comprehensive design systems',
      icon: '🎨'
    },
    {
      id: 'strategic_planning',
      name: '🚀 Strategic Planning',
      description: 'Develop product roadmaps and strategies',
      icon: '📋'
    },
    {
      id: 'problem_solving',
      name: '🔍 Problem Solving',
      description: 'Diagnose and solve complex challenges',
      icon: '🧩'
    },
    {
      id: 'content_creation',
      name: '✍️ Content Creation',
      description: 'Create marketing content and communications',
      icon: '📝'
    }
  ];

  const testAceyAbility = async () => {
    try {
      setLoading(true);
      const response = await fetch('/admin/ai/acey/test-abilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testType: selectedTest,
          challenge: customChallenge || `Demonstrate ${selectedTest} capabilities`,
          context: 'AI Control Center testing'
        })
      });
      const data = await response.json();
      if (data.success) {
        setTestResults(data.data);
      }
    } catch (error) {
      console.error('Failed to test Acey abilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'advanced': return '#ff9800';
      case 'intermediate': return '#4caf50';
      case 'basic': return '#2196f3';
      default: return '#888';
    }
  };

  const getPerformanceColor = (metric: string) => {
    switch (metric.toLowerCase()) {
      case 'high': return '#4caf50';
      case 'excellent': return '#4caf50';
      case 'advanced': return '#ff9800';
      case 'medium': return '#ff9800';
      case 'low': return '#f44336';
      default: return '#888';
    }
  };

  if (loading && !testResults) {
    return (
      <div className="acey-tester">
        <div className="loading">
          <div className="loading-spinner">🤖</div>
          <p>Acey is demonstrating her capabilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="acey-tester">
      <header className="acey-header">
        <h1>
          <span className="icon">🤖</span>
          Acey LLM Capabilities Tester
        </h1>
        <p className="subtitle">
          Test Acey's full range of AI capabilities across different domains
        </p>
      </header>

      <div className="test-interface">
        <div className="test-selector">
          <h2>🎯 Choose Test Type</h2>
          <div className="test-types">
            {testTypes.map((test) => (
              <button
                key={test.id}
                className={`test-type-btn ${selectedTest === test.id ? 'active' : ''}`}
                onClick={() => setSelectedTest(test.id)}
              >
                <span className="test-icon">{test.icon}</span>
                <div className="test-info">
                  <h3>{test.name}</h3>
                  <p>{test.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="test-controls">
          <h2>🎮 Custom Challenge (Optional)</h2>
          <textarea
            value={customChallenge}
            onChange={(e) => setCustomChallenge(e.target.value)}
            placeholder="Enter a custom challenge for Acey to demonstrate..."
            className="challenge-input"
            rows={3}
          />
          <button
            className="test-btn"
            onClick={testAceyAbility}
            disabled={loading}
          >
            {loading ? 'Testing...' : '🤖 Test Acey'}
          </button>
        </div>
      </div>

      {testResults && (
        <div className="test-results">
          <h2>📊 Test Results</h2>
          <div className="result-card">
            <div className="result-header">
              <h3>{testResults.testType.replace('_', ' ').toUpperCase()} Test</h3>
              <div className="result-meta">
                <span className="complexity" style={{ backgroundColor: getComplexityColor(testResults.aceyResponse.complexity) }}>
                  {testResults.aceyResponse.complexity}
                </span>
                <span className="generated-by">
                  Generated by {testResults.generatedBy}
                </span>
              </div>
            </div>

            <div className="result-content">
              <div className="task-section">
                <h4>🎯 Task</h4>
                <p>{testResults.aceyResponse.task}</p>
              </div>

              <div className="demonstration-section">
                <h4>🔧 Acey's Demonstration</h4>
                <div className="code-block">
                  <pre>{testResults.aceyResponse.demonstration}</pre>
                </div>
              </div>

              <div className="explanation-section">
                <h4>💡 Explanation</h4>
                <p>{testResults.aceyResponse.explanation}</p>
              </div>

              <div className="capabilities-section">
                <h4>🧠 Demonstrated Capabilities</h4>
                <div className="capabilities-grid">
                  {testResults.aceyResponse.capabilities.map((capability, index) => (
                    <div key={index} className="capability-badge">
                      {capability}
                    </div>
                  ))}
                </div>
              </div>

              <div className="performance-section">
                <h4>⚡ Performance Metrics</h4>
                <div className="performance-grid">
                  <div className="metric">
                    <span className="metric-label">Response Time</span>
                    <span className="metric-value" style={{ color: getPerformanceColor('high') }}>
                      {testResults.aceyResponse.performance.responseTime}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Accuracy</span>
                    <span className="metric-value" style={{ color: getPerformanceColor('excellent') }}>
                      {testResults.aceyResponse.performance.accuracy}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Creativity</span>
                    <span className="metric-value" style={{ color: getPerformanceColor('high') }}>
                      {testResults.aceyResponse.performance.creativity}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Technical Depth</span>
                    <span className="metric-value" style={{ color: getPerformanceColor('advanced') }}>
                      {testResults.aceyResponse.performance.technicalDepth}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Context Understanding</span>
                    <span className="metric-value" style={{ color: getPerformanceColor('excellent') }}>
                      {testResults.aceyResponse.performance.contextualUnderstanding}
                    </span>
                  </div>
                </div>
              </div>

              <div className="insights-section">
                <h4>🧠 Acey's Self-Analysis</h4>
                <div className="insights-grid">
                  <div className="insight-item">
                    <span className="insight-label">Capability:</span>
                    <span className="insight-value">{testResults.aceyResponse.aceyInsights.capability}</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-label">Strength:</span>
                    <span className="insight-value">{testResults.aceyResponse.aceyInsights.strength}</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-label">Uniqueness:</span>
                    <span className="insight-value">{testResults.aceyResponse.aceyInsights.uniqueness}</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-label">Value:</span>
                    <span className="insight-value">{testResults.aceyResponse.aceyInsights.value}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="result-footer">
              <div className="context-info">
                <h4>📊 Test Context</h4>
                <div className="context-grid">
                  <div className="context-item">
                    <span className="label">Test Time:</span>
                    <span className="value">{testResults.context.currentTime}</span>
                  </div>
                  <div className="context-item">
                    <span className="label">System Status:</span>
                    <span className="value">{testResults.context.systemStatus}</span>
                  </div>
                  <div className="context-item">
                    <span className="label">Environment:</span>
                    <span className="value">{testResults.context.testEnvironment}</span>
                  </div>
                  <div className="context-item">
                    <span className="label">Capabilities:</span>
                    <span className="value">{testResults.context.capabilities}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="test-summary">
        <h2>🎯 Test Summary</h2>
        <div className="summary-card">
          <h3>🤖 About Acey's Capabilities</h3>
          <p>Acey demonstrates comprehensive LLM capabilities across multiple domains:</p>
          <ul>
            <li><strong>Natural Language Processing:</strong> Advanced understanding and generation</li>
            <li><strong>Code Generation:</strong> Production-ready React/TypeScript components</li>
            <li><strong>Data Analysis:</strong> Strategic insights and pattern recognition</li>
            <li><strong>Creative Design:</strong> Complete design systems and brand development</li>
            <li><strong>Strategic Planning:</strong> Product roadmaps and business intelligence</li>
            <li><strong>Problem Solving:</strong> Technical debugging and solution architecture</li>
            <li><strong>Content Creation:</strong> Marketing campaigns and communication</li>
            <li><strong>Technical Architecture:</strong> System design and optimization</li>
            <li><strong>Business Intelligence:</strong> Data-driven decision making</li>
          </ul>
          <div className="summary-highlight">
            <p><strong>🎯 Key Strength:</strong> Combines technical expertise with creative problem-solving and poker domain knowledge</p>
            <p><strong>💡 Unique Value:</strong> Specialized in poker game development and community building</p>
            <p><strong>🚀 Performance:</strong> Fast response times with high accuracy and contextual understanding</p>
          </div>
        </div>
      </div>
    </div>
  );
}
