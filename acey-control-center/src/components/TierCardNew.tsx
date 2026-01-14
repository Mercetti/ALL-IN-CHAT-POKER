/**
 * Tier Card Component
 * Displays tier information with upgrade functionality
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Tier } from '../types/dashboard';

interface TierCardProps {
  tier: Tier;
  currentTierId: string;
  onUpgradePress: () => void;
  upgrading?: boolean;
}

export const TierCard: React.FC<TierCardProps> = ({ tier, currentTierId, onUpgradePress, upgrading = false }) => {
  const isCurrent = tier.id === currentTierId;
  const isPopular = tier.popular;

  return (
    <View style={[
      styles.card,
      isPopular && styles.popularCard,
      isCurrent && styles.currentCard
    ]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.name}>{tier.name}</Text>
        <Text style={styles.price}>${tier.price}/month</Text>
      </View>
      
      <Text style={styles.description}>{tier.description}</Text>
      
      <View style={styles.features}>
        {tier.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Icon name="check" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.upgradeButton,
          isCurrent && styles.currentButton,
          upgrading && styles.disabledButton
        ]}
        onPress={onUpgradePress}
        disabled={isCurrent || upgrading}
      >
        <Text style={[
          styles.upgradeButtonText,
          isCurrent && styles.currentButtonText
        ]}>
          {isCurrent ? 'Current Tier' : upgrading ? 'Upgrading...' : `Upgrade to ${tier.name}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  popularCard: {
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  currentCard: {
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
    textTransform: 'uppercase',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  price: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 16,
    lineHeight: 20,
  },
  features: {
    marginBottom: 16,
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
  upgradeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.6,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentButtonText: {
    color: '#FFFFFF',
  },
});
