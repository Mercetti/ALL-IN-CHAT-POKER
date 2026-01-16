// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface BaseNotificationData {
  title: string;
  body: string;
  data?: any;
  priority?: 'default' | 'high' | 'medium' | 'low';
  sound?: 'default' | 'custom' | 'silent';
  actionUrl?: string;
}

export interface NotificationData extends BaseNotificationData {
  type?: 'info' | 'warning' | 'error' | 'security' | 'billing' | 'feature' | 'payout' | 'investor';
}

export interface UserNotification extends BaseNotificationData {
  userId: string;
  type: 'skill_unlock' | 'trial_warning' | 'tier_upgrade' | 'access_denied';
}

export interface OwnerNotification extends BaseNotificationData {
  ownerToken: string;
  type: 'user_skill_unlock' | 'trial_expiration' | 'locked_access_attempt' | 'learning_update';
  username?: string;
  skillName?: string;
  timestamp?: string;
}

export interface PushNotificationSettings {
  enabled: boolean;
  allowCritical: boolean;
  allowMarketing: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  categories: {
    info: boolean;
    warning: boolean;
    error: boolean;
    security: boolean;
    billing: boolean;
    feature: boolean;
    payout: boolean;
    investor: boolean;
  };
}

// Enhanced notification service
class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permission denied');
        return;
      }

      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('security', {
          name: 'Security Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('payout', {
          name: 'Payout Notifications',
          importance: Notifications.AndroidImportance.DEFAULT,
        });

        await Notifications.setNotificationChannelAsync('investor', {
          name: 'Investor Updates',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }

      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  // Get notification settings
  async getNotificationSettings(): Promise<PushNotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        return JSON.parse(settings);
      }

      // Default settings
      const defaultSettings: PushNotificationSettings = {
        enabled: true,
        allowCritical: true,
        allowMarketing: false,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        categories: {
          info: true,
          warning: true,
          error: true,
          security: true,
          billing: true,
          feature: true,
          payout: true,
          investor: true
        }
      };

      await AsyncStorage.setItem('notificationSettings', JSON.stringify(defaultSettings));
      return defaultSettings;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      throw error;
    }
  }

  // Update notification settings
  async updateNotificationSettings(settings: PushNotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      console.log('Notification settings updated');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  // Send enhanced notification
  async sendNotification(notification: NotificationData): Promise<void> {
    try {
      const settings = await this.getNotificationSettings();
      
      // Check if notifications are enabled
      if (!settings.enabled) return;

      // Check category permissions
      if (notification.type && !settings.categories[notification.type]) {
        console.log('Notification suppressed due to category settings');
        return;
      }

      const channelId = this.getChannelId(notification.type);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            type: notification.type,
            actionUrl: notification.actionUrl,
            ...notification.data
          },
          sound: notification.sound || 'default',
          priority: this.getPriority(notification.priority),
        },
        trigger: null,
        identifier: notification.data?.id || Date.now().toString(),
      });

      console.log('Notification sent:', notification.title);
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Send security alert
  async sendSecurityAlert(title: string, body: string, data?: any): Promise<void> {
    await this.sendNotification({
      title,
      body,
      type: 'security',
      priority: 'high',
      data,
      sound: 'default'
    });
  }

  // Send payout notification
  async sendPayoutNotification(title: string, body: string, data?: any): Promise<void> {
    await this.sendNotification({
      title,
      body,
      type: 'payout',
      priority: 'medium',
      data,
      sound: 'default'
    });
  }

  // Send investor update
  async sendInvestorUpdate(title: string, body: string, data?: any): Promise<void> {
    await this.sendNotification({
      title,
      body,
      type: 'investor',
      priority: 'medium',
      data,
      sound: 'default'
    });
  }

  // Send billing notification
  async sendBillingNotification(title: string, body: string, data?: any): Promise<void> {
    await this.sendNotification({
      title,
      body,
      type: 'billing',
      priority: 'medium',
      data,
      sound: 'default'
    });
  }

  // Helper methods
  private getChannelId(type?: string): string {
    switch (type) {
      case 'security': return 'security';
      case 'payout': return 'payout';
      case 'investor': return 'investor';
      default: return 'default';
    }
  }

  private getPriority(priority?: string): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'high': return Notifications.AndroidNotificationPriority.HIGH;
      case 'medium': return Notifications.AndroidNotificationPriority.DEFAULT;
      case 'low': return Notifications.AndroidNotificationPriority.LOW;
      default: return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }
}

// Request permissions
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Send notification to user
export async function sendUserNotification(notification: UserNotification) {
  try {
    await NotificationService.getInstance().sendNotification({
      title: notification.title,
      body: notification.body,
      data: {
        type: notification.type,
        userId: notification.userId,
        ...notification.data
      },
      sound: notification.sound || 'default',
      priority: notification.priority || 'default',
    });
  } catch (error) {
    console.error('Failed to send user notification:', error);
  }
}

// Send notification to owner
export async function sendOwnerNotification(notification: OwnerNotification) {
  try {
    await NotificationService.getInstance().sendNotification({
      title: notification.title,
      body: notification.body,
      data: {
        type: notification.type,
        ownerToken: notification.ownerToken,
        username: notification.username,
        skillName: notification.skillName,
        timestamp: notification.timestamp,
        ...notification.data
      },
      sound: notification.sound || 'default',
      priority: 'high',
    });
  } catch (error) {
    console.error('Failed to send owner notification:', error);
  }
}

// Send push notification to multiple users
export async function sendPushNotification(userIds: string[], payload: { title: string; message: string }) {
  return fetch(`http://localhost:8080/api/notifications/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds, ...payload }),
  }).then(res => res.json());
}

// Fetch notifications for user
export async function fetchNotifications(userToken: string) {
  return fetch(`http://localhost:8080/api/notifications/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken }),
  }).then(res => res.json());
}

// Mark notification as read
export async function markNotificationAsRead(userToken: string, notificationId: string) {
  return fetch(`http://localhost:8080/api/notifications/markRead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken, notificationId }),
  }).then(res => res.json());
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userToken: string) {
  return fetch(`http://localhost:8080/api/notifications/markAllRead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken }),
  }).then(res => res.json());
}

// Send local notification
export async function sendLocalNotification(title: string, body: string, data?: any) {
  try {
    await NotificationService.getInstance().sendNotification({
      title,
      body,
      data: data || {},
      sound: 'default',
    });
  } catch (error) {
    console.error('Failed to send local notification:', error);
  }
}

// Get notification history
export async function getNotificationHistory(userToken: string, limit = 50) {
  return fetch(`http://localhost:8080/api/notifications/history?token=${userToken}&limit=${limit}`)
    .then(res => res.json());
}

// Clear notification history
export async function clearNotificationHistory(userToken: string) {
  return fetch(`http://localhost:8080/api/notifications/clear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken }),
  }).then(res => res.json());
}

// Get notification count
export async function getNotificationCount(userToken: string) {
  return fetch(`http://localhost:8080/api/notifications/count?token=${userToken}`)
    .then(res => res.json());
}

// Export the singleton instance
export default NotificationService.getInstance();
