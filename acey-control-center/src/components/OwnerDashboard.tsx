import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';

interface FineTuneStatus {
  progress: number;
  status: 'running' | 'completed' | 'failed';
  estimatedTime?: number;
}

interface DatasetMetrics {
  totalSamples: number;
  approvedSamples: number;
  pendingSamples: number;
  qualityScore: number;
}

interface Approval {
  id: string;
  type: 'skill' | 'response' | 'model';
  content: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
  data?: {
    read: boolean;
  };
}

const OwnerDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [fineTuneStatus, setFineTuneStatus] = useState<FineTuneStatus | null>(null);
  const [datasetMetrics, setDatasetMetrics] = useState<DatasetMetrics | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOwnerData().finally(() => setRefreshing(false));
  };

  const loadOwnerData = async () => {
    try {
      // Mock data for now
      setFineTuneStatus({
        progress: 75,
        status: 'running',
        estimatedTime: 15
      });
      
      setDatasetMetrics({
        totalSamples: 1250,
        approvedSamples: 980,
        pendingSamples: 270,
        qualityScore: 87.5
      });
      
      setApprovals([
        {
          id: '1',
          type: 'skill',
          content: 'New poker analysis skill',
          timestamp: new Date(),
          status: 'pending',
          data: { read: false }
        },
        {
          id: '2',
          type: 'response',
          content: 'Customer service response template',
          timestamp: new Date(Date.now() - 3600000),
          status: 'pending',
          data: { read: true }
        }
      ]);
    } catch (error) {
      console.error('Failed to load owner data:', error);
    }
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

  useEffect(() => {
    loadOwnerData();
  }, []);

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
          <View style={styles.progressContainer}>
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
          <Text style={styles.statusText}>
            Status: {fineTuneStatus.status}
            {fineTuneStatus.estimatedTime && ` • ~${fineTuneStatus.estimatedTime}min remaining`}
          </Text>
        </View>
      )}

      {/* Dataset Metrics */}
      {datasetMetrics && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Dataset Metrics</Text>
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{datasetMetrics.totalSamples}</Text>
              <Text style={styles.metricLabel}>Total Samples</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{datasetMetrics.approvedSamples}</Text>
              <Text style={styles.metricLabel}>Approved</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{datasetMetrics.pendingSamples}</Text>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: getQualityColor(datasetMetrics.qualityScore) }]}>
                {datasetMetrics.qualityScore.toFixed(1)}%
              </Text>
              <Text style={styles.metricLabel}>Quality Score</Text>
            </View>
          </View>
        </View>
      )}

      {/* Pending Approvals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚡ Pending Approvals</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {approvals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending approvals</Text>
            <Text style={styles.emptySubtext}>All caught up! 🎉</Text>
          </View>
        ) : (
          approvals.map((approval) => (
            <View key={approval.id} style={styles.approvalItem}>
              <View style={styles.approvalHeader}>
                <View style={styles.approvalInfo}>
                  <Text style={styles.approvalType}>{approval.type.toUpperCase()}</Text>
                  <Text style={styles.approvalContent}>{approval.content}</Text>
                  <Text style={styles.approvalTime}>
                    {approval.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
                {!approval.data?.read && <View style={styles.unreadDot} />}
              </View>
              
              <View style={styles.approvalActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(approval.id)}
                >
                  <Text style={styles.actionButtonText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(approval.id)}
                >
                  <Text style={styles.actionButtonText}>✗ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
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
    fontWeight: '600',
    color: '#1d1d1f',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
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
    fontStyle: 'italic',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  approvalItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingVertical: 16,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  approvalInfo: {
    flex: 1,
  },
  approvalType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  approvalContent: {
    fontSize: 14,
    color: '#1d1d1f',
    marginBottom: 4,
  },
  approvalTime: {
    fontSize: 12,
    color: '#666',
  },
  approvalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OwnerDashboard;
