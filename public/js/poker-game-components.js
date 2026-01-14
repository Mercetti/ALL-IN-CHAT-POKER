/**
 * Component-Based Architecture for Poker Game
 * Implements a modular, reusable component system for the poker game overlay
 */

class PokerGameComponents {
  constructor(options = {}) {
    this.options = {
      enableHotReload: true,
      enableDebugMode: false,
      enablePerformanceMonitoring: true,
      enableComponentCache: true,
      ...options
    };
    
    this.isInitialized = false;
    this.components = new Map();
    this.componentInstances = new Map();
    this.componentRegistry = new Map();
    this.eventBus = new Map();
    this.componentCache = new Map();
    this.performanceMetrics = new Map();
    
    this.init();
  }

  init() {
    // Setup component registry
    this.setupComponentRegistry();
    
    // Setup event bus
    this.setupEventBus();
    
    // Setup component lifecycle
    this.setupComponentLifecycle();
    
    // Setup hot reload
    if (this.options.enableHotReload) {
      this.setupHotReload();
    }
    
    // Setup performance monitoring
    if (this.options.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }
    
    this.isInitialized = true;
  }

  setupComponentRegistry() {
    // Register base component classes
    this.registerComponent('BaseComponent', BaseComponent);
    this.registerComponent('PokerTable', PokerTable);
    this.registerComponent('PlayerSeat', PlayerSeat);
    this.registerComponent('Card', Card);
    this.registerComponent('Chip', Chip);
    this.registerComponent('Pot', Pot);
    this.registerComponent('ActionButtons', ActionButtons);
    this.registerComponent('GameStatus', GameStatus);
    this.registerComponent('ChatPanel', ChatPanel);
    this.registerComponent('PlayerInfo', PlayerInfo);
    this.registerComponent('Timer', Timer);
    this.registerComponent('BetSlider', BetSlider);
    this.registerComponent('HandHistory', HandHistory);
    this.registerComponent('Statistics', Statistics);
  }

  setupEventBus() {
    // Global event bus for component communication
    window.pokerEventBus = {
      on: (event, callback) => {
        if (!this.eventBus.has(event)) {
          this.eventBus.set(event, new Set());
        }
        this.eventBus.get(event).add(callback);
      },
      
      off: (event, callback) => {
        if (this.eventBus.has(event)) {
          this.eventBus.get(event).delete(callback);
        }
      },
      
      emit: (event, data) => {
        if (this.eventBus.has(event)) {
          this.eventBus.get(event).forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              console.error(`Event handler error for ${event}:`, error);
            }
          });
        }
      },
      
      clear: (event) => {
        if (event) {
          this.eventBus.delete(event);
        } else {
          this.eventBus.clear();
        }
      }
    };
  }

  setupComponentLifecycle() {
    // Component lifecycle hooks
    this.lifecycleHooks = {
      beforeCreate: new Set(),
      created: new Set(),
      beforeMount: new Set(),
      mounted: new Set(),
      beforeUpdate: new Set(),
      updated: new Set(),
      beforeDestroy: new Set(),
      destroyed: new Set()
    };
  }

  setupHotReload() {
    // Hot reload for development
    if (this.options.enableDebugMode) {
      window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'r') {
          e.preventDefault();
          this.reloadComponents();
        }
      });
    }
  }

  setupPerformanceMonitoring() {
    // Performance monitoring for components
    this.performanceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.name.startsWith('component-')) {
          this.recordPerformanceMetric(entry);
        }
      });
    });
    
    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  registerComponent(name, componentClass) {
    this.componentRegistry.set(name, componentClass);
    
    // Add to global scope for easy access
    if (!window.pokerComponents) {
      window.pokerComponents = {};
    }
    window.pokerComponents[name] = componentClass;
  }

  createComponent(name, options = {}) {
    const ComponentClass = this.componentRegistry.get(name);
    if (!ComponentClass) {
      throw new Error(`Component "${name}" not found in registry`);
    }
    
    const startTime = performance.now();
    
    // Execute beforeCreate hooks
    this.executeLifecycleHook('beforeCreate', { name, options });
    
    // Create component instance
    const instance = new ComponentClass(options);
    
    // Set component ID
    instance.id = this.generateComponentId(name);
    
    // Setup component methods
    this.setupComponentMethods(instance);
    
    // Execute created hooks
    this.executeLifecycleHook('created', { instance, name, options });
    
    // Record performance
    const endTime = performance.now();
    this.recordComponentMetric(name, 'create', endTime - startTime);
    
    // Store instance
    this.componentInstances.set(instance.id, instance);
    
    return instance;
  }

  setupComponentMethods(instance) {
    // Add common methods to all components
    instance.emit = (event, data) => {
      window.pokerEventBus.emit(`${instance.id}:${event}`, data);
    };
    
    instance.on = (event, callback) => {
      window.pokerEventBus.on(`${instance.id}:${event}`, callback);
    };
    
    instance.off = (event, callback) => {
      window.pokerEventBus.off(`${instance.id}:${event}`, callback);
    };
    
    instance.destroy = () => {
      this.destroyComponent(instance.id);
    };
    
    instance.update = (newProps) => {
      this.updateComponent(instance.id, newProps);
    };
    
    instance.render = () => {
      return this.renderComponent(instance);
    };
  }

  mountComponent(instance, container) {
    const startTime = performance.now();
    
    // Execute beforeMount hooks
    this.executeLifecycleHook('beforeMount', { instance, container });
    
    // Mount component
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (!container) {
      throw new Error('Container not found');
    }
    
    instance.container = container;
    
    // Render component
    const rendered = instance.render();
    
    // Add to DOM
    if (typeof rendered === 'string') {
      container.innerHTML = rendered;
    } else if (rendered instanceof HTMLElement) {
      container.innerHTML = '';
      container.appendChild(rendered);
    }
    
    // Execute mounted hooks
    this.executeLifecycleHook('mounted', { instance, container });
    
    // Record performance
    const endTime = performance.now();
    this.recordComponentMetric(instance.constructor.name, 'mount', endTime - startTime);
    
    return instance;
  }

  updateComponent(componentId, newProps) {
    const instance = this.componentInstances.get(componentId);
    if (!instance) {
      throw new Error(`Component "${componentId}" not found`);
    }
    
    const startTime = performance.now();
    
    // Execute beforeUpdate hooks
    this.executeLifecycleHook('beforeUpdate', { instance, newProps });
    
    // Update component
    if (instance.updateProps) {
      instance.updateProps(newProps);
    }
    
    // Re-render
    if (instance.container) {
      const rendered = instance.render();
      
      if (typeof rendered === 'string') {
        instance.container.innerHTML = rendered;
      } else if (rendered instanceof HTMLElement) {
        instance.container.innerHTML = '';
        instance.container.appendChild(rendered);
      }
    }
    
    // Execute updated hooks
    this.executeLifecycleHook('updated', { instance, newProps });
    
    // Record performance
    const endTime = performance.now();
    this.recordComponentMetric(instance.constructor.name, 'update', endTime - startTime);
    
    return instance;
  }

  destroyComponent(componentId) {
    const instance = this.componentInstances.get(componentId);
    if (!instance) {
      return;
    }
    
    // Execute beforeDestroy hooks
    this.executeLifecycleHook('beforeDestroy', { instance });
    
    // Clean up event listeners
    window.pokerEventBus.clear(`${componentId}:*`);
    
    // Remove from DOM
    if (instance.container) {
      instance.container.innerHTML = '';
    }
    
    // Call component destroy method
    if (instance.onDestroy) {
      instance.onDestroy();
    }
    
    // Remove from instances
    this.componentInstances.delete(componentId);
    
    // Execute destroyed hooks
    this.executeLifecycleHook('destroyed', { instance });
  }

  renderComponent(instance) {
    const startTime = performance.now();
    
    // Check cache first
    if (this.options.enableComponentCache) {
      const cacheKey = this.getCacheKey(instance);
      const cached = this.componentCache.get(cacheKey);
      if (cached && !instance.shouldInvalidateCache()) {
        return cached;
      }
    }
    
    // Render component
    let rendered;
    if (instance.render) {
      rendered = instance.render();
    } else {
      rendered = this.defaultRender(instance);
    }
    
    // Cache result
    if (this.options.enableComponentCache) {
      const cacheKey = this.getCacheKey(instance);
      this.componentCache.set(cacheKey, rendered);
    }
    
    // Record performance
    const endTime = performance.now();
    this.recordComponentMetric(instance.constructor.name, 'render', endTime - startTime);
    
    return rendered;
  }

  defaultRender(instance) {
    const div = document.createElement('div');
    div.className = `poker-component ${instance.constructor.name.toLowerCase()}`;
    div.innerHTML = `
      <div class="component-header">
        <h3>${instance.constructor.name}</h3>
        <div class="component-actions">
          <button class="btn btn-sm" onclick="window.pokerGameComponents.destroyComponent('${instance.id}')">Destroy</button>
        </div>
      </div>
      <div class="component-content">
        <p>Component: ${instance.constructor.name}</p>
        <p>ID: ${instance.id}</p>
        <p>Props: ${JSON.stringify(instance.props || {})}</p>
      </div>
    `;
    return div;
  }

  executeLifecycleHook(hookName, data) {
    const hooks = this.lifecycleHooks[hookName];
    if (hooks) {
      hooks.forEach(hook => {
        try {
          hook(data);
        } catch (error) {
          console.error(`Lifecycle hook error in ${hookName}:`, error);
        }
      });
    }
  }

  generateComponentId(name) {
    return `${name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getCacheKey(instance) {
    return `${instance.constructor.name}-${JSON.stringify(instance.props || {})}`;
  }

  recordComponentMetric(componentName, operation, duration) {
    if (!this.performanceMetrics.has(componentName)) {
      this.performanceMetrics.set(componentName, {});
    }
    
    const metrics = this.performanceMetrics.get(componentName);
    if (!metrics[operation]) {
      metrics[operation] = [];
    }
    
    metrics[operation].push(duration);
    
    // Keep only last 100 measurements
    if (metrics[operation].length > 100) {
      metrics[operation].shift();
    }
  }

  recordPerformanceMetric(entry) {
    const [componentName, operation] = entry.name.split('-').slice(1);
    this.recordComponentMetric(componentName, operation, entry.duration);
  }

  reloadComponents() {
    console.log('Reloading components...');
    
    // Destroy all instances
    this.componentInstances.forEach((instance, id) => {
      this.destroyComponent(id);
    });
    
    // Clear cache
    this.componentCache.clear();
    
    // Re-initialize
    this.init();
    
    console.log('Components reloaded');
  }

  // Public API
  onLifecycleHook(hookName, callback) {
    if (this.lifecycleHooks[hookName]) {
      this.lifecycleHooks[hookName].add(callback);
    }
  }

  offLifecycleHook(hookName, callback) {
    if (this.lifecycleHooks[hookName]) {
      this.lifecycleHooks[hookName].delete(callback);
    }
  }

  getComponentInstance(id) {
    return this.componentInstances.get(id);
  }

  getComponentInstances(name) {
    const instances = [];
    this.componentInstances.forEach(instance => {
      if (instance.constructor.name === name) {
        instances.push(instance);
      }
    });
    return instances;
  }

  getPerformanceMetrics() {
    return this.performanceMetrics;
  }

  getComponentMetrics(componentName) {
    return this.performanceMetrics.get(componentName) || {};
  }

  clearCache() {
    this.componentCache.clear();
  }

  // Export/Import functionality
  exportComponentState() {
    const state = {
      instances: {},
      timestamp: Date.now()
    };
    
    this.componentInstances.forEach((instance, id) => {
      state.instances[id] = {
        name: instance.constructor.name,
        props: instance.props,
        state: instance.state || {}
      };
    });
    
    return JSON.stringify(state, null, 2);
  }

  importComponentState(stateJson) {
    try {
      const state = JSON.parse(stateJson);
      
      // Clear existing instances
      this.componentInstances.forEach((instance, id) => {
        this.destroyComponent(id);
      });
      
      // Recreate instances
      Object.entries(state.instances).forEach(([id, data]) => {
        const instance = this.createComponent(data.name, data.props);
        instance.id = id;
        instance.state = data.state;
        this.componentInstances.set(id, instance);
      });
      
      return true;
    } catch (error) {
      console.error('Failed to import component state:', error);
      return false;
    }
  }

  // Cleanup
  destroy() {
    // Destroy all instances
    this.componentInstances.forEach((instance, id) => {
      this.destroyComponent(id);
    });
    
    // Clear everything
    this.componentRegistry.clear();
    this.componentInstances.clear();
    this.eventBus.clear();
    this.componentCache.clear();
    this.performanceMetrics.clear();
    
    // Clear lifecycle hooks
    Object.values(this.lifecycleHooks).forEach(hooks => hooks.clear());
    
    // Remove global references
    delete window.pokerEventBus;
    delete window.pokerComponents;
  }
}

// Base Component Class
class BaseComponent {
  constructor(options = {}) {
    this.props = options.props || {};
    this.state = options.state || {};
    this.id = null;
    this.container = null;
    this.isMounted = false;
  }

  updateProps(newProps) {
    this.props = { ...this.props, ...newProps };
  }

  setState(newState) {
    this.state = { ...this.state, ...newProps };
    this.emit('stateChange', this.state);
  }

  shouldInvalidateCache() {
    return true;
  }

  onDestroy() {
    // Override in subclasses
  }
}

// Poker Table Component
class PokerTable extends BaseComponent {
  constructor(options) {
    super(options);
    this.players = options.players || [];
    this.pot = options.pot || 0;
    this.communityCards = options.communityCards || [];
    this.currentPhase = options.currentPhase || 'waiting';
  }

  render() {
    return `
      <div class="poker-table">
        <div class="table-surface">
          <div class="community-cards">
            ${this.communityCards.map(card => `
              <div class="card ${card.suit}-${card.rank}"></div>
            `).join('')}
          </div>
          <div class="pot-display">
            <span class="pot-amount">$${this.pot}</span>
          </div>
          <div class="table-brand">
            <span>All-In Chat Poker</span>
          </div>
        </div>
        <div class="seats">
          ${Array.from({ length: 8 }, (_, i) => `
            <div class="seat seat-${i}" data-seat="${i}">
              ${this.players[i] ? `
                <div class="player-info">
                  <div class="player-avatar">${this.players[i].avatar}</div>
                  <div class="player-name">${this.players[i].name}</div>
                  <div class="player-chips">$${this.players[i].chips}</div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// Player Seat Component
class PlayerSeat extends BaseComponent {
  constructor(options) {
    super(options);
    this.player = options.player || null;
    this.seatNumber = options.seatNumber || 0;
    this.isActive = options.isActive || false;
  }

  render() {
    if (!this.player) {
      return `
        <div class="player-seat empty" data-seat="${this.seatNumber}">
          <div class="seat-placeholder">Empty Seat</div>
        </div>
      `;
    }

    return `
      <div class="player-seat ${this.isActive ? 'active' : ''}" data-seat="${this.seatNumber}">
        <div class="player-avatar">${this.player.avatar}</div>
        <div class="player-info">
          <div class="player-name">${this.player.name}</div>
          <div class="player-chips">$${this.player.chips}</div>
          <div class="player-status">${this.player.status}</div>
        </div>
        <div class="player-cards">
          ${this.player.cards ? this.player.cards.map(card => `
            <div class="card ${card.suit}-${card.rank}"></div>
          `).join('') : ''}
        </div>
      </div>
    `;
  }
}

// Card Component
class Card extends BaseComponent {
  constructor(options) {
    super(options);
    this.rank = options.rank || 'A';
    this.suit = options.suit || 'spades';
    this.faceDown = options.faceDown || false;
    this.selected = options.selected || false;
  }

  render() {
    return `
      <div class="card ${this.faceDown ? 'face-down' : `${this.suit}-${this.rank}`} ${this.selected ? 'selected' : ''}" data-rank="${this.rank}" data-suit="${this.suit}">
        ${this.faceDown ? '' : `
          <div class="card-rank">${this.rank}</div>
          <div class="card-suit">${this.getSuitSymbol()}</div>
        `}
      </div>
    `;
  }

  getSuitSymbol() {
    const symbols = {
      spades: '♠',
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣'
    };
    return symbols[this.suit] || this.suit;
  }
}

// Chip Component
class Chip extends BaseComponent {
  constructor(options) {
    super(options);
    this.value = options.value || 100;
    this.color = options.color || this.getChipColor(this.value);
    this.count = options.count || 1;
    this.stack = options.stack || false;
  }

  render() {
    return `
      <div class="chip ${this.color} ${this.stack ? 'stack' : ''}" data-value="${this.value}">
        <div class="chip-value">$${this.value}</div>
        ${this.count > 1 ? `<div class="chip-count">×${this.count}</div>` : ''}
      </div>
    `;
  }

  getChipColor(value) {
    const colors = {
      5: 'red',
      10: 'blue',
      25: 'green',
      50: 'orange',
      100: 'black',
      500: 'purple',
      1000: 'pink'
    };
    return colors[value] || 'white';
  }
}

// Pot Component
class Pot extends BaseComponent {
  constructor(options) {
    super(options);
    this.amount = options.amount || 0;
    this.contributors = options.contributors || [];
  }

  render() {
    return `
      <div class="pot">
        <div class="pot-amount">$${this.amount}</div>
        <div class="pot-contributors">
          ${this.contributors.map(player => `
            <div class="contributor">
              <span class="contributor-name">${player.name}</span>
              <span class="contributor-amount">$${player.contribution}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// Action Buttons Component
class ActionButtons extends BaseComponent {
  constructor(options) {
    super(options);
    this.availableActions = options.availableActions || [];
    this.disabled = options.disabled || false;
  }

  render() {
    return `
      <div class="action-buttons">
        ${this.availableActions.map(action => `
          <button class="action-btn ${action.type}" 
                  data-action="${action.type}"
                  ${this.disabled || action.disabled ? 'disabled' : ''}
                  onclick="this.emit('action', { type: '${action.type}', amount: ${action.amount || 0} })">
            ${action.label}
            ${action.amount ? ` $${action.amount}` : ''}
          </button>
        `).join('')}
      </div>
    `;
  }
}

// Game Status Component
class GameStatus extends BaseComponent {
  constructor(options) {
    super(options);
    this.phase = options.phase || 'waiting';
    this.round = options.round || 1;
    this.timeLeft = options.timeLeft || 0;
  }

  render() {
    return `
      <div class="game-status">
        <div class="status-phase">${this.phase.toUpperCase()}</div>
        <div class="status-round">Round ${this.round}</div>
        ${this.timeLeft > 0 ? `
          <div class="status-timer">
            <div class="timer-bar" style="width: ${(this.timeLeft / 30) * 100}%"></div>
            <div class="timer-text">${this.timeLeft}s</div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

// Chat Panel Component
class ChatPanel extends BaseComponent {
  constructor(options) {
    super(options);
    this.messages = options.messages || [];
    this.visible = options.visible !== false;
  }

  render() {
    return `
      <div class="chat-panel ${this.visible ? 'visible' : 'hidden'}">
        <div class="chat-header">
          <h4>Chat</h4>
          <button class="toggle-btn" onclick="this.emit('toggle')">×</button>
        </div>
        <div class="chat-messages">
          ${this.messages.map(msg => `
            <div class="message ${msg.type}">
              <span class="message-author">${msg.author}:</span>
              <span class="message-text">${msg.text}</span>
            </div>
          `).join('')}
        </div>
        <div class="chat-input">
          <input type="text" placeholder="Type a message..." 
                 onkeypress="if(event.key === 'Enter') this.emit('sendMessage', { text: this.value })">
        </div>
      </div>
    `;
  }
}

// Player Info Component
class PlayerInfo extends BaseComponent {
  constructor(options) {
    super(options);
    this.player = options.player || {};
    this.showStats = options.showStats !== false;
  }

  render() {
    return `
      <div class="player-info">
        <div class="player-avatar">${this.player.avatar || '👤'}</div>
        <div class="player-details">
          <div class="player-name">${this.player.name || 'Anonymous'}</div>
          <div class="player-chips">$${this.player.chips || 0}</div>
          ${this.showStats ? `
            <div class="player-stats">
              <div class="stat">Hands: ${this.player.handsPlayed || 0}</div>
              <div class="stat">Wins: ${this.player.wins || 0}</div>
              <div class="stat">Win Rate: ${this.getWinRate()}%</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  getWinRate() {
    const hands = this.player.handsPlayed || 0;
    const wins = this.player.wins || 0;
    return hands > 0 ? ((wins / hands) * 100).toFixed(1) : '0.0';
  }
}

// Timer Component
class Timer extends BaseComponent {
  constructor(options) {
    super(options);
    this.duration = options.duration || 30;
    this.remaining = options.remaining || this.duration;
    this.running = options.running || false;
  }

  render() {
    const percentage = (this.remaining / this.duration) * 100;
    
    return `
      <div class="timer ${this.running ? 'running' : ''}">
        <div class="timer-circle">
          <svg class="timer-svg" viewBox="0 0 36 36">
            <path class="timer-background" d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="timer-progress" 
                  stroke-dasharray="${percentage}, 100"
                  d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div class="timer-text">${this.remaining}s</div>
        </div>
      </div>
    `;
  }
}

// Bet Slider Component
class BetSlider extends BaseComponent {
  constructor(options) {
    super(options);
    this.min = options.min || 0;
    this.max = options.max || 1000;
    this.value = options.value || this.min;
    this.step = options.step || 10;
  }

  render() {
    return `
      <div class="bet-slider">
        <div class="slider-header">
          <span class="slider-label">Bet Amount</span>
          <span class="slider-value">$${this.value}</span>
        </div>
        <div class="slider-container">
          <input type="range" 
                 min="${this.min}" 
                 max="${this.max}" 
                 step="${this.step}"
                 value="${this.value}"
                 oninput="this.emit('change', { value: parseInt(this.value) })">
          <div class="slider-marks">
            <div class="mark" style="left: 0%">$${this.min}</div>
            <div class="mark" style="left: 50%">$${Math.floor((this.min + this.max) / 2)}</div>
            <div class="mark" style="left: 100%">$${this.max}</div>
          </div>
        </div>
        <div class="slider-actions">
          <button class="btn btn-sm" onclick="this.emit('change', { value: ${this.min} })">Min</button>
          <button class="btn btn-sm" onclick="this.emit('change', { value: ${this.max} })">Max</button>
          <button class="btn btn-sm" onclick="this.emit('change', { value: ${Math.floor((this.min + this.max) / 2)} })">Half</button>
        </div>
      </div>
    `;
  }
}

// Hand History Component
class HandHistory extends BaseComponent {
  constructor(options) {
    super(options);
    this.hands = options.hands || [];
    this.visible = options.visible !== false;
  }

  render() {
    return `
      <div class="hand-history ${this.visible ? 'visible' : 'hidden'}">
        <div class="history-header">
          <h4>Hand History</h4>
          <button class="toggle-btn" onclick="this.emit('toggle')">×</button>
        </div>
        <div class="history-list">
          ${this.hands.map(hand => `
            <div class="history-item">
              <div class="hand-id">#${hand.id}</div>
              <div class="hand-result">${hand.result}</div>
              <div class="hand-pot">$${hand.pot}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// Statistics Component
class Statistics extends BaseComponent {
  constructor(options) {
    super(options);
    this.stats = options.stats || {};
  }

  render() {
    return `
      <div class="statistics">
        <div class="stats-header">
          <h4>Statistics</h4>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Hands Played</div>
            <div class="stat-value">${this.stats.handsPlayed || 0}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Hands Won</div>
            <div class="stat-value">${this.stats.handsWon || 0}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Win Rate</div>
            <div class="stat-value">${this.getWinRate()}%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Biggest Pot</div>
            <div class="stat-value">$${this.stats.biggestPot || 0}</div>
          </div>
        </div>
      </div>
    `;
  }

  getWinRate() {
    const hands = this.stats.handsPlayed || 0;
    const wins = this.stats.handsWon || 0;
    return hands > 0 ? ((wins / hands) * 100).toFixed(1) : '0.0';
  }
}

// Create global instance
window.pokerGameComponents = new PokerGameComponents({
  enableHotReload: true,
  enableDebugMode: false,
  enablePerformanceMonitoring: true,
  enableComponentCache: true
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PokerGameComponents, BaseComponent };
}
