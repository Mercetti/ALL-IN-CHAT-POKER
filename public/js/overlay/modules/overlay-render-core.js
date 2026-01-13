/**
 * Overlay Render Core Module
 * Core rendering functionality for poker overlay
 */

class OverlayRenderCore {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.state = null;
    this.assets = new Map();
    this.animations = new Map();
    this.renderQueue = [];
    this.isRendering = false;
    this.lastFrameTime = 0;
    this.fps = 60;
    this.frameInterval = 1000 / this.fps;
    
    this.init();
  }

  init() {
    this.setupCanvas();
    this.loadAssets();
    this.setupEventListeners();
    this.startRenderLoop();
  }

  /**
   * Setup canvas for rendering
   */
  setupCanvas() {
    this.canvas = document.getElementById('overlay-canvas');
    if (!this.canvas) {
      // Create canvas if it doesn't exist
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'overlay-canvas';
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '1000';
      document.body.appendChild(this.canvas);
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
  }

  /**
   * Resize canvas to window size
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Set canvas style size
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
  }

  /**
   * Load rendering assets
   */
  async loadAssets() {
    const assetList = [
      { name: 'card-back', url: '/assets/cards/back.png' },
      { name: 'chip-stack', url: '/assets/chips/stack.png' },
      { name: 'pot-indicator', url: '/assets/ui/pot.png' },
      { name: 'player-avatar', url: '/assets/avatars/default.png' }
    ];

    for (const asset of assetList) {
      try {
        const image = await this.loadImage(asset.url);
        this.assets.set(asset.name, image);
      } catch (error) {
        console.warn(`Failed to load asset: ${asset.name}`, error);
      }
    }
  }

  /**
   * Load single image
   */
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });

    // State updates
    window.addEventListener('overlayStateUpdate', (e) => {
      this.handleStateUpdate(e.detail);
    });

    // Animation events
    window.addEventListener('overlayAnimation', (e) => {
      this.handleAnimation(e.detail);
    });
  }

  /**
   * Start render loop
   */
  startRenderLoop() {
    const render = (currentTime) => {
      const deltaTime = currentTime - this.lastFrameTime;
      
      if (deltaTime >= this.frameInterval) {
        this.render(deltaTime);
        this.lastFrameTime = currentTime;
      }
      
      requestAnimationFrame(render);
    };
    
    requestAnimationFrame(render);
  }

  /**
   * Main render function
   */
  render(deltaTime) {
    if (!this.state) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update animations
    this.updateAnimations(deltaTime);
    
    // Render background
    this.renderBackground();
    
    // Render game elements
    this.renderPlayers();
    this.renderTable();
    this.renderCards();
    this.renderChips();
    this.renderPot();
    this.renderUI();
    
    // Process render queue
    this.processRenderQueue();
  }

  /**
   * Render background
   */
  renderBackground() {
    if (this.state.theme && this.state.theme.background) {
      this.ctx.fillStyle = this.state.theme.background;
    } else {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    }
    
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render players
   */
  renderPlayers() {
    if (!this.state.players) return;

    this.state.players.forEach((player, index) => {
      this.renderPlayer(player, index);
    });
  }

  /**
   * Render single player
   */
  renderPlayer(player, index) {
    const position = this.getPlayerPosition(index);
    
    // Player background
    this.ctx.fillStyle = player.isActive ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(position.x - 60, position.y - 30, 120, 60);
    
    // Player avatar
    const avatar = this.assets.get('player-avatar');
    if (avatar) {
      this.ctx.drawImage(avatar, position.x - 25, position.y - 25, 50, 50);
    }
    
    // Player name
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(player.name || `Player ${index + 1}`, position.x, position.y + 40);
    
    // Player chips
    if (player.chips !== undefined) {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`$${player.chips}`, position.x, position.y + 55);
    }
    
    // Player status
    if (player.status) {
      this.ctx.fillStyle = this.getStatusColor(player.status);
      this.ctx.fillText(player.status, position.x, position.y - 35);
    }
  }

  /**
   * Get player position
   */
  getPlayerPosition(index) {
    const positions = [
      { x: this.canvas.width / 2, y: this.canvas.height - 100 }, // Bottom
      { x: this.canvas.width - 150, y: this.canvas.height / 2 }, // Right
      { x: this.canvas.width / 2, y: 100 }, // Top
      { x: 150, y: this.canvas.height / 2 } // Left
    ];
    
    return positions[index % positions.length];
  }

  /**
   * Get status color
   */
  getStatusColor(status) {
    const colors = {
      active: '#00ff00',
      folded: '#ff0000',
      waiting: '#ffff00',
      allin: '#ff00ff'
    };
    
    return colors[status] || '#ffffff';
  }

  /**
   * Render table
   */
  renderTable() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
    
    // Table surface
    this.ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Table border
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
  }

  /**
   * Render cards
   */
  renderCards() {
    if (!this.state.cards) return;

    // Community cards
    if (this.state.cards.community) {
      this.state.cards.community.forEach((card, index) => {
        this.renderCard(card, this.getCommunityCardPosition(index));
      });
    }
    
    // Player cards
    if (this.state.cards.player) {
      this.state.cards.player.forEach((card, index) => {
        this.renderCard(card, this.getPlayerCardPosition(index));
      });
    }
  }

  /**
   * Render single card
   */
  renderCard(card, position) {
    const cardWidth = 60;
    const cardHeight = 90;
    
    // Card background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(position.x, position.y, cardWidth, cardHeight);
    
    // Card border
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(position.x, position.y, cardWidth, cardHeight);
    
    // Card content
    if (card && card.rank && card.suit) {
      this.renderCardContent(card, position);
    } else {
      // Card back
      const cardBack = this.assets.get('card-back');
      if (cardBack) {
        this.ctx.drawImage(cardBack, position.x, position.y, cardWidth, cardHeight);
      }
    }
  }

  /**
   * Render card content
   */
  renderCardContent(card, position) {
    const rank = card.rank;
    const suit = card.suit;
    
    // Set color based on suit
    if (suit === 'hearts' || suit === 'diamonds') {
      this.ctx.fillStyle = '#ff0000';
    } else {
      this.ctx.fillStyle = '#000000';
    }
    
    // Draw rank
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(rank, position.x + 5, position.y + 25);
    
    // Draw suit symbol
    this.ctx.font = '24px Arial';
    this.ctx.fillText(this.getSuitSymbol(suit), position.x + 5, position.y + 50);
  }

  /**
   * Get suit symbol
   */
  getSuitSymbol(suit) {
    const symbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    
    return symbols[suit] || '';
  }

  /**
   * Get community card position
   */
  getCommunityCardPosition(index) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const cardWidth = 60;
    const spacing = 10;
    
    const totalWidth = (5 * cardWidth) + (4 * spacing);
    const startX = centerX - (totalWidth / 2);
    
    return {
      x: startX + (index * (cardWidth + spacing)),
      y: centerY - 45
    };
  }

  /**
   * Get player card position
   */
  getPlayerCardPosition(index) {
    const centerX = this.canvas.width / 2;
    const bottomY = this.canvas.height - 200;
    const cardWidth = 60;
    const spacing = 10;
    
    return {
      x: centerX - cardWidth - (spacing / 2) + (index * (cardWidth + spacing)),
      y: bottomY
    };
  }

  /**
   * Render chips
   */
  renderChips() {
    if (!this.state.bets) return;

    Object.entries(this.state.bets).forEach(([playerId, bet]) => {
      const playerIndex = this.state.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        const position = this.getPlayerPosition(playerIndex);
        this.renderChipStack(bet, position);
      }
    });
  }

  /**
   * Render chip stack
   */
  renderChipStack(amount, position) {
    const chipImage = this.assets.get('chip-stack');
    if (chipImage) {
      this.ctx.drawImage(chipImage, position.x - 20, position.y - 60, 40, 40);
    }
    
    // Chip amount
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`$${amount}`, position.x, position.y - 65);
  }

  /**
   * Render pot
   */
  renderPot() {
    if (!this.state.pot) return;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Pot indicator
    const potImage = this.assets.get('pot-indicator');
    if (potImage) {
      this.ctx.drawImage(potImage, centerX - 40, centerY - 80, 80, 40);
    }
    
    // Pot amount
    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Pot: $${this.state.pot}`, centerX, centerY - 90);
  }

  /**
   * Render UI elements
   */
  renderUI() {
    // Timer
    if (this.state.timer) {
      this.renderTimer();
    }
    
    // Game info
    if (this.state.gameInfo) {
      this.renderGameInfo();
    }
    
    // Messages
    if (this.state.messages) {
      this.renderMessages();
    }
  }

  /**
   * Render timer
   */
  renderTimer() {
    const timerX = this.canvas.width - 100;
    const timerY = 50;
    
    // Timer background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(timerX - 40, timerY - 20, 80, 40);
    
    // Timer text
    this.ctx.fillStyle = this.state.timer.warning ? '#ff0000' : '#ffffff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.state.timer.time, timerX, timerY + 5);
  }

  /**
   * Render game info
   */
  renderGameInfo() {
    const infoX = 20;
    const infoY = 50;
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    
    const lines = [
      `Blinds: $${this.state.gameInfo.smallBlind}/$${this.state.gameInfo.bigBlind}`,
      `Round: ${this.state.gameInfo.round}`,
      `Phase: ${this.state.gameInfo.phase}`
    ];
    
    lines.forEach((line, index) => {
      this.ctx.fillText(line, infoX, infoY + (index * 20));
    });
  }

  /**
   * Render messages
   */
  renderMessages() {
    const messageX = this.canvas.width / 2;
    const messageY = 100;
    
    this.state.messages.forEach((message, index) => {
      this.ctx.fillStyle = message.color || '#ffffff';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(message.text, messageX, messageY + (index * 25));
    });
  }

  /**
   * Update animations
   */
  updateAnimations(deltaTime) {
    this.animations.forEach((animation, key) => {
      animation.update(deltaTime);
      
      if (animation.isComplete()) {
        this.animations.delete(key);
      }
    });
  }

  /**
   * Process render queue
   */
  processRenderQueue() {
    while (this.renderQueue.length > 0) {
      const task = this.renderQueue.shift();
      task();
    }
  }

  /**
   * Handle state updates
   */
  handleStateUpdate(state) {
    this.state = state;
    this.queueRender();
  }

  /**
   * Handle animations
   */
  handleAnimation(animationData) {
    const animation = new OverlayAnimation(animationData);
    this.animations.set(animationData.id, animation);
  }

  /**
   * Queue render task
   */
  queueRender(task) {
    this.renderQueue.push(task);
  }

  /**
   * Clear all animations
   */
  clearAnimations() {
    this.animations.clear();
  }

  /**
   * Get performance stats
   */
  getPerformanceStats() {
    return {
      fps: this.fps,
      frameInterval: this.frameInterval,
      renderQueueSize: this.renderQueue.length,
      activeAnimations: this.animations.size,
      loadedAssets: this.assets.size
    };
  }

  /**
   * Destroy renderer
   */
  destroy() {
    this.animations.clear();
    this.renderQueue = [];
    this.assets.clear();
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Export for module loading
window.OverlayRenderCore = OverlayRenderCore;
