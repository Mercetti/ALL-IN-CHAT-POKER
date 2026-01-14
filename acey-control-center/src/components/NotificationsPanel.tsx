import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: string;
  read?: boolean;
  actionUrl?: string;
}

interface NotificationsPanelProps {
  userToken: string;
  userRole?: string;
}

export default function NotificationsPanel({ userToken, userRole }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      // Mock notifications based on user role
      const mockNotifications: Notification[] = [
        {
          id: 'notif_1',
          title: 'Skill Unlocked',
          message: 'Code Helper skill has been added to your account',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'success',
          read: false
        },
        {
          id: 'notif_2',
          title: 'Trial Expiring',
          message: 'Graphics Wizard trial expires in 6 hours',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: 'warning',
          read: false
        }
      ];

      // Add owner-only notifications if applicable
      if (userRole === 'owner' || userRole === 'developer') {
        mockNotifications.push(
          {
            id: 'notif_3',
            title: 'Dataset Update',
            message: 'New approved outputs ready for LLM training',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            type: 'info',
            read: false
          },
          {
            id: 'notif_4',
            title: 'Fine-Tune Complete',
            message: 'Model training completed with 95% accuracy improvement',
            timestamp: new Date(Date.now() - 5400000).toISOString(),
            type: 'success',
            read: false
          }
        );
      }

      setNotifications(mockNotifications);
    };

    loadNotifications();
  }, [userToken, userRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Reload notifications
    setRefreshing(false);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#34C759';
      case 'warning': return '#FF9500';
      case 'info': return '#007AFF';
      case 'error': return '#FF3B30';
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

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const handleAction = (actionUrl?: string) => {
    if (actionUrl) {
      console.log('Handle action:', actionUrl);
      // Trigger action handler
    }
  };

  const unreadCount = getUnreadCount();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🔔 Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markAllReadButton}
              onPress={() => {
                setNotifications(prev => 
                  prev.map(notif => ({ ...notif, read: true }))
                );
              }}
            >
              <Text style={styles.markAllReadText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>
            You're all caught up! Check back later for updates.
          </Text>
        </View>
      ) : (
        notifications.map((notification, index) => (
          <TouchableOpacity 
            key={notification.id}
            style={[
              styles.notificationItem,
              notification.read && styles.readNotification
            ]}
            onPress={() => {
              markAsRead(notification.id);
              handleAction(notification.actionUrl);
            }}
          >
            <View style={styles.notificationHeader}>
              <View style={styles.notificationLeft}>
                <Text style={[
                  styles.notificationIcon,
                  { color: getNotificationColor(notification.type) }
                ]}>
                  {getNotificationIcon(notification.type)}
                </Text>
                <View style={styles.notificationMeta}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationTime}>
                    {formatTimestamp(notification.timestamp)}
                  </Text>
                </View>
              </View>
              
              {!notification.read && (
                <View style={styles.unreadDot} />
              )}
            </View>

            <Text style={styles.notificationMessage}>{notification.message}</Text>

            {notification.actionUrl && (
              <View style={styles.actionSection}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleAction(notification.actionUrl)}
                >
                  <Text style={styles.actionButtonText}>Action</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
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
  headerTitle: {
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  markAllReadText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
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
    lineHeight: 18,
    marginBottom: 8,
  },
  actionSection: {
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
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
});
