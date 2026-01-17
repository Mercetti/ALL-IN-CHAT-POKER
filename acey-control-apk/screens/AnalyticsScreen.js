import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAnalytics } from '../src/context/AnalyticsContext';

const AnalyticsScreen = ({ navigation }) => {
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
            {Math.floor((state.metrics.uptime || 0) / 3600)}h
          </Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Data Points</Text>
          <Text style={styles.metricValue}>
            {state.metrics.cpu.length + state.metrics.memory.length + state.metrics.tokens.length}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCharts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Performance Charts</Text>
      
      {/* Time Range Selector */}
      <View style={styles.timeRangeSelector}>
        <Text style={styles.selectorLabel}>Time Range:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeRangeButtons}>
          {['1h', '6h', '24h', '7d', '30d'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                state.charts.timeRange === range && styles.activeTimeRange
              ]}
              onPress={() => actions.setTimeRange(range)}
            >
              <Text style={styles.timeRangeText}>{range}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Metric Selector */}
      <View style={styles.metricSelector}>
        <Text style={styles.selectorLabel}>Metric:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricButtons}>
          {['cpu', 'memory', 'tokens', 'requests'].map((metric) => (
            <TouchableOpacity
              key={metric}
              style={[
                styles.metricButton,
                state.charts.selectedMetric === metric && styles.activeMetric
              ]}
              onPress={() => actions.setSelectedMetric(metric)}
            >
              <Text style={styles.metricText}>{metric.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Auto Refresh Toggle */}
      <View style={styles.refreshControls}>
        <Text style={styles.selectorLabel}>Auto Refresh:</Text>
        <TouchableOpacity
          style={[
            styles.refreshToggle,
            state.charts.autoRefresh && styles.activeRefresh
          ]}
          onPress={actions.toggleAutoRefresh}
        >
          <Text style={styles.refreshText}>
            {state.charts.autoRefresh ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.refreshIntervalButton}
          onPress={() => setShowExportMenu(!showExportMenu)}
        >
          <Text style={styles.refreshIntervalText}>Interval: {state.charts.refreshInterval / 1000}s</Text>
        </TouchableOpacity>
      </View>
      
      {/* Export Menu */}
      {showExportMenu && (
        <View style={styles.exportMenu}>
          <Text style={styles.exportMenuTitle}>Export Data</Text>
          
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => {
              actions.exportData('json');
              setShowExportMenu(false);
            }}
          >
            <Text style={styles.exportButtonText}>Export as JSON</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => {
              actions.exportData('csv');
              setShowExportMenu(false);
            }}
          >
            <Text style={styles.exportButtonText}>Export as CSV</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => {
              actions.clearData();
              setShowExportMenu(false);
            }}
          >
            <Text style={styles.exportButtonText}>Clear Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowExportMenu(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    </View>
  );

  const renderMetricsTable = () => {
    const chartData = actions.getChartData(state.charts.selectedMetric);
    const summary = actions.getMetricSummary(state.charts.selectedMetric);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {state.charts.selectedMetric.toUpperCase()} Metrics
        </Text>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current:</Text>
            <Text style={styles.summaryValue}>{summary.current}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average:</Text>
            <Text style={styles.summaryValue}>{summary.average.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Min:</Text>
            <Text style={styles.summaryValue}>{summary.min}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Max:</Text>
            <Text style={styles.summaryValue}>{summary.max}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Trend:</Text>
            <Text style={[styles.summaryValue, { 
              color: summary.trend === 'up' ? '#10b981' : 
                   summary.trend === 'down' ? '#ef4444' : '#6b7280' 
            }]}>
              {summary.trend.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Timestamp</Text>
          <Text style={styles.tableHeaderText}>Value</Text>
        </View>
        
        <ScrollView style={styles.tableBody}>
          {chartData.slice(-20).reverse().map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
              <Text style={styles.tableCell}>{item.value.toFixed(2)}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderPerformance = () => {
    const summary = actions.getPerformanceSummary();
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        
        <View style={styles.performanceGrid}>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceLabel}>Avg Response Time</Text>
            <Text style={styles.performanceValue}>
              {summary.avgResponseTime.toFixed(0)}ms
            </Text>
          </View>
          
          <View style={styles.performanceCard}>
            <Text style={styles.performanceLabel}>Error Rate</Text>
            <Text style={styles.performanceValue}>
              {(summary.errorRate * 100).toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.performanceCard}>
            <Text style={styles.performanceLabel}>Uptime</Text>
            <Text style={styles.performanceValue}>
              {Math.floor(summary.uptime / 3600)}h
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderUsage = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage Analytics</Text>
        
        <View style={styles.usageGrid}>
          <View style={styles.usageCard}>
            <Text style={styles.usageTitle}>Mode Changes</Text>
            <Text style={styles.usageCount}>{state.usage.modeChanges.length}</Text>
          </View>
          
          <View style={styles.usageCard}>
            <Text style={styles.usageTitle}>Control Actions</Text>
            <Text style={styles.usageCount}>{state.usage.controlActions.length}</Text>
          </View>
          
          <View style={styles.usageCard}>
            <Text style={styles.usageTitle}>Errors</Text>
            <Text style={styles.usageCount}>{state.usage.errors.length}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>System performance monitoring</Text>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['overview', 'charts', 'performance', 'usage'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={styles.tabText}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Content based on selected tab */}
      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'charts' && renderCharts()}
      {selectedTab === 'performance' && renderPerformance()}
      {selectedTab === 'usage' && renderUsage()}
      
      {/* Loading Indicator */}
      {state.loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#3b82f6" size="large" />
          <Text style={styles.loadingText}>Loading analytics data...</Text>
        </View>
      )}
      
      {/* Error Display */}
      {state.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {state.error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    },
  tabButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    minWidth: 100,
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  timeRangeSelector: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  timeRangeButtons: {
    flexDirection: 'row',
  },
  timeRangeButton: {
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  activeTimeRange: {
    backgroundColor: '#3b82f6',
  },
  timeRangeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricSelector: {
    marginBottom: 16,
  },
  metricButtons: {
    flexDirection: 'row',
  },
  metricButton: {
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  activeMetric: {
    backgroundColor: '#3b82f6',
  },
  metricText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshToggle: {
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeRefresh: {
    backgroundColor: '#10b981',
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshIntervalButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  refreshIntervalText: {
    color: '#ffffff',
    fontSize: 12,
  },
  exportMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  exportButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 120,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  tableBody: {
    maxHeight: 200,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 4,
  },
  tableCell: {
    fontSize: 12,
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    minWidth: 100,
    flex: 1,
  },
  performanceLabel: {
    fontSize: 14,
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
    justifyContent: 'space-between',
  },
  usageCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    minWidth: 100,
    flex: 1,
    alignItems: 'center',
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  usageCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: '#991b1b',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#fca5a5',
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
