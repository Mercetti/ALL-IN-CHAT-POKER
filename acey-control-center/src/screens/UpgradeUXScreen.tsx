import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { pricingService } from '../services/pricingService';
import { UpgradeUXHelper, upgradeUXCopy, skillCardExamples } from '../services/upgradeUXService';
import { useAceyStore } from '../state/aceyStore';

interface TierCard {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

interface SkillCard {
  id: string;
  name: string;
  price: string;
  description: string;
  requirements: string;
  category: string;
  compatible: boolean;
  upgradeRequired?: string;
}

const UpgradeUXScreen: React.FC = ({ navigation }: any) => {
  const { setLoading, setError } = useAceyStore();
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [tiers, setTiers] = useState<TierCard[]>([]);
  const [skills, setSkills] = useState<SkillCard[]>([]);
  const [selectedTier, setSelectedTier] = useState<TierCard | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillCard | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [upgradeFlow, setUpgradeFlow] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadUpgradeData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUpgradeData = async () => {
    try {
      setLoading(true);
      
      // Load pricing tiers
      const pricingTiers = pricingService.getPricingTiers();
      const formattedTiers = pricingTiers.map(tier => ({
        id: tier.id,
        name: tier.name,
        price: tier.price === 0 ? 'FREE' : `$${tier.price}/mo`,
        description: tier.description,
        features: Object.entries(tier.features)
          .filter(([_, enabled]) => enabled)
          .map(([feature]) => formatFeatureName(feature)),
        popular: tier.popular,
        current: tier.id === currentTier
      }));
      setTiers(formattedTiers);
      
      // Load skills with compatibility
      const formattedSkills = Object.entries(skillCardExamples).map(([id, skill]) => {
        const skillWithCompat = UpgradeUXHelper.getSkillCardWithCompatibility(id, currentTier);
        return {
          id,
          name: skillWithCompat.name,
          price: skillWithCompat.price,
          description: skillWithCompat.description,
          requirements: skillWithCompat.requirements,
          category: skillWithCompat.category,
          compatible: skillWithCompat.compatible,
          upgradeRequired: skillWithCompat.upgradeRequired
        };
      });
      setSkills(formattedSkills);
      
      setError(null);
    } catch (error) {
      setError('Failed to load upgrade data');
      console.error('Upgrade data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFeatureName = (feature: string): string => {
    return feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const handleTierSelect = (tier: TierCard) => {
    if (tier.current) {
      Alert.alert('Current Plan', `You're currently on the ${tier.name} plan`);
      return;
    }

    setSelectedTier(tier);
    setShowUpgradeModal(true);
    setCurrentStep(0);
    
    // Load upgrade flow
    const flow = UpgradeUXHelper.getUpgradeFlow(tier.id);
    setUpgradeFlow(flow);
  };

  const handleSkillSelect = (skill: SkillCard) => {
    if (!skill.compatible) {
      // Show upgrade prompt
      const upgradePrompt = UpgradeUXHelper.getUpgradePromptCopy(skill.upgradeRequired || 'Pro');
      Alert.alert(
        upgradePrompt.title,
        upgradePrompt.body,
        [
          { text: upgradePrompt.cancelButton, style: 'cancel' },
          {
            text: upgradePrompt.upgradeButton,
            onPress: () => {
              const targetTier = tiers.find(t => t.id === 'pro');
              if (targetTier) handleTierSelect(targetTier);
            }
          }
        ]
      );
      return;
    }

    setSelectedSkill(skill);
    setShowSkillModal(true);
  };

  const handleUpgradeStep = async () => {
    if (!selectedTier || !upgradeFlow) return;

    const step = upgradeFlow[currentStep];
    
    if (currentStep === upgradeFlow.length - 1) {
      // Last step - complete upgrade
      await processUpgrade(selectedTier);
    } else {
      // Move to next step
      setCurrentStep(currentStep + 1);
    }
  };

  const processUpgrade = async (tier: TierCard) => {
    try {
      setLoading(true);
      
      // Update entitlement
      pricingService.updateEntitlement('demo-tenant', tier.id);
      setCurrentTier(tier.id);
      
      // Show success
      const successMessage = UpgradeUXHelper.getSuccessMessage(tier.name);
      Alert.alert('Upgrade Successful!', successMessage, [
        { text: 'OK', onPress: () => {
          setShowUpgradeModal(false);
          setSelectedTier(null);
          loadUpgradeData();
        }}
      ]);
      
    } catch (error) {
      Alert.alert('Upgrade Failed', 'Unable to process upgrade');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillInstall = async () => {
    if (!selectedSkill) return;

    Alert.alert(
      'Install Skill',
      `Install ${selectedSkill.name} for ${selectedSkill.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Install',
          onPress: () => {
            Alert.alert(
              'Skill Installed!',
              `${selectedSkill.name} has been added to your Acey instance.`,
              [{ text: 'OK', onPress: () => setShowSkillModal(false) }]
            );
          }
        }
      ]
    );
  };

  const showFeatureExplanation = (featureId: string) => {
    const explanation = UpgradeUXHelper.getFeatureExplanation(featureId);
    if (!explanation) return;

    Alert.alert(
      explanation.name,
      `${explanation.longDescription}\n\nBenefits:\n${explanation.benefits.map(b => `• ${b}`).join('\n')}`,
      [{ text: 'Got it' }]
    );
  };

  const renderTierCard = (tier: TierCard) => {
    return (
      <TouchableOpacity
        key={tier.id}
        style={[
          styles.tierCard,
          tier.popular && styles.popularTierCard,
          tier.current && styles.currentTierCard
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
          <Text style={styles.tierPrice}>{tier.price}</Text>
        </View>
        
        <Text style={styles.tierDescription}>{tier.description}</Text>
        
        <View style={styles.featuresList}>
          {tier.features.slice(0, 4).map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        {tier.current && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>
            {tier.current ? 'Manage Plan' : upgradeUXCopy.tierOverview.upgradeButton}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSkillCard = (skill: SkillCard) => {
    return (
      <TouchableOpacity
        key={skill.id}
        style={[
          styles.skillCard,
          !skill.compatible && styles.incompatibleSkillCard
        ]}
        onPress={() => handleSkillSelect(skill)}
      >
        <View style={styles.skillHeader}>
          <Text style={styles.skillName}>{skill.name}</Text>
          <Text style={styles.skillPrice}>{skill.price}</Text>
        </View>
        
        <Text style={styles.skillDescription}>{skill.description}</Text>
        
        <View style={styles.skillFooter}>
          <Text style={styles.skillCategory}>{skill.category}</Text>
          {!skill.compatible && (
            <Text style={styles.skillUpgradeRequired}>
              Requires {skill.upgradeRequired}
            </Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.installButton}>
          <Text style={styles.installButtonText}>
            {skill.compatible ? upgradeUXCopy.skillUpgrade.installButton : 'View Requirements'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderUpgradeModal = () => {
    if (!selectedTier || !upgradeFlow) return null;

    const step = upgradeFlow[currentStep];

    return (
      <Modal
        visible={showUpgradeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{step.title}</Text>
              <TouchableOpacity onPress={() => setShowUpgradeModal(false)}>
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {step.subtitle && (
              <Text style={styles.modalSubtitle}>{step.subtitle}</Text>
            )}
            
            {step.body && (
              <Text style={styles.modalBody}>{step.body}</Text>
            )}
            
            {step.showTrial && (
              <View style={styles.trialBadge}>
                <Icon name="flash_on" size={16} color="#FF9800" />
                <Text style={styles.trialText}>
                  {step.trialDays}-day free trial
                </Text>
              </View>
            )}
            
            <View style={styles.modalActions}>
              {step.secondaryButton && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowUpgradeModal(false)}
                >
                  <Text style={styles.secondaryButtonText}>{step.secondaryButton}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUpgradeStep}
              >
                <Text style={styles.primaryButtonText}>{step.primaryButton}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const renderSkillModal = () => {
    if (!selectedSkill) return null;

    return (
      <Modal
        visible={showSkillModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSkillModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedSkill.name}</Text>
              <TouchableOpacity onPress={() => setShowSkillModal(false)}>
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>{selectedSkill.price}</Text>
            <Text style={styles.modalBody}>{selectedSkill.description}</Text>
            
            <View style={styles.skillRequirements}>
              <Text style={styles.requirementsTitle}>Requirements:</Text>
              <Text style={styles.requirementsText}>{selectedSkill.requirements}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSkillInstall}
            >
              <Text style={styles.primaryButtonText}>
                {upgradeUXCopy.skillUpgrade.installButton}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Upgrade Acey</Text>
        <TouchableOpacity onPress={() => showFeatureExplanation('auto-rules')}>
          <Icon name="info" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>{upgradeUXCopy.tierOverview.header}</Text>
          <Text style={styles.headerDescription}>{upgradeUXCopy.tierOverview.description}</Text>
        </View>

        {/* Pricing Tiers */}
        <View style={styles.tiersSection}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {tiers.map(renderTierCard)}
        </View>

        {/* Skills Section */}
        <View style={styles.skillsSection}>
          <Text style={styles.sectionTitle}>{upgradeUXCopy.skillUpgrade.header}</Text>
          {skills.map(renderSkillCard)}
        </View>

        {/* Feature Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Learn More</Text>
          
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => showFeatureExplanation('auto-rules')}
          >
            <Icon name="auto-fix-high" size={24} color="#2196F3" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>What are auto-rules?</Text>
              <Text style={styles.infoDescription}>{upgradeUXCopy.tooltips.autoRules}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9E9E9E" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => showFeatureExplanation('skill-store')}
          >
            <Icon name="store" size={24} color="#2196F3" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>What is the Skill Store?</Text>
              <Text style={styles.infoDescription}>{upgradeUXCopy.tooltips.skillStore}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9E9E9E" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderUpgradeModal()}
      {renderSkillModal()}
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
  headerSection: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  tiersSection: {
    marginBottom: 40,
  },
  tierCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
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
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  tierPrice: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  tierDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 20,
    lineHeight: 20,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginLeft: 10,
    flex: 1,
  },
  currentBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  upgradeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  skillsSection: {
    marginBottom: 40,
  },
  skillCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  incompatibleSkillCard: {
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  skillPrice: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  skillDescription: {
    fontSize: 13,
    color: '#E0E0E0',
    marginBottom: 10,
    lineHeight: 18,
  },
  skillFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillCategory: {
    fontSize: 12,
    color: '#9E9E9E',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillUpgradeRequired: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
  },
  installButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  installButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: '#9E9E9E',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 15,
  },
  modalBody: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 20,
    marginBottom: 20,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  trialText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  skillRequirements: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  requirementsText: {
    fontSize: 12,
    color: '#E0E0E0',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666666',
  },
  secondaryButtonText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default UpgradeUXScreen;
