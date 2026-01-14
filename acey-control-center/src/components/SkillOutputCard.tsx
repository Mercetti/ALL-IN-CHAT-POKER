import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { ApprovedOutput } from '../services/previewService';
import { canAccessSkill } from '../services/authService';

interface SkillOutputCardProps {
  output: ApprovedOutput;
  userAccess?: any;
  onApprove?: (output: ApprovedOutput) => void;
  onDownload?: (output: ApprovedOutput) => void;
  onUnlock?: (skillType: string) => void;
}

export default function SkillOutputCard({ 
  output, 
  userAccess, 
  onApprove, 
  onDownload, 
  onUnlock 
}: SkillOutputCardProps) {
  const [audioLoading, setAudioLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const playAudio = async (url: string) => {
    try {
      setAudioLoading(true);
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      await sound.playAsync();
      setAudioLoading(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioLoading(false);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const getTrustBadge = () => {
    if (output.trustScore && output.trustScore > 0.9) {
      return { text: '🔥 High Trust', color: '#ff6b6b' };
    } else if (output.trustScore && output.trustScore > 0.8) {
      return { text: '✅ Trusted', color: '#51cf66' };
    } else if (output.trustScore) {
      return { text: '⚠️ Learning', color: '#ffd43b' };
    }
    return null;
  };

  const trustBadge = getTrustBadge();
  const canAccess = userAccess ? canAccessSkill(output.skillType, userAccess) : true;

  const renderOutput = () => {
    switch (output.skillType) {
      case 'code':
        return (
          <View style={styles.codeContainer}>
            <Text style={styles.code}>{output.output.snippet}</Text>
          </View>
        );
      
      case 'graphics':
        return (
          <Image 
            source={{ uri: output.output.url }} 
            style={styles.image}
            resizeMode="contain"
          />
        );
      
      case 'audio':
        return (
          <TouchableOpacity 
            style={[styles.button, styles.audioButton]}
            onPress={() => output.output.url && playAudio(output.output.url)}
            disabled={audioLoading}
          >
            <Text style={styles.buttonText}>
              {audioLoading ? 'Loading...' : '🎵 Play Audio'}
            </Text>
          </TouchableOpacity>
        );
      
      case 'link':
        return (
          <View style={styles.linkContainer}>
            <Text style={styles.link} numberOfLines={2}>
              {output.output.url || output.output.content}
            </Text>
          </View>
        );
      
      default:
        return (
          <Text style={styles.content}>{JSON.stringify(output.output, null, 2)}</Text>
        );
    }
  };

  if (!canAccess) {
    return (
      <View style={[styles.card, styles.lockedCard]}>
        <Text style={styles.lockedText}>🔒 {output.skillType.toUpperCase()} Skill Locked</Text>
        <TouchableOpacity 
          style={[styles.button, styles.unlockButton]}
          onPress={() => onUnlock?.(output.skillType)}
        >
          <Text style={styles.buttonText}>Unlock Skill</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.timestamp}>
            {new Date(output.timestamp).toLocaleTimeString()}
          </Text>
          <Text style={styles.skillType}>{output.skillType.toUpperCase()}</Text>
        </View>
        <View style={styles.headerRight}>
          {trustBadge && (
            <Text style={[styles.badge, { color: trustBadge.color }]}>
              {trustBadge.text}
            </Text>
          )}
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandButton}>{expanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderOutput()}

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.detailText}>ID: {output.id}</Text>
          {output.userId && (
            <Text style={styles.detailText}>User: {output.userId}</Text>
          )}
          {output.skillId && (
            <Text style={styles.detailText}>Skill: {output.skillId}</Text>
          )}
          {output.trustScore && (
            <Text style={styles.detailText}>
              Trust Score: {Math.round(output.trustScore * 100)}%
            </Text>
          )}
        </View>
      )}

      <View style={styles.actionButtons}>
        {onApprove && (
          <TouchableOpacity 
            style={[styles.button, styles.approveButton]} 
            onPress={() => onApprove(output)}
          >
            <Text style={styles.buttonText}>✓ Approve</Text>
          </TouchableOpacity>
        )}
        
        {onDownload && (
          <TouchableOpacity 
            style={[styles.button, styles.downloadButton]} 
            onPress={() => onDownload(output)}
          >
            <Text style={styles.buttonText}>⬇ Download</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedCard: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  skillType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  badge: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expandButton: {
    fontSize: 16,
    color: '#6c757d',
    padding: 4,
  },
  codeContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#495057',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  audioButton: {
    backgroundColor: '#6f42c1',
  },
  linkContainer: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  link: {
    color: '#0066cc',
    fontSize: 14,
  },
  content: {
    fontSize: 14,
    color: '#495057',
    marginVertical: 8,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  detailText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  downloadButton: {
    backgroundColor: '#17a2b8',
  },
  unlockButton: {
    backgroundColor: '#ffc107',
  },
  lockedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 12,
  },
});
