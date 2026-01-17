/**
 * Main React Native App Component
 * Entry point for the All-In Chat Poker mobile app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import GameScreen from './src/screens/GameScreen.jsx';
import BiometricAuth from './src/components/BiometricAuth.jsx';
import PushNotificationService from './src/services/PushNotificationService.jsx';
import AppShortcutsService from './src/services/AppShortcutsService.jsx';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

const Stack = createStackNavigator();

const App = () => {
  const { theme } = useTheme();

  React.useEffect(() => {
    // Initialize services
    PushNotificationService.initialize();
    AppShortcutsService.initialize();
  }, []);

  return React.createElement(
    ThemeProvider,
    null,
    React.createElement(
      SafeAreaProvider,
      null,
      React.createElement(
        NavigationContainer,
        null,
        React.createElement(
          Stack.Navigator,
          { initialRouteName: 'Game', screenOptions: { headerShown: false } },
          React.createElement(
            Stack.Screen,
            { name: 'Game', component: GameScreen }
          )
        ),
      )
    )
  );
};

export default App;
