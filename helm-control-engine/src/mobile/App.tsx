import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import StatusScreen from './screens/StatusScreen';
import ControlPanel from './screens/ControlPanel';
import DemoControl from './screens/DemoControl';
import LogsScreen from './screens/LogsScreen';
import SkillStore from './screens/SkillStore';
import SettingsScreen from './screens/SettingsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import FinancialsScreen from './screens/FinancialsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Status"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a1a1a',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Status" 
            component={StatusScreen}
            options={{ 
              title: 'Acey Status',
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="ControlPanel" 
            component={ControlPanel}
            options={{ 
              title: 'Control Panel',
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="DemoControl" 
            component={DemoControl}
            options={{ 
              title: 'Demo Control',
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="Logs" 
            component={LogsScreen}
            options={{ 
              title: 'System Logs',
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="SkillStore" 
            component={SkillStore}
            options={{ 
              title: 'Skill Store',
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ 
              title: 'Settings',
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{ 
              title: 'Notifications',
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="Financials" 
            component={FinancialsScreen}
            options={{ 
              title: 'Financials',
              headerShown: true,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
