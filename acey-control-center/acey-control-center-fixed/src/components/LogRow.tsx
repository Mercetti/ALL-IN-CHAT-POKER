import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LogEntry } from '../types/api';

interface LogRowProps {
  log: LogEntry;
  onPress?: (log: LogEntry) => void;
  showDetails?: boolean;
}

const LogRow: React.FC<LogRowProps> = ({
  log,
  onPress,
  showDetails = false,
}) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug': return '#9E9E9E';
      case 'info': return '#2196F3';
      case 'warn': return '#FF9800';
      case 'error': return '#F44336';
      case 'fatal': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'debug': return 'bug-report';
      case 'info': return 'info';
      case 'warn': return 'warning';
      case 'error': return 'error';
      case 'fatal': return 'dangerous';
      default: return 'help';
    }
  };

  const formatMessage = (message: string) => {
    // Truncate long messages for display
    if (message.length > 100) {
      return message.substring(0, 97) + '...';
    }
    return message;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(log)}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.levelContainer}>
          <Icon 
            name={getLevelIcon(log.level)} 
            size={16} 
            color={getLevelColor(log.level)} 
          />
          <Text style={[styles.level, { color: getLevelColor(log.level) }]}>
            {log.level.toUpperCase()}
          </Text>
        </View>
        
        <Text style={styles.timestamp}>
          {formatTimestamp(log.timestamp)}
        </Text>
      </View>

      <Text style={styles.message} numberOfLines={showDetails ? undefined : 2}>
        {formatMessage(log.message)}
      </Text>

      <View style={styles.metadata}>
        <Text style={styles.source}>{log.source}</Text>
        {log.userId && (
          <Text style={styles.user}>User: {log.userId}</Text>
        )}
      </View>

      {showDetails && log.context && (
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Context:</Text>
          <Text style={styles.contextText}>
            {JSON.stringify(log.context, null, 2)}
          </Text>
        </View>
      )}

      {showDetails && log.stackTrace && (
        <View style={styles.stackContainer}>
          <Text style={styles.stackLabel}>Stack Trace:</Text>
          <Text style={styles.stackText}>
            {log.stackTrace}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  level: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  message: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 18,
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  source: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  user: {
    fontSize: 12,
    color: '#2196F3',
  },
  contextContainer: {
    backgroundColor: '#2C2C2C',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9E9E9E',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 11,
    color: '#E0E0E0',
    fontFamily: 'monospace',
  },
  stackContainer: {
    backgroundColor: '#2C2C2C',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  stackLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  stackText: {
    fontSize: 10,
    color: '#FFB0B0',
    fontFamily: 'monospace',
  },
});

export default LogRow;
