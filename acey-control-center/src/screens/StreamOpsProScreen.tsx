import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { streamOpsProSkill } from '../services/streamOpsProSkill';
import { useAceyStore } from '../state/aceyStore';

interface StreamIssue {
  id: string;
  type: 'UI_ERROR' | 'AUDIO_DESYNC' | 'API_FAILURE' | 'PERFORMANCE_DEGRADATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detected: number;
  description: string;
  suggestedFixes: string[];
  confidence: number;
  requiresApproval: boolean;
}

interface StreamMetrics {
  meanTimeToDetect: number;
  falsePositiveRate: number;
  fixSuggestionsAccepted: number;
  streamsSavedFromDowntime: number;
  totalAlerts: number;
  criticalAlerts: number;
  avgConfidenceScore: number;
  trustScore: number;
}

const StreamOpsProScreen: React.FC = ({ navigation }: any) => {
  const { setLoading, setError } = useAceyStore();
  const [activeStream, setActiveStream] = useState<string | null>(null);
  const [issues, setIssues] = useState<StreamIssue[]>([]);
  const [metrics, setMetrics] = useState<StreamMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<StreamIssue | null>(null);
  const [showFixModal, setShowFixModal] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    loadStreamOpsData();
  }, []);

  const loadStreamOpsData = async () => {
    try {
      setLoading(true);
      
      // Check subscription status
      const hasSubscription = await checkSubscription();
      setIsSubscribed(hasSubscription);
      
      if (hasSubscription) {
        // Load active stream data
        await loadActiveStream();
        
        // Load metrics
        const skillMetrics = await streamOpsProSkill.getSkillMetrics('demo-tenant');
        setMetrics(skillMetrics.metrics);
      }
      
      setError(null);
    } catch (error) {
      setError('Failed to load Stream Ops data');
      console.error('Stream Ops load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async (): Promise<boolean> => {
    // In production, check against monetization service
    // For demo, simulate subscription check
    return true;
  };

  const loadActiveStream = async () => {
    // Mock active stream
    const streamId = 'stream-' + Date.now();
    setActiveStream(streamId);
    
    // Start monitoring
    await streamOpsProSkill.startStreamMonitoring(streamId, 'demo-tenant');
    
    // Detect issues
    const mockSystemStatus = {
      uiErrors: 2,
      audioDelay: 650,
      cpuUsage: 85,
      memoryUsage: 78
    };
    
    const mockLogs = [
      { type: 'API_ERROR', timestamp: Date.now() - 120000 },
      { type: 'UI_ERROR', timestamp: Date.now() - 300000 }
    ];
    
    const detectedIssues = await streamOpsProSkill.detectIssues(streamId, mockSystemStatus, mockLogs);
    setIssues(detectedIssues);
    
    // Send alerts for critical issues
    for (const issue of detectedIssues) {
      if (issue.severity === 'HIGH' || issue.severity === 'CRITICAL') {
        await streamOpsProSkill.sendAlert('demo-tenant', issue);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStreamOpsData();
    setRefreshing(false);
  };

  const runSimulation = async () => {
    try {
      setLoading(true);
      
      // Mock historical data
      const historicalData = Array.from({ length: 50 }, (_, i) => ({
        timestamp: Date.now() - (i * 3600000), // Hourly data for 50 hours
        errors: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0,
        audioDelay: Math.random() * 1000,
        cpuUsage: 50 + Math.random() * 40
      }));
      
      const result = await streamOpsProSkill.runInstallSimulation('demo-tenant', historicalData);
      setSimulationResult(result);
      setShowSimulationModal(true);
      
    } catch (error) {
      Alert.alert('Simulation Failed', 'Unable to run simulation');
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssuePress = (issue: StreamIssue) => {
    setSelectedIssue(issue);
    setShowFixModal(true);
  };

  const handleFixSuggestion = async (fixIndex: number) => {
    if (!selectedIssue) return;
    
    try {
      const fixes = await streamOpsProSkill.suggestFixes('demo-tenant', selectedIssue.id);
      Alert.alert(
        'Suggested Fixes',
        fixes.map((fix, index) => `${index + 1}. ${fix}`).join('\n\n'),
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Execute Fix', 
            onPress: () => executeFix(selectedIssue.id, fixIndex)
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get fix suggestions');
    }
  };

  const executeFix = async (issueId: string, fixIndex: number) => {
    try {
      const success = await streamOpsProSkill.executeFix('demo-tenant', issueId, fixIndex);
      if (success) {
        Alert.alert('Fix Executed', 'The fix has been applied successfully');
        // Refresh issues
        await loadActiveStream();
      }
    } catch (error) {
      Alert.alert('Fix Failed', 'Unable to execute the fix');
    }
  };

  const generateReport = async () => {
    if (!activeStream) return;
    
    try {
      setLoading(true);
      const report = await streamOpsProSkill.generateStreamReport(activeStream, 'demo-tenant');
      
      Alert.alert(
        'Stream Report',
        `Issues Detected: ${report.metrics.totalIssues}\n` +
        `Avg Detection Time: ${report.metrics.avgDetectionTime.toFixed(1)} min\n` +
        `Streams Saved: ${report.metrics.streamsSaved}\n\n` +
        `Summary:\n${report.summary.whatWentWrong.slice(0, 2).join('\n')}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Report Failed', 'Unable to generate report');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#F44336';
      case 'HIGH': return '#FF9800';
      case 'MEDIUM': return '#2196F3';
      case 'LOW': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'warning';
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'check-circle';
      default: return 'help';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isSubscribed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Stream Ops Pro</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.subscriptionPrompt}>
          <Icon name="lock" size={64} color="#FF9800" />
          <Text style={styles.promptTitle}>Subscription Required</Text>
          <Text style={styles.promptSubtitle}>
            Get professional-grade stream monitoring and insights
          </Text>
          
          <View style={styles.pricingCard}>
            <Text style={styles.price}>$15/month</Text>
            <Text style={styles.priceDescription}>7-day free trial</Text>
          </View>
          
          <TouchableOpacity style={styles.subscribeButton}>
            <Text style={styles.subscribeButtonText}>Start Free Trial</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.simulationButton} onPress={runSimulation}>
            <Text style={styles.simulationButtonText}>Run Simulation</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Stream Ops Pro</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Metrics Overview */}
        {metrics && (
          <View style={styles.metricsContainer}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics.meanTimeToDetect.toFixed(1)}m</Text>
                <Text style={styles.metricLabel}>Avg Detection</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics.falsePositiveRate}%</Text>
                <Text style={styles.metricLabel}>False Positives</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics.streamsSavedFromDowntime}</Text>
                <Text style={styles.metricLabel}>Streams Saved</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics.trustScore.toFixed(1)}</Text>
                <Text style={styles.metricLabel}>Trust Score</Text>
              </View>
            </View>
          </View>
        )}

        {/* Active Issues */}
        <View style={styles.issuesContainer}>
          <View style={styles.issuesHeader}>
            <Text style={styles.sectionTitle}>Active Issues</Text>
            <TouchableOpacity onPress={generateReport}>
              <Icon name="assessment" size={24} color="#2196F3" />
            </TouchableOpacity>
          </View>
          
          {issues.length === 0 ? (
            <View style={styles.noIssues}>
              <Icon name="check-circle" size={48} color="#4CAF50" />
              <Text style={styles.noIssuesTitle}>All Systems Good</Text>
              <Text style={styles.noIssuesSubtitle}>No issues detected</Text>
            </View>
          ) : (
            issues.map((issue) => (
              <TouchableOpacity
                key={issue.id}
                style={styles.issueCard}
                onPress={() => handleIssuePress(issue)}
              >
                <View style={styles.issueHeader}>
                  <View style={styles.issueTitleContainer}>
                    <Icon 
                      name={getSeverityIcon(issue.severity)} 
                      size={20} 
                      color={getSeverityColor(issue.severity)} 
                    />
                    <Text style={styles.issueTitle}>{issue.type.replace('_', ' ')}</Text>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(issue.severity) }]}>
                    <Text style={styles.severityText}>{issue.severity}</Text>
                  </View>
                </View>
                
                <Text style={styles.issueDescription}>{issue.description}</Text>
                
                <View style={styles.issueFooter}>
                  <Text style={styles.issueTime}>{formatTime(issue.detected)}</Text>
                  <Text style={styles.issueConfidence}>{issue.confidence}% confidence</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Fix Modal */}
      <Modal
        visible={showFixModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFixModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Issue Details</Text>
              <TouchableOpacity onPress={() => setShowFixModal(false)}>
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {selectedIssue && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalIssueTitle}>{selectedIssue.type.replace('_', ' ')}</Text>
                <Text style={styles.modalIssueDescription}>{selectedIssue.description}</Text>
                
                <View style={styles.fixesSection}>
                  <Text style={styles.fixesTitle}>Suggested Fixes:</Text>
                  {selectedIssue.suggestedFixes.map((fix, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.fixItem}
                      onPress={() => handleFixSuggestion(index)}
                    >
                      <Icon name="build" size={20} color="#2196F3" />
                      <Text style={styles.fixText}>{fix}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Simulation Modal */}
      <Modal
        visible={showSimulationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSimulationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Simulation Results</Text>
              <TouchableOpacity onPress={() => setShowSimulationModal(false)}>
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {simulationResult && (
              <View style={styles.simulationResults}>
                <View style={styles.simulationItem}>
                  <Text style={styles.simulationLabel}>Would Have Detected:</Text>
                  <Text style={styles.simulationValue}>
                    {simulationResult.wouldHaveDetected ? 'Yes' : 'No'}
                  </Text>
                </View>
                
                <View style={styles.simulationItem}>
                  <Text style={styles.simulationLabel}>Estimated Impact:</Text>
                  <Text style={styles.simulationValue}>{simulationResult.estimatedImpact}</Text>
                </View>
                
                <View style={styles.simulationItem}>
                  <Text style={styles.simulationLabel}>Time to Detection:</Text>
                  <Text style={styles.simulationValue}>{simulationResult.timeToDetection.toFixed(1)} min</Text>
                </View>
                
                <View style={styles.simulationItem}>
                  <Text style={styles.simulationLabel}>False Positive Risk:</Text>
                  <Text style={styles.simulationValue}>{simulationResult.falsePositiveRisk}%</Text>
                </View>
                
                <View style={styles.simulationItem}>
                  <Text style={styles.simulationLabel}>Confidence:</Text>
                  <Text style={styles.simulationValue}>{simulationResult.confidence}%</Text>
                </View>
              </View>
            )}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subscriptionPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  promptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  promptSubtitle: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 30,
  },
  pricingCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  priceDescription: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 5,
  },
  subscribeButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  simulationButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  simulationButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  metricsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 5,
  },
  issuesContainer: {
    flex: 1,
  },
  issuesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  noIssues: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noIssuesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
  },
  noIssuesSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 5,
  },
  issueCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  issueTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  issueDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 10,
    lineHeight: 18,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueTime: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  issueConfidence: {
    fontSize: 12,
    color: '#2196F3',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalBody: {
    padding: 20,
  },
  modalIssueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  modalIssueDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 20,
    lineHeight: 18,
  },
  fixesSection: {
    marginTop: 10,
  },
  fixesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  fixItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  fixText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginLeft: 10,
    flex: 1,
  },
  simulationResults: {
    padding: 20,
  },
  simulationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  simulationLabel: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  simulationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default StreamOpsProScreen;
