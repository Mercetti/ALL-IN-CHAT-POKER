import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface SafeModeStatus {
  isActive: boolean;
  autoTriggered: boolean;
  triggerReason?: string;
  lastTriggered?: string;
  resourceStatus: {
    cpu: number;
    memory: number;
    gpu: number;
    overall: number;
  };
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export default function SafeModeControlScreen() {
  const [safeModeStatus, setSafeModeStatus] = useState<SafeModeStatus>({
    isActive: false,
    autoTriggered: false,
    resourceStatus: {
      cpu: 0,
      memory: 0,
      gpu: 0,
      overall: 0
    },
    systemHealth: 'healthy'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchSafeModeStatus();
    const interval = setInterval(fetchSafeModeStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSafeModeStatus = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/acey/safe-mode/status');
      const data = await response.json();
      setSafeModeStatus(data);
    } catch (error) {
      console.error('Failed to fetch Safe Mode status:', error);
    }
  };

  const toggleSafeMode = async (enable: boolean) => {
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/acey/safe-mode/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: enable,
          reason: enable ? 'Manual activation from mobile app' : 'Manual deactivation from mobile app'
        }),
      });

      if (response.ok) {
        setSafeModeStatus(prev => ({ ...prev, isActive: enable, autoTriggered: false }));
        Alert.alert(
          'Success',
          enable ? 'Safe Mode activated successfully' : 'Safe Mode deactivated successfully'
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to toggle Safe Mode');
      }
    } catch (error) {
      console.error('Failed to toggle Safe Mode:', error);
      Alert.alert('Error', 'Failed to toggle Safe Mode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAutoTriggerSettings = async (enabled: boolean) => {
    try {
      const response = await fetch('http://localhost:8080/api/acey/safe-mode/auto-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled,
          thresholds: {
            cpu: 80,
            memory: 85,
            gpu: 90
          }
        }),
      });

      if (response.ok) {
        setAutoTriggerEnabled(enabled);
      } else {
        Alert.alert('Error', 'Failed to update auto-trigger settings');
      }
    } catch (error) {
      console.error('Failed to update auto-trigger settings:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'critical': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const getResourceColor = (value: number) => {
    if (value >= 90) return '#EF4444';
    if (value >= 70) return '#F59E0B';
    return '#10B981';
  };

  const renderResourceBar = (label: string, value: number, icon: string) => (
    <View style={styles.resourceItem}>
      <View style={styles.resourceHeader}>
        <Ionicons name={icon as any} size={16} color="#6B7280" />
        <Text style={styles.resourceLabel}>{label}</Text>
        <Text style={[styles.resourceValue, { color: getResourceColor(value) }]}>
          {value}%
        </Text>
      </View>
      <View style={styles.resourceBarContainer}>
        <View style={[styles.resourceBar, { width: `${value}%`, backgroundColor: getResourceColor(value) }]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safe Mode Control</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Safe Mode Status</Text>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: getHealthColor(safeModeStatus.systemHealth) }
              ]}>
                <Ionicons
                  name={getHealthIcon(safeModeStatus.systemHealth) as any}
                  size={24}
                  color="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.statusInfo}>
              <Text style={[
                styles.statusText,
                { color: safeModeStatus.isActive ? '#EF4444' : '#10B981' }
              ]}>
                {safeModeStatus.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
              {safeModeStatus.autoTriggered && (
                <Text style={styles.autoTriggeredText}>
                  Auto-triggered: {safeModeStatus.triggerReason}
                </Text>
              )}
              {safeModeStatus.lastTriggered && (
                <Text style={styles.lastTriggeredText}>
                  Last triggered: {new Date(safeModeStatus.lastTriggered).toLocaleString()}
                </Text>
              )}
            </View>
          </View>

          {/* Manual Control */}
          <View style={styles.controlCard}>
            <Text style={styles.cardTitle}>Manual Control</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Enable Safe Mode</Text>
              <Switch
                value={safeModeStatus.isActive}
                onValueChange={toggleSafeMode}
                disabled={isLoading}
                trackColor={{ false: '#E5E7EB', true: '#FEE2E2' }}
                thumbColor={safeModeStatus.isActive ? '#EF4444' : '#9CA3AF'}
              />
            </View>
            <Text style={styles.cardDescription}>
              Manually activate Safe Mode to freeze non-essential operations during emergencies.
            </Text>
          </View>

          {/* Auto-Trigger Settings */}
          <View style={styles.controlCard}>
            <Text style={styles.cardTitle}>Auto-Trigger Settings</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Enable Auto-Trigger</Text>
              <Switch
                value={autoTriggerEnabled}
                onValueChange={updateAutoTriggerSettings}
                trackColor={{ false: '#E5E7EB', true: '#D1FAE5' }}
                thumbColor={autoTriggerEnabled ? '#10B981' : '#9CA3AF'}
              />
            </View>
            <Text style={styles.cardDescription}>
              Automatically activate Safe Mode when resource usage exceeds thresholds.
            </Text>
          </View>

          {/* Resource Status */}
          <View style={styles.resourceCard}>
            <Text style={styles.cardTitle}>Resource Status</Text>
            {renderResourceBar('CPU', safeModeStatus.resourceStatus.cpu, 'hardware-chip')}
            {renderResourceBar('Memory', safeModeStatus.resourceStatus.memory, 'cube')}
            {renderResourceBar('GPU', safeModeStatus.resourceStatus.gpu, 'desktop')}
            {renderResourceBar('Overall', safeModeStatus.resourceStatus.overall, 'speedometer')}
          </View>

          {/* Safe Mode Information */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>About Safe Mode</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text style={styles.infoText}>
                  Freezes non-essential operations during emergencies
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="notifications" size={20} color="#3B82F6" />
                <Text style={styles.infoText}>
                  Keeps monitoring and alerts active
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <Text style={styles.infoText}>
                  Auto-triggers on high resource usage
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="person" size={20} color="#8B5CF6" />
                <Text style={styles.infoText}>
                  Requires manual action to resume normal operation
                </Text>
              </View>
            </View>
          </View>

          {/* Emergency Actions */}
          <View style={styles.emergencyCard}>
            <Text style={styles.cardTitle}>Emergency Actions</Text>
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() => toggleSafeMode(true)}
              disabled={safeModeStatus.isActive || isLoading}
            >
              <Ionicons name="shield" size={20} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>Emergency Safe Mode</Text>
            </TouchableOpacity>
            <Text style={styles.emergencyDescription}>
              Immediately activate Safe Mode for critical situations.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  autoTriggeredText: {
    fontSize: 14,
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 4,
  },
  lastTriggeredText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  controlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceItem: {
    marginBottom: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  resourceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  resourceBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  resourceBar: {
    height: '100%',
    borderRadius: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoList: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  emergencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
