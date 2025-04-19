import React from 'react';
import Square from './Square';

// Using React.memo to avoid unnecessary re-renders
const SmallBoard = React.memo(({ board, onClick, isActive, winner }) => {
  // Avoid generating new function references on every render
  const handleClick = (i) => {
    if (isActive && !winner && !board[i]) {
      onClick(i);
    }
  };

  // If the board has a winner, just show the winner
  if (winner) {
    return (
      <div className={`small-board won-by-${winner}`}>
        <div className="winner">{winner}</div>
      </div>
    );
  }

  // Create an array of squares
  const squares = [];
  for (let i = 0; i < 9; i++) {
    squares.push(
      <Square
        key={i}
        value={board[i]}
        onClick={() => handleClick(i)}
        isActive={isActive && !board[i]}
      />
    );
  }

  // Render the board
  return (
    <div className={`small-board ${isActive ? 'active' : ''}`}>
      <div className="board-row">
        {squares[0]}
        {squares[1]}
        {squares[2]}
      </div>
      <div className="board-row">
        {squares[3]}
        {squares[4]}
        {squares[5]}
      </div>
      <div className="board-row">
        {squares[6]}
        {squares[7]}
        {squares[8]}
      </div>
    </div>
  );
});

export default SmallBoard;