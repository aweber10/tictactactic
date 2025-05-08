import { useState, useEffect } from 'react';
import SmallBoard from './SmallBoard';
import { calculateWinner } from '../utils/gameUtils';

function BigBoard() {
  // Array of 9 small boards, each containing 9 squares
  const [boards, setBoards] = useState(Array(9).fill(null).map(() => Array(9).fill(null)));
  // Track winners of each small board
  const [smallWinners, setSmallWinners] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [nextBoardIndex, setNextBoardIndex] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'draw'

  // Handle a move in a small board
  const handleClick = (boardIndex, squareIndex) => {

    console.log("Verfügbare Bretter:", boards.map((board, index) => {
      return {
        boardIndex: index,
        isFull: board.every(square => square !== null),
        isWon: smallWinners[index] !== null,
        available: smallWinners[index] === null && !board.every(square => square !== null)
      };
    }));

    if (gameState !== 'playing' || smallWinners[boardIndex] || boards[boardIndex][squareIndex]) {
      return;
    }

    // Check if this is a valid move
    if (nextBoardIndex !== null && nextBoardIndex !== boardIndex) {
      return;
    }

    // Log the current state before making any changes
    console.log(`Nach Zug in Board ${boardIndex}, Feld ${squareIndex}:`, {
      boards: JSON.parse(JSON.stringify(boards)),
      smallWinners,
      nextBoardIndex,
      xIsNext,
      gameWinner
    });

    // Create copies to update state immutably
    const newBoards = [...boards];
    const currentBoard = [...newBoards[boardIndex]];
    
    // Make the move
    currentBoard[squareIndex] = xIsNext ? 'X' : 'O';
    newBoards[boardIndex] = currentBoard;
    setBoards(newBoards);
    
    // Create updated smallWinners array with the current move's result
    const newSmallWinners = [...smallWinners];
    
    // Check if the small board has been won
    const smallWinner = calculateWinner(currentBoard);
    if (smallWinner) {
      newSmallWinners[boardIndex] = smallWinner;
      setSmallWinners(newSmallWinners);
    }
    
    // Set the next board index based on the square that was clicked
    let nextBoard = squareIndex;
    
    // Check if the next board is already won or full
    if (smallWinners[nextBoard] || newBoards[nextBoard].every(square => square !== null)) {
      // If the next board is won or full, player can choose any valid board
      nextBoard = null;
    }
    
    // Check if there are any playable boards left
    const anyPlayableBoards = newBoards.some((board, index) => {
      // A board is playable if it's not won and not full
      return !newSmallWinners[index] && !board.every(square => square !== null);
    });
    
    if (!anyPlayableBoards) {
      // If no playable boards left, set game to draw
      setGameState('draw');
    }
    
    // Update the next board index
    setNextBoardIndex(nextBoard);
    
    // Toggle player turn
    setXIsNext(!xIsNext);
  };

  // Check for a winner of the big board
  useEffect(() => {
    const winner = calculateWinner(smallWinners);
    if (winner) {
      setGameWinner(winner);
      setGameState('won');
    } else if (smallWinners.every(winner => winner !== null)) {
      // Check for a draw - all small boards are filled
      setGameState('draw');
    }
  }, [smallWinners]);

  // Reset the game
  const resetGame = () => {
    setBoards(Array(9).fill(null).map(() => Array(9).fill(null)));
    setSmallWinners(Array(9).fill(null));
    setXIsNext(true);
    setNextBoardIndex(null);
    setGameWinner(null);
    setGameState('playing');
  };

  // Render a small board
  const renderSmallBoard = (i) => {
    // A board is active if:
    // 1. The game is still in progress
    // 2. The board is not already won
    // 3. The board is not already full
    // 4. Either the player can choose any board (nextBoardIndex is null) or this is the next board to play
    const isBoardFull = boards[i].every(square => square !== null);
    const isActive = gameState === 'playing' && 
                    !smallWinners[i] && 
                    !isBoardFull && 
                    (nextBoardIndex === null || nextBoardIndex === i);
    
    return (
      <SmallBoard
        key={i}
        board={boards[i]}
        onClick={(squareIndex) => handleClick(i, squareIndex)}
        isActive={isActive}
        winner={smallWinners[i]}
      />
    );
  };

  // Game status message
  let status;
  if (gameState === 'won') {
    status = `Winner: ${gameWinner}`;
  } else if (gameState === 'draw') {
    status = 'Game ended in a draw';
  } else {
    status = `Next player: ${xIsNext ? 'X' : 'O'}`;
    if (nextBoardIndex !== null && !smallWinners[nextBoardIndex]) {
      status += ` (Board ${nextBoardIndex + 1})`;
    }
  }

  return (
    <div className="game">
      <div className="game-info">
        <div className="status">{status}</div>
        {(gameState === 'won' || gameState === 'draw') && (
          <button className="reset-button" onClick={resetGame}>Play Again</button>
        )}
      </div>
      <div className="big-board">
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

export default BigBoard;
