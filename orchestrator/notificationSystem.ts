/**
 * Notification System for Acey
 * Phase 2: Device Sync & Security
 * 
 * This module provides owner-only notifications for device events,
 * security alerts, and system status updates
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface Notification {
  id: string;
  type: 'device_event' | 'security_alert' | 'system_status' | 'sync_update' | 'trust_event';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  deviceId?: string;
  userId?: string;
  timestamp: string;
  read: boolean;
  metadata?: any;
}

export interface NotificationConfig {
  ownerUserId: string;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  enableSMSNotifications: boolean;
  retentionDays: number;
  maxNotifications: number;
  notificationPath: string;
}

export interface NotificationFilter {
  types?: string[];
  priorities?: string[];
  devices?: string[];
  unreadOnly?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export class NotificationSystem extends EventEmitter {
  private config: NotificationConfig;
  private notifications: Map<string, Notification> = new Map();
  private notificationQueue: Notification[] = [];

  constructor(config: NotificationConfig) {
    super();
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize notification system
   */
  private initialize(): void {
    console.log('📢 Initializing Notification System...');
    
    // Load existing notifications
    this.loadNotifications();
    
    // Start cleanup timer
    this.startCleanupTimer();
    
    console.log('✅ Notification System initialized');
    console.log(`👤 Owner User ID: ${this.config.ownerUserId}`);
    console.log(`📢 Notifications loaded: ${this.notifications.size}`);
  }

  /**
   * Send notification to owner only
   */
  sendToOwner(type: Notification['type'], priority: Notification['priority'], title: string, message: string, metadata?: any): string {
    const notificationId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    
    const notification: Notification = {
      id: notificationId,
      type,
      priority,
      title,
      message,
      userId: this.config.ownerUserId, // Always send to owner
      timestamp: new Date().toISOString(),
      read: false,
      metadata
    };
    
    // Store notification
    this.notifications.set(notificationId, notification);
    this.saveNotifications();
    
    // Add to queue for delivery
    this.notificationQueue.push(notification);
    
    console.log(`📢 Owner notification sent: ${title}`);
    console.log(`📄 Message: ${message}`);
    console.log(`🔔 Priority: ${priority}`);
    console.log(`📅 Timestamp: ${notification.timestamp}`);
    
    // Emit events
    this.emit('notificationSent', notification);
    this.emit('ownerNotification', notification);
    
    // Process queue
    this.processNotificationQueue();
    
    return notificationId;
  }

  /**
   * Send device event notification
   */
  sendDeviceEvent(deviceId: string, event: string, details?: any): string {
    const title = `Device Event: ${event}`;
    const message = `Device ${deviceId} has triggered event: ${event}`;
    
    return this.sendToOwner('device_event', 'medium', title, message, {
      deviceId,
      event,
      details
    });
  }

  /**
   * Send security alert notification
   */
  sendSecurityAlert(deviceId: string, alert: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any): string {
    const title = `Security Alert: ${alert}`;
    const message = `Security alert on device ${deviceId}: ${alert}`;
    
    return this.sendToOwner('security_alert', severity, title, message, {
      deviceId,
      alert,
      severity,
      details
    });
  }

  /**
   * Send sync update notification
   */
  sendSyncUpdate(deviceId: string, status: string, details?: any): string {
    const title = `Sync Update: ${status}`;
    const message = `Device ${deviceId} sync status: ${status}`;
    
    return this.sendToOwner('sync_update', 'low', title, message, {
      deviceId,
      status,
      details
    });
  }

  /**
   * Send trust event notification
   */
  sendTrustEvent(deviceId: string, event: string, details?: any): string {
    const title = `Trust Event: ${event}`;
    const message = `Trust event on device ${deviceId}: ${event}`;
    
    return this.sendToOwner('trust_event', 'high', title, message, {
      deviceId,
      event,
      details
    });
  }

  /**
   * Send system status notification
   */
  sendSystemStatus(status: string, details?: any): string {
    const title = `System Status: ${status}`;
    const message = `Acey system status: ${status}`;
    
    return this.sendToOwner('system_status', 'medium', title, message, {
      status,
      details
    });
  }

  /**
   * Get notifications for owner
   */
  getOwnerNotifications(filter?: NotificationFilter): Notification[] {
    const ownerNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === this.config.ownerUserId);
    
    if (!filter) {
      return ownerNotifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
    
    let filtered = ownerNotifications;
    
    // Filter by type
    if (filter.types && filter.types.length > 0) {
      filtered = filtered.filter(notification => 
        filter.types.includes(notification.type)
      );
    }
    
    // Filter by priority
    if (filter.priorities && filter.priorities.length > 0) {
      filtered = filtered.filter(notification => 
        filter.priorities.includes(notification.priority)
      );
    }
    
    // Filter by device
    if (filter.devices && filter.devices.length > 0) {
      filtered = filtered.filter(notification => 
        !notification.deviceId || filter.devices.includes(notification.deviceId)
      );
    }
    
    // Filter by read status
    if (filter.unreadOnly) {
      filtered = filtered.filter(notification => !notification.read);
    }
    
    // Filter by date range
    if (filter.dateRange) {
      const startDate = new Date(filter.dateRange.start);
      const endDate = new Date(filter.dateRange.end);
      filtered = filtered.filter(notification => {
        const notificationDate = new Date(notification.timestamp);
        return notificationDate >= startDate && notificationDate <= endDate;
      });
    }
    
    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    
    if (!notification) {
      console.log(`❌ Notification not found: ${notificationId}`);
      return false;
    }
    
    if (notification.userId !== this.config.ownerUserId) {
      console.log(`❌ Access denied: not owner notification`);
      return false;
    }
    
    notification.read = true;
    this.saveNotifications();
    
    console.log(`📖 Notification marked as read: ${notificationId}`);
    this.emit('notificationRead', notification);
    
    return true;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): number {
    const ownerNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === this.config.ownerUserId && !notification.read);
    
    ownerNotifications.forEach(notification => {
      notification.read = true;
    });
    
    this.saveNotifications();
    
    console.log(`📖 Marked ${ownerNotifications.length} notifications as read`);
    this.emit('allNotificationsRead', ownerNotifications.length);
    
    return ownerNotifications.length;
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    
    if (!notification) {
      console.log(`❌ Notification not found: ${notificationId}`);
      return false;
    }
    
    if (notification.userId !== this.config.ownerUserId) {
      console.log(`❌ Access denied: not owner notification`);
      return false;
    }
    
    this.notifications.delete(notificationId);
    this.saveNotifications();
    
    console.log(`🗑️ Notification deleted: ${notificationId}`);
    this.emit('notificationDeleted', notification);
    
    return true;
  }

  /**
   * Get notification statistics
   */
  getNotificationStatistics(): any {
    const ownerNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === this.config.ownerUserId);
    
    const unreadNotifications = ownerNotifications.filter(notification => !notification.read);
    
    const typeStats = {};
    const priorityStats = {};
    
    ownerNotifications.forEach(notification => {
      // Type statistics
      if (!typeStats[notification.type]) {
        typeStats[notification.type] = 0;
      }
      typeStats[notification.type]++;
      
      // Priority statistics
      if (!priorityStats[notification.priority]) {
        priorityStats[notification.priority] = 0;
      }
      priorityStats[notification.priority]++;
    });
    
    return {
      total: ownerNotifications.length,
      unread: unreadNotifications.length,
      read: ownerNotifications.length - unreadNotifications.length,
      byType: typeStats,
      byPriority: priorityStats,
      retentionDays: this.config.retentionDays,
      maxNotifications: this.config.maxNotifications
    };
  }

  /**
   * Process notification queue
   */
  private processNotificationQueue(): void {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      
      // Send email notification
      if (this.config.enableEmailNotifications) {
        this.sendEmailNotification(notification);
      }
      
      // Send push notification
      if (this.config.enablePushNotifications) {
        this.sendPushNotification(notification);
      }
      
      // Send SMS notification
      if (this.config.enableSMSNotifications) {
        this.sendSMSNotification(notification);
      }
    }
  }

  /**
   * Send email notification (simulated)
   */
  private sendEmailNotification(notification: Notification): void {
    console.log(`📧 Email notification sent: ${notification.title}`);
    console.log(`📧 To: ${notification.userId}@example.com`);
    console.log(`📧 Subject: [Acey] ${notification.title}`);
    console.log(`📧 Body: ${notification.message}`);
    
    this.emit('emailNotificationSent', notification);
  }

  /**
   * Send push notification (simulated)
   */
  private sendPushNotification(notification: Notification): void {
    console.log(`📱 Push notification sent: ${notification.title}`);
    console.log(`📱 Device: ${notification.userId}'s device`);
    console.log(`📱 Message: ${notification.message}`);
    
    this.emit('pushNotificationSent', notification);
  }

  /**
   * Send SMS notification (simulated)
   */
  private sendSMSNotification(notification: Notification): void {
    if (notification.priority === 'critical' || notification.priority === 'high') {
      console.log(`📱 SMS notification sent: ${notification.title}`);
      console.log(`📱 To: ${notification.userId}'s phone`);
      console.log(`📱 Message: ${notification.message}`);
      
      this.emit('smsNotificationSent', notification);
    }
  }

  /**
   * Load notifications from storage
   */
  private loadNotifications(): void {
    try {
      const notificationsPath = path.join(this.config.notificationPath, 'notifications.json');
      
      if (fs.existsSync(notificationsPath)) {
        const data = JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'));
        
        Object.entries(data.notifications || {}).forEach(([id, notification]) => {
          this.notifications.set(id, notification as Notification);
        });
        
        console.log('📂 Notifications loaded from storage');
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  }

  /**
   * Save notifications to storage
   */
  private saveNotifications(): void {
    try {
      const notificationsPath = path.join(this.config.notificationPath, 'notifications.json');
      
      const data = {
        notifications: Object.fromEntries(this.notifications),
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(notificationsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error saving notifications:', error);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupOldNotifications();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  /**
   * Clean up old notifications
   */
  private cleanupOldNotifications(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    let cleanedCount = 0;
    
    for (const [id, notification] of this.notifications.entries()) {
      const notificationDate = new Date(notification.timestamp);
      
      if (notificationDate < cutoffDate) {
        this.notifications.delete(id);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.saveNotifications();
      console.log(`🧹 Cleaned up ${cleanedCount} old notifications`);
      this.emit('notificationsCleaned', cleanedCount);
    }
  }

  /**
   * Generate notification report
   */
  generateNotificationReport(): string {
    const stats = this.getNotificationStatistics();
    const recentNotifications = this.getOwnerNotifications({
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        end: new Date().toISOString()
      }
    });
    
    const report = `
# Notification System Report

## Current Status
- Total Notifications: ${stats.total}
- Unread Notifications: ${stats.unread}
- Read Notifications: ${stats.read}
- Owner User ID: ${this.config.ownerUserId}

## Notification Types
${Object.entries(stats.byType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

## Priority Distribution
${Object.entries(stats.byPriority).map(([priority, count]) => `- ${priority}: ${count}`).join('\n')}

## Recent Notifications (Last 7 Days)
${recentNotifications.slice(0, 10).map(notification => `
### ${notification.title}
- **Type**: ${notification.type}
- **Priority**: ${notification.priority}
- **Time**: ${notification.timestamp}
- **Status**: ${notification.read ? '✅ Read' : '🔔 Unread'}
- **Message**: ${notification.message}
`).join('\n')}

## Configuration
- Email Notifications: ${this.config.enableEmailNotifications ? '✅ Enabled' : '❌ Disabled'}
- Push Notifications: ${this.config.enablePushNotifications ? '✅ Enabled' : '❌ Disabled'}
- SMS Notifications: ${this.config.enableSMSNotifications ? '✅ Enabled' : '❌ Disabled'}
- Retention Days: ${this.config.retentionDays}
- Max Notifications: ${this.config.maxNotifications}

## Recommendations
${stats.unread > 0 ? '🔔 You have unread notifications that require attention' : '✅ All notifications are read'}
${stats.byPriority.critical > 0 || stats.byPriority.high > 0 ? '⚠️ High priority notifications need immediate attention' : '✅ No critical alerts'}

---
Generated: ${new Date().toISOString()}
    `.trim();
    
    const reportPath = path.join(this.config.notificationPath, `notification_report_${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Notification report generated: ${reportPath}`);
    return report;
  }

  /**
   * Test notification system
   */
  testNotifications(): void {
    console.log('🧪 Testing notification system...');
    
    // Test device event
    this.sendDeviceEvent('device_test_001', 'connected', {
      connectionType: 'wifi',
      ipAddress: '192.168.1.100'
    });
    
    // Test security alert
    this.sendSecurityAlert('device_test_001', 'unauthorized_access_attempt', 'high', {
      sourceIp: '10.0.0.1',
      attemptedAction: 'admin_access'
    });
    
    // Test sync update
    this.sendSyncUpdate('device_test_001', 'sync_completed', {
      syncedItems: 25,
      duration: 120
    });
    
    // Test trust event
    this.sendTrustEvent('device_test_001', 'biometric_verified', {
      biometricType: 'fingerprint',
      confidence: 0.95
    });
    
    // Test system status
    this.sendSystemStatus('operational', {
      uptime: '99.9%',
      activeDevices: 3
    });
    
    console.log('✅ Notification system test complete');
  }
}

export default NotificationSystem;
