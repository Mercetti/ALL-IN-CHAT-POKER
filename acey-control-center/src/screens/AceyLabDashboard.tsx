// screens/AceyLabDashboard.tsx
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { AceyMobileOrchestrator } from '../services/aceyMobileOrchestrator';
import SkillStore from '../components/SkillStore';
import SkillRecommendations from '../components/SkillRecommendations';
import OwnerSkillApprovalPanel from '../components/OwnerSkillApprovalPanel';
import NotificationsPanel from '../components/NotificationsPanel';
import MetricsPanel from '../components/MetricsPanel';

interface AceyLabDashboardProps {
  userToken: string;
  userRole: string;
  ownerToken?: string;
}

export default function AceyLabDashboard({ userToken, userRole, ownerToken }: AceyLabDashboardProps) {
  const orchestrator = new AceyMobileOrchestrator(userToken, ownerToken);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (orchestrator.userCanAccess(userRole)) {
      try {
        const data = await orchestrator.getRecentEvents();
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [userToken, userRole]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Acey Lab Dashboard</Text>
        <Text style={styles.subtitle}>
          {userRole === 'owner' || userRole === 'dev' 
            ? 'Owner Dashboard - Manage Skills & Monitor Performance'
            : 'User Dashboard - Browse Skills & Track Progress'
          }
        </Text>
      </View>

      {/* Skill Store */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skill Store</Text>
        <Text style={styles.sectionDescription}>
          Browse and unlock available skills based on your subscription tier
        </Text>
        <SkillStore userToken={userToken} userRole={userRole} />
      </View>

      {/* Pending Skill Proposals / Updates - Owner/Dev Only */}
      {(userRole === 'owner' || userRole === 'dev') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Proposals</Text>
          <Text style={styles.sectionDescription}>
            Review and approve Acey's AI-generated skill suggestions and updates
          </Text>
          <OwnerSkillApprovalPanel userToken={userToken} ownerToken={ownerToken || ''} />
        </View>
      )}

      {/* Cross-Skill Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skill Recommendations</Text>
        <Text style={styles.sectionDescription}>
          AI-powered suggestions based on usage patterns and cross-skill insights
        </Text>
        <SkillRecommendations userToken={userToken} userRole={userRole} />
      </View>

      {/* Metrics / Analytics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Analytics</Text>
        <Text style={styles.sectionDescription}>
          Monitor usage statistics, approval rates, and skill performance metrics
        </Text>
        <MetricsPanel userToken={userToken} userRole={userRole} />
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.sectionDescription}>
          Real-time updates for skill unlocks, trials, and system events
        </Text>
        <NotificationsPanel userToken={userToken} userRole={userRole} />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Acey Lab v1.0 • Real-time AI Skill Management
        </Text>
        <Text style={styles.footerSubtext}>
          {refreshing ? 'Syncing...' : 'Last sync: Just now'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#ccc',
    marginTop: 4,
  },
});
