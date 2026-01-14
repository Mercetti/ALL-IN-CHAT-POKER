import React, { useEffect } from 'react';
import { useAceyStore } from './src/state/aceyStore';
import { RootStackNavigator } from './src/navigation/RootStackNavigator';

const App: React.FC = () => {
  const { clearError } = useAceyStore();

  useEffect(() => {
    // Clear any existing errors on app start
    clearError();
  }, []);

  return <RootStackNavigator />;
};

export default App;
