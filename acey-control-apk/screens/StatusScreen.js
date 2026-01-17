import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { useSystem } from '../src/context/SystemContext';

const StatusScreen = () => {
  const { state, actions } = useSystem();

  useEffect(() => {
    // Refresh data when screen comes into focus
    actions.refreshStatus();
    actions.refreshMetrics();
  }, [actions]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'offline': return '#ef4444';
      case 'error': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'error': return '🟡';
      default: return '⚪';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={state.loading}
          onRefresh={() => {
            actions.refreshStatus();
            actions.refreshMetrics();
          }}
          tintColor="#3b82f6"
          colors={["#3b82f6"]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>System Status</Text>
        <Text style={styles.subtitle}>Real-time monitoring</Text>
      </View>
      
      {/* Connection Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Backend Connection</Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusIcon, { color: getStatusColor(state.status) }]}>
            {getStatusIcon(state.status)}
          </Text>
          <Text style={[styles.statusValue, { color: getStatusColor(state.status) }]}>
            {state.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      {/* System Metrics */}
      <View style={styles.metricsCard}>
        <Text style={styles.metricsTitle}>System Metrics</Text>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>CPU Usage</Text>
          <Text style={styles.metricValue}>{state.metrics.cpu}%</Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Memory</Text>
          <Text style={styles.metricValue}>{state.metrics.memory}MB</Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Tokens/sec</Text>
          <Text style={styles.metricValue}>{state.metrics.tokens}</Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Uptime</Text>
          <Text style={styles.metricValue}>{Math.floor(state.metrics.uptime / 3600)}h</Text>
        </View>
      </View>
      
      {/* Operating Mode */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Operating Mode</Text>
        <View style={styles.statusRow}>
          <Text style={styles.modeIcon}>
            {state.mode === 'live' ? '' : state.mode === 'build' ? '' : state.mode === 'safe' ? '' : ''}
          </Text>
          <Text style={styles.statusValue}>{state.mode.toUpperCase()}</Text>
        </View>
      </View>
      
      {/* Error Display */}
      {state.error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{state.error}</Text>
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
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  errorCard: {
    backgroundColor: '#991b1b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#fca5a5',
  },
});

export default StatusScreen;
