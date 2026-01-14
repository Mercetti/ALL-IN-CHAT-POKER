import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
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
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>('TypeScript');
  const [isLoading, setIsLoading] = useState(false);
  const [outputs, setOutputs] = useState<GeneratedCode[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const sessionId = React.useMemo(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, []);

  React.useEffect(() => {
    // Load existing outputs from memory
    setOutputs(getMemoryOutputs());
    setUsageCount(getUserUsageCount(userId, sessionId));
  }, [userId, sessionId]);

  const handleGenerateCode = async () => {
    if (!inputValue.trim()) return;

    // Check usage limits for free tier
    if (userTier === 'free' && usageCount >= 10) {
      Alert.alert(
        'Usage Limit Exceeded',
        'Free tier users can generate 10 code snippets per session. Upgrade to Pro for unlimited access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: onUsageExceeded }
        ]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const request = {
        id: `req_${Date.now()}`,
        prompt: inputValue,
        language: selectedLanguage,
        sessionId,
        userId,
        timestamp: Date.now()
      };

      const response = await generateCode(request);
      
      // Add user message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        content: `${selectedLanguage}: ${inputValue}`,
        timestamp: new Date()
      }]);

      // Add Acey response
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'acey',
        content: `Generated ${selectedLanguage} code successfully!`,
        timestamp: new Date()
      }]);

      // Add output bubble
      setMessages(prev => [...prev, {
        id: response.code.id,
        type: 'output',
        output: response.code,
        timestamp: new Date()
      }]);

      setOutputs(prev => [...prev, response.code]);
      setUsageCount(prev => prev + 1);
      setInputValue('');

    } catch (error) {
      Alert.alert('Generation Failed', `Failed to generate code: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (output: GeneratedCode) => {
    try {
      await downloadOutput(output);
      Alert.alert('Success', 'Code downloaded successfully!');
    } catch (error) {
      Alert.alert('Download Failed', 'Failed to download code file.');
    }
  };

  const handleStoreLearning = (output: GeneratedCode) => {
    Alert.prompt(
      'Store for Learning',
      'Add logic steps (comma-separated):',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Store',
          onPress: (logicSteps) => {
            Alert.prompt(
              'Store for Learning',
              'Add fixes applied (comma-separated):',
              [
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
                {
                  text: 'Store',
                  onPress: (fixes) => {
                    const steps = logicSteps ? logicSteps.split(',').map(s => s.trim()) : [];
                    const fixes = fixes ? fixes.split(',').map(f => f.trim()) : [];
                    
                    storeForLearning(output, fixes, steps);
                    Alert.alert('Success', 'Pattern stored for Acey learning!');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleDiscard = (output: GeneratedCode) => {
    Alert.alert(
      'Discard Code',
      'Remove this code from memory? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            discardOutput(output.id);
            setOutputs(prev => prev.filter(o => o.id !== output.id));
            setMessages(prev => prev.filter(m => m.id !== output.id));
            Alert.alert('Success', 'Code discarded from memory.');
          }
        }
      ]
    );
  };

  const renderOutputBubble = (output: GeneratedCode) => (
    <View key={output.id} style={[styles.outputBubble, styles[output.language]]}>
      <View style={styles.bubbleHeader}>
        <Text style={styles.language}>{output.language}</Text>
        <Text style={styles.timestamp}>
          {new Date(output.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      
      <ScrollView style={styles.codeContainer}>
        <Text style={styles.code}>{output.content}</Text>
      </ScrollView>
      
      {output.metadata && (
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Complexity: {output.metadata.complexity} | 
            Category: {output.metadata.category} | 
            Lines: {output.metadata.linesOfCode}
          </Text>
        </View>
      )}
      
      <View style={styles.buttons}>
        <Button 
          title="📥 Download" 
          onPress={() => handleDownload(output)}
          color="#007AFF"
        />
        <Button 
          title="🧠 Store Learning" 
          onPress={() => handleStoreLearning(output)}
          color="#FF9500"
        />
        <Button 
          title="🗑️ Discard" 
          onPress={() => handleDiscard(output)}
          color="#FF3B30"
        />
      </View>
    </View>
  );

  const renderMessage = (message: any) => {
    if (message.type === 'output') {
      return renderOutputBubble(message.output);
    }

    return (
      <View key={message.id} style={[styles.message, styles[message.type]]}>
        <Text style={styles.messageText}>{message.content}</Text>
        <Text style={styles.messageTime}>
          {message.timestamp.toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  const analytics = getLearningAnalytics();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 Acey Code Helper</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.usageInfo}>
            Usage: {usageCount}/10 (Free Tier)
          </Text>
          <Button 
            title="📊 Analytics" 
            onPress={() => setShowAnalytics(!showAnalytics)}
            color="#666"
          />
        </View>
      </View>

      {showAnalytics && (
        <View style={styles.analyticsPanel}>
          <Text style={styles.analyticsTitle}>Learning Analytics</Text>
          <Text>Total Patterns: {analytics.totalPatterns}</Text>
          <Text>Avg Success Rate: {(analytics.averageSuccessRate * 100).toFixed(1)}%</Text>
          <Text>Most Used: {analytics.mostUsedPatterns[0]?.language || 'N/A'}</Text>
        </View>
      )}

      <View style={styles.languageSelector}>
        <Text style={styles.selectorLabel}>Language:</Text>
        {(['TypeScript', 'JavaScript', 'Python', 'Java', 'CSharp', 'Go', 'Rust'] as ProgrammingLanguage[]).map(lang => (
          <Button
            key={lang}
            title={lang}
            onPress={() => setSelectedLanguage(lang)}
            color={selectedLanguage === lang ? '#007AFF' : '#666'}
          />
        ))}
      </View>

      <ScrollView style={styles.messages} showsVerticalScrollIndicator={false}>
        {messages.map(renderMessage)}
        
        {isLoading && (
          <View style={[styles.message, 'acey']}>
            <Text style={styles.typingIndicator}>Acey is generating code...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Describe the code you want to generate..."
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <Button 
          title={isLoading ? '...' : 'Generate'}
          onPress={handleGenerateCode}
          disabled={!inputValue.trim() || isLoading}
          color="#007AFF"
        />
      </View>

      <View style={styles.memoryControls}>
        <Button 
          title="🔄 Refresh Memory" 
          onPress={() => setOutputs(getMemoryOutputs())}
          color="#666"
        />
        <Button 
          title="🗑️ Clear All" 
          onPress={() => {
            Alert.alert(
              'Clear All Memory',
              'Remove all code from memory? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Clear All', 
                  style: 'destructive',
                  onPress: () => {
                    setOutputs([]);
                    setMessages([]);
                  }
                }
              ]
            );
          }}
          color="#FF3B30"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  usageInfo: {
    fontSize: 12,
    color: '#888',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  analyticsPanel: {
    backgroundColor: '#2d2d2d',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3d3d3d',
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  languageSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    flexWrap: 'wrap',
    backgroundColor: '#252525',
  },
  selectorLabel: {
    fontSize: 14,
    color: '#fff',
    marginRight: 8,
    alignSelf: 'center',
  },
  messages: {
    flex: 1,
    padding: 16,
  },
  message: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  acey: {
    alignSelf: 'flex-start',
    backgroundColor: '#3d3d3d',
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    color: '#fff',
    fontStyle: 'italic',
  },
  outputBubble: {
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  language: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  codeContainer: {
    maxHeight: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    padding: 12,
    marginVertical: 8,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#fff',
    lineHeight: 16,
  },
  metadata: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  metadataText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderTopWidth: 1,
    borderTopColor: '#3d3d3d',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#3d3d3d',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#4d4d4d',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  memoryControls: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#252525',
    borderTopWidth: 1,
    borderTopColor: '#3d3d3d',
    justifyContent: 'center',
    gap: 12,
  },
  // Language-specific colors
  TypeScript: {
    backgroundColor: '#2C3E50',
    borderLeftColor: '#3498DB',
  },
  JavaScript: {
    backgroundColor: '#2C3E50',
    borderLeftColor: '#F39C12',
  },
  Python: {
    backgroundColor: '#2C3E50',
    borderLeftColor: '#27AE60',
  },
  Java: {
    backgroundColor: '#2C3E50',
    borderLeftColor: '#E74C3C',
  },
  CSharp: {
    backgroundColor: '#2C3E50',
    borderLeftColor: '#9B59B6',
  },
  Go: {
    backgroundColor: '#2C3E50',
    borderLeftColor: '#00ADD8',
  },
  Rust: {
    backgroundColor: '#2C3E50',
    borderLeftColor: '#CE422B',
  },
});
