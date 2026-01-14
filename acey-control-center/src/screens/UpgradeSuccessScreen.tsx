import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { UpgradeConfirmationParams } from '../types/upgrade';

const UpgradeSuccessScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as UpgradeConfirmationParams;
  const { tierId, skillId, type } = params;
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [successData, setSuccessData] = useState<{
    name: string;
    type: 'tier' | 'skill';
    price?: number;
    features?: string[];
  } | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    loadSuccessData();
  }, []);

  const loadSuccessData = () => {
    // Mock data - in production, get from API response
    if (tierId) {
      const tiers: Record<string, { name: string; price: number; features: string[] }> = {
        'creator-plus': {
          name: 'Creator+',
          price: 9,
          features: ['Mobile approvals', 'Full audit timeline', 'Emergency lock']
        },
        'pro': {
          name: 'Pro',
          price: 29,
          features: ['Auto-rules', 'Simulations', 'Skill Store', 'Multi-device approvals']
        },
        'enterprise': {
          name: 'Enterprise',
          price: 99,
          features: ['Multi-tenant isolation', 'Cloud clustering', 'Hardware keys', 'Advanced compliance']
        }
      };

      const tier = tiers[tierId];
      if (tier) {
        setSuccessData({
          name: tier.name,
          type: 'tier',
          price: tier.price,
          features: tier.features
        });
      }
    } else if (skillId) {
      const skills: Record<string, { name: string; price: number }> = {
        'stream-ops-pro': { name: 'Acey Stream Ops Pro', price: 15 },
        'audio-optimizer': { name: 'Audio Quality Optimizer', price: 18 },
        'hype-engine': { name: 'Hype Engine Pro', price: 12 },
        'auto-moderator': { name: 'Auto Moderator Pro', price: 35 }
      };

      const skill = skills[skillId];
      if (skill) {
        setSuccessData({
          name: skill.name,
          type: 'skill',
          price: skill.price,
          features: ['Permission-gated safety', 'Sandboxed execution', 'Full audit trail']
        });
      }
    }
  };

  const handleBackToDashboard = () => {
    navigation.navigate('Dashboard');
  };

  const handleExploreFeatures = () => {
    if (type === 'tier') {
      navigation.navigate('TierOverview');
    } else {
      navigation.navigate('SkillStore');
    }
  };

  const renderSuccessIcon = () => (
    <View style={styles.iconContainer}>
      <Icon name="check-circle" size={64} color="#4CAF50" />
      <Text style={styles.iconText}>✓</Text>
    </View>
  );

  const renderSuccessMessage = () => (
    <View style={styles.messageContainer}>
      <Text style={styles.successTitle}>
        {successData?.type === 'tier' ? 'Upgrade Successful!' : 'Skill Installed!'}
      </Text>
      <Text style={styles.successSubtitle}>
        You've unlocked {successData?.name}! Acey can now help you do even more.
      </Text>
    </View>
  );

  const renderPricingInfo = () => {
    if (!successData?.price || successData.price === 0) return null;

    return (
      <View style={styles.pricingInfo}>
        <Text style={styles.pricingText}>
          {successData.price === 0 ? 'FREE' : `$${successData.price}/month`}
        </Text>
        <Text style={styles.pricingDescription}>
          {successData.type === 'tier' ? 'Billed monthly' : 'Billed monthly'}
        </Text>
      </View>
    );
  });

  const renderFeatures = () => {
    if (!successData?.features || successData.features.length === 0) return null;

    return (
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>What's Included:</Text>
        {successData.features.slice(0, 4).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
        {successData.features.length > 4 && (
          <Text style={styles.moreFeatures}>
            +{successData.features.length - 4} more features
          </Text>
        )}
      </View>
    );
  };

  const renderActions = () => (
    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.secondaryButton, styles.button]}
        onPress={handleExploreFeatures}
      >
        <Text style={styles.secondaryButtonText}>Explore Features</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.primaryButton, styles.button]}
        onPress={handleBackToDashboard}
      >
        <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.title}>Success!</Text>
        <TouchableOpacity onPress={handleBackToDashboard}>
          <Icon name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          {renderSuccessIcon()}
          {renderSuccessMessage()}
          {renderPricingInfo()}
          {renderFeatures()}
          {renderActions()}
        </Animated.View>
      </View>
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
    backgroundColor: '#1E1E1E1',
  },
  headerLeft: {
    width: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  mainContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 22,
  },
  pricingInfo: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  pricingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  pricingDescription: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  featuresContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginLeft: 8,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666666',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
});

export default UpgradeSuccessScreen;
