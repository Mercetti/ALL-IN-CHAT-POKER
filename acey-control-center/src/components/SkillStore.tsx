// components/SkillStore.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { AceyMobileOrchestrator, Skill } from '../services/aceyMobileOrchestrator';

interface SkillStoreProps {
  userToken: string;
  userRole: string;
}

export default function SkillStore({ userToken, userRole }: SkillStoreProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userAccess, setUserAccess] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const orchestrator = new AceyMobileOrchestrator(userToken);

  useEffect(() => {
    const loadSkillsAndAccess = async () => {
      try {
        setLoading(true);
        const data = await orchestrator.fetchUserData();
        setSkills(data.skillsList);
        setUserAccess(data.userAccess);
      } catch (error) {
        console.error('Failed to load skills:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSkillsAndAccess();
  }, [userToken]);

  const handleUnlock = async (skillId: string) => {
    try {
      const result = await orchestrator.installSkill(skillId);
      if (result.success) {
        // Refresh user data to update unlocked skills
        const updatedData = await orchestrator.fetchUserData();
        setSkills(updatedData.skillsList);
        setUserAccess(updatedData.userAccess);
      }
    } catch (error) {
      console.error('Failed to unlock skill:', error);
    }
  };

  const handleStartTrial = async (skillId: string) => {
    try {
      const result = await orchestrator.startTrial(skillId);
      if (result.success) {
        // Refresh user data to update trial status
        const updatedData = await orchestrator.fetchUserData();
        setSkills(updatedData.skillsList);
        setUserAccess(updatedData.userAccess);
      }
    } catch (error) {
      console.error('Failed to start trial:', error);
    }
  };

  const isUnlocked = (skillId: string) => {
    return userAccess?.unlockedSkills?.includes(skillId) || false;
  };

  const getTrialStatus = (skillId: string) => {
    const trial = userAccess?.trials?.find((t: any) => t.skillName === skillId);
    return trial;
  };

  const canAccess = (skill: Skill) => {
    if (isUnlocked(skill.id)) return true;
    const trial = getTrialStatus(skill.id);
    return trial || userAccess?.trials?.find((t: any) => t.skillName === skill.id);
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free': return '#34C759';
      case 'pro': return '#007AFF';
      case 'creator+': return '#AF52DE';
      case 'enterprise': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const filteredSkills = selectedCategory === 'all' 
    ? skills 
    : skills.filter(skill => skill.type === selectedCategory);

  const categories = [
    { id: 'all', name: 'All Skills' },
    { id: 'code', name: 'Code' },
    { id: 'audio', name: 'Audio' },
    { id: 'image', name: 'Graphics' },
    { id: 'clips', name: 'Clips' },
  ];

  const renderSkill = ({ item }: { item: Skill }) => {
    const trial = getTrialStatus(item.id);
    const unlocked = isUnlocked(item.id);
    const accessible = canAccess(item);

    return (
      <View style={styles.skillCard}>
        {/* Header */}
        <View style={styles.skillHeader}>
          <View style={styles.skillInfo}>
            <Text style={styles.skillName}>{item.name}</Text>
            <Text style={styles.skillDescription}>{item.description}</Text>
            <View style={styles.skillFeatures}>
              {item.features.slice(0, 2).map((feature, index) => (
                <Text key={index} style={styles.featureText}>• {feature}</Text>
              ))}
            </View>
          </View>
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { 
            backgroundColor: unlocked ? '#34C759' : 
                           trial ? '#FF9500' : '#8E8E93' 
          }]}>
            <Text style={styles.statusText}>
              {unlocked ? '✓ UNLOCKED' : 
               trial ? `⏰ TRIAL - ${trial.expiresInHours}h` : 
               '🔒 LOCKED'}
            </Text>
          </View>
        </View>

        {/* Tier Badge */}
        <View style={[styles.tierBadge, { backgroundColor: getTierColor(item.tier) }]}>
          <Text style={styles.tierText}>{item.tier}</Text>
        </View>

        {/* Preview */}
        {accessible && item.preview && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview</Text>
            {item.type === 'code' && (
              <View style={styles.codePreview}>
                <Text style={styles.codeText}>{item.preview}</Text>
              </View>
            )}
            {item.type === 'image' && (
              <View style={styles.imagePreview}>
                <Text style={styles.imagePlaceholder}>🖼️ Image Preview</Text>
                <Text style={styles.previewUrl}>{item.preview}</Text>
              </View>
            )}
            {item.type === 'audio' && (
              <View style={styles.audioPreview}>
                <Text style={styles.audioPlaceholder}>🎵 Audio Preview</Text>
                <Text style={styles.previewUrl}>{item.preview}</Text>
              </View>
            )}
          </View>
        )}

        {/* Stats */}
        {(item.usageCount || item.avgRating) && (
          <View style={styles.statsContainer}>
            {item.usageCount && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>📈</Text>
                <Text style={styles.statText}>{item.usageCount.toLocaleString()} uses</Text>
              </View>
            )}
            {item.avgRating && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statText}>{item.avgRating.toFixed(1)} stars</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!unlocked && !trial && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.unlockButton]}
                onPress={() => handleUnlock(item.id)}
              >
                <Text style={styles.buttonText}>🔓 Unlock</Text>
              </TouchableOpacity>
              
              {item.tier !== 'Free' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.trialButton]}
                  onPress={() => handleStartTrial(item.id)}
                >
                  <Text style={styles.trialButtonText}>⏰ Start Trial</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          
          {unlocked && (
            <TouchableOpacity style={[styles.actionButton, styles.useButton]}>
              <Text style={styles.buttonText}>▶️ Use Skill</Text>
            </TouchableOpacity>
          )}
          
          {trial && (
            <TouchableOpacity style={[styles.actionButton, styles.extendButton]}>
              <Text style={styles.buttonText}>➕ Extend Trial</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading skills...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.id && styles.categoryButtonTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Skills List */}
      <FlatList
        data={filteredSkills}
        renderItem={renderSkill}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.skillsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  categoryContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  skillsList: {
    padding: 15,
  },
  skillCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  skillInfo: {
    flex: 1,
    marginRight: 10,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  skillDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  skillFeatures: {
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 100,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tierBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  previewContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  codePreview: {
    backgroundColor: '#1e1e1e',
    borderRadius: 6,
    padding: 10,
  },
  codeText: {
    fontSize: 11,
    color: '#fff',
    fontFamily: 'monospace',
  },
  imagePreview: {
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 24,
    marginBottom: 6,
  },
  previewUrl: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  audioPreview: {
    alignItems: 'center',
  },
  audioPlaceholder: {
    fontSize: 24,
    marginBottom: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  unlockButton: {
    backgroundColor: '#007AFF',
  },
  trialButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  useButton: {
    backgroundColor: '#34C759',
  },
  extendButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  trialButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
});
