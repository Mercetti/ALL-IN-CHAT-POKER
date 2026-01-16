/**
 * Push Notification System for Acey
 * Phase 3: Dashboard & Mobile UI
 * 
 * This module provides real-time push notifications for critical events
 * including proposals, errors, desync, and financial anomalies
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface PushNotification {
  id: string;
  type: 'proposal' | 'error' | 'desync' | 'financial_anomaly' | 'system_alert' | 'skill_update';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  deviceId?: string;
  userId?: string;
  timestamp: string;
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  expiresAt?: string;
  read: boolean;
  delivered: boolean;
}

export interface PushConfig {
  enabled: boolean;
  serviceWorkerPath: string;
  publicKey: string;
  privateKey: string;
  maxNotifications: number;
  retentionHours: number;
  retryAttempts: number;
  batchInterval: number; // milliseconds
}

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  deviceId: string;
  createdAt: string;
  lastActive: string;
}

export class PushNotificationSystem extends EventEmitter {
  private config: PushConfig;
  private notifications: Map<string, PushNotification> = new Map();
  private subscriptions: Map<string, NotificationSubscription> = new Map();
  private batchQueue: PushNotification[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor(config: PushConfig) {
    super();
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize push notification system
   */
  private initialize(): void {
    try {
      console.log('📱 Initializing Push Notification System...');

      // Load existing data
      this.loadData();

      // Start batch processing
      this.startBatchProcessor();

      // Clean up expired notifications
      this.startCleanupTimer();

      this.isInitialized = true;

      console.log('✅ Push Notification System initialized');
      console.log(`📱 Active subscriptions: ${this.subscriptions.size}`);
      console.log(`📱 Pending notifications: ${this.notifications.size}`);

    } catch (error) {
      console.error('❌ Failed to initialize Push Notification System:', error);
    }
  }

  /**
   * Send proposal notification
   */
  sendProposalNotification(proposalId: string, proposalType: string, proposer: string, details: any): string {
    const notificationId = 'push_proposal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    
    const notification: PushNotification = {
      id: notificationId,
      type: 'proposal',
      priority: 'high',
      title: `New ${proposalType} Proposal`,
      message: `${proposer} has submitted a ${proposalType.toLowerCase()} proposal requiring your review`,
      timestamp: new Date().toISOString(),
      data: {
        proposalId,
        proposalType,
        proposer,
        details
      },
      actions: [
        { label: 'Review', action: 'review_proposal' },
        { label: 'Reject', action: 'reject_proposal', style: 'cancel' },
        { label: 'Approve', action: 'approve_proposal' }
      ],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      read: false,
      delivered: false
    };

    return this.addNotification(notification);
  }

  /**
   * Send error notification
   */
  sendErrorNotification(errorType: string, errorMessage: string, context?: any): string {
    const notificationId = 'push_error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    
    const notification: PushNotification = {
      id: notificationId,
      type: 'error',
      priority: 'critical',
      title: `System Error: ${errorType}`,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      data: {
        errorType,
        errorMessage,
        context
      },
      actions: [
        { label: 'View Details', action: 'view_error' },
        { label: 'Restart System', action: 'restart_system', style: 'destructive' }
      ],
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      read: false,
      delivered: false
    };

    return this.addNotification(notification);
  }

  /**
   * Send desync notification
   */
  sendDesyncNotification(deviceId: string, deviceName: string, syncStatus: string, details?: any): string {
    const notificationId = 'push_desync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    
    const notification: PushNotification = {
      id: notificationId,
      type: 'desync',
      priority: 'high',
      title: `Device Desync Detected`,
      message: `${deviceName} (${deviceId}) is experiencing synchronization issues: ${syncStatus}`,
      deviceId,
      timestamp: new Date().toISOString(),
      data: {
        deviceId,
        deviceName,
        syncStatus,
        details
      },
      actions: [
        { label: 'Force Sync', action: 'force_sync' },
        { label: 'View Device', action: 'view_device' },
        { label: 'Ignore', action: 'ignore_desync', style: 'cancel' }
      ],
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
      read: false,
      delivered: false
    };

    return this.addNotification(notification);
  }

  /**
   * Send financial anomaly notification
   */
  sendFinancialAnomalyNotification(anomalyType: string, amount: number, description: string, details?: any): string {
    const notificationId = 'push_financial_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    
    const notification: PushNotification = {
      id: notificationId,
      type: 'financial_anomaly',
      priority: 'critical',
      title: `Financial Anomaly Detected`,
      message: `${anomalyType}: ${description} - Amount: $${amount.toLocaleString()}`,
      timestamp: new Date().toISOString(),
      data: {
        anomalyType,
        amount,
        description,
        details
      },
      actions: [
        { label: 'Review Transaction', action: 'review_transaction' },
        { label: 'Freeze Account', action: 'freeze_account', style: 'destructive' },
        { label: 'Ignore', action: 'ignore_anomaly', style: 'cancel' }
      ],
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
      read: false,
      delivered: false
    };

    return this.addNotification(notification);
  }

  /**
   * Send system alert notification
   */
  sendSystemAlert(alertType: string, message: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): string {
    const notificationId = 'push_alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    
    const notification: PushNotification = {
      id: notificationId,
      type: 'system_alert',
      priority,
      title: `System Alert: ${alertType}`,
      message,
      timestamp: new Date().toISOString(),
      data: {
        alertType,
        message
      },
      actions: priority === 'critical' ? [
        { label: 'Take Action', action: 'take_action' },
        { label: 'Dismiss', action: 'dismiss', style: 'cancel' }
      ] : [
        { label: 'View Details', action: 'view_details' },
        { label: 'Dismiss', action: 'dismiss', style: 'cancel' }
      ],
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours
      read: false,
      delivered: false
    };

    return this.addNotification(notification);
  }

  /**
   * Send skill update notification
   */
  sendSkillUpdateNotification(skillName: string, updateType: string, details?: any): string {
    const notificationId = 'push_skill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    
    const notification: PushNotification = {
      id: notificationId,
      type: 'skill_update',
      priority: 'medium',
      title: `Skill Update: ${skillName}`,
      message: `${skillName} has ${updateType.toLowerCase()}`,
      timestamp: new Date().toISOString(),
      data: {
        skillName,
        updateType,
        details
      },
      actions: [
        { label: 'View Skill', action: 'view_skill' },
        { label: 'Update Now', action: 'update_skill' },
        { label: 'Later', action: 'update_later', style: 'cancel' }
      ],
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
      read: false,
      delivered: false
    };

    return this.addNotification(notification);
  }

  /**
   * Add notification to system
   */
  private addNotification(notification: PushNotification): string {
    // Store notification
    this.notifications.set(notification.id, notification);
    
    // Add to batch queue
    this.batchQueue.push(notification);
    
    // Save data
    this.saveData();
    
    console.log(`📱 Push notification queued: ${notification.title}`);
    console.log(`📱 Type: ${notification.type}`);
    console.log(`📱 Priority: ${notification.priority}`);
    
    // Emit event
    this.emit('notificationAdded', notification);
    
    // Process batch immediately for critical notifications
    if (notification.priority === 'critical') {
      this.processBatch();
    }
    
    return notification.id;
  }

  /**
   * Register device for push notifications
   */
  registerDevice(subscription: NotificationSubscription): string {
    const subscriptionId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    
    const enhancedSubscription: NotificationSubscription = {
      ...subscription,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    
    this.subscriptions.set(subscriptionId, enhancedSubscription);
    this.saveData();
    
    console.log(`📱 Device registered for push notifications: ${subscription.deviceId}`);
    console.log(`📱 User: ${subscription.userId}`);
    
    this.emit('deviceRegistered', enhancedSubscription);
    
    return subscriptionId;
  }

  /**
   * Unregister device
   */
  unregisterDevice(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      this.saveData();
      
      console.log(`📱 Device unregistered: ${subscription.deviceId}`);
      this.emit('deviceUnregistered', subscription);
      
      return true;
    }
    
    return false;
  }

  /**
   * Start batch processor
   */
  private startBatchProcessor(): void {
    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, this.config.batchInterval);
  }

  /**
   * Process batch queue
   */
  private processBatch(): void {
    if (this.batchQueue.length === 0) {
      return;
    }
    
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    
    console.log(`📱 Processing batch of ${batch.length} notifications`);
    
    // Simulate push notification delivery
    batch.forEach(notification => {
      this.deliverNotification(notification);
    });
    
    this.emit('batchProcessed', batch);
  }

  /**
   * Deliver notification to all subscribed devices
   */
  private deliverNotification(notification: PushNotification): void {
    let deliveredCount = 0;
    
    for (const [subscriptionId, subscription] of this.subscriptions) {
      try {
        // Simulate push notification delivery
        const success = this.simulatePushDelivery(subscription, notification);
        
        if (success) {
          deliveredCount++;
          notification.delivered = true;
          
          // Update subscription last active
          subscription.lastActive = new Date().toISOString();
        }
      } catch (error) {
        console.error(`❌ Failed to deliver to ${subscription.deviceId}:`, error);
      }
    }
    
    console.log(`📱 Delivered ${notification.title} to ${deliveredCount} devices`);
    this.emit('notificationDelivered', notification, deliveredCount);
  }

  /**
   * Simulate push notification delivery
   */
  private simulatePushDelivery(subscription: NotificationSubscription, notification: PushNotification): boolean {
    // In a real implementation, this would use Web Push Protocol
    // For now, we simulate successful delivery
    
    console.log(`📱 Simulating delivery to ${subscription.deviceId}:`);
    console.log(`📱 Title: ${notification.title}`);
    console.log(`📱 Message: ${notification.message}`);
    console.log(`📱 Actions: ${notification.actions?.length || 0}`);
    
    // Simulate 95% success rate
    return Math.random() > 0.05;
  }

  /**
   * Get notifications for user
   */
  getUserNotifications(userId: string, limit: number = 50): PushNotification[] {
    const notifications = Array.from(this.notifications.values())
      .filter(notification => !notification.userId || notification.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    return notifications;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    
    if (notification) {
      notification.read = true;
      this.saveData();
      
      console.log(`📱 Notification marked as read: ${notificationId}`);
      this.emit('notificationRead', notification);
      
      return true;
    }
    
    return false;
  }

  /**
   * Get notification statistics
   */
  getNotificationStatistics(): any {
    const notifications = Array.from(this.notifications.values());
    const now = new Date();
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      delivered: notifications.filter(n => n.delivered).length,
      pending: notifications.filter(n => !n.delivered).length,
      expired: notifications.filter(n => n.expiresAt && new Date(n.expiresAt) < now).length,
      byType: {},
      byPriority: {},
      subscriptions: this.subscriptions.size,
      avgDeliveryRate: 0.95 // Simulated
    };
    
    // Count by type
    notifications.forEach(notification => {
      if (!stats.byType[notification.type]) {
        stats.byType[notification.type] = 0;
      }
      stats.byType[notification.type]++;
    });
    
    // Count by priority
    notifications.forEach(notification => {
      if (!stats.byPriority[notification.priority]) {
        stats.byPriority[notification.priority] = 0;
      }
      stats.byPriority[notification.priority]++;
    });
    
    return stats;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredNotifications();
    }, 60 * 60 * 1000); // Hourly cleanup
  }

  /**
   * Clean up expired notifications
   */
  private cleanupExpiredNotifications(): void {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.expiresAt && new Date(notification.expiresAt) < now) {
        this.notifications.delete(id);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.saveData();
      console.log(`🧹 Cleaned up ${cleanedCount} expired notifications`);
      this.emit('notificationsCleaned', cleanedCount);
    }
  }

  /**
   * Load data from storage
   */
  private loadData(): void {
    try {
      const dataPath = './models/device_sync/notifications/push_data.json';
      
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        
        // Load notifications
        if (data.notifications) {
          Object.entries(data.notifications).forEach(([id, notification]) => {
            this.notifications.set(id, notification as PushNotification);
          });
        }
        
        // Load subscriptions
        if (data.subscriptions) {
          Object.entries(data.subscriptions).forEach(([id, subscription]) => {
            this.subscriptions.set(id, subscription as NotificationSubscription);
          });
        }
        
        console.log('📂 Push notification data loaded');
      }
    } catch (error) {
      console.error('❌ Error loading push notification data:', error);
    }
  }

  /**
   * Save data to storage
   */
  private saveData(): void {
    try {
      const dataDir = './models/device_sync/notifications';
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const dataPath = path.join(dataDir, 'push_data.json');
      
      const data = {
        notifications: Object.fromEntries(this.notifications),
        subscriptions: Object.fromEntries(this.subscriptions),
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error saving push notification data:', error);
    }
  }

  /**
   * Test push notification system
   */
  testNotifications(): void {
    console.log('🧪 Testing push notification system...');
    
    // Test proposal notification
    this.sendProposalNotification('prop_001', 'Skill Installation', 'Developer A', {
      skillName: 'NewAnalyticsSkill',
      version: '1.0.0',
      description: 'Advanced data analysis capabilities'
    });
    
    // Test error notification
    this.sendErrorNotification('Skill Execution Failed', 'CodeHelper skill failed to execute', {
      skill: 'CodeHelper',
      error: 'Timeout after 30 seconds',
      input: 'Generate complex algorithm'
    });
    
    // Test desync notification
    this.sendDesyncNotification('device_mobile_001', 'Acey-Mobile', 'Sync Timeout', {
      lastSync: new Date(Date.now() - 3600000).toISOString(),
      retryCount: 3
    });
    
    // Test financial anomaly
    this.sendFinancialAnomalyNotification('Unusual Transaction', 5000, 'Large payout detected', {
      partner: 'Unknown Partner',
      transactionId: 'txn_001',
      timestamp: new Date().toISOString()
    });
    
    // Test system alert
    this.sendSystemAlert('High CPU Usage', 'System CPU usage exceeded 90%', 'high');
    
    // Test skill update
    this.sendSkillUpdateNotification('CodeHelper', 'New Version Available', {
      currentVersion: '1.0.0',
      newVersion: '1.1.0',
      features: ['Improved error handling', 'Faster execution']
    });
    
    console.log('✅ Push notification system test complete');
  }

  /**
   * Shutdown push notification system
   */
  shutdown(): void {
    console.log('🔄 Shutting down Push Notification System...');
    
    // Stop batch processor
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Process remaining notifications
    this.processBatch();
    
    // Save final data
    this.saveData();
    
    this.isInitialized = false;
    
    console.log('✅ Push Notification System shutdown complete');
  }
}

export default PushNotificationSystem;
