import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { GeneratedOutput, LinkReviewResult, ReviewFeedback } from '../types/skills';
import { analyzeExternalLink, ReviewFeedbackStore } from '../utils/linkReviewSystem';

interface LinkReviewBubbleProps {
  output: GeneratedOutput;
  onDownload: () => void;
  onDiscard: () => void;
  onStoreForLearning: (summary: string, logicOrSteps: string[], fixes?: string[]) => void;
}

export const LinkReviewBubble: React.FC<LinkReviewBubbleProps> = ({
  output,
  onDownload,
  onDiscard,
  onStoreForLearning
}) => {
  const [review, setReview] = useState<LinkReviewResult | null>(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedRating, setSelectedRating] = useState<'approve' | 'needs_improvement' | null>(null);

  const feedbackStore = ReviewFeedbackStore.getInstance();

  React.useEffect(() => {
    // Auto-analyze the link when component mounts
    if (output.skill === 'ExternalLinkReview' && typeof output.content === 'string') {
      analyzeLink(output.content as string);
    }
  }, [output.content]);

  const analyzeLink = async (url: string) => {
    try {
      const result = await analyzeExternalLink(url);
      setReview(result);
    } catch (err) {
      console.error('Error analyzing link:', err);
      Alert.alert('Analysis Error', 'Unable to analyze the external link. Please try again.');
    }
  };

  const handleApprove = () => {
    if (!review || !selectedRating) return;

    const feedback: ReviewFeedback = {
      type: 'approve',
      trustScore: 1.0,
      timestamp: Date.now()
    };

    feedbackStore.storeFeedback(output.id, feedback);
    
    Alert.alert(
      'Feedback Submitted',
      'Thank you for approving this external link! This helps improve Acey\'s recommendations.',
      [{ text: 'OK', style: 'default' }]
    );

    setSelectedRating(null);
  };

  const handleNeedsImprovement = () => {
    if (!review || !selectedRating) return;

    const feedback: ReviewFeedback = {
      type: 'needs_improvement',
      comment: comment.trim() || undefined,
      trustScore: 0.5,
      timestamp: Date.now()
    };

    feedbackStore.storeFeedback(output.id, feedback);
    
    Alert.alert(
      'Feedback Submitted',
      'Thank you for your feedback! This helps improve Acey\'s learning system.',
      [{ text: 'OK', style: 'default' }]
    );

    setComment('');
    setSelectedRating(null);
    setFeedbackModalVisible(false);
  };

  const handleComment = () => {
    setSelectedRating('needs_improvement');
    setFeedbackModalVisible(true);
  };

  const renderReviewContent = () => {
    if (!review) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔍 Analyzing external link...</Text>
        </View>
      );
    }

    return (
      <View style={styles.reviewContainer}>
        <View style={styles.reviewHeader}>
          <Text style={styles.confidenceBadge}>
            Confidence: {Math.round(review.confidence * 100)}%
          </Text>
          <Text style={styles.summary}>{review.summary}</Text>
        </View>

        {review.contentPreview && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Content Preview:</Text>
            <Text style={styles.previewText}>{review.contentPreview}</Text>
          </View>
        )}

        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>💡 Suggestions:</Text>
          {review.suggestions.map((suggestion, index) => (
            <Text key={index} style={styles.suggestion}>• {suggestion}</Text>
          ))}
        </View>

        <View style={styles.actionableContainer}>
          <Text style={styles.actionableTitle}>🎯 Actionable Steps:</Text>
          {review.actionablePoints.map((point, index) => (
            <Text key={index} style={styles.actionablePoint}>{index + 1}. {point}</Text>
          ))}
        </View>
      </View>
    );
  };

  const renderFeedbackButtons = () => (
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
    </View>
  );

  return (
    <View style={[styles.bubble, styles.ExternalLinkReview]}>
      <View style={styles.header}>
        <Text style={styles.skillTitle}>🔗 External Link Review</Text>
        <Text style={styles.timestamp}>
          {new Date(output.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      
      {renderReviewContent()}
      
      {review && (
        <>
          {renderFeedbackButtons()}
          
          {selectedRating === 'approve' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleApprove}
            >
              <Text style={styles.actionButtonText}>Submit Approval</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={styles.standardButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.downloadButton]} 
          onPress={onDownload}
        >
          <Text style={styles.buttonText}>Download</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.learnButton]} 
          onPress={() => onStoreForLearning(
            review?.summary || 'External link review',
            review?.actionablePoints || ['Content analysis'],
            ['Initial review version']
          )}
        >
          <Text style={styles.buttonText}>Store for Learning</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.discardButton]} 
          onPress={onDiscard}
        >
          <Text style={styles.buttonText}>Discard</Text>
        </TouchableOpacity>
      </View>

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
  
  // Review content styles
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  reviewContainer: {
    minHeight: 100,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  summary: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginLeft: 8,
  },
  previewContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  previewText: {
    fontSize: 12,
    color: '#ccc',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 6,
  },
  suggestion: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 3,
    lineHeight: 18,
  },
  actionableContainer: {
    marginBottom: 12,
  },
  actionableTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 6,
  },
  actionablePoint: {
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
  
  // Standard button styles
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  downloadButton: {
    backgroundColor: '#2196F3',
  },
  learnButton: {
    backgroundColor: '#4CAF50',
  },
  discardButton: {
    backgroundColor: '#f44336',
  },
  
  // Skill-specific color
  ExternalLinkReview: {
    backgroundColor: '#7B1FA2',
  },
});

export default LinkReviewBubble;
