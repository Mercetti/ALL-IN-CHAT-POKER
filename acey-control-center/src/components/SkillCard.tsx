import React from 'react';
import { View, Text, Button, Image, TouchableOpacity, StyleSheet } from 'react-native';
import CodeSnippet from './CodeSnippet';

interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'audio' | 'image' | 'code' | 'graphics' | 'clips';
  tier: string;
  preview?: string;
  features: string[];
  usageCount?: number;
  avgRating?: number;
  isLive?: boolean;
  isApproved?: boolean;
}

interface UserAccess {
  tier: string;
  trials?: Array<{
    skillName: string;
    expiresInHours: number;
  }>;
  trialRemaining?: number;
  unlockedSkills: string[];
  role: string;
}

interface SkillCardProps {
  skill: Skill;
  userAccess: UserAccess;
  onUnlock: (skillId: string) => void;
  onStartTrial?: (skillId: string) => void;
}

export default function SkillCard({ skill, userAccess, onUnlock, onStartTrial }: SkillCardProps) {
  const isUnlocked = userAccess?.unlockedSkills?.includes(skill.id) || false;
  const trial = userAccess?.trials?.find(t => t.skillName === skill.id);
  const inTrial = !!trial;
  const canAccess = isUnlocked || inTrial;
  
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free': return '#34C759';
      case 'pro': return '#007AFF';
      case 'creator+': return '#AF52DE';
      case 'enterprise': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getStatusBadge = () => {
    if (isUnlocked) {
      return { text: 'UNLOCKED', color: '#34C759', icon: '✓' };
    }
    if (inTrial) {
      const hoursLeft = trial?.expiresInHours || 0;
      const urgency = hoursLeft <= 6 ? 'high' : hoursLeft <= 24 ? 'medium' : 'low';
      const color = urgency === 'high' ? '#FF3B30' : urgency === 'medium' ? '#FF9500' : '#007AFF';
      return { 
        text: `TRIAL - ${hoursLeft}h left`, 
        color, 
        icon: '⏰' 
      };
    }
    return { 
      text: `LOCKED - ${skill.tier}+`, 
      color: '#8E8E93', 
      icon: '🔒' 
    };
  };

  const statusBadge = getStatusBadge();

  const renderPreview = () => {
    if (!skill.preview || !canAccess) return null;

    switch (skill.type) {
      case 'image':
        return (
          <View style={styles.imagePreview}>
            <Image 
              source={{ uri: skill.preview }} 
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>
        );
      case 'code':
        return <CodeSnippet snippet={skill.preview} />;
      default:
        return (
          <View style={styles.placeholderPreview}>
            <Text style={styles.placeholderIcon}>📄</Text>
            <Text style={styles.placeholderText}>Preview Available</Text>
          </View>
        );
    }
  };

  const handleUnlock = () => {
    if (isUnlocked || inTrial) return;
    onUnlock(skill.id);
  };

  const handleTrial = () => {
    if (isUnlocked || inTrial) return;
    onStartTrial?.(skill.id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.skillName}>{skill.name}</Text>
          <Text style={styles.description}>{skill.description}</Text>
        </View>
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
          <Text style={styles.statusIcon}>{statusBadge.icon}</Text>
          <Text style={styles.statusText}>{statusBadge.text}</Text>
        </View>
      </View>

      {/* Features */}
      <View style={styles.featuresSection}>
        {skill.features.slice(0, 3).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
        {skill.features.length > 3 && (
          <Text style={styles.moreFeaturesText}>+{skill.features.length - 3} more</Text>
        )}
      </View>

      {/* Preview */}
      {renderPreview() && (
        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>Preview</Text>
          {renderPreview()}
        </View>
      )}

      {/* Stats */}
      {(skill.usageCount || skill.avgRating) && (
        <View style={styles.statsSection}>
          {skill.usageCount && (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📈</Text>
              <Text style={styles.statText}>{skill.usageCount.toLocaleString()} uses</Text>
            </View>
          )}
          {skill.avgRating && (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statText}>{skill.avgRating.toFixed(1)} stars</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {!isUnlocked && !inTrial && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.unlockButton]}
              onPress={handleUnlock}
            >
              <Text style={styles.buttonText}>🔓 Unlock</Text>
            </TouchableOpacity>
            
            {skill.tier !== 'Free' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.trialButton]}
                onPress={handleTrial}
              >
                <Text style={[styles.buttonText, styles.trialButtonText]}>⏰ Start Trial</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        
        {isUnlocked && (
          <TouchableOpacity style={[styles.actionButton, styles.useButton]}>
            <Text style={styles.buttonText}>▶️ Use Skill</Text>
          </TouchableOpacity>
        )}
        
        {inTrial && (
          <TouchableOpacity style={[styles.actionButton, styles.extendButton]}>
            <Text style={styles.buttonText}>➕ Extend Trial</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tier Badge */}
      <View style={[styles.tierBadge, { backgroundColor: getTierColor(skill.tier) }]}>
        <Text style={styles.tierText}>{skill.tier}</Text>
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
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  skillName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
  },
  statusIcon: {
    fontSize: 12,
    color: '#fff',
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  featuresSection: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureIcon: {
    fontSize: 12,
    color: '#34C759',
    marginRight: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#333',
  },
  moreFeaturesText: {
    fontSize: 11,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  previewSection: {
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  imagePreview: {
    borderRadius: 8,
    overflow: 'hidden',
    height: 120,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  placeholderIcon: {
    fontSize: 24,
    color: '#8E8E93',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
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
    marginLeft: 6,
  },
  trialButtonText: {
    color: '#007AFF',
  },
  tierBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});