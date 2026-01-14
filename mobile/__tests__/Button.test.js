/**
 * Button Component Tests
 * Testing for consistent button behavior and styling
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import Button from '../src/components/Button';
import { ThemeProvider } from '../src/theme/ThemeContext';

// Mock theme for testing
const mockTheme = {
  colors: {
    primary: '#4adeff',
    secondary: '#ff6bd6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
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
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

describe('Button Component', () => {
  const renderButton = (props = {}) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <Button {...props} />
      </ThemeProvider>
    );
  };

  test('renders with title', () => {
    const { getByText } = renderButton({ title: 'Test Button' });
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  test('renders primary variant', () => {
    const { getByTestId } = renderButton({ 
      title: 'Primary Button',
      variant: 'primary' 
    });
    
    const button = getByTestId('button');
    expect(button).toBeTruthy();
    
    // Check primary styling
    expect(button.props.style).toContainEqual({
      backgroundColor: mockTheme.colors.primary,
    });
  });

  test('renders secondary variant', () => {
    const { getByTestId } = renderButton({ 
      title: 'Secondary Button',
      variant: 'secondary' 
    });
    
    const button = getByTestId('button');
    expect(button).toBeTruthy();
    
    // Check secondary styling
    expect(button.props.style).toContainEqual({
      backgroundColor: mockTheme.colors.secondary,
    });
  });

  test('renders danger variant', () => {
    const { getByTestId } = renderButton({ 
      title: 'Danger Button',
      variant: 'danger' 
    });
    
    const button = getByTestId('button');
    expect(button).toBeTruthy();
    
    // Check danger styling
    expect(button.props.style).toContainEqual({
      backgroundColor: mockTheme.colors.error,
    });
  });

  test('renders outline variant', () => {
    const { getByTestId } = renderButton({ 
      title: 'Outline Button',
      variant: 'outline' 
    });
    
    const button = getByTestId('button');
    expect(button).toBeTruthy();
    
    // Check outline styling
    expect(button.props.style).toContainEqual({
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: mockTheme.colors.primary,
    });
  });

  test('handles press events', () => {
    const mockOnPress = jest.fn();
    const { getByText } = renderButton({ 
      title: 'Press Me',
      onPress: mockOnPress 
    });
    
    const button = getByText('Press Me');
    fireEvent.press(button);
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('is disabled when disabled prop is true', () => {
    const { getByTestId } = renderButton({ 
      title: 'Disabled Button',
      disabled: true 
    });
    
    const button = getByTestId('button');
    expect(button).toBeTruthy();
    expect(button.props.disabled).toBe(true);
    expect(button.props.style).toContainEqual({
      opacity: 0.6,
    });
  });

  test('shows icon when provided', () => {
    const { getByTestId } = renderButton({ 
      title: 'Icon Button',
      icon: '🎰' 
    });
    
    const button = getByTestId('button');
    expect(button).toBeTruthy();
    
    // Check icon is rendered
    expect(getByText('🎰')).toBeTruthy();
  });

  test('has proper accessibility', () => {
    const { getByLabelText } = renderButton({ 
      title: 'Accessible Button',
      accessibilityLabel: 'Custom button for testing' 
    });
    
    expect(getByLabelText('Custom button for testing')).toBeTruthy();
  });

  test('small size has correct styling', () => {
    const { getByTestId } = renderButton({ 
      title: 'Small Button',
      size: 'small' 
    });
    
    const button = getByTestId('button');
    expect(button).toBeTruthy();
    
    // Check small size styling
    expect(button.props.style).toContainEqual({
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      minHeight: 32,
    });
  });

  test('large size has correct styling', () => {
    const { getByTestId } = renderButton({ 
      title: 'Large Button',
      size: 'large' 
    });
    
    const button = getByTestId('button');
    expect(button).toBeTruthy();
    
    // Check large size styling
    expect(button.props.style).toContainEqual({
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: 18,
      minHeight: 56,
    });
  });

  test('has minimum touch target size', () => {
    const { getByTestId } = renderButton({ 
      title: 'Touch Target Button' 
    });
    
    const button = getByTestId('button');
    expect(button).toBeTruthy();
    
    // Verify minimum touch target (44x44)
    expect(button.props.style.minHeight).toBeGreaterThanOrEqual(44);
    expect(button.props.style.minWidth).toBeGreaterThanOrEqual(44);
  });
});
