import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSystem } from '../src/context/SystemContext';

const LogsScreen = () => {
  const { state, actions } = useSystem();

  useEffect(() => {
    // Refresh logs when screen comes into focus
    actions.refreshLogs();
  }, [actions]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'INFO': return '#10b981';
      case 'WARN': return '#f59e0b';
      case 'ERROR': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const handleRefresh = () => {
    actions.refreshLogs();
  };

  const handleClearLogs = () => {
    // This would clear logs via API
    // For now, just show a message
    console.log('Clear logs functionality would be implemented here');
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={state.loading}
          onRefresh={handleRefresh}
          tintColor="#3b82f6"
          colors={["#3b82f6"]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>System Logs</Text>
        <Text style={styles.subtitle}>Real-time log monitoring</Text>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.clearButton} onPress={handleClearLogs}>
          <Text style={styles.clearText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.logContainer}>
        {state.logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No logs available</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        ) : (
          state.logs.map((log, index) => (
            <View key={index} style={styles.logItem}>
              <Text style={styles.logTime}>{log.time}</Text>
              <Text style={[styles.logLevel, { color: getLevelColor(log.level) }]}>
                {log.level}
              </Text>
              <Text style={styles.logMessage}>{log.message}</Text>
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
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  clearText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
  },
  logItem: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  logTime: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  logMessage: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default LogsScreen;
