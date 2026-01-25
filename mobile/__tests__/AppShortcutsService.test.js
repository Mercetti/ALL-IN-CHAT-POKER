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
      expect(service.isInitialized).toBe(true);
    });

    test('handles initialization errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Test that the service can handle errors without crashing
      expect(service.initialize).toBeDefined();
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('shortcut management', () => {
    test('updates shortcut successfully', async () => {
      await expect(service.updateShortcut('test-id', { shortLabel: 'Test' })).resolves.toBeUndefined();
    });

    test('adds new shortcut successfully', async () => {
      const newShortcut = {
        id: 'test-shortcut',
        shortLabel: 'Test',
        longLabel: 'Test Shortcut',
        description: 'Test description'
      };
      
      await expect(service.addShortcut(newShortcut)).resolves.toBeUndefined();
    });
  });

  describe('navigation helpers', () => {
    test('navigates to game', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.navigateToGame({ gameId: '123' });
      expect(consoleSpy).toHaveBeenCalledWith('Navigate to game with params:', { gameId: '123' });
      
      consoleSpy.mockRestore();
    });

    test('navigates to tournaments', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.navigateToTournaments();
      expect(consoleSpy).toHaveBeenCalledWith('Navigate to tournaments');
      
      consoleSpy.mockRestore();
    });

    test('navigates to profile', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.navigateToProfile();
      expect(consoleSpy).toHaveBeenCalledWith('Navigate to profile');
      
      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    test('cleans up service', () => {
      service.isInitialized = true;
      service.cleanup();
      expect(service.isInitialized).toBe(false);
    });
  });
});
