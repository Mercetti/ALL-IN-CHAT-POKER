// Enhanced About Page JavaScript
class EnhancedAbout {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.initAnimations();
        this.initCounters();
        this.initParallax();
    }

    bindEvents() {
        // Feature cards hover effects
        document.querySelectorAll('.feature-card, .tech-item, .team-member').forEach(card => {
            card.addEventListener('mouseenter', (e) => this.handleCardHover(e, true));
            card.addEventListener('mouseleave', (e) => this.handleCardHover(e, false));
            card.addEventListener('click', (e) => this.handleCardClick(e));
        });

        // Showcase cards animation
        document.querySelectorAll('.showcase-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.2}s`;
            card.addEventListener('click', () => this.animateShowcaseCard(card));
        });

        // CTA buttons
        document.querySelectorAll('.cta-buttons .btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCTAClick(e));
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });
    }

    initAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);

        // Observe all animated elements
        document.querySelectorAll('.feature-card, .tech-item, .team-member, .stat-item').forEach(el => {
            observer.observe(el);
        });
    }

    animateElement(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100);
    }

    initCounters() {
        const statValues = document.querySelectorAll('.stat-value');
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    this.animateCounter(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statValues.forEach(stat => counterObserver.observe(stat));
    }

    animateCounter(element) {
        const target = this.parseValue(element.textContent);
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                element.textContent = this.formatValue(current, element.textContent);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = this.formatValue(target, element.textContent);
            }
        };

        updateCounter();
    }

    parseValue(text) {
        // Extract numeric value from text like "10K+" or "1M+"
        const match = text.match(/[\d.]+/);
        if (!match) return 0;
        
        const value = parseFloat(match[0]);
        if (text.includes('K')) return value * 1000;
        if (text.includes('M')) return value * 1000000;
        return value;
    }

    formatValue(value, originalText) {
        // Format back to original format
        if (originalText.includes('K+')) return Math.floor(value / 1000) + 'K+';
        if (originalText.includes('M+')) return Math.floor(value / 1000000) + 'M+';
        if (originalText.includes('%')) return value.toFixed(1) + '%';
        return Math.floor(value).toString();
    }

    initParallax() {
        let ticking = false;

        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.showcase-card, .tech-icon');
            
            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });

            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick, { passive: true });
    }

    handleCardHover(event, isEntering) {
        const card = event.currentTarget;
        
        if (isEntering) {
            // Add glow effect
            card.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.3)';
            
            // Animate icon
            const icon = card.querySelector('.feature-icon, .tech-icon, .member-avatar');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
            }
        } else {
            // Remove glow effect
            card.style.boxShadow = '';
            
            // Reset icon
            const icon = card.querySelector('.feature-icon, .tech-icon, .member-avatar');
            if (icon) {
                icon.style.transform = '';
            }
        }
    }

    handleCardClick(event) {
        const card = event.currentTarget;
        const title = card.querySelector('h3, h4').textContent;
        
        // Create ripple effect
        this.createRipple(event, card);
        
        // Show toast with card info
        if (window.enhancedCommon) {
            window.enhancedCommon.showToast(`Learn more about ${title}`, 'info');
        }
    }

    animateShowcaseCard(card) {
        // Add a fun animation when showcase cards are clicked
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'flip 0.6s ease-in-out';
        }, 10);
        
        setTimeout(() => {
            card.style.animation = '';
        }, 600);
    }

    handleCTAClick(event) {
        const btn = event.currentTarget;
        const href = btn.getAttribute('href');
        
        // Add loading state
        btn.classList.add('loading');
        btn.textContent = 'Loading...';
        
        // Simulate loading and navigate
        setTimeout(() => {
            if (href) {
                window.location.href = href;
            }
        }, 500);
    }

    handleSmoothScroll(event) {
        event.preventDefault();
        const targetId = event.currentTarget.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    createRipple(event, element) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Public methods for external access
    showFeatureDetails(featureName) {
        // Could be used to show a modal with more details
        console.log(`Showing details for: ${featureName}`);
    }

    trackAnalytics(eventName, data) {
        // Placeholder for analytics tracking
        if (window.gtag) {
            window.gtag('event', eventName, data);
        }
    }
}

// Add flip animation to CSS
const flipAnimation = `
@keyframes flip {
    0% { transform: perspective(400px) rotateY(0); }
    50% { transform: perspective(400px) rotateY(180deg); }
    100% { transform: perspective(400px) rotateY(0); }
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
`;

// Inject animations
const styleSheet = document.createElement('style');
styleSheet.textContent = flipAnimation;
document.head.appendChild(styleSheet);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedAbout();
});

// Export for potential external use
window.EnhancedAbout = EnhancedAbout;
