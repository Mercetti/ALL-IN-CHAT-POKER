/**
 * Main React Native App Component
 * Entry point for All-In Chat Poker mobile app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import GameScreen from './src/screens/GameScreen.jsx';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

const Stack = createStackNavigator();

const App = () => {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Game" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Game" component={GameScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

export default App;
