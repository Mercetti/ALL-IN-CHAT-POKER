import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { stabilityApiService, FounderBrief } from '../../services/stabilityApiService';

export default function FounderBriefScreen() {
  const [brief, setBrief] = useState<FounderBrief | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchFounderBrief();
  }, [selectedDate]);

  const fetchFounderBrief = async () => {
    setIsLoading(true);
    try {
      const fetchedBrief = await stabilityApiService.getFounderBrief(selectedDate);
      setBrief(fetchedBrief);
    } catch (error) {
      console.error('Failed to fetch founder brief:', error);
      Alert.alert('Error', 'Failed to load founder brief');
    } finally {
      setIsLoading(false);
    }
  };

  const processAction = async (action: any, actionType: 'approve' | 'reject' | 'defer') => {
    try {
      const result = await stabilityApiService.processAlert(action.id, actionType);
      if (result.success) {
        Alert.alert('Success', `Action ${actionType}d successfully`);
        fetchFounderBrief(); // Refresh brief
      } else {
        Alert.alert('Error', result.message || 'Failed to process action');
      }
    } catch (error) {
      console.error('Failed to process action:', error);
      Alert.alert('Error', 'Failed to process action. Please try again.');
    }
  };

  const getLoadColor = (score: number) => {
    if (score >= 80) return '#EF4444';
    if (score >= 60) return '#F59E0B';
    return '#10B981';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderActionCard = (action: any, type: 'required' | 'optional') => (
    <View key={action.id} style={[styles.actionCard, type === 'required' && styles.requiredActionCard]}>
      <View style={styles.actionHeader}>
        <Text style={styles.actionCategory}>{action.category}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(action.priority) }]}>
          <Text style={styles.priorityText}>{action.priority.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.actionDescription}>{action.action}</Text>
      
      <View style={styles.actionFooter}>
        <View style={styles.timeEstimate}>
          <Ionicons name="time" size={14} color="#6B7280" />
          <Text style={styles.timeText}>{action.estimatedTime} min</Text>
        </View>
        
        {type === 'required' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => processAction(action, 'approve')}
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.optionalActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.reviewButton]}
              onPress={() => processAction(action, 'approve')}
            >
              <Ionicons name="eye" size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deferButton]}
              onPress={() => processAction(action, 'defer')}
            >
              <Ionicons name="time" size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Defer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading founder brief...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!brief) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load founder brief</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFounderBrief}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Founder Brief</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Brief Header */}
          <View style={styles.briefHeader}>
            <View style={styles.briefInfo}>
              <Text style={styles.briefDate}>{new Date(brief.date).toLocaleDateString()}</Text>
              <Text style={styles.briefSummary}>{brief.summary}</Text>
            </View>
            
            <View style={styles.cognitiveLoad}>
              <Text style={styles.loadLabel}>Cognitive Load</Text>
              <View style={[styles.loadIndicator, { backgroundColor: getLoadColor(brief.cognitiveLoadScore) }]}>
                <Text style={styles.loadScore}>{brief.cognitiveLoadScore}%</Text>
              </View>
            </View>
          </View>

          {/* System Health */}
          <View style={styles.healthCard}>
            <Text style={styles.cardTitle}>System Health</Text>
            <View style={styles.healthStatus}>
              <Ionicons 
                name={brief.systemHealth === 'healthy' ? 'checkmark-circle' : 'warning'} 
                size={24} 
                color={brief.systemHealth === 'healthy' ? '#10B981' : '#F59E0B'} 
              />
              <Text style={[
                styles.healthText,
                { color: brief.systemHealth === 'healthy' ? '#10B981' : '#F59E0B' }
              ]}>
                {brief.systemHealth.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Required Actions */}
          {brief.requiredActions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Required Actions ({brief.requiredActions.length})</Text>
              {brief.requiredActions.map(action => renderActionCard(action, 'required'))}
            </View>
          )}

          {/* Optional Reviews */}
          {brief.optionalReviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Optional Reviews ({brief.optionalReviews.length})</Text>
              {brief.optionalReviews.map(action => renderActionCard(action, 'optional'))}
            </View>
          )}

          {/* Recommendations */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Cognitive Load Management</Text>
            <View style={styles.recommendations}>
              <View style={styles.recommendationItem}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text style={styles.recommendationText}>
                  Focus on required actions first
                </Text>
              </View>
              <View style={styles.recommendationItem}>
                <Ionicons name="time" size={20} color="#3B82F6" />
                <Text style={styles.recommendationText}>
                  Batch similar tasks together
                </Text>
              </View>
              <View style={styles.recommendationItem}>
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <Text style={styles.recommendationText}>
                  Take breaks when load is high
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  briefHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  briefInfo: {
    flex: 1,
  },
  briefDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  briefSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cognitiveLoad: {
    alignItems: 'center',
    marginTop: 16,
  },
  loadLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  loadIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  loadScore: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requiredActionCard: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  actionDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  reviewButton: {
    backgroundColor: '#3B82F6',
  },
  deferButton: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  optionalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  infoCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  recommendations: {
    marginTop: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
