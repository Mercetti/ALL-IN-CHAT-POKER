/**
 * Main React Native App Component
 * Entry point for the Acey Control Center mobile app
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import StatusScreen from './screens/StatusScreen';
import ControlScreen from './screens/ControlScreen';
import LogsScreen from './screens/LogsScreen';

// Import services
import PushNotificationService from './services/PushNotificationService';
import BiometricAuthService from './services/BiometricAuthService';
import AppShortcutsService from './services/AppShortcutsService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        headerStyle: {
          backgroundColor: '#030712',
          borderBottomColor: '#1e293b',
        },
        headerTintColor: '#ffffff',
      }}
    >
      <Tab.Screen 
        name="Status" 
        component={StatusScreen}
        options={{
          title: 'Status',
          tabBarLabel: 'Status',
        }}
      />
      <Tab.Screen 
        name="Control" 
        component={ControlScreen}
        options={{
          title: 'Control',
          tabBarLabel: 'Control',
        }}
      />
      <Tab.Screen 
        name="Logs" 
        component={LogsScreen}
        options={{
          title: 'Logs',
          tabBarLabel: 'Logs',
        }}
      />
    </Tab.Navigator>
  );
};

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
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#030712',
              borderBottomColor: '#1e293b',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            options={{ 
              title: 'Acey Control Center',
              headerShown: true,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
});
