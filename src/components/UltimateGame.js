import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SmallBoard from './SmallBoard';
import { calculateWinner } from '../utils/gameUtils';

const UltimateGame = ({ gameIndex, gameData, xIsNext, isActive, onGameWin, updateGameState, nextBoardIndex: initialNextBoardIndex }) => {
  const [boards, setBoards] = useState(gameData.boards || Array(9).fill(null).map(() => Array(9).fill(null)));
  const [smallWinners, setSmallWinners] = useState(gameData.smallWinners || Array(9).fill(null));
  const [nextBoardIndex, setNextBoardIndex] = useState(initialNextBoardIndex || null);
  const [ultimateWinner, setUltimateWinner] = useState(gameData.winner);
  const [winningPosition, setWinningPosition] = useState(gameData.lastWinPosition);
  const [processingMove, setProcessingMove] = useState(false);
  // Use a separate state for tracking when to update parent
  // Removed shouldUpdateParent state as we now update directly in handleClick

  // Debug logging
  useEffect(() => {
    console.log(`UltimateGame ${gameIndex} rendered with:`, {
      isActive,
      status: gameData.status,
      nextBoardIndex,
      smallWinners: smallWinners.map((w, i) => w ? `${i}:${w}` : null).filter(Boolean)
    });
  }, [gameIndex, isActive, gameData.status, nextBoardIndex, smallWinners]);

  // Sync state with props - using deep comparison to avoid unnecessary updates
  useEffect(() => {
    if (
      JSON.stringify(gameData.boards) !== JSON.stringify(boards) ||
      JSON.stringify(gameData.smallWinners) !== JSON.stringify(smallWinners) ||
      gameData.winner !== ultimateWinner ||
      gameData.lastWinPosition !== winningPosition
    ) {
      setBoards(gameData.boards);
      setSmallWinners(gameData.smallWinners);
      setUltimateWinner(gameData.winner);
      setWinningPosition(gameData.lastWinPosition);
      setProcessingMove(false);
    }
  }, [gameData, boards, smallWinners, ultimateWinner, winningPosition]);

  // Separate effect to handle initialNextBoardIndex changes
  useEffect(() => {
    if (initialNextBoardIndex !== undefined && initialNextBoardIndex !== nextBoardIndex) {
      console.log(`UltimateGame ${gameIndex}: Updating nextBoardIndex from props: ${initialNextBoardIndex}`);
      console.log(`Aktives Brett in Spiel ${gameIndex} wird auf ${initialNextBoardIndex} gesetzt`);
      setNextBoardIndex(initialNextBoardIndex);
    }
  }, [initialNextBoardIndex, nextBoardIndex, gameIndex]);

  // Keine separate Effect für nextBoardIndex nötig, da es bereits im State ist

  // Removed the separate effect for updating parent as we now update directly in handleClick

  // Hilfsfunktion zum Debuggen von Gewinnmustern
  const getWinningPattern = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontal
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // vertikal
      [0, 4, 8], [2, 4, 6]             // diagonal
    ];
    
    return lines
      .filter(line => 
        squares[line[0]] && 
        squares[line[0]] === squares[line[1]] && 
        squares[line[0]] === squares[line[2]]
      )
      .map(line => ({
        pattern: line,
        winner: squares[line[0]]
      }));
  };

  // Handle a move in a small board - memoize to avoid recreation on every render
  const handleClick = useCallback((boardIndex, squareIndex) => {
    // If already processing a move or game is inactive, return
    if (processingMove || !isActive || ultimateWinner) {
      return;
    }

    // Wenn das Board bereits einen Gewinner hat, ist kein Zug möglich
    if (smallWinners[boardIndex]) {
      return;
    }

    // Check if this is a valid move - must be on the correct board if nextBoardIndex is set
    // Ausnahme: Wenn nextBoardIndex auf ein bereits gewonnenes Board zeigt, darf der Spieler frei wählen
    if (nextBoardIndex !== null) {
      // Wenn das Ziel-Board bereits gewonnen ist, darf der Spieler ein beliebiges Board wählen
      const targetBoardHasWinner = smallWinners[nextBoardIndex] !== null;
      
      console.log('Move validation:', {
        nextBoardIndex,
        boardIndex,
        targetBoardHasWinner,
        isValidMove: targetBoardHasWinner || nextBoardIndex === boardIndex
      });
      
      if (!targetBoardHasWinner && nextBoardIndex !== boardIndex) {
        console.log('Invalid move: wrong board', nextBoardIndex, boardIndex);
        return;
      }
    }

    // Prüfe, ob das Board aktiv ist (redundante Sicherheitsprüfung)
    const isSmallBoardActive = isActive && 
                              !ultimateWinner && 
                              !smallWinners[boardIndex];
    
    if (!isSmallBoardActive) {
      return;
    }

    // Check if the board or square is already filled
    if (smallWinners[boardIndex] || boards[boardIndex][squareIndex]) {
      return;
    }

    // Prevent multiple rapid clicks
    setProcessingMove(true);

    // Create copies to update state immutably
    const newBoards = [...boards];
    const currentBoard = [...newBoards[boardIndex]];
    
    // Make the move
    currentBoard[squareIndex] = xIsNext ? 'X' : 'O';
    newBoards[boardIndex] = currentBoard;
    
    // Check if the small board has been won
    const smallWinner = calculateWinner(currentBoard);
    
    // Prepare updates with a single batch
    setBoards(newBoards);
    
    // Update smallWinners if a board was won
    let newSmallWinners = [...smallWinners];
    if (smallWinner) {
      newSmallWinners[boardIndex] = smallWinner;
      setSmallWinners(newSmallWinners);
      
      // Debug-Ausgabe für das gewonnene Brett
      console.log("Brett gewonnen:", {
        boardIndex,
        smallWinner,
        smallWinners: [...newSmallWinners],
        winPattern: getWinningPattern(newSmallWinners)
      });
      
      // Check if this results in ultimate win by checking the pattern of small winners
      const ultimateWinnerResult = calculateWinner(newSmallWinners);
      
      // Detaillierte Debug-Ausgabe zur Gewinnüberprüfung
      const winLines = [
        [0,1,2], [3,4,5], [6,7,8], // horizontal
        [0,3,6], [1,4,7], [2,5,8], // vertikal
        [0,4,8], [2,4,6]           // diagonal
      ];
      
      // Manuelle Überprüfung der Gewinnlinien
      let manualWinner = null;
      for (const line of winLines) {
        const [a, b, c] = line;
        if (
          newSmallWinners[a] && 
          newSmallWinners[a] === newSmallWinners[b] && 
          newSmallWinners[a] === newSmallWinners[c] &&
          newSmallWinners[a] !== 'draw'
        ) {
          manualWinner = newSmallWinners[a];
          break;
        }
      }
      
      console.log("Überprüfe ultimativen Gewinner:", {
        calculatedWinner: ultimateWinnerResult,
        manualWinner,
        smallWinners: [...newSmallWinners],
        winLines: winLines.map(line => ({
          line,
          values: line.map(i => newSmallWinners[i]),
          isWinLine: newSmallWinners[line[0]] && 
                     newSmallWinners[line[0]] === newSmallWinners[line[1]] && 
                     newSmallWinners[line[0]] === newSmallWinners[line[2]] &&
                     newSmallWinners[line[0]] !== 'draw'
        }))
      });
      
      // Verwende die manuelle Überprüfung anstelle der calculateWinner-Funktion
      const ultimateWinnerResult = manualWinner;
      
      if (ultimateWinnerResult) {
        // Now we have an ultimate winner
        console.log("ULTIMATIVER GEWINNER GEFUNDEN:", ultimateWinnerResult);
        setUltimateWinner(ultimateWinnerResult);
        setWinningPosition(boardIndex);
        
        // Notify parent component of the win - separate to avoid recursive renders
        setTimeout(() => {
          onGameWin(gameIndex, ultimateWinnerResult, boardIndex);
        }, 0);
      } else if (newSmallWinners.every(winner => winner !== null)) {
        // If all small boards have a result but no ultimate winner, it's a draw
        setUltimateWinner('draw');
        
        // Notify parent component about the draw
        setTimeout(() => {
          onGameWin(gameIndex, 'draw', boardIndex);
        }, 0);
      } else {
        // Nur ein kleines Brett gewonnen - WICHTIG: Markiere als boardWon
        // Die Position des gewonnenen Bretts (boardIndex) bestimmt das nächste Spiel
        // Die Position des letzten Zuges (squareIndex) bestimmt das aktive Brett im nächsten Spiel
        console.log(`Brett ${boardIndex} in Spiel ${gameIndex} gewonnen durch Zug an Position ${squareIndex}`);
        console.log(`Nächstes Spiel sollte ${boardIndex} sein, darin aktives Brett: ${squareIndex}`);
        
        updateGameState({
          boards: newBoards,
          smallWinners: newSmallWinners,
          winner: null, // Kein Gesamtgewinner
          lastWinPosition: null,
          boardWon: true, // Markiere, dass ein Brett gewonnen wurde
          wonBoardIndex: boardIndex, // Index des gewonnenen Bretts - bestimmt das nächste Game
          wonBoardPosition: boardIndex, // Position für das nächste Spiel
          lastMovePosition: squareIndex, // Position des letzten Zuges - bestimmt das aktive Brett im nächsten Spiel
          wonBy: smallWinner // Füge den Gewinner hinzu für bessere Logs
        });
        
        // Wir setzen hier keinen nextBoardIndex, da wir zu einem anderen Spiel wechseln werden
        // Der aktuelle nextBoardIndex bleibt für dieses Spiel erhalten
        
        return; // Beende die Funktion hier, da wir bereits updateGameState aufgerufen haben
      }
    } else {
      // Set the next board index based on the square that was clicked
      // Wenn das Zielfeld bereits gewonnen ist oder ein Unentschieden hat, kann der Spieler frei wählen
      const targetBoardIndex = squareIndex;
      const nextBoard = newSmallWinners[targetBoardIndex] ? null : targetBoardIndex;
      setNextBoardIndex(nextBoard);
      
      // Prepare game state update for parent component
      const gameStateUpdate = {
        boards: newBoards,
        smallWinners: newSmallWinners,
        winner: ultimateWinner,
        lastWinPosition: winningPosition,
        nextBoardIndex: nextBoard // Wichtig: Aktualisiere das NextBoardIndex für das aktuelle Spiel
      };
      
      // Update parent component with new game state
      updateGameState(gameStateUpdate, true);
    }
    
    // Allow new moves after a brief delay
    setTimeout(() => {
      setProcessingMove(false);
    }, 300);
  }, [
    processingMove, isActive, ultimateWinner, nextBoardIndex, 
    smallWinners, boards, xIsNext, gameIndex, onGameWin, updateGameState, winningPosition
  ]);

  // Game status message
  const status = useMemo(() => {
    if (ultimateWinner === 'draw') {
      return 'Game ended in a draw';
    } else if (ultimateWinner) {
      return `Ultimate Winner: ${ultimateWinner}`;
    } else if (smallWinners.every(winner => winner !== null)) {
      // Wenn alle kleinen Bretter ein Ergebnis haben, aber noch kein ultimateWinner gesetzt ist
      // Setze den ultimateWinner auf 'draw' und informiere die übergeordnete Komponente
      if (!processingMove) {
        setUltimateWinner('draw');
        onGameWin(gameIndex, 'draw', null);
      }
      return 'Game ended in a draw';
    } else {
      let message = isActive 
        ? `Next player: ${xIsNext ? 'X' : 'O'}`
        : 'Viewing only - not your turn';
        
      // Zeige den Board-Index an, wenn ein nextBoardIndex gesetzt ist
      if (isActive) {
        if (nextBoardIndex === null) {
          message += ` (Free choice)`;
        } else if (smallWinners[nextBoardIndex] !== null) {
          message += ` (Free choice - target board already won)`;
        } else {
          message += ` (Board ${nextBoardIndex + 1})`;
        }
      }
      return message;
    }
  }, [ultimateWinner, smallWinners, isActive, xIsNext, nextBoardIndex, gameIndex, onGameWin, processingMove]);

  // Render a small board - moved outside the render method to avoid closures
  const renderSmallBoard = useCallback((i) => {
    // Prüfe, ob das Ziel-Brett bereits gewonnen ist
    const targetBoardHasWinner = nextBoardIndex !== null && smallWinners[nextBoardIndex] !== null;
    
    // Ein Board ist aktiv, wenn:
    // 1. Das Spiel aktiv ist
    // 2. Es keinen ultimativen Gewinner gibt
    // 3. Das Board selbst noch keinen Gewinner hat
    // 4. Entweder:
    //    a) nextBoardIndex ist null (freie Wahl) ODER
    //    b) nextBoardIndex ist dieses Brett ODER
    //    c) Das Ziel-Brett (nextBoardIndex) hat bereits einen Gewinner (freie Wahl)
    const isSmallBoardActive = isActive && 
                              !ultimateWinner && 
                              !smallWinners[i] &&
                              (nextBoardIndex === null || nextBoardIndex === i || targetBoardHasWinner);
    
    // Debug-Ausgabe zur Aktivierungslogik
    console.log(`renderSmallBoard ${i}:`, {
      isActive,
      nextBoardIndex,
      targetBoardHasWinner,
      hasWinner: smallWinners[i] !== null,
      isSmallBoardActive
    });
    
    return (
      <SmallBoard
        key={i}
        board={boards[i]}
        onClick={(squareIndex) => handleClick(i, squareIndex)}
        isActive={isSmallBoardActive}
        winner={smallWinners[i]}
      />
    );
  }, [boards, handleClick, isActive, nextBoardIndex, smallWinners, ultimateWinner]);

  return (
    <div className="ultimate-game">
      <div className="game-info">
        <div className="status">{status}</div>
      </div>
      <div className="ultimate-board">
        <div className="board-row">
          {renderSmallBoard(0)}
          {renderSmallBoard(1)}
          {renderSmallBoard(2)}
        </div>
        <div className="board-row">
          {renderSmallBoard(3)}
          {renderSmallBoard(4)}
          {renderSmallBoard(5)}
        </div>
        <div className="board-row">
          {renderSmallBoard(6)}
          {renderSmallBoard(7)}
          {renderSmallBoard(8)}
        </div>
      </div>
    </div>
  );
};

// Wrap with memo to prevent unnecessary re-renders
export default React.memo(UltimateGame);
