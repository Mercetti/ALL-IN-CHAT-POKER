/**
 * Tournament System Component
 * Comprehensive tournament management and gameplay system
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayingCard } from '../cards';
import { Chip, ChipStack, ChipPot } from '../chips';
import { PokerTable } from '../table';
import { SpectatorMode, SpectatorLobby } from '../spectator';
import './TournamentSystem.css';

const TournamentSystem = ({
  tournamentId,
  tournamentType = 'sitngo',
  tournamentFormat = 'no_limit',
  buyIn = 10,
  maxPlayers = 9,
  startingChips = 1000,
  blindLevels = [
    { small: 10, big: 20, duration: 10 },
    { small: 20, big: 40, duration: 10 },
    { small: 30, big: 60, duration: 10 },
    { small: 50, big: 100, duration: 10 },
    { small: 75, big: 150, duration: 10 },
    { small: 100, big: 200, duration: 10 }
  ],
  payoutStructure = [50, 30, 20],
  rebuyAllowed = false,
  addonAllowed = false,
  lateRegistration = true,
  lateRegistrationTime = 30,
  autoRegister = false,
  showLobby = true,
  showBracket = true,
  showLeaderboard = true,
  allowSpectators = true,
  onTournamentStart,
  onTournamentEnd,
  onPlayerRegister,
  onPlayerEliminate,
  onLevelChange,
  className = '',
  style = {},
  ...props
}) => {
  const [tournamentState, setTournamentState] = useState('lobby'); // 'lobby', 'registering', 'playing', 'break', 'finished'
  const [players, setPlayers] = useState([]);
  const [registeredPlayers, setRegisteredPlayers] = useState([]);
  const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [winnings, setWinnings] = useState(0);
  const [showSpectatorMode, setShowSpectatorMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'players', 'bracket', 'leaderboard', 'settings'
  
  const timerRef = useRef(null);

  // Initialize tournament
  useEffect(() => {
    if (autoRegister && tournamentState === 'lobby') {
      handleRegister();
    }
  }, [autoRegister, tournamentState]);

  // Timer management
  useEffect(() => {
    if (tournamentState === 'playing' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleLevelAdvance();
            return blindLevels[currentLevel + 1]?.duration * 60 || 0;
          }
          return prev - 1;
        });
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [tournamentState, timeRemaining, currentLevel, blindLevels]);

  const handleRegister = useCallback(() => {
    if (isRegistered || tournamentState !== 'lobby') return;

    const newPlayer = {
      id: Date.now(),
      name: `Player ${registeredPlayers.length + 1}`,
      chips: startingChips,
      position: registeredPlayers.length + 1,
      isRegistered: true,
      isActive: true,
      isEliminated: false,
      rebuys: 0,
      addons: 0,
      handsPlayed: 0,
      winnings: 0
    };

    setRegisteredPlayers(prev => [...prev, newPlayer]);
    setIsRegistered(true);
    
    if (onPlayerRegister) {
      onPlayerRegister(newPlayer);
    }

    // Auto-start tournament if max players reached
    if (registeredPlayers.length + 1 >= maxPlayers) {
      startTournament();
    }
  }, [isRegistered, tournamentState, registeredPlayers.length, maxPlayers, startingChips, onPlayerRegister]);

  const handleUnregister = useCallback(() => {
    if (!isRegistered || tournamentState !== 'lobby') return;

    setRegisteredPlayers(prev => prev.filter(p => p.id !== players.find(p => p.isRegistered)?.id));
    setIsRegistered(false);
  }, [isRegistered, tournamentState, players]);

  const startTournament = useCallback(() => {
    if (registeredPlayers.length < 2) return;

    setTournamentState('playing');
    setTimeRemaining(blindLevels[0].duration * 60);
    setPlayers(registeredPlayers.map(p => ({ ...p, isActive: true })));
    
    if (onTournamentStart) {
      onTournamentStart({
        tournamentId,
        players: registeredPlayers,
        startTime: new Date()
      });
    }
  }, [registeredPlayers, blindLevels, tournamentId, onTournamentStart]);

  const handleLevelAdvance = useCallback(() => {
    if (currentLevel < blindLevels.length - 1) {
      const newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      setTimeRemaining(blindLevels[newLevel].duration * 60);
      
      if (onLevelChange) {
        onLevelChange({
          level: newLevel + 1,
          smallBlind: blindLevels[newLevel].small,
          bigBlind: blindLevels[newLevel].big,
          duration: blindLevels[newLevel].duration
        });
      }
    }
  }, [currentLevel, blindLevels, onLevelChange]);

  const handlePlayerEliminate = useCallback((playerId) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const position = players.filter(p => !p.isEliminated).length;
    const prize = calculatePrize(position);
    
    setPlayers(prev => prev.map(p => 
      p.id === playerId 
        ? { ...p, isEliminated: true, isActive: false, position, winnings: prize }
        : p
    ));
    
    setEliminatedPlayers(prev => [...prev, { ...player, position, winnings: prize }]);
    
    if (playerId === players.find(p => p.isRegistered)?.id) {
      setIsEliminated(true);
      setCurrentPosition(position);
      setWinnings(prize);
    }
    
    if (onPlayerEliminate) {
      onPlayerEliminate(playerId, position, prize);
    }

    // Check if tournament is finished
    if (players.filter(p => !p.isEliminated).length <= 1) {
      endTournament();
    }
  }, [players, onPlayerEliminate]);

  const endTournament = useCallback(() => {
    setTournamentState('finished');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (onTournamentEnd) {
      onTournamentEnd({
        tournamentId,
        winner: players.find(p => !p.isEliminated),
        eliminatedPlayers,
        endTime: new Date(),
        totalDuration: totalTime
      });
    }
  }, [players, eliminatedPlayers, totalTime, tournamentId, onTournamentEnd]);

  const calculatePrize = (position) => {
    if (position <= payoutStructure.length) {
      const totalPrize = registeredPlayers.length * buyIn;
      return (totalPrize * payoutStructure[position - 1]) / 100;
    }
    return 0;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderTournamentOverview = () => {
    return (
      <div className="tournament-overview">
        <div className="tournament-overview__header">
          <h2 className="tournament-overview__title">Tournament Overview</h2>
          <div className="tournament-overview__status">
            <span className={`tournament-overview__status-badge tournament-overview__status-badge--${tournamentState}`}>
              {tournamentState.charAt(0).toUpperCase() + tournamentState.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="tournament-overview__info">
          <div className="tournament-overview__details">
            <div className="tournament-overview__detail">
              <span className="tournament-overview__label">Type:</span>
              <span className="tournament-overview__value">{tournamentType}</span>
            </div>
            <div className="tournament-overview__detail">
              <span className="tournament-overview__label">Format:</span>
              <span className="tournament-overview__value">{tournamentFormat}</span>
            </div>
            <div className="tournament-overview__detail">
              <span className="tournament-overview__label">Buy-in:</span>
              <span className="tournament-overview__value">{formatMoney(buyIn)}</span>
            </div>
            <div className="tournament-overview__detail">
              <span className="tournament-overview__label">Players:</span>
              <span className="tournament-overview__value">{registeredPlayers.length}/{maxPlayers}</span>
            </div>
            <div className="tournament-overview__detail">
              <span className="tournament-overview__label">Prize Pool:</span>
              <span className="tournament-overview__value">{formatMoney(registeredPlayers.length * buyIn)}</span>
            </div>
          </div>
          
          {tournamentState === 'playing' && (
            <div className="tournament-overview__current">
              <div className="tournament-overview__level">
                <span className="tournament-overview__label">Level:</span>
                <span className="tournament-overview__value">{currentLevel + 1}</span>
              </div>
              <div className="tournament-overview__blinds">
                <span className="tournament-overview__label">Blinds:</span>
                <span className="tournament-overview__value">{blindLevels[currentLevel]?.small}/{blindLevels[currentLevel]?.big}</span>
              </div>
              <div className="tournament-overview__timer">
                <span className="tournament-overview__label">Time:</span>
                <span className="tournament-overview__value">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="tournament-overview__actions">
          {tournamentState === 'lobby' && (
            <>
              {!isRegistered ? (
                <button
                  className="tournament-overview__btn tournament-overview__btn--primary"
                  onClick={handleRegister}
                  disabled={registeredPlayers.length >= maxPlayers}
                >
                  Register ({formatMoney(buyIn)})
                </button>
              ) : (
                <button
                  className="tournament-overview__btn tournament-overview__btn--secondary"
                  onClick={handleUnregister}
                >
                  Unregister
                </button>
              )}
              
              {registeredPlayers.length >= 2 && (
                <button
                  className="tournament-overview__btn tournament-overview__btn--success"
                  onClick={startTournament}
                >
                  Start Tournament
                </button>
              )}
            </>
          )}
          
          {tournamentState === 'playing' && allowSpectators && !isRegistered && (
            <button
              className="tournament-overview__btn tournament-overview__btn--info"
              onClick={() => setShowSpectatorMode(true)}
            >
              Spectate
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPlayersList = () => {
    return (
      <div className="tournament-players">
        <h3 className="tournament-players__title">Players</h3>
        <div className="tournament-players__list">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`tournament-player ${player.isEliminated ? 'tournament-player--eliminated' : ''} ${player.isRegistered ? 'tournament-player--registered' : ''}`}
            >
              <div className="tournament-player__position">
                {player.position || index + 1}
              </div>
              <div className="tournament-player__info">
                <div className="tournament-player__name">{player.name}</div>
                <div className="tournament-player__chips">{formatMoney(player.chips)}</div>
              </div>
              <div className="tournament-player__status">
                {player.isEliminated ? `Eliminated #${player.position}` : 'Active'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTournamentBracket = () => {
    return (
      <div className="tournament-bracket">
        <h3 className="tournament-bracket__title">Tournament Bracket</h3>
        <div className="tournament-bracket__rounds">
          {/* Simplified bracket visualization */}
          <div className="tournament-bracket__round">
            <div className="tournament-bracket__round-title">Finals</div>
            <div className="tournament-bracket__match">
              {players.filter(p => !p.isEliminated).map(player => (
                <div key={player.id} className="tournament-bracket__player">
                  {player.name} ({formatMoney(player.chips)})
                </div>
              ))}
            </div>
          </div>
          
          <div className="tournament-bracket__round">
            <div className="tournament-bracket__round-title">Eliminated</div>
            <div className="tournament-bracket__eliminated">
              {eliminatedPlayers.map(player => (
                <div key={player.id} className="tournament-bracket__eliminated-player">
                  #{player.position} {player.name} - {formatMoney(player.winnings)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => {
    const sortedPlayers = [...players, ...eliminatedPlayers]
      .sort((a, b) => {
        if (a.isEliminated && !b.isEliminated) return 1;
        if (!a.isEliminated && b.isEliminated) return -1;
        if (a.isEliminated && b.isEliminated) return a.position - b.position;
        return b.chips - a.chips;
      });

    return (
      <div className="tournament-leaderboard">
        <h3 className="tournament-leaderboard__title">Leaderboard</h3>
        <div className="tournament-leaderboard__list">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`tournament-leaderboard__player ${player.isRegistered ? 'tournament-leaderboard__player--registered' : ''}`}
            >
              <div className="tournament-leaderboard__rank">
                {index + 1}
              </div>
              <div className="tournament-leaderboard__info">
                <div className="tournament-leaderboard__name">{player.name}</div>
                <div className="tournament-leaderboard__chips">{formatMoney(player.chips)}</div>
              </div>
              <div className="tournament-leaderboard__winnings">
                {player.winnings > 0 && formatMoney(player.winnings)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTournamentSettings = () => {
    return (
      <div className="tournament-settings">
        <h3 className="tournament-settings__title">Tournament Settings</h3>
        <div className="tournament-settings__info">
          <div className="tournament-settings__section">
            <h4 className="tournament-settings__section-title">Blind Structure</h4>
            <div className="tournament-settings__blind-levels">
              {blindLevels.map((level, index) => (
                <div
                  key={index}
                  className={`tournament-settings__blind-level ${currentLevel === index ? 'tournament-settings__blind-level--current' : ''}`}
                >
                  <span className="tournament-settings__level-number">Level {index + 1}</span>
                  <span className="tournament-settings__blinds">{level.small}/{level.big}</span>
                  <span className="tournament-settings__duration">{level.duration} min</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="tournament-settings__section">
            <h4 className="tournament-settings__section-title">Payout Structure</h4>
            <div className="tournament-settings__payouts">
              {payoutStructure.map((percentage, index) => (
                <div key={index} className="tournament-settings__payout">
                  <span className="tournament-settings__position">#{index + 1}</span>
                  <span className="tournament-settings__percentage">{percentage}%</span>
                  <span className="tournament-settings__amount">{formatMoney((registeredPlayers.length * buyIn * percentage) / 100)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="tournament-settings__section">
            <h4 className="tournament-settings__section-title">Tournament Rules</h4>
            <div className="tournament-settings__rules">
              <div className="tournament-settings__rule">
                <span className="tournament-settings__rule-label">Rebuys:</span>
                <span className="tournament-settings__rule-value">{rebuyAllowed ? 'Allowed' : 'Not Allowed'}</span>
              </div>
              <div className="tournament-settings__rule">
                <span className="tournament-settings__rule-label">Add-ons:</span>
                <span className="tournament-settings__rule-value">{addonAllowed ? 'Allowed' : 'Not Allowed'}</span>
              </div>
              <div className="tournament-settings__rule">
                <span className="tournament-settings__rule-label">Late Registration:</span>
                <span className="tournament-settings__rule-value">{lateRegistration ? `${lateRegistrationTime} min` : 'Not Allowed'}</span>
              </div>
              <div className="tournament-settings__rule">
                <span className="tournament-settings__rule-label">Spectators:</span>
                <span className="tournament-settings__rule-value">{allowSpectators ? 'Allowed' : 'Not Allowed'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTournamentTabs = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'players', label: 'Players', icon: '👥' },
      { id: 'bracket', label: 'Bracket', icon: '🏆' },
      { id: 'leaderboard', label: 'Leaderboard', icon: '📈' },
      { id: 'settings', label: 'Settings', icon: '⚙️' }
    ];

    return (
      <div className="tournament-tabs">
        <div className="tournament-tabs__nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tournament-tabs__tab ${activeTab === tab.id ? 'tournament-tabs__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tournament-tabs__tab-icon">{tab.icon}</span>
              <span className="tournament-tabs__tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className="tournament-tabs__content">
          {activeTab === 'overview' && renderTournamentOverview()}
          {activeTab === 'players' && renderPlayersList()}
          {activeTab === 'bracket' && renderTournamentBracket()}
          {activeTab === 'leaderboard' && renderLeaderboard()}
          {activeTab === 'settings' && renderTournamentSettings()}
        </div>
      </div>
    );
  };

  const renderSpectatorMode = () => {
    if (!showSpectatorMode) return null;

    return (
      <SpectatorMode
        gameId={tournamentId}
        gameState={{
          type: 'tournament',
          level: currentLevel + 1,
          blinds: blindLevels[currentLevel],
          players: players.length,
          eliminated: eliminatedPlayers.length
        }}
        players={players}
        communityCards={[]}
        pot={0}
        currentBet={0}
        onLeaveGame={() => setShowSpectatorMode(false)}
        allowChat={true}
        allowEmotes={true}
      />
    );
  };

  const getTournamentClasses = () => {
    const classes = [
      'tournament-system',
      `tournament-system--${tournamentState}`,
      isRegistered && 'tournament-system--registered',
      isEliminated && 'tournament-system--eliminated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  // Show elimination screen if eliminated
  if (isEliminated) {
    return (
      <div className="tournament-elimination">
        <div className="tournament-elimination__content">
          <h2 className="tournament-elimination__title">You've Been Eliminated!</h2>
          <div className="tournament-elimination__position">
            Final Position: #{currentPosition}
          </div>
          <div className="tournament-elimination__winnings">
            Winnings: {formatMoney(winnings)}
          </div>
          <div className="tournament-elimination__actions">
            {allowSpectators && (
              <button
                className="tournament-elimination__btn"
                onClick={() => setShowSpectatorMode(true)}
              >
                Continue Watching
              </button>
            )}
            <button
              className="tournament-elimination__btn"
              onClick={() => window.location.reload()}
            >
              Leave Tournament
            </button>
          </div>
        </div>
        
        {renderSpectatorMode()}
      </div>
    );
  }

  return (
    <div
      className={getTournamentClasses()}
      style={style}
      {...props}
    >
      {showLobby && tournamentState === 'lobby' && (
        <div className="tournament-lobby">
          <div className="tournament-lobby__header">
            <h1 className="tournament-lobby__title">Tournament Lobby</h1>
            <div className="tournament-lobby__info">
              <span className="tournament-lobby__type">{tournamentType}</span>
              <span className="tournament-lobby__buy-in">{formatMoney(buyIn)}</span>
            </div>
          </div>
          
          <div className="tournament-lobby__content">
            {renderTournamentTabs()}
          </div>
        </div>
      )}
      
      {tournamentState === 'playing' && (
        <div className="tournament-game">
          <div className="tournament-game__header">
            <div className="tournament-game__info">
              <span className="tournament-game__level">Level {currentLevel + 1}</span>
              <span className="tournament-game__blinds">{blindLevels[currentLevel]?.small}/{blindLevels[currentLevel]?.big}</span>
              <span className="tournament-game__timer">{formatTime(timeRemaining)}</span>
            </div>
            <div className="tournament-game__players">
              {players.filter(p => !p.isEliminated).length} Players Remaining
            </div>
          </div>
          
          <div className="tournament-game__table">
            <PokerTable
              theme="tournament"
              size="large"
              players={players}
              communityCards={[]}
              pot={0}
              dealerPosition={0}
              currentPlayer={0}
              showDealerButton={true}
              interactive={isRegistered && !isEliminated}
            />
          </div>
          
          <div className="tournament-game__sidebar">
            {renderTournamentTabs()}
          </div>
        </div>
      )}
      
      {tournamentState === 'finished' && (
        <div className="tournament-finished">
          <div className="tournament-finished__content">
            <h2 className="tournament-finished__title">Tournament Finished!</h2>
            <div className="tournament-finished__winner">
              Winner: {players.find(p => !p.isEliminated)?.name}
            </div>
            <div className="tournament-finished__prize">
              Prize Pool: {formatMoney(registeredPlayers.length * buyIn)}
            </div>
            <div className="tournament-finished__actions">
              <button
                className="tournament-finished__btn"
                onClick={() => setActiveTab('leaderboard')}
              >
                View Final Results
              </button>
              <button
                className="tournament-finished__btn"
                onClick={() => window.location.reload()}
              >
                New Tournament
              </button>
            </div>
          </div>
          
          {renderTournamentTabs()}
        </div>
      )}
      
      {renderSpectatorMode()}
    </div>
  );
};

// Tournament Manager Component
export const TournamentManager = ({
  tournaments = [],
  onCreateTournament,
  onJoinTournament,
  className = '',
  style = {},
  ...props
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);

  const handleCreateTournament = (tournamentConfig) => {
    if (onCreateTournament) {
      onCreateTournament(tournamentConfig);
    }
    setShowCreateForm(false);
  };

  const handleJoinTournament = (tournamentId) => {
    if (onJoinTournament) {
      onJoinTournament(tournamentId);
    }
  };

  return (
    <div className={`tournament-manager ${className}`} style={style} {...props}>
      <div className="tournament-manager__header">
        <h2 className="tournament-manager__title">Tournament Manager</h2>
        <button
          className="tournament-manager__create-btn"
          onClick={() => setShowCreateForm(true)}
        >
          Create Tournament
        </button>
      </div>
      
      <div className="tournament-manager__content">
        {showCreateForm && (
          <TournamentCreateForm
            onSubmit={handleCreateTournament}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
        
        <div className="tournament-manager__list">
          {tournaments.map(tournament => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onJoin={() => handleJoinTournament(tournament.id)}
              onView={() => setSelectedTournament(tournament)}
            />
          ))}
        </div>
      </div>
      
      {selectedTournament && (
        <TournamentSystem
          tournamentId={selectedTournament.id}
          {...selectedTournament}
        />
      )}
    </div>
  );
};

// Tournament Create Form Component
const TournamentCreateForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'sitngo',
    format: 'no_limit',
    buyIn: 10,
    maxPlayers: 9,
    startingChips: 1000,
    rebuyAllowed: false,
    addonAllowed: false,
    allowSpectators: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="tournament-create-form">
      <h3 className="tournament-create-form__title">Create Tournament</h3>
      <form onSubmit={handleSubmit} className="tournament-create-form__form">
        <div className="tournament-create-form__field">
          <label className="tournament-create-form__label">Tournament Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="tournament-create-form__input"
            required
          />
        </div>
        
        <div className="tournament-create-form__field">
          <label className="tournament-create-form__label">Type</label>
          <select
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="tournament-create-form__select"
          >
            <option value="sitngo">Sit & Go</option>
            <option value="scheduled">Scheduled</option>
            <option value="freeroll">Freeroll</option>
          </select>
        </div>
        
        <div className="tournament-create-form__field">
          <label className="tournament-create-form__label">Format</label>
          <select
            value={formData.format}
            onChange={(e) => handleChange('format', e.target.value)}
            className="tournament-create-form__select"
          >
            <option value="no_limit">No Limit Hold'em</option>
            <option value="pot_limit">Pot Limit Hold'em</option>
            <option value="fixed_limit">Fixed Limit Hold'em</option>
          </select>
        </div>
        
        <div className="tournament-create-form__row">
          <div className="tournament-create-form__field">
            <label className="tournament-create-form__label">Buy-in</label>
            <input
              type="number"
              value={formData.buyIn}
              onChange={(e) => handleChange('buyIn', parseFloat(e.target.value))}
              className="tournament-create-form__input"
              min="1"
              required
            />
          </div>
          
          <div className="tournament-create-form__field">
            <label className="tournament-create-form__label">Max Players</label>
            <input
              type="number"
              value={formData.maxPlayers}
              onChange={(e) => handleChange('maxPlayers', parseInt(e.target.value))}
              className="tournament-create-form__input"
              min="2"
              max="100"
              required
            />
          </div>
        </div>
        
        <div className="tournament-create-form__field">
          <label className="tournament-create-form__label">Starting Chips</label>
          <input
            type="number"
            value={formData.startingChips}
            onChange={(e) => handleChange('startingChips', parseInt(e.target.value))}
            className="tournament-create-form__input"
            min="100"
            required
          />
        </div>
        
        <div className="tournament-create-form__checkboxes">
          <label className="tournament-create-form__checkbox">
            <input
              type="checkbox"
              checked={formData.rebuyAllowed}
              onChange={(e) => handleChange('rebuyAllowed', e.target.checked)}
            />
            Allow Rebuys
          </label>
          
          <label className="tournament-create-form__checkbox">
            <input
              type="checkbox"
              checked={formData.addonAllowed}
              onChange={(e) => handleChange('addonAllowed', e.target.checked)}
            />
            Allow Add-ons
          </label>
          
          <label className="tournament-create-form__checkbox">
            <input
              type="checkbox"
              checked={formData.allowSpectators}
              onChange={(e) => handleChange('allowSpectators', e.target.checked)}
            />
            Allow Spectators
          </label>
        </div>
        
        <div className="tournament-create-form__actions">
          <button
            type="button"
            onClick={onCancel}
            className="tournament-create-form__btn tournament-create-form__btn--secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="tournament-create-form__btn tournament-create-form__btn--primary"
          >
            Create Tournament
          </button>
        </div>
      </form>
    </div>
  );
};

// Tournament Card Component
const TournamentCard = ({ tournament, onJoin, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'lobby': return '#48bb78';
      case 'registering': return '#ed8936';
      case 'playing': return '#3182ce';
      case 'finished': return '#718096';
      default: return '#718096';
    }
  };

  return (
    <div className="tournament-card">
      <div className="tournament-card__header">
        <h3 className="tournament-card__name">{tournament.name}</h3>
        <div
          className="tournament-card__status"
          style={{ backgroundColor: getStatusColor(tournament.status) }}
        >
          {tournament.status}
        </div>
      </div>
      
      <div className="tournament-card__info">
        <div className="tournament-card__detail">
          <span className="tournament-card__label">Type:</span>
          <span className="tournament-card__value">{tournament.type}</span>
        </div>
        <div className="tournament-card__detail">
          <span className="tournament-card__label">Buy-in:</span>
          <span className="tournament-card__value">${tournament.buyIn}</span>
        </div>
        <div className="tournament-card__detail">
          <span className="tournament-card__label">Players:</span>
          <span className="tournament-card__value">{tournament.players?.length || 0}/{tournament.maxPlayers}</span>
        </div>
      </div>
      
      <div className="tournament-card__actions">
        <button
          className="tournament-card__btn tournament-card__btn--primary"
          onClick={onView}
        >
          View
        </button>
        {tournament.status === 'lobby' && (
          <button
            className="tournament-card__btn tournament-card__btn--secondary"
            onClick={onJoin}
          >
            Join
          </button>
        )}
      </div>
    </div>
  );
};

export default TournamentSystem;
