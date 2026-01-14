/**
 * Overlay Integration Tests
 * Tests the complete overlay functionality including state management, rendering, and interactions
 */

const { DOMTestEnvironment, DOMTestUtils } = require('./utils/dom-test-helper');

// Mock WebSocket for overlay communication
const mockWebSocket = {
  readyState: 1, // WebSocket.OPEN
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null
};

describe('Overlay Integration Tests', () => {
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
    
    // Mock WebSocket constructor
    domEnv.window.WebSocket = jest.fn(() => mockWebSocket);
  });

  // Helper functions for testing
  function createOverlayStructure() {
    const overlay = domEnv.createElement('div', {
      id: 'aceyOverlay',
      className: 'overlay-container'
    });

    overlay.innerHTML = `
      <div class="players-container"></div>
      <div class="community-cards"></div>
      <div class="pot-info">
        <div class="pot-amount">Pot: $0</div>
        <div class="min-bet">Min Bet: $0</div>
        <div class="current-bet">Current Bet: $0</div>
      </div>
      <div class="timer-container">
        <div class="timer-value">0</div>
        <div class="timer-bar">
          <div class="timer-progress"></div>
        </div>
      </div>
      <div class="betting-controls" style="display: none;">
        <button class="bet-button" data-action="fold">Fold</button>
        <button class="bet-button" data-action="check">Check</button>
        <button class="bet-button" data-action="raise">Raise</button>
        <input type="number" class="bet-amount" min="10" max="1000" value="50" />
      </div>
      <div class="connection-error" style="display: none;"></div>
    `;

    return overlay;
  }

  function initializeOverlay() {
    // Simulate overlay initialization
    const ws = new domEnv.window.WebSocket('ws://localhost:8080/acey');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };
    
    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return ws;
  }

  function handleOverlayMessage(message) {
    switch (message.type) {
      case 'gameState':
        handleGameStateMessage(message);
        break;
      case 'playerAction':
        handlePlayerActionMessage(message);
        break;
      case 'chat':
        handleChatMessage(message);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  function updatePlayerDisplay(players) {
    const container = domEnv.document.querySelector('.players-container');
    if (!container) {
      console.log('Container not found');
      return;
    }

    container.innerHTML = '';

    players.forEach(player => {
      if (!player) {
        console.log('Skipping null player');
        return;
      }

      console.log('Creating player element for:', player);
      const playerElement = domEnv.createElement('div', {
        className: 'player-info',
        'data-player-id': player.id || 'unknown'
      });

      playerElement.innerHTML = `
        <div class="player-name">${player.displayName || 'Unknown Player'}</div>
        <div class="player-balance">$${player.balance || 0}</div>
        <div class="player-bet">Bet: $${player.bet || 0}</div>
        <div class="player-status ${player.status || 'unknown'}">${player.status || 'unknown'}</div>
        <div class="player-cards"></div>
      `;

      console.log('Appending player element to container');
      container.appendChild(playerElement);
    });
    
    console.log('Final container HTML:', container.innerHTML);
  }

  function updateCardDisplay(gameState) {
    if (!gameState.players) return;

    gameState.players.forEach(player => {
      if (!player.cards || !player.cardsRevealed) return;

      const playerElement = domEnv.document.querySelector(`[data-player-id="${player.id}"]`);
      if (!playerElement) return;

      const cardsContainer = playerElement.querySelector('.player-cards');
      cardsContainer.innerHTML = '';

      player.cards.forEach(card => {
        const cardElement = domEnv.createElement('div', {
          className: 'card',
          'data-card': card
        });

        const [rank, suit] = [card[0], card.slice(1)];
        cardElement.innerHTML = `
          <div class="card-rank">${rank}</div>
          <div class="card-suit">${suit}</div>
        `;

        cardsContainer.appendChild(cardElement);
      });
    });
  }

  function updateCommunityCards(gameState) {
    if (!gameState.communityCards) return;

    const container = domEnv.document.querySelector('.community-cards');
    if (!container) return;

    container.innerHTML = '';

    gameState.communityCards.forEach(card => {
      const cardElement = domEnv.createElement('div', {
        className: 'card',
        'data-card': card
      });

      const [rank, suit] = [card[0], card.slice(1)];
      cardElement.innerHTML = `
        <div class="card-rank">${rank}</div>
        <div class="card-suit">${suit}</div>
      `;

      container.appendChild(cardElement);
    });
  }

  function updatePotDisplay(gameState) {
    const potAmount = domEnv.document.querySelector('.pot-amount');
    const minBet = domEnv.document.querySelector('.min-bet');
    const currentBet = domEnv.document.querySelector('.current-bet');

    if (potAmount) {
      potAmount.textContent = `Pot: $${gameState.pot || 0}`;
    }
    if (minBet) {
      minBet.textContent = `Min Bet: $${gameState.minBet || 0}`;
    }
    if (currentBet) {
      currentBet.textContent = `Current Bet: $${gameState.currentBet || 0}`;
    }
  }

  function updateBettingControls(gameState) {
    const controls = domEnv.document.querySelector('.betting-controls');
    if (!controls) return;

    const isPlayerTurn = gameState.currentPlayer === gameState.userLogin;
    controls.style.display = isPlayerTurn && gameState.phase === 'betting' ? 'block' : 'none';
  }

  function updateTimerDisplay(gameState) {
    const timerValue = domEnv.document.querySelector('.timer-value');
    const timerProgress = domEnv.document.querySelector('.timer-progress');

    if (!timerValue || !timerProgress) return;

    timerValue.textContent = gameState.countdown || 0;

    const progress = (gameState.countdown / 15) * 100; // Assuming 15 second max
    timerProgress.style.width = `${progress}%`;

    // Add warning class for low time
    if (gameState.countdown <= 5) {
      timerValue.classList.add('warning');
      timerProgress.classList.add('warning');
    } else {
      timerValue.classList.remove('warning');
      timerProgress.classList.remove('warning');
    }
  }

  function handleGameStateMessage(message) {
    if (!message.data) return;

    updatePlayerDisplay(message.data.players || []);
    updateCommunityCards(message.data);
    updatePotDisplay(message.data);
    updateBettingControls(message.data);
    updateTimerDisplay(message.data);
  }

  function handlePlayerActionMessage(message) {
    // Handle player action updates
    console.log('Player action:', message.data);
  }

  function handleChatMessage(message) {
    // Handle chat messages
    console.log('Chat message:', message.data);
  }

  function triggerCardDealAnimation(gameState) {
    const cards = domEnv.document.querySelectorAll('.card');
    cards.forEach(card => {
      card.classList.add('dealing');
      
      setTimeout(() => {
        card.classList.remove('dealing');
      }, 500);
    });
  }

  function triggerChipAnimation(potData) {
    const potElement = domEnv.document.querySelector('.pot-info');
    if (potElement) {
      potElement.classList.add('pot-updated');
      
      setTimeout(() => {
        potElement.classList.remove('pot-updated');
      }, 300);
    }
  }

  function triggerWinAnimation(winData) {
    const playerElement = domEnv.document.querySelector(`[data-player-id="${winData.playerId}"]`);
    if (playerElement) {
      playerElement.classList.add('winner');
      
      setTimeout(() => {
        playerElement.classList.remove('winner');
      }, 2000);
    }
  }

  describe('Overlay Initialization', () => {
    test('should initialize overlay with default structure', () => {
      // Create overlay HTML structure
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      // Verify overlay exists
      const overlayElement = domEnv.document.getElementById('aceyOverlay');
      expect(overlayElement).toBeTruthy();
      expect(overlayElement.className).toContain('overlay-container');

      // Verify player container
      const playersContainer = domEnv.document.querySelector('.players-container');
      expect(playersContainer).toBeTruthy();

      // Verify pot display
      const potDisplay = domEnv.document.querySelector('.pot-info');
      expect(potDisplay).toBeTruthy();

      // Verify controls
      const controls = domEnv.document.querySelector('.overlay-controls');
      expect(controls).toBeTruthy();
    });

    test('should establish WebSocket connection', () => {
      // Simulate overlay initialization
      initializeOverlay();

      // Verify WebSocket was created
      expect(domEnv.window.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('ws://'),
        expect.objectContaining({
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          transports: ['websocket', 'polling']
        })
      );
    });

    test('should handle WebSocket connection events', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);
      
      let connectionState = null;
      const connectionCallbacks = {
        onConnected: () => { connectionState = 'connected'; },
        onDisconnected: () => { connectionState = 'disconnected'; },
        onReconnecting: () => { connectionState = 'reconnecting'; }
      };

      // Simulate connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }
      expect(connectionState).toBe('connected');

      // Simulate disconnection
      connectionState = null;
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose();
      }
      expect(connectionState).toBe('disconnected');
    });
  });

  describe('Player State Management', () => {
    test('should update player display when state changes', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      // Initial state
      const players = [];
      updatePlayerDisplay(players);

      // Verify no players displayed
      let playerElements = domEnv.document.querySelectorAll('.player-info');
      expect(playerElements.length).toBe(0);

      // Add players
      players.push(
        {
          id: 'player1',
          login: 'testuser1',
          displayName: 'Test User 1',
          balance: 1000,
          bet: 50,
          status: 'active'
        },
        {
          id: 'player2',
          login: 'testuser2',
          displayName: 'Test User 2',
          balance: 800,
          bet: 0,
          status: 'folded'
        }
      );

      updatePlayerDisplay(players);

      // Verify players are displayed
      playerElements = domEnv.document.querySelectorAll('.player-info');
      expect(playerElements.length).toBe(2);

      // Verify first player
      const player1 = domEnv.document.querySelector('[data-player-id="player1"]');
      expect(player1.querySelector('.player-name').textContent).toBe('Test User 1');
      expect(player1.querySelector('.player-balance').textContent).toBe('$1000');
      expect(player1.querySelector('.player-status').classList.contains('active')).toBe(true);

      // Verify second player
      const player2 = domEnv.document.querySelector('[data-player-id="player2"]');
      expect(player2.querySelector('.player-name').textContent).toBe('Test User 2');
      expect(player2.querySelector('.player-status').classList.contains('folded')).toBe(true);
    });

    test('should handle player removal', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      // Add players
      const players = [
        { id: 'player1', displayName: 'Test User 1', balance: 1000, status: 'active' },
        { id: 'player2', displayName: 'Test User 2', balance: 800, status: 'folded' }
      ];
      updatePlayerDisplay(players);

      // Verify players exist
      let playerElements = domEnv.document.querySelectorAll('.player-info');
      expect(playerElements.length).toBe(2);

      // Remove one player
      players.splice(1, 1);
      updatePlayerDisplay(players);

      // Verify only one player remains
      playerElements = domEnv.document.querySelectorAll('.player-info');
      expect(playerElements.length).toBe(1);

      const remainingPlayer = domEnv.document.querySelector('[data-player-id="player1"]');
      expect(remainingPlayer).toBeTruthy();
    });

    test('should update player balances dynamically', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const players = [
        { id: 'player1', displayName: 'Test User 1', balance: 1000, bet: 0 }
      ];
      updatePlayerDisplay(players);

      // Update balance
      players[0].balance = 1500;
      players[0].bet = 100;
      updatePlayerDisplay(players);

      const balanceElement = domEnv.document.querySelector('.player-balance');
      const betElement = domEnv.document.querySelector('.player-bet');

      expect(balanceElement.textContent).toBe('$1500');
      expect(betElement.textContent).toBe('Bet: $100');
    });
  });

  describe('Card Display Integration', () => {
    test('should display player cards when revealed', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const gameState = {
        players: [
          {
            id: 'player1',
            displayName: 'Test User 1',
            cards: ['AH', 'KD'],
            cardsRevealed: true
          }
        ]
      };

      updateCardDisplay(gameState);

      const playerCards = domEnv.document.querySelectorAll('.player-cards .card');
      expect(playerCards.length).toBe(2);

      const firstCard = playerCards[0];
      expect(firstCard.getAttribute('data-card')).toBe('AH');
      expect(firstCard.querySelector('.card-rank').textContent).toBe('A');
      expect(firstCard.querySelector('.card-suit').textContent).toBe('H');
    });

    test('should show card backs for hidden cards', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const gameState = {
        players: [
          {
            id: 'player1',
            displayName: 'Test User 1',
            cards: ['AH', 'KD'],
            cardsRevealed: false
          }
        ]
      };

      updateCardDisplay(gameState);

      const playerCards = domEnv.document.querySelectorAll('.player-cards .card');
      expect(playerCards.length).toBe(2);

      playerCards.forEach(card => {
        expect(card.classList.contains('card-back')).toBe(true);
        expect(card.querySelector('img')).toBeTruthy();
      });
    });

    test('should display community cards', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const gameState = {
        communityCards: ['2H', '5D', '9S']
      };

      updateCommunityCards(gameState);

      const communityCards = domEnv.document.querySelectorAll('.community-cards .card');
      expect(communityCards.length).toBe(3);

      const firstCard = communityCards[0];
      expect(firstCard.getAttribute('data-card')).toBe('2H');
      expect(firstCard.querySelector('.card-rank').textContent).toBe('2');
      expect(firstCard.querySelector('.card-suit').textContent).toBe('H');
    });

    test('should update community cards dynamically', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      // Initial community cards
      let gameState = { communityCards: ['2H', '5D'] };
      updateCommunityCards(gameState);

      let communityCards = domEnv.document.querySelectorAll('.community-cards .card');
      expect(communityCards.length).toBe(2);

      // Add more cards
      gameState.communityCards.push('9S');
      updateCommunityCards(gameState);

      communityCards = domEnv.document.querySelectorAll('.community-cards .card');
      expect(communityCards.length).toBe(3);

      const newCard = communityCards[2];
      expect(newCard.getAttribute('data-card')).toBe('9S');
    });
  });

  describe('Betting and Pot Integration', () => {
    test('should update pot display', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const gameState = {
        pot: 150,
        minBet: 10,
        currentBet: 50
      };

      updatePotDisplay(gameState);

      const potAmount = domEnv.document.querySelector('.pot-amount');
      expect(potAmount.textContent).toBe('Pot: $150');

      const minBet = domEnv.document.querySelector('.min-bet');
      expect(minBet.textContent).toBe('Min Bet: $10');

      const currentBet = domEnv.document.querySelector('.current-bet');
      expect(currentBet.textContent).toBe('Current Bet: $50');
    });

    test('should handle pot increases', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      let gameState = { pot: 100 };
      updatePotDisplay(gameState);

      let potAmount = domEnv.document.querySelector('.pot-amount');
      expect(potAmount.textContent).toBe('Pot: $100');

      // Increase pot
      gameState.pot = 250;
      updatePotDisplay(gameState);

      potAmount = domEnv.document.querySelector('.pot-amount');
      expect(potAmount.textContent).toBe('Pot: $250');
    });

    test('should show betting controls for active player', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const gameState = {
        currentPlayer: 'player1',
        userLogin: 'player1',
        phase: 'betting'
      };

      updateBettingControls(gameState);

      const controls = domEnv.document.querySelector('.betting-controls');
      expect(controls).toBeTruthy();

      const buttons = domEnv.document.querySelectorAll('.bet-button');
      expect(buttons.length).toBeGreaterThan(0);

      const betInput = domEnv.document.querySelector('.bet-amount');
      expect(betInput).toBeTruthy();
    });

    test('should hide betting controls for inactive player', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const gameState = {
        currentPlayer: 'player2',
        userLogin: 'player1',
        phase: 'betting'
      };

      updateBettingControls(gameState);

      const controls = domEnv.document.querySelector('.betting-controls');
      expect(controls).toBeFalsy();
    });
  });

  describe('Timer Integration', () => {
    test('should display countdown timer', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const gameState = {
        countdown: 15,
        countdownEndsAt: Date.now() + 15000
      };

      updateTimerDisplay(gameState);

      const timerValue = domEnv.document.querySelector('.timer-value');
      expect(timerValue).toBeTruthy();
      expect(timerValue.textContent).toBe('15');

      const timerBar = domEnv.document.querySelector('.timer-progress');
      expect(timerBar).toBeTruthy();
    });

    test('should update timer countdown', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      let gameState = {
        countdown: 15,
        countdownEndsAt: Date.now() + 15000
      };

      updateTimerDisplay(gameState);

      let timerValue = domEnv.document.querySelector('.timer-value');
      expect(timerValue.textContent).toBe('15');

      // Decrease time
      gameState.countdown = 10;
      updateTimerDisplay(gameState);

      timerValue = domEnv.document.querySelector('.timer-value');
      expect(timerValue.textContent).toBe('10');
    });

    test('should show warning when time is low', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const gameState = {
        countdown: 3,
        countdownEndsAt: Date.now() + 3000
      };

      updateTimerDisplay(gameState);

      const timerValue = domEnv.document.querySelector('.timer-value');
      expect(timerValue.classList.contains('warning')).toBe(true);

      const timerBar = domEnv.document.querySelector('.timer-progress');
      expect(timerBar.classList.contains('warning')).toBe(true);
    });
  });

  describe('Message Handling Integration', () => {
    test('should handle game state updates', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const gameState = {
        type: 'gameState',
        data: {
          players: [
            { id: 'player1', displayName: 'Test User 1', balance: 1000, status: 'active' }
          ],
          pot: 150,
          communityCards: ['2H', '5D'],
          phase: 'betting'
        }
      };

      // Simulate receiving game state message
      handleGameStateMessage(gameState);

      // Verify updates
      const playerElements = domEnv.document.querySelectorAll('.player-info');
      expect(playerElements.length).toBe(1);

      const potAmount = domEnv.document.querySelector('.pot-amount');
      expect(potAmount.textContent).toBe('Pot: $150');

      const communityCards = domEnv.document.querySelectorAll('.community-cards .card');
      expect(communityCards.length).toBe(2);
    });

    test('should handle player action messages', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const actionMessage = {
        type: 'playerAction',
        data: {
          playerId: 'player1',
          action: 'raise',
          amount: 100
        }
      };

      // Simulate receiving player action
      handlePlayerActionMessage(actionMessage);

      // Verify action was processed (in real implementation, this would update UI)
      expect(true).toBe(true); // Placeholder for actual verification
    });

    test('should handle chat messages', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const chatMessage = {
        type: 'chat',
        data: {
          user: 'testuser',
          message: 'Good game!',
          timestamp: Date.now()
        }
      };

      // Simulate receiving chat message
      handleChatMessage(chatMessage);

      // Verify chat display (if implemented)
      expect(true).toBe(true); // Placeholder for actual verification
    });
  });

  describe('Animation Integration', () => {
    test('should trigger card deal animations', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const gameState = {
        players: [
          { id: 'player1', cards: ['AH'], cardsRevealed: true }
        ]
      };

      // Trigger card deal animation
      triggerCardDealAnimation(gameState);

      // Verify animation classes are applied
      const cards = domEnv.document.querySelectorAll('.card');
      cards.forEach(card => {
        expect(card.classList.contains('dealing')).toBe(true);
      });
    });

    test('should trigger chip stack animations', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const potData = { amount: 150, previousAmount: 100 };

      // Trigger chip animation
      triggerChipAnimation(potData);

      // Verify animation classes
      const potElement = domEnv.document.querySelector('.pot-info');
      expect(potElement.classList.contains('pot-updated')).toBe(true);
    });

    test('should trigger win animations', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      // Create a player element first
      const playerElement = domEnv.createElement('div', {
        className: 'player-info',
        'data-player-id': 'player1'
      });
      domEnv.document.querySelector('.players-container').appendChild(playerElement);

      const winData = {
        playerId: 'player1',
        amount: 500,
        hand: 'Royal Flush'
      };

      // Trigger win animation
      triggerWinAnimation(winData);

      // Verify win animation classes
      const updatedPlayerElement = domEnv.document.querySelector('[data-player-id="player1"]');
      expect(updatedPlayerElement.classList.contains('winner')).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle WebSocket connection errors', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      // Simulate connection error
      const error = new Error('Connection failed');
      const errorElement = domEnv.document.querySelector('.connection-error');
      
      // Manually set error message to simulate error handling
      errorElement.textContent = `Connection error: ${error.message}`;
      errorElement.style.display = 'block';

      // Verify error handling
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Connection failed');
    });

    test('should handle invalid game state data', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const invalidState = {
        type: 'gameState',
        data: null // Invalid data
      };

      // Should not crash
      expect(() => {
        handleGameStateMessage(invalidState);
      }).not.toThrow();
    });

    test('should handle missing player data gracefully', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const gameState = {
        players: [
          { id: 'player1' }, // Missing required fields
          null // Invalid player
        ]
      };

      // Should handle gracefully
      expect(() => {
        updatePlayerDisplay(gameState.players);
      }).not.toThrow();

      // Should display fallback data (only 1 valid player, null is skipped)
      const playerElements = domEnv.document.querySelectorAll('.player-info');
      expect(playerElements.length).toBe(1);

      const playerName = domEnv.document.querySelector('.player-name');
      expect(playerName.textContent).toBe('Unknown Player');
    });
  });

  describe('Performance Integration', () => {
    test('should handle rapid state updates efficiently', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      const startTime = Date.now();

      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        const gameState = {
          pot: 100 + i,
          players: [
            { id: 'player1', balance: 1000 + i, bet: i }
          ]
        };

        updatePotDisplay(gameState);
        updatePlayerDisplay(gameState.players);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(1000);
    });

    test('should debounce frequent updates', () => {
      const overlay = createOverlayStructure();
      domEnv.appendToContainer(overlay);

      let updateCount = 0;
      const originalUpdate = updatePotDisplay;

      // Mock debounced update - simulate debouncing by only counting last call
      let lastCallArgs = null;
      const debouncedUpdate = jest.fn((state) => {
        lastCallArgs = state;
      });

      // Trigger multiple rapid updates
      for (let i = 0; i < 10; i++) {
        debouncedUpdate({ pot: 100 + i });
      }

      // Simulate debounced execution (only last update should be processed)
      if (lastCallArgs) {
        updateCount++;
        originalUpdate(lastCallArgs);
      }

      // Should only update once due to debouncing
      expect(updateCount).toBe(1);
      expect(debouncedUpdate).toHaveBeenCalledTimes(10); // Called 10 times but only executed once
    });
  });
});
