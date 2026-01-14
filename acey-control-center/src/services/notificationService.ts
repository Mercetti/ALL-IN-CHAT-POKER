// services/notificationService.ts
import * as Notifications from 'expo-notifications';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  priority?: 'default' | 'high' | 'medium' | 'low';
  sound?: 'default' | 'custom' | 'silent';
}

export interface UserNotification extends NotificationData {
  userId: string;
  type: 'skill_unlock' | 'trial_warning' | 'tier_upgrade' | 'access_denied';
}

export interface OwnerNotification extends NotificationData {
  ownerToken: string;
  type: 'user_skill_unlock' | 'trial_expiration' | 'locked_access_attempt' | 'learning_update';
  username?: string;
  skillName?: string;
  timestamp?: string;
}

// Request permissions
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Send notification to user
export async function sendUserNotification(notification: UserNotification) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          type: notification.type,
          userId: notification.userId,
          ...notification.data
        },
        sound: notification.sound || 'default',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Failed to send user notification:', error);
  }
}

// Send notification to owner
export async function sendOwnerNotification(notification: OwnerNotification) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
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
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Failed to send owner notification:', error);
  }
}

// Send push notification to multiple users
export async function sendPushNotification(userIds: string[], payload: { title: string; message: string }) {
  return fetch(`https://your-backend.com/api/notifications/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds, ...payload }),
  }).then(res => res.json());
}

// Fetch notifications for user
export async function fetchNotifications(userToken: string) {
  return fetch(`https://your-backend.com/api/notifications/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken }),
  }).then(res => res.json());
}

// Mark notification as read
export async function markNotificationAsRead(userToken: string, notificationId: string) {
  return fetch(`https://your-backend.com/api/notifications/markRead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken, notificationId }),
  }).then(res => res.json());
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userToken: string) {
  return fetch(`https://your-backend.com/api/notifications/markAllRead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken }),
  }).then(res => res.json());
}

// Send local notification
export async function sendLocalNotification(title: string, body: string, data?: any) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Failed to send local notification:', error);
  }
}

// Get notification history
export async function getNotificationHistory(userToken: string, limit = 50) {
  return fetch(`https://your-backend.com/api/notifications/history?token=${userToken}&limit=${limit}`)
    .then(res => res.json());
}

// Clear notification history
export async function clearNotificationHistory(userToken: string) {
  return fetch(`https://your-backend.com/api/notifications/clear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken }),
  }).then(res => res.json());
}

// Get notification count
export async function getNotificationCount(userToken: string) {
  return fetch(`https://your-backend.com/api/notifications/count?token=${userToken}`)
    .then(res => res.json());
}
