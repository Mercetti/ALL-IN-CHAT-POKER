import apn from 'apn';
import { Logger } from '../utils/logger';

export interface APNSNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: string;
  badge?: number;
  category?: string;
  contentAvailable?: boolean;
  mutableContent?: number;
  threadId?: string;
}

export interface APNSDevice {
  token: string;
  userId: string;
  platform: 'ios';
  active: boolean;
  createdAt: Date;
  lastUsed: Date;
}

export interface APNSSendResult {
  success: number;
  failure: number;
  results: any[];
}

export class APNSService {
  private static instance: APNSService;
  private provider!: apn.Provider;
  private logger: Logger;

  private constructor() {
    this.logger = new Logger();
    this.initializeAPNS();
  }

  public static getInstance(): APNSService {
    if (!APNSService.instance) {
      APNSService.instance = new APNSService();
    }
    return APNSService.instance;
  }

  private initializeAPNS(): void {
    try {
      const options: apn.ProviderOptions = {
        token: {
          key: process.env.APNS_KEY_ID!,
          keyId: process.env.APNS_KEY_ID!,
          teamId: process.env.APNS_TEAM_ID!,
        },
        production: process.env.NODE_ENV === 'production',
      };

      this.provider = new apn.Provider(options);
      this.logger.log('APNS provider initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize APNS provider:', error);
      throw error;
    }
  }

  public async sendToDevice(
    deviceToken: string,
    notification: APNSNotification
  ): Promise<APNSSendResult> {
    try {
      const apnNotification = new apn.Notification({
        alert: {
          title: notification.title,
          body: notification.body,
        },
        sound: notification.sound || 'default',
        badge: notification.badge,
        category: notification.category || 'GENERAL',
        topic: notification.threadId,
        payload: notification.data,
        'content-available': notification.contentAvailable ? 1 : undefined,
        'mutable-content': notification.mutableContent,
      });

      const response = await this.provider.send(apnNotification, deviceToken);
      this.logger.log(`APNS message sent successfully to device: ${deviceToken}`, { 
        sent: response.sent.length,
        failed: response.failed.length 
      });
      
      return {
        success: response.sent.length,
        failure: response.failed.length,
        results: [...response.sent, ...response.failed],
      };
    } catch (error) {
      this.logger.error(`Failed to send APNS message to device: ${deviceToken}`, error);
      
      return {
        success: 0,
        failure: 1,
        results: [error],
      };
    }
  }

  public async sendToMultipleDevices(
    deviceTokens: string[],
    notification: APNSNotification
  ): Promise<APNSSendResult> {
    try {
      const apnNotification = new apn.Notification({
        alert: {
          title: notification.title,
          body: notification.body,
        },
        sound: notification.sound || 'default',
        badge: notification.badge,
        category: notification.category || 'GENERAL',
        topic: notification.threadId,
        payload: notification.data,
        'content-available': notification.contentAvailable ? 1 : undefined,
        'mutable-content': notification.mutableContent,
      });

      const response = await this.provider.send(apnNotification, deviceTokens);
      this.logger.log(`APNS multicast sent`, { 
        sent: response.sent.length,
        failed: response.failed.length,
        total: deviceTokens.length 
      });
      
      return {
        success: response.sent.length,
        failure: response.failed.length,
        results: [...response.sent, ...response.failed],
      };
    } catch (error) {
      this.logger.error('Failed to send APNS multicast message', error);
      
      return {
        success: 0,
        failure: deviceTokens.length,
        results: [error],
      };
    }
  }

  public async sendToTopic(
    topic: string,
    notification: APNSNotification
  ): Promise<boolean> {
    try {
      const apnNotification = new apn.Notification({
        alert: {
          title: notification.title,
          body: notification.body,
        },
        sound: notification.sound || 'default',
        badge: notification.badge,
        category: notification.category || 'GENERAL',
        topic: notification.threadId,
        payload: notification.data,
        'content-available': notification.contentAvailable ? 1 : undefined,
        'mutable-content': notification.mutableContent,
      });

      const response = await this.provider.send(apnNotification, topic);
      this.logger.log(`APNS topic message sent successfully: ${topic}`, { 
        sent: response.sent.length,
        failed: response.failed.length 
      });
      return response.failed.length === 0;
    } catch (error) {
      this.logger.error(`Failed to send APNS topic message: ${topic}`, error);
      return false;
    }
  }

  public async validateDeviceToken(token: string): Promise<boolean> {
    try {
      // APNS doesn't provide a direct token validation endpoint
      // This is a basic validation by checking token format
      if (!token || token.length !== 64) {
        return false;
      }

      // Try to send a test notification (silent)
      const testNotification = new apn.Notification({
        'content-available': 1,
        'mutable-content': 1,
      });

      const response = await this.provider.send(testNotification, token);
      return response.failed.length === 0;
    } catch (error) {
      this.logger.error(`APNS token validation failed: ${token}`, error);
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
  ): Promise<APNSSendResult> {
    const notification: APNSNotification = {
      title: '🚨 Security Alert',
      body: `${securityEvent.severity.toUpperCase()}: ${securityEvent.message}`,
      data: {
        type: 'security_alert',
        severity: securityEvent.severity,
        eventType: securityEvent.type,
        timestamp: securityEvent.timestamp.toISOString(),
      },
      sound: 'alert.caf',
      category: 'SECURITY',
      contentAvailable: true,
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
  ): Promise<APNSSendResult> {
    const notification: APNSNotification = {
      title: `🤖 Skill ${skillEvent.status}`,
      body: `${skillEvent.skillName}: ${skillEvent.message}`,
      data: {
        type: 'skill_execution',
        skillName: skillEvent.skillName,
        status: skillEvent.status,
        executionTime: skillEvent.executionTime?.toString() || '0',
      },
      sound: 'default',
      category: 'SKILL',
      contentAvailable: true,
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
  ): Promise<APNSSendResult> {
    const notification: APNSNotification = {
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
      category: 'PAYOUT',
      contentAvailable: true,
    };

    return this.sendToMultipleDevices(deviceTokens, notification);
  }

  public async sendInvestorUpdate(
    deviceTokens: string[],
    investorEvent: {
      type: 'roi_update' | 'revenue_report' | 'milestone_reached';
      message: string;
      data?: Record<string, string>;
    }
  ): Promise<APNSSendResult> {
    const notification: APNSNotification = {
      title: '📈 Investor Update',
      body: investorEvent.message,
      data: {
        type: 'investor_update',
        eventType: investorEvent.type,
        ...investorEvent.data,
      },
      sound: 'default',
      category: 'INVESTOR',
      contentAvailable: true,
    };

    return this.sendToMultipleDevices(deviceTokens, notification);
  }

  public async sendPartnerAlert(
    deviceTokens: string[],
    partnerEvent: {
      type: 'trust_score_change' | 'payout_processed' | 'compliance_required';
      message: string;
      data?: Record<string, string>;
    }
  ): Promise<APNSSendResult> {
    const notification: APNSNotification = {
      title: '🤝 Partner Alert',
      body: partnerEvent.message,
      data: {
        type: 'partner_alert',
        eventType: partnerEvent.type,
        ...partnerEvent.data,
      },
      sound: 'default',
      category: 'PARTNER',
      contentAvailable: true,
    };

    return this.sendToMultipleDevices(deviceTokens, notification);
  }
}

export default APNSService.getInstance();
