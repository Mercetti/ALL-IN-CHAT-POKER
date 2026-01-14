/**
 * Theme Management for Main Website
 * Provides comprehensive theme switching, persistence, and management
 */

class WebsiteThemeManager {
  constructor(options = {}) {
    this.options = {
      defaultTheme: 'poker-blue',
      enableSystemPreference: true,
      enableAutoSwitch: true,
      enableTransitions: true,
      enablePersistence: true,
      debugMode: false,
      ...options
    };
    
    this.isInitialized = false;
    this.currentTheme = this.options.defaultTheme;
    this.themes = new Map();
    this.themeListeners = new Set();
    this.systemPreference = null;
    this.autoSwitchTimer = null;
    
    this.init();
  }

  init() {
    // Register themes
    this.registerThemes();
    
    // Setup system preference detection
    if (this.options.enableSystemPreference) {
      this.setupSystemPreference();
    }
    
    // Setup theme switching UI
    this.setupThemeUI();
    
    // Setup auto-switching
    if (this.options.enableAutoSwitch) {
      this.setupAutoSwitching();
    }
    
    // Setup persistence
    if (this.options.enablePersistence) {
      this.setupPersistence();
    }
    
    // Setup transitions
    if (this.options.enableTransitions) {
      this.setupTransitions();
    }
    
    // Apply initial theme
    this.applyInitialTheme();
    
    this.isInitialized = true;
  }

  registerThemes() {
    // Poker Blue Theme
    this.themes.set('poker-blue', {
      name: 'Poker Blue',
      displayName: 'Poker Blue',
      description: 'Classic blue poker theme',
      colors: {
        primary: '#2563eb',
        primaryHover: '#1d4ed8',
        secondary: '#64748b',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: '#374151',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        accent: '#3b82f6'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        fontWeight: '400'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          ease: 'ease',
          'ease-in': 'ease-in',
          'ease-out': 'ease-out',
          'ease-in-out': 'ease-in-out'
        }
      }
    });
    
    // Poker Green Theme
    this.themes.set('poker-green', {
      name: 'Poker Green',
      displayName: 'Poker Green',
      description: 'Classic green felt poker theme',
      colors: {
        primary: '#059669',
        primaryHover: '#047857',
        secondary: '#6b7280',
        background: '#022c22',
        surface: '#064e3b',
        text: '#f0fdf4',
        textSecondary: '#86efac',
        border: '#065f46',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        accent: '#059669'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        fontWeight: '400'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          ease: 'ease',
          'ease-in': 'ease-in',
          'ease-out': 'ease-out',
          'ease-in-out': 'ease-in-out'
        }
      }
    });
    
    // Poker Dark Theme
    this.themes.set('poker-dark', {
      name: 'Poker Dark',
      displayName: 'Poker Dark',
      description: 'Dark modern poker theme',
      colors: {
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        secondary: '#4b5563',
        background: '#000000',
        surface: '#111827',
        text: '#f9fafb',
        textSecondary: '#9ca3af',
        border: '#374151',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        accent: '#7c3aed'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        fontWeight: '400'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          ease: 'ease',
          'ease-in': 'ease-in',
          'ease-out': 'ease-out',
          'ease-in-out': 'ease-in-out'
        }
      }
    });
    
    // Light Theme
    this.themes.set('light', {
      name: 'Light',
      displayName: 'Light',
      description: 'Clean light theme',
      colors: {
        primary: '#2563eb',
        primaryHover: '#1d4ed8',
        secondary: '#64748b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        accent: '#2563eb'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        fontWeight: '400'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          ease: 'ease',
          'ease-in': 'ease-in',
          'ease-out': 'ease-out',
          'ease-in-out': 'ease-in-out'
        }
      }
    });
    
    // Auto Theme (follows system preference)
    this.themes.set('auto', {
      name: 'Auto',
      displayName: 'Auto',
      description: 'Follows system preference',
      colors: {
        primary: '#2563eb',
        primaryHover: '#1d4ed8',
        secondary: '#64748b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        accent: '#2563eb'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        fontWeight: '400'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          ease: 'ease',
          'ease-in': 'ease-in',
          'ease-out': 'ease-out',
          'ease-in-out': 'ease-in-out'
        }
      }
    });
  }

  setupSystemPreference() {
    // Check system preference
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPreference = darkModeQuery.matches ? 'dark' : 'light';
      
      // Listen for changes
      darkModeQuery.addEventListener('change', (e) => {
        this.systemPreference = e.matches ? 'dark' : 'light';
        
        // Auto-switch if in auto mode
        if (this.currentTheme === 'auto') {
          this.applySystemTheme();
        }
      });
    }
  }

  setupThemeUI() {
    // Create theme switcher
    this.createThemeSwitcher();
    
    // Create theme palette
    this.createThemePalette();
  }

  createThemeSwitcher() {
    // Check if switcher already exists
    if (document.querySelector('.theme-switcher')) return;
    
    const switcher = document.createElement('div');
    switcher.className = 'theme-switcher';
    switcher.innerHTML = `
      <button class="theme-switcher-toggle" aria-label="Switch theme">
        <span class="theme-icon">🎨</span>
        <span class="theme-label">Theme</span>
      </button>
      <div class="theme-switcher-dropdown">
        <div class="theme-list">
          ${Array.from(this.themes.entries()).map(([key, theme]) => `
            <button class="theme-option ${key === this.currentTheme ? 'active' : ''}" 
                    data-theme="${key}"
                    aria-label="Switch to ${theme.displayName}">
              <div class="theme-preview">
                <div class="theme-preview-colors">
                  <div class="preview-color" style="background: ${theme.colors.primary}"></div>
                  <div class="preview-color" style="background: ${theme.colors.surface}"></div>
                  <div class="preview-color" style="background: ${theme.colors.text}"></div>
                </div>
              </div>
              <div class="theme-info">
                <div class="theme-name">${theme.displayName}</div>
                <div class="theme-description">${theme.description}</div>
              </div>
              ${key === this.currentTheme ? '<div class="theme-active">✓</div>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    // Add to body
    document.body.appendChild(switcher);
    
    // Setup interactions
    this.setupThemeSwitcherInteractions(switcher);
    
    // Add styles
    this.addThemeSwitcherStyles();
  }

  setupThemeSwitcherInteractions(switcher) {
    const toggle = switcher.querySelector('.theme-switcher-toggle');
    const dropdown = switcher.querySelector('.theme-switcher-dropdown');
    const options = switcher.querySelectorAll('.theme-option');
    
    // Toggle dropdown
    toggle.addEventListener('click', () => {
      dropdown.classList.toggle('visible');
      toggle.setAttribute('aria-expanded', dropdown.classList.contains('visible'));
    });
    
    // Handle theme selection
    options.forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.getAttribute('data-theme');
        this.setTheme(theme);
        
        // Close dropdown
        dropdown.classList.remove('visible');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) {
        dropdown.classList.remove('visible');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Keyboard navigation
    switcher.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.remove('visible');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const firstOption = options[0];
        if (firstOption) firstOption.focus();
      }
    });
    
    options.forEach((option, index) => {
      option.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextOption = options[index + 1];
          if (nextOption) nextOption.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevOption = options[index - 1];
          if (prevOption) prevOption.focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          option.click();
        }
      });
    });
  }

  createThemePalette() {
    // Create theme palette for customization
    const palette = document.createElement('div');
    palette.className = 'theme-palette';
    palette.innerHTML = `
      <div class="palette-header">
        <h3>Theme Colors</h3>
        <button class="palette-close" aria-label="Close palette">×</button>
      </div>
      <div class="palette-content">
        <div class="color-group">
          <h4>Primary Colors</h4>
          <div class="color-list">
            <div class="color-item">
              <div class="color-swatch" data-color="primary"></div>
              <span class="color-label">Primary</span>
            </div>
            <div class="color-item">
              <div class="color-swatch" data-color="primaryHover"></div>
              <span class="color-label">Primary Hover</span>
            </div>
            <div class="color-item">
              <div class="color-swatch" data-color="secondary"></div>
              <span class="color-label">Secondary</span>
            </div>
          </div>
        </div>
        <div class="color-group">
          <h4>Surface Colors</h4>
          <div class="color-list">
            <div class="color-item">
              <div class="color-swatch" data-color="background"></div>
              <span class="color-label">Background</span>
            </div>
            <div class="color-item">
              <div class="color-swatch" data-color="surface"></div>
              <span class="color-label">Surface</span>
            </div>
            <div class="color-item">
              <div class="color-swatch" data-color="border"></div>
              <span class="color-label">Border</span>
            </div>
          </div>
        </div>
        <div class="color-group">
          <h4>Text Colors</h4>
          <div class="color-list">
            <div class="color-item">
              <div class="color-swatch" data-color="text"></div>
              <span class="color-label">Text</span>
            </div>
            <div class="color-item">
              <div class="color-swatch" data-color="textSecondary"></div>
              <span class="color-label">Text Secondary</span>
            </div>
          </div>
        </div>
        <div class="color-group">
          <h4>Status Colors</h4>
          <div class="color-list">
            <div class="color-item">
              <div class="color-swatch" data-color="success"></div>
              <span class="color-label">Success</span>
            </div>
            <div class="color-item">
              <div class="color-swatch" data-color="warning"></div>
              <span class="color-label">Warning</span>
            </div>
            <div class="color-item">
              <div class="color-swatch" data-color="error"></div>
              <span class="color-label">Error</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add to body (hidden by default)
    document.body.appendChild(palette);
    
    // Setup palette interactions
    this.setupPaletteInteractions(palette);
    
    // Add styles
    this.addPaletteStyles();
  }

  setupPaletteInteractions(palette) {
    const closeBtn = palette.querySelector('.palette-close');
    const swatches = palette.querySelectorAll('.color-swatch');
    
    // Close palette
    closeBtn.addEventListener('click', () => {
      palette.classList.remove('visible');
    });
    
    // Copy color on click
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        const color = getComputedStyle(swatch).backgroundColor;
        const hex = this.rgbToHex(color);
        
        // Copy to clipboard
        navigator.clipboard.writeText(hex).then(() => {
          // Show tooltip
          this.showColorTooltip(swatch, hex);
        });
      });
    });
  }

  showColorTooltip(element, color) {
    // Remove existing tooltip
    const existingTooltip = document.querySelector('.color-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'color-tooltip';
    tooltip.textContent = `${color} copied!`;
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 10}px`;
    
    document.body.appendChild(tooltip);
    
    // Remove after 2 seconds
    setTimeout(() => {
      tooltip.remove();
    }, 2000);
  }

  setupAutoSwitching() {
    // Auto-switch based on time of day
    this.scheduleAutoSwitch();
  }

  scheduleAutoSwitch() {
    // Clear existing timer
    if (this.autoSwitchTimer) {
      clearInterval(this.autoSwitchTimer);
    }
    
    // Check every minute
    this.autoSwitchTimer = setInterval(() => {
      this.checkAutoSwitch();
    }, 60000);
    
    // Check immediately
    this.checkAutoSwitch();
  }

  checkAutoSwitch() {
    const hour = new Date().getHours();
    const currentTheme = this.getCurrentTheme();
    
    // Switch to light theme during day (6 AM - 6 PM)
    if (hour >= 6 && hour < 18 && currentTheme === 'poker-dark') {
      this.setTheme('poker-blue');
    }
    // Switch to dark theme during night (6 PM - 6 AM)
    else if ((hour < 6 || hour >= 18) && currentTheme === 'light') {
      this.setTheme('poker-dark');
    }
  }

  setupPersistence() {
    // Load saved theme
    const savedTheme = localStorage.getItem('poker-theme');
    if (savedTheme && this.themes.has(savedTheme)) {
      this.currentTheme = savedTheme;
    }
  }

  setupTransitions() {
    // Add transition styles
    const style = document.createElement('style');
    style.id = 'theme-transition-styles';
    style.textContent = `
      * {
        transition: background-color var(--theme-transition-duration, 300ms) var(--theme-transition-easing, ease),
                    color var(--theme-transition-duration, 300ms) var(--theme-transition-easing, ease),
                    border-color var(--theme-transition-duration, 300ms) var(--theme-transition-easing, ease),
                    box-shadow var(--theme-transition-duration, 300ms) var(--theme-transition-easing, ease) !important;
      }
      
      .theme-transition-disabled * {
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  applyInitialTheme() {
    if (this.currentTheme === 'auto') {
      this.applySystemTheme();
    } else {
      this.applyTheme(this.currentTheme);
    }
  }

  applyTheme(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(`Theme "${themeName}" not found`);
      return;
    }
    
    // Disable transitions temporarily
    document.body.classList.add('theme-transition-disabled');
    
    // Apply CSS custom properties
    const root = document.documentElement;
    
    // Apply colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--poker-color-${key}`, value);
    });
    
    // Apply typography
    Object.entries(theme.typography).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--poker-${key}`, value);
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--poker-${key}-${subKey}`, subValue);
        });
      }
    });
    
    // Apply spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--poker-spacing-${key}`, value);
    });
    
    // Apply border radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--poker-radius-${key}`, value);
    });
    
    // Apply shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--poker-shadow-${key}`, value);
    });
    
    // Apply animations
    Object.entries(theme.animations).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--poker-${key}`, value);
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--poker-${key}-${subKey}`, subValue);
        });
      }
    });
    
    // Update body class
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.classList.add(`theme-${themeName}`);
    
    // Update theme switcher
    this.updateThemeSwitcher(themeName);
    
    // Update theme palette
    this.updateThemePalette(theme);
    
    // Re-enable transitions
    setTimeout(() => {
      document.body.classList.remove('theme-transition-disabled');
    }, 50);
    
    // Notify listeners
    this.notifyThemeChange(themeName);
    
    // Save preference
    if (this.options.enablePersistence) {
      localStorage.setItem('poker-theme', themeName);
    }
    
    this.currentTheme = themeName;
  }

  applySystemTheme() {
    const systemTheme = this.systemPreference === 'dark' ? 'poker-dark' : 'light';
    this.applyTheme(systemTheme);
  }

  updateThemeSwitcher(themeName) {
    // Update active state
    const options = document.querySelectorAll('.theme-option');
    options.forEach(option => {
      const isActive = option.getAttribute('data-theme') === themeName;
      option.classList.toggle('active', isActive);
      
      const activeIndicator = option.querySelector('.theme-active');
      if (activeIndicator) {
        activeIndicator.style.display = isActive ? 'block' : 'none';
      }
    });
  }

  updateThemePalette(theme) {
    // Update color swatches
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
      const colorKey = swatch.getAttribute('data-color');
      if (colorKey && theme.colors[colorKey]) {
        swatch.style.backgroundColor = theme.colors[colorKey];
      }
    });
  }

  notifyThemeChange(themeName) {
    // Dispatch custom event
    const event = new CustomEvent('themeChange', {
      detail: { 
        theme: themeName,
        themeData: this.themes.get(themeName)
      }
    });
    document.dispatchEvent(event);
    
    // Notify listeners
    this.themeListeners.forEach(listener => {
      try {
        listener(themeName, this.themes.get(themeName));
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }

  // Style methods
  addThemeSwitcherStyles() {
    if (document.querySelector('#theme-switcher-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'theme-switcher-styles';
    style.textContent = `
      .theme-switcher {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
      }
      
      .theme-switcher-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--poker-color-surface);
        border: 1px solid var(--poker-color-border);
        border-radius: var(--poker-radius-md);
        padding: 0.5rem 1rem;
        color: var(--poker-color-text);
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .theme-switcher-toggle:hover {
        background: var(--poker-color-primary);
        color: white;
        transform: translateY(-1px);
      }
      
      .theme-icon {
        font-size: 1.2rem;
      }
      
      .theme-switcher-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 0.5rem;
        background: var(--poker-color-surface);
        border: 1px solid var(--poker-color-border);
        border-radius: var(--poker-radius-md);
        box-shadow: var(--poker-shadow-lg);
        min-width: 250px;
        max-height: 400px;
        overflow-y: auto;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
      }
      
      .theme-switcher-dropdown.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      
      .theme-list {
        padding: 0.5rem;
      }
      
      .theme-option {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
        padding: 0.75rem;
        background: transparent;
        border: none;
        border-radius: var(--poker-radius-sm);
        color: var(--poker-color-text);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .theme-option:hover {
        background: var(--poker-color-primary);
        color: white;
      }
      
      .theme-option.active {
        background: var(--poker-color-primary);
        color: white;
      }
      
      .theme-preview {
        display: flex;
        gap: 0.25rem;
      }
      
      .theme-preview-colors {
        display: flex;
        gap: 0.25rem;
      }
      
      .preview-color {
        width: 16px;
        height: 16px;
        border-radius: 2px;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }
      
      .theme-info {
        flex: 1;
        text-align: left;
      }
      
      .theme-name {
        font-weight: 500;
        font-size: 0.9rem;
      }
      
      .theme-description {
        font-size: 0.8rem;
        opacity: 0.8;
        margin-top: 0.25rem;
      }
      
      .theme-active {
        color: var(--poker-color-success);
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }

  addPaletteStyles() {
    if (document.querySelector('#theme-palette-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'theme-palette-styles';
    style.textContent = `
      .theme-palette {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--poker-color-surface);
        border: 1px solid var(--poker-color-border);
        border-radius: var(--poker-radius-lg);
        box-shadow: var(--poker-shadow-xl);
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 1001;
        display: none;
      }
      
      .theme-palette.visible {
        display: block;
      }
      
      .palette-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--poker-color-border);
      }
      
      .palette-header h3 {
        margin: 0;
        color: var(--poker-color-text);
      }
      
      .palette-close {
        background: none;
        border: none;
        color: var(--poker-color-text);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: var(--poker-radius-sm);
      }
      
      .palette-close:hover {
        background: var(--poker-color-error);
        color: white;
      }
      
      .palette-content {
        padding: 1rem;
      }
      
      .color-group {
        margin-bottom: 1.5rem;
      }
      
      .color-group h4 {
        margin: 0 0 0.75rem 0;
        color: var(--poker-color-text);
        font-size: 1rem;
      }
      
      .color-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.75rem;
      }
      
      .color-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .color-swatch {
        width: 24px;
        height: 24px;
        border-radius: var(--poker-radius-sm);
        border: 1px solid var(--poker-color-border);
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      
      .color-swatch:hover {
        transform: scale(1.1);
      }
      
      .color-label {
        font-size: 0.8rem;
        color: var(--poker-color-textSecondary);
      }
      
      .color-tooltip {
        position: fixed;
        background: var(--poker-color-primary);
        color: white;
        padding: 0.5rem 0.75rem;
        border-radius: var(--poker-radius-sm);
        font-size: 0.8rem;
        transform: translate(-50%, -100%);
        z-index: 1002;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  // Utility methods
  rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    if (!result) return rgb;
    
    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);
    
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Public API
  setTheme(themeName) {
    if (themeName === 'auto') {
      this.applySystemTheme();
      this.currentTheme = 'auto';
    } else {
      this.applyTheme(themeName);
    }
  }

  getTheme(themeName) {
    return this.themes.get(themeName);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return Array.from(this.themes.keys());
  }

  addTheme(name, theme) {
    this.themes.set(name, theme);
  }

  removeTheme(name) {
    this.themes.delete(name);
  }

  onThemeChange(callback) {
    this.themeListeners.add(callback);
    return () => this.themeListeners.delete(callback);
  }

  showPalette() {
    const palette = document.querySelector('.theme-palette');
    if (palette) {
      palette.classList.add('visible');
    }
  }

  hidePalette() {
    const palette = document.querySelector('.theme-palette');
    if (palette) {
      palette.classList.remove('visible');
    }
  }

  // Export theme data
  exportTheme(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) return null;
    
    return JSON.stringify(theme, null, 2);
  }

  // Import theme data
  importTheme(themeData) {
    try {
      const theme = JSON.parse(themeData);
      if (theme.name) {
        this.addTheme(theme.name, theme);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  }

  // Cleanup
  destroy() {
    // Clear auto-switch timer
    if (this.autoSwitchTimer) {
      clearInterval(this.autoSwitchTimer);
    }
    
    // Remove UI elements
    const switcher = document.querySelector('.theme-switcher');
    const palette = document.querySelector('.theme-palette');
    
    if (switcher) switcher.remove();
    if (palette) palette.remove();
    
    // Clear listeners
    this.themeListeners.clear();
    
    // Clear themes
    this.themes.clear();
    
    // Remove global methods
    delete window.pokerThemeManager;
  }
}

// Create global instance
window.pokerThemeManager = new WebsiteThemeManager({
  defaultTheme: 'poker-blue',
  enableSystemPreference: true,
  enableAutoSwitch: true,
  enableTransitions: true,
  enablePersistence: true,
  debugMode: false
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebsiteThemeManager;
}
