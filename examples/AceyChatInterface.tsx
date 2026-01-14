import React, { useState, useEffect } from 'react';
import { GeneratedOutput, addToMemory, getMemoryOutputs, discardOutput, downloadOutput, copyToClipboard, approveForLearning, generateOutputId, SkillType } from '../utils/outputManager';
import { OutputBubble } from '../components/OutputBubble.web';
import '../styles/OutputBubble.css';

interface ChatMessage {
  id: string;
  type: 'user' | 'acey' | 'output';
  content: string;
  timestamp: Date;
  outputId?: string;
}

export const AceyChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);

  useEffect(() => {
    // Load existing outputs from memory
    setOutputs(getMemoryOutputs());
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: generateOutputId(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages((prev: ChatMessage[]) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate Acey processing the request
      const response = await processAseyRequest(inputValue);
      
      const aceyMessage: ChatMessage = {
        id: generateOutputId(),
        type: 'acey',
        content: response.text,
        timestamp: new Date()
      };

      setMessages((prev: ChatMessage[]) => [...prev, aceyMessage]);

      // If there's an output, create and add to memory
      if (response.output) {
        const output: GeneratedOutput = {
          id: generateOutputId(),
          skill: response.output.skill,
          content: response.output.content,
          metadata: response.output.metadata,
          timestamp: new Date(),
          filename: response.output.filename
        };

        addToMemory(output);
        setOutputs((prev: GeneratedOutput[]) => [...prev, output]);

        const outputMessage: ChatMessage = {
          id: generateOutputId(),
          type: 'output',
          content: `Generated ${response.output.skill} output`,
          timestamp: new Date(),
          outputId: output.id
        };

        setMessages((prev: ChatMessage[]) => [...prev, outputMessage]);
      }
    } catch (error) {
      console.error('Error processing request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (outputId: string) => {
    const output = outputs.find((o: GeneratedOutput) => o.id === outputId);
    if (output) {
      downloadOutput(output);
    }
  };

  const handleCopy = async (outputId: string) => {
    const output = outputs.find((o: GeneratedOutput) => o.id === outputId);
    if (output) {
      try {
        await copyToClipboard(output);
        alert('Content copied to clipboard!');
      } catch (error) {
        alert('Failed to copy to clipboard');
      }
    }
  };

  const handleApprove = async (outputId: string) => {
    try {
      const success = await approveForLearning(outputId);
      if (success) {
        alert('Output approved for learning!');
      } else {
        alert('Failed to approve for learning');
      }
    } catch (error) {
      alert('Error approving for learning');
    }
  };

  const handleDiscard = (outputId: string) => {
    const success = discardOutput(outputId);
    if (success) {
      setOutputs((prev: GeneratedOutput[]) => prev.filter((o: GeneratedOutput) => o.id !== outputId));
      setMessages((prev: ChatMessage[]) => prev.filter((m: ChatMessage) => m.outputId !== outputId));
    }
  };

  const processAseyRequest = async (input: string) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock responses based on input
    if (input.toLowerCase().includes('code') || input.toLowerCase().includes('function')) {
      return {
        text: "I'll generate that function for you.",
        output: {
          skill: 'Code' as SkillType,
          content: `function shuffleDeck(deck: string[]): string[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Usage example:
const deck = ['AH', '2H', '3H', '4H', '5H'];
const shuffledDeck = shuffleDeck(deck);
console.log('Shuffled deck:', shuffledDeck);`,
          filename: 'shuffleDeck.ts',
          metadata: {
            language: 'typescript',
            description: 'Fisher-Yates shuffle algorithm for deck of cards'
          }
        }
      };
    } else if (input.toLowerCase().includes('graphic') || input.toLowerCase().includes('image')) {
      return {
        text: "I'll create a poker table graphic for you.",
        output: {
          skill: 'Graphics' as SkillType,
          content: new ArrayBuffer(1024), // Mock binary data
          filename: 'poker-table.png',
          metadata: {
            format: 'PNG',
            dimensions: '800x600',
            description: 'Green poker table with card positions'
          }
        }
      };
    } else {
      return {
        text: "I understand your request. How can I help you further?",
        output: null
      };
    }
  };

  return (
    <div className="acey-chat">
      <div className="chat-header">
        <h1>🤖 Acey - Memory-First AI Assistant</h1>
        <div className="memory-stats">
          <span>Memory: {outputs.length} outputs</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message: ChatMessage) => (
          <div key={message.id} className={`message ${message.type}`}>
            {message.type === 'output' && message.outputId ? (
              <OutputBubble
                output={outputs.find((o: GeneratedOutput) => o.id === message.outputId)!}
                onDownload={() => handleDownload(message.outputId!)}
                onApprove={() => handleApprove(message.outputId!)}
                onDiscard={() => handleDiscard(message.outputId!)}
                onCopy={() => handleCopy(message.outputId!)}
              />
            ) : (
              <div className="message-content">
                <span className="message-text">{message.content}</span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="message acey">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask Acey to generate code, graphics, or audio..."
          disabled={isLoading}
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>

      <div className="memory-controls">
        <button onClick={() => setOutputs(getMemoryOutputs())}>
          🔄 Refresh Memory
        </button>
        <button onClick={() => {
          if (confirm('Clear all outputs from memory?')) {
            setOutputs([]);
            setMessages(prev => prev.filter((m: ChatMessage) => m.type !== 'output'));
          }
        }}>
          🗑️ Clear Memory
        </button>
      </div>
    </div>
  );
};
