import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

const ControlScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Control Panel</Text>
        <Text style={styles.subtitle}>System controls</Text>
      </View>
      
      <View style={styles.controlSection}>
        <Text style={styles.sectionTitle}>System Control</Text>
        
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlText}>Start System</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlText}>Stop System</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlText}>Restart System</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.controlSection}>
        <Text style={styles.sectionTitle}>Operating Mode</Text>
        
        <TouchableOpacity style={styles.modeButton}>
          <Text style={styles.modeText}>Live Mode</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.modeButton}>
          <Text style={styles.modeText}>Build Mode</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.modeButton}>
          <Text style={styles.modeText}>Safe Mode</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.controlSection}>
        <Text style={styles.sectionTitle}>Demo Controls</Text>
        
        <TouchableOpacity style={styles.demoButton}>
          <Text style={styles.demoText}>Run Demo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.demoButton}>
          <Text style={styles.demoText}>Stop Demo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  controlSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  controlButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  controlText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modeButton: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  modeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoButton: {
    backgroundColor: '#f59e0b',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  demoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ControlScreen;
