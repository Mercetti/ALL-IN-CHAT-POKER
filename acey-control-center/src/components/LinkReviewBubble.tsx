/**
 * Link Review Bubble Component
 * Displays link analysis results in the unified chat window
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { LinkReview, LinkType } from '../api/linkReview';

interface LinkReviewBubbleProps {
  review: LinkReview;
  onApprove?: (review: LinkReview) => void;
  onDownload?: (review: LinkReview) => void;
  onDiscard?: (review: LinkReview) => void;
}

const LinkTypeIcon: Record<LinkType, string> = {
  GitHubRepo: '📦',
  Gist: '📝',
  Documentation: '📚',
  Issue: '🐛',
  Media: '🖼️',
  Other: '🔗'
};

const RatingColor: Record<string, string> = {
  excellent: '#4CAF50',
  good: '#8BC34A',
  'needs-work': '#FF9800',
  poor: '#F44336'
};

export const LinkReviewBubble: React.FC<LinkReviewBubbleProps> = ({
  review,
  onApprove,
  onDownload,
  onDiscard
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleApprove = () => {
    Alert.alert(
      'Approve Review',
      'Add this analysis to Acey\'s learning memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: () => onApprove?.(review),
          style: 'default'
        }
      ]
    );
  };

  const handleDownload = () => {
    Alert.alert(
      'Download Content',
      'Download the analyzed content?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download', 
          onPress: () => onDownload?.(review),
          style: 'default'
        }
      ]
    );
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Review',
      'Remove this review from chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          onPress: () => onDiscard?.(review),
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{LinkTypeIcon[review.type]}</Text>
          <Text style={styles.url} numberOfLines={1}>
            {review.url}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {review.rating && (
            <View style={[styles.rating, { backgroundColor: RatingColor[review.rating] }]}>
              <Text style={styles.ratingText}>
                {review.rating.toUpperCase()}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandButton}>{expanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary */}
      <Text style={styles.summary}>{review.summary}</Text>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Highlights */}
          {review.highlights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ Highlights</Text>
              {review.highlights.map((highlight, index) => (
                <Text key={index} style={styles.bulletPoint}>
                  • {highlight}
                </Text>
              ))}
            </View>
          )}

          {/* Suggestions */}
          {review.suggestions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Suggestions</Text>
              {review.suggestions.map((suggestion, index) => (
                <Text key={index} style={styles.bulletPoint}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}

          {/* Processing Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Analysis Info</Text>
            <Text style={styles.infoText}>
              Type: {review.type}
            </Text>
            <Text style={styles.infoText}>
              Processing Time: {review.processingTime}ms
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.approveButton]} 
          onPress={handleApprove}
        >
          <Text style={styles.buttonText}>✓ Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.downloadButton]} 
          onPress={handleDownload}
        >
          <Text style={styles.buttonText}>⬇ Download</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.discardButton]} 
          onPress={handleDiscard}
        >
          <Text style={styles.buttonText}>✕ Discard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  url: {
    color: '#888',
    fontSize: 12,
    flex: 1,
  },
  rating: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  ratingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold' as const,
  },
  expandButton: {
    color: '#888',
    fontSize: 16,
    marginLeft: 8,
  },
  summary: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  expandedContent: {
    marginTop: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 8,
  },
  bulletPoint: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    marginBottom: 4,
  },
  infoText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginTop: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  downloadButton: {
    backgroundColor: '#2196F3',
  },
  discardButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
});

export default LinkReviewBubble;
