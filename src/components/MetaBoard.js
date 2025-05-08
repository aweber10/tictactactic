import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import UltimateGame from './UltimateGame';
import { calculateWinner } from '../utils/gameUtils';

const MetaBoard = () => {
  // Initial state setup
  const initialGameState = useMemo(() => ({
    ultimateGames: Array(9).fill(null).map(() => ({
      status: 'not-started', // 'not-started', 'active', 'completed'
      winner: null, // null, 'X', 'O', 'draw'
      boards: Array(9).fill(null).map(() => Array(9).fill(null)),
      smallWinners: Array(9).fill(null),
      lastWinPosition: null, // Position of the last winning small board
      nextBoardIndex: null // Speichere, welches Brett innerhalb dieses Spiels als nächstes aktiv sein soll
    })),
    xIsNext: true,
    activeUltimateGameIndex: null,
    metaWinner: null,
    metaGameState: 'playing' // 'playing', 'won', 'draw'
  }), []);
  
  const [metaState, setMetaState] = useState(initialGameState);
  const [viewingGameIndex, setViewingGameIndex] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log("Meta state updated:", {
      activeGame: metaState.activeUltimateGameIndex,
      xIsNext: metaState.xIsNext,
      statuses: metaState.ultimateGames.map(g => g.status)
    });
  }, [metaState.activeUltimateGameIndex, metaState.xIsNext, metaState.ultimateGames]);
  
  // Use a ref to track if we need to check for a meta winner
  const checkForWinnerRef = useRef(false);

  // Handle the completion of an ultimate game
  const handleUltimateGameWin = useCallback((ultimateGameIndex, winner, winPosition) => {
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
      
      // WICHTIG: Hier KEINEN Spielerwechsel durchführen, da dieser bereits in updateUltimateGameState erfolgt
      // Der Spielerwechsel wird bereits bei jedem Zug in updateUltimateGameState durchgeführt
      
      return newState;
    });
    
    // Set flag to check for a meta winner
    checkForWinnerRef.current = true;
    
    // Also set the viewing index to the next active game
    setViewingGameIndex(winPosition);
  }, []);

  // Start an ultimate game
  const startUltimateGame = useCallback((index) => {
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
  }, [metaState.activeUltimateGameIndex, metaState.ultimateGames]);

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
  const resetMetaGame = useCallback(() => {
    setMetaState(initialGameState);
    setViewingGameIndex(null);
  }, [initialGameState]);

  // Return to the meta board view
  const returnToMetaBoard = useCallback(() => {
    setViewingGameIndex(null);
  }, []);

  // Update an ultimate game's state
  const updateUltimateGameState = useCallback((index, updatedGame, shouldTogglePlayer = true) => {
    console.log(`Updating game ${index} with:`, updatedGame, "Toggle player:", shouldTogglePlayer);
    
    setMetaState(prevState => {
      // Nur aktualisieren, wenn es tatsächlich Änderungen gibt
      const currentGame = prevState.ultimateGames[index];
      
      // Überprüfe, ob ein Brett gewonnen wurde oder andere relevante Änderungen vorliegen
      const hasRelevantChanges = 
        JSON.stringify(currentGame.boards) !== JSON.stringify(updatedGame.boards) ||
        JSON.stringify(currentGame.smallWinners) !== JSON.stringify(updatedGame.smallWinners) ||
        currentGame.winner !== updatedGame.winner ||
        currentGame.lastWinPosition !== updatedGame.lastWinPosition ||
        currentGame.nextBoardIndex !== updatedGame.nextBoardIndex ||
        updatedGame.boardWon; // Auch aktualisieren, wenn ein Brett gewonnen wurde
      
      if (!hasRelevantChanges) {
        return prevState; // Keine relevanten Änderungen
      }
      
      const newState = { ...prevState };
      newState.ultimateGames = [...newState.ultimateGames];
      
      // Aktualisiere das aktuelle Spiel
      newState.ultimateGames[index] = {
        ...newState.ultimateGames[index],
        ...updatedGame,
        // Stelle sicher, dass der Status beibehalten wird, außer bei expliziter Änderung
        status: updatedGame.status || newState.ultimateGames[index].status,
        // Speichere nextBoardIndex im Spielzustand
        nextBoardIndex: updatedGame.nextBoardIndex !== undefined 
          ? updatedGame.nextBoardIndex 
          : newState.ultimateGames[index].nextBoardIndex
      };
      
      // Wenn das Spiel ein Unentschieden hat, markiere es als abgeschlossen
      if (updatedGame.winner === 'draw') {
        newState.ultimateGames[index].status = 'completed';
      }
      
      // WICHTIG: Wenn ein Brett gewonnen wurde, wechsele zum entsprechenden Game
      if (updatedGame.boardWon && updatedGame.wonBoardPosition !== undefined) {
        const nextGameIndex = updatedGame.wonBoardPosition;
        
        // DEBUG: Protokolliere das Ziel-Spiel und den Grund für den Wechsel
        console.log(`Brett ${updatedGame.wonBoardIndex} in Spiel ${index} gewonnen -> Position ${updatedGame.wonBoardPosition} -> wechsle zu Spiel ${nextGameIndex}`);
        
        // Aktualisiere den Status des aktuellen Spiels (deaktiviere es)
        newState.ultimateGames[index] = {
          ...newState.ultimateGames[index],
          status: 'not-started',
          // nextBoardIndex behält seinen Wert für dieses Spiel
        };
        
        // Prüfe, ob das nächste Spiel bereits abgeschlossen ist
        if (newState.ultimateGames[nextGameIndex].status === 'completed') {
          console.log(`Spiel ${nextGameIndex} ist bereits beendet, Spieler kann frei wählen`);
          newState.activeUltimateGameIndex = null;
        } else {
          // Aktiviere das nächste Spiel - alle anderen Spiele deaktivieren
          for (let i = 0; i < newState.ultimateGames.length; i++) {
            if (i !== nextGameIndex && newState.ultimateGames[i].status !== 'completed') {
              newState.ultimateGames[i].status = 'not-started';
            }
          }
          
          newState.ultimateGames[nextGameIndex].status = 'active';
          newState.activeUltimateGameIndex = nextGameIndex;
        }
        
        // Setze sofort viewingGameIndex (nicht verzögert)
        console.log(`Wechsle Ansicht zu Spiel ${nextGameIndex}`);
        setViewingGameIndex(nextGameIndex);
      }
      
      // Nach jedem Zug den Spieler wechseln, wenn erforderlich
      if (shouldTogglePlayer) {
        newState.xIsNext = !newState.xIsNext;
      }
      
      console.log(`Game State nach Update:`, {
        index,
        boardWon: updatedGame.boardWon,
        wonBoardPosition: updatedGame.wonBoardPosition,
        activeGame: newState.activeUltimateGameIndex,
        nextViewingIndex: viewingGameIndex
      });
      
      return newState;
    });
  }, []);

  // Toggle help modal
  const toggleHelpModal = useCallback(() => {
    setShowHelpModal(prevState => !prevState);
  }, []);

  // Save game state to local storage
  const saveGame = useCallback(() => {
    localStorage.setItem('tictactactic-hardcore-state', JSON.stringify(metaState));
    alert('Game saved successfully!');
  }, [metaState]);

  // Load game state from local storage
  const loadGame = useCallback(() => {
    const savedState = localStorage.getItem('tictactactic-hardcore-state');
    if (savedState) {
      setMetaState(JSON.parse(savedState));
      setViewingGameIndex(null);
      alert('Game loaded successfully!');
    } else {
      alert('No saved game found!');
    }
  }, []);

  // Memoized rendering of meta cell to prevent unnecessary re-renders
  const renderMetaCell = useCallback((index) => {
    const game = metaState.ultimateGames[index];
    const isActive = metaState.activeUltimateGameIndex === index;
    const canStart = metaState.activeUltimateGameIndex === null || isActive;
    
    // DEBUG: Zeige den Status jedes Spiels
    console.log(`MetaCell ${index}: status=${game.status}, isActive=${isActive}, canStart=${canStart}`);
    
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
  }, [metaState.ultimateGames, metaState.activeUltimateGameIndex, startUltimateGame]);

  // Memoized status message
  const status = useMemo(() => {
    if (metaState.metaGameState === 'won') {
      return `Meta Winner: ${metaState.metaWinner}`;
    } else if (metaState.metaGameState === 'draw') {
      return 'Meta Game ended in a draw';
    } else {
      let statusText = `Next player: ${metaState.xIsNext ? 'X' : 'O'}`;
      if (metaState.activeUltimateGameIndex !== null) {
        statusText += ` (Game ${metaState.activeUltimateGameIndex + 1})`;
      } else {
        statusText += ' (Choose any unfinished game)';
      }
      return statusText;
    }
  }, [metaState.metaGameState, metaState.metaWinner, metaState.xIsNext, metaState.activeUltimateGameIndex]);

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
          nextBoardIndex={metaState.ultimateGames[viewingGameIndex].nextBoardIndex}
        />
      </div>
    );
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
          {[0, 1, 2].map(renderMetaCell)}
        </div>
        <div className="board-row">
          {[3, 4, 5].map(renderMetaCell)}
        </div>
        <div className="board-row">
          {[6, 7, 8].map(renderMetaCell)}
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
};

export default React.memo(MetaBoard);
