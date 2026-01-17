/**
 * App Shortcuts Service
 * Android-specific app shortcuts for quick access
 */

import { Platform } from 'react-native';
/* eslint-disable */

class AppShortcutsService {
  constructor() {
    this.shortcuts = [];
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing app shortcuts...');
      
      if (Platform.OS === 'android') {
        await this.initializeAndroidShortcuts();
      } else if (Platform.OS === 'ios') {
        await this.initializeiOSShortcuts();
      }
      
      this.isInitialized = true;
      console.log('App shortcuts initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app shortcuts:', error);
    }
  }

  async initializeAndroidShortcuts() {
    try {
      console.log('Setting up Android shortcuts...');
      
      this.shortcuts = [
        {
          id: 'quick_game',
          shortLabel: 'Quick Game',
          longLabel: 'Start Quick Game',
          description: 'Start a new poker game quickly',
          icon: 'game_controller',
          uri: 'allinchatpoker://quickgame'
        },
        {
          id: 'tournaments',
          shortLabel: 'Tournaments',
          longLabel: 'View Tournaments',
          description: 'Browse available tournaments',
          icon: 'trophy',
          uri: 'allinchatpoker://tournaments'
        },
        {
          id: 'profile',
          shortLabel: 'Profile',
          longLabel: 'My Profile',
          description: 'View your poker profile',
          icon: 'person',
          uri: 'allinchatpoker://profile'
        }
      ];
      
      console.log('Android shortcuts configured:', this.shortcuts);
    } catch (error) {
      console.error('Failed to initialize Android shortcuts:', error);
    }
  }

  async initializeiOSShortcuts() {
    try {
      console.log('Setting up iOS shortcuts...');
      
      this.shortcuts = [
        {
          id: 'quick_game',
          shortLabel: 'Quick Game',
          longLabel: 'Start Quick Game',
          description: 'Start a new poker game quickly',
          icon: 'game_controller',
          uri: 'allinchatpoker://quickgame'
        },
        {
          id: 'tournaments',
          shortLabel: 'Tournaments',
          longLabel: 'View Tournaments',
          description: 'Browse available tournaments',
          icon: 'trophy',
          uri: 'allinchatpoker://tournaments'
        },
        {
          id: 'profile',
          shortLabel: 'Profile',
          longLabel: 'My Profile',
          description: 'View your poker profile',
          icon: 'person',
          uri: 'allinchatpoker://profile'
        }
      ];
      
      console.log('iOS shortcuts configured:', this.shortcuts);
    } catch (error) {
      console.error('Failed to initialize iOS shortcuts:', error);
    }
  }

  async updateShortcut(shortcutId, updates) {
    try {
      const shortcutIndex = this.shortcuts.findIndex(s => s.id === shortcutId);
      if (shortcutIndex !== -1) {
        this.shortcuts[shortcutIndex] = { ...this.shortcuts[shortcutIndex], ...updates };
        console.log(`Updated shortcut ${shortcutId}:`, this.shortcuts[shortcutIndex]);
      }
    } catch (error) {
      console.error(`Failed to update shortcut ${shortcutId}:`, error);
    }
  }

  async addShortcut(shortcut) {
    try {
      this.shortcuts.push(shortcut);
      console.log('Added new shortcut:', shortcut);
    } catch (error) {
      console.error('Failed to add shortcut:', error);
    }
  }

  // Navigation methods (to be connected to navigation)
  navigateToGame(params = {}) {
    console.log('Navigate to game with params:', params);
  }

  navigateToTournaments() {
    console.log('Navigate to tournaments');
  }

  navigateToProfile() {
    console.log('Navigate to profile');
  }

  cleanup() {
    this.isInitialized = false;
  }
}

export default AppShortcutsService;
