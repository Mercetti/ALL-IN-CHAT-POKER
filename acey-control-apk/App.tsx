/**
 * Main React Native App Component
 * Entry point for the Acey Control Center mobile app
 */

import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acey Control Center</Text>
      <Text style={styles.subtitle}>AI Control Layer System</Text>
      <Text style={styles.status}>✅ Systems Operational</Text>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 30,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: '#10b981',
    textAlign: 'center',
  },
});
