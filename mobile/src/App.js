/**
 * Main React Native App Component
 * Entry point for the All-In Chat Poker mobile app
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';

// Import theme provider and screens
import { ThemeProvider } from './theme/ThemeContext';
import GameScreen from './screens/GameScreen';
import BiometricAuth from './components/BiometricAuth';
import PushNotificationService from './services/PushNotificationService';
import AppShortcutsService from './services/AppShortcutsService';

// Initialize services
const pushNotificationService = new PushNotificationService();
const appShortcutsService = new AppShortcutsService();

// Create stack navigator
const Stack = createNativeStackNavigator();

const App = () => {
  useEffect(() => {
    // Initialize platform-specific services
    const initializeServices = async () => {
      try {
        await pushNotificationService.initialize();
        await appShortcutsService.initialize();
        console.log('Platform services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize platform services:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider style={styles.container}>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor="#030712" />
          <Stack.Navigator>
            <Stack.Screen
              name="Game"
              component={GameScreen}
              options={{
                title: 'All-In Chat Poker',
                headerStyle: {
                  backgroundColor: '#4adeff',
                },
                headerTintColor: '#ffffff',
              }}
            />
            <Stack.Screen
              name="BiometricAuth"
              component={BiometricAuth}
              options={{
                title: 'Secure Login',
                headerStyle: {
                  backgroundColor: '#4adeff',
                },
                headerTintColor: '#ffffff',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
});

export default App;
