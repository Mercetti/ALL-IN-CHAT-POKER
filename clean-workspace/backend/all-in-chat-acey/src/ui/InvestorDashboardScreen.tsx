import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface InvestorMetrics {
  totalRevenue: number;
  monthlyGrowth: number;
  annualGrowth: number;
  activeUsers: number;
  totalUsers: number;
  churnRate: number;
  ltv: number;
  cac: number;
  mrr: number;
  arr: number;
  grossMargin: number;
  netMargin: number;
}

interface TierBreakdown {
  tier: string;
  users: number;
  revenue: number;
  growth: number;
  churnRate: number;
}

interface SkillPerformance {
  skill: string;
  revenue: number;
  usage: number;
  growth: number;
  roi: number;
}

interface ForecastData {
  period: string;
  projectedRevenue: number;
  projectedUsers: number;
  confidence: number;
}

interface Props {
  investorId: string;
  onDownloadReport: (reportType: string) => void;
  onRequestMeeting: () => void;
}

export const InvestorDashboardScreen: React.FC<Props> = ({ 
  investorId, 
  onDownloadReport, 
  onRequestMeeting 
}) => {
  const [metrics, setMetrics] = useState<InvestorMetrics | null>(null);
  const [tierBreakdown, setTierBreakdown] = useState<TierBreakdown[]>([]);
  const [skillPerformance, setSkillPerformance] = useState<SkillPerformance[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadInvestorData();
  }, [selectedPeriod]);

  const loadInvestorData = async () => {
    setLoading(true);
    try {
      // Mock API calls - replace with actual API
      const mockMetrics: InvestorMetrics = {
        totalRevenue: 2847500,
        monthlyGrowth: 15.3,
        annualGrowth: 185.7,
        activeUsers: 12450,
        totalUsers: 28930,
        churnRate: 3.2,
        ltv: 2850,
        cac: 450,
        mrr: 125000,
        arr: 1500000,
        grossMargin: 78.5,
        netMargin: 23.8
      };

      const mockTierBreakdown: TierBreakdown[] = [
        {
          tier: 'Free',
          users: 18930,
          revenue: 0,
          growth: 8.5,
          churnRate: 12.3
        },
        {
          tier: 'Pro',
          users: 8950,
          revenue: 259550,
          growth: 18.2,
          churnRate: 4.1
        },
        {
          tier: 'Creator+',
          users: 1020,
          revenue: 100980,
          growth: 22.7,
          churnRate: 2.3
        },
        {
          tier: 'Enterprise',
          users: 30,
          revenue: 179000,
          growth: 45.0,
          churnRate: 0.0
        }
      ];

      const mockSkillPerformance: SkillPerformance[] = [
        {
          skill: 'Code Helper',
          revenue: 892000,
          usage: 15420,
          growth: 12.5,
          roi: 3.2
        },
        {
          skill: 'Audio Maestro',
          revenue: 645000,
          usage: 8920,
          growth: 18.7,
          roi: 2.8
        },
        {
          skill: 'Graphics Wizard',
          revenue: 712000,
          usage: 11250,
          growth: 15.3,
          roi: 3.5
        },
        {
          skill: 'Analytics & Reporting',
          revenue: 598500,
          usage: 6780,
          growth: 22.1,
          roi: 4.1
        }
      ];

      const mockForecast: ForecastData[] = [
        { period: 'Jun 2024', projectedRevenue: 142000, projectedUsers: 13100, confidence: 85 },
        { period: 'Jul 2024', projectedRevenue: 158000, projectedUsers: 13800, confidence: 82 },
        { period: 'Aug 2024', projectedRevenue: 175000, projectedUsers: 14600, confidence: 78 },
        { period: 'Sep 2024', projectedRevenue: 194000, projectedUsers: 15500, confidence: 75 },
        { period: 'Oct 2024', projectedRevenue: 214000, projectedUsers: 16500, confidence: 72 },
        { period: 'Nov 2024', projectedRevenue: 236000, projectedUsers: 17600, confidence: 68 }
      ];

      setMetrics(mockMetrics);
      setTierBreakdown(mockTierBreakdown);
      setSkillPerformance(mockSkillPerformance);
      setForecast(mockForecast);
    } catch (error) {
      Alert.alert('Error', 'Failed to load investor data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvestorData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? '#10B981' : growth < 0 ? '#EF4444' : '#6B7280';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10B981';
    if (confidence >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const renderKeyMetrics = () => {
    if (!metrics) return null;

    return (
      <View style={styles.metricsCard}>
        <Text style={styles.cardTitle}>Key Performance Indicators</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatCurrency(metrics.mrr)}</Text>
            <Text style={styles.metricLabel}>MRR</Text>
            <Text style={[styles.metricGrowth, { color: getGrowthColor(metrics.monthlyGrowth) }]}>
              {metrics.monthlyGrowth > 0 ? '+' : ''}{metrics.monthlyGrowth}%
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatCurrency(metrics.arr)}</Text>
            <Text style={styles.metricLabel}>ARR</Text>
            <Text style={[styles.metricGrowth, { color: getGrowthColor(metrics.annualGrowth) }]}>
              {metrics.annualGrowth > 0 ? '+' : ''}{metrics.annualGrowth}%
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatNumber(metrics.activeUsers)}</Text>
            <Text style={styles.metricLabel}>Active Users</Text>
            <Text style={styles.metricGrowth}>↑ 12.5%</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.churnRate}%</Text>
            <Text style={styles.metricLabel}>Churn Rate</Text>
            <Text style={[styles.metricGrowth, { color: '#10B981' }]}>↓ 0.8%</Text>
          </View>
        </View>

        <View style={styles.secondaryMetrics}>
          <View style={styles.secondaryMetric}>
            <Text style={styles.secondaryMetricValue}>{formatCurrency(metrics.ltv)}</Text>
            <Text style={styles.secondaryMetricLabel}>LTV</Text>
          </View>
          <View style={styles.secondaryMetric}>
            <Text style={styles.secondaryMetricValue}>{formatCurrency(metrics.cac)}</Text>
            <Text style={styles.secondaryMetricLabel}>CAC</Text>
          </View>
          <View style={styles.secondaryMetric}>
            <Text style={styles.secondaryMetricValue}>{metrics.grossMargin}%</Text>
            <Text style={styles.secondaryMetricLabel}>Gross Margin</Text>
          </View>
          <View style={styles.secondaryMetric}>
            <Text style={styles.secondaryMetricValue}>{metrics.netMargin}%</Text>
            <Text style={styles.secondaryMetricLabel}>Net Margin</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTierBreakdown = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Revenue by Tier</Text>
      
      {tierBreakdown.map((tier) => (
        <View key={tier.tier} style={styles.tierItem}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierName}>{tier.tier}</Text>
            <Text style={styles.tierRevenue}>{formatCurrency(tier.revenue)}</Text>
          </View>
          
          <View style={styles.tierStats}>
            <Text style={styles.tierUsers}>{formatNumber(tier.users)} users</Text>
            <Text style={[styles.tierGrowth, { color: getGrowthColor(tier.growth) }]}>
              {tier.growth > 0 ? '+' : ''}{tier.growth}% growth
            </Text>
            <Text style={styles.tierChurn}>{tier.churnRate}% churn</Text>
          </View>
          
          <View style={styles.tierBar}>
            <View style={[styles.tierBarFill, { width: `${(tier.users / metrics!.totalUsers) * 100}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderSkillPerformance = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Top Performing Skills</Text>
      
      {skillPerformance.map((skill) => (
        <View key={skill.skill} style={styles.skillItem}>
          <View style={styles.skillHeader}>
            <Text style={styles.skillName}>{skill.skill}</Text>
            <Text style={styles.skillRevenue}>{formatCurrency(skill.revenue)}</Text>
          </View>
          
          <View style={styles.skillStats}>
            <Text style={styles.skillUsage}>{formatNumber(skill.usage)} uses</Text>
            <Text style={[styles.skillGrowth, { color: getGrowthColor(skill.growth) }]}>
              {skill.growth > 0 ? '+' : ''}{skill.growth}%
            </Text>
            <Text style={styles.skillRoi}>{skill.roi}x ROI</Text>
          </View>
          
          <View style={styles.skillBar}>
            <View style={[styles.skillBarFill, { width: `${Math.min(skill.roi * 20, 100)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderForecast = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Revenue Forecast</Text>
      
      <View style={styles.forecastHeader}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'month' && styles.activePeriodButton
          ]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === 'month' && styles.activePeriodButtonText
          ]}>
            Monthly
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'quarter' && styles.activePeriodButton
          ]}
          onPress={() => setSelectedPeriod('quarter')}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === 'quarter' && styles.activePeriodButtonText
          ]}>
            Quarterly
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'year' && styles.activePeriodButton
          ]}
          onPress={() => setSelectedPeriod('year')}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === 'year' && styles.activePeriodButtonText
          ]}>
            Yearly
          </Text>
        </TouchableOpacity>
      </View>
      
      {forecast.map((item) => (
        <View key={item.period} style={styles.forecastItem}>
          <View style={styles.forecastHeader}>
            <Text style={styles.forecastPeriod}>{item.period}</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(item.confidence) }]}>
              <Text style={styles.confidenceText}>{item.confidence}% conf</Text>
            </View>
          </View>
          
          <View style={styles.forecastValues}>
            <Text style={styles.forecastRevenue}>{formatCurrency(item.projectedRevenue)}</Text>
            <Text style={styles.forecastUsers}>{formatNumber(item.projectedUsers)} users</Text>
          </View>
          
          <View style={styles.forecastBar}>
            <View style={[styles.forecastBarFill, { width: `${item.confidence}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsCard}>
      <Text style={styles.cardTitle}>Investor Actions</Text>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onDownloadReport('quarterly')}
      >
        <Text style={styles.actionButtonText}>📊 Download Q2 Report</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onDownloadReport('financials')}
      >
        <Text style={styles.actionButtonText}>💰 Financial Statements</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onDownloadReport('due_diligence')}
      >
        <Text style={styles.actionButtonText}>🔍 Due Diligence Package</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, styles.meetingButton]}
        onPress={onRequestMeeting}
      >
        <Text style={styles.meetingButtonText}>📅 Schedule Investor Meeting</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Investor Dashboard</Text>
        <Text style={styles.subtitle}>Real-time performance and metrics</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderKeyMetrics()}
        {renderTierBreakdown()}
        {renderSkillPerformance()}
        {renderForecast()}
        {renderActions()}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  metricsCard: {
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
  actionsCard: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  metricGrowth: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  secondaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  secondaryMetric: {
    alignItems: 'center',
    flex: 1,
  },
  secondaryMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  secondaryMetricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  tierItem: {
    marginBottom: 16,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  tierRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  tierStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierUsers: {
    fontSize: 12,
    color: '#6B7280',
  },
  tierGrowth: {
    fontSize: 12,
    fontWeight: '500',
  },
  tierChurn: {
    fontSize: 12,
    color: '#6B7280',
  },
  tierBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
  },
  tierBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  skillItem: {
    marginBottom: 16,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  skillRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  skillStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skillUsage: {
    fontSize: 12,
    color: '#6B7280',
  },
  skillGrowth: {
    fontSize: 12,
    fontWeight: '500',
  },
  skillRoi: {
    fontSize: 12,
    color: '#6B7280',
  },
  skillBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
  },
  skillBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  forecastHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  activePeriodButton: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  forecastItem: {
    marginBottom: 16,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forecastPeriod: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  forecastValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  forecastRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  forecastUsers: {
    fontSize: 12,
    color: '#6B7280',
  },
  forecastBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
  },
  forecastBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  meetingButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  meetingButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
