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
import { getApprovals, processApproval } from '../services/api';
import { useAceyStore } from '../state/aceyStore';

interface Approval {
  approvalId: string;
  action: string;
  risk: number;
  reason: string;
  timestamp: number;
}

const ApprovalsScreen: React.FC = ({ navigation }: any) => {
  const { setLoading, setError } = useAceyStore();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await getApprovals();
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setApprovals(response.data.pending);
        setError(null);
      }
    } catch (error) {
      setError('Failed to load approvals');
      console.error('Approvals load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApprovals();
    setRefreshing(false);
  };

  const handleApproval = async (approvalId: string, approved: boolean) => {
    try {
      setLoading(true);
      const response = await processApproval(approvalId, approved);
      
      if (response.error) {
        setError(response.error);
        Alert.alert('Error', response.error);
      } else {
        // Remove the approved/denied item from the list
        setApprovals(prev => prev.filter(a => a.approvalId !== approvalId));
        Alert.alert(
          'Success',
          approved ? 'Action approved successfully' : 'Action denied'
        );
      }
    } catch (error) {
      setError('Failed to process approval');
      Alert.alert('Error', 'Failed to process approval');
      console.error('Approval processing error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return '#4CAF50';
    if (risk < 0.6) return '#FF9800';
    return '#F44336';
  };

  const getRiskText = (risk: number) => {
    if (risk < 0.3) return 'Low';
    if (risk < 0.6) return 'Medium';
    return 'High';
  };

  const formatAction = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Pending Approvals</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {approvals.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="check-circle" size={64} color="#4CAF50" />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>No pending approvals</Text>
          </View>
        ) : (
          approvals.map((approval) => (
            <View key={approval.approvalId} style={styles.approvalCard}>
              <View style={styles.approvalHeader}>
                <Text style={styles.actionTitle}>
                  {formatAction(approval.action)}
                </Text>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(approval.risk) }]}>
                  <Text style={styles.riskText}>
                    {getRiskText(approval.risk)} ({Math.round(approval.risk * 100)}%)
                  </Text>
                </View>
              </View>

              <Text style={styles.reason}>{approval.reason}</Text>
              
              <View style={styles.approvalFooter}>
                <Text style={styles.timestamp}>
                  {new Date(approval.timestamp).toLocaleString()}
                </Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.denyButton]}
                    onPress={() => handleApproval(approval.approvalId, false)}
                  >
                    <Icon name="close" size={16} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Deny</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleApproval(approval.approvalId, true)}
                  >
                    <Icon name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9E9E9E',
    marginTop: 8,
  },
  approvalCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reason: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 16,
    lineHeight: 20,
  },
  approvalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  denyButton: {
    backgroundColor: '#F44336',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
});

export default ApprovalsScreen;
