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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SkillCard } from '../components/SkillCard';
import { Skill, User } from '../types/upgrade';
import { getAllSkills, installSkill, orchestrateLLMUpgrade } from '../api/skills';
import { useNavigation } from '@react-navigation/native';

const currentUser: User = { id: 'currentUserId', tierId: 'Creator+' };

export const SkillStoreScreen = () => {
  const navigation = useNavigation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const data = await getAllSkills(); // Fetch backend
        setSkills(data);
      } catch (err) {
        Alert.alert('Error', 'Failed to load skills.');
      } finally {
        setLoading(false);
      }
    };
    loadSkills();
  }, []);

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

  const getFilteredSkills = () => {
    return skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           skill.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

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
});
