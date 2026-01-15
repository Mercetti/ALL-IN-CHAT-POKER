import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingPage from '../screens/LandingPage';
import SkillStore from '../screens/SkillStore';
import DemoFlow from '../screens/DemoFlow';
import MetricsDashboard from '../screens/MetricsDashboard';
import Settings from '../screens/Settings';
import LearningDashboard from '../screens/LearningDashboard';
import AceyLab from '../screens/AceyLab';
import AceyLabScreen from '../screens/AceyLabScreen';
import OverlayTestingScreen from '../screens/OverlayTestingScreen';

export type RootStackParamList = {
  Landing: undefined;
  SkillStore: { userToken: string; userRole: string };
  DemoFlow: undefined;
  MetricsDashboard: undefined;
  Settings: undefined;
  LearningDashboard: undefined;
  AceyLab: undefined;
  AceyLabScreen: undefined;
  OverlayTesting: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Landing">
      <Stack.Screen name="Landing" component={LandingPage} />
      <Stack.Screen name="SkillStore" component={SkillStore} />
      <Stack.Screen name="DemoFlow" component={DemoFlow} />
      <Stack.Screen name="MetricsDashboard" component={MetricsDashboard} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="LearningDashboard" component={LearningDashboard} />
      <Stack.Screen name="AceyLab" component={AceyLab} />
      <Stack.Screen name="AceyLabScreen" component={AceyLabScreen} />
      <Stack.Screen name="OverlayTesting" component={OverlayTestingScreen} />
    </Stack.Navigator>
  );
}
