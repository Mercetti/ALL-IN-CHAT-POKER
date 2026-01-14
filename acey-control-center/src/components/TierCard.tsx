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
  const isUpgrade = !isCurrent && tier.id !== 'Free';

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
        <Text style={[styles.price, compact && styles.compactPrice]}>
          {tier.price === 0 ? 'FREE' : `$${tier.price}/mo`}
        </Text>
      </View>
      
      {!compact && (
        <Text style={styles.description}>{tier.description}</Text>
      )}
      
      <View style={styles.featuresList}>
        {tier.features.slice(0, compact ? 2 : 4).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Icon name="check-circle" size={compact ? 14 : 16} color="#4CAF50" />
            <Text style={[styles.feature, compact && styles.compactFeature]}>{feature}</Text>
          </View>
        ))}
        {!compact && tier.features.length > 4 && (
          <Text style={styles.moreFeatures}>+{tier.features.length - 4} more features</Text>
        )}
      </View>
      
      {isCurrent ? (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.upgradeButton, compact && styles.compactButton]} 
          onPress={onUpgradePress}
        >
          <Text style={[styles.upgradeButtonText, compact && styles.compactButtonText]}>
            {compact ? 'Upgrade' : 'Upgrade Now →'}
          </Text>
        </TouchableOpacity>
      )}
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
  compactCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
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
  compactName: {
    fontSize: 18,
  },
  price: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  compactPrice: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feature: {
    fontSize: 14,
    color: '#E0E0E0',
    marginLeft: 8,
    flex: 1,
  },
  compactFeature: {
    fontSize: 12,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
    marginTop: 4,
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  upgradeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  compactButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  compactButtonText: {
    fontSize: 12,
  },
});
