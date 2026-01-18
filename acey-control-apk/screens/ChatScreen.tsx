import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSystem } from '../src/context/SystemContext';
import { useAdvancedControls } from '../src/context/AdvancedControlsContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'acey';
  timestamp: Date;
  type: 'text' | 'system' | 'skill' | 'control';
  action?: string;
  result?: any;
}

interface ChatScreenProps {
  navigation: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { state, actions } = useSystem();
  const advancedActions = useAdvancedControls();

  // Available Acey functions and skills
  const aceyFunctions = {
    // System Control
    'start': 'Start the Acey system',
    'stop': 'Stop the Acey system', 
    'restart': 'Restart the Acey system',
    'status': 'Get current system status',
    'emergency stop': 'Emergency stop all processes',
    
    // Advanced Controls
    'set mode': 'Change operating mode (e.g., "set mode to performance")',
    'enable throttling': 'Enable request throttling',
    'disable throttling': 'Disable request throttling',
    'set throttling level': 'Set throttling level (low/medium/high/off)',
    
    // Analytics & Monitoring
    'metrics': 'Get detailed system metrics',
    'logs': 'View system logs',
    'analytics': 'Get analytics data',
    'performance': 'Check performance stats',
    
    // Skills (mock for now)
    'analyze': 'Analyze data or text',
    'summarize': 'Summarize content',
    'generate': 'Generate content or responses',
    'calculate': 'Perform calculations',
    'search': 'Search for information',
    
    // Help
    'help': 'Show available commands',
    'skills': 'List available skills',
    'functions': 'List available functions'
  };

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: '1',
      text: "Hello! I'm Acey, your AI assistant. I can help you control the system and use various skills. Type 'help' to see what I can do!",
      sender: 'acey',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    scrollToBottom();
  };

  const processCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase().trim();
    
    // Help commands
    if (lowerCommand === 'help' || lowerCommand === 'commands') {
      const helpText = Object.entries(aceyFunctions)
        .map(([cmd, desc]) => `• ${cmd}: ${desc}`)
        .join('\n');
      
      addMessage({
        text: `Available commands:\n\n${helpText}`,
        sender: 'acey',
        type: 'text'
      });
      return;
    }

    if (lowerCommand === 'skills' || lowerCommand === 'functions') {
      const skills = Object.keys(aceyFunctions).join(', ');
      addMessage({
        text: `Available skills: ${skills}`,
        sender: 'acey',
        type: 'text'
      });
      return;
    }

    // System Control Commands
    if (lowerCommand === 'start' || lowerCommand === 'start system') {
      setIsLoading(true);
      try {
        await advancedActions.startSystem();
        addMessage({
          text: '✅ System started successfully',
          sender: 'acey',
          type: 'control',
          action: 'start',
          result: 'success'
        });
      } catch (error) {
        addMessage({
          text: `❌ Failed to start system: ${error}`,
          sender: 'acey',
          type: 'system',
          action: 'start',
          result: 'error'
        });
      }
      setIsLoading(false);
      return;
    }

    if (lowerCommand === 'stop' || lowerCommand === 'stop system') {
      setIsLoading(true);
      try {
        await advancedActions.stopSystem();
        addMessage({
          text: '✅ System stopped successfully',
          sender: 'acey',
          type: 'control',
          action: 'stop',
          result: 'success'
        });
      } catch (error) {
        addMessage({
          text: `❌ Failed to stop system: ${error}`,
          sender: 'acey',
          type: 'system',
          action: 'stop',
          result: 'error'
        });
      }
      setIsLoading(false);
      return;
    }

    if (lowerCommand === 'restart' || lowerCommand === 'restart system') {
      setIsLoading(true);
      try {
        await advancedActions.restartSystem();
        addMessage({
          text: '✅ System restarted successfully',
          sender: 'acey',
          type: 'control',
          action: 'restart',
          result: 'success'
        });
      } catch (error) {
        addMessage({
          text: `❌ Failed to restart system: ${error}`,
          sender: 'acey',
          type: 'system',
          action: 'restart',
          result: 'error'
        });
      }
      setIsLoading(false);
      return;
    }

    if (lowerCommand === 'emergency stop' || lowerCommand === 'emergency') {
      setIsLoading(true);
      try {
        await advancedActions.emergencyStop();
        addMessage({
          text: '🚨 Emergency stop activated!',
          sender: 'acey',
          type: 'control',
          action: 'emergency_stop',
          result: 'success'
        });
      } catch (error) {
        addMessage({
          text: `❌ Emergency stop failed: ${error}`,
          sender: 'acey',
          type: 'system',
          action: 'emergency_stop',
          result: 'error'
        });
      }
      setIsLoading(false);
      return;
    }

    // Status and Information Commands
    if (lowerCommand === 'status' || lowerCommand === 'system status') {
      setIsLoading(true);
      try {
        const status = await fetch('http://localhost:8080/api/acey/status');
        const statusData = await status.json();
        
        const statusText = `System Status: ${statusData.active ? '🟢 Online' : '🔴 Offline'}
Uptime: ${statusData.uptime}s
CPU Usage: ${statusData.resources.cpu}%
Memory Usage: ${statusData.resources.memory}%
Active Skills: ${statusData.skills.active}
LLM Connections: ${statusData.llmConnections.active}`;
        
        addMessage({
          text: statusText,
          sender: 'acey',
          type: 'system',
          action: 'status',
          result: statusData
        });
      } catch (error) {
        addMessage({
          text: `❌ Failed to get status: ${error}`,
          sender: 'acey',
          type: 'system',
          action: 'status',
          result: 'error'
        });
      }
      setIsLoading(false);
      return;
    }

    if (lowerCommand === 'metrics' || lowerCommand === 'performance') {
      setIsLoading(true);
      try {
        const metrics = await fetch('http://localhost:8080/api/acey/metrics');
        const metricsData = await metrics.json();
        
        const metricsText = `Performance Metrics:
CPU: ${metricsData.performance.cpuUsage}%
Memory: ${metricsData.performance.memoryUsage}%
Node Memory: ${JSON.stringify(metricsData.performance.nodeMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
System Load: ${metricsData.performance.systemLoad.join(', ')}
Health: ${metricsData.health.status}`;
        
        addMessage({
          text: metricsText,
          sender: 'acey',
          type: 'system',
          action: 'metrics',
          result: metricsData
        });
      } catch (error) {
        addMessage({
          text: `❌ Failed to get metrics: ${error}`,
          sender: 'acey',
          type: 'system',
          action: 'metrics',
          result: 'error'
        });
      }
      setIsLoading(false);
      return;
    }

    if (lowerCommand === 'logs') {
      setIsLoading(true);
      try {
        const logs = await fetch('http://localhost:8080/api/acey/logs?limit=10');
        const logsData = await logs.json();
        
        const logsText = logsData.logs.map((log: any) => 
          `[${log.level}] ${log.timestamp}: ${log.message}`
        ).join('\n');
        
        addMessage({
          text: `Recent Logs:\n\n${logsText}`,
          sender: 'acey',
          type: 'system',
          action: 'logs',
          result: logsData
        });
      } catch (error) {
        addMessage({
          text: `❌ Failed to get logs: ${error}`,
          sender: 'acey',
          type: 'system',
          action: 'logs',
          result: 'error'
        });
      }
      setIsLoading(false);
      return;
    }

    // Advanced Controls
    if (lowerCommand.startsWith('set mode')) {
      const modeMatch = command.match(/set mode to (\w+)/i);
      if (modeMatch) {
        const mode = modeMatch[1].toLowerCase();
        setIsLoading(true);
        try {
          await advancedActions.setMode(mode as any);
          addMessage({
            text: `✅ Mode set to ${mode}`,
            sender: 'acey',
            type: 'control',
            action: 'set_mode',
            result: mode
          });
        } catch (error) {
          addMessage({
            text: `❌ Failed to set mode: ${error}`,
            sender: 'acey',
            type: 'system',
            action: 'set_mode',
            result: 'error'
          });
        }
        setIsLoading(false);
        return;
      }
    }

    if (lowerCommand.startsWith('set throttling')) {
      const levelMatch = command.match(/set throttling (?:level )?(\w+)/i);
      if (levelMatch) {
        const level = levelMatch[1].toLowerCase();
        setIsLoading(true);
        try {
          await advancedActions.setThrottlingLevel(level as any);
          addMessage({
            text: `✅ Throttling set to ${level}`,
            sender: 'acey',
            type: 'control',
            action: 'set_throttling',
            result: level
          });
        } catch (error) {
          addMessage({
            text: `❌ Failed to set throttling: ${error}`,
            sender: 'acey',
            type: 'system',
            action: 'set_throttling',
            result: 'error'
          });
        }
        setIsLoading(false);
        return;
      }
    }

    // AI Skills (mock implementations)
    if (lowerCommand.startsWith('analyze')) {
      const textToAnalyze = command.replace(/analyze/i, '').trim();
      if (textToAnalyze) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage({
            text: `Analysis of "${textToAnalyze}":\n\nThis appears to be a request for analysis. The text contains ${textToAnalyze.length} characters and appears to be ${textToAnalyze.includes('?') ? 'a question' : 'a statement'}.`,
            sender: 'acey',
            type: 'skill',
            action: 'analyze',
            result: { length: textToAnalyze.length, type: textToAnalyze.includes('?') ? 'question' : 'statement' }
          });
        }, 2000);
        return;
      }
    }

    if (lowerCommand.startsWith('summarize')) {
      const textToSummarize = command.replace(/summarize/i, '').trim();
      if (textToSummarize) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage({
            text: `Summary: ${textToSummarize.substring(0, 100)}${textToSummarize.length > 100 ? '...' : ''}`,
            sender: 'acey',
            type: 'skill',
            action: 'summarize',
            result: { summary: textToSummarize.substring(0, 100) }
          });
        }, 1500);
        return;
      }
    }

    if (lowerCommand.startsWith('calculate')) {
      const calcExpression = command.replace(/calculate/i, '').trim();
      if (calcExpression) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          try {
            // Simple calculation (in production, use a proper math library)
            const result = eval(calcExpression);
            addMessage({
              text: `Calculation result: ${result}`,
              sender: 'acey',
              type: 'skill',
              action: 'calculate',
              result: result
            });
          } catch (error) {
            addMessage({
              text: `❌ Invalid calculation: ${calcExpression}`,
              sender: 'acey',
              type: 'skill',
              action: 'calculate',
              result: 'error'
            });
          }
        }, 1000);
        return;
      }
    }

    // Default response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage({
        text: `I didn't understand "${command}". Type 'help' to see available commands.`,
        sender: 'acey',
        type: 'text'
      });
    }, 1000);
  };

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    // Add user message
    addMessage({
      text: inputText,
      sender: 'user',
      type: 'text'
    });

    // Process the command
    processCommand(inputText);
    
    // Clear input
    setInputText('');
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    const backgroundColor = isUser ? '#3b82f6' : '#1e293b';
    const textColor = isUser ? '#ffffff' : '#e2e8f0';
    const alignSelf = isUser ? 'flex-end' : 'flex-start';

    return (
      <View key={message.id} style={[styles.messageContainer, { alignSelf }]}>
        <View style={[styles.messageBubble, { backgroundColor }]}>
          <Text style={[styles.messageText, { color: textColor }]}>
            {message.text}
          </Text>
          <Text style={[styles.timestamp, { color: textColor }]}>
            {message.timestamp.toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Acey Chat</Text>
        <Text style={styles.headerSubtitle}>Control Acey with natural language</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
        
        {isTyping && (
          <View style={[styles.messageContainer, { alignSelf: 'flex-start' }]}>
            <View style={[styles.messageBubble, { backgroundColor: '#1e293b' }]}>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text style={[styles.typingText, { color: '#e2e8f0' }]}>Acey is typing...</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a command or message..."
          placeholderTextColor="#94a3b8"
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, { opacity: inputText.trim() === '' || isLoading ? 0.5 : 1 }]}
          onPress={sendMessage}
          disabled={inputText.trim() === '' || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    minHeight: 40,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#030712',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChatScreen;
