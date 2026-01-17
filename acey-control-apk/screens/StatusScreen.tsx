import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSystem } from '../src/context/SystemContext';

interface StatusScreenProps {
  navigation: any;
}

const StatusScreen: React.FC<StatusScreenProps> = ({ navigation }) => {
  const { state, actions } = useSystem();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fetch initial system status
    actions.refreshStatus();
    
    // Set up refresh interval
    const interval = setInterval(() => {
      actions.refreshStatus();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    actions.refreshStatus().finally(() => {
      setRefreshing(false);
    });
  };

  const handleStartSystem = () => {
    Alert.alert(
      'Start System',
      'Are you sure you want to start the system?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', style: 'default' }
      ],
      (buttonIndex) => {
        if (buttonIndex === 1) {
          actions.startSystem();
        }
      }
    );
  };

  const handleStopSystem = () => {
    Alert.alert(
      'Stop System',
      'Are you sure you want to stop the system?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive' }
      ],
      (buttonIndex) => {
        if (buttonIndex === 1) {
          actions.stopSystem();
        }
      }
    );
  };

  const handleRestartSystem = () => {
    Alert.alert(
      'Restart System',
      'Are you sure you want to restart the system?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restart', style: 'default' }
      ],
      (buttonIndex) => {
        if (buttonIndex === 1) {
          actions.restartSystem();
        }
      }
    );
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      'Emergency Stop',
      'This will immediately stop all system processes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Emergency Stop', style: 'destructive' }
      ],
      (buttonIndex) => {
        if (buttonIndex === 1) {
          actions.emergencyStop();
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'offline': return '#ef4444';
      case 'maintenance': return '#f59e0b';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getCPUPercent = (usage: number, total: number) => {
    return total > 0 ? Math.round((usage / total) * 100) : 0;
  };

  const getMemoryPercent = (usage: number, total: number) => {
    return total > 0 ? Math.round((usage / total) * 100) : 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Status</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* System Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(state.status) }]}>
                {state.status.toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Uptime</Text>
              <Text style={styles.statusValue}>
                {state.uptime || '0h 0m'}
              </Text>
            </View>
            
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Active Users</Text>
              <Text style={styles.statusValue}>
                {state.activeUsers?.toString() || '0'}
              </Text>
            </View>
            
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Response Time</Text>
              <Text style={styles.statusValue}>
                {state.responseTime || '0ms'}
              </Text>
            </View>
          </View>
        </View>

        {/* Resource Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resource Usage</Text>
          
          <View style={styles.resourceGrid}>
            <View style={styles.resourceCard}>
              <Text style={styles.resourceLabel}>CPU Usage</Text>
              <View style={styles.resourceBar}>
                <View style={[styles.resourceFill, { width: `${getCPUPercent(state.cpuUsage || 0, 100)}%` }]} />
                <Text style={styles.resourceText}>
                  {getCPUPercent(state.cpuUsage || 0, 100)}%
                </Text>
              </View>
              <Text style={styles.resourceLimit}>
                /100%
              </Text>
            </View>
            
            <View style={styles.resourceCard}>
              <Text style={styles.resourceLabel}>Memory Usage</Text>
              <View style={styles.resourceBar}>
                <View style={[styles.resourceFill, { width: `${getMemoryPercent(state.memoryUsage || 0, 100)}%` }]} />
                <Text style={styles.resourceText}>
                  {getMemoryPercent(state.memoryUsage || 0, 100)}%
                </Text>
              </View>
              <Text style={styles.resourceLimit}>
                /100%
              </Text>
            </View>
            
            <View style={styles.resourceCard}>
              <Text style={styles.resourceLabel}>Token Usage</Text>
              <View style={styles.resourceBar}>
                <View style={[styles.resourceFill, { width: `${getMemoryPercent(state.tokenUsage || 0, 100)}%` }]} />
                <Text style={styles.resourceText}>
                  {getMemoryPercent(state.tokenUsage || 0, 100)}%
                </Text>
              </View>
              <Text style={styles.resourceLimit}>
                /100%
              </Text>
            </View>
            
            <View style={styles.resourceCard}>
              <Text style={styles.resourceLabel}>Connections</Text>
              <Text style={styles.statusValue}>
                {state.connections || '0'} / 100
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          
          <ScrollView style={styles.eventsList}>
            {state.recentEvents?.map((event, index) => (
              <View key={index} style={styles.eventCard}>
                <Text style={styles.eventTime}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMessage}>{event.message}</Text>
              </View>
            )) || (
              <Text style={styles.noEvents}>No recent events</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Control Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => actions.startSystem()}
          >
            <Text style={styles.actionButtonText}>▶️ Start System</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => actions.stopSystem()}
          >
            <Text style={styles.actionButtonText}>⏹️ Stop System</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => actions.restartSystem()}
          >
            <Text style={styles.actionButtonText}>🔄 Restart System</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={() => actions.emergencyStop()}
          >
            <Text style={styles.actionButtonText}>🚨 Emergency Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
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
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resourceCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resourceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  resourceBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  resourceText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  resourceLimit: {
    fontSize: 10,
    color: '#6b7280',
  },
  eventsList: {
    maxHeight: 200,
  },
  eventCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  eventTime: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  eventMessage: {
    fontSize: 12,
    color: '#94a3b8',
  },
  noEvents: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
});

export default StatusScreen;
