import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { fetchNotifications } from '../services/notificationService';
import { fetchSkillUpdates, fetchRecommendations } from '../services/aceyMobileOrchestrator';

interface FeedItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'notification' | 'skillUpdate' | 'recommendation' | 'fineTune';
  ownerOnly?: boolean;
  preview?: {
    type: 'image' | 'audio' | 'code';
    url?: string;
    code?: string;
  };
  skillId?: string;
  skillName?: string;
  data?: {
    read?: boolean;
  };
}

interface AceyActivityFeedProps {
  userToken: string;
  userRole: string;
}

export default function AceyActivityFeed({ userToken, userRole }: AceyActivityFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = async () => {
    try {
      const notifications = await fetchNotifications(userToken);
      const updates = await fetchSkillUpdates(userToken, userRole);
      const recommendations = await fetchRecommendations(userToken);

      // Merge and sort by timestamp descending
      const allItems = [...notifications, ...updates, ...recommendations];
      allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setFeedItems(allItems);
    } catch (error) {
      console.error('Failed to load activity feed:', error);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [userToken, userRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'notification': return '🔔';
      case 'skillUpdate': return '🔄';
      case 'recommendation': return '💡';
      case 'fineTune': return '🎯';
      default: return '📢';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'notification': return '#007AFF';
      case 'skillUpdate': return '#34C759';
      case 'recommendation': return '#AF52DE';
      case 'fineTune': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const renderPreview = (preview: any) => {
    if (!preview) return null;

    switch (preview.type) {
      case 'image':
        return (
          <Image 
            source={{ uri: preview.url }} 
            style={styles.previewImage}
            resizeMode="cover"
          />
        );
      case 'audio':
        return (
          <View style={styles.audioPreview}>
            <Text style={styles.audioIcon}>🎵</Text>
            <Text style={styles.audioText}>Audio Preview Available</Text>
          </View>
        );
      case 'code':
        return (
          <Text style={styles.codePreview}>
            {preview.code}
          </Text>
        );
      default:
        return null;
    }
  };

  const handleApprove = (item: FeedItem) => {
    console.log('Approving:', item.id);
    // Trigger approval logic
  };

  const handleReject = (item: FeedItem) => {
    console.log('Rejecting:', item.id);
    // Trigger rejection logic
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {feedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No activity yet</Text>
          <Text style={styles.emptySubtext}>
            Activity will appear here as you interact with skills
          </Text>
        </View>
      ) : (
        feedItems.map((item, idx) => (
          <View key={item.id || idx} style={styles.feedItem}>
            {/* Header */}
            <View style={styles.itemHeader}>
              <View style={styles.itemLeft}>
                <Text style={styles.eventIcon}>
                  {getEventIcon(item.type)}
                </Text>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemTime}>
                    {formatTimestamp(item.timestamp)}
                  </Text>
                </View>
              </View>
              
              {!item.data?.read && (
                <View style={styles.unreadDot} />
              )}
            </View>

            {/* Content */}
            <Text style={styles.itemMessage}>{item.message}</Text>

            {/* Preview */}
            {item.preview && (
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Preview</Text>
                {renderPreview(item.preview)}
              </View>
            )}

            {/* Skill Info */}
            {item.skillName && (
              <Text style={styles.skillInfo}>
                Skill: {item.skillName}
              </Text>
            )}

            {/* Owner Actions */}
            {item.ownerOnly && (userRole === 'owner' || userRole === 'dev') && (
              <View style={styles.actionSection}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(item)}
                >
                  <Text style={styles.actionButtonText}>✓ Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(item)}
                >
                  <Text style={styles.actionButtonText}>✗ Reject</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.itemTimestamp}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
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
  feedItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  itemMeta: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 12,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  itemMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    marginBottom: 8,
  },
  previewSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
  },
  audioIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  audioText: {
    fontSize: 12,
    color: '#333',
  },
  codePreview: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#1d1d1f',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    lineHeight: 16,
  },
  skillInfo: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  itemTimestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
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
