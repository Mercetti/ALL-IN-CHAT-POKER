import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { UpgradePromptProps } from '../types/upgrade';

export const UpgradePromptModal: React.FC<UpgradePromptProps> = ({
  requiredTierId,
  featureName,
  onUpgrade,
  onCancel,
  visible
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  const getTierName = (tierId: string): string => {
    const tierNames: Record<string, string> = {
      'free': 'Free',
      'creator-plus': 'Creator+',
      'pro': 'Pro',
      'enterprise': 'Enterprise'
    };
    return tierNames[tierId] || tierId;
  };

  const getTierPrice = (tierId: string): string => {
    const tierPrices: Record<string, number> = {
      'free': 0,
      'creator-plus': 9,
      'pro': 29,
      'enterprise': 99
    };
    const price = tierPrices[tierId] || 0;
    return price === 0 ? 'FREE' : `$${price}/month`;
  };

  const getUpgradeBenefits = (tierId: string): string[] => {
    const benefits: Record<string, string[]> = {
      'creator-plus': [
        'Mobile approvals',
        'Full audit timeline (7 days)',
        'Emergency lock',
        'Offline read-only mode'
      ],
      'pro': [
        'Auto-rules (permission-gated)',
        'Simulation engine',
        'Skill Store access',
        'Multi-device quorum unlock'
      ],
      'enterprise': [
        'Multi-tenant isolation',
        'Cloud clustering',
        'Hardware key support',
        'Advanced compliance exports'
      ]
    };
    return benefits[tierId] || [];
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Icon name="lock" size={24} color="#FF9800" />
            <Text style={styles.title}>Feature Locked</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Icon name="close" size={20} color="#9E9E9E" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.body}>
              {featureName 
                ? `This feature requires ${getTierName(requiredTierId)} tier. Upgrade to unlock ${featureName}.`
                : `This feature requires ${getTierName(requiredTierId)} tier. Upgrade to unlock automation, simulations, and the Skill Store.`
              }
            </Text>

            <View style={styles.tierInfo}>
              <View style={styles.tierHeader}>
                <Text style={styles.tierName}>{getTierName(requiredTierId)}</Text>
                <Text style={styles.tierPrice}>{getTierPrice(requiredTierId)}</Text>
              </View>
              
              <View style={styles.benefits}>
                <Text style={styles.benefitsTitle}>You'll unlock:</Text>
                {getUpgradeBenefits(requiredTierId).map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Icon name="check-circle" size={16} color="#4CAF50" />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.trialInfo}>
              <Icon name="flash_on" size={16} color="#FF9800" />
              <Text style={styles.trialText}>
                {requiredTierId === 'creator-plus' || requiredTierId === 'pro' 
                  ? '7-day free trial available' 
                  : 'Contact sales for custom pricing'}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
              <Text style={styles.upgradeButtonText}>Upgrade Now →</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modal: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    marginBottom: 24,
  },
  body: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 24,
    marginBottom: 20,
  },
  tierInfo: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tierPrice: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  benefits: {
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginLeft: 8,
    flex: 1,
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 10,
    alignSelf: 'flex-start',
  },
  trialText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 8,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666666',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  upgradeButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
