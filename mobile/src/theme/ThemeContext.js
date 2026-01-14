/**
 * Theme Context for React Native
 * Provides unified design system colors and tokens
 */

import React, { createContext, useContext, useMemo } from 'react';

// Import design system colors
const COLORS = {
  primary: '#4adeff',
  primaryDark: '#2c5aa0',
  primaryLight: '#7ec8ff',
  secondary: '#ff6bd6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#030712',
  surface: '#ffffff',
  text: '#ffffff',
  textSecondary: '#64748b',
  border: '#cbd5e1',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const TYPOGRAPHY = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

// Create theme context
const ThemeContext = createContext({
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  borderRadius: BORDER_RADIUS,
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const theme = useMemo(() => ({
    colors: COLORS,
    spacing: SPACING,
    typography: TYPOGRAPHY,
    borderRadius: BORDER_RADIUS,
  }), []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
