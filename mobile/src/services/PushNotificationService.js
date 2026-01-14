/**
 * Push Notification Service
 * Platform-specific push notification handling
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

class PushNotificationService {
  constructor() {
    this.isInitialized = false;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Request permissions
      await this.requestPermissions();
      
      // Set up notification handlers
      this.setupNotificationHandlers();
      
      // Get initial notification
      const notification = await Notifications.getLastNotificationResponseAsync();
      if (notification) {
        this.handleNotification(notification);
      }
      
      this.isInitialized = true;
      console.log('Push notifications initialized');
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('Push notification permissions not granted');
      return false;
    }
    
    return true;
  }

  setupNotificationHandlers() {
    // Handle notification when app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      this.handleNotification(notification);
    });

    // Handle notification interaction
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      this.handleNotificationResponse(response);
    });
  }

  handleNotification(notification) {
    console.log('Notification received:', notification);
    
    // Handle different notification types
    switch (notification.request.content.data.type) {
      case 'game_invite':
        this.handleGameInvite(notification);
        break;
      case 'tournament_start':
        this.handleTournamentStart(notification);
        break;
      case 'player_action':
        this.handlePlayerAction(notification);
        break;
      case 'chat_message':
        this.handleChatMessage(notification);
        break;
      default:
        this.handleGenericNotification(notification);
    }
  }

  handleNotificationResponse(response) {
    console.log('Notification response:', response);
    
    // Handle user interaction with notification
    if (response.actionIdentifier === 'join_game') {
      // Navigate to game
      this.navigateToGame();
    } else if (response.actionIdentifier === 'view_profile') {
      // Navigate to profile
      this.navigateToProfile();
    }
  }

  handleGameInvite(notification) {
    // Show game invite UI
    this.showGameInviteDialog(notification.request.content.data);
  }

  handleTournamentStart(notification) {
    // Show tournament starting notification
    this.showTournamentAlert(notification.request.content.data);
  }

  handlePlayerAction(notification) {
    // Show player action (bet, fold, etc.)
    this.showPlayerActionAlert(notification.request.content.data);
  }

  handleChatMessage(notification) {
    // Show chat message notification
    this.showChatMessageAlert(notification.request.content.data);
  }

  handleGenericNotification(notification) {
    // Show generic notification
    this.showGenericAlert(notification.request.content.data);
  }

  async showGameInviteDialog(data) {
    if (Platform.OS === 'ios') {
      await this.showIosAlert('Game Invite', `${data.playerName} invited you to join a poker game`, [
        { text: 'Join', onPress: () => this.acceptGameInvite(data.gameId) },
        { text: 'Decline', style: 'cancel' }
      ]);
    } else {
      // Android specific handling
      this.showAndroidNotification('Game Invite', `${data.playerName} invited you to join a poker game`);
    }
  }

  async showTournamentAlert(data) {
    if (Platform.OS === 'ios') {
      await this.showIosAlert('Tournament Starting', `Tournament "${data.tournamentName}" is starting`, [
        { text: 'View', onPress: () => this.navigateToTournament(data.tournamentId) }
      ]);
    } else {
      this.showAndroidNotification('Tournament Starting', `Tournament "${data.tournamentName}" is starting`);
    }
  }

  async showPlayerActionAlert(data) {
    if (Platform.OS === 'ios') {
      await this.showIosAlert('Player Action', `${data.playerName} ${data.action}`, [
        { text: 'View Game', onPress: () => this.navigateToGame() }
      ]);
    } else {
      this.showAndroidNotification('Player Action', `${data.playerName} ${data.action}`);
    }
  }

  async showChatMessageAlert(data) {
    if (Platform.OS === 'ios') {
      await this.showIosAlert('Chat Message', `${data.senderName}: ${data.message}`, [
        { text: 'Reply', onPress: () => this.navigateToChat() }
      ]);
    } else {
      this.showAndroidNotification('Chat Message', `${data.senderName}: ${data.message}`);
    }
  }

  async showGenericAlert(data) {
    if (Platform.OS === 'ios') {
      await this.showIosAlert('All-In Chat Poker', data.message, [
        { text: 'Open', onPress: () => this.navigateToApp() }
      ]);
    } else {
      this.showAndroidNotification('All-In Chat Poker', data.message);
    }
  }

  async showIosAlert(title, message, buttons = []) {
    return new Promise((resolve) => {
      setTimeout(() => {
        alert(title, message, buttons, resolve);
      }, 100);
    });
  }

  showAndroidNotification(title, message) {
    // Android notifications are handled by the system
    console.log(`Android notification: ${title} - ${message}`);
  }

  // Navigation methods (to be implemented with navigation library)
  navigateToGame() {
    console.log('Navigate to game');
  }

  navigateToProfile() {
    console.log('Navigate to profile');
  }

  navigateToTournament(tournamentId) {
    console.log('Navigate to tournament:', tournamentId);
  }

  navigateToChat() {
    console.log('Navigate to chat');
  }

  navigateToApp() {
    console.log('Navigate to app');
  }

  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    this.isInitialized = false;
  }
}

export default PushNotificationService;
