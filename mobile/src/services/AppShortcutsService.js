/**
 * App Shortcuts Service
 * Android-specific app shortcuts for quick access
 */

import { Platform } from 'react-native';
import * as Shortcuts from 'expo-shortcuts';

class AppShortcutsService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized || Platform.OS !== 'android') {
      return;
    }

    try {
      await this.setupShortcuts();
      this.isInitialized = true;
      console.log('App shortcuts initialized');
    } catch (error) {
      console.error('Failed to initialize app shortcuts:', error);
    }
  }

  async setupShortcuts() {
    const shortcuts = [
      {
        id: 'quick_game',
        shortTitle: 'Quick Game',
        longTitle: 'Start Quick Poker Game',
        description: 'Jump directly into a poker game',
        icon: 'poker_chip',
        action: 'quick_game',
        uri: '/game?mode=quick',
        data: {
          mode: 'quick',
          timestamp: Date.now()
        }
      },
      {
        id: 'join_tournament',
        shortTitle: 'Tournaments',
        longTitle: 'Browse Tournaments',
        description: 'View and join available tournaments',
        icon: 'trophy',
        action: 'tournaments',
        uri: '/tournaments',
        data: {
          screen: 'tournaments',
          timestamp: Date.now()
        }
      },
      {
        id: 'my_profile',
        shortTitle: 'Profile',
        longTitle: 'My Poker Profile',
        description: 'View your poker stats and profile',
        icon: 'user_profile',
        action: 'profile',
        uri: '/profile',
        data: {
          screen: 'profile',
          timestamp: Date.now()
        }
      },
      {
        id: 'quick_bet',
        shortTitle: 'Quick Bet',
        longTitle: 'Place Quick Bet',
        description: 'Quick access to betting interface',
        icon: 'bet_chip',
        action: 'quick_bet',
        uri: '/game?mode=bet',
        data: {
          mode: 'bet',
          timestamp: Date.now()
        }
      }
    ];

    await Shortcuts.setShortcutsAsync(shortcuts);
  }

  async updateShortcut(shortcutId, updates) {
    if (!this.isInitialized) {
      return;
    }

    try {
      await Shortcuts.setShortcutsAsync([
        {
          id: shortcutId,
          ...updates,
          data: {
            ...updates.data,
            timestamp: Date.now()
          }
        }
      ]);
      console.log(`Shortcut ${shortcutId} updated`);
    } catch (error) {
      console.error(`Failed to update shortcut ${shortcutId}:`, error);
    }
  }

  async handleShortcutAction(shortcut) {
    console.log('Shortcut action:', shortcut);
    
    switch (shortcut.action) {
      case 'quick_game':
        // Navigate to quick game mode
        this.navigateToGame({ mode: 'quick' });
        break;
      case 'tournaments':
        // Navigate to tournaments
        this.navigateToTournaments();
        break;
      case 'profile':
        // Navigate to profile
        this.navigateToProfile();
        break;
      case 'quick_bet':
        // Navigate to betting interface
        this.navigateToGame({ mode: 'bet' });
        break;
      default:
        console.warn('Unknown shortcut action:', shortcut.action);
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
