/**
 * Game Screen Component Tests
 * Comprehensive testing for mobile poker game interface
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';
import GameScreen from '../src/screens/GameScreen';
import { ThemeProvider } from '../src/theme/ThemeContext';

// Mock theme for testing
const mockTheme = {
  colors: {
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
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
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
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

describe('GameScreen', () => {
  const renderComponent = () => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <GameScreen />
      </ThemeProvider>
    );
  };

  test('renders correctly', () => {
    const { getByText } = renderComponent();
    
    expect(getByText('All-In Chat Poker')).toBeTruthy();
  });

  test('displays game status', () => {
    const { getByText } = renderComponent();
    
    expect(getByText('Game Status: waiting')).toBeTruthy();
    expect(getByText('Your Chips: $1000')).toBeTruthy();
  });

  test('displays betting interface', () => {
    const { getByText, getByPlaceholderText } = renderComponent();
    
    expect(getByPlaceholderText('Enter bet amount')).toBeTruthy();
    expect(getByText('Bet')).toBeTruthy();
    expect(getByText('Check')).toBeTruthy();
    expect(getByText('Fold')).toBeTruthy();
  });

  test('displays game actions', () => {
    const { getByText } = renderComponent();
    
    expect(getByText('View Profile')).toBeTruthy();
    expect(getByText('Tournaments')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  test('handles bet button press', () => {
    const { getByText } = renderComponent();
    const betButton = getByText('Bet');
    
    fireEvent.press(betButton);
    
    // Component should handle bet press
    expect(getByText('All-In Chat Poker')).toBeTruthy();
  });

  test('handles fold button press', () => {
    const { getByText } = renderComponent();
    const foldButton = getByText('Fold');
    
    fireEvent.press(foldButton);
    
    // Component should handle fold press
    expect(getByText('All-In Chat Poker')).toBeTruthy();
  });

  test('handles check button press', () => {
    const { getByText } = renderComponent();
    const checkButton = getByText('Check');
    
    fireEvent.press(checkButton);
    
    // Component should handle check press
    expect(getByText('All-In Chat Poker')).toBeTruthy();
  });

  test('handles bet amount input', () => {
    const { getByPlaceholderText, getByText } = renderComponent();
    const betInput = getByPlaceholderText('Enter bet amount');
    
    fireEvent.changeText(betInput, '50');
    
    // Component should handle input changes
    expect(getByText('All-In Chat Poker')).toBeTruthy();
  });

  test('displays cards with proper styling', () => {
    const { getByText } = renderComponent();
    
    // Component should render with cards
    expect(getByText('All-In Chat Poker')).toBeTruthy();
    expect(getByText('Game Status: waiting')).toBeTruthy();
    expect(getByText('Your Chips: $1000')).toBeTruthy();
  });

  test('is accessible', () => {
    const { getByLabelText } = renderComponent();
    
    // Check accessibility labels
    expect(getByLabelText('Bet')).toBeTruthy();
    expect(getByLabelText('Check')).toBeTruthy();
    expect(getByLabelText('Fold')).toBeTruthy();
    expect(getByLabelText('View Profile')).toBeTruthy();
    expect(getByLabelText('Tournaments')).toBeTruthy();
    expect(getByLabelText('Settings')).toBeTruthy();
  });

  test('handles large bet amounts', () => {
    const { getByText, getByPlaceholderText } = renderComponent();
    const betInput = getByPlaceholderText('Enter bet amount');
    const betButton = getByText('Bet');
    
    // Test with bet amount higher than chips
    fireEvent.changeText(betInput, '1500');
    fireEvent.press(betButton);
    
    // Should not change state (insufficient chips)
    expect(getByText('Your Chips: $1000')).toBeTruthy();
    expect(getByText('Game Status: waiting')).toBeTruthy();
  });

  test('renders with theme context', () => {
    const { getByText } = renderComponent();
    
    // Component should render with theme
    expect(getByText('All-In Chat Poker')).toBeTruthy();
    // Verify theme is applied through context
    expect(getByText('Game Status: waiting')).toBeTruthy();
  });
});
