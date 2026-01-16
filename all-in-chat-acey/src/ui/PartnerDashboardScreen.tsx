import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EarningsData {
  totalEarnings: number;
  pendingEarnings: number;
  lastPayout: number;
  lastPayoutDate: string;
  monthlyEarnings: Array<{month: string, amount: number}>;
  skillEarnings: Array<{skill: string, amount: number, percentage: number}>;
}

interface PayoutRequest {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'failed';
  createdAt: string;
  processedAt?: string;
  estimatedDelivery?: string;
}

interface TrustMetrics {
  score: number;
  disputes: number;
  resolvedDisputes: number;
  averageRating: number;
  totalJobs: number;
  successRate: number;
}

interface Props {
  partnerId: string;
  onRequestPayout: (amount: number) => void;
  onViewDispute: (disputeId: string) => void;
}

export const PartnerDashboardScreen: React.FC<Props> = ({ 
  partnerId, 
  onRequestPayout, 
  onViewDispute 
}) => {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [trustMetrics, setTrustMetrics] = useState<TrustMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'earnings' | 'payouts' | 'trust'>('earnings');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock API calls - replace with actual API
      const mockEarnings: EarningsData = {
        totalEarnings: 15420.50,
        pendingEarnings: 2850.75,
        lastPayout: 3250.00,
        lastPayoutDate: '2024-01-01',
        monthlyEarnings: [
          { month: 'Jan', amount: 3250.00 },
          { month: 'Feb', amount: 2890.50 },
          { month: 'Mar', amount: 3420.00 },
          { month: 'Apr', amount: 3100.00 },
          { month: 'May', amount: 2850.75 },
        ],
        skillEarnings: [
          { skill: 'Code Helper', amount: 6250.00, percentage: 40.5 },
          { skill: 'Audio Maestro', amount: 4120.50, percentage: 26.7 },
          { skill: 'Graphics Wizard', amount: 3550.00, percentage: 23.0 },
          { skill: 'Analytics & Reporting', amount: 1500.00, percentage: 9.8 },
        ]
      };

      const mockPayouts: PayoutRequest[] = [
        {
          id: 'payout_1',
          amount: 2850.75,
          currency: 'USD',
          status: 'pending',
          createdAt: '2024-05-15T10:30:00Z',
          estimatedDelivery: '2024-05-18'
        },
        {
          id: 'payout_2',
          amount: 3250.00,
          currency: 'USD',
          status: 'paid',
          createdAt: '2024-04-15T10:30:00Z',
          processedAt: '2024-04-18T14:22:00Z'
        },
        {
          id: 'payout_3',
          amount: 3100.00,
          currency: 'USD',
          status: 'paid',
          createdAt: '2024-03-15T10:30:00Z',
          processedAt: '2024-03-18T11:45:00Z'
        }
      ];

      const mockTrustMetrics: TrustMetrics = {
        score: 92,
        disputes: 2,
        resolvedDisputes: 2,
        averageRating: 4.8,
        totalJobs: 156,
        successRate: 98.7
      };

      setEarnings(mockEarnings);
      setPayouts(mockPayouts);
      setTrustMetrics(mockTrustMetrics);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleRequestPayout = () => {
    if (!earnings?.pendingEarnings || earnings.pendingEarnings < 50) {
      Alert.alert('Insufficient Balance', 'You need at least $50 in pending earnings to request a payout.');
      return;
    }

    Alert.alert(
      'Request Payout',
      `Request $${earnings.pendingEarnings.toFixed(2)} payout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request', 
          onPress: () => {
            onRequestPayout(earnings.pendingEarnings);
            Alert.alert('Success', 'Payout request submitted');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#3B82F6';
      case 'processing': return '#8B5CF6';
      case 'paid': return '#10B981';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    if (score >= 50) return '#EF4444';
    return '#6B7280';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderEarningsOverview = () => {
    if (!earnings) return null;

    return (
      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>Earnings Overview</Text>
        
        <View style={styles.earningsGrid}>
          <View style={styles.earningItem}>
            <Text style={styles.earningValue}>{formatCurrency(earnings.totalEarnings)}</Text>
            <Text style={styles.earningLabel}>Total Earnings</Text>
          </View>
          <View style={styles.earningItem}>
            <Text style={styles.earningValue}>{formatCurrency(earnings.pendingEarnings)}</Text>
            <Text style={styles.earningLabel}>Pending</Text>
          </View>
          <View style={styles.earningItem}>
            <Text style={styles.earningValue}>{formatCurrency(earnings.lastPayout)}</Text>
            <Text style={styles.earningLabel}>Last Payout</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.payoutButton}
          onPress={handleRequestPayout}
          disabled={!earnings.pendingEarnings || earnings.pendingEarnings < 50}
        >
          <Text style={styles.payoutButtonText}>
            💰 Request Payout ({formatCurrency(earnings.pendingEarnings)})
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSkillEarnings = () => {
    if (!earnings) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Earnings by Skill</Text>
        
        {earnings.skillEarnings.map((skill, index) => (
          <View key={skill.skill} style={styles.skillEarningItem}>
            <View style={styles.skillEarningInfo}>
              <Text style={styles.skillEarningName}>{skill.skill}</Text>
              <Text style={styles.skillEarningAmount}>{formatCurrency(skill.amount)}</Text>
            </View>
            <View style={styles.skillEarningBar}>
              <View style={[styles.skillEarningProgress, { width: `${skill.percentage}%` }]} />
              <Text style={styles.skillEarningPercentage}>{skill.percentage}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderMonthlyTrend = () => {
    if (!earnings) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Trend</Text>
        
        <View style={styles.monthlyChart}>
          {earnings.monthlyEarnings.map((month, index) => {
            const maxAmount = Math.max(...earnings.monthlyEarnings.map(m => m.amount));
            const height = (month.amount / maxAmount) * 100;
            
            return (
              <View key={month.month} style={styles.monthlyBar}>
                <View style={[styles.monthlyBarFill, { height: `${height}%` }]} />
                <Text style={styles.monthlyLabel}>{month.month}</Text>
                <Text style={styles.monthlyValue}>{formatCurrency(month.amount)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPayouts = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Payout History</Text>
      
      {payouts.map((payout) => (
        <View key={payout.id} style={styles.payoutItem}>
          <View style={styles.payoutHeader}>
            <Text style={styles.payoutAmount}>{formatCurrency(payout.amount)}</Text>
            <View style={[styles.payoutStatus, { backgroundColor: getStatusColor(payout.status) }]}>
              <Text style={styles.payoutStatusText}>{payout.status.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.payoutDate}>
            Created: {formatDate(payout.createdAt)}
          </Text>
          
          {payout.processedAt && (
            <Text style={styles.payoutDate}>
              Processed: {formatDate(payout.processedAt)}
            </Text>
          )}
          
          {payout.estimatedDelivery && (
            <Text style={styles.payoutDelivery}>
              Est. Delivery: {formatDate(payout.estimatedDelivery)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderTrustMetrics = () => {
    if (!trustMetrics) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trust & Performance</Text>
        
        <View style={styles.trustScoreContainer}>
          <View style={[styles.trustScore, { backgroundColor: getTrustScoreColor(trustMetrics.score) }]}>
            <Text style={styles.trustScoreText}>{trustMetrics.score}</Text>
          </View>
          <Text style={styles.trustScoreLabel}>Trust Score</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{trustMetrics.totalJobs}</Text>
            <Text style={styles.metricLabel}>Total Jobs</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{trustMetrics.successRate}%</Text>
            <Text style={styles.metricLabel}>Success Rate</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{trustMetrics.averageRating}</Text>
            <Text style={styles.metricLabel}>Avg Rating</Text>
          </View>
        </View>

        <View style={styles.disputeSection}>
          <Text style={styles.disputeTitle}>Dispute Resolution</Text>
          <Text style={styles.disputeText}>
            {trustMetrics.resolvedDisputes} of {trustMetrics.disputes} disputes resolved
          </Text>
        </View>
      </View>
    );
  };

  const renderTabButton = (tab: typeof selectedTab, label: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === tab && styles.activeTabButton
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={[
        styles.tabButtonText,
        selectedTab === tab && styles.activeTabButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Partner Dashboard</Text>
        <Text style={styles.subtitle}>Manage your earnings and performance</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('earnings', 'Earnings')}
        {renderTabButton('payouts', 'Payouts')}
        {renderTabButton('trust', 'Trust')}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'earnings' && (
          <>
            {renderEarningsOverview()}
            {renderSkillEarnings()}
            {renderMonthlyTrend()}
          </>
        )}
        
        {selectedTab === 'payouts' && renderPayouts()}
        
        {selectedTab === 'trust' && renderTrustMetrics()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeTabButton: {
    backgroundColor: '#3B82F6',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  earningsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  earningItem: {
    alignItems: 'center',
    flex: 1,
  },
  earningValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  earningLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  payoutButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skillEarningItem: {
    marginBottom: 16,
  },
  skillEarningInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skillEarningName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  skillEarningAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  skillEarningBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillEarningProgress: {
    height: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    marginRight: 12,
    flex: 1,
  },
  skillEarningPercentage: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  monthlyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  monthlyBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  monthlyBarFill: {
    width: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  monthlyLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  monthlyValue: {
    fontSize: 10,
    color: '#111827',
    fontWeight: '500',
  },
  payoutItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  payoutStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  payoutStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  payoutDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  payoutDelivery: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  trustScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trustScore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trustScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  trustScoreLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  disputeSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  disputeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  disputeText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
