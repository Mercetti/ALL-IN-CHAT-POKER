import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

const StatusScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Status</Text>
        <Text style={styles.subtitle}>Real-time monitoring</Text>
      </View>
      
      <View style={styles.statusGrid}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Backend API</Text>
          <Text style={styles.statusValue}>✅ Online</Text>
        </View>
        
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>AI Systems</Text>
          <Text style={styles.statusValue}>✅ Operational</Text>
        </View>
        
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Mobile Controls</Text>
          <Text style={styles.statusValue}>✅ Active</Text>
        </View>
        
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Update Server</Text>
          <Text style={styles.statusValue}>✅ Ready</Text>
        </View>
      </View>
      
      <View style={styles.metrics}>
        <Text style={styles.metricsTitle}>System Metrics</Text>
        <Text style={styles.metric}>CPU Usage: 12%</Text>
        <Text style={styles.metric}>Memory: 256MB</Text>
        <Text style={styles.metric}>Tokens/sec: 45</Text>
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
    marginBottom: 30,
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
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statusCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: 'bold',
  },
  metrics: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 8,
  },
  metricsTitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  metric: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 5,
  },
});

export default StatusScreen;
