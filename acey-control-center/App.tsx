import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { useAceyStore } from './src/state/aceyStore';

const App: React.FC = () => {
  const { clearError } = useAceyStore();

  useEffect(() => {
    // Clear any existing errors on app start
    clearError();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;
