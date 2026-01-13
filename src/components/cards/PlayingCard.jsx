/**
 * Playing Card Component
 * Modern, animated playing card component for poker game
 */

import React, { useState, useRef, useEffect } from 'react';
import './PlayingCard.css';

const PlayingCard = ({
  rank,
  suit,
  faceDown = false,
  selected = false,
  disabled = false,
  animated = true,
  size = 'medium',
  onClick,
  onDoubleClick,
  className = '',
  style = {},
  revealAnimation = true,
  hoverable = true,
  glowEffect = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isFlipped, setIsFlipped] = useState(faceDown);
  const cardRef = useRef(null);

  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };

  const suitColors = {
    hearts: '#e53e3e',
    diamonds: '#e53e3e',
    clubs: '#2d3748',
    spades: '#2d3748'
  };

  const cardSizes = {
    small: { width: '60px', height: '84px', fontSize: '12px' },
    medium: { width: '80px', height: '112px', fontSize: '16px' },
    large: { width: '100px', height: '140px', fontSize: '20px' },
    xlarge: { width: '120px', height: '168px', fontSize: '24px' }
  };

  const currentSize = cardSizes[size] || cardSizes.medium;

  useEffect(() => {
    if (revealAnimation && !faceDown && isFlipped) {
      setIsRevealing(true);
      setTimeout(() => {
        setIsFlipped(false);
        setIsRevealing(false);
      }, 600);
    } else {
      setIsFlipped(faceDown);
    }
  }, [faceDown, revealAnimation, isFlipped]);

  const handleClick = (e) => {
    if (disabled) return;
    
    if (onClick) {
      onClick(e);
    }
  };

  const handleDoubleClick = (e) => {
    if (disabled) return;
    
    if (onDoubleClick) {
      onDoubleClick(e);
    }
  };

  const getCardClasses = () => {
    const classes = [
      'playing-card',
      `playing-card--${size}`,
      selected && 'playing-card--selected',
      disabled && 'playing-card--disabled',
      isHovered && 'playing-card--hovered',
      isFlipped && 'playing-card--flipped',
      isRevealing && 'playing-card--revealing',
      animated && 'playing-card--animated',
      hoverable && 'playing-card--hoverable',
      glowEffect && 'playing-card--glow',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const getCardStyle = () => {
    return {
      width: currentSize.width,
      height: currentSize.height,
      fontSize: currentSize.fontSize,
      ...style
    };
  };

  const renderCardContent = () => {
    if (isFlipped) {
      return (
        <div className="playing-card__back">
          <div className="playing-card__back-pattern">
            <div className="playing-card__back-design">
              <div className="playing-card__back-logo">♠</div>
            </div>
          </div>
        </div>
      );
    }

    const suitSymbol = suitSymbols[suit];
    const suitColor = suitColors[suit];

    return (
      <div className="playing-card__front">
        <div className="playing-card__corner playing-card__corner--top-left">
          <div className="playing-card__rank" style={{ color: suitColor }}>
            {rank}
          </div>
          <div className="playing-card__suit" style={{ color: suitColor }}>
            {suitSymbol}
          </div>
        </div>
        
        <div className="playing-card__corner playing-card__corner--top-right">
          <div className="playing-card__rank" style={{ color: suitColor }}>
            {rank}
          </div>
          <div className="playing-card__suit" style={{ color: suitColor }}>
            {suitSymbol}
          </div>
        </div>
        
        <div className="playing-card__center">
          <div 
            className="playing-card__center-suit" 
            style={{ color: suitColor }}
          >
            {suitSymbol}
          </div>
        </div>
        
        <div className="playing-card__corner playing-card__corner--bottom-left">
          <div className="playing-card__rank playing-card__rank--inverted" style={{ color: suitColor }}>
            {rank}
          </div>
          <div className="playing-card__suit playing-card__suit--inverted" style={{ color: suitColor }}>
            {suitSymbol}
          </div>
        </div>
        
        <div className="playing-card__corner playing-card__corner--bottom-right">
          <div className="playing-card__rank playing-card__rank--inverted" style={{ color: suitColor }}>
            {rank}
          </div>
          <div className="playing-card__suit playing-card__suit--inverted" style={{ color: suitColor }}>
            {suitSymbol}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      className={getCardClasses()}
      style={getCardStyle()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => hoverable && setIsHovered(true)}
      onMouseLeave={() => hoverable && setIsHovered(false)}
      onTouchStart={() => hoverable && setIsHovered(true)}
      onTouchEnd={() => hoverable && setIsHovered(false)}
    >
      <div className="playing-card__inner">
        {renderCardContent()}
      </div>
      
      {/* Glow effect overlay */}
      {glowEffect && selected && (
        <div className="playing-card__glow-overlay" />
      )}
      
      {/* Selection indicator */}
      {selected && (
        <div className="playing-card__selection-indicator" />
      )}
    </div>
  );
};

// Card deck component
export const CardDeck = ({
  cards = [],
  onCardClick,
  onCardDoubleClick,
  cardSize = 'medium',
  spacing = 'tight',
  animated = true,
  className = '',
  style = {}
}) => {
  const getSpacingClass = () => {
    switch (spacing) {
      case 'tight': return 'card-deck--tight';
      case 'loose': return 'card-deck--loose';
      case 'spread': return 'card-deck--spread';
      default: return '';
    }
  };

  return (
    <div 
      className={`card-deck ${getSpacingClass()} ${className}`}
      style={style}
    >
      {cards.map((card, index) => (
        <PlayingCard
          key={card.id || index}
          rank={card.rank}
          suit={card.suit}
          faceDown={card.faceDown}
          selected={card.selected}
          disabled={card.disabled}
          animated={animated}
          size={cardSize}
          onClick={(e) => onCardClick && onCardClick(card, index, e)}
          onDoubleClick={(e) => onCardDoubleClick && onCardDoubleClick(card, index, e)}
          style={{
            zIndex: cards.length - index,
            transform: spacing === 'spread' ? `rotate(${(index - cards.length / 2) * 3}deg)` : undefined
          }}
        />
      ))}
    </div>
  );
};

// Card hand component
export const CardHand = ({
  cards = [],
  onCardSelect,
  onCardPlay,
  selectedCards = [],
  cardSize = 'medium',
  animated = true,
  className = '',
  style = {}
}) => {
  const handleCardClick = (card, index, e) => {
    if (onCardSelect) {
      onCardSelect(card, index, e);
    }
  };

  const handleCardDoubleClick = (card, index, e) => {
    if (onCardPlay) {
      onCardPlay(card, index, e);
    }
  };

  return (
    <div 
      className={`card-hand ${className}`}
      style={style}
    >
      {cards.map((card, index) => (
        <PlayingCard
          key={card.id || index}
          rank={card.rank}
          suit={card.suit}
          faceDown={card.faceDown}
          selected={selectedCards.includes(card.id || index)}
          disabled={card.disabled}
          animated={animated}
          size={cardSize}
          onClick={(e) => handleCardClick(card, index, e)}
          onDoubleClick={(e) => handleCardDoubleClick(card, index, e)}
          style={{
            transform: `translateY(${selectedCards.includes(card.id || index) ? -20 : 0}px)`,
            transition: 'transform 0.2s ease'
          }}
        />
      ))}
    </div>
  );
};

// Card stack component
export const CardStack = ({
  count = 52,
  faceDown = true,
  size = 'medium',
  animated = true,
  onDrawCard,
  className = '',
  style = {}
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const stackRef = useRef(null);

  const handleStackClick = () => {
    if (onDrawCard && !isDrawing) {
      setIsDrawing(true);
      onDrawCard();
      setTimeout(() => setIsDrawing(false), 300);
    }
  };

  return (
    <div 
      ref={stackRef}
      className={`card-stack ${isDrawing ? 'card-stack--drawing' : ''} ${className}`}
      style={style}
      onClick={handleStackClick}
    >
      {/* Stack shadow effect */}
      <div className="card-stack__shadow" />
      
      {/* Stack cards */}
      {Array.from({ length: Math.min(count, 5) }).map((_, index) => (
        <div
          key={index}
          className="card-stack__card"
          style={{
            ...cardSizes[size],
            transform: `translate(${index * 2}px, ${index * 2}px)`,
            zIndex: 5 - index
          }}
        >
          <PlayingCard
            rank="A"
            suit="spades"
            faceDown={faceDown}
            animated={false}
            size={size}
            disabled={!onDrawCard}
          />
        </div>
      ))}
      
      {/* Card count indicator */}
      {count > 5 && (
        <div className="card-stack__count">
          +{count - 5}
        </div>
      )}
    </div>
  );
};

// Card placeholder component
export const CardPlaceholder = ({
  size = 'medium',
  animated = true,
  className = '',
  style = {}
}) => {
  return (
    <div 
      className={`card-placeholder ${animated ? 'card-placeholder--animated' : ''} ${className}`}
      style={{
        width: cardSizes[size].width,
        height: cardSizes[size].height,
        ...style
      }}
    >
      <div className="card-placeholder__content">
        <div className="card-placeholder__icon">🃏</div>
      </div>
    </div>
  );
};

export default PlayingCard;
