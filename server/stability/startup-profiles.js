/**
 * Simple stub for ProfileManager
 * Manages startup profiles
 */

class ProfileManager {
  constructor() {
    this.profiles = ['cold', 'warm', 'hot'];
    this.currentProfile = 'cold';
  }

  getCurrentProfile() {
    return this.currentProfile;
  }

  setProfile(profile) {
    if (!this.profiles.includes(profile)) {
      throw new Error(`Invalid profile: ${profile}`);
    }
    
    console.log(`[PROFILE] Switching from ${this.currentProfile} to ${profile}`);
    this.currentProfile = profile;
    return true;
  }

  getAvailableProfiles() {
    return this.profiles;
  }

  getProfileInfo(profile) {
    const profileInfo = {
      cold: { description: 'Cold start - full initialization', time: '30-60s' },
      warm: { description: 'Warm start - partial cache', time: '10-30s' },
      hot: { description: 'Hot start - from cache', time: '5-10s' }
    };
    
    return profileInfo[profile] || null;
  }
}

module.exports = { ProfileManager };
