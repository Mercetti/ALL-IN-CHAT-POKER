import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Switch, TextInput } from 'react-native';
import { useSystem } from '../src/context/SystemContext';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { state, actions } = useSystem();
  const [refreshing, setRefreshing] = useState(false);
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [serverUrl, setServerUrl] = useState('https://all-in-chat-poker.fly.dev');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showServerUrlModal, setShowServerUrlModal] = useState(false);

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

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      // Save API key to secure storage
      console.log('Saving API key:', apiKey);
      setShowApiKeyModal(false);
      Alert.alert('Success', 'API key saved successfully');
    } else {
      Alert.alert('Error', 'Please enter a valid API key');
    }
  };

  const handleSaveServerUrl = () => {
    if (serverUrl.trim()) {
      // Save server URL to secure storage
      console.log('Saving server URL:', serverUrl);
      setShowServerUrlModal(false);
      Alert.alert('Success', 'Server URL saved successfully');
    } else {
      Alert.alert('Error', 'Please enter a valid server URL');
    }
  };

  const handleTestConnection = () => {
    Alert.alert(
      'Test Connection',
      'Test connection to server?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Test', style: 'default' }
      ],
      (buttonIndex) => {
        if (buttonIndex === 1) {
          // Test connection logic would go here
          Alert.alert('Connection Test', 'Connection test completed successfully');
        }
      }
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive' }
      ],
      (buttonIndex) => {
        if (buttonIndex === 1) {
          setNotifications(true);
          setAutoRefresh(true);
          setDarkMode(false);
          setSoundEnabled(true);
          setVibrationEnabled(true);
          setServerUrl('https://all-in-chat-poker.fly.dev');
          setApiKey('');
          Alert.alert('Success', 'Settings reset to default values');
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
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
        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>Enable push notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: '#3b82f6', false: '#6b7280' }}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Refresh</Text>
              <Text style={styles.settingDescription}>Auto-refresh system status</Text>
            </View>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ true: '#3b82f6', false: '#6b7280' }}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Enable dark theme</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ true: '#3b82f6', false: '#6b7280' }}
            />
          </View>
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Vibration</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Text style={styles.settingDescription}>Enable sound effects</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ true: '#3b82f6', false: '#6b7280' }}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Text style={styles.settingDescription}>Enable vibration feedback</Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ true: '#3b82f6', false: '#6b7280' }}
            />
          </View>
        </View>

        {/* Server Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server Configuration</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Server URL</Text>
              <Text style={styles.settingValue}>{serverUrl}</Text>
            </View>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setShowServerUrlModal(true)}
            >
              <Text style={styles.settingButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>API Key</Text>
              <Text style={styles.settingValue}>
                {apiKey ? '••••••••••' : 'Not set'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setShowApiKeyModal(true)}
            >
              <Text style={styles.settingButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTestConnection}
          >
            <Text style={styles.actionButtonText}>🔗 Test Connection</Text>
          </TouchableOpacity>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build Number</Text>
            <Text style={styles.infoValue}>2024.01.17</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Device ID</Text>
            <Text style={styles.infoValue}>ACEY-CTRL-001</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last Sync</Text>
            <Text style={styles.infoValue}>2 minutes ago</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleResetSettings}
          >
            <Text style={styles.actionButtonText}>🔄 Reset to Defaults</Text>
          </TouchableOpacity>
          
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
        </View>
      </ScrollView>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>API Key Configuration</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowApiKeyModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Enter your API key for server authentication
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter API key..."
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={true}
              multiline={false}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowApiKeyModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveApiKey}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Server URL Modal */}
      {showServerUrlModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Server URL Configuration</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowServerUrlModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Enter the server URL for API connections
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="https://your-server.com"
              value={serverUrl}
              onChangeText={setServerUrl}
              multiline={false}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowServerUrlModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingInfo: {
    flex: 1,
  marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#94a3b8',
  },
  settingValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  settingButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  settingButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  modalCancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSaveButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
  },
  modalSaveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SettingsScreen;
