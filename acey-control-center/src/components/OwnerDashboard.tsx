import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { fetchFineTuneStatus, fetchDatasetMetrics, fetchSkillApprovals } from '../services/aceyMobileOrchestrator';

interface FineTuneStatus {
  progress: number;
  lastRun: string;
  datasetSize: number;
  estimatedCompletion: string;
}

interface DatasetMetrics {
  qualityScore: number;
  provenanceCount: number;
  trustDecay: number;
  memoryCorruption: boolean;
  hallucinationRate: number;
}

interface Approval {
  id: string;
  skillName: string;
  type: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  submittedBy: string;
  data?: {
    read?: boolean;
  };
}

interface OwnerDashboardProps {
  userToken: string;
}

export default function OwnerDashboard({ userToken }: OwnerDashboardProps) {
  const [fineTuneStatus, setFineTuneStatus] = useState<FineTuneStatus | null>(null);
  const [datasetMetrics, setDatasetMetrics] = useState<DatasetMetrics | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOwnerData = async () => {
    try {
      const [tuneStatus, metrics, approvalList] = await Promise.all([
        fetchFineTuneStatus(userToken),
        fetchDatasetMetrics(userToken),
        fetchSkillApprovals(userToken)
      ]);
      
      setFineTuneStatus(tuneStatus);
      setDatasetMetrics(metrics);
      setApprovals(approvalList);
    } catch (error) {
      console.error('Failed to load owner data:', error);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, [userToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOwnerData();
    setRefreshing(false);
  };

  const handleApprove = async (approvalId: string) => {
    try {
      // Trigger approval API call
      console.log('Approving:', approvalId);
      await loadOwnerData(); // Refresh data
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      // Trigger rejection API call
      console.log('Rejecting:', approvalId);
      await loadOwnerData(); // Refresh data
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return '#34C759';
    if (progress >= 70) return '#007AFF';
    if (progress >= 40) return '#FF9500';
    return '#FF3B30';
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return '#34C759';
    if (score >= 70) return '#007AFF';
    if (score >= 50) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Acey Owner Dashboard</Text>
      </View>

      {/* LLM Fine-Tune Status */}
      {fineTuneStatus && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 LLM Fine-Tune Status</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${fineTuneStatus.progress}%`, backgroundColor: getProgressColor(fineTuneStatus.progress) }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{fineTuneStatus.progress}%</Text>
            </View>
            
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Dataset Size</Text>
                <Text style={styles.metricValue}>{fineTuneStatus.datasetSize.toLocaleString()} entries</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Last Run</Text>
                <Text style={styles.metricValue}>{new Date(fineTuneStatus.lastRun).toLocaleString()}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Est. Completion</Text>
                <Text style={styles.metricValue}>{fineTuneStatus.estimatedCompletion}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Dataset Metrics */}
      {datasetMetrics && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Dataset Metrics</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Quality Score</Text>
                <Text style={[styles.metricValue, { color: getQualityColor(datasetMetrics.qualityScore) }]}>
                  {datasetMetrics.qualityScore.toFixed(1)}
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Provenance Graphs</Text>
                <Text style={styles.metricValue}>{datasetMetrics.provenanceCount.toLocaleString()}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Trust Decay</Text>
                <Text style={styles.metricValue}>{datasetMetrics.trustDecay.toFixed(2)}%</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Memory Corruption</Text>
                <Text style={[styles.metricValue, { color: datasetMetrics.memoryCorruption ? '#FF3B30' : '#34C759' }]}>
                  {datasetMetrics.memoryCorruption ? 'DETECTED' : 'CLEAN'}
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Hallucination Rate</Text>
                <Text style={styles.metricValue}>{(datasetMetrics.hallucinationRate * 100).toFixed(2)}%</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Pending Approvals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Pending Approvals</Text>
          <Text style={styles.approvalCount}>{approvals.length} items</Text>
        </View>
        <View style={styles.sectionContent}>
          {approvals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pending approvals</Text>
              <Text style={styles.emptySubtext}>All caught up!</Text>
            </View>
          ) : (
            approvals.map((item, index) => (
              <View key={item.id} style={styles.approvalItem}>
                {!item.data?.read && (
                  <View style={styles.unreadDot} />
                )}
                <View style={styles.approvalHeader}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.skillName}>{item.skillName}</Text>
                    <Text style={styles.skillType}>({item.type})</Text>
                    <Text style={styles.approvalStatus}>{item.status.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.submittedTime}>
                    {new Date(item.submittedAt).toLocaleString()}
                  </Text>
                </View>
                
                <Text style={styles.approvalDescription}>{item.description}</Text>
                
                <View style={styles.approvalActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(item.id)}
                  >
                    <Text style={styles.actionButtonText}>✓ Approve</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(item.id)}
                  >
                    <Text style={styles.actionButtonText}>✗ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
      )}
    </View>
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1d1d1f',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  sectionContent: {
    // Content styles defined per section
  },
  progressRow: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  approvalCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  approvalItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  approvalInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  skillType: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  approvalStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
    textTransform: 'uppercase',
  },
  submittedTime: {
    fontSize: 10,
    color: '#999',
  },
  approvalDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    marginBottom: 12,
  },
  approvalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
