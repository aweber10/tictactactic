import { useState, useEffect, useCallback } from 'react';
import SmallBoard from './SmallBoard';
import { calculateWinner } from '../utils/gameUtils';

function UltimateGame({ gameIndex, gameData, xIsNext, isActive, onGameWin, updateGameState }) {
  const [boards, setBoards] = useState(gameData.boards || Array(9).fill(null).map(() => Array(9).fill(null)));
  const [smallWinners, setSmallWinners] = useState(gameData.smallWinners || Array(9).fill(null));
  const [nextBoardIndex, setNextBoardIndex] = useState(null);
  const [ultimateWinner, setUltimateWinner] = useState(gameData.winner);
  const [winningPosition, setWinningPosition] = useState(gameData.lastWinPosition);
  const [stateChanged, setStateChanged] = useState(false);
  
  // For preventing double clicks
  const [processingMove, setProcessingMove] = useState(false);

  // Sync state with props
  useEffect(() => {
    setBoards(gameData.boards);
    setSmallWinners(gameData.smallWinners);
    setUltimateWinner(gameData.winner);
    setWinningPosition(gameData.lastWinPosition);
    setStateChanged(false);
    setProcessingMove(false);
  }, [gameData]);

  // Save state changes to parent only when necessary
  useEffect(() => {
    if (stateChanged) {
      updateGameState({
        boards,
        smallWinners,
        winner: ultimateWinner,
        lastWinPosition: winningPosition
      });
      setStateChanged(false);
    }
  }, [stateChanged, boards, smallWinners, ultimateWinner, winningPosition, updateGameState]);

  // Debug log - print the current state of the board
  useEffect(() => {
    // For debugging only - uncomment when needed
    // console.log(`Board state:`, boards);
  }, [boards]);

  // Handle a move in a small board
  const handleClick = (boardIndex, squareIndex) => {
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
    
    // Update all state in one go
    setBoards(newBoards);
    
    // Check if the small board has been won
    const smallWinner = calculateWinner(currentBoard);
    if (smallWinner) {
      const newSmallWinners = [...smallWinners];
      newSmallWinners[boardIndex] = smallWinner;
      setSmallWinners(newSmallWinners);
      
      // Since we won a small board, check if this results in ultimate win
      if (smallWinner !== 'draw') {
        // This will end the ultimate game immediately
        setUltimateWinner(smallWinner);
        setWinningPosition(boardIndex);
        
        // Notify parent component of the win
        onGameWin(gameIndex, smallWinner, boardIndex);
      }
    }
    
    // Set the next board index based on the square that was clicked
    setNextBoardIndex(smallWinners[squareIndex] ? null : squareIndex);
    
    // Mark that state has changed
    setStateChanged(true);
    
    // Allow new moves after a brief delay
    setTimeout(() => {
      setProcessingMove(false);
    }, 300);
  };

  // Render a small board
  const renderSmallBoard = (i) => {
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
  };

  // Game status message
  let status;
  if (ultimateWinner) {
    status = `Ultimate Winner: ${ultimateWinner}`;
  } else if (smallWinners.every(winner => winner !== null)) {
    status = 'Game ended in a draw';
  } else {
    status = isActive 
      ? `Next player: ${xIsNext ? 'X' : 'O'}`
      : 'Viewing only - not your turn';
      
    if (isActive && nextBoardIndex !== null && !smallWinners[nextBoardIndex]) {
      status += ` (Board ${nextBoardIndex + 1})`;
    }
  }

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
}

export default UltimateGame;