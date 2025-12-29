/**
 * Accessibility utilities for enhanced user experience
 * Provides ARIA label management, keyboard navigation, and screen reader support
 */

class AccessibilityManager {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.keyboardNavigation = options.keyboardNavigation !== false;
    this.announcements = [];
    this.announcementQueue = [];
    this.isAnnouncing = false;
    this.focusableElements = [];
    this.currentFocusIndex = -1;
    this.keyboardHandlers = new Map();
    this.liveRegion = null;
    
    // Initialize live region for screen reader announcements
    this.initLiveRegion();
    
    // Initialize keyboard navigation
    if (this.keyboardNavigation) {
      this.initKeyboardNavigation();
    }
    
    // Auto-enhance page on load
    if (this.enabled) {
      this.enhancePage();
    }
  }

  /**
   * Initialize live region for screen reader announcements
   */
  initLiveRegion() {
    // Create live region if it doesn't exist
    if (!document.getElementById('accessibility-live-region')) {
      this.liveRegion = document.createElement('div');
      this.liveRegion.id = 'accessibility-live-region';
      this.liveRegion.setAttribute('aria-live', 'polite');
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.className = 'sr-only';
      this.liveRegion.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(this.liveRegion);
    } else {
      this.liveRegion = document.getElementById('accessibility-live-region');
    }
  }

  /**
   * Initialize keyboard navigation
   */
  initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Skip if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }

      // Handle keyboard shortcuts
      switch (e.key) {
        case 'Tab':
          this.handleTabNavigation(e);
          break;
        case 'Enter':
        case ' ':
          this.handleActivation(e);
          break;
        case 'Escape':
          this.handleEscape(e);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(e);
          break;
        case 'h':
        case 'H':
          if (e.ctrlKey || e.altKey) {
            e.preventDefault();
            this.announceHelp();
          }
          break;
      }
    });
  }

  /**
   * Enhance page with accessibility features
   */
  enhancePage() {
    this.addARIALabels();
    this.enhanceButtons();
    this.enhanceCards();
    this.enhanceGameElements();
    this.setupFocusManagement();
    this.addSkipLinks();
  }

  /**
   * Add ARIA labels to common elements
   */
  addARIALabels() {
    // Add labels to game status elements
    this.addLabel('#phase-badge', 'Current game phase');
    this.addLabel('#mode-badge', 'Game mode');
    this.addLabel('#phase-countdown', 'Time remaining in current phase');
    this.addLabel('#user-balance', 'Your current balance');
    this.addLabel('#user-wins', 'Number of rounds you have won');
    this.addLabel('#pot-chips', 'Current pot amount');

    // Add labels to action buttons
    this.addLabel('#btn-hit', 'Hit - Take another card');
    this.addLabel('#btn-stand', 'Stand - Keep current hand');
    this.addLabel('#btn-double', 'Double down - Double bet and take one card');
    this.addLabel('#btn-surrender', 'Surrender - Give up half your bet');
    this.addLabel('#btn-insurance', 'Insurance - Protect against dealer blackjack');
    this.addLabel('#btn-split', 'Split - Split pair into two hands');
    this.addLabel('#btn-draw', 'Draw - Replace unheld cards');
    this.addLabel('#btn-player-ready', 'Mark yourself as ready for next round');

    // Add labels to poker actions
    this.addLabel('#poker-check', 'Check - Pass action without betting');
    this.addLabel('#poker-call', 'Call - Match current bet');
    this.addLabel('#poker-raise', 'Raise - Increase bet');
    this.addLabel('#poker-fold', 'Fold - Give up your hand');

    // Add labels to navigation
    this.addLabel('#theme-toggle', 'Toggle color theme');
    this.addLabel('#logout-btn', 'Sign out of your account');
    this.addLabel('#login-link', 'Sign in to your account');
    this.addLabel('#profile-btn', 'View your profile');
    this.addLabel('#streamer-btn', 'Open streamer control panel');
  }

  /**
   * Add ARIA label to element
   */
  addLabel(selector, label) {
    const element = document.querySelector(selector);
    if (element && !element.getAttribute('aria-label')) {
      element.setAttribute('aria-label', label);
    }
  }

  /**
   * Enhance buttons with accessibility features
   */
  enhanceButtons() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      // Add role if missing
      if (!button.getAttribute('role')) {
        button.setAttribute('role', 'button');
      }

      // Add keyboard interaction
      if (!button.hasAttribute('data-keyboard-enhanced')) {
        button.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            button.click();
          }
        });
        button.setAttribute('data-keyboard-enhanced', 'true');
      }

      // Add focus indicators
      if (!button.classList.contains('accessibility-enhanced')) {
        button.addEventListener('focus', () => {
          button.classList.add('focused');
        });
        button.addEventListener('blur', () => {
          button.classList.remove('focused');
        });
        button.classList.add('accessibility-enhanced');
      }
    });
  }

  /**
   * Enhance card elements
   */
  enhanceCards() {
    const cards = document.querySelectorAll('.card, .playing-card');
    cards.forEach(card => {
      if (!card.hasAttribute('data-card-enhanced')) {
        // Add card role
        card.setAttribute('role', 'img');
        
        // Generate descriptive label
        const rank = card.querySelector('.rank')?.textContent || card.dataset.rank || '';
        const suit = card.querySelector('.suit')?.textContent || card.dataset.suit || '';
        if (rank && suit) {
          card.setAttribute('aria-label', `${rank} of ${suit}`);
        }

        // Add keyboard selection for hold checkboxes
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) {
          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              checkbox.checked = !checkbox.checked;
              checkbox.dispatchEvent(new Event('change'));
              this.announceCardHold(card, checkbox.checked);
            }
          });
          card.setAttribute('tabindex', '0');
        }

        card.setAttribute('data-card-enhanced', 'true');
      }
    });
  }

  /**
   * Enhance game-specific elements
   */
  enhanceGameElements() {
    // Enhance pot display
    const potChips = document.querySelector('#pot-chips');
    if (potChips) {
      potChips.setAttribute('role', 'status');
      potChips.setAttribute('aria-live', 'polite');
    }

    // Enhance player hands
    const playerHands = document.querySelector('#player-hands');
    if (playerHands) {
      playerHands.setAttribute('role', 'region');
      playerHands.setAttribute('aria-label', 'Your hand');
    }

    // Enhance dealer section
    const dealerSection = document.querySelector('#dealer-section');
    if (dealerSection) {
      dealerSection.setAttribute('role', 'region');
      dealerSection.setAttribute('aria-label', 'Dealer hand');
    }

    // Enhance community cards
    const communitySection = document.querySelector('#community-section');
    if (communitySection) {
      communitySection.setAttribute('role', 'region');
      communitySection.setAttribute('aria-label', 'Community cards');
    }

    // Enhance result display
    const resultDisplay = document.querySelector('#result-display');
    if (resultDisplay) {
      resultDisplay.setAttribute('role', 'alert');
      resultDisplay.setAttribute('aria-live', 'assertive');
    }
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Track focusable elements
    this.updateFocusableElements();
    
    // Update when DOM changes
    const observer = new MutationObserver(() => {
      this.updateFocusableElements();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Update list of focusable elements
   */
  updateFocusableElements() {
    this.focusableElements = Array.from(document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  /**
   * Add skip links for keyboard navigation
   */
  addSkipLinks() {
    if (document.querySelector('.skip-links')) return;

    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#cards-section" class="skip-link">Skip to game</a>
      <a href="#player-actions" class="skip-link">Skip to actions</a>
    `;
    
    skipLinks.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      z-index: 9999;
    `;
    
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  /**
   * Handle tab navigation
   */
  handleTabNavigation(e) {
    // Let browser handle normal tab navigation
    setTimeout(() => {
      const focusedElement = document.activeElement;
      if (focusedElement) {
        const index = this.focusableElements.indexOf(focusedElement);
        if (index !== -1) {
          this.currentFocusIndex = index;
        }
      }
    }, 0);
  }

  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation(e) {
    e.preventDefault();
    
    if (this.focusableElements.length === 0) return;
    
    let newIndex = this.currentFocusIndex;
    
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        newIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        newIndex = this.currentFocusIndex - 1;
        if (newIndex < 0) newIndex = this.focusableElements.length - 1;
        break;
    }
    
    if (newIndex !== this.currentFocusIndex && this.focusableElements[newIndex]) {
      this.focusableElements[newIndex].focus();
      this.currentFocusIndex = newIndex;
    }
  }

  /**
   * Handle activation (Enter/Space)
   */
  handleActivation(e) {
    const focusedElement = document.activeElement;
    if (focusedElement && focusedElement.tagName === 'BUTTON') {
      e.preventDefault();
      focusedElement.click();
    }
  }

  /**
   * Handle escape key
   */
  handleEscape(e) {
    // Return focus to main game area
    const gameArea = document.querySelector('.cards-section') || document.querySelector('#player-hands');
    if (gameArea) {
      gameArea.focus();
    }
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite') {
    if (!this.liveRegion) return;
    
    // Queue announcement if currently announcing
    if (this.isAnnouncing) {
      this.announcementQueue.push({ message, priority });
      return;
    }
    
    this.isAnnouncing = true;
    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      this.liveRegion.textContent = '';
      this.isAnnouncing = false;
      
      // Process next announcement
      if (this.announcementQueue.length > 0) {
        const next = this.announcementQueue.shift();
        this.announce(next.message, next.priority);
      }
    }, 1000);
  }

  /**
   * Announce game state changes
   */
  announceGameState(phase, mode, timeRemaining = null) {
    let message = `Game phase: ${phase}`;
    if (mode) message += `. Mode: ${mode}`;
    if (timeRemaining) message += `. Time remaining: ${timeRemaining}`;
    
    this.announce(message, 'polite');
  }

  /**
   * Announce card hold changes
   */
  announceCardHold(card, isHeld) {
    const cardLabel = card.getAttribute('aria-label') || 'Card';
    const action = isHeld ? 'held' : 'released';
    this.announce(`${cardLabel} ${action}`, 'polite');
  }

  /**
   * Announce hand results
   */
  announceHandResult(handName, payout, winAmount = null) {
    let message = `Result: ${handName}`;
    if (payout) message += `. Payout: ${payout}x`;
    if (winAmount) message += `. Won: ${winAmount} chips`;
    
    this.announce(message, 'assertive');
  }

  /**
   * Announce balance changes
   */
  announceBalanceChange(newBalance, change = null) {
    let message = `New balance: ${newBalance} chips`;
    if (change) {
      const changeType = change > 0 ? 'won' : 'lost';
      message += `. ${changeType}: ${Math.abs(change)} chips`;
    }
    
    this.announce(message, 'polite');
  }

  /**
   * Announce help information
   */
  announceHelp() {
    const helpText = `
      Keyboard shortcuts: 
      Tab - Navigate between elements
      Arrow keys - Navigate game elements
      Enter or Space - Activate buttons
      Escape - Return to game area
      H - Hear this help message
      
      Game controls:
      Hit - Take another card
      Stand - Keep current hand
      Double - Double bet and take one card
      Use checkboxes to hold cards in poker
    `;
    
    this.announce(helpText, 'polite');
  }

  /**
   * Set focus to element
   */
  setFocus(selector) {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (element) {
      element.focus();
    }
  }

  /**
   * Get current focus position
   */
  getFocusPosition() {
    return {
      index: this.currentFocusIndex,
      element: this.focusableElements[this.currentFocusIndex] || null,
      total: this.focusableElements.length
    };
  }

  /**
   * Enable/disable accessibility features
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.enhancePage();
    }
  }
}

// Create global accessibility manager
const accessibilityManager = new AccessibilityManager({
  enabled: true,
  keyboardNavigation: true
});

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    accessibilityManager.enhancePage();
  });
} else {
  accessibilityManager.enhancePage();
}

module.exports = {
  AccessibilityManager,
  accessibilityManager
};
