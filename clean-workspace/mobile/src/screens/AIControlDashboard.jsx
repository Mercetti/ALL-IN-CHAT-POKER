/**
 * AI Control Dashboard Screen
 * Main interface for managing AI systems and controls
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Card from '../components/Card';
import Button from '../components/Button';

const AIControlDashboard = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const [activeSystems, setActiveSystems] = useState({
    llm: true,
    skills: true,
    memory: true,
    governance: true,
    audio: false,
  });
  
  const [metrics, setMetrics] = useState({
    totalRequests: 12543,
    successRate: 98.7,
    avgResponseTime: 234,
    activeSkills: 12,
    memoryUsage: 67,
    systemHealth: 'optimal'
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Refreshed', 'AI systems data updated');
    }, 1000);
  };

  const toggleSystem = (system) => {
    setActiveSystems(prev => ({
      ...prev,
      [system]: !prev[system]
    }));
    Alert.alert(
      'System Toggle',
      `${system} ${activeSystems[system] ? 'disabled' : 'enabled'}`
    );
  };

  const SystemCard = ({ title, status, description, onToggle }) => (
    <Card style={{ marginBottom: spacing.md }}>
      <View style={styles.systemHeader}>
        <Text style={styles.systemTitle}>{title}</Text>
        <TouchableOpacity 
          style={[styles.toggleButton, status ? styles.active : styles.inactive]}
          onPress={onToggle}
        >
          <Text style={styles.toggleText}>{status ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.systemDescription}>{description}</Text>
    </Card>
  );

  const MetricsCard = ({ title, value, subtitle }) => (
    <Card style={styles.metricsCard}>
      <Text style={styles.metricsTitle}>{title}</Text>
      <Text style={styles.metricsValue}>{value}</Text>
      <Text style={styles.metricsSubtitle}>{subtitle}</Text>
    </Card>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI Control Center</Text>
        <Text style={styles.subtitle}>Manage AI Systems & Controls</Text>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.systemHealth}>
          <Text style={[styles.healthText, styles[metrics.systemHealth]]}>
            {metrics.systemHealth.toUpperCase()}
          </Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>AI Systems</Text>
      
      <SystemCard
        title="LLM Engine"
        status={activeSystems.llm}
        description="Large Language Model processing and generation"
        onToggle={() => toggleSystem('llm')}
      />
      
      <SystemCard
        title="Skills System"
        status={activeSystems.skills}
        description="AI skill execution and management"
        onToggle={() => toggleSystem('skills')}
      />
      
      <SystemCard
        title="Memory System"
        status={activeSystems.memory}
        description="Context memory and learning storage"
        onToggle={() => toggleSystem('memory')}
      />
      
      <SystemCard
        title="Governance"
        status={activeSystems.governance}
        description="AI safety and ethical controls"
        onToggle={() => toggleSystem('governance')}
      />
      
      <SystemCard
        title="Audio Generation"
        status={activeSystems.audio}
        description="Voice synthesis and audio processing"
        onToggle={() => toggleSystem('audio')}
      />

      <Text style={styles.sectionTitle}>Performance Metrics</Text>
      
      <View style={styles.metricsGrid}>
        <MetricsCard
          title="Total Requests"
          value={metrics.totalRequests.toLocaleString()}
          subtitle="Last 24 hours"
        />
        <MetricsCard
          title="Success Rate"
          value={`${metrics.successRate}%`}
          subtitle="Request completion"
        />
        <MetricsCard
          title="Response Time"
          value={`${metrics.avgResponseTime}ms`}
          subtitle="Average latency"
        />
        <MetricsCard
          title="Active Skills"
          value={metrics.activeSkills}
          subtitle="Enabled skills"
        />
        <MetricsCard
          title="Memory Usage"
          value={`${metrics.memoryUsage}%`}
          subtitle="System resources"
        />
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <Button title="System Diagnostics" variant="outline" />
          <Button title="Performance Tuning" variant="outline" />
          <Button title="Security Audit" variant="outline" />
          <Button title="Emergency Stop" variant="primary" />
        </View>
      </Card>
    </ScrollView>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    systemHealth: {
      alignItems: 'center',
      padding: spacing.md,
    },
    healthText: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    optimal: {
      color: colors.success,
    },
    warning: {
      color: colors.warning,
    },
    critical: {
      color: colors.error,
    },
    systemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    systemTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    toggleButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      minWidth: 60,
      alignItems: 'center',
    },
    active: {
      backgroundColor: colors.success,
    },
    inactive: {
      backgroundColor: colors.border,
    },
    toggleText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.background,
    },
    systemDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
    },
    metricsCard: {
      width: '48%',
      marginBottom: spacing.md,
      alignItems: 'center',
      padding: spacing.md,
    },
    metricsTitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    metricsValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    metricsSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    actionButtons: {
      gap: spacing.md,
    },
  });
};

export default AIControlDashboard;
