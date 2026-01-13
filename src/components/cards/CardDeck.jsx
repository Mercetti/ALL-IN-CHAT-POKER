/**
 * Card Deck Component
 * Advanced card deck with shuffling, dealing, and animation features
 */

import React, { useState, useRef, useEffect } from 'react';
import PlayingCard from './PlayingCard';
import './CardDeck.css';

const CardDeck = ({
  cards = [],
  onCardDraw,
  onCardClick,
  onCardDoubleClick,
  onShuffle,
  onReset,
  deckStyle = 'standard',
  animationSpeed = 'normal',
  showCardCount = true,
  allowManualDraw = true,
  allowShuffle = true,
  allowReset = false,
  className = '',
  style = {}
}) => {
  const [isShuffling, setIsShuffling] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [deckPosition, setDeckPosition] = useState({ x: 0, y: 0 });
  const deckRef = useRef(null);

  // Initialize deck if cards not provided
  const [deckCards, setDeckCards] = useState(() => {
    if (cards.length > 0) return cards;
    return createStandardDeck();
  });

  function createStandardDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          id: `${rank}-${suit}`,
          rank,
          suit,
          faceDown: true,
          selected: false,
          disabled: false
        });
      }
    }
    
    return deck;
  }

  const handleCardClick = (card, index, e) => {
    if (card.disabled || isDrawing || isShuffling) return;
    
    if (onCardClick) {
      onCardClick(card, index, e);
    }
  };

  const handleCardDoubleClick = (card, index, e) => {
    if (card.disabled || isDrawing || isShuffling) return;
    
    if (onCardDoubleClick) {
      onCardDoubleClick(card, index, e);
    }
  };

  const drawCard = () => {
    if (deckCards.length === 0 || isDrawing || isShuffling) return null;
    
    setIsDrawing(true);
    
    // Get the top card
    const drawnCard = deckCards[deckCards.length - 1];
    
    // Remove from deck
    const newDeck = deckCards.slice(0, -1);
    setDeckCards(newDeck);
    
    // Reset drawing state
    setTimeout(() => {
      setIsDrawing(false);
    }, 300);
    
    // Notify parent
    if (onCardDraw) {
      onCardDraw(drawnCard, newDeck.length);
    }
    
    return drawnCard;
  };

  const shuffleDeck = () => {
    if (isShuffling || isDrawing) return;
    
    setIsShuffling(true);
    
    // Perform shuffle animation
    setTimeout(() => {
      const shuffled = [...deckCards];
      
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      setDeckCards(shuffled);
      setIsShuffling(false);
      
      if (onShuffle) {
        onShuffle(shuffled);
      }
    }, getAnimationDuration());
  };

  const resetDeck = () => {
    if (isShuffling || isDrawing) return;
    
    const newDeck = createStandardDeck();
    setDeckCards(newDeck);
    setSelectedCards([]);
    
    if (onReset) {
      onReset(newDeck);
    }
  };

  const getAnimationDuration = () => {
    switch (animationSpeed) {
      case 'slow': return 1000;
      case 'fast': return 300;
      default: return 600;
    }
  };

  const getDeckClasses = () => {
    const classes = [
      'card-deck',
      `card-deck--${deckStyle}`,
      isShuffling && 'card-deck--shuffling',
      isDrawing && 'card-deck--drawing',
      allowManualDraw && 'card-deck--interactive',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderDeckCards = () => {
    const maxVisibleCards = Math.min(deckCards.length, 5);
    const cards = [];
    
    for (let i = 0; i < maxVisibleCards; i++) {
      const cardIndex = deckCards.length - 1 - i;
      const card = deckCards[cardIndex];
      
      cards.push(
        <div
          key={card.id}
          className="card-deck__card-wrapper"
          style={{
            transform: `translate(${i * 2}px, ${i * 2}px)`,
            zIndex: maxVisibleCards - i
          }}
        >
          <PlayingCard
            rank={card.rank}
            suit={card.suit}
            faceDown={card.faceDown}
            selected={card.selected}
            disabled={card.disabled}
            animated={false}
            size="medium"
            onClick={(e) => handleCardClick(card, cardIndex, e)}
            onDoubleClick={(e) => handleCardDoubleClick(card, cardIndex, e)}
          />
        </div>
      );
    }
    
    return cards;
  };

  return (
    <div
      ref={deckRef}
      className={getDeckClasses()}
      style={style}
    >
      {/* Deck shadow */}
      <div className="card-deck__shadow" />
      
      {/* Deck cards */}
      <div className="card-deck__cards" onClick={allowManualDraw ? drawCard : undefined}>
        {renderDeckCards()}
      </div>
      
      {/* Card count indicator */}
      {showCardCount && (
        <div className="card-deck__count">
          {deckCards.length}
        </div>
      )}
      
      {/* Deck controls */}
      <div className="card-deck__controls">
        {allowShuffle && (
          <button
            className="card-deck__control card-deck__control--shuffle"
            onClick={shuffleDeck}
            disabled={isShuffling || isDrawing || deckCards.length === 0}
            title="Shuffle deck"
          >
            🔀
          </button>
        )}
        
        {allowReset && (
          <button
            className="card-deck__control card-deck__control--reset"
            onClick={resetDeck}
            disabled={isShuffling || isDrawing}
            title="Reset deck"
          >
            🔄
          </button>
        )}
      </div>
      
      {/* Deck status */}
      {(isShuffling || isDrawing) && (
        <div className="card-deck__status">
          {isShuffling ? 'Shuffling...' : 'Drawing...'}
        </div>
      )}
    </div>
  );
};

// Card pile component
export const CardPile = ({
  cards = [],
  title,
  onCardClick,
  onCardDoubleClick,
  pileStyle = 'stack',
  maxVisibleCards = 5,
  animated = true,
  className = '',
  style = {}
}) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleCardClick = (card, index, e) => {
    if (onCardClick) {
      onCardClick(card, index, e);
    }
  };

  const handleCardDoubleClick = (card, index, e) => {
    if (onCardDoubleClick) {
      onCardDoubleClick(card, index, e);
    }
  };

  const getVisibleCards = () => {
    if (pileStyle === 'fan') {
      return cards.slice(-maxVisibleCards);
    }
    return cards.slice(-Math.min(cards.length, maxVisibleCards));
  };

  const getCardTransform = (index, total) => {
    switch (pileStyle) {
      case 'fan':
        const angle = (index - (total - 1) / 2) * 15;
        return `rotate(${angle}deg) translateX(${Math.abs(angle) * 0.5}px)`;
      case 'stack':
        return `translate(${index * 1}px, ${index * 1}px)`;
      case 'spread':
        return `translateX(${index * 15}px)`;
      default:
        return `translate(${index * 2}px, ${index * 2}px)`;
    }
  };

  return (
    <div className={`card-pile card-pile--${pileStyle} ${className}`} style={style}>
      {title && (
        <div className="card-pile__title">
          {title}
        </div>
      )}
      
      <div className="card-pile__cards">
        {getVisibleCards().map((card, index) => (
          <div
            key={card.id || index}
            className="card-pile__card-wrapper"
            style={{
              transform: getCardTransform(index, getVisibleCards().length),
              zIndex: index
            }}
            onMouseEnter={() => setHoveredCard(card.id || index)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <PlayingCard
              rank={card.rank}
              suit={card.suit}
              faceDown={card.faceDown}
              selected={card.selected}
              disabled={card.disabled}
              animated={animated}
              size="medium"
              onClick={(e) => handleCardClick(card, index, e)}
              onDoubleClick={(e) => handleCardDoubleClick(card, index, e)}
              style={{
                transform: hoveredCard === (card.id || index) ? 'scale(1.05)' : 'scale(1)'
              }}
            />
          </div>
        ))}
      </div>
      
      {cards.length > maxVisibleCards && (
        <div className="card-pile__overflow">
          +{cards.length - maxVisibleCards}
        </div>
      )}
    </div>
  );
};

// Card table component
export const CardTable = ({
  communityCards = [],
  playerHands = [],
  pot = 0,
  onCardClick,
  onCardDoubleClick,
  tableStyle = 'poker',
  animated = true,
  className = '',
  style = {}
}) => {
  const [selectedCards, setSelectedCards] = useState([]);

  const handleCardClick = (card, index, e) => {
    const cardId = card.id || `${card.rank}-${card.suit}`;
    
    setSelectedCards(prev => {
      const newSelected = prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId];
      return newSelected;
    });
    
    if (onCardClick) {
      onCardClick(card, index, e);
    }
  };

  const handleCardDoubleClick = (card, index, e) => {
    if (onCardDoubleClick) {
      onCardDoubleClick(card, index, e);
    }
  };

  return (
    <div className={`card-table card-table--${tableStyle} ${className}`} style={style}>
      {/* Table surface */}
      <div className="card-table__surface">
        {/* Community cards area */}
        <div className="card-table__community-cards">
          {communityCards.map((card, index) => (
            <PlayingCard
              key={card.id || index}
              rank={card.rank}
              suit={card.suit}
              faceDown={card.faceDown}
              selected={selectedCards.includes(card.id || `${card.rank}-${card.suit}`)}
              disabled={card.disabled}
              animated={animated}
              size="large"
              onClick={(e) => handleCardClick(card, index, e)}
              onDoubleClick={(e) => handleCardDoubleClick(card, index, e)}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            />
          ))}
        </div>
        
        {/* Player hands */}
        <div className="card-table__player-hands">
          {playerHands.map((hand, playerIndex) => (
            <div
              key={playerIndex}
              className="card-table__player-hand"
              style={{
                transform: `rotate(${(playerIndex - playerHands.length / 2) * 15}deg)`
              }}
            >
              {hand.map((card, cardIndex) => (
                <PlayingCard
                  key={card.id || `${playerIndex}-${cardIndex}`}
                  rank={card.rank}
                  suit={card.suit}
                  faceDown={card.faceDown}
                  selected={selectedCards.includes(card.id || `${card.rank}-${card.suit}`)}
                  disabled={card.disabled}
                  animated={animated}
                  size="medium"
                  onClick={(e) => handleCardClick(card, cardIndex, e)}
                  onDoubleClick={(e) => handleCardDoubleClick(card, cardIndex, e)}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Pot display */}
        {pot > 0 && (
          <div className="card-table__pot">
            <div className="card-table__pot-label">Pot</div>
            <div className="card-table__pot-amount">${pot}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardDeck;
