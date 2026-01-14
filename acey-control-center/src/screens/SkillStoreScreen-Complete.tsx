/**
 * Enhanced Skill Store Screen with Complete Skill Database
 * Shows all 11 skills with proper filtering and categorization
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SkillCard } from '../components/SkillCard-Dynamic';
import { Skill, User } from '../types/upgrade-dynamic';
import { 
  fetchAvailableSkills, 
  fetchSkillsByTier,
  fetchSkillsByCategory,
  getPopularSkills,
  getNewSkills,
  getTrialSkills,
  installSkill
} from '../api/skills-complete';
import { orchestrateLLMUpgrade } from '../api/llm-enhanced';
import { 
  ALL_SKILLS, 
  SKILLS_BY_CATEGORY,
  POPULAR_SKILLS,
  NEW_SKILLS,
  TRIAL_SKILLS 
} from '../data/skillsDatabase';

// In production, fetch from auth context or API
const currentUser: User = { 
  id: 'currentUserId', 
  tierId: 'creator-plus',
  email: 'user@example.com',
  name: 'Demo User'
};

const SkillStoreScreen: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'all' | 'popular' | 'new' | 'trial'>('all');
  const [error, setError] = useState<string | null>(null);

  const loadSkills = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      let data: Skill[] = [];
      
      switch (selectedView) {
        case 'popular':
          data = await getPopularSkills(currentUser.id);
          break;
        case 'new':
          data = await getNewSkills(currentUser.id);
          break;
        case 'trial':
          data = await getTrialSkills(currentUser.id);
          break;
        default:
          data = await fetchAvailableSkills(currentUser.id);
      }
      
      setSkills(data);
    } catch (err: any) {
      console.error('Failed to load skills:', err);
      setError('Failed to load skills. Please try again.');
      Alert.alert('Error', 'Failed to load skills from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedView]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadSkills(false);
  }, [loadSkills]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadSkills(false);
      return;
    }

    try {
      setError(null);
      // Filter skills based on search query
      const filtered = ALL_SKILLS.filter(skill =>
        skill.name.toLowerCase().includes(query.toLowerCase()) ||
        skill.description.toLowerCase().includes(query.toLowerCase()) ||
        skill.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      setSkills(filtered);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    }
  }, []);

  const handleCategoryFilter = useCallback(async (category: string) => {
    try {
      setError(null);
      if (category === 'all') {
        setSkills(ALL_SKILLS);
      } else {
        const categorySkills = await fetchSkillsByCategory(currentUser.id, category);
        setSkills(categorySkills);
      }
    } catch (err: any) {
      console.error('Category filter failed:', err);
      setError('Failed to filter by category.');
    }
  }, []);

  const handleInstallPress = useCallback(async (skill: Skill) => {
    if (skill.installed) {
      Alert.alert('Already Installed', `${skill.name} is already installed.`);
      return;
    }

    if (!isTierEligible(skill.requiredTierId, currentUser.tierId)) {
      Alert.alert(
        'Tier Required', 
        `This skill requires ${skill.requiredTierId} tier or higher.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => {/* Navigate to pricing */} }
        ]
      );
      return;
    }

    setInstallingId(skill.id);

    try {
      // Install skill via backend API
      const res = await installSkill(currentUser.id, skill.id);
      if (!res.success) {
        throw new Error(res.message || 'Installation failed');
      }

      // Trigger LLM orchestration for permissions, trust, and dataset updates
      await orchestrateLLMUpgrade({
        userId: currentUser.id,
        skillId: skill.id,
        action: 'install_skill',
        permissions: getSkillPermissions(skill.id),
        trustLevel: 1, // Start with neutral trust for new skills
        datasetAccess: getSkillDatasetAccess(skill.id),
        timestamp: Date.now()
      });

      // Update local state to reflect installation
      setSkills(prev =>
        prev.map(s => (s.id === skill.id ? { ...s, installed: true } : s))
      );

      Alert.alert(
        'Installed Successfully', 
        `${skill.name} has been installed and is ready to use.`
      );
    } catch (err: any) {
      console.error('Installation failed:', err);
      Alert.alert(
        'Installation Failed', 
        err.message || 'Failed to install skill. Please try again.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Retry', onPress: () => handleInstallPress(skill) }
        ]
      );
    } finally {
      setInstallingId(null);
    }
  }, [currentUser.id]);

  const isTierEligible = (required: string, current: string): boolean => {
    const tiers = ['free', 'creator-plus', 'pro', 'enterprise'];
    return tiers.indexOf(current) >= tiers.indexOf(required);
  };

  const getSkillPermissions = (skillId: string): string[] => {
    const permissions: Record<string, string[]> = {
      'stream_ops': ['read_system_status', 'read_logs', 'send_notifications', 'suggest_fixes'],
      'graphics_auto': ['create_graphics', 'modify_overlays', 'generate_cosmetics'],
      'audio_mixer': ['read_audio_settings', 'suggest_optimizations', 'generate_audio'],
      'analytics_insights': ['read_analytics', 'generate_reports', 'access_engagement_data'],
      'event_automation': ['schedule_events', 'send_notifications', 'manage_chat'],
      'moderation_assistant': ['read_chat_data', 'apply_moderation_rules', 'enforce_community_rules'],
      'custom_personas': ['create_ai_personas', 'modify_personality', 'event_behavior'],
      'chat_games': ['host_games', 'manage_leaderboards', 'distribute_prizes'],
      'content_summaries': ['analyze_content', 'generate_summaries', 'create_clips'],
      'voice_effects': ['modify_voice', 'apply_effects', 'real_time_transformation'],
      'donation_manager': ['read_donation_data', 'apply_rewards', 'manage_incentives']
    };
    return permissions[skillId] || [];
  };

  const getSkillDatasetAccess = (skillId: string): string[] => {
    const datasets: Record<string, string[]> = {
      'stream_ops': ['stream_metrics', 'error_logs', 'performance_data'],
      'graphics_auto': ['graphic_templates', 'overlay_data', 'cosmetic_library'],
      'audio_mixer': ['audio_data', 'audio_settings', 'sound_library'],
      'analytics_insights': ['analytics_data', 'engagement_metrics', 'performance_trends'],
      'event_automation': ['event_data', 'scheduler_data', 'notification_history'],
      'moderation_assistant': ['chat_logs', 'moderation_history', 'community_rules'],
      'custom_personas': ['persona_data', 'personality_traits', 'event_logs'],
      'chat_games': ['game_data', 'leaderboard_data', 'prize_history'],
      'content_summaries': ['content_data', 'clip_library', 'social_posts'],
      'voice_effects': ['voice_data', 'effect_library', 'transformation_history'],
      'donation_manager': ['donation_data', 'reward_history', 'incentive_data']
    };
    return datasets[skillId] || [];
  };

  const getFilteredSkills = (): Skill[] => {
    let filtered = skills;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(skill => skill.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(skill =>
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const getSkillStats = () => {
    const filtered = getFilteredSkills();
    const installed = filtered.filter(s => s.installed).length;
    const compatible = filtered.filter(s => 
      isTierEligible(s.requiredTierId, currentUser.tierId)
    ).length;

    return { total: filtered.length, installed, compatible };
  };

  const categories = [
    { id: 'all', name: 'All Skills' },
    { id: 'monitoring', name: 'Monitoring' },
    { id: 'creative', name: 'Creative' },
    { id: 'optimization', name: 'Optimization' },
    { id: 'ops_automation', name: 'Automation' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'moderation', name: 'Moderation' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'content', name: 'Content' }
  ];

  const viewOptions = [
    { id: 'all', name: 'All Skills', icon: 'apps' },
    { id: 'popular', name: 'Popular', icon: 'trending_up' },
    { id: 'new', name: 'New', icon: 'new_releases' },
    { id: 'trial', name: 'Free Trial', icon: 'card_giftcard' }
  ];

  useEffect(() => {
    loadSkills(true);
  }, [loadSkills]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      handleCategoryFilter(selectedCategory);
    } else {
      loadSkills(false);
    }
  }, [selectedCategory]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading Skills...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = getSkillStats();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skill Store</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Icon name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* View Options */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewOptions}>
          {viewOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.viewOption,
                selectedView === option.id && styles.selectedViewOption
              ]}
              onPress={() => setSelectedView(option.id as any)}
            >
              <Icon 
                name={option.icon} 
                size={16} 
                color={selectedView === option.id ? '#FFFFFF' : '#9E9E9E'} 
              />
              <Text style={[
                styles.viewOptionText,
                selectedView === option.id && styles.selectedViewOptionText
              ]}>
                {option.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search and Filter */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#9E9E9E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search skills..."
              placeholderTextColor="#9E9E9E"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.selectedCategoryChip
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.selectedCategoryChipText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.compatible}</Text>
            <Text style={styles.statLabel}>Compatible</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.installed}</Text>
            <Text style={styles.statLabel}>Installed</Text>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorSection}>
            <Icon name="error" size={20} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadSkills(true)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Skills List */}
        <ScrollView
          style={styles.skillsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {getFilteredSkills().map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onInstallPress={() => handleInstallPress(skill)}
              installing={installingId === skill.id}
              currentUserTier={currentUser.tierId}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#E0E0E0',
    marginTop: 16,
    fontSize: 16,
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
  viewOptions: {
    marginBottom: 20,
  },
  viewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedViewOption: {
    backgroundColor: '#2196F3',
  },
  viewOptionText: {
    fontSize: 14,
    color: '#E0E0E0',
    fontWeight: '500',
    marginLeft: 6,
  },
  selectedViewOptionText: {
    color: '#FFFFFF',
  },
  searchSection: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  categoryFilter: {
    marginBottom: 15,
  },
  categoryChip: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedCategoryChip: {
    backgroundColor: '#2196F3',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    textTransform: 'uppercase',
  },
  errorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  retryText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  skillsList: {
    flex: 1,
  },
});

export default SkillStoreScreen;
