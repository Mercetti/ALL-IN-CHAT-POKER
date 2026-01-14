/**
 * Consistent Color Scheme Across All Apps
 * Implements a unified color system for main website, poker game, and AI Control Center
 */

class ConsistentColorScheme {
  constructor(options = {}) {
    this.options = {
      enableDarkMode: true,
      enableHighContrast: true,
      enableColorBlindSupport: true,
      enableAnimations: true,
      enableTransitions: true,
      customColors: {},
      ...options
    };
    
    this.isInitialized = false;
    this.currentTheme = 'poker-blue';
    this.colorSchemes = new Map();
    this.colorVariables = new Map();
    this.themes = new Map();
    this.observers = new Set();
    
    this.init();
  }

  init() {
    // Define color schemes
    this.defineColorSchemes();
    
    // Setup CSS custom properties
    this.setupCSSVariables();
    
    // Setup theme system
    this.setupThemes();
    
    // Setup color blind support
    if (this.options.enableColorBlindSupport) {
      this.setupColorBlindSupport();
    }
    
    // Setup high contrast mode
    if (this.options.enableHighContrast) {
      this.setupHighContrastMode();
    }
    
    // Setup system preference detection
    this.setupSystemPreferences();
    
    // Setup global API
    this.setupGlobalAPI();
    
    // Apply initial theme
    this.applyTheme(this.currentTheme);
    
    this.isInitialized = true;
  }

  defineColorSchemes() {
    // Primary Color Schemes
    this.colorSchemes.set('poker-blue', {
      primary: '#007bff',
      primaryLight: '#66b3ff',
      primaryDark: '#0056b3',
      secondary: '#6c757d',
      secondaryLight: '#a8b2bd',
      secondaryDark: '#545b62',
      accent: '#17a2b8',
      accentLight: '#5fc9e3',
      accentDark: '#0f7a8c',
      success: '#28a745',
      successLight: '#71d875',
      successDark: '#1e7e34',
      warning: '#ffc107',
      warningLight: '#ffcd39',
      warningDark: '#d39e00',
      danger: '#dc3545',
      dangerLight: '#f1b0b7',
      dangerDark: '#bd2130',
      info: '#17a2b8',
      infoLight: '#5fc9e3',
      infoDark: '#0f7a8c',
      light: '#f8f9fa',
      lightLight: '#ffffff',
      lightDark: '#e9ecef',
      dark: '#343a40',
      darkLight: '#495057',
      darkDark: '#212529',
      background: '#ffffff',
      surface: '#f8f9fa',
      card: '#ffffff',
      text: '#212529',
      textSecondary: '#6c757d',
      textMuted: '#868e96',
      border: '#dee2e6',
      borderLight: '#e9ecef',
      borderDark: '#adb5bd',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowLight: 'rgba(0, 0, 0, 0.05)',
      shadowDark: 'rgba(0, 0, 0, 0.2)'
    });

    this.colorSchemes.set('poker-green', {
      primary: '#28a745',
      primaryLight: '#71d875',
      primaryDark: '#1e7e34',
      secondary: '#6c757d',
      secondaryLight: '#a8b2bd',
      secondaryDark: '#545b62',
      accent: '#20c997',
      accentLight: '#7dd8c3',
      accentDark: '#198754',
      success: '#28a745',
      successLight: '#71d875',
      successDark: '#1e7e34',
      warning: '#ffc107',
      warningLight: '#ffcd39',
      warningDark: '#d39e00',
      danger: '#dc3545',
      dangerLight: '#f1b0b7',
      dangerDark: '#bd2130',
      info: '#17a2b8',
      infoLight: '#5fc9e3',
      infoDark: '#0f7a8c',
      light: '#f8f9fa',
      lightLight: '#ffffff',
      lightDark: '#e9ecef',
      dark: '#343a40',
      darkLight: '#495057',
      darkDark: '#212529',
      background: '#ffffff',
      surface: '#f8f9fa',
      card: '#ffffff',
      text: '#212529',
      textSecondary: '#6c757d',
      textMuted: '#868e96',
      border: '#dee2e6',
      borderLight: '#e9ecef',
      borderDark: '#adb5bd',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowLight: 'rgba(0, 0, 0, 0.05)',
      shadowDark: 'rgba(0, 0, 0, 0.2)'
    });

    this.colorSchemes.set('poker-purple', {
      primary: '#6f42c1',
      primaryLight: '#9b7dd3',
      primaryDark: '#59339a',
      secondary: '#6c757d',
      secondaryLight: '#a8b2bd',
      secondaryDark: '#545b62',
      accent: '#e83e8c',
      accentLight: '#f185b1',
      accentDark: '#d91a72',
      success: '#28a745',
      successLight: '#71d875',
      successDark: '#1e7e34',
      warning: '#ffc107',
      warningLight: '#ffcd39',
      warningDark: '#d39e00',
      danger: '#dc3545',
      dangerLight: '#f1b0b7',
      dangerDark: '#bd2130',
      info: '#17a2b8',
      infoLight: '#5fc9e3',
      infoDark: '#0f7a8c',
      light: '#f8f9fa',
      lightLight: '#ffffff',
      lightDark: '#e9ecef',
      dark: '#343a40',
      darkLight: '#495057',
      darkDark: '#212529',
      background: '#ffffff',
      surface: '#f8f9fa',
      card: '#ffffff',
      text: '#212529',
      textSecondary: '#6c757d',
      textMuted: '#868e96',
      border: '#dee2e6',
      borderLight: '#e9ecef',
      borderDark: '#adb5bd',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowLight: 'rgba(0, 0, 0, 0.05)',
      shadowDark: 'rgba(0, 0, 0, 0.2)'
    });

    this.colorSchemes.set('poker-dark', {
      primary: '#0d6efd',
      primaryLight: '#3d8bfd',
      primaryDark: '#0a58ca',
      secondary: '#6c757d',
      secondaryLight: '#868e96',
      secondaryDark: '#495057',
      accent: '#20c997',
      accentLight: '#4dd9b3',
      accentDark: '#198754',
      success: '#198754',
      successLight: '#2fa460',
      successDark: '#146c43',
      warning: '#ffc107',
      warningLight: '#ffcd39',
      warningDark: '#d39e00',
      danger: '#dc3545',
      dangerLight: '#e35d6a',
      dangerDark: '#b02a37',
      info: '#0dcaf0',
      infoLight: '#3dd5f3',
      infoDark: '#0aa2c0',
      light: '#f8f9fa',
      lightLight: '#ffffff',
      lightDark: '#e9ecef',
      dark: '#212529',
      darkLight: '#343a40',
      darkDark: '#000000',
      background: '#121212',
      surface: '#1e1e1e',
      card: '#2d2d2d',
      text: '#ffffff',
      textSecondary: '#b3b3b3',
      textMuted: '#808080',
      border: '#404040',
      borderLight: '#525252',
      borderDark: '#262626',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowLight: 'rgba(0, 0, 0, 0.1)',
      shadowDark: 'rgba(0, 0, 0, 0.5)'
    });

    // AI Control Center Theme
    this.colorSchemes.set('acey-center', {
      primary: '#7c3aed',
      primaryLight: '#a78bfa',
      primaryDark: '#5b21b6',
      secondary: '#64748b',
      secondaryLight: '#94a3b8',
      secondaryDark: '#475569',
      accent: '#06b6d4',
      accentLight: '#22d3ee',
      accentDark: '#0891b2',
      success: '#10b981',
      successLight: '#34d399',
      successDark: '#059669',
      warning: '#f59e0b',
      warningLight: '#fbbf24',
      warningDark: '#d97706',
      danger: '#ef4444',
      dangerLight: '#f87171',
      dangerDark: '#dc2626',
      info: '#3b82f6',
      infoLight: '#60a5fa',
      infoDark: '#2563eb',
      light: '#f8fafc',
      lightLight: '#ffffff',
      lightDark: '#f1f5f9',
      dark: '#1e293b',
      darkLight: '#334155',
      darkDark: '#0f172a',
      background: '#ffffff',
      surface: '#f8fafc',
      card: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
      textMuted: '#94a3b8',
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
      borderDark: '#cbd5e1',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowLight: 'rgba(0, 0, 0, 0.05)',
      shadowDark: 'rgba(0, 0, 0, 0.2)'
    });

    // Apply custom colors
    Object.entries(this.options.customColors).forEach(([theme, colors]) => {
      this.colorSchemes.set(theme, { ...this.colorSchemes.get('poker-blue'), ...colors });
    });
  }

  setupCSSVariables() {
    const styleId = 'consistent-color-scheme-styles';
    
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      :root {
        /* Primary Colors */
        --color-primary: #007bff;
        --color-primary-light: #66b3ff;
        --color-primary-dark: #0056b3;
        --color-primary-rgb: 0, 123, 255;
        
        /* Secondary Colors */
        --color-secondary: #6c757d;
        --color-secondary-light: #a8b2bd;
        --color-secondary-dark: #545b62;
        --color-secondary-rgb: 108, 117, 125;
        
        /* Accent Colors */
        --color-accent: #17a2b8;
        --color-accent-light: #5fc9e3;
        --color-accent-dark: #0f7a8c;
        --color-accent-rgb: 23, 162, 184;
        
        /* Status Colors */
        --color-success: #28a745;
        --color-success-light: #71d875;
        --color-success-dark: #1e7e34;
        --color-success-rgb: 40, 167, 69;
        
        --color-warning: #ffc107;
        --color-warning-light: #ffcd39;
        --color-warning-dark: #d39e00;
        --color-warning-rgb: 255, 193, 7;
        
        --color-danger: #dc3545;
        --color-danger-light: #f1b0b7;
        --color-danger-dark: #bd2130;
        --color-danger-rgb: 220, 53, 69;
        
        --color-info: #17a2b8;
        --color-info-light: #5fc9e3;
        --color-info-dark: #0f7a8c;
        --color-info-rgb: 23, 162, 184;
        
        /* Neutral Colors */
        --color-light: #f8f9fa;
        --color-light-light: #ffffff;
        --color-light-dark: #e9ecef;
        --color-light-rgb: 248, 249, 250;
        
        --color-dark: #343a40;
        --color-dark-light: #495057;
        --color-dark-dark: #212529;
        --color-dark-rgb: 52, 58, 64;
        
        /* Background Colors */
        --color-background: #ffffff;
        --color-surface: #f8f9fa;
        --color-card: #ffffff;
        --color-background-rgb: 255, 255, 255;
        
        /* Text Colors */
        --color-text: #212529;
        --color-text-secondary: #6c757d;
        --color-text-muted: #868e96;
        --color-text-rgb: 33, 37, 41;
        
        /* Border Colors */
        --color-border: #dee2e6;
        --color-border-light: #e9ecef;
        --color-border-dark: #adb5bd;
        --color-border-rgb: 222, 226, 230;
        
        /* Shadow Colors */
        --color-shadow: rgba(0, 0, 0, 0.1);
        --color-shadow-light: rgba(0, 0, 0, 0.05);
        --color-shadow-dark: rgba(0, 0, 0, 0.2);
        
        /* Brand Colors */
        --color-poker-blue: #007bff;
        --color-poker-green: #28a745;
        --color-poker-purple: #6f42c1;
        --color-poker-dark: #212529;
        --color-acey-center: #7c3aed;
        
        /* Semantic Colors */
        --color-brand-primary: var(--color-primary);
        --color-brand-secondary: var(--color-secondary);
        --color-brand-accent: var(--color-accent);
        
        /* Interactive Colors */
        --color-hover: rgba(0, 0, 0, 0.05);
        --color-active: rgba(0, 0, 0, 0.1);
        --color-focus: rgba(0, 123, 255, 0.25);
        --color-disabled: #e9ecef;
        --color-disabled-text: #6c757d;
        
        /* Transitions */
        --transition-fast: 150ms ease-in-out;
        --transition-normal: 250ms ease-in-out;
        --transition-slow: 350ms ease-in-out;
      }
      
      /* Dark Theme Variables */
      [data-theme="poker-dark"] {
        --color-primary: #0d6efd;
        --color-primary-light: #3d8bfd;
        --color-primary-dark: #0a58ca;
        --color-primary-rgb: 13, 110, 253;
        
        --color-background: #121212;
        --color-surface: #1e1e1e;
        --color-card: #2d2d2d;
        --color-background-rgb: 18, 18, 18;
        
        --color-text: #ffffff;
        --color-text-secondary: #b3b3b3;
        --color-text-muted: #808080;
        --color-text-rgb: 255, 255, 255;
        
        --color-border: #404040;
        --color-border-light: #525252;
        --color-border-dark: #262626;
        --color-border-rgb: 64, 64, 64;
        
        --color-shadow: rgba(0, 0, 0, 0.3);
        --color-shadow-light: rgba(0, 0, 0, 0.1);
        --color-shadow-dark: rgba(0, 0, 0, 0.5);
        
        --color-hover: rgba(255, 255, 255, 0.05);
        --color-active: rgba(255, 255, 255, 0.1);
        --color-focus: rgba(13, 110, 253, 0.25);
        --color-disabled: #2d2d2d;
        --color-disabled-text: #808080;
      }
      
      /* High Contrast Mode */
      [data-high-contrast="true"] {
        --color-primary: #0000ff;
        --color-primary-dark: #000080;
        --color-secondary: #808080;
        --color-success: #008000;
        --color-warning: #ff8c00;
        --color-danger: #ff0000;
        --color-info: #0000ff;
        --color-text: #000000;
        --color-background: #ffffff;
        --color-border: #000000;
        --color-shadow: rgba(0, 0, 0, 0.5);
      }
      
      [data-high-contrast="true"][data-theme="poker-dark"] {
        --color-primary: #ffffff;
        --color-primary-dark: #cccccc;
        --color-secondary: #cccccc;
        --color-success: #00ff00;
        --color-warning: #ffff00;
        --color-danger: #ff0000;
        --color-info: #ffffff;
        --color-text: #ffffff;
        --color-background: #000000;
        --color-border: #ffffff;
        --color-shadow: rgba(255, 255, 255, 0.3);
      }
      
      /* Color Blind Support */
      [data-color-blind="protanopia"] {
        --color-primary: #0066cc;
        --color-success: #009966;
        --color-danger: #cc6600;
        --color-warning: #cc9900;
        --color-info: #0066cc;
      }
      
      [data-color-blind="deuteranopia"] {
        --color-primary: #0066cc;
        --color-success: #009966;
        --color-danger: #cc6600;
        --color-warning: #cc9900;
        --color-info: #0066cc;
      }
      
      [data-color-blind="tritanopia"] {
        --color-primary: #0066cc;
        --color-success: #009966;
        --color-danger: #cc0066;
        --color-warning: #cc6600;
        --color-info: #0066cc;
      }
      
      /* Application Specific Overrides */
      .main-website {
        --app-primary: var(--color-poker-blue);
        --app-accent: var(--color-accent);
      }
      
      .poker-game {
        --app-primary: var(--color-poker-green);
        --app-accent: var(--color-success);
      }
      
      .acey-control-center {
        --app-primary: var(--color-acey-center);
        --app-accent: var(--color-info);
      }
      
      .obs-overlay {
        --app-primary: var(--color-poker-purple);
        --app-accent: var(--color-accent);
      }
      
      /* Consistent Component Colors */
      .btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        color: var(--color-light-light);
      }
      
      .btn-primary:hover {
        background-color: var(--color-primary-dark);
        border-color: var(--color-primary-dark);
      }
      
      .btn-secondary {
        background-color: var(--color-secondary);
        border-color: var(--color-secondary);
        color: var(--color-light-light);
      }
      
      .card {
        background-color: var(--color-card);
        border-color: var(--color-border);
        color: var(--color-text);
      }
      
      .table-surface {
        background-color: var(--color-surface);
        border-color: var(--color-border);
      }
      
      .nav-link {
        color: var(--color-text-secondary);
      }
      
      .nav-link:hover,
      .nav-link.active {
        color: var(--color-primary);
      }
      
      .form-control {
        background-color: var(--color-background);
        border-color: var(--color-border);
        color: var(--color-text);
      }
      
      .form-control:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 0.2rem var(--color-focus);
      }
      
      /* Status Indicators */
      .status-online {
        color: var(--color-success);
      }
      
      .status-offline {
        color: var(--color-danger);
      }
      
      .status-pending {
        color: var(--color-warning);
      }
      
      /* Poker Specific Colors */
      .card-spades,
      .card-clubs {
        color: var(--color-dark);
      }
      
      .card-hearts,
      .card-diamonds {
        color: var(--color-danger);
      }
      
      .chip-red {
        background-color: var(--color-danger);
      }
      
      .chip-blue {
        background-color: var(--color-primary);
      }
      
      .chip-green {
        background-color: var(--color-success);
      }
      
      .chip-black {
        background-color: var(--color-dark);
      }
      
      .chip-purple {
        background-color: var(--color-poker-purple);
      }
      
      /* Transitions */
      * {
        transition: color var(--transition-normal),
                    background-color var(--transition-normal),
                    border-color var(--transition-normal),
                    box-shadow var(--transition-normal);
      }
    `;
    
    document.head.appendChild(style);
  }

  setupThemes() {
    // Create theme configurations
    this.themes.set('poker-blue', {
      name: 'Poker Blue',
      description: 'Classic blue poker theme',
      colors: this.colorSchemes.get('poker-blue'),
      applications: ['main-website', 'poker-game', 'obs-overlay']
    });
    
    this.themes.set('poker-green', {
      name: 'Poker Green',
      description: 'Traditional green felt theme',
      colors: this.colorSchemes.get('poker-green'),
      applications: ['poker-game', 'obs-overlay']
    });
    
    this.themes.set('poker-purple', {
      name: 'Poker Purple',
      description: 'Modern purple accent theme',
      colors: this.colorSchemes.get('poker-purple'),
      applications: ['obs-overlay']
    });
    
    this.themes.set('poker-dark', {
      name: 'Poker Dark',
      description: 'Dark mode theme',
      colors: this.colorSchemes.get('poker-dark'),
      applications: ['main-website', 'poker-game', 'acey-control-center', 'obs-overlay']
    });
    
    this.themes.set('acey-center', {
      name: 'Acey Control Center',
      description: 'AI Control Center theme',
      colors: this.colorSchemes.get('acey-center'),
      applications: ['acey-control-center']
    });
  }

  setupColorBlindSupport() {
    // Detect color blindness preferences
    const colorBlindMode = localStorage.getItem('color-blind-mode');
    if (colorBlindMode) {
      document.documentElement.setAttribute('data-color-blind', colorBlindMode);
    }
  }

  setupHighContrastMode() {
    // Detect high contrast preference
    const highContrast = localStorage.getItem('high-contrast') === 'true';
    if (highContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    }
    
    // Listen for system high contrast
    if (window.matchMedia) {
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      highContrastQuery.addListener((e) => {
        if (e.matches) {
          document.documentElement.setAttribute('data-high-contrast', 'true');
        } else {
          document.documentElement.removeAttribute('data-high-contrast');
        }
      });
    }
  }

  setupSystemPreferences() {
    // Detect system color scheme preference
    if (window.matchMedia && this.options.enableDarkMode) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addListener((e) => {
        if (e.matches && this.currentTheme !== 'poker-dark') {
          this.applyTheme('poker-dark');
        } else if (!e.matches && this.currentTheme === 'poker-dark') {
          this.applyTheme('poker-blue');
        }
      });
    }
    
    // Detect reduced motion preference
    if (window.matchMedia) {
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotionQuery.addListener((e) => {
        if (e.matches) {
          document.documentElement.style.setProperty('--transition-fast', '0ms');
          document.documentElement.style.setProperty('--transition-normal', '0ms');
          document.documentElement.style.setProperty('--transition-slow', '0ms');
        }
      });
    }
  }

  setupGlobalAPI() {
    // Global color scheme API
    window.consistentColorScheme = {
      getTheme: () => this.getTheme(),
      setTheme: (theme) => this.setTheme(theme),
      getAvailableThemes: () => this.getAvailableThemes(),
      getColor: (colorName, theme) => this.getColor(colorName, theme),
      setColorBlindMode: (mode) => this.setColorBlindMode(mode),
      setHighContrast: (enabled) => this.setHighContrast(enabled),
      exportTheme: (theme) => this.exportTheme(theme),
      importTheme: (themeData) => this.importTheme(themeData),
      createCustomTheme: (name, colors) => this.createCustomTheme(name, colors),
      observeTheme: (callback) => this.observeTheme(callback),
      unobserveTheme: (callback) => this.unobserveTheme(callback)
    };
  }

  applyTheme(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.error(`Theme "${themeName}" not found`);
      return;
    }
    
    const colors = theme.colors;
    
    // Update CSS custom properties
    Object.entries(colors).forEach(([property, value]) => {
      const cssVar = `--color-${property.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      document.documentElement.style.setProperty(cssVar, value);
      
      // Also set RGB versions for opacity
      if (property.includes('rgb') === false && !property.includes('shadow') && !property.includes('gradient')) {
        const rgb = this.hexToRgb(value);
        if (rgb) {
          const rgbVar = `--color-${property.replace(/([A-Z])/g, '-$1').toLowerCase()}-rgb`;
          document.documentElement.style.setProperty(rgbVar, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }
      }
    });
    
    // Set theme attribute
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Update current theme
    this.currentTheme = themeName;
    
    // Save preference
    localStorage.setItem('preferred-theme', themeName);
    
    // Notify observers
    this.notifyObservers(themeName);
    
    // Emit theme change event
    this.emitThemeChange(themeName);
  }

  setTheme(themeName) {
    this.applyTheme(themeName);
  }

  getTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return Array.from(this.themes.entries()).map(([key, theme]) => ({
      key,
      name: theme.name,
      description: theme.description,
      applications: theme.applications
    }));
  }

  getColor(colorName, theme = null) {
    const themeName = theme || this.currentTheme;
    const colors = this.colorSchemes.get(themeName);
    return colors ? colors[colorName] : null;
  }

  setColorBlindMode(mode) {
    if (mode === 'none') {
      document.documentElement.removeAttribute('data-color-blind');
    } else {
      document.documentElement.setAttribute('data-color-blind', mode);
    }
    localStorage.setItem('color-blind-mode', mode);
  }

  setHighContrast(enabled) {
    if (enabled) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
    }
    localStorage.setItem('high-contrast', enabled.toString());
  }

  createCustomTheme(name, colors) {
    // Create custom theme
    const baseColors = this.colorSchemes.get('poker-blue');
    const customColors = { ...baseColors, ...colors };
    
    this.colorSchemes.set(name, customColors);
    
    this.themes.set(name, {
      name: name,
      description: 'Custom theme',
      colors: customColors,
      applications: ['main-website', 'poker-game', 'acey-control-center', 'obs-overlay']
    });
    
    return this.themes.get(name);
  }

  exportTheme(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      return null;
    }
    
    return {
      name: theme.name,
      description: theme.description,
      colors: theme.colors,
      applications: theme.applications,
      exportedAt: new Date().toISOString()
    };
  }

  importTheme(themeData) {
    if (!themeData.name || !themeData.colors) {
      throw new Error('Invalid theme data');
    }
    
    this.colorSchemes.set(themeData.name, themeData.colors);
    
    this.themes.set(themeData.name, {
      name: themeData.name,
      description: themeData.description || 'Imported theme',
      colors: themeData.colors,
      applications: themeData.applications || ['main-website', 'poker-game', 'acey-control-center', 'obs-overlay']
    });
    
    return this.themes.get(themeData.name);
  }

  observeTheme(callback) {
    this.observers.add(callback);
    return () => this.unobserveTheme(callback);
  }

  unobserveTheme(callback) {
    this.observers.delete(callback);
  }

  notifyObservers(themeName) {
    this.observers.forEach(callback => {
      try {
        callback(themeName);
      } catch (error) {
        console.error('Theme observer error:', error);
      }
    });
  }

  emitThemeChange(themeName) {
    const event = new CustomEvent('themechange', {
      detail: {
        theme: themeName,
        colors: this.colorSchemes.get(themeName)
      }
    });
    
    document.dispatchEvent(event);
  }

  hexToRgb(hex) {
    // Handle rgba values
    if (hex.startsWith('rgba')) {
      const values = hex.match(/\d+/g);
      if (values && values.length >= 3) {
        return {
          r: parseInt(values[0]),
          g: parseInt(values[1]),
          b: parseInt(values[2])
        };
      }
      return null;
    }
    
    // Handle hex values
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Initialize with saved preference
  initializeFromPreferences() {
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme && this.themes.has(savedTheme)) {
      this.applyTheme(savedTheme);
    }
  }

  // Cleanup
  destroy() {
    // Remove styles
    const style = document.getElementById('consistent-color-scheme-styles');
    if (style) {
      style.remove();
    }
    
    // Clear data
    this.colorSchemes.clear();
    this.themes.clear();
    this.observers.clear();
    
    // Remove global API
    delete window.consistentColorScheme;
  }
}

// Create global instance
window.consistentColorScheme = new ConsistentColorScheme({
  enableDarkMode: true,
  enableHighContrast: true,
  enableColorBlindSupport: true,
  enableAnimations: true,
  enableTransitions: true
});

// Initialize from preferences
document.addEventListener('DOMContentLoaded', () => {
  window.consistentColorScheme.initializeFromPreferences();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsistentColorScheme;
}
