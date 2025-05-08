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
    console.log("Ultimate Game gewonnen:", {
      ultimateGameIndex,
      winner,
      winPosition
    });
    
    setMetaState(prevState => {
      const newState = { ...prevState };
      const ultimateGame = { ...newState.ultimateGames[ultimateGameIndex] };
      
      // Mark the ultimate game as completed with its winner
      ultimateGame.status = 'completed';
      ultimateGame.winner = winner;
      ultimateGame.lastWinPosition = winPosition;
      
      newState.ultimateGames[ultimateGameIndex] = ultimateGame;
      
      // Debug-Ausgabe für den aktuellen Zustand der Ultimate-Spiele
      console.log("Ultimate Games nach Gewinn:", 
        newState.ultimateGames.map((g, i) => ({
          index: i,
          status: g.status,
          winner: g.winner
        }))
      );
      
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
    console.log("Flag für Meta-Gewinnüberprüfung gesetzt");
    
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
        
        // Setze nur den activeUltimateGameIndex, aber ändere nicht die Status
        // der anderen Spiele, damit sie ihren Fortschritt behalten
        newState.activeUltimateGameIndex = index;
        
        // Stelle sicher, dass das ausgewählte Spiel aktiv ist
        const game = { ...newState.ultimateGames[index] };
        if (game.status !== 'completed') {
          game.status = 'active';
          newState.ultimateGames[index] = game;
        }
        
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
      
      // Debug-Ausgabe für Meta-Gewinnüberprüfung
      const winLines = [
        [0,1,2], [3,4,5], [6,7,8], // horizontal
        [0,3,6], [1,4,7], [2,5,8], // vertikal
        [0,4,8], [2,4,6]           // diagonal
      ];
      
      // Manuelle Überprüfung der Gewinnlinien für Meta-Spiel
      let metaWinner = null;
      for (const line of winLines) {
        const [a, b, c] = line;
        if (
          ultimateWinners[a] && 
          ultimateWinners[a] === ultimateWinners[b] && 
          ultimateWinners[a] === ultimateWinners[c] &&
          ultimateWinners[a] !== 'draw'
        ) {
          metaWinner = ultimateWinners[a];
          break;
        }
      }
      
      console.log("Überprüfe Meta-Gewinner:", {
        calculatedWinner: calculateWinner(ultimateWinners),
        manualWinner: metaWinner,
        ultimateWinners,
        winLines: winLines.map(line => ({
          line,
          values: line.map(i => ultimateWinners[i]),
          isWinLine: ultimateWinners[line[0]] && 
                     ultimateWinners[line[0]] === ultimateWinners[line[1]] && 
                     ultimateWinners[line[0]] === ultimateWinners[line[2]] &&
                     ultimateWinners[line[0]] !== 'draw'
        }))
      });
      
      // Verwende die manuelle Überprüfung anstelle der calculateWinner-Funktion
      const winner = metaWinner;
      
      if (winner) {
        // Meta-game has a winner
        console.log("META-GEWINNER GEFUNDEN:", winner);
        setMetaState(prevState => ({
          ...prevState,
          metaWinner: winner,
          metaGameState: 'won'
        }));
      } else if (metaState.ultimateGames.every(game => game.status === 'completed')) {
        // All ultimate games are completed but no winner
        console.log("META-SPIEL UNENTSCHIEDEN");
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
    
    // Verwende lokale Variable für viewingGameIndex-Änderungen
    let newViewingGameIndex = null;
    
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
      if (updatedGame.boardWon && updatedGame.wonBoardIndex !== undefined) {
        // Verwende wonBoardIndex (die Position des gewonnenen Bretts) für den Spielwechsel
        const nextGameIndex = updatedGame.wonBoardIndex;
        // Verwende lastMovePosition für das aktive Brett im nächsten Spiel
        const nextActiveBoard = updatedGame.lastMovePosition;
        
        // DEBUG: Protokolliere das Ziel-Spiel und den Grund für den Wechsel
        console.log(`SPIELWECHSEL: Brett ${updatedGame.wonBoardIndex} in Spiel ${index} gewonnen -> 
          Gewonnenes Brett an Position ${updatedGame.wonBoardIndex} -> 
          Wechsle zu Spiel ${nextGameIndex} -> 
          Aktives Brett im neuen Spiel: ${nextActiveBoard}`);
        
        // WICHTIG: Das aktuelle Spiel NICHT auf 'not-started' setzen!
        // Es sollte aktiv bleiben, nur nicht das aktuell ausgewählte Spiel sein
        if (newState.activeUltimateGameIndex === index) {
          // Deaktiviere nur vorübergehend - es soll nicht als "nicht gestartet" erscheinen
          newState.activeUltimateGameIndex = null;
        }
        
        // Prüfe, ob das nächste Spiel bereits abgeschlossen ist
        if (newState.ultimateGames[nextGameIndex].status === 'completed') {
          console.log(`Spiel ${nextGameIndex} ist bereits beendet, Spieler kann frei wählen`);
          newState.activeUltimateGameIndex = null;
        } else {
          // Setze das neue Spiel auf "active" und setze das aktive Brett basierend auf dem letzten Zug
          const nextActiveBoard = updatedGame.lastMovePosition;
          
          // Prüfe, ob das Ziel-Brett bereits gewonnen ist
          const targetBoardAlreadyWon = newState.ultimateGames[nextGameIndex].smallWinners[nextActiveBoard] !== null;
          
          console.log(`Setze aktives Brett in Spiel ${nextGameIndex}:`, {
            nextActiveBoard,
            targetBoardAlreadyWon,
            // Wenn das Ziel-Brett bereits gewonnen ist, setze nextBoardIndex auf null (freie Wahl)
            finalNextBoardIndex: targetBoardAlreadyWon ? null : nextActiveBoard
          });
          
          newState.ultimateGames[nextGameIndex] = {
            ...newState.ultimateGames[nextGameIndex],
            status: 'active',
            // Wenn das Ziel-Brett bereits gewonnen ist, setze nextBoardIndex auf null (freie Wahl)
            nextBoardIndex: targetBoardAlreadyWon ? null : nextActiveBoard
          };
          newState.activeUltimateGameIndex = nextGameIndex;
        }
        
        // Speichere das nächste Spiel in der lokalen Variable
        newViewingGameIndex = nextGameIndex;
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
    
    // Setze viewingGameIndex außerhalb der metaState-Aktualisierung, wenn nötig
    if (newViewingGameIndex !== null) {
      setViewingGameIndex(newViewingGameIndex);
    }
  }, [viewingGameIndex]);

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
    
    // Bestimme eine Klasse, die anzeigt, dass dieses Spiel bereits Fortschritte hat
    const hasProgress = game.smallWinners.some(winner => winner !== null);
    
    // DEBUG: Zeige den Status jedes Spiels
    console.log(`MetaCell ${index}: status=${game.status}, isActive=${isActive}, canStart=${canStart}, hasProgress=${hasProgress}`);
    
    const cellClass = `meta-cell 
      ${game.status === 'completed' ? `won-by-${game.winner}` : ''} 
      ${isActive ? 'active' : ''} 
      ${game.status === 'not-started' && canStart ? 'can-start' : ''}
      ${hasProgress && !isActive && game.status !== 'completed' ? 'has-progress' : ''}`;
    
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
              {isActive ? 'Active' : 
               hasProgress ? 'In Progress' : 
               'Not Started'}
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
