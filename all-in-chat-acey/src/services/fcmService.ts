import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin/app';
import { Logger } from '../utils/logger';

const logger = new Logger();

export interface FCMNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  sound?: string;
  badge?: number;
  tag?: string;
}

export interface FCMDevice {
  token: string;
  userId: string;
  platform: 'android' | 'ios';
  active: boolean;
  createdAt: Date;
  lastUsed: Date;
}

export interface FCMSendResult {
  success: number;
  failure: number;
  results: any[];
}

export class FCMService {
  private static instance: FCMService;
  private app!: admin.app.App;
  private messaging!: admin.messaging.Messaging;

  private constructor() {
    this.initializeFirebase();
  }

  public static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  private initializeFirebase(): void {
    try {
      const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      };

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId,
      });

      this.messaging = this.app.messaging();
      logger.log('Firebase Admin initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin:', error);
      throw error;
    }
  }

  public async sendToDevice(
    deviceToken: string,
    notification: FCMNotification
  ): Promise<FCMSendResult> {
    try {
      const message: admin.messaging.Message = {
        token: deviceToken,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,

        },
        data: notification.data,
        android: {
          priority: 'high',
          notification: {

            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            icon: 'ic_notification',
            color: '#FF6B35',
          },
        },
        apns: {
          payload: {
            aps: {

              badge: notification.badge,
              category: notification.tag || 'GENERAL',
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      logger.log(`FCM message sent successfully to device: ${deviceToken}`, { messageId: response });
      
      return {
        success: 1,
        failure: 0,
        results: [response],
      };
    } catch (error) {
      logger.error(`Failed to send FCM message to device: ${deviceToken}`, error);
      
      return {
        success: 0,
        failure: 1,
        results: [error],
      };
    }
  }

  public async sendToMultipleDevices(
    deviceTokens: string[],
    notification: FCMNotification
  ): Promise<FCMSendResult> {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: deviceTokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,

        },
        data: notification.data,
        android: {
          priority: 'high',
          notification: {

            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            icon: 'ic_notification',
            color: '#FF6B35',
          },
        },
        apns: {
          payload: {
            aps: {

              badge: notification.badge,
              category: notification.tag || 'GENERAL',
            },
          },
        },
      };

      const response = await this.messaging.sendMulticast(message);
      logger.log(`FCM multicast sent`, { 
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalCount: deviceTokens.length 
      });
      
      return {
        success: response.successCount,
        failure: response.failureCount,
        results: response.responses,
      };
    } catch (error) {
      logger.error('Failed to send FCM multicast message', error);
      
      return {
        success: 0,
        failure: deviceTokens.length,
        results: [error],
      };
    }
  }

  public async sendToTopic(
    topic: string,
    notification: FCMNotification
  ): Promise<boolean> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,

        },
        data: notification.data,
        android: {
          priority: 'high',
          notification: {

            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            icon: 'ic_notification',
            color: '#FF6B35',
          },
        },
        apns: {
          payload: {
            aps: {

              badge: notification.badge,
              category: notification.tag || 'GENERAL',
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      logger.log(`FCM topic message sent successfully: ${topic}`, { messageId: response });
      return true;
    } catch (error) {
      logger.error(`Failed to send FCM topic message: ${topic}`, error);
      return false;
    }
  }

  public async subscribeToTopic(
    deviceTokens: string[],
    topic: string
  ): Promise<boolean> {
    try {
      const response = await this.messaging.subscribeToTopic(deviceTokens, topic);
      logger.log(`Devices subscribed to topic: ${topic}`, { 
        successCount: response.successCount,
        failureCount: response.failureCount 
      });
      return response.failureCount === 0;
    } catch (error) {
      logger.error(`Failed to subscribe devices to topic: ${topic}`, error);
      return false;
    }
  }

  public async unsubscribeFromTopic(
    deviceTokens: string[],
    topic: string
  ): Promise<boolean> {
    try {
      const response = await this.messaging.unsubscribeFromTopic(deviceTokens, topic);
      logger.log(`Devices unsubscribed from topic: ${topic}`, { 
        successCount: response.successCount,
        failureCount: response.failureCount 
      });
      return response.failureCount === 0;
    } catch (error) {
      logger.error(`Failed to unsubscribe devices from topic: ${topic}`, error);
      return false;
    }
  }

  public async validateDeviceToken(token: string): Promise<boolean> {
    try {
      // FCM doesn't provide a direct token validation endpoint
      // This is a basic validation by attempting to send a dry run message
      const testMessage: admin.messaging.Message = {
        token,
        data: { test: 'validation' },
        android: { priority: 'normal' },
        apns: { payload: { aps: { 'content-available': 1 } } },
      };

      await this.messaging.send(testMessage);
      return true;
    } catch (error: any) {
      if (error.code === 'messaging/registration-token-not-registered') {
        logger.warn(`FCM token not registered: ${token}`);
        return false;
      }
      logger.error(`FCM token validation failed: ${token}`, error);
      return false;
    }
  }

  public async sendSecurityAlert(
    deviceTokens: string[],
    securityEvent: {
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: Date;
    }
  ): Promise<FCMSendResult> {
    const notification: FCMNotification = {
      title: '🚨 Security Alert',
      body: `${securityEvent.severity.toUpperCase()}: ${securityEvent.message}`,
      data: {
        type: 'security_alert',
        severity: securityEvent.severity,
        eventType: securityEvent.type,
        timestamp: securityEvent.timestamp.toISOString(),
      },
      sound: 'alert',
      tag: 'SECURITY',
    };

    return this.sendToMultipleDevices(deviceTokens, notification);
  }

  public async sendSkillNotification(
    deviceTokens: string[],
    skillEvent: {
      skillName: string;
      status: 'started' | 'completed' | 'failed';
      message: string;
      executionTime?: number;
    }
  ): Promise<FCMSendResult> {
    const notification: FCMNotification = {
      title: `🤖 Skill ${skillEvent.status}`,
      body: `${skillEvent.skillName}: ${skillEvent.message}`,
      data: {
        type: 'skill_execution',
        skillName: skillEvent.skillName,
        status: skillEvent.status,
        executionTime: skillEvent.executionTime?.toString() || '0',
      },
      sound: 'default',
      tag: 'SKILL',
    };

    return this.sendToMultipleDevices(deviceTokens, notification);
  }

  public async sendPayoutNotification(
    deviceTokens: string[],
    payoutEvent: {
      amount: number;
      currency: string;
      status: 'processing' | 'completed' | 'failed';
      estimatedDelivery?: Date;
    }
  ): Promise<FCMSendResult> {
    const notification: FCMNotification = {
      title: '💰 Payout Update',
      body: `Your payout of ${payoutEvent.currency} ${payoutEvent.amount.toFixed(2)} is ${payoutEvent.status}`,
      data: {
        type: 'payout',
        amount: payoutEvent.amount.toString(),
        currency: payoutEvent.currency,
        status: payoutEvent.status,
        estimatedDelivery: payoutEvent.estimatedDelivery?.toISOString() || '',
      },
      sound: 'default',
      tag: 'PAYOUT',
    };

    return this.sendToMultipleDevices(deviceTokens, notification);
  }
}

export default FCMService.getInstance();
