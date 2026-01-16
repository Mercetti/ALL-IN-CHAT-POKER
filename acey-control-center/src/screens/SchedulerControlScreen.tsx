/**
 * Scheduler Control Screen for Acey
 * Phase 7: Live Auto-Cycle Scheduling
 * 
 * This screen provides mobile UI for controlling the auto scheduler
 * including start/stop, pause/resume, interval adjustment, and cycle monitoring
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AutoScheduler, SchedulerStatus, CycleMetrics } from '../../orchestrator/scheduler';
import { AceyExecutionPack } from '../../orchestrator/index';

// Types for scheduler control
interface SchedulerConfig {
  intervalMs: number;
  enableAutoStart: boolean;
  enableNotifications: boolean;
  enableEmergencyMode: boolean;
  maxConsecutiveFailures: number;
  healthCheckInterval: number;
  logRetentionDays: number;
}

export default function SchedulerControlScreen({ userToken, ownerToken, username, userRole }: any) {
  const [scheduler, setScheduler] = useState<AutoScheduler | null>(null);
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [recentCycles, setRecentCycles] = useState<CycleMetrics[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SchedulerConfig>({
    intervalMs: 60000,
    enableAutoStart: false,
    enableNotifications: true,
    enableEmergencyMode: true,
    maxConsecutiveFailures: 3,
    healthCheckInterval: 30000,
    logRetentionDays: 7
  });

  // Initialize scheduler
  useEffect(() => {
    const initializeScheduler = async () => {
      try {
        setLoading(true);
        
        // Create execution pack
        const pack = new AceyExecutionPack({
          // Local LLM configuration
          ollamaPath: 'ollama',
          modelsPath: './models',
          enableStreaming: false,
          maxConcurrency: 2,
          timeoutMs: 30000,
          learningEnabled: true,
          qualityThreshold: 0.7,
          
          // Device sync configuration
          syncPath: './models/device_sync',
          encryptionEnabled: true,
          autoSync: true,
          syncInterval: 5,
          maxDevices: 10,
          trustRequired: true,
          backupEnabled: true,
          
          // Skill discovery configuration
          discoveryLogPath: './logs/skill_discovery',
          proposalPath: './logs/proposals',
          analysisInterval: 5,
          minPatternFrequency: 10,
          proposalThreshold: 0.7,
          enableAutoAnalysis: true,
          
          // Dashboard configuration
          logsPath: './logs',
          financialsPath: './logs/financials',
          updateInterval: 5000,
          enableRealTimeUpdates: true,
          
          // Security configuration
          enableSecurityMonitoring: true,
          trustVerificationRequired: true,
          auditLogging: true,
          emergencyMode: false
        });
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create scheduler
        const autoScheduler = new AutoScheduler(pack, config);
        setScheduler(autoScheduler);
        
        // Set up event listeners
        autoScheduler.on('statusUpdate', (newStatus: SchedulerStatus) => {
          setStatus(newStatus);
        });
        
        autoScheduler.on('cycleCompleted', (cycle: CycleMetrics) => {
          setRecentCycles(prev => [cycle, ...prev.slice(0, 9)]);
        });
        
        autoScheduler.on('alert', (alert) => {
          console.log('Scheduler alert:', alert);
        });
        
        // Get initial status
        const initialStatus = autoScheduler.getStatus();
        setStatus(initialStatus);
        
        // Get recent cycles
        const cycles = autoScheduler.getCycleHistory(10);
        setRecentCycles(cycles);
        
        setLoading(false);
        
      } catch (error) {
        console.error('Failed to initialize scheduler:', error);
        Alert.alert('Error', 'Failed to initialize scheduler');
        setLoading(false);
      }
    };
    
    initializeScheduler();
  }, []);

  // Update status periodically
  useEffect(() => {
    if (!scheduler) return;
    
    const interval = setInterval(() => {
      const newStatus = scheduler.getStatus();
      setStatus(newStatus);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [scheduler]);

  const onRefresh = async () => {
    if (!scheduler) return;
    
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newStatus = scheduler.getStatus();
    setStatus(newStatus);
    
    const cycles = scheduler.getCycleHistory(10);
    setRecentCycles(cycles);
    
    setRefreshing(false);
  };

  const handleStart = () => {
    if (!scheduler) return;
    
    scheduler.start();
    Alert.alert('Scheduler Started', 'Auto-cycle scheduler has been started');
  };

  const handleStop = () => {
    if (!scheduler) return;
    
    Alert.alert(
      'Stop Scheduler',
      'Are you sure you want to stop the auto-cycle scheduler?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            scheduler.stop();
            Alert.alert('Scheduler Stopped', 'Auto-cycle scheduler has been stopped');
          }
        }
      ]
    );
  };

  const handlePause = () => {
    if (!scheduler) return;
    
    scheduler.pause();
    Alert.alert('Scheduler Paused', 'Auto-cycle scheduler has been paused');
  };

  const handleResume = () => {
    if (!scheduler) return;
    
    scheduler.resume();
    Alert.alert('Scheduler Resumed', 'Auto-cycle scheduler has been resumed');
  };

  const handleIntervalChange = (newInterval: number) => {
    if (!scheduler) return;
    
    scheduler.setIntervalMs(newInterval);
    setConfig(prev => ({ ...prev, intervalMs: newInterval }));
    Alert.alert('Interval Updated', `Cycle interval set to ${newInterval / 1000} seconds`);
  };

  const handleConfigChange = (key: keyof SchedulerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#FF9800';
      case 'poor': return '#FF5722';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getAlertColor = (type: string): string => {
    switch (type) {
      case 'info': return '#2196F3';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Initializing scheduler...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!scheduler || !status) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load scheduler</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scheduler Control</Text>
        <Text style={styles.headerSubtitle}>Auto-Cycle Management</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Status Overview</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[
                styles.statusValue,
                { color: status.isRunning ? '#4CAF50' : '#F44336' }
              ]}>
                {status.isRunning ? (status.isPaused ? '⏸️ Paused' : '▶️ Running') : '⏹️ Stopped'}
              </Text>
            </View>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Current Cycle</Text>
              <Text style={styles.statusValue}>#{status.currentCycle}</Text>
            </View>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Total Cycles</Text>
              <Text style={styles.statusValue}>{status.totalCycles}</Text>
            </View>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Uptime</Text>
              <Text style={styles.statusValue}>{status.uptime}</Text>
            </View>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Controls</Text>
          <View style={styles.controlGrid}>
            {!status.isRunning ? (
              <TouchableOpacity style={styles.controlButton} onPress={handleStart}>
                <Icon name="play-arrow" size={24} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <>
                {status.isPaused ? (
                  <TouchableOpacity style={styles.controlButton} onPress={handleResume}>
                    <Icon name="play-arrow" size={24} color="#FFFFFF" />
                    <Text style={styles.controlButtonText}>Resume</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.controlButton} onPress={handlePause}>
                    <Icon name="pause" size={24} color="#FFFFFF" />
                    <Text style={styles.controlButtonText}>Pause</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={handleStop}>
                  <Icon name="stop" size={24} color="#FFFFFF" />
                  <Text style={styles.controlButtonText}>Stop</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Configuration</Text>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Cycle Interval</Text>
            <View style={styles.intervalButtons}>
              {[30000, 60000, 120000, 300000].map(interval => (
                <TouchableOpacity
                  key={interval}
                  style={[
                    styles.intervalButton,
                    config.intervalMs === interval && styles.intervalButtonActive
                  ]}
                  onPress={() => handleIntervalChange(interval)}
                >
                  <Text style={[
                    styles.intervalButtonText,
                    config.intervalMs === interval && styles.intervalButtonTextActive
                  ]}>
                    {interval / 1000}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.configItem}>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Enable Notifications</Text>
              <Switch
                value={config.enableNotifications}
                onValueChange={(value) => handleConfigChange('enableNotifications', value)}
              />
            </View>
          </View>

          <View style={styles.configItem}>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Enable Emergency Mode</Text>
              <Switch
                value={config.enableEmergencyMode}
                onValueChange={(value) => handleConfigChange('enableEmergencyMode', value)}
              />
            </View>
          </View>

          <View style={styles.configItem}>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Auto Start</Text>
              <Switch
                value={config.enableAutoStart}
                onValueChange={(value) => handleConfigChange('enableAutoStart', value)}
              />
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Performance</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceLabel}>Avg Cycle Time</Text>
              <Text style={styles.performanceValue}>
                {formatDuration(status.performance.avgCycleTime)}
              </Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceLabel}>Success Rate</Text>
              <Text style={styles.performanceValue}>
                {(status.performance.successRate * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceLabel}>Error Rate</Text>
              <Text style={[
                styles.performanceValue,
                { color: status.performance.errorRate > 0.1 ? '#F44336' : '#4CAF50' }
              ]}>
                {(status.performance.errorRate * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Cycles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Recent Cycles</Text>
          {recentCycles.length === 0 ? (
            <Text style={styles.emptyText}>No cycles completed yet</Text>
          ) : (
            recentCycles.map((cycle, index) => (
              <View key={cycle.cycleNumber} style={styles.cycleCard}>
                <View style={styles.cycleHeader}>
                  <Text style={styles.cycleTitle}>Cycle #{cycle.cycleNumber}</Text>
                  <View style={[
                    styles.cycleStatus,
                    { backgroundColor: cycle.success ? '#4CAF50' : '#F44336' }
                  ]}>
                    <Text style={styles.cycleStatusText}>
                      {cycle.success ? '✅ Success' : '❌ Failed'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cycleDetails}>
                  <Text style={styles.cycleDetail}>
                    Duration: {formatDuration(cycle.duration)}
                  </Text>
                  <Text style={styles.cycleDetail}>
                    Skills: {cycle.skillsSucceeded}/{cycle.skillsExecuted}
                  </Text>
                  <Text style={styles.cycleDetail}>
                    Devices: {cycle.devicesSynced}
                  </Text>
                  <Text style={styles.cycleDetail}>
                    Proposals: {cycle.proposalsGenerated}
                  </Text>
                  <Text style={styles.cycleDetail}>
                    Revenue: ${cycle.revenueGenerated}
                  </Text>
                </View>
                
                {cycle.errors.length > 0 && (
                  <View style={styles.cycleErrors}>
                    <Text style={styles.cycleErrorTitle}>Errors:</Text>
                    {cycle.errors.map((error, errorIndex) => (
                      <Text key={errorIndex} style={styles.cycleError}>
                        • {error}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Recent Alerts</Text>
          {status.alerts.length === 0 ? (
            <Text style={styles.emptyText}>No recent alerts</Text>
          ) : (
            status.alerts.slice(-5).map((alert, index) => (
              <View key={index} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={[
                    styles.alertType,
                    { backgroundColor: getAlertColor(alert.type) }
                  ]}>
                    <Text style={styles.alertTypeText}>
                      {alert.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.alertTime}>
                    {formatTime(alert.timestamp)}
                  </Text>
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
            ))
          )}
        </View>

        {/* Schedule Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Schedule Info</Text>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleItem}>
              Last Cycle: {status.lastCycleTime ? formatTime(status.lastCycleTime) : 'Never'}
            </Text>
            <Text style={styles.scheduleItem}>
              Next Cycle: {status.nextCycleTime ? formatTime(status.nextCycleTime) : 'Not scheduled'}
            </Text>
            <Text style={styles.scheduleItem}>
              Consecutive Failures: {status.consecutiveFailures}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
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
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    minWidth: '45%',
  },
  statusLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  controlGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  configItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configLabel: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  intervalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  intervalButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  intervalButtonActive: {
    backgroundColor: '#2196F3',
  },
  intervalButtonText: {
    fontSize: 12,
    color: '#E0E0E0',
  },
  intervalButtonTextActive: {
    color: '#FFFFFF',
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  performanceCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    minWidth: '30%',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cycleCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cycleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cycleStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cycleStatusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cycleDetails: {
    marginBottom: 8,
  },
  cycleDetail: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  cycleErrors: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 6,
    padding: 8,
  },
  cycleErrorTitle: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cycleError: {
    fontSize: 11,
    color: '#F44336',
    marginBottom: 2,
  },
  alertCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertTypeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  alertTime: {
    fontSize: 10,
    color: '#9E9E9E',
  },
  alertMessage: {
    fontSize: 12,
    color: '#E0E0E0',
  },
  scheduleInfo: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
  },
  scheduleItem: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});
