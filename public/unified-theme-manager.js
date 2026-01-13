/**
 * Unified Theme Manager for All-In Chat Poker
 * Consolidates all theme management into a single, consistent system
 */

class UnifiedThemeManager {
  constructor() {
    // Single localStorage namespace for all theme data
    this.STORAGE_KEY = 'poker_theme_settings';
    
    // Default theme configuration
    this.defaultConfig = {
      currentTheme: 'dark',
      autoMode: false,
      systemPreference: null,
      usage: {},
      customThemes: {}
    };
    
    this.config = { ...this.defaultConfig };
    this.themes = this.getThemeDefinitions();
    this.init();
  }

  getThemeDefinitions() {
    return {
      dark: {
        name: 'Dark Theme',
        icon: '🌙',
        description: 'Dark theme with blue accents',
        colors: {
          '--bg-primary': '#0a0f1c',
          '--bg-secondary': '#1a1f2c',
          '--bg-tertiary': '#2a2f3c',
          '--text-primary': '#ffffff',
          '--text-secondary': '#a8b3c5',
          '--text-muted': '#6b7280',
          '--text-inverse': '#0a0f1c',
          '--primary-color': '#00d4ff',
          '--secondary-color': '#ff00ff',
          '--accent-color': '#00ff88',
          '--success-color': '#22c55e',
          '--warning-color': '#f59e0b',
          '--error-color': '#ef4444',
          '--glass-bg': 'rgba(255, 255, 255, 0.05)',
          '--glass-border': 'rgba(255, 255, 255, 0.1)',
          '--glass-blur': 'blur(20px)',
          '--shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.3)',
          '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
          '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.5)',
          '--shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.6)',
          '--shadow-glow': '0 0 20px rgba(0, 212, 255, 0.3)'
        }
      },
      light: {
        name: 'Light Theme',
        icon: '☀️',
        description: 'Light theme with clean aesthetics',
        colors: {
          '--bg-primary': '#ffffff',
          '--bg-secondary': '#f8f9fa',
          '--bg-tertiary': '#e9ecef',
          '--text-primary': '#1a1f2c',
          '--text-secondary': '#6b7280',
          '--text-muted': '#9ca3af',
          '--text-inverse': '#ffffff',
          '--primary-color': '#0066cc',
          '--secondary-color': '#6b46c1',
          '--accent-color': '#00aa44',
          '--success-color': '#16a34a',
          '--warning-color': '#d97706',
          '--error-color': '#dc2626',
          '--glass-bg': 'rgba(255, 255, 255, 0.7)',
          '--glass-border': 'rgba(0, 0, 0, 0.1)',
          '--glass-blur': 'blur(10px)',
          '--shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.1)',
          '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.15)',
          '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.2)',
          '--shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.25)',
          '--shadow-glow': '0 0 20px rgba(0, 102, 204, 0.2)'
        }
      },
      neon: {
        name: 'Neon Theme',
        icon: '💜',
        description: 'Vibrant neon theme with purple accents',
        colors: {
          '--bg-primary': '#0a0014',
          '--bg-secondary': '#1a0028',
          '--bg-tertiary': '#2a003c',
          '--text-primary': '#ffffff',
          '--text-secondary': '#e091ff',
          '--text-muted': '#b866ff',
          '--text-inverse': '#0a0014',
          '--primary-color': '#ff00ff',
          '--secondary-color': '#00ffff',
          '--accent-color': '#ffff00',
          '--success-color': '#00ff88',
          '--warning-color': '#ffaa00',
          '--error-color': '#ff4444',
          '--glass-bg': 'rgba(255, 0, 255, 0.05)',
          '--glass-border': 'rgba(255, 0, 255, 0.2)',
          '--glass-blur': 'blur(25px)',
          '--shadow-sm': '0 2px 4px rgba(255, 0, 255, 0.3)',
          '--shadow-md': '0 4px 6px rgba(255, 0, 255, 0.4)',
          '--shadow-lg': '0 10px 15px rgba(255, 0, 255, 0.5)',
          '--shadow-xl': '0 20px 25px rgba(255, 0, 255, 0.6)',
          '--shadow-glow': '0 0 30px rgba(255, 0, 255, 0.4)'
        }
      },
      retro: {
        name: 'Retro Theme',
        icon: '🕹️',
        description: 'Classic retro arcade theme',
        colors: {
          '--bg-primary': '#2d1b69',
          '--bg-secondary': '#3d2b79',
          '--bg-tertiary': '#4d3b89',
          '--text-primary': '#ffffff',
          '--text-secondary': '#ffd700',
          '--text-muted': '#ffaa00',
          '--text-inverse': '#2d1b69',
          '--primary-color': '#00ff00',
          '--secondary-color': '#ff00ff',
          '--accent-color': '#ffff00',
          '--success-color': '#00ff00',
          '--warning-color': '#ffaa00',
          '--error-color': '#ff0000',
          '--glass-bg': 'rgba(45, 27, 105, 0.3)',
          '--glass-border': 'rgba(255, 215, 0, 0.3)',
          '--glass-blur': 'blur(15px)',
          '--shadow-sm': '0 2px 4px rgba(0, 255, 0, 0.2)',
          '--shadow-md': '0 4px 6px rgba(0, 255, 0, 0.3)',
          '--shadow-lg': '0 10px 15px rgba(0, 255, 0, 0.4)',
          '--shadow-xl': '0 20px 25px rgba(0, 255, 0, 0.5)',
          '--shadow-glow': '0 0 20px rgba(0, 255, 0, 0.3)'
        }
      }
    };
  }

  init() {
    this.loadConfig();
    this.migrateLegacySettings();
    this.detectSystemPreference();
    this.setupEventListeners();
    this.applyCurrentTheme();
    this.setupThemeToggle();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.config = { ...this.defaultConfig, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load theme config:', error);
      this.config = { ...this.defaultConfig };
    }
  }

  saveConfig() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save theme config:', error);
    }
  }

  migrateLegacySettings() {
    // Migrate old theme settings to unified system
    const legacyKeys = ['theme', 'app_theme', 'theme-preference', 'theme-auto-mode'];
    let needsSave = false;

    legacyKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        if (key === 'theme-auto-mode') {
          this.config.autoMode = value === 'true';
        } else if (key.includes('auto')) {
          // Skip auto mode keys here, handled above
        } else if (this.themes[value]) {
          this.config.currentTheme = value;
        }
        localStorage.removeItem(key);
        needsSave = true;
      }
    });

    // Migrate theme usage stats
    const usageData = localStorage.getItem('theme_usage');
    if (usageData) {
      try {
        this.config.usage = JSON.parse(usageData);
        localStorage.removeItem('theme_usage');
        needsSave = true;
      } catch (error) {
        console.warn('Failed to migrate theme usage:', error);
      }
    }

    if (needsSave) {
      this.saveConfig();
    }
  }

  detectSystemPreference() {
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.config.systemPreference = darkModeQuery.matches ? 'dark' : 'light';

      darkModeQuery.addEventListener('change', (e) => {
        this.config.systemPreference = e.matches ? 'dark' : 'light';
        if (this.config.autoMode) {
          this.applyTheme(this.config.systemPreference);
        }
      });
    }
  }

  setupEventListeners() {
    // Listen for theme change events
    document.addEventListener('themechange', (event) => {
      const { theme, source } = event.detail;
      if (source !== 'unified-manager') {
        this.setTheme(theme, false); // Don't save to avoid loops
      }
    });

    // Listen for system preference changes
    window.addEventListener('online', () => {
      this.syncWithServer?.();
    });
  }

  applyCurrentTheme() {
    const theme = this.config.autoMode && this.config.systemPreference 
      ? this.config.systemPreference 
      : this.config.currentTheme;
    
    this.applyTheme(theme);
  }

  applyTheme(themeName) {
    if (!this.themes[themeName]) {
      console.warn(`Theme "${themeName}" not found`);
      return;
    }

    const theme = this.themes[themeName];
    const root = document.documentElement;

    // Apply theme colors
    Object.entries(theme.colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Set data attributes for CSS targeting
    root.setAttribute('data-theme', themeName);
    root.setAttribute('data-theme-mode', this.config.autoMode ? 'auto' : 'manual');

    // Update body classes for legacy compatibility
    root.classList.remove('dark-theme', 'light-theme');
    root.classList.add(`${themeName}-theme`);

    // Track usage
    this.trackUsage(themeName);

    // Dispatch theme change event
    this.dispatchThemeChange(themeName);
  }

  setTheme(themeName, save = true) {
    if (!this.themes[themeName]) {
      throw new Error(`Theme "${themeName}" not found`);
    }

    this.config.currentTheme = themeName;
    
    if (save && !this.config.autoMode) {
      this.saveConfig();
    }

    this.applyTheme(themeName);
  }

  toggleTheme() {
    const themes = Object.keys(this.themes);
    const currentIndex = themes.indexOf(this.config.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    this.setTheme(nextTheme);
  }

  setAutoMode(enabled) {
    this.config.autoMode = enabled;
    this.saveConfig();
    
    if (enabled) {
      this.applyTheme(this.config.systemPreference);
    } else {
      this.applyTheme(this.config.currentTheme);
    }
  }

  getCurrentTheme() {
    return this.config.currentTheme;
  }

  getThemeInfo(themeName) {
    return this.themes[themeName];
  }

  getAllThemes() {
    return this.themes;
  }

  getUsageStats() {
    return this.config.usage;
  }

  trackUsage(themeName) {
    this.config.usage[themeName] = (this.config.usage[themeName] || 0) + 1;
    this.saveConfig();
  }

  dispatchThemeChange(themeName) {
    const event = new CustomEvent('themechange', {
      detail: {
        theme: themeName,
        autoMode: this.config.autoMode,
        systemPreference: this.config.systemPreference,
        source: 'unified-manager'
      }
    });
    document.dispatchEvent(event);
  }

  setupThemeToggle() {
    // Create theme toggle button if it doesn't exist
    if (!document.getElementById('theme-toggle-btn')) {
      this.createThemeToggle();
    }
  }

  createThemeToggle() {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'theme-toggle-btn';
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Toggle theme');
    
    this.updateToggleButton(toggleBtn);
    
    toggleBtn.addEventListener('click', () => {
      this.toggleTheme();
      this.updateToggleButton(toggleBtn);
    });

    // Add to page
    const header = document.querySelector('header') || document.body;
    header.appendChild(toggleBtn);
  }

  updateToggleButton(button) {
    const theme = this.themes[this.config.currentTheme];
    button.innerHTML = `
      <span class="theme-icon">${theme.icon}</span>
      <span class="theme-name">${theme.name}</span>
    `;
  }

  // Export methods for backward compatibility
  getTheme() {
    return this.getCurrentTheme();
  }

  setThemeCompat(theme) {
    this.setTheme(theme);
  }

  // Static method to get singleton instance
  static getInstance() {
    if (!window.unifiedThemeManager) {
      window.unifiedThemeManager = new UnifiedThemeManager();
    }
    return window.unifiedThemeManager;
  }
}

// Initialize immediately
const themeManager = UnifiedThemeManager.getInstance();

// Global exports for backward compatibility
window.themeManager = themeManager;
window.setTheme = (theme) => themeManager.setThemeCompat(theme);
window.getTheme = () => themeManager.getTheme();

export default themeManager;
