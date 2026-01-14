import React from 'react';
import { GeneratedOutput } from '../utils/outputManager';

interface OutputBubbleProps {
  output: GeneratedOutput;
  onDownload: () => void;
  onApprove: () => void;
  onDiscard: () => void;
  onCopy?: () => void;
}

export const OutputBubble: React.FC<OutputBubbleProps> = ({
  output,
  onDownload,
  onApprove,
  onDiscard,
  onCopy
}) => {
  const handleDownload = () => {
    if (window.confirm(`Save ${output.skill} output to your device?`)) {
      onDownload();
    }
  };

  const handleApprove = () => {
    if (window.confirm('Add this output to Acey\'s learning dataset?')) {
      onApprove();
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Remove this output from memory? This cannot be undone.')) {
      onDiscard();
    }
  };

  const renderContentPreview = () => {
    if (typeof output.content === 'string') {
      // Code/text content - show first 200 characters
      const preview = output.content.length > 200 
        ? output.content.substring(0, 200) + '...' 
        : output.content;
      
      return (
        <pre className="code-preview">
          {preview}
        </pre>
      );
    } else {
      // Binary content (graphics/audio)
      return (
        <div className="binary-preview">
          <div className="binary-text">
            [{output.skill.toUpperCase()} Content]
          </div>
          <div className="size-text">
            Size: {(output.content.byteLength / 1024).toFixed(1)} KB
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`output-bubble ${output.skill.toLowerCase()}`}>
      <div className="bubble-header">
        <span className="skill-type">{output.skill.toUpperCase()}</span>
        <span className="timestamp">
          {output.timestamp.toLocaleTimeString()}
        </span>
      </div>
      
      {renderContentPreview()}
      
      <div className="bubble-buttons">
        <button 
          className="button download-button" 
          onClick={handleDownload}
          title="Download to device"
        >
          📥 Download
        </button>
        
        {onCopy && typeof output.content === 'string' && (
          <button 
            className="button copy-button" 
            onClick={onCopy}
            title="Copy to clipboard"
          >
          📋 Copy
          </button>
        )}
        
        <button 
          className="button approve-button" 
          onClick={handleApprove}
          title="Approve for Acey's learning"
        >
          🧠 Learn
        </button>
        
        <button 
          className="button discard-button" 
          onClick={handleDiscard}
          title="Discard from memory"
        >
          🗑️ Discard
        </button>
      </div>
    </div>
  );
};
