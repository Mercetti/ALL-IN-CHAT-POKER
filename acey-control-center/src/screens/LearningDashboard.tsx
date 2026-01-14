import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, RefreshControl, Button } from 'react-native';
import { getLearningMetrics, getFineTuneHistory, getSkillTrustHistory, triggerManualFineTune, LearningMetrics } from '../services/metricsService';
import useNotifications from '../hooks/useNotifications';

interface FineTuneJob {
  id: string;
  timestamp: string;
  status: 'completed' | 'running' | 'failed';
  skillTypes: string[];
  entriesProcessed: number;
  accuracyImprovement: number | null;
}

export default function LearningDashboard({ route }: { route: any }) {
  const userToken = route.params?.userToken || 'demo-token';
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [fineTuneHistory, setFineTuneHistory] = useState<FineTuneJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>('code');
  const [trustHistory, setTrustHistory] = useState<any[]>([]);
  const { sendNotification } = useNotifications();

  const fetchMetrics = useCallback(async () => {
    try {
      const [metricsData, historyData, trustData] = await Promise.all([
        getLearningMetrics(userToken),
        getFineTuneHistory(userToken),
        getSkillTrustHistory(userToken, selectedSkill)
      ]);
      
      setMetrics(metricsData);
      setFineTuneHistory(historyData);
      setTrustHistory(trustData);
    } catch (error) {
      console.error('Failed to fetch learning metrics:', error);
      sendNotification('Learning Dashboard', 'Failed to load latest metrics');
    }
  }, [userToken, selectedSkill, sendNotification]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchMetrics();
    setLoading(false);
  }, [fetchMetrics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMetrics();
    setRefreshing(false);
  }, [fetchMetrics]);

  const handleManualFineTune = useCallback(async () => {
    try {
      await triggerManualFineTune(userToken, [selectedSkill]);
      sendNotification('Fine-Tune Triggered', `Manual fine-tune started for ${selectedSkill}`);
      await fetchMetrics();
    } catch (error) {
      sendNotification('Fine-Tune Failed', 'Could not trigger manual fine-tune');
    }
  }, [userToken, selectedSkill, fetchMetrics, sendNotification]);

  useEffect(() => {
    loadData();
    const interval = setInterval(fetchMetrics, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [loadData, fetchMetrics]);

  useEffect(() => {
    fetchMetrics();
  }, [selectedSkill, fetchMetrics]);

  if (loading || !metrics) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Learning Dashboard...</Text>
      </View>
    );
  }

  const getTrustColor = (score: number) => {
    if (score >= 0.9) return '#34C759';
    if (score >= 0.7) return '#FF9500';
    return '#FF3B30';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'running': return '#007AFF';
      case 'failed': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.heading}>Acey Learning Dashboard</Text>
      
      {/* Main Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Dataset Size</Text>
          <Text style={styles.metricValue}>{metrics.datasetSize.toLocaleString()}</Text>
          <Text style={styles.metricSublabel}>entries</Text>
        </View>
        
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Fine-Tune Progress</Text>
          <Text style={styles.metricValue}>{(metrics.fineTuneProgress * 100).toFixed(1)}%</Text>
          <Text style={styles.metricSublabel}>complete</Text>
        </View>
        
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Queue Size</Text>
          <Text style={styles.metricValue}>{metrics.queueSize}</Text>
          <Text style={styles.metricSublabel}>pending</Text>
        </View>
        
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Learning Rate</Text>
          <Text style={styles.metricValue}>{(metrics.learningRate * 1000).toFixed(2)}</Text>
          <Text style={styles.metricSublabel}>×10⁻³</Text>
        </View>
      </View>

      {/* Skill Trust Scores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skill Trust Scores</Text>
        <View style={styles.skillTrustGrid}>
          {Object.entries(metrics.skillTrust).map(([skill, score]) => (
            <View key={skill} style={styles.skillTrustBox}>
              <Text style={styles.skillName}>{skill.charAt(0).toUpperCase() + skill.slice(1)}</Text>
              <Text style={[styles.trustScore, { color: getTrustColor(score) }]}>
                {(score * 100).toFixed(1)}%
              </Text>
              <Button
                title="View History"
                onPress={() => setSelectedSkill(skill)}
                color={selectedSkill === skill ? '#007AFF' : '#8E8E93'}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Fine-Tune History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Fine-Tune Jobs</Text>
        {fineTuneHistory.map((job) => (
          <View key={job.id} style={styles.jobItem}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobId}>{job.id}</Text>
              <Text style={[styles.jobStatus, { color: getStatusColor(job.status) }]}>
                {job.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.jobTime}>
              {new Date(job.timestamp).toLocaleString()}
            </Text>
            <Text style={styles.jobDetails}>
              Skills: {job.skillTypes.join(', ')} | 
              Entries: {job.entriesProcessed}
              {job.accuracyImprovement && ` | Improvement: +${(job.accuracyImprovement * 100).toFixed(2)}%`}
            </Text>
          </View>
        ))}
      </View>

      {/* Trust History Chart */}
      {trustHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedSkill.charAt(0).toUpperCase() + selectedSkill.slice(1)} Trust History (30 days)
          </Text>
          <View style={styles.trustHistoryContainer}>
            {trustHistory.slice(-7).map((entry, index) => (
              <View key={index} style={styles.trustHistoryItem}>
                <Text style={styles.trustDate}>
                  {new Date(entry.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={[styles.trustValue, { color: getTrustColor(entry.trustScore) }]}>
                  {(entry.trustScore * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
          <Button
            title="Trigger Manual Fine-Tune"
            onPress={handleManualFineTune}
            color="#007AFF"
          />
        </View>
      )}

      {/* Model Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model Information</Text>
        <View style={styles.modelInfo}>
          <Text style={styles.modelDetail}>Version: {metrics.modelVersion}</Text>
          <Text style={styles.modelDetail}>
            Last Fine-Tune: {new Date(metrics.lastFineTuneTime).toLocaleString()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#1d1d1f',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metricBox: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  metricSublabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1d1d1f',
  },
  skillTrustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skillTrustBox: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  trustScore: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  jobItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  jobId: {
    fontSize: 16,
    fontWeight: '600',
  },
  jobStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  jobTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  jobDetails: {
    fontSize: 14,
    color: '#333',
  },
  trustHistoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  trustHistoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustDate: {
    fontSize: 10,
    color: '#666',
    marginBottom: 5,
  },
  trustValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modelInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modelDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
});
