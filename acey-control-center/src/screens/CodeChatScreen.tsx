import React, { useState } from 'react';

interface CodeChatScreenProps {
  userId?: string;
  userTier?: 'free' | 'pro' | 'enterprise';
  onUsageExceeded?: () => void;
}

export const CodeChatScreen: React.FC<CodeChatScreenProps> = ({
  userId,
  userTier = 'free',
  onUsageExceeded
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('TypeScript');
  const [isLoading, setIsLoading] = useState(false);

  // Mock functions for missing imports
  const addOutputToMemory = (output: any) => console.log('Add to memory:', output);
  const discardOutput = (id: string) => console.log('Discard output:', id);
  const downloadOutput = (output: any) => console.log('Download output:', output);
  const storeForLearning = (output: any) => console.log('Store for learning:', output);
  const generateCode = (prompt: string, language: string) => `Generated ${language} code for: ${prompt}`;
  const getMemoryOutputs = () => [];
  const getLearningAnalytics = () => ({ totalOutputs: 0, approvedOutputs: 0 });
  const trackUsage = () => console.log('Track usage');
  const getUserUsageCount = () => 10;

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages((prev: any[]) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate code generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const generatedCode = generateCode(inputValue, selectedLanguage);
      
      const aceyMessage = {
        id: Date.now().toString(),
        type: 'acey',
        content: generatedCode,
        timestamp: new Date()
      };

      setMessages((prev: any[]) => [...prev, aceyMessage]);
      
      // Add to memory
      const output = {
        id: Date.now().toString(),
        skill: 'Code',
        content: generatedCode,
        metadata: { language: selectedLanguage },
        timestamp: new Date(),
        filename: `generated.${selectedLanguage.toLowerCase()}`
      };
      
      addOutputToMemory(output);
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>💻 Code Generation Chat</h2>
        <p>Generate code in various programming languages</p>
      </div>

      <div style={styles.chatContainer}>
        {messages.map((message: any) => (
          <div key={message.id} style={styles.message}>
            <div style={styles.messageHeader}>
              <span style={styles.messageType}>{message.type}</span>
              <span style={styles.timestamp}>
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div style={styles.messageContent}>
              {message.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={styles.loading}>
            Generating code...
          </div>
        )}
      </div>

      <div style={styles.inputContainer}>
        <select
          value={selectedLanguage}
          onChange={(e: any) => setSelectedLanguage(e.target.value)}
          style={styles.languageSelect}
        >
          <option value="TypeScript">TypeScript</option>
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
          <option value="Java">Java</option>
        </select>
        
        <input
          type="text"
          value={inputValue}
          onChange={(e: any) => setInputValue(e.target.value)}
          onKeyPress={(e: any) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask me to generate code..."
          style={styles.input}
          disabled={isLoading}
        />
        
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
          style={styles.sendButton}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>

      <div style={styles.analytics}>
        <h3>Usage Analytics</h3>
        <p>Total Outputs: {getLearningAnalytics().totalOutputs}</p>
        <p>Approved Outputs: {getLearningAnalytics().approvedOutputs}</p>
        <p>Usage Count: {getUserUsageCount()}</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333'
  },
  chatContainer: {
    height: '400px',
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '10px',
    backgroundColor: '#fff',
    marginBottom: '20px'
  },
  message: {
    marginBottom: '10px',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: '#f0f0f0'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px'
  },
  messageType: {
    fontWeight: 'bold',
    color: '#007AFF'
  },
  timestamp: {
    fontSize: '12px',
    color: '#666'
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: '1.4'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    fontStyle: 'italic',
    color: '#666'
  },
  inputContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  languageSelect: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  input: {
    flex: 1,
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px'
  },
  sendButton: {
    padding: '10px 20px',
    backgroundColor: '#007AFF',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  analytics: {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #ddd'
  }
} as any;
