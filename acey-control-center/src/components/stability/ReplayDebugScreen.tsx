import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { stabilityApiService, ReplaySession } from '../../services/stabilityApiService';

export default function ReplayDebugScreen() {
  const [sessions, setSessions] = useState<ReplaySession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ReplaySession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSession, setRecordingSession] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchReplaySessions();
  }, []);

  const fetchReplaySessions = async () => {
    setIsLoading(true);
    try {
      const fetchedSessions = await stabilityApiService.getReplaySessions();
      setSessions(fetchedSessions);
    } catch (error) {
      console.error('Failed to fetch replay sessions:', error);
      Alert.alert('Error', 'Failed to load replay sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const result = await stabilityApiService.startReplayRecording({
        mode: 'debug',
        purpose: 'Manual debugging session'
      });
      
      if (result.sessionId) {
        setRecordingSession(result.sessionId);
        setIsRecording(true);
        Alert.alert('Recording Started', result.message);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start replay recording');
    }
  };

  const stopRecording = async () => {
    if (!recordingSession) return;

    try {
      const result = await stabilityApiService.stopReplayRecording(recordingSession);
      
      if (result.success) {
        setRecordingSession(null);
        setIsRecording(false);
        Alert.alert('Recording Stopped', 'Session saved successfully');
        fetchReplaySessions(); // Refresh sessions
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop replay recording');
    }
  };

  const replaySession = async (session: ReplaySession) => {
    Alert.alert(
      'Replay Session',
      `Are you sure you want to replay session from ${new Date(session.startTime).toLocaleString()}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Replay',
          style: 'default',
          onPress: async () => {
            setIsReplaying(true);
            try {
              const result = await stabilityApiService.replaySession(session.id);
              
              if (result.success) {
                Alert.alert(
                  'Replay Complete',
                  `Replayed ${result.replayedDecisions} decisions successfully${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`
                );
              } else {
                Alert.alert('Replay Failed', 'Failed to replay session');
              }
            } catch (error) {
              console.error('Failed to replay session:', error);
              Alert.alert('Error', 'Failed to replay session');
            } finally {
              setIsReplaying(false);
            }
          },
        },
      ]
    );
  };

  const getSessionStatusColor = (session: ReplaySession) => {
    if (session.endTime) return '#6B7280'; // Completed
    return '#10B981'; // Active
  };

  const getSessionStatusText = (session: ReplaySession) => {
    if (session.endTime) return 'Completed';
    return 'Active';
  };

  const renderSessionCard = (session: ReplaySession) => (
    <TouchableOpacity
      key={session.id}
      style={styles.sessionCard}
      onPress={() => setSelectedSession(session)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionId}>{session.id}</Text>
          <Text style={styles.sessionDate}>
            {new Date(session.startTime).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.sessionStatus, { backgroundColor: getSessionStatusColor(session) }]}>
          <Text style={styles.sessionStatusText}>{getSessionStatusText(session)}</Text>
        </View>
      </View>

      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Decisions</Text>
          <Text style={styles.statValue}>{session.decisions.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Success Rate</Text>
          <Text style={styles.statValue}>{session.summary.successRate.toFixed(1)}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>
            {session.summary.averageDuration.toFixed(0)}ms
          </Text>
        </View>
      </View>

      <View style={styles.sessionMode}>
        <Ionicons name="settings" size={16} color="#6B7280" />
        <Text style={styles.modeText}>Mode: {session.context.mode}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDecisionItem = (decision: any, index: number) => (
    <View key={decision.id} style={styles.decisionItem}>
      <View style={styles.decisionHeader}>
        <Text style={styles.decisionNumber}>#{index + 1}</Text>
        <Text style={styles.decisionTime}>
          {new Date(decision.timestamp).toLocaleTimeString()}
        </Text>
        <View style={[
          styles.decisionStatus,
          { backgroundColor: decision.success ? '#10B981' : '#EF4444' }
        ]}>
          <Text style={styles.decisionStatusText}>
            {decision.success ? 'SUCCESS' : 'ERROR'}
          </Text>
        </View>
      </View>

      <View style={styles.decisionContent}>
        <View style={styles.decisionSection}>
          <Text style={styles.sectionLabel}>Skill Routing</Text>
          <Text style={styles.sectionValue}>{decision.skillRouting}</Text>
        </View>

        <View style={styles.decisionSection}>
          <Text style={styles.sectionLabel}>Auto Rule</Text>
          <Text style={styles.sectionValue}>{decision.autoRuleOutcome.rule}</Text>
        </View>

        <View style={styles.decisionSection}>
          <Text style={styles.sectionLabel}>Duration</Text>
          <Text style={styles.sectionValue}>{decision.duration}ms</Text>
        </View>
      </View>

      {decision.error && (
        <View style={styles.errorSection}>
          <Text style={styles.errorLabel}>Error:</Text>
          <Text style={styles.decisionErrorText}>{decision.error}</Text>
        </View>
      )}

      <View style={styles.resourceSection}>
        <Text style={styles.sectionLabel}>Resources</Text>
        <View style={styles.resourceRow}>
          <View style={styles.resourceItem}>
            <Text style={styles.resourceValue}>CPU: {decision.resourceSnapshot.cpu}%</Text>
          </View>
          <View style={styles.resourceItem}>
            <Text style={styles.resourceValue}>Memory: {decision.resourceSnapshot.memory}%</Text>
          </View>
          <View style={styles.resourceItem}>
            <Text style={styles.resourceValue}>GPU: {decision.resourceSnapshot.gpu}%</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading replay sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load replay sessions</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReplaySessions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Replay Debug</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isReplaying}
          >
            <Ionicons 
              name={isRecording ? 'stop' : 'radio'} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.recordButtonText}>
              {isRecording ? 'Stop' : 'Record'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Recording Status */}
          {isRecording && (
            <View style={styles.recordingStatus}>
              <View style={styles.recordingIndicator} />
              <Text style={styles.recordingText}>
                Recording session: {recordingSession}
              </Text>
            </View>
          )}

          {/* Sessions List */}
          <Text style={styles.sectionTitle}>Replay Sessions</Text>
          <Text style={styles.sectionDescription}>
            Debug system behavior by replaying recorded decision chains
          </Text>

          {sessions.map(renderSessionCard)}
        </View>
      </ScrollView>

      {/* Session Detail Modal */}
      <Modal
        visible={!!selectedSession}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedSession(null)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Session Details</Text>
            <TouchableOpacity
              style={[styles.replayButton, isReplaying && styles.disabledButton]}
              onPress={() => selectedSession && replaySession(selectedSession)}
              disabled={isReplaying}
            >
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={styles.replayButtonText}>
                {isReplaying ? 'Replaying...' : 'Replay'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.sessionSummary}>
              <Text style={styles.summaryTitle}>Session Summary</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Decisions</Text>
                  <Text style={styles.summaryValue}>
                    {selectedSession?.summary.totalDecisions}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Success Rate</Text>
                  <Text style={styles.summaryValue}>
                    {selectedSession?.summary.successRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Duration</Text>
                  <Text style={styles.summaryValue}>
                    {selectedSession?.summary.averageDuration.toFixed(0)}ms
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.decisionsTitle}>Decision Chain</Text>
            {selectedSession?.decisions.map(renderDecisionItem)}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  recordingButton: {
    backgroundColor: '#10B981',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingErrorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingStatus: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginRight: 12,
  },
  recordingText: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  sessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sessionStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sessionMode: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  replayButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  replayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sessionSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  decisionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  decisionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  decisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  decisionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  decisionTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  decisionStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  decisionStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  decisionContent: {
    marginBottom: 12,
  },
  decisionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionValue: {
    fontSize: 12,
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  errorSection: {
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  errorLabel: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
    marginBottom: 4,
  },
  decisionErrorText: {
    fontSize: 12,
    color: '#991B1B',
  },
  resourceSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 12,
  },
  resourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resourceItem: {
    flex: 1,
    alignItems: 'center',
  },
  resourceValue: {
    fontSize: 11,
    color: '#374151',
  },
});
