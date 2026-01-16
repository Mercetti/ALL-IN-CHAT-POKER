import React, { useState } from 'react';
import { View, Text, Button, Alert, Switch, StyleSheet, ScrollView } from 'react-native';
import useBiometricAuth from '../hooks/useBiometricAuth';
// @ts-ignore
import UpdateChecker from '../utils/UpdateChecker';

export default function Settings() {
  const { authenticate } = useBiometricAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [trialMode, setTrialMode] = useState(false);

  const handleAuth = async () => {
    const success = await authenticate();
    Alert.alert(success ? '✅ Authentication Successful' : '❌ Authentication Failed');
  };

  const handleDevicePairing = () => {
    Alert.alert(
      'Device Pairing',
      'Scan QR code or enter pairing code to connect this device to your Acey account.',
      [
        { text: 'Scan QR', onPress: () => Alert.alert('QR Scanner', 'Opening camera for QR scan...') },
        { text: 'Enter Code', onPress: () => Alert.alert('Pairing Code', 'Enter 6-digit pairing code...') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleTrialToggle = () => {
    setTrialMode(!trialMode);
    Alert.alert(
      'Trial Mode',
      trialMode ? 'Trial mode disabled. Full features require subscription.' : 'Trial mode enabled. Limited access to premium features.'
    );
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    Alert.alert('Dark Mode', darkMode ? 'Dark mode disabled.' : 'Dark mode enabled.');
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    Alert.alert(
      'Notifications',
      notificationsEnabled ? 'Push notifications disabled.' : 'Push notifications enabled.'
    );
  };

  const handleCheckForUpdates = async () => {
    try {
      const updateChecker = new UpdateChecker();
      const updateInfo = await updateChecker.checkForUpdates(true); // Force check
      
      if (updateInfo.hasUpdate) {
        Alert.alert(
          'Update Available',
          `Version ${updateInfo.latestVersion} is available!\n\nRelease notes:\n${updateInfo.releaseNotes || 'No release notes available.'}`,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Download Update', onPress: () => updateChecker.downloadUpdate(updateInfo) }
          ]
        );
      } else {
        Alert.alert('Up to Date', 'You have the latest version of Acey Control Center!');
      }
    } catch (error) {
      Alert.alert('Update Check Failed', 'Unable to check for updates. Please try again later.');
    }
  };

  const handleAccountManagement = () => {
    Alert.alert(
      'Account Management',
      'Manage your subscription, billing, and account settings.',
      [
        { text: 'Subscription', onPress: () => Alert.alert('Subscription', 'Current tier: Pro - $9.99/month') },
        { text: 'Billing', onPress: () => Alert.alert('Billing', 'Next billing date: Feb 14, 2026') },
        { text: 'Privacy', onPress: () => Alert.alert('Privacy', 'Your data is stored locally and encrypted.') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Biometric / QR Auth</Text>
            <Text style={styles.settingDescription}>Use fingerprint, face, or QR code to authenticate</Text>
          </View>
          <Button title="Authenticate" onPress={handleAuth} />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Device Pairing</Text>
            <Text style={styles.settingDescription}>Connect this device to your Acey account</Text>
          </View>
          <Button title="Pair Device" onPress={handleDevicePairing} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Trial Mode</Text>
            <Text style={styles.settingDescription}>Enable limited access to premium features</Text>
          </View>
          <Switch
            value={trialMode}
            onValueChange={handleTrialToggle}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>Receive alerts for updates and completed actions</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Toggle dark theme for the app</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={handleDarkModeToggle}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Account Management</Text>
            <Text style={styles.settingDescription}>Subscription, billing, and privacy settings</Text>
          </View>
          <Button title="Manage" onPress={handleAccountManagement} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Acey Control Center v1.0.0</Text>
        <Text style={styles.aboutText}>© 2026 Acey Platform</Text>
        <Text style={styles.aboutText}>Built with React Native & Expo</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Check for Updates</Text>
            <Text style={styles.settingDescription}>Manually check for app updates</Text>
          </View>
          <Button title="Check" onPress={handleCheckForUpdates} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
});
