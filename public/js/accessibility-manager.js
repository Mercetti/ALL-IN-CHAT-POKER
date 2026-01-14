/**
 * Accessibility Manager for Main Website
 * Provides keyboard navigation, ARIA support, and screen reader enhancements
 */

class AccessibilityManager {
  constructor(options = {}) {
    this.options = {
      enableKeyboardNavigation: true,
      enableScreenReaderSupport: true,
      enableFocusManagement: true,
      skipLinkTarget: 'main-content',
      ...options
    };
    
    this.isInitialized = false;
    this.currentFocusElement = null;
    this.focusableElementsSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // Initialize features
    if (this.options.enableKeyboardNavigation) {
      this.initKeyboardNavigation();
    }
    
    if (this.options.enableScreenReaderSupport) {
      this.initScreenReaderSupport();
    }
    
    if (this.options.enableFocusManagement) {
      this.initFocusManagement();
    }
    
    this.isInitialized = true;
  }

  initKeyboardNavigation() {
    // Add skip links
    this.addSkipLinks();
    
    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });
    
    // Add ARIA labels for interactive elements
    this.addARIALabels();
  }

  addSkipLinks() {
    const skipLink = document.createElement('a');
    skipLink.href = `#${this.options.skipLinkTarget}`;
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('aria-label', 'Skip to main content');
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Ensure target exists
    let target = document.getElementById(this.options.skipLinkTarget);
    if (!target) {
      target = document.createElement('main');
      target.id = this.options.skipLinkTarget;
      target.setAttribute('role', 'main');
      
      const firstContent = document.querySelector('h1, .container, .content');
      if (firstContent) {
        firstContent.parentNode.insertBefore(target, firstContent);
      } else {
        document.body.appendChild(target);
      }
    }
  }

  handleKeyboardNavigation(e) {
    // Tab navigation enhancement
    if (e.key === 'Tab') {
      this.handleTabNavigation(e);
    }
    
    // Escape key to close modals/dropdowns
    if (e.key === 'Escape') {
      this.handleEscapeKey(e);
    }
    
    // Enter/Space for interactive elements
    if (e.key === 'Enter' || e.key === ' ') {
      this.handleActivationKeys(e);
    }
  }

  handleTabNavigation(e) {
    const focusableElements = document.querySelectorAll(this.focusableElementsSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Wrap focus around
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  handleEscapeKey(e) {
    // Close modals
    const openModal = document.querySelector('.modal[aria-hidden="false"]');
    if (openModal) {
      this.closeModal(openModal);
      e.preventDefault();
    }
    
    // Close dropdowns
    const openDropdown = document.querySelector('.dropdown[aria-expanded="true"]');
    if (openDropdown) {
      this.closeDropdown(openDropdown);
      e.preventDefault();
    }
  }

  handleActivationKeys(e) {
    const target = e.target;
    
    // Handle non-button interactive elements
    if (target.getAttribute('role') === 'button' && target.tagName !== 'BUTTON') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        target.click();
      }
    }
    
    // Handle card/panel interactions
    if (target.classList.contains('card') || target.classList.contains('panel')) {
      if (e.key === 'Enter') {
        e.preventDefault();
        target.click();
      }
    }
  }

  initScreenReaderSupport() {
    // Add live regions for dynamic content
    this.addLiveRegions();
    
    // Enhance form accessibility
    this.enhanceFormAccessibility();
    
    // Add descriptions for complex elements
    this.addDescriptions();
  }

  addLiveRegions() {
    // Status messages
    const statusRegion = document.createElement('div');
    statusRegion.id = 'status-region';
    statusRegion.setAttribute('role', 'status');
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.setAttribute('aria-atomic', 'true');
    statusRegion.className = 'sr-only';
    document.body.appendChild(statusRegion);
    
    // Alert messages
    const alertRegion = document.createElement('div');
    alertRegion.id = 'alert-region';
    alertRegion.setAttribute('role', 'alert');
    alertRegion.setAttribute('aria-live', 'assertive');
    alertRegion.setAttribute('aria-atomic', 'true');
    alertRegion.className = 'sr-only';
    document.body.appendChild(alertRegion);
  }

  enhanceFormAccessibility() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // Add form labels if missing
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
          const label = form.querySelector(`label[for="${input.id}"]`);
          if (label) {
            input.setAttribute('aria-labelledby', label.id || this.generateId(label));
          } else {
            const placeholder = input.getAttribute('placeholder');
            if (placeholder) {
              input.setAttribute('aria-label', placeholder);
            }
          }
        }
        
        // Add required indicators
        if (input.hasAttribute('required')) {
          input.setAttribute('aria-required', 'true');
        }
      });
    });
  }

  addDescriptions() {
    // Add descriptions for complex components
    const complexElements = document.querySelectorAll('.card, .panel, .widget');
    
    complexElements.forEach(element => {
      if (!element.getAttribute('aria-describedby')) {
        const title = element.querySelector('h1, h2, h3, h4, h5, h6, .title');
        const description = element.querySelector('.description, p');
        
        if (title || description) {
          const descId = this.generateId(element, 'desc');
          const descElement = document.createElement('div');
          descElement.id = descId;
          descElement.className = 'sr-only';
          descElement.textContent = this.createAccessibleDescription(element);
          
          element.appendChild(descElement);
          element.setAttribute('aria-describedby', descId);
        }
      }
    });
  }

  initFocusManagement() {
    // Manage focus for dynamic content
    this.manageFocusForModals();
    this.manageFocusForNavigation();
    
    // Add focus indicators
    this.enhanceFocusIndicators();
  }

  manageFocusForModals() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
            if (modal.getAttribute('aria-hidden') === 'false') {
              this.trapFocus(modal);
            } else {
              this.releaseFocus(modal);
            }
          }
        });
      });
      
      observer.observe(modal, { attributes: true });
    });
  }

  manageFocusForNavigation() {
    // Handle navigation menus
    const navMenus = document.querySelectorAll('.nav-menu, .dropdown-menu');
    
    navMenus.forEach(menu => {
      menu.addEventListener('keydown', (e) => {
        this.handleNavigationKeyboard(e, menu);
      });
    });
  }

  enhanceFocusIndicators() {
    // Add focus styles for better visibility
    const style = document.createElement('style');
    style.textContent = `
      :focus-visible {
        outline: 3px solid #4299e1;
        outline-offset: 2px;
        border-radius: 4px;
      }
      
      .skip-link:focus {
        position: absolute;
        top: 10px;
        left: 10px;
        background: #4299e1;
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transform: none;
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
    document.head.appendChild(style);
  }

  // Utility methods
  addARIALabels() {
    // Add ARIA labels to common interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input');
    
    interactiveElements.forEach(element => {
      if (!element.getAttribute('aria-label') && !element.textContent.trim()) {
        const icon = element.querySelector('i, .icon, svg');
        if (icon) {
          const iconClass = icon.className || icon.getAttribute('data-icon');
          element.setAttribute('aria-label', this.getIconLabel(iconClass));
        }
      }
    });
  }

  getIconLabel(iconClass) {
    const iconLabels = {
      'menu': 'Menu',
      'close': 'Close',
      'search': 'Search',
      'settings': 'Settings',
      'user': 'User profile',
      'cart': 'Shopping cart',
      'home': 'Home',
      'back': 'Go back',
      'next': 'Next',
      'prev': 'Previous',
      'play': 'Play',
      'pause': 'Pause',
      'stop': 'Stop'
    };
    
    for (const [key, label] of Object.entries(iconLabels)) {
      if (iconClass.includes(key)) {
        return label;
      }
    }
    
    return 'Interactive element';
  }

  createAccessibleDescription(element) {
    const title = element.querySelector('h1, h2, h3, h4, h5, h6, .title');
    const description = element.querySelector('.description, p');
    
    let desc = '';
    if (title) desc += title.textContent.trim();
    if (description) desc += '. ' + description.textContent.trim();
    
    return desc || 'Interactive content';
  }

  generateId(element, prefix = 'element') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  trapFocus(container) {
    const focusableElements = container.querySelectorAll(this.focusableElementsSelector);
    const firstElement = focusableElements[0];
    
    if (firstElement) {
      this.currentFocusElement = document.activeElement;
      firstElement.focus();
    }
  }

  releaseFocus(container) {
    if (this.currentFocusElement) {
      this.currentFocusElement.focus();
      this.currentFocusElement = null;
    }
  }

  closeModal(modal) {
    modal.setAttribute('aria-hidden', 'true');
    const trigger = document.querySelector(`[aria-controls="${modal.id}"]`);
    if (trigger) {
      trigger.focus();
    }
  }

  closeDropdown(dropdown) {
    dropdown.setAttribute('aria-expanded', 'false');
    const trigger = document.querySelector(`[aria-controls="${dropdown.id}"]`);
    if (trigger) {
      trigger.focus();
    }
  }

  handleNavigationKeyboard(e, menu) {
    const items = menu.querySelectorAll('[role="menuitem"], a, button');
    const currentIndex = Array.from(items).indexOf(document.activeElement);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex].focus();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        items[prevIndex].focus();
        break;
        
      case 'Home':
        e.preventDefault();
        items[0].focus();
        break;
        
      case 'End':
        e.preventDefault();
        items[items.length - 1].focus();
        break;
    }
  }

  // Public API
  announce(message, priority = 'polite') {
    const region = priority === 'assertive' ? 
      document.getElementById('alert-region') : 
      document.getElementById('status-region');
    
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  setFocus(element) {
    if (element && element.focus) {
      element.focus();
    }
  }

  getFocusableElements(container = document) {
    return container.querySelectorAll(this.focusableElementsSelector);
  }
}

// Create global instance
window.accessibilityManager = new AccessibilityManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityManager;
}
