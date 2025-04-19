import { useState, useEffect, useRef } from 'react';
import UltimateGame from './UltimateGame';
import { calculateWinner } from '../utils/gameUtils';

function MetaBoard() {
  // Array of 9 ultimate games, each is a complete ultimate tic-tac-toe game
  const [metaState, setMetaState] = useState({
    // For each ultimate game, we track its state
    ultimateGames: Array(9).fill(null).map(() => ({
      status: 'not-started', // 'not-started', 'active', 'completed'
      winner: null, // null, 'X', 'O', 'draw'
      boards: Array(9).fill(null).map(() => Array(9).fill(null)),
      smallWinners: Array(9).fill(null),
      lastWinPosition: null // Position of the last winning small board
    })),
    xIsNext: true,
    activeUltimateGameIndex: null,
    metaWinner: null,
    metaGameState: 'playing' // 'playing', 'won', 'draw'
  });

  const [viewingGameIndex, setViewingGameIndex] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Use a ref to track if we need to check for a meta winner
  const checkForWinnerRef = useRef(false);

  // Handle the completion of an ultimate game
  const handleUltimateGameWin = (ultimateGameIndex, winner, winPosition) => {
    setMetaState(prevState => {
      const newState = { ...prevState };
      const ultimateGame = { ...newState.ultimateGames[ultimateGameIndex] };
      
      // Mark the ultimate game as completed with its winner
      ultimateGame.status = 'completed';
      ultimateGame.winner = winner;
      ultimateGame.lastWinPosition = winPosition;
      
      newState.ultimateGames[ultimateGameIndex] = ultimateGame;
      
      // Determine next active ultimate game based on the win position
      const nextUltimateGameIndex = winPosition;
      
      // Check if the next game is already completed
      if (
        nextUltimateGameIndex === null || 
        newState.ultimateGames[nextUltimateGameIndex].status === 'completed'
      ) {
        // If the next game is already completed, player can choose any non-completed game
        newState.activeUltimateGameIndex = null;
      } else {
        newState.activeUltimateGameIndex = nextUltimateGameIndex;
        // Mark the game as active
        const nextGame = { ...newState.ultimateGames[nextUltimateGameIndex] };
        nextGame.status = 'active';
        newState.ultimateGames[nextUltimateGameIndex] = nextGame;
      }
      
      // Toggle player turn
      newState.xIsNext = !newState.xIsNext;
      
      return newState;
    });
    
    // Set flag to check for a meta winner
    checkForWinnerRef.current = true;
    
    // Also set the viewing index to the next active game
    setViewingGameIndex(winPosition);
  };

  // Start an ultimate game
  const startUltimateGame = (index) => {
    // Only allow starting a new game if it's not completed and either:
    // 1. It's the active game, or
    // 2. No specific active game is set (player can choose)
    if (
      metaState.ultimateGames[index].status !== 'completed' && 
      (metaState.activeUltimateGameIndex === index || metaState.activeUltimateGameIndex === null)
    ) {
      setMetaState(prevState => {
        const newState = { ...prevState };
        
        // Mark previous active game as not active
        if (prevState.activeUltimateGameIndex !== null && prevState.activeUltimateGameIndex !== index) {
          const prevGame = { ...newState.ultimateGames[prevState.activeUltimateGameIndex] };
          if (prevGame.status !== 'completed') {
            prevGame.status = 'not-started';
            newState.ultimateGames[prevState.activeUltimateGameIndex] = prevGame;
          }
        }
        
        // Set the new active game
        const game = { ...newState.ultimateGames[index] };
        game.status = 'active';
        newState.ultimateGames[index] = game;
        newState.activeUltimateGameIndex = index;
        
        return newState;
      });
    }
    
    // Always set the viewing index
    setViewingGameIndex(index);
  };

  // Check for a meta-game winner, but only when needed
  useEffect(() => {
    if (checkForWinnerRef.current) {
      // Extract just the winners from each ultimate game
      const ultimateWinners = metaState.ultimateGames.map(game => game.winner);
      
      // Calculate if there's a meta-winner
      const winner = calculateWinner(ultimateWinners);
      
      if (winner && winner !== 'draw') {
        // Meta-game has a winner
        setMetaState(prevState => ({
          ...prevState,
          metaWinner: winner,
          metaGameState: 'won'
        }));
      } else if (metaState.ultimateGames.every(game => game.status === 'completed')) {
        // All ultimate games are completed but no winner
        setMetaState(prevState => ({
          ...prevState,
          metaGameState: 'draw'
        }));
      }
      
      // Reset the check flag
      checkForWinnerRef.current = false;
    }
  }, [metaState.ultimateGames]);

  // Reset the entire meta-game
  const resetMetaGame = () => {
    setMetaState({
      ultimateGames: Array(9).fill(null).map(() => ({
        status: 'not-started',
        winner: null,
        boards: Array(9).fill(null).map(() => Array(9).fill(null)),
        smallWinners: Array(9).fill(null),
        lastWinPosition: null
      })),
      xIsNext: true,
      activeUltimateGameIndex: null,
      metaWinner: null,
      metaGameState: 'playing'
    });
    setViewingGameIndex(null);
  };

  // Return to the meta board view
  const returnToMetaBoard = () => {
    setViewingGameIndex(null);
  };

  // Update an ultimate game's state
  const updateUltimateGameState = (index, updatedGame) => {
    setMetaState(prevState => {
      const newState = { ...prevState };
      newState.ultimateGames[index] = {
        ...newState.ultimateGames[index],
        ...updatedGame
      };
      return newState;
    });
  };

  // Toggle help modal
  const toggleHelpModal = () => {
    setShowHelpModal(!showHelpModal);
  };

  // Save game state to local storage
  const saveGame = () => {
    localStorage.setItem('tictactactic-hardcore-state', JSON.stringify(metaState));
    alert('Game saved successfully!');
  };

  // Load game state from local storage
  const loadGame = () => {
    const savedState = localStorage.getItem('tictactactic-hardcore-state');
    if (savedState) {
      setMetaState(JSON.parse(savedState));
      setViewingGameIndex(null);
      alert('Game loaded successfully!');
    } else {
      alert('No saved game found!');
    }
  };

  // Render meta board or an individual ultimate game
  if (viewingGameIndex !== null) {
    // Render the individual ultimate game
    return (
      <div className="meta-game">
        <div className="meta-game-header">
          <button 
            className="meta-nav-button"
            onClick={returnToMetaBoard}
          >
            ← Back to Meta Board
          </button>
          <div className="meta-game-title">
            Ultimate Game {viewingGameIndex + 1}
          </div>
          <div className="meta-game-status">
            {metaState.ultimateGames[viewingGameIndex].status === 'completed' 
              ? `Completed - Winner: ${metaState.ultimateGames[viewingGameIndex].winner === 'draw' 
                ? 'Draw' 
                : metaState.ultimateGames[viewingGameIndex].winner}`
              : metaState.ultimateGames[viewingGameIndex].status === 'active'
                ? `Active - ${metaState.xIsNext ? 'X' : 'O'}'s turn`
                : 'Not Started'
            }
          </div>
        </div>
        
        <UltimateGame
          gameIndex={viewingGameIndex}
          gameData={metaState.ultimateGames[viewingGameIndex]}
          xIsNext={metaState.xIsNext}
          isActive={metaState.activeUltimateGameIndex === viewingGameIndex}
          onGameWin={handleUltimateGameWin}
          updateGameState={(updatedGame) => updateUltimateGameState(viewingGameIndex, updatedGame)}
        />
      </div>
    );
  }

  // Meta board game status message
  let status;
  if (metaState.metaGameState === 'won') {
    status = `Meta Winner: ${metaState.metaWinner}`;
  } else if (metaState.metaGameState === 'draw') {
    status = 'Meta Game ended in a draw';
  } else {
    status = `Next player: ${metaState.xIsNext ? 'X' : 'O'}`;
    if (metaState.activeUltimateGameIndex !== null) {
      status += ` (Game ${metaState.activeUltimateGameIndex + 1})`;
    } else {
      status += ' (Choose any unfinished game)';
    }
  }

  return (
    <div className="meta-game">
      <div className="meta-game-header">
        <h2>TicTacTactic Hardcore Duel</h2>
        <div className="meta-status">{status}</div>
        <div className="meta-controls">
          <button className="meta-button" onClick={resetMetaGame}>Reset Game</button>
          <button className="meta-button" onClick={saveGame}>Save Game</button>
          <button className="meta-button" onClick={loadGame}>Load Game</button>
          <button className="meta-button" onClick={toggleHelpModal}>Help</button>
        </div>
      </div>

      <div className="meta-board">
        <div className="board-row">
          {[0, 1, 2].map(i => renderMetaCell(i))}
        </div>
        <div className="board-row">
          {[3, 4, 5].map(i => renderMetaCell(i))}
        </div>
        <div className="board-row">
          {[6, 7, 8].map(i => renderMetaCell(i))}
        </div>
      </div>

      {showHelpModal && (
        <div className="help-modal">
          <div className="help-modal-content">
            <h3>Hardcore Duel Mode Rules</h3>
            <button className="close-modal" onClick={toggleHelpModal}>×</button>
            <div className="help-content">
              <h4>Game Structure</h4>
              <p>You're playing 9 Ultimate Tic-Tac-Toe games arranged in a 3×3 grid.</p>
              
              <h4>How to Play</h4>
              <ol>
                <li>The first game can be chosen freely.</li>
                <li>Within each Ultimate game, as soon as a player wins a small 3×3 board, that Ultimate game ends.</li>
                <li>The position of the winning small board determines which Ultimate game is played next.</li>
                <li>If the next game is already completed, the player can choose any unfinished game.</li>
                <li>Players alternate between X and O across all games.</li>
              </ol>
              
              <h4>Winning</h4>
              <p>Win three Ultimate games in a row (horizontally, vertically, or diagonally) to win the Meta-Duel.</p>
              
              <h4>Navigation</h4>
              <p>Click on any Ultimate game to view or play it. You can only make moves in the active game.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper function to render a meta cell (representing an ultimate game)
  function renderMetaCell(index) {
    const game = metaState.ultimateGames[index];
    const isActive = metaState.activeUltimateGameIndex === index;
    const canStart = metaState.activeUltimateGameIndex === null || isActive;
    const cellClass = `meta-cell ${game.status === 'completed' ? `won-by-${game.winner}` : ''} ${isActive ? 'active' : ''} ${game.status === 'not-started' && canStart ? 'can-start' : ''}`;
    
    return (
      <div 
        key={index}
        className={cellClass}
        onClick={() => startUltimateGame(index)}
      >
        {game.status === 'completed' ? (
          <div className="meta-winner">{game.winner === 'draw' ? '=' : game.winner}</div>
        ) : (
          <div className="meta-preview">
            Game {index + 1}
            <div className="meta-status-indicator">
              {game.status === 'active' ? 'Active' : 'Not Started'}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default MetaBoard;