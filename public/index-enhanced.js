/**
 * Enhanced Index Page JavaScript
 * Handles interactions, animations, and user engagement
 */

class EnhancedIndex {
  constructor() {
    this.isScrolling = false;
    this.currentSection = 'hero';
    this.stats = {
      viewers: 0,
      streamers: 0,
      games: 0
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeAnimations();
    this.startStatsCounter();
    this.setupIntersectionObserver();
    this.initializeGallery();
    this.setupSmoothScrolling();
  }

  setupEventListeners() {
    // Header navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        this.scrollToSection(targetId);
      });
    });

    // Gallery items
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', (e) => {
        this.openGalleryModal(e.currentTarget);
      });
    });

    // CTA buttons
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.trackButtonClick(e.currentTarget);
      });
    });

    // Scroll events
    window.addEventListener('scroll', () => {
      this.handleScroll();
      this.updateActiveNavigation();
    });

    // Mouse move for parallax effect
    document.addEventListener('mousemove', (e) => {
      this.handleParallax(e);
    });

    // Resize events
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  initializeAnimations() {
    // Animate hero content on load
    setTimeout(() => {
      document.querySelector('.hero-badge')?.classList.add('animate-in');
    }, 200);
    
    setTimeout(() => {
      document.querySelector('.hero-title')?.classList.add('animate-in');
    }, 400);
    
    setTimeout(() => {
      document.querySelector('.hero-description')?.classList.add('animate-in');
    }, 600);
    
    setTimeout(() => {
      document.querySelector('.hero-stats')?.classList.add('animate-in');
    }, 800);
    
    setTimeout(() => {
      document.querySelector('.hero-actions')?.classList.add('animate-in');
    }, 1000);

    // Animate mockup
    setTimeout(() => {
      document.querySelector('.preview-mockup')?.classList.add('animate-in');
    }, 1200);
  }

  startStatsCounter() {
    // Simulate live stats
    this.animateCounter('viewers', 15000, 5000);
    this.animateCounter('streamers', 2500, 1000);
    this.animateCounter('games', 50000, 20000);
  }

  animateCounter(type, target, duration) {
    const startTime = Date.now();
    const startValue = 0;
    
    const updateCounter = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart);
      
      // Update display if element exists
      const element = document.querySelector(`[data-stat="${type}"]`);
      if (element) {
        element.textContent = this.formatNumber(currentValue);
      }
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        // Continue with small random increments
        this.startLiveUpdates(type, target);
      }
    };
    
    requestAnimationFrame(updateCounter);
  }

  startLiveUpdates(type, baseValue) {
    setInterval(() => {
      const element = document.querySelector(`[data-stat="${type}"]`);
      if (element) {
        const change = Math.floor(Math.random() * 10) - 5;
        const newValue = Math.max(baseValue, parseInt(element.textContent.replace(/,/g, '')) + change);
        element.textContent = this.formatNumber(newValue);
      }
    }, 5000 + Math.random() * 5000);
  }

  formatNumber(num) {
    return num.toLocaleString();
  }

  setupIntersectionObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          
          // Special handling for different sections
          if (entry.target.classList.contains('feature-card')) {
            this.animateFeatureCard(entry.target);
          } else if (entry.target.classList.contains('step-card')) {
            this.animateStepCard(entry.target);
          } else if (entry.target.classList.contains('testimonial-card')) {
            this.animateTestimonialCard(entry.target);
          }
        }
      });
    }, options);

    // Observe all animated elements
    document.querySelectorAll('.feature-card, .step-card, .testimonial-card, .gallery-item').forEach(el => {
      observer.observe(el);
    });
  }

  animateFeatureCard(card) {
    const icon = card.querySelector('.feature-icon');
    if (icon) {
      icon.style.animation = 'bounceIn 0.6s ease';
    }
  }

  animateStepCard(card) {
    const number = card.querySelector('.step-number');
    if (number) {
      number.style.animation = 'popIn 0.4s ease';
    }
  }

  animateTestimonialCard(card) {
    const avatar = card.querySelector('.author-avatar');
    if (avatar) {
      avatar.style.animation = 'fadeIn 0.8s ease';
    }
  }

  initializeGallery() {
    // Add hover effects to gallery items
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        this.pauseOtherAnimations(item);
      });
      
      item.addEventListener('mouseleave', () => {
        this.resumeAllAnimations();
      });
    });
  }

  pauseOtherAnimations(currentItem) {
    document.querySelectorAll('.gallery-item').forEach(item => {
      if (item !== currentItem) {
        item.style.animationPlayState = 'paused';
      }
    });
  }

  resumeAllAnimations() {
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.style.animationPlayState = 'running';
    });
  }

  setupSmoothScrolling() {
    // Update navigation based on scroll position
    this.updateActiveNavigation();
  }

  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      const offset = 80; // Header height
      const targetPosition = section.offsetTop - offset;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }

  handleScroll() {
    if (this.isScrolling) return;
    
    this.isScrolling = true;
    
    // Parallax effects
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-card, .orb');
    
    parallaxElements.forEach((el, index) => {
      const speed = 0.5 + (index * 0.1);
      const yPos = -(scrolled * speed);
      el.style.transform = `translateY(${yPos}px)`;
    });
    
    // Header background on scroll
    const header = document.querySelector('.enhanced-header');
    if (header) {
      if (scrolled > 100) {
        header.style.background = 'rgba(10, 15, 28, 0.95)';
      } else {
        header.style.background = 'rgba(10, 15, 28, 0.8)';
      }
    }
    
    setTimeout(() => {
      this.isScrolling = false;
    }, 100);
  }

  updateActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.pageYOffset + 150;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
        
        this.currentSection = sectionId;
      }
    });
  }

  handleParallax(e) {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    // Subtle parallax for hero mockup
    const mockup = document.querySelector('.preview-mockup');
    if (mockup) {
      const moveX = (mouseX - 0.5) * 20;
      const moveY = (mouseY - 0.5) * 20;
      mockup.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }
    
    // Parallax for floating cards
    document.querySelectorAll('.floating-card').forEach((card, index) => {
      const speed = 0.02 * (index + 1);
      const moveX = (mouseX - 0.5) * 100 * speed;
      const moveY = (mouseY - 0.5) * 100 * speed;
      card.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  }

  handleResize() {
    // Recalculate positions on resize
    this.updateActiveNavigation();
  }

  openGalleryModal(item) {
    // Create modal for larger view
    const modal = document.createElement('div');
    modal.className = 'gallery-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div class="modal-body">
          ${item.innerHTML}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add animation
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // Close handlers
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      this.closeGalleryModal(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeGalleryModal(modal);
      }
    });
    
    // Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.closeGalleryModal(modal);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  closeGalleryModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }

  trackButtonClick(button) {
    const buttonText = button.textContent.trim();
    const buttonType = this.getButtonType(button);
    
    // Analytics tracking (placeholder)
    console.log(`Button clicked: ${buttonText} (${buttonType})`);
    
    // Add ripple effect
    this.createRippleEffect(button);
  }

  getButtonType(button) {
    if (button.classList.contains('btn-primary')) return 'primary';
    if (button.classList.contains('btn-secondary')) return 'secondary';
    if (button.classList.contains('btn-lg')) return 'large';
    return 'standard';
  }

  createRippleEffect(button) {
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
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // Utility methods
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes animate-in {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
    }
  }
  
  @keyframes popIn {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    80% {
      transform: scale(1.1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-in {
    animation: animate-in 0.6s ease forwards;
  }
  
  .gallery-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .gallery-modal.show {
    opacity: 1;
  }
  
  .modal-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
    background: rgba(10, 15, 28, 0.95);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  
  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    font-size: 2rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }
  
  .modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
  
  .modal-body {
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-body img {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    border-radius: 8px;
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
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
  
  .nav-link.active {
    color: var(--primary-color, #44ffd2) !important;
  }
  
  .preview-mockup.animate-in {
    animation: slideInRight 0.8s ease;
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

document.head.appendChild(style);

// Initialize the enhanced index when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.enhancedIndex = new EnhancedIndex();
});

// Handle page visibility
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.enhancedIndex) {
    // Refresh animations when page becomes visible
    window.enhancedIndex.initializeAnimations();
  }
});
