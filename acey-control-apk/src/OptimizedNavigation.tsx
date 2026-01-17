/**
 * Optimized Navigation Container
 * Implements lazy loading and performance optimizations
 */

import React, { Suspense, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { PreloadManager, PerformanceMonitor } from '../utils/BundleOptimizer';

// Lazy loaded screens
const LazyLoginScreen = React.lazy(() => import('../screens/LoginScreen'));
const LazyStatusScreen = React.lazy(() => import('../screens/StatusScreen'));
const LazyControlScreen = React.lazy(() => import('../screens/ControlScreen'));
const LazyLogsScreen = React.lazy(() => import('../screens/LogsScreen'));
const LazyAnalyticsScreen = React.lazy(() => import('../screens/AnalyticsScreen'));
const LazySettingsScreen = React.lazy(() => import('../screens/SettingsScreen'));

// Loading component
const LoadingFallback = ({ message = 'Loading...' }) => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030712',
  }}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={{
      color: '#ffffff',
      marginTop: 10,
      fontSize: 16,
    }}>
      {message}
    </Text>
  </View>
);

// Create tab navigator
const Tab = createBottomTabNavigator();

// Create stack navigator
const Stack = createStackNavigator();

// Optimized Main Tabs with lazy loading
function MainTabs() {
  useEffect(() => {
    // Preload critical components
    PreloadManager.preloadCriticalComponents();
    
    // Start performance monitoring
    const interval = setInterval(() => {
      PerformanceMonitor.trackMemoryUsage();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        headerStyle: {
          backgroundColor: '#030712',
          borderBottomColor: '#334155',
        },
        headerTintColor: '#ffffff',
      }}
    >
      <Tab.Screen 
        name="Status" 
        component={() => (
          <Suspense fallback={<LoadingFallback message="Loading Status..." />}>
            <LazyStatusScreen />
          </Suspense>
        )}
        options={{
          tabBarLabel: 'Status',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>📊</Text>
          ),
        }}
        listeners={{
          tabPress: () => {
            // Preload related components when tab is accessed
            PreloadManager.preloadComponent('ControlScreen');
          },
        }}
      />
      
      <Tab.Screen 
        name="Control" 
        component={() => (
          <Suspense fallback={<LoadingFallback message="Loading Control..." />}>
            <LazyControlScreen />
          </Suspense>
        )}
        options={{
          tabBarLabel: 'Control',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>🎮</Text>
          ),
        }}
        listeners={{
          tabPress: () => {
            PreloadManager.preloadComponent('LogsScreen');
          },
        }}
      />
      
      <Tab.Screen 
        name="Logs" 
        component={() => (
          <Suspense fallback={<LoadingFallback message="Loading Logs..." />}>
            <LazyLogsScreen />
          </Suspense>
        )}
        options={{
          tabBarLabel: 'Logs',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>📋</Text>
          ),
        }}
        listeners={{
          tabPress: () => {
            PreloadManager.preloadComponent('AnalyticsScreen');
          },
        }}
      />
      
      <Tab.Screen 
        name="Analytics" 
        component={() => (
          <Suspense fallback={<LoadingFallback message="Loading Analytics..." />}>
            <LazyAnalyticsScreen />
          </Suspense>
        )}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>📈</Text>
          ),
        }}
        listeners={{
          tabPress: () => {
            PreloadManager.preloadComponent('SettingsScreen');
          },
        }}
      />
      
      <Tab.Screen 
        name="Settings" 
        component={() => (
          <Suspense fallback={<LoadingFallback message="Loading Settings..." />}>
            <LazySettingsScreen />
          </Suspense>
        )}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Optimized App Navigator
function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#030712',
          borderBottomColor: '#334155',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={() => (
          <Suspense fallback={<LoadingFallback message="Loading Login..." />}>
            <LazyLoginScreen />
          </Suspense>
        )}
        options={{ 
          headerShown: false,
          gestureEnabled: false
        }}
      />
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Performance monitoring wrapper
export default function OptimizedNavigation() {
  const { state } = useAuth();
  
  useEffect(() => {
    const startTime = Date.now();
    
    // Track initial load time
    const loadTime = PerformanceMonitor.trackLoadTime('Navigation', startTime);
    
    // Log performance metrics
    console.log('Navigation component loaded in:', loadTime, 'ms');
    
    return () => {
      // Cleanup on unmount
      const report = PerformanceMonitor.getPerformanceReport();
      console.log('Performance Report:', report);
    };
  }, []);

  return (
    <NavigationContainer>
      <Suspense fallback={<LoadingFallback message="Initializing App..." />}>
        {state.isAuthenticated ? <AppNavigator /> : <LazyLoginScreen />}
      </Suspense>
    </NavigationContainer>
  );
}

// Export performance utilities for external use
export { PerformanceMonitor, PreloadManager };
