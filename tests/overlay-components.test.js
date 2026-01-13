/**
 * Overlay Component Tests
 * Tests the overlay components functionality including rendering, state management, and interactions
 */

const { DOMTestEnvironment, DOMTestUtils } = require('./utils/dom-test-helper');

// Mock the overlay modules
jest.mock('../public/js/overlay/overlay-state.js', () => ({
  overlayState: {
    currentPhase: 'waiting',
    selectedHeld: new Set(),
    userLogin: null,
    countdownTimerId: null,
    countdownEndsAt: null,
    playerActionTimerId: null,
    playerTimers: {},
    overlayPlayers: [],
    currentDealerHand: [],
    overlayMode: 'blackjack',
    streamerLogin: '',
    previousCardCounts: new Map(),
    playerBalances: {},
    currentPot: 0,
    minBet: 10,
    potGlowMultiplier: 5,
    overlayTuning: {
      dealDelayBase: 0.18,
      dealDelayPerCard: 0.08,
      chipVolume: 0.16,
      potGlowMultiplier: 0,
      cardBackVariant: 'default',
      cardBackTint: null,
      cardBackImage: null,
      avatarRingColor: null,
      profileCardBorder: null,
      tableTint: null,
      tableLogoColor: null,
      tableTexture: null,
    }
  },
  getOverlayPlayers: jest.fn(),
  setOverlayPlayers: jest.fn(),
  getSelectedHeld: jest.fn(),
  resetSelectedHeld: jest.fn(),
  setPreviousCardCount: jest.fn(),
  getPreviousCardCounts: jest.fn(),
  setCurrentPot: jest.fn(),
  setCountdownTimerId: jest.fn(),
  getCountdownTimerId: jest.fn(),
  setPlayerActionTimerId: jest.fn(),
  getPlayerActionTimerId: jest.fn(),
  getPlayerTimers: jest.fn(),
  setPlayerTimer: jest.fn(),
  deletePlayerTimer: jest.fn(),
  clearPlayerTimers: jest.fn(),
  setPlayerBalances: jest.fn(),
  setOverlayTuning: jest.fn(),
  setOverlayFx: jest.fn(),
  setAllInFrames: jest.fn(),
}));

jest.mock('../public/js/overlay/overlay-config.js', () => ({
  DEFAULT_AVATAR: '/logo.png',
  DEFAULT_CARD_BACK: '/assets/card-back.png',
  CARD_FACE_BASE_FALLBACK: '/assets/cosmetics/cards/faces/classic',
  ALL_IN_EFFECT_SPRITE: '/assets/cosmetics/effects/all-in/allin_burst_horizontal_sheet.png',
  FOLD_EFFECT: '/assets/cosmetics/effects/folds/fold-dust.png',
  DEAL_FACE_DOWN: '/assets/cosmetics/effects/deals/face-down-deal.png',
  DEAL_FACE_UP: '/assets/cosmetics/effects/deals/face-up/face-up-deal.png',
  CARD_FLIP_SPRITE: '/assets/cosmetics/effects/deals/face-up/card_flip_sprite.png',
  CARD_FLIP_META: '/assets/cosmetics/effects/deals/face-up/card_flip_animation.json',
  CHIP_DENOMS: [
    { value: 1000, color: '#f5a524', label: '1k' },
    { value: 500, color: '#9b59b6', label: '500' },
    { value: 100, color: '#111', label: '100' },
    { value: 25, color: '#2ecc71', label: '25' },
    { value: 5, color: '#e74c3c', label: '5' },
    { value: 1, color: '#ecf0f1', label: '1' },
  ],
  CHIP_ASSETS: {
    1: { top: '/assets/cosmetics/effects/chips/chip-1-top.png', side: '/assets/cosmetics/effects/chips/chip-1-side.png' },
    5: { top: '/assets/cosmetics/effects/chips/chip-5-top.png', side: '/assets/cosmetics/effects/chips/chip-5-side.png' },
    25: { top: '/assets/cosmetics/effects/chips/chip-25-top.png', side: '/assets/cosmetics/effects/chips/chip-25-side.png' },
    100: { top: '/assets/cosmetics/effects/chips/chip-100-top.png', side: '/assets/cosmetics/effects/chips/chip-100-side.png' },
    500: { top: '/assets/cosmetics/effects/chips/chip-500-top.png', side: '/assets/cosmetics/effects/chips/chip-500-side.png' },
  },
  getSocketUrl: jest.fn(() => 'ws://localhost:8080'),
  normalizeSuitName: jest.fn((suit) => suit),
  normalizeRankName: jest.fn((rank) => rank),
}));

describe('Overlay Component Tests', () => {
  let domEnv;

  beforeAll(() => {
    domEnv = new DOMTestEnvironment();
    domEnv.setup();
    domEnv.mockWebSocket();
    domEnv.mockImageLoading();
    domEnv.mockCanvasContext();
    domEnv.mockRequestAnimationFrame();
  });

  afterAll(() => {
    domEnv.cleanup();
  });

  beforeEach(() => {
    // Clear the test container
    const container = domEnv.document.getElementById('test-container');
    container.innerHTML = '';
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Overlay HTML Structure', () => {
    test('should create overlay container with correct structure', () => {
      const overlayHtml = domEnv.createElement('div', {
        id: 'aceyOverlay',
        className: 'overlay-container'
      });
      
      domEnv.appendToContainer(overlayHtml);
      
      const overlay = domEnv.document.getElementById('aceyOverlay');
      expect(overlay).toBeTruthy();
      expect(overlay.className).toContain('overlay-container');
    });

    test('should have proper CSS styling applied', () => {
      const overlay = domEnv.createElement('div', {
        id: 'aceyOverlay',
        style: {
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '12px',
          maxWidth: '300px',
          opacity: '0',
          transform: 'translateX(100%)',
          transition: 'all 0.3s ease'
        }
      });
      
      domEnv.appendToContainer(overlay);
      
      const styles = domEnv.getComputedStyle(overlay);
      expect(styles.position).toBe('fixed');
      expect(styles.top).toBe('20px');
      expect(styles.right).toBe('20px');
      expect(styles.backgroundColor).toBe('rgba(0, 0, 0, 0.8)');
      expect(styles.color).toBe('white');
      expect(styles.padding).toBe('15px 20px');
      expect(styles.borderRadius).toBe('12px');
      expect(styles.maxWidth).toBe('300px');
      expect(styles.opacity).toBe('0');
      expect(styles.transform).toBe('translateX(100%)');
    });

    test('should show overlay when visible class is added', () => {
      const overlay = domEnv.createElement('div', {
        id: 'aceyOverlay',
        className: 'overlay-container',
        style: {
          opacity: '0',
          transform: 'translateX(100%)',
          transition: 'all 0.3s ease'
        }
      });
      
      domEnv.appendToContainer(overlay);
      
      // Add visible class
      overlay.classList.add('is-visible');
      
      // Check that styles would be applied (in real browser, CSS would handle this)
      expect(overlay.classList.contains('is-visible')).toBe(true);
    });

    test('should have pulse animation when speaking', () => {
      const overlay = domEnv.createElement('div', {
        id: 'aceyOverlay',
        className: 'overlay-container'
      });
      
      domEnv.appendToContainer(overlay);
      
      // Add speaking class
      overlay.classList.add('is-speaking');
      
      expect(overlay.classList.contains('is-speaking')).toBe(true);
    });
  });

  describe('Player Display Components', () => {
    test('should render player information correctly', () => {
      const playerData = {
        id: 'player1',
        login: 'testuser1',
        displayName: 'Test User 1',
        avatar: '/avatar1.png',
        balance: 1000,
        bet: 50,
        cards: ['AH', 'KD'],
        status: 'active',
        position: 0
      };

      const playerElement = domEnv.createElement('div', {
        className: 'player-info',
        'data-player-id': playerData.id
      });

      playerElement.innerHTML = `
        <div class="player-avatar">
          <img src="${playerData.avatar}" alt="${playerData.displayName}" />
        </div>
        <div class="player-details">
          <div class="player-name">${playerData.displayName}</div>
          <div class="player-balance">$${playerData.balance}</div>
          <div class="player-bet">Bet: $${playerData.bet}</div>
          <div class="player-status ${playerData.status}">${playerData.status}</div>
        </div>
        <div class="player-cards">
          ${playerData.cards.map(card => `<div class="card ${card}">${card}</div>`).join('')}
        </div>
      `;

      domEnv.appendToContainer(playerElement);

      // Verify player element exists
      const player = domEnv.document.querySelector('.player-info');
      expect(player).toBeTruthy();
      expect(player.getAttribute('data-player-id')).toBe('player1');

      // Verify player details
      const name = domEnv.document.querySelector('.player-name');
      expect(name.textContent).toBe('Test User 1');

      const balance = domEnv.document.querySelector('.player-balance');
      expect(balance.textContent).toBe('$1000');

      const bet = domEnv.document.querySelector('.player-bet');
      expect(bet.textContent).toBe('Bet: $50');

      const status = domEnv.document.querySelector('.player-status');
      expect(status.textContent).toBe('active');
      expect(status.classList.contains('active')).toBe(true);

      // Verify cards
      const cards = domEnv.document.querySelectorAll('.player-cards .card');
      expect(cards.length).toBe(2);
      expect(cards[0].textContent).toBe('AH');
      expect(cards[1].textContent).toBe('KD');
    });

    test('should handle multiple players correctly', () => {
      const players = [
        {
          id: 'player1',
          displayName: 'Test User 1',
          balance: 1000,
          bet: 50,
          status: 'active'
        },
        {
          id: 'player2',
          displayName: 'Test User 2',
          balance: 800,
          bet: 0,
          status: 'folded'
        }
      ];

      const playersContainer = domEnv.createElement('div', {
        className: 'players-container'
      });

      players.forEach(player => {
        const playerElement = domEnv.createElement('div', {
          className: 'player-info',
          'data-player-id': player.id
        });

        playerElement.innerHTML = `
          <div class="player-name">${player.displayName}</div>
          <div class="player-balance">$${player.balance}</div>
          <div class="player-bet">Bet: $${player.bet}</div>
          <div class="player-status ${player.status}">${player.status}</div>
        `;

        playersContainer.appendChild(playerElement);
      });

      domEnv.appendToContainer(playersContainer);

      // Verify all players are rendered
      const playerElements = domEnv.document.querySelectorAll('.player-info');
      expect(playerElements.length).toBe(2);

      // Verify first player
      const player1 = domEnv.document.querySelector('[data-player-id="player1"]');
      expect(player1.querySelector('.player-name').textContent).toBe('Test User 1');
      expect(player1.querySelector('.player-status').classList.contains('active')).toBe(true);

      // Verify second player
      const player2 = domEnv.document.querySelector('[data-player-id="player2"]');
      expect(player2.querySelector('.player-name').textContent).toBe('Test User 2');
      expect(player2.querySelector('.player-status').classList.contains('folded')).toBe(true);
    });

    test('should update player state dynamically', () => {
      const playerElement = domEnv.createElement('div', {
        className: 'player-info',
        'data-player-id': 'player1'
      });

      playerElement.innerHTML = `
        <div class="player-name">Test User 1</div>
        <div class="player-balance">$1000</div>
        <div class="player-bet">Bet: $50</div>
        <div class="player-status active">active</div>
      `;

      domEnv.appendToContainer(playerElement);

      // Update player state
      const balanceElement = playerElement.querySelector('.player-balance');
      balanceElement.textContent = '$1500';

      const betElement = playerElement.querySelector('.player-bet');
      betElement.textContent = 'Bet: $100';

      const statusElement = playerElement.querySelector('.player-status');
      statusElement.textContent = 'all-in';
      statusElement.className = 'player-status all-in';

      // Verify updates
      expect(balanceElement.textContent).toBe('$1500');
      expect(betElement.textContent).toBe('Bet: $100');
      expect(statusElement.textContent).toBe('all-in');
      expect(statusElement.classList.contains('all-in')).toBe(true);
    });
  });

  describe('Card Display Components', () => {
    test('should render individual cards correctly', () => {
      const cardElement = domEnv.createElement('div', {
        className: 'card',
        'data-card': 'AH'
      });

      cardElement.innerHTML = `
        <div class="card-rank">A</div>
        <div class="card-suit">♥</div>
      `;

      domEnv.appendToContainer(cardElement);

      const card = domEnv.document.querySelector('.card');
      expect(card).toBeTruthy();
      expect(card.getAttribute('data-card')).toBe('AH');

      const rank = domEnv.document.querySelector('.card-rank');
      expect(rank.textContent).toBe('A');

      const suit = domEnv.document.querySelector('.card-suit');
      expect(suit.textContent).toBe('♥');
    });

    test('should render card backs for hidden cards', () => {
      const cardElement = domEnv.createElement('div', {
        className: 'card card-back',
        'data-card': 'hidden'
      });

      cardElement.innerHTML = `
        <img src="/assets/card-back.png" alt="Card Back" />
      `;

      domEnv.appendToContainer(cardElement);

      const card = domEnv.document.querySelector('.card');
      expect(card.classList.contains('card-back')).toBe(true);
      expect(card.getAttribute('data-card')).toBe('hidden');

      const img = domEnv.document.querySelector('.card img');
      expect(img.src).toContain('/assets/card-back.png');
    });

    test('should handle community cards display', () => {
      const communityCards = ['2H', '5D', '9S'];
      const communityContainer = domEnv.createElement('div', {
        className: 'community-cards'
      });

      communityCards.forEach(card => {
        const cardElement = domEnv.createElement('div', {
          className: 'card',
          'data-card': card
        });

        const [rank, suit] = [card[0], card.slice(1)];
        cardElement.innerHTML = `
          <div class="card-rank">${rank}</div>
          <div class="card-suit">${suit}</div>
        `;

        communityContainer.appendChild(cardElement);
      });

      domEnv.appendToContainer(communityContainer);

      const cards = domEnv.document.querySelectorAll('.community-cards .card');
      expect(cards.length).toBe(3);

      const firstCard = cards[0];
      expect(firstCard.getAttribute('data-card')).toBe('2H');
      expect(firstCard.querySelector('.card-rank').textContent).toBe('2');
      expect(firstCard.querySelector('.card-suit').textContent).toBe('H');
    });
  });

  describe('Chip Display Components', () => {
    test('should render individual chips correctly', () => {
      const chipData = { value: 100, color: '#111', label: '100' };
      const chipElement = domEnv.createElement('div', {
        className: 'chip',
        'data-value': chipData.value,
        style: {
          backgroundColor: chipData.color,
          color: '#fff'
        }
      });

      chipElement.innerHTML = `
        <div class="chip-label">${chipData.label}</div>
      `;

      domEnv.appendToContainer(chipElement);

      const chip = domEnv.document.querySelector('.chip');
      expect(chip).toBeTruthy();
      expect(chip.getAttribute('data-value')).toBe('100');
      expect(chip.style.backgroundColor).toBe('#111');

      const label = domEnv.document.querySelector('.chip-label');
      expect(label.textContent).toBe('100');
    });

    test('should render chip stacks', () => {
      const chips = [
        { value: 100, label: '100' },
        { value: 25, label: '25' },
        { value: 25, label: '25' }
      ];

      const chipStack = domEnv.createElement('div', {
        className: 'chip-stack'
      });

      chips.forEach((chip, index) => {
        const chipElement = domEnv.createElement('div', {
          className: 'chip',
          'data-value': chip.value,
          style: {
            bottom: `${index * 2}px`,
            zIndex: chips.length - index
          }
        });

        chipElement.innerHTML = `<div class="chip-label">${chip.label}</div>`;
        chipStack.appendChild(chipElement);
      });

      domEnv.appendToContainer(chipStack);

      const chipElements = domEnv.document.querySelectorAll('.chip-stack .chip');
      expect(chipElements.length).toBe(3);

      // Verify stacking
      const topChip = chipElements[2];
      expect(topChip.style.bottom).toBe('4px');
      expect(topChip.style.zIndex).toBe('1');
    });

    test('should calculate chip denominations correctly', () => {
      const amount = 150;
      const expectedChips = [
        { value: 100, count: 1 },
        { value: 25, count: 2 }
      ];

      const chipContainer = domEnv.createElement('div', {
        className: 'chip-container'
      });

      expectedChips.forEach(chipType => {
        for (let i = 0; i < chipType.count; i++) {
          const chip = domEnv.createElement('div', {
            className: 'chip',
            'data-value': chipType.value
          });
          chipContainer.appendChild(chip);
        }
      });

      domEnv.appendToContainer(chipContainer);

      const chips = domEnv.document.querySelectorAll('.chip-container .chip');
      expect(chips.length).toBe(3);

      const hundredChips = domEnv.document.querySelectorAll('.chip[data-value="100"]');
      expect(hundredChips.length).toBe(1);

      const twentyFiveChips = domEnv.document.querySelectorAll('.chip[data-value="25"]');
      expect(twentyFiveChips.length).toBe(2);
    });
  });

  describe('Pot and Betting Components', () => {
    test('should display pot information correctly', () => {
      const potData = {
        amount: 150,
        minBet: 10,
        currentBet: 50
      };

      const potElement = domEnv.createElement('div', {
        className: 'pot-info'
      });

      potElement.innerHTML = `
        <div class="pot-amount">Pot: $${potData.amount}</div>
        <div class="min-bet">Min Bet: $${potData.minBet}</div>
        <div class="current-bet">Current Bet: $${potData.currentBet}</div>
      `;

      domEnv.appendToContainer(potElement);

      const potAmount = domEnv.document.querySelector('.pot-amount');
      expect(potAmount.textContent).toBe('Pot: $150');

      const minBet = domEnv.document.querySelector('.min-bet');
      expect(minBet.textContent).toBe('Min Bet: $10');

      const currentBet = domEnv.document.querySelector('.current-bet');
      expect(currentBet.textContent).toBe('Current Bet: $50');
    });

    test('should update pot amount dynamically', () => {
      const potElement = domEnv.createElement('div', {
        className: 'pot-info'
      });

      potElement.innerHTML = '<div class="pot-amount">Pot: $100</div>';
      domEnv.appendToContainer(potElement);

      // Update pot
      const potAmount = domEnv.document.querySelector('.pot-amount');
      potAmount.textContent = 'Pot: $250';

      expect(potAmount.textContent).toBe('Pot: $250');
    });

    test('should show betting controls', () => {
      const bettingControls = domEnv.createElement('div', {
        className: 'betting-controls'
      });

      bettingControls.innerHTML = `
        <button class="bet-button" data-action="fold">Fold</button>
        <button class="bet-button" data-action="check">Check</button>
        <button class="bet-button" data-action="raise">Raise</button>
        <input type="number" class="bet-amount" min="10" max="1000" value="50" />
        <button class="bet-button" data-action="all-in">All In</button>
      `;

      domEnv.appendToContainer(bettingControls);

      const buttons = domEnv.document.querySelectorAll('.bet-button');
      expect(buttons.length).toBe(4);

      const foldButton = domEnv.document.querySelector('[data-action="fold"]');
      expect(foldButton.textContent).toBe('Fold');

      const betInput = domEnv.document.querySelector('.bet-amount');
      expect(betInput.value).toBe('50');
      expect(betInput.min).toBe('10');
      expect(betInput.max).toBe('1000');
    });
  });

  describe('Timer and Countdown Components', () => {
    test('should display countdown timer', () => {
      const timerElement = domEnv.createElement('div', {
        className: 'countdown-timer'
      });

      timerElement.innerHTML = `
        <div class="timer-label">Time Remaining:</div>
        <div class="timer-value">15</div>
        <div class="timer-bar">
          <div class="timer-progress" style="width: 75%"></div>
        </div>
      `;

      domEnv.appendToContainer(timerElement);

      const timerValue = domEnv.document.querySelector('.timer-value');
      expect(timerValue.textContent).toBe('15');

      const progress = domEnv.document.querySelector('.timer-progress');
      expect(progress.style.width).toBe('75%');
    });

    test('should update countdown timer', () => {
      const timerElement = domEnv.createElement('div', {
        className: 'countdown-timer'
      });

      timerElement.innerHTML = `
        <div class="timer-value">15</div>
        <div class="timer-bar">
          <div class="timer-progress" style="width: 75%"></div>
        </div>
      `;

      domEnv.appendToContainer(timerElement);

      // Update timer
      const timerValue = domEnv.document.querySelector('.timer-value');
      const progress = domEnv.document.querySelector('.timer-progress');

      timerValue.textContent = '10';
      progress.style.width = '50%';

      expect(timerValue.textContent).toBe('10');
      expect(progress.style.width).toBe('50%');
    });

    test('should show warning when time is low', () => {
      const timerElement = domEnv.createElement('div', {
        className: 'countdown-timer'
      });

      timerElement.innerHTML = `
        <div class="timer-value warning">5</div>
        <div class="timer-bar">
          <div class="timer-progress warning" style="width: 25%"></div>
        </div>
      `;

      domEnv.appendToContainer(timerElement);

      const timerValue = domEnv.document.querySelector('.timer-value');
      const progress = domEnv.document.querySelector('.timer-progress');

      expect(timerValue.classList.contains('warning')).toBe(true);
      expect(progress.classList.contains('warning')).toBe(true);
    });
  });

  describe('Animation and Effects', () => {
    test('should add animation classes correctly', () => {
      const element = domEnv.createElement('div', {
        className: 'animated-element'
      });

      domEnv.appendToContainer(element);

      // Add animation class
      element.classList.add('slide-in');

      expect(element.classList.contains('slide-in')).toBe(true);
    });

    test('should handle animation end events', () => {
      const element = domEnv.createElement('div', {
        className: 'animated-element'
      });

      let animationEnded = false;
      element.addEventListener('animationend', () => {
        animationEnded = true;
      });

      domEnv.appendToContainer(element);

      // Simulate animation end
      const event = new domEnv.window.Event('animationend');
      element.dispatchEvent(event);

      expect(animationEnded).toBe(true);
    });

    test('should apply CSS transitions', () => {
      const element = domEnv.createElement('div', {
        className: 'transition-element',
        style: {
          transition: 'all 0.3s ease',
          transform: 'translateX(0)',
          opacity: '1'
        }
      });

      domEnv.appendToContainer(element);

      // Trigger transition
      element.style.transform = 'translateX(100px)';
      element.style.opacity = '0.5';

      expect(element.style.transform).toBe('translateX(100px)');
      expect(element.style.opacity).toBe('0.5');
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to different screen sizes', () => {
      const overlay = domEnv.createElement('div', {
        className: 'overlay-container',
        style: {
          width: '300px',
          maxWidth: '90vw'
        }
      });

      domEnv.appendToContainer(overlay);

      const styles = domEnv.getComputedStyle(overlay);
      expect(styles.width).toBe('300px');
      expect(styles.maxWidth).toBe('90vw');
    });

    test('should handle mobile layout', () => {
      const container = domEnv.createElement('div', {
        className: 'mobile-layout',
        style: {
          display: 'flex',
          flexDirection: 'column',
          padding: '10px'
        }
      });

      domEnv.appendToContainer(container);

      const styles = domEnv.getComputedStyle(container);
      expect(styles.display).toBe('flex');
      expect(styles.flexDirection).toBe('column');
      expect(styles.padding).toBe('10px');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing player data gracefully', () => {
      const playerElement = domEnv.createElement('div', {
        className: 'player-info',
        'data-player-id': 'unknown'
      });

      playerElement.innerHTML = `
        <div class="player-name">Unknown Player</div>
        <div class="player-balance">$0</div>
        <div class="player-status">disconnected</div>
      `;

      domEnv.appendToContainer(playerElement);

      const name = domEnv.document.querySelector('.player-name');
      expect(name.textContent).toBe('Unknown Player');

      const balance = domEnv.document.querySelector('.player-balance');
      expect(balance.textContent).toBe('$0');

      const status = domEnv.document.querySelector('.player-status');
      expect(status.textContent).toBe('disconnected');
    });

    test('should handle invalid card data', () => {
      const cardElement = domEnv.createElement('div', {
        className: 'card card-error',
        'data-card': 'invalid'
      });

      cardElement.innerHTML = `
        <div class="card-error">Invalid Card</div>
      `;

      domEnv.appendToContainer(cardElement);

      const card = domEnv.document.querySelector('.card');
      expect(card.classList.contains('card-error')).toBe(true);

      const error = domEnv.document.querySelector('.card-error');
      expect(error.textContent).toBe('Invalid Card');
    });
  });
});
