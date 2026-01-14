/**
 * DOM Test Helper Utility
 * Provides utilities for testing DOM components in a JSDOM environment
 */

const { JSDOM } = require('jsdom');

/**
 * Creates a test DOM environment
 */
class DOMTestEnvironment {
  constructor() {
    this.dom = null;
    this.window = null;
    this.document = null;
  }

  /**
   * Initialize the DOM environment
   */
  setup() {
    this.dom = new JSDOM(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Overlay</title>
      </head>
      <body>
        <div id="test-container"></div>
      </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    this.window = this.dom.window;
    this.document = this.dom.window.document;

    // Set up global variables for browser APIs
    global.window = this.window;
    global.document = this.document;
    global.navigator = this.window.navigator;
    global.HTMLElement = this.window.HTMLElement;
    global.Element = this.window.Element;
    global.Node = this.window.Node;
    global.NodeList = this.window.NodeList;
    global.HTMLCollection = this.window.HTMLCollection;
    global.Event = this.window.Event;
    global.CustomEvent = this.window.CustomEvent;
    global.MouseEvent = this.window.MouseEvent;
    global.KeyboardEvent = this.window.KeyboardEvent;
    global.Image = this.window.Image;
    global.CanvasRenderingContext2D = this.window.CanvasRenderingContext2D;
    global.WebSocket = this.window.WebSocket;
    global.localStorage = this.window.localStorage;
    global.sessionStorage = this.window.sessionStorage;
    global.requestAnimationFrame = this.window.requestAnimationFrame;
    global.cancelAnimationFrame = this.window.cancelAnimationFrame;
    global.setTimeout = this.window.setTimeout;
    global.clearTimeout = this.window.clearTimeout;
    global.setInterval = this.window.setInterval;
    global.clearInterval = this.window.clearInterval;
  }

  /**
   * Clean up the DOM environment
   */
  cleanup() {
    if (this.dom) {
      this.dom.window.close();
    }

    // Clean up global variables
    delete global.window;
    delete global.document;
    delete global.navigator;
    delete global.HTMLElement;
    delete global.Element;
    delete global.Node;
    delete global.NodeList;
    delete global.HTMLCollection;
    delete global.Event;
    delete global.CustomEvent;
    delete global.MouseEvent;
    delete global.KeyboardEvent;
    delete global.Image;
    delete global.CanvasRenderingContext2D;
    delete global.WebSocket;
    delete global.localStorage;
    delete global.sessionStorage;
    delete global.requestAnimationFrame;
    delete global.cancelAnimationFrame;
    delete global.setTimeout;
    delete global.clearTimeout;
    delete global.setInterval;
    delete global.clearInterval;
  }

  /**
   * Create a test element
   */
  createElement(tag, attributes = {}, textContent = '') {
    const element = this.document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    });

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  /**
   * Append element to container
   */
  appendToContainer(element, containerId = 'test-container') {
    const container = this.document.getElementById(containerId);
    if (container) {
      container.appendChild(element);
    }
    return element;
  }

  /**
   * Wait for DOM updates
   */
  async waitForDOMUpdate() {
    return new Promise(resolve => {
      this.window.setTimeout(resolve, 0);
    });
  }

  /**
   * Simulate mouse event
   */
  simulateMouseEvent(element, eventType, options = {}) {
    const event = new this.window.MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      clientX: 0,
      clientY: 0,
      ...options
    });
    element.dispatchEvent(event);
  }

  /**
   * Simulate keyboard event
   */
  simulateKeyboardEvent(element, eventType, key, options = {}) {
    const event = new this.window.KeyboardEvent(eventType, {
      bubbles: true,
      cancelable: true,
      key,
      ...options
    });
    element.dispatchEvent(event);
  }

  /**
   * Get computed styles
   */
  getComputedStyle(element) {
    const styles = this.window.getComputedStyle(element);
    
    // Mock style object to avoid JSDOM CSS parsing issues
    return {
      ...styles,
      // Mock CSSStyleDeclaration methods that JSDOM doesn't support
      setProperty: jest.fn(),
      getPropertyValue: jest.fn(() => styles.getPropertyValue),
      removeProperty: jest.fn(),
      parentRule: null
    };
  }

  /**
   * Check if element is visible
   */
  isElementVisible(element) {
    const styles = this.getComputedStyle(element);
    return styles.display !== 'none' && 
           styles.visibility !== 'hidden' && 
           styles.opacity !== '0';
  }

  /**
   * Get element position
   */
  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * Mock WebSocket for testing
   */
  mockWebSocket() {
    const mockSocket = {
      readyState: this.window.WebSocket.OPEN,
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null
    };

    this.window.WebSocket = jest.fn(() => mockSocket);
    return mockSocket;
  }

  /**
   * Mock Image loading
   */
  mockImageLoading() {
    const originalImage = this.window.Image;
    
    this.window.Image = jest.fn(() => ({
      src: '',
      onload: null,
      onerror: null,
      width: 100,
      height: 100,
      complete: true
    }));

    // Simulate image loading
    this.window.Image.mockImplementation(() => {
      const img = new originalImage();
      setTimeout(() => {
        if (img.onload) img.onload();
      }, 10);
      return img;
    });
  }

  /**
   * Mock Canvas context
   */
  mockCanvasContext() {
    const mockContext = {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 })),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      clip: jest.fn(),
      setTransform: jest.fn(),
      resetTransform: jest.fn(),
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      strokeStyle: '#000000',
      fillStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      font: '12px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic'
    };

    this.window.HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
    return mockContext;
  }

  /**
   * Mock requestAnimationFrame
   */
  mockRequestAnimationFrame() {
    let frameCount = 0;
    const callbacks = [];

    this.window.requestAnimationFrame = jest.fn((callback) => {
      callbacks.push(callback);
      return frameCount++;
    });

    // Helper to trigger all callbacks
    this.triggerAnimationFrames = (count = 1) => {
      for (let i = 0; i < count && callbacks.length > 0; i++) {
        const callback = callbacks.shift();
        callback(Date.now());
      }
    };

    return callbacks;
  }

  /**
   * Create mock overlay data
   */
  createMockOverlayData() {
    return {
      players: [
        {
          id: 'player1',
          login: 'testuser1',
          displayName: 'Test User 1',
          avatar: '/avatar1.png',
          balance: 1000,
          bet: 50,
          cards: ['AH', 'KD'],
          status: 'active',
          position: 0
        },
        {
          id: 'player2',
          login: 'testuser2',
          displayName: 'Test User 2',
          avatar: '/avatar2.png',
          balance: 800,
          bet: 0,
          cards: [],
          status: 'folded',
          position: 1
        }
      ],
      pot: 150,
      currentPhase: 'betting',
      dealerHand: ['10S', 'JC'],
      communityCards: ['2H', '5D', '9S'],
      countdown: 15,
      streamerLogin: 'teststreamer',
      settings: {
        dealDelayBase: 0.18,
        dealDelayPerCard: 0.08,
        chipVolume: 0.16,
        cardBackVariant: 'default'
      }
    };
  }
}

/**
 * Utility functions for DOM testing
 */
const DOMTestUtils = {
  /**
   * Wait for a condition to be true
   */
  async waitForCondition(condition, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkCondition = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(checkCondition, 50);
        }
      };
      
      checkCondition();
    });
  },

  /**
   * Assert element exists
   */
  assertElementExists(selector, document) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    return element;
  },

  /**
   * Assert element has text
   */
  assertElementHasText(selector, expectedText, document) {
    const element = DOMTestUtils.assertElementExists(selector, document);
    const actualText = element.textContent.trim();
    if (actualText !== expectedText) {
      throw new Error(`Expected "${expectedText}" but got "${actualText}" for ${selector}`);
    }
    return element;
  },

  /**
   * Assert element has class
   */
  assertElementHasClass(selector, className, document) {
    const element = DOMTestUtils.assertElementExists(selector, document);
    if (!element.classList.contains(className)) {
      throw new Error(`Element ${selector} does not have class ${className}`);
    }
    return element;
  },

  /**
   * Assert element has style
   */
  assertElementHasStyle(selector, property, value, document) {
    const element = DOMTestUtils.assertElementExists(selector, document);
    const styles = document.defaultView.getComputedStyle(element);
    const actualValue = styles[property];
    if (actualValue !== value) {
      throw new Error(`Expected ${property}: ${value} but got ${actualValue} for ${selector}`);
    }
    return element;
  },

  /**
   * Count elements matching selector
   */
  countElements(selector, document) {
    return document.querySelectorAll(selector).length;
  },

  /**
   * Get element text content
   */
  getElementText(selector, document) {
    const element = document.querySelector(selector);
    return element ? element.textContent.trim() : '';
  },

  /**
   * Check if element is visible
   */
  isElementVisible(selector, document) {
    const element = document.querySelector(selector);
    if (!element) return false;
    
    const styles = document.defaultView.getComputedStyle(element);
    return styles.display !== 'none' && 
           styles.visibility !== 'hidden' && 
           styles.opacity !== '0';
  }
};

module.exports = {
  DOMTestEnvironment,
  DOMTestUtils
};
