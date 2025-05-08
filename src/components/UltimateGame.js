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
    if (initialNextBoardIndex !== undefined) {
      setNextBoardIndex(initialNextBoardIndex);
    }
  }, [initialNextBoardIndex]);

  // Keine separate Effect für nextBoardIndex nötig, da es bereits im State ist

  // Removed the separate effect for updating parent as we now update directly in handleClick

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
    
    if (smallWinner) {
      const newSmallWinners = [...smallWinners];
      newSmallWinners[boardIndex] = smallWinner;
      setSmallWinners(newSmallWinners);
      
      // Check if this results in ultimate win by checking the pattern of small winners
      const ultimateWinnerResult = calculateWinner(newSmallWinners);
      if (ultimateWinnerResult && ultimateWinnerResult !== 'draw') {
        // Now we have an ultimate winner
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
      }
    }
    
    // Set the next board index based on the square that was clicked
    // Wenn das Zielfeld bereits gewonnen ist oder ein Unentschieden hat, kann der Spieler frei wählen
    const targetBoardIndex = squareIndex;
    const nextBoard = smallWinners[targetBoardIndex] ? null : targetBoardIndex;
    setNextBoardIndex(nextBoard);
    
    // Prepare game state update for parent component
    const gameStateUpdate = {
      boards: newBoards,
      smallWinners: smallWinner ? [...smallWinners].map((w, i) => i === boardIndex ? smallWinner : w) : smallWinners,
      winner: ultimateWinner,
      lastWinPosition: winningPosition,
      nextBoardIndex: nextBoard
    };
    
    // Update parent component with new game state
    // Füge ein drittes Argument hinzu, um anzuzeigen, dass ein Spielerwechsel erfolgen soll
    updateGameState(gameStateUpdate, true);
    
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
      if (isActive && nextBoardIndex !== null) {
        // Wenn das Ziel-Board bereits gewonnen ist, informiere den Spieler, dass er frei wählen kann
        if (smallWinners[nextBoardIndex] !== null) {
          message += ` (Free choice - target board already won)`;
        } else {
          message += ` (Board ${nextBoardIndex + 1})`;
        }
      }
      return message;
    }
  }, [ultimateWinner, smallWinners, isActive, xIsNext, nextBoardIndex]);

  // Render a small board - moved outside the render method to avoid closures
  const renderSmallBoard = useCallback((i) => {
    // Ein Board ist aktiv, wenn:
    // 1. Das Spiel aktiv ist
    // 2. Es keinen ultimativen Gewinner gibt
    // 3. Entweder kein nextBoardIndex gesetzt ist ODER der nextBoardIndex diesem Board entspricht
    // 4. Das Board selbst noch keinen Gewinner hat
    const isSmallBoardActive = isActive && 
                              !ultimateWinner && 
                              (nextBoardIndex === null || nextBoardIndex === i) && 
                              !smallWinners[i];
    
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
