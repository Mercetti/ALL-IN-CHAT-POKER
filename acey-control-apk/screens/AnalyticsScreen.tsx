import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAnalytics } from '../src/context/AnalyticsContext';

interface AnalyticsScreenProps {
  navigation: any;
}

const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ navigation }) => {
  const { state, actions } = useAnalytics();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    // Start data collection when screen loads
    actions.collectMetrics();
    actions.collectPerformanceData();
    actions.collectUsageData();
  }, [actions]);

  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>System Overview</Text>
      
      <View style={styles.metricGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Current Status</Text>
          <Text style={[styles.metricValue, { color: state.metrics.cpu.length > 0 ? '#10b981' : '#6b7280' }]}>
            {state.metrics.cpu.length > 0 ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Uptime</Text>
          <Text style={styles.metricValue}>
            {state.performance.uptime.length > 0 ? `${state.performance.uptime[state.performance.uptime.length - 1].value}%` : '0%'}
          </Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Active Users</Text>
          <Text style={styles.metricValue}>
            {state.metrics.requests.length > 0 ? state.metrics.requests[state.metrics.requests.length - 1].count.toString() : '0'}
          </Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Response Time</Text>
          <Text style={[styles.metricValue, { color: state.performance.responseTime.length > 0 && state.performance.responseTime[state.performance.responseTime.length - 1].value < 100 ? '#10b981' : '#f59e0b' }]}>
            {state.performance.responseTime.length > 0 ? `${state.performance.responseTime[state.performance.responseTime.length - 1].value}ms` : '0ms'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCharts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Performance Charts</Text>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>CPU Usage</Text>
        <View style={styles.chart}>
          <Text style={styles.chartPlaceholder}>📊 Chart data will appear here</Text>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Memory Usage</Text>
        <View style={styles.chart}>
          <Text style={styles.chartPlaceholder}>📈 Chart data will appear here</Text>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Request Rate</Text>
        <View style={styles.chart}>
          <Text style={styles.chartPlaceholder}>📋 Chart data will appear here</Text>
        </View>
      </View>
    </View>
  );

  const renderPerformance = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Performance Metrics</Text>
      
      <View style={styles.performanceGrid}>
        <View style={styles.performanceCard}>
          <Text style={styles.performanceLabel}>Avg Response Time</Text>
          <Text style={styles.performanceValue}>
            {state.performance.responseTime.length > 0 ? `${state.performance.responseTime[state.performance.responseTime.length - 1].value}ms` : '0ms'}
          </Text>
        </View>
        
        <View style={styles.performanceCard}>
          <Text style={styles.performanceLabel}>Error Rate</Text>
          <Text style={[styles.performanceValue, { color: state.performance.errorRate.length > 0 && state.performance.errorRate[state.performance.errorRate.length - 1].value < 1 ? '#10b981' : '#ef4444' }]}>
            {state.performance.errorRate.length > 0 ? `${state.performance.errorRate[state.performance.errorRate.length - 1].value}%` : '0%'}
          </Text>
        </View>
        
        <View style={styles.performanceCard}>
          <Text style={styles.performanceLabel}>Throughput</Text>
          <Text style={styles.performanceValue}>
            0 req/s
          </Text>
        </View>
        
        <View style={styles.performanceCard}>
          <Text style={styles.performanceLabel}>Uptime</Text>
          <Text style={styles.performanceValue}>
            {state.performance.uptime.length > 0 ? `${state.performance.uptime[state.performance.uptime.length - 1].value}%` : '99.9%'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderUsage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Usage Analytics</Text>
      
      <View style={styles.usageGrid}>
        <View style={styles.usageCard}>
          <Text style={styles.usageLabel}>Total Requests</Text>
          <Text style={styles.usageValue}>
            0
          </Text>
        </View>
        
        <View style={styles.usageCard}>
          <Text style={styles.usageLabel}>Mode Changes</Text>
          <Text style={styles.usageValue}>
            {state.usage.modeChanges.length}
          </Text>
        </View>
        
        <View style={styles.usageCard}>
          <Text style={styles.usageLabel}>Control Actions</Text>
          <Text style={styles.usageValue}>
            {state.usage.controlActions.length}
          </Text>
        </View>
        
        <View style={styles.usageCard}>
          <Text style={styles.usageLabel}>Errors</Text>
          <Text style={[styles.usageValue, { color: state.usage.errors.length < 10 ? '#10b981' : '#ef4444' }]}>
            {state.usage.errors.length}
          </Text>
        </View>
      </View>
    </View>
  );

  const handleExport = (format: 'json' | 'csv') => {
    const data = {
      metrics: state.metrics,
      performance: state.performance,
      usage: state.usage,
      timestamp: new Date().toISOString(),
    };

    if (format === 'json') {
      console.log('Exporting data as JSON:', JSON.stringify(data, null, 2));
    } else {
      console.log('Exporting data as CSV (implementation needed)');
    }
    
    setShowExportMenu(false);
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'charts':
        return renderCharts();
      case 'performance':
        return renderPerformance();
      case 'usage':
        return renderUsage();
      default:
        return renderOverview();
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'overview' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('overview')}
          >
            <Text style={styles.tabButtonText}>Overview</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'charts' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('charts')}
          >
            <Text style={styles.tabButtonText}>Charts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'performance' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('performance')}
          >
            <Text style={styles.tabButtonText}>Performance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'usage' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('usage')}
          >
            <Text style={styles.tabButtonText}>Usage</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => setShowExportMenu(true)}
        >
          <Text style={styles.exportButtonText}>📤 Export</Text>
        </TouchableOpacity>
      </View>

      {/* Export Menu */}
      {showExportMenu && (
        <View style={styles.exportMenu}>
          <TouchableOpacity
            style={styles.exportOption}
            onPress={() => handleExport('json')}
          >
            <Text style={styles.exportOptionText}>Export as JSON</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.exportOption}
            onPress={() => handleExport('csv')}
          >
            <Text style={styles.exportOptionText}>Export as CSV</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.exportCloseButton}
            onPress={() => setShowExportMenu(false)}
          >
            <Text style={styles.exportCloseButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {renderContent()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#374151',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#3b82f6',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#ffffff',
  },
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  exportButtonText: {
    fontSize: 14,
    color: '#ffffff',
  },
  exportMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  exportOption: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  exportOptionText: {
    fontSize: 14,
    color: '#ffffff',
  },
  exportCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportCloseButtonText: {
    fontSize: 12,
    color: '#ffffff',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  chartContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  chart: {
    height: 120,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholder: {
    fontSize: 16,
    color: '#6b7280',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  usageCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  usageLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default AnalyticsScreen;
