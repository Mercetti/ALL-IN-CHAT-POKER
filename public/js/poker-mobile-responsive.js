/**
 * Mobile Responsive Design for Poker Game Overlay
 * Optimizes the poker game interface for mobile and tablet devices
 */

class PokerMobileResponsive {
  constructor(options = {}) {
    this.options = {
      mobileBreakpoint: 768,
      tabletBreakpoint: 1024,
      enableTouchGestures: true,
      enableAdaptiveLayout: true,
      enableMobileControls: true,
      ...options
    };
    
    this.isInitialized = false;
    this.currentDevice = this.detectDevice();
    this.touchSupported = 'ontouchstart' in window;
    this.gestureState = {
      isGesturing: false,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      pinchDistance: 0
    };
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // Setup responsive layout
    this.setupResponsiveLayout();
    
    // Setup touch gestures
    if (this.options.enableTouchGestures && this.touchSupported) {
      this.setupTouchGestures();
    }
    
    // Setup mobile controls
    if (this.options.enableMobileControls) {
      this.setupMobileControls();
    }
    
    // Handle device orientation changes
    this.setupOrientationHandling();
    
    // Add responsive styles
    this.addResponsiveStyles();
    
    this.isInitialized = true;
  }

  detectDevice() {
    const width = window.innerWidth;
    
    if (width < this.options.mobileBreakpoint) {
      return 'mobile';
    } else if (width < this.options.tabletBreakpoint) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  setupResponsiveLayout() {
    // Add device classes to body
    this.updateDeviceClasses();
    
    // Handle responsive table layout
    this.setupResponsiveTable();
    
    // Handle responsive player seats
    this.setupResponsiveSeats();
    
    // Handle responsive action buttons
    this.setupResponsiveActions();
  }

  updateDeviceClasses() {
    const body = document.body;
    const device = this.detectDevice();
    
    // Remove existing device classes
    body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
    
    // Add current device class
    body.classList.add(`device-${device}`);
    
    // Add orientation class for mobile/tablet
    if (device === 'mobile' || device === 'tablet') {
      const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      body.classList.remove('orientation-portrait', 'orientation-landscape');
      body.classList.add(`orientation-${orientation}`);
    }
  }

  setupResponsiveTable() {
    const tableElement = document.querySelector('.table-surface, .poker-table');
    if (!tableElement) return;
    
    // Add responsive table class
    tableElement.classList.add('responsive-table');
    
    // Adjust table scale based on device
    this.adjustTableScale(tableElement);
  }

  adjustTableScale(tableElement) {
    const device = this.detectDevice();
    let scale = 1;
    
    switch (device) {
      case 'mobile':
        scale = 0.6;
        break;
      case 'tablet':
        scale = 0.8;
        break;
      default:
        scale = 1;
    }
    
    // Apply scale with transform
    tableElement.style.transform = `scale(${scale})`;
    tableElement.style.transformOrigin = 'center center';
  }

  setupResponsiveSeats() {
    const seats = document.querySelectorAll('.seat, .player-seat');
    
    seats.forEach((seat, index) => {
      seat.classList.add('responsive-seat');
      
      // Add seat position classes for mobile layout
      this.addMobileSeatPosition(seat, index);
      
      // Make seats touch-friendly
      this.makeSeatTouchFriendly(seat);
    });
  }

  addMobileSeatPosition(seat, index) {
    // Define mobile seat positions (circular to linear layout)
    const mobilePositions = [
      'bottom-center',    // 0 - Dealer position
      'bottom-left',      // 1
      'middle-left',      // 2
      'top-left',         // 3
      'top-center',       // 4
      'top-right',        // 5
      'middle-right',     // 6
      'bottom-right'      // 7
    ];
    
    if (index < mobilePositions.length) {
      seat.setAttribute('data-mobile-position', mobilePositions[index]);
    }
  }

  makeSeatTouchFriendly(seat) {
    // Increase touch target size
    seat.style.minHeight = '44px';
    seat.style.minWidth = '44px';
    
    // Add touch feedback
    seat.addEventListener('touchstart', () => {
      seat.classList.add('touch-active');
    }, { passive: true });
    
    seat.addEventListener('touchend', () => {
      setTimeout(() => {
        seat.classList.remove('touch-active');
      }, 150);
    }, { passive: true });
  }

  setupResponsiveActions() {
    const actionContainer = document.querySelector('.action-buttons, .game-actions');
    if (!actionContainer) return;
    
    actionContainer.classList.add('responsive-actions');
    
    // Create mobile action bar
    this.createMobileActionBar(actionContainer);
  }

  createMobileActionBar(container) {
    // Check if mobile bar already exists
    if (container.querySelector('.mobile-action-bar')) return;
    
    const mobileBar = document.createElement('div');
    mobileBar.className = 'mobile-action-bar';
    
    // Move action buttons to mobile bar
    const actionButtons = container.querySelectorAll('button');
    actionButtons.forEach(button => {
      const mobileButton = button.cloneNode(true);
      mobileButton.classList.add('mobile-action-btn');
      mobileBar.appendChild(mobileButton);
    });
    
    container.appendChild(mobileBar);
  }

  setupTouchGestures() {
    const tableElement = document.querySelector('.table-surface, .poker-table');
    if (!tableElement) return;
    
    // Add touch event listeners
    tableElement.addEventListener('touchstart', (e) => {
      this.handleTouchStart(e);
    }, { passive: false });
    
    tableElement.addEventListener('touchmove', (e) => {
      this.handleTouchMove(e);
    }, { passive: false });
    
    tableElement.addEventListener('touchend', (e) => {
      this.handleTouchEnd(e);
    }, { passive: false });
  }

  handleTouchStart(event) {
    if (event.touches.length === 1) {
      // Single touch - start gesture tracking
      this.gestureState.isGesturing = true;
      this.gestureState.startX = event.touches[0].clientX;
      this.gestureState.startY = event.touches[0].clientY;
      this.gestureState.lastX = this.gestureState.startX;
      this.gestureState.lastY = this.gestureState.startY;
    } else if (event.touches.length === 2) {
      // Two fingers - pinch gesture
      this.gestureState.isGesturing = true;
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.gestureState.pinchDistance = this.getDistance(touch1, touch2);
    }
  }

  handleTouchMove(event) {
    if (!this.gestureState.isGesturing) return;
    
    event.preventDefault(); // Prevent scrolling during gestures
    
    if (event.touches.length === 1) {
      // Single touch - swipe/pan gesture
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.gestureState.lastX;
      const deltaY = touch.clientY - this.gestureState.lastY;
      
      this.handlePanGesture(deltaX, deltaY);
      
      this.gestureState.lastX = touch.clientX;
      this.gestureState.lastY = touch.clientY;
    } else if (event.touches.length === 2) {
      // Two fingers - pinch gesture
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = this.getDistance(touch1, touch2);
      
      this.handlePinchGesture(currentDistance);
      this.gestureState.pinchDistance = currentDistance;
    }
  }

  handleTouchEnd(event) {
    if (!this.gestureState.isGesturing) return;
    
    if (event.touches.length === 0) {
      // Gesture ended - check for swipe
      const deltaX = this.gestureState.lastX - this.gestureState.startX;
      const deltaY = this.gestureState.lastY - this.gestureState.startY;
      
      if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
        this.handleSwipeGesture(deltaX, deltaY);
      }
    }
    
    this.gestureState.isGesturing = false;
  }

  handlePanGesture(deltaX, deltaY) {
    // Pan gesture could be used for table rotation or view adjustment
    const tableElement = document.querySelector('.table-surface, .poker-table');
    if (tableElement) {
      const currentRotation = this.getRotation(tableElement);
      const newRotation = currentRotation + (deltaX * 0.5);
      tableElement.style.transform = `scale(${this.getScale(tableElement)}) rotate(${newRotation}deg)`;
    }
  }

  handlePinchGesture(currentDistance) {
    // Pinch gesture for zoom
    const tableElement = document.querySelector('.table-surface, .poker-table');
    if (tableElement) {
      const scale = currentDistance / this.gestureState.pinchDistance;
      const currentScale = this.getScale(tableElement);
      const newScale = Math.max(0.5, Math.min(2, currentScale * scale));
      
      tableElement.style.transform = `scale(${newScale}) rotate(${this.getRotation(tableElement)}deg)`;
    }
  }

  handleSwipeGesture(deltaX, deltaY) {
    // Handle swipe gestures for navigation
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          this.handleSwipeRight();
        } else {
          this.handleSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          this.handleSwipeDown();
        } else {
          this.handleSwipeUp();
        }
      }
    }
  }

  handleSwipeLeft() {
    // Swipe left - could show previous game view or player info
    this.announceToScreenReader('Swiped left');
  }

  handleSwipeRight() {
    // Swipe right - could show next game view or stats
    this.announceToScreenReader('Swiped right');
  }

  handleSwipeUp() {
    // Swipe up - could show game menu or options
    this.toggleMobileMenu();
  }

  handleSwipeDown() {
    // Swipe down - could dismiss current view or return to game
    this.dismissMobileView();
  }

  setupMobileControls() {
    // Create mobile control panel
    this.createMobileControlPanel();
    
    // Add mobile-specific buttons
    this.addMobileButtons();
    
    // Setup mobile betting controls
    this.setupMobileBetting();
  }

  createMobileControlPanel() {
    // Check if control panel already exists
    if (document.querySelector('.mobile-control-panel')) return;
    
    const controlPanel = document.createElement('div');
    controlPanel.className = 'mobile-control-panel';
    
    controlPanel.innerHTML = `
      <div class="mobile-controls-header">
        <h3>Game Controls</h3>
        <button class="close-controls-btn" aria-label="Close controls">×</button>
      </div>
      <div class="mobile-controls-content">
        <div class="mobile-actions">
          <button class="mobile-action-btn fold-btn" data-action="fold">
            <span class="btn-icon">🔄</span>
            <span class="btn-text">Fold</span>
          </button>
          <button class="mobile-action-btn check-btn" data-action="check">
            <span class="btn-icon">✓</span>
            <span class="btn-text">Check</span>
          </button>
          <button class="mobile-action-btn call-btn" data-action="call">
            <span class="btn-icon">📞</span>
            <span class="btn-text">Call</span>
          </button>
          <button class="mobile-action-btn raise-btn" data-action="raise">
            <span class="btn-icon">⬆️</span>
            <span class="btn-text">Raise</span>
          </button>
          <button class="mobile-action-btn allin-btn" data-action="allin">
            <span class="btn-icon">🔥</span>
            <span class="btn-text>All In</span>
          </button>
        </div>
        
        <div class="mobile-betting">
          <div class="bet-slider-container">
            <label for="mobile-bet-slider">Bet Amount</label>
            <input type="range" id="mobile-bet-slider" class="bet-slider" min="0" max="1000" step="10">
            <div class="bet-amount-display">
              <span class="bet-value">0</span>
              <span class="bet-currency">chips</span>
            </div>
          </div>
          
          <div class="quick-bet-buttons">
            <button class="quick-bet-btn" data-amount="10">10</button>
            <button class="quick-bet-btn" data-amount="25">25</button>
            <button class="quick-bet-btn" data-amount="50">50</button>
            <button class="quick-bet-btn" data-amount="100">100</button>
            <button class="quick-bet-btn" data-amount="500">500</button>
          </div>
        </div>
        
        <div class="mobile-info">
          <div class="pot-info">
            <span class="pot-label">Pot:</span>
            <span class="pot-value">0</span>
          </div>
          <div class="stack-info">
            <span class="stack-label">Your Stack:</span>
            <span class="stack-value">0</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Setup control panel interactions
    this.setupControlPanelInteractions(controlPanel);
  }

  setupControlPanelInteractions(panel) {
    // Close button
    const closeBtn = panel.querySelector('.close-controls-btn');
    closeBtn.addEventListener('click', () => {
      this.hideMobileControls();
    });
    
    // Action buttons
    const actionButtons = panel.querySelectorAll('.mobile-action-btn');
    actionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-action');
        this.performMobileAction(action);
      });
    });
    
    // Bet slider
    const betSlider = panel.querySelector('#mobile-bet-slider');
    const betValue = panel.querySelector('.bet-value');
    betSlider.addEventListener('input', () => {
      betValue.textContent = betSlider.value;
    });
    
    // Quick bet buttons
    const quickBetButtons = panel.querySelectorAll('.quick-bet-btn');
    quickBetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const amount = button.getAttribute('data-amount');
        betSlider.value = amount;
        betValue.textContent = amount;
      });
    });
  }

  addMobileButtons() {
    // Add mobile menu toggle button
    const menuToggle = document.createElement('button');
    menuToggle.className = 'mobile-menu-toggle';
    menuToggle.setAttribute('aria-label', 'Toggle game menu');
    menuToggle.innerHTML = '☰';
    
    menuToggle.addEventListener('click', () => {
      this.toggleMobileMenu();
    });
    
    // Add to overlay
    const overlay = document.querySelector('.obs-shell, .poker-overlay');
    if (overlay) {
      overlay.appendChild(menuToggle);
    }
  }

  setupMobileBetting() {
    // Enhance existing betting controls for mobile
    const betControls = document.querySelectorAll('.bet-input, .raise-input');
    betControls.forEach(input => {
      input.classList.add('mobile-bet-input');
      input.setAttribute('inputmode', 'numeric');
      input.setAttribute('pattern', '[0-9]*');
    });
  }

  toggleMobileMenu() {
    const controlPanel = document.querySelector('.mobile-control-panel');
    if (controlPanel) {
      const isVisible = controlPanel.style.display !== 'none';
      controlPanel.style.display = isVisible ? 'none' : 'flex';
      
      if (!isVisible) {
        // Update info when opening
        this.updateMobileInfo();
      }
    }
  }

  hideMobileControls() {
    const controlPanel = document.querySelector('.mobile-control-panel');
    if (controlPanel) {
      controlPanel.style.display = 'none';
    }
  }

  dismissMobileView() {
    // Dismiss any open mobile views
    this.hideMobileControls();
    
    // Could also dismiss other mobile-specific UI elements
    const mobileViews = document.querySelectorAll('.mobile-view, .mobile-modal');
    mobileViews.forEach(view => {
      view.style.display = 'none';
    });
  }

  updateMobileInfo() {
    // Update pot and stack information
    const potElement = document.querySelector('.pot-amount, .pot-value');
    const potDisplay = document.querySelector('.mobile-control-panel .pot-value');
    if (potElement && potDisplay) {
      potDisplay.textContent = potElement.textContent.trim();
    }
    
    const stackElement = document.querySelector('.player-chips, .stack-amount');
    const stackDisplay = document.querySelector('.mobile-control-panel .stack-value');
    if (stackElement && stackDisplay) {
      stackDisplay.textContent = stackElement.textContent.trim();
    }
  }

  performMobileAction(action) {
    // Perform action through existing game systems
    if (window.pokerKeyboardNavigation) {
      window.pokerKeyboardNavigation.performAction(action);
    } else if (window.client && window.client.sendAction) {
      window.client.sendAction(action);
    }
    
    // Hide controls after action
    setTimeout(() => {
      this.hideMobileControls();
    }, 500);
  }

  setupOrientationHandling() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });
    
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleOrientationChange() {
    const newDevice = this.detectDevice();
    if (newDevice !== this.currentDevice) {
      this.currentDevice = newDevice;
      this.updateDeviceClasses();
      this.adjustTableScale(document.querySelector('.table-surface, .poker-table'));
    }
  }

  handleResize() {
    const newDevice = this.detectDevice();
    if (newDevice !== this.currentDevice) {
      this.handleOrientationChange();
    }
  }

  addResponsiveStyles() {
    if (document.querySelector('#mobile-responsive-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'mobile-responsive-styles';
    style.textContent = `
      /* Device-specific styles */
      .device-mobile .obs-shell {
        font-size: 14px;
      }
      
      .device-tablet .obs-shell {
        font-size: 16px;
      }
      
      /* Responsive table */
      .responsive-table {
        transition: transform 0.3s ease;
      }
      
      /* Responsive seats */
      .responsive-seat {
        transition: all 0.3s ease;
      }
      
      /* Mobile seat positions */
      .device-mobile .responsive-seat {
        position: absolute;
        transform: scale(0.8);
      }
      
      .device-mobile .responsive-seat[data-mobile-position="bottom-center"] {
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%) scale(0.8);
      }
      
      .device-mobile .responsive-seat[data-mobile-position="bottom-left"] {
        bottom: 10px;
        left: 10px;
      }
      
      .device-mobile .responsive-seat[data-mobile-position="middle-left"] {
        left: 10px;
        top: 50%;
        transform: translateY(-50%) scale(0.8);
      }
      
      .device-mobile .responsive-seat[data-mobile-position="top-left"] {
        top: 10px;
        left: 10px;
      }
      
      .device-mobile .responsive-seat[data-mobile-position="top-center"] {
        top: 10px;
        left: 50%;
        transform: translateX(-50%) scale(0.8);
      }
      
      .device-mobile .responsive-seat[data-mobile-position="top-right"] {
        top: 10px;
        right: 10px;
      }
      
      .device-mobile .responsive-seat[data-mobile-position="middle-right"] {
        right: 10px;
        top: 50%;
        transform: translateY(-50%) scale(0.8);
      }
      
      .device-mobile .responsive-seat[data-mobile-position="bottom-right"] {
        bottom: 10px;
        right: 10px;
      }
      
      /* Touch feedback */
      .touch-active {
        transform: scale(0.95);
        opacity: 0.8;
      }
      
      /* Mobile action bar */
      .mobile-action-bar {
        display: none;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7));
        padding: 1rem;
        display: flex;
        justify-content: space-around;
        align-items: center;
        backdrop-filter: blur(10px);
        z-index: 1000;
      }
      
      .device-mobile .mobile-action-bar {
        display: flex;
      }
      
      .mobile-action-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.75rem;
        border-radius: 8px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        min-width: 60px;
      }
      
      .mobile-action-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }
      
      .mobile-action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .btn-icon {
        font-size: 1.2rem;
      }
      
      .btn-text {
        font-size: 0.7rem;
      }
      
      /* Mobile control panel */
      .mobile-control-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(10px);
        z-index: 2000;
        display: none;
        flex-direction: column;
        color: white;
      }
      
      .mobile-controls-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .close-controls-btn {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
      }
      
      .mobile-controls-content {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
      }
      
      .mobile-actions {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
      }
      
      .mobile-betting {
        margin-bottom: 2rem;
      }
      
      .bet-slider-container {
        margin-bottom: 1rem;
      }
      
      .bet-slider-container label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      
      .bet-slider {
        width: 100%;
        margin-bottom: 0.5rem;
      }
      
      .bet-amount-display {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        font-size: 1.2rem;
        font-weight: bold;
      }
      
      .quick-bet-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      
      .quick-bet-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .quick-bet-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .mobile-info {
        display: flex;
        justify-content: space-between;
        background: rgba(255, 255, 255, 0.05);
        padding: 1rem;
        border-radius: 8px;
      }
      
      .pot-info,
      .stack-info {
        text-align: center;
      }
      
      .pot-label,
      .stack-label {
        display: block;
        font-size: 0.9rem;
        opacity: 0.8;
        margin-bottom: 0.25rem;
      }
      
      .pot-value,
      .stack-value {
        font-size: 1.1rem;
        font-weight: bold;
      }
      
      /* Mobile menu toggle */
      .mobile-menu-toggle {
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.75rem;
        border-radius: 8px;
        font-size: 1.2rem;
        cursor: pointer;
        z-index: 1001;
        backdrop-filter: blur(10px);
      }
      
      /* Orientation-specific adjustments */
      .device-mobile.orientation-landscape .responsive-table {
        transform: scale(0.4) !important;
      }
      
      .device-tablet.orientation-landscape .responsive-table {
        transform: scale(0.6) !important;
      }
      
      /* Hide desktop elements on mobile */
      .device-mobile .desktop-only {
        display: none !important;
      }
      
      /* Show mobile elements */
      .mobile-only {
        display: none;
      }
      
      .device-mobile .mobile-only,
      .device-tablet .mobile-only {
        display: block;
      }
    `;
    document.head.appendChild(style);
  }

  // Utility methods
  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getRotation(element) {
    const transform = element.style.transform;
    const match = transform.match(/rotate\(([^)]+)deg\)/);
    return match ? parseFloat(match[1]) : 0;
  }

  getScale(element) {
    const transform = element.style.transform;
    const match = transform.match(/scale\(([^)]+)\)/);
    return match ? parseFloat(match[1]) : 1;
  }

  announceToScreenReader(message) {
    if (window.pokerKeyboardNavigation) {
      window.pokerKeyboardNavigation.announce(message);
    } else if (window.accessibilityManager) {
      window.accessibilityManager.announce(message);
    }
  }

  // Public API
  getCurrentDevice() {
    return this.currentDevice;
  }

  isMobile() {
    return this.currentDevice === 'mobile';
  }

  isTablet() {
    return this.currentDevice === 'tablet';
  }

  showControls() {
    this.toggleMobileMenu();
  }

  hideControls() {
    this.hideMobileControls();
  }
}

// Create global instance
window.pokerMobileResponsive = new PokerMobileResponsive({
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  enableTouchGestures: true,
  enableAdaptiveLayout: true,
  enableMobileControls: true
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PokerMobileResponsive;
}
