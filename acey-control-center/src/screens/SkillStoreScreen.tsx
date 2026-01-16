import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAllSkills, installSkill, orchestrateLLMUpgrade } from '../api/skills';
import { useNavigation } from '@react-navigation/native';

// Types for skill discovery
interface Skill {
  id: string;
  name: string;
  description: string;
  requiredTierId: string;
  category: string;
  installed: boolean;
}

interface User {
  id: string;
  tierId: string;
}

interface SkillProposal {
  id: string;
  name: string;
  description: string;
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  type: 'enhancement' | 'new_skill' | 'variant';
  basedOn: string;
  reasoning: string;
  proposedAt: string;
  status: 'proposed' | 'approved' | 'rejected' | 'implemented';
  estimatedValue: number;
  implementationComplexity: 'low' | 'medium' | 'high';
}

// Simple SkillCard component since the import might not exist
const SkillCard = ({ skill, onInstallPress, currentTierId, installing }: any) => {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Free': return '#4CAF50';
      case 'Pro': return '#2196F3';
      case 'Creator+': return '#FF9800';
      case 'Enterprise': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.skillCard}>
      <View style={styles.skillHeader}>
        <Text style={styles.skillName}>{skill.name}</Text>
        <Text style={[styles.skillTier, { color: getTierColor(skill.requiredTierId) }]}>
          {skill.requiredTierId}
        </Text>
      </View>
      <Text style={styles.skillDescription}>{skill.description}</Text>
      <View style={styles.skillFooter}>
        {skill.installed ? (
          <Text style={styles.installedText}>✅ Installed</Text>
        ) : (
          <TouchableOpacity
            style={[
              styles.installButton,
              installing === skill.id && styles.installingButton
            ]}
            onPress={() => onInstallPress(skill)}
            disabled={installing !== null}
          >
            {installing === skill.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.installButtonText}>Install</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Types for skill discovery
interface SkillProposal {
  id: string;
  name: string;
  description: string;
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  type: 'enhancement' | 'new_skill' | 'variant';
  basedOn: string;
  reasoning: string;
  proposedAt: string;
  status: 'proposed' | 'approved' | 'rejected' | 'implemented';
  estimatedValue: number;
  implementationComplexity: 'low' | 'medium' | 'high';
}

const currentUser: User = { id: 'currentUserId', tierId: 'Creator+' };

export const SkillStoreScreen = () => {
  const navigation = useNavigation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [proposals, setProposals] = useState<SkillProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'skills' | 'proposals'>('skills');

  // Simple SkillCard component since the import might not exist
  const SkillCard = ({ skill, onInstallPress, currentTierId, installing }: any) => {
    const getTierColor = (tier: string) => {
      switch (tier) {
        case 'Free': return '#4CAF50';
        case 'Pro': return '#2196F3';
        case 'Creator+': return '#FF9800';
        case 'Enterprise': return '#9C27B0';
        default: return '#9E9E9E';
      }
    };

    return (
      <View style={styles.skillCard}>
        <View style={styles.skillHeader}>
          <Text style={styles.skillName}>{skill.name}</Text>
          <Text style={[styles.skillTier, { color: getTierColor(skill.requiredTierId) }]}>
            {skill.requiredTierId}
          </Text>
        </View>
        <Text style={styles.skillDescription}>{skill.description}</Text>
        <View style={styles.skillFooter}>
          {skill.installed ? (
            <Text style={styles.installedText}>✅ Installed</Text>
          ) : (
            <TouchableOpacity
              style={[
                styles.installButton,
                installing === skill.id && styles.installingButton
              ]}
              onPress={() => onInstallPress(skill)}
              disabled={installing !== null}
            >
              {installing === skill.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.installButtonText}>Install</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load skills from backend
        const data = await getAllSkills();
        setSkills(data);
        
        // Load skill proposals (mock data for now)
        const mockProposals: SkillProposal[] = [
          {
            id: '1',
            name: 'Enhanced Code Helper',
            description: 'Enhanced version of CodeHelper based on 45 uses with 95% success rate. Optimized for object inputs.',
            tier: 'Pro',
            type: 'enhancement',
            basedOn: 'CodeHelper',
            reasoning: 'High frequency usage (45 times) indicates strong demand. Excellent success rate (95%) suggests reliable pattern.',
            proposedAt: new Date().toISOString(),
            status: 'proposed',
            estimatedValue: 0.85,
            implementationComplexity: 'medium'
          },
          {
            id: '2',
            name: 'Security Specialist',
            description: 'Specialized skill derived from SecurityObserver usage patterns. Handles 23 repeated requests with 100% success rate.',
            tier: 'Enterprise',
            type: 'new_skill',
            basedOn: 'SecurityObserver',
            reasoning: 'Frequently used together (23 times) suggests workflow optimization opportunity.',
            proposedAt: new Date().toISOString(),
            status: 'proposed',
            estimatedValue: 0.92,
            implementationComplexity: 'high'
          },
          {
            id: '3',
            name: 'Data Analyzer Lite',
            description: 'Lightweight variant of DataAnalyzer for common use cases. Used 67 times with 88% success rate.',
            tier: 'Free',
            type: 'variant',
            basedOn: 'DataAnalyzer',
            reasoning: 'High estimated value (88%) justifies development effort. Recent activity shows current relevance.',
            proposedAt: new Date().toISOString(),
            status: 'approved',
            estimatedValue: 0.78,
            implementationComplexity: 'low'
          }
        ];
        setProposals(mockProposals);
      } catch (err) {
        Alert.alert('Error', 'Failed to load skills and proposals.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleApproveProposal = async (proposal: SkillProposal) => {
    Alert.alert(
      'Approve Skill Proposal',
      `Approve "${proposal.name}"?\n\n${proposal.description}\n\nTier: ${proposal.tier}\nComplexity: ${proposal.implementationComplexity}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            // Update proposal status
            setProposals(prev =>
              prev.map(p => p.id === proposal.id ? { ...p, status: 'approved' } : p)
            );
            Alert.alert('Approved', `${proposal.name} has been approved and will be implemented.`);
          }
        }
      ]
    );
  };

  const handleRejectProposal = async (proposal: SkillProposal) => {
    Alert.prompt(
      'Reject Skill Proposal',
      `Why are you rejecting "${proposal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: (reason) => {
            // Update proposal status
            setProposals(prev =>
              prev.map(p => p.id === proposal.id ? { ...p, status: 'rejected' } : p)
            );
            Alert.alert('Rejected', `${proposal.name} has been rejected.`);
          }
        }
      ]
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Free': return '#4CAF50';
      case 'Pro': return '#2196F3';
      case 'Creator+': return '#FF9800';
      case 'Enterprise': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'proposed': return '💡';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'implemented': return '🚀';
      default: return '❓';
    }
  };

  const isTierEligible = (required: string, current: string) => {
    const tiers = ['Free', 'Creator', 'Creator+', 'Pro', 'Enterprise'];
    return tiers.indexOf(current) >= tiers.indexOf(required);
  };

  const handleInstallPress = async (skill: Skill) => {
    if (skill.installed) {
      Alert.alert('Already Installed', `${skill.name} is already installed.`);
      return;
    }

    if (!isTierEligible(skill.requiredTierId, currentUser.tierId)) {
      Alert.alert('Tier Required', `This skill requires ${skill.requiredTierId} tier.`);
      return;
    }

    setInstallingId(skill.id);

    try {
      const res = await installSkill(currentUser.id, skill.id);
      if (!res.success) throw new Error(res.message);

      await orchestrateLLMUpgrade({ userId: currentUser.id, skillId: skill.id });

      setSkills(prev =>
        prev.map(s => (s.id === skill.id ? { ...s, installed: true } : s))
      );

      Alert.alert('Installed', `${skill.name} has been installed successfully.`);
    } catch (err: any) {
      Alert.alert('Installation Failed', err.message || 'Please try again.');
    } finally {
      setInstallingId(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getAllSkills();
      setSkills(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh skills.');
    } finally {
      setRefreshing(false);
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'skills' && styles.activeTab]}
        onPress={() => setActiveTab('skills')}
      >
        <Text style={[styles.tabText, activeTab === 'skills' && styles.activeTabText]}>
          Skills ({skills.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'proposals' && styles.activeTab]}
        onPress={() => setActiveTab('proposals')}
      >
        <Text style={[styles.tabText, activeTab === 'proposals && styles.activeTabText]}>
          Proposals ({proposals.filter(p => p.status === 'proposed').length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const getFilteredSkills = () => {
    return skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           skill.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getFilteredProposals = () => {
    return proposals.filter(proposal => 
      proposal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'implemented': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const renderProposal = ({ item }: { item: SkillProposal }) => (
    <View key={item.id} style={styles.proposalCard}>
      <View style={styles.proposalHeader}>
        <Text style={styles.proposalTitle}>{item.name}</Text>
        <View style={[styles.proposalStatus, { backgroundColor: getTierColor(item.tier) }]}>
          <Text style={styles.proposalButtonText}>{item.tier}</Text>
        </View>
        <Text style={[styles.proposalStatus, { backgroundColor: getStatusColor(item.status) }]}>
          {getStatusIcon(item.status)} {item.status}
        </Text>
      </View>
      <Text style={styles.proposalDescription}>{item.description}</Text>
      <View style={styles.proposalFooter}>
        <View style={styles.proposalActions}>
          {item.status === 'proposed' && (
            <>
              <TouchableOpacity
                style={[styles.proposalButton, styles.approveButton]}
                onPress={() => handleApproveProposal(item)}
              >
                <Text style={styles.proposalButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.proposalButton, styles.rejectButton]}
                onPress={() => handleRejectProposal(item)}
              >
                <Text style={styles.proposalButtonText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={styles.proposalInfo}>
          Value: {(item.estimatedValue * 100).toFixed(0)}% • {item.implementationComplexity}
        </Text>
      </View>
    </View>
  );

  const availableSkills = skills.filter(skill => isTierEligible(skill.requiredTierId, currentUser.tierId));

  const categories = [
    { id: 'all', name: 'All Skills' },
    { id: 'monitoring', name: 'Monitoring' },
    { id: 'optimization', name: 'Optimization' },
    { id: 'creative', name: 'Creative' },
    { id: 'ops_automation', name: 'Automation' }
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Enhance Acey with Skills</Text>
      <Text style={styles.headerDescription}>
        Add new abilities to Acey safely. Each skill is tested and permission-gated.
      </Text>
    </View>
  );

  const renderSearchAndFilter = () => (
    <View style={styles.searchFilterSection}>
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
  );

  const renderStats = () => {
    const filteredSkills = getFilteredSkills();
    const compatibleSkills = filteredSkills.filter(skill => 
      isTierEligible(skill.requiredTierId, currentUser.tierId)
    );

    return (
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredSkills.length}</Text>
          <Text style={styles.statLabel}>Available Skills</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{compatibleSkills.length}</Text>
          <Text style={styles.statLabel}>Compatible</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredSkills.length - compatibleSkills.length}</Text>
          <Text style={styles.statLabel}>Requires Upgrade</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.appTitle}>Skill Store</Text>
        <TouchableOpacity onPress={() => console.log('Navigate to tiers')}>
          <Icon name="shopping-cart" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderSearchAndFilter()}
        {renderStats()}
        
        <View style={styles.skillsSection}>
          <Text style={styles.sectionTitle}>
            {getFilteredSkills().length} Skills Available
          </Text>
          {getFilteredSkills().map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onInstallPress={() => handleInstallPress(skill)}
              currentTierId={currentUser.tierId}
              installing={installingId === skill.id}
            />
          ))}
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>Skill Safety</Text>
          <Text style={styles.footerDescription}>
            All skills are tested, permission-gated, and run in a sandboxed environment. Your data and control are never compromised.
          </Text>
          <TouchableOpacity style={styles.learnMoreButton}>
            <Text style={styles.learnMoreButtonText}>Learn About Skill Safety</Text>
          </TouchableOpacity>
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
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E1E1E',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  headerDescription: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 24,
  },
  searchFilterSection: {
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
    marginBottom: 30,
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
  skillsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  footerSection: {
    marginBottom: 20,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  footerDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 20,
    marginBottom: 20,
  },
  learnMoreButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  learnMoreButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // SkillCard styles
  skillCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  skillTier: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 12,
    lineHeight: 20,
  },
  skillFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  installedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  installButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  installingButton: {
    backgroundColor: '#666666',
  },
  installButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Proposal styles
  proposalCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proposalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  proposalStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proposalDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 12,
    lineHeight: 20,
  },
  proposalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proposalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  proposalButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  proposalButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  proposalInfo: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});
