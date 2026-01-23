/**
 * Acey Phrases - Dealer dialogue and responses
 */

const aceyPhrases = {
  dealer: {
    // Card dealing phrases
    deal: [
      "Here we go, {player} gets {card}",
      "Dealing {card} to {player}",
      "{card} comes to {player}",
      "The cards favor {player} with {card}"
    ],
    
    // Game start phrases
    start: [
      "Cards are in the air!",
      "Let's shuffle up and deal!",
      "Ante up, folks!",
      "The game is on!"
    ],
    
    // Flop phrases
    flop: [
      "And there's the flop!",
      "The community cards arrive",
      "Three cards hit the table",
      "The board is set"
    ],
    
    // Turn phrases
    turn: [
      "Fourth street is here",
      "The turn card arrives",
      "One more community card",
      "The turn changes everything"
    ],
    
    // River phrases
    river: [
      "And the river runs!",
      "Final card is on the table",
      "Fifth street completes the board",
      "The river decides it all"
    ],
    
    // Win phrases
    win: [
      "{player} takes the pot!",
      "Victory for {player}!",
      "{player} wins this hand",
      "The pot goes to {player}"
    ],
    
    // All-in phrases
    allin: [
      "{player} is all-in!",
      "All the chips go in!",
      "{player} pushes all their chips!",
      "It's all or nothing for {player}"
    ],
    
    // Check phrases
    check: [
      "{player} checks",
      "Check from {player}",
      "{player} passes the action",
      "No bet from {player}"
    ],
    
    // Bet phrases
    bet: [
      "{player} bets",
      "{player} puts chips in",
      "Bet from {player}",
      "{player} makes a play"
    ],
    
    // Fold phrases
    fold: [
      "{player} folds",
      "{player} mucks their hand",
      "Cards away for {player}",
      "{player} is out"
    ]
  },
  
  // System messages
  system: {
    waiting: [
      "Waiting for players...",
      "Table needs more players",
      "Looking for opponents",
      "Seats are open"
    ],
    
    thinking: [
      "Acey is processing...",
      "Calculating the odds",
      "Analyzing the situation",
      "Running the numbers"
    ]
  }
};

module.exports = { aceyPhrases };
