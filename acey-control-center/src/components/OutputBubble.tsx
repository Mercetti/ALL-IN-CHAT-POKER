import React from 'react';

interface GeneratedOutput {
  id: string;
  skill: string;
  content: any;
  metadata?: any;
  timestamp: Date;
  filename?: string;
}

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

  const handleCopy = async () => {
    if (onCopy && typeof output.content === 'string') {
      try {
        await navigator.clipboard.writeText(output.content);
        alert('Content copied to clipboard!');
      } catch (error) {
        alert('Failed to copy to clipboard');
      }
    }
  };

  const renderContentPreview = () => {
    if (typeof output.content === 'string') {
      // Code/text content - show first 200 characters
      const preview = output.content.length > 200 
        ? output.content.substring(0, 200) + '...' 
        : output.content;
      
      return React.createElement('div', { style: codePreviewStyle }, preview);
    } else {
      // Binary content (graphics/audio)
      return React.createElement('div', { style: binaryPreviewStyle }, 
        React.createElement('div', { style: binaryTextStyle }, `[${output.skill.toUpperCase()} Content]`),
        React.createElement('div', { style: sizeTextStyle }, `Size: ${output.content ? (output.content.byteLength / 1024).toFixed(1) : '0'} KB`)
      );
    }
  };

  const getSkillColor = (skill: string) => {
    switch (skill.toLowerCase()) {
      case 'code': return '#2C3E50';
      case 'graphics': return '#1A1A1A';
      case 'audio': return '#2C3E50';
      case 'analytics': return '#34495E';
      default: return '#666666';
    }
  };

  const buttonStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    minWidth: '60px',
    cursor: 'pointer',
    border: 'none',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
  };

  const codePreviewStyle: any = {
    fontFamily: 'monospace', 
    fontSize: 12,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    maxHeight: 100,
  };
  
  const binaryPreviewStyle: any = {
    display: 'flex',
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  };
  
  const binaryTextStyle: any = {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  };
  
  const sizeTextStyle: any = {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  };

  return React.createElement('div', {
    style: {
      padding: '16px',
      margin: '8px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      backgroundColor: '#fff',
      borderLeft: `4px solid ${getSkillColor(output.skill)}`,
      maxWidth: '400px',
    }
  }, 
    React.createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }
    }, 
    React.createElement('div', { style: { fontSize: '14px', fontWeight: 'bold', color: '#fff' } }, output.skill.toUpperCase()),
      React.createElement('div', { style: { fontSize: '12px', color: 'rgba(255,255,255,0.7)' } }, output.timestamp.toLocaleTimeString()),
      renderContentPreview(),
      React.createElement('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-around',
          marginTop: '12px'
        }
      }, 
      React.createElement('button', {
        style: buttonStyle,
        onClick: handleDownload
      }, 'Download'),
      onCopy && typeof output.content === 'string' && React.createElement('button', {
        style: { ...buttonStyle, backgroundColor: '#34C759' },
        onClick: handleCopy
      }, 'Copy'),
      React.createElement('button', {
        style: { ...buttonStyle, backgroundColor: '#FF9500' },
        onClick: handleApprove
      }, 'Learn'),
      React.createElement('button', {
        style: { ...buttonStyle, backgroundColor: '#FF3B30' },
        onClick: handleDiscard
      }, 'Discard'),
    )
  );
};