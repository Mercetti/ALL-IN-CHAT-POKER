import React, { useState } from 'react';
import { View, Text, TextInput, Button, Picker, StyleSheet, Alert } from 'react-native';
import { SkillType } from '../types/skills';

interface ChatInputProps {
  onSubmit: (skill: SkillType, input: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit }) => {
  const [skill, setSkill] = useState<SkillType>('ExternalLinkReview');
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(skill, input);
      setInput('');
    } else {
      Alert.alert('Input Required', 'Please enter a link, code prompt, or request.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.skillSelector}>
        <Text style={styles.selectorLabel}>Skill:</Text>
        <Picker
          selectedValue={skill}
          style={styles.picker}
          onValueChange={(value) => setSkill(value as SkillType)}
        >
          <Picker.Item label="🔗 Link Review" value="ExternalLinkReview" />
          <Picker.Item label="💻 Code Helper" value="CodeHelper" />
          <Picker.Item label="🎨 Graphics Wizard" value="GraphicsWizard" />
          <Picker.Item label="🎵 Audio Maestro" value="AudioMaestro" />
          <Picker.Item label="📊 Stream Analytics" value="StreamAnalyticsPro" />
          <Picker.Item label="🎮 AI Co-Host Games" value="AICoHostGames" />
          <Picker.Item label="🤖 Custom Mini-Acey" value="CustomMiniAceyPersona" />
          <Picker.Item label="💰 Donation Incentives" value="DonationIncentiveManager" />
          <Picker.Item label="⚠️ Dynamic Alerts" value="DynamicAlertDesigner" />
        </Picker>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder={
          skill === 'ExternalLinkReview' ? 'Enter GitHub, Gist, or documentation URL...' :
          skill === 'CodeHelper' ? 'Enter code generation prompt...' :
          skill === 'GraphicsWizard' ? 'Describe the image you want to create...' :
          skill === 'AudioMaestro' ? 'Describe the audio you want to generate...' :
          skill === 'StreamAnalyticsPro' ? 'Enter analytics request...' :
          skill === 'AICoHostGames' ? 'Describe the game you want to create...' :
          skill === 'CustomMiniAceyPersona' ? 'Describe the persona you want to create...' :
          skill === 'DonationIncentiveManager' ? 'Describe the donation incentives you want to create...' :
          skill === 'DynamicAlertDesigner' ? 'Describe the alert you want to create...' :
          'Enter your request...'
        }
        value={input}
        onChangeText={setInput}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
      
      <Button 
        title="Send" 
        onPress={handleSubmit}
        style={styles.sendButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  skillSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectorLabel: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 14,
  },
  picker: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    color: '#fff',
  },
  input: {
    backgroundColor: '#2d2d2d',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#444',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
