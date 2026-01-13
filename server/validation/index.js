/**
 * Validation Index
 * Central export point for validation components
 */

const JoiValidator = require('./joi-validator');
const ValidationMiddleware = require('./validation-middleware');

module.exports = {
  JoiValidator,
  ValidationMiddleware
};
