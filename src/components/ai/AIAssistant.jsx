/**
 * AI Assistant Component
 * Advanced AI-powered poker assistant with voice and chat capabilities
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AIAssistant.css';

const AIAssistant = ({
  enabled = true,
  voiceEnabled = false,
  chatEnabled = true,
  language = 'en',
  personality = 'friendly',
  onAdvice,
  onChatMessage,
  className = '',
  style = {},
  ...props
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeMode, setActiveMode] = useState('voice'); // 'voice' or 'chat'
  const [suggestions, setSuggestions] = useState([]);
  const chatInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Voice recognition setup
  const recognitionRef = useRef(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'en' ? 'en-US' : language;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceCommand(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, [language]);

  // Text-to-speech setup
  const synthesisRef = useRef(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Generate contextual suggestions
  useEffect(() => {
    const generateSuggestions = () => {
      const suggestionList = [
        "What should I do with pocket aces?",
        "How do I calculate pot odds?",
        "When should I bluff?",
        "What's a good starting hand?",
        "How do I read my opponents?",
        "Should I call or raise?",
        "What's my position advantage?",
        "How much should I bet?"
      ];
      
      setSuggestions(suggestionList.sort(() => Math.random() - 0.5).slice(0, 3));
    };

    generateSuggestions();
    const interval = setInterval(generateSuggestions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleVoiceCommand = useCallback((command) => {
    const lowerCommand = command.toLowerCase();
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: command,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    // Process command and generate response
    let response = '';
    
    if (lowerCommand.includes('what should i do') || lowerCommand.includes('advice')) {
      response = generateAdviceResponse(command);
    } else if (lowerCommand.includes('calculate') || lowerCommand.includes('odds')) {
      response = generateOddsResponse(command);
    } else if (lowerCommand.includes('bluff')) {
      response = generateBluffResponse(command);
    } else if (lowerCommand.includes('position')) {
      response = generatePositionResponse(command);
    } else if (lowerCommand.includes('bet') || lowerCommand.includes('raise')) {
      response = generateBettingResponse(command);
    } else if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
      response = getGreeting();
    } else if (lowerCommand.includes('help')) {
      response = getHelpMessage();
    } else {
      response = generateGeneralResponse(command);
    }
    
    // Add AI response to chat
    const aiMessage = {
      id: Date.now() + 1,
      type: 'ai',
      text: response,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, aiMessage]);
    
    // Speak response if voice is enabled
    if (voiceEnabled && synthesisRef.current) {
      speak(response);
    }
    
    if (onChatMessage) {
      onChatMessage({ user: userMessage, ai: aiMessage });
    }
  }, [voiceEnabled, onChatMessage]);

  const generateAdviceResponse = (command) => {
    const responses = [
      "Based on your current hand and position, I'd recommend playing cautiously. Consider your opponents' tendencies and the pot odds before making a decision.",
      "Your hand strength looks moderate. If you're in late position with few opponents, a controlled raise could be profitable. Otherwise, consider calling or folding based on the pot odds.",
      "I suggest evaluating the pot odds first. If the pot odds are favorable and you have decent position, calling might be your best option. Avoid overcommitting without strong cards."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateOddsResponse = (command) => {
    return "To calculate pot odds, divide the current bet by the total pot size including the bet. For example, if the pot is $100 and you need to call $20, your pot odds are 20/120 = 16.7%. You should call when your hand equity exceeds this percentage.";
  };

  const generateBluffResponse = (command) => {
    return "Successful bluffing depends on several factors: board texture, opponent tendencies, and your table image. Bluff more against tight players and on scary boards. Consider semi-bluffs with drawing hands for better equity.";
  };

  const generatePositionResponse = (command) => {
    return "Position is crucial in poker. Late position gives you more information and control. In early position, play tighter and focus on premium hands. In late position, you can play more hands and apply pressure on earlier players.";
  };

  const generateBettingResponse = (command) => {
    return "Your bet size should serve a purpose: value betting, protection, or bluffing. Generally, bet between 50-75% of the pot for value bets, 60-80% for protection, and 40-60% for bluffs. Adjust based on board texture and opponent tendencies.";
  };

  const getGreeting = () => {
    const greetings = [
      "Hello! I'm your AI poker coach. How can I help you improve your game today?",
      "Hi there! Ready to take your poker skills to the next level? Ask me anything about strategy, odds, or game situations.",
      "Greetings! I'm here to provide expert poker advice. What would you like to know about your current game?"
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const getHelpMessage = () => {
    return "I can help you with: hand analysis, pot odds calculations, betting strategies, position play, opponent reading, bluffing techniques, and general poker strategy. Just ask me a question or describe your situation!";
  };

  const generateGeneralResponse = (command) => {
    const responses = [
      "That's an interesting question. Based on general poker strategy, I'd recommend considering your position, pot odds, and opponent tendencies before making your decision.",
      "Great question! The optimal play depends on many factors including your hand strength, position, and the specific game situation. Can you provide more details about your current hand?",
      "I understand you're looking for guidance. Remember that poker is situational - always consider the context, your opponents, and the specific game dynamics before making your move."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const speak = (text) => {
    if (!synthesisRef.current || !voiceEnabled) return;
    
    // Cancel any ongoing speech
    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current || !voiceEnabled) return;
    
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (!synthesisRef.current) return;
    
    synthesisRef.current.cancel();
    setIsSpeaking(false);
  };

  const sendChatMessage = () => {
    if (!currentMessage.trim()) return;
    
    handleVoiceCommand(currentMessage);
    setCurrentMessage('');
    
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setCurrentMessage(suggestion);
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const getAssistantClasses = () => {
    const classes = [
      'ai-assistant',
      `ai-assistant--${personality}`,
      !enabled && 'ai-assistant--disabled',
      isMinimized && 'ai-assistant--minimized',
      activeMode === 'voice' ? 'ai-assistant--voice-mode' : 'ai-assistant--chat-mode',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderVoiceMode = () => (
    <div className="ai-assistant__voice-mode">
      <div className="ai-assistant__voice-controls">
        <button
          className={`ai-assistant__voice-btn ${isListening ? 'ai-assistant__voice-btn--listening' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={!voiceEnabled}
        >
          <div className="ai-assistant__voice-icon">
            {isListening ? '🎤' : '🎙️'}
          </div>
          <div className="ai-assistant__voice-status">
            {isListening ? 'Listening...' : 'Tap to speak'}
          </div>
        </button>
        
        {isSpeaking && (
          <button
            className="ai-assistant__voice-btn ai-assistant__voice-btn--speaking"
            onClick={stopSpeaking}
          >
            <div className="ai-assistant__voice-icon">🔇</div>
            <div className="ai-assistant__voice-status">Stop speaking</div>
          </button>
        )}
      </div>
      
      <div className="ai-assistant__voice-wave">
        {isListening && (
          <div className="ai-assistant__wave-bars">
            <div className="ai-assistant__wave-bar"></div>
            <div className="ai-assistant__wave-bar"></div>
            <div className="ai-assistant__wave-bar"></div>
            <div className="ai-assistant__wave-bar"></div>
            <div className="ai-assistant__wave-bar"></div>
          </div>
        )}
      </div>
      
      <div className="ai-assistant__suggestions">
        <div className="ai-assistant__suggestions-title">Try asking:</div>
        <div className="ai-assistant__suggestions-list">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="ai-assistant__suggestion"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChatMode = () => (
    <div className="ai-assistant__chat-mode">
      <div className="ai-assistant__chat-messages" ref={chatContainerRef}>
        {chatMessages.length === 0 && (
          <div className="ai-assistant__chat-welcome">
            <div className="ai-assistant__welcome-icon">🤖</div>
            <div className="ai-assistant__welcome-text">
              Hi! I'm your AI poker coach. Ask me anything about poker strategy, odds, or game situations!
            </div>
          </div>
        )}
        
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`ai-assistant__message ai-assistant__message--${message.type}`}
          >
            <div className="ai-assistant__message-avatar">
              {message.type === 'user' ? '👤' : '🤖'}
            </div>
            <div className="ai-assistant__message-content">
              <div className="ai-assistant__message-text">
                {message.text}
              </div>
              <div className="ai-assistant__message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="ai-assistant__chat-input">
        <div className="ai-assistant__input-wrapper">
          <input
            ref={chatInputRef}
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleChatKeyPress}
            placeholder="Ask me about poker strategy..."
            className="ai-assistant__input"
            disabled={!chatEnabled}
          />
          <button
            className="ai-assistant__send-btn"
            onClick={sendChatMessage}
            disabled={!currentMessage.trim() || !chatEnabled}
          >
            ➤
          </button>
        </div>
        
        <div className="ai-assistant__chat-actions">
          <button
            className="ai-assistant__action-btn"
            onClick={clearChat}
            title="Clear chat"
          >
            🗑️
          </button>
          
          {voiceEnabled && (
            <button
              className={`ai-assistant__action-btn ${isSpeaking ? 'ai-assistant__action-btn--active' : ''}`}
              onClick={isSpeaking ? stopSpeaking : () => speak(chatMessages[chatMessages.length - 1]?.text || '')}
              title={isSpeaking ? 'Stop speaking' : 'Speak last message'}
              disabled={chatMessages.length === 0}
            >
              {isSpeaking ? '🔇' : '🔊'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={getAssistantClasses()}
      style={style}
      {...props}
    >
      {/* Header */}
      <div className="ai-assistant__header">
        <div className="ai-assistant__title">
          <span className="ai-assistant__title-icon">🤖</span>
          <span className="ai-assistant__title-text">AI Assistant</span>
          <span className="ai-assistant__status">
            {isListening ? '🎤' : isSpeaking ? '🔊' : '💬'}
          </span>
        </div>
        
        <div className="ai-assistant__controls">
          {voiceEnabled && chatEnabled && (
            <button
              className={`ai-assistant__mode-btn ${activeMode === 'voice' ? 'ai-assistant__mode-btn--active' : ''}`}
              onClick={() => setActiveMode('voice')}
              title="Voice mode"
            >
              🎤
            </button>
          )}
          
          {chatEnabled && (
            <button
              className={`ai-assistant__mode-btn ${activeMode === 'chat' ? 'ai-assistant__mode-btn--active' : ''}`}
              onClick={() => setActiveMode('chat')}
              title="Chat mode"
            >
              💬
            </button>
          )}
          
          <button
            className={`ai-assistant__minimize-btn ${isMinimized ? 'ai-assistant__minimize-btn--minimized' : ''}`}
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '📈' : '📉'}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="ai-assistant__content">
          {activeMode === 'voice' && voiceEnabled ? renderVoiceMode() : renderChatMode()}
        </div>
      )}
    </div>
  );
};

// AI Insights Component
export const AIInsights = ({
  gameState,
  insights = [],
  onInsightClick,
  className = '',
  style = {},
  ...props
}) => {
  const [expandedInsight, setExpandedInsight] = useState(null);

  const handleInsightClick = (insight) => {
    setExpandedInsight(expandedInsight === insight.id ? null : insight.id);
    if (onInsightClick) onInsightClick(insight);
  };

  const getInsightIcon = (type) => {
    const icons = {
      strategy: '🧠',
      odds: '📊',
      position: '📍',
      bluff: '🎭',
      betting: '💰',
      tells: '👁️',
      mistake: '⚠️',
      opportunity: '✨'
    };
    return icons[type] || '💡';
  };

  const getInsightColor = (type) => {
    const colors = {
      strategy: '#3182ce',
      odds: '#38a169',
      position: '#d69e2e',
      bluff: '#9f7aea',
      betting: '#ed8936',
      tells: '#4299e1',
      mistake: '#f56565',
      opportunity: '#48bb78'
    };
    return colors[type] || '#718096';
  };

  return (
    <div className={`ai-insights ${className}`} style={style} {...props}>
      <div className="ai-insights__header">
        <h3 className="ai-insights__title">AI Insights</h3>
        <div className="ai-insights__count">{insights.length}</div>
      </div>
      
      <div className="ai-insights__list">
        {insights.length === 0 ? (
          <div className="ai-insights__empty">
            <div className="ai-insights__empty-icon">🔍</div>
            <div className="ai-insights__empty-text">
              No insights available yet. Play more hands to get AI-powered insights!
            </div>
          </div>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className={`ai-insights__insight ${expandedInsight === insight.id ? 'ai-insights__insight--expanded' : ''}`}
              onClick={() => handleInsightClick(insight)}
            >
              <div className="ai-insights__insight-header">
                <div
                  className="ai-insights__insight-icon"
                  style={{ color: getInsightColor(insight.type) }}
                >
                  {getInsightIcon(insight.type)}
                </div>
                <div className="ai-insights__insight-title">{insight.title}</div>
                <div className="ai-insights__insight-confidence">
                  {Math.round(insight.confidence * 100)}%
                </div>
              </div>
              
              <div className="ai-insights__insight-content">
                <div className="ai-insights__insight-description">
                  {insight.description}
                </div>
                
                {expandedInsight === insight.id && insight.details && (
                  <div className="ai-insights__insight-details">
                    <div className="ai-insights__insight-analysis">
                      {insight.details.analysis}
                    </div>
                    {insight.details.recommendation && (
                      <div className="ai-insights__insight-recommendation">
                        <strong>Recommendation:</strong> {insight.details.recommendation}
                      </div>
                    )}
                    {insight.details.impact && (
                      <div className="ai-insights__insight-impact">
                        <strong>Impact:</strong> {insight.details.impact}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
