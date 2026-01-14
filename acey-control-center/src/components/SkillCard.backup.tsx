import React from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity } from 'react-native';

interface Skill {
  id: string;
  name: string;
  icon: string;
  type: 'code' | 'audio' | 'graphics' | 'link' | 'stream_analytics' | 'ai_games' | 'donations' | 'persona' | 'clips';
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  description: string;
  preview?: string;
  features: string[];
}

interface UserAccess {
  unlockedSkills: string[];
  trials: Array<{
    skillName: string;
    expiresInHours: number;
  }>;
  tier: string;
}

interface SkillCardProps {
  skill: Skill;
  userAccess: UserAccess;
  onUnlock: (skillId: string) => void;
  onTrial?: (skillId: string) => void;
  onPreview?: (skill: Skill) => void;
}

export default function SkillCard({ 
  skill, 
  userAccess, 
  onUnlock, 
  onTrial,
  onPreview 
}: SkillCardProps) {
  const isUnlocked = userAccess?.unlockedSkills?.includes(skill.id);
  const trialInfo = userAccess?.trials?.find((t: any) => t.skillName === skill.id);
  const inTrial = !!trialInfo;
  
  const getSkillIcon = (type: string) => {
    switch (type) {
      case 'code': return '💻';
      case 'audio': return '🎵';
      case 'graphics': return '🎨';
      case 'link': return '🔗';
      case 'stream_analytics': return '📊';
      case 'ai_games': return '🎮';
      case 'donations': return '💰';
      case 'persona': return '🤖';
      case 'clips': return '🎬';
      default: return '⚡';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Free': return '#34C759';
      case 'Pro': return '#007AFF';
      case 'Creator+': return '#AF52DE';
      case 'Enterprise': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getStatusColor = () => {
    if (isUnlocked) return '#34C759';
    if (inTrial) return '#FF9500';
    return '#FF3B30';
  };

  const getStatusText = () => {
    if (isUnlocked) return 'Unlocked';
    if (inTrial) return `Trial (${trialInfo.expiresInHours}h left)`;
    return `Locked - ${skill.tier}`;
  };

  const canAccess = isUnlocked || inTrial;
  
  const getSkillIcon = (type: string) => {
    switch (type) {
      case 'code': return '💻';
      case 'audio': return '🎵';
      case 'graphics': return '🎨';
      case 'link': return '🔗';
      case 'stream_analytics': return '📊';
      case 'ai_games': return '🎮';
      case 'donations': return '💰';
      case 'persona': return '🤖';
      case 'clips': return '🎬';
      default: return '⚡';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Free': return '#34C759';
      case 'Pro': return '#007AFF';
      case 'Creator+': return '#AF52DE';
      case 'Enterprise': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getStatusColor = () => {
    if (isUnlocked) return '#34C759';
    if (inTrial) return '#FF9500';
    return '#FF3B30';
  };

  const getStatusText = () => {
    if (isUnlocked) return 'Unlocked';
    if (inTrial) return `Trial (${trialInfo.expiresInHours}h left)`;
    return `Locked - ${skill.tier}`;
  };

  const canAccess = isUnlocked || inTrial;

  return (
    <View style={styles.container}>
      {/* Header with Icon and Name */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.skillIcon}>{getSkillIcon(skill.type)}</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.skillName}>{skill.name}</Text>
          <Text style={styles.skillType}>{skill.type.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {skill.description}
      </Text>

      {/* Quick preview */}
      {canAccess && skill.preview && (
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewButton}
            onPress={() => onPreview?.(skill)}
          >
            <Text style={styles.previewButtonText}>Preview</Text>
          </TouchableOpacity>
          
          {/* Skill-specific preview content */}
          {skill.type === 'code' && (
            <Text style={styles.codePreview}>
              {skill.preview.slice(0, 100)}...
            </Text>
          )}
          
          {(skill.type === 'graphics' || skill.type === 'clips') && skill.preview && (
            <Image 
              source={{ uri: skill.preview }} 
              style={styles.imagePreview}
            />
          )}
          
          {skill.type === 'audio' && (
            <View style={styles.audioPreview}>
              <Text style={styles.audioIcon}>🎵</Text>
              <Text style={styles.audioText}>Audio Preview Available</Text>
            </View>
          )}
        </View>
      )}

      {/* Features */}
      <View style={styles.featuresSection}>
        {skill.features.slice(0, 3).map((feature, index) => (
          <Text key={index} style={styles.feature}>• {feature}</Text>
        ))}
        {skill.features.length > 3 && (
          <Text style={styles.moreFeatures}>+{skill.features.length - 3} more</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {!canAccess && (
          <View style={styles.actionRow}>
            <Button
              title={`Unlock ${skill.name}`}
              onPress={() => onUnlock(skill.id)}
              color={getTierColor(skill.tier)}
            />
            <Text style={styles.tierText}>Requires {skill.tier}</Text>
          </View>
        )}
        
        {inTrial && (
          <View style={styles.actionRow}>
            <Button
              title="Upgrade Now"
              onPress={() => onUnlock(skill.id)}
              color="#007AFF"
            />
            <Text style={styles.trialText}>
              Trial expires in {trialInfo.expiresInHours}h
            </Text>
          </View>
        )}
        
        {isUnlocked && (
          <View style={styles.actionRow}>
            <Button
              title="Use Skill"
              onPress={() => onPreview?.(skill)}
              color="#34C759"
            />
            <Text style={styles.unlockedText}>Ready to use</Text>
          </View>
        )}
      </View>

      {/* Status Badge */}
      {inTrial && trialInfo && (
        <View style={{ backgroundColor: 'orange', padding: 3, borderRadius: 5 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Trial {trialInfo.expiresInHours}h left
          </Text>
        </View>
      )}
      
      {isUnlocked && (
        <View style={{ backgroundColor: 'green', padding: 3, borderRadius: 5 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Unlocked</Text>
        </View>
      )}
      <View style={[styles.tierBadge, { backgroundColor: getTierColor(skill.tier) }]}>
        <Text style={styles.tierBadgeText}>{skill.tier}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  skillIcon: {
    fontSize: 20,
  },
  titleContainer: {
    flex: 1,
  },
  skillName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  skillType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  previewSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  previewButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  previewButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  codePreview: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#1d1d1f',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    lineHeight: 16,
  },
  imagePreview: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    marginTop: 8,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  audioIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  audioText: {
    fontSize: 12,
    color: '#333',
  },
  featuresSection: {
    marginBottom: 12,
  },
  feature: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  actionsSection: {
    marginTop: 8,
  },
  actionRow: {
    alignItems: 'center',
  },
  tierText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  trialText: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 4,
    fontWeight: '600',
  },
  unlockedText: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 4,
    fontWeight: '600',
  },
  tierBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});
