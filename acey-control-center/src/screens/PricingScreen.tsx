import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { pricingService } from '../services/pricingService';
import { useAceyStore } from '../state/aceyStore';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: any;
  limits: any;
  upgradeTriggers: string[];
  color: string;
  popular?: boolean;
}

interface UpgradeSuggestion {
  fromTier: string;
  toTier: string;
  trigger: string;
  userStory: string;
  unlocks: string[];
}

const PricingScreen: React.FC = ({ navigation }: any) => {
  const { setLoading, setError } = useAceyStore();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [upgradeSuggestions, setUpgradeSuggestions] = useState<UpgradeSuggestion[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      
      // Load pricing tiers
      const pricingTiers = pricingService.getPricingTiers();
      setTiers(pricingTiers);
      
      // Load current tier (mock - in production, get from user service)
      setCurrentTier('creator-plus');
      
      // Load upgrade suggestions
      const suggestions = pricingService.getUpgradeSuggestions('demo-tenant');
      setUpgradeSuggestions(suggestions);
      
      setError(null);
    } catch (error) {
      setError('Failed to load pricing data');
      console.error('Pricing load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPricingData();
    setRefreshing(false);
  };

  const handleTierSelect = (tier: PricingTier) => {
    if (tier.id === currentTier) {
      Alert.alert('Current Plan', `You're currently on the ${tier.name} plan`);
      return;
    }

    setSelectedTier(tier);
  };

  const handleUpgrade = () => {
    if (!selectedTier) return;

    Alert.alert(
      `Upgrade to ${selectedTier.name}`,
      `Price: $${selectedTier.price}/month\n\n${selectedTier.description}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: () => processUpgrade(selectedTier)
        }
      ]
    );
  };

  const processUpgrade = async (tier: PricingTier) => {
    try {
      setLoading(true);
      
      // Update entitlement
      pricingService.updateEntitlement('demo-tenant', tier.id);
      setCurrentTier(tier.id);
      
      Alert.alert(
        'Upgrade Successful!',
        `You've been upgraded to ${tier.name}. Enjoy your new features!`,
        [{ text: 'OK' }]
      );
      
      setSelectedTier(null);
    } catch (error) {
      Alert.alert('Upgrade Failed', 'Unable to process upgrade');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureClick = (featureName: string, available: boolean, upgradeTo?: string) => {
    if (available) {
      Alert.alert('Feature Available', `${featureName} is included in your current plan`);
    } else if (upgradeTo) {
      const upgradeTier = tiers.find(t => t.id === upgradeTo);
      Alert.alert(
        'Feature Upgrade Required',
        `${featureName} requires upgrading to ${upgradeTier?.name}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Plans',
            onPress: () => setSelectedTier(upgradeTier || null)
          }
        ]
      );
    }
  };

  const renderFeatureCheck = (available: boolean) => (
    <Icon 
      name={available ? 'check-circle' : 'cancel'} 
      size={20} 
      color={available ? '#4CAF50' : '#F44336'} 
    />
  );

  const renderTierCard = (tier: PricingTier) => {
    const isCurrent = tier.id === currentTier;
    const isSelected = selectedTier?.id === tier.id;

    return (
      <TouchableOpacity
        key={tier.id}
        style={[
          styles.tierCard,
          isCurrent && styles.currentTierCard,
          isSelected && styles.selectedTierCard,
          tier.popular && styles.popularTierCard
        ]}
        onPress={() => handleTierSelect(tier)}
      >
        {tier.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}
        
        <View style={styles.tierHeader}>
          <Text style={styles.tierName}>{tier.name}</Text>
          <Text style={styles.tierPrice}>
            {tier.price === 0 ? 'FREE' : `$${tier.price}/month`}
          </Text>
        </View>
        
        <Text style={styles.tierDescription}>{tier.description}</Text>
        
        <View style={styles.featuresList}>
          {Object.entries(tier.features).slice(0, 6).map(([key, value]) => (
            <View key={key} style={styles.featureItem}>
              {renderFeatureCheck(value as boolean)}
              <Text style={styles.featureText}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
            </View>
          ))}
        </View>
        
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderUpgradeSuggestion = (suggestion: UpgradeSuggestion) => (
    <View key={suggestion.trigger} style={styles.suggestionCard}>
      <View style={styles.suggestionHeader}>
        <Icon name="trending_up" size={24} color="#FF9800" />
        <Text style={styles.suggestionTitle}>Upgrade Suggestion</Text>
      </View>
      
      <Text style={styles.suggestionStory}>"{suggestion.userStory}"</Text>
      
      <View style={styles.suggestionUnlocks}>
        <Text style={styles.suggestionUnlocksTitle}>Unlocks:</Text>
        {suggestion.unlocks.map((unlock, index) => (
          <Text key={index} style={styles.suggestionUnlockItem}>• {unlock}</Text>
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.suggestionButton}
        onPress={() => {
          const targetTier = tiers.find(t => t.id === suggestion.toTier);
          if (targetTier) setSelectedTier(targetTier);
        }}
      >
        <Text style={styles.suggestionButtonText}>
          Upgrade to {tiers.find(t => t.id === suggestion.toTier)?.name}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Pricing Plans</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Current Plan</Text>
          <Text style={styles.statusPlan}>
            {tiers.find(t => t.id === currentTier)?.name || 'Free'}
          </Text>
          <Text style={styles.statusDescription}>
            {tiers.find(t => t.id === currentTier)?.description}
          </Text>
        </View>

        {/* Upgrade Suggestions */}
        {upgradeSuggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>Why Upgrade?</Text>
            {upgradeSuggestions.map(renderUpgradeSuggestion)}
          </View>
        )}

        {/* Pricing Tiers */}
        <View style={styles.tiersSection}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {tiers.map(renderTierCard)}
        </View>

        {/* Skill Pricing Info */}
        <View style={styles.skillsSection}>
          <Text style={styles.sectionTitle}>Skills Pricing</Text>
          <Text style={styles.skillsDescription}>
            Skills are add-ons that enhance your Acey experience. Pricing varies by category.
          </Text>
          
          <View style={styles.skillBands}>
            <View style={styles.skillBand}>
              <Text style={styles.skillBandCategory}>Monitoring</Text>
              <Text style={styles.skillBandPrice}>$5-15/mo</Text>
            </View>
            <View style={styles.skillBand}>
              <Text style={styles.skillBandCategory}>Optimization</Text>
              <Text style={styles.skillBandPrice}>$10-25/mo</Text>
            </View>
            <View style={styles.skillBand}>
              <Text style={styles.skillBandCategory}>Creative</Text>
              <Text style={styles.skillBandPrice}>$5-20/mo</Text>
            </View>
            <View style={styles.skillBand}>
              <Text style={styles.skillBandCategory}>Ops Automation</Text>
              <Text style={styles.skillBandPrice}>$15-40/mo</Text>
            </View>
          </View>
        </View>

        {/* Upgrade Modal */}
        {selectedTier && (
          <View style={styles.upgradeModal}>
            <View style={styles.upgradeModalContent}>
              <View style={styles.upgradeModalHeader}>
                <Text style={styles.upgradeModalTitle}>Confirm Upgrade</Text>
                <TouchableOpacity onPress={() => setSelectedTier(null)}>
                  <Icon name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.upgradeModalPlan}>{selectedTier.name}</Text>
              <Text style={styles.upgradeModalPrice}>${selectedTier.price}/month</Text>
              <Text style={styles.upgradeModalDescription}>{selectedTier.description}</Text>
              
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 5,
  },
  statusPlan: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statusDescription: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  suggestionsSection: {
    marginBottom: 30,
  },
  suggestionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  suggestionStory: {
    fontSize: 14,
    color: '#E0E0E0',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  suggestionUnlocks: {
    marginBottom: 15,
  },
  suggestionUnlocksTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  suggestionUnlockItem: {
    fontSize: 12,
    color: '#9E9E9E',
    marginLeft: 10,
  },
  suggestionButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  suggestionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tiersSection: {
    marginBottom: 30,
  },
  tierCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333333',
  },
  popularTierCard: {
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  currentTierCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  selectedTierCard: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tierHeader: {
    marginBottom: 15,
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  tierPrice: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  tierDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 15,
  },
  featuresList: {
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#E0E0E0',
    marginLeft: 10,
    flex: 1,
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  skillsSection: {
    marginBottom: 30,
  },
  skillsDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 15,
  },
  skillBands: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skillBand: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 15,
    width: '48%',
    marginBottom: 10,
  },
  skillBandCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  skillBandPrice: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  upgradeModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  upgradeModalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
  },
  upgradeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  upgradeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  upgradeModalPlan: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  upgradeModalPrice: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 10,
  },
  upgradeModalDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PricingScreen;
