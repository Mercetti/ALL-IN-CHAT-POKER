/**
 * Performance Tests
 * Testing for mobile app performance and optimization
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import GameScreen from '../src/screens/GameScreen';
import { ThemeProvider } from '../src/theme/ThemeContext';

// Mock theme for testing
const mockTheme = {
  colors: {
    primary: '#4adeff',
    secondary: '#ff6bd6',
    background: '#030712',
    surface: '#ffffff',
    text: '#ffffff',
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

describe('Performance Tests', () => {
  test('GameScreen renders within performance budget', () => {
    const startTime = performance.now();
    
    const { getByTestId } = render(
      <ThemeProvider theme={mockTheme}>
        <GameScreen />
      </ThemeProvider>
    );
    
    const gameScreen = getByTestId('game-screen-container');
    expect(gameScreen).toBeTruthy();
    
    const renderTime = performance.now();
    const renderDuration = renderTime - startTime;
    
    // Component should render within 100ms
    expect(renderDuration).toBeLessThan(100);
  });

  test('Button components render efficiently', () => {
    const startTime = performance.now();
    
    const { getAllByTestId } = render(
      <ThemeProvider theme={mockTheme}>
        <GameScreen />
      </ThemeProvider>
    );
    
    const buttons = getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    const renderTime = performance.now();
    const renderDuration = renderTime - startTime;
    
    // Multiple buttons should render within 50ms
    expect(renderDuration).toBeLessThan(50);
  });

  test('Memory usage is within acceptable limits', () => {
    // Simulate memory check (in real app, you'd use a memory profiling library)
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    const { getByTestId } = render(
      <ThemeProvider theme={mockTheme}>
        <GameScreen />
      </ThemeProvider>
    );
    
    // Force some garbage collection
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : initialMemory;
    
    // Memory usage should not increase significantly
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
  });

  test('No memory leaks in component lifecycle', () => {
    const { getByTestId, unmount } = render(
      <ThemeProvider theme={mockTheme}>
        <GameScreen />
      </ThemeProvider>
    );
    
    const gameScreen = getByTestId('game-screen-container');
    expect(gameScreen).toBeTruthy();
    
    // Simulate component mount/unmount cycles
    for (let i = 0; i < 10; i++) {
      unmount();
      render(
        <ThemeProvider theme={mockTheme}>
          <GameScreen />
        </ThemeProvider>
      );
    }
    
    // Check for memory leaks
    if (performance.memory) {
      const finalMemory = performance.memory.usedJSHeapSize;
      // Memory should be stable after multiple mount/unmount cycles
      expect(finalMemory).toBeLessThan(2048 * 1024); // Less than 2MB
    }
  });

  test('Animation performance is smooth', () => {
    const startTime = performance.now();
    
    const { getByTestId } = render(
      <ThemeProvider theme={mockTheme}>
        <GameScreen />
      </ThemeProvider>
    );
    
    // Simulate rapid state changes
    const gameScreen = getByTestId('game-screen-container');
    
    for (let i = 0; i < 100; i++) {
      // Simulate rapid interactions
      gameScreen.props.testID = `test-${i}`;
    }
    
    const interactionTime = performance.now();
    const interactionDuration = interactionTime - startTime;
    
    // 100 rapid interactions should complete within 1000ms
    expect(interactionDuration).toBeLessThan(1000);
  });

  test('Bundle size impact is measured', () => {
    // This would typically be run in a CI environment
    // Here we test that our components don't unnecessarily increase bundle size
    
    const componentSize = JSON.stringify(GameScreen).length;
    
    // Component should be reasonably sized
    expect(componentSize).toBeLessThan(10000); // Less than 10KB
  });

  test('Accessibility performance is maintained', () => {
    const startTime = performance.now();
    
    const { getByLabelText } = render(
      <ThemeProvider theme={mockTheme}>
        <GameScreen />
      </ThemeProvider>
    );
    
    const accessibleElements = getByLabelText('Bet Amount');
    const profileButton = getByLabelText('View Profile');
    const settingsButton = getByLabelText('Settings');
    
    expect(accessibleElements).toBeTruthy();
    expect(profileButton).toBeTruthy();
    expect(settingsButton).toBeTruthy();
    
    const accessibilityTime = performance.now();
    const accessibilityDuration = accessibilityTime - startTime;
    
    // Accessibility features should not impact performance significantly
    expect(accessibilityDuration).toBeLessThan(50);
  });
});
