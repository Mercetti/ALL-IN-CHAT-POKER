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
    
    expect(getByText('🎰 All-In Chat Poker')).toBeTruthy();
    expect(getByText('Mobile Game')).toBeTruthy();
  });

  test('displays game status', () => {
    const { getByText } = renderComponent();
    
    expect(getByText('Status: waiting')).toBeTruthy();
    expect(getByText('Chips: 1000')).toBeTruthy();
  });

  test('displays betting interface', () => {
    const { getByText, getByPlaceholderText } = renderComponent();
    
    expect(getByText('Bet Amount')).toBeTruthy();
    expect(getByPlaceholderText('Bet Amount')).toBeTruthy();
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
    
    // Verify state changes after bet
    expect(getByText('Chips: 990')).toBeTruthy();
    expect(getByText('Status: playing')).toBeTruthy();
  });

  test('handles fold button press', () => {
    const { getByText } = renderComponent();
    const foldButton = getByText('Fold');
    
    fireEvent.press(foldButton);
    
    // Verify state changes after fold
    expect(getByText('Status: waiting')).toBeTruthy();
  });

  test('handles check button press', () => {
    const { getByText } = renderComponent();
    const checkButton = getByText('Check');
    
    fireEvent.press(checkButton);
    
    // Verify state changes after check
    expect(getByText('Status: playing')).toBeTruthy();
  });

  test('handles bet amount input', () => {
    const { getByPlaceholderText } = renderComponent();
    const betInput = getByPlaceholderText('Bet Amount');
    
    fireEvent.changeText(betInput, '50');
    
    // Verify bet amount updates
    expect(getByText('Chips: 1000')).toBeTruthy();
  });

  test('displays cards with proper styling', () => {
    const { getByTestId } = renderComponent();
    
    const statusCard = getByTestId('status-card');
    const bettingCard = getByTestId('betting-card');
    const actionsCard = getByTestId('actions-card');
    
    expect(statusCard).toBeTruthy();
    expect(bettingCard).toBeTruthy();
    expect(actionsCard).toBeTruthy();
    
    // Verify styling exists
    expect(statusCard.props.style).toBeDefined();
    expect(bettingCard.props.style).toBeDefined();
    expect(actionsCard.props.style).toBeDefined();
  });

  test('is accessible', () => {
    const { getByLabelText } = renderComponent();
    
    // Check accessibility labels
    expect(getByLabelText('Bet Amount')).toBeTruthy();
    expect(getByLabelText('Authenticate')).toBeTruthy();
    expect(getByLabelText('Fold')).toBeTruthy();
    expect(getByLabelText('Check')).toBeTruthy();
  });

  test('handles large bet amounts', () => {
    const { getByText, getByPlaceholderText } = renderComponent();
    const betInput = getByPlaceholderText('Bet Amount');
    const betButton = getByText('Bet');
    
    // Test with bet amount higher than chips
    fireEvent.changeText(betInput, '1500');
    fireEvent.press(betButton);
    
    // Should not change state (insufficient chips)
    expect(getByText('Chips: 1000')).toBeTruthy();
    expect(getByText('Status: waiting')).toBeTruthy();
  });

  test('renders with theme context', () => {
    const { getByTestId } = renderComponent();
    
    const container = getByTestId('game-screen-container');
    
    expect(container).toBeTruthy();
    // Verify theme is applied through context
    expect(container.props.style).toContainEqual({
      backgroundColor: mockTheme.colors.background,
      padding: mockTheme.spacing.md,
    });
  });
});
