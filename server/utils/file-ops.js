/**
 * File operations and validation utilities
 */

const fs = require('fs');
const path = require('path');

/**
 * Validate request body against shape definition
 * @param {Object} body - Request body to validate
 * @param {Object} shape - Shape definition object
 * @returns {boolean} - Whether body matches shape
 */
const validateBody = (body, shape = {}) => {
  if (typeof body !== 'object' || body === null) return false;
  
  return Object.entries(shape).every(([key, type]) => {
    if (!(key in body)) return false;
    
    const val = body[key];
    
    if (type === 'string') return typeof val === 'string' && val.trim().length > 0;
    if (type === 'number') return typeof val === 'number' && Number.isFinite(val);
    if (type === 'int') return Number.isInteger(val);
    if (type === 'boolean') return typeof val === 'boolean';
    if (type === 'array') return Array.isArray(val);
    if (type === 'object') return typeof val === 'object' && val !== null && !Array.isArray(val);
    
    return false;
  });
};

/**
 * Safely parse JSON string with fallback
 * @param {string} str - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} - Parsed object or fallback
 */
const parseJsonSafe = (str, fallback) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
};

/**
 * Check if URL is allowed based on hostname whitelist
 * @param {string} url - URL to check
 * @returns {boolean} - Whether URL is allowed
 */
const isUrlAllowed = (url) => {
  if (!url) return false;
  
  const allowedHosts = [
    'all-in-chat-poker.fly.dev',
    'localhost',
    '127.0.0.1',
  ];
  
  try {
    const urlObj = new URL(url);
    return allowedHosts.includes(urlObj.hostname);
  } catch {
    return false;
  }
};

/**
 * Ensure directory exists, create if necessary
 * @param {string} dirPath - Directory path to ensure
 * @returns {boolean} - Whether directory exists or was created
 */
const ensureDirectory = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Safely read file with error handling
 * @param {string} filePath - Path to file
 * @param {string} encoding - File encoding (default: 'utf8')
 * @returns {string|null} - File contents or null if failed
 */
const readFileSafe = (filePath, encoding = 'utf8') => {
  try {
    return fs.readFileSync(filePath, encoding);
  } catch (error) {
    return null;
  }
};

/**
 * Safely write file with directory creation
 * @param {string} filePath - Path to file
 * @param {string|Buffer} data - Data to write
 * @returns {boolean} - Whether write was successful
 */
const writeFileSafe = (filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    ensureDirectory(dir);
    fs.writeFileSync(filePath, data);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if file exists and is accessible
 * @param {string} filePath - Path to file
 * @returns {boolean} - Whether file exists and is readable
 */
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
};

/**
 * Get file size in bytes
 * @param {string} filePath - Path to file
 * @returns {number|null} - File size in bytes or null if failed
 */
const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile() ? stats.size : null;
  } catch {
    return null;
  }
};

/**
 * Generate safe filename from user input
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return 'file';
  
  // Remove path separators and special characters
  return filename
    .replace(/[\\/]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100); // Limit length
};

/**
 * Create backup of a file
 * @param {string} filePath - Path to file to backup
 * @returns {string|null} - Backup file path or null if failed
 */
const createBackup = (filePath) => {
  try {
    if (!fileExists(filePath)) return null;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;
    
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch {
    return null;
  }
};

/**
 * Clean up old backup files
 * @param {string} filePath - Original file path
 * @param {number} keepCount - Number of backups to keep
 * @returns {number} - Number of files cleaned up
 */
const cleanupOldBackups = (filePath, keepCount = 5) => {
  try {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath);
    const files = fs.readdirSync(dir)
      .filter(file => file.startsWith(`${basename}.backup.`))
      .map(file => ({
        name: file,
        path: path.join(dir, file),
        time: fs.statSync(path.join(dir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time); // Sort by time, newest first
    
    const toDelete = files.slice(keepCount);
    let deleted = 0;
    
    toDelete.forEach(file => {
      try {
        fs.unlinkSync(file.path);
        deleted++;
      } catch {
        // Ignore deletion errors
      }
    });
    
    return deleted;
  } catch {
    return 0;
  }
};

module.exports = {
  validateBody,
  parseJsonSafe,
  isUrlAllowed,
  ensureDirectory,
  readFileSafe,
  writeFileSafe,
  fileExists,
  getFileSize,
  sanitizeFilename,
  createBackup,
  cleanupOldBackups,
};
