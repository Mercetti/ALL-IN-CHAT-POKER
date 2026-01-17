/**
 * Main React Native App Component
 * Entry point for the All-In Chat Poker mobile app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import GameScreen from './screens/GameScreen';
import BiometricAuth from './components/BiometricAuth';
import PushNotificationService from './services/PushNotificationService';
import AppShortcutsService from './services/AppShortcutsService';
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
    { theme: theme },
    React.createElement(
      SafeAreaProvider,
      { style: styles.container },
      React.createElement(
        NavigationContainer,
        {},
        React.createElement(
          StatusBar,
          {
            barStyle: "light-content",
            backgroundColor: theme.colors.background
          }
        ),
        React.createElement(
          Stack.Navigator,
          {},
          React.createElement(
            Stack.Screen,
            {
              name: 'Game',
              component: GameScreen,
              options: {
                title: 'All-In Chat Poker',
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.surface,
              }
            }
          ),
          React.createElement(
            Stack.Screen,
            {
              name: 'BiometricAuth',
              component: BiometricAuth,
              options: {
                title: 'Secure Login',
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.surface,
              }
            }
          )
        )
      )
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
});

export default App;
