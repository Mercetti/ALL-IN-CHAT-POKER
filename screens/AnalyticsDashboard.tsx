import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { 
  GeneratedOutput, 
  SkillType, 
  UserTier, 
  ChatMessage,
  AnalyticsData
} from '../types/skills';
import { 
  getCurrentTier,
  getUsageBySkill,
  trackUsage
} from '../utils/tierManager';

interface AnalyticsDashboardProps {
  onBack: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onBack }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    viewers: { current: 72, peak: 120, average: 85, total: 1500 },
    donations: {
      total: 500,
      average: 25,
      recent: [
        { amount: 50, timestamp: Date.now() - 86400000, userId: 'user1' },
        { amount: 100, timestamp: Date.now() - 172800000, userId: 'user2' },
        { amount: 25, timestamp: Date.now() - 259200000, userId: 'user1' }
      ]
    },
    gameEvents: {
      total: 50,
      types: { 'tournament': 20, 'cash_game': 30 },
      recent: [
        { type: 'tournament', timestamp: Date.now() - 3600000, data: { players: 8, prize: 1000 } },
        { type: 'cash_game', timestamp: Date.now() - 7200000, data: { winner: 'player1', pot: 500 } }
      ]
    },
    performance: {
      averageResponseTime: 150,
      uptime: 99.9,
      errorRate: 0.02
    }
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setAnalyticsData(prev => ({
        ...prev,
        viewers: {
          ...prev.viewers,
          current: Math.floor(Math.random() * 20) + 60
        },
        performance: {
          ...prev.performance,
          uptime: Number((prev.performance.uptime + 0.01) % 100)
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const renderMetricCard = (title: string, value: string | number, subtitle?: string) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Viewers Over Time</Text>
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartPlaceholderText}>📊 Chart would render here</Text>
        <Text style={styles.chartPlaceholderText}>Real-time analytics visualization</Text>
      </View>
    </View>
  );

  const renderRecentEvent = (event: any, index: number) => (
    <View key={index} style={styles.recentEvent}>
      <Text style={styles.eventTime}>
        {new Date(event.timestamp).toLocaleTimeString()}
      </Text>
      <Text style={styles.eventType}>{event.type}</Text>
      <Text style={styles.eventData}>
        {event.type === 'tournament' && `Prize: $${event.data.prize}`}
        {event.type === 'cash_game' && `Winner: ${event.data.winner}`}
      }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Analytics Dashboard</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Current Viewers', analyticsData.viewers.current)}
            {renderMetricCard('Peak Viewers', analyticsData.viewers.peak)}
            {renderMetricCard('Average Viewers', analyticsData.viewers.average)}
            {renderMetricCard('Total Viewers', analyticsData.viewers.total)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Uptime', `${analyticsData.performance.uptime}%`)}
            {renderMetricCard('Response Time', `${analyticsData.performance.averageResponseTime}ms`)}
            {renderMetricCard('Error Rate', `${(analyticsData.performance.errorRate * 100).toFixed(2)}%`)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donations</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Total Donations', `$${analyticsData.donations.total}`)}
            {renderMetricCard('Average Donation', `$${analyticsData.donations.average}`)}
            {renderMetricCard('Recent Donations', analyticsData.donations.recent.length)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Events</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Total Events', analyticsData.gameEvents.total)}
            <Object.entries(analyticsData.gameEvents.types).map(([type, count]) => (
              <View key={type} style={styles.metricCard}>
                <Text style={styles.metricTitle}>{type}</Text>
                <Text style={styles.metricValue}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Period Selection</Text>
          <View style={styles.periodSelector}>
            {(['24h', '7d', '30d'] as const[]).map(period => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period ? styles.selectedPeriodButton : styles.unselectedPeriodButton
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={styles.periodButtonText}>{period}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {renderChart()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          <ScrollView style={styles.recentEventsList} showsVerticalScrollIndicator={false}>
            {analyticsData.gameEvents.recent.slice(0, 10).map(renderRecentEvent)}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  metricSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#444',
    marginHorizontal: 4,
  },
  selectedPeriodButton: {
    backgroundColor: '#007AFF',
  },
  unselectedPeriodButton: {
    backgroundColor: '#666',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    height: 200,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  chartPlaceholderText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 8,
  },
  recentEventsList: {
    maxHeight: 200,
  },
  recentEvent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
    minWidth: 60,
  },
  eventType: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventData: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  },
});
