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

// Import theme provider and screens
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';

// Initialize services
const pushNotificationService = new PushNotificationService();
const appShortcutsService = new AppShortcutsService();

// Create stack navigator
const Stack = createStackNavigator();

const App = () => {
  const { theme } = useTheme();

  React.useEffect(() => {
    // Initialize services
    pushNotificationService.initialize();
    appShortcutsService.initialize();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <SafeAreaProvider style={styles.container}>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
          <Stack.Navigator>
            <Stack.Screen
              name="Game"
              component={GameScreen}
              options={{
                title: 'All-In Chat Poker',
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.surface,
              }}
            />
            <Stack.Screen
              name="BiometricAuth"
              component={BiometricAuth}
              options={{
                title: 'Secure Login',
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.surface,
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
