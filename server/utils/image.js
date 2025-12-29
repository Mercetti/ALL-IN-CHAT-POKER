/**
 * Image processing and avatar utility functions
 */

const crypto = require('crypto');
const { sanitizeColor } = require('./color');

/**
 * Generate a hash for a login string
 * @param {string} login - Login string to hash
 * @returns {number} - Hash value
 */
const hashLogin = (login = '') => {
  let hash = 0;
  for (let i = 0; i < login.length; i += 1) {
    hash = (hash << 5) - hash + login.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/**
 * Generate default avatar for a login with optional color override
 * @param {string} login - User login
 * @param {string|null} colorOverride - Optional color override
 * @returns {string} - SVG data URI for avatar
 */
const getDefaultAvatarForLogin = (login = '', colorOverride = null) => {
  const base = login || 'player';
  const idx = hashLogin(base) % DEFAULT_AVATAR_COLORS.length;
  const chosen = sanitizeColor(colorOverride) || DEFAULT_AVATAR_COLORS[idx];
  const color = chosen.replace('#', '');
  const letter = encodeURIComponent(base.charAt(0).toUpperCase() || 'P');
  
  // Simple SVG data URI with solid background and initial
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' fill='%23${color}'/><text x='50%' y='55%' font-size='64' text-anchor='middle' fill='white' font-family='Arial, sans-serif' dominant-baseline='middle'>${letter}</text></svg>`;
  
  return `data:image/svg+xml;utf8,${svg}`;
};

/**
 * Validate image URL
 * @param {string} url - Image URL to validate
 * @returns {boolean} - Whether URL is valid
 */
const isValidImageUrl = (url) => {
  if (typeof url !== 'string') return false;
  
  const trimmed = url.trim();
  if (trimmed.length > 512) return false;
  
  // Check for allowed protocols and patterns
  const allowedPatterns = [
    /^https?:\/\//i,           // http/https
    /^\/\//,                   // protocol-relative
    /^data:image\/\//i,       // data URIs for images
    /^\//                       // relative paths
  ];
  
  return allowedPatterns.some(pattern => pattern.test(trimmed));
};

/**
 * Sanitize image URL for storage
 * @param {string} url - Image URL to sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
const sanitizeImageUrl = (url) => {
  if (!isValidImageUrl(url)) return null;
  
  const trimmed = url.trim();
  
  // For external URLs, ensure they're from allowed domains
  if (trimmed.startsWith('http')) {
    try {
      const urlObj = new URL(trimmed);
      const allowedHosts = [
        'all-in-chat-poker.fly.dev',
        'localhost',
        '127.0.0.1',
        'static-cdn.jtvnw.net',
        'cdn.jsdelivr.net'
      ];
      
      if (!allowedHosts.includes(urlObj.hostname)) {
        return null;
      }
    } catch {
      return null;
    }
  }
  
  return trimmed;
};

/**
 * Generate thumbnail dimensions maintaining aspect ratio
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @param {number} maxSize - Maximum size for thumbnail
 * @returns {Object} - {width, height} of thumbnail
 */
const getThumbnailDimensions = (originalWidth, originalHeight, maxSize = 200) => {
  if (!originalWidth || !originalHeight) {
    return { width: maxSize, height: maxSize };
  }
  
  const aspectRatio = originalWidth / originalHeight;
  
  if (aspectRatio > 1) {
    // Landscape
    return {
      width: Math.min(originalWidth, maxSize),
      height: Math.min(originalHeight, maxSize / aspectRatio)
    };
  } else {
    // Portrait or square
    return {
      width: Math.min(originalWidth, maxSize * aspectRatio),
      height: Math.min(originalHeight, maxSize)
    };
  }
};

/**
 * Generate a unique cache key for an image
 * @param {string} url - Image URL
 * @param {number} maxSize - Maximum thumbnail size
 * @returns {string} - Cache key
 */
const generateImageCacheKey = (url, maxSize = 200) => {
  return crypto.createHash('md5').update(`${url}:${maxSize}`).digest('hex');
};

/**
 * Check if file extension indicates an image
 * @param {string} filename - Filename to check
 * @returns {boolean} - Whether file is an image
 */
const isImageFile = (filename) => {
  if (!filename || typeof filename !== 'string') return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  return imageExtensions.includes(ext);
};

/**
 * Get MIME type for image file
 * @param {string} filename - Image filename
 * @returns {string} - MIME type
 */
const getImageMimeType = (filename) => {
  if (!filename || typeof filename !== 'string') return 'application/octet-stream';
  
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

// Default avatar colors palette
const DEFAULT_AVATAR_COLORS = [
  '#1abc9c',
  '#3498db',
  '#9b59b6',
  '#e67e22',
  '#e74c3c',
  '#f39c12',
  '#16a085',
  '#2ecc71',
  '#2980b9',
  '#8e44ad',
  '#c0392b',
  '#d35400',
];

module.exports = {
  hashLogin,
  getDefaultAvatarForLogin,
  isValidImageUrl,
  sanitizeImageUrl,
  getThumbnailDimensions,
  generateImageCacheKey,
  isImageFile,
  getImageMimeType,
  DEFAULT_AVATAR_COLORS,
};
