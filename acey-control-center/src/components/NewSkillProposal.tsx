// components/NewSkillProposal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Picker, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { AceyMobileOrchestrator } from '../services/aceyMobileOrchestrator';
import CodeSnippet from './CodeSnippet';

interface NewSkillProposalProps {
  userToken: string;
  orchestrator: AceyMobileOrchestrator;
}

export default function NewSkillProposal({ userToken, orchestrator }: NewSkillProposalProps) {
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [skillType, setSkillType] = useState('code');
  const [preview, setPreview] = useState<any>(null);
  const [status, setStatus] = useState('Pending');

  // Generate asset preview on skill type or name change
  useEffect(() => {
    const generatePreview = async () => {
      if (skillName.trim() === '') return;
      const asset = await orchestrator.fetchSkillPreview({ skillName, skillType });
      setPreview(asset);
    };
    generatePreview();
  }, [skillName, skillType]);

  const handleSubmit = async () => {
    const result = await orchestrator.submitSkillProposal({ skillName, skillType, description, preview });
    setStatus(result.success ? 'Pending Approval' : 'Error');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Propose New Skill</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Skill Type</Text>
        <Picker
          selectedValue={skillType}
          onValueChange={(value) => setSkillType(value)}
          style={styles.picker}
        >
          <Picker.Item label="Code" value="code" />
          <Picker.Item label="Audio" value="audio" />
          <Picker.Item label="Graphics" value="graphics" />
          <Picker.Item label="Link Review" value="link" />
        </Picker>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Skill Name</Text>
        <TextInput
          placeholder="Enter skill name"
          value={skillName}
          onChangeText={setSkillName}
          style={styles.input}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          placeholder="Describe the skill functionality"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
        />
      </View>

      <Button title="Submit Proposal" onPress={handleSubmit} color="#007AFF" />

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Status: {status}</Text>
      </View>

      {/* Live Preview */}
      {preview && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Live Preview:</Text>
          {skillType === 'graphics' && (
            <Image 
              source={{ uri: preview }} 
              style={styles.imagePreview}
            />
          )}
          {skillType === 'audio' && (
            <Button 
              title="Play Audio Preview" 
              onPress={async () => { 
                const { sound } = await Audio.Sound.createAsync({ uri: preview }); 
                await sound.playAsync(); 
              }} 
              color="#FF9500"
            />
          )}
          {skillType === 'code' && <CodeSnippet snippet={preview} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  statusContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  previewContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  imagePreview: {
    width: 200,
    height: 120,
    borderRadius: 8,
  },
});
