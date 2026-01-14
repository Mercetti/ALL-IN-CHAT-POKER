/**
 * Micro-interactions to Main Website
 * Implements subtle animations and interactions for enhanced user experience
 */

class WebsiteMicroInteractions {
  constructor(options = {}) {
    this.options = {
      enableHoverEffects: true,
      enableClickEffects: true,
      enableScrollEffects: true,
      enableFocusEffects: true,
      enableLoadingEffects: true,
      enableFormEffects: true,
      enableNavigationEffects: true,
      enableCardEffects: true,
      enableButtonEffects: true,
      enableImageEffects: true,
      enableTextEffects: true,
      enableParallax: false,
      enableReducedMotion: true,
      animationDuration: 300,
      easingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      ...options
    };
    
    this.isInitialized = false;
    this.interactions = new Map();
    this.observers = new Set();
    this.animationFrames = new Map();
    this.isReducedMotion = false;
    
    this.init();
  }

  init() {
    // Check for reduced motion preference
    this.checkReducedMotion();
    
    // Setup CSS styles
    this.setupStyles();
    
    // Setup interaction observers
    this.setupObservers();
    
    // Setup micro-interactions
    this.setupHoverEffects();
    this.setupClickEffects();
    this.setupScrollEffects();
    this.setupFocusEffects();
    this.setupLoadingEffects();
    this.setupFormEffects();
    this.setupNavigationEffects();
    this.setupCardEffects();
    this.setupButtonEffects();
    this.setupImageEffects();
    this.setupTextEffects();
    
    // Setup global API
    this.setupGlobalAPI();
    
    // Setup event listeners
    this.setupEventListeners();
    
    this.isInitialized = true;
  }

  checkReducedMotion() {
    if (this.options.enableReducedMotion && window.matchMedia) {
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.isReducedMotion = reducedMotionQuery.matches;
      
      reducedMotionQuery.addListener((e) => {
        this.isReducedMotion = e.matches;
        if (this.isReducedMotion) {
          this.disableAnimations();
        } else {
          this.enableAnimations();
        }
      });
    }
  }

  setupStyles() {
    const styleId = 'micro-interactions-styles';
    
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Base Micro-interaction Styles */
      .micro-interaction {
        position: relative;
        overflow: hidden;
        transition: transform ${this.options.animationDuration}ms ${this.options.easingFunction},
                    box-shadow ${this.options.animationDuration}ms ${this.options.easingFunction},
                    background-color ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      /* Hover Effects */
      .hover-lift {
        transition: transform ${this.options.animationDuration}ms ${this.options.easingFunction},
                    box-shadow ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .hover-lift:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }
      
      .hover-scale {
        transition: transform ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .hover-scale:hover {
        transform: scale(1.05);
      }
      
      .hover-rotate {
        transition: transform ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .hover-rotate:hover {
        transform: rotate(5deg);
      }
      
      .hover-glow {
        transition: box-shadow ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .hover-glow:hover {
        box-shadow: 0 0 20px rgba(0, 123, 255, 0.5);
      }
      
      .hover-color-shift {
        transition: color ${this.options.animationDuration}ms ${this.options.easingFunction},
                    background-color ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      /* Ripple Effect */
      .ripple-container {
        position: relative;
        overflow: hidden;
      }
      
      .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
      }
      
      @keyframes ripple-animation {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
      
      /* Click Effects */
      .click-bounce {
        animation: bounce 0.3s ease-out;
      }
      
      @keyframes bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(0.95); }
      }
      
      .click-pulse {
        animation: pulse 0.3s ease-out;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      
      /* Focus Effects */
      .focus-ring {
        transition: box-shadow ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .focus-ring:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
      }
      
      .focus-underline {
        position: relative;
        transition: color ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .focus-underline::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background: currentColor;
        transition: width ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .focus-underline:focus::after {
        width: 100%;
      }
      
      /* Loading Effects */
      .loading-shimmer {
        position: relative;
        overflow: hidden;
      }
      
      .loading-shimmer::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        animation: shimmer 1.5s infinite;
      }
      
      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
      }
      
      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      /* Card Effects */
      .card-3d {
        transform-style: preserve-3d;
        transition: transform ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .card-3d:hover {
        transform: rotateY(10deg) rotateX(-10deg);
      }
      
      .card-flip {
        transform-style: preserve-3d;
        transition: transform ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .card-flip.flipped {
        transform: rotateY(180deg);
      }
      
      /* Button Effects */
      .btn-slide {
        position: relative;
        overflow: hidden;
        transition: color ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .btn-slide::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .btn-slide:hover::before {
        left: 100%;
      }
      
      .btn-fill {
        position: relative;
        overflow: hidden;
        transition: color ${this.options.animationDuration}ms ${this.options.easingFunction},
                    background-color ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .btn-fill::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
        transition: width ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .btn-fill:hover::before {
        width: 100%;
      }
      
      /* Image Effects */
      .img-zoom {
        overflow: hidden;
        transition: transform ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .img-zoom:hover img {
        transform: scale(1.1);
      }
      
      .img-grayscale {
        transition: filter ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .img-grayscale:hover {
        filter: grayscale(0%);
      }
      
      .img-blur {
        transition: filter ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .img-blur:hover {
        filter: blur(0);
      }
      
      /* Text Effects */
      .text-gradient {
        background: linear-gradient(45deg, #007bff, #28a745);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        transition: background-position ${this.options.animationDuration}ms ${this.options.easingFunction};
        background-size: 200% 200%;
      }
      
      .text-gradient:hover {
        background-position: 100% 0;
      }
      
      .text-typewriter {
        overflow: hidden;
        border-right: 2px solid;
        white-space: nowrap;
        animation: typing 3s steps(40, end), blink 0.75s step-end infinite;
      }
      
      @keyframes typing {
        from { width: 0; }
        to { width: 100%; }
      }
      
      @keyframes blink {
        from, to { border-color: transparent; }
        50% { border-color: currentColor; }
      }
      
      /* Scroll Effects */
      .scroll-fade-in {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity ${this.options.animationDuration}ms ${this.options.easingFunction},
                    transform ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .scroll-fade-in.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      .scroll-slide-left {
        opacity: 0;
        transform: translateX(-50px);
        transition: opacity ${this.options.animationDuration}ms ${this.options.easingFunction},
                    transform ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .scroll-slide-left.visible {
        opacity: 1;
        transform: translateX(0);
      }
      
      .scroll-slide-right {
        opacity: 0;
        transform: translateX(50px);
        transition: opacity ${this.options.animationDuration}ms ${this.options.easingFunction},
                    transform ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .scroll-slide-right.visible {
        opacity: 1;
        transform: translateX(0);
      }
      
      /* Navigation Effects */
      .nav-underline {
        position: relative;
        transition: color ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .nav-underline::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        width: 0;
        height: 2px;
        background: currentColor;
        transition: width ${this.options.animationDuration}ms ${this.options.easingFunction},
                    left ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      .nav-underline:hover::after,
      .nav-underline.active::after {
        width: 100%;
        left: 0;
      }
      
      /* Form Effects */
      .form-float-label {
        position: relative;
      }
      
      .form-float-label input:focus + label,
      .form-float-label input:not(:placeholder-shown) + label,
      .form-float-label textarea:focus + label,
      .form-float-label textarea:not(:placeholder-shown) + label {
        transform: translateY(-25px) scale(0.8);
        color: var(--color-primary);
      }
      
      .form-float-label label {
        position: absolute;
        top: 12px;
        left: 12px;
        transition: transform ${this.options.animationDuration}ms ${this.options.easingFunction},
                    color ${this.options.animationDuration}ms ${this.options.easingFunction};
        pointer-events: none;
      }
      
      /* Parallax Effect */
      .parallax {
        transform: translateZ(0);
        will-change: transform;
      }
      
      /* Reduced Motion Support */
      @media (prefers-reduced-motion: reduce) {
        .micro-interaction,
        .hover-lift,
        .hover-scale,
        .hover-rotate,
        .hover-glow,
        .hover-color-shift,
        .click-bounce,
        .click-pulse,
        .focus-ring,
        .focus-underline,
        .card-3d,
        .card-flip,
        .btn-slide,
        .btn-fill,
        .img-zoom,
        .img-grayscale,
        .img-blur,
        .text-gradient,
        .scroll-fade-in,
        .scroll-slide-left,
        .scroll-slide-right,
        .nav-underline,
        .form-float-label label {
          transition: none;
          animation: none;
          transform: none;
        }
        
        .hover-lift:hover,
        .hover-scale:hover,
        .hover-rotate:hover,
        .hover-glow:hover,
        .click-bounce,
        .click-pulse,
        .card-3d:hover,
        .card-flip.flipped,
        .img-zoom:hover img {
          transform: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  setupObservers() {
    // Intersection Observer for scroll effects
    if ('IntersectionObserver' in window) {
      this.scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            entry.target.classList.remove('visible');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });
    }
  }

  setupHoverEffects() {
    if (!this.options.enableHoverEffects || this.isReducedMotion) {
      return;
    }
    
    // Add hover classes to elements
    this.addHoverClass('.btn', 'hover-lift');
    this.addHoverClass('.card', 'hover-lift');
    this.addHoverClass('.nav-link', 'hover-color-shift');
    this.addHoverClass('.badge', 'hover-scale');
    this.addHoverClass('.alert', 'hover-glow');
    this.addHoverClass('.progress', 'hover-glow');
    
    // Setup ripple effects
    this.setupRippleEffects();
  }

  setupClickEffects() {
    if (!this.options.enableClickEffects || this.isReducedMotion) {
      return;
    }
    
    // Add click effects to buttons
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.btn, .click-effect');
      if (button) {
        this.addClickEffect(button);
      }
    });
  }

  setupScrollEffects() {
    if (!this.options.enableScrollEffects || this.isReducedMotion) {
      return;
    }
    
    // Add scroll classes to elements
    this.addScrollClass('.fade-in', 'scroll-fade-in');
    this.addScrollClass('.slide-left', 'scroll-slide-left');
    this.addScrollClass('.slide-right', 'scroll-slide-right');
    
    // Setup parallax effect
    if (this.options.enableParallax) {
      this.setupParallaxEffect();
    }
  }

  setupFocusEffects() {
    if (!this.options.enableFocusEffects) {
      return;
    }
    
    // Add focus classes to form elements
    this.addFocusClass('.form-control', 'focus-ring');
    this.addFocusClass('.btn', 'focus-ring');
    this.addFocusClass('.nav-link', 'focus-underline');
  }

  setupLoadingEffects() {
    if (!this.options.enableLoadingEffects) {
      return;
    }
    
    // Add loading classes to elements
    this.addLoadingClass('.loading', 'loading-shimmer');
    this.addLoadingClass('.skeleton', 'loading-skeleton');
  }

  setupFormEffects() {
    if (!this.options.enableFormEffects) {
      return;
    }
    
    // Setup floating labels
    document.querySelectorAll('.form-float').forEach(element => {
      this.setupFloatingLabel(element);
    });
    
    // Setup form validation effects
    this.setupFormValidation();
  }

  setupNavigationEffects() {
    if (!this.options.enableNavigationEffects) {
      return;
    }
    
    // Add navigation effects
    this.addNavigationClass('.nav-link', 'nav-underline');
    this.addNavigationClass('.dropdown-toggle', 'hover-color-shift');
    
    // Setup mobile menu animations
    this.setupMobileMenu();
  }

  setupCardEffects() {
    if (!this.options.enableCardEffects || this.isReducedMotion) {
      return;
    }
    
    // Add card effects
    this.addCardClass('.card-3d', 'card-3d');
    this.addCardClass('.card-flip', 'card-flip');
    
    // Setup card flip functionality
    document.querySelectorAll('.card-flip').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('flipped');
      });
    });
  }

  setupButtonEffects() {
    if (!this.options.enableButtonEffects) {
      return;
    }
    
    // Add button effects
    this.addButtonClass('.btn-slide', 'btn-slide');
    this.addButtonClass('.btn-fill', 'btn-fill');
    this.addButtonClass('.btn-gradient', 'text-gradient');
  }

  setupImageEffects() {
    if (!this.options.enableImageEffects || this.isReducedMotion) {
      return;
    }
    
    // Add image effects
    this.addImageClass('.img-zoom', 'img-zoom');
    this.addImageClass('.img-grayscale', 'img-grayscale');
    this.addImageClass('.img-blur', 'img-blur');
    
    // Setup lazy loading images
    this.setupLazyImages();
  }

  setupTextEffects() {
    if (!this.options.enableTextEffects) {
      return;
    }
    
    // Add text effects
    this.addTextClass('.text-gradient', 'text-gradient');
    this.addTextClass('.text-typewriter', 'text-typewriter');
    
    // Setup typewriter effect
    document.querySelectorAll('.text-typewriter').forEach(element => {
      this.setupTypewriter(element);
    });
  }

  setupRippleEffects() {
    document.addEventListener('click', (e) => {
      const rippleContainer = e.target.closest('.ripple-container, .btn');
      if (rippleContainer) {
        this.createRipple(rippleContainer, e);
      }
    });
  }

  createRipple(container, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    container.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  addClickEffect(element) {
    element.classList.add('click-bounce');
    setTimeout(() => {
      element.classList.remove('click-bounce');
    }, 300);
  }

  addHoverClass(selector, className) {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.add(className);
    });
  }

  addScrollClass(selector, className) {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.add(className);
      if (this.scrollObserver) {
        this.scrollObserver.observe(element);
      }
    });
  }

  addFocusClass(selector, className) {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.add(className);
    });
  }

  addLoadingClass(selector, className) {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.add(className);
    });
  }

  addNavigationClass(selector, className) {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.add(className);
    });
  }

  addCardClass(selector, className) {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.add(className);
    });
  }

  addButtonClass(selector, className) {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.add(className);
    });
  }

  addImageClass(selector, className) {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.add(className);
    });
  }

  addTextClass(selector, className) {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.add(className);
    });
  }

  setupFloatingLabel(element) {
    const input = element.querySelector('input, textarea');
    const label = element.querySelector('label');
    
    if (input && label) {
      element.classList.add('form-float-label');
    }
  }

  setupFormValidation() {
    document.querySelectorAll('.form-control').forEach(input => {
      input.addEventListener('blur', () => {
        if (input.validity.valid) {
          input.classList.remove('is-invalid');
          input.classList.add('is-valid');
        } else {
          input.classList.remove('is-valid');
          input.classList.add('is-invalid');
        }
      });
    });
  }

  setupMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuToggle && mobileMenu) {
      mobileMenuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        mobileMenuToggle.classList.toggle('active');
      });
    }
  }

  setupLazyImages() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.classList.add('lazy');
        imageObserver.observe(img);
      });
    }
  }

  setupTypewriter(element) {
    const text = element.textContent;
    element.textContent = '';
    let index = 0;
    
    const type = () => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, 100);
      }
    };
    
    type();
  }

  setupParallaxEffect() {
    let ticking = false;
    
    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      
      document.querySelectorAll('.parallax').forEach(element => {
        const speed = element.dataset.speed || 0.5;
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
      
      ticking = false;
    };
    
    const requestTick = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', requestTick);
  }

  setupEventListeners() {
    // Listen for theme changes
    document.addEventListener('themechange', () => {
      this.reapplyEffects();
    });
    
    // Listen for dynamic content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          this.applyEffectsToNewNodes(mutation.addedNodes);
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  applyEffectsToNewNodes(nodes) {
    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Apply hover effects
        if (node.matches && node.matches('.btn')) {
          node.classList.add('hover-lift');
        }
        
        // Apply focus effects
        if (node.matches && node.matches('.form-control')) {
          node.classList.add('focus-ring');
        }
        
        // Apply to child elements
        node.querySelectorAll('.btn').forEach(btn => {
          btn.classList.add('hover-lift');
        });
        
        node.querySelectorAll('.form-control').forEach(input => {
          input.classList.add('focus-ring');
        });
      }
    });
  }

  reapplyEffects() {
    // Reapply all effects when theme changes
    this.setupHoverEffects();
    this.setupFocusEffects();
    this.setupNavigationEffects();
  }

  disableAnimations() {
    document.body.classList.add('reduced-motion');
  }

  enableAnimations() {
    document.body.classList.remove('reduced-motion');
  }

  setupGlobalAPI() {
    // Global micro-interactions API
    window.websiteMicroInteractions = {
      addHoverEffect: (element, className) => this.addHoverEffect(element, className),
      addClickEffect: (element) => this.addClickEffect(element),
      addRippleEffect: (container, event) => this.createRipple(container, event),
      createTypewriter: (element, text, speed = 100) => this.createTypewriter(element, text, speed),
      addScrollEffect: (element, className) => this.addScrollEffect(element, className),
      addParallax: (element, speed = 0.5) => this.addParallax(element, speed),
      disableAnimations: () => this.disableAnimations(),
      enableAnimations: () => this.enableAnimations(),
      isReducedMotion: () => this.isReducedMotion
    };
  }

  addHoverEffect(element, className) {
    if (typeof element === 'string') {
      document.querySelectorAll(element).forEach(el => {
        el.classList.add(className);
      });
    } else {
      element.classList.add(className);
    }
  }

  addScrollEffect(element, className) {
    if (typeof element === 'string') {
      document.querySelectorAll(element).forEach(el => {
        el.classList.add(className);
        if (this.scrollObserver) {
          this.scrollObserver.observe(el);
        }
      });
    } else {
      element.classList.add(className);
      if (this.scrollObserver) {
        this.scrollObserver.observe(element);
      }
    }
  }

  addParallax(element, speed = 0.5) {
    if (typeof element === 'string') {
      document.querySelectorAll(element).forEach(el => {
        el.classList.add('parallax');
        el.dataset.speed = speed;
      });
    } else {
      element.classList.add('parallax');
      element.dataset.speed = speed;
    }
  }

  createTypewriter(element, text, speed = 100) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    
    if (element) {
      element.textContent = '';
      element.classList.add('text-typewriter');
      let index = 0;
      
      const type = () => {
        if (index < text.length) {
          element.textContent += text.charAt(index);
          index++;
          setTimeout(type, speed);
        }
      };
      
      type();
    }
  }

  // Cleanup
  destroy() {
    // Remove styles
    const style = document.getElementById('micro-interactions-styles');
    if (style) {
      style.remove();
    }
    
    // Disconnect observers
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    
    // Clear data
    this.interactions.clear();
    this.observers.clear();
    this.animationFrames.clear();
    
    // Remove global API
    delete window.websiteMicroInteractions;
  }
}

// Create global instance
window.websiteMicroInteractions = new WebsiteMicroInteractions({
  enableHoverEffects: true,
  enableClickEffects: true,
  enableScrollEffects: true,
  enableFocusEffects: true,
  enableLoadingEffects: true,
  enableFormEffects: true,
  enableNavigationEffects: true,
  enableCardEffects: true,
  enableButtonEffects: true,
  enableImageEffects: true,
  enableTextEffects: true,
  enableParallax: false,
  enableReducedMotion: true,
  animationDuration: 300,
  easingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebsiteMicroInteractions;
}
