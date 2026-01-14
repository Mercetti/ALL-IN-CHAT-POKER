import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { incidentSummaryGenerator } from '../services/incidentSummaryService';
import { useAceyStore } from '../state/aceyStore';
import { getStoredDeviceId } from '../services/api';
import BiometricAuthPrompt from '../components/BiometricAuthPrompt';
import { ApprovalRisk } from '../services/biometricAuth';

interface Incident {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trigger: string;
  affected_systems: string[];
  root_cause?: string;
  status: 'OPEN' | 'MITIGATED' | 'RESOLVED';
  created_at: number;
  updated_at: number;
  description: string;
  actions_taken: Array<{
    action: string;
    timestamp: number;
    user: string;
    biometric_verified: boolean;
  }>;
}

interface IncidentAction {
  name: string;
  description: string;
  risk: ApprovalRisk;
  icon: string;
}

const IncidentDashboardScreen: React.FC = ({ navigation }: any) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      setRefreshing(true);
      // This would call the actual API
      // const response = await apiGet('/incidents/active');
      // setIncidents(response.data || []);
      
      // Mock data for now
      const mockIncidents: Incident[] = [
        {
          id: 'incident_1',
          severity: 'HIGH',
          trigger: 'Model drift detected',
          affected_systems: ['Game Host', 'Audio Generator'],
          status: 'OPEN',
          created_at: Date.now() - 3600000,
          updated_at: Date.now() - 1800000,
          description: 'AI model behavior deviating from expected patterns',
          actions_taken: []
        },
        {
          id: 'incident_2',
          severity: 'MEDIUM',
          trigger: 'Rule violation detected',
          affected_systems: ['Chat Moderator'],
          status: 'MITIGATED',
          created_at: Date.now() - 7200000,
          updated_at: Date.now() - 3600000,
          description: 'Automated rule triggered unexpectedly',
          actions_taken: [
            {
              action: 'disable_skill',
              timestamp: Date.now() - 3600000,
              user: 'owner',
              biometric_verified: true
            }
          ]
        }
      ];
      
      setIncidents(mockIncidents);
      
      // Set active incident if none selected
      if (!activeIncident && mockIncidents.length > 0) {
        setActiveIncident(mockIncidents[0]);
      }
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAction = (action: string, incident: Incident) => {
    setSelectedIncident(incident);
    setPendingAction(action);
    
    // Check if biometric is required
    if (incident.severity === 'HIGH' || incident.severity === 'CRITICAL') {
      setShowBiometric(true);
    } else {
      executeAction(action, incident);
    }
  };

  const executeAction = async (action: string, incident: Incident) => {
    try {
      const deviceId = await getStoredDeviceId();
      
      // This would call the actual API
      // const response = await apiPost(`/incidents/${incident.id}/action`, {
      //   action,
      //   biometric_verified: incident.severity === 'HIGH' || incident.severity === 'CRITICAL'
      // });
      
      console.log(`Executing action: ${action} for incident: ${incident.id}`);
      
      // Refresh incidents after action
      loadIncidents();
      
      Alert.alert('Success', `Action "${action}" executed successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to execute action');
    }
  };

  const handleBiometricConfirm = (success: boolean) => {
    setShowBiometric(false);
    
    if (success && selectedIncident) {
      executeAction(pendingAction, selectedIncident);
    } else {
      Alert.alert('Cancelled', 'Action cancelled');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'HIGH': return '#F44336';
      case 'CRITICAL': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'check-circle';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'dangerous';
      default: return 'help';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#F44336';
      case 'MITIGATED': return '#FF9800';
      case 'RESOLVED': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const incidentActions: IncidentAction[] = [
    {
      name: 'freeze',
      description: 'Put Acey in read-only mode',
      risk: 'MEDIUM',
      icon: 'pause-circle-filled'
    },
    {
      name: 'rollback',
      description: 'Restore previous stable model',
      risk: 'HIGH',
      icon: 'restore'
    },
    {
      name: 'disable_skill',
      description: 'Isolate problematic module',
      risk: 'MEDIUM',
      icon: 'block'
    },
    {
      name: 'rewrite_rule',
      description: 'Hotfix governance rule',
      risk: 'HIGH',
      icon: 'edit'
    },
    {
      name: 'simulate',
      description: 'Dry-run fix simulation',
      risk: 'LOW',
      icon: 'play-circle-outline'
    }
  ];

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (start: number, end: number) => {
    const duration = end - start;
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Incident Response</Text>
        <TouchableOpacity onPress={loadIncidents}>
          <Icon name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadIncidents} />
        }
      >
        {/* Active Incident Alert */}
        {activeIncident && activeIncident.status === 'OPEN' && (
          <View style={[styles.alertCard, { borderLeftColor: getSeverityColor(activeIncident.severity) }]}>
            <View style={styles.alertHeader}>
              <Icon 
                name={getSeverityIcon(activeIncident.severity)} 
                size={24} 
                color={getSeverityColor(activeIncident.severity)} 
              />
              <View style={styles.alertTitleContainer}>
                <Text style={styles.alertTitle}>🚨 INCIDENT ACTIVE</Text>
                <Text style={styles.alertSubtitle}>Severity: {activeIncident.severity}</Text>
              </View>
            </View>
            
            <Text style={styles.alertDescription}>{activeIncident.trigger}</Text>
            
            <View style={styles.affectedSystems}>
              <Text style={styles.affectedLabel}>Affected:</Text>
              {activeIncident.affected_systems.map((system, index) => (
                <View key={index} style={styles.systemTag}>
                  <Text style={styles.systemText}>{system}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => navigation.navigate('AuditReplay')}
              >
                <Icon name="history" size={16} color="#FFFFFF" />
                <Text style={styles.alertButtonText}>View Timeline</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setShowActionModal(true)}
              >
                <Icon name="build" size={16} color="#FFFFFF" />
                <Text style={styles.alertButtonText}>Take Action</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Incident List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incidents</Text>
          
          {incidents.map((incident) => (
            <TouchableOpacity
              key={incident.id}
              style={[
                styles.incidentCard,
                activeIncident?.id === incident.id && styles.incidentCardActive
              ]}
              onPress={() => setActiveIncident(incident)}
            >
              <View style={styles.incidentHeader}>
                <View style={styles.incidentTitleRow}>
                  <Text style={styles.incidentTrigger}>{incident.trigger}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(incident.severity) }]}>
                    <Text style={styles.severityText}>{incident.severity}</Text>
                  </View>
                </View>
                
                <View style={styles.incidentMeta}>
                  <Text style={styles.incidentTime}>
                    {formatTimestamp(incident.created_at)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) }]}>
                    <Text style={styles.statusText}>{incident.status}</Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.incidentDescription}>{incident.description}</Text>
              
              <View style={styles.incidentFooter}>
                <Text style={styles.incidentDuration}>
                  Duration: {formatDuration(incident.created_at, incident.updated_at)}
                </Text>
                {incident.actions_taken.length > 0 && (
                  <Text style={styles.incidentActions}>
                    {incident.actions_taken.length} actions taken
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActions}>
            {incidentActions.map((action) => (
              <TouchableOpacity
                key={action.name}
                style={styles.quickActionCard}
                onPress={() => activeIncident && handleAction(action.name, activeIncident)}
                disabled={!activeIncident}
              >
                <Icon name={action.icon} size={24} color="#2196F3" />
                <Text style={styles.quickActionTitle}>{action.name}</Text>
                <Text style={styles.quickActionDescription}>{action.description}</Text>
                <View style={[styles.riskBadge, { backgroundColor: getSeverityColor(action.risk) }]}>
                  <Text style={styles.riskText}>{action.risk}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Biometric Auth Modal */}
      <BiometricAuthPrompt
        visible={showBiometric}
        action={pendingAction}
        risk={selectedIncident?.severity === 'HIGH' ? 'HIGH' : selectedIncident?.severity === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM'}
        onConfirm={handleBiometricConfirm}
        onCancel={() => setShowBiometric(false)}
      />

      {/* Action Selection Modal */}
      <Modal visible={showActionModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Action</Text>
            
            {incidentActions.map((action) => (
              <TouchableOpacity
                key={action.name}
                style={styles.actionOption}
                onPress={() => {
                  setShowActionModal(false);
                  if (activeIncident) {
                    handleAction(action.name, activeIncident);
                  }
                }}
              >
                <Icon name={action.icon} size={24} color="#2196F3" />
                <View style={styles.actionOptionContent}>
                  <Text style={styles.actionOptionTitle}>{action.name}</Text>
                  <Text style={styles.actionOptionDescription}>{action.description}</Text>
                </View>
                <View style={[styles.riskBadge, { backgroundColor: getSeverityColor(action.risk) }]}>
                  <Text style={styles.riskText}>{action.risk}</Text>
                </View>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#333333',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  alertDescription: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 12,
  },
  affectedSystems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  affectedLabel: {
    fontSize: 14,
    color: '#9E9E9E',
    marginRight: 8,
  },
  systemTag: {
    backgroundColor: '#2C2C2C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  systemText: {
    fontSize: 12,
    color: '#E0E0E0',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  alertButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  incidentCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  incidentCardActive: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  incidentHeader: {
    marginBottom: 8,
  },
  incidentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  incidentTrigger: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  incidentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentTime: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  incidentDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 8,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentDuration: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  incidentActions: {
    fontSize: 12,
    color: '#2196F3',
  },
  quickActions: {
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 8,
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  riskText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    marginBottom: 12,
  },
  actionOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionOptionDescription: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  cancelButton: {
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default IncidentDashboardScreen;
