/**
 * Responsive Design Manager for Main Website
 * Handles mobile-first responsive layouts and touch interactions
 */

class ResponsiveManager {
  constructor(options = {}) {
    this.options = {
      mobileBreakpoint: 768,
      tabletBreakpoint: 1024,
      desktopBreakpoint: 1200,
      enableTouchSupport: true,
      enableAdaptiveLayout: true,
      ...options
    };
    
    this.isInitialized = false;
    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // Initialize responsive features
    if (this.options.enableAdaptiveLayout) {
      this.initAdaptiveLayout();
    }
    
    if (this.options.enableTouchSupport && this.touchSupported) {
      this.initTouchSupport();
    }
    
    // Handle resize events
    this.initResizeHandling();
    
    // Add responsive utilities
    this.addResponsiveUtilities();
    
    this.isInitialized = true;
  }

  getCurrentBreakpoint() {
    const width = window.innerWidth;
    
    if (width < this.options.mobileBreakpoint) {
      return 'mobile';
    } else if (width < this.options.tabletBreakpoint) {
      return 'tablet';
    } else if (width < this.options.desktopBreakpoint) {
      return 'desktop';
    } else {
      return 'large';
    }
  }

  initAdaptiveLayout() {
    // Add responsive classes to body
    this.updateBodyClasses();
    
    // Handle responsive navigation
    this.initResponsiveNavigation();
    
    // Handle responsive content
    this.initResponsiveContent();
    
    // Handle responsive images
    this.initResponsiveImages();
  }

  updateBodyClasses() {
    const body = document.body;
    const breakpoint = this.getCurrentBreakpoint();
    
    // Remove existing breakpoint classes
    body.classList.remove('breakpoint-mobile', 'breakpoint-tablet', 'breakpoint-desktop', 'breakpoint-large');
    
    // Add current breakpoint class
    body.classList.add(`breakpoint-${breakpoint}`);
    
    // Update device orientation
    if (this.touchSupported) {
      const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      body.classList.remove('orientation-portrait', 'orientation-landscape');
      body.classList.add(`orientation-${orientation}`);
    }
  }

  initResponsiveNavigation() {
    // Find navigation elements
    const navElements = document.querySelectorAll('nav, .nav, .navigation');
    
    navElements.forEach(nav => {
      // Add mobile menu toggle
      this.addMobileMenuToggle(nav);
      
      // Handle dropdown menus on mobile
      this.initMobileDropdowns(nav);
      
      // Add touch support for navigation
      if (this.touchSupported) {
        this.addNavigationTouchSupport(nav);
      }
    });
  }

  addMobileMenuToggle(nav) {
    const navId = nav.id || this.generateId(nav, 'nav');
    nav.id = navId;
    
    // Create toggle button
    const toggle = document.createElement('button');
    toggle.className = 'mobile-menu-toggle';
    toggle.setAttribute('aria-controls', navId);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = `
      <span class="hamburger">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <span class="sr-only">Toggle navigation menu</span>
    `;
    
    // Insert toggle before navigation
    nav.parentNode.insertBefore(toggle, nav);
    
    // Add toggle functionality
    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isExpanded);
      nav.classList.toggle('mobile-menu-open');
      
      // Trap focus when menu is open
      if (!isExpanded) {
        this.trapFocus(nav);
      } else {
        this.releaseFocus(nav);
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('mobile-menu-open');
      }
    });
  }

  initMobileDropdowns(nav) {
    const dropdowns = nav.querySelectorAll('.dropdown, .submenu');
    
    dropdowns.forEach(dropdown => {
      const trigger = dropdown.querySelector('a, button');
      const menu = dropdown.querySelector('.dropdown-menu, .submenu-menu');
      
      if (trigger && menu) {
        // Convert hover dropdowns to click on mobile
        trigger.addEventListener('click', (e) => {
          if (this.getCurrentBreakpoint() === 'mobile') {
            e.preventDefault();
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            trigger.setAttribute('aria-expanded', !isExpanded);
            menu.classList.toggle('mobile-dropdown-open');
          }
        });
      }
    });
  }

  initResponsiveContent() {
    // Handle responsive typography
    this.initResponsiveTypography();
    
    // Handle responsive layouts
    this.initResponsiveLayouts();
    
    // Handle responsive tables
    this.initResponsiveTables();
  }

  initResponsiveTypography() {
    // Add fluid typography
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --fluid-min-width: 320px;
        --fluid-max-width: 1200px;
        --fluid-screen: 100vw;
        --fluid-bp: calc(
          (var(--fluid-screen) - var(--fluid-min-width) / 16 * 1rem) /
          (var(--fluid-max-width) - var(--fluid-min-width))
        );
      }
      
      .fluid-text {
        font-size: calc(
          1rem + var(--fluid-bp) * 0.5
        );
      }
      
      .fluid-heading {
        font-size: calc(
          1.5rem + var(--fluid-bp) * 1
        );
      }
      
      @media (max-width: 768px) {
        .fluid-text { font-size: 0.9rem; }
        .fluid-heading { font-size: 1.2rem; }
      }
    `;
    document.head.appendChild(style);
    
    // Apply fluid typography to text elements
    const textElements = document.querySelectorAll('p, .text, .description');
    textElements.forEach(el => el.classList.add('fluid-text'));
    
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .heading');
    headingElements.forEach(el => el.classList.add('fluid-heading'));
  }

  initResponsiveLayouts() {
    // Add responsive grid utilities
    const grids = document.querySelectorAll('.grid, .layout-grid');
    
    grids.forEach(grid => {
      grid.classList.add('responsive-grid');
    });
    
    // Add responsive grid styles
    const gridStyle = document.createElement('style');
    gridStyle.textContent = `
      .responsive-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      }
      
      @media (max-width: 768px) {
        .responsive-grid {
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
      }
      
      @media (min-width: 1024px) {
        .responsive-grid {
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
      }
    `;
    document.head.appendChild(gridStyle);
  }

  initResponsiveTables() {
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
      // Wrap table in responsive container
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      
      // Add table styles
      const tableStyle = document.createElement('style');
      tableStyle.textContent = `
        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        @media (max-width: 768px) {
          .table-responsive table {
            display: block;
            white-space: nowrap;
          }
          
          .table-responsive thead,
          .table-responsive tbody,
          .table-responsive th,
          .table-responsive td,
          .table-responsive tr {
            display: block;
          }
          
          .table-responsive thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
          }
          
          .table-responsive tr {
            border: 1px solid #ccc;
            margin-bottom: 1rem;
          }
          
          .table-responsive td {
            border: none;
            border-bottom: 1px solid #eee;
            position: relative;
            padding-left: 50%;
            white-space: normal;
            text-align: left;
          }
          
          .table-responsive td:before {
            position: absolute;
            top: 6px;
            left: 6px;
            width: 45%;
            padding-right: 10px;
            white-space: nowrap;
            font-weight: bold;
            content: attr(data-label);
          }
        }
      `;
      document.head.appendChild(tableStyle);
      
      // Add data labels to cells for mobile
      const headers = table.querySelectorAll('th');
      const rows = table.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
          if (headers[index]) {
            cell.setAttribute('data-label', headers[index].textContent);
          }
        });
      });
    });
  }

  initResponsiveImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Add responsive image class
      img.classList.add('responsive-image');
      
      // Add loading optimization
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });
    
    // Add responsive image styles
    const imageStyle = document.createElement('style');
    imageStyle.textContent = `
      .responsive-image {
        max-width: 100%;
        height: auto;
        display: block;
      }
      
      @media (max-width: 768px) {
        .responsive-image {
          margin: 0 auto;
        }
      }
    `;
    document.head.appendChild(imageStyle);
  }

  initTouchSupport() {
    // Add touch event handlers
    this.initTouchGestures();
    
    // Add touch-friendly styles
    this.addTouchStyles();
    
    // Handle touch interactions
    this.initTouchInteractions();
  }

  initTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      this.handleGesture(touchStartX, touchStartY, touchEndX, touchEndY);
    }, { passive: true });
  }

  handleGesture(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
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
    // Navigate to next item (carousel, gallery, etc.)
    const carousels = document.querySelectorAll('.carousel, .gallery');
    carousels.forEach(carousel => {
      const nextBtn = carousel.querySelector('.next, .carousel-next');
      if (nextBtn) nextBtn.click();
    });
  }

  handleSwipeRight() {
    // Navigate to previous item
    const carousels = document.querySelectorAll('.carousel, .gallery');
    carousels.forEach(carousel => {
      const prevBtn = carousel.querySelector('.prev, .carousel-prev');
      if (prevBtn) prevBtn.click();
    });
  }

  handleSwipeUp() {
    // Could be used for dismissing modals or scrolling
  }

  handleSwipeDown() {
    // Could be used for refreshing content
  }

  addTouchStyles() {
    const touchStyle = document.createElement('style');
    touchStyle.textContent = `
      /* Touch-friendly tap targets */
      @media (max-width: 768px) {
        button, a, input, select, textarea {
          min-height: 44px;
          min-width: 44px;
        }
        
        .touch-target {
          padding: 12px;
        }
      }
      
      /* Touch feedback */
      .touch-feedback {
        position: relative;
        overflow: hidden;
      }
      
      .touch-feedback::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: translate(-50%, -50%);
        transition: width 0.3s, height 0.3s;
      }
      
      .touch-feedback.active::after {
        width: 200px;
        height: 200px;
      }
      
      /* Prevent zoom on input focus */
      @media (max-width: 768px) {
        input[type="text"], 
        input[type="email"], 
        input[type="password"], 
        input[type="number"],
        input[type="tel"],
        input[type="url"],
        textarea,
        select {
          font-size: 16px !important;
        }
      }
    `;
    document.head.appendChild(touchStyle);
  }

  initTouchInteractions() {
    // Add touch feedback to interactive elements
    const interactiveElements = document.querySelectorAll('button, a, .card, .panel');
    
    interactiveElements.forEach(element => {
      element.classList.add('touch-feedback');
      
      element.addEventListener('touchstart', () => {
        element.classList.add('active');
      }, { passive: true });
      
      element.addEventListener('touchend', () => {
        setTimeout(() => {
          element.classList.remove('active');
        }, 300);
      }, { passive: true });
    });
  }

  initResizeHandling() {
    let resizeTimer;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.handleResize();
      }, 250);
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleResize();
      }, 100);
    });
  }

  handleResize() {
    const newBreakpoint = this.getCurrentBreakpoint();
    
    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint;
      this.updateBodyClasses();
      this.onBreakpointChange(newBreakpoint);
    }
  }

  onBreakpointChange(breakpoint) {
    // Custom logic for breakpoint changes
    console.log(`Breakpoint changed to: ${breakpoint}`);
    
    // Close mobile menus when switching to desktop
    if (breakpoint !== 'mobile') {
      const openMenus = document.querySelectorAll('.mobile-menu-open');
      openMenus.forEach(menu => {
        menu.classList.remove('mobile-menu-open');
        const toggle = document.querySelector(`[aria-controls="${menu.id}"]`);
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  addResponsiveUtilities() {
    // Add responsive utility classes
    const utilityStyle = document.createElement('style');
    utilityStyle.textContent = `
      /* Responsive visibility utilities */
      .mobile-only { display: none; }
      .tablet-only { display: none; }
      .desktop-only { display: none; }
      
      .breakpoint-mobile .mobile-only { display: block; }
      .breakpoint-mobile .mobile-hidden { display: none; }
      
      .breakpoint-tablet .tablet-only { display: block; }
      .breakpoint-tablet .tablet-hidden { display: none; }
      
      .breakpoint-desktop .desktop-only { display: block; }
      .breakpoint-desktop .desktop-hidden { display: none; }
      
      .breakpoint-large .large-only { display: block; }
      .breakpoint-large .large-hidden { display: none; }
      
      /* Responsive spacing */
      .responsive-padding {
        padding: 1rem;
      }
      
      @media (max-width: 768px) {
        .responsive-padding { padding: 0.75rem; }
      }
      
      @media (min-width: 1024px) {
        .responsive-padding { padding: 1.5rem; }
      }
      
      /* Responsive margins */
      .responsive-margin {
        margin: 1rem;
      }
      
      @media (max-width: 768px) {
        .responsive-margin { margin: 0.75rem; }
      }
      
      @media (min-width: 1024px) {
        .responsive-margin { margin: 1.5rem; }
      }
    `;
    document.head.appendChild(utilityStyle);
  }

  // Utility methods
  generateId(element, prefix = 'element') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    
    if (firstElement) {
      firstElement.focus();
    }
  }

  releaseFocus(container) {
    // Focus restoration logic
  }

  // Public API
  getCurrentDevice() {
    return this.getCurrentBreakpoint();
  }

  isMobile() {
    return this.getCurrentBreakpoint() === 'mobile';
  }

  isTablet() {
    return this.getCurrentBreakpoint() === 'tablet';
  }

  isDesktop() {
    return this.getCurrentBreakpoint() === 'desktop' || this.getCurrentBreakpoint() === 'large';
  }

  isTouch() {
    return this.touchSupported;
  }
}

// Create global instance
window.responsiveManager = new ResponsiveManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveManager;
}
