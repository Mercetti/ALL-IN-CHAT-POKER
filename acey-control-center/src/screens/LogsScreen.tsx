import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getLogs } from '../services/api';
import { useAceyStore } from '../state/aceyStore';

interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
}

const LogsScreen: React.FC = ({ navigation }: any) => {
  const { setLoading, setError } = useAceyStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    loadLogs();
  }, [selectedLevel, limit]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await getLogs(selectedLevel === 'all' ? 'system' : selectedLevel, limit);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        let filteredLogs = response.data.logs;
        
        // Apply search filter
        if (searchQuery) {
          filteredLogs = filteredLogs.filter(log => 
            log.message.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        setLogs(filteredLogs);
        setError(null);
      }
    } catch (error) {
      setError('Failed to load logs');
      console.error('Logs load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#F44336';
      case 'warn': return '#FF9800';
      case 'info': return '#2196F3';
      case 'debug': return '#9E9E9E';
      default: return '#FFFFFF';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'bug-report';
      default: return 'info';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const loadMoreLogs = () => {
    setLimit(prev => prev + 50);
  };

  const filteredLogs = logs.filter(log => 
    searchQuery === '' || log.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>System Logs</Text>
        <TouchableOpacity onPress={loadLogs}>
          <Icon name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'error', 'warn', 'info', 'debug'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterChip,
                selectedLevel === level && styles.selectedFilterChip
              ]}
              onPress={() => setSelectedLevel(level)}
            >
              <Text style={[
                styles.filterChipText,
                selectedLevel === level && styles.selectedFilterChipText
              ]}>
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9E9E9E" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs..."
          placeholderTextColor="#9E9E9E"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="clear" size={20} color="#9E9E9E" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="search" size={64} color="#9E9E9E" />
            <Text style={styles.emptyTitle}>No Logs Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'No logs available'}
            </Text>
          </View>
        ) : (
          <>
            {filteredLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <View style={styles.logLevelContainer}>
                    <Icon 
                      name={getLevelIcon(log.level)} 
                      size={16} 
                      color={getLevelColor(log.level)} 
                    />
                    <Text style={[styles.logLevel, { color: getLevelColor(log.level) }]}>
                      {log.level.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.logTimestamp}>
                    {formatTimestamp(log.timestamp)}
                  </Text>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
              </View>
            ))}
            
            {/* Load More Button */}
            {logs.length >= limit && (
              <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreLogs}>
                <Text style={styles.loadMoreText}>Load More Logs</Text>
                <Icon name="arrow-downward" size={20} color="#2196F3" />
              </TouchableOpacity>
            )}
          </>
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
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#333333',
    marginRight: 8,
  },
  selectedFilterChip: {
    backgroundColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9E9E9E',
  },
  selectedFilterChipText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9E9E9E',
    marginTop: 8,
    textAlign: 'center',
  },
  logItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#666666',
  },
  logMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
});

export default LogsScreen;
