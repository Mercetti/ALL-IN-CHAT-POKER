/**
 * Admin modules exports
 */

const ops = require('./ops');
const aiTools = require('./ai-tools');
const premier = require('./premier');
const codeReview = require('./code-review');

module.exports = {
  ops,
  aiTools,
  premier,
  codeReview,
  
  // Re-export commonly used functions for convenience
  ...ops,
  ...aiTools,
  ...premier,
  ...codeReview,
};
