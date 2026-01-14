import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { getSkillPricing } from '../services/monetizationService';

interface UpgradeButtonProps {
  skillName: string;
  userToken: string;
  onUnlocked?: () => void;
  style?: any;
}

export default function UpgradeButton({ skillName, userToken, onUnlocked, style }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<any>(null);

  React.useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      const pricingData = await getSkillPricing();
      const skillPricing = pricingData.find((p: any) => p.skillId === skillName);
      setPricing(skillPricing);
    } catch (error) {
      console.error('Error loading pricing:', error);
    }
  };

  const handleUpgrade = async () => {
    if (!pricing) return;

    Alert.alert(
      `Unlock ${pricing.name}`,
      `Price: $${pricing.price}/month\n\nFeatures:\n${pricing.features.join('\n')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unlock', 
          onPress: async () => {
            setLoading(true);
            try {
              // This would integrate with your payment system
              // await unlockSkill(userToken, skillName);
              onUnlocked?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to unlock skill');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.button, styles.loadingButton, style]}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.button, styles.unlockButton, style]}
      onPress={handleUpgrade}
      disabled={!pricing}
    >
      <Text style={styles.buttonText}>
        {pricing ? `🔓 ${pricing.name} - $${pricing.price}/mo` : 'Loading...'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  unlockButton: {
    backgroundColor: '#ffc107',
  },
  loadingButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#212529',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
