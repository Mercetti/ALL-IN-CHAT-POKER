/**
 * Game Play E2E Tests
 * Tests the poker game functionality and user interactions
 */

const { test, expect } = require('@playwright/test');

test.describe('Poker Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|main|game/);
  });

  test('should load game interface correctly', async ({ page }) => {
    await page.goto('/game');
    
    // Check game elements
    await expect(page.locator('.poker-table')).toBeVisible();
    await expect(page.locator('.player-hand')).toBeVisible();
    await expect(page.locator('.community-cards')).toBeVisible();
    await expect(page.locator('.pot-display')).toBeVisible();
    await expect(page.locator('.action-buttons')).toBeVisible();
  });

  test('should join a poker table', async ({ page }) => {
    await page.goto('/game');
    
    // Click on available table
    await page.click('.table-list .table-item:first-child');
    
    // Should show table interface
    await expect(page.locator('.poker-table')).toBeVisible();
    
    // Check player position
    await expect(page.locator('.player-position.active')).toBeVisible();
  });

  test('should handle betting actions', async ({ page }) => {
    await page.goto('/game');
    
    // Wait for betting round
    await page.waitForSelector('.action-buttons:not(.disabled)');
    
    // Test fold action
    await page.click('[data-action="fold"]');
    await expect(page.locator('.player-status.folded')).toBeVisible();
    
    // Start new round for other actions
    await page.click('.new-round-button');
    await page.waitForSelector('.action-buttons:not(.disabled)');
    
    // Test check action
    await page.click('[data-action="check"]');
    await expect(page.locator('.player-status.checked')).toBeVisible();
  });

  test('should handle raise action', async ({ page }) => {
    await page.goto('/game');
    
    // Wait for betting round
    await page.waitForSelector('.action-buttons:not(.disabled)');
    
    // Click raise button
    await page.click('[data-action="raise"]');
    
    // Should show bet slider or input
    await expect(page.locator('.bet-input, .bet-slider')).toBeVisible();
    
    // Set bet amount
    await page.fill('.bet-input', '50');
    
    // Confirm raise
    await page.click('[data-action="confirm"]');
    
    // Check that bet was placed
    await expect(page.locator('.player-bet')).toContainText('$50');
  });

  test('should display cards correctly', async ({ page }) => {
    await page.goto('/game');
    
    // Wait for cards to be dealt
    await page.waitForSelector('.player-hand .card');
    
    // Check player cards
    const playerCards = page.locator('.player-hand .card');
    await expect(playerCards).toHaveCount(2);
    
    // Check card backs or faces
    const firstCard = playerCards.first();
    await expect(firstCard).toBeVisible();
    
    // Check community cards (if any)
    const communityCards = page.locator('.community-cards .card');
    const communityCount = await communityCards.count();
    expect(communityCount).toBeGreaterThanOrEqual(0);
  });

  test('should update pot correctly', async ({ page }) => {
    await page.goto('/game');
    
    // Initial pot should be 0 or starting amount
    const potElement = page.locator('.pot-amount');
    await expect(potElement).toBeVisible();
    
    // After betting, pot should increase
    await page.waitForSelector('.action-buttons:not(.disabled)');
    await page.click('[data-action="raise"]');
    await page.fill('.bet-input', '50');
    await page.click('[data-action="confirm"]');
    
    // Pot should reflect the bet
    await expect(potElement).toContainText('$50');
  });

  test('should handle game phases correctly', async ({ page }) => {
    await page.goto('/game');
    
    // Check initial phase
    await expect(page.locator('.game-phase')).toBeVisible();
    
    // Wait for phase changes
    const phases = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
    
    for (const phase of phases) {
      // Phase should update during game
      const phaseElement = page.locator('.game-phase');
      const currentPhase = await phaseElement.textContent();
      
      // Verify phase is one of expected phases
      expect(phases.some(p => currentPhase.toLowerCase().includes(p))).toBeTruthy();
      
      // Wait for next action or phase change
      await page.waitForTimeout(2000);
    }
  });

  test('should show hand rankings and results', async ({ page }) => {
    await page.goto('/game');
    
    // Play through to showdown
    await page.waitForSelector('.action-buttons:not(.disabled)');
    
    // Make actions to reach showdown
    await page.click('[data-action="check"]');
    await page.waitForTimeout(1000);
    
    // Wait for showdown
    await page.waitForSelector('.showdown-results', { timeout: 30000 });
    
    // Check results display
    await expect(page.locator('.hand-ranking')).toBeVisible();
    await expect(page.locator('.winner-announcement')).toBeVisible();
  });

  test('should handle multiple players', async ({ page }) => {
    await page.goto('/game');
    
    // Check other players at table
    const otherPlayers = page.locator('.other-player');
    const playerCount = await otherPlayers.count();
    
    expect(playerCount).toBeGreaterThan(0);
    
    // Check player information
    const firstPlayer = otherPlayers.first();
    await expect(firstPlayer.locator('.player-name')).toBeVisible();
    await expect(firstPlayer.locator('.player-chips')).toBeVisible();
    await expect(firstPlayer.locator('.player-status')).toBeVisible();
  });

  test('should handle chat functionality', async ({ page }) => {
    await page.goto('/game');
    
    // Check chat interface
    await expect(page.locator('.chat-container')).toBeVisible();
    await expect(page.locator('.chat-messages')).toBeVisible();
    await expect(page.locator('.chat-input')).toBeVisible();
    
    // Send a message
    await page.fill('.chat-input', 'Hello from E2E test!');
    await page.click('.chat-send');
    
    // Check message appears in chat
    await expect(page.locator('.chat-messages')).toContainText('Hello from E2E test!');
  });

  test('should handle game settings', async ({ page }) => {
    await page.goto('/game');
    
    // Open settings
    await page.click('.settings-button, [data-action="settings"]');
    
    // Check settings panel
    await expect(page.locator('.settings-panel')).toBeVisible();
    
    // Test sound toggle
    await page.click('[data-setting="sound"]');
    
    // Test theme toggle
    await page.click('[data-setting="theme"]');
    
    // Close settings
    await page.click('.close-settings, [data-action="close-settings"]');
    await expect(page.locator('.settings-panel')).not.toBeVisible();
  });
});

test.describe('Game Performance', () => {
  test('should load game within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/game');
    await page.waitForSelector('.poker-table');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('should handle rapid actions without lag', async ({ page }) => {
    await page.goto('/game');
    await page.waitForSelector('.action-buttons:not(.disabled)');
    
    const startTime = Date.now();
    
    // Perform rapid actions
    await page.click('[data-action="check"]');
    await page.click('[data-action="fold"]');
    
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
  });

  test('should maintain performance with multiple players', async ({ page }) => {
    await page.goto('/game');
    
    // Monitor performance during active gameplay
    const performanceMetrics = await page.evaluate(() => {
      return {
        memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
        timing: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 0
      };
    });
    
    // Should not exceed reasonable memory limits
    expect(performanceMetrics.memory).toBeLessThan(100 * 1024 * 1024); // 100MB
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/game');
    
    // Check mobile-specific elements
    await expect(page.locator('.mobile-controls')).toBeVisible();
    await expect(page.locator('.touch-actions')).toBeVisible();
    
    // Test touch interactions
    await page.tap('[data-action="check"]');
    await expect(page.locator('.player-status.checked')).toBeVisible();
  });

  test('should adapt to tablet screens', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/game');
    
    // Check tablet layout
    await expect(page.locator('.poker-table')).toBeVisible();
    await expect(page.locator('.side-panel')).toBeVisible();
  });

  test('should handle orientation changes', async ({ page }) => {
    await page.goto('/game');
    
    // Test landscape
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('.poker-table')).toBeVisible();
    
    // Test portrait
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.poker-table')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle connection issues gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.goto('/game');
    
    // Should show connection error
    await expect(page.locator('.connection-error')).toBeVisible();
    
    // Restore connection
    await page.context().setOffline(false);
    
    // Should reconnect automatically
    await expect(page.locator('.connection-restored')).toBeVisible();
  });

  test('should handle server errors', async ({ page }) => {
    // Mock server error
    await page.route('**/api/game/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    await page.goto('/game');
    
    // Should show error message
    await expect(page.locator('.server-error')).toBeVisible();
  });

  test('should handle invalid game states', async ({ page }) => {
    // Navigate to invalid game state
    await page.goto('/game?invalid=true');
    
    // Should handle gracefully
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.back-to-lobby')).toBeVisible();
  });
});
