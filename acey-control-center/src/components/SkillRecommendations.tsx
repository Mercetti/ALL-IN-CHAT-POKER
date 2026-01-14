import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SkillRecommendation {
  id: string;
  skillName: string;
  recommendation: string;
  confidence: number;
  basedOn: string;
  preview?: {
    type: 'image' | 'code' | 'audio';
    url?: string;
    content?: string;
  };
}

interface SkillRecommendationsProps {
  userToken: string;
  userRole?: string;
}

export default function SkillRecommendations({ userToken, userRole }: SkillRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);

  useEffect(() => {
    const loadRecommendations = async () => {
      // Mock cross-skill recommendations based on usage patterns
      const mockRecommendations: SkillRecommendation[] = [
        {
          id: 'rec_1',
          skillName: 'graphics_wizard',
          recommendation: 'Based on your audio usage, try graphics skills for multimedia content',
          confidence: 0.85,
          basedOn: 'Audio Maestro usage patterns',
          preview: {
            type: 'image',
            url: 'https://example.com/graphics-preview.jpg'
          }
        },
        {
          id: 'rec_2',
          skillName: 'code_helper',
          recommendation: 'Upgrade to Pro tier for advanced debugging features',
          confidence: 0.92,
          basedOn: 'Code analysis patterns',
          preview: {
            type: 'code',
            content: 'function advancedDebug(code) { /* AI-powered debugging */ }'
          }
        },
        {
          id: 'rec_3',
          skillName: 'link_review_pro',
          recommendation: 'Add security scanning for better link analysis',
          confidence: 0.78,
          basedOn: 'Security audit results',
          preview: {
            type: 'audio',
            url: 'https://example.com/security-audio.mp3'
          }
        }
      ];

      setRecommendations(mockRecommendations);
    };

    loadRecommendations();
  }, [userToken]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#34C759';
    if (confidence >= 0.6) return '#007AFF';
    return '#FF9500';
  };

  const handleUpgrade = (skillName: string) => {
    console.log('Upgrade recommended:', skillName);
    // Trigger upgrade flow
  };

  const handleDismiss = (recommendationId: string) => {
    setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💡 Skill Recommendations</Text>
        <Text style={styles.headerSubtitle}>
          Cross-skill insights based on your usage patterns
        </Text>
      </View>

      {recommendations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🤖</Text>
          <Text style={styles.emptyText}>No recommendations yet</Text>
          <Text style={styles.emptySubtext}>
            Keep using skills to generate personalized insights
          </Text>
        </View>
      ) : (
        recommendations.map((recommendation, index) => (
          <View key={recommendation.id} style={styles.recommendationItem}>
            {/* Header */}
            <View style={styles.recommendationHeader}>
              <View style={styles.recommendationInfo}>
                <Text style={styles.skillName}>{recommendation.skillName}</Text>
                <Text style={styles.recommendationText}>{recommendation.recommendation}</Text>
              </View>
              
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Confidence</Text>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(recommendation.confidence) }
                ]}>
                  <Text style={styles.confidenceValue}>
                    {Math.round(recommendation.confidence * 100)}%
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => handleDismiss(recommendation.id)}
              >
                <Text style={styles.dismissButtonText}>✗</Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            {recommendation.preview && (
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Preview</Text>
                {recommendation.preview.type === 'image' && (
                  <View style={styles.imagePreview}>
                    <Text style={styles.imagePlaceholder}>🖼️ Image Preview</Text>
                    <Text style={styles.imageText}>Graphics content example</Text>
                  </View>
                )}
                
                {recommendation.preview.type === 'code' && (
                  <View style={styles.codePreview}>
                    <Text style={styles.codePlaceholder}>
                      {recommendation.preview.content}
                    </Text>
                  </View>
                )}
                
                {recommendation.preview.type === 'audio' && (
                  <View style={styles.audioPreview}>
                    <Text style={styles.audioIcon}>🎵</Text>
                    <Text style={styles.audioText}>Security analysis audio</Text>
                  </View>
                )}
              </View>
            )}

            {/* Based On */}
            <View style={styles.basedOnSection}>
              <Text style={styles.basedOnLabel}>Based on:</Text>
              <Text style={styles.basedOnText}>{recommendation.basedOn}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.upgradeButton]}
                onPress={() => handleUpgrade(recommendation.skillName)}
              >
                <Text style={styles.actionButtonText}>🚀 Upgrade</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.detailsButton]}
                onPress={() => console.log('View details:', recommendation.id)}
              >
                <Text style={styles.actionButtonText}>📊 Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  recommendationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#AF52DE',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  dismissButton: {
    padding: 4,
  },
  dismissButtonText: {
    fontSize: 14,
    color: '#999',
  },
  previewSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  imagePreview: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
  },
  imagePlaceholder: {
    fontSize: 16,
    marginBottom: 4,
  },
  imageText: {
    fontSize: 12,
    color: '#666',
  },
  codePreview: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
  },
  codePlaceholder: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#1d1d1f',
    lineHeight: 16,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
  },
  audioIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  audioText: {
    fontSize: 12,
    color: '#333',
  },
  basedOnSection: {
    marginTop: 8,
  },
  basedOnLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  basedOnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
  },
  detailsButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});
