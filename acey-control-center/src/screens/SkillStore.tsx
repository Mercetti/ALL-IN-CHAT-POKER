import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, RefreshControl, StyleSheet } from 'react-native';
import SkillCard from '../components/SkillCard';
import TrialTierBanner from '../components/TrialTierBanner';
import OwnerNotificationPanel from '../components/OwnerNotificationPanel';
import { AceyMobileOrchestrator, Skill } from '../services/aceyMobileOrchestrator';
import { UserAccess as AuthUserAccess } from '../services/authService';

export default function SkillStore({ userToken = 'demo-token', userRole = 'user' }: { userToken?: string; userRole?: string }) {
  const [userAccess, setUserAccess] = useState<AuthUserAccess | null>(null);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const orchestrator = new AceyMobileOrchestrator(userToken);

  // Fetch all current + approved proposed skills
  const fetchSkills = async () => {
    try {
      setRefreshing(true);
      const data = await orchestrator.fetchUserData();
      setUserAccess(data.userAccess);
      setSkillsList(data.skillsList); // includes live + approved proposed skills
      if (orchestrator.userCanAccess(userRole)) {
        const events = await orchestrator.getRecentEvents();
        setNotifications(events);
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle skill unlock
  const handleUnlock = async (skillId: string) => {
    try {
      const result = await orchestrator.installSkill(skillId);
      if (result.success) {
        fetchSkills(); // refresh store and user access
      }
    } catch (error) {
      console.error('Failed to unlock skill:', error);
    }
  };

  // Handle trial start
  const handleStartTrial = async (skillId: string) => {
    try {
      const result = await orchestrator.startTrial(skillId);
      if (result.success) {
        fetchSkills(); // refresh store and user access
      }
    } catch (error) {
      console.error('Failed to start trial:', error);
    }
  };

  // Handle tier upgrade
  const handleUpgrade = () => {
    console.log('Upgrade pressed - navigate to upgrade flow');
    // In production, this would navigate to upgrade screen
  };

  // Handle notification actions
  const handleRefreshNotifications = async () => {
    try {
      const events = await orchestrator.getRecentEvents();
      setNotifications(events);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleMarkRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, data: { ...notification.data, read: true } }
          : notification
      )
    );
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const canViewOwnerPanel = orchestrator.userCanAccess(userRole);

  return (
    <View style={styles.container}>
      {/* Trial/Tier Banner */}
      {userAccess && (
        <TrialTierBanner 
          userAccess={userAccess} 
          onUpgrade={handleUpgrade}
        />
      )}

      {/* Skills Grid */}
      <ScrollView 
        style={styles.skillsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchSkills} />
        }
        contentContainerStyle={styles.skillsContent}
      >
        {skillsList.map(skill => (
          <SkillCard
            key={skill.id}
            skill={skill}
            userAccess={userAccess || {
              tier: 'Free',
              trialRemaining: 0,
              unlockedSkills: [],
              role: 'user'
            }}
            onUnlock={handleUnlock}
            onStartTrial={handleStartTrial}
          />
        ))}
      </ScrollView>

      {/* Owner Notification Panel */}
      {canViewOwnerPanel && notifications.length > 0 && (
        <View style={styles.notificationSection}>
          <OwnerNotificationPanel
            notifications={notifications}
            onRefresh={handleRefreshNotifications}
            onClearAll={handleClearNotifications}
            onMarkRead={handleMarkRead}
            refreshing={refreshing}
          />
        </View>
      )}

      {/* Empty State */}
      {!refreshing && skillsList.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No Skills Available</Text>
          <Text style={styles.emptySubtitle}>
            Skills will appear here once they're approved and published
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  skillsContainer: {
    flex: 1,
  },
  skillsContent: {
    padding: 15,
  },
  notificationSection: {
    height: 200,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
});
