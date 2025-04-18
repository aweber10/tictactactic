import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SmallBoard from './SmallBoard';
import { calculateWinner } from '../utils/gameUtils';

const UltimateGame = ({ gameIndex, gameData, xIsNext, isActive, onGameWin, updateGameState }) => {
  const [boards, setBoards] = useState(gameData.boards || Array(9).fill(null).map(() => Array(9).fill(null)));
  const [smallWinners, setSmallWinners] = useState(gameData.smallWinners || Array(9).fill(null));
  const [nextBoardIndex, setNextBoardIndex] = useState(null);
  const [ultimateWinner, setUltimateWinner] = useState(gameData.winner);
  const [winningPosition, setWinningPosition] = useState(gameData.lastWinPosition);
  const [processingMove, setProcessingMove] = useState(false);
  // Use a separate state for tracking when to update parent
  const [shouldUpdateParent, setShouldUpdateParent] = useState(false);

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
  }, [gameData]);

  // Separate effect for updating parent only when needed
  useEffect(() => {
    if (shouldUpdateParent) {
      updateGameState({
        boards,
        smallWinners,
        winner: ultimateWinner,
        lastWinPosition: winningPosition
      });
      setShouldUpdateParent(false);
    }
  }, [shouldUpdateParent, boards, smallWinners, ultimateWinner, winningPosition, updateGameState]);

  // Handle a move in a small board - memoize to avoid recreation on every render
  const handleClick = useCallback((boardIndex, squareIndex) => {
    // If already processing a move or game is inactive, return
    if (processingMove || !isActive || ultimateWinner) {
      return;
    }

    // Check if this is a valid move
    if (nextBoardIndex !== null && nextBoardIndex !== boardIndex) {
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
      
      // Since we won a small board, check if this results in ultimate win
      if (smallWinner !== 'draw') {
        // This will end the ultimate game immediately
        setUltimateWinner(smallWinner);
        setWinningPosition(boardIndex);
        
        // Notify parent component of the win - separate to avoid recursive renders
        setTimeout(() => {
          onGameWin(gameIndex, smallWinner, boardIndex);
        }, 0);
      }
    }
    
    // Set the next board index based on the square that was clicked
    setNextBoardIndex(smallWinners[squareIndex] ? null : squareIndex);
    
    // Mark to update parent after state changes are applied
    setShouldUpdateParent(true);
    
    // Allow new moves after a brief delay
    setTimeout(() => {
      setProcessingMove(false);
    }, 300);
  }, [
    processingMove, isActive, ultimateWinner, nextBoardIndex, 
    smallWinners, boards, xIsNext, gameIndex, onGameWin
  ]);

  // Game status message
  const status = useMemo(() => {
    if (ultimateWinner) {
      return `Ultimate Winner: ${ultimateWinner}`;
    } else if (smallWinners.every(winner => winner !== null)) {
      return 'Game ended in a draw';
    } else {
      let message = isActive 
        ? `Next player: ${xIsNext ? 'X' : 'O'}`
        : 'Viewing only - not your turn';
        
      if (isActive && nextBoardIndex !== null && !smallWinners[nextBoardIndex]) {
        message += ` (Board ${nextBoardIndex + 1})`;
      }
      return message;
    }
  }, [ultimateWinner, smallWinners, isActive, xIsNext, nextBoardIndex]);

  // Render a small board - moved outside the render method to avoid closures
  const renderSmallBoard = useCallback((i) => {
    const isSmallBoardActive = isActive && !ultimateWinner && (nextBoardIndex === null || nextBoardIndex === i) && !smallWinners[i];
    
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