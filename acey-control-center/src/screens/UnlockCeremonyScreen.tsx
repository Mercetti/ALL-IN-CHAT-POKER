import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getStoredDeviceId } from '../services/api';
import { BiometricAuthService, ApprovalRisk } from '../services/biometricAuth';

interface UnlockRequest {
  id: string;
  stage: 'BIOMETRIC_PENDING' | 'TIME_DELAY_PENDING' | 'DESKTOP_CONFIRMATION_PENDING' | 'INTEGRITY_CHECK_PENDING' | 'REHYDRATION_PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  created_at: number;
  expires_at: number;
  reason: string;
  results?: any;
}

interface IntegrityCheck {
  name: string;
  passed: boolean;
  details: string;
}

const UnlockCeremonyScreen: React.FC = ({ navigation }: any) => {
  const [currentRequest, setCurrentRequest] = useState<UnlockRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [timeDelay, setTimeDelay] = useState(0);
  const [integrityChecks, setIntegrityChecks] = useState<IntegrityCheck[]>([]);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const [biometricService] = useState(() => BiometricAuthService.getInstance());

  useEffect(() => {
    // Check for existing unlock request
    checkExistingRequest();
  }, []);

  useEffect(() => {
    if (timeDelay > 0) {
      const interval = setInterval(() => {
        setTimeDelay(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeDelay]);

  const checkExistingRequest = async () => {
    try {
      // This would check for existing unlock requests
      // const response = await apiGet('/unlock/status/current');
      // if (response.data) {
      //   setCurrentRequest(response.data);
      // }
    } catch (error) {
      console.error('Failed to check existing request:', error);
    }
  };

  const startUnlockCeremony = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the unlock request');
      return;
    }

    setLoading(true);
    try {
      const deviceId = await getStoredDeviceId();
      
      // This would call the actual API
      // const response = await apiPost('/unlock/request', {
      //   device_id: deviceId,
      //   owner_id: 'current_owner', // Would get from auth
      //   reason
      // });
      
      // Mock response
      const mockRequest: UnlockRequest = {
        id: `unlock_${Date.now()}`,
        stage: 'BIOMETRIC_PENDING',
        status: 'PENDING',
        created_at: Date.now(),
        expires_at: Date.now() + 300000, // 5 minutes
        reason
      };

      setCurrentRequest(mockRequest);
      setShowRequestModal(false);
      setReason('');
      
      // Start biometric authentication immediately
      setTimeout(() => {
        handleBiometricStage();
      }, 1000);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to start unlock ceremony');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricStage = async () => {
    if (!currentRequest) return;

    setBiometricLoading(true);
    try {
      const result = await biometricService.authenticateForApproval(
        'Unlock Ceremony',
        'CRITICAL'
      );

      if (result.success) {
        // Send biometric confirmation
        await sendBiometricConfirmation();
        // Start time delay
        setTimeDelay(60); // 60 seconds
      } else {
        Alert.alert('Error', 'Biometric authentication failed');
        setCurrentRequest(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication error');
    } finally {
      setBiometricLoading(false);
    }
  };

  const sendBiometricConfirmation = async () => {
    if (!currentRequest) return;

    try {
      // This would call the actual API
      // await apiPost('/unlock/biometric-confirm', {
      //   unlock_id: currentRequest.id,
      //   biometric_verified: true,
      //   device_id: await getStoredDeviceId(),
      //   timestamp: Date.now()
      // });

      // Update request stage
      setCurrentRequest({
        ...currentRequest,
        stage: 'TIME_DELAY_PENDING'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm biometric');
    }
  };

  const handleDesktopConfirmation = async () => {
    if (!currentRequest) return;

    try {
      // This would call the actual API
      // await apiPost('/unlock/desktop-confirm', {
      //   unlock_id: currentRequest.id,
      //   confirmed: true
      // });

      // Start integrity checks
      setCurrentRequest({
        ...currentRequest,
        stage: 'INTEGRITY_CHECK_PENDING'
      });

      // Mock integrity checks
      const mockChecks: IntegrityCheck[] = [
        { name: 'memory_corruption', passed: true, details: 'No corrupted memory entries' },
        { name: 'rule_validation', passed: true, details: 'All rules are valid' },
        { name: 'trust_graph_integrity', passed: true, details: 'Trust graph integrity is good' },
        { name: 'database_schema', passed: true, details: 'Database schema is complete' }
      ];

      setIntegrityChecks(mockChecks);
      setShowIntegrityModal(true);

      // Simulate integrity check completion
      setTimeout(() => {
        completeIntegrityChecks();
      }, 3000);

    } catch (error) {
      Alert.alert('Error', 'Failed to confirm desktop');
    }
  };

  const completeIntegrityChecks = async () => {
    if (!currentRequest) return;

    try {
      // This would call the actual API
      // const response = await apiPost('/unlock/integrity-check', {
      //   unlock_id: currentRequest.id
      // });

      // Mock response
      const allPassed = integrityChecks.every(check => check.passed);

      if (allPassed) {
        setCurrentRequest({
          ...currentRequest,
          stage: 'REHYDRATION_PENDING',
          results: integrityChecks
        });

        // Complete the unlock
        setTimeout(() => {
          completeUnlock();
        }, 2000);
      } else {
        setCurrentRequest({
          ...currentRequest,
          stage: 'INTEGRITY_CHECK_FAILED',
          status: 'FAILED',
          results: integrityChecks
        });
      }

    } catch (error) {
      Alert.alert('Error', 'Failed to complete integrity checks');
    }
  };

  const completeUnlock = async () => {
    if (!currentRequest) return;

    try {
      // This would call the actual API
      // await apiPost('/unlock/complete', {
      //   unlock_id: currentRequest.id,
      //   rehydration_mode: 'SAFE'
      // });

      setCurrentRequest({
        ...currentRequest,
        stage: 'COMPLETED',
        status: 'COMPLETED'
      });

      Alert.alert('Success', 'Unlock ceremony completed successfully');
      
      // Navigate back after delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);

    } catch (error) {
      Alert.alert('Error', 'Failed to complete unlock');
    }
  };

  const cancelUnlock = async () => {
    if (!currentRequest) return;

    try {
      // This would call the actual API
      // await apiPost(`/unlock/cancel/${currentRequest.id}`);

      setCurrentRequest(null);
      Alert.alert('Cancelled', 'Unlock ceremony cancelled');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel unlock');
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'BIOMETRIC_PENDING': return '#FF9800';
      case 'TIME_DELAY_PENDING': return '#2196F3';
      case 'DESKTOP_CONFIRMATION_PENDING': return '#9C27B0';
      case 'INTEGRITY_CHECK_PENDING': return '#4CAF50';
      case 'REHYDRATION_PENDING': return '#00BCD4';
      case 'COMPLETED': return '#4CAF50';
      case 'FAILED': return '#F44336';
      case 'CANCELLED': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'BIOMETRIC_PENDING': return 'fingerprint';
      case 'TIME_DELAY_PENDING': return 'timer';
      case 'DESKTOP_CONFIRMATION_PENDING': return 'desktop-windows';
      case 'INTEGRITY_CHECK_PENDING': return 'security';
      case 'REHYDRATION_PENDING': return 'restore';
      case 'COMPLETED': return 'check-circle';
      case 'FAILED': return 'error';
      case 'CANCELLED': return 'cancel';
      default: return 'help';
    }
  };

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'BIOMETRIC_PENDING': return 'Biometric Authentication';
      case 'TIME_DELAY_PENDING': return 'Time Delay';
      case 'DESKTOP_CONFIRMATION_PENDING': return 'Desktop Confirmation';
      case 'INTEGRITY_CHECK_PENDING': return 'Integrity Check';
      case 'REHYDRATION_PENDING': return 'System Rehydration';
      case 'COMPLETED': return 'Unlock Complete';
      case 'FAILED': return 'Unlock Failed';
      case 'CANCELLED': return 'Unlock Cancelled';
      default: return 'Unknown Stage';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Unlock Ceremony</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {!currentRequest ? (
          <View style={styles.noRequestContainer}>
            <Icon name="lock" size={64} color="#9E9E9E" />
            <Text style={styles.noRequestTitle}>No Active Unlock Request</Text>
            <Text style={styles.noRequestDescription}>
              Start an unlock ceremony to restore system access after an emergency lock or trust collapse.
            </Text>
            
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setShowRequestModal(true)}
            >
              <Icon name="lock-open" size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Unlock Ceremony</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ceremonyContainer}>
            <View style={styles.requestInfo}>
              <Text style={styles.requestTitle}>Unlock Request Active</Text>
              <Text style={styles.requestReason}>Reason: {currentRequest.reason}</Text>
              <Text style={styles.requestTime}>
                Started: {new Date(currentRequest.created_at).toLocaleString()}
              </Text>
              <Text style={styles.requestExpiry}>
                Expires: {new Date(currentRequest.expires_at).toLocaleString()}
              </Text>
            </View>

            <View style={styles.stagesContainer}>
              <Text style={styles.stagesTitle}>Ceremony Progress</Text>
              
              {[
                'BIOMETRIC_PENDING',
                'TIME_DELAY_PENDING', 
                'DESKTOP_CONFIRMATION_PENDING',
                'INTEGRITY_CHECK_PENDING',
                'REHYDRATION_PENDING',
                'COMPLETED'
              ].map((stage, index) => {
                  const isCompleted = getStageIndex(stage) < getStageIndex(currentRequest.stage);
                  const isCurrent = stage === currentRequest.stage;
                  
                  return (
                    <View key={stage} style={styles.stageContainer}>
                      <View style={styles.stageHeader}>
                        <View style={[
                          styles.stageIcon,
                          { backgroundColor: isCompleted ? '#4CAF50' : isCurrent ? getStageColor(stage) : '#333333' }
                        ]}>
                          <Icon 
                            name={getStageIcon(stage)} 
                            size={24} 
                            color="#FFFFFF" 
                          />
                        </View>
                        <View style={styles.stageInfo}>
                          <Text style={styles.stageTitle}>{getStageTitle(stage)}</Text>
                          <Text style={styles.stageDescription}>
                            {getStageDescription(stage)}
                          </Text>
                        </View>
                        {isCompleted && (
                          <Icon name="check-circle" size={24} color="#4CAF50" />
                        )}
                      </View>
                      
                      {isCurrent && (
                        <View style={styles.currentStageContent}>
                          {stage === 'BIOMETRIC_PENDING' && biometricLoading && (
                            <View style={styles.biometricContent}>
                              <ActivityIndicator size="large" color="#2196F3" />
                              <Text style={styles.biometricText}>Authenticating...</Text>
                            </View>
                          )}
                          
                          {stage === 'TIME_DELAY_PENDING' && timeDelay > 0 && (
                            <View style={styles.timeDelayContent}>
                              <Icon name="timer" size={32} color="#2196F3" />
                              <Text style={styles.timeDelayText}>
                                Time remaining: {formatTime(timeDelay)}
                              </Text>
                              <Text style={styles.timeDelayDescription}>
                                Prevents panic unlocks. Please wait...
                              </Text>
                            </View>
                          )}
                          
                          {stage === 'DESKTOP_CONFIRMATION_PENDING' && (
                            <View style={styles.desktopContent}>
                              <Icon name="desktop-windows" size={32} color="#9C27B0" />
                              <Text style={styles.desktopText}>
                                Desktop confirmation required
                              </Text>
                              <TouchableOpacity
                                style={styles.desktopButton}
                                onPress={handleDesktopConfirmation}
                              >
                                <Text style={styles.desktopButtonText}>Confirm on Desktop</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                          
                          {stage === 'INTEGRITY_CHECK_PENDING' && (
                            <View style={styles.integrityContent}>
                              <Icon name="security" size={32} color="#4CAF50" />
                              <Text style={styles.integrityText}>
                                Running system integrity checks...
                              </Text>
                            </View>
                          )}
                          
                          {stage === 'REHYDRATION_PENDING' && (
                            <View style={styles.rehydrationContent}>
                              <Icon name="restore" size={32} color="#00BCD4" />
                              <Text style={styles.rehydrationText}>
                                Restoring system to safe mode...
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
            </View>

            {(currentRequest.stage === 'FAILED' || currentRequest.stage === 'CANCELLED') && (
              <View style={styles.failedContainer}>
                <Icon name="error" size={32} color="#F44336" />
                <Text style={styles.failedTitle}>
                  Unlock {currentRequest.status.toLowerCase()}
                </Text>
                {currentRequest.results && (
                  <Text style={styles.failedDetails}>
                    {JSON.stringify(currentRequest.results, null, 2)}
                  </Text>
                )}
              </View>
            )}

            {currentRequest.status === 'PENDING' && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelUnlock}
              >
                <Icon name="cancel" size={20} color="#FFFFFF" />
                <Text style={styles.cancelButtonText}>Cancel Unlock</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Start Unlock Modal */}
      <Modal visible={showRequestModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Start Unlock Ceremony</Text>
            
            <Text style={styles.modalDescription}>
              This will begin a multi-stage security ceremony to restore system access. 
              This process requires biometric authentication and may take several minutes.
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Reason for Unlock</Text>
              <TextInput
                style={styles.textInput}
                value={reason}
                onChangeText={setReason}
                placeholder="Enter reason (e.g., Emergency lock, Trust collapse)"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowRequestModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.startModalButton]}
                onPress={startUnlockCeremony}
                disabled={loading || !reason.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.startModalButtonText}>Start Ceremony</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Integrity Check Results Modal */}
      <Modal visible={showIntegrityModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Integrity Check Results</Text>
            
            {integrityChecks.map((check, index) => (
              <View key={index} style={styles.checkResult}>
                <Icon 
                  name={check.passed ? "check-circle" : "error"} 
                  size={24} 
                  color={check.passed ? "#4CAF50" : "#F44336"} 
                />
                <View style={styles.checkInfo}>
                  <Text style={styles.checkName}>{check.name}</Text>
                  <Text style={styles.checkDetails}>{check.details}</Text>
                </View>
              </View>
            ))}
            
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowIntegrityModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStageIndex = (stage: string): number => {
  const stages = [
    'BIOMETRIC_PENDING',
    'TIME_DELAY_PENDING',
    'DESKTOP_CONFIRMATION_PENDING',
    'INTEGRITY_CHECK_PENDING',
    'REHYDRATION_PENDING',
    'COMPLETED'
  ];
  return stages.indexOf(stage);
};

const getStageDescription = (stage: string): string => {
  switch (stage) {
    case 'BIOMETRIC_PENDING': return 'Verify your identity with biometric authentication';
    case 'TIME_DELAY_PENDING': return 'Security delay to prevent panic unlocks';
    case 'DESKTOP_CONFIRMATION_PENDING': return 'Confirm unlock on desktop control center';
    case 'INTEGRITY_CHECK_PENDING': return 'Verify system integrity and security';
    case 'REHYDRATION_PENDING': return 'Gradually restore system functionality';
    case 'COMPLETED': return 'System successfully unlocked and restored';
    default: return 'Unknown stage';
  }
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
  noRequestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noRequestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  noRequestDescription: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ceremonyContainer: {
    flex: 1,
  },
  requestInfo: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  requestReason: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  requestTime: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  requestExpiry: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  stagesContainer: {
    marginBottom: 24,
  },
  stagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  stageContainer: {
    marginBottom: 24,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stageInfo: {
    flex: 1,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stageDescription: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  currentStageContent: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  biometricContent: {
    alignItems: 'center',
  },
  biometricText: {
    fontSize: 16,
    color: '#2196F3',
    marginTop: 12,
  },
  timeDelayContent: {
    alignItems: 'center',
  },
  timeDelayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 12,
    marginBottom: 4,
  },
  timeDelayDescription: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  desktopContent: {
    alignItems: 'center',
  },
  desktopText: {
    fontSize: 16,
    color: '#9C27B0',
    marginTop: 12,
    marginBottom: 16,
  },
  desktopButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  desktopButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  integrityContent: {
    alignItems: 'center',
  },
  integrityText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 12,
  },
  rehydrationContent: {
    alignItems: 'center',
  },
  rehydrationText: {
    fontSize: 16,
    color: '#00BCD4',
    marginTop: 12,
  },
  failedContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  failedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 12,
    marginBottom: 8,
  },
  failedDetails: {
    fontSize: 12,
    color: '#E0E0E0',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
  },
  cancelButtonText: {
    fontSize: 16,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 20,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#333333',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  startModalButton: {
    backgroundColor: '#2196F3',
  },
  startModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  checkResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    marginBottom: 8,
  },
  checkInfo: {
    flex: 1,
    marginLeft: 12,
  },
  checkName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  checkDetails: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  closeModalButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default UnlockCeremonyScreen;
