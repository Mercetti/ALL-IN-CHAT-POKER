import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Approval } from '../types/api';

interface ApprovalItemProps {
  approval: Approval;
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
  isLoading?: boolean;
}

const ApprovalItem: React.FC<ApprovalItemProps> = ({
  approval,
  onApprove,
  onReject,
  isLoading = false,
}) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      case 'critical': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return 'check-circle';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'dangerous';
      default: return 'help';
    }
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Action',
      `Are you sure you want to approve: ${approval.action}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          style: 'destructive',
          onPress: () => onApprove(approval.approvalId)
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Action',
      `Are you sure you want to reject: ${approval.action}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: () => onReject(approval.approvalId)
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.action}>{approval.action}</Text>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(approval.risk) }]}>
            <Icon 
              name={getRiskIcon(approval.risk)} 
              size={16} 
              color="#FFFFFF" 
            />
            <Text style={styles.riskText}>{approval.risk.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.timestamp}>
          {new Date(approval.timestamp).toLocaleString()}
        </Text>
      </View>

      <Text style={styles.reason}>{approval.reason}</Text>

      {approval.context && (
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Context:</Text>
          <Text style={styles.contextText}>
            {JSON.stringify(approval.context, null, 2)}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleReject}
          disabled={isLoading}
        >
          <Icon name="close" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={handleApprove}
          disabled={isLoading}
        >
          <Icon name="check" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  action: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  riskText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  reason: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 20,
    marginBottom: 12,
  },
  contextContainer: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9E9E9E',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 12,
    color: '#E0E0E0',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ApprovalItem;
