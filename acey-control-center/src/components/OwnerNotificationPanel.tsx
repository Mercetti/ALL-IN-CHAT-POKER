import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';

interface NotificationEvent {
  id: string;
  type: string;
  username?: string;
  skillName?: string;
  timestamp: string;
  message?: string;
  data?: any;
}

interface OwnerNotificationPanelProps {
  notifications: NotificationEvent[];
  onRefresh?: () => void;
  onClearAll?: () => void;
  onMarkRead?: (notificationId: string) => void;
  refreshing?: boolean;
}

export default function OwnerNotificationPanel({ 
  notifications, 
  onRefresh, 
  onClearAll,
  onMarkRead,
  refreshing = false 
}: OwnerNotificationPanelProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'skill_unlock': return '🔓';
      case 'trial_expiring': return '⏰';
      case 'locked_access_attempt': return '🔒';
      case 'new_approved_output': return '✅';
      case 'fine_tune_complete': return '🎯';
      case 'trust_score_change': return '📈';
      default: return '📢';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'skill_unlock': return '#34C759';
      case 'trial_expiring': return '#FF9500';
      case 'locked_access_attempt': return '#FF3B30';
      case 'new_approved_output': return '#007AFF';
      case 'fine_tune_complete': return '#AF52DE';
      case 'trust_score_change': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes}m ago` : 'Just now';
    }
  };

  const getEventTypeDisplay = (type: string) => {
    switch (type) {
      case 'skill_unlock': return 'Skill Unlock';
      case 'trial_expiring': return 'Trial Expiring';
      case 'locked_access_attempt': return 'Access Attempt';
      case 'new_approved_output': return 'New Output';
      case 'fine_tune_complete': return 'Fine-Tune Complete';
      case 'trust_score_change': return 'Trust Score Change';
      default: return type.replace('_', ' ').toUpperCase();
    }
  };

  const groupNotificationsByType = () => {
    const grouped = notifications.reduce((acc, notification) => {
      const type = notification.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(notification);
      return acc;
    }, {} as Record<string, NotificationEvent[]>);

    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.data?.read).length;
  };

  const groupedNotifications = groupNotificationsByType();
  const unreadCount = getUnreadCount();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Owner Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {onClearAll && notifications.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={onClearAll}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notification List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              Notifications will appear here as users interact with the system
            </Text>
          </View>
        ) : (
          <>
            {/* Summary by Type */}
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Event Summary</Text>
              <View style={styles.summaryGrid}>
                {groupedNotifications.map(([type, events]) => (
                  <View key={type} style={styles.summaryItem}>
                    <Text style={styles.summaryIcon}>
                      {getEventIcon(type)}
                    </Text>
                    <Text style={styles.summaryCount}>{events.length}</Text>
                    <Text style={styles.summaryType}>
                      {getEventTypeDisplay(type)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Detailed Notifications */}
            <View style={styles.notificationsSection}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {notifications.slice(0, 20).map((notification, index) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    notification.data?.read && styles.readNotification
                  ]}
                  onPress={() => onMarkRead?.(notification.id)}
                >
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationLeft}>
                      <Text style={[
                        styles.notificationIcon,
                        { color: getEventColor(notification.type) }
                      ]}>
                        {getEventIcon(notification.type)}
                      </Text>
                      <View style={styles.notificationMeta}>
                        <Text style={styles.notificationType}>
                          {getEventTypeDisplay(notification.type)}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatTimestamp(notification.timestamp)}
                        </Text>
                      </View>
                    </View>
                    
                    {!notification.data?.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>

                  <Text style={styles.notificationMessage}>
                    {notification.message || `${notification.username || 'User'} ${notification.type.replace('_', ' ')}${notification.skillName ? ` - ${notification.skillName}` : ''}`}
                  </Text>

                  {notification.username && (
                    <Text style={styles.notificationUser}>
                      User: {notification.username}
                    </Text>
                  )}

                  {notification.skillName && (
                    <Text style={styles.notificationSkill}>
                      Skill: {notification.skillName}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {notifications.length > 20 && (
              <View style={styles.loadMoreSection}>
                <Text style={styles.loadMoreText}>
                  Showing 20 of {notifications.length} notifications
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  summarySection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  summaryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginRight: 8,
  },
  summaryType: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  notificationsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 12,
  },
  notificationItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  readNotification: {
    opacity: 0.6,
    borderLeftColor: '#e0e0e0',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  notificationMeta: {
    flex: 1,
  },
  notificationType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationUser: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  notificationSkill: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadMoreSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});