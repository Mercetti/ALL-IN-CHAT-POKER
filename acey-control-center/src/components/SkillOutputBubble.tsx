import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import useApprovalWorkflow from '../hooks/useApprovalWorkflow';
import { DatasetEntry } from '../services/datasetService';

interface SkillOutputBubbleProps {
  skillId: string;
  skillType: 'code' | 'audio' | 'graphics' | 'link';
  output: any;
  input: any;
  timestamp: string;
  userToken: string;
  onApprove?: (entry: DatasetEntry) => void;
  onReject?: () => void;
}

export default function SkillOutputBubble({
  skillId,
  skillType,
  output,
  input,
  timestamp,
  userToken,
  onApprove,
  onReject
}: SkillOutputBubbleProps) {
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const { approveOutput, isApproving } = useApprovalWorkflow(userToken);

  const getSkillIcon = (type: string) => {
    switch (type) {
      case 'code': return '💻';
      case 'audio': return '🎵';
      case 'graphics': return '🎨';
      case 'link': return '🔗';
      default: return '🤖';
    }
  };

  const getSkillColor = (type: string) => {
    switch (type) {
      case 'code': return '#007AFF';
      case 'audio': return '#AF52DE';
      case 'graphics': return '#FF9500';
      case 'link': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const handleApprove = async () => {
    const entry: DatasetEntry = {
      skillId,
      input,
      output,
      approvedBy: 'current_user',
      timestamp: new Date().toISOString(),
      skillType,
      tier: 'Pro',
      trustScore: 0.85,
      metadata: {
        processingTime: 1500,
        modelVersion: '1.2.0',
        validationPassed: true,
        userFeedback: comment
      }
    };

    const success = await approveOutput(entry);
    if (success) {
      Alert.alert('✅ Approved', 'Output has been saved to the learning dataset.');
      onApprove?.(entry);
      setShowCommentModal(false);
      setComment('');
    }
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Output',
      'Are you sure you want to reject this output? It will not be used for learning.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: () => {
            onReject?.();
            Alert.alert('Rejected', 'Output was rejected.');
          }
        }
      ]
    );
  };

  const handleComment = () => {
    setShowCommentModal(true);
  };

  const handleDownload = () => {
    // Create downloadable content based on skill type
    let content = '';
    let filename = '';

    switch (skillType) {
      case 'code':
        content = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
        filename = `code_${skillId}_${Date.now()}.txt`;
        break;
      case 'audio':
        content = JSON.stringify({ audioData: output, metadata: { skillId, timestamp } }, null, 2);
        filename = `audio_${skillId}_${Date.now()}.json`;
        break;
      case 'graphics':
        content = JSON.stringify({ graphicsData: output, metadata: { skillId, timestamp } }, null, 2);
        filename = `graphics_${skillId}_${Date.now()}.json`;
        break;
      case 'link':
        content = JSON.stringify(output, null, 2);
        filename = `link_review_${skillId}_${Date.now()}.json`;
        break;
    }

    // In a real app, this would trigger a download
    Alert.alert('Download', `Content prepared for download: ${filename}`);
  };

  const renderContentPreview = () => {
    switch (skillType) {
      case 'code':
        return (
          <Text style={styles.codePreview}>
            {typeof output === 'string' ? output.slice(0, 200) + (output.length > 200 ? '...' : '') : JSON.stringify(output, null, 2).slice(0, 200) + '...'}
          </Text>
        );
      case 'audio':
        return (
          <View style={styles.mediaPreview}>
            <Text style={styles.mediaIcon}>🎵</Text>
            <Text style={styles.mediaText}>Audio Generated</Text>
            <Text style={styles.mediaSubtext}>Duration: ~30 seconds</Text>
          </View>
        );
      case 'graphics':
        return (
          <View style={styles.mediaPreview}>
            <Text style={styles.mediaIcon}>🎨</Text>
            <Text style={styles.mediaText}>Graphics Generated</Text>
            <Text style={styles.mediaSubtext}>Style: Modern/Neon</Text>
          </View>
        );
      case 'link':
        return (
          <View style={styles.linkPreview}>
            <Text style={styles.linkStatus}>✅ Safe</Text>
            <Text style={styles.linkText}>Content review completed</Text>
          </View>
        );
      default:
        return <Text style={styles.defaultPreview}>{JSON.stringify(output).slice(0, 100)}...</Text>;
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: getSkillColor(skillType) }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.skillIcon}>{getSkillIcon(skillType)}</Text>
          <View>
            <Text style={styles.skillName}>{skillId}</Text>
            <Text style={styles.timestamp}>
              {new Date(timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>
        <Text style={[styles.skillType, { color: getSkillColor(skillType) }]}>
          {skillType.toUpperCase()}
        </Text>
      </View>

      {/* Content Preview */}
      <View style={styles.content}>
        {renderContentPreview()}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={handleApprove}
          disabled={isApproving}
        >
          <Text style={styles.actionButtonText}>
            {isApproving ? 'Approving...' : '✅'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.commentButton]}
          onPress={handleComment}
        >
          <Text style={styles.actionButtonText}>💬</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleReject}
        >
          <Text style={styles.actionButtonText}>❌</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton]}
          onPress={handleDownload}
        >
          <Text style={styles.actionButtonText}>⬇️</Text>
        </TouchableOpacity>
      </View>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Comment (Optional)</Text>
            <Text style={styles.modalSubtitle}>
              Help improve Acey by providing feedback on this output
            </Text>
            
            <TextInput
              style={styles.commentInput}
              multiline
              value={comment}
              onChangeText={setComment}
              placeholder="Great code structure, clear logic..."
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCommentModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleApprove}
              >
                <Text style={styles.modalButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skillIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  timestamp: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  skillType: {
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
  },
  codePreview: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#1d1d1f',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },
  mediaPreview: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  mediaIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mediaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  mediaSubtext: {
    fontSize: 14,
    color: '#8e8e93',
  },
  linkPreview: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0fff4',
    borderRadius: 8,
  },
  linkStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34c759',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#1d1d1f',
  },
  defaultPreview: {
    fontSize: 14,
    color: '#1d1d1f',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#e8f5e8',
  },
  commentButton: {
    backgroundColor: '#e8f4ff',
  },
  rejectButton: {
    backgroundColor: '#ffe8e8',
  },
  downloadButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1d1d1f',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 20,
    textAlign: 'center',
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1d1d1f',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
