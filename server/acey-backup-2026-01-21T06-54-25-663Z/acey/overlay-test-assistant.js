/**
 * Acey Overlay Testing Assistant
 * Helps Acey generate and maintain Playwright tests for the overlay system
 */

class AceyOverlayTester {
  constructor() {
    this.overlayElements = new Map();
    this.testPatterns = new Map();
    this.initializeTestPatterns();
  }

  /**
   * Initialize common test patterns for overlay elements
   */
  initializeTestPatterns() {
    this.testPatterns.set('visibility', (selector) => `
  // Check ${selector} is visible
  await expect(page.locator('${selector}')).toBeVisible();`);

    this.testPatterns.set('clickable', (selector) => `
  // Check ${selector} is clickable
  const element = page.locator('${selector}');
  await expect(element).toBeVisible();
  await expect(element).toBeEnabled();`);

    this.testPatterns.set('text-content', (selector, expectedText) => `
  // Check ${selector} contains text
  await expect(page.locator('${selector}')).toContainText('${expectedText}');`);

    this.testPatterns.set('attribute', (selector, attribute, value) => `
  // Check ${selector} has ${attribute}="${value}"
  await expect(page.locator('${selector}')).toHaveAttribute('${attribute}', '${value}');`);
  }

  /**
   * Analyze overlay HTML and generate test cases
   */
  async analyzeOverlay(overlayHTML) {
    const elements = this.extractElements(overlayHTML);
    const testCases = this.generateTestCases(elements);
    
    return {
      elements,
      testCases,
      recommendations: this.getRecommendations(elements)
    };
  }

  /**
   * Extract testable elements from HTML
   */
  extractElements(html) {
    const elements = [];
    
    // Common overlay selectors to test
    const selectors = [
      '.overlay-container',
      '.chat-overlay',
      '.brand-logo',
      '.brand-name',
      '.stats-overlay',
      '.card-deal-animation',
      '.bet-animation',
      '.chip-animation',
      '.win-animation',
      '.community-cards',
      '.winner-announcement',
      '.settings-button',
      '.overlay-settings',
      '.seat',
      '.seat-name',
      '.pot-amount'
    ];

    selectors.forEach(selector => {
      if (html.includes(selector.replace('.', ''))) {
        elements.push({
          selector,
          type: this.getElementType(selector),
          priority: this.getPriority(selector)
        });
      }
    });

    return elements.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get element type for appropriate testing
   */
  getElementType(selector) {
    if (selector.includes('button')) return 'clickable';
    if (selector.includes('overlay')) return 'visibility';
    if (selector.includes('animation')) return 'visibility';
    if (selector.includes('card')) return 'visibility';
    if (selector.includes('seat')) return 'visibility';
    return 'visibility';
  }

  /**
   * Get priority for element testing
   */
  getPriority(selector) {
    const priorities = {
      '.overlay-container': 10,
      '.chat-overlay': 9,
      '.settings-button': 8,
      '.community-cards': 7,
      '.stats-overlay': 6,
      '.brand-logo': 5,
      '.seat': 4
    };
    return priorities[selector] || 1;
  }

  /**
   * Generate test cases for elements
   */
  generateTestCases(elements) {
    const testCases = [];

    elements.forEach(element => {
      const testPattern = this.testPatterns.get(element.type);
      if (testPattern) {
        testCases.push({
          description: `should display ${element.selector} correctly`,
          code: testPattern(element.selector),
          element: element.selector,
          priority: element.priority
        });
      }
    });

    return testCases.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get recommendations for test improvements
   */
  getRecommendations(elements) {
    const recommendations = [];

    // Check for missing common elements
    const expectedElements = ['.pot-amount', '.player-info', '.connection-status'];
    expectedElements.forEach(expected => {
      if (!elements.find(el => el.selector === expected)) {
        recommendations.push({
          type: 'missing-element',
          message: `Consider adding ${expected} to the overlay`,
          priority: 'medium'
        });
      }
    });

    // Check for test coverage gaps
    const hasInteractionTests = elements.some(el => el.type === 'clickable');
    if (!hasInteractionTests) {
      recommendations.push({
        type: 'missing-interaction',
        message: 'Add interaction tests for buttons and clickable elements',
        priority: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Generate a complete test file
   */
  generateTestFile(elements, testCases) {
    return `/**
 * Auto-generated overlay tests by Acey
 * Generated: ${new Date().toISOString()}
 */

const { test, expect } = require('@playwright/test');

test.describe('Overlay Elements - Acey Generated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/overlay');
    await page.waitForLoadState('networkidle');

${testCases.map(testCase => `
  test('${testCase.description}', async ({ page }) => {
    ${testCase.code}
  });`).join('\n')}
});

test.describe('Overlay Interactions - Acey Generated', () => {
  test('should handle settings panel', async ({ page }) => {
    await page.goto('/overlay');
    await page.waitForLoadState('networkidle');
    
    // Open settings
    await page.click('.settings-button');
    await expect(page.locator('.overlay-settings')).toBeVisible();
    
    // Close settings
    await page.click('.settings-button');
    await expect(page.locator('.overlay-settings')).toBeHidden();

  test('should handle chat overlay interaction', async ({ page }) => {
    await page.goto('/overlay?chat=true');
    await page.waitForLoadState('networkidle');
    
    // Add test message
    await page.evaluate(() => {
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = '<strong>Acey:</strong> Auto-test message!';
        chatMessages.appendChild(messageElement);
      }
    });
    
    await expect(page.locator('.chat-messages')).toContainText('Auto-test message!');
});
`;
  }

  /**
   * Fix failing test by analyzing error and suggesting solution
   */
  analyzeTestFailure(testName, error) {
    const fixes = [];

    if (error.includes('element(s) not found')) {
      fixes.push({
        type: 'selector-fix',
        message: 'Element not found - check if selector exists in HTML',
        solution: 'Verify the element exists and update selector if needed'
      });
    }

    if (error.includes('timeout')) {
      fixes.push({
        type: 'timing-fix',
        message: 'Test timed out - element might be loading slowly',
        solution: 'Add waitForLoadState or increase timeout'
      });
    }

    if (error.includes('not visible')) {
      fixes.push({
        type: 'visibility-fix',
        message: 'Element exists but not visible',
        solution: 'Check CSS display/visibility properties or remove hidden class'
      });
    }

    return fixes;
  }
}

// Export for use in Acey's system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AceyOverlayTester;
} else if (typeof window !== 'undefined') {
  window.AceyOverlayTester = AceyOverlayTester;
}
