import React, { useEffect, useState } from 'react';
import { 
  ScrollView, 
  ActivityIndicator, 
  Text, 
  View, 
  StyleSheet, 
  RefreshControl,
  TouchableOpacity,
  Alert 
} from 'react-native';
import { getLearningMetrics } from '../services/metricsService';
import { getApprovedOutputs } from '../services/previewService';
import { getUserAccess, canAccessAceyLab } from '../services/authService';
import LearningCharts from '../components/LearningCharts';
import SkillOutputCard from '../components/SkillOutputCard';
import UpgradeButton from '../components/UpgradeButton';
import { AceyAdminOrchestrator } from '../services/aceyAdminOrchestrator';
import { NotificationManager } from '../components/NotificationManager';
import { notifySkillUnlock, notifyTrialExpiration, notifyApprovedOutput } from '../services/aceyMobileNotifier';
import { AceyMobileOrchestrator } from '../services/aceyMobileOrchestrator';
import * as Notifications from 'expo-notifications';

interface AceyLabProps {
  route: any;
}

export default function AceyLab({ route }: AceyLabProps) {
  const userToken = route.params?.userToken || 'demo-token';
  const userRole = route.params?.userRole || 'dev';
  const ownerToken = route.params?.ownerToken;
  const username = route.params?.username || 'user';
  const userId = route.params?.userId || 'user-123';

  const [metrics, setMetrics] = useState<any>(null);
  const [outputs, setOutputs] = useState<any[]>([]);
  const [userAccess, setUserAccess] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [orchestrator, setOrchestrator] = useState<AceyAdminOrchestrator | null>(null);

  const fetchData = async () => {
    try {
      if (!canAccessAceyLab(userRole)) return;

      const [metricsData, outputsData, accessData] = await Promise.all([
        getLearningMetrics(userToken),
        getApprovedOutputs(userToken),
        getUserAccess(userToken),
      ]);

      setMetrics(metricsData);
      setOutputs(outputsData);
      setUserAccess(accessData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Integrating Orchestrator Into Acey Lab
  const mobileOrchestrator = new AceyMobileOrchestrator(userToken);

  const handleUnlock = async (skillId: string) => {
    const result = await mobileOrchestrator.installSkill(skillId);

    if (result.success) {
      // Refresh local user data
      const updatedData = await mobileOrchestrator.fetchUserData();
      setUserAccess(updatedData);
    }
  };

  const handleApprovedOutput = async (skillType: string, outputData: any) => {
    await mobileOrchestrator.logOutput(skillType, outputData);
  };

  // Real-Time Subscription Verification & Trial Enforcement
  useEffect(() => {
    const interval = setInterval(async () => {
      const sub = await mobileOrchestrator.checkSubscription();
      if (!sub.active) {
        alert('Your subscription has expired. Some skills may be locked.');
      }
      const updatedData = await mobileOrchestrator.fetchUserData();
      setUserAccess(updatedData);
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const handleManualSkillUnlock = async () => {
    if (mobileOrchestrator) {
      await mobileOrchestrator.handleSkillUnlock(username, userToken, 'code', userId);
      // Send mobile notification
      await notifySkillUnlock('code');
    }
  };

  const handleLockedSkillAttempt = async () => {
    if (mobileOrchestrator) {
      await mobileOrchestrator.logLockedAccess(username, 'graphics', 'Pro');
      // Send mobile notification
      // await notifyAccessDenied('graphics'); // Commented out - function not available
    }
  };

  const handleTrialExpiration = async (skillName: string, hoursLeft: number) => {
    // Send mobile notification
    await notifyTrialExpiration(skillName, hoursLeft);
  };

  const handleApprovedOutputNotification = async (outputInfo: any) => {
    // Send mobile notification
    await notifyApprovedOutput(outputInfo.username, outputInfo.skillType);
  };

  const handleFineTuneComplete = async (skillTypes: string[], entriesProcessed: number, accuracyImprovement: number) => {
    // Send mobile notification
    // await notifyFineTuneComplete(skillTypes, entriesProcessed); // Commented out - function not available
  };

  const handleTrustScoreChange = async (skillType: string, oldScore: number, newScore: number) => {
    // Send mobile notification
    // await notifyTrustScoreChange(skillType, oldScore, newScore); // Commented out - function not available
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleUnlockAlert = (skillType: string) => {
    Alert.alert(
      'Skill Unlocked',
      `${skillType} skill has been added to your account!`,
      [{ text: 'OK', onPress: fetchData }]
    );
  };

  const handleApprove = (output: any) => {
    Alert.alert(
      'Approve Output',
      'Add this output to the learning dataset?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: () => {
            // This would call your approval API
            console.log('Approved:', output.id);
            fetchData();
          }
        }
      ]
    );
  };

  const handleDownload = (output: any) => {
    Alert.alert(
      'Download Output',
      'Download this output to your device?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download', 
          onPress: () => {
            // This would trigger download
            console.log('Downloaded:', output.id);
          }
        }
      ]
    );
  };

  // Hook notifications into Acey Lab Dashboard
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      // Handle notification interactions
      if (notification.request.content.data?.type) {
        switch (notification.request.content.data.type) {
          case 'skill_unlock':
            // Navigate to skill or refresh dashboard
            fetchData();
            break;
          case 'trial_warning':
            // Highlight expiring trials
            fetchData();
            break;
          case 'locked_access_attempt':
            // Show access denied message
            Alert.alert('Access Denied', 'You do not have permission to access this skill.');
            break;
          case 'new_approved_output':
            // Refresh outputs list
            fetchData();
            break;
          case 'fine_tune_complete':
            // Show completion message
            Alert.alert('Fine-Tuning Complete', 'Model fine-tuning has completed successfully.');
            fetchData();
            break;
          case 'trust_score_change':
            // Show trust score change
            const change = notification.request.content.data.change;
            const direction = change > 0 ? 'increased' : 'decreased';
            Alert.alert('Trust Score Updated', `Trust score ${direction} by ${Math.abs(change).toFixed(1)}%.`);
            break;
        }
      }
    });

    const subscriptionResponse = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User interacted with notification:', response);
    });

    return () => {
      subscription.remove();
      subscriptionResponse.remove();
    };
  }, []);

  if (!canAccessAceyLab(userRole)) {
    return (
      <View style={styles.permissionDenied}>
        <Text style={styles.permissionText}>🔒 Acey Lab Access Required</Text>
        <Text style={styles.permissionSubtext}>
          Only owners and developers can access the Acey Lab.
        </Text>
        <Text style={styles.permissionSubtext}>
          Current role: {userRole}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2280b0" />
        <Text style={styles.loadingText}>Loading Acey Lab...</Text>
      </View>
    );
  }

  const filteredOutputs = filter === 'all' 
    ? outputs 
    : outputs.filter(output => output.skillType === filter);

  const availableSkills = ['code', 'audio', 'graphics', 'link'];
  const lockedSkills = availableSkills.filter(skill => 
    !userAccess?.unlockedSkills?.includes(skill)
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Acey Lab</Text>
        <Text style={styles.subtitle}>Real-Time Learning Hub</Text>
      </View>

      {metrics && <LearningCharts metrics={metrics} />}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'code', 'audio', 'graphics', 'link'].map(skillType => (
          <TouchableOpacity
            key={skillType}
            style={[
              styles.filterTab,
              filter === skillType && styles.activeFilter
            ]}
            onPress={() => setFilter(skillType)}
          >
            <Text style={[
              styles.filterText,
              filter === skillType && styles.activeFilterText
            ]}>
              {skillType.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notification Manager */}
      {orchestrator && (
        <NotificationManager
          userToken={userToken}
          ownerToken={ownerToken}
          userRole={userRole}
          username={username}
        />
      )}

      {/* Test Actions for Admin */}
      {orchestrator && (
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Admin Test Actions</Text>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleManualSkillUnlock}
          >
            <Text style={styles.testButtonText}>Test Skill Unlock</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleLockedSkillAttempt}
          >
            <Text style={styles.testButtonText}>Test Locked Access</Text>
          </TouchableOpacity>
        </View>
      )}

      {canAccessAceyLab(userRole) && (
        <View style={styles.adminSection}>
          <Text style={styles.adminTitle}>Admin Monitoring Active</Text>
          <Text style={styles.adminStatus}>
            Owner/Dev notifications and monitoring are running
          </Text>
        </View>
      )}

      {/* Skill Outputs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {filter === 'all' ? 'All Outputs' : `${filter.toUpperCase()} Outputs`}
          {' '}({filteredOutputs.length})
        </Text>
        
        {filteredOutputs.map(output => (
          <SkillOutputCard
            key={output.id}
            output={output}
            userAccess={userAccess}
            onApprove={handleApprove}
            onDownload={handleDownload}
            onUnlock={handleUnlock}
          />
        ))}

        {filteredOutputs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No {filter === 'all' ? '' : filter + ' '}outputs found
            </Text>
          </View>
        )}
      </View>

      {/* Locked Skills */}
      {lockedSkills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locked Skills</Text>
          {lockedSkills.map(skill => (
            <UpgradeButton
              key={skill}
              skillName={skill}
              userToken={userToken}
              onUnlocked={() => handleUnlock(skill)}
              style={styles.upgradeButton}
            />
          ))}
        </View>
      )}

      {/* User Info */}
      {userAccess && (
        <View style={styles.userInfo}>
          <Text style={styles.userInfoText}>
            Tier: {userAccess.tier} | Role: {userRole}
          </Text>
          <Text style={styles.userInfoText}>
            Unlocked Skills: {userAccess.unlockedSkills?.join(', ') || 'None'}
          </Text>
          {userAccess.trialRemaining > 0 && (
            <Text style={styles.trialText}>
              Trial Days Remaining: {userAccess.trialRemaining}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  permissionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 16,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2280b0',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  activeFilter: {
    backgroundColor: '#2280b0',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  activeFilterText: {
    color: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  upgradeButton: {
    marginBottom: 12,
  },
  testSection: {
    margin: 20,
    padding: 15,
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
  },
  testButton: {
    backgroundColor: '#9c27b0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  adminStatus: {
    fontSize: 14,
    color: '#2e7d32',
  },
  userInfo: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    borderTopWidth: 3,
    borderTopColor: '#2280b0',
  },
  userInfoText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  trialText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 8,
  },
});
