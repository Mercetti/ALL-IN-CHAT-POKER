/**
 * Utility modules exports
 */

const crypto = require('./crypto');
const color = require('./color');
const image = require('./image');
const fileOps = require('./file-ops');

module.exports = {
  crypto,
  color,
  image,
  fileOps,
  
  // Re-export commonly used functions for convenience
  ...crypto,
  ...color,
  ...image,
  ...fileOps,
};
