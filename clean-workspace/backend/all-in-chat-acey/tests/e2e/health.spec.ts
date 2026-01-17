import { test, expect } from '@playwright/test';

test.describe('Health Check E2E Tests', () => {
  test('should load health check page', async ({ page }) => {
    await page.goto('/health');
    
    // Check page title
    await expect(page).toHaveTitle(/Acey Control Center/);
    
    // Check health status
    const healthStatus = page.locator('[data-testid="health-status"]');
    await expect(healthStatus).toBeVisible();
    await expect(healthStatus).toContainText('healthy');
  });

  test('should display system metrics', async ({ page }) => {
    await page.goto('/health');
    
    // Check system metrics section
    const systemMetrics = page.locator('[data-testid="system-metrics"]');
    await expect(systemMetrics).toBeVisible();
    
    // Check individual metrics
    await expect(page.locator('[data-testid="memory-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="cpu-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="disk-usage"]')).toBeVisible();
  });

  test('should display service health', async ({ page }) => {
    await page.goto('/health');
    
    // Check service health section
    const serviceHealth = page.locator('[data-testid="service-health"]');
    await expect(serviceHealth).toBeVisible();
    
    // Check individual services
    await expect(page.locator('[data-testid="api-service"]')).toBeVisible();
    await expect(page.locator('[data-testid="database-service"]')).toBeVisible();
    await expect(page.locator('[data-testid="redis-service"]')).toBeVisible();
  });

  test('should refresh health status', async ({ page }) => {
    await page.goto('/health');
    
    // Click refresh button
    const refreshButton = page.locator('[data-testid="refresh-health"]');
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();
    
    // Check that status updates
    const healthStatus = page.locator('[data-testid="health-status"]');
    await expect(healthStatus).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page, context }) => {
    // Mock API error
    await context.route('/api/health', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Service unavailable',
            timestamp: new Date().toISOString(),
          },
        }),
      });
    });
    
    await page.goto('/health');
    
    // Check error handling
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Service unavailable');
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/health');
    
    // Check mobile layout
    const healthStatus = page.locator('[data-testid="health-status"]');
    await expect(healthStatus).toBeVisible();
    
    // Check responsive design
    const metricsContainer = page.locator('[data-testid="metrics-container"]');
    await expect(metricsContainer).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/health');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    
    // Check focus on interactive elements
    const refreshButton = page.locator('[data-testid="refresh-health"]');
    await expect(refreshButton).toBeFocused();
    
    // Press Enter to click
    await page.keyboard.press('Enter');
    
    // Verify action occurred
    const healthStatus = page.locator('[data-testid="health-status"]');
    await expect(healthStatus).toBeVisible();
  });
});
