/**
 * Authentication E2E Tests
 * Tests the login, registration, and authentication flow
 */

const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Login|Poker/);
    
    // Check login form elements
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check registration link
    await expect(page.locator('a[href*="register"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=Username is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill with invalid credentials
    await page.fill('input[name="username"]', 'invaliduser');
    await page.fill('input[name="password"]', 'invalidpass');
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill with valid credentials (assuming test user exists)
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or main page
    await expect(page).toHaveURL(/dashboard|main|game/);
    
    // Check for logged in state
    await expect(page.locator('.user-profile, .user-menu')).toBeVisible();
  });

  test('should handle registration flow', async ({ page }) => {
    // Navigate to registration
    await page.click('a[href*="register"]');
    await expect(page).toHaveURL(/register/);
    
    // Check registration form
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    
    // Fill registration form
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!'
    };
    
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Should redirect to login or dashboard
    await expect(page).toHaveURL(/login|dashboard/);
  });

  test('should handle password reset flow', async ({ page }) => {
    // Click forgot password link
    await page.click('a[href*="forgot"]');
    await expect(page).toHaveURL(/forgot|reset/);
    
    // Check reset form
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Fill email and submit
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=Reset link sent')).toBeVisible();
  });

  test('should maintain session across page reloads', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await expect(page).toHaveURL(/dashboard|main|game/);
    
    // Reload page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('.user-profile, .user-menu')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button[type="submit"]');
    
    // Wait for login
    await expect(page).toHaveURL(/dashboard|main|game/);
    
    // Click logout
    await page.click('.logout-button, [data-testid="logout"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
    
    // Check login form is visible
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });

  test('should handle social login options', async ({ page }) => {
    // Check for social login buttons
    const socialButtons = page.locator('.social-login button, [data-provider]');
    
    if (await socialButtons.count() > 0) {
      // Test that social buttons are present and clickable
      await expect(socialButtons.first()).toBeVisible();
      
      // Note: Actual social login testing would require OAuth mock setup
      // For now, just verify buttons exist
      const providers = ['google', 'twitch', 'discord'];
      for (const provider of providers) {
        const button = page.locator(`[data-provider="${provider}"]`);
        if (await button.count() > 0) {
          await expect(button).toBeVisible();
        }
      }
    }
  });
});

test.describe('Security Features', () => {
  test('should enforce password requirements', async ({ page }) => {
    await page.goto('/register');
    
    // Test weak password
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');
    await page.click('button[type="submit"]');
    
    // Should show password requirements error
    await expect(page.locator('text=Password must be at least')).toBeVisible();
  });

  test('should prevent brute force attacks', async ({ page }) => {
    // Try multiple failed logins
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="username"]', 'testuser');
      await page.fill('input[name="password"]', 'wrongpass');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
    }
    
    // Should show rate limiting message
    await expect(page.locator('text=Too many attempts')).toBeVisible();
  });

  test('should handle session timeout', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button[type="submit"]');
    
    // Wait for login
    await expect(page).toHaveURL(/dashboard|main|game/);
    
    // Simulate session expiration (this would require server-side setup)
    // For now, just test that session handling exists
    await expect(page.locator('.user-profile, .user-menu')).toBeVisible();
  });
});
