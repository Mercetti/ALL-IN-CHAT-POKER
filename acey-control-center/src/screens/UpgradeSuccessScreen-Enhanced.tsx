import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { orchestrateLLMUpgrade as enhancedOrchestrateLLMUpgrade } from '../api/llm-enhanced';

const UpgradeSuccessScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { tierId, skillIds, type, autoUnlockedSkills } = route.params as { 
    tierId?: string; 
    skillIds?: string[]; 
    type: 'tier' | 'skill';
    autoUnlockedSkills?: string[];
  };
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentUserId] = useState('currentUserId'); // In production, get from auth context

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    // Trigger LLM orchestration for permissions & trust updates
    triggerLLMOrchestration();
  }, []);

  const triggerLLMOrchestration = async () => {
    try {
      // This ensures Acey automatically adjusts permissions, memory, and dataset access
      // whenever a user upgrades or installs a skill
      await enhancedOrchestrateLLMUpgrade({
        userId: currentUserId,
        tierId,
        action: type === 'tier' ? 'upgrade' : 'install_skill',
        permissions: getPermissions(),
        trustLevel: getTrustLevel(),
        datasetAccess: getDatasetAccess(),
        timestamp: Date.now(),
        metadata: {
          source: type === 'tier' ? 'tier_upgrade_success' : 'skill_install_success',
          userAgent: 'Acey Mobile App'
        }
      });
      
      console.log('LLM orchestration completed successfully');
    } catch (error) {
      console.error('LLM orchestration failed:', error);
      // Don't show error to user - upgrade still succeeded
    }
  };

  const getPermissions = (): string[] => {
    const permissions: string[] = [];
    
    if (tierId) {
      const tierPermissions: Record<string, string[]> = {
        'creator-plus': ['mobile_approvals', 'extended_audit', 'emergency_lock', 'read_logs'],
        'pro': ['auto_rules', 'simulations', 'skill_store', 'multi_device_quorum', 'read_system_status'],
        'enterprise': ['multi_tenant', 'clustering', 'hardware_keys', 'advanced_compliance', 'admin_controls']
      };
      permissions.push(...(tierPermissions[tierId] || []));
    }
    
    if (skillIds) {
      const skillPermissions: Record<string, string[]> = {
        'stream-ops-pro': ['read_system_status', 'read_logs', 'send_notifications', 'suggest_fixes'],
        'audio-optimizer': ['read_audio_settings', 'suggest_optimizations', 'apply_audio_settings'],
        'hype-engine': ['read_chat_data', 'suggest_content', 'analyze_engagement'],
        'auto-moderator': ['read_chat_data', 'apply_moderation_rules', 'moderation_history']
      };
      
      skillIds.forEach(skillId => {
        permissions.push(...(skillPermissions[skillId] || []));
      });
    }
    
    return permissions;
  };

  const getTrustLevel = (): number => {
    if (tierId) {
      const trustLevels: Record<string, number> = {
        'creator-plus': 2,
        'pro': 3,
        'enterprise': 5
      };
      return trustLevels[tierId] || 1;
    }
    return 1; // Default trust for skills
  };

  const getDatasetAccess = (): string[] => {
    const datasets: string[] = [];
    
    if (tierId) {
      const tierDatasets: Record<string, string[]> = {
        'creator-plus': ['basic_analytics', 'audit_logs', 'user_activity'],
        'pro': ['advanced_analytics', 'simulation_data', 'skill_metrics', 'performance_data'],
        'enterprise': ['all_datasets', 'compliance_data', 'investor_reports', 'admin_logs']
      };
      datasets.push(...(tierDatasets[tierId] || []));
    }
    
    if (skillIds) {
      const skillDatasets: Record<string, string[]> = {
        'stream-ops-pro': ['stream_metrics', 'error_logs', 'performance_data'],
        'audio-optimizer': ['audio_data', 'audio_settings'],
        'hype-engine': ['chat_analytics', 'content_suggestions', 'engagement_metrics'],
        'auto-moderator': ['chat_logs', 'moderation_history', 'moderation_rules']
      };
      
      skillIds.forEach(skillId => {
        datasets.push(...(skillDatasets[skillId] || []));
      });
    }
    
    return datasets;
  };

  const handleBackToDashboard = () => {
    navigation.navigate('Dashboard');
  };

  const handleExploreFeatures = () => {
    if (type === 'tier') {
      navigation.navigate('TierOverview');
    } else {
      navigation.navigate('SkillStore');
    }
  };

  const renderSuccessIcon = () => (
    <View style={styles.iconContainer}>
      <Text style={styles.iconText}>✓</Text>
    </View>
  );

  const renderSuccessMessage = () => (
    <View style={styles.messageContainer}>
      <Text style={styles.successTitle}>
        {type === 'tier' ? 'Upgrade Successful!' : 'Skill Installed!'}
      </Text>
      <Text style={styles.successSubtitle}>
        You've unlocked {getUpgradeName()}! Acey can now help you do even more.
      </Text>
    </View>
  );

  const getUpgradeName = (): string => {
    if (tierId) {
      const tierNames: Record<string, string> = {
        'creator-plus': 'Creator+',
        'pro': 'Pro',
        'enterprise': 'Enterprise'
      };
      return tierNames[tierId] || 'new features';
    }
    
    if (skillIds && skillIds.length > 0) {
      const skillNames: Record<string, string> = {
        'stream-ops-pro': 'Acey Stream Ops Pro',
        'audio-optimizer': 'Audio Quality Optimizer',
        'hype-engine': 'Hype Engine Pro',
        'auto-moderator': 'Auto Moderator Pro'
      };
      
      if (skillIds.length === 1) {
        return skillNames[skillIds[0]] || 'new skill';
      } else {
        return `${skillIds.length} skills`;
      }
    }
    
    return 'new capabilities';
  };

  const renderUpgradeInfo = () => {
    const info = getUpgradeDetails();
    if (!info) return null;

    return (
      <View style={styles.upgradeInfo}>
        <Text style={styles.upgradeName}>{info.name}</Text>
        {info.price && (
          <Text style={styles.upgradePrice}>{info.price}</Text>
        )}
        <Text style={styles.upgradeDescription}>{info.description}</Text>
      </View>
    );
  };

  const getUpgradeDetails = () => {
    if (tierId) {
      const tierInfo: Record<string, { name: string; price?: string; description: string }> = {
        'creator-plus': { name: 'Creator+', price: '$9/month', description: 'Mobile approvals and extended audit access' },
        'pro': { name: 'Pro', price: '$29/month', description: 'Auto-rules, simulations, and skill store access' },
        'enterprise': { name: 'Enterprise', price: '$99+/month', description: 'Multi-tenant isolation and advanced compliance' }
      };
      return tierInfo[tierId];
    }
    
    if (skillIds && skillIds.length > 0) {
      if (skillIds.length === 1) {
        const skillInfo: Record<string, { name: string; price?: string; description: string }> = {
          'stream-ops-pro': { name: 'Acey Stream Ops Pro', price: '$15/month', description: 'Monitor streams and approve fixes safely' },
          'audio-optimizer': { name: 'Audio Quality Optimizer', price: '$18/month', description: 'Automatically optimize audio settings' },
          'hype-engine': { name: 'Hype Engine Pro', price: '$12/month', description: 'Generate engaging content suggestions' },
          'auto-moderator': { name: 'Auto Moderator Pro', price: '$35/month', description: 'Advanced content moderation' }
        };
        return skillInfo[skillIds[0]];
      } else {
        return {
          name: `${skillIds.length} Skills`,
          description: 'Multiple skills installed and ready to use'
        };
      }
    }
    
    return null;
  };

  const renderSkillsUnlocked = () => {
    if (!autoUnlockedSkills || autoUnlockedSkills.length === 0) return null;

    const skillNames: Record<string, string> = {
      'stream-ops-pro': 'Acey Stream Ops Pro',
      'audio-optimizer': 'Audio Quality Optimizer',
      'hype-engine': 'Hype Engine Pro',
      'auto-moderator': 'Auto Moderator Pro'
    };

    return (
      <View style={styles.skillsUnlocked}>
        <Text style={styles.skillsUnlockedTitle}>Skills Auto-Unlocked!</Text>
        <Text style={styles.skillsUnlockedSubtitle}>
          {autoUnlockedSkills.length} skills are now available
        </Text>
        <View style={styles.unlockedSkillsList}>
          {autoUnlockedSkills.slice(0, 3).map((skillId, index) => (
            <Text key={index} style={styles.unlockedSkill}>• {skillNames[skillId] || skillId}</Text>
          ))}
          {autoUnlockedSkills.length > 3 && (
            <Text style={styles.moreUnlockedSkills}>+{autoUnlockedSkills.length - 3} more</Text>
          )}
        </View>
      </View>
    );
  };

  const renderFeatures = () => {
    const features = getFeaturesList();
    if (features.length === 0) return null;

    return (
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>What's Included:</Text>
        {features.slice(0, 4).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
        {features.length > 4 && (
          <Text style={styles.moreFeatures}>
            +{features.length - 4} more features
          </Text>
        )}
      </View>
    );
  };

  const getFeaturesList = (): string[] => {
    if (tierId) {
      const tierFeatures: Record<string, string[]> = {
        'creator-plus': ['Mobile approvals', 'Full audit timeline (7 days)', 'Emergency lock', 'Offline read-only mode'],
        'pro': ['Auto-rules (permission-gated)', 'Simulation engine', 'Skill Store access', 'Multi-device quorum unlock'],
        'enterprise': ['Multi-tenant isolation', 'Cloud clustering', 'Hardware key support', 'Advanced compliance exports']
      };
      return tierFeatures[tierId] || [];
    }
    
    if (skillIds && skillIds.length > 0) {
      const allFeatures: string[] = [];
      const skillFeatures: Record<string, string[]> = {
        'stream-ops-pro': ['Real-time monitoring', 'Mobile alerts', 'Approval-based fixes', 'Post-stream reports'],
        'audio-optimizer': ['Automatic optimization', 'Quality monitoring', 'Settings suggestions', 'Performance analytics'],
        'hype-engine': ['Content suggestions', 'Timing optimization', 'Engagement analytics', 'Creative prompts'],
        'auto-moderator': ['Smart moderation', 'Custom rules', 'Human oversight', 'Audit trails']
      };
      
      skillIds.forEach(skillId => {
        allFeatures.push(...(skillFeatures[skillId] || []));
      });
      
      return allFeatures;
    }
    
    return [];
  };

  const renderActions = () => (
    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.secondaryButton, styles.button]}
        onPress={handleExploreFeatures}
      >
        <Text style={styles.secondaryButtonText}>Explore Features</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.primaryButton, styles.button]}
        onPress={handleBackToDashboard}
      >
        <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.title}>Success!</Text>
        <TouchableOpacity onPress={handleBackToDashboard}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          {renderSuccessIcon()}
          {renderSuccessMessage()}
          {renderUpgradeInfo()}
          {renderSkillsUnlocked()}
          {renderFeatures()}
          {renderActions()}
        </Animated.View>
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
  headerLeft: {
    width: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 20,
    color: '#FFFFFF',
    width: 24,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  mainContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeInfo: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  upgradeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  upgradePrice: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  skillsUnlocked: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  skillsUnlockedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  skillsUnlockedSubtitle: {
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
  featuresContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 14,
    color: '#4CAF50',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#E0E0E0',
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666666',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
});

export default UpgradeSuccessScreen;
