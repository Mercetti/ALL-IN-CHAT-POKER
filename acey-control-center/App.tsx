import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import UpdateChecker from './src/utils/UpdateChecker';

export default function App() {
  useEffect(() => {
    // Initialize update checker
    const updateChecker = new UpdateChecker();
    
    // Check for updates on app start
    updateChecker.checkForUpdates();
    
    // Set up periodic checks (every 12 hours)
    const checkInterval = setInterval(() => {
      updateChecker.checkForUpdates();
    }, 12 * 60 * 60 * 1000); // 12 hours
    
    return () => clearInterval(checkInterval);
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
