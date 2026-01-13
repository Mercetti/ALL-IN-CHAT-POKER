/**
 * Swipeable Card Component
 * Mobile-optimized card with swipe gestures for poker game
 */

import React, { useState, useRef, useEffect } from 'react';
import { TouchGesture } from '../TouchGesture';
import './mobile/SwipeableCard.css';

const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onSwipe,
  onSwipeStart,
  onSwipeEnd,
  threshold = 50,
  velocityThreshold = 0.3,
  className = '',
  style = {},
  disabled = false,
  swipeDirection = 'horizontal',
  showSwipeHint = false,
  swipeHintText = 'Swipe to interact',
  cardStyle = 'default'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [showHint, setShowHint] = useState(showSwipeHint);
  const cardRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    if (showSwipeHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint]);

  const handleSwipeStart = (data) => {
    if (disabled) return;
    
    setIsDragging(true);
    dragStartRef.current = {
      x: data.startX,
      y: data.startY,
      time: Date.now()
    };
    
    setDragOffset({ x: 0, y: 0 });
    setShowHint(false);
    
    if (onSwipeStart) {
      onSwipeStart(data);
    }
  };

  const handleSwipeMove = (data) => {
    if (!isDragging || disabled) return;
    
    const deltaX = data.currentX - dragStartRef.current.x;
    const deltaY = data.currentY - dragStartRef.current.y;
    
    // Limit drag based on swipe direction
    let limitedX = deltaX;
    let limitedY = deltaY;
    
    if (swipeDirection === 'horizontal') {
      limitedY = 0;
      limitedX = Math.max(-100, Math.min(100, deltaX));
    } else if (swipeDirection === 'vertical') {
      limitedX = 0;
      limitedY = Math.max(-100, Math.min(100, deltaY));
    }
    
    setDragOffset({ x: limitedX, y: limitedY });
    
    // Determine swipe direction based on movement
    if (Math.abs(limitedX) > Math.abs(limitedY)) {
      setSwipeDirection(limitedX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(limitedY > 0 ? 'down' : 'up');
    }
    
    if (onSwipe) {
      onSwipe({
        ...data,
        offsetX: limitedX,
        offsetY: limitedY,
        direction: swipeDirection
      });
    }
  };

  const handleSwipeEnd = (data) => {
    if (!isDragging || disabled) return;
    
    setIsDragging(false);
    const deltaX = data.endX - dragStartRef.current.x;
    const deltaY = data.endY - dragStartRef.current.y;
    const deltaTime = Date.now() - dragStartRef.current.time;
    
    const velocityX = Math.abs(deltaX) / deltaTime * 1000;
    const velocityY = Math.abs(deltaY) / deltaTime * 1000;
    
    let triggered = false;
    
    // Check if swipe meets threshold and velocity requirements
    if (Math.abs(deltaX) > threshold && velocityX > velocityThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight(data);
        triggered = true;
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft(data);
        triggered = true;
      }
    }
    
    if (Math.abs(deltaY) > threshold && velocityY > velocityThreshold) {
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown(data);
        triggered = true;
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp(data);
        triggered = true;
      }
    }
    
    // Reset position
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
    
    if (onSwipeEnd) {
      onSwipeEnd({
        ...data,
        triggered,
        deltaX,
        deltaY,
        velocityX,
        velocityY
      });
    }
    
    // Reset drag start reference
    dragStartRef.current = { x: 0, y: 0, time: 0 };
  };

  const getCardStyle = () => {
    const baseStyle = {
      transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
      transition: isDragging ? 'none' : 'transform 0.3s ease',
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'grab'
    };
    
    // Add card-specific styles
    switch (cardStyle) {
      case 'poker':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '2px solid #4a5568',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        };
      case 'action':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        };
      case 'success':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        };
      case 'danger':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        };
      default:
        return {
          ...baseStyle,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        };
    }
  };

  const getSwipeIndicatorStyle = () => {
    if (!swipeDirection) return {};
    
    const baseStyle = {
      position: 'absolute',
      top: '50%',
      width: '40px',
      height: '40px',
      background: 'rgba(255, 255, 255, 0.9)',
      border: '2px solid #4a5568',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      color: '#4a5568',
      pointerEvents: 'none',
      opacity: 0.8,
      transition: 'opacity 0.3s ease'
    };
    
    switch (swipeDirection) {
      case 'left':
        return { ...baseStyle, left: '10px', transform: 'translateY(-50%)' };
      case 'right':
        return { ...baseStyle, right: '10px', transform: 'translateY(-50%)' };
      case 'up':
        return { ...baseStyle, top: '10px', left: '50%', transform: 'translateX(-50%)' };
      case 'down':
        return { ...baseStyle, bottom: '10px', left: '50%', transform: 'translateX(-50%)' };
      default:
        return baseStyle;
    }
  };

  return (
    <div
      ref={cardRef}
      className={`swipeable-card ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '120px',
        ...getCardStyle(),
        ...style
      }}
    >
      {/* Card content */}
      <div className="card-content">
        {children}
      </div>
      
      {/* Swipe direction indicator */}
      {isDragging && swipeDirection && (
        <div className="swipe-indicator" style={getSwipeIndicatorStyle()}>
          {swipeDirection === 'left' && '←'}
          {swipeDirection === 'right' && '→'}
          {swipeDirection === 'up' && '↑'}
          {swipeDirection === 'down' && '↓'}
        </div>
      )}
      
      {/* Swipe hint */}
      {showHint && !isDragging && (
        <div className="swipe-hint">
          {swipeHintText}
        </div>
      )}
      
      {/* Swipe hint arrow */}
      {showHint && !isDragging && (
        <div className={`swipe-hint-arrow ${swipeDirection || swipeDirection}`}>
          <div className="arrow-icon" />
        </div>
      )}
    </div>
  );
};

// Poker card component
export const PokerCard = ({ 
  rank, 
  suit, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  disabled = false,
  className = '' 
}) => {
  const getSuitSymbol = (suit) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const getSuitColor = (suit) => {
    return (suit === 'hearts' || suit === 'diamonds') ? '#e53e3e' : '#2d3748';
  };

  return (
    <SwipeableCard
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      onSwipeUp={onSwipeUp}
      onSwipeDown={onSwipeDown}
      disabled={disabled}
      cardStyle="poker"
      className={`poker-card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold'
      }}
    >
      <div className="card-rank" style={{ fontSize: '24px', marginBottom: '4px' }}>
        {rank}
      </div>
      <div 
        className="card-suit" 
        style={{ 
          fontSize: '20px',
          color: getSuitColor(suit)
        }}
      >
        {getSuitSymbol(suit)}
      </div>
    </SwipeableCard>
  );
};

// Action card component
export const ActionCard = ({ 
  action, 
  onSwipeLeft, 
  onSwipeRight, 
  disabled = false,
  className = '' 
}) => {
  const getActionIcon = (action) => {
    switch (action) {
      case 'fold': return '👋';
      case 'check': return '✓';
      case 'call': return '📞';
      case 'raise': return '⬆';
      case 'all-in': return '🎯';
      default: return '🎮';
    }
  };

  return (
    <SwipeableCard
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      disabled={disabled}
      cardStyle="action"
      className={`action-card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold'
      }}
    >
      <div className="action-icon" style={{ fontSize: '24px', marginBottom: '4px' }}>
        {getActionIcon(action)}
      </div>
      <div className="action-text" style={{ fontSize: '14px', textTransform: 'uppercase' }}>
        {action}
      </div>
    </SwipeableCard>
  );
};

// Chip card component
export const ChipCard = ({ 
  amount, 
  onSwipeLeft, 
  onSwipeRight, 
  disabled = false,
  className = '' 
}) => {
  return (
    <SwipeableCard
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      disabled={disabled}
      cardStyle="success"
      className={`chip-card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold'
      }}
    >
      <div className="chip-amount" style={{ fontSize: '20px', marginBottom: '4px' }}>
        ${amount}
      </div>
      <div className="chip-label" style={{ fontSize: '12px', opacity: 0.8 }}>
        CHIPS
      </div>
    </SwipeableCard>
  );
};

export default SwipeableCard;
