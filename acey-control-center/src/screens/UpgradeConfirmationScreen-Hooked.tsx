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
import { useRoute, useNavigation } from '@react-navigation/native';
import { upgradeTier } from '../api/subscriptions-backend-stubs';
import { installSkill } from '../api/skills';
import { orchestrateLLMUpgrade } from '../api/llm';

const UpgradeConfirmationScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { tierId, skillId, fromFeature } = route.params as { 
    tierId?: string; 
    skillId?: string; 
    fromFeature?: string;
  };
  
  const [loading, setLoading] = useState(false);
  const [currentUserId] = useState('currentUserId'); // In production, get from auth context

  const handleConfirm = async () => {
    setLoading(true);
    
    try {
      // Upgrade tier if selected
      if (tierId) {
        const res = await upgradeTier(currentUserId, tierId);
        if (!res.success) {
          throw new Error(res.message || 'Failed to upgrade tier');
        }
        
        // Trigger LLM orchestration for tier upgrade
        await orchestrateLLMUpgrade({
          userId: currentUserId,
          tierId,
          action: 'upgrade',
          permissions: getTierPermissions(tierId),
          trustLevel: getTierTrustLevel(tierId),
          datasetAccess: getTierDatasetAccess(tierId)
        });
      }
      
      // Install skill if selected
      if (skillId) {
        const res = await installSkill(currentUserId, skillId);
        if (!res.success) {
          throw new Error(res.message || 'Failed to install skill');
        }
        
        // Trigger LLM orchestration for skill installation
        await orchestrateLLMUpgrade({
          userId: currentUserId,
          skillId,
          action: 'install_skill',
          permissions: getSkillPermissions(skillId),
          trustLevel: 1, // Start with neutral trust for new skills
          datasetAccess: getSkillDatasetAccess(skillId)
        });
      }
      
      // Navigate to success screen
      navigation.navigate('UpgradeSuccess', { 
        tierId, 
        skillId, 
        type: tierId ? 'tier' : 'skill' 
      });
      
    } catch (err: any) {
      console.error('Upgrade error:', err);
      Alert.alert(
        'Upgrade Failed', 
        err.message || 'Please try again later',
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
      'creator-plus': ['mobile_approvals', 'extended_audit', 'emergency_lock'],
      'pro': ['auto_rules', 'simulations', 'skill_store', 'multi_device_quorum'],
      'enterprise': ['multi_tenant', 'clustering', 'hardware_keys', 'advanced_compliance']
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
      'creator-plus': ['basic_analytics', 'audit_logs'],
      'pro': ['advanced_analytics', 'simulation_data', 'skill_metrics'],
      'enterprise': ['all_datasets', 'compliance_data', 'investor_reports']
    };
    return datasets[tierId] || [];
  };

  const getSkillPermissions = (skillId: string): string[] => {
    const permissions: Record<string, string[]> = {
      'stream-ops-pro': ['read_system_status', 'read_logs', 'send_notifications', 'suggest_fixes'],
      'audio-optimizer': ['read_audio_settings', 'suggest_optimizations'],
      'hype-engine': ['read_chat_data', 'suggest_content'],
      'auto-moderator': ['read_chat_data', 'apply_moderation_rules']
    };
    return permissions[skillId] || [];
  };

  const getSkillDatasetAccess = (skillId: string): string[] => {
    const datasets: Record<string, string[]> = {
      'stream-ops-pro': ['stream_metrics', 'error_logs'],
      'audio-optimizer': ['audio_data'],
      'hype-engine': ['chat_analytics'],
      'auto-moderator': ['chat_logs', 'moderation_history']
    };
    return datasets[skillId] || [];
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const renderUpgradeInfo = () => {
    if (tierId) {
      const tierInfo: Record<string, { name: string; price: string; description: string }> = {
        'creator-plus': { name: 'Creator+', price: '$9/month', description: 'Hands-On Control' },
        'pro': { name: 'Pro', price: '$29/month', description: 'Operational Autonomy' },
        'enterprise': { name: 'Enterprise', price: '$99+/month', description: 'Governed Intelligence' }
      };
      
      const info = tierInfo[tierId];
      if (!info) return null;
      
      return (
        <View style={styles.upgradeInfo}>
          <Text style={styles.upgradeTitle}>Upgrade to {info.name}</Text>
          <Text style={styles.upgradePrice}>{info.price}</Text>
          <Text style={styles.upgradeDescription}>{info.description}</Text>
        </View>
      );
    }
    
    if (skillId) {
      const skillInfo: Record<string, { name: string; price: string; description: string }> = {
        'stream-ops-pro': { name: 'Acey Stream Ops Pro', price: '$15/month', description: 'Monitor streams and approve fixes safely' },
        'audio-optimizer': { name: 'Audio Quality Optimizer', price: '$18/month', description: 'Automatically optimize audio settings' },
        'hype-engine': { name: 'Hype Engine Pro', price: '$12/month', description: 'Generate engaging content suggestions' },
        'auto-moderator': { name: 'Auto Moderator Pro', price: '$35/month', description: 'Advanced content moderation' }
      };
      
      const info = skillInfo[skillId];
      if (!info) return null;
      
      return (
        <View style={styles.upgradeInfo}>
          <Text style={styles.upgradeTitle}>Install {info.name}</Text>
          <Text style={styles.upgradePrice}>{info.price}</Text>
          <Text style={styles.upgradeDescription}>{info.description}</Text>
        </View>
      );
    }
    
    return null;
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
