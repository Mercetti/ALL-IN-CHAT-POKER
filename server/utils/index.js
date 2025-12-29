/**
 * Utility modules exports
 */

const crypto = require('./crypto');
const color = require('./color');
const image = require('./image');
const fileOps = require('./file-ops');
const performance = require('./performance');
const dbOptimizer = require('./db-optimizer');
const cardLookup = require('./card-lookup');
const memoryMonitor = require('./memory-monitor');
const performanceMonitor = require('./performance-monitor');

module.exports = {
  crypto,
  color,
  image,
  fileOps,
  performance,
  dbOptimizer,
  cardLookup,
  memoryMonitor,
  performanceMonitor,
  
  // Re-export commonly used functions for convenience
  ...crypto,
  ...color,
  ...image,
  ...fileOps,
  ...performance,
  ...dbOptimizer,
  ...cardLookup,
  ...memoryMonitor,
  ...performanceMonitor,
};
