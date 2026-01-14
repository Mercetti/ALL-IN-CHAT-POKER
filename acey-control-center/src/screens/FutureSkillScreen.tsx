/**
 * Future Skill Screen
 * Displays upcoming skills with pre-purchase and wishlist functionality
 */

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FutureSkill, FutureSkillStats, FutureSkillFilter, LLMPreparationStatus } from '../types/futureSkill';
import { 
  fetchFutureSkills, 
  prePurchaseSkill, 
  wishlistSkill, 
  fetchFutureSkillStats,
  fetchLLMPreparationStatus
} from '../api/futureSkills';
import { FutureSkillCard } from '../components/FutureSkillCard';

const currentUserId = 'currentUserId';

export const FutureSkillScreen = () => {
  const [skills, setSkills] = useState<FutureSkill[]>([]);
  const [stats, setStats] = useState<FutureSkillStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prePurchasingId, setPrePurchasingId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pre_purchased' | 'wishlisted' | 'coming_soon'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [llmStatuses, setLlmStatuses] = useState<{ [key: string]: LLMPreparationStatus }>({});

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const [skillData, statsData] = await Promise.all([
        fetchFutureSkills(currentUserId),
        fetchFutureSkillStats(currentUserId)
      ]);
      
      setSkills(skillData);
      setStats(statsData);
      
      // Load LLM preparation status for pre-purchased skills
      const prePurchasedSkills = skillData.filter(s => s.prePurchased);
      if (prePurchasedSkills.length > 0) {
        const statusPromises = prePurchasedSkills.map(skill => 
          fetchLLMPreparationStatus(skill.id)
        );
        const statuses = await Promise.all(statusPromises);
        const statusMap = statuses.reduce((acc, status, index) => {
          acc[prePurchasedSkills[index].id] = status;
          return acc;
        }, {} as { [key: string]: LLMPreparationStatus });
        setLlmStatuses(statusMap);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load future skills.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSkills();
    setRefreshing(false);
  };

  const handlePrePurchase = async (skill: FutureSkill) => {
    if (skill.prePurchased) {
      Alert.alert('Already Pre-Purchased', `${skill.name} is already pre-purchased.`);
      return;
    }

    setPrePurchasingId(skill.id);
    
    try {
      const res = await prePurchaseSkill(currentUserId, skill.id);
      if (!res.success) throw new Error(res.error || 'Pre-purchase failed');

      // Update skill status
      setSkills(prev => prev.map(s => 
        s.id === skill.id ? { ...s, prePurchased: true } : s
      ));

      // Update stats
      const newStats = await fetchFutureSkillStats(currentUserId);
      setStats(newStats);

      // Load LLM preparation status
      const llmStatus = await fetchLLMPreparationStatus(skill.id);
      setLlmStatuses(prev => ({ ...prev, [skill.id]: llmStatus }));

      const savings = res.prePurchase?.discountApplied || 0;
      Alert.alert(
        'Pre-Purchase Successful!', 
        `${skill.name} has been pre-purchased with ${savings}% discount. LLM preparation has started!`,
        [
          { text: 'OK' },
          { text: 'View LLM Status', onPress: () => setSelectedFilter('pre_purchased') }
        ]
      );
    } catch (err: any) {
      Alert.alert('Pre-Purchase Failed', err.message || 'Please try again');
    } finally {
      setPrePurchasingId(null);
    }
  };

  const handleWishlist = async (skill: FutureSkill) => {
    try {
      const res = await wishlistSkill(currentUserId, skill.id);
      if (!res.success) throw new Error(res.error || 'Wishlist update failed');

      // Update skill status
      setSkills(prev => prev.map(s => 
        s.id === skill.id ? { ...s, wishlisted: !s.wishlisted } : s
      ));

      // Update stats
      const newStats = await fetchFutureSkillStats(currentUserId);
      setStats(newStats);

      const action = skill.wishlisted ? 'removed from' : 'added to';
      Alert.alert(
        'Wishlist Updated', 
        `${skill.name} has been ${action} your wishlist.`
      );
    } catch (err: any) {
      Alert.alert('Wishlist Failed', err.message || 'Please try again');
    }
  };

  const getFilteredSkills = () => {
    let filtered = [...skills];
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      switch (selectedFilter) {
        case 'pre_purchased':
          filtered = filtered.filter(s => s.prePurchased);
          break;
        case 'wishlisted':
          filtered = filtered.filter(s => s.wishlisted);
          break;
        case 'coming_soon':
          const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(s => new Date(s.releaseDate).getTime() <= thirtyDaysFromNow);
          break;
      }
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    
    return filtered;
  };

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'creative', name: 'Creative' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'social', name: 'Social' },
    { id: 'ops_automation', name: 'Automation' },
    { id: 'monitoring', name: 'Monitoring' },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Future Skills</Text>
      <Text style={styles.subtitle}>Pre-purchase upcoming skills and get early access discounts</Text>
      
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalFutureSkills}</Text>
            <Text style={styles.statLabel}>Total Skills</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.prePurchasedSkills}</Text>
            <Text style={styles.statLabel}>Pre-Purchased</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.wishlistedSkills}</Text>
            <Text style={styles.statLabel}>Wishlisted</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>${stats.totalSavings}</Text>
            <Text style={styles.statLabel}>Total Savings</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {(['all', 'pre_purchased', 'wishlisted', 'coming_soon'] as const).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.activeFilterChip
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter && styles.activeFilterChipText
            ]}>
              {filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.activeCategoryChip
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.activeCategoryChipText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="hourglass-empty" size={48} color="#9E9E9E" />
      <Text style={styles.emptyTitle}>No Future Skills Found</Text>
      <Text style={styles.emptyDescription}>
        {selectedFilter !== 'all' || selectedCategory !== 'all' 
          ? 'Try adjusting your filters to see more skills'
          : 'Check back later for upcoming skills and pre-purchase opportunities'
        }
      </Text>
      {(selectedFilter !== 'all' || selectedCategory !== 'all') && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => {
            setSelectedFilter('all');
            setSelectedCategory('all');
          }}
        >
          <Text style={styles.clearFiltersText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading Future Skills...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredSkills = getFilteredSkills();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderFilters()}
        
        <View style={styles.skillsContainer}>
          {filteredSkills.length > 0 ? (
            filteredSkills.map(skill => (
              <FutureSkillCard
                key={skill.id}
                skill={skill}
                onPrePurchase={() => handlePrePurchase(skill)}
                onWishlist={() => handleWishlist(skill)}
                prePurchasing={prePurchasingId === skill.id}
                llmPreparationStatus={llmStatuses[skill.id]}
              />
            ))
          ) : (
            renderEmptyState()
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#E0E0E0',
  },
  header: {
    padding: 20,
    backgroundColor: '#1E1E1E',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    textTransform: 'uppercase',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 12,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeCategoryChip: {
    backgroundColor: '#9C27B0',
  },
  categoryChipText: {
    fontSize: 11,
    color: '#E0E0E0',
  },
  activeCategoryChipText: {
    color: '#FFFFFF',
  },
  skillsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  clearFiltersButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
