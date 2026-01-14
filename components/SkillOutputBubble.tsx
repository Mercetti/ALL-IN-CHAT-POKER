import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { GeneratedOutput, SkillType } from '../types/skills';
import { ReviewFeedbackStore } from '../utils/linkReviewSystem';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface SkillOutputBubbleProps {
  output: GeneratedOutput;
  onApprove: (id: string) => void;
  onNeedsImprovement: (id: string) => void;
  onComment: (id: string) => void;
}

export const SkillOutputBubble: React.FC<SkillOutputBubbleProps> = ({
  output,
  onApprove,
  onNeedsImprovement,
  onComment,
}) => {
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedRating, setSelectedRating] = useState<'approve' | 'needs_improvement' | null>(null);

  const feedbackStore = ReviewFeedbackStore.getInstance();

  const handleDownload = async () => {
    try {
      let fileUri = `${FileSystem.documentDirectory}${output.id}`;
      
      if (output.contentType === 'Code' || output.contentType === 'Text') {
        fileUri += '.txt';
        await FileSystem.writeAsStringAsync(fileUri, output.summary || '');
      } else if (output.contentType === 'Audio') {
        fileUri += '.mp3';
        // Handle audio download - would need actual audio data
        await FileSystem.writeAsStringAsync(fileUri, 'Audio file placeholder');
      } else if (output.contentType === 'Image') {
        fileUri += '.png';
        // Handle image download - would need actual image data
        await FileSystem.writeAsStringAsync(fileUri, 'Image file placeholder');
      }
      
      await Sharing.shareAsync(fileUri, {
        mimeType: output.contentType === 'Code' ? 'text/plain' : 
                 output.contentType === 'Image' ? 'image/png' : 
                 output.contentType === 'Audio' ? 'audio/mpeg' : 'text/plain',
        dialogTitle: `Share ${output.skill} Output`
      });
    } catch (err) {
      console.error('Download failed:', err);
      Alert.alert('Download Error', 'Failed to download file. Please try again.');
    }
  };

  const handleApprove = () => {
    if (!selectedRating) return;

    const feedback = {
      type: 'approve' as const,
      trustScore: 1.0,
      timestamp: Date.now()
    };

    feedbackStore.storeFeedback(output.id, feedback);
    
    Alert.alert(
      'Feedback Submitted',
      'Thank you for approving this output! This helps improve Acey\'s learning.',
      [{ text: 'OK', style: 'default' }]
    );

    onApprove(output.id);
    setSelectedRating(null);
  };

  const handleNeedsImprovement = () => {
    if (!selectedRating) return;

    const feedback = {
      type: 'needs_improvement' as const,
      comment: comment.trim() || undefined,
      trustScore: 0.5,
      timestamp: Date.now()
    };

    feedbackStore.storeFeedback(output.id, feedback);
    
    Alert.alert(
      'Feedback Submitted',
      'Thank you for your feedback! This helps improve Acey\'s performance.',
      [{ text: 'OK', style: 'default' }]
    );

    onNeedsImprovement(output.id);
    setComment('');
    setSelectedRating(null);
    setFeedbackModalVisible(false);
  };

  const handleComment = () => {
    setSelectedRating('needs_improvement');
    setFeedbackModalVisible(true);
  };

  const getSkillIcon = (skill: SkillType): string => {
    const icons = {
      CodeHelper: '💻',
      GraphicsWizard: '🎨',
      AudioMaestro: '🎵',
      StreamAnalyticsPro: '📊',
      AICoHostGames: '🎮',
      CustomMiniAceyPersona: '🤖',
      DonationIncentiveManager: '💰',
      DynamicAlertDesigner: '⚠️',
      ExternalLinkReview: '🔗'
    };
    
    return icons[skill] || '🔧';
  };

  const getSkillColor = (skill: SkillType): string => {
    const colors = {
      CodeHelper: '#2C3E50',
      GraphicsWizard: '#8E44AD',
      AudioMaestro: '#27AE60',
      StreamAnalyticsPro: '#2980B9',
      AICoHostGames: '#E74C3C',
      CustomMiniAceyPersona: '#9C27B0',
      DonationIncentiveManager: '#F39C12',
      DynamicAlertDesigner: '#D35400',
      ExternalLinkReview: '#7B1FA2'
    };
    
    return colors[skill] || '#666';
  };

  const renderContentPreview = () => {
    if (output.contentType === 'Code') {
      return (
        <View style={styles.codePreview}>
          <Text style={styles.codeText}>
            {output.summary?.substring(0, 200) || 'Code content...'}
            {output.summary && output.summary.length > 200 ? '...' : ''}
          </Text>
        </View>
      );
    } else if (output.contentType === 'Image') {
      return (
        <View style={styles.imagePreview}>
          <Text style={styles.imageIcon}>🖼️</Text>
          <Text style={styles.imageText}>Image content ready for download</Text>
        </View>
      );
    } else if (output.contentType === 'Audio') {
      return (
        <View style={styles.audioPreview}>
          <Text style={styles.audioIcon}>🎵</Text>
          <Text style={styles.audioText}>Audio content ready for download</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.textPreview}>
          <Text style={styles.textContent}>
            {output.summary?.substring(0, 300) || 'Text content...'}
            {output.summary && output.summary.length > 300 ? '...' : ''}
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={[styles.bubble, { backgroundColor: getSkillColor(output.skill) }]}>
      <View style={styles.header}>
        <Text style={styles.skillTitle}>
          {getSkillIcon(output.skill)} {output.skill}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(output.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      
      {renderContentPreview()}
      
      {output.logicOrSteps && output.logicOrSteps.length > 0 && (
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>📋 Key Steps:</Text>
          {output.logicOrSteps.slice(0, 3).map((step, index) => (
            <Text key={index} style={styles.step}>
              {index + 1}. {step}
            </Text>
          ))}
        </View>
      )}
      
      <View style={styles.feedbackButtons}>
        <TouchableOpacity 
          style={[styles.feedbackButton, styles.approveButton]} 
          onPress={() => setSelectedRating('approve')}
        >
          <Text style={styles.feedbackButtonText}>👍 Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.feedbackButton, styles.improveButton]} 
          onPress={handleComment}
        >
          <Text style={styles.feedbackButtonText}>👎 Needs Improvement</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.feedbackButton, styles.commentButton]} 
          onPress={() => setSelectedRating('needs_improvement')}
        >
          <Text style={styles.feedbackButtonText}>✏️ Comment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.feedbackButton, styles.downloadButton]} 
          onPress={handleDownload}
        >
          <Text style={styles.feedbackButtonText}>💾 Download</Text>
        </TouchableOpacity>
      </View>

      {selectedRating === 'approve' && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleApprove}
        >
          <Text style={styles.actionButtonText}>Submit Approval</Text>
        </TouchableOpacity>
      )}

      {/* Comment Modal */}
      <Modal
        visible={feedbackModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💬 Add Detailed Feedback</Text>
            
            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={4}
              placeholder="Enter your detailed feedback here..."
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setFeedbackModalVisible(false);
                  setSelectedRating(null);
                  setComment('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitModalButton]}
                onPress={handleNeedsImprovement}
              >
                <Text style={styles.modalButtonText}>Submit Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    marginVertical: 8,
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 12,
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
    marginBottom: 12,
  },
  skillTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
  },
  
  // Content preview styles
  codePreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#f8f8f2',
    lineHeight: 16,
  },
  imagePreview: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    marginBottom: 12,
  },
  imageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imageText: {
    fontSize: 14,
    color: '#fff',
  },
  audioPreview: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    marginBottom: 12,
  },
  audioIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  audioText: {
    fontSize: 14,
    color: '#fff',
  },
  textPreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textContent: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  
  // Steps container
  stepsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 6,
  },
  step: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 3,
    lineHeight: 18,
  },
  
  // Feedback button styles
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
  },
  feedbackButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  improveButton: {
    backgroundColor: '#FF9800',
  },
  commentButton: {
    backgroundColor: '#2196F3',
  },
  downloadButton: {
    backgroundColor: '#9C27B0',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  commentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelModalButton: {
    backgroundColor: '#666',
  },
  submitModalButton: {
    backgroundColor: '#4CAF50',
  },
});

export default SkillOutputBubble;
