/**
 * Keyboard Navigation Manager for Poker Game Overlay
 * Provides comprehensive keyboard controls for poker gameplay
 */

class PokerKeyboardNavigation {
  constructor(options = {}) {
    this.options = {
      enableKeyboardShortcuts: true,
      enableFocusManagement: true,
      enableScreenReaderSupport: true,
      debugMode: false,
      ...options
    };
    
    this.isInitialized = false;
    this.currentFocusElement = null;
    this.keyboardState = {
      activePlayer: null,
      selectedCard: null,
      actionMode: 'normal', // normal, betting, cardSelection
      lastAction: null
    };
    
    this.keyboardShortcuts = {
      // Game actions
      'fold': ['f', 'F'],
      'check': ['c', 'C'],
      'call': ['l', 'L'],
      'raise': ['r', 'R'],
      'allIn': ['a', 'A'],
      
      // Card selection
      'selectCard': ['1', '2', '3', '4', '5'],
      'holdCard': ['h', 'H'],
      'unholdCard': ['u', 'U'],
      
      // Navigation
      'nextPlayer': ['Tab'],
      'prevPlayer': ['Shift+Tab'],
      'toggleMenu': ['Escape'],
      'showHelp': ['?'],
      
      // Accessibility
      'announceState': ['Space'],
      'toggleAudio': ['m', 'M']
    };
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // Setup keyboard event listeners
    this.setupKeyboardListeners();
    
    // Setup focus management
    this.setupFocusManagement();
    
    // Setup screen reader support
    this.setupScreenReaderSupport();
    
    // Add keyboard help UI
    this.addKeyboardHelp();
    
    this.isInitialized = true;
  }

  setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      if (!this.options.enableKeyboardShortcuts) return;
      
      // Ignore if user is typing in input field
      if (this.isInputElement(e.target)) return;
      
      const key = this.getKeyString(e);
      const action = this.getActionForKey(key);
      
      if (action) {
        e.preventDefault();
        this.handleKeyboardAction(action, e);
      }
    });
  }

  setupFocusManagement() {
    // Add focus indicators to interactive elements
    this.addFocusIndicators();
    
    // Handle focus trapping for modals
    this.setupFocusTrapping();
    
    // Announce focus changes to screen readers
    this.setupFocusAnnouncements();
  }

  setupScreenReaderSupport() {
    // Add live regions for game state announcements
    this.addLiveRegions();
    
    // Add ARIA labels to game elements
    this.addARIALabels();
    
    // Setup screen reader announcements
    this.setupAnnouncements();
  }

  handleKeyboardAction(action, event) {
    if (this.options.debugMode) {
      console.log(`Keyboard action: ${action}`, event);
    }
    
    switch (action) {
      case 'fold':
        this.performAction('fold');
        break;
        
      case 'check':
        this.performAction('check');
        break;
        
      case 'call':
        this.performAction('call');
        break;
        
      case 'raise':
        this.performAction('raise');
        break;
        
      case 'allIn':
        this.performAction('allIn');
        break;
        
      case 'selectCard':
        const cardIndex = parseInt(event.key) - 1;
        this.selectCard(cardIndex);
        break;
        
      case 'holdCard':
        this.toggleHoldCard(true);
        break;
        
      case 'unholdCard':
        this.toggleHoldCard(false);
        break;
        
      case 'nextPlayer':
        this.navigatePlayer('next');
        break;
        
      case 'prevPlayer':
        this.navigatePlayer('prev');
        break;
        
      case 'toggleMenu':
        this.toggleGameMenu();
        break;
        
      case 'showHelp':
        this.showKeyboardHelp();
        break;
        
      case 'announceState':
        this.announceGameState();
        break;
        
      case 'toggleAudio':
        this.toggleAudio();
        break;
    }
  }

  performAction(action) {
    // Check if action is available
    if (!this.isActionAvailable(action)) {
      this.announceToScreenReader(`${action} is not available at this time`);
      return;
    }
    
    // Execute action through existing game systems
    if (window.overlayState && window.updateUI) {
      try {
        // Simulate button click for the action
        const actionButton = document.querySelector(`[data-action="${action}"], .${action}-btn, button[data-action="${action}"]`);
        if (actionButton) {
          actionButton.click();
          this.announceToScreenReader(`Performed ${action}`);
        } else {
          // Fallback: trigger action through game state
          this.triggerGameAction(action);
        }
      } catch (error) {
        console.error(`Failed to perform action ${action}:`, error);
        this.announceToScreenReader(`Failed to perform ${action}`);
      }
    }
  }

  triggerGameAction(action) {
    // Direct action triggering for when buttons aren't available
    const actionMap = {
      'fold': () => this.sendGameAction('fold'),
      'check': () => this.sendGameAction('check'),
      'call': () => this.sendGameAction('call'),
      'raise': () => this.sendGameAction('raise'),
      'allIn': () => this.sendGameAction('allIn')
    };
    
    if (actionMap[action]) {
      actionMap[action]();
    }
  }

  sendGameAction(action) {
    // Send action through WebSocket or game system
    if (window.socket && window.socket.connected) {
      window.socket.emit('gameAction', { action });
    } else if (window.client && window.client.sendAction) {
      window.client.sendAction(action);
    }
  }

  selectCard(cardIndex) {
    const cards = document.querySelectorAll('.player-card, .card');
    if (cardIndex >= 0 && cardIndex < cards.length) {
      const card = cards[cardIndex];
      card.focus();
      this.announceCardSelection(card);
    }
  }

  toggleHoldCard(hold) {
    const focusedCard = document.activeElement;
    if (focusedCard && focusedCard.classList.contains('player-card')) {
      if (hold) {
        focusedCard.classList.add('held');
        focusedCard.setAttribute('aria-label', `${focusedCard.getAttribute('aria-label')} (held)`);
      } else {
        focusedCard.classList.remove('held');
        focusedCard.setAttribute('aria-label', focusedCard.getAttribute('aria-label').replace(' (held)', ''));
      }
      this.announceToScreenReader(`Card ${hold ? 'held' : 'unheld'}`);
    }
  }

  navigatePlayer(direction) {
    const players = document.querySelectorAll('.seat, .player-seat');
    const currentIndex = Array.from(players).findIndex(player => 
      player.contains(document.activeElement)
    );
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % players.length;
    } else {
      nextIndex = (currentIndex - 1 + players.length) % players.length;
    }
    
    const nextPlayer = players[nextIndex];
    const focusableElement = nextPlayer.querySelector('button, [tabindex]:not([tabindex="-1"])');
    
    if (focusableElement) {
      focusableElement.focus();
      this.announcePlayerFocus(nextPlayer);
    }
  }

  toggleGameMenu() {
    const menu = document.querySelector('.game-menu, .overlay-menu');
    if (menu) {
      const isVisible = menu.style.display !== 'none';
      menu.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        const firstMenuItem = menu.querySelector('button, [tabindex]:not([tabindex="-1"])');
        if (firstMenuItem) {
          firstMenuItem.focus();
        }
      }
      
      this.announceToScreenReader(`Game menu ${isVisible ? 'closed' : 'opened'}`);
    }
  }

  announceGameState() {
    const gameState = this.getCurrentGameState();
    const announcement = this.formatGameStateAnnouncement(gameState);
    this.announceToScreenReader(announcement);
  }

  toggleAudio() {
    // Toggle game audio/mute
    const audioButton = document.querySelector('.audio-btn, .mute-btn, [data-action="toggleAudio"]');
    if (audioButton) {
      audioButton.click();
    }
  }

  // Utility methods
  getKeyString(event) {
    let key = event.key;
    if (event.shiftKey) key = 'Shift+' + key;
    if (event.ctrlKey) key = 'Ctrl+' + key;
    if (event.altKey) key = 'Alt+' + key;
    return key;
  }

  getActionForKey(key) {
    for (const [action, keys] of Object.entries(this.keyboardShortcuts)) {
      if (keys.includes(key)) {
        return action;
      }
    }
    return null;
  }

  isInputElement(element) {
    const inputTypes = ['input', 'textarea', 'select'];
    return inputTypes.includes(element.tagName.toLowerCase()) || 
           element.contentEditable === 'true';
  }

  isActionAvailable(action) {
    // Check if action button exists and is enabled
    const actionButton = document.querySelector(`[data-action="${action}"], .${action}-btn`);
    return actionButton && !actionButton.disabled;
  }

  getCurrentGameState() {
    const state = {
      phase: 'unknown',
      pot: '0',
      players: [],
      currentBet: '0',
      yourTurn: false
    };
    
    // Extract game state from DOM
    const phaseElement = document.querySelector('.game-phase, .phase-label');
    if (phaseElement) {
      state.phase = phaseElement.textContent.trim();
    }
    
    const potElement = document.querySelector('.pot-amount, .pot-value');
    if (potElement) {
      state.pot = potElement.textContent.trim();
    }
    
    const playerElements = document.querySelectorAll('.seat, .player-seat');
    state.players = Array.from(playerElements).map(player => ({
      name: player.querySelector('.player-name, .seat-name')?.textContent.trim() || 'Unknown',
      chips: player.querySelector('.chip-count, .player-chips')?.textContent.trim() || '0',
      isActive: player.classList.contains('active', 'current-turn')
    }));
    
    const yourTurnElement = document.querySelector('.your-turn, .action-required');
    state.yourTurn = !!yourTurnElement;
    
    return state;
  }

  formatGameStateAnnouncement(state) {
    let announcement = `Game phase: ${state.phase}. `;
    announcement += `Pot: ${state.pot}. `;
    announcement += `Players: ${state.players.length}. `;
    
    if (state.yourTurn) {
      announcement += 'It is your turn to act. ';
    }
    
    const activePlayer = state.players.find(p => p.isActive);
    if (activePlayer) {
      announcement += `Current player: ${activePlayer.name}. `;
    }
    
    return announcement;
  }

  announceCardSelection(card) {
    const cardValue = card.querySelector('.card-value, .card-rank')?.textContent || 'Unknown';
    const cardSuit = card.querySelector('.card-suit')?.textContent || '';
    const isHeld = card.classList.contains('held');
    
    const announcement = `Selected ${cardValue} ${cardSuit}${isHeld ? ' (held)' : ''}`;
    this.announceToScreenReader(announcement);
  }

  announcePlayerFocus(playerElement) {
    const playerName = playerElement.querySelector('.player-name, .seat-name')?.textContent || 'Unknown player';
    const playerChips = playerElement.querySelector('.chip-count, .player-chips')?.textContent || '0';
    const isActive = playerElement.classList.contains('active', 'current-turn');
    
    const announcement = `Focused on ${playerName} with ${playerChips} chips${isActive ? ' (active player)' : ''}`;
    this.announceToScreenReader(announcement);
  }

  // UI Setup methods
  addFocusIndicators() {
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-focus {
        outline: 3px solid #4299e1 !important;
        outline-offset: 2px;
        border-radius: 4px;
      }
      
      .player-card:focus,
      .seat:focus {
        transform: scale(1.05);
        box-shadow: 0 0 20px rgba(66, 153, 225, 0.6);
      }
      
      .card.held {
        border: 2px solid #48bb78;
        box-shadow: 0 0 15px rgba(72, 187, 120, 0.4);
      }
    `;
    document.head.appendChild(style);
    
    // Add focus listeners
    document.addEventListener('focusin', (e) => {
      e.target.classList.add('keyboard-focus');
    });
    
    document.addEventListener('focusout', (e) => {
      e.target.classList.remove('keyboard-focus');
    });
  }

  setupFocusTrapping() {
    // Handle modals and dialogs
    const modals = document.querySelectorAll('.modal, .dialog, .game-menu');
    modals.forEach(modal => {
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          this.trapFocus(e, modal);
        }
      });
    });
  }

  trapFocus(event, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  addLiveRegions() {
    // Game state announcements
    const gameStateRegion = document.createElement('div');
    gameStateRegion.id = 'game-state-announcements';
    gameStateRegion.setAttribute('role', 'status');
    gameStateRegion.setAttribute('aria-live', 'polite');
    gameStateRegion.setAttribute('aria-atomic', 'true');
    gameStateRegion.className = 'sr-only';
    document.body.appendChild(gameStateRegion);
    
    // Action confirmations
    const actionRegion = document.createElement('div');
    actionRegion.id = 'action-announcements';
    actionRegion.setAttribute('role', 'status');
    actionRegion.setAttribute('aria-live', 'polite');
    actionRegion.setAttribute('aria-atomic', 'true');
    actionRegion.className = 'sr-only';
    document.body.appendChild(actionRegion);
  }

  addARIALabels() {
    // Add labels to game elements
    const cards = document.querySelectorAll('.player-card, .card');
    cards.forEach((card, index) => {
      if (!card.getAttribute('aria-label')) {
        const value = card.querySelector('.card-value, .card-rank')?.textContent || 'Unknown';
        const suit = card.querySelector('.card-suit')?.textContent || '';
        card.setAttribute('aria-label', `${value} ${suit}, card ${index + 1}`);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
      }
    });
    
    // Add labels to action buttons
    const actionButtons = document.querySelectorAll('.action-btn, .game-action');
    actionButtons.forEach(button => {
      if (!button.getAttribute('aria-label')) {
        button.setAttribute('aria-label', `${button.textContent.trim()} button`);
      }
    });
  }

  setupAnnouncements() {
    // Auto-announce important game events
    this.observeGameChanges();
  }

  observeGameChanges() {
    // Observe game state changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const element = mutation.target;
          
          // Announce player turn changes
          if (element.classList.contains('active', 'current-turn')) {
            const playerName = element.querySelector('.player-name, .seat-name')?.textContent;
            if (playerName) {
              this.announceToScreenReader(`${playerName}'s turn`);
            }
          }
        }
      });
    });
    
    // Observe all player seats
    const players = document.querySelectorAll('.seat, .player-seat');
    players.forEach(player => {
      observer.observe(player, { attributes: true, attributeFilter: ['class'] });
    });
  }

  announceToScreenReader(message) {
    const region = document.getElementById('game-state-announcements');
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  addKeyboardHelp() {
    // Create keyboard help modal
    const helpModal = document.createElement('div');
    helpModal.id = 'keyboard-help';
    helpModal.className = 'keyboard-help-modal';
    helpModal.setAttribute('role', 'dialog');
    helpModal.setAttribute('aria-labelledby', 'keyboard-help-title');
    helpModal.setAttribute('aria-hidden', 'true');
    
    helpModal.innerHTML = `
      <div class="keyboard-help-content">
        <h2 id="keyboard-help-title">Poker Game Keyboard Shortcuts</h2>
        <div class="keyboard-shortcuts-grid">
          <div class="shortcut-category">
            <h3>Game Actions</h3>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <kbd>F</kbd> <span>Fold</span>
              </div>
              <div class="shortcut-item">
                <kbd>C</kbd> <span>Check</span>
              </div>
              <div class="shortcut-item">
                <kbd>L</kbd> <span>Call</span>
              </div>
              <div class="shortcut-item">
                <kbd>R</kbd> <span>Raise</span>
              </div>
              <div class="shortcut-item">
                <kbd>A</kbd> <span>All In</span>
              </div>
            </div>
          </div>
          
          <div class="shortcut-category">
            <h3>Card Selection</h3>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <kbd>1-5</kbd> <span>Select Card</span>
              </div>
              <div class="shortcut-item">
                <kbd>H</kbd> <span>Hold Card</span>
              </div>
              <div class="shortcut-item">
                <kbd>U</kbd> <span>Unhold Card</span>
              </div>
            </div>
          </div>
          
          <div class="shortcut-category">
            <h3>Navigation</h3>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <kbd>Tab</kbd> <span>Next Player</span>
              </div>
              <div class="shortcut-item">
                <kbd>Shift+Tab</kbd> <span>Previous Player</span>
              </div>
              <div class="shortcut-item">
                <kbd>Esc</kbd> <span>Toggle Menu</span>
              </div>
              <div class="shortcut-item">
                <kbd>?</kbd> <span>Show Help</span>
              </div>
            </div>
          </div>
          
          <div class="shortcut-category">
            <h3>Accessibility</h3>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <kbd>Space</kbd> <span>Announce State</span>
              </div>
              <div class="shortcut-item">
                <kbd>M</kbd> <span>Toggle Audio</span>
              </div>
            </div>
          </div>
        </div>
        
        <button class="close-help-btn" onclick="window.pokerKeyboardNavigation.hideKeyboardHelp()">
          Close Help
        </button>
      </div>
    `;
    
    document.body.appendChild(helpModal);
    
    // Add styles
    this.addKeyboardHelpStyles();
  }

  addKeyboardHelpStyles() {
    if (document.querySelector('#keyboard-help-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'keyboard-help-styles';
    style.textContent = `
      .keyboard-help-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      
      .keyboard-help-modal[aria-hidden="false"] {
        display: flex;
      }
      
      .keyboard-help-content {
        background: linear-gradient(135deg, #1a1f36 0%, #2d3748 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 2rem;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        color: #e2e8f0;
      }
      
      .keyboard-help-content h2 {
        color: #fff;
        margin: 0 0 1.5rem 0;
        text-align: center;
      }
      
      .keyboard-shortcuts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin-bottom: 2rem;
      }
      
      .shortcut-category h3 {
        color: #4299e1;
        margin: 0 0 1rem 0;
      }
      
      .shortcut-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }
      
      .shortcut-item kbd {
        background: #4a5568;
        color: #fff;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9rem;
      }
      
      .close-help-btn {
        background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
        color: white;
        border: none;
        padding: 0.75rem 2rem;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        display: block;
        margin: 0 auto;
      }
      
      .close-help-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(229, 62, 62, 0.3);
      }
    `;
    document.head.appendChild(style);
  }

  showKeyboardHelp() {
    const helpModal = document.getElementById('keyboard-help');
    if (helpModal) {
      helpModal.setAttribute('aria-hidden', 'false');
      const closeButton = helpModal.querySelector('.close-help-btn');
      if (closeButton) {
        closeButton.focus();
      }
    }
  }

  hideKeyboardHelp() {
    const helpModal = document.getElementById('keyboard-help');
    if (helpModal) {
      helpModal.setAttribute('aria-hidden', 'true');
    }
  }

  // Public API
  enable() {
    this.options.enableKeyboardShortcuts = true;
  }

  disable() {
    this.options.enableKeyboardShortcuts = false;
  }

  announce(message) {
    this.announceToScreenReader(message);
  }

  getCurrentAction() {
    return this.keyboardState.lastAction;
  }
}

// Create global instance
window.pokerKeyboardNavigation = new PokerKeyboardNavigation({
  enableKeyboardShortcuts: true,
  enableFocusManagement: true,
  enableScreenReaderSupport: true,
  debugMode: false
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PokerKeyboardNavigation;
}
