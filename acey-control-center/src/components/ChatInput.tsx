import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SkillType } from '../types/skills';

interface ChatInputProps {
  onSubmit: (skill: SkillType, input: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit }) => {
  const [skill, setSkill] = useState<SkillType>('ExternalLinkReview');
  const [input, setInput] = useState('');
  const [showSkillSelector, setShowSkillSelector] = useState(false);

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(skill, input);
      setInput('');
    } else {
      Alert.alert('Input Required', 'Please enter a link, code prompt, or request.');
    }
  };

  const getSkillIcon = (skillType: SkillType) => {
    const icons: Record<SkillType, string> = {
      'ExternalLinkReview': '🔗',
      'CodeHelper': '💻',
      'GraphicsWizard': '🎨',
      'AudioMaestro': '🎵',
      'StreamAnalyticsPro': '📊',
      'AICoHostGames': '🎮',
      'CustomMiniAceyPersona': '🤖',
      'DonationIncentiveManager': '💰',
      'DynamicAlertDesigner': '⚠️'
    };
    return icons[skillType] || '🤖';
  };

  const getSkillName = (skillType: SkillType) => {
    const names: Record<SkillType, string> = {
      'ExternalLinkReview': 'Link Review',
      'CodeHelper': 'Code Helper',
      'GraphicsWizard': 'Graphics',
      'AudioMaestro': 'Audio',
      'StreamAnalyticsPro': 'Analytics',
      'AICoHostGames': 'AI Games',
      'CustomMiniAceyPersona': 'Mini-Acey',
      'DonationIncentiveManager': 'Donations',
      'DynamicAlertDesigner': 'Alerts'
    };
    return names[skillType] || 'Unknown';
  };

  return (
    <View style={styles.container}>
      {/* Compact Skill Selector */}
      <View style={styles.compactSkillSelector}>
        <TouchableOpacity
          style={styles.skillToggle}
          onPress={() => setShowSkillSelector(!showSkillSelector)}
        >
          <Text style={styles.skillToggleText}>
            {getSkillIcon(skill)} {getSkillName(skill)}
          </Text>
        </TouchableOpacity>
        
        {showSkillSelector && (
          <View style={styles.skillDropdown}>
            {Object.keys({
              'ExternalLinkReview': '🔗 Link Review',
              'CodeHelper': '💻 Code Helper',
              'GraphicsWizard': '🎨 Graphics Wizard',
              'AudioMaestro': '🎵 Audio Maestro',
              'StreamAnalyticsPro': '📊 Stream Analytics',
              'AICoHostGames': '🎮 AI Co-Host Games',
              'CustomMiniAceyPersona': '🤖 Custom Mini-Acey',
              'DonationIncentiveManager': '💰 Donation Incentives',
              'DynamicAlertDesigner': '⚠️ Dynamic Alerts'
            }).map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.skillOption,
                  skill === key && styles.skillOptionSelected
                ]}
                onPress={() => {
                  setSkill(key as SkillType);
                  setShowSkillSelector(false);
                }}
              >
                <Text style={styles.skillOptionText}>
                  {skill === key ? '✓ ' : ''}{key.split(' ')[1]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      {/* Input Area */}
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
      
      {/* Send Button */}
      <TouchableOpacity 
        onPress={handleSubmit}
        style={styles.sendButton}
      >
        <Text style={styles.sendButtonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  compactSkillSelector: {
    position: 'relative',
    marginBottom: 12,
  },
  skillToggle: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  skillToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  skillDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    marginTop: 4,
    zIndex: 1000,
  },
  skillOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  skillOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  skillOptionText: {
    color: '#fff',
    fontSize: 14,
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
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
