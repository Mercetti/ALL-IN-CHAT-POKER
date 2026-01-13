/**
 * Chip Component
 * Animated poker chip component with realistic styling
 */

import React, { useState, useRef, useEffect } from 'react';
import './Chip.css';

const Chip = ({
  value = 1,
  color = 'blue',
  size = 'medium',
  count = 1,
  stacked = false,
  animated = true,
  selectable = false,
  selected = false,
  disabled = false,
  onClick,
  onDoubleClick,
  className = '',
  style = {}
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const chipRef = useRef(null);

  const chipColors = {
    white: '#ffffff',
    red: '#e53e3e',
    green: '#48bb78',
    blue: '#4299e1',
    black: '#2d3748',
    purple: '#9f7aea',
    orange: '#ed8936',
    yellow: '#ecc94b'
  };

  const chipSizes = {
    small: { width: '30px', height: '30px', fontSize: '10px' },
    medium: { width: '40px', height: '40px', fontSize: '12px' },
    large: { width: '50px', height: '50px', fontSize: '14px' },
    xlarge: { width: '60px', height: '60px', fontSize: '16px' }
  };

  const currentColor = chipColors[color] || chipColors.blue;
  const currentSize = chipSizes[size] || chipSizes.medium;

  useEffect(() => {
    if (animated && !isAnimating) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [animated, isAnimating]);

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

  const getChipClasses = () => {
    const classes = [
      'chip',
      `chip--${color}`,
      `chip--${size}`,
      stacked && 'chip--stacked',
      animated && 'chip--animated',
      isAnimating && 'chip--animating',
      selectable && 'chip--selectable',
      selected && 'chip--selected',
      disabled && 'chip--disabled',
      isHovered && 'chip--hovered',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const getChipStyle = () => {
    const baseStyle = {
      width: currentSize.width,
      height: currentSize.height,
      fontSize: currentSize.fontSize,
      backgroundColor: currentColor,
      ...style
    };

    if (stacked && count > 1) {
      // Add stacking effect
      baseStyle.boxShadow = `
        0 1px 3px rgba(0, 0, 0, 0.2),
        0 ${count * 2}px ${count * 2}px rgba(0, 0, 0, 0.1)
      `;
    }

    return baseStyle;
  };

  const renderChipContent = () => {
    if (count === 1) {
      return (
        <div className="chip__value">
          {value}
        </div>
      );
    }

    return (
      <div className="chip__stack">
        <div className="chip__value">
          {value}
        </div>
        <div className="chip__count">
          ×{count}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={chipRef}
      className={getChipClasses()}
      style={getChipStyle()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Chip edge */}
      <div className="chip__edge" />
      
      {/* Chip center */}
      <div className="chip__center">
        {renderChipContent()}
      </div>
      
      {/* Chip highlight */}
      <div className="chip__highlight" />
      
      {/* Selection indicator */}
      {selected && (
        <div className="chip__selection-indicator" />
      )}
      
      {/* Glow effect */}
      {selected && (
        <div className="chip__glow" />
      )}
    </div>
  );
};

// Chip stack component
export const ChipStack = ({
  chips = [],
  onChipClick,
  onChipDoubleClick,
  stackStyle = 'vertical',
  spacing = 'tight',
  animated = true,
  className = '',
  style = {}
}) => {
  const [hoveredChip, setHoveredChip] = useState(null);

  const handleChipClick = (chip, index, e) => {
    if (onChipClick) {
      onChipClick(chip, index, e);
    }
  };

  const handleChipDoubleClick = (chip, index, e) => {
    if (onChipDoubleClick) {
      onChipDoubleClick(chip, index, e);
    }
  };

  const getStackClasses = () => {
    const classes = [
      'chip-stack',
      `chip-stack--${stackStyle}`,
      `chip-stack--${spacing}`,
      animated && 'chip-stack--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const getChipTransform = (index, total) => {
    switch (stackStyle) {
      case 'vertical':
        return `translateY(${-index * 2}px)`;
      case 'horizontal':
        return `translateX(${index * 2}px)`;
      case 'pyramid':
        return `translateY(${-index * 3}px) translateX(${(index - total / 2) * 2}px)`;
      case 'fan':
        const angle = (index - (total - 1) / 2) * 10;
        return `rotate(${angle}deg) translateY(${-Math.abs(angle) * 0.5}px)`;
      default:
        return `translateY(${-index * 2}px)`;
    }
  };

  return (
    <div className={getStackClasses()} style={style}>
      {chips.map((chip, index) => (
        <div
          key={chip.id || index}
          className="chip-stack__chip-wrapper"
          style={{
            transform: getChipTransform(index, chips.length),
            zIndex: chips.length - index
          }}
          onMouseEnter={() => setHoveredChip(chip.id || index)}
          onMouseLeave={() => setHoveredChip(null)}
        >
          <Chip
            value={chip.value}
            color={chip.color}
            size={chip.size || 'medium'}
            count={chip.count || 1}
            stacked={false}
            animated={animated}
            selectable={chip.selectable}
            selected={chip.selected}
            disabled={chip.disabled}
            onClick={(e) => handleChipClick(chip, index, e)}
            onDoubleClick={(e) => handleChipDoubleClick(chip, index, e)}
            style={{
              transform: hoveredChip === (chip.id || index) ? 'scale(1.1)' : 'scale(1)'
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Chip pot component
export const ChipPot = ({
  chips = [],
  total = 0,
  onChipClick,
  animated = true,
  showTotal = true,
  potStyle = 'circle',
  className = '',
  style = {}
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (animated && !isAnimating) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [animated, isAnimating]);

  const calculateTotal = () => {
    if (total > 0) return total;
    return chips.reduce((sum, chip) => sum + (chip.value * (chip.count || 1)), 0);
  };

  const getPotClasses = () => {
    const classes = [
      'chip-pot',
      `chip-pot--${potStyle}`,
      animated && 'chip-pot--animated',
      isAnimating && 'chip-pot--animating',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderChips = () => {
    const maxVisibleChips = 20;
    const visibleChips = chips.slice(0, maxVisibleChips);
    
    return (
      <div className="chip-pot__chips">
        {visibleChips.map((chip, index) => (
          <div
            key={chip.id || index}
            className="chip-pot__chip-wrapper"
            style={{
              transform: `rotate(${(index * 360 / visibleChips.length)}deg) translateX(${60}px)`,
              animationDelay: `${index * 50}ms`
            }}
          >
            <Chip
              value={chip.value}
              color={chip.color}
              size="small"
              count={chip.count || 1}
              stacked={false}
              animated={false}
              onClick={onChipClick ? (e) => onChipClick(chip, index, e) : undefined}
            />
          </div>
        ))}
        
        {chips.length > maxVisibleChips && (
          <div className="chip-pot__overflow">
            +{chips.length - maxVisibleChips}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={getPotClasses()} style={style}>
      {/* Pot shadow */}
      <div className="chip-pot__shadow" />
      
      {/* Pot surface */}
      <div className="chip-pot__surface">
        {renderChips()}
      </div>
      
      {/* Total display */}
      {showTotal && (
        <div className="chip-pot__total">
          <div className="chip-pot__total-label">Pot</div>
          <div className="chip-pot__total-amount">${calculateTotal()}</div>
        </div>
      )}
    </div>
  );
};

// Chip bet component
export const ChipBet = ({
  amount = 0,
  chips = [],
  onAddChip,
  onRemoveChip,
  onClearBet,
  minBet = 1,
  maxBet = 10000,
  animated = true,
  className = '',
  style = {}
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (animated && !isAnimating) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [animated, isAnimating]);

  const handleAddChip = (chip) => {
    if (onAddChip && amount + chip.value <= maxBet) {
      onAddChip(chip);
    }
  };

  const handleRemoveChip = (chip) => {
    if (onRemoveChip && amount - chip.value >= minBet) {
      onRemoveChip(chip);
    }
  };

  const handleClearBet = () => {
    if (onClearBet) {
      onClearBet();
    }
  };

  const standardChips = [
    { value: 1, color: 'white', size: 'small' },
    { value: 5, color: 'red', size: 'small' },
    { value: 10, color: 'blue', size: 'medium' },
    { value: 25, color: 'green', size: 'medium' },
    { value: 100, color: 'black', size: 'large' },
    { value: 500, color: 'purple', size: 'large' }
  ];

  return (
    <div className={`chip-bet ${animated ? 'chip-bet--animated' : ''} ${className}`} style={style}>
      {/* Bet amount display */}
      <div className="chip-bet__amount">
        <div className="chip-bet__amount-label">Current Bet</div>
        <div className="chip-bet__amount-value">${amount}</div>
      </div>
      
      {/* Bet chips */}
      <div className="chip-bet__chips">
        <ChipStack
          chips={chips}
          stackStyle="pyramid"
          spacing="tight"
          animated={false}
        />
      </div>
      
      {/* Chip selector */}
      <div className="chip-bet__selector">
        <div className="chip-bet__selector-label">Add Chips</div>
        <div className="chip-bet__chips-available">
          {standardChips.map((chip, index) => (
            <Chip
              key={index}
              value={chip.value}
              color={chip.color}
              size={chip.size}
              selectable={true}
              disabled={amount + chip.value > maxBet}
              onClick={() => handleAddChip(chip)}
              className="chip-bet__selector-chip"
            />
          ))}
        </div>
      </div>
      
      {/* Bet controls */}
      <div className="chip-bet__controls">
        <button
          className="chip-bet__control chip-bet__control--clear"
          onClick={handleClearBet}
          disabled={amount === 0}
        >
          Clear
        </button>
        
        <button
          className="chip-bet__control chip-bet__control--max"
          onClick={() => onAddChip && onAddChip({ value: maxBet - amount })}
          disabled={amount >= maxBet}
        >
          Max
        </button>
      </div>
    </div>
  );
};

export default Chip;
