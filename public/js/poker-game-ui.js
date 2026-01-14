/**
 * Enhanced Poker Game UI with Modern Components
 * Integrates the component library to create a polished, responsive interface
 */

class PokerGameUI {
  constructor(options = {}) {
    this.options = {
      enableAnimations: true,
      enableSoundEffects: true,
      enableVisualEffects: true,
      debugMode: false,
      ...options
    };
    
    this.isInitialized = false;
    this.components = [];
    this.animations = new Map();
    this.effects = new Map();
    
    this.init();
  }

  init() {
    // Setup component integration
    this.setupComponentIntegration();
    
    // Setup enhanced UI elements
    this.setupEnhancedUI();
    
    // Setup animations and effects
    this.setupAnimations();
    
    // Setup responsive behavior
    this.setupResponsiveBehavior();
    
    this.isInitialized = true;
  }

  setupComponentIntegration() {
    // Wait for component library to be available
    const checkLibrary = () => {
      if (window.pokerComponents) {
        this.enhanceExistingComponents();
        this.createModernComponents();
      } else {
        setTimeout(checkLibrary, 100);
      }
    };
    
    checkLibrary();
  }

  enhanceExistingComponents() {
    // Enhance existing UI elements with component library
    this.enhanceActionButtons();
    this.enhancePlayerSeats();
    this.enhanceCards();
    this.enhanceChips();
    this.enhancePotDisplay();
  }

  enhanceActionButtons() {
    // Find existing action buttons and enhance them
    const actionButtons = document.querySelectorAll('.action-btn, .game-action, button[data-action]');
    
    actionButtons.forEach(button => {
      const action = button.getAttribute('data-action') || button.textContent.trim().toLowerCase();
      
      // Create enhanced button using component library
      const enhancedButton = window.pokerComponents.render('Button', {
        variant: this.getButtonVariant(action),
        size: 'large',
        icon: this.getButtonIcon(action),
        children: this.getButtonText(action),
        onClick: (e) => {
          // Preserve original click behavior
          button.click();
        }
      });
      
      // Replace original button
      if (button.parentNode) {
        button.parentNode.replaceChild(enhancedButton, button);
      }
    });
  }

  getButtonVariant(action) {
    const variants = {
      'fold': 'secondary',
      'check': 'secondary',
      'call': 'primary',
      'raise': 'primary',
      'allin': 'primary',
      'all-in': 'primary'
    };
    
    return variants[action] || 'primary';
  }

  getButtonIcon(action) {
    const icons = {
      'fold': '🔄',
      'check': '✓',
      'call': '📞',
      'raise': '⬆️',
      'allin': '🔥',
      'all-in': '🔥'
    };
    
    return icons[action] || null;
  }

  getButtonText(action) {
    const texts = {
      'fold': 'Fold',
      'check': 'Check',
      'call': 'Call',
      'raise': 'Raise',
      'allin': 'All In',
      'all-in': 'All In'
    };
    
    return texts[action] || action.charAt(0).toUpperCase() + action.slice(1);
  }

  enhancePlayerSeats() {
    // Enhance player seats with modern components
    const seats = document.querySelectorAll('.seat, .player-seat');
    
    seats.forEach((seat, index) => {
      const playerName = seat.querySelector('.player-name, .seat-name')?.textContent;
      const playerChips = seat.querySelector('.chip-count, .player-chips')?.textContent;
      const isActive = seat.classList.contains('active', 'current-turn');
      
      // Create enhanced seat card
      const seatCard = window.pokerComponents.render('Card', {
        variant: isActive ? 'active' : 'default',
        size: 'medium',
        selected: isActive,
        disabled: !isActive
      });
      
      // Add player info
      if (playerName || playerChips) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'enhanced-seat-info';
        infoDiv.innerHTML = `
          ${playerName ? `<div class="player-name">${playerName}</div>` : ''}
          ${playerChips ? `<div class="player-chips">${playerChips}</div>` : ''}
        `;
        
        seatCard.appendChild(infoDiv);
      }
      
      // Replace seat content
      const seatContent = seat.querySelector('.avatar-wrap, .seat-content');
      if (seatContent) {
        seatContent.innerHTML = '';
        seatContent.appendChild(seatCard);
      }
      
      // Add animations
      if (isActive && this.options.enableAnimations) {
        seatCard.classList.add('seat-active-animation');
      }
    });
  }

  enhanceCards() {
    // Enhance card displays
    const cards = document.querySelectorAll('.player-card, .card');
    
    cards.forEach(card => {
      const rank = card.querySelector('.card-rank, .card-value')?.textContent;
      const suit = card.querySelector('.card-suit')?.textContent;
      const faceDown = card.classList.contains('face-down');
      
      // Create enhanced card
      const enhancedCard = window.pokerComponents.render('Card', {
        variant: 'enhanced',
        size: 'medium',
        rank: rank,
        suit: suit,
        faceDown: faceDown,
        selected: card.classList.contains('selected', 'held'),
        disabled: card.classList.contains('disabled')
      });
      
      // Replace card
      if (card.parentNode) {
        card.parentNode.replaceChild(enhancedCard, card);
      }
    });
  }

  enhanceChips() {
    // Enhance chip displays
    const chips = document.querySelectorAll('.chip, .chip-stack');
    
    chips.forEach(chip => {
      const value = parseInt(chip.textContent) || 0;
      const color = this.getChipColor(chip);
      
      // Create enhanced chip
      const enhancedChip = window.pokerComponents.render('Chip', {
        value: value,
        color: color,
        size: 'medium',
        animated: this.options.enableAnimations,
        count: chip.classList.contains('chip-stack') ? parseInt(chip.getAttribute('data-count')) || 1 : 1
      });
      
      // Replace chip
      if (chip.parentNode) {
        chip.parentNode.replaceChild(enhancedChip, chip);
      }
    });
  }

  getChipColor(chip) {
    const colors = ['blue', 'red', 'green', 'black', 'white', 'purple'];
    const classList = chip.className.toLowerCase();
    
    for (const color of colors) {
      if (classList.includes(color)) {
        return color;
      }
    }
    
    return 'blue'; // default color
  }

  enhancePotDisplay() {
    // Enhance pot display
    const potElements = document.querySelectorAll('.pot-amount, .pot-value');
    
    potElements.forEach(potElement => {
      const value = parseInt(potElement.textContent) || 0;
      
      // Create enhanced pot display
      const potDisplay = document.createElement('div');
      potDisplay.className = 'enhanced-pot-display';
      
      // Add pot icon
      const potIcon = document.createElement('div');
      potIcon.className = 'pot-icon';
      potIcon.innerHTML = '🏆';
      
      // Add pot value
      const potValue = document.createElement('div');
      potValue.className = 'pot-value';
      potValue.textContent = this.formatCurrency(value);
      
      potDisplay.appendChild(potIcon);
      potDisplay.appendChild(potValue);
      
      // Replace pot element
      if (potElement.parentNode) {
        potElement.parentNode.replaceChild(potDisplay, potElement);
      }
    });
  }

  createModernComponents() {
    // Create new modern UI components
    this.createGameStatusPanel();
    this.createPlayerInfoPanel();
    this.createActionHistoryPanel();
    this.createQuickActionsPanel();
  }

  createGameStatusPanel() {
    // Check if panel already exists
    if (document.querySelector('.game-status-panel')) return;
    
    const statusPanel = document.createElement('div');
    statusPanel.className = 'game-status-panel';
    statusPanel.innerHTML = `
      <div class="status-header">
        <h3>Game Status</h3>
        <div class="status-indicators">
          <div class="status-indicator connection-status">
            <span class="indicator-dot"></span>
            <span class="indicator-text">Connected</span>
          </div>
          <div class="status-indicator phase-status">
            <span class="indicator-dot"></span>
            <span class="indicator-text">Waiting</span>
          </div>
        </div>
      </div>
      <div class="status-content">
        <div class="status-item">
          <span class="status-label">Phase:</span>
          <span class="status-value" id="status-phase">Waiting</span>
        </div>
        <div class="status-item">
          <span class="status-label">Players:</span>
          <span class="status-value" id="status-players">0</span>
        </div>
        <div class="status-item">
          <span class="status-label">Pot:</span>
          <span class="status-value" id="status-pot">$0</span>
        </div>
      </div>
    `;
    
    // Add to overlay
    const overlay = document.querySelector('.obs-shell, .poker-overlay');
    if (overlay) {
      overlay.appendChild(statusPanel);
    }
    
    // Setup status updates
    this.setupStatusUpdates(statusPanel);
  }

  createPlayerInfoPanel() {
    // Check if panel already exists
    if (document.querySelector('.player-info-panel')) return;
    
    const infoPanel = document.createElement('div');
    infoPanel.className = 'player-info-panel';
    infoPanel.innerHTML = `
      <div class="info-header">
        <h3>Your Info</h3>
        <button class="toggle-panel-btn" aria-label="Toggle panel">▼</button>
      </div>
      <div class="info-content">
        <div class="info-item">
          <span class="info-label">Stack:</span>
          <span class="info-value" id="info-stack">$0</span>
        </div>
        <div class="info-item">
          <span class="info-label">Position:</span>
          <span class="info-value" id="info-position">Waiting</span>
        </div>
        <div class="info-item">
          <span class="info-label">Cards:</span>
          <span class="info-value" id="info-cards">0</span>
        </div>
        <div class="info-item">
          <span class="info-label">Last Action:</span>
          <span class="info-value" id="info-last-action">None</span>
        </div>
      </div>
    `;
    
    // Add to overlay
    const overlay = document.querySelector('.obs-shell, .poker-overlay');
    if (overlay) {
      overlay.appendChild(infoPanel);
    }
    
    // Setup info updates
    this.setupInfoUpdates(infoPanel);
  }

  createActionHistoryPanel() {
    // Check if panel already exists
    if (document.querySelector('.action-history-panel')) return;
    
    const historyPanel = document.createElement('div');
    historyPanel.className = 'action-history-panel';
    historyPanel.innerHTML = `
      <div class="history-header">
        <h3>Action History</h3>
        <button class="clear-history-btn" aria-label="Clear history">Clear</button>
      </div>
      <div class="history-content">
        <div class="history-list" id="history-list">
          <div class="history-empty">No actions yet</div>
        </div>
      </div>
    `;
    
    // Add to overlay
    const overlay = document.querySelector('.obs-shell, .poker-overlay');
    if (overlay) {
      overlay.appendChild(historyPanel);
    }
    
    // Setup history updates
    this.setupHistoryUpdates(historyPanel);
  }

  createQuickActionsPanel() {
    // Check if panel already exists
    if (document.querySelector('.quick-actions-panel')) return;
    
    const quickActionsPanel = document.createElement('div');
    quickActionsPanel.className = 'quick-actions-panel';
    quickActionsPanel.innerHTML = `
      <div class="quick-actions-header">
        <h3>Quick Actions</h3>
      </div>
      <div class="quick-actions-content">
        <div class="quick-action-group">
          <button class="quick-action-btn" data-action="fold">Fold</button>
          <button class="quick-action-btn" data-action="check">Check</button>
          <button class="quick-action-btn" data-action="call">Call</button>
        </div>
        <div class="quick-action-group">
          <button class="quick-action-btn" data-action="raise">Raise</button>
          <button class="quick-action-btn" data-action="allin">All In</button>
        </div>
      </div>
    `;
    
    // Add to overlay
    const overlay = document.querySelector('.obs-shell, .poker-overlay');
    if (overlay) {
      overlay.appendChild(quickActionsPanel);
    }
    
    // Setup quick action handlers
    this.setupQuickActions(quickActionsPanel);
  }

  setupStatusUpdates(statusPanel) {
    // Subscribe to real-time updates
    if (window.pokerRealtimeUpdates) {
      window.pokerRealtimeUpdates.subscribe('phase', (data) => {
        const phaseElement = statusPanel.querySelector('#status-phase');
        if (phaseElement) {
          phaseElement.textContent = this.formatPhase(data.phase);
        }
      });
      
      window.pokerRealtimeUpdates.subscribe('pot', (data) => {
        const potElement = statusPanel.querySelector('#status-pot');
        if (potElement) {
          potElement.textContent = this.formatCurrency(data.amount);
        }
      });
    }
  }

  setupInfoUpdates(infoPanel) {
    // Subscribe to player updates
    if (window.pokerRealtimeUpdates) {
      window.pokerRealtimeUpdates.subscribe('player', (data) => {
        // Update if it's the current player
        const stackElement = infoPanel.querySelector('#info-stack');
        const positionElement = infoPanel.querySelector('#info-position');
        const cardsElement = infoPanel.querySelector('#info-cards');
        
        if (stackElement && data.player.stack) {
          stackElement.textContent = this.formatCurrency(data.player.stack);
        }
        
        if (positionElement && data.player.position) {
          positionElement.textContent = this.formatPosition(data.player.position);
        }
        
        if (cardsElement && data.player.cards) {
          cardsElement.textContent = data.player.cards.length;
        }
      });
      
      window.pokerRealtimeUpdates.subscribe('action', (data) => {
        const lastActionElement = infoPanel.querySelector('#info-last-action');
        if (lastActionElement) {
          lastActionElement.textContent = this.formatAction(data.action);
        }
      });
    }
  }

  setupHistoryUpdates(historyPanel) {
    // Subscribe to action updates
    if (window.pokerRealtimeUpdates) {
      window.pokerRealtimeUpdates.subscribe('action', (data) => {
        this.addHistoryItem(historyPanel, data);
      });
    }
    
    // Setup clear button
    const clearButton = historyPanel.querySelector('.clear-history-btn');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.clearHistory(historyPanel);
      });
    }
  }

  setupQuickActions(panel) {
    const quickButtons = panel.querySelectorAll('.quick-action-btn');
    
    quickButtons.forEach(button => {
      const action = button.getAttribute('data-action');
      
      button.addEventListener('click', () => {
        if (window.pokerKeyboardNavigation) {
          window.pokerKeyboardNavigation.performAction(action);
        } else if (window.client && window.client.sendAction) {
          window.client.sendAction(action);
        }
      });
    });
  }

  addHistoryItem(panel, data) {
    const historyList = panel.querySelector('#history-list');
    const historyEmpty = historyList.querySelector('.history-empty');
    
    // Remove empty message if present
    if (historyEmpty) {
      historyEmpty.remove();
    }
    
    // Create history item
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-action">${this.formatAction(data.action)}</div>
      <div class="history-player">${data.action.player || 'Unknown'}</div>
      <div class="history-time">${new Date(data.action.timestamp).toLocaleTimeString()}</div>
    `;
    
    // Add to top of list
    historyList.insertBefore(historyItem, historyList.firstChild);
    
    // Keep only last 10 items
    const items = historyList.querySelectorAll('.history-item');
    if (items.length > 10) {
      items[items.length - 1].remove();
    }
  }

  clearHistory(panel) {
    const historyList = panel.querySelector('#history-list');
    historyList.innerHTML = '<div class="history-empty">No actions yet</div>';
  }

  setupAnimations() {
    // Setup card animations
    this.setupCardAnimations();
    
    // Setup chip animations
    this.setupChipAnimations();
    
    // Setup pot animations
    this.setupPotAnimations();
  }

  setupCardAnimations() {
    // Card deal animation
    const cardDealKeyframes = `
      @keyframes cardDeal {
        0% {
          transform: translateY(-100px) rotate(180deg) scale(0);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          transform: translateY(0) rotate(0deg) scale(1);
          opacity: 1;
        }
      }
    `;
    
    this.addAnimationStyles('cardDeal', cardDealKeyframes);
    
    // Apply animation to new cards
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.classList && node.classList.contains('poker-card')) {
            node.style.animation = 'cardDeal 0.5s ease-out';
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  setupChipAnimations() {
    // Chip stack animation
    const chipStackKeyframes = `
      @keyframes chipStack {
        0% {
          transform: translateY(-20px);
          opacity: 0;
        }
        100% {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    
    this.addAnimationStyles('chipStack', chipStackKeyframes);
    
    // Apply animation to chip stacks
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.classList && node.classList.contains('poker-chip')) {
            node.style.animation = 'chipStack 0.3s ease-out';
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  setupPotAnimations() {
    // Pot increase animation
    const potIncreaseKeyframes = `
      @keyframes potIncrease {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
        }
      }
    `;
    
    this.addAnimationStyles('potIncrease', potIncreaseKeyframes);
    
    // Monitor pot changes
    let lastPotValue = 0;
    setInterval(() => {
      const currentPot = window.pokerRealtimeUpdates?.getPot() || 0;
      if (currentPot > lastPotValue) {
        this.animatePotIncrease();
      }
      lastPotValue = currentPot;
    }, 1000);
  }

  animatePotIncrease() {
    const potDisplays = document.querySelectorAll('.enhanced-pot-display, .pot-amount, .pot-value');
    
    potDisplays.forEach(display => {
      display.style.animation = 'potIncrease 0.3s ease-out';
    });
  }

  setupEffects() {
    // Setup visual effects
    this.setupGlowEffects();
    this.setupParticleEffects();
    this.setupRippleEffects();
  }

  setupGlowEffects() {
    // Add glow to active elements
    const glowStyles = `
      .poker-card--selected {
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
      }
      
      .poker-button:hover:not(:disabled) {
        box-shadow: 0 0 15px rgba(37, 99, 235, 0.4);
      }
      
      .seat-active-animation {
        animation: seatGlow 2s ease-in-out infinite;
      }
      
      @keyframes seatGlow {
        0%, 100% {
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
        }
        50% {
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
        }
      }
    `;
    
    this.addAnimationStyles('glow', glowStyles);
  }

  setupParticleEffects() {
    // Create particle effects for wins
    this.createParticleEffect = (x, y, type = 'win') => {
      const particle = document.createElement('div');
      particle.className = `particle particle-${type}`;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      
      document.body.appendChild(particle);
      
      // Animate and remove
      particle.style.animation = 'particleFloat 2s ease-out forwards';
      
      setTimeout(() => {
        particle.remove();
      }, 2000);
    };
    
    const particleKeyframes = `
      @keyframes particleFloat {
        0% {
          transform: translateY(0) scale(0);
          opacity: 1;
        }
        50% {
          transform: translateY(-20px) scale(1);
          opacity: 0.8;
        }
        100% {
          transform: translateY(-40px) scale(0.5);
          opacity: 0;
        }
      }
    `;
    
    this.addAnimationStyles('particle', particleKeyframes);
  }

  setupRippleEffects() {
    // Add ripple effect to clickable elements
    const rippleStyles = `
      .poker-button, .poker-card {
        position: relative;
        overflow: hidden;
      }
      
      .poker-button::before,
      .poker-card::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
      }
      
      .poker-button:active::before,
      .poker-card:active::before {
        width: 300px;
        height: 300px;
      }
    `;
    
    this.addAnimationStyles('ripple', rippleStyles);
  }

  setupResponsiveBehavior() {
    // Handle responsive layout changes
    this.handleResponsiveLayout();
    
    // Monitor window resize
    window.addEventListener('resize', () => {
      this.handleResponsiveLayout();
    });
  }

  handleResponsiveLayout() {
    const width = window.innerWidth;
    
    // Adjust component sizes based on screen size
    if (width < 768) {
      this.enableMobileLayout();
    } else if (width < 1024) {
      this.enableTabletLayout();
    } else {
      this.enableDesktopLayout();
    }
  }

  enableMobileLayout() {
    // Mobile-specific adjustments
    document.body.classList.add('mobile-layout');
    document.body.classList.remove('tablet-layout', 'desktop-layout');
    
    // Hide or adjust panels
    this.adjustPanelsForMobile();
  }

  enableTabletLayout() {
    // Tablet-specific adjustments
    document.body.classList.add('tablet-layout');
    document.body.classList.remove('mobile-layout', 'desktop-layout');
    
    // Adjust panels
    this.adjustPanelsForTablet();
  }

  enableDesktopLayout() {
    // Desktop-specific adjustments
    document.body.classList.add('desktop-layout');
    document.body.classList.remove('mobile-layout', 'tablet-layout');
    
    // Show all panels
    this.showAllPanels();
  }

  adjustPanelsForMobile() {
    const panels = document.querySelectorAll('.game-status-panel, .player-info-panel, .action-history-panel, .quick-actions-panel');
    
    panels.forEach(panel => {
      panel.classList.add('mobile-panel');
    });
  }

  adjustPanelsForTablet() {
    const panels = document.querySelectorAll('.game-status-panel, .player-info-panel, .action-history-panel, .quick-actions-panel');
    
    panels.forEach(panel => {
      panel.classList.add('tablet-panel');
    });
  }

  showAllPanels() {
    const panels = document.querySelectorAll('.game-status-panel, .player-info-panel, .action-history-panel, .quick-actions-panel');
    
    panels.forEach(panel => {
      panel.classList.remove('mobile-panel', 'tablet-panel');
    });
  }

  // Utility methods
  addAnimationStyles(name, styles) {
    if (document.querySelector(`#animation-styles-${name}`)) return;
    
    const style = document.createElement('style');
    style.id = `animation-styles-${name}`;
    style.textContent = styles;
    document.head.appendChild(style);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatPhase(phase) {
    const phases = {
      'waiting': 'Waiting',
      'preflop': 'Pre-Flop',
      'flop': 'Flop',
      'turn': 'Turn',
      'river': 'River',
      'showdown': 'Showdown'
    };
    
    return phases[phase] || phase;
  }

  formatPosition(position) {
    const positions = {
      0: 'Button',
      1: 'Small Blind',
      2: 'Big Blind',
      3: 'Under the Gun',
      4: 'Middle Position',
      5: 'Middle Position',
      6: 'Middle Position',
      7: 'Cutoff'
    };
    
    return positions[position] || `Position ${position}`;
  }

  formatAction(action) {
    if (typeof action === 'string') {
      return action.charAt(0).toUpperCase() + action.slice(1);
    }
    
    return action.type ? action.type.charAt(0).toUpperCase() + action.type.slice(1) : 'Action';
  }

  // Public API
  createComponent(componentName, props, container) {
    return window.pokerComponents.render(componentName, props, container);
  }

  addEffect(element, effectType, options = {}) {
    switch (effectType) {
      case 'particles':
        if (options.x && options.y) {
          this.createParticleEffect(options.x, options.y, options.type);
        }
        break;
      case 'glow':
        element.classList.add('glow-effect');
        break;
      case 'ripple':
        element.classList.add('ripple-effect');
        break;
    }
  }

  removeEffect(element, effectType) {
    switch (effectType) {
      case 'glow':
        element.classList.remove('glow-effect');
        break;
      case 'ripple':
        element.classList.remove('ripple-effect');
        break;
    }
  }

  updateTheme(themeName) {
    if (window.pokerComponents) {
      window.pokerComponents.setTheme(themeName);
    }
  }

  destroy() {
    // Clean up animations
    this.animations.clear();
    this.effects.clear();
    
    // Remove components
    this.components.forEach(component => {
      if (component.remove) {
        component.remove();
      }
    });
    this.components = [];
  }
}

// Create global instance
window.pokerGameUI = new PokerGameUI({
  enableAnimations: true,
  enableSoundEffects: true,
  enableVisualEffects: true,
  debugMode: false
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PokerGameUI;
}
