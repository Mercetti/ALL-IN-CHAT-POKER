import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SkillStoreItem, SkillType, UserTier } from '../types/skills';
import { getCurrentTier, canUseSkill, installSkill, getTierByName } from '../utils/tierManager';

interface SkillStoreProps {
  onSkillSelect: (skill: SkillType) => void;
  onUpgradePrompt: () => void;
}

export const SkillStore: React.FC<SkillStoreProps> = ({
  onSkillSelect,
  onUpgradePrompt
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'installed' | 'available'>('all');
  const currentUserTier = getCurrentTier();

  // All available skills with their configurations
  const allSkills: SkillStoreItem[] = [
    {
      skill: 'CodeHelper',
      name: 'Code Helper',
      description: 'Generate code in multiple programming languages with syntax highlighting and error detection.',
      icon: '💻',
      tier: 'Free',
      price: 0,
      features: ['Code generation', 'Multiple languages', 'Syntax highlighting'],
      isInstalled: true,
      lastUsed: new Date()
    },
    {
      skill: 'GraphicsWizard',
      name: 'Graphics Wizard',
      description: 'Create custom graphics and images with various styles and formats.',
      icon: '🎨',
      tier: 'Free',
      price: 0,
      features: ['Image generation', 'Custom graphics', 'Format conversion'],
      isInstalled: true,
      lastUsed: new Date()
    },
    {
      skill: 'AudioMaestro',
      name: 'Audio Maestro',
      description: 'Generate custom audio and sound effects with multiple format support.',
      icon: '🎵',
      tier: 'Free',
      price: 0,
      features: ['Audio generation', 'Custom sounds', 'Format conversion'],
      isInstalled: true,
      lastUsed: new Date()
    },
    {
      skill: 'StreamAnalyticsPro',
      name: 'Stream Analytics Pro',
      description: 'Advanced analytics and insights for streamers with real-time viewer tracking.',
      icon: '📊',
      tier: 'Pro',
      price: 999,
      features: ['Real-time analytics', 'Viewer tracking', 'Revenue insights', 'Custom reports'],
      isInstalled: false
    },
    {
      skill: 'DynamicAlertDesigner',
      name: 'Dynamic Alert Designer',
      description: 'Custom animated alerts and overlays for streaming events.',
      icon: '⚠️',
      tier: 'Pro',
      price: 799,
      features: ['Custom animations', 'Trigger conditions', 'Sound integration', 'Overlay design'],
      isInstalled: false
    },
    {
      skill: 'AICoHostGames',
      name: 'AI Co-Host Games',
      description: 'Interactive AI-powered games for streaming with multiplayer support.',
      icon: '🎮',
      tier: 'Enterprise',
      price: 1999,
      features: ['AI game generation', 'Multiplayer support', 'Chat integration', 'Viewer interaction'],
      isInstalled: false
    },
    {
      skill: 'CustomMiniAceyPersona',
      name: 'Custom Mini-Acey Persona',
      description: 'Temporary AI persona for streaming events with custom responses.',
      icon: '🤖',
      tier: 'Enterprise',
      price: 999,
      features: ['AI personas', 'Custom responses', 'Event awareness', 'Themed content'],
      isInstalled: false
    },
    {
      skill: 'DonationIncentiveManager',
      name: 'Donation Incentive Manager',
      description: 'Automated donation incentives and rewards system for streamers.',
      icon: '💰',
      tier: 'Enterprise',
      price: 1499,
      features: ['Automated rewards', 'Donation tracking', 'Incentive campaigns', 'Platform integration'],
      isInstalled: false
    }
  ];

  const getFilteredSkills = () => {
    let filtered = allSkills;

    switch (selectedCategory) {
      case 'installed':
        filtered = filtered.filter(skill => skill.isInstalled);
        break;
      case 'available':
        filtered = filtered.filter(skill => !skill.isInstalled);
        break;
      default:
        // Show all skills
        break;
    }

    // Filter by user tier
    return filtered.filter(skill => {
      if (skill.tier === 'Free') return true;
      if (skill.tier === 'Pro') return currentUserTier.name === 'Pro' || currentUserTier.name === 'Enterprise';
      if (skill.tier === 'Enterprise') return currentUserTier.name === 'Enterprise';
      return false;
    });
  };

  const handleSkillPress = (skill: SkillStoreItem) => {
    if (canUseSkill(skill.skill)) {
      onSkillSelect(skill.skill);
    } else {
      onUpgradePrompt();
    }
  };

  const handleInstallSkill = (skill: SkillStoreItem) => {
    if (!canUseSkill(skill.skill)) {
      onUpgradePrompt();
      return;
    }

    // Install the skill
    installSkill({
      skill: skill.skill,
      userId: 'current_user', // Would come from auth context
      tier: currentUserTier.name,
      sessionId: 'store_session',
      timestamp: Date.now()
    });

    // Update local state
    skill.isInstalled = true;
    skill.installDate = new Date();
    skill.lastUsed = new Date();
  };

  const renderSkillItem = ({ item }: { item: SkillStoreItem }) => {
    const canAccess = canUseSkill(item.skill);
    const isLocked = !canAccess && !item.isInstalled;

    return (
      <View style={[styles.skillCard, isLocked && styles.lockedCard]}>
        <View style={styles.skillHeader}>
          <Text style={styles.skillIcon}>{item.icon}</Text>
          <View style={styles.skillInfo}>
            <Text style={styles.skillName}>{item.name}</Text>
            <Text style={styles.skillTier}>{item.tier} Tier</Text>
          </View>
          <View style={styles.skillPricing}>
            {item.price === 0 ? (
              <Text style={styles.freePrice}>FREE</Text>
            ) : (
              <Text style={styles.paidPrice}>${(item.price / 100).toFixed(2)}/mo</Text>
            )}
          </View>
        </View>

        <Text style={styles.skillDescription}>{item.description}</Text>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features:</Text>
          {item.features.map((feature, index) => (
            <Text key={index} style={styles.feature}>• {feature}</Text>
          ))}
        </View>

        <View style={styles.skillActions}>
          {item.isInstalled ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.installedButton]}
              onPress={() => handleSkillPress(item)}
            >
              <Text style={styles.actionButtonText}>Use Skill</Text>
            </TouchableOpacity>
          ) : isLocked ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.upgradeButton]}
              onPress={onUpgradePrompt}
            >
              <Text style={styles.actionButtonText}>Upgrade to {item.tier}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.installButton]}
              onPress={() => handleInstallSkill(item)}
            >
              <Text style={styles.actionButtonText}>Install</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockText}>🔒</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity 
        style={[styles.filterButton, selectedCategory === 'all' && styles.activeFilter]}
        onPress={() => setSelectedCategory('all')}
      >
        <Text style={styles.filterText}>All Skills</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.filterButton, selectedCategory === 'installed' && styles.activeFilter]}
        onPress={() => setSelectedCategory('installed')}
      >
        <Text style={styles.filterText}>Installed</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.filterButton, selectedCategory === 'available' && styles.activeFilter]}
        onPress={() => setSelectedCategory('available')}
      >
        <Text style={styles.filterText}>Available</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTierInfo = () => (
    <View style={styles.tierInfo}>
      <Text style={styles.currentTier}>Current Tier: {currentUserTier.name}</Text>
      <Text style={styles.tierFeatures}>
        Features: {currentUserTier.features.join(', ')}
      </Text>
      <TouchableOpacity style={styles.upgradeTierButton} onPress={onUpgradePrompt}>
        <Text style={styles.upgradeTierText}>Upgrade Tier</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderTierInfo()}
      {renderCategoryFilter()}
      
      <FlatList
        data={getFilteredSkills()}
        renderItem={renderSkillItem}
        keyExtractor={(item) => item.skill}
        contentContainerStyle={styles.skillsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedCategory === 'installed' 
                ? 'No skills installed yet. Install your first skill to get started!'
                : 'No skills available for your current tier. Upgrade to access more skills!'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  tierInfo: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  currentTier: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tierFeatures: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  upgradeTierButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  upgradeTierText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#2d2d2d',
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#404040',
  },
  activeFilter: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  skillsList: {
    paddingHorizontal: 16,
  },
  skillCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  lockedCard: {
    opacity: 0.7,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  skillTier: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  skillPricing: {
    alignItems: 'flex-end',
  },
  freePrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  paidPrice: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  skillDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresContainer: {
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  feature: {
    fontSize: 12,
    color: '#bbb',
    marginBottom: 2,
  },
  skillActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
  },
  installedButton: {
    backgroundColor: '#4CAF50',
  },
  upgradeButton: {
    backgroundColor: '#FF9800',
  },
  installButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockText: {
    fontSize: 12,
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SkillStore;
