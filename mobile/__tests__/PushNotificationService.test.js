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

describe('PushNotificationService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PushNotificationService();
  });

  describe('initialization', () => {
    test('initializes successfully', async () => {
      await expect(service.initialize()).resolves.toBeUndefined();
      expect(service.isInitialized).toBe(true);
    });
  });

  describe('permissions', () => {
    test('gets permissions status', () => {
      const permissions = service.getPermissions();
      expect(permissions).toBeDefined();
    });

    test('requests permissions successfully', async () => {
      await expect(service.requestPermissions()).resolves.toBeUndefined();
      expect(service.getPermissions()).toBeDefined();
    });
  });

  describe('local notifications', () => {
    test('sends local notification successfully', async () => {
      const notification = {
        title: 'Test Notification',
        body: 'Test body',
        data: { type: 'test' }
      };
      
      await expect(service.sendLocalNotification(notification)).resolves.toBeUndefined();
    });
  });

  describe('navigation helpers', () => {
    test('navigates to tournament', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.navigateToTournament('123');
      expect(consoleSpy).toHaveBeenCalledWith('Navigate to tournament:', '123');
      
      consoleSpy.mockRestore();
    });

    test('navigates to chat', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.navigateToChat();
      expect(consoleSpy).toHaveBeenCalledWith('Navigate to chat');
      
      consoleSpy.mockRestore();
    });

    test('navigates to app', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.navigateToApp();
      expect(consoleSpy).toHaveBeenCalledWith('Navigate to app');
      
      consoleSpy.mockRestore();
    });
  });
});
