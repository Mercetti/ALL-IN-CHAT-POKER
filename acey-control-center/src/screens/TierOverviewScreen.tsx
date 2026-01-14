import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TierCard } from '../components/TierCard';
import { Tier } from '../types/upgrade';
import { useNavigation } from '@react-navigation/native';

const TierOverviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [currentTierId, setCurrentTierId] = useState<string>('free');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      // Mock data - in production, fetch from API
      const mockTiers: Tier[] = [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          description: 'Observer Mode - Onboarding + Trust Building',
          features: [
            'Read-only dashboard',
            'Live status view',
            'Incident alerts (limited)',
            'Audit timeline (last 24h)',
            'Manual approvals only'
          ],
          billing: 'monthly',
          target: 'observer',
          current: currentTierId === 'free'
        },
        {
          id: 'creator-plus',
          name: 'Creator+',
          price: 9,
          description: 'Hands-On Control - For Serious Streamers',
          features: [
            'Full mobile control',
            'Unlimited approvals',
            'Audit replay (7 days)',
            'Offline read-only mode',
            'Emergency lock',
            'Basic incident summaries'
          ],
          billing: 'monthly',
          target: 'creator',
          popular: true,
          current: currentTierId === 'creator-plus'
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 29,
          description: 'Operational Autonomy - For Teams & Power Users',
          features: [
            'Auto-rules (permission-gated)',
            'Simulation engine',
            'Skill Store access',
            'Multi-device quorum unlock',
            'Incident response UI',
            'Compliance exports (basic)',
            'Time-boxed permissions'
          ],
          billing: 'monthly',
          target: 'agency',
          current: currentTierId === 'pro'
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 99,
          description: 'Governed Intelligence Platform - For Organizations',
          features: [
            'Multi-tenant isolation',
            'Cloud clustering',
            'Hardware key support',
            'Advanced compliance exports',
            'Investor summaries',
            'SLA + support',
            'Custom governance rules',
            'Unlimited skills'
          ],
          billing: 'monthly',
          target: 'enterprise',
          current: currentTierId === 'enterprise'
        }
      ];

      setTiers(mockTiers);
    } catch (error) {
      console.error('Failed to load tiers:', error);
      Alert.alert('Error', 'Failed to load pricing tiers');
    }
  };

  const handleUpgradePress = (tierId: string) => {
    if (tierId === currentTierId) {
      Alert.alert('Current Plan', `You're currently on the ${tiers.find(t => t.id === tierId)?.name} plan`);
      return;
    }

    navigation.navigate('UpgradeConfirmation', { tierId });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTiers();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Unlock Acey's full power</Text>
      <Text style={styles.headerDescription}>
        Upgrade your tier to gain more control, automation, and skills. Your subscription determines which features Acey can safely operate.
      </Text>
    </View>
  );

  const renderCurrentPlan = () => {
    const currentTier = tiers.find(t => t.id === currentTierId);
    if (!currentTier) return null;

    return (
      <View style={styles.currentPlanCard}>
        <View style={styles.currentPlanHeader}>
          <Icon name="account-circle" size={24} color="#4CAF50" />
          <View style={styles.currentPlanInfo}>
            <Text style={styles.currentPlanTitle}>Current Plan</Text>
            <Text style={styles.currentPlanName}>{currentTier.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.manageButton}>
          <Text style={styles.manageButtonText}>Manage Plan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.appTitle}>Pricing Plans</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderCurrentPlan()}
        
        <View style={styles.tiersSection}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {tiers.map(tier => (
            <TierCard
              key={tier.id}
              tier={tier}
              onUpgradePress={() => handleUpgradePress(tier.id)}
            />
          ))}
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>Why Upgrade?</Text>
          <Text style={styles.footerDescription}>
            As you trust Acey with more responsibility, you unlock powerful automation and advanced features. Each tier is designed to grow with your needs.
          </Text>
          <TouchableOpacity style={styles.learnMoreButton}>
            <Text style={styles.learnMoreButtonText}>Learn More About Features</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E1E1E',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  headerDescription: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 24,
  },
  currentPlanCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  currentPlanInfo: {
    marginLeft: 15,
    flex: 1,
  },
  currentPlanTitle: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  manageButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  manageButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tiersSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  footerSection: {
    marginBottom: 20,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  footerDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 20,
    marginBottom: 20,
  },
  learnMoreButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  learnMoreButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
