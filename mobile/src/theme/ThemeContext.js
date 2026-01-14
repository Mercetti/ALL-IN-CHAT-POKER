/**
 * Theme Context for React Native
 * Provides unified design system colors and tokens
 */

import React, { createContext, useContext } from 'react';

// Define color palette
const COLORS = {
  primary: '#4adeff',
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

// Define spacing scale
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Define typography scale
const TYPOGRAPHY = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

// Define border radius scale
const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

// Create theme context
const ThemeContext = createContext();

// Create theme provider component
const ThemeProvider = ({ children, theme = {} }) => {
  const defaultTheme = {
    colors: COLORS,
    spacing: SPACING,
    typography: TYPOGRAPHY,
    borderRadius: BORDER_RADIUS,
    ...theme,
  };

  return React.createElement(
    ThemeContext.Provider,
    { value: defaultTheme },
    children
  );
};

// Create useTheme hook
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { ThemeProvider, useTheme, ThemeContext };
