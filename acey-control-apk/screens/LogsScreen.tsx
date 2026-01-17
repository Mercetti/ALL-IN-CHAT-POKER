import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useSystem } from '../src/context/SystemContext';

interface LogsScreenProps {
  navigation: any;
}

const LogsScreen: React.FC<LogsScreenProps> = ({ navigation }) => {
  const { state, actions } = useSystem();
  const [refreshing, setRefreshing] = useState(false);
  
  // Logs state
  const [filterLevel, setFilterLevel] = useState<'all' | 'INFO' | 'WARN' | 'ERROR'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    // Fetch initial logs
    actions.refreshLogs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    actions.refreshLogs().finally(() => {
      setRefreshing(false);
    });
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive' }
      ],
      (buttonIndex) => {
        if (buttonIndex === 1) {
          // Clear logs logic would go here
          console.log('Clear logs');
        }
      }
    );
  };

  const handleExportLogs = (format: 'json' | 'csv' | 'txt') => {
    console.log(`Export logs as ${format}`);
    setShowExportMenu(false);
    Alert.alert('Export', `Logs exported as ${format.toUpperCase()}`);
  };

  const filteredLogs = state.logs.filter(log => {
    const matchesFilter = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.time.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'INFO': return 'ℹ️';
      case 'WARN': return '⚠️';
      case 'ERROR': return '❌';
      default: return '📝';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'INFO': return '#3b82f6';
      case 'WARN': return '#f59e0b';
      case 'ERROR': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Logs</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <View style={styles.filterButtons}>
          {(['all', 'INFO', 'WARN', 'ERROR'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterButton,
                filterLevel === level && styles.filterButtonActive
              ]}
              onPress={() => setFilterLevel(level)}
            >
              <Text style={[
                styles.filterButtonText,
                filterLevel === level && styles.filterButtonTextActive
              ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#6b7280"
          />
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logs List */}
      <ScrollView 
        style={styles.logsList}
        showsVerticalScrollIndicator={true}
      >
        {filteredLogs.length === 0 ? (
          <View style={styles.noLogsContainer}>
            <Text style={styles.noLogsText}>No logs found</Text>
          </View>
        ) : (
          filteredLogs.map((log, index) => (
            <View key={index} style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logIcon}>{getLogIcon(log.level)}</Text>
                <Text style={styles.logTime}>{log.time}</Text>
                <Text style={[styles.logLevel, { color: getLogColor(log.level) }]}>
                  {log.level}
                </Text>
              </View>
              <Text style={styles.logMessage}>{log.message}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowExportMenu(true)}
        >
          <Text style={styles.actionButtonText}>📤 Export</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRefresh}
        >
          <Text style={styles.actionButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearLogs}
        >
          <Text style={styles.actionButtonText}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Export Menu */}
      {showExportMenu && (
        <View style={styles.exportMenu}>
          <View style={styles.exportMenuContent}>
            <View style={styles.exportMenuHeader}>
              <Text style={styles.exportMenuTitle}>Export Logs</Text>
              <TouchableOpacity
                style={styles.exportCloseButton}
                onPress={() => setShowExportMenu(false)}
              >
                <Text style={styles.exportCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExportLogs('json')}
            >
              <Text style={styles.exportOptionText}>Export as JSON</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExportLogs('csv')}
            >
              <Text style={styles.exportOptionText}>Export as CSV</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExportLogs('txt')}
            >
              <Text style={styles.exportOptionText}>Export as TXT</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 6,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 6,
    padding: 8,
    color: '#ffffff',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  logsList: {
    flex: 1,
    backgroundColor: '#030712',
  },
  logCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  logTime: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  logMessage: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  noLogsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noLogsText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exportMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportMenuContent: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    minWidth: 200,
  },
  exportMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exportMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  exportCloseButton: {
    width: 24,
    height: 24,
    backgroundColor: '#374151',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exportOption: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  exportOptionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LogsScreen;
