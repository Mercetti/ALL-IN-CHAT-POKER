/**
 * Color utility functions for validation and manipulation
 */

/**
 * Sanitize and validate hex color codes
 * @param {string} color - Color string to sanitize
 * @returns {string|null} - Valid hex color or null if invalid
 */
const sanitizeColor = (color = '') => {
  if (typeof color !== 'string') return null;
  
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  
  return null;
};

/**
 * Convert hex color to RGB values
 * @param {string} hex - Hex color code (e.g., "#ff0000")
 * @returns {Object|null} - RGB object {r, g, b} or null if invalid
 */
const hexToRgb = (hex) => {
  const sanitized = sanitizeColor(hex);
  if (!sanitized) return null;
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(sanitized);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Calculate relative luminance of a color
 * @param {string} hex - Hex color code
 * @returns {number|null} - Relative luminance (0-1) or null if invalid
 */
const getLuminance = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @returns {number|null} - Contrast ratio (1-21) or null if invalid
 */
const contrastRatio = (color1, color2) => {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  if (lum1 === null || lum2 === null) return null;
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Determine if color is light or dark
 * @param {string} hex - Hex color code
 * @returns {boolean|null} - True if light, false if dark, null if invalid
 */
const isLightColor = (hex) => {
  const luminance = getLuminance(hex);
  return luminance === null ? null : luminance > 0.5;
};

/**
 * Get contrasting text color for a background
 * @param {string} backgroundColor - Background hex color
 * @returns {string} - "#ffffff" for light backgrounds, "#000000" for dark
 */
const getContrastingTextColor = (backgroundColor) => {
  const light = isLightColor(backgroundColor);
  return light === null ? '#000000' : (light ? '#000000' : '#ffffff');
};

/**
 * Adjust color brightness
 * @param {string} hex - Original hex color
 * @param {number} percent - Percentage to adjust (-100 to 100)
 * @returns {string|null} - Adjusted hex color or null if invalid
 */
const adjustBrightness = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  const factor = percent / 100;
  const adjusted = {
    r: Math.min(255, Math.max(0, rgb.r + (255 * factor))),
    g: Math.min(255, Math.max(0, rgb.g + (255 * factor))),
    b: Math.min(255, Math.max(0, rgb.b + (255 * factor)))
  };
  
  return `#${adjusted.r.toString(16).padStart(2, '0')}${adjusted.g.toString(16).padStart(2, '0')}${adjusted.b.toString(16).padStart(2, '0')}`;
};

/**
 * Generate a palette of related colors
 * @param {string} baseColor - Base hex color
 * @param {number} count - Number of colors to generate
 * @returns {string[]} - Array of hex colors
 */
const generateColorPalette = (baseColor, count = 5) => {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [];
  
  const palette = [baseColor];
  
  for (let i = 1; i < count; i++) {
    const factor = (i - Math.floor(count / 2)) * 20;
    const adjusted = adjustBrightness(baseColor, factor);
    if (adjusted) palette.push(adjusted);
  }
  
  return palette;
};

module.exports = {
  sanitizeColor,
  hexToRgb,
  getLuminance,
  contrastRatio,
  isLightColor,
  getContrastingTextColor,
  adjustBrightness,
  generateColorPalette,
};
