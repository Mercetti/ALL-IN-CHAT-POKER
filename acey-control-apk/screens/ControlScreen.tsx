import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Switch, TextInput } from 'react-native';
import { useSystem } from '../src/context/SystemContext';
import { useAdvancedControls } from '../src/context/AdvancedControlsContext';

interface ControlScreenProps {
  navigation: any;
}

const ControlScreen: React.FC<ControlScreenProps> = ({ navigation }) => {
  const { state, actions } = useSystem();
  const advancedActions = useAdvancedControls();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fetch initial system status
    actions.refreshStatus();
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
        { text: 'Start', style: 'default', onPress: () => advancedActions.actions.startSystem() }
      ]
    );
  };

  const handleStopSystem = () => {
    Alert.alert(
      'Stop System',
      'Are you sure you want to stop the system?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => advancedActions.actions.stopSystem() }
      ]
    );
  };

  const handleRestartSystem = () => {
    Alert.alert(
      'Restart System',
      'Are you sure you want to restart the system?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restart', style: 'default', onPress: () => advancedActions.actions.restartSystem() }
      ]
    );
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      'Emergency Stop',
      'This will immediately stop all system processes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Emergency Stop', style: 'destructive', onPress: () => advancedActions.actions.emergencyStop() }
      ]
    );
  };

  const handleSetThrottlingLevel = (level: 'low' | 'medium' | 'high' | 'off') => {
    advancedActions.actions.setThrottlingLevel(level);
  };

  const handleSetMode = (mode: 'live' | 'build' | 'safe' | 'offline') => {
    advancedActions.actions.setMode(mode);
  };

  const handleToggleAutoOptimization = () => {
    if (advancedActions.state.autoOptimization.enabled) {
      advancedActions.actions.disableAutoOptimization();
    } else {
      advancedActions.actions.enableAutoOptimization();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'offline': return '#ef4444';
      case 'error': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'live': return '#10b981';
      case 'build': return '#f59e0b';
      case 'safe': return '#3b82f6';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Control</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* System Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusValue, { color: getStatusColor(state.status) }]}>
              {state.status.toUpperCase()}
            </Text>
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Mode:</Text>
            <Text style={[styles.statusValue, { color: getModeColor(state.mode) }]}>
              {state.mode.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* System Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Controls</Text>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.startButton]}
            onPress={handleStartSystem}
            disabled={state.status === 'online'}
          >
            <Text style={styles.controlButtonText}>▶️ Start System</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.stopButton]}
            onPress={handleStopSystem}
            disabled={state.status === 'offline'}
          >
            <Text style={styles.controlButtonText}>⏹️ Stop System</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.restartButton]}
            onPress={handleRestartSystem}
            disabled={state.status === 'offline'}
          >
            <Text style={styles.controlButtonText}>🔄 Restart System</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.emergencyButton]}
            onPress={handleEmergencyStop}
          >
            <Text style={styles.controlButtonText}>🚨 Emergency Stop</Text>
          </TouchableOpacity>
        </View>

        {/* Advanced Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Controls</Text>
          
          {/* Throttling */}
          <View style={styles.advancedControl}>
            <Text style={styles.advancedControlTitle}>Throttling</Text>
            <View style={styles.throttlingButtons}>
              {(['low', 'medium', 'high', 'off'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.throttlingButton,
                    advancedActions.state.throttling.level === level && styles.throttlingButtonActive
                  ]}
                  onPress={() => handleSetThrottlingLevel(level)}
                >
                  <Text style={[
                    styles.throttlingButtonText,
                    advancedActions.state.throttling.level === level && styles.throttlingButtonTextActive
                  ]}>
                    {level.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mode Switching */}
          <View style={styles.advancedControl}>
            <Text style={styles.advancedControlTitle}>Operating Mode</Text>
            <View style={styles.modeButtons}>
              {(['live', 'build', 'safe', 'offline'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    state.mode === mode && styles.modeButtonActive
                  ]}
                  onPress={() => handleSetMode(mode)}
                >
                  <Text style={[
                    styles.modeButtonText,
                    state.mode === mode && styles.modeButtonTextActive
                  ]}>
                    {mode.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Auto-Optimization */}
          <View style={styles.advancedControl}>
            <Text style={styles.advancedControlTitle}>Auto-Optimization</Text>
            <View style={styles.switchControl}>
              <Text style={styles.switchLabel}>Enabled</Text>
              <Switch
                value={advancedActions.state.autoOptimization.enabled}
                onValueChange={handleToggleAutoOptimization}
                trackColor={{ true: '#3b82f6', false: '#6b7280' }}
              />
            </View>
            {advancedActions.state.autoOptimization.enabled && (
              <View style={styles.optimizationInfo}>
                <Text style={styles.optimizationText}>
                  Aggressive Mode: {advancedActions.state.autoOptimization.aggressiveMode ? 'ON' : 'OFF'}
                </Text>
                <Text style={styles.optimizationText}>
                  Cleanup Interval: {Math.round(advancedActions.state.autoOptimization.cleanupInterval / 1000)}s
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Resource Limits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resource Limits</Text>
          
          <View style={styles.resourceControl}>
            <Text style={styles.resourceLabel}>CPU Limit: {state.cpuLimit || 'Not Set'}%</Text>
            <TextInput
              style={styles.resourceInput}
              placeholder="Set CPU limit"
              keyboardType="numeric"
              onChangeText={(text) => {
                // Handle CPU limit change
                console.log('CPU limit:', text);
              }}
            />
          </View>
          
          <View style={styles.resourceControl}>
            <Text style={styles.resourceLabel}>Memory Limit: {state.memoryLimit || 'Not Set'}MB</Text>
            <TextInput
              style={styles.resourceInput}
              placeholder="Set memory limit"
              keyboardType="numeric"
              onChangeText={(text) => {
                // Handle memory limit change
                console.log('Memory limit:', text);
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    paddingHorizontal: 20,
    paddingVertical: 40,
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
  statusCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  restartButton: {
    backgroundColor: '#f59e0b',
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  advancedControl: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  advancedControlTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  throttlingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  throttlingButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  throttlingButtonActive: {
    backgroundColor: '#3b82f6',
  },
  throttlingButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  throttlingButtonTextActive: {
    color: '#ffffff',
  },
  modeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    width: '48%',
    marginVertical: 2,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  modeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  switchControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#ffffff',
  },
  optimizationInfo: {
    marginTop: 8,
  },
  optimizationText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  resourceControl: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resourceLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
  },
  resourceInput: {
    backgroundColor: '#374151',
    borderRadius: 6,
    padding: 8,
    color: '#ffffff',
    fontSize: 14,
  },
});

export default ControlScreen;
