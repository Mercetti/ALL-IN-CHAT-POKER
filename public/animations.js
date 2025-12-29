/**
 * Enhanced animations and interactions
 * Provides smooth animations, micro-interactions, and visual feedback
 */

class AnimationManager {
  constructor() {
    this.isInitialized = false;
    this.animations = new Map();
    this.intersectionObserver = null;
    this.resizeObserver = null;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.init();
  }

  /**
   * Initialize animation manager
   */
  init() {
    if (this.isInitialized) return;
    
    this.setupIntersectionObserver();
    this.setupResizeObserver();
    this.enhanceCardAnimations();
    this.enhanceButtonInteractions();
    this.setupScrollAnimations();
    this.setupParticleEffects();
    
    this.isInitialized = true;
  }

  /**
   * Setup intersection observer for scroll animations
   */
  setupIntersectionObserver() {
    if (this.prefersReducedMotion) return;
    
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    // Observe elements for animation
    document.querySelectorAll('.stats-card, .player-hand, .result-display').forEach(el => {
      this.intersectionObserver.observe(el);
    });
  }

  /**
   * Setup resize observer for responsive animations
   */
  setupResizeObserver() {
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        this.adjustAnimationSpeed(entry.target);
      });
    });

    // Observe main containers
    document.querySelectorAll('.cards-container, .stats-sidebar').forEach(el => {
      this.resizeObserver.observe(el);
    });
  }

  /**
   * Enhance card animations
   */
  enhanceCardAnimations() {
    // Enhanced card dealing
    document.addEventListener('cardDeal', (e) => {
      const card = e.detail.card;
      if (card) {
        card.classList.add('dealing');
        setTimeout(() => card.classList.remove('dealing'), 600);
      }
    });

    // Enhanced card flipping
    document.addEventListener('cardFlip', (e) => {
      const card = e.detail.card;
      if (card) {
        card.classList.add('flipped');
        setTimeout(() => card.classList.remove('flipped'), 600);
      }
    });

    // Card hover effects
    document.querySelectorAll('.card, .playing-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (!this.prefersReducedMotion) {
          card.style.transform = 'translateY(-12px) scale(1.1) rotateZ(2deg)';
        }
      });

      card.addEventListener('mouseleave', () => {
        if (!this.prefersReducedMotion) {
          card.style.transform = '';
        }
      });
    });
  }

  /**
   * Enhance button interactions
   */
  enhanceButtonInteractions() {
    document.querySelectorAll('.btn').forEach(button => {
      // Ripple effect
      button.addEventListener('click', (e) => {
        this.createRippleEffect(button, e);
      });

      // Enhanced hover states
      button.addEventListener('mouseenter', () => {
        if (!this.prefersReducedMotion) {
          button.style.transform = 'translateY(-2px) scale(1.02)';
        }
      });

      button.addEventListener('mouseleave', () => {
        if (!this.prefersReducedMotion) {
          button.style.transform = '';
        }
      });
    });
  }

  /**
   * Create ripple effect on buttons
   */
  createRippleEffect(button, event) {
    if (this.prefersReducedMotion) return;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

  /**
   * Setup scroll animations
   */
  setupScrollAnimations() {
    if (this.prefersReducedMotion) return;

    let ticking = false;
    
    const updateScrollAnimations = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Parallax effects
      document.querySelectorAll('.hero-logo-glow').forEach(el => {
        const speed = 0.5;
        el.style.transform = `translateY(${scrollY * speed}px)`;
      });
      
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollAnimations);
        ticking = true;
      }
    });
  }

  /**
   * Setup particle effects
   */
  setupParticleEffects() {
    if (this.prefersReducedMotion) return;

    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    document.body.appendChild(particleContainer);

    // Generate particles on win
    document.addEventListener('gameWin', () => {
      this.createWinParticles(particleContainer);
    });
  }

  /**
   * Create win celebration particles
   */
  createWinParticles(container) {
    const colors = ['#00d4ff', '#ff00ff', '#00ff88', '#ffaa00'];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'win-particle';
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 8 + 4;
        const startX = Math.random() * window.innerWidth;
        const startY = -20;
        const duration = Math.random() * 3 + 2;
        
        particle.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          left: ${startX}px;
          top: ${startY}px;
          box-shadow: 0 0 10px ${color};
          animation: particle-fall ${duration}s ease-out forwards;
        `;
        
        container.appendChild(particle);
        setTimeout(() => particle.remove(), duration * 1000);
      }, i * 50);
    }
  }

  /**
   * Animate number changes
   */
  animateValue(element, start, end, duration = 1000) {
    if (this.prefersReducedMotion) {
      element.textContent = end;
      return;
    }

    const startTime = performance.now();
    const updateValue = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (end - start) * easeOutQuart);
      
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };
    
    requestAnimationFrame(updateValue);
  }

  /**
   * Animate pot changes
   */
  animatePotChange(oldValue, newValue) {
    const potElement = document.getElementById('pot-chips');
    if (potElement) {
      potElement.classList.add('pot-changing');
      this.animateValue(potElement, oldValue, newValue);
      
      setTimeout(() => {
        potElement.classList.remove('pot-changing');
      }, 1000);
    }
  }

  /**
   * Animate balance changes
   */
  animateBalanceChange(element, oldValue, newValue) {
    element.classList.add('balance-changing');
    this.animateValue(element, oldValue, newValue);
    
    setTimeout(() => {
      element.classList.remove('balance-changing');
    }, 1000);
  }

  /**
   * Create card shine effect
   */
  createCardShine(card) {
    if (this.prefersReducedMotion) return;

    const shine = document.createElement('div');
    shine.className = 'card-shine';
    shine.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: card-shine 1s ease-out;
    `;
    
    card.appendChild(shine);
    setTimeout(() => shine.remove(), 1000);
  }

  /**
   * Adjust animation speed based on container size
   */
  adjustAnimationSpeed(container) {
    const width = container.offsetWidth;
    const speedMultiplier = Math.min(width / 1200, 1);
    
    container.style.setProperty('--animation-speed', speedMultiplier);
  }

  /**
   * Create loading skeleton
   */
  createSkeletonLoader(container, lines = 3) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-loader';
    
    for (let i = 0; i < lines; i++) {
      const line = document.createElement('div');
      line.className = 'skeleton-line';
      line.style.cssText = `
        height: ${Math.random() * 20 + 10}px;
        margin-bottom: 8px;
        background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
      `;
      skeleton.appendChild(line);
    }
    
    container.appendChild(skeleton);
    return skeleton;
  }

  /**
   * Remove skeleton loader
   */
  removeSkeletonLoader(skeleton) {
    if (skeleton && skeleton.parentNode) {
      skeleton.style.opacity = '0';
      setTimeout(() => skeleton.remove(), 300);
    }
  }

  /**
   * Create modal with animation
   */
  createModal(content, options = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity ${this.prefersReducedMotion ? '0s' : '0.3s'} ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      transform: scale(0.9);
      transition: transform ${this.prefersReducedMotion ? '0s' : '0.3s'} ease;
    `;
    
    modalContent.innerHTML = content;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Animate in
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      modalContent.style.transform = 'scale(1)';
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });
    
    return modal;
  }

  /**
   * Close modal with animation
   */
  closeModal(modal) {
    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'scale(0.9)';
    setTimeout(() => modal.remove(), 300);
  }

  /**
   * Cleanup animation manager
   */
  cleanup() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Remove particle container
    const particleContainer = document.querySelector('.particle-container');
    if (particleContainer) {
      particleContainer.remove();
    }
    
    this.animations.clear();
    this.isInitialized = false;
  }
}

// Add CSS animations
const animationCSS = `
  @keyframes card-shine {
    0% { left: -100%; }
    100% { left: 100%; }
  }
  
  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  @keyframes particle-fall {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(360deg);
      opacity: 0;
    }
  }
  
  @keyframes ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple 0.6s ease-out;
    pointer-events: none;
  }
  
  .animate-in {
    animation: fade-in-up 0.6s ease-out forwards;
  }
  
  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .pot-changing {
    animation: pot-pulse 0.5s ease-in-out;
  }
  
  .balance-changing {
    animation: balance-flash 0.5s ease-in-out;
  }
  
  @keyframes balance-flash {
    0%, 100% { color: var(--text-primary); }
    50% { color: var(--accent-success); }
  }
  
  .win-particle {
    pointer-events: none;
  }
  
  .skeleton-loader {
    padding: 1rem;
  }
  
  .skeleton-line {
    border-radius: 4px;
  }
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = animationCSS;
document.head.appendChild(styleSheet);

// Create global animation manager
const animationManager = new AnimationManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnimationManager, animationManager };
} else {
  window.animationManager = animationManager;
}
