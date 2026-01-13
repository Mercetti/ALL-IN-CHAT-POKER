/**
 * Discord Interactions Route
 * Handles all Discord application interactions
 * Required endpoint: /api/interactions
 */

const { handleInteraction } = require('../utils/respondInteraction');
const { validateInteractionStructure } = require('../utils/sanitizeInput');
const { COMPLIANT_RESPONSES } = require('../constants/compliance');

/**
 * Create Discord interactions router
 * @param {object} config - Discord configuration
 * @returns {Function} Express router middleware
 */
function createInteractionsRouter(config) {
  return (req, res) => {
    try {
      // Validate interaction structure
      if (!validateInteractionStructure(req.body)) {
        console.warn('⚠️ Invalid interaction structure received');
        return res.status(400).json({ error: 'Invalid interaction' });
      }

      const interaction = req.body;
      console.log(`📩 Discord interaction: ${interaction.type} - ${interaction.data?.name || 'unknown'}`);

      // Handle the interaction
      const response = handleInteraction(interaction);

      // Send response within 3 seconds (Discord requirement)
      res.json(response);

    } catch (error) {
      console.error('❌ Discord interaction error:', error);
      
      // Always respond to avoid Discord timeout
      res.json({
        type: 4, // Channel message with source
        data: {
          content: COMPLIANT_RESPONSES.entertainment,
          flags: 64 // Ephemeral
        }
      });
    }
  };
}

module.exports = { createInteractionsRouter };
