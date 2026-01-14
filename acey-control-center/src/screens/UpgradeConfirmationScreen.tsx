import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { UpgradeConfirmationParams } from '../types/upgrade';

interface Tier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface Skill {
  id: string;
  name: string;
  price: number;
  description: string;
  trialDays?: number;
}

const UpgradeConfirmationScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as UpgradeConfirmationParams;
  const { tierId, skillId, fromFeature } = params;
  
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentStep, setCurrentStep] = useState(0);
  const [upgradeData, setUpgradeData] = useState<{
    tier?: Tier;
    skill?: Skill;
    type: 'tier' | 'skill';
  } | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    loadUpgradeData();
  }, []);

  const loadUpgradeData = async () => {
    try {
      // Mock data - in production, fetch from API
      if (tierId) {
        const tiers: Tier[] = [
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
            ]
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
            ]
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
            ]
          }
        ];

        const tier = tiers.find(t => t.id === tierId);
        if (tier) {
          setUpgradeData({ tier, type: 'tier' });
          setCurrentStep(0);
        }
      } else if (skillId) {
        const skills: Skill[] = [
          {
            id: 'stream-ops-pro',
            name: 'Acey Stream Ops Pro',
            price: 15,
            description: 'Monitor your stream, detect issues early, and approve fixes safely.',
            trialDays: 7
          },
          {
            id: 'audio-optimizer',
            name: 'Audio Quality Optimizer',
            price: 18,
            description: 'Automatically optimize audio settings for the best stream quality.',
            trialDays: 7
          },
          {
            id: 'hype-engine',
            name: 'Hype Engine Pro',
            price: 12,
            description: 'Generate engaging content and timing suggestions for maximum viewer engagement.',
            trialDays: 14
          }
        ];

        const skill = skills.find(s => s.id === skillId);
        if (skill) {
          setUpgradeData({ skill, type: 'skill' });
          setCurrentStep(0);
        }
      }
    } catch (error) {
      console.error('Failed to load upgrade data:', error);
      Alert.alert('Error', 'Failed to load upgrade information');
    }
  };

  const handleConfirm = async () => {
    if (!upgradeData) return;

    setIsLoading(true);
    
    try {
      // Mock API call - in production, call actual subscription/skill API
      await simulateUpgradeProcess();
      
      // Navigate to success screen
      navigation.navigate('UpgradeSuccess', { 
        tierId, 
        skillId, 
        type: upgradeData.type 
      });
    } catch (error) {
      console.error('Upgrade failed:', error);
      Alert.alert('Upgrade Failed', 'Unable to process your upgrade. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateUpgradeProcess = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate API call
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
          resolve();
        } else {
          reject(new Error('Payment failed'));
        }
      }, 2000);
    });
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const renderUpgradeSteps = () => {
    if (!upgradeData) return null;

    const steps = upgradeData.type === 'tier' ? [
      {
        title: 'Confirm Your Upgrade',
        subtitle: upgradeData.tier.name,
        body: `Get instant access to ${upgradeData.tier.features.slice(0, 3).join(', ')}, and more.`,
        price: upgradeData.tier.price,
        features: upgradeData.tier.features
      }
    ] : [
      {
        title: 'Install Skill',
        subtitle: upgradeData.skill.name,
        body: upgradeData.skill.description,
        price: upgradeData.skill.price,
        trialDays: upgradeData.skill.trialDays,
        features: [
          'Permission-gated for safety',
          'Sandboxed execution',
          'Full audit trail',
          'Easy cancellation'
        ]
      }
    ];

    const step = steps[currentStep];
    if (!step) return null;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        {step.subtitle && (
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
        )}
        <Text style={styles.stepBody}>{step.body}</Text>
        
        {step.price !== undefined && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>
              {step.price === 0 ? 'FREE' : `$${step.price}/month`}
            </Text>
            {step.trialDays && (
              <Text style={styles.trialText}>
                {step.trialDays}-day free trial included
              </Text>
            )}
          </View>
        )}

        {step.features && (
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>You'll get:</Text>
            {step.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {fromFeature && (
          <View style={styles.fromFeatureContainer}>
            <Icon name="info" size={16} color="#FF9800" />
            <Text style={styles.fromFeatureText}>
              Upgrading from: {fromFeature}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Upgrade</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          {renderUpgradeSteps()}
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.cancelButton, styles.button]} 
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, styles.buttonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, styles.button]} 
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={[styles.loadingText, styles.buttonText]}>
                  Processing...
                </Text>
              ) : (
                <Text style={[styles.confirmButtonText, styles.buttonText]}>
                  Confirm
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mainContent: {
    flex: 1,
  },
  stepContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepBody: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 24,
    marginBottom: 20,
  },
  priceContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  trialText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 14,
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
  fromFeatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  fromFeatureText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666666',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#E0E0E0',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
  loadingText: {
    color: '#FFFFFF',
  },
});

export default UpgradeConfirmationScreen;
