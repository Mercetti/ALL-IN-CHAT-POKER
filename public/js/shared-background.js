// Shared Background Generator
class SharedBackground {
  constructor() {
    this.init();
  }

  init() {
    this.createBackgroundElements();
    this.startFloatingAnimation();
  }

  createBackgroundElements() {
    const bgElements = document.querySelector('.bg-elements');
    if (!bgElements) return;

    // Clear existing elements
    bgElements.innerHTML = '';

    // Card faces to use
    const cardFaces = [
      'ace-spades',
      'king-hearts', 
      'queen-diamonds',
      'jack-clubs',
      'ten-hearts',
      'card-back'
    ];

    // Create floating cards
    cardFaces.forEach((cardClass, index) => {
      const card = document.createElement('div');
      card.className = `floating-card ${cardClass}`;
      card.style.left = `${Math.random() * 80 + 10}%`;
      card.style.animationDelay = `${index * 3}s`;
      card.style.animationDuration = `${15 + Math.random() * 10}s`;
      bgElements.appendChild(card);
    });

    // Create floating chips
    for (let i = 0; i < 4; i++) {
      const chip = document.createElement('div');
      chip.className = 'floating-chip';
      chip.style.left = `${Math.random() * 80 + 10}%`;
      chip.style.animationDelay = `${i * 5 + 2}s`;
      chip.style.animationDuration = `${20 + Math.random() * 8}s`;
      bgElements.appendChild(chip);
    }
  }

  startFloatingAnimation() {
    // Regenerate elements periodically for variety
    setInterval(() => {
      this.createBackgroundElements();
    }, 30000); // Every 30 seconds
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SharedBackground();
});

// Export for manual initialization
window.SharedBackground = SharedBackground;
