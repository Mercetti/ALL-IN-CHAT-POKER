/**
 * Navigation Container
 * Sets up React Navigation for Acey Control Center
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

// Import screens
import StatusScreen from '../screens/StatusScreen';
import ControlScreen from '../screens/ControlScreen';
import LogsScreen from '../screens/LogsScreen';
import LoginScreen from '../screens/LoginScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useAuth } from '../context/AuthContext';

// Create tab navigator
const Tab = createBottomTabNavigator();

// Create stack navigator for nested navigation
const Stack = createStackNavigator();

function MainTabs() {
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
          borderBottomColor: '#334155',
        },
        headerTintColor: '#ffffff',
      }}
    >
      <Tab.Screen 
        name="Status" 
        component={StatusScreen}
        options={{
          tabBarLabel: 'Status',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Control" 
        component={ControlScreen}
        options={{
          tabBarLabel: 'Control',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>🎮</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Logs" 
        component={LogsScreen}
        options={{
          tabBarLabel: 'Logs',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>📈</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#030712',
          borderBottomColor: '#334155',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          headerShown: false,
          gestureEnabled: false
        }}
      />
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { state } = useAuth();

  return (
    <NavigationContainer>
      {state.isAuthenticated ? <AppNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}
