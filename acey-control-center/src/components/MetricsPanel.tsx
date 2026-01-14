// components/MetricsPanel.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { AceyMobileOrchestrator, SkillMetrics } from '../services/aceyMobileOrchestrator';

interface MetricsPanelProps {
  userToken: string;
  userRole: string;
}

export default function MetricsPanel({ userToken, userRole }: MetricsPanelProps) {
  const [metrics, setMetrics] = useState<SkillMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const orchestrator = new AceyMobileOrchestrator(userToken);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        // Mock loading metrics for multiple skills
        const skillIds = ['code_helper', 'audio_maestro', 'graphics_wizard', 'link_review_pro'];
        const metricsData = await Promise.all(
          skillIds.map(id => orchestrator.fetchSkillMetrics(userToken, id))
        );
        setMetrics(metricsData);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, [userToken]);

  const formatMetricValue = (value: number, decimals = 1) => {
    return value.toFixed(decimals);
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return '#34C759';
    if (rating >= 4.0) return '#FF9500';
    if (rating >= 3.5) return '#FFCC00';
    return '#FF3B30';
  };

  const getApprovalColor = (rate: number) => {
    if (rate >= 0.9) return '#34C759';
    if (rate >= 0.8) return '#FF9500';
    if (rate >= 0.7) return '#FFCC00';
    return '#FF3B30';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading metrics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Skill Performance Metrics</Text>
      <Text style={styles.subtitle}>
        Usage statistics and performance analytics for all skills
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {metrics.map((skillMetric, index) => (
          <View key={index} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.skillName}>Skill {index + 1}</Text>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setSelectedSkill(selectedSkill === `skill_${index}` ? null : `skill_${index}`)}
              >
                <Text style={styles.expandButtonText}>
                  {selectedSkill === `skill_${index}` ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Usage</Text>
                <Text style={styles.metricValue}>{skillMetric.usageCount.toLocaleString()}</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Avg Rating</Text>
                <Text style={[styles.metricValue, { color: getPerformanceColor(skillMetric.avgRating) }]}>
                  {formatMetricValue(skillMetric.avgRating)} ⭐
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Approval Rate</Text>
                <Text style={[styles.metricValue, { color: getApprovalColor(skillMetric.approvalRate) }]}>
                  {formatMetricValue(skillMetric.approvalRate * 100, 0)}%
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Error Rate</Text>
                <Text style={[styles.metricValue, { color: skillMetric.errorRate > 0.05 ? '#FF3B30' : '#34C759' }]}>
                  {formatMetricValue(skillMetric.errorRate * 100, 1)}%
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Avg Speed</Text>
                <Text style={styles.metricValue}>
                  {formatMetricValue(skillMetric.completionSpeed)}s
                </Text>
              </View>
            </View>

            {selectedSkill === `skill_${index}` && (
              <View style={styles.expandedDetails}>
                <Text style={styles.detailsTitle}>Performance Details</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Updated:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(skillMetric.lastUpdated).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.performanceIndicator}>
                  <Text style={styles.performanceLabel}>Performance:</Text>
                  <View style={[
                    styles.performanceBar,
                    { backgroundColor: getPerformanceColor(skillMetric.avgRating) }
                  ]}>
                    <Text style={styles.performanceText}>
                      {skillMetric.avgRating >= 4.5 ? 'Excellent' :
                       skillMetric.avgRating >= 4.0 ? 'Good' :
                       skillMetric.avgRating >= 3.5 ? 'Average' : 'Needs Improvement'}
                    </Text>
                  </View>
                </View>

                <View style={styles.trendIndicator}>
                  <Text style={styles.trendLabel}>Usage Trend:</Text>
                  <View style={styles.trendContainer}>
                    <Text style={styles.trendValue}>
                      {skillMetric.usageCount > 1000 ? '📈 High' :
                       skillMetric.usageCount > 500 ? '📊 Medium' : '📉 Low'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  expandButton: {
    padding: 4,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 15,
  },
  metricItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  expandedDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  performanceIndicator: {
    marginBottom: 12,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  performanceBar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  performanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  trendIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  trendContainer: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  trendValue: {
    fontSize: 11,
    fontWeight: '500',
  },
});
