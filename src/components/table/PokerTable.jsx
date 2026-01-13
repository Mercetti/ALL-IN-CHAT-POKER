/**
 * Poker Table Component
 * Interactive poker table with themes and animations
 */

import React, { useState, useRef, useEffect } from 'react';
import { PlayingCard, CardTable } from '../cards';
import { Chip, ChipPot, ChipStack } from '../chips';
import './PokerTable.css';

const PokerTable = ({
  theme = 'classic',
  size = 'medium',
  players = [],
  communityCards = [],
  pot = 0,
  dealerPosition = 0,
  currentPlayer = 0,
  onPlayerClick,
  onCardClick,
  onChipClick,
  onTableClick,
  animated = true,
  interactive = true,
  showDealerButton = true,
  showPot = true,
  className = '',
  style = {}
}) => {
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const tableRef = useRef(null);

  const tableThemes = {
    classic: {
      background: 'radial-gradient(ellipse at center, #2a5434 0%, #1a3420 100%)',
      border: '#8b4513',
      shadow: 'inset 0 0 50px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.2)',
      playerSeat: '#4a5568',
      communityArea: 'rgba(0, 0, 0, 0.2)'
    },
    modern: {
      background: 'radial-gradient(ellipse at center, #1a365d 0%, #0f172a 100%)',
      border: '#2563eb',
      shadow: 'inset 0 0 60px rgba(0, 0, 0, 0.4), 0 15px 40px rgba(0, 0, 0, 0.3)',
      playerSeat: '#374151',
      communityArea: 'rgba(37, 99, 235, 0.1)'
    },
    luxury: {
      background: 'radial-gradient(ellipse at center, #744210 0%, #451a03 100%)',
      border: '#d97706',
      shadow: 'inset 0 0 70px rgba(0, 0, 0, 0.5), 0 20px 50px rgba(0, 0, 0, 0.4)',
      playerSeat: '#92400e',
      communityArea: 'rgba(217, 119, 6, 0.1)'
    },
    neon: {
      background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 100%)',
      border: '#00ff88',
      shadow: 'inset 0 0 80px rgba(0, 255, 136, 0.3), 0 25px 60px rgba(0, 0, 0, 0.5)',
      playerSeat: '#334155',
      communityArea: 'rgba(0, 255, 136, 0.05)'
    },
    minimal: {
      background: 'radial-gradient(ellipse at center, #f8fafc 0%, #e2e8f0 100%)',
      border: '#cbd5e0',
      shadow: 'inset 0 0 30px rgba(0, 0, 0, 0.1), 0 5px 20px rgba(0, 0, 0, 0.1)',
      playerSeat: '#e2e8f0',
      communityArea: 'rgba(203, 213, 224, 0.3)'
    }
  };

  const tableSizes = {
    small: { width: '400px', height: '300px', fontSize: '12px' },
    medium: { width: '600px', height: '400px', fontSize: '14px' },
    large: { width: '800px', height: '500px', fontSize: '16px' },
    xlarge: { width: '1000px', height: '600px', fontSize: '18px' }
  };

  const currentTheme = tableThemes[theme] || tableThemes.classic;
  const currentSize = tableSizes[size] || tableSizes.medium;

  useEffect(() => {
    if (animated && !isAnimating) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [animated, isAnimating]);

  const handlePlayerClick = (player, index) => {
    if (!interactive) return;
    
    setSelectedPlayer(player.id || index);
    if (onPlayerClick) {
      onPlayerClick(player, index);
    }
  };

  const handleTableClick = (e) => {
    if (!interactive) return;
    
    if (onTableClick) {
      onTableClick(e);
    }
  };

  const getPlayerPosition = (index, totalPlayers) => {
    const angle = (index / totalPlayers) * 2 * Math.PI - Math.PI / 2;
    const radius = Math.min(currentSize.width, currentSize.height) * 0.35;
    
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  const getTableClasses = () => {
    const classes = [
      'poker-table',
      `poker-table--${theme}`,
      `poker-table--${size}`,
      animated && 'poker-table--animated',
      isAnimating && 'poker-table--animating',
      interactive && 'poker-table--interactive',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const getTableStyle = () => {
    return {
      width: currentSize.width,
      height: currentSize.height,
      fontSize: currentSize.fontSize,
      background: currentTheme.background,
      border: `4px solid ${currentTheme.border}`,
      boxShadow: currentTheme.shadow,
      ...style
    };
  };

  const renderPlayerSeats = () => {
    return players.map((player, index) => {
      const position = getPlayerPosition(index, players.length);
      const isDealer = index === dealerPosition;
      const isCurrentPlayer = index === currentPlayer;
      const isHovered = hoveredPlayer === (player.id || index);
      const isSelected = selectedPlayer === (player.id || index);

      return (
        <div
          key={player.id || index}
          className={`poker-table__player-seat ${isDealer ? 'poker-table__player-seat--dealer' : ''} ${isCurrentPlayer ? 'poker-table__player-seat--current' : ''} ${isHovered ? 'poker-table__player-seat--hovered' : ''} ${isSelected ? 'poker-table__player-seat--selected' : ''}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
            background: currentTheme.playerSeat,
            border: isCurrentPlayer ? '3px solid #3182ce' : '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: interactive ? 'pointer' : 'default',
            transition: 'all 0.3s ease',
            zIndex: isCurrentPlayer ? 10 : 1
          }}
          onClick={() => handlePlayerClick(player, index)}
          onMouseEnter={() => setHoveredPlayer(player.id || index)}
          onMouseLeave={() => setHoveredPlayer(null)}
        >
          {/* Player avatar */}
          <div className="poker-table__player-avatar">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} />
            ) : (
              <div className="poker-table__player-avatar-placeholder">
                {player.name ? player.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
          
          {/* Player name */}
          <div className="poker-table__player-name">
            {player.name || `Player ${index + 1}`}
          </div>
          
          {/* Player chips */}
          {player.chips > 0 && (
            <div className="poker-table__player-chips">
              ${player.chips}
            </div>
          )}
          
          {/* Dealer button */}
          {isDealer && showDealerButton && (
            <div className="poker-table__dealer-button">
              D
            </div>
          )}
          
          {/* Current player indicator */}
          {isCurrentPlayer && (
            <div className="poker-table__current-indicator" />
          )}
        </div>
      );
    });
  };

  const renderCommunityCards = () => {
    if (communityCards.length === 0) return null;

    return (
      <div className="poker-table__community-cards">
        <div className="poker-table__community-area" style={{ background: currentTheme.communityArea }}>
          {communityCards.map((card, index) => (
            <PlayingCard
              key={card.id || index}
              rank={card.rank}
              suit={card.suit}
              faceDown={card.faceDown}
              selected={card.selected}
              disabled={card.disabled}
              animated={animated}
              size="large"
              onClick={(e) => onCardClick && onCardClick(card, index, e)}
              style={{
                animationDelay: `${index * 100}ms`,
                margin: '0 4px'
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderPot = () => {
    if (!showPot || pot === 0) return null;

    return (
      <div className="poker-table__pot">
        <div className="poker-table__pot-display">
          <div className="poker-table__pot-label">Pot</div>
          <div className="poker-table__pot-amount">${pot}</div>
        </div>
        
        {/* Pot chips visualization */}
        <div className="poker-table__pot-chips">
          <ChipPot
            chips={[]} // Could be populated with actual pot chips
            total={pot}
            potStyle="circle"
            animated={false}
            showTotal={false}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={tableRef}
      className={getTableClasses()}
      style={getTableStyle()}
      onClick={handleTableClick}
    >
      {/* Table surface */}
      <div className="poker-table__surface">
        {/* Community cards */}
        {renderCommunityCards()}
        
        {/* Pot */}
        {renderPot()}
        
        {/* Player seats */}
        {renderPlayerSeats()}
        
        {/* Table center decoration */}
        <div className="poker-table__center">
          <div className="poker-table__logo">
            ♠
          </div>
        </div>
      </div>
      
      {/* Interactive overlay */}
      {interactive && (
        <div className="poker-table__overlay" />
      )}
    </div>
  );
};

// Table theme selector component
export const TableThemeSelector = ({
  currentTheme = 'classic',
  onThemeChange,
  availableThemes = ['classic', 'modern', 'luxury', 'neon', 'minimal'],
  className = '',
  style = {}
}) => {
  const themePreviews = {
    classic: { background: '#2a5434', border: '#8b4513' },
    modern: { background: '#1a365d', border: '#2563eb' },
    luxury: { background: '#744210', border: '#d97706' },
    neon: { background: '#1e293b', border: '#00ff88' },
    minimal: { background: '#f8fafc', border: '#cbd5e0' }
  };

  return (
    <div className={`table-theme-selector ${className}`} style={style}>
      <div className="table-theme-selector__label">
        Table Theme
      </div>
      <div className="table-theme-selector__themes">
        {availableThemes.map(theme => (
          <button
            key={theme}
            className={`table-theme-selector__theme ${currentTheme === theme ? 'table-theme-selector__theme--active' : ''}`}
            style={{
              background: themePreviews[theme].background,
              border: `2px solid ${themePreviews[theme].border}`
            }}
            onClick={() => onThemeChange && onThemeChange(theme)}
            title={theme.charAt(0).toUpperCase() + theme.slice(1)}
          >
            <div className="table-theme-selector__theme-preview">
              <div className="table-theme-selector__mini-table" />
            </div>
            <div className="table-theme-selector__theme-name">
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Table size selector component
export const TableSizeSelector = ({
  currentSize = 'medium',
  onSizeChange,
  availableSizes = ['small', 'medium', 'large', 'xlarge'],
  className = '',
  style = {}
}) => {
  const sizeLabels = {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    xlarge: 'X-Large'
  };

  return (
    <div className={`table-size-selector ${className}`} style={style}>
      <div className="table-size-selector__label">
        Table Size
      </div>
      <div className="table-size-selector__sizes">
        {availableSizes.map(size => (
          <button
            key={size}
            className={`table-size-selector__size ${currentSize === size ? 'table-size-selector__size--active' : ''}`}
            onClick={() => onSizeChange && onSizeChange(size)}
          >
            <div className="table-size-selector__size-preview">
              <div className={`table-size-selector__mini-table table-size-selector__mini-table--${size}`} />
            </div>
            <div className="table-size-selector__size-name">
              {sizeLabels[size]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PokerTable;
