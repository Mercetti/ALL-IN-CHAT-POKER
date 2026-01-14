import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import SkillStore from './SkillStore';
import AceyActivityFeed from './AceyActivityFeed';
import SkillRecommendations from './SkillRecommendations';
import MetricsPanel from './MetricsPanel';
import NotificationsPanel from './NotificationsPanel';
import OwnerDashboard from './OwnerDashboard';

const Tab = createBottomTabNavigator();

export default function UnifiedAceyDashboard({ userToken, userRole }: any) {
  const userCanAccessOwnerContent = userRole === 'owner' || userRole === 'developer';

  return (
    <Tab.Navigator
      screenOptions={{ 
        headerShown: true, 
        tabBarStyle: { 
          backgroundColor: '#1e1e1e', 
          height: 60 
        } 
      }}
    >
      <Tab.Screen name="Skills">
        {() => <SkillStore userToken={userToken} userRole={userRole} />}
      </Tab.Screen>

      <Tab.Screen name="Activity">
        {() => <AceyActivityFeed userToken={userToken} userRole={userRole} />}
      </Tab.Screen>

      <Tab.Screen name="Recommendations">
        {() => <SkillRecommendations userToken={userToken} />}
      </Tab.Screen>

      <Tab.Screen name="Metrics">
        {() => <MetricsPanel userToken={userToken} userRole={userRole} />}
      </Tab.Screen>

      <Tab.Screen name="Notifications">
        {() => <NotificationsPanel userToken={userToken} />}
      </Tab.Screen>

      {userCanAccessOwnerContent && (
        <Tab.Screen name="Owner Dashboard">
          {() => <OwnerDashboard userToken={userToken} />}
        </Tab.Screen>
      )}
    </Tab.Navigator>
  );
}
