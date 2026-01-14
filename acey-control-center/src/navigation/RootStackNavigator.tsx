/**
 * Root Stack Navigator with Type Definitions
 * Provides navigation structure for the entire app
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import { FullDashboardScreen } from '../screens/FullDashboardScreen';
import { SkillStoreScreen } from '../screens/SkillStoreScreen';
import { FutureSkillScreen } from '../screens/FutureSkillScreen';
import { UpgradeDashboardScreen } from '../screens/UpgradeDashboardScreen';
import { IncidentDashboardScreen } from '../screens/IncidentDashboardScreen';
import { UnlockCeremonyScreen } from '../screens/UnlockCeremonyScreen';
import BottomTabNavigator from './BottomTabNavigator';

// Import stores
import { useAceyStore } from '../state/aceyStore';

// Type definitions for navigation
export type RootStackParamList = {
  MainTabs: undefined;
  Dashboard: undefined;
  SkillStore: undefined;
  FutureSkills: undefined;
  Upgrade: undefined;
  Incidents: undefined;
  UnlockCeremony: undefined;
  SkillDetails: { skillId: string };
  FutureSkillDetails: { skillId: string };
  UpgradeFlow: { tierId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

// Auth Screen (placeholder for now)
const AuthScreen: React.FC = () => {
  return (
    <View style={styles.authContainer}>
      <Icon name="security" size={48} color="#2196F3" />
      <Text style={styles.authTitle}>Acey Control Center</Text>
      <Text style={styles.authSubtitle}>Authentication Required</Text>
      <Text style={styles.authMessage}>
        Please set up device authentication to continue.
      </Text>
    </View>
  );
};

// Main App Navigator with Stack
export const RootStackNavigator = () => {
  const { token } = useAceyStore();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    // Check authentication status
    setIsAuthenticated(!!token);
  }, [token]);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E1E1E',
            borderBottomColor: '#333333',
            borderBottomWidth: 1,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={BottomTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Incidents"
              component={IncidentDashboardScreen}
              options={{
                title: 'Incident Dashboard',
                headerLeft: () => (
                  <Icon name="arrow-back" size={24} color="#FFFFFF" style={{ marginLeft: 16 }} />
                ),
              }}
            />
            <Stack.Screen
              name="UnlockCeremony"
              component={UnlockCeremonyScreen}
              options={{
                title: 'Unlock Ceremony',
                headerLeft: () => (
                  <Icon name="arrow-back" size={24} color="#FFFFFF" style={{ marginLeft: 16 }} />
                ),
              }}
            />
            {/* Future screens for detailed views */}
            <Stack.Screen
              name="SkillDetails"
              component={FullDashboardScreen} // Placeholder - would be a dedicated screen
              options={{
                title: 'Skill Details',
                headerLeft: () => (
                  <Icon name="arrow-back" size={24} color="#FFFFFF" style={{ marginLeft: 16 }} />
                ),
              }}
            />
            <Stack.Screen
              name="FutureSkillDetails"
              component={FutureSkillScreen} // Placeholder - would be a dedicated screen
              options={{
                title: 'Future Skill Details',
                headerLeft: () => (
                  <Icon name="arrow-back" size={24} color="#FFFFFF" style={{ marginLeft: 16 }} />
                ),
              }}
            />
            <Stack.Screen
              name="UpgradeFlow"
              component={UpgradeDashboardScreen} // Placeholder - would be a dedicated screen
              options={{
                title: 'Upgrade Flow',
                headerLeft: () => (
                  <Icon name="arrow-back" size={24} color="#FFFFFF" style={{ marginLeft: 16 }} />
                ),
              }}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = {
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  } as const,
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 20,
  } as const,
  authSubtitle: {
    fontSize: 18,
    color: '#9E9E9E',
    marginBottom: 16,
  } as const,
  authMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  } as const,
};

export default RootStackNavigator;
