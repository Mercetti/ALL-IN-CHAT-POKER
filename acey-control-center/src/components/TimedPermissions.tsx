import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TimedPermissionsService, PermissionScope, TimedPermission } from '../services/timedPermissions';

interface TimedPermissionsProps {
  visible: boolean;
  onClose: () => void;
}

const TimedPermissions: React.FC<TimedPermissionsProps> = ({ visible, onClose }) => {
  const [permissions, setPermissions] = useState<TimedPermission[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedScope, setSelectedScope] = useState<PermissionScope>('AUTO_FIX_UI');
  const [durationHours, setDurationHours] = useState('2');
  const [reason, setReason] = useState('');
  const [granting, setGranting] = useState(false);
  
  const [permissionsService] = useState(() => TimedPermissionsService.getInstance());

  useEffect(() => {
    if (visible) {
      loadPermissions();
    }
  }, [visible]);

  const loadPermissions = async () => {
    try {
      setRefreshing(true);
      const activePermissions = await permissionsService.getActivePermissions();
      setPermissions(activePermissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGrantPermission = async () => {
    const hours = parseFloat(durationHours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration between 0.1 and 24 hours.');
      return;
    }

    setGranting(true);
    try {
      const result = await permissionsService.grantPermission({
        scope: selectedScope,
        expiresInHours: hours,
        reason: reason || undefined,
      });

      if (result) {
        Alert.alert('Success', 'Permission granted successfully');
        setShowGrantModal(false);
        setReason('');
        setDurationHours('2');
        loadPermissions();
      } else {
        Alert.alert('Error', 'Failed to grant permission');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to grant permission');
    } finally {
      setGranting(false);
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    Alert.alert(
      'Revoke Permission',
      'Are you sure you want to revoke this permission?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await permissionsService.revokePermission(permissionId);
              if (success) {
                loadPermissions();
              } else {
                Alert.alert('Error', 'Failed to revoke permission');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke permission');
            }
          },
        },
      ]
    );
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'HIGH': return '#F44336';
      case 'CRITICAL': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getRemainingTimeColor = (permission: TimedPermission) => {
    const remaining = permissionsService.getTimeUntilExpiry(permission);
    if (remaining <= 0) return '#F44336';
    if (permissionsService.isExpiringSoon(permission)) return '#FF9800';
    return '#4CAF50';
  };

  const templates = permissionsService.getPermissionTemplates();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Timed Permissions</Text>
          <TouchableOpacity onPress={loadPermissions}>
            <Icon name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadPermissions} />
          }
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Permissions</Text>
            
            {permissions.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="timer-off" size={48} color="#9E9E9E" />
                <Text style={styles.emptyText}>No active permissions</Text>
                <Text style={styles.emptySubtext}>Grant temporary permissions to authorize specific actions</Text>
              </View>
            ) : (
              permissions.map((permission) => (
                <View key={permission.id} style={styles.permissionCard}>
                  <View style={styles.permissionHeader}>
                    <View style={styles.permissionInfo}>
                      <Text style={styles.permissionName}>
                        {permissionsService.getPermissionDescription(permission.scope)}
                      </Text>
                      <View style={[styles.riskBadge, { backgroundColor: getRiskColor(permission.riskLevel) }]}>
                        <Text style={styles.riskText}>{permission.riskLevel}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.revokeButton}
                      onPress={() => handleRevokePermission(permission.id)}
                    >
                      <Icon name="close" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.permissionDetails}>
                    <Text style={styles.permissionMeta}>
                      Granted by: {permission.grantedBy}
                    </Text>
                    <Text style={[styles.remainingTime, { color: getRemainingTimeColor(permission) }]}>
                      {permissionsService.getRemainingTime(permission)} remaining
                    </Text>
                  </View>

                  {permission.renewable && (
                    <View style={styles.renewableBadge}>
                      <Icon name="autorenew" size={14} color="#4CAF50" />
                      <Text style={styles.renewableText}>Renewable</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Grant</Text>
            
            {templates.map((template) => (
              <TouchableOpacity
                key={template.scope}
                style={styles.templateCard}
                onPress={() => {
                  setSelectedScope(template.scope);
                  setDurationHours(template.defaultDuration.toString());
                  setShowGrantModal(true);
                }}
              >
                <View style={styles.templateHeader}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <View style={[styles.riskBadge, { backgroundColor: getRiskColor(template.riskLevel) }]}>
                    <Text style={styles.riskText}>{template.riskLevel}</Text>
                  </View>
                </View>
                <Text style={styles.templateDescription}>{template.description}</Text>
                <Text style={styles.templateDuration}>Default: {template.defaultDuration}h</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowGrantModal(true)}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal visible={showGrantModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Grant Permission</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Permission Type</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => {
                  // Show permission selector
                }}
              >
                <Text style={styles.selectorText}>
                  {permissionsService.getPermissionDescription(selectedScope)}
                </Text>
                <Icon name="arrow-drop-down" size={20} color="#9E9E9E" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Duration (hours)</Text>
              <TextInput
                style={styles.input}
                value={durationHours}
                onChangeText={setDurationHours}
                placeholder="Enter duration"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Reason (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="Enter reason for granting this permission"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowGrantModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.grantModalButton]}
                onPress={handleGrantPermission}
                disabled={granting}
              >
                {granting ? (
                  <Text style={styles.grantModalButtonText}>Granting...</Text>
                ) : (
                  <Text style={styles.grantModalButtonText}>Grant</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  permissionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  riskText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  revokeButton: {
    backgroundColor: '#F44336',
    borderRadius: 16,
    padding: 8,
  },
  permissionDetails: {
    marginBottom: 8,
  },
  permissionMeta: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  remainingTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  renewableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  renewableText: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 4,
  },
  templateCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  templateDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  templateDuration: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 12,
  },
  selectorText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
  grantModalButton: {
    backgroundColor: '#2196F3',
  },
  grantModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default TimedPermissions;
