import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { stabilityApiService, StartupProfile } from '../../services/stabilityApiService';

export default function StartupProfileScreen() {
  const [profiles, setProfiles] = useState<StartupProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executingProfile, setExecutingProfile] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchStartupProfiles();
  }, []);

  const fetchStartupProfiles = async () => {
    try {
      const fetchedProfiles = await stabilityApiService.getStartupProfiles();
      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error('Failed to fetch startup profiles:', error);
      Alert.alert('Error', 'Failed to load startup profiles');
    }
  };

  const executeProfile = async (profileId: string) => {
    Alert.alert(
      'Execute Startup Profile',
      `Are you sure you want to execute the ${profiles.find(p => p.id === profileId)?.name} profile? This will restart Acey with the specified configuration.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Execute',
          style: 'default',
          onPress: async () => {
            setIsLoading(true);
            setExecutingProfile(profileId);

            try {
              const result = await stabilityApiService.executeStartupProfile(profileId);
              if (result.success) {
                Alert.alert('Success', 'Startup profile executed successfully');
                setSelectedProfile(profileId);
              } else {
                Alert.alert('Error', result.message || 'Failed to execute startup profile');
              }
            } catch (error) {
              console.error('Failed to execute startup profile:', error);
              Alert.alert('Error', 'Failed to execute startup profile. Please try again.');
            } finally {
              setIsLoading(false);
              setExecutingProfile(null);
            }
          },
        },
      ]
    );
  };

  const renderProfileCard = (profile: StartupProfile) => {
    const isSelected = selectedProfile === profile.id;
    const isExecuting = executingProfile === profile.id;

    return (
      <TouchableOpacity
        key={profile.id}
        style={[
          styles.profileCard,
          isSelected && styles.selectedProfileCard
        ]}
        onPress={() => executeProfile(profile.id)}
        disabled={isLoading}
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileTitleContainer}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileMode}>Mode: {profile.mode}</Text>
          </View>
          {isExecuting && (
            <View style={styles.executingIndicator}>
              <Text style={styles.executingText}>Executing...</Text>
            </View>
          )}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
          )}
        </View>

        <Text style={styles.profileDescription}>{profile.description}</Text>

        <View style={styles.resourceSection}>
          <Text style={styles.sectionTitle}>Resource Reservations</Text>
          <View style={styles.resourceRow}>
            <View style={styles.resourceItem}>
              <Ionicons name="hardware-chip" size={16} color="#3B82F6" />
              <Text style={styles.resourceLabel}>CPU: {profile.resourceReservations.cpu}%</Text>
            </View>
            <View style={styles.resourceItem}>
              <Ionicons name="cube" size={16} color="#10B981" />
              <Text style={styles.resourceLabel}>Memory: {profile.resourceReservations.memory}%</Text>
            </View>
          </View>
          <View style={styles.resourceRow}>
            <View style={styles.resourceItem}>
              <Ionicons name="desktop" size={16} color="#8B5CF6" />
              <Text style={styles.resourceLabel}>GPU: {profile.resourceReservations.gpu}%</Text>
            </View>
            <View style={styles.resourceItem}>
              <Ionicons name="time" size={16} color="#F59E0B" />
              <Text style={styles.resourceLabel}>Timeout: {profile.timeoutMs}ms</Text>
            </View>
          </View>
        </View>

        <View style={styles.startupSection}>
          <Text style={styles.sectionTitle}>Startup Order</Text>
          <View style={styles.startupList}>
            {profile.startupOrder.map((component, index) => (
              <View key={index} style={styles.startupItem}>
                <View style={styles.startupNumber}>
                  <Text style={styles.startupNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.startupComponent}>{component}</Text>
              </View>
            ))}
          </View>
        </View>

        {profile.fallbackMode && (
          <View style={styles.fallbackSection}>
            <Text style={styles.sectionTitle}>Fallback Mode</Text>
            <View style={styles.fallbackItem}>
              <Ionicons name="shield-checkmark" size={16} color="#EF4444" />
              <Text style={styles.fallbackText}>
                Falls back to {profile.fallbackMode} on failure
              </Text>
            </View>
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
        <Text style={styles.headerTitle}>Startup Profiles</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Select Startup Profile</Text>
          <Text style={styles.sectionDescription}>
            Choose a startup profile to configure how Acey initializes. Each profile has different resource requirements and component startup sequences.
          </Text>

          {profiles.map(renderProfileCard)}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>About Startup Profiles</Text>
            <Text style={styles.infoText}>
              • Cold boot starts all components from scratch
            </Text>
            <Text style={styles.infoText}>
              • Warm boot preserves certain component states
            </Text>
            <Text style={styles.infoText}>
              • Resource reservations guarantee availability
            </Text>
            <Text style={styles.infoText}>
              • Fallback modes provide safety nets
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedProfileCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileTitleContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileMode: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  executingIndicator: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  executingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedIndicator: {
    padding: 4,
  },
  profileDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  resourceSection: {
    marginBottom: 20,
  },
  resourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceLabel: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
  },
  startupSection: {
    marginBottom: 20,
  },
  startupList: {
    marginTop: 8,
  },
  startupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  startupNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  startupNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  startupComponent: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  fallbackSection: {
    marginBottom: 8,
  },
  fallbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
  },
  fallbackText: {
    fontSize: 13,
    color: '#991B1B',
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
