# Component Library Documentation

## Overview

The All-In Chat Poker Component Library is a comprehensive, reusable UI component system designed for consistency, accessibility, and performance across all poker applications.

## Architecture

### Core Components

#### BaseComponent
The foundation class for all components, providing:
- Lifecycle management
- Event handling
- State management
- Performance monitoring
- Accessibility features

```javascript
class BaseComponent {
  constructor(options = {})
  updateProps(newProps)
  setState(newState)
  emit(event, data)
  on(event, callback)
  off(event, callback)
  destroy()
  render()
}
```

### Component Categories

#### 1. UI Components

##### Card Component
Represents playing cards with suit, rank, and visual states.

**Props:**
- `rank`: Card rank (A, K, Q, J, 10-2)
- `suit`: Card suit (spades, hearts, diamonds, clubs)
- `faceDown`: Boolean for card visibility
- `selected`: Boolean for selection state

**Usage:**
```javascript
const card = window.pokerGameComponents.createComponent('Card', {
  rank: 'A',
  suit: 'spades',
  faceDown: false,
  selected: true
});
```

**Events:**
- `card:flip`: Card flipped
- `card:select`: Card selected
- `card:deselect`: Card deselected

##### Chip Component
Represents poker chips with value and color coding.

**Props:**
- `value`: Chip value (5, 10, 25, 50, 100, 500, 1000)
- `color`: Chip color (auto-calculated based on value)
- `count`: Number of chips in stack
- `stack`: Boolean for stack display

**Usage:**
```javascript
const chip = window.pokerGameComponents.createComponent('Chip', {
  value: 100,
  count: 5,
  stack: true
});
```

**Color Mapping:**
- $5: Red
- $10: Blue
- $25: Green
- $50: Orange
- $100: Black
- $500: Purple
- $1000: Pink

##### Button Component
Interactive button with various states and styles.

**Props:**
- `label`: Button text
- `type`: Button style (primary, secondary, danger, success)
- `disabled`: Boolean for disabled state
- `loading`: Boolean for loading state
- `icon`: Icon identifier

**Usage:**
```javascript
const button = window.pokerGameComponents.createComponent('Button', {
  label: 'Fold',
  type: 'danger',
  disabled: false
});
```

**Events:**
- `button:click`: Button clicked
- `button:hover`: Button hovered
- `button:focus`: Button focused

#### 2. Layout Components

##### PokerTable Component
Main table surface with seats and community cards.

**Props:**
- `players`: Array of player objects
- `pot`: Current pot amount
- `communityCards`: Array of community card objects
- `currentPhase`: Game phase (waiting, preflop, flop, turn, river)

**Usage:**
```javascript
const table = window.pokerGameComponents.createComponent('PokerTable', {
  players: [...],
  pot: 1000,
  communityCards: [...],
  currentPhase: 'flop'
});
```

**Events:**
- `table:phaseChange`: Game phase changed
- `table:potUpdate`: Pot amount updated
- `table:playerJoin`: Player joined table
- `table:playerLeave`: Player left table

##### PlayerSeat Component
Individual player seat with cards and information.

**Props:**
- `player`: Player object with name, chips, cards
- `seatNumber`: Seat position (0-7)
- `isActive`: Boolean for active state
- `isDealer`: Boolean for dealer indicator

**Usage:**
```javascript
const seat = window.pokerGameComponents.createComponent('PlayerSeat', {
  player: {
    name: 'John',
    chips: 1000,
    cards: [...],
    status: 'active'
  },
  seatNumber: 0,
  isActive: true
});
```

**Events:**
- `seat:playerUpdate`: Player information updated
- `seat:action`: Player action taken
- `seat:cardsUpdate`: Player cards updated

#### 3. Interactive Components

##### ActionButtons Component
Set of action buttons for player decisions.

**Props:**
- `availableActions`: Array of action objects
- `disabled`: Boolean for disabled state
- `layout`: Button layout (horizontal, vertical)

**Usage:**
```javascript
const actions = window.pokerGameComponents.createComponent('ActionButtons', {
  availableActions: [
    { type: 'fold', label: 'Fold' },
    { type: 'call', label: 'Call', amount: 100 },
    { type: 'raise', label: 'Raise', amount: 200 }
  ],
  disabled: false
});
```

**Action Types:**
- `fold`: Fold hand
- `call`: Call current bet
- `raise`: Raise to specified amount
- `check`: Check (if no bet required)
- `all-in`: Go all-in

**Events:**
- `action:fold`: Fold action triggered
- `action:call`: Call action triggered
- `action:raise`: Raise action triggered
- `action:check`: Check action triggered
- `action:allin`: All-in action triggered

##### BetSlider Component
Interactive slider for bet amount selection.

**Props:**
- `min`: Minimum bet amount
- `max`: Maximum bet amount
- `value`: Current slider value
- `step`: Slider step increment

**Usage:**
```javascript
const slider = window.pokerGameComponents.createComponent('BetSlider', {
  min: 0,
  max: 1000,
  value: 100,
  step: 10
});
```

**Events:**
- `slider:change`: Value changed
- `slider:dragStart`: Drag started
- `slider:dragEnd`: Drag ended

#### 4. Information Components

##### GameStatus Component
Displays current game status and information.

**Props:**
- `phase`: Current game phase
- `round`: Current round number
- `timeLeft`: Time remaining for action
- `potSize`: Current pot size

**Usage:**
```javascript
const status = window.pokerGameComponents.createComponent('GameStatus', {
  phase: 'flop',
  round: 3,
  timeLeft: 15,
  potSize: 1000
});
```

**Events:**
- `status:phaseChange`: Phase changed
- `status:timeUpdate`: Time updated
- `status:roundChange`: Round changed

##### Timer Component
Visual countdown timer with circular progress.

**Props:**
- `duration`: Total duration in seconds
- `remaining`: Time remaining in seconds
- `running`: Boolean for running state

**Usage:**
```javascript
const timer = window.pokerGameComponents.createComponent('Timer', {
  duration: 30,
  remaining: 15,
  running: true
});
```

**Events:**
- `timer:start`: Timer started
- `timer:pause`: Timer paused
- `timer:reset`: Timer reset
- `timer:expire`: Timer expired

#### 5. Communication Components

##### ChatPanel Component
Real-time chat interface for player communication.

**Props:**
- `messages`: Array of message objects
- `visible`: Boolean for visibility state
- `position`: Panel position (side, bottom)

**Usage:**
```javascript
const chat = window.pokerGameComponents.createComponent('ChatPanel', {
  messages: [
    { author: 'John', text: 'Nice hand!', type: 'chat' },
    { author: 'System', text: 'New round starting', type: 'system' }
  ],
  visible: true
});
```

**Message Types:**
- `chat`: Player messages
- `system`: System notifications
- `action`: Game action notifications
- `error`: Error messages

**Events:**
- `chat:message`: New message received
- `chat:send`: Message sent
- `chat:toggle`: Panel toggled

##### PlayerInfo Component
Detailed player information and statistics.

**Props:**
- `player`: Player object with detailed info
- `showStats`: Boolean for statistics display
- `compact`: Boolean for compact layout

**Usage:**
```javascript
const info = window.pokerGameComponents.createComponent('PlayerInfo', {
  player: {
    name: 'John',
    avatar: '👤',
    chips: 1000,
    handsPlayed: 50,
    wins: 12,
    winRate: 24.0
  },
  showStats: true
});
```

**Events:**
- `info:update`: Player information updated
- `info:statsUpdate`: Statistics updated

#### 6. Data Components

##### Statistics Component
Game statistics dashboard.

**Props:**
- `stats`: Statistics object with various metrics
- `layout`: Display layout (grid, list)

**Usage:**
```javascript
const stats = window.pokerGameComponents.createComponent('Statistics', {
  stats: {
    handsPlayed: 100,
    handsWon: 25,
    winRate: 25.0,
    biggestPot: 5000,
    averagePot: 200
  }
});
```

**Statistics Types:**
- `handsPlayed`: Total hands played
- `handsWon`: Total hands won
- `winRate`: Win rate percentage
- `biggestPot`: Largest pot won
- `averagePot`: Average pot size

**Events:**
- `stats:update`: Statistics updated
- `stats:reset`: Statistics reset

##### HandHistory Component
Display of recent hands and results.

**Props:**
- `hands`: Array of hand objects
- `visible`: Boolean for visibility
- `maxItems`: Maximum items to display

**Usage:**
```javascript
const history = window.pokerGameComponents.createComponent('HandHistory', {
  hands: [
    { id: 1, result: 'Won', pot: 1000, cards: ['A♠', 'K♠'] },
    { id: 2, result: 'Lost', pot: 500, cards: ['7♦', '2♣'] }
  ],
  visible: true,
  maxItems: 10
});
```

**Events:**
- `history:add`: New hand added
- `history:clear`: History cleared
- `history:filter`: History filtered

## Component Lifecycle

### 1. Creation
```javascript
const component = window.pokerGameComponents.createComponent('ComponentName', options);
```

**Lifecycle Hooks:**
- `beforeCreate`: Before component creation
- `created`: After component creation

### 2. Mounting
```javascript
window.pokerGameComponents.mountComponent(component, container);
```

**Lifecycle Hooks:**
- `beforeMount`: Before DOM mounting
- `mounted`: After DOM mounting

### 3. Updates
```javascript
component.updateProps(newProps);
```

**Lifecycle Hooks:**
- `beforeUpdate`: Before component update
- `updated`: After component update

### 4. Destruction
```javascript
component.destroy();
```

**Lifecycle Hooks:**
- `beforeDestroy`: Before component destruction
- `destroyed`: After component destruction

## Event System

### Global Events
Components communicate through a global event bus:

```javascript
// Listen to events
window.pokerEventBus.on('event:name', callback);

// Emit events
window.pokerEventBus.emit('event:name', data);

// Remove listeners
window.pokerEventBus.off('event:name', callback);
```

### Component Events
Each component has its own event namespace:

```javascript
// Listen to component events
component.on('event:name', callback);

// Emit component events
component.emit('event:name', data);

// Remove component listeners
component.off('event:name', callback);
```

## Styling and Theming

### CSS Classes
Components use consistent CSS class naming:

```css
.component-name
.component-name--modifier
.component-name__element
.component-name__element--modifier
```

### Theme Support
Components support multiple themes through CSS custom properties:

```css
:root {
  --poker-primary-color: #007bff;
  --poker-secondary-color: #6c757d;
  --poker-success-color: #28a745;
  --poker-danger-color: #dc3545;
  --poker-warning-color: #ffc107;
  --poker-info-color: #17a2b8;
}
```

### Responsive Design
Components are responsive and adapt to different screen sizes:

```css
@media (max-width: 768px) {
  .component-name {
    /* Mobile styles */
  }
}
```

## Accessibility

### ARIA Support
Components include proper ARIA attributes:

```html
<div class="button" role="button" aria-label="Fold" aria-disabled="false">
  Fold
</div>
```

### Keyboard Navigation
Components support keyboard interactions:

- `Tab`: Navigate between interactive elements
- `Enter`: Activate buttons and links
- `Space`: Toggle checkboxes and buttons
- `Arrow keys`: Navigate within components

### Screen Reader Support
Components provide screen reader friendly content:

```html
<div class="player-info" role="region" aria-label="Player Information">
  <span class="sr-only">Player: John</span>
  <span class="sr-only">Chips: $1000</span>
</div>
```

## Performance Optimization

### Component Caching
Components are cached for improved performance:

```javascript
// Enable component caching
const component = window.pokerGameComponents.createComponent('Card', {
  rank: 'A',
  suit: 'spades',
  cache: true
});
```

### Lazy Loading
Components can be loaded on demand:

```javascript
// Lazy load component
window.pokerGameComponents.loadComponent('HeavyComponent').then(component => {
  // Use component
});
```

### Performance Monitoring
Component performance is automatically monitored:

```javascript
// Get performance metrics
const metrics = window.pokerGameComponents.getPerformanceMetrics();
console.log('Component render time:', metrics['Card'].render);
```

## Best Practices

### 1. Component Design
- Keep components focused and single-purpose
- Use props for configuration
- Use events for communication
- Follow consistent naming conventions

### 2. State Management
- Use props for external state
- Use internal state for component-specific data
- Emit events for state changes
- Avoid direct DOM manipulation

### 3. Performance
- Use component caching for static content
- Implement lazy loading for heavy components
- Monitor component performance
- Optimize render cycles

### 4. Accessibility
- Include proper ARIA attributes
- Support keyboard navigation
- Provide screen reader content
- Test with accessibility tools

### 5. Testing
- Test component rendering
- Test component interactions
- Test component events
- Test accessibility features

## Examples

### Basic Card Component
```javascript
// Create card
const card = window.pokerGameComponents.createComponent('Card', {
  rank: 'A',
  suit: 'spades',
  faceDown: false
});

// Mount to container
window.pokerGameComponents.mountComponent(card, '#card-container');

// Listen to events
card.on('card:flip', () => {
  console.log('Card flipped');
});

// Update card
card.updateProps({ faceDown: true });
```

### Poker Table Setup
```javascript
// Create table
const table = window.pokerGameComponents.createComponent('PokerTable', {
  players: [
    { name: 'John', chips: 1000, cards: [] },
    { name: 'Jane', chips: 1500, cards: [] }
  ],
  pot: 200,
  communityCards: [],
  currentPhase: 'preflop'
});

// Mount table
window.pokerGameComponents.mountComponent(table, '#table-container');

// Listen to table events
table.on('table:phaseChange', (data) => {
  console.log('Phase changed to:', data.phase);
});
```

### Action Buttons with Events
```javascript
// Create action buttons
const actions = window.pokerGameComponents.createComponent('ActionButtons', {
  availableActions: [
    { type: 'fold', label: 'Fold' },
    { type: 'call', label: 'Call', amount: 100 },
    { type: 'raise', label: 'Raise', amount: 200 }
  ]
});

// Mount buttons
window.pokerGameComponents.mountComponent(actions, '#actions-container');

// Listen to action events
actions.on('action:fold', () => {
  console.log('Player folded');
});

actions.on('action:raise', (data) => {
  console.log('Player raised to:', data.amount);
});
```

## API Reference

### Global API
```javascript
// Component management
window.pokerGameComponents.createComponent(name, options)
window.pokerGameComponents.mountComponent(component, container)
window.pokerGameComponents.destroyComponent(componentId)

// Component discovery
window.pokerGameComponents.getComponentInstance(id)
window.pokerGameComponents.getComponentInstances(name)

// Performance
window.pokerGameComponents.getPerformanceMetrics()
window.pokerGameComponents.getComponentMetrics(componentName)

// Cache management
window.pokerGameComponents.clearCache()
```

### Component API
```javascript
// Lifecycle
component.updateProps(newProps)
component.setState(newState)
component.destroy()
component.render()

// Events
component.emit(event, data)
component.on(event, callback)
component.off(event, callback)

// Utilities
component.shouldInvalidateCache()
component.getId()
component.getProps()
component.getState()
```

## Troubleshooting

### Common Issues

1. **Component not rendering**
   - Check if component is properly mounted
   - Verify container element exists
   - Check for JavaScript errors

2. **Events not firing**
   - Ensure event listeners are properly attached
   - Check event names and namespaces
   - Verify component is not destroyed

3. **Performance issues**
   - Check component caching settings
   - Monitor performance metrics
   - Optimize component rendering

4. **Accessibility issues**
   - Verify ARIA attributes are present
   - Test keyboard navigation
   - Check screen reader output

### Debug Tools

```javascript
// Enable debug mode
window.pokerGameComponents.enableDebugMode();

// Get component tree
console.log(window.pokerGameComponents.getComponentTree());

// Get performance metrics
console.log(window.pokerGameComponents.getPerformanceMetrics());

// Get active components
console.log(window.pokerGameComponents.getActiveComponents());
```

## Migration Guide

### From Legacy Components
1. Identify legacy components
2. Create new component equivalents
3. Migrate props and events
4. Update component usage
5. Test functionality
6. Remove legacy code

### Version Compatibility
- v1.x: Legacy components
- v2.x: Current component system
- v3.x: Future enhancements

## Contributing

### Adding New Components
1. Create component class extending BaseComponent
2. Implement render method
3. Define props and events
4. Add component to registry
5. Write documentation
6. Add tests

### Component Guidelines
- Follow naming conventions
- Include proper documentation
- Implement accessibility features
- Add performance monitoring
- Write comprehensive tests

## License

This component library is part of the All-In Chat Poker project and follows the project's licensing terms.
