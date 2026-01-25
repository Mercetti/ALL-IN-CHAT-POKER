/**
 * PushNotificationService Tests
 * Push notification functionality testing
 */

import PushNotificationService from '../src/services/PushNotificationService';

// Mock React Native modules
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-permissions', () => ({
  request: jest.fn(() => Promise.resolve('granted')),
  check: jest.fn(() => Promise.resolve('granted')),
  openSettings: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-firebase/app', () => ({
  firebase: {
    apps: [],
    initializeApp: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/messaging', () => ({
  messaging: () => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    hasPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve('mock-token')),
    onTokenRefresh: jest.fn(),
    onMessage: jest.fn(),
    subscribeToTopic: jest.fn(() => Promise.resolve()),
    unsubscribeFromTopic: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock('@react-native-firebase/notifications', () => ({
  notifications: () => ({
    requestPermission: jest.fn(() => Promise.resolve(true)),
    onNotification: jest.fn(),
    displayNotification: jest.fn(),
    cancelAllNotifications: jest.fn(),
    getScheduledNotifications: jest.fn(() => Promise.resolve([])),
    scheduleNotification: jest.fn(() => Promise.resolve()),
  }),
}));

describe('PushNotificationService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PushNotificationService();
  });

  describe('initialization', () => {
    test('initializes successfully', async () => {
      await expect(service.initialize()).resolves.toBeUndefined();
    });

    test('handles permission request', async () => {
      await service.requestPermissions();
      
      const { check } = require('react-native-permissions');
      expect(check).toHaveBeenCalled();
    });

    test('handles permission denial', async () => {
      const { check } = require('react-native-permissions');
      check.mockResolvedValueOnce('denied');

      const hasPermission = await service.checkPermissions();
      expect(hasPermission).toBe(false);
    });
  });

  describe('token management', () => {
    test('gets FCM token', async () => {
      const { messaging } = require('@react-native-firebase/messaging');
      messaging().getToken.mockResolvedValueOnce('test-fcm-token');

      const token = await service.getFCMToken();
      expect(token).toBe('test-fcm-token');
    });

    test('handles token refresh', async () => {
      const mockCallback = jest.fn();
      
      service.onTokenRefresh(mockCallback);
      
      const { messaging } = require('@react-native-firebase/messaging');
      expect(messaging().onTokenRefresh).toHaveBeenCalled();
    });

    test('saves token to storage', async () => {
      const { messaging } = require('@react-native-firebase/messaging');
      messaging().getToken.mockResolvedValueOnce('test-token');

      await service.saveFCMToken();
      
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'fcm_token',
        'test-token'
      );
    });
  });

  describe('topic subscription', () => {
    test('subscribes to poker updates', async () => {
      await service.subscribeToPokerUpdates();
      
      const { messaging } = require('@react-native-firebase/messaging');
      expect(messaging().subscribeToTopic).toHaveBeenCalledWith('poker-updates');
    });

    test('subscribes to tournaments', async () => {
      await service.subscribeToTournaments();
      
      const { messaging } = require('@react-native-firebase/messaging');
      expect(messaging().subscribeToTopic).toHaveBeenCalledWith('tournaments');
    });

    test('subscribes to friend requests', async () => {
      await service.subscribeToFriendRequests();
      
      const { messaging } = require('@react-native-firebase/messaging');
      expect(messaging().subscribeToTopic).toHaveBeenCalledWith('friend-requests');
    });

    test('unsubscribes from topics', async () => {
      await service.unsubscribeFromTopic('poker-updates');
      
      const { messaging } = require('@react-native-firebase/messaging');
      expect(messaging().unsubscribeFromTopic).toHaveBeenCalledWith('poker-updates');
    });
  });

  describe('notification handling', () => {
    test('handles incoming messages', async () => {
      const mockCallback = jest.fn();
      
      service.onMessage(mockCallback);
      
      const { messaging } = require('@react-native-firebase/messaging');
      expect(messaging().onMessage).toHaveBeenCalled();
    });

    test('displays local notification', async () => {
      await service.displayLocalNotification({
        title: 'Test Notification',
        body: 'Test message',
        data: { type: 'test' },
      });
      
      const { notifications } = require('@react-native-firebase/notifications');
      expect(notifications().displayNotification).toHaveBeenCalled();
    });

    test('schedules notification', async () => {
      await service.scheduleNotification({
        title: 'Scheduled Notification',
        body: 'Scheduled message',
        date: new Date(Date.now() + 60000), // 1 minute from now
      });
      
      const { notifications } = require('@react-native-firebase/notifications');
      expect(notifications().scheduleNotification).toHaveBeenCalled();
    });

    test('cancels all notifications', async () => {
      await service.cancelAllNotifications();
      
      const { notifications } = require('@react-native-firebase/notifications');
      expect(notifications().cancelAllNotifications).toHaveBeenCalled();
    });
  });

  describe('notification types', () => {
    test('creates poker game notification', async () => {
      await service.sendPokerGameNotification({
        gameType: 'Texas Hold\'em',
        buyIn: 1000,
        players: 6,
      });
      
      const { notifications } = require('@react-native-firebase/notifications');
      expect(notifications().displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Poker Game'),
          body: expect.stringContaining('Texas Hold\'em'),
        })
      );
    });

    test('creates tournament notification', async () => {
      await service.sendTournamentNotification({
        tournamentName: 'Weekly Championship',
        startTime: new Date(),
        prizePool: 50000,
      });
      
      const { notifications } = require('@react-native-firebase/notifications');
      expect(notifications().displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Tournament'),
          body: expect.stringContaining('Weekly Championship'),
        })
      );
    });

    test('creates friend request notification', async () => {
      await service.sendFriendRequestNotification({
        username: 'testuser',
        message: 'wants to be your friend',
      });
      
      const { notifications } = require('@react-native-firebase/notifications');
      expect(notifications().displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Friend Request'),
          body: expect.stringContaining('testuser'),
        })
      );
    });

    test('creates achievement notification', async () => {
      await service.sendAchievementNotification({
        achievement: 'First Win',
        description: 'Won your first poker game',
      });
      
      const { notifications } = require('@react-native-firebase/notifications');
      expect(notifications().displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Achievement'),
          body: expect.stringContaining('First Win'),
        })
      );
    });
  });

  describe('settings and preferences', () => {
    test('gets notification settings', async () => {
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
        pokerGames: true,
        tournaments: true,
        friendRequests: false,
        achievements: true,
      }));

      const settings = await service.getNotificationSettings();
      expect(settings).toEqual({
        pokerGames: true,
        tournaments: true,
        friendRequests: false,
        achievements: true,
      });
    });

    test('updates notification settings', async () => {
      const newSettings = {
        pokerGames: false,
        tournaments: true,
        friendRequests: true,
        achievements: false,
      };

      await service.updateNotificationSettings(newSettings);
      
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'notification_settings',
        JSON.stringify(newSettings)
      );
    });

    test('checks if notification type is enabled', async () => {
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
        pokerGames: true,
        tournaments: false,
        friendRequests: true,
        achievements: false,
      }));

      const isPokerEnabled = await service.isNotificationTypeEnabled('pokerGames');
      const isTournamentEnabled = await service.isNotificationTypeEnabled('tournaments');
      
      expect(isPokerEnabled).toBe(true);
      expect(isTournamentEnabled).toBe(false);
    });
  });

  describe('error handling', () => {
    test('handles FCM token error gracefully', async () => {
      const { messaging } = require('@react-native-firebase/messaging');
      messaging().getToken.mockRejectedValueOnce(new Error('Token error'));

      const token = await service.getFCMToken();
      expect(token).toBeNull();
    });

    test('handles subscription error gracefully', async () => {
      const { messaging } = require('@react-native-firebase/messaging');
      messaging().subscribeToTopic.mockRejectedValueOnce(new Error('Subscription error'));

      await expect(service.subscribeToPokerUpdates()).resolves.toBeUndefined();
    });

    test('handles notification display error gracefully', async () => {
      const { notifications } = require('@react-native-firebase/notifications');
      notifications().displayNotification.mockRejectedValueOnce(new Error('Display error'));

      await expect(service.displayLocalNotification({
        title: 'Test',
        body: 'Test message',
      })).resolves.toBeUndefined();
    });
  });
});
