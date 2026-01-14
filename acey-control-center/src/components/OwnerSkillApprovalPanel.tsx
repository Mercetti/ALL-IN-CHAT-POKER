// components/OwnerSkillApprovalPanel.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AceyMobileOrchestrator, UpdateProposal } from '../services/aceyMobileOrchestrator';
import OwnerSkillApproval from './OwnerSkillApproval';

interface OwnerSkillApprovalPanelProps {
  userToken: string;
  ownerToken: string;
}

export default function OwnerSkillApprovalPanel({ userToken, ownerToken }: OwnerSkillApprovalPanelProps) {
  const [proposals, setProposals] = useState<UpdateProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const orchestrator = new AceyMobileOrchestrator(userToken, ownerToken);

  useEffect(() => {
    const loadProposals = async () => {
      try {
        setLoading(true);
        const data = await orchestrator.getPendingProposals();
        setProposals(data);
      } catch (error) {
        console.error('Failed to load proposals:', error);
        Alert.alert('Error', 'Failed to load skill proposals');
      } finally {
        setLoading(false);
      }
    };
    loadProposals();
  }, [userToken, ownerToken]);

  const handleApprove = async (proposalId: string) => {
    try {
      setProcessing(proposalId);
      const result = await orchestrator.handleUpdateProposal(proposalId, 'approve');
      
      if (result.success) {
        Alert.alert('Success', 'Skill proposal approved successfully');
        setProposals(prev => prev.filter(p => p.id !== proposalId));
      } else {
        Alert.alert('Error', 'Failed to approve proposal');
      }
    } catch (error) {
      console.error('Failed to approve proposal:', error);
      Alert.alert('Error', 'Failed to approve proposal');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (proposalId: string, reason?: string) => {
    try {
      setProcessing(proposalId);
      const result = await orchestrator.handleUpdateProposal(proposalId, 'reject');
      
      if (result.success) {
        Alert.alert('Success', 'Skill proposal rejected successfully');
        setProposals(prev => prev.filter(p => p.id !== proposalId));
      } else {
        Alert.alert('Error', 'Failed to reject proposal');
      }
    } catch (error) {
      console.error('Failed to reject proposal:', error);
      Alert.alert('Error', 'Failed to reject proposal');
    } finally {
      setProcessing(null);
    }
  };

  const handleRequestRevision = async (proposalId: string) => {
    try {
      setProcessing(proposalId);
      const result = await orchestrator.handleUpdateProposal(proposalId, 'request_revision');
      
      if (result.success) {
        Alert.alert('Success', 'Revision requested successfully');
      } else {
        Alert.alert('Error', 'Failed to request revision');
      }
    } catch (error) {
      console.error('Failed to request revision:', error);
      Alert.alert('Error', 'Failed to request revision');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading skill proposals...</Text>
      </View>
    );
  }

  if (proposals.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pending Skill Proposals</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💡</Text>
          <Text style={styles.emptyText}>No pending proposals</Text>
          <Text style={styles.emptySubtext}>
            Acey's skill proposals and updates will appear here for your review
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Skill Proposals</Text>
      <Text style={styles.subtitle}>
        Review and approve Acey's suggested skills and updates
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {proposals.map((proposal) => (
          <View key={proposal.id} style={styles.proposalCard}>
            <View style={styles.proposalHeader}>
              <View style={styles.proposalInfo}>
                <Text style={styles.proposalTitle}>{proposal.skillId}</Text>
                <Text style={styles.proposalType}>
                  Type: {proposal.submittedBy === 'acey' ? 'AI-Generated' : 'User-Submitted'}
                </Text>
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: proposal.status === 'pending' ? '#FF9500' :
                               proposal.status === 'approved' ? '#34C759' :
                               proposal.status === 'rejected' ? '#FF3B30' : '#8E8E93'
              }]}>
                <Text style={styles.statusText}>{proposal.status.toUpperCase()}</Text>
              </View>
            </View>

            <Text style={styles.proposalDescription}>{proposal.suggestion}</Text>

            {proposal.metrics && (
              <View style={styles.metricsContainer}>
                <Text style={styles.metricsTitle}>Performance Metrics</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Usage</Text>
                    <Text style={styles.metricValue}>{proposal.metrics.usageCount}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Rating</Text>
                    <Text style={styles.metricValue}>{proposal.metrics.avgRating.toFixed(1)}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Approval</Text>
                    <Text style={styles.metricValue}>{(proposal.metrics.approvalRate * 100).toFixed(0)}%</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Error Rate</Text>
                    <Text style={styles.metricValue}>{(proposal.metrics.errorRate * 100).toFixed(1)}%</Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.submittedText}>
              Submitted {new Date(proposal.submittedAt).toLocaleDateString()} by {proposal.submittedBy}
            </Text>

            {proposal.status === 'pending' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(proposal.id)}
                  disabled={processing === proposal.id}
                >
                  <Text style={styles.buttonText}>
                    {processing === proposal.id ? 'Approving...' : '✅ Approve'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(proposal.id)}
                  disabled={processing === proposal.id}
                >
                  <Text style={styles.buttonText}>
                    {processing === proposal.id ? 'Rejecting...' : '❌ Reject'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.revisionButton]}
                  onPress={() => handleRequestRevision(proposal.id)}
                  disabled={processing === proposal.id}
                >
                  <Text style={styles.buttonText}>
                    {processing === proposal.id ? 'Requesting...' : '🔄 Request Revision'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  proposalCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  proposalInfo: {
    flex: 1,
    marginRight: 10,
  },
  proposalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  proposalType: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  proposalDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  metricsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  metricsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  metricLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  submittedText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  revisionButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
