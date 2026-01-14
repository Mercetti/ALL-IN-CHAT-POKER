import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { GeneratedOutput, SkillType } from '../types/skills';
import { 
  addOutputToMemory, 
  discardOutput, 
  downloadOutput, 
  storeForLearning, 
  generateCode,
  generateGraphics,
  generateAudio,
  getMemoryOutputs,
  getLearningAnalytics,
  trackUsage,
  getUserUsageCount,
  batchDownload,
  batchDiscard,
  batchStoreForLearning
} from '../utils/unifiedMemoryManager';

interface UnifiedChatScreenProps {
  userId?: string;
  userTier?: 'free' | 'pro' | 'enterprise';
  onUsageExceeded?: () => void;
}

export const UnifiedChatScreen: React.FC<UnifiedChatScreenProps> = ({
  userId,
  userTier = 'free',
  onUsageExceeded
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<SkillType>('CodeHelper');
  const [isLoading, setIsLoading] = useState(false);
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [expandedOutput, setExpandedOutput] = useState<string | null>(null);

  const sessionId = React.useMemo(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, []);

  React.useEffect(() => {
    setOutputs(getMemoryOutputs());
    setUsageCount(getUserUsageCount(userId, sessionId));
  }, [userId, sessionId]);

  const handleGenerate = async () => {
    if (!inputValue.trim()) return;

    // Check usage limits for free tier
    if (userTier === 'free' && usageCount >= 15) {
      Alert.alert(
        'Usage Limit Exceeded',
        'Free tier users can generate 15 outputs per session. Upgrade to Pro for unlimited access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: onUsageExceeded }
        ]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      let output: GeneratedOutput;

      switch (selectedSkill) {
        case 'CodeHelper':
          const codeResponse = await generateCode({
            id: `req_${Date.now()}`,
            skill: 'CodeHelper',
            prompt: inputValue,
            sessionId,
            userId,
            timestamp: Date.now(),
            skillSpecific: {
              language: 'TypeScript' // Default language
            }
          });
          output = codeResponse.code;
          break;

        case 'GraphicsWizard':
          const graphicsResponse = await generateGraphics({
            id: `req_${Date.now()}`,
            skill: 'GraphicsWizard',
            prompt: inputValue,
            sessionId,
            userId,
            timestamp: Date.now(),
            skillSpecific: {
              dimensions: { width: 800, height: 600 },
              format: 'PNG',
              style: 'modern'
            }
          });
          output = graphicsResponse.output;
          break;

        case 'AudioMaestro':
          const audioResponse = await generateAudio({
            id: `req_${Date.now()}`,
            skill: 'AudioMaestro',
            prompt: inputValue,
            sessionId,
            userId,
            timestamp: Date.now(),
            skillSpecific: {
              duration: 30, // 30 seconds default
              format: 'MP3',
              sampleRate: 44100
            }
          });
          output = audioResponse.output;
          break;

        default:
          throw new Error(`Unsupported skill: ${selectedSkill}`);
      }

      // Add user message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        content: `${selectedSkill}: ${inputValue}`,
        timestamp: new Date()
      }]);

      // Add Acey response
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'acey',
        content: `Generated ${selectedSkill} output successfully!`,
        timestamp: new Date()
      }]);

      // Add output bubble
      setMessages(prev => [...prev, {
        id: output.id,
        type: 'output',
        output,
        timestamp: new Date()
      }]);

      setOutputs(prev => [...prev, output]);
      setUsageCount(prev => prev + 1);
      setInputValue('');

    } catch (error) {
      Alert.alert('Generation Failed', `Failed to generate ${selectedSkill} output: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (output: GeneratedOutput) => {
    try {
      await downloadOutput(output);
      Alert.alert('Success', `${selectedSkill} output downloaded successfully!`);
    } catch (error) {
      Alert.alert('Download Failed', 'Failed to download output file.');
    }
  };

  const handleStoreLearning = (output: GeneratedOutput) => {
    Alert.prompt(
      'Store for Learning',
      'Add summary and steps (comma-separated):',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Store',
          onPress: (steps) => {
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
                    const stepsArray = steps ? steps.split(',').map(s => s.trim()) : [];
                    const fixesArray = fixes ? fixes.split(',').map(f => f.trim()) : [];
                    
                    storeForLearning(output, `${output.skill} generation`, stepsArray, fixesArray);
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

  const handleDiscard = (output: GeneratedOutput) => {
    Alert.alert(
      'Discard Output',
      'Remove this output from memory? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            discardOutput(output.id);
            setOutputs(prev => prev.filter(o => o.id !== output.id));
            setMessages(prev => prev.filter(m => m.id !== output.id));
            Alert.alert('Success', `${output.skill} output discarded from memory.`);
          }
        }
      ]
    );
  };

  const handleBatchActions = async (action: 'download' | 'discard' | 'learn') => {
    if (outputs.length === 0) {
      Alert.alert('No Outputs', 'No outputs available for batch operations.');
      return;
    }

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} All Outputs`,
      `Are you sure you want to ${action} all ${outputs.length} outputs?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action.charAt(0).toUpperCase() + action.slice(1), 
          style: action === 'discard' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              switch (action) {
                case 'download':
                  await batchDownload(outputs);
                  Alert.alert('Success', 'All outputs downloaded successfully!');
                  break;
                case 'discard':
                  const discardedCount = batchDiscard(outputs.map(o => o.id));
                  setOutputs([]);
                  setMessages(prev => prev.filter(m => m.type !== 'output'));
                  Alert.alert('Success', `${discardedCount} outputs discarded.`);
                  break;
                case 'learn':
                  const patterns = batchStoreForLearning(outputs);
                  Alert.alert('Success', `${patterns.length} patterns stored for learning!`);
                  break;
              }
            } catch (error) {
              Alert.alert('Batch Action Failed', `Failed to ${action} outputs: ${error}`);
            }
          }
        }
      ]
    );
  };

  const renderOutputBubble = (output: GeneratedOutput) => {
    const isExpanded = expandedOutput === output.id;
    
    return (
      <View key={output.id} style={[styles.outputBubble, styles[output.skill]]}>
        <View style={styles.bubbleHeader}>
          <Text style={styles.skillTitle}>{output.skill}</Text>
          <Text style={styles.timestamp}>
            {new Date(output.timestamp).toLocaleTimeString()}
          </Text>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setExpandedOutput(isExpanded ? null : output.id)}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {output.skill === 'CodeHelper' && (
          <ScrollView style={styles.codeContainer}>
            <Text style={styles.code}>{output.content as string}</Text>
          </ScrollView>
        )}
        
        {output.skill === 'GraphicsWizard' && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: output.content as string }} 
              style={styles.imagePreview} 
              resizeMode="contain"
            />
            {output.metadata?.dimensions && (
              <Text style={styles.imageInfo}>
                {output.metadata.dimensions.width} × {output.metadata.dimensions.height}px
              </Text>
            )}
          </View>
        )}
        
        {output.skill === 'AudioMaestro' && (
          <View style={styles.audioContainer}>
            <View style={styles.audioPreview}>
              <Text style={styles.audioIcon}>🎵</Text>
              <Text style={styles.audioText}>Audio File</Text>
            </View>
            {output.metadata?.duration && (
              <Text style={styles.audioInfo}>
                Duration: {output.metadata.duration}s
              </Text>
            )}
          </View>
        )}
        
        {isExpanded && output.metadata && (
          <View style={styles.expandedMetadata}>
            <Text style={styles.metadataTitle}>Metadata:</Text>
            {Object.entries(output.metadata).map(([key, value]) => (
              <Text key={key} style={styles.metadataItem}>
                {key}: {JSON.stringify(value)}
              </Text>
            ))}
          </View>
        )}
        
        <View style={styles.buttons}>
          <TouchableOpacity 
            style={[styles.button, styles.downloadButton]} 
            onPress={() => handleDownload(output)}
          >
            <Text style={styles.buttonText}>📥 Download</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.learnButton]} 
            onPress={() => handleStoreLearning(output)}
          >
            <Text style={styles.buttonText}>🧠 Store Learning</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.discardButton]} 
            onPress={() => handleDiscard(output)}
          >
            <Text style={styles.buttonText}>🗑️ Discard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        <Text style={styles.title}>🤖 Acey Unified Skills</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.usageInfo}>
            Usage: {usageCount}/15 (Free Tier)
          </Text>
          <TouchableOpacity 
            onPress={() => setShowAnalytics(!showAnalytics)}
            style={styles.analyticsButton}
          >
            <Text style={styles.analyticsButtonText}>📊 Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showAnalytics && (
        <View style={styles.analyticsPanel}>
          <Text style={styles.analyticsTitle}>Learning Analytics</Text>
          <Text>Total Patterns: {analytics.totalPatterns}</Text>
          <Text>Avg Success Rate: {(analytics.averageSuccessRate * 100).toFixed(1)}%</Text>
          
          <Text style={styles.analyticsSubtitle}>By Skill:</Text>
          {Object.entries(analytics.patternsBySkill).map(([skill, count]) => (
            <Text key={skill} style={styles.analyticsItem}>
              {skill}: {count}
            </Text>
          ))}
          
          <Text style={styles.analyticsSubtitle}>Most Used Skills:</Text>
          <Text style={styles.analyticsItem}>
            {analytics.mostUsedSkills.join(', ')}
          </Text>
        </View>
      )}

      <View style={styles.skillSelector}>
        <Text style={styles.selectorLabel}>Skill:</Text>
        {(['CodeHelper', 'GraphicsWizard', 'AudioMaestro'] as SkillType[]).map(skill => (
          <TouchableOpacity
            key={skill}
            style={[
              styles.skillButton,
              selectedSkill === skill ? styles.selectedSkillButton : styles.unselectedSkillButton
            ]}
            onPress={() => setSelectedSkill(skill)}
          >
            <Text style={styles.skillButtonText}>{skill}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.batchActions}>
        <TouchableOpacity 
          style={[styles.batchButton, styles.downloadBatchButton]} 
          onPress={() => handleBatchActions('download')}
          disabled={outputs.length === 0}
        >
          <Text style={styles.batchButtonText}>📥 Download All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.batchButton, styles.learnBatchButton]} 
          onPress={() => handleBatchActions('learn')}
          disabled={outputs.length === 0}
        >
          <Text style={styles.batchButtonText}>🧠 Learn All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.batchButton, styles.discardBatchButton]} 
          onPress={() => handleBatchActions('discard')}
          disabled={outputs.length === 0}
        >
          <Text style={styles.batchButtonText}>🗑️ Discard All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.messages} showsVerticalScrollIndicator={false}>
        {messages.map(renderMessage)}
        
        {isLoading && (
          <View style={[styles.message, styles.acey]}>
            <Text style={styles.typingIndicator}>Acey is generating {selectedSkill}...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={`Describe the ${selectedSkill.toLowerCase()} you want to generate...`}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.generateButton, styles.generateButtonDisabled]} 
          onPress={handleGenerate}
          disabled={!inputValue.trim() || isLoading}
        >
          <Text style={styles.generateButtonText}>
            {isLoading ? '...' : `Generate ${selectedSkill}`}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.memoryControls}>
        <TouchableOpacity 
          style={styles.memoryButton} 
          onPress={() => setOutputs(getMemoryOutputs())}
        >
          <Text style={styles.memoryButtonText}>🔄 Refresh Memory</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.memoryButton} 
          onPress={() => {
            Alert.alert(
              'Clear All Memory',
              'Remove all outputs from memory? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Clear All', 
                  style: 'destructive',
                  onPress: () => {
                    setOutputs([]);
                    setMessages(prev => prev.filter(m => m.type !== 'output'));
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.memoryButtonText}>🗑️ Clear All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Mock functions for graphics and audio generation
async function generateGraphics(request: any): Promise<{ output: GeneratedOutput }> {
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  return {
    output: {
      id: generateOutputId(),
      skill: 'GraphicsWizard',
      content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfCAYAAABg...', // Mock base64 image
      metadata: {
        description: `Generated graphic for: ${request.prompt}`,
        dimensions: { width: 800, height: 600 },
        format: 'PNG',
        size: 25000,
        performanceMetrics: {
          renderTime: Math.random() * 2000,
          quality: 0.9
        }
      },
      timestamp: Date.now(),
      filename: 'graphic.png'
    }
  };
}

async function generateAudio(request: any): Promise<{ output: GeneratedOutput }> {
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  return {
    output: {
      id: generateOutputId(),
      skill: 'AudioMaestro',
      content: new ArrayBuffer(1024), // Mock audio buffer
      metadata: {
        description: `Generated audio for: ${request.prompt}`,
        duration: request.skillSpecific?.duration || 30,
        format: 'MP3',
        size: 1024,
        performanceMetrics: {
          processingTime: Math.random() * 3000,
          quality: 0.85
        }
      },
      timestamp: Date.now(),
      filename: 'audio.mp3'
    }
  };
}

function generateOutputId(): string {
  return `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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
  analyticsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  analyticsButtonText: {
    fontSize: 12,
    color: '#fff',
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
    marginBottom: 12,
  },
  analyticsSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  analyticsItem: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  skillSelector: {
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
  skillButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedSkillButton: {
    backgroundColor: '#007AFF',
  },
  unselectedSkillButton: {
    backgroundColor: '#444',
  },
  skillButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  messages: {
    flex: 1,
    padding: 16,
  },
  message: {
    marginVertical: 4,
    maxWidth: '85%',
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
  skillTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  expandButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  expandButtonText: {
    fontSize: 10,
    color: '#fff',
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
  imageContainer: {
    alignItems: 'center',
    padding: 12,
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  audioContainer: {
    alignItems: 'center',
    padding: 12,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 6,
  },
  audioIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  audioText: {
    fontSize: 14,
    color: '#fff',
  },
  audioInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  expandedMetadata: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  metadataTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  metadataItem: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  downloadButton: {
    backgroundColor: '#007AFF',
  },
  learnButton: {
    backgroundColor: '#FF9500',
  },
  discardButton: {
    backgroundColor: '#FF3B30',
  },
  batchActions: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#252525',
    justifyContent: 'space-around',
  },
  batchButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  downloadBatchButton: {
    backgroundColor: '#007AFF',
  },
  learnBatchButton: {
    backgroundColor: '#FF9500',
  },
  discardBatchButton: {
    backgroundColor: '#FF3B30',
  },
  batchButtonText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
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
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 24,
    paddingHorizontal: 20,
  },
  generateButtonDisabled: {
    backgroundColor: '#555',
  },
  generateButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
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
  memoryButton: {
    backgroundColor: '#444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  memoryButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  // Skill-specific colors
  CodeHelper: {
    backgroundColor: '#2C3E50',
    borderLeftColor: '#3498DB',
  },
  GraphicsWizard: {
    backgroundColor: '#1A1A1A',
    borderLeftColor: '#9B59B6',
  },
  AudioMaestro: {
    backgroundColor: '#2C3E50',
    borderLeftColor: '#E74C3C',
  },
});
