/**
 * Acey Service Control Screen
 * Mobile interface for controlling Acey background service
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import aceyServiceService, { AceyServiceService } from '../services/aceyServiceService';
import { AceyServiceStatus, ServiceResponse } from '../services/aceyServiceService';

interface ServiceConfig {
  serviceIP: string;
  apiKey: string;
}

export const AceyServiceControlScreen = () => {
  const [status, setStatus] = useState<AceyServiceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<ServiceConfig>({
    serviceIP: '192.168.1.100',
    apiKey: 'default-key-change-me'
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load initial state
  useEffect(() => {
    checkConfiguration();
    loadStatus();
    
    // Set up auto-refresh
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadStatus, 5000); // Every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Check if service is configured
  const checkConfiguration = async () => {
    const isConfigured = aceyServiceService.isServiceConfigured();
    setConfigured(isConfigured);
    
    if (isConfigured) {
      setShowConfig(false);
    }
  };

  // Load service status
  const loadStatus = async () => {
    if (!configured) return;

    try {
      const serviceStatus = await aceyServiceService.getStatus();
      setStatus(serviceStatus);
    } catch (error) {
      console.error('Failed to load status:', error);
      // Try cached status
      const cachedStatus = await aceyServiceService.getCachedStatus();
      setStatus(cachedStatus);
    }
  };

  // Refresh status
  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
  };

  // Start Acey service
  const startAcey = async () => {
    Alert.alert(
      'Start Acey Service',
      'This will start Acey and begin using system resources. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setLoading(true);
            try {
              const response: ServiceResponse = await aceyServiceService.startAcey();
              Alert.alert('Success', response.message);
              await loadStatus();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Stop Acey service
  const stopAcey = async () => {
    Alert.alert(
      'Stop Acey Service',
      'This will safely stop Acey and save all logs. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response: ServiceResponse = await aceyServiceService.stopAcey();
              Alert.alert('Success', response.message);
              await loadStatus();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Configure service
  const configureService = async () => {
    setLoading(true);
    try {
      const success = await aceyServiceService.configureService(
        config.serviceIP,
        config.apiKey
      );
      
      if (success) {
        Alert.alert('Success', 'Service configured successfully!');
        setConfigured(true);
        setShowConfig(false);
        await loadStatus();
      } else {
        Alert.alert('Error', 'Failed to configure service. Please check IP and API key.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Test connection
  const testConnection = async () => {
    setLoading(true);
    try {
      const connected = await aceyServiceService.testConnection();
      if (connected) {
        Alert.alert('Success', 'Connection test successful!');
      } else {
        Alert.alert('Error', 'Connection test failed. Please check service status.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Authorize device
  const authorizeDevice = async () => {
    setLoading(true);
    try {
      const success = await aceyServiceService.authorizeDevice('Mobile Control App');
      if (success) {
        Alert.alert('Success', 'Device authorized successfully!');
      } else {
        Alert.alert('Error', 'Failed to authorize device.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render status card
  const renderStatusCard = () => {
    if (!status) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Status</Text>
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.statusText}>Loading status...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service Status</Text>
        
        <View style={styles.statusRow}>
          <Icon 
            name={status.active ? "play-circle" : "pause-circle"} 
            size={24} 
            color={status.active ? "#4CAF50" : "#FF9800"} 
          />
          <Text style={[styles.statusText, { color: status.active ? "#4CAF50" : "#FF9800" }]}>
            {status.active ? 'Active' : 'Paused'}
          </Text>
        </View>

        {status.active && (
          <>
            <View style={styles.statusRow}>
              <Icon name="timer" size={20} color="#666" />
              <Text style={styles.statusDetail}>
                Uptime: {AceyServiceService.formatUptime(status.uptime)}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Icon name="memory" size={20} color="#666" />
              <Text style={styles.statusDetail}>
                Memory: {AceyServiceService.formatMemory(status.resources.memoryUsed)} / {AceyServiceService.formatMemory(status.resources.memoryTotal)}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Icon name="psychology" size={20} color="#666" />
              <Text style={styles.statusDetail}>
                Skills: {status.skills.active} active
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Icon name="smart_toy" size={20} color="#666" />
              <Text style={styles.statusDetail}>
                LLMs: {status.llmConnections.active} connected
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  // Render control buttons
  const renderControls = () => {
    if (!configured) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Configuration</Text>
          <Text style={styles.description}>
            Configure connection to Acey background service
          </Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowConfig(true)}
          >
            <Text style={styles.buttonText}>Configure Service</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service Controls</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.controlButton, status?.active ? styles.stopButton : styles.startButton]}
            onPress={status?.active ? stopAcey : startAcey}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon 
                  name={status?.active ? "stop" : "play-arrow"} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.buttonText}>
                  {status?.active ? 'Stop' : 'Start'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.settingsRow}>
          <Text style={styles.settingLabel}>Auto-refresh</Text>
          <Switch
            value={autoRefresh}
            onValueChange={setAutoRefresh}
            trackColor={{ false: '#767577', true: '#2196F3' }}
            thumbColor={autoRefresh ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </View>
    );
  };

  // Render configuration modal
  const renderConfigModal = () => {
    if (!showConfig) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Configure Acey Service</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Service IP Address</Text>
            <Text style={styles.inputHint}>
              The IP address of the PC running Acey (e.g., 192.168.1.100)
            </Text>
            <TextInput
              style={styles.input}
              value={config.serviceIP}
              onChangeText={(text) => setConfig({ ...config, serviceIP: text })}
              placeholder="192.168.1.100"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>API Key</Text>
            <Text style={styles.inputHint}>
              The API key from your Acey service configuration
            </Text>
            <TextInput
              style={styles.input}
              value={config.apiKey}
              onChangeText={(text) => setConfig({ ...config, apiKey: text })}
              placeholder="API key"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowConfig(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={configureService}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Acey Service Control</Text>
          <Text style={styles.subtitle}>
            Control Acey background service from your mobile device
          </Text>
        </View>

        {renderStatusCard()}
        {renderControls()}

        {configured && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Advanced Options</Text>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={testConnection}
              disabled={loading}
            >
              <Icon name="network-check" size={20} color="#2196F3" />
              <Text style={styles.optionText}>Test Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={authorizeDevice}
              disabled={loading}
            >
              <Icon name="verified-user" size={20} color="#2196F3" />
              <Text style={styles.optionText}>Authorize Device</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => setShowConfig(true)}
            >
              <Icon name="settings" size={20} color="#2196F3" />
              <Text style={styles.optionText}>Edit Configuration</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {renderConfigModal()}
    </SafeAreaView>
  );
};

// Add missing import
import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#FFFFFF',
  },
  statusDetail: {
    fontSize: 14,
    color: '#9E9E9E',
    marginLeft: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  settingLabel: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  optionText: {
    fontSize: 16,
    color: '#2196F3',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#666666',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
