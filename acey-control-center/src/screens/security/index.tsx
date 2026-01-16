import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';

// Simplified types for now
interface SecurityEvent {
  id: string;
  timestamp: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detected_by: string;
  confidence: number;
  recommended_actions: any[];
  requires_approval: boolean;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

interface SecurityMode {
  current: 'green' | 'yellow' | 'red';
  last_changed: string;
  changed_by: string;
  reason: string;
}

interface SecurityStats {
  total_events: number;
  unresolved_events: number;
  pending_approvals: number;
  events_by_severity: {
    low: number;
    medium: number;
    high: number;
  };
  events_by_category: {
    file: number;
    model: number;
    financial: number;
    permission: number;
    dataset: number;
    partner: number;
  };
  avg_resolution_time: number;
}

export default function SecurityOverview() {
  const [securityMode, setSecurityMode] = useState<SecurityMode>({
    current: 'green',
    last_changed: new Date().toISOString(),
    changed_by: 'system',
    reason: 'Normal operations'
  });
  
  const [stats, setStats] = useState<SecurityStats>({
    total_events: 0,
    unresolved_events: 0,
    pending_approvals: 0,
    events_by_severity: { low: 0, medium: 0, high: 0 },
    events_by_category: { file: 0, model: 0, financial: 0, permission: 0, dataset: 0, partner: 0 },
    avg_resolution_time: 0
  });

  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Inline components for now
  const SecurityStatusBanner = ({ mode }: { mode: SecurityMode }) => (
    <View style={[
      styles.statusBanner,
      mode.current === 'green' && styles.greenBanner,
      mode.current === 'yellow' && styles.yellowBanner,
      mode.current === 'red' && styles.redBanner
    ]}>
      <Text style={styles.statusText}>
        {mode.current === 'green' && '🟢 System Secure'}
        {mode.current === 'yellow' && '🟡 Elevated Caution'}
        {mode.current === 'red' && '🔴 System Locked'}
      </Text>
    </View>
  );

  const SecuritySummaryCards = ({ stats, mode }: { stats: SecurityStats; mode: SecurityMode }) => (
    <View style={styles.summaryGrid}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryNumber}>{stats.total_events}</Text>
        <Text style={styles.summaryLabel}>Total Events</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryNumber}>{stats.unresolved_events}</Text>
        <Text style={styles.summaryLabel}>Unresolved</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryNumber}>{stats.pending_approvals}</Text>
        <Text style={styles.summaryLabel}>Pending</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryNumber}>{stats.avg_resolution_time.toFixed(1)}m</Text>
        <Text style={styles.summaryLabel}>Avg Resolution</Text>
      </View>
    </View>
  );

  const RecentSecurityEvents = ({ events }: { events: SecurityEvent[] }) => (
    <View>
      {events.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventCategory}>{event.category}</Text>
            <View style={[
              styles.severityBadge,
              event.severity === 'low' && styles.lowSeverity,
              event.severity === 'medium' && styles.mediumSeverity,
              event.severity === 'high' && styles.highSeverity
            ]}>
              <Text style={styles.severityText}>{event.severity.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.eventDescription}>{event.description}</Text>
          <Text style={styles.eventTime}>
            {new Date(event.timestamp).toLocaleString()}
          </Text>
          {event.requires_approval && (
            <Text style={styles.approvalRequired}>⚠️ Approval Required</Text>
          )}
        </View>
      ))}
    </View>
  );

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      // In a real app, these would be API calls
      // const response = await fetch('/api/security/status');
      // const data = await response.json();
      
      // Mock data for now
      setSecurityMode({
        current: 'green',
        last_changed: new Date().toISOString(),
        changed_by: 'system',
        reason: 'Normal operations'
      });

      setStats({
        total_events: 147,
        unresolved_events: 3,
        pending_approvals: 2,
        events_by_severity: { low: 89, medium: 45, high: 13 },
        events_by_category: { file: 34, model: 28, financial: 41, permission: 19, dataset: 15, partner: 10 },
        avg_resolution_time: 12.5
      });

      setRecentEvents([
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          category: 'financial',
          severity: 'medium',
          description: 'Unusual payout pattern detected for partner #2847',
          detected_by: 'acey',
          confidence: 0.87,
          recommended_actions: [{
            action_id: 'review-payout',
            description: 'Review partner payout history',
            reversible: true,
            scope: ['partner', 'financial'],
            estimated_risk: 'low'
          }],
          requires_approval: true,
          resolved: false
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          category: 'file',
          severity: 'low',
          description: 'Unexpected file modification in config directory',
          detected_by: 'acey',
          confidence: 0.92,
          recommended_actions: [{
            action_id: 'investigate-file',
            description: 'Investigate file change origin',
            reversible: true,
            scope: ['file'],
            estimated_risk: 'low'
          }],
          requires_approval: false,
          resolved: true,
          resolved_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          resolved_by: 'acey'
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load security data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  };

  const handleEmergencyLock = () => {
    Alert.alert(
      '🚨 Emergency Lockdown',
      'This will immediately lock all automation and require manual approval for all actions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock Down',
          style: 'destructive',
          onPress: async () => {
            try {
              // API call to emergency lock
              setSecurityMode({
                current: 'red',
                last_changed: new Date().toISOString(),
                changed_by: 'founder',
                reason: 'Emergency lockdown initiated'
              });
              Alert.alert('✅ System Locked', 'All automation has been paused');
            } catch (error) {
              Alert.alert('❌ Lock Failed', 'Unable to lock system');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <SecurityStatusBanner mode={securityMode} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Overview</Text>
        <SecuritySummaryCards stats={stats} mode={securityMode} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyLock}>
            <Text style={styles.emergencyButtonText}>🚨 Lock</Text>
          </TouchableOpacity>
        </View>
        <RecentSecurityEvents events={recentEvents} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📊 View Audit Log</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>🧪 Run Simulation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📋 Export Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>⚙️ Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  statusBanner: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  greenBanner: {
    backgroundColor: '#d4edda',
  },
  yellowBanner: {
    backgroundColor: '#fff3cd',
  },
  redBanner: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  eventCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lowSeverity: {
    backgroundColor: '#d4edda',
  },
  mediumSeverity: {
    backgroundColor: '#fff3cd',
  },
  highSeverity: {
    backgroundColor: '#f8d7da',
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  eventDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
  },
  approvalRequired: {
    fontSize: 12,
    color: '#856404',
    marginTop: 4,
    fontWeight: '600',
  },
  emergencyButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
