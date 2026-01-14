import React from 'react';
import { createStackNavigator } from '@react-navigation/native';
import { TierOverviewScreen } from '../screens/TierOverviewScreen';
import { SkillStoreScreen } from '../screens/SkillStoreScreen';
import { UpgradeConfirmationScreen } from '../screens/UpgradeConfirmationScreen';
import { UpgradeSuccessScreen } from '../screens/UpgradeSuccessScreen';
import { UpgradePromptModal } from '../screens/UpgradePromptModal';

export type { RootStackParamList } = {
  TierOverview: undefined;
  SkillStore: undefined;
  UpgradeConfirmation: { tierId?: string; skillId?: string; fromFeature?: string; };
  UpgradeSuccess: { tierId?: string; skillId?: string; type: 'tier' | 'skill' };
};

const Stack = createStackNavigator<RootStackParamList>();

export const UpgradeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1E1E1E1',
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 'bold',
        },
        cardStyle: {
          backgroundColor: '#1E1E1E1',
          borderRadius: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Stack.Screen 
        name="TierOverview" 
        component={TierOverviewScreen}
        options={{ 
          title: 'Pricing Plans',
          headerShown: true 
        }}
      />
      <Stack.Screen 
        name="SkillStore" 
        component={SkillStoreScreen}
        options={{ 
          title: 'Skill Store',
          headerShown: true 
        }}
      />
      <Stack.Screen 
        name="UpgradeConfirmation" 
        component={UpgradeConfirmationScreen}
        options={{ 
          title: 'Confirm Upgrade',
          headerShown: true,
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="UpgradeSuccess" 
        component={UpgradeSuccessScreen}
        options={{ 
          title: 'Success',
          headerShown: true,
          gestureEnabled: false
        }}
      />
    </Stack.Navigator>
  );
};
