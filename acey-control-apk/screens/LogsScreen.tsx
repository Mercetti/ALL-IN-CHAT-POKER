import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSystem } from '../src/context/SystemContext';

interface LogsScreenProps {
  navigation: any;
}

const LogsScreen: React.FC<LogsScreenProps> = ({ navigation }) => {
  const { state, actions } = useSystem();
  const [refreshing, setRefreshing] = useState(false);
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    // Fetch initial system logs
    actions.refreshLogs();
    
    // Set up refresh interval
    const interval = setInterval(() => {
      actions.refreshLogs();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
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
      'Are you sure you want to clear all system logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive' }
      ],
      (buttonIndex) => {
        if (buttonIndex === 1) {
          actions.clearLogs();
        }
      }
    );
  };

  const handleFilterChange = (level: 'all' | 'info' | 'warn' | 'error') => {
    setFilterLevel(level);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Filter logic would go here
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    const logs = state.logs.map(log => ({
      timestamp: log.time,
      level: log.level,
      message: log.message,
    }));

    const data = {
      logs,
      timestamp: new Date().toISOString(),
      format,
    };

    if (format === 'json') {
      console.log('Exporting logs as JSON:', JSON.stringify(data, null, 2));
    } else {
      console.log('Exporting logs as CSV (implementation needed)');
    }
    
    setShowExportMenu(false);
    Alert.alert('Export Complete', `Exported ${logs.length} log entries as ${format.toUpperCase()}`, [
      { text: 'OK', style: 'default' }
    ]);
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info': return '#10b981';
      case 'warn': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  const filteredLogs = state.logs.filter(log => {
    if (filterLevel === 'all') return true;
    if (filterLevel === 'info' && log.level !== 'info') return false;
    if (filterLevel === 'warn' && log.level !== 'warn') return false;
    if (filterLevel === 'error' && log.level !== 'error') return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Logs</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => setShowExportMenu(true)}
          >
            <Text style={styles.exportButtonText}>📤 Export</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearLogs}
          >
            <Text style={styles.clearButtonText}>🗑️ Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.controls}>
          <Text style={styles.controlsTitle}>Filters</Text>
          
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filterLevel === 'all' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('all')}
            >
              <Text style={styles.filterButtonText}>All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterLevel === 'info' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('info')}
            >
              <Text style={styles.filterButtonText}>Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterLevel === 'warn' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('warn')}
            >
              <Text style={styles.filterButtonText}>Warn</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterLevel === 'error' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('error')}
            >
              <Text style={styles.filterButtonText}>Error</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search logs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            editable={!refreshing}
            />
            
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            disabled={refreshing}
            >
              <Text style={styles.searchButtonText}>🔍 Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.logsList}
          showsVerticalScrollIndicator={autoScroll}
          onScroll={autoScroll}
        >
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => (
              <View key={index} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.logIcon}>{getLogIcon(log.level)}</Text>
                  <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
                  <Text style={styles.logLevel}>{log.level.toUpperCase()}</Text>
                </Text>
                <Text style={styles.logMessage}>{log.message}</Text>
              </View>
              
              <View style={styles.logContent}>
                <Text style={styles.logText}>{log.message}</Text>
              </View>
            </View>
          )) : (
            <View style={styles.noLogsContainer}>
              <Text style={styles.noLogsText}>No logs found</Text>
            </View>
          )}
        </ScrollView>

        {/* Export Menu */}
        {showExportMenu && (
          <View style={styles.exportMenu}>
            <View style={styles.exportMenuHeader}>
              <Text style={styles.exportMenuTitle}>Export Options</Text>
              <TouchableOpacity
                style={styles.exportCloseButton}
                onPress={() => setShowExportMenu(false)}
              >
                <Text style={styles.exportCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExport('json')}
            >
              <Text style={styles.exportOptionText}>Export as JSON</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExport('csv')}
            >
              <Text style={styles.exportOptionText}>Export as CSV</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Control Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => actions.startSystem()}
            >
              <Text style={styles.actionButtonText}>▶️ Start System</Text>
            </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => actions.stopSystem()}
            >
              <Text style={styles.actionButtonText}>⏹️ Stop System</Text>
            </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => actions.restartSystem()}
            >
              <Text style={styles.actionButtonText}>🔄 Restart System</Text>
            </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={() => actions.emergencyStop()}
            >
              <Text style={styles.actionButtonText}>🚨 Emergency Stop</Text>
            </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
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
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  },
  logsList: {
    maxHeight: 200,
  },
  logCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  logTime: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  logMessage: {
    fontSize: 12,
    color: '#ffffff',
  },
  logContent: {
    fontSize: 12,
    color: '#ffffff',
  },
  noLogsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noLogsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  exportMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    elevation: 5,
  },
  exportMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  exportCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportCloseButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  exportOption: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  exportOptionText: {
    fontSize: 14,
    color: '#ffffff',
    },
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resourceCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resourceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  resourceBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  resourceText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  resourceLimit: {
    fontSize: 10,
    color: '#6b7280',
    },
  },
  eventsList: {
    maxHeight: 200,
    },
  eventCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  eventTime: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  eventMessage: {
    fontSize: 12,
    color: '#ffffff',
    },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    },
  noEventsText: {
    fontSize: 14,
      color: '#6b7280',
      textAlign: 'center',
      fontStyle: 'italic',
    },
  },
  },
});

export default LogsScreen;
