import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface AceyMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  restrictions: string[];
}

const ACEY_MODES: AceyMode[] = [
  {
    id: 'OFF',
    name: 'Off',
    description: 'Complete shutdown - no AI processing',
    icon: 'power-off',
    color: '#6B7280',
    features: ['Zero resource usage', 'Complete privacy'],
    restrictions: ['No AI processing', 'No monitoring']
  },
  {
    id: 'SAFE',
    name: 'Safe Mode',
    description: 'Emergency fallback - monitoring and alerts only',
    icon: 'shield-checkmark',
    color: '#EF4444',
    features: ['System monitoring', 'Alert notifications', 'Emergency response'],
    restrictions: ['No learning', 'No generation', 'No fine-tuning']
  },
  {
    id: 'MINIMAL',
    name: 'Minimal',
    description: 'Basic AI functionality with resource limits',
    icon: 'leaf',
    color: '#10B981',
    features: ['Essential AI tasks', 'Resource monitoring', 'Basic responses'],
    restrictions: ['Limited complexity', 'No background learning']
  },
  {
    id: 'CREATOR',
    name: 'Creator',
    description: 'Enhanced AI for content creation',
    icon: 'color-palette',
    color: '#3B82F6',
    features: ['Creative assistance', 'Content generation', 'Advanced responses'],
    restrictions: ['Higher resource usage', 'Requires monitoring']
  },
  {
    id: 'FULL',
    name: 'Full',
    description: 'Maximum AI capabilities with all features',
    icon: 'rocket',
    color: '#8B5CF6',
    features: ['All AI features', 'Learning enabled', 'Maximum performance'],
    restrictions: ['Highest resource usage', 'Requires approval']
  },
  {
    id: 'OFFLINE',
    name: 'Offline',
    description: 'Local processing only - no network access',
    icon: 'wifi-off',
    color: '#F59E0B',
    features: ['Privacy mode', 'Local processing', 'No data sharing'],
    restrictions: ['No network features', 'Limited knowledge']
  }
];

export default function AceyModeSwitchScreen() {
  const [currentMode, setCurrentMode] = useState<string>('MINIMAL');
  const [isLoading, setIsLoading] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    // Fetch current mode from API
    fetchCurrentMode();
  }, []);

  const fetchCurrentMode = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/acey/modes/current');
      const data = await response.json();
      setCurrentMode(data.mode || 'MINIMAL');
    } catch (error) {
      console.error('Failed to fetch current mode:', error);
    }
  };

  const switchMode = async (modeId: string) => {
    if (modeId === currentMode) return;

    Alert.alert(
      'Switch Mode',
      `Are you sure you want to switch to ${ACEY_MODES.find(m => m.id === modeId)?.name} mode?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch',
          style: 'default',
          onPress: async () => {
            setIsLoading(true);
            setSwitchingTo(modeId);

            try {
              const response = await fetch('http://localhost:8080/api/acey/modes/switch', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  mode: modeId,
                  reason: 'Manual mode switch from mobile app'
                }),
              });

              if (response.ok) {
                setCurrentMode(modeId);
                Alert.alert('Success', `Switched to ${ACEY_MODES.find(m => m.id === modeId)?.name} mode`);
              } else {
                const error = await response.json();
                Alert.alert('Error', error.message || 'Failed to switch mode');
              }
            } catch (error) {
              console.error('Failed to switch mode:', error);
              Alert.alert('Error', 'Failed to switch mode. Please try again.');
            } finally {
              setIsLoading(false);
              setSwitchingTo(null);
            }
          },
        },
      ]
    );
  };

  const renderModeCard = (mode: AceyMode) => {
    const isActive = mode.id === currentMode;
    const isSwitching = switchingTo === mode.id;

    return (
      <TouchableOpacity
        key={mode.id}
        style={[
          styles.modeCard,
          isActive && styles.activeModeCard,
          { borderColor: mode.color }
        ]}
        onPress={() => switchMode(mode.id)}
        disabled={isLoading || isActive}
      >
        <View style={styles.modeHeader}>
          <Ionicons
            name={mode.icon as any}
            size={24}
            color={isActive ? '#FFFFFF' : mode.color}
          />
          <View style={styles.modeTitleContainer}>
            <Text style={[
              styles.modeName,
              isActive && styles.activeModeName
            ]}>
              {mode.name}
            </Text>
            {isActive && (
              <Text style={styles.activeLabel}>Current</Text>
            )}
          </View>
          {isSwitching && (
            <View style={styles.switchingIndicator}>
              <Text style={styles.switchingText}>Switching...</Text>
            </View>
          )}
        </View>

        <Text style={styles.modeDescription}>{mode.description}</Text>

        <View style={styles.modeFeatures}>
          <Text style={styles.featuresTitle}>Features:</Text>
          {mode.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {mode.restrictions.length > 0 && (
          <View style={styles.modeRestrictions}>
            <Text style={styles.restrictionsTitle}>Restrictions:</Text>
            {mode.restrictions.map((restriction, index) => (
              <View key={index} style={styles.restrictionItem}>
                <Ionicons name="warning" size={16} color="#F59E0B" />
                <Text style={styles.restrictionText}>{restriction}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acey Modes</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Select Operating Mode</Text>
          <Text style={styles.sectionDescription}>
            Choose the appropriate mode for your current needs. Each mode has different capabilities and resource requirements.
          </Text>

          {ACEY_MODES.map(renderModeCard)}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Mode Information</Text>
            <Text style={styles.infoText}>
              • Safe Mode automatically triggers during system issues
            </Text>
            <Text style={styles.infoText}>
              • Higher modes use more system resources
            </Text>
            <Text style={styles.infoText}>
              • Some modes require founder approval
            </Text>
            <Text style={styles.infoText}>
              • Mode changes take effect immediately
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeModeCard: {
    backgroundColor: '#1F2937',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  modeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  activeModeName: {
    color: '#FFFFFF',
  },
  activeLabel: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 2,
  },
  switchingIndicator: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  switchingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  modeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  activeModeCard: {
    // This is a duplicate, should be handled differently
  },
  modeFeatures: {
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  modeRestrictions: {
    marginBottom: 8,
  },
  restrictionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  restrictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  restrictionText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  infoSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
});
