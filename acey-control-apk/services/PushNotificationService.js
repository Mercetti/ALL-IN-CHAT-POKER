/**
 * Push Notification Service
 * Handles push notifications for the Acey Control Center
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

class PushNotificationService {
  static async initialize() {
    try {
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Push notification permissions denied');
          return false;
        }
      }

      console.log('Push notification service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  static async sendNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Show immediately
      });
      console.log('Notification sent:', title);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  static async sendSystemAlert(message) {
    return this.sendNotification('Acey System Alert', message, { type: 'system' });
  }

  static async sendStatusUpdate(status) {
    return this.sendNotification('System Status Update', status, { type: 'status' });
  }
}

export default PushNotificationService;
