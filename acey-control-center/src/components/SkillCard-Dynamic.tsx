import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Skill, SkillCardProps } from '../types/upgrade-dynamic';

const isTierEligible = (required: string, current: string): boolean => {
  const tiers = ['free', 'creator-plus', 'pro', 'enterprise'];
  return tiers.indexOf(current) >= tiers.indexOf(required);
};

export const SkillCard: React.FC<SkillCardProps> = ({ 
  skill, 
  onInstallPress, 
  installing = false,
  currentUserTier 
}) => {
  const isCompatible = isTierEligible(skill.requiredTierId, currentUserTier);
  
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'monitoring': return 'visibility';
      case 'optimization': return 'speed';
      case 'creative': return 'palette';
      case 'ops_automation': return 'auto-fix-high';
      default: return 'extension';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'monitoring': return '#2196F3';
      case 'optimization': return '#FF9800';
      case 'creative': return '#9C27B0';
      case 'ops_automation': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getTierRequirementText = () => {
    const tierNames: Record<string, string> = {
      'free': 'Free',
      'creator-plus': 'Creator+',
      'pro': 'Pro',
      'enterprise': 'Enterprise'
    };
    return `Requires ${tierNames[skill.requiredTierId] || skill.requiredTierId}`;
  };

  return (
    <View style={[
      styles.card,
      !isCompatible && styles.incompatibleCard,
      skill.installed && styles.installedCard
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          {skill.category && (
            <View style={[styles.iconContainer, { backgroundColor: getCategoryColor(skill.category) }]}>
              <Icon name={getCategoryIcon(skill.category)} size={20} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.titleText}>
            <Text style={styles.name}>{skill.name}</Text>
            <Text style={styles.category}>{skill.category?.replace('_', ' ') || 'Skill'}</Text>
          </View>
        </View>
        <Text style={styles.price}>${skill.price}/mo</Text>
      </View>
      
      {/* Description */}
      <Text style={styles.description}>{skill.description}</Text>
      
      {/* Features */}
      {skill.features && skill.features.length > 0 && (
        <View style={styles.features}>
          {skill.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Icon name="check-circle" size={14} color="#4CAF50" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {skill.features.length > 3 && (
            <Text style={styles.moreFeatures}>+{skill.features.length - 3} more</Text>
          )}
        </View>
      )}

      {/* Rating and Reviews */}
      {skill.rating && (
        <View style={styles.rating}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon 
                key={star} 
                name={star <= Math.floor(skill.rating!) ? 'star' : 'star-border'} 
                size={16} 
                color="#FFD700" 
              />
            ))}
          </View>
          <Text style={styles.ratingText}>{skill.rating}</Text>
          {skill.reviews && (
            <Text style={styles.reviewsText}>({skill.reviews})</Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.requirements}>
          {skill.installed ? (
            <Text style={styles.installedText}>✓ Installed</Text>
          ) : !isCompatible ? (
            <Text style={styles.upgradeRequired}>{getTierRequirementText()}</Text>
          ) : (
            <Text style={styles.compatible}>Compatible with your plan</Text>
          )}
          {skill.trialDays && !skill.installed && (
            <Text style={styles.trial}>{skill.trialDays}-day trial</Text>
          )}
        </View>
      </View>

      {/* Install Button */}
      <TouchableOpacity
        style={[
          styles.installButton,
          skill.installed && styles.installedButton,
          !isCompatible && styles.upgradeButton,
          installing && styles.loadingButton
        ]}
        onPress={onInstallPress}
        disabled={skill.installed || installing || !isCompatible}
      >
        {installing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={[
            styles.installButtonText,
            skill.installed && styles.installedButtonText,
            !isCompatible && styles.upgradeButtonText
          ]}>
            {skill.installed ? 'Installed' : !isCompatible ? 'Upgrade Required' : 'Install Skill'}
          </Text>
        )}
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
  },
  incompatibleCard: {
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  installedCard: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#9E9E9E',
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 12,
    lineHeight: 20,
  },
  features: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#E0E0E0',
    marginLeft: 8,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 11,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#E0E0E0',
    fontWeight: 'bold',
  },
  reviewsText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginLeft: 4,
  },
  footer: {
    marginBottom: 12,
  },
  requirements: {
    flex: 1,
  },
  upgradeRequired: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  compatible: {
    fontSize: 12,
    color: '#4CAF50',
  },
  installedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  trial: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
  },
  installButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  installedButton: {
    backgroundColor: '#4CAF50',
  },
  upgradeButton: {
    backgroundColor: '#2196F3',
  },
  loadingButton: {
    backgroundColor: '#666666',
  },
  installButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  installedButtonText: {
    color: '#FFFFFF',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
  },
});
