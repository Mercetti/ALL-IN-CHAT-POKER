/**
 * Bottom Tab Navigator for Skills-Focused Navigation
 * Provides quick access to Dashboard, Skill Store, and Future Skills
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import { FullDashboardScreen } from '../screens/FullDashboardScreen';
import { SkillStoreScreen } from '../screens/SkillStoreScreen';
import { FutureSkillScreen } from '../screens/FutureSkillScreen';
import { UpgradeDashboardScreen } from '../screens/UpgradeDashboardScreen';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string;

        switch (route.name) {
          case 'FullDashboard':
            iconName = focused ? 'dashboard' : 'dashboard-outline';
            break;
          case 'SkillStore':
            iconName = focused ? 'extension' : 'extension-outline';
            break;
          case 'FutureSkills':
            iconName = focused ? 'update' : 'update-outline';
            break;
          case 'UpgradeDashboard':
            iconName = focused ? 'stars' : 'stars-outline';
            break;
          default:
            iconName = 'help-outline';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2196F3',
      tabBarInactiveTintColor: '#9E9E9E',
      tabBarStyle: {
        backgroundColor: '#1E1E1E',
        borderTopColor: '#333333',
        borderTopWidth: 1,
        paddingBottom: 8,
        height: 60,
      },
      headerStyle: {
        backgroundColor: '#1E1E1E',
        borderBottomColor: '#333333',
        borderBottomWidth: 1,
      },
      headerTintColor: '#FFFFFF',
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen 
      name="FullDashboard" 
      component={FullDashboardScreen}
      options={{ 
        title: 'Control Center',
        tabBarLabel: 'Dashboard'
      }}
    />
    <Tab.Screen 
      name="SkillStore" 
      component={SkillStoreScreen}
      options={{ 
        title: 'Skill Store',
        tabBarLabel: 'Store'
      }}
    />
    <Tab.Screen 
      name="FutureSkills" 
      component={FutureSkillScreen}
      options={{ 
        title: 'Future Skills',
        tabBarLabel: 'Future'
      }}
    />
    <Tab.Screen 
      name="UpgradeDashboard" 
      component={UpgradeDashboardScreen}
      options={{ 
        title: 'Upgrade Dashboard',
        tabBarLabel: 'Upgrade'
      }}
    />
  </Tab.Navigator>
);

export default BottomTabNavigator;
