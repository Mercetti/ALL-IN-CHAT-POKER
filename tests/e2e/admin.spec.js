/**
 * Admin Panel E2E Tests
 * Tests the administrative interface functionality
 */

/* global document, sessionStorage, localStorage, require */

const { test, expect } = require('@playwright/test');

test.describe('Admin Authentication', () => {
  test('should require admin login', async ({ page }) => {
    await page.goto('/admin');
    
    // Should redirect to admin login
    await expect(page).toHaveURL(/admin\/login/);
    
    // Check login form
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with admin credentials', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Fill admin credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'adminpass');
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/admin\/dashboard/);
  });

  test('should reject non-admin users', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Try regular user credentials
    await page.fill('input[name="username"]', 'user');
    await page.fill('input[name="password"]', 'userpass');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('.error-message')).toContainText('Admin access required');
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'adminpass');
    await page.click('button[type="submit"]');
    await page.waitForURL(/admin\/dashboard/);
  });

  test('should display dashboard correctly', async ({ page }) => {
    // Check dashboard elements
    await expect(page.locator('.admin-header')).toBeVisible();
    await expect(page.locator('.dashboard-stats')).toBeVisible();
    await expect(page.locator('.navigation-menu')).toBeVisible();
    
    // Check stats cards
    await expect(page.locator('.stat-card')).toHaveCount.greaterThan(0);
  });

  test('should show system statistics', async ({ page }) => {
    // Check various statistics
    await expect(page.locator('.total-users')).toBeVisible();
    await expect(page.locator('.active-games')).toBeVisible();
    await expect(page.locator('.total-revenue')).toBeVisible();
    await expect(page.locator('.server-uptime')).toBeVisible();
  });

  test('should navigate between admin sections', async ({ page }) => {
    // Test navigation
    await page.click('[data-nav="users"]');
    await expect(page).toHaveURL(/admin\/users/);
    
    await page.click('[data-nav="games"]');
    await expect(page).toHaveURL(/admin\/games/);
    
    await page.click('[data-nav="settings"]');
    await expect(page).toHaveURL(/admin\/settings/);
  });

  test('should handle user management', async ({ page }) => {
    await page.click('[data-nav="users"]');
    
    // Check user list
    await expect(page.locator('.user-table')).toBeVisible();
    await expect(page.locator('.user-row')).toHaveCount.greaterThan(0);
    
    // Test user search
    await page.fill('.user-search', 'test');
    await page.waitForTimeout(500);
    
    // Check search results
    const searchResults = page.locator('.user-row');
    const resultCount = await searchResults.count();
    expect(resultCount).toBeGreaterThanOrEqual(0);
    
    // Test user actions
    if (resultCount > 0) {
      const firstUser = searchResults.first();
      await firstUser.click('.user-actions button');
      await expect(page.locator('.user-actions-menu')).toBeVisible();
    }
  });

  test('should handle game management', async ({ page }) => {
    await page.click('[data-nav="games"]');
    
    // Check game list
    await expect(page.locator('.game-table')).toBeVisible();
    await expect(page.locator('.game-row')).toHaveCount.greaterThanOrEqual(0);
    
    // Test game filtering
    await page.selectOption('.game-filter', 'active');
    await page.waitForTimeout(500);
    
    // Check filtered results
    const activeGames = page.locator('.game-row.active');
    expect(await activeGames.count()).toBeGreaterThanOrEqual(0);
    
    // Test game actions
    const firstGame = page.locator('.game-row').first();
    await firstGame.click('.game-actions button');
    await expect(page.locator('.game-actions-menu')).toBeVisible();
  });

  test('should handle system settings', async ({ page }) => {
    await page.click('[data-nav="settings"]');
    
    // Check settings sections
    await expect(page.locator('.settings-section')).toHaveCount.greaterThan(0);
    
    // Test setting changes
    await page.click('[data-setting="maintenance"]');
    await page.check('.maintenance-toggle');
    
    // Save settings
    await page.click('.save-settings');
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should display real-time updates', async ({ page }) => {
    // Monitor WebSocket connections for real-time updates
    const wsMessages = [];
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        wsMessages.push(event.payload.toString());
      });
    });
    
    // Wait for real-time data
    await page.waitForTimeout(3000);
    
    // Should receive real-time updates
    expect(wsMessages.length).toBeGreaterThan(0);
  });

  test('should handle admin logging', async ({ page }) => {
    await page.click('[data-nav="logs"]');
    
    // Check log display
    await expect(page.locator('.log-container')).toBeVisible();
    await expect(page.locator('.log-entry')).toHaveCount.greaterThan(0);
    
    // Test log filtering
    await page.selectOption('.log-level', 'error');
    await page.waitForTimeout(500);
    
    // Check filtered logs
    const errorLogs = page.locator('.log-entry.error');
    expect(await errorLogs.count()).toBeGreaterThanOrEqual(0);
    
    // Test log search
    await page.fill('.log-search', 'login');
    await page.waitForTimeout(500);
    
    // Check search results
    const searchResults = page.locator('.log-entry');
    expect(await searchResults.count()).toBeGreaterThanOrEqual(0);
  });

  test('should handle performance monitoring', async ({ page }) => {
    await page.click('[data-nav="performance"]');
    
    // Check performance metrics
    await expect(page.locator('.performance-chart')).toBeVisible();
    await expect(page.locator('.metric-card')).toHaveCount.greaterThan(0);
    
    // Check CPU usage
    await expect(page.locator('.cpu-usage')).toBeVisible();
    
    // Check memory usage
    await expect(page.locator('.memory-usage')).toBeVisible();
    
    // Check response times
    await expect(page.locator('.response-times')).toBeVisible();
  });

  test('should handle backup and restore', async ({ page }) => {
    await page.click('[data-nav="backup"]');
    
    // Check backup interface
    await expect(page.locator('.backup-controls')).toBeVisible();
    await expect(page.locator('.backup-history')).toBeVisible();
    
    // Test backup creation
    await page.click('.create-backup');
    await expect(page.locator('.backup-progress')).toBeVisible();
    
    // Wait for backup completion
    await page.waitForSelector('.backup-complete', { timeout: 30000 });
    await expect(page.locator('.backup-complete')).toBeVisible();
    
    // Test restore functionality
    const backupEntry = page.locator('.backup-entry').first();
    if (await backupEntry.count() > 0) {
      await backupEntry.click('.restore-backup');
      await expect(page.locator('.restore-confirmation')).toBeVisible();
    }
  });

  test('should handle API key management', async ({ page }) => {
    await page.click('[data-nav="api"]');
    
    // Check API key interface
    await expect(page.locator('.api-keys-list')).toBeVisible();
    await expect(page.locator('.create-api-key')).toBeVisible();
    
    // Test API key creation
    await page.click('.create-api-key');
    await page.fill('.api-key-name', 'Test Key');
    await page.selectOption('.api-key-permissions', 'read');
    await page.click('.generate-key');
    
    // Check generated key
    await expect(page.locator('.generated-key')).toBeVisible();
    await expect(page.locator('.api-key-value')).toBeVisible();
    
    // Copy key functionality
    await page.click('.copy-key');
    await expect(page.locator('.copy-success')).toBeVisible();
  });

  test('should handle theme customization', async ({ page }) => {
    await page.click('[data-nav="themes"]');
    
    // Check theme interface
    await expect(page.locator('.theme-selector')).toBeVisible();
    await expect(page.locator('.theme-preview')).toBeVisible();
    
    // Test theme selection
    await page.click('.theme-option.dark');
    await expect(page.locator('.theme-preview')).toHaveClass(/dark/);
    
    // Test custom colors
    await page.fill('.primary-color', '#ff0000');
    await expect(page.locator('.theme-preview')).toHaveCSS(/color/, /rgb\(255, 0, 0\)/);
    
    // Save theme
    await page.click('.save-theme');
    await expect(page.locator('.theme-saved')).toBeVisible();
  });

  test('should handle notification settings', async ({ page }) => {
    await page.click('[data-nav="notifications"]');
    
    // Check notification interface
    await expect(page.locator('.notification-settings')).toBeVisible();
    await expect(page.locator('.notification-preview')).toBeVisible();
    
    // Test notification toggles
    await page.check('.email-notifications');
    await page.check('.push-notifications');
    
    // Test notification templates
    await page.click('.edit-template');
    await expect(page.locator('.template-editor')).toBeVisible();
    
    // Save settings
    await page.click('.save-notifications');
    await expect(page.locator('.notifications-saved')).toBeVisible();
  });

  test('should handle security settings', async ({ page }) => {
    await page.click('[data-nav="security"]');
    
    // Check security interface
    await expect(page.locator('.security-settings')).toBeVisible();
    
    // Test password policy
    await page.fill('.min-password-length', '8');
    await page.check('.require-special-chars');
    
    // Test session settings
    await page.fill('.session-timeout', '30');
    
    // Test two-factor auth
    await page.check('.enable-2fa');
    
    // Save security settings
    await page.click('.save-security');
    await expect(page.locator('.security-saved')).toBeVisible();
  });

  test('should handle admin logout', async ({ page }) => {
    // Click logout
    await page.click('.admin-logout');
    
    // Should redirect to admin login
    await expect(page).toHaveURL(/admin\/login/);
    
    // Verify session is cleared
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/admin\/login/);
  });
});

test.describe('Admin Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'adminpass');
    await page.click('button[type="submit"]');
    await page.waitForURL(/admin\/dashboard/);
  });

  test('should load dashboard quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/admin/dashboard');
    await page.waitForSelector('.dashboard-stats');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
  });

  test('should handle large data sets efficiently', async ({ page }) => {
    await page.click('[data-nav="users"]');
    
    // Monitor performance with large user list
    const startTime = Date.now();
    
    // Scroll through large list
    await page.evaluate(() => {
      const container = document.querySelector('.user-table');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
    
    const scrollTime = Date.now() - startTime;
    expect(scrollTime).toBeLessThan(1000); // Should handle scrolling efficiently
  });

  test('should maintain responsiveness during operations', async ({ page }) => {
    // Test responsiveness during heavy operations
    await page.click('[data-nav="performance"]');
    
    // Monitor UI responsiveness
    const startTime = Date.now();
    
    // Perform multiple operations
    await page.click('.refresh-metrics');
    await page.click('.export-data');
    await page.click('.generate-report');
    
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(5000); // Should remain responsive
  });
});

test.describe('Admin Security', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'adminpass');
    await page.click('button[type="submit"]');
    await page.waitForURL(/admin\/dashboard/);
  });

  test('should enforce session timeout', async ({ page }) => {
    // Simulate session timeout
    await page.evaluate(() => {
      // Clear session storage to simulate timeout
      sessionStorage.clear();
      localStorage.clear();
    });
    
    // Try to access admin page
    await page.goto('/admin/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/admin\/login/);
  });

  test('should prevent unauthorized access', async ({ page }) => {
    // Try to access admin endpoints directly
    const adminEndpoints = [
      '/admin/api/users',
      '/admin/api/games',
      '/admin/api/settings'
    ];
    
    for (const endpoint of adminEndpoints) {
      await page.goto(endpoint);
      // Should return 401 or redirect to login
      const response = await page.response();
      expect(response?.status()).toBe(401);
    }
  });

  test('should handle CSRF protection', async ({ page }) => {
    await page.click('[data-nav="settings"]');
    
    // Try to submit form without CSRF token
    await page.evaluate(() => {
      const form = document.querySelector('.settings-form');
      if (form) {
        // Remove CSRF token
        const csrfInput = form.querySelector('input[name="_csrf"]');
        if (csrfInput) csrfInput.remove();
        
        // Try to submit
        form.submit();
      }
    });
    
    // Should show CSRF error
    await expect(page.locator('.csrf-error')).toBeVisible();
  });
});
