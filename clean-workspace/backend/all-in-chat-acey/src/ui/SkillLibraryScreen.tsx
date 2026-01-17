import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Skill {
  name: string;
  description: string;
  category: string;
  tier: string;
  requiresApproval: boolean;
  usageCount: number;
}

interface Props {
  userRole: string;
  userTier: string;
  onSkillExecute: (skillName: string) => void;
}

export const SkillLibraryScreen: React.FC<Props> = ({ userRole, userTier, onSkillExecute }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const categories = ['all', 'code', 'audio', 'graphics', 'link', 'payout', 'analytics'];
  const tierColors = {
    'Free': '#10B981',
    'Pro': '#3B82F6',
    'Creator+': '#8B5CF6',
    'Enterprise': '#F59E0B'
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual API
      const mockSkills: Skill[] = [
        {
          name: 'Code Helper',
          description: 'Generate, review, and improve code snippets',
          category: 'code',
          tier: 'Free',
          requiresApproval: false,
          usageCount: 450
        },
        {
          name: 'Audio Maestro',
          description: 'Generate audio content and effects',
          category: 'audio',
          tier: 'Pro',
          requiresApproval: false,
          usageCount: 280
        },
        {
          name: 'Graphics Wizard',
          description: 'Create custom graphics and logos',
          category: 'graphics',
          tier: 'Pro',
          requiresApproval: false,
          usageCount: 320
        },
        {
          name: 'Link Reviewer',
          description: 'Validate external links and content',
          category: 'link',
          tier: 'Free',
          requiresApproval: false,
          usageCount: 200
        },
        {
          name: 'Partner Payout',
          description: 'Prepare partner payouts and approvals',
          category: 'payout',
          tier: 'Creator+',
          requiresApproval: true,
          usageCount: 150
        },
        {
          name: 'Analytics & Reporting',
          description: 'Generate insights and revenue reports',
          category: 'analytics',
          tier: 'Creator+',
          requiresApproval: false,
          usageCount: 380
        }
      ];
      
      setSkills(mockSkills);
    } catch (error) {
      Alert.alert('Error', 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSkills();
    setRefreshing(false);
  };

  const filteredSkills = selectedCategory === 'all' 
    ? skills 
    : skills.filter(skill => skill.category === selectedCategory);

  const canAccessSkill = (skill: Skill) => {
    const tierOrder = ['Free', 'Pro', 'Creator+', 'Enterprise'];
    const userTierIndex = tierOrder.indexOf(userTier);
    const skillTierIndex = tierOrder.indexOf(skill.tier);
    return skillTierIndex <= userTierIndex;
  };

  const renderSkillItem = ({ item }: { item: Skill }) => {
    const canAccess = canAccessSkill(item);
    const tierColor = tierColors[item.tier as keyof typeof tierColors];

    return (
      <TouchableOpacity
        style={[
          styles.skillCard,
          !canAccess && styles.disabledCard
        ]}
        onPress={() => canAccess && onSkillExecute(item.name)}
        disabled={!canAccess}
      >
        <View style={styles.skillHeader}>
          <Text style={styles.skillName}>{item.name}</Text>
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.tierText}>{item.tier}</Text>
          </View>
        </View>
        
        <Text style={styles.skillDescription}>{item.description}</Text>
        
        <View style={styles.skillFooter}>
          <View style={styles.usageInfo}>
            <Text style={styles.usageText}>{item.usageCount} uses</Text>
          </View>
          
          {item.requiresApproval && (
            <View style={styles.approvalBadge}>
              <Text style={styles.approvalText}>⚠️ Approval Required</Text>
            </View>
          )}
          
          {!canAccess && (
            <View style={styles.upgradeBadge}>
              <Text style={styles.upgradeText}>🔒 Upgrade Required</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryTab = (category: string) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategory === category && styles.activeCategoryTab
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === category && styles.activeCategoryText
      ]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skill Library</Text>
        <Text style={styles.subtitle}>Your Tier: {userTier}</Text>
      </View>

      <View style={styles.categoryTabs}>
        {categories.map(renderCategoryTab)}
      </View>

      <FlatList
        data={filteredSkills}
        renderItem={renderSkillItem}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.skillsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No skills found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  activeCategoryTab: {
    backgroundColor: '#3B82F6',
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  skillsList: {
    padding: 20,
  },
  skillCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledCard: {
    opacity: 0.6,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skillDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  skillFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageInfo: {
    flex: 1,
  },
  usageText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  approvalBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  approvalText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#92400E',
  },
  upgradeBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upgradeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#991B1B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
