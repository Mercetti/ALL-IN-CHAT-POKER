/**
 * E2E Test Helpers
 * Common utilities and helper functions for Playwright E2E tests
 */

class TestHelpers {
  constructor(page) {
    this.page = page;
  }

  /**
   * Login with credentials
   */
  async login(username = 'testuser', password = 'testpass') {
    await this.page.goto('/login');
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(/dashboard|main|game/);
  }

  /**
   * Login as admin
   */
  async loginAsAdmin(username = 'admin', password = 'adminpass') {
    await this.page.goto('/admin/login');
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(/admin\/dashboard/);
  }

  /**
   * Wait for element to be visible with timeout
   */
  async waitForElement(selector, timeout = 10000) {
    await this.page.waitForSelector(selector, { 
      state: 'visible', 
      timeout 
    });
    return this.page.locator(selector);
  }

  /**
   * Wait for element to be hidden
   */
  async waitForElementHidden(selector, timeout = 10000) {
    await this.page.waitForSelector(selector, { 
      state: 'hidden', 
      timeout 
    });
  }

  /**
   * Fill form with data
   */
  async fillForm(formData) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`input[name="${field}"], textarea[name="${field}"]`, value);
    }
  }

  /**
   * Select dropdown option
   */
  async selectOption(selector, value) {
    await this.page.selectOption(selector, value);
  }

  /**
   * Check checkbox
   */
  async checkCheckbox(selector) {
    await this.page.check(selector);
  }

  /**
   * Uncheck checkbox
   */
  async uncheckCheckbox(selector) {
    await this.page.uncheck(selector);
  }

  /**
   * Click button by text or selector
   */
  async clickButton(textOrSelector) {
    const selector = textOrSelector.includes(' ') 
      ? `button:has-text("${textOrSelector}")`
      : textOrSelector;
    
    await this.page.click(selector);
  }

  /**
   * Get text content of element
   */
  async getText(selector) {
    return await this.page.locator(selector).textContent();
  }

  /**
   * Get element count
   */
  async getCount(selector) {
    return await this.page.locator(selector).count();
  }

  /**
   * Check if element exists
   */
  async exists(selector) {
    return await this.page.locator(selector).count() > 0;
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector) {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(urlPattern) {
    await this.page.waitForURL(urlPattern);
  }

  /**
   * Take screenshot
   */
  async screenshot(path) {
    await this.page.screenshot({ path, fullPage: true });
  }

  /**
   * Mock API response
   */
  async mockAPI(url, response) {
    await this.page.route(url, route => {
      route.fulfill(response);
    });
  }

  /**
   * Mock WebSocket
   */
  async mockWebSocket() {
    // Mock WebSocket for testing
    await this.page.addInitScript(() => {
      window.WebSocket = class MockWebSocket {
        constructor(url) {
          this.url = url;
          setTimeout(() => {
            this.onopen && this.onopen();
          }, 100);
        }
        
        send(data) {
          // Mock send
        }
        
        close() {
          // Mock close
        }
      };
    });
  }

  /**
   * Simulate keyboard input
   */
  async type(selector, text, options = {}) {
    await this.page.fill(selector, '');
    await this.page.type(selector, text, options);
  }

  /**
   * Simulate mouse hover
   */
  async hover(selector) {
    await this.page.hover(selector);
  }

  /**
   * Simulate drag and drop
   */
  async dragAndDrop(source, target) {
    await this.page.dragAndDrop(source, target);
  }

  /**
   * Upload file
   */
  async uploadFile(selector, filePath) {
    await this.page.setInputFiles(selector, filePath);
  }

  /**
   * Wait for and handle modal
   */
  async handleModal(action = 'accept') {
    await this.page.waitForSelector('.modal, .dialog', { state: 'visible' });
    
    if (action === 'accept') {
      await this.page.click('.modal .btn-primary, .dialog .accept');
    } else if (action === 'cancel') {
      await this.page.click('.modal .btn-secondary, .dialog .cancel');
    }
    
    await this.waitForElementHidden('.modal, .dialog');
  }

  /**
   * Wait for and handle notification
   */
  async waitForNotification(type = 'success') {
    const notification = await this.waitForElement(`.notification.${type}, .alert.${type}`);
    const text = await notification.textContent();
    
    // Auto-dismiss notification
    await this.page.waitForTimeout(3000);
    await this.waitForElementHidden(`.notification.${type}, .alert.${type}`);
    
    return text;
  }

  /**
   * Check accessibility
   */
  async checkAccessibility() {
    // Basic accessibility checks
    const issues = await this.page.evaluate(() => {
      const issues = [];
      
      // Check for missing alt text
      const images = document.querySelectorAll('img:not([alt])');
      if (images.length > 0) {
        issues.push(`${images.length} images missing alt text`);
      }
      
      // Check for missing labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
      if (inputs.length > 0) {
        issues.push(`${inputs.length} inputs missing labels`);
      }
      
      // Check for proper heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings.length === 0) {
        issues.push('No headings found');
      }
      
      return issues;
    });
    
    return issues;
  }

  /**
   * Measure performance
   */
  async measurePerformance(action) {
    const startTime = Date.now();
    
    // Get performance metrics before
    const beforeMetrics = await this.page.evaluate(() => {
      return {
        memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
        timing: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 0
      };
    });
    
    // Execute action
    await action();
    
    // Wait for completion
    await this.page.waitForTimeout(1000);
    
    // Get performance metrics after
    const afterMetrics = await this.page.evaluate(() => {
      return {
        memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
        timing: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 0
      };
    });
    
    return {
      duration: Date.now() - startTime,
      memoryDelta: afterMetrics.memory - beforeMetrics.memory,
      timingDelta: afterMetrics.timing - beforeMetrics.timing
    };
  }

  /**
   * Generate test data
   */
  generateTestData(type) {
    const timestamp = Date.now();
    
    switch (type) {
      case 'user':
        return {
          username: `testuser_${timestamp}`,
          email: `test_${timestamp}@example.com`,
          password: 'TestPassword123!',
          displayName: `Test User ${timestamp}`
        };
        
      case 'game':
        return {
          name: `Test Game ${timestamp}`,
          type: 'texas-holdem',
          maxPlayers: 6,
          buyIn: 1000,
          blinds: { small: 5, big: 10 }
        };
        
      case 'tournament':
        return {
          name: `Test Tournament ${timestamp}`,
          type: 'sit-n-go',
          maxPlayers: 9,
          buyIn: 5000,
          startTime: new Date(Date.now() + 3600000).toISOString()
        };
        
      default:
        return { id: timestamp, name: `Test ${type}` };
    }
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(type, id) {
    // Implementation depends on your API
    await this.page.request.delete(`/api/test/${type}/${id}`);
  }

  /**
   * Set viewport size
   */
  async setViewport(width, height) {
    await this.page.setViewportSize({ width, height });
  }

  /**
   * Set mobile viewport
   */
  async setMobileViewport() {
    await this.setViewport(375, 667);
  }

  /**
   * Set tablet viewport
   */
  async setTabletViewport() {
    await this.setViewport(768, 1024);
  }

  /**
   * Set desktop viewport
   */
  async setDesktopViewport() {
    await this.setViewport(1920, 1080);
  }

  /**
   * Simulate network conditions
   */
  async setNetworkConditions(condition) {
    const context = this.page.context();
    
    switch (condition) {
      case 'slow':
        await context.setOffline(false);
        // Note: Playwright doesn't directly support throttling
        // This would require additional setup
        break;
        
      case 'offline':
        await context.setOffline(true);
        break;
        
      case 'online':
        await context.setOffline(false);
        break;
    }
  }

  /**
   * Simulate geolocation
   */
  async setGeolocation(latitude, longitude) {
    const context = this.page.context();
    await context.setGeolocation({ latitude, longitude });
    await context.setPermissions(['geolocation']);
  }

  /**
   * Simulate device orientation
   */
  async setDeviceOrientation(alpha, beta, gamma) {
    await this.page.evaluate(({ alpha, beta, gamma }) => {
      window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {
        alpha, beta, gamma
      }));
    }, { alpha, beta, gamma });
  }

  /**
   * Wait for and handle loading states
   */
  async waitForLoading() {
    await this.page.waitForSelector('.loading, .spinner', { state: 'hidden', timeout: 30000 });
  }

  /**
   * Check for and handle errors
   */
  async checkForErrors() {
    const errors = [];
    
    // Check for error messages
    const errorElements = await this.page.locator('.error, .alert-danger, .error-message').all();
    for (const element of errorElements) {
      const text = await element.textContent();
      if (text && text.trim()) {
        errors.push(text.trim());
      }
    }
    
    // Check console errors
    const consoleErrors = await this.page.evaluate(() => {
      return window.consoleErrors || [];
    });
    
    return [...errors, ...consoleErrors];
  }

  /**
   * Validate form
   */
  async validateForm(selector) {
    const form = await this.page.locator(selector);
    
    // Check required fields
    const requiredFields = await form.locator('[required]').all();
    const validationErrors = [];
    
    for (const field of requiredFields) {
      const value = await field.inputValue();
      if (!value.trim()) {
        const name = await field.getAttribute('name');
        validationErrors.push(`${name} is required`);
      }
    }
    
    return validationErrors;
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    return await this.page.evaluate(() => {
      return window.currentUser || null;
    });
  }

  /**
   * Set local storage
   */
  async setLocalStorage(key, value) {
    await this.page.evaluate(({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    }, { key, value });
  }

  /**
   * Get local storage
   */
  async getLocalStorage(key) {
    return await this.page.evaluate(({ key }) => {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }, { key });
  }

  /**
   * Clear local storage
   */
  async clearLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  /**
   * Set session storage
   */
  async setSessionStorage(key, value) {
    await this.page.evaluate(({ key, value }) => {
      sessionStorage.setItem(key, JSON.stringify(value));
    }, { key, value });
  }

  /**
   * Get session storage
   */
  async getSessionStorage(key) {
    return await this.page.evaluate(({ key }) => {
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }, { key });
  }

  /**
   * Clear session storage
   */
  async clearSessionStorage() {
    await this.page.evaluate(() => {
      sessionStorage.clear();
    });
  }
}

module.exports = TestHelpers;
