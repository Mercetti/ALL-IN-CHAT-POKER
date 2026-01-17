import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSystem } from '../src/context/SystemContext';
import { useAdvancedControls } from '../src/context/AdvancedControlsContext';

const ControlScreen = ({ navigation }) => {
  const { state, actions } = useSystem();
  const { actions: advancedActions } = useAdvancedControls();

  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  useEffect(() => {
    // Check if advanced controls should be available (only in admin mode)
    const shouldShowAdvancedControls = state.isAuthenticated && state.user?.role === 'admin';
    setShowAdvancedControls(shouldShowAdvancedControls);
  }, [state.isAuthenticated, state.user?.role]);

  const handleSystemControl = async (action) => {
    switch (action) {
      case 'start':
        await actions.startSystem();
        Alert.alert('System Control', 'Starting system...', [{ text: 'OK' }]);
        break;
      case 'stop':
        await actions.stopSystem();
        Alert.alert('System Control', 'Stopping system...', [{ text: 'OK' }]);
        break;
      case 'restart':
        await actions.restartSystem();
        Alert.alert('System Control', 'Restarting system...', [{ text: 'OK' }]);
        break;
      case 'emergency_stop':
        Alert.alert(
          'Emergency Stop',
          'This will immediately stop all system processes. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Stop', style: 'destructive' }
          ]
        );
        if (result) {
          await actions.emergencyStop();
          Alert.alert('System Control', 'Emergency stop executed!', [{ text: 'OK' }]);
        }
        break;
    }
  };

  const handleModeChange = async (mode) => {
    Alert.alert(
      'Mode Change',
      `Switch to ${mode.toUpperCase()} mode?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', style: 'default' }
      ]
    );

    await actions.setMode(mode);
  };

  const handleThrottlingChange = (level) => {
    actions.setThrottlingLevel(level);
    Alert.alert('Throttling', `Set throttling to ${level.toUpperCase()}`);
  };

  const handleResourceLimitChange = (resource, limit, threshold) => {
    actions.updateResourceLimit(resource, limit, threshold);
    Alert.alert('Resource Limits', `${resource.toUpperCase()} limit updated`);
  };

  const handleAutoOptimizationToggle = (aggressive) => {
    actions.enableAutoOptimization(aggressive);
    Alert.alert('Auto Optimization', aggressive ? 'Aggressive mode enabled' : 'Standard mode enabled');
  };

  const getCurrentThrottlingColor = () => {
    const level = advancedActions.getCurrentThrottlingLevel();
    switch (level) {
      case 'off': return '#10b981';
      case 'low': return '#f59e0b';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCurrentModeColor = () => {
    const mode = advancedActions.getCurrentMode();
    switch (mode) {
      case 'live': return '#ef4444';
      case 'build': return '#f59e0b';
      case 'safe': return '#10b981';
      case 'offline': return '#6b7280';
      default: return '#94a3b8';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Advanced Controls</Text>
        <Text style={styles.subtitle}>System performance management</Text>
      </View>

      {/* Basic Controls */}
      <View style={styles.controlSection}>
        <Text style={styles.sectionTitle}>System Control</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.controlButton, styles.startButton]}
            onPress={() => handleSystemControl('start')}
            disabled={state.loading}
          >
            {state.loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.controlText}>Start System</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.stopButton]}
            onPress={() => handleSystemControl('stop')}
            disabled={state.loading}
          >
            {state.loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.controlText}>Stop System</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.restartButton]}
            onPress={() => handleSystemControl('restart')}
            disabled={state.loading}
          >
            {state.loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.controlText}>Restart System</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.controlButton, styles.emergencyButton]}
          onPress={() => handleSystemControl('emergency_stop')}
          disabled={state.loading}
        >
          {state.loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.emergencyText}>⚠️ EMERGENCY STOP</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Mode Switching */}
      <View style={styles.controlSection}>
        <Text style={styles.sectionTitle}>Operating Mode</Text>

        <View style={styles.modeButtons}>
          {['live', 'build', 'safe'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                advancedActions.getCurrentMode() === mode && styles.activeModeButton
              ]}
              onPress={() => handleModeChange(mode)}
              disabled={state.modeSwitching.transitionInProgress}
            >
              <Text style={styles.modeText}>{mode.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {state.modeSwitching.transitionInProgress && (
          <View style={styles.transitionStatus}>
            <ActivityIndicator color="#3b82f6" size="small" />
            <Text style={styles.transitionText}>Switching mode...</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.advancedButton}
        onPress={() => setShowAdvancedControls(!showAdvancedControls)}
      >
        <Text style={styles.advancedButtonText}>
          {showAdvancedControls ? 'Hide' : 'Show'} Advanced Controls
        </Text>
      </TouchableOpacity>

      {/* Advanced Controls Panel */}
      {showAdvancedControls && (
        <View style={styles.advancedPanel}>
          <Text style={styles.sectionTitle}>Advanced Controls</Text>

          {/* Throttling */}
          <View style={styles.advancedSection}>
            <Text style={styles.subsectionTitle}>Throttling</Text>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, { color: getCurrentThrottlingColor() }]}>
                {advancedActions.isThrottlingActive() ? 'ON' : 'OFF'}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.smallButton, getCurrentThrottlingColor() === 'off' && styles.disabledButton]}
                onPress={() => handleThrottlingChange('low')}
                disabled={advancedActions.isThrottlingActive()}
              >
                <Text style={styles.smallButtonText}>Enable (LOW)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallButton, getCurrentThrottlingColor() === 'low' && styles.activeButton]}
                onPress={() => handleThrottlingChange('medium')}
                disabled={advancedActions.isThrottlingActive()}
              >
                <Text style={styles.smallButtonText}>Enable (MEDIUM)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallButton, getCurrentThrottlingColor() === 'high' && styles.activeButton]}
                onPress={() => handleThrottlingChange('high')}
                disabled={advancedActions.isThrottlingActive()}
              >
                <Text style={styles.smallButtonText}>Enable (HIGH)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallButton, styles.disabledButton]}
                onPress={() => actions.disableThrottling()}
                disabled={!advancedActions.isThrottlingActive()}
              >
                <Text style={styles.smallButtonText}>Disable</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Resource Limits */}
          <View style={styles.advancedSection}>
            <Text style={styles.subsectionTitle}>Resource Limits</Text>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={styles.statusValue}>
                {advancedActions.isResourceLimitExceeded('cpu') ? 'CPU' : 'OK'}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Memory:</Text>
              <Text style={styles.statusValue}>
                {advancedActions.isResourceLimitExceeded('memory') ? 'MEMORY' : 'OK'}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Tokens:</Text>
              <Text style={styles.statusValue}>
                {advancedActions.isResourceLimitExceeded('tokens') ? 'TOKENS' : 'OK'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => actions.enableResourceLimits({
              cpu: { max: 90, warningThreshold: 80 },
              memory: { max: 1024, warningThreshold: 800 },
              tokens: { maxPerMinute: 200, warningThreshold: 150 }
            })}
            disabled={state.resourceLimits.enabled}
          >
            <Text style={styles.smallButtonText}>Enable Limits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => actions.disableResourceLimits()}
            disabled={!state.resourceLimits.enabled}
          >
            <Text style={styles.smallButtonText}>Disable Limits</Text>
          </TouchableOpacity>
        </View>

        {/* Auto Optimization */}
        <View style={styles.advancedSection}>
          <Text style={styles.subsectionTitle}>Auto Optimization</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={styles.statusValue}>
              {advancedActions.getOptimizationStatus() ?
                advancedActions.getOptimizationStatus() === 'aggressive' ? 'AGGRESSIVE' : 'STANDARD'
              : 'OFF'}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.smallButton, !advancedActions.getOptimizationStatus() && styles.disabledButton]}
              onPress={() => actions.enableAutoOptimization()}
              disabled={advancedActions.getOptimizationStatus()}
            >
              <Text style={styles.smallButtonText}>Enable</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallButton, advancedActions.getOptimizationStatus() && styles.activeButton]}
              onPress={() => actions.enableAutoOptimization(true)}
              disabled={advancedActions.getOptimizationStatus()}
            >
              <Text style={styles.smallButtonText}>Aggressive</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallButton, advancedActions.getOptimizationStatus() && styles.activeButton]}
              onPress={() => actions.enableAutoOptimization(false)}
              disabled={advancedActions.getOptimizationStatus()}
            >
              <Text style={styles.smallButtonText}>Standard</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  controlSection: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  controlButton: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    marginBottom: 8,
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
    backgroundColor: '#991b1b',
  },
  controlText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  smallButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#6b7280',
  },
  activeModeButton: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  emergencyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  advancedPanel: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  advancedSection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#94a3b8',
    width: 80,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  smallButton: {
    backgroundColor: '#334155',
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
    minWidth: 80,
  },
  transitionStatus: {
    alignItems: 'center',
    marginBottom: 8,
  },
  transitionText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  advancedButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    alignSelf: 'center',
  },
  advancedButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ControlScreen;
