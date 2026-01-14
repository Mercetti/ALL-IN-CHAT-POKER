// components/OwnerSkillApproval.tsx
import React from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import CodeSnippet from './CodeSnippet';

interface SkillProposal {
  id: string;
  skillName: string;
  skillType: string;
  description: string;
  preview?: string;
  username?: string;
  createdAt: string;
}

interface OwnerSkillApprovalProps {
  skillProposal: SkillProposal;
  onApprove: (proposalId: string) => void;
  onReject: (proposalId: string) => void;
}

export default function OwnerSkillApproval({ skillProposal, onApprove, onReject }: OwnerSkillApprovalProps) {
  const { skillName, skillType, description, preview } = skillProposal;

  const handlePlayAudio = async () => {
    if (preview) {
      const { sound } = await Audio.Sound.createAsync({ uri: preview });
      await sound.playAsync();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.skillName}>{skillName}</Text>
      <Text style={styles.description}>{description}</Text>

      {/* Preview based on skill type */}
      {preview && skillType === 'graphics' && (
        <Image source={{ uri: preview }} style={styles.imagePreview} />
      )}
      
      {preview && skillType === 'audio' && (
        <Button title="Play Audio Preview" onPress={handlePlayAudio} color="#FF9500" />
      )}
      
      {preview && skillType === 'code' && <CodeSnippet snippet={preview} />}

      {/* Approval Actions */}
      <View style={styles.actions}>
        <Button 
          title="Approve" 
          onPress={() => onApprove(skillProposal.id)} 
          color="#34C759" 
        />
        <Button 
          title="Reject" 
          onPress={() => onReject(skillProposal.id)} 
          color="#FF3B30" 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  skillName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  imagePreview: {
    width: 200,
    height: 120,
    borderRadius: 8,
    marginBottom: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});
