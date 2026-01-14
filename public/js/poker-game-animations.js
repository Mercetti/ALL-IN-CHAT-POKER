/**
 * Smooth Animations for Poker Game Transitions
 * Implements fluid animations and transitions for poker game state changes
 */

class PokerGameAnimations {
  constructor(options = {}) {
    this.options = {
      enableCardAnimations: true,
      enableChipAnimations: true,
      enableTableAnimations: true,
      enablePlayerAnimations: true,
      enableUIAnimations: true,
      enableParticleEffects: true,
      enableSoundEffects: false,
      enableReducedMotion: true,
      animationDuration: 600,
      easingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      particleCount: 20,
      ...options
    };
    
    this.isInitialized = false;
    this.animations = new Map();
    this.particles = new Map();
    this.timelines = new Map();
    this.isReducedMotion = false;
    this.soundEnabled = false;
    
    this.init();
  }

  init() {
    // Check for reduced motion preference
    this.checkReducedMotion();
    
    // Setup CSS styles
    this.setupStyles();
    
    // Setup animation systems
    this.setupCardAnimations();
    this.setupChipAnimations();
    this.setupTableAnimations();
    this.setupPlayerAnimations();
    this.setupUIAnimations();
    this.setupParticleEffects();
    this.setupSoundEffects();
    
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
    const styleId = 'poker-game-animations-styles';
    
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Base Animation Styles */
      .poker-animation {
        transform-style: preserve-3d;
        backface-visibility: hidden;
        transition: transform ${this.options.animationDuration}ms ${this.options.easingFunction},
                    opacity ${this.options.animationDuration}ms ${this.options.easingFunction},
                    box-shadow ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      /* Card Animations */
      .card-deal {
        animation: cardDeal ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes cardDeal {
        0% {
          transform: translateY(-100px) rotate(180deg) scale(0.5);
          opacity: 0;
        }
        50% {
          transform: translateY(-50px) rotate(90deg) scale(0.8);
          opacity: 0.8;
        }
        100% {
          transform: translateY(0) rotate(0deg) scale(1);
          opacity: 1;
        }
      }
      
      .card-flip {
        animation: cardFlip ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes cardFlip {
        0% {
          transform: rotateY(0deg);
        }
        100% {
          transform: rotateY(180deg);
        }
      }
      
      .card-slide {
        animation: cardSlide ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes cardSlide {
        0% {
          transform: translateX(-100px);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .card-fan {
        animation: cardFan ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes cardFan {
        0% {
          transform: rotate(0deg) translateX(0);
        }
        100% {
          transform: rotate(var(--fan-angle)) translateX(var(--fan-distance));
        }
      }
      
      .card-collect {
        animation: cardCollect ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes cardCollect {
        0% {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: scale(0.3) rotate(360deg);
          opacity: 0;
        }
      }
      
      /* Chip Animations */
      .chip-bet {
        animation: chipBet ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes chipBet {
        0% {
          transform: translateY(-50px) scale(1.2);
          opacity: 0;
        }
        50% {
          transform: translateY(-25px) scale(1.1);
          opacity: 0.8;
        }
        100% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }
      
      .chip-win {
        animation: chipWin ${this.options.animationDuration * 2}ms ${this.options.easingFunction};
      }
      
      @keyframes chipWin {
        0% {
          transform: scale(1) rotate(0deg);
        }
        25% {
          transform: scale(1.3) rotate(90deg);
        }
        50% {
          transform: scale(1.1) rotate(180deg);
        }
        75% {
          transform: scale(1.2) rotate(270deg);
        }
        100% {
          transform: scale(1) rotate(360deg);
        }
      }
      
      .chip-stack {
        animation: chipStack ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
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
      
      .chip-slide {
        animation: chipSlide ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes chipSlide {
        0% {
          transform: translateX(-100px);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      /* Table Animations */
      .pot-grow {
        animation: potGrow ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes potGrow {
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
      
      .table-highlight {
        animation: tableHighlight ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes tableHighlight {
        0%, 100% {
          box-shadow: 0 0 0 rgba(0, 123, 255, 0);
        }
        50% {
          box-shadow: 0 0 30px rgba(0, 123, 255, 0.8);
        }
      }
      
      /* Player Animations */
      .player-join {
        animation: playerJoin ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes playerJoin {
        0% {
          transform: translateX(-100px);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .player-leave {
        animation: playerLeave ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes playerLeave {
        0% {
          transform: translateX(0);
          opacity: 1;
        }
        100% {
          transform: translateX(100px);
          opacity: 0;
        }
      }
      
      .player-win {
        animation: playerWin ${this.options.animationDuration * 2}ms ${this.options.easingFunction};
      }
      
      @keyframes playerWin {
        0% {
          transform: scale(1);
          filter: brightness(1);
        }
        25% {
          transform: scale(1.1);
          filter: brightness(1.2);
        }
        50% {
          transform: scale(1.05);
          filter: brightness(1.4);
        }
        75% {
          transform: scale(1.08);
          filter: brightness(1.2);
        }
        100% {
          transform: scale(1);
          filter: brightness(1);
        }
      }
      
      /* UI Animations */
      .button-press {
        animation: buttonPress 200ms ${this.options.easingFunction};
      }
      
      @keyframes buttonPress {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(0.95);
        }
        100% {
          transform: scale(1);
        }
      }
      
      .notification-slide {
        animation: notificationSlide ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes notificationSlide {
        0% {
          transform: translateY(-100%);
          opacity: 0;
        }
        100% {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .modal-fade {
        animation: modalFade ${this.options.animationDuration}ms ${this.options.easingFunction};
      }
      
      @keyframes modalFade {
        0% {
          opacity: 0;
          transform: scale(0.8);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      /* Particle Effects */
      .particle {
        position: absolute;
        pointer-events: none;
        border-radius: 50%;
        animation: particle-float 2s ease-out forwards;
      }
      
      @keyframes particle-float {
        0% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(var(--dx), var(--dy)) scale(0);
          opacity: 0;
        }
      }
      
      .confetti {
        position: absolute;
        pointer-events: none;
        width: 10px;
        height: 10px;
        animation: confetti-fall 3s ease-out forwards;
      }
      
      @keyframes confetti-fall {
        0% {
          transform: translateY(-100vh) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
      
      /* Glow Effects */
      .glow-effect {
        animation: glow 2s ease-in-out infinite alternate;
      }
      
      @keyframes glow {
        0% {
          box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
        }
        100% {
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
        }
      }
      
      /* Pulse Effects */
      .pulse-effect {
        animation: pulse 1s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }
      
      /* Shake Effects */
      .shake-effect {
        animation: shake 0.5s ease-in-out;
      }
      
      @keyframes shake {
        0%, 100% {
          transform: translateX(0);
        }
        10%, 30%, 50%, 70%, 90% {
          transform: translateX(-5px);
        }
        20%, 40%, 60%, 80% {
          transform: translateX(5px);
        }
      }
      
      /* Bounce Effects */
      .bounce-effect {
        animation: bounce 0.6s ease-in-out;
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-20px);
        }
        60% {
          transform: translateY(-10px);
        }
      }
      
      /* Reduced Motion Support */
      @media (prefers-reduced-motion: reduce) {
        .poker-animation,
        .card-deal,
        .card-flip,
        .card-slide,
        .card-fan,
        .card-collect,
        .chip-bet,
        .chip-win,
        .chip-stack,
        .chip-slide,
        .pot-grow,
        .table-highlight,
        .player-join,
        .player-leave,
        .player-win,
        .button-press,
        .notification-slide,
        .modal-fade,
        .particle,
        .confetti,
        .glow-effect,
        .pulse-effect,
        .shake-effect,
        .bounce-effect {
          animation: none;
          transition: none;
          transform: none;
        }
      }
      
      /* Performance Optimizations */
      .gpu-accelerated {
        transform: translateZ(0);
        will-change: transform, opacity;
      }
      
      .smooth-animation {
        backface-visibility: hidden;
        perspective: 1000px;
      }
    `;
    
    document.head.appendChild(style);
  }

  setupCardAnimations() {
    if (!this.options.enableCardAnimations || this.isReducedMotion) {
      return;
    }
    
    // Card dealing animation
    this.animations.set('cardDeal', (element, options = {}) => {
      const delay = options.delay || 0;
      const duration = options.duration || this.options.animationDuration;
      
      element.style.animationDelay = `${delay}ms`;
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('card-deal', 'gpu-accelerated');
      
      setTimeout(() => {
        element.classList.remove('card-deal');
      }, duration + delay);
    });
    
    // Card flip animation
    this.animations.set('cardFlip', (element, options = {}) => {
      const duration = options.duration || this.options.animationDuration;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('card-flip', 'gpu-accelerated');
      
      setTimeout(() => {
        element.classList.remove('card-flip');
      }, duration);
    });
    
    // Card fan animation
    this.animations.set('cardFan', (elements, options = {}) => {
      const spread = options.spread || 30;
      const delay = options.delay || 50;
      
      elements.forEach((card, index) => {
        const angle = (index - elements.length / 2) * spread;
        const distance = Math.abs(index - elements.length / 2) * 10;
        
        card.style.setProperty('--fan-angle', `${angle}deg`);
        card.style.setProperty('--fan-distance', `${distance}px`);
        card.style.animationDelay = `${index * delay}ms`;
        card.classList.add('card-fan', 'gpu-accelerated');
        
        setTimeout(() => {
          card.classList.remove('card-fan');
        }, this.options.animationDuration + (index * delay));
      });
    });
    
    // Card collect animation
    this.animations.set('cardCollect', (element, options = {}) => {
      const duration = options.duration || this.options.animationDuration;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('card-collect', 'gpu-accelerated');
      
      setTimeout(() => {
        element.classList.remove('card-collect');
      }, duration);
    });
  }

  setupChipAnimations() {
    if (!this.options.enableChipAnimations || this.isReducedMotion) {
      return;
    }
    
    // Chip betting animation
    this.animations.set('chipBet', (element, options = {}) => {
      const delay = options.delay || 0;
      const duration = options.duration || this.options.animationDuration;
      
      element.style.animationDelay = `${delay}ms`;
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('chip-bet', 'gpu-accelerated');
      
      setTimeout(() => {
        element.classList.remove('chip-bet');
      }, duration + delay);
    });
    
    // Chip winning animation
    this.animations.set('chipWin', (element, options = {}) => {
      const duration = options.duration || this.options.animationDuration * 2;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('chip-win', 'gpu-accelerated');
      
      setTimeout(() => {
        element.classList.remove('chip-win');
      }, duration);
    });
    
    // Chip stacking animation
    this.animations.set('chipStack', (elements, options = {}) => {
      const delay = options.delay || 100;
      
      elements.forEach((chip, index) => {
        chip.style.animationDelay = `${index * delay}ms`;
        chip.classList.add('chip-stack', 'gpu-accelerated');
        
        setTimeout(() => {
          chip.classList.remove('chip-stack');
        }, this.options.animationDuration + (index * delay));
      });
    });
    
    // Chip sliding animation
    this.animations.set('chipSlide', (element, options = {}) => {
      const duration = options.duration || this.options.animationDuration;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('chip-slide', 'gpu-accelerated');
      
      setTimeout(() => {
        element.classList.remove('chip-slide');
      }, duration);
    });
  }

  setupTableAnimations() {
    if (!this.options.enableTableAnimations || this.isReducedMotion) {
      return;
    }
    
    // Pot growing animation
    this.animations.set('potGrow', (element, options = {}) => {
      const duration = options.duration || this.options.animationDuration;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('pot-grow', 'gpu-accelerated');
      
      setTimeout(() => {
        element.classList.remove('pot-grow');
      }, duration);
    });
    
    // Table highlight animation
    this.animations.set('tableHighlight', (element, options = {}) => {
      const duration = options.duration || this.options.animationDuration;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('table-highlight', 'gpu-accelerated');
      
      setTimeout(() => {
        element.classList.remove('table-highlight');
      }, duration);
    });
  }

  setupPlayerAnimations() {
    if (!this.options.enablePlayerAnimations || this.isReducedMotion) {
      return;
    }
    
    // Player joining animation
    this.animations.set('playerJoin', (element, options = {}) => {
      const duration = options.duration || this.options.animationDuration;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('player-join', 'gpu-accelerated');
      
      setTimeout(() => {
        element.classList.remove('player-join');
      }, duration);
    });
    
    // Player leaving animation
    this.animations.set('playerLeave', (element, options = {}) => {
      const duration = options.duration || this.options.animationDuration;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('player-leave', 'gpu-accelerated');
      
      setTimeout(() => {
        element.classList.remove('player-leave');
      }, duration);
    });
    
    // Player winning animation
    this.animations.set('playerWin', (element, options = {}) => {
      const duration = options.duration || this.options.animationDuration * 2;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('player-win', 'gpu-accelerated');
      
      setTimeout(() => {
        element.classList.remove('player-win');
      }, duration);
    });
  }

  setupUIAnimations() {
    if (!this.options.enableUIAnimations) {
      return;
    }
    
    // Button press animation
    this.animations.set('buttonPress', (element, options = {}) => {
      const duration = options.duration || 200;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('button-press');
      
      setTimeout(() => {
        element.classList.remove('button-press');
      }, duration);
    });
    
    // Notification slide animation
    this.animations.set('notificationSlide', (element, options = {}) => {
      const duration = options.duration || this.options.animationDuration;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('notification-slide');
      
      setTimeout(() => {
        element.classList.remove('notification-slide');
      }, duration);
    });
    
    // Modal fade animation
    this.animations.set('modalFade', (element, options = {}) => {
      const duration = options.duration || this.options.animationDuration;
      
      element.style.animationDuration = `${duration}ms`;
      element.classList.add('modal-fade');
      
      setTimeout(() => {
        element.classList.remove('modal-fade');
      }, duration);
    });
  }

  setupParticleEffects() {
    if (!this.options.enableParticleEffects || this.isReducedMotion) {
      return;
    }
    
    // Create particle explosion
    this.animations.set('particleExplosion', (element, options = {}) => {
      const count = options.count || this.options.particleCount;
      const colors = options.colors || ['#FFD700', '#FFA500', '#FF6347', '#32CD32'];
      
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const angle = (Math.PI * 2 * i) / count;
        const velocity = 50 + Math.random() * 100;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;
        
        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--dy', `${dy}px`);
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.width = '6px';
        particle.style.height = '6px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
          particle.remove();
        }, 2000);
      }
    });
    
    // Create confetti effect
    this.animations.set('confetti', (element, options = {}) => {
      const count = options.count || 50;
      const colors = options.colors || ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#32CD32'];
      
      for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        const rect = element.getBoundingClientRect();
        confetti.style.left = `${rect.left + Math.random() * rect.width}px`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          confetti.remove();
        }, 4000);
      }
    });
  }

  setupSoundEffects() {
    if (!this.options.enableSoundEffects) {
      return;
    }
    
    // Sound effect system (placeholder for actual sound implementation)
    this.animations.set('playSound', (soundName, options = {}) => {
      if (!this.soundEnabled) {
        return;
      }
      
      // This would integrate with an actual sound system
      console.log(`Playing sound: ${soundName}`);
    });
  }

  setupEventListeners() {
    // Listen for game events
    document.addEventListener('game:cardDealt', (e) => {
      this.animateCardDeal(e.detail.card, e.detail.options);
    });
    
    document.addEventListener('game:cardFlipped', (e) => {
      this.animateCardFlip(e.detail.card, e.detail.options);
    });
    
    document.addEventListener('game:chipBet', (e) => {
      this.animateChipBet(e.detail.chip, e.detail.options);
    });
    
    document.addEventListener('game:potUpdate', (e) => {
      this.animatePotGrow(e.detail.potElement, e.detail.options);
    });
    
    document.addEventListener('game:playerWin', (e) => {
      this.animatePlayerWin(e.detail.playerElement, e.detail.options);
    });
    
    document.addEventListener('game:buttonPress', (e) => {
      this.animateButtonPress(e.detail.button, e.detail.options);
    });
  }

  setupGlobalAPI() {
    // Global poker animations API
    window.pokerGameAnimations = {
      // Card animations
      animateCardDeal: (element, options) => this.animateCardDeal(element, options),
      animateCardFlip: (element, options) => this.animateCardFlip(element, options),
      animateCardFan: (elements, options) => this.animateCardFan(elements, options),
      animateCardCollect: (element, options) => this.animateCardCollect(element, options),
      
      // Chip animations
      animateChipBet: (element, options) => this.animateChipBet(element, options),
      animateChipWin: (element, options) => this.animateChipWin(element, options),
      animateChipStack: (elements, options) => this.animateChipStack(elements, options),
      animateChipSlide: (element, options) => this.animateChipSlide(element, options),
      
      // Table animations
      animatePotGrow: (element, options) => this.animatePotGrow(element, options),
      animateTableHighlight: (element, options) => this.animateTableHighlight(element, options),
      
      // Player animations
      animatePlayerJoin: (element, options) => this.animatePlayerJoin(element, options),
      animatePlayerLeave: (element, options) => this.animatePlayerLeave(element, options),
      animatePlayerWin: (element, options) => this.animatePlayerWin(element, options),
      
      // UI animations
      animateButtonPress: (element, options) => this.animateButtonPress(element, options),
      animateNotificationSlide: (element, options) => this.animateNotificationSlide(element, options),
      animateModalFade: (element, options) => this.animateModalFade(element, options),
      
      // Particle effects
      animateParticleExplosion: (element, options) => this.animateParticleExplosion(element, options),
      animateConfetti: (element, options) => this.animateConfetti(element, options),
      
      // Effect animations
      animateGlow: (element, options) => this.animateGlow(element, options),
      animatePulse: (element, options) => this.animatePulse(element, options),
      animateShake: (element, options) => this.animateShake(element, options),
      animateBounce: (element, options) => this.animateBounce(element, options),
      
      // Control
      disableAnimations: () => this.disableAnimations(),
      enableAnimations: () => this.enableAnimations(),
      isReducedMotion: () => this.isReducedMotion,
      setSoundEnabled: (enabled) => this.setSoundEnabled(enabled)
    };
  }

  // Animation methods
  animateCardDeal(element, options = {}) {
    const animation = this.animations.get('cardDeal');
    if (animation) {
      animation(element, options);
    }
  }

  animateCardFlip(element, options = {}) {
    const animation = this.animations.get('cardFlip');
    if (animation) {
      animation(element, options);
    }
  }

  animateCardFan(elements, options = {}) {
    const animation = this.animations.get('cardFan');
    if (animation) {
      animation(elements, options);
    }
  }

  animateCardCollect(element, options = {}) {
    const animation = this.animations.get('cardCollect');
    if (animation) {
      animation(element, options);
    }
  }

  animateChipBet(element, options = {}) {
    const animation = this.animations.get('chipBet');
    if (animation) {
      animation(element, options);
    }
  }

  animateChipWin(element, options = {}) {
    const animation = this.animations.get('chipWin');
    if (animation) {
      animation(element, options);
    }
  }

  animateChipStack(elements, options = {}) {
    const animation = this.animations.get('chipStack');
    if (animation) {
      animation(elements, options);
    }
  }

  animateChipSlide(element, options = {}) {
    const animation = this.animations.get('chipSlide');
    if (animation) {
      animation(element, options);
    }
  }

  animatePotGrow(element, options = {}) {
    const animation = this.animations.get('potGrow');
    if (animation) {
      animation(element, options);
    }
  }

  animateTableHighlight(element, options = {}) {
    const animation = this.animations.get('tableHighlight');
    if (animation) {
      animation(element, options);
    }
  }

  animatePlayerJoin(element, options = {}) {
    const animation = this.animations.get('playerJoin');
    if (animation) {
      animation(element, options);
    }
  }

  animatePlayerLeave(element, options = {}) {
    const animation = this.animations.get('playerLeave');
    if (animation) {
      animation(element, options);
    }
  }

  animatePlayerWin(element, options = {}) {
    const animation = this.animations.get('playerWin');
    if (animation) {
      animation(element, options);
    }
  }

  animateButtonPress(element, options = {}) {
    const animation = this.animations.get('buttonPress');
    if (animation) {
      animation(element, options);
    }
  }

  animateNotificationSlide(element, options = {}) {
    const animation = this.animations.get('notificationSlide');
    if (animation) {
      animation(element, options);
    }
  }

  animateModalFade(element, options = {}) {
    const animation = this.animations.get('modalFade');
    if (animation) {
      animation(element, options);
    }
  }

  animateParticleExplosion(element, options = {}) {
    const animation = this.animations.get('particleExplosion');
    if (animation) {
      animation(element, options);
    }
  }

  animateConfetti(element, options = {}) {
    const animation = this.animations.get('confetti');
    if (animation) {
      animation(element, options);
    }
  }

  animateGlow(element, options = {}) {
    element.classList.add('glow-effect');
    setTimeout(() => {
      element.classList.remove('glow-effect');
    }, 2000);
  }

  animatePulse(element, options = {}) {
    element.classList.add('pulse-effect');
    setTimeout(() => {
      element.classList.remove('pulse-effect');
    }, 1000);
  }

  animateShake(element, options = {}) {
    element.classList.add('shake-effect');
    setTimeout(() => {
      element.classList.remove('shake-effect');
    }, 500);
  }

  animateBounce(element, options = {}) {
    element.classList.add('bounce-effect');
    setTimeout(() => {
      element.classList.remove('bounce-effect');
    }, 600);
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  disableAnimations() {
    document.body.classList.add('reduced-motion');
  }

  enableAnimations() {
    document.body.classList.remove('reduced-motion');
  }

  // Cleanup
  destroy() {
    // Remove styles
    const style = document.getElementById('poker-game-animations-styles');
    if (style) {
      style.remove();
    }
    
    // Clear data
    this.animations.clear();
    this.particles.clear();
    this.timelines.clear();
    
    // Remove global API
    delete window.pokerGameAnimations;
  }
}

// Create global instance
window.pokerGameAnimations = new PokerGameAnimations({
  enableCardAnimations: true,
  enableChipAnimations: true,
  enableTableAnimations: true,
  enablePlayerAnimations: true,
  enableUIAnimations: true,
  enableParticleEffects: true,
  enableSoundEffects: false,
  enableReducedMotion: true,
  animationDuration: 600,
  easingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  particleCount: 20
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PokerGameAnimations;
}
