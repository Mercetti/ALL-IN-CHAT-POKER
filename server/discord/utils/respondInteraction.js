/**
 * Discord Interaction Response Utility
 * Handles all Discord interaction response types
 * Ensures responses are compliant and properly formatted
 */

const { COMPLIANT_RESPONSES, checkCompliance, sanitizeText } = require('../constants/compliance');

// Interaction response types
const INTERACTION_TYPES = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5
};

// Response types
const RESPONSE_TYPES = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9
};

/**
 * Create a basic Discord interaction response
 * @param {number} type - Response type
 * @param {object} data - Response data
 * @returns {object} Formatted response object
 */
function createInteractionResponse(type, data = {}) {
  return {
    type,
    data
  };
}

/**
 * Create a PONG response (for PING interactions)
 * @returns {object} PONG response
 */
function createPongResponse() {
  return createInteractionResponse(RESPONSE_TYPES.PONG);
}

/**
 * Create a simple message response
 * @param {string} content - Message content (will be sanitized)
 * @param {boolean} ephemeral - Whether message should be ephemeral
 * @returns {object} Message response
 */
function createMessageResponse(content, ephemeral = false) {
  // Sanitize content for compliance
  const sanitizedContent = sanitizeText(content);
  
  // Check compliance
  const compliance = checkCompliance(sanitizedContent);
  if (!compliance.compliant) {
    console.warn('⚠️ Compliance violation in message:', compliance.violations);
    // Use safe fallback response
    return createMessageResponse(COMPLIANT_RESPONSES.entertainment, ephemeral);
  }
  
  return createInteractionResponse(RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE, {
    content: sanitizedContent,
    flags: ephemeral ? (1 << 6) : 0 // Ephemeral flag
  });
}

/**
 * Create a deferred response (for long operations)
 * @param {boolean} ephemeral - Whether response should be ephemeral
 * @returns {object} Deferred response
 */
function createDeferredResponse(ephemeral = false) {
  return createInteractionResponse(RESPONSE_TYPES.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
    flags: ephemeral ? (1 << 6) : 0 // Ephemeral flag
  });
}

/**
 * Create an autocomplete response
 * @param {Array} choices - Autocomplete choices
 * @returns {object} Autocomplete response
 */
function createAutocompleteResponse(choices) {
  return createInteractionResponse(RESPONSE_TYPES.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, {
    choices: choices.slice(0, 25) // Discord limit is 25 choices
  });
}

/**
 * Create a modal response
 * @param {string} title - Modal title
 * @param {string} customId - Modal custom ID
 * @param {Array} components - Modal components
 * @returns {object} Modal response
 */
function createModalResponse(title, customId, components) {
  return createInteractionResponse(RESPONSE_TYPES.MODAL, {
    title: sanitizeText(title),
    custom_id: customId,
    components
  });
}

/**
 * Handle PING interaction
 * @param {object} interaction - Discord interaction object
 * @returns {object} PONG response
 */
function handlePingInteraction(interaction) {
  if (interaction.type !== INTERACTION_TYPES.PING) {
    throw new Error('Invalid interaction type for PING handler');
  }
  
  return createPongResponse();
}

/**
 * Handle application command (slash command) interaction
 * @param {object} interaction - Discord interaction object
 * @returns {object} Command response
 */
function handleApplicationCommand(interaction) {
  const commandName = interaction.data?.name;
  
  // Default command response
  const defaultResponse = COMPLIANT_RESPONSES.greeting;
  
  switch (commandName) {
    case 'acey':
      return createMessageResponse(defaultResponse, false);
      
    case 'help':
      return createMessageResponse(
        "Acey is your AI entertainment host! Try the `/acey` command to see her status. Remember, this is all for fun and community engagement!",
        false
      );
      
    case 'status':
      return createMessageResponse(
        "🎮 Acey is online and ready to entertain! All games are for fun with fictional points only.",
        false
      );
      
    default:
      return createMessageResponse(defaultResponse, false);
  }
}

/**
 * Handle button interaction
 * @param {object} interaction - Discord interaction object
 * @returns {object} Button response
 */
function handleButtonInteraction(interaction) {
  const customId = interaction.data?.custom_id;
  
  switch (customId) {
    case 'help_button':
      return createMessageResponse(
        "Welcome to Acey's game room! Everything here is for entertainment with fictional points. No real money involved!",
        false
      );
      
    case 'status_button':
      return createMessageResponse(
        "🎰 All systems operational! Acey is ready to provide entertainment for the community.",
        false
      );
      
    default:
      return createMessageResponse(
        COMPLIANT_RESPONSES.entertainment,
        false
      );
  }
}

/**
 * Main interaction handler
 * @param {object} interaction - Discord interaction object
 * @returns {object} Response object
 */
function handleInteraction(interaction) {
  try {
    switch (interaction.type) {
      case INTERACTION_TYPES.PING:
        return handlePingInteraction(interaction);
        
      case INTERACTION_TYPES.APPLICATION_COMMAND:
        return handleApplicationCommand(interaction);
        
      case INTERACTION_TYPES.MESSAGE_COMPONENT:
        return handleButtonInteraction(interaction);
        
      default:
        console.warn(`⚠️ Unsupported interaction type: ${interaction.type}`);
        return createMessageResponse(
          COMPLIANT_RESPONSES.entertainment,
          false
        );
    }
  } catch (error) {
    console.error('❌ Interaction handler error:', error);
    return createMessageResponse(
      "Sorry, something went wrong. Please try again!",
      false
    );
  }
}

module.exports = {
  INTERACTION_TYPES,
  RESPONSE_TYPES,
  createInteractionResponse,
  createPongResponse,
  createMessageResponse,
  createDeferredResponse,
  createAutocompleteResponse,
  createModalResponse,
  handleInteraction,
  handlePingInteraction,
  handleApplicationCommand,
  handleButtonInteraction
};
