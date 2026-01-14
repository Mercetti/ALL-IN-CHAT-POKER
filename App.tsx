import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet } from 'react-native';
import { SkillOutputBubble } from './components/SkillOutputBubble';
import { ChatInput } from './components/ChatInput';
import { MemoryDashboard } from './components/MemoryDashboard';
import { GeneratedOutput, SkillType } from './types/skills';
import { aceyLLM } from './orchestrator/aceyLLM';
import { addToMemory, updateFeedback } from './memory/aceyLearningDataset';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';

export default function App() {
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  const { isMobile, isTablet } = useResponsiveLayout();

  const handleSubmitSkill = async (skill: SkillType, input: string) => {
    let output: GeneratedOutput | null = null;

    switch (skill) {
      case 'ExternalLinkReview':
        const review = await aceyLLM.reviewLink(input);
        output = {
          id: Date.now().toString(),
          skill,
          contentType: 'Text',
          summary: review.summary,
          logicOrSteps: review.actionablePoints,
          metadata: {
            suggestions: review.suggestions,
            confidence: review.confidence,
            url: input,
            linkType: review.linkType
          },
          timestamp: Date.now()
        };
        break;

      case 'CodeHelper':
        const code = await aceyLLM.generateCode(input);
        output = {
          id: Date.now().toString(),
          skill,
          contentType: 'Code',
          content: code,
          summary: code,
          logicOrSteps: ['Code generation', 'Syntax validation', 'Best practices applied'],
          metadata: {
            language: 'javascript',
            complexity: 'medium'
          },
          timestamp: Date.now()
        };
        break;

      case 'AudioMaestro':
        const audio = await aceyLLM.generateAudio(input);
        output = {
          id: Date.now().toString(),
          skill,
          contentType: 'Audio',
          content: JSON.stringify(audio),
          summary: 'Generated audio content',
          logicOrSteps: ['Audio synthesis', 'Format optimization', 'Quality enhancement'],
          metadata: audio,
          timestamp: Date.now()
        };
        break;

      case 'GraphicsWizard':
        const image = await aceyLLM.generateGraphics(input);
        output = {
          id: Date.now().toString(),
          skill,
          contentType: 'Image',
          content: JSON.stringify(image),
          summary: 'Generated graphics content',
          logicOrSteps: ['Image generation', 'Style application', 'Format optimization'],
          metadata: image,
          timestamp: Date.now()
        };
        break;

      default:
        console.log(`[App] Skill ${skill} not implemented yet`);
        return;
    }

    if (output) {
      addToMemory(output);
      setOutputs([...outputs, output]);
    }
  };

  const handleFeedback = (id: string, feedback: 'approve' | 'needs_improvement') => {
    const trustScore = feedback === 'approve' ? 1.0 : 0.5;
    updateFeedback(id, feedback, trustScore);
    
    // Queue approved outputs for LLM fine-tuning
    if (feedback === 'approve') {
      const pattern = {
        id,
        feedback,
        trustScore,
        timestamp: Date.now()
      };
      aceyLLM.queueFineTune(pattern);
    }
    
    // Update local state to reflect feedback
    setOutputs(prevOutputs => 
      prevOutputs.map(output => 
        output.id === id ? { ...output, feedback, trustScore } : output
      )
    );
  };

  const renderMainContent = () => {
    if (isMobile) {
      // Mobile Layout - Single Column
      return (
        <View style={styles.mobileContainer}>
          <ScrollView style={styles.chatContainer}>
            {outputs.map(output => (
              <SkillOutputBubble
                key={output.id}
                output={output}
                onApprove={(id) => handleFeedback(id, 'approve')}
                onNeedsImprovement={(id) => handleFeedback(id, 'needs_improvement')}
                onComment={(id) => handleFeedback(id, 'needs_improvement')}
              />
            ))}
          </ScrollView>
          
          <View style={styles.inputContainer}>
            <ChatInput onSubmit={handleSubmitSkill} />
          </View>
        </View>
      );
    } else if (isTablet) {
      // Tablet Layout - Two Columns
      return (
        <View style={styles.tabletContainer}>
          <View style={styles.chatPanel}>
            <ScrollView style={styles.chatContainer}>
              {outputs.map(output => (
                <SkillOutputBubble
                  key={output.id}
                  output={output}
                  onApprove={(id) => handleFeedback(id, 'approve')}
                  onNeedsImprovement={(id) => handleFeedback(id, 'needs_improvement')}
                  onComment={(id) => handleFeedback(id, 'needs_improvement')}
                />
              ))}
            </ScrollView>
            
            <View style={styles.inputContainer}>
              <ChatInput onSubmit={handleSubmitSkill} />
            </View>
          </View>
          
          <View style={styles.memoryPanel}>
            <MemoryDashboard />
          </View>
        </View>
      );
    } else {
      // Desktop Layout - Two Columns (same as tablet)
      return (
        <View style={styles.tabletContainer}>
          <View style={styles.chatPanel}>
            <ScrollView style={styles.chatContainer}>
              {outputs.map(output => (
                <SkillOutputBubble
                  key={output.id}
                  output={output}
                  onApprove={(id) => handleFeedback(id, 'approve')}
                  onNeedsImprovement={(id) => handleFeedback(id, 'needs_improvement')}
                  onComment={(id) => handleFeedback(id, 'needs_improvement')}
                />
              ))}
            </ScrollView>
            
            <View style={styles.inputContainer}>
              <ChatInput onSubmit={handleSubmitSkill} />
            </View>
          </View>
          
          <View style={styles.memoryPanel}>
            <MemoryDashboard />
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderMainContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Mobile styles
  mobileContainer: {
    flex: 1,
  },
  
  // Tablet/Desktop styles
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  chatPanel: {
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  memoryPanel: {
    flex: 1,
    backgroundColor: '#111',
    padding: 16,
  },
  chatContainer: {
    flex: 1,
    padding: 8,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
});
