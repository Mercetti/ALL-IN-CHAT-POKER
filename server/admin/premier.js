/**
 * Admin premier and branding utilities
 */

const auth = require('../auth');
const db = require('../db');
const { sanitizeColor, adjustBrightness, generateColorPalette } = require('../utils/color');
const { sanitizeImageUrl, isValidImageUrl } = require('../utils/image');

/**
 * Check if user has premier privileges for any operation
 * @param {Object} req - Express request object
 * @returns {boolean} - Whether user can act as premier
 */
const canPremierActForAny = (req) => {
  if (auth.isAdminRequest(req)) return true;
  const actor = (auth.extractUserLogin(req) || '').toLowerCase();
  if (!actor) return false;
  const role = (db.getProfile(actor)?.role || '').toLowerCase();
  return role === 'admin' || role === 'premier';
};

/**
 * Validate premier branding settings
 * @param {Object} settings - Branding settings to validate
 * @returns {Object} - Validated and sanitized settings
 */
const validatePremierBranding = (settings) => {
  const safe = {};
  
  // Validate logo URL
  if (settings.logoUrl && isValidImageUrl(settings.logoUrl)) {
    safe.logoUrl = sanitizeImageUrl(settings.logoUrl);
  }
  
  // Validate colors
  if (settings.primaryColor) {
    const primary = sanitizeColor(settings.primaryColor);
    if (primary) safe.primaryColor = primary;
  }
  
  if (settings.secondaryColor) {
    const secondary = sanitizeColor(settings.secondaryColor);
    if (secondary) safe.secondaryColor = secondary;
  }
  
  // Validate accent color
  if (settings.accentColor) {
    const accent = sanitizeColor(settings.accentColor);
    if (accent) safe.accentColor = accent;
  }
  
  // Validate text color
  if (settings.textColor) {
    const text = sanitizeColor(settings.textColor);
    if (text) safe.textColor = text;
  }
  
  // Validate background color
  if (settings.backgroundColor) {
    const bg = sanitizeColor(settings.backgroundColor);
    if (bg) safe.backgroundColor = bg;
  }
  
  // Validate font settings
  if (typeof settings.fontFamily === 'string' && settings.fontFamily.trim().length > 0) {
    safe.fontFamily = settings.fontFamily.trim().substring(0, 100);
  }
  
  if (typeof settings.fontSize === 'number' && settings.fontSize >= 8 && settings.fontSize <= 72) {
    safe.fontSize = settings.fontSize;
  }
  
  // Validate custom CSS
  if (typeof settings.customCSS === 'string' && settings.customCSS.length <= 10000) {
    // Basic CSS sanitization - remove dangerous selectors
    const sanitized = settings.customCSS
      .replace(/@import\s+/gi, '') // Remove imports
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/expression\s*\(/gi, ''); // Remove expressions
    
    safe.customCSS = sanitized;
  }
  
  return safe;
};

/**
 * Generate color scheme from base color
 * @param {string} baseColor - Base hex color
 * @returns {Object} - Generated color scheme
 */
const generateColorScheme = (baseColor) => {
  const sanitized = sanitizeColor(baseColor);
  if (!sanitized) return null;
  
  const palette = generateColorPalette(sanitized, 5);
  
  return {
    primary: sanitized,
    secondary: palette[1] || adjustBrightness(sanitized, 20),
    accent: palette[2] || adjustBrightness(sanitized, -20),
    light: adjustBrightness(sanitized, 40),
    dark: adjustBrightness(sanitized, -40),
    palette,
  };
};

/**
 * Apply premier branding to a channel
 * @param {string} channel - Channel name
 * @param {Object} branding - Branding settings
 * @returns {boolean} - Whether branding was applied successfully
 */
const applyPremierBranding = (channel, branding) => {
  const logger = require('../logger');
  
  try {
    const validated = validatePremierBranding(branding);
    
    if (Object.keys(validated).length === 0) {
      logger.warn('No valid branding settings to apply', { channel });
      return false;
    }
    
    // Store branding in database or cache
    // This would integrate with existing branding storage system
    db.setChannelBranding(channel, validated);
    
    logger.info('Premier branding applied', { channel, keys: Object.keys(validated) });
    return true;
    
  } catch (error) {
    logger.error('Failed to apply premier branding', { channel, error: error.message });
    return false;
  }
};

/**
 * Get premier branding for a channel
 * @param {string} channel - Channel name
 * @returns {Object|null} - Branding settings or null
 */
const getPremierBranding = (channel) => {
  try {
    return db.getChannelBranding(channel);
  } catch (error) {
    const logger = require('../logger');
    logger.error('Failed to get premier branding', { channel, error: error.message });
    return null;
  }
};

/**
 * Remove premier branding from a channel
 * @param {string} channel - Channel name
 * @returns {boolean} - Whether branding was removed successfully
 */
const removePremierBranding = (channel) => {
  const logger = require('../logger');
  
  try {
    db.removeChannelBranding(channel);
    logger.info('Premier branding removed', { channel });
    return true;
  } catch (error) {
    logger.error('Failed to remove premier branding', { channel, error: error.message });
    return false;
  }
};

/**
 * Get all channels with premier branding
 * @returns {Array} - List of channels with branding
 */
const getPremierBrandedChannels = () => {
  try {
    return db.getAllBrandedChannels();
  } catch (error) {
    const logger = require('../logger');
    logger.error('Failed to get premier branded channels', { error: error.message });
    return [];
  }
};

/**
 * Validate premier permissions for an action
 * @param {Object} req - Express request object
 * @param {string} action - Action to validate
 * @param {string} target - Target of the action (e.g., channel)
 * @returns {boolean} - Whether action is allowed
 */
const validatePremierAction = (req, action, target = null) => {
  if (!canPremierActForAny(req)) return false;
  
  const actor = auth.extractUserLogin(req);
  if (!actor) return false;
  
  // Check if user has specific permissions for the target
  if (target) {
    const profile = db.getProfile(actor);
    const role = profile?.role?.toLowerCase();
    
    // Admins can act on any target
    if (role === 'admin') return true;
    
    // Premiers may have restrictions on certain targets
    if (role === 'premier') {
      // Check if premier owns this channel or has explicit permission
      return db.canPremierActOnChannel(actor, target);
    }
  }
  
  return false;
};

/**
 * Get premier usage statistics
 * @param {string} login - User login (optional)
 * @returns {Object} - Premier usage stats
 */
const getPremierUsageStats = (login = null) => {
  try {
    if (login) {
      return db.getPremierStatsForUser(login);
    } else {
      return db.getAllPremierStats();
    }
  } catch (error) {
    const logger = require('../logger');
    logger.error('Failed to get premier usage stats', { login, error: error.message });
    return null;
  }
};

module.exports = {
  canPremierActForAny,
  validatePremierBranding,
  generateColorScheme,
  applyPremierBranding,
  getPremierBranding,
  removePremierBranding,
  getPremierBrandedChannels,
  validatePremierAction,
  getPremierUsageStats,
};
