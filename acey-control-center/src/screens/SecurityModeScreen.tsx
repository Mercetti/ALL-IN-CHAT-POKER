import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

interface SecurityEvent {
  id: string;
  timestamp: number;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  explanation: string;
  recommendation: string;
  requiresApproval: boolean;
}

interface SecurityStatus {
  systemIntegrity: 'STABLE' | 'DRIFT_DETECTED';
  fileActivity: 'NORMAL' | 'ANOMALIES';
  modelBehavior: 'STABLE' | 'HALLUCINATION_SPIKE';
  financialOps: 'CLEAN' | 'REVIEW_NEEDED';
  partnerTrust: 'STABLE' | 'DEGRADING';
}

interface FileNode {
  id: string;
  name: string;
  type: 'code' | 'audio' | 'images' | 'datasets' | 'financial';
  lastModified: number;
  source: 'LLM' | 'user' | 'system';
  trustScore: number;
  retentionPolicy: string;
}

export const SecurityModeScreen: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [securityMode, setSecurityMode] = useState<'SECURE' | 'WATCHING' | 'ACTION_REQUIRED'>('SECURE');
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);

  // Authentication check on focus
  useFocusEffect(
    useCallback(() => {
      // In real app, this would trigger biometric auth
      checkAuthentication();
    }, [])
  );

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkAuthentication = async () => {
    // Simulate biometric authentication
    setTimeout(() => {
      setIsAuthenticated(true);
      loadSecurityData();
    }, 1000);
  };

  const loadSecurityData = async () => {
    try {
      // Mock API calls - in real app, these would be actual API calls
      const mockStatus: SecurityStatus = {
        systemIntegrity: Math.random() > 0.8 ? 'DRIFT_DETECTED' : 'STABLE',
        fileActivity: Math.random() > 0.7 ? 'ANOMALIES' : 'NORMAL',
        modelBehavior: Math.random() > 0.9 ? 'HALLUCINATION_SPIKE' : 'STABLE',
        financialOps: Math.random() > 0.8 ? 'REVIEW_NEEDED' : 'CLEAN',
        partnerTrust: Math.random() > 0.85 ? 'DEGRADING' : 'STABLE'
      };

      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          timestamp: Date.now() - 3600000,
          type: 'FILE_ANOMALY',
          severity: 'MEDIUM',
          message: 'Unusual file write detected in /datasets/audio/',
          explanation: 'New auto-generated batch files detected outside normal pattern',
          recommendation: 'Review batch source and approve retention policy',
          requiresApproval: false
        },
        {
          id: '2',
          timestamp: Date.now() - 7200000,
          type: 'MODEL_DRIFT',
          severity: 'HIGH',
          message: 'Audio outputs deviated from training patterns',
          explanation: 'Model generating content with 15% variance from baseline',
          recommendation: 'Pause learning ingestion and review training data',
          requiresApproval: true
        }
      ];

      const mockFileTree: FileNode[] = [
        {
          id: '1',
          name: 'src',
          type: 'code',
          lastModified: Date.now() - 86400000,
          source: 'user',
          trustScore: 4.0,
          retentionPolicy: 'User owned'
        },
        {
          id: '2',
          name: 'datasets',
          type: 'datasets',
          lastModified: Date.now() - 3600000,
          source: 'LLM',
          trustScore: 3.2,
          retentionPolicy: '90 days'
        },
        {
          id: '3',
          name: 'exports',
          type: 'financial',
          lastModified: Date.now() - 1800000,
          source: 'system',
          trustScore: 4.0,
          retentionPolicy: '7 years'
        }
      ];

      setStatus(mockStatus);
      setEvents(mockEvents);
      setFileTree(mockFileTree);
      
      // Update security mode based on status
      const hasHighSeverity = mockEvents.some(e => e.severity === 'HIGH' || e.severity === 'CRITICAL');
      const hasActionRequired = Object.values(mockStatus).some(s => s !== 'STABLE' && s !== 'CLEAN');
      
      setSecurityMode(
        hasHighSeverity ? 'ACTION_REQUIRED' :
        hasActionRequired ? 'WATCHING' : 'SECURE'
      );
      
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  }, []);

  const handleEventPress = (event: SecurityEvent) => {
    setSelectedEvent(event);
  };

  const handleApprove = async () => {
    if (!selectedEvent) return;
    
    Alert.alert(
      'Approve Action',
      `Approve ${selectedEvent.type}?\n\n${selectedEvent.recommendation}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: () => {
            // In real app, this would call approval API
            console.log('Approved:', selectedEvent.id);
            setSelectedEvent(null);
            loadSecurityData(); // Refresh data
          }
        }
      ]
    );
  };

  const handleSimulate = () => {
    if (!selectedEvent) return;
    
    Alert.alert(
      'Run Simulation',
      `Simulate fix for ${selectedEvent.type}?\n\nThis will show what would change without executing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Simulate', 
          onPress: () => {
            // In real app, this would run simulation
            console.log('Simulating:', selectedEvent.id);
            Alert.alert('Simulation Complete', 'Simulation shows no system impact. Action is safe to proceed.');
          }
        }
      ]
    );
  };

  const handleDismiss = () => {
    if (!selectedEvent) return;
    
    Alert.prompt(
      'Dismiss Alert',
      'Why are you dismissing this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Dismiss', 
          onPress: (reason) => {
            // In real app, this would log dismissal with reason
            console.log('Dismissed:', selectedEvent.id, 'Reason:', reason);
            setSelectedEvent(null);
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'STABLE': return '#4CAF50';
      case 'DRIFT_DETECTED': return '#FF9800';
      case 'NORMAL': return '#4CAF50';
      case 'ANOMALIES': return '#FF9800';
      case 'STABLE': return '#4CAF50';
      case 'HALLUCINATION_SPIKE': return '#F44336';
      case 'CLEAN': return '#4CAF50';
      case 'REVIEW_NEEDED': return '#FF9800';
      case 'DEGRADING': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'HIGH': return '#F44336';
      case 'CRITICAL': return '#D32F2F';
      default: return '#9E9E9E';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'code': return '💻';
      case 'audio': return '🎵';
      case 'images': return '🖼️';
      case 'datasets': return '📊';
      case 'financial': return '💰';
      default: return '📁';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>🔐 Security Mode</Text>
          <Text style={styles.authSubtitle}>Owner / Dev Access Required</Text>
          <TouchableOpacity 
            style={styles.authButton}
            onPress={checkAuthentication}
          >
            <Text style={styles.authButtonText}>Authenticate</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Indicator */}
      <View style={styles.statusBar}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(securityMode) }]} />
        <Text style={styles.statusText}>
          {securityMode === 'SECURE' && '🟢 Secure'}
          {securityMode === 'WATCHING' && '🟡 Watching'}
          {securityMode === 'ACTION_REQUIRED' && '🔴 Action Required'}
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Security Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Overview</Text>
          
          <View style={styles.cardGrid}>
            <View style={styles.statusCard}>
              <Text style={styles.cardTitle}>System Integrity</Text>
              <Text style={[styles.cardValue, { color: getStatusColor(status?.systemIntegrity || 'STABLE') }]}>
                {status?.systemIntegrity === 'STABLE' ? '✅ Stable' : '⚠️ Drift Detected'}
              </Text>
            </View>
            
            <View style={styles.statusCard}>
              <Text style={styles.cardTitle}>File Activity</Text>
              <Text style={[styles.cardValue, { color: getStatusColor(status?.fileActivity || 'NORMAL') }]}>
                {status?.fileActivity === 'NORMAL' ? '✅ Normal' : '⚠️ Anomalies'}
              </Text>
            </View>
            
            <View style={styles.statusCard}>
              <Text style={styles.cardTitle}>Model Behavior</Text>
              <Text style={[styles.cardValue, { color: getStatusColor(status?.modelBehavior || 'STABLE') }]}>
                {status?.modelBehavior === 'STABLE' ? '✅ Stable' : '🔴 Hallucination Spike'}
              </Text>
            </View>
            
            <View style={styles.statusCard}>
              <Text style={styles.cardTitle}>Financial Ops</Text>
              <Text style={[styles.cardValue, { color: getStatusColor(status?.financialOps || 'CLEAN') }]}>
                {status?.financialOps === 'CLEAN' ? '✅ Clean' : '⚠️ Review Needed'}
              </Text>
            </View>
            
            <View style={styles.statusCard}>
              <Text style={styles.cardTitle}>Partner Trust</Text>
              <Text style={[styles.cardValue, { color: getStatusColor(status?.partnerTrust || 'STABLE') }]}>
                {status?.partnerTrust === 'STABLE' ? '✅ Stable' : '🔴 Degrading'}
              </Text>
            </View>
          </View>
        </View>

        {/* Live Security Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Security Feed</Text>
          
          {events.map((event) => (
            <TouchableOpacity 
              key={event.id}
              style={styles.eventItem}
              onPress={() => handleEventPress(event)}
            >
              <View style={styles.eventHeader}>
                <Text style={styles.eventTime}>{formatTimestamp(event.timestamp)}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(event.severity) }]}>
                  <Text style={styles.severityText}>{event.severity}</Text>
                </View>
              </View>
              
              <Text style={styles.eventTitle}>{event.message}</Text>
              <Text style={styles.eventExplanation}>{event.explanation}</Text>
              
              <View style={styles.eventActions}>
                <TouchableOpacity style={styles.eventButton} onPress={() => handleEventPress(event)}>
                  <Text style={styles.eventButtonText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.eventButton} onPress={() => handleEventPress(event)}>
                  <Text style={styles.eventButtonText}>Simulate Fix</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.eventButton} onPress={() => handleEventPress(event)}>
                  <Text style={styles.eventButtonText}>Ignore</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* File & Asset Watcher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>File & Asset Watcher</Text>
          
          {fileTree.map((node) => (
            <View key={node.id} style={styles.fileNode}>
              <View style={styles.fileHeader}>
                <Text style={styles.fileIcon}>{getFileIcon(node.type)}</Text>
                <Text style={styles.fileName}>{node.name}</Text>
                <Text style={styles.fileTrust}>Trust: {node.trustScore.toFixed(1)}</Text>
              </View>
              
              <View style={styles.fileDetails}>
                <Text style={styles.fileDetail}>Modified: {formatTimestamp(node.lastModified)}</Text>
                <Text style={styles.fileDetail}>Source: {node.source}</Text>
                <Text style={styles.fileDetail}>Policy: {node.retentionPolicy}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Simulation Mode Panel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simulation Mode</Text>
          
          <View style={styles.simulationPanel}>
            <Text style={styles.simulationText}>
              {isSimulationMode ? '🧪 NO LIVE ACTIONS TAKEN' : '✅ Ready for live operations'}
            </Text>
            
            <TouchableOpacity 
              style={[styles.simulationButton, { backgroundColor: isSimulationMode ? '#F44336' : '#4CAF50' }]}
              onPress={() => setIsSimulationMode(!isSimulationMode)}
            >
              <Text style={styles.simulationButtonText}>
                {isSimulationMode ? 'Exit Simulation' : 'Enter Simulation'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Event Details</Text>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>What happened</Text>
              <Text style={styles.detailValue}>{selectedEvent.message}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Why Acey noticed</Text>
              <Text style={styles.detailValue}>{selectedEvent.explanation}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Risk level</Text>
              <View style={[styles.riskBadge, { backgroundColor: getSeverityColor(selectedEvent.severity) }]}>
                <Text style={styles.riskText}>{selectedEvent.severity}</Text>
              </View>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>What Acey recommends</Text>
              <Text style={styles.detailValue}>{selectedEvent.recommendation}</Text>
            </View>
            
            <View style={styles.modalActions}>
              {selectedEvent.requiresApproval && (
                <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
                  <Text style={styles.approveButtonText}>✅ Approve</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.simulateButton} onPress={handleSimulate}>
                <Text style={styles.simulateButtonText}>🧪 Run Simulation</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
                <Text style={styles.dismissButtonText}>🚫 Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 30,
  },
  authButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  cardTitle: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventItem: {
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventTime: {
    fontSize: 12,
    color: '#ccc',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  eventExplanation: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  eventButton: {
    backgroundColor: '#444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  eventButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  fileNode: {
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fileIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  fileTrust: {
    fontSize: 12,
    color: '#4CAF50',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fileDetails: {
    paddingLeft: 30,
  },
  fileDetail: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  simulationPanel: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  simulationText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  simulationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  simulationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 8,
    margin: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ccc',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  riskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  simulateButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
  },
  dismissButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
  },
  dismissButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
