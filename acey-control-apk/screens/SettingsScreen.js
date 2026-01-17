import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSettings } from '../src/context/SettingsContext';

const SettingsScreen = ({ navigation }) => {
  const { state, actions } = useSettings();
  const [selectedSection, setSelectedSection] = useState('general');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tempSettings, setTempSettings] = useState({});

  const sections = [
    { id: 'general', title: 'General', icon: '⚙️' },
    { id: 'system', title: 'System', icon: '🖥️' },
    { id: 'security', title: 'Security', icon: '🔒' },
    { id: 'ui', title: 'UI & Display', icon: '🎨' },
    { id: 'advanced', title: 'Advanced', icon: '🔧' },
  ];

  const renderGeneralSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>General Settings</Text>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Theme</Text>
        <View style={styles.optionButtons}>
          {['light', 'dark', 'system'].map((theme) => (
            <TouchableOpacity
              key={theme}
              style={[
                styles.optionButton,
                state.general.theme === theme && styles.activeOption
              ]}
              onPress={() => actions.updateGeneralSettings({ theme })}
            >
              <Text style={styles.optionText}>{theme.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Language</Text>
        <View style={styles.optionButtons}>
          {['en', 'es', 'fr'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.optionButton,
                state.general.language === lang && styles.activeOption
              ]}
              onPress={() => actions.updateGeneralSettings({ language: lang })}
            >
              <Text style={styles.optionText}>{lang.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Auto Refresh</Text>
        <Switch
          value={state.general.autoRefresh}
          onValueChange={(value) => actions.updateGeneralSettings({ autoRefresh: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.general.autoRefresh ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Refresh Interval (seconds)</Text>
        <TextInput
          style={styles.textInput}
          value={state.general.refreshInterval.toString()}
          onChangeText={(text) => {
            const value = parseInt(text) || 30;
            actions.updateGeneralSettings({ refreshInterval: value });
          }}
          keyboardType="numeric"
          placeholder="30"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Notifications</Text>
        <Switch
          value={state.general.notifications}
          onValueChange={(value) => actions.updateGeneralSettings({ notifications: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.general.notifications ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Sound Effects</Text>
        <Switch
          value={state.general.soundEffects}
          onValueChange={(value) => actions.updateGeneralSettings({ soundEffects: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.general.soundEffects ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Haptic Feedback</Text>
        <Switch
          value={state.general.hapticFeedback}
          onValueChange={(value) => actions.updateGeneralSettings({ hapticFeedback: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.general.hapticFeedback ? '#ffffff' : '#9ca3af'}
        />
      </View>
    </View>
  );

  const renderSystemSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>System Settings</Text>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>API Endpoint</Text>
        <TextInput
          style={styles.textInput}
          value={state.system.apiEndpoint}
          onChangeText={(text) => actions.updateSystemSettings({ apiEndpoint: text })}
          placeholder="https://api.example.com"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Timeout (ms)</Text>
        <TextInput
          style={styles.textInput}
          value={state.system.timeout.toString()}
          onChangeText={(text) => {
            const value = parseInt(text) || 10000;
            actions.updateSystemSettings({ timeout: value });
          }}
          keyboardType="numeric"
          placeholder="10000"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Retry Attempts</Text>
        <TextInput
          style={styles.textInput}
          value={state.system.retryAttempts.toString()}
          onChangeText={(text) => {
            const value = parseInt(text) || 3;
            actions.updateSystemSettings({ retryAttempts: value });
          }}
          keyboardType="numeric"
          placeholder="3"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Log Level</Text>
        <View style={styles.optionButtons}>
          {['debug', 'info', 'warn', 'error'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.optionButton,
                state.system.logLevel === level && styles.activeOption
              ]}
              onPress={() => actions.updateSystemSettings({ logLevel: level })}
            >
              <Text style={styles.optionText}>{level.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Enable Analytics</Text>
        <Switch
          value={state.system.enableAnalytics}
          onValueChange={(value) => actions.updateSystemSettings({ enableAnalytics: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.system.enableAnalytics ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Crash Reporting</Text>
        <Switch
          value={state.system.crashReporting}
          onValueChange={(value) => actions.updateSystemSettings({ crashReporting: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.system.crashReporting ? '#ffffff' : '#9ca3af'}
        />
      </View>
    </View>
  );

  const renderSecuritySettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security Settings</Text>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Biometric Authentication</Text>
        <Switch
          value={state.security.biometricAuth}
          onValueChange={(value) => actions.updateSecuritySettings({ biometricAuth: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.security.biometricAuth ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Session Timeout (minutes)</Text>
        <TextInput
          style={styles.textInput}
          value={state.security.sessionTimeout.toString()}
          onChangeText={(text) => {
            const value = parseInt(text) || 30;
            actions.updateSecuritySettings({ sessionTimeout: value });
          }}
          keyboardType="numeric"
          placeholder="30"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Require Auth on Start</Text>
        <Switch
          value={state.security.requireAuthOnStart}
          onValueChange={(value) => actions.updateSecuritySettings({ requireAuthOnStart: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.security.requireAuthOnStart ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Encrypt Data</Text>
        <Switch
          value={state.security.encryptData}
          onValueChange={(value) => actions.updateSecuritySettings({ encryptData: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.security.encryptData ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Auto Lock</Text>
        <Switch
          value={state.security.autoLock}
          onValueChange={(value) => actions.updateSecuritySettings({ autoLock: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.security.autoLock ? '#ffffff' : '#9ca3af'}
        />
      </View>
    </View>
  );

  const renderUISettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>UI & Display Settings</Text>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Compact Mode</Text>
        <Switch
          value={state.ui.compactMode}
          onValueChange={(value) => actions.updateUISettings({ compactMode: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.ui.compactMode ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Show Animations</Text>
        <Switch
          value={state.ui.showAnimations}
          onValueChange={(value) => actions.updateUISettings({ showAnimations: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.ui.showAnimations ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Font Size</Text>
        <View style={styles.optionButtons}>
          {['small', 'medium', 'large'].map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.optionButton,
                state.ui.fontSize === size && styles.activeOption
              ]}
              onPress={() => actions.updateUISettings({ fontSize: size })}
            >
              <Text style={styles.optionText}>{size.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Chart Refresh Rate (seconds)</Text>
        <TextInput
          style={styles.textInput}
          value={state.ui.chartRefreshRate.toString()}
          onChangeText={(text) => {
            const value = parseInt(text) || 30;
            actions.updateUISettings({ chartRefreshRate: value });
          }}
          keyboardType="numeric"
          placeholder="30"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Show System Info</Text>
        <Switch
          value={state.ui.showSystemInfo}
          onValueChange={(value) => actions.updateUISettings({ showSystemInfo: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.ui.showSystemInfo ? '#ffffff' : '#9ca3af'}
        />
      </View>
    </View>
  );

  const renderAdvancedSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Advanced Settings</Text>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Developer Mode</Text>
        <Switch
          value={state.advanced.developerMode}
          onValueChange={(value) => actions.updateAdvancedSettings({ developerMode: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.advanced.developerMode ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Debug Mode</Text>
        <Switch
          value={state.advanced.debugMode}
          onValueChange={(value) => actions.updateAdvancedSettings({ debugMode: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.advanced.debugMode ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Experimental Features</Text>
        <Switch
          value={state.advanced.experimentalFeatures}
          onValueChange={(value) => actions.updateAdvancedSettings({ experimentalFeatures: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.advanced.experimentalFeatures ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Beta Updates</Text>
        <Switch
          value={state.advanced.betaUpdates}
          onValueChange={(value) => actions.updateAdvancedSettings({ betaUpdates: value })}
          trackColor={{ false: '#374151', true: '#3b82f6' }}
          thumbColor={state.advanced.betaUpdates ? '#ffffff' : '#9ca3af'}
        />
      </View>
    </View>
  );

  const renderContent = () => {
    switch (selectedSection) {
      case 'general':
        return renderGeneralSettings();
      case 'system':
        return renderSystemSettings();
      case 'security':
        return renderSecuritySettings();
      case 'ui':
        return renderUISettings();
      case 'advanced':
        return renderAdvancedSettings();
      default:
        return renderGeneralSettings();
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            actions.resetSettings();
            Alert.alert('Success', 'Settings have been reset to default values');
          }
        }
      ]
    );
  };

  const handleExportSettings = () => {
    const settingsJson = actions.exportSettings();
    console.log('Exported settings:', settingsJson);
    Alert.alert('Export Complete', 'Settings have been exported to console');
  };

  const validateAndSave = () => {
    const validation = actions.validateSettings();
    if (validation.isValid) {
      Alert.alert('Success', 'Settings are valid and have been saved');
    } else {
      Alert.alert('Validation Error', validation.errors.join('\n'));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure your preferences</Text>
      </View>
      
      {/* Section Navigation */}
      <View style={styles.sectionNav}>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionButton,
              selectedSection === section.id && styles.activeSection
            ]}
            onPress={() => setSelectedSection(section.id)}
          >
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <Text style={styles.sectionButtonText}>{section.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Settings Content */}
      {renderContent()}
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={validateAndSave}>
          <Text style={styles.actionButtonText}>Validate & Save</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleExportSettings}>
          <Text style={styles.actionButtonText}>Export Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={handleResetSettings}>
          <Text style={styles.actionButtonText}>Reset All</Text>
        </TouchableOpacity>
      </View>
      
      {/* Loading Indicator */}
      {state.loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#3b82f6" size="large" />
          <Text style={styles.loadingText}>Saving settings...</Text>
        </View>
      )}
      
      {/* Error Display */}
      {state.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {state.error}</Text>
        </View>
      )}
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
  sectionNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  sectionButton: {
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 100,
  },
  activeSection: {
    backgroundColor: '#3b82f6',
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  sectionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  optionButtons: {
    flexDirection: 'row',
  },
  optionButton: {
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 4,
  },
  activeOption: {
    backgroundColor: '#3b82f6',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#334155',
    color: '#ffffff',
    padding: 8,
    borderRadius: 6,
    minWidth: 100,
    textAlign: 'right',
  },
  actionButtons: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: '#991b1b',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#fca5a5',
    textAlign: 'center',
  },
});

export default SettingsScreen;
