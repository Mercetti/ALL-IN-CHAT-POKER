/**
 * Main React Native App Component
 * Entry point for Acey Control Center mobile app
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import new components
import Navigation from './src/Navigation';
import { SystemProvider } from './src/context/SystemContext';

// Import services
import PushNotificationService from './services/PushNotificationService';
import BiometricAuthService from './services/BiometricAuthService';
import AppShortcutsService from './services/AppShortcutsService';

export default function App() {
  useEffect(() => {
    // Initialize all services
    const initializeServices = async () => {
      try {
        // Initialize push notifications
        await PushNotificationService.initialize();
        
        // Initialize app shortcuts
        await AppShortcutsService.initialize();
        
        // Check biometric availability
        const biometricAvailable = await BiometricAuthService.isAvailable();
        if (biometricAvailable) {
          console.log('Biometric authentication available');
        }
        
        console.log('All services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <SystemProvider>
        <Navigation />
      </SystemProvider>
    </SafeAreaProvider>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
};
