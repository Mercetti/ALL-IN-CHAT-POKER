import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Skill, User } from '../types/upgrade-dynamic';
import { upgradeTier, installSkill } from '../api/subscriptions-enhanced';
import { orchestrateLLMUpgrade as enhancedOrchestrateLLMUpgrade } from '../api/llm-enhanced';

// In production, fetch from auth context or API
const currentUser: User = { 
  id: 'currentUserId', 
  tierId: 'creator-plus',
  email: 'user@example.com',
  name: 'Demo User'
};

const UpgradeConfirmationScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { tierId, skillId, fromFeature } = route.params as { 
    tierId?: string; 
    skillId?: string; 
    fromFeature?: string;
  };
  
  const [loading, setLoading] = useState(false);
  const [currentUserId] = useState('currentUserId');
  const [currentUserTier, setCurrentUserTier] = useState(currentUser.tierId);

  const handleConfirm = async () => {
    setLoading(true);
    
    try {
      let unlockedSkills: Skill[] = [];

      if (tierId) {
        // Upgrade tier and get unlocked skills
        const res = await upgradeTier(currentUserId, tierId);
        if (!res.success) {
          throw new Error(res.message || 'Failed to upgrade tier');
        }

        // Update current user tier
        setCurrentUserTier(tierId);
        currentUser.tierId = tierId;
        unlockedSkills = res.unlockedSkills;

        // Trigger LLM orchestration for tier upgrade
        await enhancedOrchestrateLLMUpgrade({
          userId: currentUserId,
          tierId,
          action: 'tier_upgrade',
          permissions: getTierPermissions(tierId),
          trustLevel: getTierTrustLevel(tierId),
          datasetAccess: getTierDatasetAccess(tierId),
          timestamp: Date.now(),
          metadata: {
            source: 'tier_upgrade',
            userAgent: 'Acey Mobile App'
          }
        });
      }

      // Automatically install unlocked skills
      if (unlockedSkills.length > 0) {
        // Install skills one by one to avoid overwhelming the backend
        for (const skill of unlockedSkills) {
          try {
            await installSkill(currentUserId, skill.id);
            
            // Trigger LLM orchestration for each skill installation
            await enhancedOrchestrateLLMUpgrade({
              userId: currentUserId,
              skillId: skill.id,
              tierId: currentUserTier,
              action: 'install_skill',
              permissions: getSkillPermissions(skill.id),
              trustLevel: 1, // Start with neutral trust for new skills
              datasetAccess: getSkillDatasetAccess(skill.id),
              timestamp: Date.now(),
              metadata: {
                source: 'auto_unlock',
                tierId: currentUserTier,
                userAgent: 'Acey Mobile App'
              }
            });
          } catch (skillError) {
            console.error(`Failed to auto-install skill ${skill.id}:`, skillError);
            // Continue with other skills even if one fails
          }
        }
      }

      // Navigate to success screen with details
      navigation.navigate('UpgradeSuccess', { 
        tierId, 
        skillIds: unlockedSkills.map(s => s.id),
        type: tierId ? 'tier' : 'skill',
        autoUnlockedSkills: unlockedSkills.map(s => s.id)
      });
      
    } catch (err: any) {
      console.error('Upgrade error:', err);
      Alert.alert(
        'Upgrade Failed', 
        err.message || 'Please try again later.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Retry', onPress: handleConfirm }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const getTierPermissions = (tierId: string): string[] => {
    const permissions: Record<string, string[]> = {
      'creator-plus': ['mobile_approvals', 'extended_audit', 'emergency_lock', 'read_logs'],
      'pro': ['auto_rules', 'simulations', 'skill_store', 'multi_device_quorum', 'read_system_status'],
      'enterprise': ['multi_tenant', 'clustering', 'hardware_keys', 'advanced_compliance', 'admin_controls']
    };
    return permissions[tierId] || [];
  };

  const getTierTrustLevel = (tierId: string): number => {
    const trustLevels: Record<string, number> = {
      'creator-plus': 2,
      'pro': 3,
      'enterprise': 5
    };
    return trustLevels[tierId] || 1;
  };

  const getTierDatasetAccess = (tierId: string): string[] => {
    const datasets: Record<string, string[]> = {
      'creator-plus': ['basic_analytics', 'audit_logs', 'user_activity'],
      'pro': ['advanced_analytics', 'simulation_data', 'skill_metrics', 'performance_data'],
      'enterprise': ['all_datasets', 'compliance_data', 'investor_reports', 'admin_logs']
    };
    return datasets[tierId] || [];
  };

  const getSkillPermissions = (skillId: string): string[] => {
    const permissions: Record<string, string[]> = {
      'stream-ops-pro': ['read_system_status', 'read_logs', 'send_notifications', 'suggest_fixes'],
      'audio-optimizer': ['read_audio_settings', 'suggest_optimizations', 'apply_audio_settings'],
      'hype-engine': ['read_chat_data', 'suggest_content', 'analyze_engagement'],
      'auto-moderator': ['read_chat_data', 'apply_moderation_rules', 'moderation_history']
    };
    return permissions[skillId] || [];
  };

  const getSkillDatasetAccess = (skillId: string): string[] => {
    const datasets: Record<string, string[]> = {
      'stream-ops-pro': ['stream_metrics', 'error_logs', 'performance_data'],
      'audio-optimizer': ['audio_data', 'audio_settings'],
      'hype-engine': ['chat_analytics', 'content_suggestions', 'engagement_metrics'],
      'auto-moderator': ['chat_logs', 'moderation_history', 'moderation_rules']
    };
    return datasets[skillId] || [];
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const renderUpgradeInfo = () => {
    if (tierId) {
      const tierInfo: Record<string, { name: string; price: string; description: string; features: string[] }> = {
        'creator-plus': { 
          name: 'Creator+', 
          price: '$9/month', 
          description: 'Hands-On Control - For Serious Streamers',
          features: ['Mobile approvals', 'Full audit timeline (7 days)', 'Emergency lock', 'Offline read-only mode']
        },
        'pro': { 
          name: 'Pro', 
          price: '$29/month', 
          description: 'Operational Autonomy - For Teams & Power Users',
          features: ['Auto-rules (permission-gated)', 'Simulation engine', 'Skill Store access', 'Multi-device quorum unlock']
        },
        'enterprise': { 
          name: 'Enterprise', 
          price: '$99+/month', 
          description: 'Governed Intelligence Platform - For Organizations',
          features: ['Multi-tenant isolation', 'Cloud clustering', 'Hardware key support', 'Advanced compliance exports']
        }
      };
      
      const info = tierInfo[tierId];
      if (!info) return null;
      
      return (
        <View style={styles.upgradeInfo}>
          <Text style={styles.upgradeTitle}>Upgrade to {info.name}</Text>
          <Text style={styles.upgradePrice}>{info.price}</Text>
          <Text style={styles.upgradeDescription}>{info.description}</Text>
          <View style={styles.featuresList}>
            {info.features.slice(0, 4).map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            {info.features.length > 4 && (
              <Text style={styles.moreFeatures}>+{info.features.length - 4} more features</Text>
            )}
          </View>
        </View>
      );
    }
    
    return null;
  };

  const renderAutoUnlockInfo = () => {
    const unlockedSkills = getUnlockedSkillsForTier(tierId);
    if (unlockedSkills.length === 0) return null;

    return (
      <View style={styles.autoUnlockInfo}>
        <Icon name="auto-awesome" size={24} color="#4CAF50" />
        <Text style={styles.autoUnlockTitle}>Skills Auto-Unlocked!</Text>
        <Text style={styles.autoUnlockDescription}>
          {unlockedSkills.length} skills are now available for installation
        </Text>
        <View style={styles.unlockedSkillsList}>
          {unlockedSkills.slice(0, 3).map((skill, index) => (
            <Text key={index} style={styles.unlockedSkill}>• {skill.name}</Text>
          ))}
          {unlockedSkills.length > 3 && (
            <Text style={styles.moreUnlockedSkills}>+{unlockedSkills.length - 3} more</Text>
          )}
        </View>
      </View>
    );
  };

  const getUnlockedSkillsForTier = (tierId: string): Skill[] => {
    // Mock data - in production, fetch from backend
    const skillDatabase: Record<string, Skill[]> = {
      'creator-plus': [
        {
          id: 'stream-ops-pro',
          name: 'Acey Stream Ops Pro',
          price: 15,
          description: 'Monitor streams and approve fixes safely',
          requiredTierId: 'creator-plus',
          installed: false,
          category: 'monitoring',
          rating: 4.8,
          reviews: 127
        }
      ],
      'pro': [
        {
          id: 'audio-optimizer',
          name: 'Audio Quality Optimizer',
          price: 18,
          description: 'Automatically optimize audio settings',
          requiredTierId: 'creator-plus',
          installed: false,
          category: 'optimization',
          rating: 4.6,
          reviews: 89
        },
        {
          id: 'hype-engine',
          name: 'Hype Engine Pro',
          price: 12,
          description: 'Generate engaging content suggestions',
          requiredTierId: 'pro',
          installed: false,
          category: 'creative',
          rating: 4.5,
          reviews: 203
        }
      ],
      'enterprise': [
        {
          id: 'auto-moderator-pro',
          name: 'Auto Moderator Pro',
          price: 35,
          description: 'Advanced content moderation',
          requiredTierId: 'pro',
          installed: false,
          category: 'ops_automation',
          rating: 4.9,
          reviews: 45
        }
      ]
    };
    
    return skillDatabase[tierId] || [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Upgrade</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {renderUpgradeInfo()}
        {tierId && renderAutoUnlockInfo()}
        
        {fromFeature && (
          <View style={styles.fromFeature}>
            <Text style={styles.fromFeatureText}>
              Upgrading from: {fromFeature}
            </Text>
          </View>
        )}
        
        <View style={styles.confirmationInfo}>
          <Text style={styles.confirmationText}>
            {tierId 
              ? `Ready to upgrade to ${tierId} tier? You'll gain access to new features and capabilities.`
              : skillId 
              ? `Ready to install this skill? It will enhance Acey's capabilities with permission-gated safety.`
              : 'Ready to proceed with your upgrade?'
            }
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.cancelButton, styles.button]} 
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.confirmButton, styles.button]} 
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E1E1E',
  },
  backButton: {
    fontSize: 16,
    color: '#2196F3',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  upgradeInfo: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  upgradeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  upgradePrice: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 20,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginLeft: 8,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  autoUnlockInfo: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  autoUnlockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  autoUnlockDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 12,
  },
  unlockedSkillsList: {
    marginBottom: 8,
  },
  unlockedSkill: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 4,
  },
  moreUnlockedSkills: {
    fontSize: 11,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  fromFeature: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  fromFeatureText: {
    fontSize: 12,
    color: '#FF9800',
    textAlign: 'center',
  },
  confirmationInfo: {
    marginBottom: 40,
  },
  confirmationText: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 24,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666666',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default UpgradeConfirmationScreen;
