import * as React from 'react';
import { GeneratedCode, ProgrammingLanguage } from '../types/codeHelper';
import { 
  addOutputToMemory, 
  discardOutput, 
  downloadOutput, 
  storeForLearning, 
  generateCode,
  getMemoryOutputs,
  getLearningAnalytics,
  trackUsage,
  getUserUsageCount
} from '../utils/memoryManager';

interface CodeBubbleProps {
  output: GeneratedCode;
  onDownload: () => void;
  onDiscard: () => void;
  onStoreLearning: (fixes: string[], logicSteps: string[]) => void;
}

export const CodeBubble: React.FC<CodeBubbleProps> = ({
  output,
  onDownload,
  onDiscard,
  onStoreLearning
}: {
  output: any;
  onDownload: any;
  onDiscard: any;
  onStoreLearning: any;
}) => {
  const handleStoreLearning = () => {
    const logicSteps = window.prompt('Add logic steps (comma-separated):', '');
    const fixes = window.prompt('Add fixes applied (comma-separated):', '');
    
    if (logicSteps !== null && fixes !== null) {
      const stepsArray = logicSteps ? logicSteps.split(',').map(s => s.trim()) : [];
      const fixesArray = fixes ? fixes.split(',').map(f => f.trim()) : [];
      onStoreLearning(fixesArray, stepsArray);
    }
  };

  const getLanguageColor = (lang: ProgrammingLanguage): string => {
    const colors = {
      TypeScript: '#3498DB',
      JavaScript: '#F39C12',
      Python: '#27AE60',
      Java: '#E74C3C',
      CSharp: '#9B59B6',
      Go: '#00ADD8',
      Rust: '#CE422B'
    };
    return colors[lang] || '#666';
  };

  return (
    <div 
      className={`code-output-bubble ${output.language.toLowerCase()}`}
      style={{
        borderLeftColor: getLanguageColor(output.language),
        backgroundColor: '#2C3E50'
      }}
    >
      <div className="bubble-header">
        <span className="language">{output.language}</span>
        <span className="timestamp">
          {new Date(output.timestamp).toLocaleTimeString()}
        </span>
      </div>
      
      <div className="code-container">
        <pre className="code">
          <code>{output.content}</code>
        </pre>
      </div>
      
      {output.metadata && (
        <div className="metadata">
          <div className="metadata-item">
            <span className="label">Complexity:</span>
            <span className="value">{output.metadata.complexity}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Category:</span>
            <span className="value">{output.metadata.category}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Lines:</span>
            <span className="value">{output.metadata.linesOfCode}</span>
          </div>
          {output.metadata.executionTime && (
            <div className="metadata-item">
              <span className="label">Exec Time:</span>
              <span className="value">{output.metadata.executionTime.toFixed(2)}ms</span>
            </div>
          )}
        </div>
      )}
      
      <div className="bubble-buttons">
        <button 
          className="button download-button"
          onClick={onDownload}
          title="Download code file"
        >
          📥 Download
        </button>
        
        <button 
          className="button copy-button"
          onClick={() => {
            navigator.clipboard.writeText(output.content);
            alert('Code copied to clipboard!');
          }}
          title="Copy to clipboard"
        >
          📋 Copy
        </button>
        
        <button 
          className="button learn-button"
          onClick={handleStoreLearning}
          title="Store for Acey learning"
        >
          🧠 Store Learning
        </button>
        
        <button 
          className="button discard-button"
          onClick={onDiscard}
          title="Discard from memory"
        >
          🗑️ Discard
        </button>
      </div>
    </div>
  );
};

export default CodeBubble;
