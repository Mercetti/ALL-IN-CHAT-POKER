/**
 * Metrics Card Component
 * Displays LLM orchestrator metrics for individual skills
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LLMMetrics } from '../types/dashboard';

interface MetricsCardProps {
  metric: LLMMetrics;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ metric }) => {
  const getTrustColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getTrustIcon = (score: number) => {
    if (score >= 80) return 'check-circle';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.skillInfo}>
          <Text style={styles.skillName}>{metric.skillId.replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.lastUpdated}>
            Updated {new Date(metric.lastUpdated).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.trustIndicator}>
          <Icon 
            name={getTrustIcon(metric.trustScore)} 
            size={24} 
            color={getTrustColor(metric.trustScore)} 
          />
          <Text style={[styles.trustScore, { color: getTrustColor(metric.trustScore) }]}>
            {metric.trustScore}%
          </Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Icon name="database" size={20} color="#9E9E9E" />
          <View style={styles.metricDetails}>
            <Text style={styles.metricValue}>{metric.datasetEntries.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Dataset Entries</Text>
          </View>
        </View>

        <View style={styles.metricItem}>
          <Icon name="security" size={20} color="#9E9E9E" />
          <View style={styles.metricDetails}>
            <Text style={styles.metricValue}>{metric.permissionsGranted.length}</Text>
            <Text style={styles.metricLabel}>Permissions</Text>
          </View>
        </View>
      </View>

      {metric.performanceMetrics && (
        <View style={styles.performanceSection}>
          <Text style={styles.performanceTitle}>Performance Metrics</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>
                {metric.performanceMetrics.responseTime}ms
              </Text>
              <Text style={styles.performanceLabel}>Response Time</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>
                {metric.performanceMetrics.accuracy}%
              </Text>
              <Text style={styles.performanceLabel}>Accuracy</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>
                {metric.performanceMetrics.reliability}%
              </Text>
              <Text style={styles.performanceLabel}>Reliability</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.permissionsSection}>
        <Text style={styles.permissionsTitle}>Granted Permissions:</Text>
        <View style={styles.permissionsList}>
          {metric.permissionsGranted.map((permission, index) => (
            <View key={index} style={styles.permissionTag}>
              <Icon name="check" size={12} color="#4CAF50" />
              <Text style={styles.permissionText}>{permission}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  trustIndicator: {
    alignItems: 'center',
  },
  trustScore: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricDetails: {
    marginLeft: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    textTransform: 'uppercase',
  },
  performanceSection: {
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 12,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  permissionsSection: {
    marginTop: 8,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 8,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  permissionText: {
    fontSize: 11,
    color: '#E0E0E0',
    marginLeft: 4,
    fontWeight: '500',
  },
});
