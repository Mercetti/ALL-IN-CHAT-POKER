/**
 * Spectator Mode Component
 * Allows users to watch ongoing poker games without participating
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayingCard } from '../cards';
import { Chip, ChipStack, ChipPot } from '../chips';
import { PokerTable } from '../table';
import './SpectatorMode.css';

const SpectatorMode = ({
  gameId,
  gameState,
  players = [],
  communityCards = [],
  pot = 0,
  currentBet = 0,
  dealerPosition = 0,
  currentPlayer = 0,
  tableTheme = 'classic',
  showCards = true,
  showChips = true,
  showPot = true,
  showPlayerInfo = true,
  showStatistics = true,
  allowChat = true,
  allowEmotes = true,
  autoFollow = true,
  followPlayer = null,
  onJoinGame,
  onLeaveGame,
  onSendMessage,
  onSendEmote,
  className = '',
  style = {},
  ...props
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);
  [spectatorCount, setSpectatorCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  [currentMessage, setCurrentMessage] = useState('');
  [emotes, setEmotes] = useState([]);
  const [followedPlayer, setFollowedPlayer] = useState(followPlayer);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'player', 'pot', 'cards'
  const [showUI, setShowUI] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const chatContainerRef = useRef(null);
  const spectatorContainerRef = useRef(null);

  // Simulate spectator connection
  useEffect(() => {
    if (gameId && !isConnected) {
      // Simulate connection delay
      const connectTimer = setTimeout(() => {
        setIsConnected(true);
        setIsSpectating(true);
        setSpectatorCount(prev => prev + 1);
        
        // Add welcome message
        const welcomeMessage = {
          id: Date.now(),
          type: 'system',
          text: `Welcome to spectator mode for game ${gameId}`,
          timestamp: new Date(),
          user: 'System'
        };
        setChatMessages(prev => [...prev, welcomeMessage]);
      }, 1000);
      
      return () => clearTimeout(connectTimer);
    }
  }, [gameId, isConnected]);

  // Auto-follow player if enabled
  useEffect(() => {
    if (autoFollow && currentPlayer !== null && currentPlayer < players.length) {
      setFollowedPlayer(currentPlayer);
    }
  }, [autoFollow, currentPlayer, players.length]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleJoinSpectator = useCallback(() => {
    if (!isConnected && onJoinGame) {
      onJoinGame(gameId);
    }
  }, [isConnected, onJoinGame, gameId]);

  const handleLeaveSpectator = useCallback(() => {
    if (isSpectating && onLeaveGame) {
      onLeaveGame(gameId);
      setIsSpectating(false);
      setSpectatorCount(prev => Math.max(0, prev - 1));
    }
  }, [isSpectating, onLeaveGame, gameId]);

  const handleSendMessage = useCallback(() => {
    if (!currentMessage.trim() || !allowChat) return;
    
    const message = {
      id: Date.now(),
      type: 'spectator',
      text: currentMessage,
      timestamp: new Date(),
      user: `Spectator ${spectatorCount}`
    };
    
    setChatMessages(prev => [...prev, message]);
    setCurrentMessage('');
    
    if (onSendMessage) {
      onSendMessage(message);
    }
  }, [currentMessage, spectatorCount, allowChat, onSendMessage]);

  const handleSendEmote = useCallback((emoji) => {
    if (!allowEmotes) return;
    
    const emoticon = {
      id: Date.now(),
      type: 'emoji',
      emoji: emoji,
      timestamp: new Date(),
      user: `Spectator ${spectatorCount}`
    };
    
    setEmotes(prev => [...prev, emoticon]);
    
    if (onSendEmote) {
      onSendEmote(emoticon);
    }
    
    // Remove emoji after 3 seconds
    setTimeout(() => {
      setEmotes(prev => prev.filter(e => e.id !== emoticon.id));
    }, 3000);
  }, [allowEmotes, spectatorCount, onSendEmote]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleToggleUI = () => {
    setShowUI(!showUI);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      spectatorContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handlePlayerClick = (playerIndex) => {
    setFollowedPlayer(playerIndex);
  };

  const renderSpectatorControls = () => {
    return (
      <div className="spectator-controls">
        <div className="spectator-controls__info">
          <div className="spectator-controls__status">
            <span className={`spectator-controls__indicator ${isConnected ? 'spectator-controls__indicator--connected' : 'spectator-controls__indicator--disconnected'}`} />
            {isConnected ? `${spectatorCount} Spectators` : 'Disconnected'}
          </div>
          <div className="spectator-controls__game-id">
            Game: {gameId || 'N/A'}
          </div>
        </div>
        
        <div className="spectator-controls__actions">
          {!isConnected ? (
            <button
              className="spectator-controls__btn spectator-controls__btn--primary"
              onClick={handleJoinSpectator}
            >
              Join Spectator
            </button>
          ) : (
            <button
              className="spectator-controls__btn spectator-controls__btn--secondary"
              onClick={handleLeaveSpectator}
            >
              Leave
            </button>
          )}
          
          <button
            className="spectator-controls__btn"
            onClick={handleToggleUI}
            title={showUI ? 'Hide UI' : 'Show UI'}
          >
            {showUI ? '👁️' : '👁️‍♂️️'}
          </button>
          
          <button
            className="spectator-controls__btn"
            onClick={handleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '🗗' : '🗖'}
          </button>
        </div>
      </div>
    );
  };

  const renderViewModeSelector = () => {
    if (!showUI) return null;
    
    return (
      <div className="spectator-view-selector">
        <div className="spectator-view-selector__title">View Mode</div>
        <div className="spectator-view-selector__options">
          <button
            className={`spectator-view-option ${viewMode === 'table' ? 'spectator-view-option--active' : ''}`}
            onClick={() => handleViewModeChange('table')}
          >
            <span className="spectator-view-option__icon">🎰</span>
            <span className="spectator-view-option__label">Table</span>
          </button>
          
          <button
            className={`spectator-view-option ${viewMode === 'player' ? 'spectator-view-option--active' : ''}`}
            onClick={() => handleViewModeChange('player')}
          >
            <span className="spectator-view-option__icon">👥</span>
            <span className="spectator-view-option__label">Player</span>
          </button>
          
          <button
            className={`spectator-view-option ${viewMode === 'pot' ? 'spectator-view-option--active' : ''}`}
            onClick={() => handleViewModeChange('pot')}
          >
            <span className="spectator-view-option__icon">💰</span>
            <span className="spectator-view-option__label">Pot</span>
          </button>
          
          <button
            className={`spectator-view-option ${viewMode === 'cards' ? 'spectator-view-option--active' : ''}`}
            onClick={() => handleViewModeChange('cards')}
          >
            <span className="spectator-view-option__icon">🃏</span>
            <span className="spectator-view-option__label">Cards</span>
          </button>
        </div>
      </div>
    );
  };

  const renderStatistics = () => {
    if (!showUI || !showStatistics) return null;
    
    const stats = {
      totalPot: pot,
      currentBet: currentBet,
      playersInHand: players.filter(p => p.isActive && !p.isFolded).length,
      averageStack: players.length > 0 ? Math.round(players.reduce((sum, p) => sum + (p.chips || 0), 0) / players.length) : 0,
      bigBlind: 20, // Would come from game state
      smallBlind: 10, // Would come from game state
      handsPlayed: 0, // Would come from game state
      averagePot: 0 // Would be calculated
    };
    
    return (
      <div className="spectator-statistics">
        <div className="spectator-statistics__title">Game Statistics</div>
        <div className="spectator-statistics__grid">
          <div className="spectator-statistic">
            <div className="spectator-statistic__label">Total Pot</div>
            <div className="spectator-statistic__value">${stats.totalPot}</div>
          </div>
          
          <div className="spectator-statistic">
            <div className="spectator-statistic__label">Current Bet</div>
            <div className="spectator-statistic__value">${stats.currentBet}</div>
          </div>
          
          <div className="spectator-statistic">
            <div className="spectator-statistic__label">Active Players</div>
            <div className="spectator-statistic__value">{stats.playersInHand}</div>
          </div>
          
          <div className="spectator-statistic">
            <div className="spectator-statistic__label">Avg Stack</div>
            <div className="spectator-statistic__value">${stats.averageStack}</div>
          </div>
          
          <div className="spectator-statistic">
            <div className="spectator-statistic__label">Blinds</div>
            <div className="spectator-statistic__value">{stats.smallBlind}/{stats.bigBlind}</div>
          </div>
          
          <div className="spectator-statistic">
            <div className="spectator-statistic__label">Hands Played</div>
            <div className="spectator-statistic__value">{stats.handsPlayed}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    return (
      <div className="spectator-table">
        <PokerTable
          theme={tableTheme}
          size="large"
          players={players}
          communityCards={communityCards}
          pot={showPot ? pot : 0}
          dealerPosition={dealerPosition}
          currentPlayer={currentPlayer}
          onPlayerClick={handlePlayerClick}
          showDealerButton={true}
          showPot={showPot}
          interactive={false}
          className="spectator-table__component"
        />
        
        {/* Floating emotes */}
        {emotes.length > 0 && (
          <div className="spectator-emotes">
            {emotes.map(emote => (
              <div
                key={emoji.id}
                className="spectator-emote"
                style={{
                  left: `${Math.random() * 80 + 10}%`,
                  top: `${Math.random() * 80 + 10}%`
                }}
              >
                {emote.emoji}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPlayerFocus = () => {
    if (followedPlayer === null || !players[followedPlayer]) return null;
    
    const player = players[followedPlayer];
    
    return (
      <div className="spectator-player-focus">
        <div className="spectator-player-focus__header">
          <div className="spectator-player-focus__name">{player.name || `Player ${followedPlayer + 1}`}</div>
          <div className="spectator-player-focus__stack">
            ${player.chips ? `$${player.chips}` : 'All In'}
          </div>
          <div className="spectator-player-focus__status">
            {player.isActive ? 'Active' : player.isFolded ? 'Folded' : 'Waiting'}
          </div>
        </div>
        
        <div className="spectator-player-focus__cards">
          {player.hand && player.hand.length > 0 && (
            <div className="spectator-player-focus__hand">
              {player.hand.map((card, index) => (
                <PlayingCard
                  key={index}
                  rank={card.rank}
                  suit={card.suit}
                  faceDown={!showCards || card.faceDown}
                  size="medium"
                  className="spectator-player-focus__card"
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="pot-focus__actions">
          <button
            className="spectator-player-focus__action"
            onClick={() => setFollowedPlayer(null)}
          >
            Unfollow
          </button>
        </div>
      </div>
    );
  };

  const renderPotFocus = () => {
    return (
      <div className="spectator-pot-focus">
        <div className="spectator-pot-focus__header">
          <div className="spectator-pot-focus__title">Pot Information</div>
          <div className="spectator-pot-focus__amount">${pot}</div>
        </div>
        
        <div className="spectator-pot-focus__chips">
          <ChipPot
            chips={[]}
            total={pot}
            potStyle="circle"
            animated={false}
            showTotal={true}
            className="spectator-pot-focus__chip-pot"
          />
        </div>
        
        <div className="spectator-pot-focus__details">
          <div className="spectator-pot-focus__detail">
            <div className="spectator-pot-focus__label">Current Bet:</div>
            <div className="spectator-pot-focus__value">${currentBet}</div>
          </div>
          
          <div className="spectator-pot-focus__detail">
            <div className="spectator-pot-focus__label">Side Pot:</div>
            <div className="spectator-pot-focus__value">$0</div>
          </div>
          
          <div className="spectator-pot-focus__detail">
            <div className="spectator-pot-focus__label">Rake:</div>
            <div className="spectator-pot-focus__value">$2</div>
          </div>
        </div>
      </div>
    );
  };

  const renderCardsFocus = () => {
    return (
      <div className="spectator-cards-focus">
        <div className="spectator-cards-focus__header">
          <div className="spectator-cards-focus__title">Community Cards</div>
          <div className="spectator-cards-focus__count">{communityCards.length}/5</div>
        </div>
        
        <div className="spectator-cards-focus__cards">
          {communityCards.map((card, index) => (
            <PlayingCard
              key={index}
              rank={card.rank}
              suit={card.suit}
              faceDown={!showCards || card.faceDown}
              size="large"
              className="spectator-cards-focus__card"
            />
          ))}
        </div>
        
        <div className="spectator-cards-focus__analysis">
          <div className="spectator-cards-focus__board">
            <div className="spectator-cards-focus__title">Board Analysis</div>
            <div className="spectator-cards-focus__text">
              {communityCards.length === 0 && 'Pre-flop - No community cards yet'}
              {communityCards.length === 3 && 'Flop - Three community cards revealed'}
              {communityCards.length === 4 && 'Turn - Fourth community card revealed'}
              {communityCards.length === 5 && 'River - All community cards revealed'}
            </div>
          </div>
          
          {communityCards.length > 0 && (
            <div className="spectator-cards-focus__potential">
              <div className="spectator-cards-focus__title">Best Hand</div>
              <div className="spectator-cards-focus__text">
                High Card
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChat = () => {
    if (!showUI || !allowChat) return null;
    
    return (
      <div className="spectator-chat">
        <div className="spectator-chat__header">
          <div className="spectator-chat__title">Spectator Chat</div>
          <div className="spectator-chat__count">{spectatorCount}</div>
        </div>
        
        <div className="spectator-chat__messages" ref={chatContainerRef}>
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`spectator-chat__message spectator-chat__message--${message.type}`}
            >
              <div className="spectator-chat__user">
                {message.user}
              </div>
              <div className="spectator-chat__text">
                {message.text}
              </div>
              <div className="spectator-chat__time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
        
        <div className="spectator-chat__input">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="spectator-chat__input-field"
            disabled={!allowChat}
          />
          <button
            className="spectator-chat__send-btn"
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || !allowChat}
          >
            Send
          </button>
        </div>
      </div>
    );
  };

  const renderEmotePanel = () => {
    if (!showUI || !allowEmotes) return null;
    
    const commonEmotes = ['👍', '👎', '👏', '🤔', '👌', '🎉', '😂', '😎', '🤯', '👋', '💪', '🎯'];
    
    return (
      <div className="spectator-emote-panel">
        <div className="spectator-emote-panel__title">Reactions</div>
        <div className="spectator-emote-panel__emojis">
          {commonEmotes.map((emoji, index) => (
            <button
              key={index}
              className="spectator-emote-panel__emoji"
              onClick={() => handleSendEmote(emoji)}
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const getSpectatorClasses = () => {
    const classes = [
      'spectator-mode',
      !isConnected && 'spectator-mode--disconnected',
      isFullscreen && 'spectator-mode--fullscreen',
      !showUI && 'spectator-mode--minimal',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  return (
    <div
      ref={spectatorContainerRef}
      className={getSpectatorClasses()}
      style={style}
      {...props}
    >
      {/* Spectator controls */}
      {renderSpectatorControls()}
      
      {/* View mode selector */}
      {renderViewModeSelector()}
      
      {/* Main content */}
      <div className="spectator-content">
        {viewMode === 'table' && renderTable()}
        {viewMode === 'player' && renderPlayerFocus()}
        {viewMode === 'pot' && renderPotFocus()}
        {viewMode === 'cards' && renderCardsFocus()}
      </div>
      
      {/* Side panels */}
      <div className="spectator-side-panels">
        {/* Statistics */}
        {renderStatistics()}
        
        {/* Chat */}
        {renderChat()}
        
        {/* Emote panel */}
        {renderEmotePanel()}
      </div>
    </div>
  );
};

// Spectator Lobby Component
export const SpectatorLobby = ({
  availableGames = [],
  onJoinGame,
  className = '',
  style = {},
  ...props
}) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGames = availableGames.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleJoinGame = (game) => {
    setSelectedGame(game);
    if (onJoinGame) {
      onJoinGame(game.id);
    }
  };

  return (
    <div className={`spectator-lobby ${className}`} style={style} {...props}>
      <div className="spectator-lobby__header">
        <h2 className="spectator-lobby__title">Spectator Lobby</h2>
        <div className="spectator-lobby__count">
          {availableGames.length} Games Available
        </div>
      </div>
      
      <div className="spectator-lobby__search">
        <input
          type="text"
          placeholder="Search games..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="spectator-lobby__search-input"
        />
      </div>
      
      <div className="spectator-lobby__games">
        {filteredGames.length === 0 ? (
          <div className="spectator-lobby__empty">
            <div className="spectator-lobby__empty-icon">🔍</div>
            <div className="spectator-lobby__empty-text">
              {searchTerm ? 'No games found' : 'No games available'}
            </div>
          </div>
        ) : (
          filteredGames.map((game) => (
            <div
              key={game.id}
              className={`spectator-lobby__game ${selectedGame?.id === game.id ? 'spectator-lobby__game--selected' : ''}`}
              onClick={() => handleJoinGame(game)}
            >
              <div className="spectator-lobby__game-header">
                <div className="spectator-lobby__game-name">{game.name}</div>
                <div className="spectator-lobby__game-info">
                  <span className="spectator-lobby__game-players">{game.players || 0} Players</span>
                  <span className="spectator-lobby__game-spectators">{game.spectators || 0} Spectators</span>
                </div>
              </div>
              
              <div className="spectator-lobby__game-details">
                <div className="spectator-lobby__game-status">{game.status}</div>
                <div className="spectator-lobby__game-type">{game.type}</div>
                <div className="spectator-lobby__game-stakes">
                  Stakes: ${game.stakes || 'Low'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SpectatorMode;
