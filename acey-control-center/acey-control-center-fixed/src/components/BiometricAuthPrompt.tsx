import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BiometricAuthService, ApprovalRisk } from '../services/biometricAuth';

interface BiometricAuthPromptProps {
  visible: boolean;
  action: string;
  risk: ApprovalRisk;
  onConfirm: (success: boolean) => void;
  onCancel: () => void;
}

const BiometricAuthPrompt: React.FC<BiometricAuthPromptProps> = ({
  visible,
  action,
  risk,
  onConfirm,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricService] = useState(() => BiometricAuthService.getInstance());

  useEffect(() => {
    if (visible) {
      setError(null);
      setIsLoading(false);
    }
  }, [visible]);

  const getRiskColor = (risk: ApprovalRisk) => {
    switch (risk) {
      case 'LOW': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'HIGH': return '#F44336';
      case 'CRITICAL': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getRiskIcon = (risk: ApprovalRisk) => {
    switch (risk) {
      case 'LOW': return 'check-circle';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'dangerous';
      default: return 'help';
    }
  };

  const getRiskDescription = (risk: ApprovalRisk) => {
    switch (risk) {
      case 'LOW': return 'Low risk action';
      case 'MEDIUM': return 'Medium risk action';
      case 'HIGH': return 'High risk action - biometric required';
      case 'CRITICAL': return 'Critical risk action - biometric with cooldown required';
      default: return 'Unknown risk level';
    }
  };

  const handleAuthenticate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await biometricService.authenticateForApproval(action, risk);
      
      if (result.success) {
        onConfirm(true);
      } else {
        setError(result.error || 'Authentication failed');
        onConfirm(false);
      }
    } catch (error) {
      setError('Authentication error occurred');
      onConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getCooldownStatus = () => {
    const status = biometricService.getCooldownStatus(risk);
    return status;
  };

  const cooldownStatus = getCooldownStatus();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Icon 
              name={getRiskIcon(risk)} 
              size={32} 
              color={getRiskColor(risk)} 
            />
            <Text style={styles.title}>Biometric Authentication Required</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.actionText}>{action}</Text>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(risk) }]}>
              <Text style={styles.riskText}>{risk.toUpperCase()}</Text>
            </View>
            <Text style={styles.riskDescription}>{getRiskDescription(risk)}</Text>

            {cooldownStatus.isInCooldown && (
              <View style={styles.cooldownWarning}>
                <Icon name="timer" size={20} color="#FF9800" />
                <Text style={styles.cooldownText}>
                  Cooldown active: {cooldownStatus.remainingTime}
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Icon name="error" size={20} color="#F44336" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Why biometric auth?</Text>
              <Text style={styles.infoText}>
                This action requires biometric confirmation to prevent unauthorized access and ensure secure governance of the Acey AI system.
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button, 
                styles.confirmButton,
                { backgroundColor: cooldownStatus.isInCooldown ? '#9E9E9E' : getRiskColor(risk) }
              ]}
              onPress={handleAuthenticate}
              disabled={isLoading || cooldownStatus.isInCooldown}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="fingerprint" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.confirmButtonText}>
                {cooldownStatus.isInCooldown ? 'Cooldown Active' : 'Authenticate'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
  },
  content: {
    marginBottom: 24,
  },
  actionText: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  riskBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  riskText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  riskDescription: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 16,
  },
  cooldownWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cooldownText: {
    fontSize: 14,
    color: '#FF9800',
    marginLeft: 8,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  infoContainer: {
    backgroundColor: '#2C2C2C',
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#E0E0E0',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#333333',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default BiometricAuthPrompt;
