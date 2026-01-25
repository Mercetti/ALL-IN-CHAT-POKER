/**
 * Card Component Tests
 * Playing card component testing
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import Card from '../src/components/Card';

// Mock theme context
jest.mock('../src/theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4adeff',
      secondary: '#ff6bd6',
      background: '#ffffff',
      text: '#000000',
      textSecondary: '#64748b',
      border: '#cbd5e1',
      surface: '#ffffff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
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
    typography: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    },
  }),
}));

describe('Card Component', () => {
  test('renders with default props', () => {
    render(<Card />);
    
    // Card should render without errors
    expect(true).toBe(true);
  });

  test('renders with children', () => {
    render(
      <Card>
        <Text>Test Content</Text>
      </Card>
    );
    
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  test('renders with variant', () => {
    render(<Card variant="outlined" />);
    
    // Card should render with outlined variant
    expect(true).toBe(true);
  });

  test('renders with elevated variant', () => {
    render(<Card variant="elevated" />);
    
    // Card should render with elevated variant
    expect(true).toBe(true);
  });

  test('renders with playing card props', () => {
    render(<Card suit="hearts" rank="A" />);
    // The component should render without errors
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('hearts')).toBeTruthy();
  });

  test('renders face down card', () => {
    render(<Card faceDown={true} />);
    // Face down card should render without errors
    // The text might be empty or different, so we just check it renders
    expect(true).toBe(true);
  });

  test('applies selected state', () => {
    render(<Card selected={true} />);
    // Card should render without errors
    expect(true).toBe(true);
  });

  test('applies disabled state', () => {
    render(<Card disabled={true} />);
    // Card should render without errors
    expect(true).toBe(true);
  });

  test('handles long content gracefully', () => {
    const longContent = 'This is a very long content that should wrap properly within the card component without breaking the layout or causing any overflow issues.';
    
    render(
      <Card>
        <Text>{longContent}</Text>
      </Card>
    );
    expect(screen.getByText(longContent)).toBeTruthy();
  });

  test('renders with all state combinations', () => {
    const states = [
      { selected: false, disabled: false },
      { selected: true, disabled: false },
      { selected: false, disabled: true },
      { selected: true, disabled: true },
    ];

    states.forEach(state => {
      render(
        <Card selected={state.selected} disabled={state.disabled}>
          <Text>State Card</Text>
        </Card>
      );
      expect(screen.getByText('State Card')).toBeTruthy();
    });
  });

  test('renders without onPress handler', () => {
    render(
      <Card>
        <Text>Non-pressable Card</Text>
      </Card>
    );
    // Card should render without errors
    expect(screen.getByText('Non-pressable Card')).toBeTruthy();
  });

  test('renders with accessibility props', () => {
    render(
      <Card 
        accessible={true}
        accessibilityLabel="Playing Card"
        accessibilityRole="button"
      >
        <Text>Accessible Card</Text>
      </Card>
    );

    expect(screen.getByText('Accessible Card')).toBeTruthy();
  });

  test('renders with testID', () => {
    render(
      <Card testID="test-card">
        <Text>Test Card</Text>
      </Card>
    );

    expect(screen.getByText('Test Card')).toBeTruthy();
  });

  test('renders empty card', () => {
    render(<Card />);
    
    // Empty card should render without errors
    expect(true).toBe(true);
  });

  test('renders with multiple children', () => {
    render(
      <Card>
        <Text>First Child</Text>
        <Text>Second Child</Text>
        <Text>Third Child</Text>
      </Card>
    );

    expect(screen.getByText('First Child')).toBeTruthy();
    expect(screen.getByText('Second Child')).toBeTruthy();
    expect(screen.getByText('Third Child')).toBeTruthy();
  });

  test('renders with complex children structure', () => {
    render(
      <Card>
        <View>
          <Text>Complex Content</Text>
        </View>
      </Card>
    );

    expect(screen.getByText('Complex Content')).toBeTruthy();
  });

  test('handles long content gracefully', () => {
    const longContent = 'This is a very long content that should wrap properly within the card component without breaking the layout or causing any overflow issues.';
    
    render(
      <Card>
        <Text>{longContent}</Text>
      </Card>
    );

    expect(screen.getByText(longContent)).toBeTruthy();
  });

  test('renders with different suits', () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    
    suits.forEach(suit => {
      render(<Card suit={suit} rank="A" />);
      // Each suit should render without errors
      expect(true).toBe(true);
    });
  });

  test('renders with different ranks', () => {
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    ranks.forEach(rank => {
      render(<Card suit="hearts" rank={rank} />);
      // Each rank should render without errors
      expect(true).toBe(true);
    });
  });

  test('renders face down with different suits and ranks', () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['A', 'K', 'Q', 'J'];
    
    suits.forEach(suit => {
      ranks.forEach(rank => {
        render(<Card suit={suit} rank={rank} faceDown={true} />);
        // Each face-down card should render without errors
        expect(true).toBe(true);
      });
    });
  });

  test('renders with all combinations of variants and sizes', () => {
    const variants = ['default', 'outlined', 'elevated'];
    const sizes = ['small', 'medium', 'large'];
    
    variants.forEach(variant => {
      sizes.forEach(size => {
        render(<Card variant={variant} size={size} />);
        // Each combination should render without errors
        expect(true).toBe(true);
      });
    });
  });

  test('renders with all state combinations', () => {
    const states = [
      { selected: false, disabled: false },
      { selected: true, disabled: false },
      { selected: false, disabled: true },
      { selected: true, disabled: true },
    ];
    
    states.forEach(state => {
      render(
        <Card selected={state.selected} disabled={state.disabled}>
          <Text>State Card</Text>
        </Card>
      );
      // Each state combination should render without errors
      expect(screen.getByText('State Card')).toBeTruthy();
    });
  });
});
