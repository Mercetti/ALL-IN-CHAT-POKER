import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import ApprovalsScreen from '../screens/ApprovalsScreen';
import LogsScreen from '../screens/LogsScreen';
import CommandsScreen from '../screens/CommandsScreen';

// Import stores
import { useAceyStore } from '../state/aceyStore';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main screens
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Approvals':
              iconName = 'approval';
              break;
            case 'Logs':
              iconName = 'list-alt';
              break;
            case 'Commands':
              iconName = 'settings';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopColor: '#333333',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#1E1E1E',
          borderBottomColor: '#333333',
          borderBottomWidth: 1,
        },
        headerTintColor: '#FFFFFF',
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Approvals" 
        component={ApprovalsScreen}
        options={{ title: 'Approvals' }}
      />
      <Tab.Screen 
        name="Logs" 
        component={LogsScreen}
        options={{ title: 'Logs' }}
      />
      <Tab.Screen 
        name="Commands" 
        component={CommandsScreen}
        options={{ title: 'Commands' }}
      />
    </Tab.Navigator>
  );
};

// Auth Screen (placeholder for now)
const AuthScreen: React.FC = () => {
  return (
    <View style={styles.authContainer}>
      <Text style={styles.authTitle}>Acey Control Center</Text>
      <Text style={styles.authSubtitle}>Authentication Required</Text>
      <Text style={styles.authMessage}>
        Please set up device authentication to continue.
      </Text>
    </View>
  );
};

// Main App Navigator
const AppNavigator: React.FC = () => {
  const { token } = useAceyStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    setIsAuthenticated(!!token);
  }, [token]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 18,
    color: '#9E9E9E',
    marginBottom: 16,
  },
  authMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default AppNavigator;
