/**
 * Investor Dashboard Screen for Acey
 * Phase 5: Investor-Ready Live Dashboards
 * 
 * This screen provides real-time insights for investors and owners
 * including skills usage, device states, financial summaries, and learning progress
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DashboardData } from '../../dashboard/data';
import { LocalOrchestrator } from '../../orchestrator/localOrchestrator';
import { DeviceSync } from '../../orchestrator/deviceSync';

// Types for dashboard data
interface DashboardStats {
  timestamp: string;
  skills: Array<{
    skillName: string;
    executionCount: number;
    successRate: number;
    avgExecutionTime: number;
    lastUsed: string;
    confidence: number;
    errorRate: number;
  }>;
  devices: Array<{
    deviceId: string;
    deviceName: string;
    lastSync: string;
    isOnline: boolean;
    trustLevel: number;
    skillsCount: number;
    datasetsCount: number;
    syncHealth: 'excellent' | 'good' | 'poor' | 'offline';
    errors: string[];
  }>;
  financials: {
    totalRevenue: number;
    monthlyRevenue: number;
    partnerRevenue: Record<string, number>;
    payouts: Array<{
      partner: string;
      amount: number;
      timestamp: string;
      status: 'pending' | 'completed' | 'failed';
    }>;
    subscriptionRevenue: Record<string, number>;
    oneTimeRevenue: number;
  };
  learning: {
    totalDatasets: number;
    totalEntries: number;
    avgQuality: number;
    highQualityEntries: number;
    learningProgress: number;
    lastFineTune: string;
    modelAccuracy: number;
    datasetsBySkill: Record<string, number>;
  };
  systemHealth: {
    uptime: number;
    errorRate: number;
    performance: 'excellent' | 'good' | 'poor' | 'critical';
    alerts: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      timestamp: string;
      resolved: boolean;
    }>;
  };
}

export default function InvestorDashboard({ userToken, ownerToken, username, userRole }: any) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Initialize dashboard components
  const orchestrator = new LocalOrchestrator({
    ollamaPath: 'ollama',
    modelsPath: './models',
    enableStreaming: false,
    maxConcurrency: 2,
    timeoutMs: 30000,
    learningEnabled: true,
    qualityThreshold: 0.7
  });

  const deviceSync = new DeviceSync(orchestrator, {
    syncPath: './models/device_sync',
    encryptionEnabled: true,
    autoSync: true,
    syncInterval: 5,
    maxDevices: 10,
    trustRequired: true,
    backupEnabled: true
  });

  const dashboardData = new DashboardData(orchestrator, deviceSync, './logs');

  useEffect(() => {
    // Load initial data
    const initialStats = dashboardData.getLiveStats();
    setStats(initialStats);
    setLastUpdate(initialStats.timestamp);

    // Set up real-time updates
    const interval = setInterval(() => {
      const newStats = dashboardData.getLiveStats();
      setStats(newStats);
      setLastUpdate(newStats.timestamp);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (value: number): string => {
    return `${(100 * value).toFixed(1)}%`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const getPerformanceColor = (performance: string): string => {
    switch (performance) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#FF9800';
      case 'poor': return '#FF5722';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getSyncHealthColor = (health: string): string => {
    switch (health) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#FF9800';
      case 'poor': return '#FF5722';
      case 'offline': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const renderMetricCard = (title: string, value: string, color?: string) => (
    <View style={[styles.metricCard, color && { backgroundColor: color }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );

  const renderSkillMetrics = () => {
    if (!stats) return null;

    const topSkills = stats.skills
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 5);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Top Skills</Text>
        {topSkills.map((skill, index) => (
          <View key={skill.skillName} style={styles.skillMetric}>
            <Text style={styles.skillName}>{skill.skillName}</Text>
            <View style={styles.skillStats}>
              <Text style={styles.skillStat}>{formatNumber(skill.executionCount)} executions</Text>
              <Text style={styles.skillStat}>{formatPercent(skill.successRate)} success</Text>
              <Text style={styles.skillStat}>{formatPercent(skill.confidence)} confidence</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderDeviceMetrics = () => {
    if (!stats) return null;

    const onlineDevices = stats.devices.filter(d => d.isOnline);
    const authorizedDevices = stats.devices.filter(d => d.isAuthorized);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Device Status</Text>
        <View style={styles.deviceGrid}>
          {renderMetricCard('Total Devices', formatNumber(stats.devices.length))}
          {renderMetricCard('Online', formatNumber(onlineDevices.length), '#4CAF50')}
          {renderMetricCard('Authorized', formatNumber(authorizedDevices.length), '#4CAF50')}
        </View>
        
        <Text style={styles.sectionTitle}>Device Details</Text>
        {stats.devices.map((device, index) => (
          <View key={device.deviceId} style={styles.deviceDetail}>
            <View style={styles.deviceHeader}>
              <Text style={styles.deviceDetailName}>{device.deviceName}</Text>
              <View style={[styles.deviceStatus, { 
                backgroundColor: getSyncHealthColor(device.syncHealth) 
              }]}>
                <Text style={styles.deviceStatusText}>
                  {device.isOnline ? '🟢 Online' : '🔴 Offline'}
                </Text>
              </View>
            </View>
            <View style={styles.deviceDetails}>
              <Text style={styles.deviceDetail}>Trust Level: {device.trustLevel}</Text>
              <Text style={deviceDetail}>Skills: {device.skills.length}</Text>
              <Text style={deviceDetail}>Datasets: {device.datasets.length}</Text>
              <Text style={deviceDetail}>Last Sync: {new Date(device.lastSync).toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderFinancialMetrics = () => {
    if (!stats) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Financial Overview</Text>
        <View style={styles.financialGrid}>
          {renderMetricCard('Total Revenue', formatCurrency(stats.financials.totalRevenue))}
          {renderMetricCard('Monthly Revenue', formatCurrency(stats.financials.monthlyRevenue))}
          {renderMetricCard('Active Partners', formatNumber(Object.keys(stats.financials.partnerRevenue).length))}
        </View>
        
        <Text style={styles.sectionTitle}>Revenue by Partner</Text>
        {Object.entries(stats.financials.partnerRevenue).map(([partner, revenue]) => (
          <View key={partner} style={styles.revenueItem}>
            <Text style={styles.revenuePartner}>{partner}</Text>
            <Text style={styles.revenueAmount}>{formatCurrency(revenue)}</Text>
          </View>
        ))}
        
        <Text style={styles.sectionTitle}>Payout Status</Text>
        <View style={styles.payoutGrid}>
          {renderMetricCard('Pending Payouts', 
            formatCurrency(stats.financials.payouts.filter(p => p.status === 'pending').length), 
            '#FF9800'
          )}
          {renderMetric('Completed Payouts', 
            formatCurrency(stats.financials.payouts.filter(p => p.status === 'completed').length), 
            '#4CAF50'
          )}
        </View>
      </View>
    );
  };

  const renderLearningMetrics = () => {
    if (!stats) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧠 Learning Progress</Text>
        <View style={styles.learningGrid}>
          {renderMetricCard('Total Datasets', formatNumber(stats.learning.totalDatasets))}
          {renderMetricCard('Training Entries', formatNumber(stats.learning.totalEntries))}
          {renderMetric('Avg Quality', formatPercent(stats.learning.avgQuality))}
          {renderMetric('Learning Progress', formatPercent(stats.learningProgress), '#4CAF50')}
        </View>
        
        <Text style={styles.sectionTitle}>Model Performance</Text>
        <View style={styles.modelGrid}>
          {renderMetricCard('Model Accuracy', formatPercent(stats.learning.modelAccuracy))}
          <MetricsCard('Last Fine-Tune', 
            stats.learning.lastFineTune ? new Date(stats.learning.lastFineTune).toLocaleString() : 'Never'
          )}
        </View>
        
        <Text style={styles.sectionTitle}>Dataset Distribution</Text>
        {Object.entries(stats.learning.datasetsBySkill).map(([skill, count]) => (
          <View key={skill} style={styles.datasetItem}>
            <Text style={styles.datasetSkill}>{skill}</Text>
            <Text style={styles.datasetCount}>{count} datasets</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSystemHealth = () => {
    if (!stats) return null;

    const { uptime, errorRate, performance, alerts } = stats.systemHealth;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 System Health</Text>
        <View style={styles.healthGrid}>
          {renderMetricCard('Uptime', formatPercent(uptime), getPerformanceColor(performance))}
          {renderMetric('Error Rate', formatPercent(errorRate), getPerformanceColor(performance))}
          {renderMetric('Active Alerts', formatNumber(alerts.length), 
            alerts.length > 0 ? '#F44336' : '#4CAF50'
          )}
        </View>
        
        {alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.alertsTitle}>🚨 System Alerts</Text>
            {alerts.map((alert, index) => (
              <View key={index} style={[
                styles.alertItem,
                alert.type === 'error' && styles.errorAlert,
                alert.type === 'warning' && styles.warningAlert,
                alert.type === 'info' && styles.infoAlert
              ]}>
                <Text style={styles.alertType}>{alert.type.toUpperCase()}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>{new Date(alert.timestamp).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Investor Dashboard</Text>
        <Text style={styles.headerSubtitle}>Real-time Performance Metrics</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.updateTime}>
            Last Update: {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Never'}
          </Text>
          <View style={[styles.statusIndicator, { 
            backgroundColor: getPerformanceColor(stats.systemHealth.performance) 
          }]}>
            <Text style={styles.statusText}>
              {stats.systemHealth.performance.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderSkillMetrics()}
        {renderDeviceMetrics()}
        {renderFinancialMetrics()}
        {renderLearningMetrics()}
        {renderSystemHealth()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#E0E0E0',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  updateTime: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  metricTitle: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skillMetrics: {
    marginBottom: 24,
  },
  skillMetric: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  skillStats: {
    flexDirection: 'row',
    gap: 8,
  },
  skillStat: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  deviceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  deviceCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceDetailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  deviceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deviceStatusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  deviceDetails: {
    marginBottom: 8,
  },
  deviceDetail: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  financialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  revenuePartner: {
    fontSize: 14,
    color: '#E0E0E0',
    flex: 1,
  },
  revenueAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  layoutGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  learningGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modelGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  datasetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  datasetSkill: {
    fontSize: 12,
    color: '#E0E0E0',
    flex: 1,
  },
  datasetCount: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  healthGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  alertsSection: {
    marginBottom: 16,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  alertItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorAlert: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  warningAlert: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  infoAlert: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
  alertType: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 10,
    color: '#9E9E9E',
  },
  syncStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
  },
  syncAllButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  syncAllButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
