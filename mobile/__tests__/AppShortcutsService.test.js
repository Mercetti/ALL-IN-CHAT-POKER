/**
 * AppShortcutsService Tests
 * App shortcuts functionality testing
 */

import AppShortcutsService from '../src/services/AppShortcutsService';

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '14.0',
  },
}));

jest.mock('react-native-shortcuts', () => ({
  Shortcuts: {
    suggest: jest.fn(() => Promise.resolve()),
    present: jest.fn(() => Promise.resolve()),
    getInitialShortcut: jest.fn(() => Promise.resolve(null)),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('AppShortcutsService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AppShortcutsService();
  });

  describe('initialization', () => {
    test('initializes successfully', async () => {
      await expect(service.initialize()).resolves.toBeUndefined();
    });

    test('handles initialization errors gracefully', async () => {
      const { Shortcuts } = require('react-native-shortcuts');
      Shortcuts.suggest.mockRejectedValueOnce(new Error('Shortcuts not available'));

      await expect(service.initialize()).resolves.toBeUndefined();
    });
  });

  describe('shortcut creation', () => {
    test('creates poker game shortcut', async () => {
      await service.createPokerShortcut();

      const { Shortcuts } = require('react-native-shortcuts');
      expect(Shortcuts.suggest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'poker-game',
          shortTitle: 'Poker Game',
          longTitle: 'All-In Chat Poker',
          description: 'Quick access to poker game',
        })
      );
    });

    test('creates tournament shortcut', async () => {
      await service.createTournamentShortcut();

      const { Shortcuts } = require('react-native-shortcuts');
      expect(Shortcuts.suggest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tournament',
          shortTitle: 'Tournaments',
          longTitle: 'Poker Tournaments',
          description: 'Join poker tournaments',
        })
      );
    });

    test('creates profile shortcut', async () => {
      await service.createProfileShortcut();

      const { Shortcuts } = require('react-native-shortcuts');
      expect(Shortcuts.suggest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'profile',
          shortTitle: 'Profile',
          longTitle: 'Player Profile',
          description: 'View player profile',
        })
      );
    });
  });

  describe('shortcut management', () => {
    test('gets all available shortcuts', () => {
      const shortcuts = service.getAvailableShortcuts();
      
      expect(shortcuts).toEqual([
        {
          id: 'poker-game',
          title: 'Poker Game',
          description: 'Quick access to poker game',
          icon: '🎰',
        },
        {
          id: 'tournament',
          title: 'Tournaments',
          description: 'Join poker tournaments',
          icon: '🏆',
        },
        {
          id: 'profile',
          title: 'Profile',
          description: 'View player profile',
          icon: '👤',
        },
      ]);
    });

    test('removes specific shortcut', async () => {
      await service.removeShortcut('poker-game');

      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('shortcut_poker-game');
    });

    test('clears all shortcuts', async () => {
      await service.clearAllShortcuts();

      const { Shortcuts } = require('react-native-shortcuts');
      expect(Shortcuts.clear).toHaveBeenCalled();
    });
  });

  describe('shortcut handling', () => {
    test('handles poker shortcut launch', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      await service.handleShortcut('poker-game', mockNavigation);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Game');
    });

    test('handles tournament shortcut launch', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      await service.handleShortcut('tournament', mockNavigation);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Tournaments');
    });

    test('handles profile shortcut launch', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      await service.handleShortcut('profile', mockNavigation);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Profile');
    });

    test('handles unknown shortcut gracefully', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      await service.handleShortcut('unknown', mockNavigation);

      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });

  describe('platform compatibility', () => {
    test('checks iOS support', () => {
      const isSupported = service.isPlatformSupported();
      expect(isSupported).toBe(true);
    });

    test('handles Android platform', () => {
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'android',
          Version: '11',
        },
      }));

      const isSupported = service.isPlatformSupported();
      expect(isSupported).toBe(true);
    });

    test('handles unsupported platform', () => {
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'web',
          Version: '1.0',
        },
      }));

      const isSupported = service.isPlatformSupported();
      expect(isSupported).toBe(false);
    });
  });

  describe('error handling', () => {
    test('handles shortcut creation errors', async () => {
      const { Shortcuts } = require('react-native-shortcuts');
      Shortcuts.suggest.mockRejectedValueOnce(new Error('Shortcut creation failed'));

      await expect(service.createPokerShortcut()).resolves.toBeUndefined();
    });

    test('handles shortcut removal errors', async () => {
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Storage error'));

      await expect(service.removeShortcut('poker-game')).resolves.toBeUndefined();
    });
  });
});
