import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface NotificationConfig {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'default' | 'high' | 'max';
  sound?: 'default' | boolean;
  vibrate?: boolean | number[];
}

export interface PushToken {
  data: string;
  type: 'expo' | 'fcm' | 'apns';
}

export class NotificationService {
  private static instance: NotificationService;
  private pushToken: PushToken | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('acey-alerts', {
          name: 'Acey Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableVibrate: true,
        });
      }

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  async registerForPush(): Promise<PushToken | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const token = await Notifications.getExpoPushTokenAsync();
      
      this.pushToken = {
        data: token.data,
        type: 'expo',
      };

      console.log('Push token registered:', this.pushToken.data);
      return this.pushToken;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }

  async sendLocalNotification(config: NotificationConfig): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          data: config.data || {},
          sound: config.sound || 'default',
          priority: config.priority || 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  async sendApprovalRequiredNotification(action: string, reason: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Approval Required',
      body: `Acey requests approval for: ${action}`,
      data: {
        type: 'approval_required',
        action,
        reason,
        timestamp: Date.now(),
      },
      priority: 'high',
      sound: 'default',
      vibrate: [0, 250, 250, 250],
    });
  }

  async sendCriticalErrorNotification(error: string, context?: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Critical Error',
      body: `System error: ${error}`,
      data: {
        type: 'critical_error',
        error,
        context,
        timestamp: Date.now(),
      },
      priority: 'max',
      sound: 'default',
      vibrate: [0, 500, 200, 500],
    });
  }

  async sendSecurityAlertNotification(alert: string, details?: any): Promise<void> {
    await this.sendLocalNotification({
      title: 'Security Alert',
      body: alert,
      data: {
        type: 'security_alert',
        alert,
        details,
        timestamp: Date.now(),
      },
      priority: 'high',
      sound: 'default',
      vibrate: [0, 250, 250, 250],
    });
  }

  async sendSystemStatusNotification(status: 'online' | 'offline' | 'warning'): Promise<void> {
    const messages = {
      online: 'Acey is now online',
      offline: 'Acey has gone offline',
      warning: 'Acey status warning',
    };

    await this.sendLocalNotification({
      title: 'System Status',
      body: messages[status],
      data: {
        type: 'system_status',
        status,
        timestamp: Date.now(),
      },
      priority: status === 'offline' ? 'high' : 'default',
    });
  }

  getPushToken(): PushToken | null {
    return this.pushToken;
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  async getNotificationCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get notification count:', error);
      return 0;
    }
  }

  async setNotificationCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set notification count:', error);
    }
  }

  // Notification response handler
  onNotificationResponse(handler: (response: Notifications.NotificationResponse) => void): void {
    Notifications.addNotificationResponseReceivedListener(handler);
  }
}

export default NotificationService.getInstance();
