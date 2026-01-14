/**
 * Full Dashboard Screen
 * Combined Current + Future Skills Dashboard with LLM Metrics
 * Centralized Control Center for Acey's development and monetization
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
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Skill } from '../types/upgrade';
import { FutureSkill } from '../types/futureSkill';
import { LLMMetrics, User, Tier } from '../types/dashboard';
import { SkillCard } from '../components/SkillCard';
import { FutureSkillCard } from '../components/FutureSkillCard';
import { MetricsCard } from '../components/MetricsCard';
import { TierCard } from '../components/TierCardNew';
import { 
  fetchAllSkills, 
  upgradeUserTier,
  installSkill,
  fetchLLMMetrics,
  fetchTiers,
  fetchDashboardStats
} from '../api/dashboard';
import { 
  fetchFutureSkills, 
  prePurchaseSkill, 
  wishlistSkill,
  fetchLLMPreparationStatus,
  fetchFutureSkillStats
} from '../api/futureSkills';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const currentUser: User = { 
  id: 'currentUserId', 
  tierId: 'Creator+', 
  name: 'Jamie',
  email: 'jamie@example.com',
  subscriptionActive: true
};

export const FullDashboardScreen = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [futureSkills, setFutureSkills] = useState<FutureSkill[]>([]);
  const [metrics, setMetrics] = useState<LLMMetrics[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [prePurchasingId, setPrePurchasingId] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'current' | 'future' | 'metrics'>('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [skillData, futureData, llmData, tierData] = await Promise.all([
        fetchAllSkills(currentUser.id),
        fetchFutureSkills(currentUser.id),
        fetchLLMMetrics(currentUser.id),
        fetchTiers()
      ]);
      
      setSkills(skillData);
      setFutureSkills(futureData);
      setMetrics(llmData);
      setTiers(tierData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data.');
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const handleInstallSkill = async (skill: Skill) => {
    if (skill.installed) {
      Alert.alert('Already Installed', `${skill.name} is already installed.`);
      return;
    }

    // Check tier eligibility
    const isEligible = isTierEligible(skill.requiredTierId, currentUser.tierId);
    if (!isEligible) {
      Alert.alert('Tier Required', `This skill requires ${skill.requiredTierId} tier or higher.`);
      return;
    }

    setInstallingId(skill.id);
    try {
      const res = await installSkill(currentUser.id, skill.id);
      if (!res.success) throw new Error(res.error || 'Installation failed');

      // Update local state
      setSkills(prev => prev.map(s => 
        s.id === skill.id ? { ...s, installed: true } : s
      ));

      // Refresh metrics
      const llmData = await fetchLLMMetrics(currentUser.id);
      setMetrics(llmData);

      Alert.alert('Installed', `${skill.name} installed successfully.`, [
        { text: 'OK' },
        { text: 'View Metrics', onPress: () => setSelectedTab('metrics') }
      ]);
    } catch (err: any) {
      Alert.alert('Installation Failed', err.message || 'Please try again.');
    } finally {
      setInstallingId(null);
    }
  };

  const handleUpgradeTier = async (tierId: string) => {
    setUpgrading(true);
    try {
      const res = await upgradeUserTier(currentUser.id, tierId);
      if (!res.success) throw new Error(res.error || 'Upgrade failed');

      // Update user tier
      currentUser.tierId = tierId;

      // Auto-install unlocked skills
      if (res.unlockedSkills?.length) {
        const installPromises = res.unlockedSkills.map(skill => 
          installSkill(currentUser.id, skill.id)
        );
        await Promise.all(installPromises);
      }

      // Refresh all data
      await loadDashboard();

      Alert.alert('Tier Upgraded', `Successfully upgraded to ${tierId}! ${res.unlockedSkills?.length || 0} skills were automatically installed.`);
    } catch (err: any) {
      Alert.alert('Upgrade Failed', err.message || 'Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const handlePrePurchase = async (skill: FutureSkill) => {
    if (skill.prePurchased) {
      Alert.alert('Already Pre-Purchased', `${skill.name} is already pre-purchased.`);
      return;
    }

    setPrePurchasingId(skill.id);
    try {
      const res = await prePurchaseSkill(currentUser.id, skill.id);
      if (!res.success) throw new Error(res.error || 'Pre-purchase failed');

      // Update local state
      setFutureSkills(prev => prev.map(s => 
        s.id === skill.id ? { ...s, prePurchased: true } : s
      ));

      // Load LLM preparation status
      const llmStatus = await fetchLLMPreparationStatus(skill.id);
      
      Alert.alert(
        'Pre-Purchase Successful!', 
        `${skill.name} has been pre-purchased. LLM preparation has started!`,
        [
          { text: 'OK' },
          { text: 'View LLM Status', onPress: () => setSelectedTab('metrics') }
        ]
      );
    } catch (err: any) {
      Alert.alert('Pre-Purchase Failed', err.message || 'Please try again.');
    } finally {
      setPrePurchasingId(null);
    }
  };

  const handleWishlist = async (skill: FutureSkill) => {
    try {
      const res = await wishlistSkill(currentUser.id, skill.id);
      if (!res.success) throw new Error(res.error || 'Wishlist update failed');

      // Update local state
      setFutureSkills(prev => prev.map(s => 
        s.id === skill.id ? { ...s, wishlisted: !s.wishlisted } : s
      ));

      const action = skill.wishlisted ? 'removed from' : 'added to';
      Alert.alert('Wishlist Updated', `${skill.name} has been ${action} your wishlist.`);
    } catch (err: any) {
      Alert.alert('Wishlist Failed', err.message || 'Please try again.');
    }
  };

  const isTierEligible = (required: string, current: string): boolean => {
    const tiers = ['Free', 'Creator', 'Creator+', 'Pro', 'Enterprise'];
    return tiers.indexOf(current) >= tiers.indexOf(required);
  };

  const getInstalledSkills = () => skills.filter(s => s.installed);
  const getAvailableSkills = () => skills.filter(s => !s.installed && isTierEligible(s.requiredTierId, currentUser.tierId));
  const getLockedSkills = () => skills.filter(s => !s.installed && !isTierEligible(s.requiredTierId, currentUser.tierId));

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Icon name="person" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userTier}>Current Tier: {currentUser.tierId}</Text>
          <Text style={styles.userEmail}>{currentUser.email}</Text>
        </View>
      </View>
      
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{getInstalledSkills().length}</Text>
          <Text style={styles.statLabel}>Installed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{futureSkills.filter(s => s.prePurchased).length}</Text>
          <Text style={styles.statLabel}>Pre-Purchased</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{futureSkills.filter(s => s.wishlisted).length}</Text>
          <Text style={styles.statLabel}>Wishlisted</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
        onPress={() => setSelectedTab('overview')}
      >
        <Icon name="dashboard" size={20} color={selectedTab === 'overview' ? '#2196F3' : '#9E9E9E'} />
        <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>Overview</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'current' && styles.activeTab]}
        onPress={() => setSelectedTab('current')}
      >
        <Icon name="extension" size={20} color={selectedTab === 'current' ? '#2196F3' : '#9E9E9E'} />
        <Text style={[styles.tabText, selectedTab === 'current' && styles.activeTabText]}>Current</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'future' && styles.activeTab]}
        onPress={() => setSelectedTab('future')}
      >
        <Icon name="update" size={20} color={selectedTab === 'future' ? '#2196F3' : '#9E9E9E'} />
        <Text style={[styles.tabText, selectedTab === 'future' && styles.activeTabText]}>Future</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'metrics' && styles.activeTab]}
        onPress={() => setSelectedTab('metrics')}
      >
        <Icon name="analytics" size={20} color={selectedTab === 'metrics' ? '#2196F3' : '#9E9E9E'} />
        <Text style={[styles.tabText, selectedTab === 'metrics' && styles.activeTabText]}>Metrics</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Upgrade Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upgrade Your Tier</Text>
        {tiers
          .filter(tier => tier.id !== currentUser.tierId)
          .map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            currentTierId={currentUser.tierId}
            onUpgradePress={() => handleUpgradeTier(tier.id)}
            upgrading={upgrading}
          />
        ))}
      </View>

      {/* Quick Skills Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills Overview</Text>
        <View style={styles.skillsOverview}>
          <View style={styles.skillOverviewItem}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.skillOverviewText}>{getInstalledSkills().length} Installed</Text>
          </View>
          <View style={styles.skillOverviewItem}>
            <Icon name="download" size={16} color="#2196F3" />
            <Text style={styles.skillOverviewText}>{getAvailableSkills().length} Available</Text>
          </View>
          <View style={styles.skillOverviewItem}>
            <Icon name="lock" size={16} color="#FF9800" />
            <Text style={styles.skillOverviewText}>{getLockedSkills().length} Requires Upgrade</Text>
          </View>
        </View>
      </View>

      {/* Future Skills Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coming Soon</Text>
        {futureSkills.slice(0, 2).map(skill => (
          <FutureSkillCard
            key={skill.id}
            skill={skill}
            onPrePurchase={() => handlePrePurchase(skill)}
            onWishlist={() => handleWishlist(skill)}
            prePurchasing={prePurchasingId === skill.id}
          />
        ))}
        {futureSkills.length > 2 && (
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => setSelectedTab('future')}
          >
            <Text style={styles.seeAllButtonText}>See All Future Skills →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCurrentSkillsTab = () => {
    const installed = getInstalledSkills();
    const available = getAvailableSkills();
    const locked = getLockedSkills();

    return (
      <View style={styles.tabContent}>
        {installed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Installed Skills ({installed.length})</Text>
            {installed.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onInstallPress={() => handleInstallSkill(skill)}
                installing={false}
                currentTierId={currentUser.tierId}
              />
            ))}
          </View>
        )}

        {available.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Skills ({available.length})</Text>
            {available.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onInstallPress={() => handleInstallSkill(skill)}
                installing={installingId === skill.id}
                currentTierId={currentUser.tierId}
              />
            ))}
          </View>
        )}

        {locked.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requires Upgrade ({locked.length})</Text>
            {locked.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onInstallPress={() => handleInstallSkill(skill)}
                installing={false}
                currentTierId={currentUser.tierId}
              />
            ))}
          </View>
        )}

        {installed.length === 0 && available.length === 0 && locked.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="extension" size={48} color="#9E9E9E" />
            <Text style={styles.emptyTitle}>No Skills Available</Text>
            <Text style={styles.emptyDescription}>Upgrade your tier to unlock more skills</Text>
          </View>
        )}
      </View>
    );
  };

  const renderFutureSkillsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Future Skills ({futureSkills.length})</Text>
      {futureSkills.map(skill => (
        <FutureSkillCard
          key={skill.id}
          skill={skill}
          onPrePurchase={() => handlePrePurchase(skill)}
          onWishlist={() => handleWishlist(skill)}
          prePurchasing={prePurchasingId === skill.id}
        />
      ))}
      
      {futureSkills.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="update" size={48} color="#9E9E9E" />
          <Text style={styles.emptyTitle}>No Future Skills</Text>
          <Text style={styles.emptyDescription}>Check back later for upcoming skills</Text>
        </View>
      )}
    </View>
  );

  const renderMetricsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>LLM Orchestrator Metrics</Text>
      {metrics.map(metric => (
        <MetricsCard key={metric.skillId} metric={metric} />
      ))}
      
      {metrics.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="analytics" size={48} color="#9E9E9E" />
          <Text style={styles.emptyTitle}>No Metrics Available</Text>
          <Text style={styles.emptyDescription}>Install skills to see LLM metrics</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        {renderTabs()}
        
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'current' && renderCurrentSkillsTab()}
        {selectedTab === 'future' && renderFutureSkillsTab()}
        {selectedTab === 'metrics' && renderMetricsTab()}
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userTier: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  skillsOverview: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  skillOverviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillOverviewText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginLeft: 8,
  },
  seeAllButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  seeAllButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  },
});
