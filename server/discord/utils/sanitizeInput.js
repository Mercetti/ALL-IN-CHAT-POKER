/**
 * Input Sanitization Utility
 * Ensures all user input is safe and compliant
 */

const { checkCompliance, sanitizeText } = require('../constants/compliance');

/**
 * Sanitize string input for safety and compliance
 * @param {string} input - Raw user input
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized input
 */
function sanitizeInput(input, options = {}) {
  if (typeof input !== 'string') {
    return '';
  }
  
  const {
    maxLength = 1000,
    allowMarkdown = false,
    removeEmojis = false,
    strictCompliance = true
  } = options;
  
  let sanitized = input.trim();
  
  // Length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove potentially harmful characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove or escape HTML-like content
  if (!allowMarkdown) {
    sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  
  // Remove emojis if requested
  if (removeEmojis) {
    sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  }
  
  // Compliance check
  if (strictCompliance) {
    sanitized = sanitizeText(sanitized);
    
    const compliance = checkCompliance(sanitized);
    if (!compliance.compliant) {
      console.warn('⚠️ Input compliance violation:', compliance.violations);
      // Return safe fallback
      return "Let's keep it fun and friendly!";
    }
  }
  
  return sanitized;
}

/**
 * Sanitize Discord username
 * @param {string} username - Discord username
 * @returns {string} Sanitized username
 */
function sanitizeUsername(username) {
  return sanitizeInput(username, {
    maxLength: 32,
    allowMarkdown: false,
    removeEmojis: false,
    strictCompliance: false
  });
}

/**
 * Sanitize Discord user ID
 * @param {string} userId - Discord user ID (snowflake)
 * @returns {string|null} Validated user ID or null
 */
function sanitizeUserId(userId) {
  // Discord user IDs are numeric snowflakes (18-19 digits)
  if (typeof userId !== 'string') return null;
  
  const cleanId = userId.trim().replace(/[^\d]/g, '');
  
  // Check if it's a valid snowflake format
  if (/^\d{17,19}$/.test(cleanId)) {
    return cleanId;
  }
  
  return null;
}

/**
 * Sanitize command options/arguments
 * @param {object} options - Command options object
 * @returns {object} Sanitized options
 */
function sanitizeCommandOptions(options = {}) {
  const sanitized = {};
  
  Object.entries(options).forEach(([key, value]) => {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value, {
        maxLength: 500,
        allowMarkdown: false,
        strictCompliance: true
      });
    } else if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else {
      // Skip invalid types
      console.warn(`⚠️ Invalid option type for ${key}:`, typeof value);
    }
  });
  
  return sanitized;
}

/**
 * Validate Discord interaction structure
 * @param {object} interaction - Discord interaction object
 * @returns {boolean} True if structure is valid
 */
function validateInteractionStructure(interaction) {
  if (!interaction || typeof interaction !== 'object') {
    return false;
  }
  
  // Required fields
  const required = ['id', 'type', 'token'];
  for (const field of required) {
    if (!interaction[field]) {
      console.warn(`⚠️ Missing required interaction field: ${field}`);
      return false;
    }
  }
  
  // Validate interaction type
  const validTypes = [1, 2, 3, 4, 5]; // PING, COMMAND, COMPONENT, AUTOCOMPLETE, MODAL
  if (!validTypes.includes(interaction.type)) {
    console.warn(`⚠️ Invalid interaction type: ${interaction.type}`);
    return false;
  }
  
  return true;
}

/**
 * Create safe error message
 * @param {string} error - Error type
 * @returns {string} Safe error message
 */
function createSafeErrorMessage(error = 'unknown') {
  const messages = {
    'invalid_input': "Sorry, that doesn't look quite right. Please try again!",
    'compliance': "Let's keep it fun and friendly for everyone!",
    'rate_limit': "Whoa, slow down there! Try again in a moment.",
    'unknown': "Something went wrong. Please try again later!"
  };
  
  return messages[error] || messages.unknown;
}

module.exports = {
  sanitizeInput,
  sanitizeUsername,
  sanitizeUserId,
  sanitizeCommandOptions,
  validateInteractionStructure,
  createSafeErrorMessage
};
