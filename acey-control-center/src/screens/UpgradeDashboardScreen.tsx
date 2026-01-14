/**
 * Upgrade Dashboard Screen
 * Future-proof Skill Store + Upgrade Dashboard with LLM metrics
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
import { User, Skill, LLMMetrics, Tier, DashboardStats } from '../types/dashboard';
import { fetchAllSkills, upgradeUserTier, installSkill, fetchLLMMetrics, fetchTiers, fetchDashboardStats } from '../api/dashboard';
import { SkillCard } from '../components/SkillCard';
import { TierCard } from '../components/TierCardNew';
import { MetricsCard } from '../components/MetricsCard';
import { StatsCard } from '../components/StatsCard';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const currentUser: User = { 
  id: 'currentUserId', 
  tierId: 'Creator+', 
  name: 'Jamie',
  email: 'jamie@example.com',
  subscriptionActive: true
};

export const UpgradeDashboardScreen = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [metrics, setMetrics] = useState<LLMMetrics[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'skills' | 'tiers' | 'metrics'>('skills');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [skillData, metricData, tierData, statsData] = await Promise.all([
        fetchAllSkills(currentUser.id),
        fetchLLMMetrics(currentUser.id),
        fetchTiers(),
        fetchDashboardStats(currentUser.id)
      ]);
      
      setSkills(skillData);
      setMetrics(metricData);
      setTiers(tierData);
      setStats(statsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard');
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
      const metricData = await fetchLLMMetrics(currentUser.id);
      setMetrics(metricData);

      // Refresh stats
      const statsData = await fetchDashboardStats(currentUser.id);
      setStats(statsData);

      Alert.alert('Installed', `${skill.name} installed successfully.`, [
        { text: 'OK', onPress: () => setSelectedTab('metrics') }
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

  const isTierEligible = (required: string, current: string): boolean => {
    const tiers = ['Free', 'Creator', 'Creator+', 'Pro', 'Enterprise'];
    return tiers.indexOf(current) >= tiers.indexOf(required);
  };

  const getFilteredSkills = () => {
    return skills.filter(skill => {
      const isEligible = isTierEligible(skill.requiredTierId, currentUser.tierId);
      return selectedTab === 'skills' ? isEligible : true;
    });
  };

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
      
      {stats && (
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.installedSkills}</Text>
            <Text style={styles.statLabel}>Skills</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalTrustScore}%</Text>
            <Text style={styles.statLabel}>Trust</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalDatasetEntries}</Text>
            <Text style={styles.statLabel}>Data</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'skills' && styles.activeTab]}
        onPress={() => setSelectedTab('skills')}
      >
        <Icon name="extension" size={20} color={selectedTab === 'skills' ? '#2196F3' : '#9E9E9E'} />
        <Text style={[styles.tabText, selectedTab === 'skills' && styles.activeTabText]}>Skills</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'tiers' && styles.activeTab]}
        onPress={() => setSelectedTab('tiers')}
      >
        <Icon name="stars" size={20} color={selectedTab === 'tiers' ? '#2196F3' : '#9E9E9E'} />
        <Text style={[styles.tabText, selectedTab === 'tiers' && styles.activeTabText]}>Upgrade</Text>
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

  const renderSkillsTab = () => {
    const filteredSkills = getFilteredSkills();
    const availableSkills = filteredSkills.filter(s => !s.installed);
    const installedSkills = filteredSkills.filter(s => s.installed);

    return (
      <View style={styles.tabContent}>
        {stats && <StatsCard stats={stats} />}
        
        {availableSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Skills ({availableSkills.length})</Text>
            {availableSkills.map(skill => (
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

        {installedSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Installed Skills ({installedSkills.length})</Text>
            {installedSkills.map(skill => (
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

        {availableSkills.length === 0 && installedSkills.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="extension" size={48} color="#9E9E9E" />
            <Text style={styles.emptyTitle}>No Skills Available</Text>
            <Text style={styles.emptyDescription}>Upgrade your tier to unlock more skills</Text>
          </View>
        )}
      </View>
    );
  };

  const renderTiersTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Upgrade Your Tier</Text>
      {tiers.map(tier => (
        <TierCard
          key={tier.id}
          tier={tier}
          currentTierId={currentUser.tierId}
          onUpgradePress={() => handleUpgradeTier(tier.id)}
          upgrading={upgrading}
        />
      ))}
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
        
        {selectedTab === 'skills' && renderSkillsTab()}
        {selectedTab === 'tiers' && renderTiersTab()}
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
