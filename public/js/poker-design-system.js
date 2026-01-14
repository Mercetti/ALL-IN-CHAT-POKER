/**
 * Unified Design System for All Poker Apps
 * Provides consistent styling, themes, and design tokens across all applications
 */

class PokerDesignSystem {
  constructor(options = {}) {
    this.options = {
      defaultTheme: 'poker-blue',
      enableDarkMode: true,
      enableAnimations: true,
      enableResponsiveDesign: true,
      debugMode: false,
      ...options
    };
    
    this.themes = new Map();
    this.tokens = new Map();
    this.components = new Map();
    this.currentTheme = this.options.defaultTheme;
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    // Register design tokens
    this.registerDesignTokens();
    
    // Register themes
    this.registerThemes();
    
    // Register component styles
    this.registerComponentStyles();
    
    // Setup theme switching
    this.setupThemeSwitching();
    
    // Apply default theme
    this.applyTheme(this.currentTheme);
    
    this.isInitialized = true;
  }

  registerDesignTokens() {
    // Color tokens
    this.tokens.set('colors', {
      // Primary colors
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554'
      },
      
      // Secondary colors
      secondary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617'
      },
      
      // Success colors
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
        950: '#052e16'
      },
      
      // Warning colors
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
        950: '#451a03'
      },
      
      // Error colors
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
        950: '#450a0a'
      },
      
      // Poker specific colors
      poker: {
        green: '#059669',
        blue: '#2563eb',
        red: '#dc2626',
        black: '#000000',
        white: '#ffffff',
        gold: '#fbbf24',
        silver: '#9ca3af',
        bronze: '#92400e'
      }
    });
    
    // Spacing tokens
    this.tokens.set('spacing', {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px',
      '4xl': '96px',
      '5xl': '128px'
    });
    
    // Typography tokens
    this.tokens.set('typography', {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        mono: ['"SF Mono"', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace']
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem'
      },
      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900'
      },
      lineHeight: {
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2'
      }
    });
    
    // Border radius tokens
    this.tokens.set('borderRadius', {
      none: '0',
      sm: '4px',
      base: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '32px',
      full: '9999px'
    });
    
    // Shadow tokens
    this.tokens.set('shadows', {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      glow: '0 0 20px rgba(59, 130, 246, 0.5)',
      'glow-success': '0 0 20px rgba(34, 197, 94, 0.5)',
      'glow-warning': '0 0 20px rgba(245, 158, 11, 0.5)',
      'glow-error': '0 0 20px rgba(239, 68, 68, 0.5)'
    });
    
    // Animation tokens
    this.tokens.set('animations', {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
        slower: '1000ms'
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        'ease-in': 'ease-in',
        'ease-out': 'ease-out',
        'ease-in-out': 'ease-in-out',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
    });
  }

  registerThemes() {
    // Poker Blue Theme
    this.themes.set('poker-blue', {
      name: 'Poker Blue',
      colors: {
        primary: this.tokens.get('colors').primary[600],
        primaryHover: this.tokens.get('colors').primary[700],
        secondary: this.tokens.get('colors').secondary[600],
        background: this.tokens.get('colors').secondary[900],
        surface: this.tokens.get('colors').secondary[800],
        text: this.tokens.get('colors').secondary[100],
        textSecondary: this.tokens.get('colors').secondary[400],
        border: this.tokens.get('colors').secondary[700],
        success: this.tokens.get('colors').success[500],
        warning: this.tokens.get('colors').warning[500],
        error: this.tokens.get('colors').error[500]
      },
      typography: {
        fontFamily: this.tokens.get('typography').fontFamily.sans,
        fontSize: this.tokens.get('typography').fontSize.base,
        fontWeight: this.tokens.get('typography').fontWeight.normal
      },
      spacing: this.tokens.get('spacing'),
      borderRadius: this.tokens.get('borderRadius'),
      shadows: this.tokens.get('shadows'),
      animations: this.tokens.get('animations')
    });
    
    // Poker Green Theme
    this.themes.set('poker-green', {
      name: 'Poker Green',
      colors: {
        primary: this.tokens.get('colors').success[600],
        primaryHover: this.tokens.get('colors').success[700],
        secondary: this.tokens.get('colors').secondary[600],
        background: '#022c22',
        surface: '#064e3b',
        text: '#f0fdf4',
        textSecondary: '#86efac',
        border: '#065f46',
        success: this.tokens.get('colors').success[500],
        warning: this.tokens.get('colors').warning[500],
        error: this.tokens.get('colors').error[500]
      },
      typography: {
        fontFamily: this.tokens.get('typography').fontFamily.sans,
        fontSize: this.tokens.get('typography').fontSize.base,
        fontWeight: this.tokens.get('typography').fontWeight.normal
      },
      spacing: this.tokens.get('spacing'),
      borderRadius: this.tokens.get('borderRadius'),
      shadows: this.tokens.get('shadows'),
      animations: this.tokens.get('animations')
    });
    
    // Poker Dark Theme
    this.themes.set('poker-dark', {
      name: 'Poker Dark',
      colors: {
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        secondary: '#4b5563',
        background: '#000000',
        surface: '#111827',
        text: '#f9fafb',
        textSecondary: '#9ca3af',
        border: '#374151',
        success: this.tokens.get('colors').success[500],
        warning: this.tokens.get('colors').warning[500],
        error: this.tokens.get('colors').error[500]
      },
      typography: {
        fontFamily: this.tokens.get('typography').fontFamily.sans,
        fontSize: this.tokens.get('typography').fontSize.base,
        fontWeight: this.tokens.get('typography').fontWeight.normal
      },
      spacing: this.tokens.get('spacing'),
      borderRadius: this.tokens.get('borderRadius'),
      shadows: this.tokens.get('shadows'),
      animations: this.tokens.get('animations')
    });
    
    // Light Theme
    this.themes.set('light', {
      name: 'Light',
      colors: {
        primary: this.tokens.get('colors').primary[600],
        primaryHover: this.tokens.get('colors').primary[700],
        secondary: this.tokens.get('colors').secondary[500],
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: this.tokens.get('colors').success[500],
        warning: this.tokens.get('colors').warning[500],
        error: this.tokens.get('colors').error[500]
      },
      typography: {
        fontFamily: this.tokens.get('typography').fontFamily.sans,
        fontSize: this.tokens.get('typography').fontSize.base,
        fontWeight: this.tokens.get('typography').fontWeight.normal
      },
      spacing: this.tokens.get('spacing'),
      borderRadius: this.tokens.get('borderRadius'),
      shadows: this.tokens.get('shadows'),
      animations: this.tokens.get('animations')
    });
  }

  registerComponentStyles() {
    // Base component styles
    this.components.set('base', {
      button: {
        base: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--poker-spacing-sm)',
          border: 'none',
          borderRadius: 'var(--poker-radius-base)',
          fontFamily: 'var(--poker-font-family)',
          fontWeight: 'var(--poker-font-weight-medium)',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all var(--poker-duration-normal) var(--poker-easing)',
          outline: 'none'
        },
        variants: {
          primary: {
            background: 'var(--poker-color-primary)',
            color: 'white'
          },
          secondary: {
            background: 'var(--poker-color-secondary)',
            color: 'white'
          },
          outline: {
            background: 'transparent',
            border: '2px solid var(--poker-color-primary)',
            color: 'var(--poker-color-primary)'
          },
          ghost: {
            background: 'transparent',
            color: 'var(--poker-color-primary)'
          }
        },
        sizes: {
          sm: {
            padding: 'var(--poker-spacing-sm) var(--poker-spacing-md)',
            fontSize: 'var(--poker-font-size-sm)'
          },
          md: {
            padding: 'var(--poker-spacing-md) var(--poker-spacing-lg)',
            fontSize: 'var(--poker-font-size-base)'
          },
          lg: {
            padding: 'var(--poker-spacing-lg) var(--poker-spacing-xl)',
            fontSize: 'var(--poker-font-size-lg)'
          }
        },
        states: {
          hover: {
            transform: 'translateY(-1px)',
            boxShadow: 'var(--poker-shadow-md)'
          },
          active: {
            transform: 'translateY(0)',
            boxShadow: 'var(--poker-shadow-sm)'
          },
          disabled: {
            opacity: '0.6',
            cursor: 'not-allowed',
            transform: 'none'
          },
          focus: {
            outline: '2px solid var(--poker-color-primary)',
            outlineOffset: '2px'
          }
        }
      },
      
      card: {
        base: {
          background: 'var(--poker-color-surface)',
          border: '1px solid var(--poker-color-border)',
          borderRadius: 'var(--poker-radius-base)',
          boxShadow: 'var(--poker-shadow-sm)',
          transition: 'all var(--poker-duration-normal) var(--poker-easing)'
        },
        variants: {
          elevated: {
            boxShadow: 'var(--poker-shadow-md)'
          },
          outlined: {
            border: '2px solid var(--poker-color-primary)'
          },
          filled: {
            background: 'var(--poker-color-primary)',
            color: 'white'
          }
        },
        states: {
          hover: {
            transform: 'translateY(-2px)',
            boxShadow: 'var(--poker-shadow-lg)'
          },
          active: {
            transform: 'translateY(0)',
            boxShadow: 'var(--poker-shadow-sm)'
          },
          disabled: {
            opacity: '0.6',
            cursor: 'not-allowed'
          }
        }
      },
      
      input: {
        base: {
          width: '100%',
          padding: 'var(--poker-spacing-md)',
          border: '1px solid var(--poker-color-border)',
          borderRadius: 'var(--poker-radius-base)',
          background: 'var(--poker-color-surface)',
          color: 'var(--poker-color-text)',
          fontFamily: 'var(--poker-font-family)',
          fontSize: 'var(--poker-font-size-base)',
          transition: 'all var(--poker-duration-normal) var(--poker-easing)',
          outline: 'none'
        },
        states: {
          focus: {
            borderColor: 'var(--poker-color-primary)',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
          },
          error: {
            borderColor: 'var(--poker-color-error)',
            boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
          },
          disabled: {
            opacity: '0.6',
            cursor: 'not-allowed'
          }
        }
      }
    });
  }

  setupThemeSwitching() {
    // Auto-detect system preference
    if (this.options.enableDarkMode) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      if (prefersDark.matches && this.currentTheme === 'light') {
        this.currentTheme = 'poker-dark';
      }
      
      // Listen for system theme changes
      prefersDark.addEventListener('change', (e) => {
        if (e.matches) {
          this.setTheme('poker-dark');
        } else {
          this.setTheme('light');
        }
      });
    }
  }

  applyTheme(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(`Theme "${themeName}" not found`);
      return;
    }
    
    this.currentTheme = themeName;
    
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
    
    // Notify theme change
    this.notifyThemeChange(themeName);
  }

  notifyThemeChange(themeName) {
    // Dispatch custom event
    const event = new CustomEvent('themeChange', {
      detail: { theme: themeName }
    });
    document.dispatchEvent(event);
    
    // Update theme toggle if exists
    if (window.pokerComponents && window.pokerComponents.setTheme) {
      window.pokerComponents.setTheme(themeName);
    }
  }

  // Public API
  setTheme(themeName) {
    this.applyTheme(themeName);
    
    // Save preference
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('poker-theme', themeName);
    }
  }

  getTheme(themeName) {
    return this.themes.get(themeName);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getToken(category, name) {
    const categoryTokens = this.tokens.get(category);
    return categoryTokens ? categoryTokens[name] : null;
  }

  getComponentStyles(componentName) {
    return this.components.get(componentName);
  }

  listThemes() {
    return Array.from(this.themes.keys());
  }

  createCSS() {
    // Generate complete CSS for the design system
    let css = '';
    
    // CSS custom properties
    css += ':root {\n';
    
    // Color variables
    Object.entries(this.tokens.get('colors')).forEach(([category, colors]) => {
      Object.entries(colors).forEach(([shade, value]) => {
        css += `  --poker-color-${category}-${shade}: ${value};\n`;
      });
    });
    
    // Other tokens
    Object.entries(this.tokens).forEach(([category, tokens]) => {
      if (category !== 'colors') {
        Object.entries(tokens).forEach(([name, value]) => {
          if (typeof value === 'string') {
            css += `  --poker-${category}-${name}: ${value};\n`;
          } else if (typeof value === 'object') {
            Object.entries(value).forEach(([subName, subValue]) => {
              css += `  --poker-${category}-${subName}: ${subValue};\n`;
            });
          }
        });
      }
    });
    
    css += '}\n\n';
    
    // Component styles
    Object.entries(this.components.get('base')).forEach(([component, styles]) => {
      css += this.generateComponentCSS(component, styles);
    });
    
    return css;
  }

  generateComponentCSS(componentName, styles) {
    let css = '';
    
    // Base styles
    if (styles.base) {
      css += `.poker-${componentName} {\n`;
      Object.entries(styles.base).forEach(([property, value]) => {
        css += `  ${property}: ${value};\n`;
      });
      css += '}\n\n';
    }
    
    // Variants
    if (styles.variants) {
      Object.entries(styles.variants).forEach(([variant, variantStyles]) => {
        css += `.poker-${componentName}--${variant} {\n`;
        Object.entries(variantStyles).forEach(([property, value]) => {
          css += `  ${property}: ${value};\n`;
        });
        css += '}\n\n';
      });
    }
    
    // Sizes
    if (styles.sizes) {
      Object.entries(styles.sizes).forEach(([size, sizeStyles]) => {
        css += `.poker-${componentName}--${size} {\n`;
        Object.entries(sizeStyles).forEach(([property, value]) => {
          css += `  ${property}: ${value};\n`;
        });
        css += '}\n\n';
      });
    }
    
    // States
    if (styles.states) {
      Object.entries(styles.states).forEach(([state, stateStyles]) => {
        css += `.poker-${componentName}:${state} {\n`;
        Object.entries(stateStyles).forEach(([property, value]) => {
          css += `  ${property}: ${value};\n`;
        });
        css += '}\n\n';
        
        // Also add as class for programmatic use
        css += `.poker-${componentName}--${state} {\n`;
        Object.entries(stateStyles).forEach(([property, value]) => {
          css += `  ${property}: ${value};\n`;
        });
        css += '}\n\n';
      });
    }
    
    return css;
  }

  // Utility methods
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  adjustBrightness(color, amount) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;
    
    const adjust = (value) => {
      const adjusted = value + amount;
      return Math.max(0, Math.min(255, adjusted));
    };
    
    return this.rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
  }

  // Responsive utilities
  createResponsiveClasses() {
    const breakpoints = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    };
    
    let css = '';
    
    Object.entries(breakpoints).forEach(([name, size]) => {
      css += `@media (min-width: ${size}) {\n`;
      css += `  .poker-responsive\\:${name}-block { display: block; }\n`;
      css += `  .poker-responsive\\:${name}-hidden { display: none; }\n`;
      css += `  .poker-responsive\\:${name}-flex { display: flex; }\n`;
      css += `  .poker-responsive\\:${name}-grid { display: grid; }\n`;
      css += '}\n\n';
    });
    
    return css;
  }

  // Initialize saved theme
  initializeSavedTheme() {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('poker-theme');
      if (savedTheme && this.themes.has(savedTheme)) {
        this.setTheme(savedTheme);
      }
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
      this.themes.set(theme.name, theme);
      return true;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  }
}

// Create global instance
window.pokerDesignSystem = new PokerDesignSystem({
  defaultTheme: 'poker-blue',
  enableDarkMode: true,
  enableAnimations: true,
  enableResponsiveDesign: true,
  debugMode: false
});

// Initialize saved theme
window.pokerDesignSystem.initializeSavedTheme();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PokerDesignSystem;
}
