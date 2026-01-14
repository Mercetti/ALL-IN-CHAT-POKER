import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { useAceyStore } from '../state/aceyStore';
import StatusCard from '../components/StatusCard';
import { apiGet } from '../services/api';

const DashboardScreen: React.FC = ({ navigation }) => {
  const { status, setStatus, setLoading, setError } = useAceyStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const statusData = await apiGet('/mobile/status');
      setStatus(statusData);
      setError(null);
    } catch (error) {
      setError('Failed to load status');
      console.error('Status load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
  };

  const getStatusColor = (online: boolean) => {
    return online ? '#4CAF50' : '#F44336';
  };

  const getStatusText = (online: boolean) => {
    return online ? 'ONLINE' : 'OFFLINE';
  };

  const getLoadColor = (load: string) => {
    switch (load) {
      case 'low': return '#4CAF50';
      case 'standard': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Acey Control Center</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Main Status Card */}
        <StatusCard
          title="System Status"
          status={status.aceyOnline ? 'Online' : 'Offline'}
          statusColor={getStatusColor(status.aceyOnline)}
          icon={status.aceyOnline ? 'check-circle' : 'error'}
        >
          <View style={styles.statusDetails}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Current Task:</Text>
              <Text style={styles.statusValue}>{status.currentTask || 'Idle'}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Cognitive Load:</Text>
              <View style={styles.loadContainer}>
                <Text style={[styles.statusValue, { color: getLoadColor(status.cognitiveLoad) }]}>
                  {status.cognitiveLoad?.toUpperCase() || 'UNKNOWN'}
                </Text>
                <View style={[styles.loadIndicator, { backgroundColor: getLoadColor(status.cognitiveLoad) }]} />
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Active Model:</Text>
              <Text style={styles.statusValue}>{status.activeModel || 'Unknown'}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last Heartbeat:</Text>
              <Text style={styles.statusValue}>
                {status.lastHeartbeat ? new Date(status.lastHeartbeat).toLocaleTimeString() : 'Never'}
              </Text>
            </View>
          </View>
        </StatusCard>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Approvals')}
          >
            <Icon name="approval" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>View Approvals</Text>
            <Icon name="chevron-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Logs')}
          >
            <Icon name="list-alt" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>View Logs</Text>
            <Icon name="chevron-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Commands')}
          >
            <Icon name="settings" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Commands</Text>
            <Icon name="chevron-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* System Health */}
        <View style={styles.healthSection}>
          <Text style={styles.sectionTitle}>System Health</Text>
          
          <View style={styles.healthGrid}>
            <View style={styles.healthItem}>
              <Icon name="memory" size={32} color="#4CAF50" />
              <Text style={styles.healthLabel}>Systems</Text>
              <Text style={styles.healthValue}>Operational</Text>
            </View>
            
            <View style={styles.healthItem}>
              <Icon name="security" size={32} color="#4CAF50" />
              <Text style={styles.healthLabel}>Security</Text>
              <Text style={styles.healthValue}>Secured</Text>
            </View>
            
            <View style={styles.healthItem}>
              <Icon name="sync" size={32} color="#FF9800" />
              <Text style={styles.healthLabel}>Sync</Text>
              <Text style={styles.healthValue}>Syncing</Text>
            </View>
            
            <View style={styles.healthItem}>
              <Icon name="storage" size={32} color="#4CAF50" />
              <Text style={styles.healthLabel}>Storage</Text>
              <Text style={styles.healthValue}>Healthy</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: getStatusBarHeight() + 10,
    paddingBottom: 15,
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#2196F3',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusDetails: {
    marginTop: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  statusLabel: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  statusValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  actionsSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  healthSection: {
    marginTop: 30,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  healthItem: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  healthLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 8,
  },
  healthValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 4,
  },
});

export default DashboardScreen;
