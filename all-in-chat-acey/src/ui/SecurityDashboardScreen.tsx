import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SecurityEvent {
  id: string;
  action: string;
  resource: string;
  mode: 'Green' | 'Yellow' | 'Red';
  blocked: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

interface SecurityStats {
  currentMode: 'Green' | 'Yellow' | 'Red';
  totalEvents: number;
  last24Hours: {
    total: number;
    blocked: number;
    blockedPercentage: string;
  };
  eventsByMode: Record<string, number>;
  topBlockedActions: Array<{action: string, count: number}>;
}

interface Props {
  userRole: string;
  onEmergencyLockdown: (reason: string) => void;
  onResumeOperations: () => void;
}

export const SecurityDashboardScreen: React.FC<Props> = ({ 
  userRole, 
  onEmergencyLockdown, 
  onResumeOperations 
}) => {
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoLockdown, setAutoLockdown] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Mock API calls - replace with actual API
      const mockStats: SecurityStats = {
        currentMode: 'Green',
        totalEvents: 1250,
        last24Hours: {
          total: 45,
          blocked: 3,
          blockedPercentage: '6.7'
        },
        eventsByMode: {
          'Green': 1180,
          'Yellow': 60,
          'Red': 10
        },
        topBlockedActions: [
          { action: 'execute_skill:Partner Payout', count: 8 },
          { action: 'system_modify', count: 5 },
          { action: 'user_delete', count: 3 }
        ]
      };

      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          action: 'execute_skill:Code Helper',
          resource: 'skill_execution',
          mode: 'Green',
          blocked: false,
          severity: 'low',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          action: 'view_security_logs',
          resource: 'security',
          mode: 'Green',
          blocked: false,
          severity: 'low',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          action: 'execute_skill:Partner Payout',
          resource: 'payout',
          mode: 'Yellow',
          blocked: true,
          reason: 'Elevated caution - high-risk actions require owner approval',
          severity: 'high',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ];

      setSecurityStats(mockStats);
      setRecentEvents(mockEvents);
    } catch (error) {
      Alert.alert('Error', 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyLockdown = () => {
    Alert.prompt(
      'Emergency Lockdown',
      'Enter reason for emergency lockdown:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Lockdown', 
          style: 'destructive',
          onPress: (reason) => {
            if (reason && reason.trim()) {
              onEmergencyLockdown(reason.trim());
              Alert.alert('Success', 'Emergency lockdown activated');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleResumeOperations = () => {
    Alert.alert(
      'Resume Operations',
      'Are you sure you want to resume normal operations?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Resume', 
          onPress: () => {
            onResumeOperations();
            Alert.alert('Success', 'Operations resumed to normal mode');
          }
        }
      ]
    );
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'Green': return '#10B981';
      case 'Yellow': return '#F59E0B';
      case 'Red': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const renderSecurityStatus = () => {
    if (!securityStats) return null;

    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Security Status</Text>
          <View style={[styles.modeIndicator, { backgroundColor: getModeColor(securityStats.currentMode) }]}>
            <Text style={styles.modeText}>{securityStats.currentMode}</Text>
          </View>
        </View>

        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{securityStats.totalEvents}</Text>
            <Text style={styles.statusLabel}>Total Events</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{securityStats.last24Hours.total}</Text>
            <Text style={styles.statusLabel}>Last 24h</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{securityStats.last24Hours.blocked}</Text>
            <Text style={styles.statusLabel}>Blocked</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{securityStats.last24Hours.blockedPercentage}%</Text>
            <Text style={styles.statusLabel}>Block Rate</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSecurityControls = () => (
    <View style={styles.controlsCard}>
      <Text style={styles.cardTitle}>Security Controls</Text>
      
      <View style={styles.controlItem}>
        <View style={styles.controlInfo}>
          <Text style={styles.controlTitle}>Auto-Lockdown</Text>
          <Text style={styles.controlDescription}>Automatically lockdown on threats</Text>
        </View>
        <Switch
          value={autoLockdown}
          onValueChange={setAutoLockdown}
          disabled={userRole !== 'owner'}
        />
      </View>

      {userRole === 'owner' && (
        <>
          <TouchableOpacity
            style={[styles.controlButton, styles.lockdownButton]}
            onPress={handleEmergencyLockdown}
          >
            <Text style={styles.lockdownButtonText}>🔒 Emergency Lockdown</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.resumeButton]}
            onPress={handleResumeOperations}
          >
            <Text style={styles.resumeButtonText}>▶️ Resume Operations</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderRecentEvents = () => (
    <View style={styles.eventsCard}>
      <Text style={styles.cardTitle}>Recent Events</Text>
      
      {recentEvents.map((event) => (
        <View key={event.id} style={styles.eventItem}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventAction}>{event.action}</Text>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(event.severity) }]}>
              <Text style={styles.severityText}>{event.severity}</Text>
            </View>
          </View>
          
          <Text style={styles.eventResource}>{event.resource}</Text>
          
          <View style={styles.eventFooter}>
            <Text style={styles.eventTime}>{formatTimestamp(event.timestamp)}</Text>
            {event.blocked && (
              <View style={styles.blockedBadge}>
                <Text style={styles.blockedText}>🚫 BLOCKED</Text>
              </View>
            )}
          </View>
          
          {event.reason && (
            <Text style={styles.eventReason}>{event.reason}</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderTopBlockedActions = () => {
    if (!securityStats?.topBlockedActions) return null;

    return (
      <View style={styles.blockedActionsCard}>
        <Text style={styles.cardTitle}>Top Blocked Actions</Text>
        
        {securityStats.topBlockedActions.map((action, index) => (
          <View key={action.action} style={styles.blockedActionItem}>
            <Text style={styles.blockedActionRank}>#{index + 1}</Text>
            <Text style={styles.blockedActionName}>{action.action}</Text>
            <Text style={styles.blockedActionCount}>{action.count} times</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Security Dashboard</Text>
          <Text style={styles.subtitle}>Real-time monitoring and control</Text>
        </View>

        {renderSecurityStatus()}
        {renderSecurityControls()}
        {renderRecentEvents()}
        {renderTopBlockedActions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modeIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  controlItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlInfo: {
    flex: 1,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  controlDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  controlButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  lockdownButton: {
    backgroundColor: '#DC2626',
  },
  resumeButton: {
    backgroundColor: '#059669',
  },
  lockdownButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  eventsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventResource: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  blockedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  blockedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#991B1B',
  },
  eventReason: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
    fontStyle: 'italic',
  },
  blockedActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  blockedActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 6,
  },
  blockedActionRank: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    width: 30,
  },
  blockedActionName: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  blockedActionCount: {
    fontSize: 12,
    color: '#6B7280',
  },
});
