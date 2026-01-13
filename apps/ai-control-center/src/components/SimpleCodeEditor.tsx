import React from 'react';

interface SimpleCodeEditorProps {
  width: string;
  height: string;
  language: string;
  theme: string;
  value: string;
  options?: any;
  onChange?: (value: string) => void;
}

export const SimpleCodeEditor: React.FC<SimpleCodeEditorProps> = ({
  width,
  height,
  language,
  theme,
  value,
  options,
  onChange
}) => {
  return (
    <div 
      style={{ 
        width, 
        height, 
        backgroundColor: theme === 'vs-dark' ? '#1e1e1e' : '#ffffff',
        border: '1px solid #d4d4d4',
        borderRadius: '4px',
        overflow: 'auto'
      }}
    >
      <pre
        style={{
          margin: 0,
          padding: '16px',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          color: theme === 'vs-dark' ? '#d4d4d4' : '#000000',
          whiteSpace: 'pre-wrap',
          overflow: 'auto',
          ...options
        }}
      >
        {value}
      </pre>
    </div>
  );
};
