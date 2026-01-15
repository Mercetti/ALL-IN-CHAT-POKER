/**
 * Update Checker for Acey Control Center
 * Enables over-the-air updates without Play Store
 */

import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { version } from '../package.json';

class UpdateChecker {
  constructor(updateServerUrl = 'http://localhost:3001') {
    this.updateServerUrl = updateServerUrl;
    this.currentVersion = version;
    this.lastCheckKey = '@last_update_check';
    this.skipVersionKey = '@skip_version';
  }

  /**
   * Check for updates (with rate limiting)
   */
  async checkForUpdates(force = false) {
    try {
      // Rate limiting: only check once per day unless forced
      if (!force) {
        const lastCheck = await AsyncStorage.getItem(this.lastCheckKey);
        const lastCheckTime = lastCheck ? parseInt(lastCheck) : 0;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (now - lastCheckTime < oneDay) {
          // console.log('🔄 Update check skipped (rate limited)');
          return null;
        }
      }

      // console.log('🔍 Checking for updates...');
      
      const response = await fetch(`${this.updateServerUrl}/api/version`);
      
      if (!response.ok) {
        throw new Error(`Update server responded with ${response.status}`);
      }
      
      const updateInfo = await response.json();
      
      // Store last check time
      await AsyncStorage.setItem(this.lastCheckKey, Date.now().toString());
      
      // Check if update is available
      if (this.isNewerVersion(updateInfo.version, this.currentVersion)) {
        // console.log(`🆕 Update available: ${updateInfo.version} (current: ${this.currentVersion})`);
        
        // Check if user has skipped this version
        const skippedVersion = await AsyncStorage.getItem(this.skipVersionKey);
        if (skippedVersion === updateInfo.version && !updateInfo.mandatory) {
          // console.log('⏭️ User has skipped this version');
          return null;
        }
        
        return updateInfo;
      }
      
      // console.log('✅ App is up to date');
      return null;
    } catch (error) {
      // console.error('❌ Update check failed:', error);
      return null;
    }
  }

  /**
   * Show update dialog to user
   */
  async showUpdateDialog(updateInfo) {
    const { version, releaseNotes, mandatory, downloadUrl } = updateInfo;
    
    const title = mandatory ? '⚠️ Required Update' : '🆕 Update Available';
    const message = `Version ${version} is available!\n\n${releaseNotes}`;
    
    const buttons = [
      {
        text: mandatory ? 'Update Now' : 'Later',
        onPress: () => {
          if (!mandatory) {
            this.skipVersion(version);
          }
        },
        style: mandatory ? 'default' : 'cancel'
      }
    ];
    
    if (!mandatory) {
      buttons.unshift({
        text: 'Update Now',
        onPress: () => this.downloadUpdate(downloadUrl, version)
      });
    } else {
      buttons[0].onPress = () => this.downloadUpdate(downloadUrl, version);
    }
    
    Alert.alert(title, message, buttons, { cancelable: !mandatory });
  }

  /**
   * Download and install update
   */
  async downloadUpdate(downloadUrl, version) {
    try {
      // console.log(`📥 Downloading update ${version}...`);
      
      if (Platform.OS === 'android') {
        // For Android, open the download URL
        await Linking.openURL(`${this.updateServerUrl}${downloadUrl}`);
        
        Alert.alert(
          '📦 Download Started',
          'The APK is downloading. Please install it when the download completes.',
          [{ text: 'OK' }]
        );
      } else {
        // For iOS, you would need to implement App Store or TestFlight integration
        Alert.alert(
          '🍎 iOS Updates',
          'iOS updates require App Store distribution. Please contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (downloadError) {
      // console.error('❌ Download failed:', downloadError);
      Alert.alert(
        '❌ Download Failed',
        'Unable to download the update. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Skip a version (non-mandatory updates only)
   */
  async skipVersion(version) {
    try {
      await AsyncStorage.setItem(this.skipVersionKey, version);
      // console.log(`⏭️ Skipped version ${version}`);
    } catch (error) {
      // console.error('❌ Failed to skip version:', error);
    }
  }

  /**
   * Compare version strings
   */
  isNewerVersion(remoteVersion, localVersion) {
    const parseVersion = (version) => {
      return version.split('.').map(num => parseInt(num, 10));
    };
    
    const remote = parseVersion(remoteVersion);
    const local = parseVersion(localVersion);
    
    for (let i = 0; i < Math.max(remote.length, local.length); i++) {
      const remoteNum = remote[i] || 0;
      const localNum = local[i] || 0;
      
      if (remoteNum > localNum) return true;
      if (remoteNum < localNum) return false;
    }
    
    return false;
  }

  /**
   * Get current version info
   */
  getCurrentVersion() {
    return {
      version: this.currentVersion,
      buildNumber: version,
      platform: Platform.OS,
      timestamp: Date.now()
    };
  }

  /**
   * Clear skipped version (call after successful update)
   */
  async clearSkippedVersion() {
    try {
      await AsyncStorage.removeItem(this.skipVersionKey);
      // console.log('🗑️ Cleared skipped version');
    } catch (error) {
      // console.error('❌ Failed to clear skipped version:', error);
    }
  }

  /**
   * Manual update check (user initiated)
   */
  async manualUpdateCheck() {
    try {
      const updateInfo = await this.checkForUpdates(true);
      
      if (updateInfo) {
        await this.showUpdateDialog(updateInfo);
      } else {
        Alert.alert(
          '✅ Up to Date',
          `You're running the latest version (${this.currentVersion}).`,
          [{ text: 'OK' }]
        );
      }
    } catch {
      Alert.alert(
        '❌ Check Failed',
        'Unable to check for updates. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  }
}

export default UpdateChecker;
