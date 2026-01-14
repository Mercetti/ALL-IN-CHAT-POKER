import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Skill } from '../types/upgrade';

interface SkillCardProps {
  skill: Skill;
  onInstallPress: () => void;
  currentTierId: string;
  compact?: boolean;
  installing?: boolean;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onInstallPress, currentTierId, compact = false, installing = false }) => {
  const isCompatible = checkSkillCompatibility(skill.requiredTierId, currentTierId);
  const upgradeRequired = !isCompatible ? skill.requiredTierId : null;

  // Get icon based on category for our specific skills
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'monitoring': return 'visibility';
      case 'creative': return 'palette';
      case 'optimization': return 'speed';
      case 'ops_automation': return 'auto-fix-high';
      default: return 'extension';
    }
  };

  // Get color based on category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'monitoring': return '#2196F3';
      case 'creative': return '#9C27B0';
      case 'optimization': return '#FF9800';
      case 'ops_automation': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={[
      styles.card,
      compact && styles.compactCard,
      !isCompatible && styles.incompatibleCard
    ]}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={[styles.iconContainer, { backgroundColor: getCategoryColor(skill.category) }]}>
            <Icon name={getCategoryIcon(skill.category)} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.titleText}>
            <Text style={[styles.name, compact && styles.compactName]}>{skill.name}</Text>
            <Text style={[styles.category, compact && styles.compactCategory]}>{skill.category}</Text>
          </View>
        </View>
        <Text style={[styles.price, compact && styles.compactPrice]}>
          ${skill.price}/mo
        </Text>
      </View>
      
      {!compact && (
        <Text style={styles.description}>{skill.description}</Text>
      )}
      
      <View style={styles.footer}>
        <View style={styles.requirements}>
          {!isCompatible ? (
            <Text style={styles.upgradeRequired}>
              Requires {upgradeRequired}
            </Text>
          ) : (
            <Text style={styles.compatible}>
              Compatible with your plan
            </Text>
          )}
          {skill.trialDays && (
            <Text style={styles.trial}>
              {skill.trialDays}-day trial
            </Text>
          )}
        </View>
        
        {skill.rating && !compact && (
          <View style={styles.rating}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{skill.rating}</Text>
            {skill.reviews && (
              <Text style={styles.reviewsText}>({skill.reviews})</Text>
            )}
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.installButton,
          !isCompatible && styles.upgradeButton,
          compact && styles.compactButton,
          installing && styles.disabledButton
        ]}
        onPress={onInstallPress}
        disabled={installing || skill.installed}
      >
        <Text style={[
          styles.installButtonText,
          !isCompatible && styles.upgradeButtonText,
          compact && styles.compactButtonText
        ]}>
          {installing ? 'Installing...' : skill.installed ? 'Installed' : 
           isCompatible ? (compact ? 'Install' : 'Install Skill →') : 
           (compact ? 'Upgrade' : 'View Requirements →')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const checkSkillCompatibility = (requiredTier: string, currentTier: string): boolean => {
  const tierHierarchy = {
    'free': 0,
    'creator-plus': 1,
    'pro': 2,
    'enterprise': 3
  };
  
  const requiredLevel = tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 0;
  const currentLevel = tierHierarchy[currentTier as keyof typeof tierHierarchy] || 0;
  
  return currentLevel >= requiredLevel;
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
  compactCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  incompatibleCard: {
    borderColor: '#FF9800',
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
  compactName: {
    fontSize: 16,
  },
  category: {
    fontSize: 12,
    color: '#9E9E9E',
    textTransform: 'capitalize',
  },
  compactCategory: {
    fontSize: 10,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  trial: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#E0E0E0',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 11,
    color: '#9E9E9E',
    marginLeft: 2,
  },
  installButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: '#2196F3',
  },
  compactButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  installButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
  },
  compactButtonText: {
    fontSize: 12,
  },
  disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.6,
  },
});
