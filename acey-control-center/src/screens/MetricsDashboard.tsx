import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { getMetrics } from '../services/aceyApi';
import useNotifications from '../hooks/useNotifications';

interface Metric {
  id: string;
  label: string;
  value: string | number;
  change?: number;
}

export default function MetricsDashboard({ route }: { route: any }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { sendNotification } = useNotifications();
  const userToken = route.params?.userToken || 'demo-token';

  const loadMetrics = async () => {
    try {
      const data = await getMetrics(userToken);
      setMetrics(data);
      sendNotification('Acey Metrics Updated', 'New stats are available!');
    } catch (error) {
      // Fallback mock data
      setMetrics([
        { id: '1', label: 'Total Skills Installed', value: 12, change: 2 },
        { id: '2', label: 'Code Generations', value: 156, change: 23 },
        { id: '3', label: 'Audio Productions', value: 89, change: -5 },
        { id: '4', label: 'Graphics Created', value: 234, change: 45 },
        { id: '5', label: 'Links Reviewed', value: 445, change: 67 },
        { id: '6', label: 'Trust Score', value: '94.5%', change: 2.3 },
        { id: '7', label: 'Dataset Size', value: '2.3MB', change: 0.5 },
        { id: '8', label: 'Active Sessions', value: 8, change: 1 },
      ]);
    }
  };

  useEffect(() => {
    loadMetrics().finally(() => setLoading(false));
  }, [userToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
  };

  const renderMetric = ({ item }: { item: Metric }) => (
    <View style={styles.metricItem}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{item.label}</Text>
        <Text style={styles.metricValue}>{item.value}</Text>
      </View>
      {item.change !== undefined && (
        <Text style={[
          styles.changeText,
          item.change >= 0 ? styles.positiveChange : styles.negativeChange
        ]}>
          {item.change >= 0 ? '↑' : '↓'} {Math.abs(item.change)}
        </Text>
      )}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metrics Dashboard</Text>
      
      <FlatList
        data={metrics}
        keyExtractor={item => item.id}
        renderItem={renderMetric}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContainer: {
    gap: 15,
  },
  metricItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  positiveChange: {
    color: '#34C759',
  },
  negativeChange: {
    color: '#FF3B30',
  },
});
