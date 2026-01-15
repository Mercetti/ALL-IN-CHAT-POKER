/**
 * Update Manager Component
 * Integrates update checking into your app
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import UpdateChecker from '../utils/UpdateChecker';

const UpdateManager = ({ updateServerUrl = 'http://localhost:3001' }) => {
  const [updateChecker] = useState(() => new UpdateChecker(updateServerUrl));
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check for updates on app start
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      const updateInfo = await updateChecker.checkForUpdates();
      if (updateInfo) {
        setUpdateAvailable(true);
        await updateChecker.showUpdateDialog(updateInfo);
      }
    } catch (error) {
      console.error('Update check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const manualCheck = async () => {
    await updateChecker.manualUpdateCheck();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, isChecking && styles.disabled]} 
        onPress={manualCheck}
        disabled={isChecking}
      >
        <Text style={styles.buttonText}>
          {isChecking ? 'Checking...' : '🔄 Check for Updates'}
        </Text>
      </TouchableOpacity>
      
      {updateAvailable && (
        <Text style={styles.updateText}>
          🆕 Update available!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  updateText: {
    marginTop: 8,
    color: '#007AFF',
    fontSize: 14,
  },
});

export default UpdateManager;
