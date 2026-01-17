import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

const LogsScreen = () => {
  const logs = [
    { time: '2026-01-17 05:53:17', level: 'INFO', message: 'Acey Control Center started successfully' },
    { time: '2026-01-17 05:53:18', level: 'INFO', message: 'Backend API connection established' },
    { time: '2026-01-17 05:53:19', level: 'INFO', message: 'AI systems initialized' },
    { time: '2026-01-17 05:53:20', level: 'INFO', message: 'Mobile controls activated' },
    { time: '2026-01-17 05:53:21', level: 'INFO', message: 'Update server ready' },
    { time: '2026-01-17 05:53:22', level: 'INFO', message: 'All systems operational' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Logs</Text>
        <Text style={styles.subtitle}>Real-time log monitoring</Text>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.clearButton}>
          <Text style={styles.clearText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.logContainer}>
        {logs.map((log, index) => (
          <View key={index} style={styles.logItem}>
            <Text style={styles.logTime}>{log.time}</Text>
            <Text style={[styles.logLevel, { color: getLevelColor(log.level) }]}>
              {log.level}
            </Text>
            <Text style={styles.logMessage}>{log.message}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const getLevelColor = (level) => {
  switch (level) {
    case 'INFO': return '#10b981';
    case 'WARN': return '#f59e0b';
    case 'ERROR': return '#ef4444';
    default: return '#94a3b8';
  }
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
});

export default LogsScreen;
