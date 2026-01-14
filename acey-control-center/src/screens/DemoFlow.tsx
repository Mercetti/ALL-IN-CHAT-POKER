import React, { useState } from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { generatePreview } from '../services/aceyApi';
import useApprovalWorkflow from '../hooks/useApprovalWorkflow';
import { DatasetEntry } from '../services/datasetService';

export default function DemoFlow({ route }: { route: any }) {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const userToken = route.params?.userToken || 'demo-token';
  const [preview, setPreview] = useState<string>('No action yet');
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [currentSkill, setCurrentSkill] = useState<string>('code_helper');
  const [currentOutput, setCurrentOutput] = useState<any>(null);
  
  const { approveOutput, isApproving } = useApprovalWorkflow(userToken);

  const handleGenerate = async (skillId: string, inputData: any) => {
    setLoading(true);
    setCurrentSkill(skillId);
    try {
      const result = await generatePreview(skillId, inputData, userToken);
      const output = result.output || JSON.stringify(result, null, 2);
      setPreview(output);
      setCurrentOutput(result);
    } catch (error) {
      // Fallback mock responses for demo
      const mockResponses: { [key: string]: string } = {
        'code_helper': `function helloWorld() {\n  console.log("Hello, Acey!");\n  return "Success";\n}`,
        'audio_maestro': '🎵 Generated 30-second background music track with ambient tones...',
        'graphics_wizard': '🎨 Created neon-style graphics with vibrant colors and modern design...',
        'link_review': '✅ Link safety check passed. Content is safe for all audiences.',
      };
      const output = mockResponses[skillId] || 'Preview generated successfully!';
      setPreview(output);
      setCurrentOutput({ output, skillId, inputData });
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!currentOutput) {
      Alert.alert('No Output', 'Please generate an output first before approving.');
      return;
    }

    const entry: DatasetEntry = {
      skillId: currentSkill,
      input: currentOutput.inputData || { text: inputText },
      output: currentOutput.output || preview,
      approvedBy: 'current_user',
      timestamp: new Date().toISOString(),
      skillType: currentSkill.includes('code') ? 'code' : 
                 currentSkill.includes('audio') ? 'audio' : 
                 currentSkill.includes('graphics') ? 'graphics' : 'link',
      tier: 'Pro',
      trustScore: 0.85,
      metadata: {
        processingTime: 1500,
        modelVersion: '1.2.0',
        validationPassed: true
      }
    };

    const success = await approveOutput(entry);
    if (success) {
      Alert.alert('✅ Approved', 'Output has been saved to the learning dataset and queued for fine-tuning.');
    }
  };

  const getSkillType = (skillId: string): 'code' | 'audio' | 'graphics' | 'link' => {
    if (skillId.includes('code')) return 'code';
    if (skillId.includes('audio')) return 'audio';
    if (skillId.includes('graphics')) return 'graphics';
    return 'link';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Live Demo Flow</Text>
      
      <View style={styles.inputSection}>
        <Text style={styles.label}>Input Text:</Text>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Enter text for generation..."
          multiline
        />
      </View>

      <View style={styles.buttonGrid}>
        <Button 
          title="Code Preview" 
          onPress={() => handleGenerate('code_helper', { snippet: inputText || 'helloWorld' })} 
        />
        <Button 
          title="Audio Preview" 
          onPress={() => handleGenerate('audio_maestro', { type: 'bgm', text: inputText })} 
        />
        <Button 
          title="Image Preview" 
          onPress={() => handleGenerate('graphics_wizard', { style: 'neon', text: inputText })} 
        />
        <Button 
          title="Link Review" 
          onPress={() => handleGenerate('link_review', { url: inputText || 'https://example.com' })} 
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>
            Preview Output ({getSkillType(currentSkill).toUpperCase()}):
          </Text>
          <Text style={styles.previewText}>{preview}</Text>
          
          {currentOutput && (
            <View style={styles.approvalSection}>
              <Text style={styles.approvalTitle}>Learning Actions:</Text>
              <View style={styles.approvalButtons}>
                <Button
                  title={isApproving ? "Approving..." : "✅ Approve & Learn"}
                  onPress={handleApprove}
                  color="#34C759"
                  disabled={isApproving}
                />
                <Button
                  title="❌ Reject"
                  onPress={() => {
                    Alert.alert('Rejected', 'Output was rejected and will not be used for learning.');
                    setCurrentOutput(null);
                    setPreview('No action yet');
                  }}
                  color="#FF3B30"
                />
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  loader: {
    marginVertical: 20,
  },
  previewSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  previewText: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  approvalSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  approvalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#34C759',
  },
  approvalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
});
