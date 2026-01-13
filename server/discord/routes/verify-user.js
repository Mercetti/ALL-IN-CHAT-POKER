/**
 * Discord Linked Roles Verification Route
 * Handles Discord Linked Roles metadata verification
 * Required endpoint: /verify-user
 */

const { sanitizeUserId } = require('../utils/sanitizeInput');

/**
 * Create Discord linked roles verification router
 * @param {object} config - Discord configuration
 * @param {object} storage - Discord storage instance
 * @returns {Function} Express router middleware
 */
function createVerifyUserRouter(config, storage) {
  return (req, res) => {
    try {
      // Extract user from OAuth session (simplified - in production use proper auth middleware)
      const discordId = req.user?.discord_id || req.query.user_id;

      // Validate Discord ID
      const sanitizedId = sanitizeUserId(discordId);
      if (!sanitizedId) {
        console.warn('⚠️ Invalid Discord ID in verify-user request');
        return res.status(400).json({ error: 'Invalid user identifier' });
      }

      // Get user metadata from storage
      const metadata = storage.getUserMetadata(sanitizedId);

      console.log(`🔍 Discord linked roles verification: ${sanitizedId}`);

      // Return metadata in Discord's required format
      res.json(metadata);

    } catch (error) {
      console.error('❌ Discord verify-user error:', error);
      
      // Return safe defaults on error
      res.json({
        platform_name: "All-In Chat Poker",
        metadata: {
          played: false,
          vip: false,
          high_roller: false
        }
      });
    }
  };
}

module.exports = { createVerifyUserRouter };
